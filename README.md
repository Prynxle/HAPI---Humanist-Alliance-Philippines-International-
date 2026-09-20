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

## Google Sheets sync

Registrations are also mirrored to a private Google Sheet as an org-facing copy. See [`docs/google-sheets-sync.md`](docs/google-sheets-sync.md) for the Apps Script setup (webhook secret, deployment, testing). Supabase remains the single source of truth; the Sheets sync is best-effort and fail-open — a Sheets failure never changes the registration result.
