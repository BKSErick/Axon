import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { format, utcToZonedTime as toZonedTime } from 'https://esm.sh/date-fns-tz@2'

// Configurações e Deno Args
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Pegamos o horário de Brasília Exato
        const now = new Date()
        const spTime = toZonedTime(now, 'America/Sao_Paulo')

        // Formatamos apenas a HORA (HH:) para buscar qualquer minuto dentro daquela janela (ex: 19:10 será achado às 19:00)
        const currentHourPrefix = format(spTime, 'HH:', { timeZone: 'America/Sao_Paulo' })
        const currentDayOfWeek = spTime.getDay() || 7 // 1=Monday... 7=Sunday

        console.log(`⏱️ Rotina do Cronjob iniciada. HORA PREFIXO: ${currentHourPrefix} - Dia Semana: ${currentDayOfWeek}`);

        // Pegamos todos os clientes ativos que possuem notificação marcada PARA QUALQUER MINUTO DESSA HORA.
        const { data: prefs, error: prefsError } = await supabase
            .from('client_notification_prefs')
            .select('client_id, whatsapp_number, report_frequency, weekly_day')
            .eq('is_active', true)
            .gte('send_time', `${currentHourPrefix}00:00`)
            .lte('send_time', `${currentHourPrefix}59:59`)

        if (prefsError) throw prefsError

        if (!prefs || prefs.length === 0) {
            console.log(`🤷 Nenhum cliente configurado para rodar às ${currentHourPrefix}.`);
            return new Response(JSON.stringify({ message: "Sem clientes para este horário" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Filtrar os clientes caso seja "Semanal" para ver se hoje é o dia correto.
        const eligibleClients = prefs.filter(p => {
            if (p.report_frequency === 'daily') return true;
            if (p.report_frequency === 'weekly' && p.weekly_day === currentDayOfWeek) return true;
            return false;
        });

        if (eligibleClients.length === 0) {
            console.log(`🤷 Clientes encontrados, mas nenhum qualificado para disparar HOJE (Filtro Semanal bloqueou).`);
            return new Response(JSON.stringify({ message: "Sem clientes para Hoje" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        console.log(`🔥 Encontrados ${eligibleClients.length} clientes para notificar. Enfileirando...`);

        // Criar o payload para ser inserido na Fila
        // "scheduled_for" é o DIA de hoje zereado para podermos usar a Trava Unique Constraint Diária (Para não cair risco de Double Send).
        // 2. Enfileirar no notification_queue
        console.log(`📝 Enfileirando ${eligibleClients.length} relatórios...`)

        const todayZeroedUTC = new Date();
        todayZeroedUTC.setUTCHours(0, 0, 0, 0);

        const queueTasks = eligibleClients.map(client => ({
            client_id: client.client_id,
            type: client.report_frequency === 'daily' ? 'daily_report' : 'weekly_report',
            scheduled_for: todayZeroedUTC.toISOString(),
            payload: {
                whatsapp_number: client.whatsapp_number
            }
        }))

        const { error: queueError } = await supabase
            .from('notification_queue')
            .upsert(queueTasks, { onConflict: 'client_id,type,scheduled_for' });
        // O Supabase não tem um "insert ignore" tão simples em REST apis via SDK JS sem RPC, 
        // mas a Unique Constraint vai jogar erro 23505. O correto para produção em edge seria iterar ou fazer um UPSERT ON CONFLICT DO NOTHING.
        // O ideal é a rotina correr limpa. Vamos ignorar erros the Unique Constraint caso aconteçam num cenário de "Retentativa manual do cron".

        if (queueError) {
            if (queueError.code === '23505') {
                console.log("⚠️ Alguns (ou todos) registros já estavam na Fila hoje (Anti-Spam ativado).");
            } else {
                console.error("❌ Erro grave ao enfileirar:", queueError);
                throw queueError;
            }
        } else {
            console.log(`✅ ${queueTasks.length} trabalhos inseridos na Fila de Processamento!`);
        }

        return new Response(JSON.stringify({ success: true, queued: queueTasks.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("Critical Error", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
