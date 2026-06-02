-- ============================================
-- TABELA: crm_events
-- Registra eventos de conversão enviados à Meta CAPI
-- ============================================

CREATE TABLE IF NOT EXISTS crm_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  ad_account_id UUID REFERENCES ad_accounts(id),
  event_name TEXT NOT NULL,                    -- ex: 'Lead Qualificado', 'Venda Fechada'
  event_time BIGINT NOT NULL,                  -- Unix timestamp em segundos
  lead_id TEXT,                                -- ID de 15-17 dígitos gerado pela Meta (se capturado)
  lead_email TEXT,                             -- email original (para referência interna)
  lead_phone TEXT,                             -- telefone original (para referência interna)
  meta_response JSONB,                         -- resposta completa da Meta API
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE crm_events ENABLE ROW LEVEL SECURITY;

-- Admin pode ler/escrever tudo
CREATE POLICY "Admin full access on crm_events"
  ON crm_events FOR ALL USING (true);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_crm_events_client ON crm_events(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_status ON crm_events(status);
CREATE INDEX IF NOT EXISTS idx_crm_events_created ON crm_events(created_at DESC);
