# Google Sheets sync for HAPI registrations

The registration API (`/api/register`) writes each confirmed registration to
Supabase first. Supabase is the **single source of truth**. After a successful
insert, the API **best-effort** mirrors the row to a private Google Sheet via a
Google Apps Script Web App. If the Sheets sync fails, the participant still sees
a successful registration — there is **no retry** (a retry could double
register), no rollback, and no failed response.

## Architecture

```
Participant  →  Next.js /api/register  →  Supabase (PRIMARY SOURCE OF TRUTH)
                                              │  (insert succeeded → 201)
                                              ▼ (best-effort, fail-open)
                    Google Apps Script Web App  →  Google Sheet (org-facing copy)
```

Shared contract (payload field names):

- `token` — shared secret, sent in the JSON body (never in the URL).
- `registration.registrationId` — Supabase row UUID, the dedup key.
- `registration.registrationReference` — `HAPI-YYYY-NNNN` reference.
- `registration.registeredAt` — UTC ISO string.
- `registration.lastName`, `firstName`, `middleName`, `gender`, `email`,
  `contactNumber`, `barangay`, `city`, `province`, `region`,
  `institutionalAffiliation`, `degreeProgram`, `otherAffiliations`,
  `religiousStance`, `religiousStanceOther`, `attendingAs`, `attendanceMode`,
  `consent`.

The Apps Script `HEADERS` array (see `scripts/apps-script/Code.gs`) is the
definitive column contract:

`['Registration ID', 'Registration Reference', 'Registered At (UTC)', 'Last Name', 'First Name', 'Middle Name', 'Gender', 'Email', 'Contact Number', 'Barangay', 'City', 'Province', 'Region', 'Institutional Affiliation', 'Degree Program', 'Other Affiliations', 'Religious Stance', 'Religious Stance (Other)', 'Attending As', 'Attendance Mode', 'Consent']`

## 1. Create the Google Sheet

1. Go to sheets.new (or `https://sheets.google.com/create`) while signed in as
   the Google account that will own the script.
2. Rename the default sheet tab to `Registrations`.
3. Open the browser URL and copy the **Spreadsheet ID** from
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`. Keep the
   spreadsheet **private** (default); it must never be shared publicly.

## 2. Create the Apps Script project and paste the code

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the default `function myFunction() {}`.
3. Create a file named `Code.gs` and paste the contents of
   `scripts/apps-script/Code.gs` from this repository.
4. Create a file named `appsscript.json` and paste the contents of
   `scripts/apps-script/appsscript.json`.
5. **File → Save**, then **Project Settings** and note the **Script ID** (only
   needed for maintenance/CLI).

## 3. Configure Script Properties

In the Apps Script editor: **Project Settings → Script Properties → Add
property**.

| Property | Value |
| --- | --- |
| `WEBHOOK_SECRET` | Strong random secret, e.g. `openssl rand -hex 32` (``your_hex_secret_here``). |
| `SPREADSHEET_ID` | The id from step 1 (`your_google_spreadsheet_id`). |
| `SHEET_NAME` | `Registrations` (optional; defaults to `Registrations`). |

Never log, print, or commit these values. The secret is compared (never echoed)
by the script.

## 4. Deploy the Web App

1. **Deploy → New deployment → Web app**.
2. **Description**: `HAPI registration sync`.
3. **Execute as**: **Me** (the account that owns the spreadsheet).
4. **Who has access**: **Anyone**.
5. **Deploy**; copy the **Web app URL** ending in `/exec`.

> **Why "Anyone" is correct here.** This is a server-to-server webhook: the
> Next.js server calls `/exec` with the shared `WEBHOOK_SECRET` in the JSON
> body, and the script rejects everything without a matching token (HTTP 401).
> "Anyone" is required so the anonymous Next.js server process — which has no
> Google session — is allowed to hit the endpoint. **"Only myself" is only for
> your own `/dev` manual tests while signed in to the owner account.** The
> deployment is *authorization-gated by the secret*, not by Google identity.
> If someone guesses/stumbles on the `/exec` URL without the secret they get
> `401 Unauthorized.`, and the Sheet itself stays private.

## 5. Copy the Web App URL

Copy the `/exec` URL. Note the exact value of the deployment (not the `/dev`
one) and store it server-side with the app owner. Example placeholder:
`https://script.google.com/macros/s/your_apps_script_id/exec`.

## 6. Set the same secret server-side

The value configured as `WEBHOOK_SECRET` in Script Properties (step 3) must be
identical to the `GOOGLE_SHEETS_WEBHOOK_SECRET` environment variable your
Next.js server uses. A mismatch yields `401 Unauthorized.` on every sync.

## 7. Next.js environment variables

