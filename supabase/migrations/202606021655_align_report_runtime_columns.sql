-- Align remote report tables with the runtime functions/workers.
-- The remote schema was missing columns referenced by enqueue/report flows.

alter table if exists public.notification_queue
  add column if not exists updated_at timestamptz default now();

alter table if exists public.reports
  add column if not exists pdf_url text,
  add column if not exists whatsapp_number text,
  add column if not exists data jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

create index if not exists idx_reports_created_at
  on public.reports (created_at desc);
