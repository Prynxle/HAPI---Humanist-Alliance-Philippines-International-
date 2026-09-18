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

The API is a Next.js App Router route handler at `/api/register` and runs on the Node.js runtime because Excel generation requires filesystem access.

For production, move the registration store to a managed database or spreadsheet service with authentication and backups before collecting real member data.
