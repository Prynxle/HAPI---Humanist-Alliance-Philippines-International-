import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHEET_SYNC_TIMEOUT_MS,
  getSheetsWebhookConfig,
  buildSheetsPayload,
  syncRegistrationToSheets,
} from './sheets-sync.js';

const FAKE_SECRET = 'test-secret-do-not-use';
const FAKE_URL = 'http://sheets.invalid/webhook';
const FAKE_ID = '11111111-1111-4111-8111-111111111111';

function makeLogger() {
  const calls = [];
  return {
    calls,
    logger: {
      warn: (...args) => calls.push({ level: 'warn', args }),
      error: (...args) => calls.push({ level: 'error', args }),
    },
  };
}

function makeRegistration(overrides = {}) {
  return {
    id: FAKE_ID,
    registration_id: 'HAPI-2026-0001',
    registered_at: '2026-09-21T08:30:00.123456+00:00',
    last_name: 'Doe',
    first_name: 'Jane',
    middle_name: null,
    gender: 'Female',
    email: 'jane@example.com',
    contact_number: '+63 912 345 6789',
    barangay: 'Barangay Uno',
    city: 'Cityville',
    province: 'Cavite',
    region: 'Region IV-A',
    institutional_affiliation: 'HAPI',
    degree_program: null,
    other_affiliations: null,
    religious_stance: 'Humanist',
    religious_stance_other: null,
    attending_as: 'Participant',
    attendance_mode: 'Hybrid',
    consent: true,
    ...overrides,
  };
}

const webhookResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const redirectResponse = (status, location) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => (name.toLowerCase() === 'location' ? location : null) },
  text: async () => '',
});

// Records each transport call so tests can prove the 302 continuation is a
// transport completion of the SAME logical attempt — not a webhook retry.
function trackTransport(handler) {
  const calls = [];
  const fetchFn = async (requestUrl, init) => {
    calls.push({ url: String(requestUrl), init });
    return handler(calls.length, requestUrl, init);
  };
  return { calls, fetchFn };
}

const EXPECTED_PAYLOAD_KEYS = [
  'attendanceMode',
  'attendingAs',
  'barangay',
  'city',
  'consent',
  'contactNumber',
  'degreeProgram',
  'email',
  'firstName',
  'gender',
  'institutionalAffiliation',
  'lastName',
  'middleName',
  'otherAffiliations',
  'province',
  'registeredAt',
  'registrationId',
  'registrationReference',
  'region',
  'religiousStance',
  'religiousStanceOther',
].sort();

function assertLogsSafe(calls) {
  const serialized = calls.map((c) => `${c.level} ${JSON.stringify(c.args)}`).join('\n');
  assert.ok(serialized.length > 0, 'expected error/warn logs');
  assert.ok(serialized.includes(FAKE_ID), 'logs must include registrationId for tracing');
  assert.equal(serialized.includes(FAKE_SECRET), false, 'logs must never contain the secret');
  assert.equal(serialized.includes('jane@example.com'), false, 'logs must never contain PII');
  assert.ok(!serialized.includes(FAKE_URL), 'logs must never contain the webhook URL');
}

test('SHEET_SYNC_TIMEOUT_MS is exported', () => {
  assert.equal(SHEET_SYNC_TIMEOUT_MS, 10000);
});

test('getSheetsWebhookConfig maps environment variables', () => {
  const config = getSheetsWebhookConfig({
    GOOGLE_SHEETS_WEBHOOK_URL: FAKE_URL,
    GOOGLE_SHEETS_WEBHOOK_SECRET: FAKE_SECRET,
  });
  assert.equal(config.url, FAKE_URL);
  assert.equal(config.secret, FAKE_SECRET);
});

