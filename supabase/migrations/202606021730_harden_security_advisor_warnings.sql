-- Harden Supabase security advisor warnings without changing runtime data.
-- Keep idempotent so this can be replayed safely in linked environments.

begin;

-- SECURITY DEFINER / function search_path hardening.
alter function public.update_client_meta_connections_timestamp()
  set search_path = public;

alter function public.update_client_linkedin_connections_timestamp()
  set search_path = public;

alter function public.update_notification_prefs_timestamp()
  set search_path = public;

alter function public.handle_new_user()
  set search_path = public, auth;

alter function public.is_admin()
  set search_path = public;

alter function public.get_my_client_id()
  set search_path = public;

-- Deprecated DB-side WhatsApp sender had provider credentials embedded in SQL.
-- The active flow now queues reports and lets Edge Functions send them.
create or replace function public.send_whatsapp_reports()
returns json
language plpgsql
security invoker
set search_path = public
as $$
begin
  return public.enqueue_manual_reports();
end;
$$;

-- Remove always-true policies. Existing scoped policies remain:
-- ad_accounts: admin all + admin/client read
-- business_managers: admin all
drop policy if exists "Allow delete for all" on public.ad_accounts;
drop policy if exists "Allow insert for all" on public.ad_accounts;
drop policy if exists "Allow update for all" on public.ad_accounts;

drop policy if exists "Allow delete for all" on public.business_managers;
drop policy if exists "Allow insert for all" on public.business_managers;
drop policy if exists "Allow update for all" on public.business_managers;

drop policy if exists "Admin full access on crm_events" on public.crm_events;
create policy "Admin full access on crm_events"
on public.crm_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Remove public bucket listing while keeping public object URLs available.
drop policy if exists "Allow all on apresentacao" on storage.objects;
drop policy if exists "Allow public read" on storage.objects;
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Users can delete their own avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Authenticated users can update their own avatar" on storage.objects;
drop policy if exists "Authenticated users can delete their own avatar" on storage.objects;

create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars');

create policy "Authenticated users can update their own avatar"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars' and auth.uid() = owner)
with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Authenticated users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars' and auth.uid() = owner);

-- pg_net remains a manual Supabase platform item in this project:
-- the installed extension currently returns "does not support SET SCHEMA".

-- Revoke implicit PUBLIC execution on sensitive SECURITY DEFINER functions.
-- Re-grant only the app-facing RPCs that currently need authenticated callers.
revoke execute on function public.create_client_with_auth(text, text, text, text, uuid[]) from public;
revoke execute on function public.create_client_with_auth(text, text, text, text, uuid[]) from anon;
revoke execute on function public.create_client_with_auth(text, text, text, text, uuid[]) from authenticated;
revoke execute on function public.delete_auth_user(uuid) from public;
revoke execute on function public.delete_auth_user(uuid) from anon;
revoke execute on function public.delete_auth_user(uuid) from authenticated;
revoke execute on function public.enqueue_manual_reports() from public;
revoke execute on function public.enqueue_manual_reports() from anon;
revoke execute on function public.enqueue_single_client_report(uuid) from public;
revoke execute on function public.enqueue_single_client_report(uuid) from anon;
revoke execute on function public.get_my_client_id() from public;
revoke execute on function public.get_my_client_id() from anon;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
revoke execute on function public.send_whatsapp_reports() from public;
revoke execute on function public.send_whatsapp_reports() from anon;

grant execute on function public.enqueue_manual_reports() to authenticated;
grant execute on function public.enqueue_single_client_report(uuid) to authenticated;
grant execute on function public.get_my_client_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.send_whatsapp_reports() to authenticated;

commit;
