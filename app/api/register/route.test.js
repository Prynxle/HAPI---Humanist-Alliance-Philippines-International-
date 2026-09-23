import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// Fakes only — never real credentials.
const FAKE_SECRET = 'test-secret-do-not-use';
const FAKE_URL = 'http://sheets.invalid/webhook';
const FAKE_ID = '11111111-1111-4111-8111-111111111111';

// ---------------------------------------------------------------------------
// Module mocks. MUST be registered before the route module is imported.
// mock.module resolves relative specifiers against this test file, which lands
// on the same module URLs that app/api/register/route.js imports.
// ---------------------------------------------------------------------------
let currentClient = null;

mock.module('../../../lib/supabase/server.js', {
  exports: {
    createServerSupabaseClient: () => currentClient,
  },
});

const queueExcelExportMock = mock.fn(async () => {});
mock.module('../../../lib/registrations/excel.js', {
  exports: {
    queueExcelExport: queueExcelExportMock,
  },
});

const { POST } = await import('./route.js');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const fullRow = {
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
  religious_stance: 'Atheist',
  religious_stance_other: null,
  attending_as: 'Participant/Audience',
  attendance_mode: 'Online',
  consent: true,
};

const validPayload = {
  lastName: 'Doe',
  firstName: 'Jane',
  middleName: '',
  gender: 'Female',
  email: 'Jane@Example.com',
  contactNumber: '+63 912 345 6789',
  barangay: 'Barangay Uno',
  city: 'Cityville',
  province: 'Cavite',
  region: 'Region IV-A',
  institutionalAffiliation: 'HAPI',
  degreeProgram: '',
  otherAffiliations: '',
  religiousStance: 'Atheist',
  religiousStanceOther: '',
  attendingAs: 'Participant/Audience',
  attendanceMode: 'Online',
  consent: true,
};

const webhookResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

// Supabase client behaviour per test.
let rpcResult = null;
let row = null;
let rowError = null;
let exportRows = [];
let eqCalls = [];

function makeClient() {
  return {
    rpc: async () => rpcResult,
    from: () => ({
      select: () => ({
        order: async () => ({ data: exportRows, error: null }),
        eq: (column, value) => {
          eqCalls.push([column, value]);
          return {
            maybeSingle: async () => ({ data: row, error: rowError }),
          };
        },
      }),
    }),
  };
}

function makeRequest(body = {}) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function captureConsoleError() {
  const logs = [];
  const original = console.error;
  console.error = (...args) => {
    logs.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };
  return { logs, restore: () => { console.error = original; } };
}

let webhookCalls = 0;
let lastWebhookInit = null;

function installWebhookStub(handler) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    webhookCalls += 1;
    lastWebhookInit = init;
    return handler(url, init);
  };
  return () => {
    if (original) globalThis.fetch = original;
    else delete globalThis.fetch;
  };
}

function setupEnv() {
  process.env.GOOGLE_SHEETS_WEBHOOK_URL = FAKE_URL;
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET = FAKE_SECRET;
}

function teardownEnv() {
  delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  delete process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
}

function resetState() {
  currentClient = makeClient();
  rpcResult = { data: null, error: null };
  row = null;
  rowError = null;
  exportRows = [];
  eqCalls = [];
  webhookCalls = 0;
  lastWebhookInit = null;
  queueExcelExportMock.mock.resetCalls();
  teardownEnv();
}

test.beforeEach(() => {
  resetState();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('Test 1: normal registration returns 201 and syncs Sheets exactly once', async () => {
  setupEnv();
  rpcResult = { data: [{ registration_id: 'HAPI-2026-0001' }], error: null };
  row = fullRow;
  exportRows = [fullRow];
  const restoreFetch = installWebhookStub(async () => webhookResponse(201, { ok: true, status: 201 }));

  try {
    const response = await POST(makeRequest(validPayload));

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.registrationId, 'HAPI-2026-0001');
    assert.equal(body.syncWarning, undefined);
    assert.equal(body.syncStatus, 'ok');
    assert.equal(response.headers.get('X-Sync-Status'), 'ok');

    assert.equal(webhookCalls, 1, 'webhook must be called exactly once');
    const sent = JSON.parse(lastWebhookInit.body);
    assert.equal(sent.token, FAKE_SECRET);
    assert.equal(sent.registration.registrationId, FAKE_ID);
    assert.equal(sent.registration.registrationReference, 'HAPI-2026-0001');

    assert.equal(queueExcelExportMock.mock.calls.length, 1, 'Excel export must still run');
  } finally {
    restoreFetch();
  }
});

test('Test 2: Sheets down still returns 201 with syncWarning and no retry', async () => {
  setupEnv();
  rpcResult = { data: [{ registration_id: 'HAPI-2026-0001' }], error: null };
  row = fullRow;
  const errorLogs = [];
  const originalError = console.error;
  console.error = (...args) => errorLogs.push(args.map(String).join(' '));
  const restoreFetch = installWebhookStub(async () => {
    throw new Error('network down');
  });

  try {
    const response = await POST(makeRequest(validPayload));

    assert.equal(response.status, 201, 'registration must still succeed');
    const body = await response.json();
    assert.equal(body.registrationId, 'HAPI-2026-0001');
    assert.equal(body.syncWarning, true, 'must surface the fail-open warning');
    assert.equal(body.syncStatus, 'warning');
    assert.equal(response.headers.get('X-Sync-Status'), 'warning');

    assert.equal(webhookCalls, 1, 'exactly one attempt — no automatic retry');
    const serializedLogs = errorLogs.join('\n');
    assert.equal(serializedLogs.includes(FAKE_SECRET), false, 'logs must never contain the secret');
  } finally {
    console.error = originalError;
    restoreFetch();
  }
});

test('duplicate email returns 409 and never calls the webhook', async () => {
  setupEnv();
  rpcResult = {
    data: null,
    error: { code: '23505', message: 'duplicate key value violates unique constraint "registrations_email_lower_idx"' },
  };
  const restoreFetch = installWebhookStub(async () => {
    throw new Error('webhook must not be called');
  });

  try {
    const response = await POST(makeRequest(validPayload));
    assert.equal(response.status, 409);
    assert.equal(webhookCalls, 0);
    assert.equal(queueExcelExportMock.mock.calls.length, 0);
  } finally {
    restoreFetch();
  }
});

test('Supabase RPC error returns 500 and never calls the webhook', async () => {
  setupEnv();
  rpcResult = { data: null, error: { code: 'P0001', message: 'rpc boom', details: 'd', hint: 'h' } };
  const restoreFetch = installWebhookStub(async () => {
    throw new Error('webhook must not be called');
  });

  try {
    const response = await POST(makeRequest(validPayload));
    assert.equal(response.status, 500);
    assert.equal(webhookCalls, 0);
  } finally {
    restoreFetch();
  }
});

test('malformed webhook JSON returns 201 with syncWarning', async () => {
  setupEnv();
  rpcResult = { data: [{ registration_id: 'HAPI-2026-0001' }], error: null };
  row = fullRow;
  const restoreFetch = installWebhookStub(async () => ({ ok: true, status: 200, text: async () => 'not json' }));

  try {
    const response = await POST(makeRequest(validPayload));
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.registrationId, 'HAPI-2026-0001');
    assert.equal(body.syncWarning, true);
    assert.equal(webhookCalls, 1);
  } finally {
    restoreFetch();
  }
});

