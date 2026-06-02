-- Reduce remaining Security Advisor warnings:
-- - keep RLS helper functions out of the exposed public API schema
-- - make report queue RPCs run as invoker, relying on admin RLS policies

begin;

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function private.get_my_client_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select client_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.get_my_client_id() to authenticated;

alter policy "Ad Accounts All" on public.ad_accounts
  using (private.is_admin());

alter policy "Ad Accounts View" on public.ad_accounts
  using (private.is_admin() or client_id = private.get_my_client_id());

alter policy "BM All" on public.business_managers
  using (private.is_admin());

alter policy "Campaigns All" on public.campaigns
  using (private.is_admin());

alter policy "Campaigns View" on public.campaigns
  using (
    private.is_admin()
    or account_id in (
      select ad_accounts.id
      from public.ad_accounts
      where ad_accounts.client_id = private.get_my_client_id()
    )
  );

alter policy "Admins can modify all preferences" on public.client_notification_prefs
  using (private.is_admin());

alter policy "Admins can view all preferences" on public.client_notification_prefs
  using (private.is_admin());

alter policy "Clients All" on public.clients
  using (private.is_admin());

alter policy "Clients View" on public.clients
  using (private.is_admin() or id = private.get_my_client_id());

alter policy "Admin full access on crm_events" on public.crm_events
  using (private.is_admin())
  with check (private.is_admin());

alter policy "Admins can view all logs" on public.notification_logs
  using (private.is_admin());

alter policy "Admins can manage queue" on public.notification_queue
  using (private.is_admin());

alter policy "Permissions All" on public.permissions
  using (private.is_admin());

alter policy "Permissions View" on public.permissions
  using (private.is_admin() or client_id = private.get_my_client_id());

alter policy "Profiles View" on public.profiles
  using (private.is_admin() or id = auth.uid());

alter policy "Reports All" on public.reports
  using (private.is_admin());

alter policy "Reports View" on public.reports
  using (private.is_admin() or client_id = private.get_my_client_id());

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
        return json_build_object('error', 'Apenas administradores podem disparar relatórios');
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
        'message', v_queued_count || ' relatório(s) enfileirado(s)! ' ||
                   case when v_skipped_count > 0 then v_skipped_count || ' já estava(m) na fila.' else '' end ||
                   ' O worker vai processar em instantes.'
    );
end;
$$;

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
        return json_build_object('error', 'Apenas administradores podem disparar relatórios');
    end if;

    v_agency_name := coalesce(v_agency_name, 'Backstage Grow');

    select name
      into v_client_name
    from public.clients
    where id = p_client_id;

    if v_client_name is null then
        return json_build_object('error', 'Cliente não encontrado');
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
        return json_build_object('error', 'Cliente "' || v_client_name || '" não tem WhatsApp cadastrado');
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
        'message', 'Relatório de "' || v_client_name || '" enfileirado com sucesso! O Worker processará em instantes.'
    );
end;
$$;

revoke execute on function public.is_admin() from authenticated;
revoke execute on function public.get_my_client_id() from authenticated;

grant execute on function public.enqueue_manual_reports() to authenticated;
grant execute on function public.enqueue_single_client_report(uuid) to authenticated;

commit;
