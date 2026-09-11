-- Un upsert Storage exige SELECT en plus de INSERT et UPDATE.
-- La lecture accordée ici reste limitée au dossier du médecin connecté.

begin;

create policy doctor_avatar_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'doctor-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
