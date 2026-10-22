-- ======================================================================
-- KITAPVERSE V4  (Supabase → SQL Editor → New query → Run, БІР РЕТ жеткілікті)
--   1) Сыныптар статистикасы: кім бүгін кірді, кім квест/викторина тапсырды
--   2) Сыныптар рейтингі: орташа балл (1 оқушыға шаққанда) — үлкен сыныпқа артықшылық жоқ
--   3) Battle: бірнеше сынып + кітап топтары (6А, 7А — бір кітап; 6Б — орысша сұрақтар)
--   4) Мектептер лигасы (екі мектеп арасындағы Battle, кесте: жеңіс 3, тең 1, жеңіліс 0)
-- Қайта іске қосуға болады (қауіпсіз).
-- ======================================================================

-- (бар болса, ештеңе өзгермейді)
alter table public.quiz_attempts add column if not exists xp_applied boolean not null default false;

-- ---------- Көмекші функциялар ----------
create or replace function public.kv_norm_class(p text) returns text
language sql immutable as $$
  select translate(upper(regexp_replace(trim(coalesce(p,'')),'\s+','','g')),'ABEKMHOPCTXY','АВЕКМНОРСТХУ')
$$;

create or replace function public.kv_norm_name(p text) returns text
language sql immutable as $$
  select lower(regexp_replace(trim(coalesce(p,'')),'\s+','','g'))
$$;

create or replace function public.kv_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Qyzylorda')::date $$;

create or replace function public.kv_day(ts timestamptz) returns date
language sql stable as $$ select (ts at time zone 'Asia/Qyzylorda')::date $$;

-- ======================================================================
-- 1) КІРГЕН ОҚУШЫЛАР + СЫНЫПТАР СТАТИСТИКАСЫ
-- ======================================================================
alter table public.student_profiles add column if not exists last_seen_at timestamptz;

create or replace function public.kv_touch_login() returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then return; end if;
  update public.student_profiles set last_seen_at=now() where auth_user_id=auth.uid();
end; $$;
grant execute on function public.kv_touch_login() to authenticated;

-- Оқушылар саны: профильдер бойынша; профиль жоқ сыныпта — class_limits мәні
create or replace function public.kv_class_sizes()
returns table(cls text, total integer)
language sql stable security definer set search_path=public as $$
  with p as (
    select public.kv_norm_class(class_name) c, count(*)::integer n
    from public.student_profiles where active group by 1
  ), l as (
    select public.kv_norm_class(class_name) c, max(attempt_limit)::integer n
    from public.class_limits group by 1
  ), allc as (
    select c from p union select c from l union select public.kv_norm_class(class_name) from public.class_xp
  )
  select allc.c, coalesce(nullif(p.n,0), l.n, 0)
  from allc left join p on p.c=allc.c left join l on l.c=allc.c
  where allc.c<>''
$$;

create or replace function public.kv_class_stats()
returns table(class_name text, total integer, logged_today integer,
              quest_today integer, quest_all integer, quiz_today integer, quiz_all integer)
language sql stable security definer set search_path=public as $$
  with pf as (
    select id, public.kv_norm_class(class_name) c, public.kv_norm_name(full_name) n, last_seen_at
    from public.student_profiles where active
  ), qa as (
    select public.kv_norm_class(class_name) c, public.kv_norm_name(student_name) n, created_at
    from public.quest_attempts
  ), za as (
    select public.kv_norm_class(class_name) c, public.kv_norm_name(student_name) n, created_at
    from public.quiz_attempts where question_id is not null
  )
  select s.cls, s.total,
    coalesce((select count(*) from pf where pf.c=s.cls and pf.last_seen_at is not null and public.kv_day(pf.last_seen_at)=public.kv_today()),0)::integer,
    coalesce((select count(distinct pf.id) from pf join qa on qa.c=pf.c and qa.n=pf.n where pf.c=s.cls and public.kv_day(qa.created_at)=public.kv_today()),0)::integer,
    coalesce((select count(distinct pf.id) from pf join qa on qa.c=pf.c and qa.n=pf.n where pf.c=s.cls),0)::integer,
    coalesce((select count(distinct pf.id) from pf join za on za.c=pf.c and za.n=pf.n where pf.c=s.cls and public.kv_day(za.created_at)=public.kv_today()),0)::integer,
    coalesce((select count(distinct pf.id) from pf join za on za.c=pf.c and za.n=pf.n where pf.c=s.cls),0)::integer
  from public.kv_class_sizes() s
  order by s.cls
