-- Santé Féminine — durcissement pilote (non destructif)
-- À exécuter dans Supabase SQL Editor avec un compte propriétaire du projet.

begin;

alter table public.medecins enable row level security;
alter table public.patientes enable row level security;
alter table public.articles enable row level security;

alter table public.medecins
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists subscription_status text not null default 'trial';

-- Les anciens droits larges sont retirés avant de poser une politique explicite.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('medecins', 'patientes', 'articles')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

revoke all on function public.current_role() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

create or replace function public.protect_medecin_billing_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and (
    new.trial_ends_at is distinct from old.trial_ends_at
    or new.subscription_status is distinct from old.subscription_status
  ) then
    raise exception 'Billing fields can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_medecin_billing_fields on public.medecins;
create trigger protect_medecin_billing_fields
before update on public.medecins
for each row execute function public.protect_medecin_billing_fields();

-- Une patiente ne voit que sa fiche. Un médecin voit uniquement ses patientes.
create policy patientes_select_self_or_doctor
on public.patientes for select to authenticated
using (id = auth.uid() or medecin_id = auth.uid() or public.is_admin());

create policy patientes_update_self
on public.patientes for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and medecin_id = (select p.medecin_id from public.patientes p where p.id = auth.uid()));

-- Le médecin gère sa propre fiche. Sa patiente peut lire uniquement les champs
-- exposés par la vue/RPC ci-dessous, jamais toute la ligne medecins.
create policy medecins_select_self_or_admin
on public.medecins for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy medecins_update_self
on public.medecins for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Articles généraux lisibles par les comptes connectés. Articles cabinet :
-- uniquement le médecin propriétaire et ses patientes.
create policy articles_select_scoped
on public.articles for select to authenticated
using (
  medecin_id is null
  or medecin_id = auth.uid()
  or exists (
    select 1 from public.patientes p
    where p.id = auth.uid() and p.medecin_id = articles.medecin_id
  )
  or public.is_admin()
);

create policy articles_insert_owner_or_admin
on public.articles for insert to authenticated
with check (
  (medecin_id = auth.uid() and exists (select 1 from public.medecins m where m.id = auth.uid()))
  or (medecin_id is null and public.is_admin())
);

create policy articles_update_owner_or_admin
on public.articles for update to authenticated
using (medecin_id = auth.uid() or (medecin_id is null and public.is_admin()))
with check (medecin_id = auth.uid() or (medecin_id is null and public.is_admin()));

create policy articles_delete_owner_or_admin
on public.articles for delete to authenticated
using (medecin_id = auth.uid() or (medecin_id is null and public.is_admin()));

-- Résolution minimale d'un code d'invitation. Aucun email, INAMI ou champ privé
-- n'est rendu public. Le code reste nécessaire à l'inscription patiente.
create or replace function public.resolve_medecin_code(invitation_code text)
returns table (id uuid, prenom text, nom text, specialite text)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.prenom, m.nom, m.specialite
  from public.medecins m
  where upper(m.code_acces) = upper(trim(invitation_code))
  limit 1;
$$;

revoke all on function public.resolve_medecin_code(text) from public;
grant execute on function public.resolve_medecin_code(text) to anon, authenticated;

-- Profil public du médecin, accessible seulement à sa patiente connectée.
create or replace function public.my_medecin_profile()
returns table (
  id uuid, prenom text, nom text, specialite text,
  message_bienvenue text, rdv_link text, ville text
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.prenom, m.nom, m.specialite,
         m.message_bienvenue, m.rdv_link, m.ville
  from public.patientes p
  join public.medecins m on m.id = p.medecin_id
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.my_medecin_profile() from public;
grant execute on function public.my_medecin_profile() to authenticated;

-- Le lien médecin/patiente est résolu dans la base à partir du code. Un appelant
-- ne peut donc pas fabriquer directement un medecin_id dans les métadonnées.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  doctor_id uuid;
begin
  if requested_role = 'patiente' then
    select m.id into doctor_id
    from public.medecins m
    where upper(m.code_acces) = upper(trim(new.raw_user_meta_data ->> 'invitation_code'))
    limit 1;
    if doctor_id is null then
      raise exception 'Invalid invitation code';
    end if;
    insert into public.patientes (id, email, prenom, nom, medecin_id)
    values (new.id, new.email, new.raw_user_meta_data ->> 'prenom',
            new.raw_user_meta_data ->> 'nom', doctor_id);
  elsif requested_role = 'medecin' then
    insert into public.medecins
      (id, email, prenom, nom, specialite, inami, code_acces, trial_ends_at, subscription_status)
    values
      (new.id, new.email, new.raw_user_meta_data ->> 'prenom',
       new.raw_user_meta_data ->> 'nom', new.raw_user_meta_data ->> 'specialite',
       nullif(new.raw_user_meta_data ->> 'inami', ''),
       'DOC-' || upper(substr(md5(new.id::text), 1, 5)),
       now() + interval '14 days', 'trial');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create unique index if not exists medecins_code_acces_upper_uidx
  on public.medecins (upper(code_acces));
create index if not exists patientes_medecin_id_idx on public.patientes (medecin_id);
create index if not exists articles_medecin_actif_idx on public.articles (medecin_id, actif_ia);

commit;
