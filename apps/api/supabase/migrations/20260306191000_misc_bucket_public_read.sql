create policy "everyone can read misc"
on storage.objects for select
using (bucket_id = 'misc');