test('invalid payload returns 400 and never calls the webhook', async () => {
  setupEnv();
  const restoreFetch = installWebhookStub(async () => {
    throw new Error('webhook must not be called');
  });

  try {
    const response = await POST(makeRequest({}));
    assert.equal(response.status, 400);
    assert.equal(webhookCalls, 0);
  } finally {
    restoreFetch();
  }
});

test('MOD#2 regression: RPC omits id — row is fetched by registration_id, never created.id', async () => {
  setupEnv();
  // The real create_registration RPC returns only registration_id, no id.
  rpcResult = { data: [{ registration_id: 'HAPI-2026-0001' }], error: null };
  row = fullRow;
  const restoreFetch = installWebhookStub(async () => webhookResponse(201, { ok: true, status: 201 }));

  try {
    const response = await POST(makeRequest(validPayload));

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.registrationId, 'HAPI-2026-0001');

    assert.deepEqual(eqCalls, [['registration_id', 'HAPI-2026-0001']],
      'the single-row fetch must filter by registration_id and never by created.id');
    assert.equal(webhookCalls, 1);
    const sent = JSON.parse(lastWebhookInit.body);
    assert.equal(sent.registration.registrationId, FAKE_ID);
    assert.equal(sent.registration.registrationReference, 'HAPI-2026-0001');
  } finally {
    restoreFetch();
  }
});

test('MOD#2 regression: row fetch failure still returns 201 (fail-open) with safe log', async () => {
  setupEnv();
  rpcResult = { data: [{ registration_id: 'HAPI-2026-0001' }], error: null };
  row = null;
  rowError = { code: 'PGRST116', message: 'row not found' };
  const errorLogs = [];
  const originalError = console.error;
  console.error = (...args) => errorLogs.push(args.map(String).join(' '));
  const restoreFetch = installWebhookStub(async () => {
    throw new Error('webhook must not be called');
  });

  try {
    const response = await POST(makeRequest(validPayload));

    assert.equal(response.status, 201, 'registration must still succeed');
    const body = await response.json();
    assert.equal(body.registrationId, 'HAPI-2026-0001');
    assert.equal(body.syncWarning, undefined, 'no sync attempted without a row');
    assert.equal(body.syncStatus, undefined, 'no sync status when no sync was attempted');
    assert.equal(response.headers.get('X-Sync-Status'), null);

    assert.equal(webhookCalls, 0);
    const serializedLogs = errorLogs.join('\n');
    assert.ok(serializedLogs.includes('Registration row fetch failed'), 'must log the row fetch failure');
    assert.equal(serializedLogs.includes(FAKE_SECRET), false, 'logs must never contain the secret');
  } finally {
    console.error = originalError;
    restoreFetch();
  }
});

test('missing Sheets env vars return 201 with syncStatus skipped and 0 webhook calls', async () => {
  // NOTE: env vars are deleted by resetState() — no setupEnv() here.
  rpcResult = { data: [{ registration_id: 'HAPI-2026-0001' }], error: null };
  row = fullRow;
  const restoreFetch = installWebhookStub(async () => {
    throw new Error('webhook must not be called');
  });

  try {
    const response = await POST(makeRequest(validPayload));

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.registrationId, 'HAPI-2026-0001');
    assert.equal(body.syncStatus, 'skipped');
    assert.equal(body.syncWarning, undefined, 'skipped is not a warning');
    assert.equal(response.headers.get('X-Sync-Status'), 'skipped');

    assert.equal(webhookCalls, 0, 'no webhook call when the sync is skipped');
  } finally {
    restoreFetch();
  }
});