$$;
grant execute on function public.kv_class_stats() to anon, authenticated;

-- ======================================================================
-- 2) СЫНЫПТАР РЕЙТИНГІ: орташа балл (оқушыға шаққанда) + қатысу пайызы
-- ======================================================================
create or replace function public.kv_class_rating()
returns table(class_name text, total integer, xp integer, avg_xp numeric, participants integer, participation_pct numeric)
language sql stable security definer set search_path=public as $$
  with sizes as (select cls, total from public.kv_class_sizes()),
  xps as (select public.kv_norm_class(class_name) c, sum(xp)::integer xp from public.class_xp group by 1),
  pf as (
    select id, public.kv_norm_class(class_name) c, public.kv_norm_name(full_name) n
    from public.student_profiles where active
  ), acts as (
    select public.kv_norm_class(class_name) c, public.kv_norm_name(student_name) n from public.quest_attempts
    union select public.kv_norm_class(class_name), public.kv_norm_name(student_name) from public.quiz_attempts
    union select public.kv_norm_class(class_name), public.kv_norm_name(student_name) from public.battle_attempts
  )
  select s.cls, s.total, coalesce(x.xp,0),
    case when s.total>0 then round(coalesce(x.xp,0)::numeric/s.total,1) else 0 end,
    coalesce((select count(distinct pf.id) from pf join acts a on a.c=pf.c and a.n=pf.n where pf.c=s.cls),0)::integer,
    case when s.total>0 then round(100.0*coalesce((select count(distinct pf.id) from pf join acts a on a.c=pf.c and a.n=pf.n where pf.c=s.cls),0)/s.total,0) else 0 end
  from sizes s left join xps x on x.c=s.cls
  order by 4 desc, 3 desc
$$;
grant execute on function public.kv_class_rating() to anon, authenticated;

-- ======================================================================
-- 3) BATTLE: топтар (сыныптар + кітап + өз сұрақтары)
-- ======================================================================
create table if not exists public.battle_groups (
  id bigint generated by default as identity primary key,
  battle_id bigint not null references public.battles(id) on delete cascade,
  classes text not null,          -- "6А, 7А"
  book_title text not null,       -- осы топқа арналған кітап атауы (орыс сыныпқа — орысша)
  created_at timestamptz default now()
);
alter table public.battle_groups enable row level security;
drop policy if exists "Public can read battle_groups" on public.battle_groups;
create policy "Public can read battle_groups" on public.battle_groups for select to anon, authenticated using (true);
drop policy if exists "Admin manages battle_groups" on public.battle_groups;
create policy "Admin manages battle_groups" on public.battle_groups for all to authenticated
  using (public.is_kitapverse_admin()) with check (public.is_kitapverse_admin());

alter table public.battle_questions add column if not exists group_id bigint references public.battle_groups(id) on delete cascade;
alter table public.battle_attempts  add column if not exists group_id bigint references public.battle_groups(id) on delete set null;
alter table public.battle_attempts  add column if not exists began_at timestamptz default now();

drop view if exists public.battle_questions_public;
create view public.battle_questions_public as
  select id,battle_id,group_id,question,option_a,option_b,option_c,option_d,created_at from public.battle_questions;
grant select on public.battle_questions_public to anon, authenticated;

