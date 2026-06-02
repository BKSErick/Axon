-- RPC: enqueue_manual_reports
-- Enqueues all active clients into notification_queue.
-- Runs as invoker; admin authorization is enforced by RLS and the role check below.

alter table public.notification_queue drop constraint if exists notification_queue_type_check;
alter table public.notification_queue add constraint notification_queue_type_check
  check (type in ('daily_report', 'weekly_report', 'performance_alert', 'daily_report_test', 'real_performance_report', 'manual_report'));

create or replace function public.enqueue_manual_reports()
returns json
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_caller_role text;
    v_agency_name text;
    v_pref record;
    v_queued_count int := 0;
    v_skipped_count int := 0;
    v_today date := current_date;
begin
    select role, agency_name
      into v_caller_role, v_agency_name
    from public.profiles
    where id = auth.uid();

    if v_caller_role is null or v_caller_role != 'admin' then
        return json_build_object('error', 'Apenas administradores podem disparar relatorios');
    end if;

    v_agency_name := coalesce(v_agency_name, 'Backstage Grow');

    for v_pref in
        select cnp.client_id, cnp.whatsapp_number, cnp.report_frequency
        from public.client_notification_prefs cnp
        where cnp.is_active = true
          and cnp.whatsapp_number is not null
          and cnp.whatsapp_number != ''
    loop
        begin
            insert into public.notification_queue (client_id, type, scheduled_for, payload, status, attempts)
            values (
                v_pref.client_id,
                'manual_report',
                v_today,
                jsonb_build_object('whatsapp_number', v_pref.whatsapp_number, 'agency_name', v_agency_name),
                'pending',
                0
            );
            v_queued_count := v_queued_count + 1;
        exception when unique_violation then
            v_skipped_count := v_skipped_count + 1;
        end;
    end loop;

    return json_build_object(
        'success', true,
        'queued', v_queued_count,
        'skipped', v_skipped_count,
        'message', v_queued_count || ' relatorio(s) enfileirado(s)! ' ||
                   case when v_skipped_count > 0 then v_skipped_count || ' ja estava(m) na fila.' else '' end ||
                   ' O worker vai processar em instantes.'
    );
end;
$$;

grant execute on function public.enqueue_manual_reports() to authenticated;
