insert into storage.buckets (id, name, public, file_size_limit)
values
  ('images', 'images', true, 52428800),
  ('misc', 'misc', true, null)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;
