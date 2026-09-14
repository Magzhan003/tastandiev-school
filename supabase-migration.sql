-- Run this ONCE in Supabase SQL Editor.
-- This adds the fields the website needs to the tables you already created.
alter table public.news
  add column if not exists published_date date default current_date;

alter table public.documents
  add column if not exists file_name text;

alter table public.documents
  add column if not exists storage_path text;

-- Optional: make existing news have today's date if the new column is null.
update public.news set published_date = current_date where published_date is null;
