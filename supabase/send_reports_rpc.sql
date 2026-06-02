-- ===============================================
-- RPC: send_whatsapp_reports
-- Envia relatórios via Evolution API direto do banco
-- Usa pg_net para fazer HTTP requests async
-- ===============================================

-- Garantir que pg_net está habilitado
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função principal: dispara relatórios para todos os clientes com notificação ativa
CREATE OR REPLACE FUNCTION public.send_whatsapp_reports()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
    v_caller_role TEXT;
    v_pref RECORD;
    v_client RECORD;
    v_account RECORD;
    v_msg TEXT;
    v_report_title TEXT;
    v_sent_count INT := 0;
    v_evo_url TEXT := 'https://api.vlogia.com.br/';
    v_evo_instance TEXT := 'ADS';
    v_evo_key TEXT := 'D4BEC1D5B883-4F2E-938E-D8176E277952';
    v_request_id BIGINT;
BEGIN
    -- Verificar que é admin
    SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RETURN json_build_object('error', 'Apenas administradores podem disparar relatórios');
    END IF;

    -- Loop por todos os clientes com notificação ativa
    FOR v_pref IN
        SELECT cnp.client_id, cnp.whatsapp_number, cnp.report_frequency
        FROM client_notification_prefs cnp
        WHERE cnp.is_active = true
        AND cnp.whatsapp_number IS NOT NULL
        AND cnp.whatsapp_number != ''
    LOOP
        -- Buscar dados do cliente
        SELECT c.name, c.email INTO v_client
        FROM clients c WHERE c.id = v_pref.client_id;

        IF v_client.name IS NULL THEN
            CONTINUE;
        END IF;

        -- Buscar conta de anúncio vinculada
        SELECT aa.name, aa.meta_id INTO v_account
        FROM ad_accounts aa WHERE aa.client_id = v_pref.client_id LIMIT 1;

        -- Montar mensagem
        v_msg := '🏢 *Backstage Grow - Performance Report*' || E'\n' ||
                 'Olá *' || v_client.name || '*! Tudo bem?' || E'\n\n' ||
                 '📊 Seu relatório de performance está pronto!' || E'\n\n';

        IF v_account.name IS NOT NULL THEN
            v_msg := v_msg || '📍 *Conta:* ' || v_account.name || E'\n';
        END IF;

        v_msg := v_msg || E'\n' ||
                 '🔗 Acesse seu painel para ver todos os detalhes:' || E'\n' ||
                 'https://metareports.backstagegrow.com.br' || E'\n\n' ||
                 '💡 _Dúvidas? Fale diretamente com seu gestor de conta._';

        -- Enviar via Evolution API (pg_net async)
        SELECT net.http_post(
            url := v_evo_url || 'message/sendText/' || v_evo_instance,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'apikey', v_evo_key
            ),
            body := jsonb_build_object(
                'number', v_pref.whatsapp_number,
                'options', jsonb_build_object('delay', 1200, 'presence', 'composing'),
                'text', v_msg
            )
        ) INTO v_request_id;

        -- Salvar no histórico de relatórios
        v_report_title := 'Relatório ' ||
            CASE WHEN v_pref.report_frequency = 'weekly' THEN 'Semanal' ELSE 'Diário' END ||
            ' — ' || v_client.name;

        INSERT INTO reports (client_id, title, period, date, status, whatsapp_number, data)
        VALUES (
            v_pref.client_id,
            v_report_title,
            CASE WHEN v_pref.report_frequency = 'weekly' THEN 'Últimos 7 dias' ELSE 'Últimas 24h' END,
            NOW(),
            'sent',
            v_pref.whatsapp_number,
            jsonb_build_object(
                'ad_account', COALESCE(v_account.name, 'Nenhuma'),
                'client_name', v_client.name,
                'pg_net_request_id', v_request_id
            )
        );

        v_sent_count := v_sent_count + 1;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'sent', v_sent_count,
        'message', v_sent_count || ' relatório(s) disparado(s) com sucesso!'
    );
END;
$$;
