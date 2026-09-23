import { test } from 'node:test';
import assert from 'node:assert/strict';

// Fakes only — never real credentials.
const FAKE_URL = 'http://sheets.invalid/webhook';
const FAKE_SECRET = 'test-secret-do-not-use';

const { GET } = await import('./route.js');

function setEnv(urlValue, secretValue) {
  if (urlValue === undefined) delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  else process.env.GOOGLE_SHEETS_WEBHOOK_URL = urlValue;
  if (secretValue === undefined) delete process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  else process.env.GOOGLE_SHEETS_WEBHOOK_SECRET = secretValue;
}

function teardownEnv() {
  delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  delete process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
}

test.beforeEach(teardownEnv);
test.afterEach(teardownEnv);

test('status reports configured when both vars are set', async () => {
  setEnv(FAKE_URL, FAKE_SECRET);
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');

  const text = await response.text();
  const body = JSON.parse(text);
  assert.deepEqual(body, { configured: true, missing: [] });
  assert.equal(text.includes(FAKE_URL), false, 'serialized body must never contain the URL value');
  assert.equal(text.includes(FAKE_SECRET), false, 'serialized body must never contain the secret value');
});

test('status reports the missing var names when both are deleted', async () => {
  setEnv(undefined, undefined);
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');

  const text = await response.text();
  const body = JSON.parse(text);
  assert.deepEqual(body, {
    configured: false,
    missing: ['GOOGLE_SHEETS_WEBHOOK_URL', 'GOOGLE_SHEETS_WEBHOOK_SECRET'],
  });
  assert.equal(text.includes(FAKE_URL), false, 'serialized body must never contain the URL value');
  assert.equal(text.includes(FAKE_SECRET), false, 'serialized body must never contain the secret value');
});