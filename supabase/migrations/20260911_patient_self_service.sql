-- Espace patiente : suppression sécurisée de son propre compte.
begin;

create or replace function public.delete_my_patient_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (select 1 from public.patientes where id = current_user_id) then
    raise exception 'Patient account required';
  end if;

  delete from public.patientes where id = current_user_id;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_my_patient_account() from public;
grant execute on function public.delete_my_patient_account() to authenticated;

commit;
