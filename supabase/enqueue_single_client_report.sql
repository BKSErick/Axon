-- RPC: enqueue_single_client_report
-- Enqueues one client report. Runs as invoker and depends on admin RLS policies.

create or replace function public.enqueue_single_client_report(p_client_id uuid)
returns json
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_caller_role text;
    v_agency_name text;
    v_client_name text;
    v_whatsapp text;
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

    select name
      into v_client_name
    from public.clients
    where id = p_client_id;

    if v_client_name is null then
        return json_build_object('error', 'Cliente nao encontrado');
    end if;

    select cnp.whatsapp_number
      into v_whatsapp
    from public.client_notification_prefs cnp
    where cnp.client_id = p_client_id
      and cnp.is_active = true;

    if v_whatsapp is null or v_whatsapp = '' then
        select phone
          into v_whatsapp
        from public.clients
        where id = p_client_id;
    end if;

    if v_whatsapp is null or v_whatsapp = '' then
        return json_build_object('error', 'Cliente "' || v_client_name || '" nao tem WhatsApp cadastrado');
    end if;

    insert into public.notification_queue (client_id, type, scheduled_for, payload, status, attempts)
    values (
        p_client_id,
        'manual_report',
        v_today,
        jsonb_build_object('whatsapp_number', v_whatsapp, 'agency_name', v_agency_name),
        'pending',
        0
    )
    on conflict (client_id, type, scheduled_for) do update
    set status = 'pending',
        attempts = 0,
        payload = jsonb_build_object('whatsapp_number', v_whatsapp, 'agency_name', v_agency_name),
        updated_at = now();

    return json_build_object(
        'success', true,
        'message', 'Relatorio de "' || v_client_name || '" enfileirado com sucesso! O Worker processara em instantes.'
    );
end;
$$;

grant execute on function public.enqueue_single_client_report(uuid) to authenticated;
