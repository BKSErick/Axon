-- ===============================================
-- TABELAS PARA O SISTEMA DE RELATÓRIOS AUTOMÁTICOS
-- Execute tudo no SQL Editor do Supabase
-- ===============================================

-- 1. Tabela de preferências de notificação dos clientes
CREATE TABLE IF NOT EXISTS client_notification_prefs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL UNIQUE,
    whatsapp_number TEXT,
    is_active BOOLEAN DEFAULT false,
    report_frequency TEXT DEFAULT 'daily' CHECK (report_frequency IN ('daily', 'weekly')),
    send_time TIME DEFAULT '08:00:00',
    weekly_day INT DEFAULT 1 CHECK (weekly_day BETWEEN 1 AND 7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fila de processamento (Anti-spam com unique constraint diária)
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    type TEXT NOT NULL DEFAULT 'daily_report',
    scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
    payload JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, type, scheduled_for)
);

-- 3. Logs de notificações enviadas
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_id UUID REFERENCES notification_queue(id),
    whatsapp_number TEXT,
    evolution_message_id TEXT,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')),
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de relatórios (para o painel Admin)
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID,
    title TEXT NOT NULL,
    period TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    size TEXT DEFAULT '—',
    status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'generating', 'sent', 'failed')),
    pdf_url TEXT,
    whatsapp_number TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_client ON notification_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_queue ON notification_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_reports_client ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date DESC);
CREATE INDEX IF NOT EXISTS idx_client_prefs_active ON client_notification_prefs(is_active) WHERE is_active = true;

-- 6. RLS (Row Level Security) básico
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notification_prefs ENABLE ROW LEVEL SECURITY;

-- Policies: admins podem ver tudo
CREATE POLICY "Admin full access queue" ON notification_queue FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access logs" ON notification_logs FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access reports" ON reports FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access prefs" ON client_notification_prefs FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Clients podem ver/editar suas próprias prefs
CREATE POLICY "Client own prefs" ON client_notification_prefs FOR ALL TO authenticated 
    USING (client_id = auth.uid());

-- Clients podem ver seus próprios relatórios
CREATE POLICY "Client own reports" ON reports FOR SELECT TO authenticated 
    USING (client_id IN (SELECT id FROM clients WHERE id IN (SELECT client_id FROM profiles WHERE id = auth.uid())));

-- Service role bypass (para as Edge Functions)
CREATE POLICY "Service role queue" ON notification_queue FOR ALL TO service_role USING (true);
CREATE POLICY "Service role logs" ON notification_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role reports" ON reports FOR ALL TO service_role USING (true);
CREATE POLICY "Service role prefs" ON client_notification_prefs FOR ALL TO service_role USING (true);
