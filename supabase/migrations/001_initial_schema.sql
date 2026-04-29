-- ============================================================
-- Cybercheck — Initial Schema Migration
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('admin', 'student', 'entrepreneur')),
  full_name   text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Trigger: auto-insert profile from auth metadata on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ENTREPRENEURS
-- ============================================================
create table if not exists entrepreneurs (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  company_name    text not null,
  kvk_number      text,
  address         text,
  interview_mode  text not null check (interview_mode in ('on-site', 'online')) default 'online',
  created_at      timestamptz not null default now(),
  unique (profile_id)
);

-- ============================================================
-- STUDENT GROUPS
-- ============================================================
create table if not exists student_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists student_group_members (
  group_id    uuid not null references student_groups(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  primary key (group_id, profile_id)
);

-- ============================================================
-- AVAILABILITY SLOTS
-- ============================================================
create table if not exists availability_slots (
  id          uuid primary key default gen_random_uuid(),
  owner_type  text not null check (owner_type in ('entrepreneur', 'student_group')),
  owner_id    uuid not null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,  -- always start_time + 45 min
  is_booked   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (owner_type, owner_id, start_time)
);

create index if not exists idx_slots_owner on availability_slots (owner_type, owner_id);
create index if not exists idx_slots_time  on availability_slots (start_time, is_booked);

-- ============================================================
-- MATCHES
-- ============================================================
create table if not exists matches (
  id                uuid primary key default gen_random_uuid(),
  entrepreneur_id   uuid not null references entrepreneurs(id) on delete cascade,
  student_group_id  uuid not null references student_groups(id) on delete cascade,
  slot_start        timestamptz not null,
  slot_end          timestamptz not null,
  interview_mode    text not null check (interview_mode in ('on-site', 'online')),
  status            text not null check (status in ('scheduled', 'completed', 'cancelled', 'pending'))
                    default 'scheduled',
  teams_link        text,
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_matches_entrepreneur on matches (entrepreneur_id);
create index if not exists idx_matches_group        on matches (student_group_id);
create index if not exists idx_matches_status       on matches (status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: users see their own row; admins see all
alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_admin_all"  on profiles for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Entrepreneurs: owner or admin
alter table entrepreneurs enable row level security;
create policy "entrepreneurs_select" on entrepreneurs for select using (
  profile_id = auth.uid() or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "entrepreneurs_insert" on entrepreneurs for insert with check (profile_id = auth.uid());
create policy "entrepreneurs_update" on entrepreneurs for update using (profile_id = auth.uid());

-- Student groups: group members or admin
alter table student_groups enable row level security;
create policy "groups_select" on student_groups for select using (
  exists (select 1 from student_group_members m where m.group_id = id and m.profile_id = auth.uid()) or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "groups_insert" on student_groups for insert with check (true);

alter table student_group_members enable row level security;
create policy "members_select" on student_group_members for select using (
  profile_id = auth.uid() or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "members_insert" on student_group_members for insert with check (profile_id = auth.uid());

-- Availability slots: owner or admin
alter table availability_slots enable row level security;
create policy "slots_select" on availability_slots for select using (
  (owner_type = 'entrepreneur' and exists (
    select 1 from entrepreneurs e where e.id = owner_id and e.profile_id = auth.uid()
  )) or
  (owner_type = 'student_group' and exists (
    select 1 from student_group_members m where m.group_id = owner_id and m.profile_id = auth.uid()
  )) or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "slots_insert" on availability_slots for insert with check (
  (owner_type = 'entrepreneur' and exists (
    select 1 from entrepreneurs e where e.id = owner_id and e.profile_id = auth.uid()
  )) or
  (owner_type = 'student_group' and exists (
    select 1 from student_group_members m where m.group_id = owner_id and m.profile_id = auth.uid()
  ))
);
create policy "slots_delete" on availability_slots for delete using (
  is_booked = false and (
    (owner_type = 'entrepreneur' and exists (
      select 1 from entrepreneurs e where e.id = owner_id and e.profile_id = auth.uid()
    )) or
    (owner_type = 'student_group' and exists (
      select 1 from student_group_members m where m.group_id = owner_id and m.profile_id = auth.uid()
    ))
  )
);

-- Matches: entrepreneur owner, group member, or admin
alter table matches enable row level security;
create policy "matches_select" on matches for select using (
  exists (select 1 from entrepreneurs e where e.id = entrepreneur_id and e.profile_id = auth.uid()) or
  exists (select 1 from student_group_members m where m.group_id = student_group_id and m.profile_id = auth.uid()) or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "matches_insert_admin" on matches for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "matches_update_admin" on matches for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
