-- =============================================
-- SOCIAL MEDIA MODULE — DATABASE SCHEMA
-- MetaReports Sprint 1
-- =============================================

-- 1. ENUMS
CREATE TYPE social_platform AS ENUM ('facebook', 'instagram');
CREATE TYPE social_post_type AS ENUM ('feed', 'carousel', 'stories', 'reels', 'promotion');
CREATE TYPE social_post_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'scheduled', 
  'publishing', 'published', 'failed', 'rejected'
);

-- 2. Client Profiles for AI context
CREATE TABLE social_client_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  niche text,
  target_audience text,
  tone_of_voice text DEFAULT 'profissional',
  brand_colors text[],
  top_posts jsonb DEFAULT '[]'::jsonb,
  extra_context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

-- 3. Posts (central table)
CREATE TABLE social_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  post_type social_post_type NOT NULL DEFAULT 'feed',
  content_text text NOT NULL,
  media_urls text[] DEFAULT '{}',
  hashtags text,
  status social_post_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  meta_post_id text,
  ai_model text,
  ai_score real,
  briefing text,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. AI-generated text variations
CREATE TABLE social_post_variations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  variation_index int NOT NULL DEFAULT 0,
  content_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. Post-publish metrics
CREATE TABLE social_post_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  impressions int DEFAULT 0,
  reach int DEFAULT 0,
  engagement int DEFAULT 0,
  clicks int DEFAULT 0,
  likes int DEFAULT 0,
  comments int DEFAULT 0,
  shares int DEFAULT 0,
  collected_at timestamptz DEFAULT now()
);

-- 6. Schedule jobs (replaces BullMQ — uses pg_cron)
CREATE TABLE social_schedule_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  next_retry_at timestamptz,
  ig_container_id text,
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7. Time score heatmap per client
CREATE TABLE social_client_time_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour int NOT NULL CHECK (hour BETWEEN 0 AND 23),
  score real DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, platform, day_of_week, hour)
);

-- 8. Meta Page Tokens for publishing
CREATE TABLE social_meta_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  page_name text,
  ig_account_id text,
  access_token_enc text NOT NULL,
  expires_at timestamptz,
  last_verified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, page_id)
);

-- INDEXES
CREATE INDEX idx_social_posts_client ON social_posts(client_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_social_schedule_jobs_status ON social_schedule_jobs(status);
CREATE INDEX idx_social_post_metrics_post ON social_post_metrics(post_id);

-- RLS POLICIES
ALTER TABLE social_client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_schedule_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_client_time_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_meta_tokens ENABLE ROW LEVEL SECURITY;

-- Admin policies (full access)
CREATE POLICY "admin_all_social_client_profiles" ON social_client_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "admin_all_social_posts" ON social_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "admin_all_social_post_variations" ON social_post_variations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "admin_all_social_post_metrics" ON social_post_metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "admin_all_social_schedule_jobs" ON social_schedule_jobs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "admin_all_social_client_time_scores" ON social_client_time_scores FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "admin_all_social_meta_tokens" ON social_meta_tokens FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Client policies (read own data)
CREATE POLICY "client_read_own_social_posts" ON social_posts FOR SELECT
  USING (client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "client_update_own_social_posts" ON social_posts FOR UPDATE
  USING (client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid()))
  WITH CHECK (client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "client_read_own_profile" ON social_client_profiles FOR SELECT
  USING (client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "client_read_own_variations" ON social_post_variations FOR SELECT
  USING (post_id IN (SELECT id FROM social_posts WHERE client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid())));

CREATE POLICY "client_read_own_metrics" ON social_post_metrics FOR SELECT
  USING (post_id IN (SELECT id FROM social_posts WHERE client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid())));
