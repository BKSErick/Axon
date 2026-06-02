import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── SHA256 hash helper ─────────────────────────────────────────────────────────
async function sha256(input: string): Promise<string> {
    const data = new TextEncoder().encode(input.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Normalize phone to E.164 ───────────────────────────────────────────────────
function normalizePhone(phone: string): string {
    // Remove tudo que não é dígito
    let digits = phone.replace(/\D/g, '');
    // Se começa com 0, remove
    if (digits.startsWith('0')) digits = digits.slice(1);
    // Se não tem código de país, assume Brasil (+55)
    if (!digits.startsWith('55') && digits.length <= 11) {
        digits = '55' + digits;
    }
    return digits;
}

// ── Meta CAPI Config ───────────────────────────────────────────────────────────
const DATASET_ID = '1392918289270554';
const API_VERSION = 'v25.0';
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}/${DATASET_ID}/events`;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const metaToken = Deno.env.get('META_API_TOKEN');
        if (!metaToken) {
            return new Response(
                JSON.stringify({ error: 'META_API_TOKEN não configurado nos Secrets' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Parse body ──────────────────────────────────────────────────────────
        const body = await req.json();
        const {
            event_name,       // ex: 'Lead Qualificado', 'Venda Fechada'
            lead_email,       // email do lead
            lead_phone,       // telefone do lead
            lead_id,          // ID de 15-17 dígitos da Meta (opcional)
            client_id,        // UUID do cliente na tabela clients
            ad_account_id,    // UUID da conta na tabela ad_accounts (opcional)
            test_event_code,  // Código de teste da Meta (opcional - para debug)
        } = body;

        if (!event_name) {
            return new Response(
                JSON.stringify({ error: 'event_name é obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!lead_email && !lead_phone && !lead_id) {
            return new Response(
                JSON.stringify({ error: 'Pelo menos lead_email, lead_phone ou lead_id é necessário para correspondência' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Build user_data with SHA256 hashes ──────────────────────────────────
        const userData: Record<string, any> = {};

        if (lead_email) {
            userData.em = [await sha256(lead_email)];
        }
        if (lead_phone) {
            const normalizedPhone = normalizePhone(lead_phone);
            userData.ph = [await sha256(normalizedPhone)];
        }
        if (lead_id) {
            userData.lead_id = lead_id;
        }

        // ── Build Meta CAPI payload ─────────────────────────────────────────────
        const eventTime = Math.floor(Date.now() / 1000);

        const payload: Record<string, any> = {
            data: [
                {
                    event_name: event_name,
                    event_time: eventTime,
                    action_source: 'system_generated',
                    user_data: userData,
                    custom_data: {
                        event_source: 'crm',
                        lead_event_source: 'MetaReports',
                    },
                },
            ],
        };

        // Se há código de teste, inclui no payload
        if (test_event_code) {
            payload.test_event_code = test_event_code;
        }

        console.log(`[send-crm-event] Enviando evento "${event_name}" para Meta CAPI...`);
        console.log(`[send-crm-event] Payload:`, JSON.stringify(payload, null, 2));

        // ── Send to Meta ────────────────────────────────────────────────────────
        const metaResponse = await fetch(`${GRAPH_URL}?access_token=${metaToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const metaData = await metaResponse.json();

        console.log(`[send-crm-event] Meta Response (${metaResponse.status}):`, JSON.stringify(metaData));

        const isSuccess = metaResponse.ok && !metaData.error;

        // ── Log to crm_events table ─────────────────────────────────────────────
        const logEntry = {
            client_id: client_id || null,
            ad_account_id: ad_account_id || null,
            event_name: event_name,
            event_time: eventTime,
            lead_id: lead_id || null,
            lead_email: lead_email || null,
            lead_phone: lead_phone || null,
            meta_response: metaData,
            status: isSuccess ? 'sent' : 'error',
            error_message: isSuccess ? null : (metaData.error?.message || `HTTP ${metaResponse.status}`),
        };

        const { error: dbError } = await supabase.from('crm_events').insert([logEntry]);
        if (dbError) {
            console.error('[send-crm-event] Erro ao salvar log no banco:', dbError);
        }

        // ── Return response ─────────────────────────────────────────────────────
        if (isSuccess) {
            return new Response(
                JSON.stringify({
                    success: true,
                    events_received: metaData.events_received || 1,
                    message: `Evento "${event_name}" enviado com sucesso para a Meta`,
                    fbtrace_id: metaData.fbtrace_id,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        } else {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: metaData.error?.message || 'Erro desconhecido da Meta API',
                    error_code: metaData.error?.code,
                    fbtrace_id: metaData.fbtrace_id,
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

    } catch (err: any) {
        console.error('[send-crm-event] Erro fatal:', err);
        return new Response(
            JSON.stringify({ error: 'Erro interno: ' + err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
