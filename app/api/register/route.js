import { createServerSupabaseClient } from '../../../lib/supabase/server.js';
import { queueExcelExport } from '../../../lib/registrations/excel.js';
import { validateRegistration } from '../../../lib/registrations/validation.js';
import { getSheetsWebhookConfig, syncRegistrationToSheets } from '../../../lib/registrations/sheets-sync.js';

export const runtime = 'nodejs';
export const maxDuration = 20;

const registrationColumns = 'registration_id,registered_at,last_name,first_name,middle_name,gender,email,contact_number,barangay,city,province,region,institutional_affiliation,degree_program,other_affiliations,religious_stance,religious_stance_other,attending_as,attendance_mode,consent';

function isDuplicateError(error) {
  return error?.code === '23505' || /registrations_email_lower_idx|registrations_email/i.test(error?.message || '');
}

export async function POST(request) {
  const input = await request.json().catch(() => null);
  const validation = validateRegistration(input);
  if (!validation.ok) return Response.json({ message: validation.message }, { status: validation.status });

  try {
    const supabase = createServerSupabaseClient();
    const { data: createdRows, error: createError } = await supabase.rpc('create_registration', { registration_payload: validation.data });
    if (createError) {
      if (isDuplicateError(createError)) return Response.json({ message: 'That email is already registered with HAPI.' }, { status: 409 });
      console.error('Registration insert failed:', { code: createError.code, message: createError.message, details: createError.details, hint: createError.hint });
      return Response.json({ message: 'We could not save your registration right now. Please try again.' }, { status: 500 });
    }

    const created = Array.isArray(createdRows) ? createdRows[0] : createdRows;
    if (!created?.registration_id) {
      console.error('Registration insert returned no registration ID.');
      return Response.json({ message: 'We could not confirm your registration. Please try again.' }, { status: 500 });
    }

    try {
      const { data: rows, error: exportQueryError } = await supabase.from('registrations').select(registrationColumns).order('registered_at', { ascending: true });
      if (exportQueryError) throw exportQueryError;
      await queueExcelExport(rows || []);
    } catch (exportError) {
      console.error('Registration Excel export failed:', exportError instanceof Error ? exportError.message : exportError);
    }

    const syncColumns = 'id,' + registrationColumns;
    let createdRow = null;
    try {
      const { data: row, error: syncQueryError } = await supabase.from('registrations').select(syncColumns).eq('registration_id', created.registration_id).maybeSingle();
      if (syncQueryError || !row) {
        console.error('Registration row fetch failed:', { code: syncQueryError?.code, message: syncQueryError?.message, registrationId: created.registration_id });
      } else {
        createdRow = row;
      }
    } catch (error) {
      console.error('Registration row fetch failed:', { code: error?.code, message: error instanceof Error ? error.message : error, registrationId: created.registration_id });
    }

    let syncWarning = false;
    let syncStatus = null;
    if (createdRow) {
      try {
        const { url, secret } = getSheetsWebhookConfig();
        const syncResult = await syncRegistrationToSheets({ registration: createdRow, webhookUrl: url, webhookSecret: secret });
        syncWarning = syncResult?.synced === false && !syncResult?.skipped;
        syncStatus = syncResult?.synced === true ? 'ok' : syncResult?.skipped === true ? 'skipped' : 'warning';
      } catch (error) {
        console.error('Registration sheet sync failed:', { message: error instanceof Error ? error.message : error, registrationId: created.registration_id });
        // Preserve the historic fail-open contract; the status surface still
        // lets operators see that the Sheets mirror did not confirm.
        syncWarning = false;
        syncStatus = 'warning';
      }
    }

    const responseHeaders = syncStatus ? { 'X-Sync-Status': syncStatus } : undefined;
    return Response.json(
      {
        registrationId: created.registration_id,
        ...(syncWarning ? { syncWarning } : {}),
        ...(syncStatus ? { syncStatus } : {}),
      },
      { status: 201, headers: responseHeaders },
    );
  } catch (error) {
    console.error('Registration backend error:', error instanceof Error ? error.message : error);
    return Response.json({ message: 'Registration is temporarily unavailable. Please try again later.' }, { status: 500 });
  }
}
