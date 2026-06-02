-- =============================================
-- FIX 2: Add Meta token columns to social_client_profiles
-- The publish-social-post Edge Function expects these columns
-- to know WHERE to post (which Facebook Page / Instagram Account)
-- =============================================

ALTER TABLE public.social_client_profiles
ADD COLUMN IF NOT EXISTS facebook_page_id text,
ADD COLUMN IF NOT EXISTS facebook_page_token text,
ADD COLUMN IF NOT EXISTS instagram_account_id text;

-- =============================================
-- FIX 3: Create pg_cron job to auto-trigger publish-social-post
-- Runs every 5 minutes checking for posts whose scheduled time has passed
-- =============================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove old job if exists (to avoid duplicates)
SELECT cron.unschedule('publish-social-posts-cron')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'publish-social-posts-cron'
);

-- Schedule the Edge Function to run every 5 minutes
SELECT cron.schedule(
    'publish-social-posts-cron',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://whcfgflswdanptxsvfes.supabase.co/functions/v1/publish-social-post',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
