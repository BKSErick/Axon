// Script para verificar investimento da GT House diretamente na API do Meta
const TOKEN = "EAAdqdx9GvPIBQ9lE7xLA35di4CjYz0kWnTNcOqPVZBfYk2TSxKUKvfHYjslm8ZAQ7TC4ys8QBcOpor9KDWGu47UnRHq0jf2vN4oV9nVNZBhOnmzCA46hRWOKgueZBrF99EhcgTPRN4Y2VzqdwP5VZBb0XkBM8hJpMWTZC4zZAJCL4WK0cgsLpNkUHiAOli8ZBgZDZD";
const GT_HOUSE_ID = "act_4118514"; // ID visível no dashboard

// Helper
const fetchMeta = async (endpoint, params = {}) => {
    const url = new URL(`https://graph.facebook.com/v21.0/${endpoint}`);
    url.searchParams.set('access_token', TOKEN);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const r = await fetch(url);
    return r.json();
};

// 1) Buscar o ID correto da conta primeiro
console.log("=== BUSCANDO CONTAS DE ANÚNCIO ===\n");
const accsRes = await fetchMeta('me/adaccounts', {
    fields: 'name,account_id,account_status',
    limit: '50'
});
console.log("Contas encontradas:");
(accsRes.data || []).forEach(a => {
    console.log(`  - ${a.name} (${a.id}) - status: ${a.account_status}`);
});

// 2) Buscar insights de cada conta pra achar GT House
const gtAccounts = (accsRes.data || []).filter(a =>
    a.name?.toLowerCase().includes('gt') || a.name?.toLowerCase().includes('house')
);

if (gtAccounts.length === 0) {
    console.log("\n⚠️ Nenhuma conta 'GT House' encontrada. Buscando insights de TODAS as contas...\n");
}

const accountsToCheck = gtAccounts.length > 0 ? gtAccounts : (accsRes.data || []);

for (const acc of accountsToCheck) {
    console.log(`\n=== ${acc.name} (${acc.id}) ===`);

    // Máximo (Lifetime)
    const maxInsights = await fetchMeta(`${acc.id}/insights`, {
        date_preset: 'maximum',
        fields: 'spend,impressions,reach,clicks,ctr,cpc,actions',
    });

    const maxData = maxInsights.data?.[0] || {};
    const actions = maxData.actions || [];
    const leads = actions.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
    const msgs = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
    const linkClicks = actions.find(a => a.action_type === 'link_click');

    console.log(`  💰 Spend (Máximo):    R$ ${Number(maxData.spend || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`  👁️  Impressões:        ${Number(maxData.impressions || 0).toLocaleString()}`);
    console.log(`  📊 Alcance:           ${Number(maxData.reach || 0).toLocaleString()}`);
    console.log(`  🖱️  Cliques (total):   ${Number(maxData.clicks || 0).toLocaleString()}`);
    console.log(`  🔗 Link Clicks:       ${Number(linkClicks?.value || 0).toLocaleString()}`);
    console.log(`  📝 Leads (form):      ${Number(leads?.value || 0).toLocaleString()}`);
    console.log(`  💬 Mensagens:         ${Number(msgs?.value || 0).toLocaleString()}`);
    console.log(`  📈 CTR (Meta):        ${maxData.ctr || 'N/A'}%`);
    console.log(`  💲 CPC (Meta):        R$ ${Number(maxData.cpc || 0).toFixed(2)}`);

    // Calcular CTR do dashboard (como o código faz)
    const calcCtr = Number(maxData.impressions || 0) > 0
        ? (Number(linkClicks?.value || maxData.clicks || 0) / Number(maxData.impressions || 0) * 100).toFixed(2)
        : '0';
    console.log(`  🔄 CTR (calculado):   ${calcCtr}% (linkClicks/impressions*100)`);
}
