-- =============================================================================
-- BASELINE MIGRATION — MetaReports (meta_ads)
-- Data: 2026-05-04
-- Consolida: 18 scripts SQL avulsos da raiz do repositório
-- Substitui: FIX_*.sql, REPARO_*.sql, CREATE_*.sql, CORRIGIR_ROLES.sql,
--            MIGRACAO_AGENCIA.sql, ADD_SCHEDULED_FOR_SOCIAL_POSTS.sql
-- Nota: Estado ideal derivado dos scripts. Para produção (xaivgzrmxewkevlqvphi),
--       validar contra dump real via: pg_dump --schema-only
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSÕES
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- FUNÇÕES AUXILIARES RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- TABELA: clients
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.clients;
DROP POLICY IF EXISTS "Admin can do everything" ON public.clients;
DROP POLICY IF EXISTS "Client view own data" ON public.clients;
DROP POLICY IF EXISTS "Clients View" ON public.clients;
DROP POLICY IF EXISTS "Clients All" ON public.clients;

CREATE POLICY "Clients View" ON public.clients FOR SELECT
USING ( public.is_admin() OR id = public.get_my_client_id() );

CREATE POLICY "Clients All" ON public.clients FOR ALL
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role        TEXT CHECK (role IN ('admin', 'client')) NOT NULL DEFAULT 'client',
    client_id   UUID REFERENCES public.clients(id),
    full_name   TEXT,
    agency_name TEXT DEFAULT 'Alpha Digital',
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_name TEXT DEFAULT 'Alpha Digital';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'client'));

UPDATE public.profiles SET role = 'client' WHERE role IS NULL OR role = '';
UPDATE public.profiles SET role = LOWER(TRIM(role));
UPDATE public.profiles SET role = 'client' WHERE role NOT IN ('admin', 'client');
UPDATE public.profiles SET agency_name = 'Alpha Digital' WHERE role = 'admin' AND agency_name IS NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Profiles View" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Insert" ON public.profiles;

CREATE POLICY "Profiles View" ON public.profiles FOR SELECT
USING ( public.is_admin() OR id = auth.uid() );

CREATE POLICY "Profiles Update" ON public.profiles FOR UPDATE
USING ( public.is_admin() OR id = auth.uid() );

CREATE POLICY "Profiles Insert" ON public.profiles FOR INSERT
WITH CHECK ( public.is_admin() OR id = auth.uid() );

COMMENT ON TABLE public.profiles IS 'Tabela de perfis — baseline 2026-05';

-- Trigger: auto-cria perfil ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  linked_client_id UUID;
BEGIN
  SELECT count(*) = 0 INTO is_first_user FROM public.profiles;
  SELECT id INTO linked_client_id FROM public.clients WHERE email = NEW.email;
  INSERT INTO public.profiles (id, role, client_id, full_name, agency_name)
  VALUES (
    NEW.id,
    CASE WHEN is_first_user THEN 'admin' ELSE 'client' END,
    linked_client_id,
    NEW.raw_user_meta_data->>'full_name',
    'Alpha Digital'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    agency_name = COALESCE(profiles.agency_name, 'Alpha Digital');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TABELA: ad_accounts
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.ad_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.ad_accounts;
DROP POLICY IF EXISTS "Ad Accounts View" ON public.ad_accounts;
DROP POLICY IF EXISTS "Ad Accounts All" ON public.ad_accounts;

CREATE POLICY "Ad Accounts View" ON public.ad_accounts FOR SELECT
USING ( public.is_admin() OR client_id = public.get_my_client_id() );

CREATE POLICY "Ad Accounts All" ON public.ad_accounts FOR ALL
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: campaigns
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='meta_id') THEN
    ALTER TABLE public.campaigns ADD COLUMN meta_id TEXT;
  END IF;
END $$;

ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_meta_id_key;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_meta_id_key UNIQUE (meta_id);
COMMENT ON COLUMN public.campaigns.meta_id IS 'Identificador único da campanha na Meta API';

ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns View" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns All" ON public.campaigns;

CREATE POLICY "Campaigns View" ON public.campaigns FOR SELECT
USING (
  public.is_admin() OR
  account_id IN (SELECT id FROM public.ad_accounts WHERE client_id = public.get_my_client_id())
);

CREATE POLICY "Campaigns All" ON public.campaigns FOR ALL
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: business_managers
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.business_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.business_managers;
DROP POLICY IF EXISTS "BM All" ON public.business_managers;

