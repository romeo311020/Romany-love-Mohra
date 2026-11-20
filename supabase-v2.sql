-- Run each numbered statement ALONE in the Supabase SQL Editor (clear the editor, paste one, Run).
-- Each one is written on a single line on purpose, because the mobile editor breaks multi-line pastes.

-- 1. Visit log table (which pages she reached)
create table public.events (id bigint generated always as identity primary key, created_at timestamptz not null default now(), kind text not null check (kind in ('visit','opened','feelings','answer')));

-- 2.
alter table public.events enable row level security;

-- 3. The public key can only add visit rows
create policy "anyone can log a visit" on public.events for insert to anon with check (true);

-- 4. Only YOUR login can read events. Replace YOUR_EMAIL with the email you create the user with.
create policy "owner reads events" on public.events for select to authenticated using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL');

-- 5. Same for answers. Replace YOUR_EMAIL.
create policy "owner reads answers" on public.answers for select to authenticated using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL');

-- 6. Phone notification when she answers (optional). Lets the database call ntfy.sh.
create extension if not exists pg_net with schema extensions;

-- 7.
create or replace function public.notify_answer() returns trigger language plpgsql security definer set search_path = public as $$ begin begin perform net.http_post(url := 'https://ntfy.sh/', body := jsonb_build_object('topic', 'mohra-romany-dg7cf5ulfx', 'title', 'Mohra answered', 'message', case new.choice when 'yes' then 'Yes' when 'think' then 'She wants to think' else 'Not feeling the same' end || coalesce(E'\n' || new.message, '')), headers := '{"Content-Type":"application/json"}'::jsonb); exception when others then null; end; return new; end; $$;

-- 8.
create trigger answer_notify after insert on public.answers for each row execute function public.notify_answer();