test('buildSheetsPayload normalizes fields into a whitelisted payload', () => {
  const registration = makeRegistration({
    // Fields that must NEVER leak through to the webhook payload:
    service_role_key: 'should-not-leak',
    admin_flag: true,
  });
  const payload = buildSheetsPayload(registration, FAKE_SECRET);

  assert.equal(payload.token, FAKE_SECRET);
  assert.equal(payload.registration.registrationId, FAKE_ID);
  assert.equal(payload.registration.registrationReference, 'HAPI-2026-0001');
  assert.equal(payload.registration.registeredAt, new Date(registration.registered_at).toISOString());
  assert.equal(payload.registration.lastName, 'Doe');
  assert.equal(payload.registration.firstName, 'Jane');
  assert.equal(payload.registration.email, 'jane@example.com');
  assert.equal(payload.registration.consent, true);

  assert.deepEqual(Object.keys(payload.registration).sort(), EXPECTED_PAYLOAD_KEYS);
});

test('buildSheetsPayload writes UTC ISO timestamps', () => {
  const payload = buildSheetsPayload(makeRegistration(), FAKE_SECRET);
  const parsed = new Date(payload.registration.registeredAt);
  assert.equal(Number.isNaN(parsed.getTime()), false);
  assert.equal(parsed.toISOString(), payload.registration.registeredAt);
});

test('syncRegistrationToSheets succeeds when the webhook returns ok', async () => {
  const { logger, calls } = makeLogger();
  let requestUrl = null;
  let requestBody = null;
  const fetchFn = async (url, init) => {
    requestUrl = url;
    requestBody = JSON.parse(init.body);
    return webhookResponse(201, { ok: true, status: 201 });
  };

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: true });
  assert.equal(requestUrl, FAKE_URL);
  assert.equal(requestBody.token, FAKE_SECRET);
  assert.equal(requestBody.registration.registrationId, FAKE_ID);
  assert.equal(calls.length, 0, 'no warn/error expected on success');
});

test('syncRegistrationToSheets fails open when config is missing and never calls fetch', async () => {
  const cases = [
    { webhookUrl: undefined, webhookSecret: FAKE_SECRET },
    { webhookUrl: FAKE_URL, webhookSecret: undefined },
    { webhookUrl: undefined, webhookSecret: undefined },
  ];
  for (const missingConfig of cases) {
    const { logger, calls } = makeLogger();
    let fetchCount = 0;
    const fetchFn = async () => {
      fetchCount += 1;
      throw new Error('fetch must not be called');
    };

    const result = await syncRegistrationToSheets({
      registration: makeRegistration(),
      fetchFn,
      logger,
      ...missingConfig,
    });

    assert.deepEqual(result, { synced: false, skipped: true });
    assert.equal(fetchCount, 0);

    const warn = calls.find((c) => c.level === 'warn');
    assert.ok(warn, 'expected a warn log for missing config');
    const message = String(warn.args[0]);
    assert.ok(message.includes('GOOGLE_SHEETS_WEBHOOK_URL'), 'warn must name the URL variable');
    assert.ok(message.includes('GOOGLE_SHEETS_WEBHOOK_SECRET'), 'warn must name the secret variable');
    assert.equal(message.includes(FAKE_SECRET), false, 'warn must not contain values');
    assert.equal(message.includes(FAKE_URL), false, 'warn must not contain URL values');
  }
});

test('syncRegistrationToSheets reports webhook errors once (no retry)', async () => {
  const { logger, calls } = makeLogger();
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount += 1;
    return webhookResponse(500, { ok: false, status: 500 });
  };

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'webhook-error' });
  assert.equal(fetchCount, 1, 'no automatic retry');
  assertLogsSafe(calls);
});

test('syncRegistrationToSheets handles malformed response bodies', async () => {
  const { logger, calls } = makeLogger();
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount += 1;
    return { ok: true, status: 200, text: async () => 'this is not json' };
  };

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'malformed-response' });
  assert.equal(fetchCount, 1);
  assertLogsSafe(calls);
});

test('syncRegistrationToSheets reports network failures once (no retry)', async () => {
  const { logger, calls } = makeLogger();
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount += 1;
    throw new Error('ECONNREFUSED');
  };

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'network' });
  assert.equal(fetchCount, 1);
  assertLogsSafe(calls);
});

test('syncRegistrationToSheets reports timeouts', async () => {
  const { logger, calls } = makeLogger();
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount += 1;
    throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
  };

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'timeout' });
  assert.equal(fetchCount, 1);
  assertLogsSafe(calls);
});

