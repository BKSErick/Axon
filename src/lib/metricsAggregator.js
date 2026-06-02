import { getAccountInsights, getCampaignsWithInsights, getAccountInsightsExtended, getDailyInsights, getDemographicInsights } from './meta';

// Configurações Globais de Negócios (Serão movidas para o banco no futuro)
export const GLOBAL_TICKET_MEDIO = 3000; // Ticket médio arbitrário de R$ 3.000,00 por venda/fechamento
export const GLOBAL_CONV_RATE = 0.05; // 5% de taxa de conversão padrão de Lead para Venda (ex: Imobiliária/Serviços A)

/**
 * Calcula as métricas financeiras (CEO View) dado os totais crus do Facebook
 * @param {number} totalSpend Total gasto na plataforma
 * @param {number} totalLeads Quantidade total de Leads do Facebook
 * @param {number} activeCampaignsCount Número de campanhas ativas no período
 * @returns {object} Objeto com Receiving, Profit, ROI, CPA e status
 */
export const calculateBusinessMetrics = (totalSpend, totalLeads, activeCampaignsCount = 0) => {
    // Pipeline Clássico: Leads -> Vendas -> Receita -> Lucro
    const estimatedSales = Math.floor(totalLeads * GLOBAL_CONV_RATE);
    const estimatedRevenue = estimatedSales * GLOBAL_TICKET_MEDIO;
    const estimatedProfit = estimatedRevenue - totalSpend;

    // Safety Fallback (se não gastou nada, o ROI é 0 e não infinito)
    const roiPercent = totalSpend > 0 ? ((estimatedProfit / totalSpend) * 100).toFixed(0) : 0;
    const cpa = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : 0;

    // Gerador de Score/Performance
    let performanceScore = 'neutral';
    if (totalLeads > 0) {
        if (roiPercent > 100) performanceScore = 'excellent'; // Muito lucro
        else if (roiPercent > 0) performanceScore = 'optimizing'; // Lucrando algo, mas pode melhorar
        else performanceScore = 'attention'; // Prejuízo (CPA alto ou conv baixa)
    }

    return {
        revenue: estimatedRevenue,
        profit: estimatedProfit,
        sales: estimatedSales,
        roi: roiPercent,
        cpa: Number(cpa),
        score: performanceScore,
        raw: {
            spend: totalSpend,
            leads: totalLeads,
            campaignsCont: activeCampaignsCount
        }
    };
};

/**
 * Pega um array de accounts (ad_accounts), busca insights na Meta, e mastiga num SSOT.
 * @param {Array} accounts Array [{ id, meta_id }]
 * @param {string} datePreset Preset do facebook (last_30d, etc)
 */
export const fetchUnifiedAggregateInsights = async (accounts, datePreset = 'last_30d') => {
    if (!accounts || accounts.length === 0) {
        return calculateBusinessMetrics(0, 0, 0);
    }

    try {
        const insightsPromises = accounts.map(a => getAccountInsights(a.meta_id, datePreset));
        const insightsData = await Promise.all(insightsPromises);

        let totalSpend = 0;
        let totalLeads = 0;
        let totalClicks = 0;

        insightsData.forEach(insight => {
            totalSpend += Number(insight.spend || 0);
            totalLeads += Number(insight.leads || 0);
            totalClicks += Number(insight.clicks || 0);
        });

        // Retornamos os mesmos dados embalados pela matemática SSOT + raw info
        const businessMetrics = calculateBusinessMetrics(totalSpend, totalLeads);
        businessMetrics.raw.clicks = totalClicks;
        return businessMetrics;

    } catch (e) {
        console.error("SSOT Aggregator Error (Aggregate):", e);
        return calculateBusinessMetrics(0, 0, 0);
    }
};

/**
 * Mesma coisa de cima, mas detalhando por campanha (pra tabela e pro funil)
 * Fetch Campanhas + Insights + Matemática SSOT
 */
export const fetchUnifiedCampaignsInsights = async (accounts, datePreset = 'last_30d') => {
    if (!accounts || accounts.length === 0) return [];

    try {
        const campaignsPromises = accounts.map(a => getCampaignsWithInsights(a.meta_id, datePreset));
        const results = await Promise.all(campaignsPromises);

        let joinedData = results.flat();
        joinedData.sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0));

        // Injeta a Matemática de Lucro em cada campanha baseada na performance dela
        return joinedData.map(c => {
            const campMetrics = calculateBusinessMetrics(c.spend, c.leads, 1);
            return {
                ...c,
                ssot: campMetrics // Admin e App Cliente vão ler isso c.ssot.profit etc
            }
        });

    } catch (error) {
        console.error("SSOT Aggregator Error (Campaigns):", error);
        return [];
    }
};

