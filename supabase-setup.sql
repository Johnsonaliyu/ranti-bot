-- Run this in your Supabase SQL Editor
-- Project → SQL Editor → New Query → paste this → Run

-- 1. Conversation memory table
create table if not exists ranti_memory (
  chat_id bigint primary key,
  messages jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- 2. Saved jobs table
create table if not exists ranti_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null default 'Unknown',
  location text default 'Abuja, Nigeria',
  salary text,
  deadline text,
  link text,
  category text,
  created_at timestamptz default now(),
  unique(title, company)
);

-- 3. Enable Row Level Security (RLS) — allow anon key to read/write
alter table ranti_memory enable row level security;
alter table ranti_jobs enable row level security;

create policy "Allow all for anon" on ranti_memory
  for all using (true) with check (true);

create policy "Allow all for anon" on ranti_jobs
  for all using (true) with check (true);
