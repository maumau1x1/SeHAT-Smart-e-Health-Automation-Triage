
-- 1. profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  ic_number text,
  dob date,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users select own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 2. medications
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  instructions text,
  times_of_day text[] not null default '{}'::text[],
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  email_reminders boolean not null default true,
  calendar_reminders boolean not null default false,
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.medications enable row level security;
create policy "Users select own medications" on public.medications for select using (auth.uid() = user_id);
create policy "Users insert own medications" on public.medications for insert with check (auth.uid() = user_id);
create policy "Users update own medications" on public.medications for update using (auth.uid() = user_id);
create policy "Users delete own medications" on public.medications for delete using (auth.uid() = user_id);

create trigger medications_set_updated_at
before update on public.medications
for each row execute function public.set_updated_at();

-- 3. med_reminders
create table public.med_reminders (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fire_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sent','skipped','failed')),
  email_message_id text,
  google_event_id text,
  taken boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.med_reminders enable row level security;
create policy "Users select own reminders" on public.med_reminders for select using (auth.uid() = user_id);
create policy "Users update own reminders" on public.med_reminders for update using (auth.uid() = user_id);

create index med_reminders_due_idx on public.med_reminders (status, fire_at);
create index med_reminders_user_idx on public.med_reminders (user_id, fire_at);

create trigger med_reminders_set_updated_at
before update on public.med_reminders
for each row execute function public.set_updated_at();

-- 4. google_oauth_tokens
create table public.google_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.google_oauth_tokens enable row level security;
-- Only the owner can read; only service role inserts/updates (no policy = denied for client)
create policy "Users see own google connection" on public.google_oauth_tokens for select using (auth.uid() = user_id);
create policy "Users delete own google connection" on public.google_oauth_tokens for delete using (auth.uid() = user_id);

create trigger google_tokens_set_updated_at
before update on public.google_oauth_tokens
for each row execute function public.set_updated_at();
