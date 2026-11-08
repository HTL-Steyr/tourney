create or replace function public.sync_tournament_year()
returns trigger
language plpgsql
as $$
begin
  new.year := extract(year from new.start_date)::smallint;
  return new;
end;
$$;

drop trigger if exists sync_tournament_year on public.tournament;

create trigger sync_tournament_year
before insert or update of start_date
on public.tournament
for each row
execute function public.sync_tournament_year();

update public.tournament
set year = extract(year from start_date)::smallint
where year is distinct from extract(year from start_date)::smallint;
