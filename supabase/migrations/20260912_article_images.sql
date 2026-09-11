-- Public educational illustrations only: never upload patient photographs or records.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('article-images','article-images',true,5242880,array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;
create policy "Admins upload educational article images"
on storage.objects for insert to authenticated
with check (bucket_id='article-images' and public.is_admin());
-- Public bucket reads are served by Storage public URLs.
-- No anonymous uploads and no permission to overwrite existing objects.
