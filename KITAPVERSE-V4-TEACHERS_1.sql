-- KITAPVERSE: сынып жетекшілері (Supabase → SQL Editor → New query → Run, бір рет; қайта іске қосуға болады)
create table if not exists public.class_teachers (
  class_name text primary key,
  teacher_name text not null,
  updated_at timestamptz not null default now()
);
alter table public.class_teachers enable row level security;
drop policy if exists "Public reads class_teachers" on public.class_teachers;
create policy "Public reads class_teachers" on public.class_teachers for select to anon, authenticated using (true);
grant select on public.class_teachers to anon, authenticated;

-- Тек әкімші өзгерте алады. Аты бос болса — жетекші өшіріледі.
create or replace function public.kv_set_class_teacher(p_class text, p_name text) returns void
language plpgsql security definer set search_path=public as $$
declare c text:=public.kv_norm_class(p_class); n text:=nullif(trim(coalesce(p_name,'')),'');
begin
  if not public.is_kitapverse_admin() then raise exception 'admin authentication required'; end if;
  if coalesce(c,'')='' then raise exception 'class is required'; end if;
  if n is null then delete from public.class_teachers where class_name=c;
  else insert into public.class_teachers(class_name,teacher_name,updated_at) values(c,left(n,120),now())
       on conflict(class_name) do update set teacher_name=excluded.teacher_name, updated_at=now();
  end if;
end; $$;
grant execute on function public.kv_set_class_teacher(text,text) to authenticated;
