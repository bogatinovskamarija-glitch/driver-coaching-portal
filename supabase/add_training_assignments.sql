-- ============================================================
-- Training assignment system
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.training_assignments (
  id            uuid default gen_random_uuid() primary key,
  driver_id     uuid references public.drivers(id) on delete cascade not null,
  module_id     uuid references public.coaching_modules(id) not null,
  assigned_by   uuid references public.drivers(id),
  reason        text,                      -- "Speeding event on 10/28"
  due_date      date,
  status        text default 'pending',    -- 'pending' | 'completed' | 'overdue'
  points_bonus  integer default 25,        -- extra pts beyond normal module pts
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

alter table public.training_assignments enable row level security;

-- Admins can do everything
create policy "assignments_admin" on public.training_assignments for all
  using (public.is_admin());

-- Drivers can read their own assignments
create policy "assignments_driver_read" on public.training_assignments for select
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));

-- Drivers can update their own assignment status (to mark complete)
create policy "assignments_driver_update" on public.training_assignments for update
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
