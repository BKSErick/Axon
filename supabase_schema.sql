-- 1. SETUP SCHEMA
create table if not exists business_managers (
  id uuid default gen_random_uuid() primary key,
  bm_id text unique not null,
  name text not null,
  status text check (status in ('connected', 'expired', 'disconnected')),
  token_expires date,
  connected_at date default current_date
);

create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  phone text,
  active boolean default true,
  joined date default current_date
);

create table if not exists ad_accounts (
  id uuid default gen_random_uuid() primary key,
  meta_id text unique not null,
  name text not null,
  bm_id uuid references business_managers(id),
  client_id uuid references clients(id),
  status text check (status in ('active', 'paused', 'disconnected')),
  spend numeric default 0,
  leads integer default 0
);

create table if not exists campaigns (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references ad_accounts(id) on delete cascade,
  name text not null,
  status text,
  spend numeric default 0,
  leads integer default 0,
  roas numeric,
  cpa numeric,
  ctr text
);

create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  period text,
  status text,
  date timestamp with time zone default now(),
  size text
);

create table if not exists permissions (
  client_id uuid references clients(id) on delete cascade primary key,
  perms jsonb not null default '{
    "view_spend": true,
    "view_campaigns": true,
    "download_reports": false,
    "view_ecommerce": false
  }'::jsonb
);

-- 2. ENABLE RLS
alter table business_managers enable row level security;
alter table clients enable row level security;
alter table ad_accounts enable row level security;
alter table campaigns enable row level security;
alter table reports enable row level security;
alter table permissions enable row level security;

create policy "Allow public read access" on business_managers for select using (true);
create policy "Allow public read access" on clients for select using (true);
create policy "Allow public read access" on ad_accounts for select using (true);
create policy "Allow public read access" on campaigns for select using (true);
create policy "Allow public read access" on reports for select using (true);
create policy "Allow public read access" on permissions for select using (true);

-- 3. INSERT MOCK DATA (Optional, clear if not needed)
-- Insert 1st BM
with ins_bm as (
  insert into business_managers (bm_id, name, status, token_expires, connected_at)
  values ('104826318273641', 'Alpha BM Principal', 'connected', '2025-09-14', '2025-01-12')
  returning id
)
-- Insert Clients
, ins_clients as (
  insert into clients (name, email, phone, active, joined)
  values 
    ('João Silva', 'joao@lojoalpha.com.br', '+55 11 99999-1234', true, '2025-01-10'),
    ('Loja Yuri', 'yuri@lojayuri.com.br', '+55 11 97777-9999', true, '2025-04-01')
  returning id, email
)
-- Insert Ad Accounts
insert into ad_accounts (meta_id, name, bm_id, client_id, status, spend, leads)
select 'act_1234567890', 'Loja Alpha – Conversão', (select id from ins_bm), (select id from ins_clients where email = 'joao@lojoalpha.com.br'), 'active', 45230, 1234
union all
select 'act_9988776655', 'Loja Yuri – Performance', (select id from ins_bm), (select id from ins_clients where email = 'yuri@lojayuri.com.br'), 'active', 31400, 889;
