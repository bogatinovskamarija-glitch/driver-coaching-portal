-- ============================================================
-- Fleet document storage
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- BEFORE running this SQL:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket called exactly:  fleet-documents
-- 3. Set it to PRIVATE (do not enable public access)
-- Then run this SQL.
-- ============================================================

create table if not exists public.fleet_documents (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  description text,
  file_path   text not null,           -- path inside the fleet-documents bucket
  file_type   text,                    -- mime type
  file_size   bigint,
  category    text default 'general',  -- 'insurance','registration','permit','hos','general'
  fleet       text default 'all',      -- 'all' | 'carat' | 'pft'
  uploaded_by uuid references public.drivers(id),
  created_at  timestamptz default now()
);

alter table public.fleet_documents enable row level security;

-- Admins can do everything
create policy "fleet_docs_admin" on public.fleet_documents for all
  using (public.is_admin());

-- Drivers can see documents for their fleet or fleet = 'all'
create policy "fleet_docs_driver_read" on public.fleet_documents for select
  using (
    fleet = 'all'
    or fleet = (select company_id from public.drivers where user_id = auth.uid())
  );

-- Storage bucket policies (run these too)
-- These let authenticated users read files and admins upload/delete

insert into storage.buckets (id, name, public)
  values ('fleet-documents', 'fleet-documents', false)
  on conflict (id) do nothing;

create policy "fleet_docs_storage_read" on storage.objects for select
  to authenticated
  using (bucket_id = 'fleet-documents');

create policy "fleet_docs_storage_admin_insert" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fleet-documents' and public.is_admin());

create policy "fleet_docs_storage_admin_delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'fleet-documents' and public.is_admin());