/**
 * Fetches extended overview data for admin dashboard:
 * - Aggregated KPIs (impressions, reach, cpm, ctr, messaging leads, etc.)
 * - Daily time series (for CPC + Leads chart)
 * - Demographics (age + gender breakdowns)
 */
export const fetchExtendedOverviewData = async (accounts, datePreset = 'last_30d') => {
    if (!accounts || accounts.length === 0) {
        return {
            kpis: { spend: 0, impressions: 0, reach: 0, cpm: 0, ctr: 0, cpc: 0, clicks: 0, frequency: 0, linkClicks: 0, leads: 0, messagingLeads: 0, costPerMessage: 0, totalLeads: 0 },
            daily: [],
            demographics: { age: [], gender: [] },
        };
    }

    try {
        // Buscar tudo em paralelo para cada conta
        const results = await Promise.all(accounts.map(async (acc) => {
            const [extended, daily, demo] = await Promise.all([
                getAccountInsightsExtended(acc.meta_id, datePreset),
                getDailyInsights(acc.meta_id, datePreset),
                getDemographicInsights(acc.meta_id, datePreset),
            ]);
            return { extended, daily, demo };
        }));

        // Agregar KPIs
        const kpis = results.reduce((agg, r) => ({
            spend: agg.spend + r.extended.spend,
            impressions: agg.impressions + r.extended.impressions,
            reach: agg.reach + r.extended.reach,
            clicks: agg.clicks + r.extended.clicks,
            linkClicks: agg.linkClicks + r.extended.linkClicks,
            leads: agg.leads + r.extended.leads,
            messagingLeads: agg.messagingLeads + r.extended.messagingLeads,
            totalLeads: agg.totalLeads + r.extended.totalLeads,
            // Média ponderada para rates
            _spendSum: (agg._spendSum || 0) + r.extended.spend,
            _impressionsSum: (agg._impressionsSum || 0) + r.extended.impressions,
        }), { spend: 0, impressions: 0, reach: 0, clicks: 0, linkClicks: 0, leads: 0, messagingLeads: 0, totalLeads: 0 });

        // Calcular rates globais
        kpis.cpm = kpis.impressions > 0 ? (kpis.spend / kpis.impressions * 1000) : 0;
        kpis.ctr = kpis.impressions > 0 ? (kpis.clicks / kpis.impressions * 100) : 0;
        kpis.cpc = kpis.linkClicks > 0 ? (kpis.spend / kpis.linkClicks) : 0;
        kpis.costPerMessage = kpis.messagingLeads > 0 ? (kpis.spend / kpis.messagingLeads) : 0;
        kpis.frequency = kpis.reach > 0 ? (kpis.impressions / kpis.reach) : 0;
        delete kpis._spendSum;
        delete kpis._impressionsSum;

        // Merge daily data (somar por data)
        const dailyMap = {};
        results.forEach(r => {
            r.daily.forEach(day => {
                if (!dailyMap[day.date]) {
                    dailyMap[day.date] = { ...day };
                } else {
                    const d = dailyMap[day.date];
                    d.spend += day.spend;
                    d.impressions += day.impressions;
                    d.reach += day.reach;
                    d.clicks += day.clicks;
                    d.leads += day.leads;
                    d.messagingLeads += day.messagingLeads;
                    d.linkClicks += day.linkClicks;
                }
            });
        });
        const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
        // Recalculate CPC per day
        daily.forEach(d => { d.cpc = d.linkClicks > 0 ? (d.spend / d.linkClicks) : 0; });

        // Merge demographics (somar por label)
        const mergeDemo = (key) => {
            const map = {};
            results.forEach(r => {
                (r.demo[key] || []).forEach(item => {
                    if (!map[item.label]) {
                        map[item.label] = { ...item };
                    } else {
                        map[item.label].spend += item.spend;
                        map[item.label].impressions += item.impressions;
                        map[item.label].clicks += item.clicks;
                        map[item.label].leads += item.leads;
                    }
                });
            });
            return Object.values(map);
        };

        const demographics = {
            age: mergeDemo('age'),
            gender: mergeDemo('gender'),
        };

        return { kpis, daily, demographics };

    } catch (e) {
        console.error("SSOT Extended Overview Error:", e);
        return {
            kpis: { spend: 0, impressions: 0, reach: 0, cpm: 0, ctr: 0, cpc: 0, clicks: 0, frequency: 0, linkClicks: 0, leads: 0, messagingLeads: 0, costPerMessage: 0, totalLeads: 0 },
            daily: [],
            demographics: { age: [], gender: [] },
            _error: e.message,
        };
    }
};
