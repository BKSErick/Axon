-- =============================================
-- CLIENT LINKEDIN CONNECTIONS — OAuth Token Storage
-- MetaReports LinkedIn Integration
-- =============================================

-- Table to store client LinkedIn OAuth tokens
CREATE TABLE IF NOT EXISTS client_linkedin_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  linkedin_user_id TEXT NOT NULL,
  linkedin_user_name TEXT,
  linkedin_email TEXT,
  linkedin_profile_picture TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  -- Organization (Company Page) data
  organizations JSONB DEFAULT '[]'::jsonb,
  -- Ad Accounts data
  ad_accounts JSONB DEFAULT '[]'::jsonb,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  UNIQUE(client_id, linkedin_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_linkedin_conn_client ON client_linkedin_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_client_linkedin_conn_status ON client_linkedin_connections(status);

-- RLS
ALTER TABLE client_linkedin_connections ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all connections
CREATE POLICY admin_all_client_linkedin ON client_linkedin_connections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Clients can only read their own connection
CREATE POLICY client_read_own_linkedin ON client_linkedin_connections
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_client_linkedin_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_client_linkedin_connections_updated
  BEFORE UPDATE ON client_linkedin_connections
  FOR EACH ROW EXECUTE FUNCTION update_client_linkedin_connections_timestamp();
