-- KITAPVERSE: RESTORE STUDENT ACCOUNT <-> PROFILE LINKS
-- Run once in Supabase SQL Editor. Safe for student results/books/questions.
-- It does NOT create/delete Auth accounts and does NOT reset progress.

create or replace function public.link_all_student_profiles()
returns integer
language plpgsql
security definer
set search_path=public,auth as $$
declare
  v_count integer := 0;
begin
  if coalesce(auth.jwt()->>'email','') <> 'imankulovmagzan56@gmail.com' then
    raise exception 'admin authentication required';
  end if;

  -- Remove stale UUID links only where the profile's IIN matches an existing Auth account.
  update public.student_profiles sp
    set auth_user_id = u.id, updated_at = now()
  from auth.users u
  where lower(coalesce(u.email,'')) = lower(sp.iin_login || '@students.kitapverse.local')
    and sp.active = true
    and sp.auth_user_id is distinct from u.id;

  get diagnostics v_count = row_count;
  return v_count;
end; $$;

grant execute on function public.link_all_student_profiles() to authenticated;

-- Preview after running (optional):
-- select sp.iin_login, sp.full_name, sp.class_name, sp.auth_user_id,
--        u.email
-- from public.student_profiles sp
-- left join auth.users u on u.id=sp.auth_user_id
-- order by sp.class_name, sp.full_name;
