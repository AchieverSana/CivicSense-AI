# CivicSense AI 🏙️
### Community Hero — Hyperlocal Problem Solver
> Vibe2Ship Hackathon | Coding Ninjas × Google for Developers

AI-powered civic engagement platform that turns citizen photos into verified, prioritized infrastructure complaints — resolved faster through community power.

---

## Quick Start (7 minutes to running)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Google Gemini API key
- Firebase project
- Cloudinary account

### 1. Clone & install
```bash
git clone https://github.com/yourteam/civicsense-ai
cd civicsense-ai

# Install both frontend and backend
npm run setup
```

### 2. Configure environment
```bash
# Copy env templates
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Fill in your keys (see Environment Variables below)
```

### 3. Run
```bash
npm run dev
# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_MAPBOX_TOKEN=        # or leave blank for OpenStreetMap
```

### Backend (`backend/.env`)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_SERVICE_ACCOUNT=        # JSON string of Firebase service account
JWT_SECRET=your-secret-here
CLIENT_URL=http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas + Mongoose |
| AI | Google Gemini 2.5 Flash (Vision + Text) |
| Auth | Firebase Authentication |
| Storage | Cloudinary |
| Maps | Leaflet.js + OpenStreetMap |
| Realtime | Socket.io |

---

## Project Structure

```
civicsense/
├── frontend/           # Next.js 14 app
│   ├── app/            # App Router pages
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities & API client
├── backend/            # Express API
│   └── src/
│       ├── controllers/  # Route handlers
│       ├── models/       # Mongoose schemas
│       ├── routes/       # API routes
│       ├── services/     # Gemini AI, Cloudinary
│       └── middleware/   # Auth, validation
└── docs/               # API docs
```

---

## Key Features for Demo

1. **Upload photo** → Gemini Vision classifies issue, assigns severity & department
2. **View on map** → Leaflet map with clustered issue pins & heatmap overlay
3. **Community verification** → Upvote + confirm to raise priority score
4. **Duplicate detection** → Haversine distance + AI similarity check
5. **AI Chatbot** → Natural language queries about your city's issues
6. **Gamification** → Bronze / Silver / Gold Hero badges + leaderboard
7. **PDF report** → One-click authority report generation

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/issues              # Create issue (multipart/form-data)
GET    /api/issues              # List issues (filter, paginate, sort)
GET    /api/issues/:id          # Issue detail
POST   /api/issues/:id/vote     # Upvote / downvote
POST   /api/issues/:id/verify   # Community verify
POST   /api/issues/:id/comment  # Add comment
GET    /api/dashboard/stats     # Admin stats
GET    /api/dashboard/heatmap   # Heatmap data
GET    /api/users/leaderboard   # Top contributors
POST   /api/ai/chat             # AI chatbot
GET    /api/issues/:id/report   # Generate PDF report
```

---

## Scoring Rubric Coverage

| Criterion | Implementation |
|-----------|---------------|
| AI Integration | Gemini Vision for classification, severity, department routing |
| Data & Analytics | MongoDB aggregations, heatmaps, trend charts |
| Community | Verification system, upvotes, gamification |
| UX | Mobile-first Next.js, real-time updates via Socket.io |
| Impact | Closes loop between citizen and authority |

---

## Team
Built at Vibe2Ship Hackathon 2026
