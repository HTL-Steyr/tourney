-- Deleting a class cascades to registrations and teams. Matches must follow
-- their teams as well, otherwise the existing cascade stops at the match FK.
alter table public.match
  drop constraint match_team1_id_fkey,
  add constraint match_team1_id_fkey
    foreign key (team1_id) references public.team (id) on delete cascade;

alter table public.match
  drop constraint match_team2_id_fkey,
  add constraint match_team2_id_fkey
    foreign key (team2_id) references public.team (id) on delete cascade;

