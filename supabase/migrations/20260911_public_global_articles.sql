-- Les fiches générales actives sont du contenu éducatif public.
-- Les fiches privées des médecins restent protégées par RLS.
alter table public.articles enable row level security;

drop policy if exists "Public can read active global articles" on public.articles;
create policy "Public can read active global articles"
on public.articles
for select
to anon, authenticated
using (medecin_id is null and actif_ia = true);
