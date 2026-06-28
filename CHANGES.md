# Fixes applied before Vibe2Ship submission

## Critical
- **Real geolocation instead of hardcoded coordinates** — `report/page.tsx`
  was sending the same fixed lat/lng for every issue. Now uses
  `navigator.geolocation`, with a Jaipur-center fallback if denied/unsupported.
  Fixes the map, heatmap, and 100m duplicate-detection radius, all of which
  were silently broken (everything looked like it was at one point).
- **Guest vote/verify no longer crashes** — unauthenticated requests pushed
  the literal string `'guest'` into an ObjectId array, throwing a Mongoose
  CastError that the frontend silently swallowed. `/vote` and `/verify` now
  require real auth (`requireAuth`), and the buttons prompt sign-in instead
  of failing silently.
- **Deployment target switched to Google Cloud Run** — old plan was
  Vercel + Railway, which doesn't satisfy the "must deploy on Google Cloud"
  rule. See `DEPLOY.md`.

## High
- **Badges now actually update** — points were awarded via
  `findByIdAndUpdate({ $inc })`, which bypasses the `pre('save')` hook that
  recalculates badge tier. Added `User.awardPoints()` (goes through
  `.save()`) and switched all point-awarding call sites to use it.
- **Real-time updates wired up** — `socket.io-client` was installed but
  never used. The feed now connects, joins the city room, and shows a
  "new activity — tap to refresh" banner when the backend broadcasts
  `new-issue` / `issue-updated`.
- **"Most votes" sort now actually sorts by vote count** — Mongo sorts
  array fields by contents, not length, so `.sort('-votes')` was meaningless.
  Added a `voteCount` number field kept in sync with the `votes` array.

## Medium
- Text-only AI analysis (no photo) now has a fallback if Gemini returns
  malformed JSON, matching the robustness the image path already had.
- Duplicate-detection no longer trusts a possibly-hallucinated `duplicateId`
  from Gemini — validated against the actual nearby-issue candidate list.
- Un-voting now reverses the +10 points given to the reporter (previously
  toggling vote/unvote repeatedly could inflate points without limit).
- Dashboard's "Community heroes" stat is now a real count instead of a
  hardcoded `1420`.

## Low / polish
- README's documented port (5000) now matches the actual default (5001).
- `getIssues` pagination total: investigated combining the geo `$near`
  filter into the count query, found that `$near` isn't supported inside
  `countDocuments()`'s aggregation stage (would throw, not just be
  imprecise) — left as-is with a comment, since no frontend code currently
  calls this endpoint with lat/lng anyway.

## Verification
- `npx tsc --noEmit` clean on both `backend` and `frontend`.
- `npx next build` succeeds end-to-end (tested with placeholder Firebase
  env vars, since real ones aren't available in this environment).
- Docker build itself wasn't tested in this environment (no Docker daemon
  available) — test locally with `docker compose up --build` before
  deploying, per `DEPLOY.md`.
