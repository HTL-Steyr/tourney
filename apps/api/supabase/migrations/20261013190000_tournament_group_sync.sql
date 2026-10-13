create or replace function public.sync_tournament_groups()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_groups integer;
  existing_groups integer;
  removable_ids uuid[];
begin
  if new.sport is not distinct from old.sport then
    return new;
  end if;

  if exists (select 1 from public.match where tournament_id = new.id) then
    raise exception 'Die Sportart kann erst nach dem Löschen aller Spiele geändert werden.'
      using errcode = '23514';
  end if;

  target_groups := case when new.sport = 'Fußball' then 4 else 2 end;
  new.groups := target_groups;
  new.group_teams := 5;

  perform 1 from public."group" where tournament_id = new.id
    order by name, id for update;
  select count(*) into existing_groups from public."group"
    where tournament_id = new.id;

  if existing_groups > target_groups then
    select array_agg(id) into removable_ids
    from (
      select id from public."group" where tournament_id = new.id
      order by name, id offset target_groups
    ) extra_groups;

    if exists (select 1 from public.team where group_id = any(removable_ids)) then
      raise exception 'Entferne zuerst die Teams aus den zusätzlichen Gruppen.'
        using errcode = '23514';
    end if;

    delete from public."group" where id = any(removable_ids);
  elsif existing_groups < target_groups then
    insert into public."group" (tournament_id, name)
    select new.id, 'Gruppe ' || chr(64 + position)
    from generate_series(existing_groups + 1, target_groups) position;
  end if;

  return new;
end;
$$;

create trigger sync_tournament_groups
before update of sport on public.tournament
for each row execute function public.sync_tournament_groups();

