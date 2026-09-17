-- KITAPVERSE ACCOUNT LINK SETUP
-- Run this ONCE in Supabase SQL Editor.
-- It does NOT create/delete users and does NOT change passwords.
-- It only connects existing Auth users to existing student_profiles by IIN.

create or replace function public.link_my_student_profile()
returns public.student_profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_iin text;
  v_email text;
  v_row public.student_profiles;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  v_email := lower(coalesce(auth.jwt()->>'email', ''));
  if v_email not like '%@students.kitapverse.local' then
    raise exception 'invalid student login';
  end if;

  v_iin := split_part(v_email, '@', 1);
  if v_iin !~ '^[0-9]{12}$' then
    raise exception 'student login email must contain a 12-digit IIN';
  end if;

  -- The IIN is the source of truth. Replace an obsolete UUID link if needed.
  update public.student_profiles
     set auth_user_id = auth.uid(), updated_at = now()
   where iin_login = v_iin
     and active = true
   returning * into v_row;

  if not found then
    raise exception 'student profile not found for IIN %', v_iin;
  end if;

  return v_row;
end;
$$;

grant execute on function public.link_my_student_profile() to authenticated;

create or replace function public.claim_my_student_profile()
returns public.student_profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_iin text;
  v_email text;
  v_row public.student_profiles;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  v_email := lower(coalesce(auth.jwt()->>'email', ''));
  v_iin := split_part(v_email, '@', 1);

  if v_iin !~ '^[0-9]{12}$' then
    raise exception 'invalid student login email';
  end if;

  update public.student_profiles
     set auth_user_id = auth.uid(), updated_at = now()
   where iin_login = v_iin
     and active = true
   returning * into v_row;

  if not found then
    raise exception 'student profile not found for IIN %', v_iin;
  end if;

  return v_row;
end;
$$;

grant execute on function public.claim_my_student_profile() to authenticated;

-- Make sure students can read their own linked profile and their own progress.
alter table public.student_profiles enable row level security;
drop policy if exists "Students can read own profile" on public.student_profiles;
create policy "Students can read own profile"
on public.student_profiles for select to authenticated
using (auth_user_id = auth.uid());

grant select on public.student_profiles to authenticated;

-- Verification after signing in as a student:
-- select id, iin_login, full_name, class_name, auth_user_id
-- from public.student_profiles
-- where auth_user_id = auth.uid();
