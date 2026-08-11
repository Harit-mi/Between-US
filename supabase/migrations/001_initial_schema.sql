-- ==========================================================
-- "Between Us" ("Entre Nosotros") — Supabase Initial Schema
-- ==========================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  nickname text,
  avatar_url text,
  country text,
  city text,
  latitude numeric,
  longitude numeric,
  language text default 'en' check (language in ('en','es')),
  timezone text default 'UTC',
  status text default 'available' check (status in ('available','sleeping','working','listening','busy','thinking')),
  created_at timestamptz default now()
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  person_a uuid references public.users(id) on delete cascade,
  person_b uuid references public.users(id) on delete cascade,
  couple_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.touch_types (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  emoji text not null,
  name_en text not null,
  name_es text not null,
  message_en text not null,
  message_es text not null,
  is_default boolean default true
);

create table if not exists public.touches (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  touch_type_id uuid references public.touch_types(id) on delete cascade not null,
  seen boolean default false,
  created_at timestamptz default now()
);

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.users enable row level security;
alter table public.couples enable row level security;
alter table public.touch_types enable row level security;
alter table public.touches enable row level security;

create or replace function public.is_member_of_couple(couple_id_arg uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.couples
    where id = couple_id_arg
      and (person_a = auth.uid() or person_b = auth.uid())
  );
$$;

drop policy if exists "Users can view own profile or partner profile" on public.users;
create policy "Users can view own profile or partner profile"
  on public.users for select
  using (
    auth.uid() = id or exists (
      select 1 from public.couples c
      where (c.person_a = auth.uid() and c.person_b = id)
         or (c.person_b = auth.uid() and c.person_a = id)
    )
  );

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

drop policy if exists "Couples select policy" on public.couples;
create policy "Couples select policy"
  on public.couples for select
  using (person_a = auth.uid() or person_b = auth.uid());

drop policy if exists "Couples update policy" on public.couples;
create policy "Couples update policy"
  on public.couples for update
  using (person_a = auth.uid() or person_b = auth.uid());

drop policy if exists "Touch types select policy" on public.touch_types;
create policy "Touch types select policy"
  on public.touch_types for select
  using (public.is_member_of_couple(couple_id));

drop policy if exists "Touch types insert policy" on public.touch_types;
create policy "Touch types insert policy"
  on public.touch_types for insert
  with check (public.is_member_of_couple(couple_id));

drop policy if exists "Touches select policy" on public.touches;
create policy "Touches select policy"
  on public.touches for select
  using (public.is_member_of_couple(couple_id));

drop policy if exists "Touches insert policy" on public.touches;
create policy "Touches insert policy"
  on public.touches for insert
  with check (public.is_member_of_couple(couple_id) and sender_id = auth.uid());

drop policy if exists "Touches update policy" on public.touches;
create policy "Touches update policy"
  on public.touches for update
  using (public.is_member_of_couple(couple_id));

-- 4. REALTIME REPLICATION
do $$
begin
  alter publication supabase_realtime add table public.touches;
exception when others then null;
end $$;

-- 5. RPC FUNCTIONS

create or replace function public.create_couple()
returns text
language plpgsql
security definer
as $$
declare
  new_code text;
  caller_id uuid;
  new_couple_id uuid;
  code_exists boolean;
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  i integer;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  select couple_code into new_code 
  from public.couples 
  where person_a = caller_id or person_b = caller_id 
  limit 1;

  if new_code is not null then
    return new_code;
  end if;

  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;
    select exists(select 1 from public.couples where couple_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;

  insert into public.couples (person_a, person_b, couple_code)
  values (caller_id, null, new_code)
  returning id into new_couple_id;

  insert into public.touch_types (couple_id, emoji, name_en, name_es, message_en, message_es, is_default)
  values
    (new_couple_id, '❤️', 'Love',     'Amor',       'sent you love',       'te envió amor',      true),
    (new_couple_id, '🤗', 'Hug',      'Abrazo',     'sent you a hug',      'te envió un abrazo', true),
    (new_couple_id, '💋', 'Kiss',     'Beso',       'sent you a kiss',     'te envió un beso',   true),
    (new_couple_id, '🥺', 'Miss you', 'Te extraño', 'misses you',          'te extraña',        true);

  return new_code;
end;
$$;

create or replace function public.join_couple(code text)
returns json
language plpgsql
security definer
as $$
declare
  target_id uuid;
  target_person_a uuid;
  target_person_b uuid;
  caller_id uuid;
  res json;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  code := upper(trim(code));

  select id, person_a, person_b 
  into target_id, target_person_a, target_person_b 
  from public.couples 
  where couple_code = code;

  if target_id is null then
    raise exception 'Invalid couple code';
  elsif target_person_a = caller_id then
    raise exception 'You are already Person A in this couple';
  elsif target_person_b is not null then
    raise exception 'This couple code has already been used';
  end if;

  update public.couples set person_b = caller_id where id = target_id;
  select json_build_object('id', target_id, 'couple_code', code) into res;
  return res;
end;
$$;

create or replace function public.send_touch(receiver_id uuid, touch_type_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  caller_id uuid;
  found_couple_id uuid;
  inserted_id uuid;
  inserted_created_at timestamptz;
  res json;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into found_couple_id
  from public.couples
  where (person_a = caller_id and person_b = receiver_id)
     or (person_b = caller_id and person_a = receiver_id);

  if found_couple_id is null then
    raise exception 'No active couple found with specified user';
  end if;

  insert into public.touches (couple_id, sender_id, receiver_id, touch_type_id, seen)
  values (found_couple_id, caller_id, receiver_id, touch_type_id, false)
  returning id, created_at into inserted_id, inserted_created_at;

  select json_build_object(
    'id', inserted_id,
    'couple_id', found_couple_id,
    'sender_id', caller_id,
    'receiver_id', receiver_id,
    'touch_type_id', touch_type_id,
    'seen', false,
    'created_at', inserted_created_at
  ) into res;

  return res;
end;
$$;