CREATE POLICY "BM All" ON public.business_managers FOR ALL
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: reports
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.reports;
DROP POLICY IF EXISTS "Reports View" ON public.reports;
DROP POLICY IF EXISTS "Reports All" ON public.reports;

CREATE POLICY "Reports View" ON public.reports FOR SELECT
USING ( public.is_admin() OR client_id = public.get_my_client_id() );

CREATE POLICY "Reports All" ON public.reports FOR ALL
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: permissions
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.permissions;
DROP POLICY IF EXISTS "Permissions View" ON public.permissions;
DROP POLICY IF EXISTS "Permissions All" ON public.permissions;

CREATE POLICY "Permissions View" ON public.permissions FOR SELECT
USING ( public.is_admin() OR client_id = public.get_my_client_id() );

CREATE POLICY "Permissions All" ON public.permissions FOR ALL
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: client_notification_prefs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_notification_prefs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp_number  TEXT,
    is_active        BOOLEAN DEFAULT true,
    report_frequency TEXT CHECK (report_frequency IN ('daily', 'weekly', 'ondemand')) DEFAULT 'daily',
    send_time        TIME NOT NULL DEFAULT '08:00',
    weekly_day       SMALLINT CHECK (weekly_day BETWEEN 1 AND 7),
    alerts_enabled   BOOLEAN DEFAULT true,
    updated_at       TIMESTAMPTZ DEFAULT now(),
    created_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_id)
);

ALTER TABLE public.client_notification_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their own preferences" ON public.client_notification_prefs;
DROP POLICY IF EXISTS "Clients can insert their own preferences" ON public.client_notification_prefs;
DROP POLICY IF EXISTS "Clients can update their own preferences" ON public.client_notification_prefs;
DROP POLICY IF EXISTS "Clients can manage their own preferences" ON public.client_notification_prefs;
DROP POLICY IF EXISTS "Admins can view all preferences" ON public.client_notification_prefs;
DROP POLICY IF EXISTS "Admins can modify all preferences" ON public.client_notification_prefs;

CREATE POLICY "Clients can manage their own preferences"
ON public.client_notification_prefs FOR ALL TO authenticated
USING ( auth.uid() = client_id ) WITH CHECK ( auth.uid() = client_id );

CREATE POLICY "Admins can modify all preferences"
ON public.client_notification_prefs FOR ALL TO authenticated
USING ( public.is_admin() );

CREATE OR REPLACE FUNCTION update_notification_prefs_timestamp()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_notification_prefs_modtime ON public.client_notification_prefs;
CREATE TRIGGER update_client_notification_prefs_modtime
BEFORE UPDATE ON public.client_notification_prefs
FOR EACH ROW EXECUTE PROCEDURE update_notification_prefs_timestamp();

-- ---------------------------------------------------------------------------
-- TABELA: notification_queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type           TEXT CHECK (type IN ('daily_report', 'weekly_report', 'performance_alert')),
    payload        JSONB DEFAULT '{}'::jsonb,
    status         TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    scheduled_for  TIMESTAMPTZ NOT NULL,
    attempts       SMALLINT DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_daily_notification UNIQUE (client_id, type, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status_time
ON public.notification_queue (status, scheduled_for);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their own queue" ON public.notification_queue;
DROP POLICY IF EXISTS "Admins can manage queue" ON public.notification_queue;

CREATE POLICY "Clients can view their own queue"
ON public.notification_queue FOR SELECT TO authenticated
USING ( auth.uid() = client_id );

CREATE POLICY "Admins can manage queue"
ON public.notification_queue FOR ALL TO authenticated
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: notification_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id              UUID REFERENCES public.notification_queue(id) ON DELETE SET NULL,
    whatsapp_number       TEXT NOT NULL,
    evolution_message_id  TEXT,
    status                TEXT CHECK (status IN ('success', 'error')),
    error_details         TEXT,
    sent_at               TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view logs attached to their queue items" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.notification_logs;

CREATE POLICY "Clients can view logs attached to their queue items"
ON public.notification_logs FOR SELECT TO authenticated
USING ( EXISTS (SELECT 1 FROM public.notification_queue q WHERE q.id = notification_logs.queue_id AND q.client_id = auth.uid()) );

CREATE POLICY "Admins can view all logs"
ON public.notification_logs FOR SELECT TO authenticated
USING ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABELA: social_posts (coluna adicional)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.social_posts
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- FIM DO BASELINE
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';