-- 장사한컷 초기 스키마
-- Supabase Studio > SQL Editor에 붙여넣어 한 번에 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_name text,
  cuisine_type text,
  signature_menu text,
  mood text,
  target_audience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  prompt text not null,
  runway_task_id text,
  status text not null default 'PENDING',
  output_url text,
  error_message text,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generations_user_idx
  on public.generations (user_id, created_at desc);

create index if not exists generations_status_idx
  on public.generations (status);

-- Updated-at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists generations_touch on public.generations;
create trigger generations_touch before update on public.generations
  for each row execute function public.touch_updated_at();

-- Auto-create profile on signup, using restaurant_name from metadata if present
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, restaurant_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'restaurant_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

drop policy if exists "Owners read own profile" on public.profiles;
create policy "Owners read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Owners upsert own profile" on public.profiles;
create policy "Owners upsert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Owners update own profile" on public.profiles;
create policy "Owners update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Owners read own generations" on public.generations;
create policy "Owners read own generations" on public.generations
  for select using (auth.uid() = user_id);

drop policy if exists "Owners insert own generations" on public.generations;
create policy "Owners insert own generations" on public.generations
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owners update own generations" on public.generations;
create policy "Owners update own generations" on public.generations
  for update using (auth.uid() = user_id);

drop policy if exists "Owners delete own generations" on public.generations;
create policy "Owners delete own generations" on public.generations
  for delete using (auth.uid() = user_id);
