-- =============================================
-- FIX 1: Create social_schedule_queue table
-- The UI and Edge Function both reference 'social_schedule_queue',
-- but the original migration only created 'social_schedule_jobs'.
-- This script creates the correct table.
-- =============================================

-- Create the table that the UI (SocialMediaPanel) and
-- Edge Function (publish-social-post) actually reference
CREATE TABLE IF NOT EXISTS public.social_schedule_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    scheduled_for timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    error_message text,
    attempts int DEFAULT 0,
    published_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Index for the Edge Function query: WHERE status='pending' AND scheduled_for <= now()
CREATE INDEX IF NOT EXISTS idx_social_schedule_queue_pending
    ON public.social_schedule_queue (status, scheduled_for)
    WHERE status = 'pending';

-- RLS
ALTER TABLE public.social_schedule_queue ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_all_social_schedule_queue" ON public.social_schedule_queue FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Client read-only (can see their own scheduled posts)
CREATE POLICY "client_read_own_schedule_queue" ON public.social_schedule_queue FOR SELECT
    USING (post_id IN (
        SELECT id FROM social_posts
        WHERE client_id IN (SELECT client_id FROM profiles WHERE profiles.id = auth.uid())
    ));

-- Refresh schema cache so Supabase API recognizes the new table immediately
NOTIFY pgrst, 'reload schema';