-- Battle + топтар + сұрақтар бір мезгілде (тек әкімші)
create or replace function public.create_battle_full(p_title text, p_date timestamptz, p_groups jsonb)
returns bigint language plpgsql security definer set search_path=public as $$
declare bid bigint; g jsonb; gid bigint; q jsonb; cl text; all_classes text[]:='{}'; grp_classes text[]; norm text;
begin
  if not public.is_kitapverse_admin() then raise exception 'admin authentication required'; end if;
  if nullif(trim(p_title),'') is null then raise exception 'title is required'; end if;
  if p_date is null then raise exception 'date is required'; end if;
  if jsonb_typeof(p_groups)<>'array' or jsonb_array_length(p_groups)<1 then raise exception 'groups are required'; end if;
  insert into public.battles(title,classes,battle_date) values(trim(p_title),'',p_date) returning id into bid;
  for g in select value from jsonb_array_elements(p_groups) loop
    grp_classes:='{}';
    for cl in select jsonb_array_elements_text(g->'classes') loop
      norm:=public.kv_norm_class(cl);
      if norm='' then continue; end if;
      if norm=any(all_classes) then raise exception 'class % is in two groups', norm; end if;
      all_classes:=all_classes||norm; grp_classes:=grp_classes||norm;
    end loop;
    if coalesce(array_length(grp_classes,1),0)=0 then raise exception 'each group needs classes'; end if;
    if nullif(trim(g->>'book_title'),'') is null then raise exception 'each group needs a book title'; end if;
    if jsonb_typeof(g->'questions')<>'array' or jsonb_array_length(g->'questions')<1 then raise exception 'each group needs questions'; end if;
    insert into public.battle_groups(battle_id,classes,book_title)
      values(bid,array_to_string(grp_classes,', '),trim(g->>'book_title')) returning id into gid;
    for q in select value from jsonb_array_elements(g->'questions') loop
      if nullif(trim(q->>'question'),'') is null or nullif(trim(q->>'option_a'),'') is null or nullif(trim(q->>'option_b'),'') is null
         or nullif(trim(q->>'option_c'),'') is null or nullif(trim(q->>'option_d'),'') is null then raise exception 'question fields are required'; end if;
      insert into public.battle_questions(battle_id,group_id,question,option_a,option_b,option_c,option_d,correct_option)
      values(bid,gid,trim(q->>'question'),trim(q->>'option_a'),trim(q->>'option_b'),trim(q->>'option_c'),trim(q->>'option_d'),lower(q->>'correct_option'));
    end loop;
  end loop;
  update public.battles set classes=array_to_string(all_classes,', ') where id=bid;
  return bid;
end; $$;
grant execute on function public.create_battle_full(text,timestamptz,jsonb) to authenticated;