Create/update the server environment (e.g. Vercel project env vars, or
`.env.local` for local dev — **never** commit real values; only placeholders
belong in `.env.example`):

```bash
# Server-only. Never prefix with NEXT_PUBLIC_. Never commit real values.
GOOGLE_SHEETS_WEBHOOK_URL=your_google_apps_script_web_app_url
GOOGLE_SHEETS_WEBHOOK_SECRET=your_secret_here
```

Both variables are read inside `lib/registrations/sheets-sync.js`
(`getSheetsWebhookConfig`) and are never exposed to the browser. If either is
missing, the sync is **skipped** with a warning and registrations still succeed.

## 8. Testing

### Test 1 — Happy path

Using PowerShell from a machine that can reach the deployed URL:

```powershell
$body = @{
  token = 'your_secret_here'
  registration = @{
    registrationId = '11111111-1111-4111-8111-111111111111'
    registrationReference = 'HAPI-2026-0001'
    registeredAt = '2026-09-21T08:30:00.000Z'
    lastName = 'Doe'; firstName = 'Jane'; middleName = $null
    gender = 'Female'; email = 'jane@example.com'; contactNumber = '+63 912 345 6789'
    barangay = 'Barangay Uno'; city = 'Cityville'; province = 'Cavite'; region = 'Region IV-A'
    institutionalAffiliation = 'HAPI'; degreeProgram = $null; otherAffiliations = $null
    religiousStance = 'Humanist'; religiousStanceOther = $null
    attendingAs = 'Participant'; attendanceMode = 'Hybrid'; consent = $true
  }
} | ConvertTo-Json -Depth 6

$r = Invoke-RestMethod `
  -Uri 'https://script.google.com/macros/s/your_apps_script_id/exec' `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body

$r | ConvertTo-Json   # expect: {"ok":true,"status":201,"registrationId":"11111111-..."}
```

The web app URL can take a few seconds on first call (cold start); the Next.js
client enforces a 5-second timeout and treats a timeout as a skipped sync.

### Test 2 — Duplicate prevention

**Replay the exact same body** (same `registrationId`). The script must return
`{"ok":false,"status":409,"message":"duplicate registration"}` and **must not
add a second row** to the sheet.

### Test 3 — Wrong secret

Change `token` to anything else. Expect `{"ok":false,"status":401,"message":"Unauthorized."}`
with no row appended.

Run the repository unit tests too:

```bash
npm test
```

## 9. Troubleshooting

- **Open Script Executions** (Apps Script editor → Executions) to see
  owner-only console logs and the `Unexpected error.` entries. No PII or
  secrets appear there — only generic context.
- **401 Unauthorized.** — the deployment secret does not match
  `GOOGLE_SHEETS_WEBHOOK_SECRET`, or the Script Property `WEBHOOK_SECRET` is
  missing. Re-check step 3 and step 6. Never share the value.
- **Script is not configured.** — `SPREADSHEET_ID` (and/or `WEBHOOK_SECRET`) is
  missing from Script Properties.
- **Busy, please retry.** — the script lock could not be acquired within
  30 seconds (two writes racing). It is safe for the Next.js side to treat this
  as a sync failure; the next registration is independent.
- **Sheet header mismatch.** — one of the required `HEADERS` names is missing or
  renamed in row 1 of the target sheet. Fix the header row to match the exact
  `HEADERS` list (step contract above), then re-test.
- **Always create a NEW deployment version after editing `Code.gs` or
  `appsscript.json`** — deployments snapshot the code; the old URL keeps the old
  code until you deploy again.
- **`/dev` vs `/exec`** — `/dev` URLs are for interactive tests by the owner;
  the Next.js server must call the `/exec` deployment URL.
- **Timestamp format** — cells are written as the UTC ISO string the API sends
  (`2026-09-21T08:30:00.000Z`). If `registeredAt` is not parseable the script
  rejects with 400.
- **Timeout in the app logs** (`reason: 'timeout'`) — increase
  `SHEET_SYNC_TIMEOUT_MS` in `lib/registrations/sheets-sync.js` and/or warm the
  web hook, but note the sync is best-effort.

## 10. Security model

- The Google Sheet is **private** and never referenced by any client code.
- The Next.js server only sends the whitelisted registration payload fields
  plus the shared `token` — **never** Supabase credentials.
- Supabase credentials live only on the app owner's server/secret store; the
  Apps Script has no access to them.
- The `/exec` endpoint is **secret-gated**: `WEBHOOK_SECRET` is compared via
  SHA-256 digests in constant-time style, and the secret value is never echoed
  or logged.
- The script owner's logs (`console.error` / Script Executions) carry no PII
  and no secrets — only generic errors for operators.
- The repo's server code logs `registrationId` (a UUID, not PII) for tracing
  but never the token, the webhook URL, emails, or full names.