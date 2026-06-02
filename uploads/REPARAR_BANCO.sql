-- TABELAS BASE (Caso não existam)
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique,
  created_at timestamptz default now()
);

-- 1. CRIAR TABELA DE PERFIS
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('admin', 'client')) not null default 'client',
  client_id uuid references public.clients(id),
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. HABILITAR RLS (Segurança)
alter table public.profiles enable row level security;

-- Limpar políticas antigas para evitar erros de duplicata
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 3. FUNÇÃO DE GATILHO (CRIA PERFIL AUTOMÁTICO)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  linked_client_id uuid;
begin
  -- Verifica se é o primeiro usuário do sistema (será admin)
  select count(*) = 0 into is_first_user from public.profiles;
  
  -- Tenta achar um cliente já cadastrado com o mesmo e-mail
  select id into linked_client_id from public.clients where email = new.email;

  insert into public.profiles (id, role, client_id, full_name)
  values (
    new.id, 
    case when is_first_user then 'admin' else 'client' end,
    linked_client_id,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. VINCULAR O GATILHO À TABELA DE USUÁRIOS DO SUPABASE
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. REPARAR USUÁRIO JÁ EXISTENTE (Caso o cadastro já tenha sido feito)
-- Isso garante que seu usuário atual ganhe um perfil de admin se ele for o único
insert into public.profiles (id, role, full_name)
select id, 'admin', raw_user_meta_data->>'full_name'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
