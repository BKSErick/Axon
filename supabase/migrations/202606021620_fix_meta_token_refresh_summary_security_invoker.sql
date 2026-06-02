-- Fix Supabase Security Advisor warning:
-- View public.v_meta_token_refresh_summary should evaluate permissions/RLS as
-- the querying user instead of the view owner.

alter view if exists public.v_meta_token_refresh_summary
  set (security_invoker = true);

revoke all on public.v_meta_token_refresh_summary from anon;
grant select on public.v_meta_token_refresh_summary to authenticated;
