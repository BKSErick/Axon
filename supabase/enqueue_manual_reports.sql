-- ===============================================
-- RPC: enqueue_manual_reports
-- Substitui o send_whatsapp_reports
-- Enfileira todos os clientes ativos na notification_queue
-- O Worker (Edge Function) processa automaticamente
-- ===============================================

-- Garantir que o type 'manual_report' é aceito na fila
ALTER TABLE public.notification_queue DROP CONSTRAINT IF EXISTS notification_queue_type_check;
ALTER TABLE public.notification_queue ADD CONSTRAINT notification_queue_type_check 
  CHECK (type IN ('daily_report', 'weekly_report', 'performance_alert', 'daily_report_test', 'real_performance_report', 'manual_report'));

CREATE OR REPLACE FUNCTION public.enqueue_manual_reports()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_caller_role TEXT;
    v_agency_name TEXT;
    v_pref RECORD;
    v_queued_count INT := 0;
    v_skipped_count INT := 0;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 1. Verificar que é admin e pegar o agency_name do admin que disparou
    SELECT role, agency_name INTO v_caller_role, v_agency_name FROM profiles WHERE id = auth.uid();
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RETURN json_build_object('error', 'Apenas administradores podem disparar relatórios');
    END IF;

    -- Fallback se agency_name estiver vazio
    v_agency_name := COALESCE(v_agency_name, 'Backstage Grow');

    -- 2. Loop por todos os clientes com notificação ativa
    FOR v_pref IN
        SELECT cnp.client_id, cnp.whatsapp_number, cnp.report_frequency
        FROM client_notification_prefs cnp
        WHERE cnp.is_active = true
        AND cnp.whatsapp_number IS NOT NULL
        AND cnp.whatsapp_number != ''
    LOOP
        -- 3. Tentar inserir na fila (ON CONFLICT DO NOTHING = anti-spam)
        BEGIN
            INSERT INTO notification_queue (client_id, type, scheduled_for, payload, status, attempts)
            VALUES (
                v_pref.client_id,
                'manual_report',
                v_today,
                jsonb_build_object('whatsapp_number', v_pref.whatsapp_number, 'agency_name', v_agency_name),
                'pending',
                0
            );
            v_queued_count := v_queued_count + 1;
        EXCEPTION WHEN unique_violation THEN
            -- Já foi enfileirado hoje, pular (anti-spam)
            v_skipped_count := v_skipped_count + 1;
        END;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'queued', v_queued_count,
        'skipped', v_skipped_count,
        'message', v_queued_count || ' relatório(s) enfileirado(s)! ' ||
                   CASE WHEN v_skipped_count > 0 THEN v_skipped_count || ' já estava(m) na fila.' ELSE '' END ||
                   ' O worker vai processar em instantes.'
    );
END;
$$;
