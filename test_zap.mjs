import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whcfgflswdanptxsvfes.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2ZnZmxzd2RhbnB0eHN2ZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDA3MTgsImV4cCI6MjA4NzA3NjcxOH0.cvOq318HShJa3sqj3tPPkDO07lzr2xDJYFGX4PkA20k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('[TESTE E2E] Buscando configurações de notificação ativas do Robson...');
    const { data: prefs, error: errFetch } = await supabase.from('client_notification_prefs').select('*').eq('is_active', true).limit(1).single();

    if (errFetch || !prefs) {
        return console.log('[x] Nenhuma preferencia ativa encontrada na tabela client_notification_prefs. O cliente ativou o switchzinho verde?');
    }

    console.log(`[>>] Preferencia encontrada! Inserindo Relatório Falso na Fila para o número ${prefs.whatsapp_number}...`);

    const { data: q, error: errInsert } = await supabase.from('notification_queue').insert({
        client_id: prefs.client_id,
        type: 'daily_report_test', // Título simbólico
        payload: { whatsapp_number: prefs.whatsapp_number },
        status: 'pending'
    }).select().single();

    if (errInsert) return console.log('[x] Erro ao inserir na fila de notificações:', errInsert);

    console.log(`[>>] Mensagem inserida com sucesso (Task ID: ${q.id}). Invocando o Edge Function (Worker) para empurrá-la pro WhatsApp via API...`);

    // Opcão 1: Request via cURL Nativo Node (edge function url) -> Bate no POST
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-reports-worker`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });
        const resData = await response.json();
        console.log('[OK!] Resposta do Supabase Worker:', resData);
        console.log('\n✅ TESTE CONCLUIDO! Verifique o WhatsApp!');
    } catch (e) {
        console.error('[x] Falha na HTTP Call:', e);
    }
}

run();
