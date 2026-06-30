# CivicSense AI 🏙️
### Community Hero — Hyperlocal Problem Solver
> Vibe2Ship Hackathon | Coding Ninjas × Google for Developers

CivicSense AI turns a citizen's photo of a civic problem (pothole, garbage pile, water leak, broken streetlight...) into a verified, prioritized complaint — automatically classified by AI, pinned on a live map, and pushed toward resolution through community upvotes and verification.

---

## 1. What it does (Demo Flow)

1. **Snap & Report** — A user uploads a photo and types a location. Google Gemini Vision looks at the image and instantly returns: category, severity (Critical/High/Medium/Low), a generated title + description, the responsible department, a priority score, and an estimated fix time.
2. **Duplicate Check** — Before creating a new issue, the backend checks nearby reports (distance + AI similarity) so the same pothole doesn't get reported 50 times — it nudges the user to upvote the existing one instead.
3. **Community Feed** — Everyone sees open and resolved issues in a live, filterable feed (category, severity, status, sort by newest/priority/votes), updated in real time over Socket.io whenever someone reports, votes, or verifies.
4. **Map View** — All issues plotted on a Leaflet/OpenStreetMap map, so patterns (e.g. an entire street with no streetlights) become visible at a glance.
5. **Verify & Vote** — Other citizens upvote and "verify" an issue, which raises its priority score — crowd-sourced confirmation that the problem is real and urgent.
6. **Gamification** — Reporting and verifying earns points; users climb from Bronze → Silver → Gold Hero badges and appear on the public leaderboard.
7. **Ask AI** — A chatbot answers natural-language questions about the city's issues (e.g. "what are the worst potholes near MI Road?").
8. **Authority Report** — One click generates a shareable PDF-style report of an issue, ready to send to the relevant civic department.
9. **Admin Tools** — Verified admins (see below) can mark issues as resolved and view aggregate stats/heatmaps on the dashboard.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas + Mongoose |
| AI | Google Gemini 2.5 Flash (Vision + Text) |
| Auth | Firebase Authentication (Google Sign-In) |
| Storage | Cloudinary (image hosting) |
| Maps | Leaflet.js + OpenStreetMap (no paid Mapbox key required) |
| Realtime | Socket.io |

---

## 3. Project Structure

```
civicsense/
├── frontend/                # Next.js 14 app
│   ├── app/                 # Pages (App Router)
│   │   ├── page.tsx              → Community feed (home)
│   │   ├── report/page.tsx       → Report a new issue (AI classification)
│   │   ├── map/page.tsx          → Map view of all issues
│   │   ├── dashboard/page.tsx    → Stats & heatmap (admin-friendly)
│   │   ├── leaderboard/page.tsx  → Civic Hero leaderboard
│   │   ├── chat/page.tsx         → AI chatbot
│   │   ├── admin-invite/page.tsx → Become an admin (see Section 5)
│   │   └── issues/[id]/page.tsx  → Single issue detail page
│   ├── components/          # Navbar, IssueCard, MapView, etc.
│   └── lib/                 # API client, Firebase, AuthContext, sockets
├── backend/                  # Express API
│   └── src/
│       ├── controllers/      # Issue + report logic
│       ├── models/           # Mongoose schemas (User, Issue)
│       ├── routes/           # auth, issues, dashboard, users, ai
│       ├── services/         # Gemini AI service, Cloudinary service
│       └── middleware/       # Firebase auth, role checks
└── docs/                      # Extra deployment docs
```

---

