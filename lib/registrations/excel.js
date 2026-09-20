import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

const workbookFile = path.join(process.cwd(), 'data', 'hapi-registrations.xlsx');
let exportQueue = Promise.resolve();

const headers = {
  registration_id: 'Registration ID', registered_at: 'Registered At', last_name: 'Last Name', first_name: 'First Name', middle_name: 'Middle Name', gender: 'Gender', email: 'Email', contact_number: 'Contact Number', barangay: 'Barangay', city: 'City', province: 'Province', region: 'Region', institutional_affiliation: 'Institutional Affiliation', degree_program: 'Degree and Program/s', other_affiliations: 'Other Affiliations', religious_stance: 'Religious Stance', religious_stance_other: 'Religious Stance Other', attending_as: 'Attending As', attendance_mode: 'Attendance Mode', consent: 'Consent',
};

function toWorkbookRow(row) {
  return Object.fromEntries(Object.entries(headers).map(([key, label]) => [label, row[key] ?? '']));
}

async function writeWorkbook(rows) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.map(toWorkbookRow)), 'Registered');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Metric: 'Total registrations', Value: rows.length }, { Metric: 'Last updated', Value: new Date().toISOString() }]), 'Summary');
  await fs.mkdir(path.dirname(workbookFile), { recursive: true });
  await fs.writeFile(workbookFile, XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
}

export function queueExcelExport(rows) {
  exportQueue = exportQueue.catch(() => undefined).then(() => writeWorkbook(rows));
  return exportQueue;
}
