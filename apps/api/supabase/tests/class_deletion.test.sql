begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

create temporary table fixture (name text primary key, id uuid default gen_random_uuid());
insert into fixture (name) values
  ('user'), ('tournament'), ('logo'),
  ('class1'), ('class2'), ('class3'),
  ('registration1'), ('registration2'), ('registration3'),
  ('team1'), ('team2'), ('team3'), ('match1'), ('match2');

insert into auth.users (id) select id from fixture where name = 'user';
insert into public.logo (id, name, image_path)
select id, 'Class deletion test', 'class-deletion-test.svg' from fixture where name = 'logo';
insert into public.tournament
  (id, name, start_date, "from", "to", year, last_edited_by_id, sport,
   thumbnail_path, groups, group_teams)
select id, 'Class deletion test', current_date, '09:00', '10:00',
  extract(year from current_date), (select id from fixture where name = 'user'),
  'Basketball', 'class-deletion-test.svg', 2, 5
from fixture where name = 'tournament';

insert into public.class (id, name, year)
select id, name, '2026/27' from fixture where name like 'class%';
insert into public.registration (id, class_id, name, expire_date)
select registration.id, school_class.id, registration.name, current_date + 30
from fixture registration
join fixture school_class on school_class.name = replace(registration.name, 'registration', 'class')
where registration.name like 'registration%';
insert into public.team (id, name, logo_id, registration_id, tournament_id)
select team.id, team.name, (select id from fixture where name = 'logo'),
  registration.id, (select id from fixture where name = 'tournament')
from fixture team
join fixture registration on registration.name = replace(team.name, 'team', 'registration')
where team.name like 'team%';
insert into public.match (id, tournament_id, team1_id, team2_id, start_time, round)
select id, (select id from fixture where name = 'tournament'),
  (select id from fixture where name = 'team1'),
  (select id from fixture where name = 'team2'), '09:00', 'Gruppenphase'
from fixture where name = 'match1';
insert into public.match (id, tournament_id, team1_id, team2_id, start_time, round)
select id, (select id from fixture where name = 'tournament'),
  (select id from fixture where name = 'team2'),
  (select id from fixture where name = 'team3'), '09:30', 'Gruppenphase'
from fixture where name = 'match2';

select lives_ok(
  $$delete from public.class where id = (select id from fixture where name = 'class1')$$,
  'A class whose team is team1 in a match can be deleted'
);
select is((select count(*)::integer from public.class where id = (select id from fixture where name = 'class1')), 0, 'Class removed');
select is((select count(*)::integer from public.registration where id = (select id from fixture where name = 'registration1')), 0, 'Registration cascades');
select is((select count(*)::integer from public.team where id = (select id from fixture where name = 'team1')), 0, 'Team cascades');
select is((select count(*)::integer from public.match where id = (select id from fixture where name = 'match1')), 0, 'Match referencing team1 cascades');
select is((select count(*)::integer from public.team where id = (select id from fixture where name = 'team2')), 1, 'Opponent team is preserved');
select is((select count(*)::integer from public.match where id = (select id from fixture where name = 'match2')), 1, 'Unrelated match is preserved');
select lives_ok(
  $$delete from public.class where id = (select id from fixture where name = 'class3')$$,
  'A class whose team is team2 in a match can be deleted'
);
select is((select count(*)::integer from public.match where id = (select id from fixture where name = 'match2')), 0, 'Match referencing team2 cascades');
select is((select count(*)::integer from public.team where id = (select id from fixture where name = 'team2')), 1, 'Unrelated class and team remain after both deletions');

select * from finish();
rollback;

