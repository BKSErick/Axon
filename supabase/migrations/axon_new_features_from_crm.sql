-- Axon new feature tables, adapted from the CRM notification model.
-- Target project: Supabase Meta (whcfgflswdanptxsvfes).

alter table public.profiles
add column if not exists onboarding_completed boolean default true;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  kind text not null default 'system',
  title text not null,
  body text,
  priority text default 'normal',
  action jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_client_created
  on public.notifications (client_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "admin_all_notifications" on public.notifications;
drop policy if exists "user_read_own_notifications" on public.notifications;
drop policy if exists "user_update_own_notifications" on public.notifications;
drop policy if exists "client_read_own_notifications" on public.notifications;

create policy "admin_all_notifications" on public.notifications for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "user_read_own_notifications" on public.notifications for select
using (user_id = auth.uid());

create policy "user_update_own_notifications" on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "client_read_own_notifications" on public.notifications for select
using (
  client_id in (
    select profiles.client_id from public.profiles
    where profiles.id = auth.uid()
  )
);

create table if not exists public.audiences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  source text,
  size integer,
  status text default 'active',
  meta_id text,
  config jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audiences_client_created
  on public.audiences (client_id, created_at desc);

alter table public.audiences enable row level security;

drop policy if exists "admin_all_audiences" on public.audiences;
drop policy if exists "client_read_own_audiences" on public.audiences;

create policy "admin_all_audiences" on public.audiences for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "client_read_own_audiences" on public.audiences for select
using (
  client_id in (
    select profiles.client_id from public.profiles
    where profiles.id = auth.uid()
  )
);

notify pgrst, 'reload schema';
