-- Restrict explicit RPC grants left over from older migrations.

begin;

revoke execute on function public.create_client_with_auth(text, text, text, text, uuid[]) from anon;
revoke execute on function public.create_client_with_auth(text, text, text, text, uuid[]) from authenticated;

revoke execute on function public.delete_auth_user(uuid) from anon;
revoke execute on function public.delete_auth_user(uuid) from authenticated;

revoke execute on function public.enqueue_manual_reports() from anon;
revoke execute on function public.enqueue_single_client_report(uuid) from anon;

revoke execute on function public.get_my_client_id() from anon;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

revoke execute on function public.send_whatsapp_reports() from anon;

commit;
