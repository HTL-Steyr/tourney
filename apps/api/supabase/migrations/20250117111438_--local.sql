alter table "public"."player" alter column "note" set default ''::text;

alter table "public"."player" alter column "note" set not null;

create policy "authenticated can update"
on "public"."team"
as permissive
for update
to authenticated
using (true);



