-- ============================================================
-- Add coaching & inspection tables
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Monthly driver coaching sessions (Marija)
create table if not exists public.coaching_sessions (
  id              uuid default gen_random_uuid() primary key,
  driver_id       uuid references public.drivers(id) on delete cascade not null,
  coach_id        uuid references public.drivers(id),
  coached_date    date not null,
  month           date not null,  -- first day of month, for grouping

  motive_coached      boolean default false,
  motive_notes        text,
  speeding            boolean default false,
  speeding_notes      text,
  hard_braking        boolean default false,
  hard_braking_notes  text,
  cornering           boolean default false,
  cornering_notes     text,
  hos_coached         boolean default false,
  hos_types           text[] default '{}',
  hos_notes           text,
  general_notes       text,
  points_awarded      integer default 25,
  created_at          timestamptz default now(),

  unique(driver_id, month)
);

-- Phone pre-trip inspections (Mike)
create table if not exists public.phone_inspections (
  id              uuid default gen_random_uuid() primary key,
  driver_id       uuid references public.drivers(id) on delete cascade not null,
  inspector_id    uuid references public.drivers(id),
  truck_clickup_id text,
  inspection_date date not null,
  items           jsonb default '[]',
  overall_status  text default 'pass',  -- 'pass' | 'flag' | 'fail'
  follow_up_notes text,
  follow_up_date  date,
  points_awarded  integer default 30,
  created_at      timestamptz default now()
);

-- Maintenance schedule
create table if not exists public.maintenance_schedule (
  id              uuid default gen_random_uuid() primary key,
  truck_clickup_id text,
  driver_id       uuid references public.drivers(id),
  title           text not null,
  description     text,
  scheduled_date  date not null,
  status          text default 'pending',  -- 'pending' | 'done' | 'overdue'
  inspection_id   uuid references public.phone_inspections(id),
  created_by      uuid references public.drivers(id),
  created_at      timestamptz default now()
);

-- RLS
alter table public.coaching_sessions    enable row level security;
alter table public.phone_inspections    enable row level security;
alter table public.maintenance_schedule enable row level security;

-- Admins can do everything
create policy "coaching_admin" on public.coaching_sessions for all
  using (public.is_admin());
create policy "inspections_admin" on public.phone_inspections for all
  using (public.is_admin());
create policy "maintenance_admin" on public.maintenance_schedule for all
  using (public.is_admin());

-- Drivers can read their own coaching/inspection records
create policy "coaching_driver_read" on public.coaching_sessions for select
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
create policy "inspections_driver_read" on public.phone_inspections for select
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
