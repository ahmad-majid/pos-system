-- ============================================================
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query
-- Adds logo_url column to settings + creates storage bucket
-- ============================================================

-- 1. Add logo_url column to settings
alter table settings add column if not exists logo_url text;

-- 2. Create storage bucket for logos (public so the img tag can load it)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- 3. Storage policy — allow anon to upload/read/delete logos
create policy "anon_upload_logos"
  on storage.objects for insert
  with check (bucket_id = 'logos');

create policy "anon_read_logos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "anon_delete_logos"
  on storage.objects for delete
  using (bucket_id = 'logos');
