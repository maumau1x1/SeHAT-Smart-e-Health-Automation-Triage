-- ============================================================
-- 1. Roles infrastructure
-- ============================================================
do $$ begin
  create type public.app_role as enum ('patient', 'medical_officer', 'pharmacist');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Users see own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ============================================================
-- 2. Clinics (shared / public)
-- ============================================================
create table if not exists public.clinics (
  id text primary key,
  name text not null,
  distance text not null,
  queue integer not null default 0,
  wait text not null,
  crowd text not null check (crowd in ('Low','Moderate','High')),
  best_time text not null,
  lat double precision not null,
  lng double precision not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinics enable row level security;

create policy "Clinics are public" on public.clinics
  for select using (true);

create trigger clinics_updated_at
  before update on public.clinics
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. Consultations (per user)
-- ============================================================
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visit_date date not null default current_date,
  clinic text not null,
  chief_complaint text not null,
  symptoms text[] not null default '{}',
  severity text not null check (severity in ('Mild','Moderate','Severe')),
  diagnosis text,
  medications text[] not null default '{}',
  status text not null default 'Active' check (status in ('Completed','Active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consultations enable row level security;

create policy "Users see own consultations" on public.consultations
  for select using (auth.uid() = user_id);
create policy "Users insert own consultations" on public.consultations
  for insert with check (auth.uid() = user_id);
create policy "Users update own consultations" on public.consultations
  for update using (auth.uid() = user_id);
create policy "Users delete own consultations" on public.consultations
  for delete using (auth.uid() = user_id);

create trigger consultations_updated_at
  before update on public.consultations
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. Clinical reports (shared demo data + MO/Pharmacist workflow)
-- ============================================================
create table if not exists public.clinical_reports (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  generated_at timestamptz not null default now(),
  patient_user_id uuid references auth.users(id) on delete set null,
  patient jsonb not null,
  chief_complaint text not null,
  symptoms jsonb not null default '[]'::jsonb,
  ai_assessment text not null,
  recommended_action text not null check (recommended_action in ('Consult Doctor','Urgent Referral','Self-Care')),
  ai_severity text not null check (ai_severity in ('Urgent','Moderate','Low')),
  status text not null default 'submitted' check (status in ('submitted','mo_reviewed','dispensed','revision_requested')),
  forwarded_to_mo text,
  forwarded_to_pharmacist text,
  mo_review jsonb,
  dispensing jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinical_reports enable row level security;

-- DEMO: shared visibility/edits so the MO + Pharmacist portals work
-- without per-user role provisioning in the demo.
create policy "Reports are publicly readable (demo)" on public.clinical_reports
  for select using (true);
create policy "Reports are publicly insertable (demo)" on public.clinical_reports
  for insert with check (true);
create policy "Reports are publicly updatable (demo)" on public.clinical_reports
  for update using (true);

create trigger clinical_reports_updated_at
  before update on public.clinical_reports
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. Seed clinics
-- ============================================================
insert into public.clinics (id, name, distance, queue, wait, crowd, best_time, lat, lng, sort_order) values
  ('c1','Klinik Sihat Damansara','0.8 km',4,'12 min','Low','Now is great',3.1579,101.6232,1),
  ('c2','Pantai Hospital KL','2.3 km',18,'55 min','High','After 4 PM',3.1106,101.6664,2),
  ('c3','Klinik Mediviron KLCC','1.4 km',9,'28 min','Moderate','Around 2 PM',3.1578,101.7114,3),
  ('c4','Sunway Medical Centre','3.1 km',22,'1h 10m','High','Early morning',3.0664,101.6065,4),
  ('c5','Klinik Kesihatan Bangsar','1.9 km',6,'18 min','Low','Now is great',3.1289,101.6789,5),
  ('c6','Gleneagles Hospital KL','2.7 km',15,'42 min','High','After 6 PM',3.1668,101.7282,6),
  ('c7','Prince Court Medical','2.1 km',11,'32 min','Moderate','Around 3 PM',3.1612,101.7196,7),
  ('c8','Klinik Mesra Mont Kiara','3.4 km',3,'9 min','Low','Now is great',3.1726,101.6509,8),
  ('c9','KPJ Damansara Specialist','4.0 km',19,'1h 02m','High','Early morning',3.1718,101.6322,9),
  ('c10','Klinik Qaseh Setiawangsa','5.6 km',5,'15 min','Low','Now is great',3.1898,101.7506,10),
  ('c11','Columbia Asia Cheras','6.2 km',14,'47 min','Moderate','After 5 PM',3.0876,101.7421,11),
  ('c12','Klinik Wawasan Ampang','5.1 km',7,'22 min','Low','Now is great',3.1492,101.7619,12)
on conflict (id) do nothing;

-- ============================================================
-- 6. Seed clinical reports (demo)
-- ============================================================
insert into public.clinical_reports (
  ref, generated_at, patient, chief_complaint, symptoms,
  ai_assessment, recommended_action, ai_severity, status, forwarded_to_mo
) values (
  'AIR-2026-1001',
  '2026-05-24T08:42:00Z',
  '{"name":"Lim Wei Jian","ic":"880322-14-2231","dob":"1988-03-22","phone":"+60 16-228 4410","emergencyName":"Lim Mei Ling","emergencyPhone":"+60 17-661 2231"}'::jsonb,
  'Chest tightness and shortness of breath',
  '[{"name":"Chest tightness","duration":"6 hours","severity":"8/10"},{"name":"Shortness of breath","duration":"4 hours","severity":"7/10"},{"name":"Light-headedness","duration":"2 hours","severity":"5/10"}]'::jsonb,
  'Symptom pattern suggests possible cardiopulmonary involvement. Urgent in-person evaluation recommended to rule out acute coronary or respiratory pathology.',
  'Urgent Referral','Urgent','submitted','Dr. Tan Chee Keong'
), (
  'AIR-2026-1002',
  '2026-05-24T09:15:00Z',
  '{"name":"Siti Nurhaliza","ic":"010917-08-4422","dob":"2001-09-17","phone":"+60 11-998 1122","emergencyName":"Rosmah Ibrahim","emergencyPhone":"+60 12-441 0099"}'::jsonb,
  'Persistent sore throat with low-grade fever',
  '[{"name":"Sore throat","duration":"3 days","severity":"5/10"},{"name":"Low-grade fever","duration":"2 days","severity":"4/10"},{"name":"Mild cough","duration":"2 days","severity":"3/10"}]'::jsonb,
  'Findings consistent with viral pharyngitis. Symptomatic management and clinician confirmation advised.',
  'Consult Doctor','Moderate','submitted','Dr. Tan Chee Keong'
)
on conflict (ref) do nothing;

insert into public.clinical_reports (
  ref, generated_at, patient, chief_complaint, symptoms,
  ai_assessment, recommended_action, ai_severity, status,
  forwarded_to_mo, forwarded_to_pharmacist, mo_review
) values (
  'AIR-2026-1000',
  '2026-05-24T07:05:00Z',
  '{"name":"Ahmad Faisal","ic":"750210-11-5533","dob":"1975-02-10","phone":"+60 19-220 7788","emergencyName":"Nur Faiza","emergencyPhone":"+60 13-554 9988"}'::jsonb,
  'Recurring migraine and nausea',
  '[{"name":"Migraine","duration":"2 days","severity":"6/10"},{"name":"Nausea","duration":"1 day","severity":"4/10"}]'::jsonb,
  'Pattern suggestive of tension-type migraine with mild dehydration component.',
  'Consult Doctor','Moderate','mo_reviewed',
  'Dr. Tan Chee Keong','Pharm. Lee Wai Yee',
  '{"moName":"Dr. Tan Chee Keong","diagnosis":"Tension-type migraine","notes":"Encourage hydration and regular sleep. Review in 2 weeks.","actionTaken":"Prescribe Medication","reviewedAt":"2026-05-24T07:35:00Z","prescription":[{"id":"p1","name":"Paracetamol","dosage":"500mg","frequency":"Every 6 hours","duration":"5 days","stock":"In Stock"},{"id":"p2","name":"Metoclopramide","dosage":"10mg","frequency":"3x daily","duration":"3 days","stock":"Low Stock"}]}'::jsonb
)
on conflict (ref) do nothing;