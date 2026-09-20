/**
 * Google Sheets sync webhook for the HAPI registration flow.
 *
 * The Next.js registration API (app/api/register/route.js) is the only caller.
 * This script appends each confirmed registration to a private Google Sheet as
 * an org-facing copy. Supabase remains the source of truth; if this script
 * fails, the registration still succeeds.
 *
 * Expected POST body:
 * {
 *   "token": "<shared secret; compare to Script Property WEBHOOK_SECRET>",
 *   "registration": {
 *     "registrationId": "<supabase uuid; the dedup key>",
 *     "registrationReference": "HAPI-YYYY-NNNN",
 *     "registeredAt": "2026-09-21T08:30:00.000Z",
 *     "lastName": "...", "firstName": "...", "middleName": "...|null",
 *     "gender": "...", "email": "...", "contactNumber": "...",
 *     "barangay": "...", "city": "...", "province": "...", "region": "...",
 *     "institutionalAffiliation": "...|null", "degreeProgram": "...|null",
 *     "otherAffiliations": "...|null", "religiousStance": "...",
 *     "religiousStanceOther": "...|null", "attendingAs": "...",
 *     "attendanceMode": "...", "consent": true
 *   }
 * }
 *
 * Security model:
 * - The web app is deployed as "Anyone" but is gated by a shared secret
 *   (WEBHOOK_SECRET) compared via SHA-256 digests. Anyone without the secret
 *   receives 401.
 * - The Sheet ID is never exposed to callers, no PII is logged, and no secrets
 *   are logged. Details go only to the script owner via console.error.
 */

var HEADERS = [
  'Registration ID',
  'Registration Reference',
  'Registered At (UTC)',
  'Last Name',
  'First Name',
  'Middle Name',
  'Gender',
  'Email',
  'Contact Number',
  'Barangay',
  'City',
  'Province',
  'Region',
  'Institutional Affiliation',
  'Degree Program',
  'Other Affiliations',
  'Religious Stance',
  'Religious Stance (Other)',
  'Attending As',
  'Attendance Mode',
  'Consent'
];

var HEADER_TO_FIELD = {
  'Registration ID': 'registrationId',
  'Registration Reference': 'registrationReference',
  'Registered At (UTC)': 'registeredAt',
  'Last Name': 'lastName',
  'First Name': 'firstName',
  'Middle Name': 'middleName',
  'Gender': 'gender',
  'Email': 'email',
  'Contact Number': 'contactNumber',
  'Barangay': 'barangay',
  'City': 'city',
  'Province': 'province',
  'Region': 'region',
  'Institutional Affiliation': 'institutionalAffiliation',
  'Degree Program': 'degreeProgram',
  'Other Affiliations': 'otherAffiliations',
  'Religious Stance': 'religiousStance',
  'Religious Stance (Other)': 'religiousStanceOther',
  'Attending As': 'attendingAs',
  'Attendance Mode': 'attendanceMode',
  'Consent': 'consent'
};

function doGet() {
  return jsonResponse({ ok: false, status: 405, message: 'Method not allowed.' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, status: 400, message: 'Missing request body.' });
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      console.error('Google Sheets sync: invalid JSON payload.');
      return jsonResponse({ ok: false, status: 400, message: 'Invalid JSON payload.' });
    }

    var auth = verifyToken(payload && payload.token);
    if (!auth.ok) return jsonResponse(auth);

    var config = getConfig();
    if (!config.ok) return jsonResponse(config);

    var reg = payload.registration || {};
    var validationError = validateRegistration(reg);
    if (validationError) return jsonResponse(validationError);

    var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    var sheet = spreadsheet.getSheetByName(config.sheetName);
    if (!sheet) sheet = spreadsheet.insertSheet(config.sheetName);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }

    var headerIndex = locateHeaders(sheet);
    if (headerIndex === null) {
      return jsonResponse({ ok: false, status: 500, message: 'Sheet header mismatch.' });
    }

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
      return jsonResponse({ ok: false, status: 409, message: 'Busy, please retry.' });
    }
    try {
      if (registrationIdExists(sheet, headerIndex['Registration ID'], reg.registrationId)) {
        return jsonResponse({ ok: false, status: 409, message: 'duplicate registration' });
      }
      appendRegistrationRow(sheet, headerIndex, reg);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ ok: true, status: 201, registrationId: reg.registrationId });
  } catch (err) {
    console.error('Google Sheets sync unexpected error:', err);
    return jsonResponse({ ok: false, status: 500, message: 'Unexpected error.' });
  }
}

