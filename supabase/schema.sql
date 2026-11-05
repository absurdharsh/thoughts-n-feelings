-- ==========================================================================
-- Thoughts 'n' Feelings — Supabase / PostgreSQL Schema & RLS Policies
-- Supports TEXT thought_ids (both static 'entry-01' / '1' and dynamic UUIDs)
-- ==========================================================================

-- Enable pgcrypto so your owner password is hashed on the server and never stored in plain text
create extension if not exists pgcrypto;

-- 1. Private table to store your hashed owner password (inaccessible to public/API)
create table if not exists private_owner_config (
  id int primary key default 1,
  password_hash text not null
);
alter table private_owner_config enable row level security;
-- Zero policies on private_owner_config = NOBODY can read or modify it via the API!

-- Set your secret owner password here (hashed with bcrypt on the server):
insert into private_owner_config (id, password_hash)
values (1, crypt('ilovefrankocean14', gen_salt('bf')))
on conflict (id) do update set password_hash = excluded.password_hash;

-- 2. Thoughts table (id is TEXT to support both static strings and generated UUIDs)
create table if not exists thoughts (
  id text default gen_random_uuid()::text primary key,
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 5000),
  author text default 'absurdharsh',
  category text default 'thought',
  likes_count int default 0 not null,
  created_at timestamptz default now() not null
);

-- Migration safety: ensure author column exists if table was created previously
alter table thoughts add column if not exists author text default 'absurdharsh';

-- 3. Anonymous Comments table (thought_id is TEXT for universal compatibility)
create table if not exists comments (
  id text default gen_random_uuid()::text primary key,
  thought_id text not null,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz default now() not null
);

-- 4. Likes table (Strict 1-like-per-user enforced by Postgres, thought_id is TEXT)
create table if not exists likes (
  id text default gen_random_uuid()::text primary key,
  thought_id text not null,
  voter_id text not null check (char_length(voter_id) between 10 and 128),
  created_at timestamptz default now() not null,
  unique(thought_id, voter_id)
);

-- Create helpful indexes for performance
create index if not exists idx_comments_thought_id on comments(thought_id);
create index if not exists idx_likes_thought_id on likes(thought_id);

-- 5. Strict Row Level Security (Public can ONLY Read and Insert — NEVER Update or Delete)
alter table thoughts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

create policy "Public read thoughts" on thoughts for select using (true);
create policy "Public insert thoughts with 0 likes" on thoughts for insert with check (likes_count = 0);

create policy "Public read comments" on comments for select using (true);
create policy "Public insert comments" on comments for insert with check (true);

create policy "Public read likes" on likes for select using (true);

-- 6. Tamper-Proof Server-Side Like Function (1 like max per voter_id)
create or replace function toggle_like(target_thought_id text, user_voter_id text)
returns int language plpgsql security definer as $$
declare
  new_count int;
begin
  if exists (select 1 from likes where thought_id = target_thought_id and voter_id = user_voter_id) then
    delete from likes where thought_id = target_thought_id and voter_id = user_voter_id;
  else
    insert into likes (thought_id, voter_id) values (target_thought_id, user_voter_id);
  end if;

  select count(*) into new_count from likes where thought_id = target_thought_id;
  update thoughts set likes_count = new_count where id = target_thought_id;
  return new_count;
end;
$$;

-- 7. Tamper-Proof Server-Side Owner Delete Functions (Verifies bcrypt hash inside Postgres)
create or replace function owner_delete_thought(target_id text, secret_passkey text)
returns boolean language plpgsql security definer as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from private_owner_config where id = 1;
  if stored_hash is not null and stored_hash = crypt(secret_passkey, stored_hash) then
    delete from thoughts where id = target_id;
    delete from comments where thought_id = target_id;
    delete from likes where thought_id = target_id;
    return true;
  else
    raise exception 'Unauthorized: Invalid Owner Passkey';
  end if;
end;
$$;

create or replace function owner_delete_comment(target_id text, secret_passkey text)
returns boolean language plpgsql security definer as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from private_owner_config where id = 1;
  if stored_hash is not null and stored_hash = crypt(secret_passkey, stored_hash) then
    delete from comments where id = target_id;
    return true;
  else
    raise exception 'Unauthorized: Invalid Owner Passkey';
  end if;
end;
$$;
