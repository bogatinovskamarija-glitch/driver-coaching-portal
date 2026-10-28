-- ============================================================
-- DOT Roadside Inspection log
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.dot_inspections (
  id              uuid default gen_random_uuid() primary key,
  driver_id       uuid references public.drivers(id) on delete cascade not null,
  inspection_date date not null,
  result          text not null,   -- 'clean' | 'minor' | 'major' | 'critical'
  violations      text,            -- description of violations if any
  points_change   integer not null default 0,
  notes           text,
  logged_by       uuid references public.drivers(id),
  created_at      timestamptz default now()
);

alter table public.dot_inspections enable row level security;

-- Admins can do everything
create policy "dot_admin" on public.dot_inspections for all
  using (public.is_admin());

-- Drivers can view their own inspections
create policy "dot_driver_read" on public.dot_inspections for select
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
