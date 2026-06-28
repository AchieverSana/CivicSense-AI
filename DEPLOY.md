# Deploying CivicSense AI to Google Cloud Run

The hackathon rules require the **final link to be on Google Cloud** — the
old `docs/DEPLOYMENT.md` (Vercel + Railway) doesn't satisfy that and has
been replaced. This uses **Cloud Run** for both frontend and backend, built
from the `Dockerfile`s in each folder.

You don't need Docker installed locally — `gcloud builds submit` builds the
image *in the cloud* from your Dockerfile. If you do have Docker locally and
want to test first, see "Optional: test locally" at the bottom.

## 0. One-time setup (~5 min)

```bash
# Install gcloud if you don't have it: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Pick a region close to your judges/users. Mumbai is a safe default for India.
gcloud artifacts repositories create civicsense \
  --repository-format=docker \
  --location=asia-south1 \
  --description="CivicSense AI images"
```

## 1. Deploy the backend first (frontend needs its URL)

Create `backend/.env.yaml` (NOT committed — it's already covered by
`backend/.dockerignore`/`.gitignore` patterns, but double check before any
git add). YAML handles the multi-line Firebase service account JSON more
safely than passing it on the command line:

```yaml
MONGODB_URI: "mongodb+srv://your-atlas-connection-string"
GEMINI_API_KEY: "your-gemini-key"
CLOUDINARY_CLOUD_NAME: "your-cloud-name"
CLOUDINARY_API_KEY: "your-api-key"
CLOUDINARY_API_SECRET: "your-api-secret"
FIREBASE_SERVICE_ACCOUNT: '{"type":"service_account","project_id":"...", ...entire JSON on one line...}'
CLIENT_URL: "https://placeholder.example.com" # we'll fix this in step 3
```

Build + deploy:

```bash
cd backend
gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civicsense/backend

gcloud run deploy civicsense-backend \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civicsense/backend \
  --region asia-south1 \
  --allow-unauthenticated \
  --env-vars-file=.env.yaml

# Copy this URL — you'll need it for the frontend build
gcloud run services describe civicsense-backend --region asia-south1 --format='value(status.url)'
```

⚠️ **MongoDB Atlas:** Cloud Run has dynamic outbound IPs. In Atlas →
Network Access, allow `0.0.0.0/0` (same as your original deployment doc
already noted).

## 2. Deploy the frontend, pointing it at the backend URL

`NEXT_PUBLIC_*` vars are baked into the JS bundle at **build** time, so they
go in as `--build-arg` / substitutions, not runtime env vars:

```bash
cd ../frontend
gcloud builds submit \
  --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civicsense/frontend \
  --substitutions=_API_URL="https://civicsense-backend-XXXXX.a.run.app"
```

If `gcloud builds submit` build-arg substitution gives you trouble, the
simplest fallback is building locally and pushing:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://civicsense-backend-XXXXX.a.run.app" \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="..." \
  -t asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civicsense/frontend .

gcloud auth configure-docker asia-south1-docker.pkg.dev
docker push asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civicsense/frontend
```

Then deploy it:

```bash
gcloud run deploy civicsense-frontend \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civicsense/frontend \
  --region asia-south1 \
  --allow-unauthenticated

gcloud run services describe civicsense-frontend --region asia-south1 --format='value(status.url)'
```

**This frontend URL is what you submit on BlockseBlock.**

## 3. Close the loop (CORS + Firebase)

Two things will silently break if you skip this:

1. **CORS** — go back to `backend/.env.yaml`, set `CLIENT_URL` to the real
   frontend URL from step 2, then redeploy the backend:
   ```bash
   cd ../backend
   gcloud run deploy civicsense-backend \
     --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/civicsense/backend \
     --region asia-south1 --allow-unauthenticated --env-vars-file=.env.yaml
   ```
2. **Firebase Auth domain** — in Firebase Console → Authentication →
   Settings → Authorized domains, add your `*.a.run.app` frontend domain.
   Without this, Google Sign-In fails with `auth/unauthorized-domain` — easy
   to miss since everything else still loads fine.

## Optional: test locally with Docker first

If you have Docker Desktop installed, sanity-check both containers boot
before burning Cloud Run quota/time:

```bash
# Put your real NEXT_PUBLIC_* values in a root .env (see .env.example)
docker compose up --build
# frontend → http://localhost:3000, backend → http://localhost:5001
```
