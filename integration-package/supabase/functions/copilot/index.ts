// ============================================
// Supabase Edge Function — Axon Copilot (OpenRouter)
// Deno runtime. A API key fica SÓ aqui no servidor (nunca no frontend).
//
// Deploy:
//   supabase functions deploy copilot --no-verify-jwt
//   supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxx
//   supabase secrets set COPILOT_MODEL=anthropic/claude-3.5-sonnet   # opcional
//
// O frontend chama via:  supabase.functions.invoke('copilot', { body: { messages, context } })
// ============================================

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const MODEL = Deno.env.get("COPILOT_MODEL") ?? "anthropic/claude-3.5-sonnet";
const APP_URL = Deno.env.get("COPILOT_APP_URL") ?? "https://meta.backstagefy.com.br";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildSystemPrompt(context: any): string {
  const base = [
    "Você é o Axon Copilot, um especialista em gestão de mídia paga (Meta Ads, Google Ads e Instagram orgânico) para uma agência de performance no Brasil.",
    "Responda SEMPRE em português do Brasil, de forma objetiva e acionável.",
    "Quando sugerir otimizações, priorize por impacto e seja específico (qual campanha, qual ação, por quê).",
    "Use os dados de contexto abaixo quando relevante. Se não houver dados suficientes, diga o que falta em vez de inventar números.",
    "Formate listas com hífens. Não use tabelas markdown. Seja conciso (máx ~6 linhas salvo se pedirem detalhe).",
  ].join(" ");

  if (!context) return base;

  const lines: string[] = ["\n\n--- CONTEXTO ATUAL ---"];
  if (context.role) lines.push(`Visão: ${context.role}`);
  if (context.clientName) lines.push(`Cliente: ${context.clientName}`);
  if (context.kpis) {
    const k = context.kpis;
    lines.push(
      `KPIs (30d): investimento R$ ${k.spend ?? "?"}, leads ${k.leads ?? "?"}, CPA R$ ${k.cpa ?? "?"}, ROI ${k.roi ?? "?"}%.`,
    );
  }
  if (Array.isArray(context.campaigns) && context.campaigns.length) {
    lines.push("Top campanhas (nome | spend | leads | cpa | ctr):");
    for (const c of context.campaigns.slice(0, 8)) {
      lines.push(
        `- ${c.name} | R$ ${c.spend ?? 0} | ${c.leads ?? 0} | R$ ${c.cpa ?? 0} | ${c.ctr ?? 0}%`,
      );
    }
  }
  return base + lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY não configurada (supabase secrets set)." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  try {
    const { messages = [], context = null } = await req.json();

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(context) },
        ...messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: String(m.content ?? m.text ?? ""),
        })),
      ],
      temperature: 0.4,
      max_tokens: 800,
    };

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": "Axon Copilot",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: data?.error?.message ?? `OpenRouter ${r.status}` }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const reply = data?.choices?.[0]?.message?.content ?? "(sem resposta)";
    return new Response(
      JSON.stringify({ reply, model: MODEL, usage: data?.usage ?? null }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
