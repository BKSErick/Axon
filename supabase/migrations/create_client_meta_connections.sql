-- =============================================
-- CLIENT META CONNECTIONS — OAuth Token Storage
-- MetaReports OAuth Integration
-- =============================================

-- Table to store client Facebook/Instagram OAuth tokens
CREATE TABLE IF NOT EXISTS client_meta_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  meta_user_id TEXT NOT NULL,
  meta_user_name TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  pages JSONB DEFAULT '[]'::jsonb,
  instagram_accounts JSONB DEFAULT '[]'::jsonb,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  UNIQUE(client_id, meta_user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_client_meta_conn_client ON client_meta_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_client_meta_conn_status ON client_meta_connections(status);

-- RLS
ALTER TABLE client_meta_connections ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all connections
CREATE POLICY admin_all_client_meta ON client_meta_connections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Clients can only read their own connection
CREATE POLICY client_read_own_meta ON client_meta_connections
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_client_meta_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_client_meta_connections_updated
  BEFORE UPDATE ON client_meta_connections
  FOR EACH ROW EXECUTE FUNCTION update_client_meta_connections_timestamp();
