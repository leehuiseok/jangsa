-- 사장님 메뉴 사진 업로드용 Storage 버킷
-- references/{userId}/{filename} 구조

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'references',
  'references',
  true,
  10 * 1024 * 1024,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 인증된 사장님은 자기 폴더(userId)에만 업로드 가능
drop policy if exists "Owners upload to own folder" on storage.objects;
create policy "Owners upload to own folder" on storage.objects
  for insert
  with check (
    bucket_id = 'references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 자기 파일 삭제 가능
drop policy if exists "Owners delete own references" on storage.objects;
create policy "Owners delete own references" on storage.objects
  for delete
  using (
    bucket_id = 'references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (Runway가 다운로드해야 하므로)
drop policy if exists "Public read references" on storage.objects;
create policy "Public read references" on storage.objects
  for select
  using (bucket_id = 'references');
