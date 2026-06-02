import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Apenas processamento Backend - pode ser batido a cada 1 minuto pelo cronjob.
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const evoApiUrl = Deno.env.get('EVO_API_URL');
        const evoInstance = Deno.env.get('EVO_INSTANCE');
        const evoApiKey = Deno.env.get('EVO_API_KEY');

        // Simulação do Token do META (deve estar cadastrado no Supabase Secrets)
        const metaApiToken = Deno.env.get('META_API_TOKEN') || '';

        // 1. Puxar 5 tarefas 'pending' da fila
        const { data: queueItems, error: queueError } = await supabase
            .from('notification_queue')
            .select(`
            id, client_id, type, payload, status, attempts
        `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(5);

        if (queueError) throw queueError
        if (!queueItems || queueItems.length === 0) {
            return new Response(JSON.stringify({ message: "Nenhuma notificação na fila" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        console.log(`Processing ${queueItems.length} notifications...`);
        const results = [];

        // 2. Loop de Processamento
        for (const item of queueItems) {
            // Marcamos como 'processing' pra evitar duplo disparo na próxima varredura
            await supabase.from('notification_queue').update({ status: 'processing', attempts: item.attempts + 1 }).eq('id', item.id);

            try {
                const phoneNumber = item.payload?.whatsapp_number;
                if (!phoneNumber) throw new Error("Número de telefone não encontrado no payload");

                // 3. Buscar Dados do Cliente (da tabela CLIENTS, não profiles)
                const { data: clientRow } = await supabase.from('clients').select('name, email').eq('id', item.client_id).single();
                const clientName = clientRow?.name || 'Cliente';

                // Buscar nome da agência (prioriza o payload, senão busca do admin)
                let agencyName = item.payload?.agency_name || '';
                if (!agencyName) {
                    const { data: adminProfile } = await supabase.from('profiles').select('agency_name').eq('role', 'admin').not('agency_name', 'is', null).limit(1).single();
                    agencyName = adminProfile?.agency_name || 'Backstage Grow';
                }

                let adAccountName = 'Conta Principal';
                let adAccountId = 'N/A';

                let totalSpend = 0;
                let totalLeads = 0;
                let totalMsgLeads = 0;
                let totalImpressions = 0;
                let totalReach = 0;
                let totalClicks = 0;
                let cpa = 0;
                let ctr = 0;
                let topCampaign = 'Não identificada';
                let hasData = false;

                // Buscar contas vinculadas ao cliente
                const { data: adAccounts } = await supabase.from('ad_accounts').select('id, name, meta_id').eq('client_id', item.client_id).eq('status', 'active');

                const metaToken = Deno.env.get('META_API_TOKEN');

                if (adAccounts && adAccounts.length > 0 && metaToken) {
                    // Usar a primeira conta para nome/id
                    adAccountName = adAccounts[0].name;
                    adAccountId = adAccounts[0].meta_id;

                    // Buscar insights REAIS da Meta API para cada conta vinculada
                    for (const acc of adAccounts) {
                        try {
                            const insRes = await fetch(
                                `https://graph.facebook.com/v21.0/${acc.meta_id}/insights?date_preset=last_7d&fields=spend,impressions,reach,clicks,actions,cost_per_action_type&access_token=${metaToken}`
                            );
                            const insData = await insRes.json();
                            const insights = insData.data?.[0];

                            if (insights) {
                                hasData = true;
                                totalSpend += Number(insights.spend || 0);
                                totalImpressions += Number(insights.impressions || 0);
                                totalReach += Number(insights.reach || 0);
                                totalClicks += Number(insights.clicks || 0);

                                const actions = insights.actions || [];
                                const formLeads = actions.find((a: any) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
                                const msgLeads = actions.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');

                                totalLeads += Number(formLeads?.value || 0);
                                totalMsgLeads += Number(msgLeads?.value || 0);
                            }
                        } catch (err) {
                            console.error(`Erro ao buscar insights Meta para ${acc.meta_id}:`, err);
                        }
                    }

                    // Calcular métricas agregadas
                    const allLeads = totalLeads + totalMsgLeads;
                    cpa = allLeads > 0 ? totalSpend / allLeads : 0;
                    ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
                    totalLeads = allLeads; // usar total combinado

                    // Buscar campanha destaque (maior gasto)
                    try {
                        const campRes = await fetch(
                            `https://graph.facebook.com/v21.0/${adAccounts[0].meta_id}/campaigns?fields=name,status,insights.date_preset(last_7d){spend,actions}&limit=10&access_token=${metaToken}`
                        );
                        const campData = await campRes.json();
                        if (campData.data && campData.data.length > 0) {
                            const activeCamps = campData.data.filter((c: any) => c.status === 'ACTIVE' && c.insights?.data?.[0]);
                            if (activeCamps.length > 0) {
                                activeCamps.sort((a: any, b: any) => Number(b.insights.data[0].spend) - Number(a.insights.data[0].spend));
                                topCampaign = activeCamps[0].name;
                            }
                        }
                    } catch (err) {
                        console.error("Erro ao buscar campanha destaque:", err);
                    }
                } else if (!adAccounts || adAccounts.length === 0) {
                    console.warn(`Cliente ${item.client_id} não tem conta de anúncio vinculada.`);
                } else if (!metaToken) {
                    console.warn('META_API_TOKEN não configurado nos Secrets do Supabase!');
                }

                // Formatadores Monetários
                const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

                // FORMATO DA MENSAGEM: Legenda do WhatsApp
                let reportMessage = `
🏢 *${agencyName} - Performance Real-Time*
Olá *${clientName}*! Tudo bem?

Analisamos seus números e os dados da sua conta *${adAccountName}* já foram consolidados:

💰 *Investimento (7D):* ${formatCurrency(totalSpend)}
🎯 *Leads Gerados:* ${totalLeads}
📉 *Custo por Lead:* ${formatCurrency(cpa)}
👁️ *Impressões:* ${totalImpressions.toLocaleString('pt-BR')}
📊 *Alcance:* ${totalReach.toLocaleString('pt-BR')}
📈 *CTR:* ${ctr.toFixed(2)}%
        
📍 Nosso time de BI identificou oportunidades de escala na sua conta. 
Acesse o PDF anexo ou seu painel para detalhes por campanha. 🚀`.trim();

                if (!hasData) {
                    reportMessage = `
🏢 *${agencyName} - Setup Inicial*
Olá *${clientName}*! Tudo bem?

Sua conta já está rastreada, mas ainda não captamos volume de investimento nas últimas 24h para gerar o relatório de performance.
Fique tranquilo, o algoritmo já está trabalhando.
                    `.trim();
                }

                // 3. INTEGRAÇÃO API2PDF (Gerar Relatório Visual Premium Dark Mode)

                const api2PdfKey = Deno.env.get('API2PDF_KEY');
                if (!api2PdfKey) console.warn('⚠️ API2PDF_KEY não configurada nos Secrets do Supabase!');
                let pdfUrl = null;

                try {
                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
                            <style>
                                body { font-family: 'Inter', sans-serif; background-color: #0B0F19; color: #F9FAFB; padding: 40px; margin: 0; }
                                .header { border-bottom: 1px solid #1F2937; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                                .agency-title { font-size: 28px; font-weight: 800; margin: 0; background: -webkit-linear-gradient(#06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                                .subtitle { color: #9CA3AF; font-size: 14px; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
                                .client-info { text-align: right; }
                                .client-name { font-size: 16px; font-weight: 600; color: #E5E7EB; }
                                .stamp { font-size: 12px; font-weight: 600; color: #10B981; background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 8px;}
                                
                                .grid-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                                .card { background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); }
                                .meta-label { color: #94A3B8; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
                                .meta-value { font-size: 28px; font-weight: 800; color: #FFFFFF; }
                                .cyan-text { color: #22D3EE; }
                                
                                .highlight-box { background: linear-gradient(145deg, #1e3a8a20, #0891b220); border-left: 4px solid #06b6d4; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px; }
                                .h-title { font-size: 15px; font-weight: 600; color: #E5E7EB; margin: 0 0 4px 0; }
                                .h-desc { font-size: 14px; color: #9CA3AF; margin: 0; }
                                
                                .footer { margin-top: 60px; text-align: center; color: #4B5563; font-size: 12px; border-top: 1px solid #1F2937; padding-top: 20px;}
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div>
                                    <h1 class="agency-title">${agencyName}</h1>
                                    <div class="subtitle">SSOT Performance Report</div>
                                </div>
                                <div class="client-info">
                                    <div class="client-name">${clientName}</div>
                                    <div class="stamp">Verified Integration</div>
                                </div>
                            </div>
                            
                            <div class="highlight-box">
                                <h3 class="h-title">Conta: ${adAccountName}</h3>
                                <p class="h-desc">ID: ${adAccountId}</p>
                            </div>

                            ${hasData ? `
                            <div class="grid-metrics">
                                <div class="card">
                                    <div class="meta-label">Investimento</div>
                                    <div class="meta-value">${formatCurrency(totalSpend)}</div>
                                </div>
                                <div class="card">
                                    <div class="meta-label">Oportunidades</div>
                                    <div class="meta-value cyan-text">${totalLeads}</div>
                                </div>
                                <div class="card">
                                    <div class="meta-label">CPA Médio</div>
                                    <div class="meta-value">${formatCurrency(cpa)}</div>
                                </div>
                            </div>

                            <div class="card" style="margin-bottom: 20px;">
                                <div class="meta-label">Campanha Destaque</div>
                                <div style="font-size: 18px; font-weight: 600; color: #E5E7EB;">${topCampaign}</div>
                            </div>
                            ` : `
                            <div class="card" style="text-align: center; padding: 60px 20px;">
                                <div style="font-size: 24px; font-weight: 600; color: #9CA3AF; margin-bottom: 10px;">Aguardando Vínculo de Dados</div>
                                <div style="color: #64748B;">Nossa engine de IA não detectou campanhas ativas ainda.</div>
                            </div>
                            `}
                            
                            <div class="footer">
                                Gerado automaticamente via Engine SSOT confidenciais e criptografadas.<br/>
                                © ${new Date().getFullYear()} ${agencyName}.
                            </div>
                        </body>
                        </html>
                    `;

                    const pdfResponse = await fetch('https://v2.api2pdf.com/chrome/pdf/html', {
                        method: 'POST',
                        headers: {
                            'Authorization': api2PdfKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            html: htmlContent,
                            options: { printBackground: true, format: 'A4' }
                        })
                    });

                    if (pdfResponse.ok) {
                        const pdfData = await pdfResponse.json();
                        pdfUrl = pdfData.FileUrl;
                    } else {
                        console.error("API2PDF Falhou:", await pdfResponse.text());
                    }
                } catch (pdfErr) {
                    console.error("Erro Crítico gerando PDF:", pdfErr);
                }

                // 4. Integração EVOLUTION API (Enviando Documento com Legenda)
                let realMessageId = 'no-evo-configured';

                if (!evoApiUrl || !evoInstance || !evoApiKey) {
                    console.warn("Evolution API parameters missing from environment! Message mocked as sent.");
                } else {
                    let endpoint = `${evoApiUrl}/message/sendText/${evoInstance}`;
                    let bodyData: any = {
                        number: phoneNumber,
                        options: { delay: 1200, presence: 'composing' },
                        text: reportMessage
                    };

                    // Se temos PDF, mudamos a rota para media/document
                    if (pdfUrl) {
                        endpoint = `${evoApiUrl}/message/sendMedia/${evoInstance}`;
                        bodyData = {
                            number: phoneNumber,
                            options: { delay: 1200, presence: 'composing' },
                            mediatype: "document",
                            mimetype: "application/pdf",
                            fileName: "Relatorio_Executivo.pdf",
                            caption: reportMessage,
                            media: pdfUrl
                        };
                    }

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': evoApiKey
                        },
                        body: JSON.stringify(bodyData)
                    });

                    if (!response.ok) {
                        const errorResponse = await response.text();
                        throw new Error(`Evolution API Error [${response.status}]: ${errorResponse}`);
                    }

                    const responseData = await response.json();
                    realMessageId = responseData.key?.id || responseData.messageId || 'unknown';
                    console.log("Mensagem Evolution enviada com sucesso!", realMessageId);
                }

                // 5. Registrar Logs como Sucesso e Update Status
                await supabase.from('notification_logs').insert({
                    queue_id: item.id,
                    whatsapp_number: phoneNumber,
                    evolution_message_id: realMessageId,
                    status: 'success'
                });

                await supabase.from('notification_queue').update({ status: 'completed' }).eq('id', item.id);

                // 6. Salvar no histórico de Relatórios (para o painel Admin)
                const reportType = item.type === 'weekly_report' ? 'Semanal' : (item.type === 'manual_report' ? 'Manual' : 'Diário');
                await supabase.from('reports').insert({
                    client_id: item.client_id,
                    title: `Relatório ${reportType} — ${clientName} (${adAccountName})`,
                    period: item.type === 'weekly_report' ? 'Últimos 7 dias' : 'Últimas 24h',
                    date: new Date().toISOString(),
                    size: pdfUrl ? '~200 KB' : '—',
                    status: 'sent',
                    pdf_url: pdfUrl,
                    whatsapp_number: phoneNumber,
                    data: {
                        spend: totalSpend,
                        leads: totalLeads,
                        cpa: cpa,
                        top_campaign: topCampaign,
                        ad_account: adAccountName,
                        message_id: realMessageId
                    }
                });

                results.push({ id: item.id, success: true });

            } catch (err: any) {
                console.error(`Erro ao processar Fila ID ${item.id}:`, err.message);

                // Gravar nos Logs
                await supabase.from('notification_logs').insert({
                    queue_id: item.id,
                    whatsapp_number: item.payload?.whatsapp_number || 'UNKNOWN',
                    status: 'error',
                    error_details: err.message
                });

                // Se falhou 3 vezes, morre na fila. Se não, volta pendente.
                const newStatus = (item.attempts + 1) >= 3 ? 'failed' : 'pending';
                await supabase.from('notification_queue').update({ status: newStatus }).eq('id', item.id);
                results.push({ id: item.id, success: false, error: err.message });
            }
        }

        return new Response(JSON.stringify({ processed: results.length, details: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err: any) {
        console.error("Critical Execution Error", err);
        return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
})
