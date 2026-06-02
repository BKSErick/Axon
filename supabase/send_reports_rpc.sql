-- Deprecated compatibility wrapper.
-- The active WhatsApp report flow is enqueue_manual_reports() + Edge Worker.

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

revoke execute on function public.send_whatsapp_reports() from public;
grant execute on function public.send_whatsapp_reports() to authenticated;
