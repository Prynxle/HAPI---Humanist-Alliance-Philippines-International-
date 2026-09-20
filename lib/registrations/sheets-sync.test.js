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
  assert.equal(SHEET_SYNC_TIMEOUT_MS, 5000);
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