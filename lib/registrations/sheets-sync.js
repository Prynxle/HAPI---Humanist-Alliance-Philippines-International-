// Google Sheets webhook sync — best-effort mirror to the org-facing Sheet.
// Supabase remains the single source of truth. This module MUST be fail-open:
// a Sheets failure never rolls back, never deletes, never downgrades the
// registration response, and never retries (a retry could double-register).

export const SHEET_SYNC_TIMEOUT_MS = 5000;

// Mapping from the Supabase registration row (snake_case DB columns surfaced by
// the select list in app/api/register/route.js) to the whitelisted payload
// field names expected by the Apps Script webhook. Only keys listed here ever
// leave the server — env vars, secrets and unrelated columns are never copied.
const dbFieldToPayloadField = {
  registration_id: 'registrationReference',
  last_name: 'lastName',
  first_name: 'firstName',
  middle_name: 'middleName',
  gender: 'gender',
  email: 'email',
  contact_number: 'contactNumber',
  barangay: 'barangay',
  city: 'city',
  province: 'province',
  region: 'region',
  institutional_affiliation: 'institutionalAffiliation',
  degree_program: 'degreeProgram',
  other_affiliations: 'otherAffiliations',
  religious_stance: 'religiousStance',
  religious_stance_other: 'religiousStanceOther',
  attending_as: 'attendingAs',
  attendance_mode: 'attendanceMode',
  consent: 'consent',
};

export function getSheetsWebhookConfig(env = process.env) {
  return {
    url: env.GOOGLE_SHEETS_WEBHOOK_URL,
    secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET,
  };
}

export function buildSheetsPayload(registration, token) {
  const registrationOut = {
    registrationId: registration.id,
    registrationReference: registration.registration_id,
    registeredAt: new Date(registration.registered_at).toISOString(),
  };
  for (const [dbField, payloadField] of Object.entries(dbFieldToPayloadField)) {
    if (registration[dbField] !== undefined) {
      registrationOut[payloadField] = registration[dbField];
    }
  }
  return { token, registration: registrationOut };
}

export async function syncRegistrationToSheets({
  registration,
  webhookUrl,
  webhookSecret,
  timeoutMs = SHEET_SYNC_TIMEOUT_MS,
  fetchFn = globalThis.fetch,
  logger = console,
}) {
  const url = webhookUrl;
  const secret = webhookSecret;

  // Fail-open: without configuration the sync is skipped, never an error.
  if (!url || !secret) {
    logger.warn('Google Sheets sync skipped: GOOGLE_SHEETS_WEBHOOK_URL or GOOGLE_SHEETS_WEBHOOK_SECRET is not configured.');
    return { synced: false, skipped: true };
  }

  const payload = buildSheetsPayload(registration, secret);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      const { name, message } = error || {};
      if (name === 'AbortError') {
        logger.error('Google Sheets sync failed', { name, message, reason: 'timeout', registrationId: registration.id });
        return { synced: false, reason: 'timeout' };
      }
      logger.error('Google Sheets sync failed', { name, message, registrationId: registration.id });
      return { synced: false, reason: 'network' };
    }

    const text = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error('Google Sheets sync failed', { status: response.status, bodyOk: undefined, bodyStatus: undefined, registrationId: registration.id });
      return { synced: false, reason: 'malformed-response' };
    }

    // Apps Script always answers HTTP 200 with the real outcome in the body.
    if (response.ok === true && parsed?.ok === true) {
      return { synced: true };
    }

    logger.error('Google Sheets sync failed', { status: response.status, bodyOk: parsed?.ok, bodyStatus: parsed?.status, registrationId: registration.id });
    return { synced: false, reason: 'webhook-error' };
  } finally {
    clearTimeout(timer);
  }
}