## 4. Quick Start (Local Setup)

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (free tier is fine)
- A Google Gemini API key ([ai.google.dev](https://ai.google.dev))
- A Firebase project with Google Sign-In enabled
- A Cloudinary account (free tier is fine)

### Step 1 — Clone & install
```bash
git clone https://github.com/yourteam/civicsense-ai
cd civicsense-ai
npm run setup     # installs both frontend and backend dependencies
```

### Step 2 — Configure environment variables
```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```
Then fill in the values (see table below).

### Step 3 — Run it
```bash
npm run dev
# Frontend → http://localhost:3000
# Backend  → http://localhost:5001
```

---

## 5. Environment Variables

### `frontend/.env.local`
| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the backend (`http://localhost:5001` locally) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional — leave blank to use free OpenStreetMap tiles |

### `backend/.env`
| Variable | What it's for |
|---|---|
| `PORT` | Backend port (default `5001`) |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key (powers image classification + chatbot) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials for storing uploaded photos |
| `FIREBASE_SERVICE_ACCOUNT` | The full Firebase service-account JSON, as one string |
| `JWT_SECRET` | Any random string — used to sign internal tokens |
| `CLIENT_URL` | Frontend URL, for CORS (`http://localhost:3000` locally) |
| `ADMIN_INVITE_CODE` | Secret password that unlocks admin access — see Section 6 |

---

## 6. Becoming an Admin (Important for Judging Demo)

Admins can resolve issues and see the full stats dashboard. Instead of manually editing roles in MongoDB Atlas, the app has a self-serve **Admin Invite** page that's perfect for a hackathon demo:

1. Sign in normally with Google (top-right "Sign in" button).
2. Go to **`/admin-invite`** in the browser.
3. Enter the secret invite code and submit.
4. Your account is instantly promoted to `admin`, and you're redirected to the home feed with admin powers unlocked.

**How it works under the hood:** the `/admin-invite` page sends the code you type to `POST /api/users/promote-admin`. The backend compares it against the `ADMIN_INVITE_CODE` environment variable on the server — if it matches, your user document's `role` field is set to `admin`. This logic is correct and safe to use as-is: the code is never exposed in frontend code, only the backend env var, and the endpoint requires you to already be signed in (no anonymous/guest promotion).

**The secret invite code** (set in `backend/.env`, value `ADMIN_INVITE_CODE`):

```
civic-admin-2026
```

> ⚠️ This is a demo-friendly default checked into `backend/.env.example` so the feature works out of the box for judges/teammates. For anything beyond a hackathon demo, change this to a unique, private value in your real `backend/.env` (which is git-ignored and never committed) and don't share it publicly.

---

## 7. API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                  Get currently signed-in user

POST   /api/issues                   Create issue (multipart/form-data, photo + AI classification)
GET    /api/issues                   List issues (filter, paginate, sort)
GET    /api/issues/:id               Issue detail
POST   /api/issues/:id/vote          Upvote / downvote        (sign-in required)
POST   /api/issues/:id/verify        Community verify         (sign-in required)
POST   /api/issues/:id/resolve       Mark resolved             (admin only)
GET    /api/issues/:id/report        Generate authority report
GET    /api/issues/heatmap           Heatmap data points

GET    /api/dashboard/stats          Admin stats
GET    /api/dashboard/heatmap        Heatmap aggregates

GET    /api/users/leaderboard        Top contributors
GET    /api/users/me                 Current user profile
GET    /api/users/:id/profile        Public user profile
POST   /api/users/promote-admin      Redeem admin invite code (see Section 6)

POST   /api/ai/chat                  AI chatbot — ask questions about city issues
```

---

## 8. Scoring Rubric Coverage

| Criterion | How CivicSense AI covers it |
|---|---|
| **AI Integration** | Gemini Vision classifies every photo (category, severity, department), powers duplicate-similarity checks, and drives the natural-language chatbot |
| **Data & Analytics** | MongoDB aggregations power the dashboard stats, heatmaps, and priority scoring |
| **Community** | Upvotes, verification, comments, and a public leaderboard make resolution a crowd-sourced effort |
| **UX** | Mobile-first Next.js UI, instant AI feedback on upload, real-time feed updates via Socket.io |
| **Impact** | Closes the loop between a citizen noticing a problem and an authority acting on a verified, prioritized report |

---

## 9. Deployment

Both `frontend/` and `backend/` ship as Docker containers (see their respective `Dockerfile`s) and are designed to deploy on **Google Cloud Run**. Full step-by-step instructions are in [`DEPLOY.md`](./DEPLOY.md).

---

## 10. Team

Built at Vibe2Ship Hackathon 2026.