-- Қатысуды бастау: сынып тобы анықталады, нақты бастау уақыты сақталады
create or replace function public.start_battle_attempt(p_battle_id bigint,p_student_name text,p_class_name text)
returns table(attempt_id bigint,started_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare b record; existing record; norm_name text; norm_class text; lim integer; used integer; allowed boolean; gid bigint; has_groups boolean; qcount integer;
begin
  if nullif(trim(p_student_name),'') is null or nullif(trim(p_class_name),'') is null then raise exception 'name and class are required'; end if;
  select * into b from public.battles where id=p_battle_id;
  if b.id is null then raise exception 'battle not found'; end if;
  if now() < b.battle_date then raise exception 'battle is not active'; end if;
  if now() >= b.battle_date + interval '30 minutes' then raise exception 'battle is over'; end if;
  norm_name:=public.kv_norm_name(p_student_name);
  norm_class:=public.kv_norm_class(p_class_name);
  select attempt_limit into lim from public.class_limits where public.kv_norm_class(class_name)=norm_class;
  if lim is null then raise exception 'class is not configured'; end if;
  has_groups:=exists(select 1 from public.battle_groups where battle_id=p_battle_id);
  if has_groups then
    select g.id into gid from public.battle_groups g
     where g.battle_id=p_battle_id
       and exists(select 1 from unnest(string_to_array(regexp_replace(g.classes,'\s*,\s*',','),',')) x where public.kv_norm_class(x)=norm_class)
     limit 1;
    allowed:=gid is not null;
  else
    allowed:=exists(select 1 from unnest(string_to_array(regexp_replace(coalesce(b.classes,''),'\s*,\s*',','),',')) x where public.kv_norm_class(x)=norm_class);
  end if;
  if not allowed then raise exception 'class is not participating'; end if;
  select * into existing from public.battle_attempts a where a.battle_id=p_battle_id and public.kv_norm_name(a.student_name)=norm_name and public.kv_norm_class(a.class_name)=norm_class limit 1;
  if existing.id is not null then
    if existing.completed then raise exception 'already submitted'; end if;
    return query select existing.id,existing.started_at; return;
  end if;
  select count(*) into used from public.battle_attempts a where a.battle_id=p_battle_id and public.kv_norm_class(a.class_name)=norm_class;
  if used >= lim then raise exception 'class limit reached'; end if;
  select count(*) into qcount from public.battle_questions q where q.battle_id=p_battle_id and (gid is null or q.group_id=gid);
  insert into public.battle_attempts(battle_id,group_id,student_name,class_name,score,total,started_at,began_at,completed)
    values(p_battle_id,gid,trim(p_student_name),trim(p_class_name),0,qcount,b.battle_date,now(),false)
    returning id,battle_attempts.started_at into attempt_id,started_at;
  return next;
end; $$;
grant execute on function public.start_battle_attempt(bigint,text,text) to anon, authenticated;

-- Жауапты тексеру: тек өз тобының сұрақтары; уақыт — оқушы шын бастаған сәттен
create or replace function public.submit_battle_attempt(p_attempt_id bigint,p_answers jsonb)
returns table(score integer,total integer,duration_seconds integer)
language plpgsql security definer set search_path=public as $$
declare a record; b record; q record; ans jsonb; s integer:=0; total_q integer:=0; dur integer;
begin
  select * into a from public.battle_attempts where id=p_attempt_id for update;
  if a.id is null then raise exception 'attempt not found'; end if;
  if a.completed then return query select a.score,a.total,coalesce(a.duration_seconds,0); return; end if;
  select * into b from public.battles where id=a.battle_id;
  if now() > b.battle_date + interval '30 minutes 10 seconds' then
    update public.battle_attempts set completed=true,finished_at=b.battle_date+interval '30 minutes',
      duration_seconds=least(1800,extract(epoch from (b.battle_date+interval '30 minutes'-coalesce(a.began_at,a.started_at)))::integer) where id=a.id;
    raise exception 'time expired';
  end if;
  for q in select * from public.battle_questions where battle_id=a.battle_id and (a.group_id is null or group_id=a.group_id) order by created_at,id loop
    total_q:=total_q+1;
    select value into ans from jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) where (value->>'question_id')::bigint=q.id limit 1;
    if ans is not null and lower(ans->>'answer')=lower(q.correct_option) then s:=s+1; end if;
  end loop;
  dur:=greatest(1,least(1800,extract(epoch from (now()-coalesce(a.began_at,a.started_at)))::integer));
  update public.battle_attempts set score=s,total=total_q,completed=true,finished_at=now(),duration_seconds=dur where id=a.id;
  return query select s,total_q,dur;
end; $$;
grant execute on function public.submit_battle_attempt(bigint,jsonb) to anon, authenticated;