// ---------------------------------------------------------------------------
// 302 redirect handling. Apps Script web-app deployments answer direct hits
// with a 302 to script.googleusercontent.com. The follow-up GET below is a
// transport completion of the SAME logical sync attempt, NOT a webhook retry:
// the initial POST still happens at most once, and the shared secret is never
// forwarded to the redirect target.
// ---------------------------------------------------------------------------

test('syncRegistrationToSheets follows one 302 with a token-less GET and succeeds', async () => {
  const { logger, calls } = makeLogger();
  const { calls: transportCalls, fetchFn } = trackTransport(async (callIndex) => {
    if (callIndex === 1) {
      return redirectResponse(302, 'https://script.googleusercontent.com/macros/s/abc/exec?redirect=1');
    }
    return webhookResponse(200, { ok: true, status: 200 });
  });

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: true });
  assert.equal(transportCalls.length, 2, '302 + follow-up GET = exactly 2 transport calls');
  const [first, second] = transportCalls;
  assert.equal(first.init.method, 'POST');
  assert.equal(JSON.parse(first.init.body).token, FAKE_SECRET, 'token present only on the first POST');
  assert.equal(second.url, 'https://script.googleusercontent.com/macros/s/abc/exec?redirect=1');
  assert.equal(second.init.method, 'GET', 'follow-up must be a GET');
  assert.equal(second.init.body, undefined, 'follow-up must be body-less');
  assert.equal(second.init.headers['Content-Type'], undefined, 'follow-up must not send a JSON content-type');
  assert.equal(second.init.headers.Accept, 'application/json');
  assert.equal(JSON.stringify(second.init).includes(FAKE_SECRET), false, 'token must never be forwarded on the redirect hop');
  assert.equal(calls.length, 0, 'no warn/error expected on success');
});

test('syncRegistrationToSheets stops a second 3xx on the redirect hop (no loop, no re-POST)', async () => {
  const { logger, calls } = makeLogger();
  const { calls: transportCalls, fetchFn } = trackTransport(async (callIndex) => {
    if (callIndex === 1) return redirectResponse(302, 'https://script.googleusercontent.com/one');
    return redirectResponse(307, 'https://script.googleusercontent.com/two');
  });

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'webhook-error' });
  assert.equal(transportCalls.length, 2, 'exactly 2 calls — never a redirect loop');
  assert.equal(transportCalls[0].init.method, 'POST');
  assert.equal(transportCalls[1].init.method, 'GET', 'a second redirect never re-POSTs');
  assert.equal(JSON.stringify(transportCalls[1].init).includes(FAKE_SECRET), false);
  assertLogsSafe(calls);
});

test('syncRegistrationToSheets reports malformed-response when the 302 follow-up is HTML and logs stay safe', async () => {
  const { logger, calls } = makeLogger();
  const { calls: transportCalls, fetchFn } = trackTransport(async (callIndex) => {
    if (callIndex === 1) return redirectResponse(302, 'https://accounts.google.com/v3/signin/identifier');
    return { ok: true, status: 200, headers: {}, text: async () => '<!DOCTYPE html><title>Sign in</title>' };
  });

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'malformed-response' });
  assert.equal(transportCalls.length, 2);
  assertLogsSafe(calls);
});

test('syncRegistrationToSheets reports webhook-error for 3xx without a location header (exactly 1 call)', async () => {
  const { logger, calls } = makeLogger();
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount += 1;
    return { ok: false, status: 302, headers: {}, text: async () => '' };
  };

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'webhook-error' });
  assert.equal(fetchCount, 1);
  assertLogsSafe(calls);
});

test('syncRegistrationToSheets reports timeout when the redirect hop aborts (shared AbortController)', async () => {
  const { logger, calls } = makeLogger();
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount += 1;
    if (fetchCount === 1) return redirectResponse(302, 'https://script.googleusercontent.com/slow');
    throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
  };

  const result = await syncRegistrationToSheets({
    registration: makeRegistration(),
    webhookUrl: FAKE_URL,
    webhookSecret: FAKE_SECRET,
    fetchFn,
    logger,
  });

  assert.deepEqual(result, { synced: false, reason: 'timeout' });
  assert.equal(fetchCount, 2);
  assertLogsSafe(calls);
});