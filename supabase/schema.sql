-- ============================================================
-- Driver Coaching Portal — Supabase Schema
-- Run once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Companies
create table if not exists public.companies (
  id            text primary key,         -- 'carat' | 'pft'
  name          text not null,
  clickup_space_id          text,
  clickup_drivers_list_id   text,
  clickup_trucks_list_id    text,
  clickup_trailers_list_id  text,
  primary_color text default '#0f1117',
  accent_color  text default '#D4AF37'
);

insert into public.companies values
  ('carat', 'Carat Expedited INC',            '90060197372','900601443334','900601443333','900601443335','#0f1117','#D4AF37'),
  ('pft',   'Pro Freight Transportation INC', '90060203468','900601578064','900601578080','900601578082','#0f1117','#60A5FA')
on conflict (id) do nothing;

-- Drivers (links Supabase auth user to ClickUp record)
create table if not exists public.drivers (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade unique,
  company_id      text references public.companies(id),
  clickup_task_id text unique not null,
  name            text not null,
  email           text not null unique,
  is_admin        boolean default false,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- Driver stats (denormalized for fast reads)
create table if not exists public.driver_stats (
  driver_id         uuid references public.drivers(id) on delete cascade primary key,
  total_points      integer default 0,
  current_streak    integer default 0,
  longest_streak    integer default 0,
  last_pre_trip_date date,
  modules_completed integer default 0,
  updated_at        timestamptz default now()
);

-- Pre-trip inspection logs
create table if not exists public.pre_trip_logs (
  id            uuid default gen_random_uuid() primary key,
  driver_id     uuid references public.drivers(id) on delete cascade not null,
  company_id    text references public.companies(id),
  items         jsonb not null default '[]',
  has_issues    boolean default false,
  flagged_items text[] default '{}',
  notes         text default '',
  points_earned integer default 10,
  completed_at  timestamptz default now()
);

-- Coaching modules
create table if not exists public.coaching_modules (
  id               uuid default gen_random_uuid() primary key,
  title            text not null,
  description      text,
  category         text not null,   -- 'pre_trip' | 'hos_eld' | 'brakes_tires' | 'safe_driving'
  youtube_video_id text,
  duration_minutes integer default 5,
  points_value     integer default 50,
  quiz             jsonb default '[]',
  sort_order       integer default 0,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

-- Module completions
create table if not exists public.module_completions (
  id           uuid default gen_random_uuid() primary key,
  driver_id    uuid references public.drivers(id) on delete cascade not null,
  module_id    uuid references public.coaching_modules(id) not null,
  quiz_score   integer,
  quiz_passed  boolean default false,
  points_earned integer default 0,
  completed_at timestamptz default now(),
  unique(driver_id, module_id)
);

-- Points ledger (full history)
create table if not exists public.points_ledger (
  id         uuid default gen_random_uuid() primary key,
  driver_id  uuid references public.drivers(id) on delete cascade not null,
  company_id text references public.companies(id),
  points     integer not null,
  reason     text not null,
  category   text,   -- 'pre_trip' | 'module' | 'streak' | 'manual'
  created_at timestamptz default now()
);

-- Badges catalogue
create table if not exists public.badges (
  id          text primary key,
  name        text not null,
  icon        text not null,
  description text,
  requirement text
);

insert into public.badges values
  ('streak_7',    '7-Day Streak',    '🔥', 'Pre-trip 7 days in a row',    '7 consecutive pre-trips'),
  ('streak_30',   '30-Day Streak',   '⚡', 'Pre-trip 30 days in a row',   '30 consecutive pre-trips'),
  ('brake_master','Brake Master',    '🛑', 'Completed Brake & Tire module','Complete brakes module'),
  ('hos_pro',     'HOS Pro',         '⏱️', 'Completed HOS module',         'Complete HOS module'),
  ('top_inspector','Top Inspector',  '🔦', 'Completed Pre-Trip module',    'Complete pre-trip module'),
  ('clean_month', 'Clean Month',     '⭐', '30 clean pre-trips in a row',  '30 consecutive clean pre-trips'),
  ('pts_500',     '500 Club',        '🏅', 'Earned 500 total points',      'Reach 500 points'),
  ('pts_1000',    'Points Champion', '🏆', 'Earned 1,000 total points',    'Reach 1000 points')
on conflict (id) do nothing;

-- Driver badges earned
create table if not exists public.driver_badges (
  id         uuid default gen_random_uuid() primary key,
  driver_id  uuid references public.drivers(id) on delete cascade not null,
  badge_id   text references public.badges(id) not null,
  earned_at  timestamptz default now(),
  unique(driver_id, badge_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.drivers          enable row level security;
alter table public.driver_stats     enable row level security;
alter table public.pre_trip_logs    enable row level security;
alter table public.coaching_modules enable row level security;
alter table public.module_completions enable row level security;
alter table public.points_ledger    enable row level security;
alter table public.driver_badges    enable row level security;

-- Drivers: read own record
create policy "drivers_own" on public.drivers for select
  using (auth.uid() = user_id);

-- Drivers: admin reads all drivers in own company
create policy "drivers_admin_read" on public.drivers for select
  using (exists (
    select 1 from public.drivers d
    where d.user_id = auth.uid() and d.is_admin = true and d.company_id = company_id
  ));

-- Drivers: admin can insert/update drivers in own company (for adding new drivers)
create policy "drivers_admin_write" on public.drivers for all
  using (exists (
    select 1 from public.drivers d
    where d.user_id = auth.uid() and d.is_admin = true
  ));

-- Stats: own + admin
create policy "stats_own" on public.driver_stats for all
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
create policy "stats_admin" on public.driver_stats for select
  using (exists (select 1 from public.drivers d where d.user_id = auth.uid() and d.is_admin = true));

-- Pre-trip: own + admin read
create policy "pretip_own" on public.pre_trip_logs for all
  using (driver_id = (select id from public.drivers where user_id = auth.uid()))
  with check (driver_id = (select id from public.drivers where user_id = auth.uid()));
create policy "pretip_admin" on public.pre_trip_logs for select
  using (exists (
    select 1 from public.drivers d
    where d.user_id = auth.uid() and d.is_admin = true and d.company_id = company_id
  ));

-- Modules: everyone reads active modules
create policy "modules_read" on public.coaching_modules for select using (is_active = true);

-- Completions: own + admin
create policy "completions_own" on public.module_completions for all
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
create policy "completions_admin" on public.module_completions for select
  using (exists (select 1 from public.drivers d where d.user_id = auth.uid() and d.is_admin = true));

-- Points: own + admin
create policy "points_own" on public.points_ledger for all
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
create policy "points_admin" on public.points_ledger for select
  using (exists (
    select 1 from public.drivers d
    where d.user_id = auth.uid() and d.is_admin = true and d.company_id = company_id
  ));

-- Badges: own + admin
create policy "badges_own" on public.driver_badges for select
  using (driver_id = (select id from public.drivers where user_id = auth.uid()));
create policy "badges_admin" on public.driver_badges for select
  using (exists (select 1 from public.drivers d where d.user_id = auth.uid() and d.is_admin = true));

-- ============================================================
-- Seed coaching modules
-- ============================================================
insert into public.coaching_modules (title, description, category, youtube_video_id, duration_minutes, points_value, sort_order, quiz) values
(
  'Pre-Trip Inspection: The Right Way',
  'Covers all 10 key inspection points. This is why our #1 violations are lighting and tires — learn what to look for before you roll.',
  'pre_trip', 'LGwRifTTLbE', 8, 50, 1,
  '[{"question":"How often is a pre-trip inspection required?","options":["Only after an incident","Every trip, before you drive","Once a week","Before long hauls only"],"correct":1,"explanation":"Federal regulations require a pre-trip before every trip without exception."},{"question":"A cracked tire sidewall means:","options":["Drive carefully and monitor it","Do not drive — report it immediately","Add air and continue","Only replace if fully flat"],"correct":1,"explanation":"A cracked sidewall is an immediate OOS condition. Never drive with a cracked sidewall."},{"question":"Clearance lamps must be checked:","options":["Only at night","Only in bad weather","Every pre-trip, regardless of time","Monthly"],"correct":2,"explanation":"Clearance lamps must function at all times and must be inspected every pre-trip."},{"question":"The most common OOS brake defect is:","options":["Worn brake pads","Brakes out of adjustment","Brake dust on drums","Low brake fluid"],"correct":1,"explanation":"Out-of-adjustment brakes are the #1 OOS brake defect. Learn to identify pushrod stroke."},{"question":"DVIR stands for:","options":["Driver Vehicle Inspection Report","Daily Vehicle Inspection Requirement","Department Vehicle Incident Record","Driver Violation Incident Review"],"correct":0,"explanation":"DVIR is required before and after every trip. Defects found must be acknowledged."}]'
),
(
  'HOS & ELD: Stay Compliant',
  'Hours of Service rules and proper ELD use. False Logs is our #2 most cited violation — learn what it means and how to avoid it.',
  'hos_eld', 'eGMCt9_HMKM', 10, 50, 2,
  '[{"question":"Maximum driving time in a 14-hour window:","options":["10 hours","11 hours","12 hours","14 hours"],"correct":1,"explanation":"11 hours max driving within a 14-hour on-duty window after 10 consecutive hours off."},{"question":"False Log violation means:","options":["You forgot to log a break","ELD malfunctioned","Logs do not match actual driving hours","You missed a form field"],"correct":2,"explanation":"False logs means recorded hours do not reflect reality — a serious federal violation."},{"question":"If your ELD malfunctions:","options":["Stop driving","Switch to paper logs and notify carrier within 24 hours","Drive until shift ends","Call FMCSA directly"],"correct":1,"explanation":"ELD malfunctions require paper logs and carrier notification within 24 hours."},{"question":"The 30-minute break rule applies after:","options":["8 hours on-duty","8 cumulative hours of driving","Every 4 hours","6 hours of driving"],"correct":1,"explanation":"A 30-minute non-driving break is required after 8 cumulative hours of driving."},{"question":"When a DOT officer requests ELD records:","options":["Show on your phone screen","Transfer electronically or via display","Print them first","Refuse until dispatch is contacted"],"correct":1,"explanation":"ELD records must be transferable electronically or displayable. Know your device."}]'
),
(
  'Tires & Brakes: Know Before You Roll',
  'Tires have a 55% OOS rate in our fleet. Brakes 56%. These are expensive. Learn what to look for every morning.',
  'brakes_tires', 'fh3BoKOF4HQ', 7, 50, 3,
  '[{"question":"Minimum tread depth for front tires:","options":["2/32 inch","4/32 inch","6/32 inch","8/32 inch"],"correct":1,"explanation":"Front tires need at least 4/32 inch. Other tires need 2/32 inch. Use a gauge."},{"question":"A tire with an exposed ply or cord:","options":["Is OK if not leaking","Needs monitoring","Is an immediate OOS condition","Needs replacement within 24 hours"],"correct":2,"explanation":"Any exposed ply or cord is an immediate OOS violation. Do not drive."},{"question":"Brake adjustment is measured by:","options":["Pedal feel","Pushrod stroke (travel)","Pad thickness","Drum temperature"],"correct":1,"explanation":"Brake adjustment is checked by measuring pushrod stroke. Excessive stroke = OOS."},{"question":"To properly check brake adjustment:","options":["Apply brakes hard and feel for pull","Chock wheels and measure pushrod stroke","Check brake fluid level","Listen for squealing"],"correct":1,"explanation":"Proper check requires chocked wheels, operating air pressure, and measuring pushrod stroke at each chamber."},{"question":"Rear tire tread at 3/32 inch:","options":["Must be replaced immediately","Passes — minimum is 2/32","Needs monitoring only","Must be reported to dispatch"],"correct":1,"explanation":"3/32 exceeds the 2/32 minimum for non-front tires. However, 4/32+ is recommended for safety."}]'
),
(
  'Speeding & Safe Driving',
  'Lane restrictions, seat belts, speed. Small violations that add big CSA points. Easy to avoid.',
  'safe_driving', 'zEbT9y-NZWA', 5, 50, 4,
  '[{"question":"Speeding 15+ MPH over the limit is classified as:","options":["A minor infraction","A serious traffic violation","Only an issue in school zones","Not tracked by CSA"],"correct":1,"explanation":"15+ MPH over is a Serious Traffic Violation. Multiple offenses can cause driver disqualification."},{"question":"Lane restriction signs apply to:","options":["Only trucks over 80,000 lbs","All CMVs as posted","Only during rush hour","Only on highways"],"correct":1,"explanation":"Lane restriction signs apply to all CMVs as posted. Violations are citable."},{"question":"Seat belt in a CMV is:","options":["Optional on local routes","Required at all times when moving","Only required on highways","Only for the driver"],"correct":1,"explanation":"Federal law requires seat belt use at all times when the CMV is in motion. Zero exceptions."},{"question":"CSA violations stay on your record for:","options":["Up to 24 months","Up to 12 months","Permanently","Until you change companies"],"correct":0,"explanation":"CSA violations remain for 24 months. Multiple violations in short periods have multiplied impact."},{"question":"Best defense against a speeding citation:","options":["Know speed limit changes on your route","Keep cruise 5 mph under the limit","Use a radar detector","Slow down near weigh stations only"],"correct":0,"explanation":"Know and follow posted limits, including work zone reductions. No shortcut."}]'
)
on conflict do nothing;