-- Нәтиже (ішкі): сыныптар пайыз бойынша, үздік оқушылар
-- пайыз = сыныптың жиған балы / (сыныптағы БАРЛЫҚ оқушы × сұрақ саны)
create or replace function public.kv_battle_results(p_battle_id bigint)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare b record; res jsonb;
begin
  select * into b from public.battles where id=p_battle_id;
  if b.id is null then raise exception 'battle not found'; end if;
  with cls as (
    select public.kv_norm_class(x) c, g.id gid, g.book_title,
           (select count(*) from public.battle_questions q where q.group_id=g.id)::integer qn
    from public.battle_groups g, unnest(string_to_array(regexp_replace(g.classes,'\s*,\s*',','),',')) x
    where g.battle_id=p_battle_id
    union all
    select public.kv_norm_class(x), null, null,
           (select count(*) from public.battle_questions q where q.battle_id=p_battle_id)::integer
    from unnest(string_to_array(regexp_replace(coalesce(b.classes,''),'\s*,\s*',','),',')) x
    where not exists(select 1 from public.battle_groups g where g.battle_id=p_battle_id)
  ), att as (
    select public.kv_norm_class(class_name) c, score, total, duration_seconds
    from public.battle_attempts where battle_id=p_battle_id and completed
  ), agg as (
    select cls.c, cls.book_title, cls.qn,
           coalesce((select total from public.kv_class_sizes() s where s.cls=cls.c),0) total_students,
           (select count(*) from att where att.c=cls.c)::integer participants,
           coalesce((select sum(score) from att where att.c=cls.c),0)::integer total_score,
           coalesce((select avg(duration_seconds) from att where att.c=cls.c),0) avg_dur
    from cls where cls.c<>''
  ), ranked as (
    select agg.*,
      case when greatest(total_students,participants)*qn>0
           then round(100.0*total_score/(greatest(total_students,participants)*qn),1) else 0 end percent,
      row_number() over (order by
        case when greatest(total_students,participants)*qn>0 then 1.0*total_score/(greatest(total_students,participants)*qn) else 0 end desc,
        total_score desc, avg_dur asc, c asc) place
    from agg
  )
  select jsonb_build_object(
    'classes', coalesce((select jsonb_agg(jsonb_build_object('class_name',c,'book_title',book_title,'participants',participants,
        'total_students',greatest(total_students,participants),'total_score',total_score,'max_score',greatest(total_students,participants)*qn,
        'percent',percent,'place',place,'avg_duration',round(avg_dur)) order by place) from ranked),'[]'::jsonb),
    'best', coalesce((select jsonb_agg(jsonb_build_object('student_name',student_name,'class_name',class_name,'score',score,'total',total,'duration_seconds',duration_seconds))
        from (select student_name,class_name,score,total,duration_seconds from public.battle_attempts
              where battle_id=p_battle_id and completed order by score desc,duration_seconds asc,id asc limit 3) t),'[]'::jsonb)
  ) into res;
  return res;
end; $$;

create or replace function public.get_battle_results(p_battle_id bigint) returns jsonb
language plpgsql security definer set search_path=public as $$
declare b record;
begin
  select * into b from public.battles where id=p_battle_id;
  if b.id is null then raise exception 'battle not found'; end if;
  if now() < b.battle_date + interval '30 minutes' then raise exception 'battle is not finished'; end if;
  return public.kv_battle_results(p_battle_id);
end; $$;
grant execute on function public.get_battle_results(bigint) to anon, authenticated;

-- Марапат: жеңімпаз сыныпқа +50 XP, үздік оқушыға +10 (бір рет)
create or replace function public.finalize_battle_rewards(p_battle_id bigint)
returns table(winner_class text,best_student text,best_class text)
language plpgsql security definer set search_path=public as $$
declare b record; r jsonb; w text; top jsonb;
begin
  select * into b from public.battles where id=p_battle_id for update;
  if b.id is null then raise exception 'battle not found'; end if;
  if now() < b.battle_date + interval '30 minutes' then raise exception 'battle is not finished'; end if;
  update public.battle_attempts set completed=true,finished_at=b.battle_date+interval '30 minutes',
    duration_seconds=1800 where battle_id=p_battle_id and completed=false;
  r:=public.kv_battle_results(p_battle_id);
  w:=r->'classes'->0->>'class_name';
  top:=r->'best'->0;
  if not b.rewards_applied then
    if w is not null and (r->'classes'->0->>'participants')::integer>0 then
      insert into public.class_xp(class_name,xp,updated_at) values(w,50,now())
      on conflict(class_name) do update set xp=public.class_xp.xp+50,updated_at=now();
    end if;
    if top is not null then
      insert into public.quiz_attempts(student_name,class_name,score,total,question_id,xp_applied)
      values(top->>'student_name',top->>'class_name',10,10,null,true);
    end if;
    update public.battles set rewards_applied=true where id=p_battle_id;
  end if;
  winner_class:=w; best_student:=top->>'student_name'; best_class:=top->>'class_name';
  return next;
end; $$;
grant execute on function public.finalize_battle_rewards(bigint) to anon, authenticated;

