-- Run once in Supabase: SQL Editor, paste, Run.

create table public.answers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  choice text not null check (choice in ('yes', 'think', 'no')),
  message text check (char_length(message) <= 500)
);

alter table public.answers enable row level security;

-- The public key can only add rows. Nobody can read them except you, from the dashboard.
create policy "anyone can send an answer"
  on public.answers
  for insert
  to anon
  with check (true);
