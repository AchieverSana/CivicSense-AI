# Deployment Guide — CivicSense AI

⚠️ **Superseded.** Vibe2Ship requires the final link to be on Google Cloud,
which Vercel + Railway (below) doesn't satisfy. Use **[`/DEPLOY.md`](../DEPLOY.md)**
at the repo root instead — it deploys both services to Cloud Run using the
`Dockerfile`s in `frontend/` and `backend/`.

The MongoDB Atlas / Cloudinary / Firebase setup steps below are still
accurate and are referenced from `DEPLOY.md` — only the *hosting* targets
for the frontend/backend changed.

---

## Frontend → Vercel (free)

```bash
cd frontend
npx vercel --prod
```

Set these environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your Railway backend URL
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

---

## Backend → Railway (free tier)

1. Create new project on railway.app
2. Connect your GitHub repo
3. Set root directory to `backend/`
4. Add all env vars from `backend/.env.example`
5. Railway auto-detects Node.js and runs `npm start`

---

## Database → MongoDB Atlas (free M0)

1. Create cluster at mongodb.com/atlas
2. Add IP `0.0.0.0/0` to Network Access
3. Create DB user
4. Copy connection string → `MONGODB_URI`

---

## Storage → Cloudinary (free 25GB)

1. Sign up at cloudinary.com
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Create an upload preset (optional, for direct unsigned uploads)

---

## Firebase Auth

1. Create project at console.firebase.google.com
2. Enable Google Sign-in under Authentication
3. Download service account JSON → paste as `FIREBASE_SERVICE_ACCOUNT`
4. Copy web config → frontend env vars

---

## Quick deploy checklist

- [ ] MongoDB URI set
- [ ] Gemini API key set  
- [ ] Firebase configured (frontend + backend)
- [ ] Cloudinary credentials set
- [ ] CORS `CLIENT_URL` points to Vercel URL
- [ ] Backend URL set in frontend `.env`

---

## Estimated monthly cost (free tiers)

| Service | Free tier |
|---------|-----------|
| Vercel | Unlimited hobby |
| Railway | $5 credit/month |
| MongoDB Atlas M0 | 512MB free |
| Cloudinary | 25GB storage |
| Gemini API | 15 req/min free |
| Firebase Auth | 10K/month free |