-- ======================================================================
-- 4) МЕКТЕПТЕР ЛИГАСЫ
-- ======================================================================
create table if not exists public.league_rounds (
  id bigint generated by default as identity primary key,
  round_no integer not null default 1,
  title text not null,
  school_a text not null,
  school_b text not null,
  book_title text not null,
  starts_at timestamptz not null,
  duration_min integer not null default 30 check (duration_min between 5 and 180),
  created_at timestamptz default now()
);
create table if not exists public.league_questions (
  id bigint generated by default as identity primary key,
  round_id bigint not null references public.league_rounds(id) on delete cascade,
  sequence_no integer not null default 1,
  question text not null, option_a text not null, option_b text not null, option_c text not null, option_d text not null,
  correct_option text not null check (correct_option in ('a','b','c','d'))
);
create table if not exists public.league_attempts (
  id bigint generated by default as identity primary key,
  round_id bigint not null references public.league_rounds(id) on delete cascade,
  school text not null,
  student_name text not null,
  class_name text not null default '',
  score integer not null default 0,
  total integer not null default 0,
  began_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer,
  completed boolean not null default false
);
create unique index if not exists league_attempts_one_idx on public.league_attempts(round_id, lower(trim(school)), public.kv_norm_name(student_name));

alter table public.league_rounds enable row level security;
alter table public.league_questions enable row level security;
alter table public.league_attempts enable row level security;
drop policy if exists "Public can read league_rounds" on public.league_rounds;
create policy "Public can read league_rounds" on public.league_rounds for select to anon, authenticated using (true);
drop policy if exists "Admin manages league_rounds" on public.league_rounds;
create policy "Admin manages league_rounds" on public.league_rounds for all to authenticated using (public.is_kitapverse_admin()) with check (public.is_kitapverse_admin());
drop policy if exists "Admin manages league_questions" on public.league_questions;
create policy "Admin manages league_questions" on public.league_questions for all to authenticated using (public.is_kitapverse_admin()) with check (public.is_kitapverse_admin());
drop policy if exists "Admin manages league_attempts" on public.league_attempts;
create policy "Admin manages league_attempts" on public.league_attempts for all to authenticated using (public.is_kitapverse_admin()) with check (public.is_kitapverse_admin());
-- (сұрақтар мен талпыныстарды анонимдер тек RPC арқылы көреді — дұрыс жауаптар жасырын)

create or replace function public.create_league_round(p_title text,p_school_a text,p_school_b text,p_book text,p_starts timestamptz,p_duration integer,p_questions jsonb)
returns bigint language plpgsql security definer set search_path=public as $$
declare rid bigint; q jsonb; i integer:=0; n integer;
begin
  if not public.is_kitapverse_admin() then raise exception 'admin authentication required'; end if;
  if nullif(trim(p_school_a),'') is null or nullif(trim(p_school_b),'') is null then raise exception 'school names are required'; end if;
  if lower(trim(p_school_a))=lower(trim(p_school_b)) then raise exception 'schools must differ'; end if;
  if nullif(trim(p_book),'') is null then raise exception 'book is required'; end if;
  if p_starts is null then raise exception 'start time is required'; end if;
  if jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions)<1 then raise exception 'questions are required'; end if;
  select coalesce(max(round_no),0)+1 into n from public.league_rounds;
  insert into public.league_rounds(round_no,title,school_a,school_b,book_title,starts_at,duration_min)
    values(n,coalesce(nullif(trim(p_title),''),n||'-тур'),trim(p_school_a),trim(p_school_b),trim(p_book),p_starts,greatest(5,least(180,coalesce(p_duration,30)))) returning id into rid;
  for q in select value from jsonb_array_elements(p_questions) loop
    i:=i+1;
    if nullif(trim(q->>'question'),'') is null or nullif(trim(q->>'option_a'),'') is null or nullif(trim(q->>'option_b'),'') is null
       or nullif(trim(q->>'option_c'),'') is null or nullif(trim(q->>'option_d'),'') is null then raise exception 'question fields are required'; end if;
    insert into public.league_questions(round_id,sequence_no,question,option_a,option_b,option_c,option_d,correct_option)
    values(rid,i,trim(q->>'question'),trim(q->>'option_a'),trim(q->>'option_b'),trim(q->>'option_c'),trim(q->>'option_d'),lower(q->>'correct_option'));
  end loop;
  return rid;
end; $$;
grant execute on function public.create_league_round(text,text,text,text,timestamptz,integer,jsonb) to authenticated;

