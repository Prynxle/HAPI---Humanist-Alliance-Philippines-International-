# HAPI Registration

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Not_specified-lightgrey)](#license)

A Next.js (App Router) registration experience for **HAPI** - Humanist Alliance Philippines, International. It powers registration for the **1st Secular Philosophical Paper Conference** under the theme *"Discarding God: Values in a Worldview Without Religion"*, held on **November 20, 2026** at **The Ministry Lounge Bar & Cafe, Makati City**.

Supabase/PostgreSQL is the authoritative registration store. A local Excel workbook is maintained as a secondary export, and registrations are mirrored best-effort to a private Google Sheet. The application is designed so that a failure in either secondary system never changes a registration result.

## Table of Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture and Data Flow](#architecture-and-data-flow)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [Usage and Routes](#usage-and-routes)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Build and Production](#build-and-production)
- [Deployment](#deployment)
- [Open Graph and Social Preview](#open-graph-and-social-preview)
- [Google Sheets Sync](#google-sheets-sync)
- [Security and Data Integrity](#security-and-data-integrity)
- [Registration Status Toggle](#registration-status-toggle)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact and Support](#contact-and-support)

## Screenshots

![Application screenshot 1](./readmeimage.png)

![Application screenshot 2](./readimg2.png)

> Note: the two images above are referenced by filename only. Their alt text, crop, and placement should be visually verified by the maintainer, as the image contents could not be inspected during this documentation pass.

## Features

- Conference landing page with hero, about section, thinkers carousel, and registration call-to-action.
- Registration flow with server-side validation and duplicate-email detection.
- Authoritative persistence in Supabase/PostgreSQL with `HAPI-YYYY-NNNN` reference numbers.
- Secondary Excel export (`data/hapi-registrations.xlsx`) regenerated after each successful registration.
- Best-effort, fail-open mirror to a private Google Sheet for org-facing visibility.
- Lecturers, abstract presenters, and organizer pages.
- Open Graph and Twitter Card metadata for social sharing.
- Registration toggle to open or close submissions without redeploying logic changes.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, PostCSS |
| Database | Supabase / PostgreSQL |
| Data export | `xlsx` |
| Utilities | `clsx`, `tailwind-merge` |
| Linting | ESLint 9 |
| Runtime | Node.js (API routes) |

## Architecture and Data Flow

1. A participant browses the Next.js App Router pages (`/`, `/register`, `/lecturers`, `/abstract-presenters`, `/organizer`).
2. `POST /api/register` (Node runtime) validates input using `lib/registrations/validation.js`.
3. Supabase/PostgreSQL is the source of truth: `create_registration(jsonb)` allocates a `HAPI-YYYY-NNNN` reference and inserts the row. A duplicate email returns Postgres error `23505`, surfaced as HTTP `409`.
4. On success, the API re-queries registrations and best-effort regenerates the local Excel workbook (`data/hapi-registrations.xlsx`) via `lib/registrations/excel.js`.
5. Best-effort, fail-open mirror to Google Sheets via `lib/registrations/sheets-sync.js`. The response carries `syncStatus` and the `X-Sync-Status` header.
6. Registration may be disabled by setting `REGISTRATION_CLOSED = true` in `lib/registrations/constants.js`, which returns HTTP `403`.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- A Supabase project with the migration applied
- (Optional) A Google Sheets webhook for the mirror sync

### Installation

```bash
npm install
```

### Run locally

```bash
npm run dev
```

The app runs at `http://localhost:3000`. The landing page is at `/` and the registration page is at `/register`.

### Production build

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values. Never commit `.env.local`.

| Variable | Required | Scope | Description |
|---|---|---|---|
| `NEXT_SUPABASE_URL` | Yes (for registration) | Server-only | Supabase project URL used by the API. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for registration) | Server-only | Service role key used to execute `create_registration`. Never expose to the client and never prefix with `NEXT_PUBLIC_`. |
| `GOOGLE_SHEETS_WEBHOOK_URL` | No | Server-only | Apps Script webhook URL for the Sheets mirror. Missing value silently skips sync. |
| `GOOGLE_SHEETS_WEBHOOK_SECRET` | No | Server-only | Shared secret for the Sheets webhook. |
| `NEXT_PUBLIC_SITE_URL` | Yes (production) | Public (build-time) | Production origin with no trailing slash, e.g. `https://conference.example`. Inlined at build time; production build fails without it. |

## Database and Migrations

Apply the SQL in `supabase/migrations/20260920130000_registrations_backend.sql` to your Supabase project before accepting registrations. It creates:

- `registration_counters` table
- `registrations` table
- `create_registration(jsonb)` function

Row Level Security is enabled. No grants are given to `anon` or `authenticated`; only `service_role` may execute `create_registration`. Database-level CHECK constraints complement server-side validation.

## Usage and Routes

| Route | Description |
|---|---|
| `/` | Conference landing page |
| `/register` | Registration page (currently closed by toggle) |
| `/lecturers` | Lecturers |
| `/abstract-presenters` | Abstract and presenters |
| `/organizer` | Organizer |

## API Reference

### `POST /api/register`

Node runtime (`runtime = 'nodejs'`, `maxDuration = 20`).

- Validates input server-side.
- Inserts via `create_registration(jsonb)`; duplicate email yields `409`.
- Regenerates the Excel export best-effort.
- Mirrors to Google Sheets best-effort; response includes `syncStatus` and `X-Sync-Status`.

Common responses:

| Status | Meaning |
|---|---|
| `200/201` | Registration created |
| `400` | Validation error |
| `403` | Registration closed (`REGISTRATION_CLOSED = true`) |
| `409` | Duplicate email |
| `500` | Server error |

### `GET /api/sheets-sync/status`

Returns presence-only configuration status for the Google Sheets sync (whether the webhook URL and secret are configured). Does not expose secret values.

## Project Structure

```
app/
  page.tsx                 # Landing page
  register/page.jsx        # Registration page
  lecturers/page.tsx       # Lecturers
  abstract-presenters/     # Abstract & presenters
  organizer/page.tsx       # Organizer
  api/register/route.js    # Registration API
  api/sheets-sync/status/  # Sheets sync status
components/                # Shared UI components
data/                     # Data modules and generated workbook (gitignored workbook)
lib/registrations/        # Validation, Excel export, Sheets sync, constants
supabase/migrations/      # Database migration SQL
docs/                     # Additional documentation
scripts/                  # Apps Script and tooling
public/                   # Static assets (og-image.png, etc.)
```

## Testing

```bash
npm run lint
npm test
```

- `npm run lint` runs ESLint.
- `npm test` runs the Node test runner (`node --experimental-test-module-mocks --test`), including route handler tests under `app/api/**/route.test.js`.

## Build and Production

```bash
npm run build
npm start
```

- `NEXT_PUBLIC_SITE_URL` must be set for production builds; otherwise the build throws a clear error.
- The registration API requires the Node.js runtime because Excel generation uses filesystem access.

## Deployment

Recommended: deploy to Vercel.

1. Provision all environment variables from `.env.example` in the Vercel project settings (server-only secrets must not be prefixed with `NEXT_PUBLIC_`).
2. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
3. Apply the Supabase migration to the production project.
4. Deploy. The API route runs on Node.js with `maxDuration = 20`.

## Open Graph and Social Preview

Social embeds (Facebook, X/Twitter, Discord) use the Open Graph and Twitter Card metadata declared in `app/layout.jsx`, with the card image at `public/og-image.png`.

- The preview image is 1536x1024 (3:2). The recommended size for social cards is 1200x630 (1.91:1); platforms may center-crop.
- Set `NEXT_PUBLIC_SITE_URL` before build so Open Graph URLs resolve absolutely.
- After deploying, validate with the Facebook Sharing Debugger ("Scrape Again"; results cache up to ~24h) and by pasting the URL into Discord (append a query string such as `?v=2` to bust cache).

## Google Sheets Sync

Registrations are mirrored to a private Google Sheet as an org-facing copy. See [`docs/google-sheets-sync.md`](docs/google-sheets-sync.md) for the Apps Script setup, webhook secret, deployment, and testing.

Supabase remains the single source of truth. The Sheets sync is best-effort and fail-open: a Sheets failure never changes the registration result.

## Security and Data Integrity

- Supabase tables have RLS enabled with no grants to `anon` or `authenticated`; only `service_role` executes `create_registration`. No client-side Supabase credentials are required for registration.
- Server-side validation is performed via `lib/registrations/validation.js`, complemented by database CHECK constraints.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SHEETS_WEBHOOK_SECRET`, `GOOGLE_SHEETS_WEBHOOK_URL`) are server-only. Never commit `.env.local`, never prefix server secrets with `NEXT_PUBLIC_`, and provision them in the deployed environment.
- Concurrency: Postgres is the source of truth; the Excel workbook and Google Sheet are derived/best-effort and are not transactional with registration.
- The app is a single-conference registration store; it does not imply multi-tenant isolation.

## Registration Status Toggle

Registration is currently closed via `REGISTRATION_CLOSED = true` in `lib/registrations/constants.js`, causing `POST /api/register` to return `403`. Set it to `false` to reopen submissions. This is a runtime code toggle; changing it requires a rebuild/redeploy.

## Troubleshooting

- **Build fails with `NEXT_PUBLIC_SITE_URL must be set`**: set `NEXT_PUBLIC_SITE_URL` in the build environment.
- **Registration returns 403**: `REGISTRATION_CLOSED` is `true`; set it to `false` and redeploy.
- **Registration returns 409**: the email is already registered.
- **Sheets not updating**: verify `GOOGLE_SHEETS_WEBHOOK_URL` and `GOOGLE_SHEETS_WEBHOOK_SECRET`; see `docs/google-sheets-sync.md` and `GET /api/sheets-sync/status`.
- **Excel workbook missing**: it is regenerated best-effort after successful registrations; check server logs and filesystem permissions.

## Roadmap

The following are suggestions, not commitments:

- Reopen registration toggle via environment variable instead of a code constant.
- Add an admin view for registrations.
- Automate Excel regeneration and Sheets sync retries.
- Add end-to-end tests for the registration flow.

## Contributing

1. Fork the repository and create a feature branch.
2. Make changes scoped to the relevant area; keep documentation accurate.
3. Run `npm run lint` and `npm test` before submitting.
4. Open a pull request describing the change and its verification.

Please do not commit secrets, `.env.local`, or generated workbooks.

## License

No `LICENSE` file is present in this repository. The license is not specified. If you intend to reuse or distribute this project, please contact the maintainers or add an appropriate license.

## Acknowledgements

- Humanist Alliance Philippines, International (HAPI) and the conference organizing team.
- Humanists International and the broader secular humanist community.
- Open-source projects: Next.js, React, Tailwind CSS, Supabase, and others listed in `package.json`.

## Contact and Support

No maintainer contact details are stored in this repository. For questions, issues, or contributions, please open an issue or discussion in the project's GitHub repository, and refer to HAPI's public channels for organization-level inquiries.
