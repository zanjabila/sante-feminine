-- Rubriques d'informations personnalisées par médecin.
-- Deux rubriques au maximum, en plus des informations générales toujours visibles.

begin;

alter table public.medecins
  add column if not exists featured_info_categories text[] not null default '{}'::text[];

alter table public.medecins
  drop constraint if exists medecins_featured_info_categories_max_two;

alter table public.medecins
  add constraint medecins_featured_info_categories_max_two
  check (cardinality(featured_info_categories) <= 2);

drop function if exists public.my_medecin_profile();

create function public.my_medecin_profile()
returns table (
  id uuid,
  prenom text,
  nom text,
  specialite text,
  message_bienvenue text,
  rdv_link text,
  ville text,
  featured_info_categories text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.prenom, m.nom, m.specialite,
         m.message_bienvenue, m.rdv_link, m.ville,
         m.featured_info_categories
  from public.patientes p
  join public.medecins m on m.id = p.medecin_id
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.my_medecin_profile() from public;
grant execute on function public.my_medecin_profile() to authenticated;

commit;
