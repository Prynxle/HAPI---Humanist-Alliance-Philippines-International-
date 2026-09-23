import { getSheetsWebhookConfig } from '../../../../lib/registrations/sheets-sync.js';

export const runtime = 'nodejs';

// Observability endpoint for the deployed environment. Exposes PRESENCE ONLY —
// never the URL or the secret value. Use it to confirm the deployed server
// actually has GOOGLE_SHEETS_WEBHOOK_URL and GOOGLE_SHEETS_WEBHOOK_SECRET set
// (a missing variable silently skips the Sheets mirror).
export async function GET() {
  const { url, secret } = getSheetsWebhookConfig();
  const configured = Boolean(url && secret);
  const missing = [];
  if (!url) missing.push('GOOGLE_SHEETS_WEBHOOK_URL');
  if (!secret) missing.push('GOOGLE_SHEETS_WEBHOOK_SECRET');
  return Response.json({ configured, missing }, { headers: { 'Cache-Control': 'no-store' } });
}