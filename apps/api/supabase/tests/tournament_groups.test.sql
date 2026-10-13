begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(12);

create temporary table fixture (name text primary key, id uuid default gen_random_uuid());
insert into fixture (name) values
  ('user'), ('tournament'), ('groupA'), ('logo'), ('class1'), ('class2'),
  ('registration1'), ('registration2'), ('team1'), ('team2'), ('match');

insert into auth.users (id) select id from fixture where name = 'user';
insert into public.tournament
  (id, name, start_date, "from", "to", year, last_edited_by_id, sport,
   thumbnail_path, groups, group_teams)
select id, 'Group sync test', current_date, '09:00', '10:00',
  extract(year from current_date), (select id from fixture where name = 'user'),
  'Fußball', 'group-sync-test.svg', 4, 5
from fixture where name = 'tournament';
insert into public."group" (id, tournament_id, name)
select case when position = 1 then (select id from fixture where name = 'groupA') else gen_random_uuid() end,
  (select id from fixture where name = 'tournament'), 'Gruppe ' || chr(64 + position)
from generate_series(1, 4) position;

select lives_ok(
  $$update public.tournament set sport = 'Basketball' where id = (select id from fixture where name = 'tournament')$$,
  'Changing football to basketball succeeds for an empty tournament'
);
select is((select groups::integer from public.tournament where id = (select id from fixture where name = 'tournament')), 2, 'Stored group count becomes two');
select is((select count(*)::integer from public."group" where tournament_id = (select id from fixture where name = 'tournament')), 2, 'Extra empty groups are removed');
select is((select group_teams::integer from public.tournament where id = (select id from fixture where name = 'tournament')), 5, 'Capacity is five teams per group');
select is((select count(*)::integer from public."group" where id = (select id from fixture where name = 'groupA')), 1, 'Existing group identity is preserved');

select lives_ok(
  $$update public.tournament set sport = 'Fußball' where id = (select id from fixture where name = 'tournament')$$,
  'Changing back to football succeeds'
);
select is((select count(*)::integer from public."group" where tournament_id = (select id from fixture where name = 'tournament')), 4, 'Missing groups are added');

insert into public.logo (id, name, image_path)
select id, 'Group sync test', 'group-sync-test.svg' from fixture where name = 'logo';
insert into public.class (id, name, year)
select id, name, '2026/27' from fixture where name like 'class%';
insert into public.registration (id, class_id, name, expire_date)
select registration.id, school_class.id, registration.name, current_date + 30
from fixture registration
join fixture school_class on school_class.name = replace(registration.name, 'registration', 'class')
where registration.name like 'registration%';
insert into public.team (id, name, logo_id, registration_id, tournament_id, group_id)
select team.id, team.name, (select id from fixture where name = 'logo'),
  registration.id, (select id from fixture where name = 'tournament'),
  (select id from public."group"
   where tournament_id = (select id from fixture where name = 'tournament')
     and name = case when team.name = 'team1' then 'Gruppe C' else 'Gruppe A' end)
from fixture team
join fixture registration on registration.name = replace(team.name, 'team', 'registration')
where team.name like 'team%';

select throws_ok(
  $$update public.tournament set sport = 'Basketball' where id = (select id from fixture where name = 'tournament')$$,
  '23514', 'Entferne zuerst die Teams aus den zusätzlichen Gruppen.',
  'Occupied groups cannot be removed'
);
select is((select sport::text from public.tournament where id = (select id from fixture where name = 'tournament')), 'Fußball', 'Rejected edit leaves sport unchanged');
select is((select count(*)::integer from public."group" where tournament_id = (select id from fixture where name = 'tournament')), 4, 'Rejected edit leaves groups unchanged');

insert into public.match (id, tournament_id, team1_id, team2_id, start_time, round)
select id, (select id from fixture where name = 'tournament'),
  (select id from fixture where name = 'team1'),
  (select id from fixture where name = 'team2'), '09:00', 'Gruppenphase'
from fixture where name = 'match';
select throws_ok(
  $$update public.tournament set sport = 'Volleyball' where id = (select id from fixture where name = 'tournament')$$,
  '23514', 'Die Sportart kann erst nach dem Löschen aller Spiele geändert werden.',
  'Tournament format cannot change while matches exist'
);
select is((select count(*)::integer from public.team where id = (select id from fixture where name = 'team1') and group_id is not null), 1, 'Rejected edits preserve team assignments');

select * from finish();
rollback;

