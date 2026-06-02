-- Daily automatic Meta token refresh.
-- Target project: Supabase Meta (whcfgflswdanptxsvfes).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('refresh-meta-tokens-daily')
where exists (
  select 1 from cron.job where jobname = 'refresh-meta-tokens-daily'
);

select cron.schedule(
  'refresh-meta-tokens-daily',
  '15 6 * * *',
  $$
  select net.http_post(
    url := 'https://whcfgflswdanptxsvfes.supabase.co/functions/v1/refresh-meta-tokens',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"source":"pg_cron"}'::jsonb
  ) as request_id;
  $$
);
