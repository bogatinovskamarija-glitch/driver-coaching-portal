-- ============================================================
-- Add quarterly points tracking to driver_stats
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Add quarter_points column (tracks points earned this quarter only)
alter table public.driver_stats
  add column if not exists quarter_points integer default 0;

-- Initialize quarter_points = 0 for all existing rows
update public.driver_stats set quarter_points = 0 where quarter_points is null;

-- Helper: admin calls this to reset all drivers at start of new quarter
-- Usage: select reset_quarter_points();
create or replace function public.reset_quarter_points()
returns void
language plpgsql security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;
  update public.driver_stats set quarter_points = 0;
end;
$$;
