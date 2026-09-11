-- Les mises en avant pointent désormais vers des articles réels du médecin.

begin;

alter table public.medecins
  add column if not exists featured_article_ids uuid[] not null default '{}'::uuid[];

alter table public.medecins
  drop constraint if exists medecins_featured_article_ids_max_two;

alter table public.medecins
  add constraint medecins_featured_article_ids_max_two
  check (cardinality(featured_article_ids) <= 2);

-- Ces deux contenus existaient auparavant uniquement dans le HTML patient.
-- Ils deviennent de vrais articles, donc modifiables depuis l'espace médecin.
insert into public.articles (titre, contenu, categorie, medecin_id, actif_ia)
select 'Documents à apporter',
       'Listez les documents nécessaires pour chaque consultation.',
       'infos-generales', m.id, true
from public.medecins m
where not exists (
  select 1 from public.articles a
  where a.medecin_id = m.id and lower(a.titre) = lower('Documents à apporter')
);

insert into public.articles (titre, contenu, categorie, medecin_id, actif_ia)
select 'Urgences gynécologiques et obstétricales',
       'Précisez vos consignes en cas d''urgence.',
       'infos-generales', m.id, true
from public.medecins m
where not exists (
  select 1 from public.articles a
  where a.medecin_id = m.id
    and lower(a.titre) = lower('Urgences gynécologiques et obstétricales')
);

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
  featured_info_categories text[],
  featured_article_ids uuid[]
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.prenom, m.nom, m.specialite,
         m.message_bienvenue, m.rdv_link, m.ville,
         m.featured_info_categories, m.featured_article_ids
  from public.patientes p
  join public.medecins m on m.id = p.medecin_id
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.my_medecin_profile() from public;
grant execute on function public.my_medecin_profile() to authenticated;

commit;
