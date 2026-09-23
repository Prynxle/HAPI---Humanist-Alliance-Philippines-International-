# HAPI Registration

A React + Node registration experience for HAPI — Humanist Alliance Philippines, International.

## Run locally

```bash
npm install
npm run dev
```

The Next.js app runs on `http://localhost:3000`. The landing page is at `/` and the registration page is at `/register`. Registrations are written to the local `data/` directory as JSON and Excel workbooks.

## Production build

```bash
npm run build
npm start
```

The API is a Next.js App Router route handler at `/api/register` and runs on the Node.js runtime because Excel generation requires filesystem access. Supabase/PostgreSQL is the authoritative registration store; the workbook in `data/hapi-registrations.xlsx` is a secondary export.

Apply the SQL in `supabase/migrations/20260920130000_registrations_backend.sql` to the Supabase project and configure `NEXT_SUPABASE_URL` plus the server-only `SUPABASE_SERVICE_ROLE_KEY` in the local environment before submitting registrations.

## Social preview / Open Graph

Social embeds (Facebook, X/Twitter, Discord) use the Open Graph and Twitter Card metadata declared in `app/layout.jsx` with the card image at `public/og-image.png`.

- Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://conference.example`) before `next build`/deploy. The value is baked in at build time so Open Graph URLs resolve absolutely; a production build without it fails with a clear error. For local development the app falls back to `http://localhost:3000` (see `.env.local`).
- The preview image is 1536×1024 (3:2). The recommended size for social cards is 1200×630 (1.91:1); Facebook/Discord/X will center-crop the preview in some placements.
- After deploying, validate: scrape the homepage with the Facebook Sharing Debugger using "Scrape Again" (results are cached up to ~24h), and paste the URL into Discord to check the embed preview (Discord also caches — append a query string such as `?v=2` to bust the cache).

## Google Sheets sync

Registrations are also mirrored to a private Google Sheet as an org-facing copy. See [`docs/google-sheets-sync.md`](docs/google-sheets-sync.md) for the Apps Script setup (webhook secret, deployment, testing). Supabase remains the single source of truth; the Sheets sync is best-effort and fail-open — a Sheets failure never changes the registration result.
