-- ===============================================
-- RPC: enqueue_single_client_report
-- Enfileira relatório para UM cliente específico
-- ===============================================

CREATE OR REPLACE FUNCTION public.enqueue_single_client_report(p_client_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_caller_role TEXT;
    v_agency_name TEXT;
    v_client_name TEXT;
    v_whatsapp TEXT;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 1. Verificar que é admin e pegar agency_name
    SELECT role, agency_name INTO v_caller_role, v_agency_name FROM profiles WHERE id = auth.uid();
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RETURN json_build_object('error', 'Apenas administradores podem disparar relatórios');
    END IF;
    v_agency_name := COALESCE(v_agency_name, 'Backstage Grow');

    -- 2. Verificar que o cliente existe
    SELECT name INTO v_client_name FROM clients WHERE id = p_client_id;
    IF v_client_name IS NULL THEN
        RETURN json_build_object('error', 'Cliente não encontrado');
    END IF;

    -- 3. Buscar WhatsApp do client_notification_prefs OU da tabela clients
    SELECT cnp.whatsapp_number INTO v_whatsapp
    FROM client_notification_prefs cnp
    WHERE cnp.client_id = p_client_id AND cnp.is_active = true;

    -- Fallback: buscar phone da tabela clients
    IF v_whatsapp IS NULL OR v_whatsapp = '' THEN
        SELECT phone INTO v_whatsapp FROM clients WHERE id = p_client_id;
    END IF;

    IF v_whatsapp IS NULL OR v_whatsapp = '' THEN
        RETURN json_build_object('error', 'Cliente "' || v_client_name || '" não tem WhatsApp cadastrado');
    END IF;

    -- 4. Inserir na fila
    INSERT INTO notification_queue (client_id, type, scheduled_for, payload, status, attempts)
    VALUES (
        p_client_id,
        'manual_report',
        v_today,
        jsonb_build_object('whatsapp_number', v_whatsapp, 'agency_name', v_agency_name),
        'pending',
        0
    )
    ON CONFLICT (client_id, type, scheduled_for) DO UPDATE
    SET status = 'pending',
        attempts = 0,
        payload = jsonb_build_object('whatsapp_number', v_whatsapp, 'agency_name', v_agency_name),
        updated_at = NOW();

    RETURN json_build_object(
        'success', true,
        'message', 'Relatório de "' || v_client_name || '" enfileirado com sucesso! O Worker processará em instantes.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_single_client_report(UUID) TO authenticated;