create or replace function public.league_start(p_round_id bigint,p_school text,p_name text,p_class text)
returns table(attempt_id bigint,began_at timestamptz,ends_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare r record; sch text; ex record; cnt integer; ends timestamptz;
begin
  select * into r from public.league_rounds where id=p_round_id;
  if r.id is null then raise exception 'round not found'; end if;
  ends:=r.starts_at+make_interval(mins=>r.duration_min);
  if now()<r.starts_at then raise exception 'round is not active'; end if;
  if now()>=ends then raise exception 'round is over'; end if;
  if nullif(trim(p_name),'') is null or length(trim(p_name))>80 then raise exception 'name is required'; end if;
  if length(coalesce(p_class,''))>20 then raise exception 'class is too long'; end if;
  if lower(trim(p_school))=lower(r.school_a) then sch:=r.school_a;
  elsif lower(trim(p_school))=lower(r.school_b) then sch:=r.school_b;
  else raise exception 'school is not participating'; end if;
  select * into ex from public.league_attempts a where a.round_id=p_round_id and lower(trim(a.school))=lower(sch) and public.kv_norm_name(a.student_name)=public.kv_norm_name(p_name);
  if ex.id is not null then
    if ex.completed then raise exception 'already submitted'; end if;
    return query select ex.id,ex.began_at,ends; return;
  end if;
  select count(*) into cnt from public.league_attempts a where a.round_id=p_round_id and lower(trim(a.school))=lower(sch);
  if cnt>=600 then raise exception 'school limit reached'; end if;
  insert into public.league_attempts(round_id,school,student_name,class_name,total)
    values(p_round_id,sch,trim(p_name),trim(coalesce(p_class,'')),(select count(*) from public.league_questions where round_id=p_round_id))
    returning id,league_attempts.began_at into attempt_id,began_at;
  ends_at:=ends;
  return next;
end; $$;
grant execute on function public.league_start(bigint,text,text,text) to anon, authenticated;

create or replace function public.league_get_questions(p_attempt_id bigint)
returns table(id bigint,sequence_no integer,question text,option_a text,option_b text,option_c text,option_d text)
language plpgsql stable security definer set search_path=public as $$
declare a record; r record;
begin
  select * into a from public.league_attempts where league_attempts.id=p_attempt_id;
  if a.id is null or a.completed then raise exception 'attempt not available'; end if;
  select * into r from public.league_rounds where league_rounds.id=a.round_id;
  if now()>=r.starts_at+make_interval(mins=>r.duration_min)+interval '10 seconds' then raise exception 'round is over'; end if;
  return query select q.id,q.sequence_no,q.question,q.option_a,q.option_b,q.option_c,q.option_d
    from public.league_questions q where q.round_id=a.round_id order by q.sequence_no,q.id;
end; $$;
grant execute on function public.league_get_questions(bigint) to anon, authenticated;

create or replace function public.league_submit(p_attempt_id bigint,p_answers jsonb)
returns table(score integer,total integer,duration_seconds integer)
language plpgsql security definer set search_path=public as $$
declare a record; r record; q record; ans jsonb; s integer:=0; t integer:=0; dur integer; ends timestamptz;
begin
  select * into a from public.league_attempts where id=p_attempt_id for update;
  if a.id is null then raise exception 'attempt not found'; end if;
  if a.completed then return query select a.score,a.total,coalesce(a.duration_seconds,0); return; end if;
  select * into r from public.league_rounds where id=a.round_id;
  ends:=r.starts_at+make_interval(mins=>r.duration_min);
  if now()>ends+interval '10 seconds' then
    update public.league_attempts set completed=true,finished_at=ends,duration_seconds=greatest(1,extract(epoch from (ends-a.began_at))::integer) where id=a.id;
    raise exception 'time expired';
  end if;
  for q in select * from public.league_questions where round_id=a.round_id order by sequence_no,id loop
    t:=t+1;
    select value into ans from jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) where (value->>'question_id')::bigint=q.id limit 1;
    if ans is not null and lower(ans->>'answer')=lower(q.correct_option) then s:=s+1; end if;
  end loop;
  dur:=greatest(1,extract(epoch from (now()-a.began_at))::integer);
  update public.league_attempts set score=s,total=t,completed=true,finished_at=now(),duration_seconds=dur where id=a.id;
  return query select s,t,dur;
