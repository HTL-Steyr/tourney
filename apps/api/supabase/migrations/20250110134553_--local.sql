alter table "public"."match" drop constraint "match_group_id_fkey";

alter table "public"."match" drop column "group_id";

create policy "Authenticated can update"
on "public"."tournament"
as permissive
for update
to authenticated
using (true);



