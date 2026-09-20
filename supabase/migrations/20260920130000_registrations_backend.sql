create table if not exists public.registration_counters (
  year integer primary key check (year between 2000 and 9999),
  next_number integer not null check (next_number > 0)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_id text not null unique,
  registered_at timestamptz not null default now(),
  last_name text not null check (length(btrim(last_name)) > 0),
  first_name text not null check (length(btrim(first_name)) > 0),
  middle_name text,
  gender text not null check (gender in ('Male', 'Female', 'Non-Binary', 'Prefer not to Say')),
  email text not null check (email = lower(email)),
  contact_number text not null,
  barangay text not null,
  city text not null,
  province text not null,
  region text not null,
  institutional_affiliation text,
  degree_program text,
  other_affiliations text,
  religious_stance text not null check (religious_stance in ('Atheist', 'Agnostic', 'Deist', 'Pantheist/Panentheist', 'Secular/Non-Believer/Non-theistic', 'Non-Religious Believer', 'Curious Believer', 'Other')),
  religious_stance_other text,
  attending_as text not null check (attending_as = 'Participant/Audience'),
  attendance_mode text not null check (attendance_mode in ('Onsite', 'Online')),
  consent boolean not null check (consent is true),
  constraint registrations_other_stance_check check (religious_stance <> 'Other' or length(btrim(coalesce(religious_stance_other, ''))) > 0)
);

create unique index if not exists registrations_email_lower_idx on public.registrations (lower(email));
create index if not exists registrations_registered_at_idx on public.registrations (registered_at);

alter table public.registration_counters enable row level security;
alter table public.registrations enable row level security;

revoke all on table public.registration_counters from anon, authenticated;
revoke all on table public.registrations from anon, authenticated;

create or replace function public.create_registration(registration_payload jsonb)
returns table (registration_id text, registered_at timestamptz)
language plpgsql
set search_path = public
as $$
declare
  registration_year integer := extract(year from current_date)::integer;
  allocated_number integer;
  generated_registration_id text;
begin
  insert into public.registration_counters (year, next_number)
  values (registration_year, 1)
  on conflict (year) do update
    set next_number = public.registration_counters.next_number + 1
  returning next_number into allocated_number;

  generated_registration_id := format('HAPI-%s-%s', registration_year, lpad(allocated_number::text, 4, '0'));

  return query
  insert into public.registrations (
    registration_id, last_name, first_name, middle_name, gender, email, contact_number,
    barangay, city, province, region, institutional_affiliation, degree_program,
    other_affiliations, religious_stance, religious_stance_other, attending_as,
    attendance_mode, consent
  ) values (
    generated_registration_id,
    registration_payload ->> 'lastName', registration_payload ->> 'firstName', nullif(registration_payload ->> 'middleName', ''),
    registration_payload ->> 'gender', lower(registration_payload ->> 'email'), registration_payload ->> 'contactNumber',
    registration_payload ->> 'barangay', registration_payload ->> 'city', registration_payload ->> 'province', registration_payload ->> 'region',
    nullif(registration_payload ->> 'institutionalAffiliation', ''), nullif(registration_payload ->> 'degreeProgram', ''),
    nullif(registration_payload ->> 'otherAffiliations', ''), registration_payload ->> 'religiousStance', nullif(registration_payload ->> 'religiousStanceOther', ''),
    registration_payload ->> 'attendingAs', registration_payload ->> 'attendanceMode', (registration_payload ->> 'consent')::boolean
  ) returning registrations.registration_id, registrations.registered_at;
end;
$$;

revoke all on function public.create_registration(jsonb) from public, anon, authenticated;
grant execute on function public.create_registration(jsonb) to service_role;

notify pgrst, 'reload schema';