end; $$;
grant execute on function public.league_submit(bigint,jsonb) to anon, authenticated;

-- Тур нәтижесі (ішкі): мектеп ұпайы = орташа пайыз (қатысушылар бойынша)
create or replace function public.kv_league_round_result(p_round_id bigint)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare r record; sa jsonb; sb jsonb; pa numeric; pb numeric; win text; best jsonb;
begin
  select * into r from public.league_rounds where id=p_round_id;
  select jsonb_build_object('school',r.school_a,'participants',count(*),'total_score',coalesce(sum(score),0),
         'percent',case when count(*)>0 and max(total)>0 then round(100.0*sum(score)/(count(*)*max(total)),1) else 0 end,
         'avg_duration',coalesce(round(avg(duration_seconds)),0))
    into sa from public.league_attempts where round_id=p_round_id and completed and lower(trim(school))=lower(r.school_a);
  select jsonb_build_object('school',r.school_b,'participants',count(*),'total_score',coalesce(sum(score),0),
         'percent',case when count(*)>0 and max(total)>0 then round(100.0*sum(score)/(count(*)*max(total)),1) else 0 end,
         'avg_duration',coalesce(round(avg(duration_seconds)),0))
    into sb from public.league_attempts where round_id=p_round_id and completed and lower(trim(school))=lower(r.school_b);
  pa:=(sa->>'percent')::numeric; pb:=(sb->>'percent')::numeric;
  if (sa->>'participants')::integer=0 and (sb->>'participants')::integer=0 then win:=null;
  elsif pa>pb then win:=r.school_a; elsif pb>pa then win:=r.school_b; else win:=null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('student_name',student_name,'school',school,'class_name',class_name,'score',score,'total',total,'duration_seconds',duration_seconds)),'[]'::jsonb)
    into best from (select * from public.league_attempts where round_id=p_round_id and completed order by score desc,duration_seconds asc,id asc limit 3) t;
  return jsonb_build_object('round_id',r.id,'round_no',r.round_no,'title',r.title,'book_title',r.book_title,'school_a',sa,'school_b',sb,'winner',win,
    'draw',(win is null and ((sa->>'participants')::integer+(sb->>'participants')::integer)>0),'best',best);
end; $$;

create or replace function public.league_round_results(p_round_id bigint) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r record;
begin
  select * into r from public.league_rounds where id=p_round_id;
  if r.id is null then raise exception 'round not found'; end if;
  if now()<r.starts_at+make_interval(mins=>r.duration_min) then raise exception 'round is not finished'; end if;
  return public.kv_league_round_result(p_round_id);
end; $$;
grant execute on function public.league_round_results(bigint) to anon, authenticated;

-- Лига кестесі: жеңіс 3, тең 1, жеңіліс 0 (тек аяқталған турлар)
create or replace function public.league_table()
returns table(school text,played integer,wins integer,draws integer,losses integer,points integer,avg_percent numeric)
language sql stable security definer set search_path=public as $$
  with rr as (
    select r.school_a, r.school_b, public.kv_league_round_result(r.id) res
    from public.league_rounds r where now()>=r.starts_at+make_interval(mins=>r.duration_min)
  ), played_rounds as (
    select * from rr where (res->'school_a'->>'participants')::integer+(res->'school_b'->>'participants')::integer>0
  ), sides as (
    select school_a as sch, (res->'school_a'->>'percent')::numeric pct, res->>'winner' win from played_rounds
    union all
    select school_b, (res->'school_b'->>'percent')::numeric, res->>'winner' from played_rounds
  )
  select sch, count(*)::integer,
    (count(*) filter (where win=sch))::integer,
    (count(*) filter (where win is null))::integer,
    (count(*) filter (where win is not null and win<>sch))::integer,
    (3*count(*) filter (where win=sch)+count(*) filter (where win is null))::integer,
    round(avg(pct),1)
  from sides group by sch
  order by 6 desc, 7 desc nulls last, sch
$$;
grant execute on function public.league_table() to anon, authenticated;
