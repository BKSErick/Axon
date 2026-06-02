import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META = 'https://graph.facebook.com/v21.0'
const MAX_CAMPS = 10   // max campanhas por conta
const MAX_ADSETS = 4   // max conjuntos por campanha
const MAX_ADS = 4      // max anuncios por conjunto

const getLeads = (actions: any[]) => {
    if (!actions?.length) return 0
    const form = actions.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped')
    const msg = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')
    return Number(form?.value || 0) + Number(msg?.value || 0)
}

const mfetch = async (url: string, timeoutMs = 8000, body?: string) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const opts: RequestInit = { signal: controller.signal }
        if (body) {
            opts.method = 'POST'
            opts.headers = { 'Content-Type': 'application/json' }
            opts.body = body
        }
        const r = await fetch(url, opts)
        return await r.json()
    } catch { return {} }
    finally { clearTimeout(id) }
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { client_id, question, history = [] } = await req.json()

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )
        const token = Deno.env.get('META_API_TOKEN')
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiKey) throw new Error('GEMINI_API_KEY nao configurado')

        // Resolve profile -> clients.id
        let resolvedClientId = client_id
        const { data: profile } = await supabase
            .from('profiles').select('client_id, full_name').eq('id', client_id).single()
        if (profile?.client_id) resolvedClientId = profile.client_id

        const [{ data: adAccounts }, { data: clientData }] = await Promise.all([
            supabase.from('ad_accounts').select('meta_id, name').eq('client_id', resolvedClientId),
            supabase.from('clients').select('name').eq('id', resolvedClientId).single()
        ])

        const clientName = clientData?.name || profile?.full_name || 'Cliente'
        let metaContext = ''

        if (adAccounts?.length && token) {
            // Busca todas as contas em paralelo
            const accountResults = await Promise.allSettled(
                adAccounts.map(async (acc) => {
                    const FIELDS_INS = 'spend,impressions,reach,clicks,actions,ctr,cpm,frequency'
                    const FIELDS_CAMP = `name,status,objective,daily_budget,insights.date_preset(last_7d){${FIELDS_INS}}`

                    // Nivel 1: conta + campanhas em paralelo
                    const [accIns, campList] = await Promise.all([
                        mfetch(`${META}/${acc.meta_id}/insights?date_preset=last_7d&fields=${FIELDS_INS}&access_token=${token}`),
                        mfetch(`${META}/${acc.meta_id}/campaigns?fields=${FIELDS_CAMP}&limit=${MAX_CAMPS}&access_token=${token}`)
                    ])

                    let ctx = `\n\n==============================\nCONTA: ${acc.name} (${acc.meta_id})\n==============================\n`

                    const ins = accIns.data?.[0]
                    if (ins) {
                        const leads = getLeads(ins.actions)
                        const spend = Number(ins.spend || 0)
                        ctx += `RESUMO 7 DIAS:
Investimento: R$ ${spend.toFixed(2)} | Impressoes: ${Number(ins.impressions || 0).toLocaleString()} | Alcance: ${Number(ins.reach || 0).toLocaleString()}
Frequencia: ${Number(ins.frequency || 0).toFixed(1)}x | Cliques: ${Number(ins.clicks || 0).toLocaleString()} | CTR: ${Number(ins.ctr || 0).toFixed(2)}%
CPM: R$ ${Number(ins.cpm || 0).toFixed(2)} | Leads: ${leads} | CPA: R$ ${leads > 0 ? (spend / leads).toFixed(2) : 'N/A'}\n`
                    }

                    // Nivel 2: campanhas
                    const camps = campList.data || []
                    if (camps.length) {
                        ctx += `\nCAMPANHAS (${camps.length} total):\n`

                        // Busca adsets de todas campanhas em paralelo
                        const adsetJobs = camps.slice(0, MAX_CAMPS).map(async (camp: any) => {
                            const ci = camp.insights?.data?.[0]
                            const campLeads = ci ? getLeads(ci.actions) : 0
                            const campSpend = Number(ci?.spend || 0)
                            const budget = camp.daily_budget
                                ? `Orcamento diario: R$ ${(Number(camp.daily_budget) / 100).toFixed(2)}`
                                : camp.lifetime_budget ? `Orcamento total: R$ ${(Number(camp.lifetime_budget) / 100).toFixed(2)}` : ''

                            let campCtx = `\n[CAMPANHA] ${camp.name}
  Status: ${camp.status} | Objetivo: ${camp.objective || 'N/A'} | ${budget}
  ${ci ? `Invest: R$ ${campSpend.toFixed(2)} | Leads: ${campLeads} | CPA: R$ ${campLeads > 0 ? (campSpend / campLeads).toFixed(2) : 'N/A'} | CTR: ${Number(ci.ctr || 0).toFixed(2)}%` : 'Sem dados no periodo'}\n`

                            // Nivel 3: conjuntos de anuncios
                            const adsetFields = `name,status,insights.date_preset(last_7d){spend,impressions,reach,clicks,actions,ctr}`
                            const adsetList = await mfetch(`${META}/${camp.id}/adsets?fields=${adsetFields}&limit=${MAX_ADSETS}&access_token=${token}`)
                            const adsets = adsetList.data || []

                            if (adsets.length) {
                                campCtx += `  CONJUNTOS:\n`

                                // Busca ads de todos conjuntos em paralelo
                                const adsJobs = adsets.map(async (adset: any) => {
                                    const ai = adset.insights?.data?.[0]
                                    const adsetLeads = ai ? getLeads(ai.actions) : 0
                                    let adsetCtx = `    [CONJUNTO] ${adset.name} [${adset.status}]
      ${ai ? `Invest: R$ ${Number(ai.spend || 0).toFixed(2)} | Leads: ${adsetLeads} | CTR: ${Number(ai.ctr || 0).toFixed(2)}% | Alcance: ${Number(ai.reach || 0).toLocaleString()}` : 'Sem dados'}\n`

                                    // Nivel 4: anuncios e criativos
                                    const adFields = `name,status,creative{name,title,body,image_url,thumbnail_url},insights.date_preset(last_7d){spend,impressions,clicks,actions,ctr,reach}`
                                    const adList = await mfetch(`${META}/${adset.id}/ads?fields=${adFields}&limit=${MAX_ADS}&access_token=${token}`)
                                    const ads = adList.data || []

                                    if (ads.length) {
                                        adsetCtx += `      ANUNCIOS:\n`
                                        for (const ad of ads) {
                                            const adIns = ad.insights?.data?.[0]
                                            const adLeads = adIns ? getLeads(adIns.actions) : 0
                                            const adSpend = Number(adIns?.spend || 0)
                                            const cr = ad.creative
                                            const title = cr?.title || cr?.name || 'Sem titulo'
                                            const body = cr?.body ? cr.body.substring(0, 100) + (cr.body.length > 100 ? '...' : '') : 'Sem copy'
                                            adsetCtx += `        [ANUNCIO] ${ad.name} [${ad.status}]
          Titulo criativo: ${title}
          Texto/Copy: ${body}
          ${adIns ? `Invest: R$ ${adSpend.toFixed(2)} | Leads: ${adLeads} | CPA: R$ ${adLeads > 0 ? (adSpend / adLeads).toFixed(2) : 'N/A'} | CTR: ${Number(adIns.ctr || 0).toFixed(2)}% | Impressoes: ${Number(adIns.impressions || 0).toLocaleString()}` : 'Sem dados'}\n`
                                        }
                                    }
                                    return adsetCtx
                                })

                                const adsetResults = await Promise.allSettled(adsJobs)
                                campCtx += adsetResults.map(r => r.status === 'fulfilled' ? r.value : '').join('')
                            }
                            return campCtx
                        })

                        const campResults = await Promise.allSettled(adsetJobs)
                        ctx += campResults.map(r => r.status === 'fulfilled' ? r.value : '').join('')
                    }

                    return ctx
                })
            )

            metaContext = accountResults
                .map(r => r.status === 'fulfilled' ? r.value : '')
                .join('')
        } else {
            metaContext = 'Nenhuma conta Meta vinculada encontrada para este cliente.'
        }

        // Truncar contexto para nao exceder limite de tokens do Gemini (~12k chars seguro)
        const MAX_CONTEXT_CHARS = 12000
        const truncatedContext = metaContext.length > MAX_CONTEXT_CHARS
            ? metaContext.substring(0, MAX_CONTEXT_CHARS) + '\n\n[...dados truncados por limite de tamanho]'
            : metaContext

        const systemPrompt = `Voce e a Grow, uma assistente de Gestao de Trafego Pago com 10 anos de experiencia em Meta Ads (Facebook/Instagram), especializada em criativos, estrutura de campanhas e otimizacao de conversoes.

Seu nome e "Grow". Voce trabalha para a agencia Backstage Grow.

Cliente (empresa): "${clientName}"

COMPORTAMENTO:
- Sempre cumprimente o cliente pelo nome da empresa ("${clientName}")
- Se perceber que a pessoa esta falando em nome da empresa mas voce nao sabe o nome dela, pergunte educadamente o nome de quem esta falando
- Seja profissional mas proxima, como uma gestora de confianca que conhece bem a conta

Voce tem acesso COMPLETO: conta > campanhas > conjuntos > anuncios individuais com titulo, copy e performance de cada criativo.

DADOS DA CONTA META - ULTIMOS 7 DIAS:
${truncatedContext}

REGRAS:
- Responda em portugues do Brasil, natural e humano
- Nunca invente dados — use apenas o que esta acima
- Maximo 500 palavras para analises completas, 150 palavras para respostas curtas
- Benchmark: CTR > 1.5% e bom, CPM < R$ 20 e bom, Frequencia > 3.5x e alerta

FORMATACAO — ESTILO RELATORIO LIMPO:
- PROIBIDO: asteriscos (**), underline (__), hashtags (#), tracos de lista (-), markdown
- Use EMOJIS como icones visuais para cada dado e secao importante
- Cada secao deve ter um emoji de titulo — exemplos:
  📊 Análise, 💰 Investimento, 🎯 Leads, 📉 CPA, 📢 CPM/CTR, 🚨 Alerta, ✅ Destaque, 🚀 Recomendações
- Cada dado numerico deve ter seu proprio emoji na frente: 💰 R$ 204, 🎯 13 leads, 📉 CPA: R$ 15.70
- Separe secoes com linhas em branco para respiracao visual
- Para recomendacoes use numeracao: 1️⃣ 2️⃣ 3️⃣ 4️⃣
- Quando citar nome de campanha ou anuncio, use: 📌 Nome
- Para alertas e pontos negativos use: ⚠️ ou 🚨
- Para destaques positivos use: ✅ ou 🔥 ou 👍
- O resultado deve parecer um RELATORIO VISUAL que qualquer pessoa leiga consiga escanear rapidamente
- Nunca escreva em blocos longos de texto corrido — quebre em secoes curtas e escaneáveis`

        const contents: any[] = []
        for (const msg of history) {
            contents.push({ role: msg.role === 'model' ? 'model' : 'user', parts: [{ text: msg.content }] })
        }
        contents.push({ role: 'user', parts: [{ text: question }] })

        const geminiBody = JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.8, maxOutputTokens: 1500, topP: 0.95 }
        })

        // Modelos atualizados (Mar 2026) — Gemini 3.x series com fallback 2.5
        const MODELS = [
            { id: 'gemini-2.5-flash', timeout: 30000 },
            { id: 'gemini-2.5-pro', timeout: 55000 },
        ]
        let reply = ''
        let apiKeyInvalid = false
        for (const model of MODELS) {
            try {
                const controller = new AbortController()
                const tid = setTimeout(() => controller.abort(), model.timeout)
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: geminiBody,
                        signal: controller.signal,
                    }
                )
                clearTimeout(tid)
                const data = await res.json()
                const candidate = data.candidates?.[0]
                const blockReason = candidate?.finishReason === 'SAFETY' ? 'SAFETY_BLOCK' : candidate?.finishReason
                console.log(`${model.id} status=${res.status} candidates=${data.candidates?.length} finish=${blockReason || 'none'} error=${data.error?.message || 'none'}`)

                // Detecta chave invalida para parar de tentar outros modelos
                if (res.status === 400 && data.error?.message?.includes('API key not valid')) {
                    console.error('GEMINI_API_KEY INVALIDA — atualize o secret no Supabase!')
                    apiKeyInvalid = true
                    break
                }

                if (candidate?.content?.parts?.[0]?.text) {
                    reply = candidate.content.parts[0].text
                    break
                }
                // Se o erro for de quota/rate limit, esperar antes de tentar proximo
                if (res.status === 429) {
                    console.log(`${model.id}: rate limited, aguardando 2s...`)
                    await new Promise(r => setTimeout(r, 2000))
                }
            } catch (e: any) {
                console.log(`${model.id} excecao: ${e.message}`)
            }
        }

        if (!reply) {
            reply = apiKeyInvalid
                ? '⚠️ A chave de IA está desatualizada. Por favor, entre em contato com o suporte para resolver.'
                : '⚠️ Nao consegui gerar uma resposta. Tente novamente em instantes.'
        }

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        console.error('meta-ai-analyst error:', err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
