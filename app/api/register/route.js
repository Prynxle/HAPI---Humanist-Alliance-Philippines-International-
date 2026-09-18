import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

const dataDir = path.join(process.cwd(), 'data');
const registrationsFile = path.join(dataDir, 'registrations.json');
const workbookFile = path.join(dataDir, 'hapi-registrations.xlsx');
const requiredFields = ['firstName', 'lastName', 'email', 'participation', 'focus'];
const clean = (value) => typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : value;

async function readRegistrations() { try { return JSON.parse(await fs.readFile(registrationsFile, 'utf8')); } catch { return []; } }
async function writeExcel(rows) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.map(({ registrationId, registeredAt, ...row }) => ({ 'Registration ID': registrationId, 'Registered At': registeredAt, ...row }))), 'Registered');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Metric: 'Total registrations', Value: rows.length }, { Metric: 'Last updated', Value: new Date().toISOString() }]), 'Summary');
  const workbookBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  await fs.writeFile(workbookFile, workbookBuffer);
}

export async function POST(request) {
  const input = await request.json().catch(() => ({}));
  const body = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, clean(value)]));
  const missing = requiredFields.filter((field) => !body[field]);
  if (missing.length || !body.consent) return Response.json({ message: 'Please complete the required fields and consent to be contacted.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return Response.json({ message: 'Please enter a valid email address.' }, { status: 400 });
  const rows = await readRegistrations();
  if (rows.some((row) => row.email.toLowerCase() === body.email.toLowerCase())) return Response.json({ message: 'That email is already registered with HAPI.' }, { status: 409 });
  const record = { registrationId: `HAPI-${new Date().getFullYear()}-${String(rows.length + 1).padStart(4, '0')}`, registeredAt: new Date().toISOString(), ...body };
  const nextRows = [...rows, record];
  await fs.mkdir(dataDir, { recursive: true }); await fs.writeFile(registrationsFile, JSON.stringify(nextRows, null, 2)); await writeExcel(nextRows);
  return Response.json({ registrationId: record.registrationId }, { status: 201 });
}