/**
 * Constant-time-ish comparison: both values are reduced to SHA-256 digests and
 * XORed byte by byte. Never echoes the secret.
 */
function verifyToken(payloadToken) {
  var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!secret) {
    console.error('Google Sheets sync: WEBHOOK_SECRET is not configured.');
    return { ok: false, status: 401, message: 'Unauthorized.' };
  }
  if (typeof payloadToken !== 'string' || payloadToken.length === 0) {
    return { ok: false, status: 401, message: 'Unauthorized.' };
  }
  var expected = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secret, Utilities.Charset.UTF_8);
  var actual = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payloadToken, Utilities.Charset.UTF_8);
  if (digestsEqual(expected, actual)) {
    return { ok: true };
  }
  console.error('Google Sheets sync: token mismatch.');
  return { ok: false, status: 401, message: 'Unauthorized.' };
}

function digestsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  var sheetName = props.getProperty('SHEET_NAME') || 'Registrations';
  var secret = props.getProperty('WEBHOOK_SECRET');
  if (!spreadsheetId || !secret) {
    console.error('Google Sheets sync: script is not configured (missing SPREADSHEET_ID or WEBHOOK_SECRET).');
    return { ok: false, status: 500, message: 'Script is not configured.' };
  }
  return { ok: true, spreadsheetId: spreadsheetId, sheetName: sheetName };
}

function validateRegistration(reg) {
  if (!reg.registrationId || String(reg.registrationId).trim() === '') {
    return { ok: false, status: 400, message: 'Registration ID is required.' };
  }
  if (!reg.email || String(reg.email).trim() === '') {
    return { ok: false, status: 400, message: 'Email is required.' };
  }
  if (!reg.registeredAt || isNaN(Date.parse(reg.registeredAt))) {
    return { ok: false, status: 400, message: 'Registered At must be a valid date.' };
  }
  return null;
}

/**
 * Matches HEADERS against the first row of the sheet. Returns a map of
 * header name -> 0-based column index, or null when a required header is
 * missing (extra columns in the sheet are tolerated).
 */
function locateHeaders(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var firstRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var index = {};
  for (var i = 0; i < HEADERS.length; i++) {
    index[HEADERS[i]] = -1;
  }
  for (var c = 0; c < firstRow.length; c++) {
    if (Object.prototype.hasOwnProperty.call(index, firstRow[c])) {
      index[firstRow[c]] = c;
    }
  }
  for (var h = 0; h < HEADERS.length; h++) {
    if (index[HEADERS[h]] === -1) {
      console.error('Google Sheets sync: sheet header mismatch (missing "' + HEADERS[h] + '").');
      return null;
    }
  }
  return index;
}

function registrationIdExists(sheet, idColumnIndex, registrationId) {
  var lastRow = sheet.getLastRow();
  var values = lastRow >= 1 ? sheet.getRange(1, idColumnIndex + 1, lastRow, 1).getValues() : [];
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(registrationId)) return true;
  }
  return false;
}

function appendRegistrationRow(sheet, headerIndex, reg) {
  var values = [];
  for (var i = 0; i < HEADERS.length; i++) {
    var headerName = HEADERS[i];
    var field = HEADER_TO_FIELD[headerName];
    var value = reg[field];
    values.push(value === undefined ? '' : value);
  }
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, HEADERS.length).setValues([values]);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}