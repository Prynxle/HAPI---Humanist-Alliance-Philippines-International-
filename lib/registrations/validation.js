import { ATTENDANCE_MODES, ATTENDING_AS, GENDERS, RELIGIOUS_STANCES } from './constants.js';

const requiredFields = ['lastName', 'firstName', 'gender', 'email', 'contactNumber', 'barangay', 'city', 'province', 'region', 'religiousStance', 'attendingAs', 'attendanceMode'];

export function clean(value) {
  return typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : value;
}

export function validateRegistration(input) {
  const body = Object.fromEntries(Object.entries(input && typeof input === 'object' ? input : {}).map(([key, value]) => [key, clean(value)]));
  const missing = requiredFields.filter((field) => !body[field]);
  if (missing.length || body.consent !== true) return { ok: false, status: 400, message: 'Please complete the required fields and consent to the privacy notice.' };
  if (!GENDERS.includes(body.gender)) return { ok: false, status: 400, message: 'Please select a valid gender.' };
  if (!RELIGIOUS_STANCES.includes(body.religiousStance)) return { ok: false, status: 400, message: 'Please select a valid religious stance.' };
  if (!ATTENDANCE_MODES.includes(body.attendanceMode)) return { ok: false, status: 400, message: 'Please select a valid attendance mode.' };
  if (body.attendingAs !== ATTENDING_AS) return { ok: false, status: 400, message: 'Please select Participant/Audience as your attendance type.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return { ok: false, status: 400, message: 'Please enter a valid email address.' };
  if (!/^[+()\-\s\d]{7,20}$/.test(body.contactNumber)) return { ok: false, status: 400, message: 'Please enter a valid contact number.' };
  if (body.religiousStance === 'Other' && !body.religiousStanceOther) return { ok: false, status: 400, message: 'Please specify your religious stance.' };

  return {
    ok: true,
    data: {
      lastName: body.lastName,
      firstName: body.firstName,
      middleName: body.middleName || null,
      gender: body.gender,
      email: body.email.toLowerCase(),
      contactNumber: body.contactNumber,
      barangay: body.barangay,
      city: body.city,
      province: body.province,
      region: body.region,
      institutionalAffiliation: body.institutionalAffiliation || null,
      degreeProgram: body.degreeProgram || null,
      otherAffiliations: body.otherAffiliations || null,
      religiousStance: body.religiousStance,
      religiousStanceOther: body.religiousStance === 'Other' ? body.religiousStanceOther : null,
      attendingAs: body.attendingAs,
      attendanceMode: body.attendanceMode,
      consent: true,
    },
  };
}
