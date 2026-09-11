-- Photo publique du professionnel, téléversée uniquement par son propriétaire.

begin;

alter table public.medecins
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-avatars', 'doctor-avatars', true, 5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists doctor_avatar_insert_own on storage.objects;
create policy doctor_avatar_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'doctor-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.medecins m where m.id = auth.uid())
);

drop policy if exists doctor_avatar_update_own on storage.objects;
create policy doctor_avatar_update_own
on storage.objects for update to authenticated
using (bucket_id = 'doctor-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'doctor-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists doctor_avatar_delete_own on storage.objects;
create policy doctor_avatar_delete_own
on storage.objects for delete to authenticated
using (bucket_id = 'doctor-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop function if exists public.my_medecin_profile();

create function public.my_medecin_profile()
returns table (
  id uuid, prenom text, nom text, specialite text,
  message_bienvenue text, rdv_link text, ville text,
  featured_info_categories text[], featured_article_ids uuid[], photo_url text
)
language sql stable security definer set search_path = public
as $function$
  select m.id, m.prenom, m.nom, m.specialite,
         m.message_bienvenue, m.rdv_link, m.ville,
         m.featured_info_categories, m.featured_article_ids, m.photo_url
  from public.patientes p
  join public.medecins m on m.id = p.medecin_id
  where p.id = auth.uid()
  limit 1;
$function$;

revoke all on function public.my_medecin_profile() from public;
grant execute on function public.my_medecin_profile() to authenticated;

commit;
