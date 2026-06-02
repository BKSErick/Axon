import { supabase } from './supabase';

const META_API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
export const META_TOKEN_INVALID_EVENT = 'meta-token-invalid';

// ─── In-Memory Cache ────────────────────────────────────────────────────────
// Prevents redundant API calls and Meta rate limiting
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cachedGlobalToken = null;
let cachedGlobalTokenExpires = null;

const dispatchMetaTokenAlert = (detail) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(META_TOKEN_INVALID_EVENT, { detail }));
};

export const getGlobalToken = async () => {
    if (cachedGlobalToken) {
        if (!cachedGlobalTokenExpires) return cachedGlobalToken;

        const expiresAt = new Date(`${cachedGlobalTokenExpires}T00:00:00`);
        const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
        if (daysLeft <= 0) {
            const expiredAt = cachedGlobalTokenExpires;
            cachedGlobalToken = null;
            cachedGlobalTokenExpires = null;
            dispatchMetaTokenAlert({
                code: 190,
                message: 'Token Meta global expirado. Atualize o token em Configurações.',
                expiresAt: expiredAt,
            });
        } else {
            if (daysLeft <= 7) {
                dispatchMetaTokenAlert({
                    code: 'TOKEN_EXPIRING_SOON',
                    message: `Token Meta global expira em ${daysLeft} dia(s).`,
                    expiresAt: cachedGlobalTokenExpires,
                });
            }
            return cachedGlobalToken;
        }
    }

    try {
        const { data, error } = await supabase
            .from('business_managers')
            .select('name, token_expires')
            .eq('bm_id', 'SYSTEM_USER_TOKEN')
            .single();

        if (data && data.name) {
            cachedGlobalToken = data.name;
            cachedGlobalTokenExpires = data.token_expires || null;
            return cachedGlobalToken;
        }
    } catch (e) {
        // silent fallback
    }

    return null;
};

const getCacheKey = (endpoint, params) => {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    return `${endpoint}?${sortedParams}`;
};

const getFromCache = (key) => {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) {
        _cache.delete(key);
        return null;
    }
    return entry.data;
}

const setCache = (key, data) => {
    _cache.set(key, { data, ts: Date.now() });
    // Limit cache size to prevent memory leaks
    if (_cache.size > 200) {
        const oldest = _cache.keys().next().value;
        _cache.delete(oldest);
    }
};

/** Clear the entire API cache (e.g. when user clicks "Dados Sincronizados") */
export const clearMetaCache = () => {
    _cache.clear();
    cachedGlobalToken = null;
    cachedGlobalTokenExpires = null;
};

/**
 * Fetch data from Meta Marketing API (with smart caching)
 * @param {string} endpoint - The API endpoint (e.g., 'me/adaccounts')
 * @param {object} params - Query parameters
 */
export const fetchMeta = async (endpoint, params = {}, allData = []) => {
    const token = await getGlobalToken();
    if (!token) {
        console.error('Meta Token not found in environment variables or database');
        return null;
    }

    // Se o endpoint for uma URL completa (da paginação da Meta), usamos ela direto
    const isFullUrl = endpoint.startsWith('http');
    const url = isFullUrl ? new URL(endpoint) : new URL(`${BASE_URL}/${endpoint}`);

    if (!isFullUrl) {
        // Use page-specific token if provided in params, otherwise use the default System User Token
        const effectiveToken = params.access_token || token;
        url.searchParams.append('access_token', effectiveToken);
        Object.keys(params).forEach(key => {
            if (key === 'access_token') return; // Already handled above
            url.searchParams.append(key, params[key]);
        });
    }

    // Check cache first (skip for pagination URLs as they have their own cursor)
    const cacheKey = isFullUrl ? endpoint : getCacheKey(endpoint, params);
    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log(`[META CACHE HIT] ${endpoint.substring(0, 60)}`);
        return cached;
    }

    try {
        const response = await fetch(url.toString(), { cache: 'no-store' });
        const data = await response.json();

        if (data.error) {
            // Se for erro de Rate Limit (17 ou 32), avisamos no console de forma destacada
            if (data.error.code === 17 || data.error.code === 32) {
                console.error('🛑 META RATE LIMIT REACHED:', data.error.message);
            }
            if ([10, 102, 190, 200].includes(Number(data.error.code))) {
                cachedGlobalToken = null;
                cachedGlobalTokenExpires = null;
                dispatchMetaTokenAlert(data.error);
            }
            throw new Error(data.error.message);
        }

        // Paginação automática (Recursiva)
        const combinedData = allData.concat(data.data || []);
        if (data.paging?.next && params.autoPaginate) {
            return fetchMeta(data.paging.next, params, combinedData);
        }

        const result = { ...data, data: combinedData };
        setCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Fetch Meta Error:', error);
        throw error;
    }
};

/**
 * Get all ad accounts associated with the System User Token
 */
export const getAdAccounts = async () => {
    try {
        const data = await fetchMeta('me/adaccounts', {
            fields: 'name,account_id,id,account_status,currency,amount_spent,balance'
        });
        return data.data || [];
    } catch (error) {
        return [];
    }
};

/**
 * Get insights for a specific ad account
 * @param {string} adAccountId - Format: 'act_123456'
 * @param {string} datePreset - e.g., 'last_30d', 'this_month', 'lifetime'
 */
export const getAccountInsights = async (adAccountId, datePreset = 'lifetime') => {
    try {
        const data = await fetchMeta(`${adAccountId}/insights`, {
            date_preset: datePreset,
            fields: 'spend,actions,clicks,cpc',
        });

        const insights = data.data?.[0] || { spend: 0, leads: 0, clicks: 0, cpc: 0, ctr: 0 };
        if (insights.actions) {
            const actions = insights.actions;
            // Form leads: inclui o tipo moderno onsite_conversion.lead_grouped (formularios nativos)
            const formLeads = actions.find(a =>
                a.action_type === 'lead' ||
                a.action_type === 'on_facebook_lead' ||
                a.action_type === 'onsite_conversion.lead_grouped'
            );
            // Messaging leads: WhatsApp / Messenger
            const msgLeads = actions.find(a =>
                a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
            );
            insights.formLeads = Number(formLeads?.value || 0);
            insights.messagingLeads = Number(msgLeads?.value || 0);
            insights.leads = insights.formLeads + insights.messagingLeads;
        } else {
            insights.formLeads = 0;
            insights.messagingLeads = 0;
            insights.leads = 0;
        }
        insights.clicks = Number(insights.clicks || 0);
        insights.cpc = Number(insights.cpc || 0);

        return insights;
    } catch (error) {
        console.error(`Erro ao buscar insights para ${adAccountId}:`, error);
        return { spend: 0, leads: 0, formLeads: 0, messagingLeads: 0 };
    }
};


/**
 * Get all campaigns for an ad account with their insights
 * Uses separate insights calls per campaign to capture ALL action types
 * including messaging_conversation_started_7d (WhatsApp/Messenger leads)
 */
export const getCampaignsWithInsights = async (adAccountId, datePreset = 'last_30d') => {
    try {
        // Step 1: Fetch all campaigns (metadata only)
        const campData = await fetchMeta(`${adAccountId}/campaigns`, {
            fields: 'name,id,status,objective',
            limit: 500
        });
        const campaigns = campData.data || [];

        if (campaigns.length === 0) return [];

        // Step 2: Fetch insights for ALL campaigns in a single call via the account
        // This is much more efficient than N separate calls
        let insightsMap = {};
        try {
            const insData = await fetchMeta(`${adAccountId}/insights`, {
                date_preset: datePreset,
                level: 'campaign',
                fields: 'campaign_id,campaign_name,spend,actions,clicks,ctr,cpc',
                limit: 500,
            });

            for (const row of (insData.data || [])) {
                insightsMap[row.campaign_id] = row;
            }
        } catch (e) {
            console.warn(`Insights por campanha falhou para ${adAccountId}:`, e);
        }

        // Step 3: Merge campaigns + insights
        return campaigns.map(c => {
            const ins = insightsMap[c.id] || {};
            const actions = ins.actions || [];
            const formLeads = actions.find(a => a.action_type === 'lead' || a.action_type === 'on_facebook_lead' || a.action_type === 'onsite_conversion.lead_grouped');
            const msgLeads = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
            const totalLeads = Number(formLeads?.value || 0) + Number(msgLeads?.value || 0);

            return {
                id: c.id,
                name: c.name,
                status: c.status?.toLowerCase() || 'unknown',
                objective: c.objective,
                spend: Number(ins.spend || 0),
                leads: totalLeads,
                ctr: Number(ins.ctr || 0),
                clicks: Number(ins.clicks || 0),
                cpc: Number(ins.cpc || 0)
            };
        });
    } catch (error) {
        console.error(`Erro Fatal ao buscar campanhas para ${adAccountId}:`, error);
        return [];
    }
};

/**
 * Busca Anúncios (Ads) detalhados de uma conta, incluindo o Criativo (Arte e Copy)
 * Uses level=ad insights to capture ALL action types including messaging leads
 */
export const getAdsWithInsights = async (adAccountId, datePreset = 'last_30d') => {
    try {
        // Step 1: Fetch ads with creative data (NO insights nested - avoids missing action types)
        let allAds = [];
        let nextUrl = null;
        const BATCH_SIZE = 25;

        const firstBatch = await fetchMeta(`${adAccountId}/ads`, {
            fields: 'name,id,status,campaign_id,creative{id,name,body,title,image_url,thumbnail_url,object_type}',
            limit: BATCH_SIZE
        });

        allAds = firstBatch.data || [];
        nextUrl = firstBatch.paging?.next;

        let batchCount = 1;
        while (nextUrl && batchCount < 8) {
            try {
                const nextBatch = await fetchMeta(nextUrl);
                allAds = allAds.concat(nextBatch.data || []);
                nextUrl = nextBatch.paging?.next;
                batchCount++;
            } catch (pageErr) {
                console.warn(`Paginação parou no batch ${batchCount}:`, pageErr.message);
                break;
            }
        }

        console.log(`[getAdsWithInsights] Total de ${allAds.length} ads carregados para ${adAccountId}`);

        // Step 2: Fetch insights at ad level via the account endpoint
        // This returns ALL action types including messaging_conversation_started_7d
        let insightsMap = {};
        try {
            // Meta's last_Xd presets do NOT include today. Use time_range to include today.
            const insightsParams = {
                level: 'ad',
                fields: 'ad_id,ad_name,spend,actions,clicks,ctr',
                limit: 500,
            };

            // Convert date presets to include today
            const today = new Date().toISOString().split('T')[0];
            if (datePreset === 'last_7d') {
                const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
                insightsParams.time_range = JSON.stringify({ since, until: today });
            } else if (datePreset === 'last_30d') {
                const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
                insightsParams.time_range = JSON.stringify({ since, until: today });
            } else if (datePreset === 'last_90d') {
                const since = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
                insightsParams.time_range = JSON.stringify({ since, until: today });
            } else {
                insightsParams.date_preset = datePreset;
            }

            const insData = await fetchMeta(`${adAccountId}/insights`, insightsParams);

            console.log(`[getAdsWithInsights] Insights for ${adAccountId}: ${(insData.data || []).length} rows`);

            for (const row of (insData.data || [])) {
                insightsMap[row.ad_id] = row;
            }
        } catch (e) {
            console.warn(`[getAdsWithInsights] Insights FAILED for ${adAccountId}:`, e.message || e);
        }

        // Step 3: Merge ads + insights
        return allAds.map(ad => {
            const ins = insightsMap[ad.id] || {};
            const creative = ad.creative || {};
            const actions = ins.actions || [];
            const formLeads = actions.find(a => a.action_type === 'lead' || a.action_type === 'on_facebook_lead' || a.action_type === 'onsite_conversion.lead_grouped');
            const msgLeads = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
            const totalLeads = Number(formLeads?.value || 0) + Number(msgLeads?.value || 0);

            return {
                id: ad.id,
                campaign_id: ad.campaign_id,
                name: ad.name,
                status: ad.status?.toLowerCase(),
                spend: Number(ins.spend || 0),
                leads: totalLeads,
                ctr: Number(ins.ctr || 0),
                clicks: Number(ins.clicks || 0),
                // Detalhes da ARTE
                creativeId: creative.id,
                body: creative.body || '',
                title: creative.title || '',
                imageUrl: creative.image_url || creative.thumbnail_url || '',
                type: creative.object_type
            };
        });
    } catch (error) {
        console.error(`Erro ao buscar Ads para ${adAccountId}:`, error);
        return [];
    }
};

/**
 * Get EXTENDED insights for admin overview: all KPIs + messaging leads
 */
export const getAccountInsightsExtended = async (adAccountId, datePreset = 'last_30d') => {
    try {
        const data = await fetchMeta(`${adAccountId}/insights`, {
            date_preset: datePreset,
            fields: 'spend,impressions,reach,cpm,ctr,cpc,clicks,frequency,actions,cost_per_action_type',
        });

        const insights = data.data?.[0] || {};
        const actions = insights.actions || [];
        const costPerAction = insights.cost_per_action_type || [];

        // Leads clássicos (formulários)
        const formLeads = actions.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
        // Mensagens iniciadas (WhatsApp/Messenger)
        const msgLeads = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
        // Link clicks
        const linkClicks = actions.find(a => a.action_type === 'link_click');
        // Cost per messaging conversation
        const costPerMsg = costPerAction.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
        // Cost per link click
        const costPerClick = costPerAction.find(a => a.action_type === 'link_click');

        return {
            spend: Number(insights.spend || 0),
            impressions: Number(insights.impressions || 0),
            reach: Number(insights.reach || 0),
            cpm: Number(insights.cpm || 0),
            ctr: Number(insights.ctr || 0),
            cpc: Number(insights.cpc || 0),
            clicks: Number(insights.clicks || 0),
            frequency: Number(insights.frequency || 0),
            linkClicks: Number(linkClicks?.value || insights.clicks || 0),
            leads: Number(formLeads?.value || 0),
            messagingLeads: Number(msgLeads?.value || 0),
            costPerMessage: Number(costPerMsg?.value || 0),
            costPerLinkClick: Number(costPerClick?.value || 0),
            // Total de leads = formulários + mensagens
            totalLeads: Number(formLeads?.value || 0) + Number(msgLeads?.value || 0),
        };
    } catch (error) {
        console.error(`Erro insights estendidos ${adAccountId}:`, error);
        return { spend: 0, impressions: 0, reach: 0, cpm: 0, ctr: 0, cpc: 0, clicks: 0, frequency: 0, linkClicks: 0, leads: 0, messagingLeads: 0, costPerMessage: 0, costPerLinkClick: 0, totalLeads: 0 };
    }
};

/**
 * Get daily time series insights for charts (CPC + Leads over time)
 */
export const getDailyInsights = async (adAccountId, datePreset = 'last_30d') => {
    try {
        const data = await fetchMeta(`${adAccountId}/insights`, {
            date_preset: datePreset,
            time_increment: 1,
            fields: 'spend,impressions,reach,clicks,cpc,ctr,actions',
            limit: 90,
        });

        return (data.data || []).map(day => {
            const actions = day.actions || [];
            const msgLeads = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
            const formLeads = actions.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
            const linkClicks = actions.find(a => a.action_type === 'link_click');

            return {
                date: day.date_start,
                spend: Number(day.spend || 0),
                impressions: Number(day.impressions || 0),
                reach: Number(day.reach || 0),
                clicks: Number(day.clicks || 0),
                cpc: Number(day.cpc || 0),
                ctr: Number(day.ctr || 0),
                leads: Number(formLeads?.value || 0) + Number(msgLeads?.value || 0),
                messagingLeads: Number(msgLeads?.value || 0),
                linkClicks: Number(linkClicks?.value || 0),
            };
        });
    } catch (error) {
        console.error(`Erro daily insights ${adAccountId}:`, error);
        return [];
    }
};

/**
 * Get demographic breakdown (age + gender) for insights
 */
export const getDemographicInsights = async (adAccountId, datePreset = 'last_30d') => {
    try {
        const [ageData, genderData] = await Promise.all([
            fetchMeta(`${adAccountId}/insights`, {
                date_preset: datePreset,
                breakdowns: 'age',
                fields: 'spend,impressions,clicks,actions',
                limit: 20,
            }),
            fetchMeta(`${adAccountId}/insights`, {
                date_preset: datePreset,
                breakdowns: 'gender',
                fields: 'spend,impressions,clicks,actions',
                limit: 10,
            })
        ]);

        const parseDemo = (items) => (items || []).map(item => {
            const actions = item.actions || [];
            const msgLeads = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
            const formLeads = actions.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
            return {
                label: item.age || item.gender || 'unknown',
                spend: Number(item.spend || 0),
                impressions: Number(item.impressions || 0),
                clicks: Number(item.clicks || 0),
                leads: Number(formLeads?.value || 0) + Number(msgLeads?.value || 0),
            };
        });

        return {
            age: parseDemo(ageData.data),
            gender: parseDemo(genderData.data),
        };
    } catch (error) {
        console.error(`Erro demographics ${adAccountId}:`, error);
        return { age: [], gender: [] };
    }
};

/**
 * Get all Business Managers associated with the System User Token
 */
export const getBusinesses = async () => {
    try {
        const data = await fetchMeta('me/businesses', {
            fields: 'name,id,vertical,primary_page'
        });
        return data.data || [];
    } catch (error) {
        return [];
    }
};

/**
 * Get all lead gen forms accessible to the token.
 * Uses multiple strategies to find pages, since System User tokens and
 * personal tokens have different API access patterns.
 *
 * Strategies (in order):
 *  1. me/businesses → /{bm_id}/owned_pages  (System User with business_management)
 *  2. me/accounts                            (Personal User Token)
 *  3. ad_accounts → /{act_id}/pages          (Any token with ads_read)
 *  4. me/leadgen_forms                       (Direct, if token is a Page token)
 */
export const getLeadForms = async (adAccountId = null) => {
    const allForms = [];
    let pages = [];

    if (adAccountId) {
        console.log(`[getLeadForms] Filtering for ad account: ${adAccountId}`);
    }

    // ── Strategy 1: Business Manager owned pages ─────────────────────────────
    try {
        const bizData = await fetchMeta('me/businesses', { fields: 'id,name', limit: 50 });
        const businesses = bizData.data || [];
        for (const bm of businesses) {
            try {
                const pagesData = await fetchMeta(`${bm.id}/owned_pages`, {
                    fields: 'id,name,access_token', limit: 100
                });
                pages.push(...(pagesData.data || []).map(p => ({ ...p, src: 'bm' })));
            } catch (e) { /* silent */ }
        }
        console.log(`[getLeadForms] Strategy 1 (BM): ${pages.length} páginas`);
    } catch (e) {
        console.warn('[getLeadForms] Strategy 1 falhou:', e.message);
    }

    // ── Strategy 2: me/accounts (Personal User Token) ────────────────────────
    if (pages.length === 0) {
        try {
            const acc = await fetchMeta('me/accounts', { fields: 'id,name,access_token', limit: 100 });
            pages = (acc.data || []).map(p => ({ ...p, src: 'me_accounts' }));
            console.log(`[getLeadForms] Strategy 2 (me/accounts): ${pages.length} páginas`);
        } catch (e) {
            console.warn('[getLeadForms] Strategy 2 falhou:', e.message);
        }
    }

    // ── When filtering by ad account, restrict pages to those used by the account ──
    if (adAccountId && pages.length > 0) {
        try {
            const cleanId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
            const pageIdsFromAccount = new Set();

            // Get page_ids from campaigns
            try {
                const campaigns = await fetchMeta(`${cleanId}/campaigns`, {
                    fields: 'id,promoted_object', limit: 100
                });
                (campaigns.data || []).forEach(c => {
                    if (c.promoted_object?.page_id) pageIdsFromAccount.add(c.promoted_object.page_id);
                });
            } catch (e) { /* silent */ }

            // Get page_ids from adsets
            try {
                const adsets = await fetchMeta(`${cleanId}/adsets`, {
                    fields: 'id,promoted_object', limit: 100
                });
                (adsets.data || []).forEach(as => {
                    if (as.promoted_object?.page_id) pageIdsFromAccount.add(as.promoted_object.page_id);
                });
            } catch (e) { /* silent */ }

            console.log(`[getLeadForms] Ad account ${cleanId} uses ${pageIdsFromAccount.size} pages`);

            if (pageIdsFromAccount.size > 0) {
                // Filter pages to only those used by this ad account
                const filteredPages = pages.filter(p => pageIdsFromAccount.has(p.id));
                if (filteredPages.length > 0) {
                    pages = filteredPages;
                    console.log(`[getLeadForms] Filtered to ${pages.length} pages for this ad account`);
                } else {
                    console.log(`[getLeadForms] No matching pages found in BM, keeping all ${pages.length} pages`);
                }
            }
        } catch (e) {
            console.warn('[getLeadForms] Ad account page filtering failed:', e.message);
        }
    }

    // ── Strategy 3: Extract page IDs from ad account campaigns/adsets/ads ────
    if (pages.length === 0) {
        try {
            let adAccounts;
            if (adAccountId) {
                // Use only the specific ad account
                const cleanId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
                adAccounts = [{ id: cleanId, name: cleanId }];
                console.log(`[getLeadForms] Strategy 3: Using single ad account ${cleanId}`);
            } else {
                const adAccData = await fetchMeta('me/adaccounts', { fields: 'id,name', limit: 50 });
                adAccounts = adAccData.data || [];
            }
            console.log(`[getLeadForms] Strategy 3: ${adAccounts.length} ad accounts`);

            const pageIds = new Set();
            const leadgenFormIds = new Set();

            for (const acc of adAccounts) {
                // 3a: Check campaigns for page_id
                try {
                    const campaigns = await fetchMeta(`${acc.id}/campaigns`, {
                        fields: 'id,name,promoted_object,objective',
                        limit: 100
                    });
                    const campData = campaigns.data || [];
                    console.log(`[getLeadForms] 3a: ${acc.name} → ${campData.length} campanhas`);
                    campData.forEach(c => {
                        if (c.promoted_object?.page_id) {
                            pageIds.add(c.promoted_object.page_id);
                            console.log(`[getLeadForms] 3a: page_id ${c.promoted_object.page_id} de campanha "${c.name}"`);
                        }
                    });
                } catch (e) { console.warn(`[getLeadForms] 3a falhou (${acc.name}):`, e.message); }

                // 3b: Check adsets for page_id
                try {
                    const adsets = await fetchMeta(`${acc.id}/adsets`, {
                        fields: 'id,name,promoted_object',
                        limit: 100
                    });
                    const asData = adsets.data || [];
                    console.log(`[getLeadForms] 3b: ${acc.name} → ${asData.length} conjuntos de anúncios`);
                    asData.forEach(as => {
                        if (as.promoted_object?.page_id) {
                            pageIds.add(as.promoted_object.page_id);
                            console.log(`[getLeadForms] 3b: page_id ${as.promoted_object.page_id} de adset "${as.name}"`);
                        }
                        if (as.promoted_object?.leadgen_form_id) {
                            leadgenFormIds.add(as.promoted_object.leadgen_form_id);
                            console.log(`[getLeadForms] 3b: leadgen_form_id ${as.promoted_object.leadgen_form_id} de adset "${as.name}"`);
                        }
                    });
                } catch (e) { console.warn(`[getLeadForms] 3b falhou (${acc.name}):`, e.message); }

                // 3c: Check ads for leadgen_form_id and page_id (limit lower to avoid 500)
                try {
                    const ads = await fetchMeta(`${acc.id}/ads`, {
                        fields: 'id,name,creative{id,object_story_spec}',
                        limit: 25
                    });
                    const adsData = ads.data || [];
                    console.log(`[getLeadForms] 3c: ${acc.name} → ${adsData.length} anúncios`);
                    adsData.forEach(ad => {
                        const spec = ad.creative?.object_story_spec;
                        if (spec?.page_id) {
                            pageIds.add(spec.page_id);
                        }
                        // Lead form ID can be in link_data or video_data
                        const linkData = spec?.link_data;
                        const videoData = spec?.video_data;
                        if (linkData?.call_to_action?.value?.lead_gen_form_id) {
                            leadgenFormIds.add(linkData.call_to_action.value.lead_gen_form_id);
                        }
                        if (videoData?.call_to_action?.value?.lead_gen_form_id) {
                            leadgenFormIds.add(videoData.call_to_action.value.lead_gen_form_id);
                        }
                    });
                } catch (e) { console.warn(`[getLeadForms] 3c falhou (${acc.name}):`, e.message); }
            }

            console.log(`[getLeadForms] Strategy 3 totais: ${pageIds.size} pages, ${leadgenFormIds.size} leadgen_form_ids`);

            // 3d: If we found leadgen_form_ids directly, fetch them as form objects
            if (leadgenFormIds.size > 0 && allForms.length === 0) {
                for (const formId of leadgenFormIds) {
                    try {
                        const formInfo = await fetchMeta(formId, {
                            fields: 'id,name,leads_count,created_time,status,page{id,name}'
                        });
                        if (formInfo.id) {
                            allForms.push({
                                ...formInfo,
                                pageName: formInfo.page?.name || 'Página',
                                pageId: formInfo.page?.id,
                                pageToken: null
                            });
                            console.log(`[getLeadForms] 3d: ✅ Formulário "${formInfo.name}" (${formInfo.leads_count || 0} leads)`);
                        }
                    } catch (e) { console.warn(`[getLeadForms] 3d: form ${formId} erro:`, e.message); }
                }
                if (allForms.length > 0) {
                    console.log(`[getLeadForms] 3d: ✅ Total ${allForms.length} formulários encontrados via leadgen_form_id direto!`);
                    return allForms;
                }
            }

            // Build page objects from extracted page IDs (or fetch forms directly if no page access)
            for (const pageId of pageIds) {
                try {
                    const pageInfo = await fetchMeta(pageId, { fields: 'id,name,access_token' });
                    if (pageInfo.id) {
                        pages.push({ id: pageInfo.id, name: pageInfo.name, access_token: pageInfo.access_token, src: 'campaign' });
                    }
                } catch (e) {
                    console.warn(`[getLeadForms] page ${pageId} info falhou:`, e.message);
                    // Fallback: try to get leadgen_forms directly from the page ID
                    // (may work even without pages_read_engagement if token has ads_management + leads_retrieval)
                    try {
                        console.log(`[getLeadForms] 3e: Tentando ${pageId}/leadgen_forms diretamente...`);
                        const formsData = await fetchMeta(`${pageId}/leadgen_forms`, {
                            fields: 'id,name,leads_count,created_time,status',
                            limit: 50
                        });
                        const pageForms = (formsData.data || []).map(f => ({
                            ...f,
                            pageName: `Página ${pageId}`,
                            pageId: pageId,
                            pageToken: null
                        }));
                        if (pageForms.length > 0) {
                            console.log(`[getLeadForms] 3e: ✅ ${pageForms.length} formulários da página ${pageId}!`);
                            allForms.push(...pageForms);
                        }
                    } catch (e2) {
                        console.warn(`[getLeadForms] 3e: ${pageId}/leadgen_forms falhou:`, e2.message);
                    }
                }
            }

            if (allForms.length > 0) {
                console.log(`[getLeadForms] ✅ Total ${allForms.length} formulários encontrados!`);
                return allForms;
            }

            console.log(`[getLeadForms] Strategy 3 final: ${pages.length} páginas`);
        } catch (e) {
            console.warn('[getLeadForms] Strategy 3 falhou:', e.message);
        }
    }

    // ── Strategy 4: Try me/leadgen_forms directly (Page Token) ───────────────
    if (allForms.length === 0 && pages.length === 0) {
        try {
            const directForms = await fetchMeta('me/leadgen_forms', {
                fields: 'id,name,leads_count,created_time,status,page{id,name}', limit: 100
            });
            const forms = directForms.data || [];
            console.log(`[getLeadForms] Strategy 4 (direct): ${forms.length} formulários`);
            return forms.map(f => ({
                ...f,
                pageName: f.page?.name || 'Página',
                pageId: f.page?.id,
                pageToken: null
            }));
        } catch (e) {
            console.warn('[getLeadForms] Strategy 4 falhou:', e.message);
        }
    }

    if (pages.length === 0) {
        console.warn('[getLeadForms] Nenhuma página encontrada em nenhuma estratégia.');
        return [];
    }

    // Deduplicate pages by id
    const uniquePages = [...new Map(pages.map(p => [p.id, p])).values()];
    console.log(`[getLeadForms] Total de ${uniquePages.length} páginas únicas para buscar formulários`);

    // ── Fetch lead forms from each page ──────────────────────────────────────
    for (const page of uniquePages) {
        try {
            const token = page.access_token;
            const formsData = await fetchMeta(`${page.id}/leadgen_forms`, {
                fields: 'id,name,leads_count,created_time,status',
                limit: 50,
                access_token: token
            });
            const forms = (formsData.data || []).map(f => ({
                ...f,
                pageName: page.name,
                pageId: page.id,
                pageToken: page.access_token
            }));
            allForms.push(...forms);
            if (forms.length > 0) {
                console.log(`[getLeadForms] ✅ ${forms.length} formulários na página "${page.name}"`);
            }
        } catch (e) {
            console.warn(`[getLeadForms] Página "${page.name}" sem acesso a formulários:`, e.message);
        }
    }

    return allForms;
};



/**
 * Get all lead submissions for a specific lead gen form.
 * Auto-paginates to return all results.
 * @param {string} formId - The lead form ID
 * @param {string} pageToken - The Page access token (needed for leads_retrieval)
 */
export const getLeadsByForm = async (formId, pageToken) => {
    try {
        const tokenParam = pageToken ? { access_token: pageToken } : {};

        let allLeads = [];
        let nextUrl = null;

        const firstPage = await fetchMeta(`${formId}/leads`, {
            fields: 'created_time,field_data,id',
            limit: 100,
            ...tokenParam
        });

        allLeads = firstPage.data || [];
        nextUrl = firstPage.paging?.next;

        // Auto-paginate up to 10 pages (1000 leads max)
        let page = 1;
        while (nextUrl && page < 10) {
            try {
                const nextData = await fetchMeta(nextUrl);
                allLeads = allLeads.concat(nextData.data || []);
                nextUrl = nextData.paging?.next;
                page++;
            } catch (e) {
                console.warn(`Paginação de leads parou na página ${page}:`, e.message);
                break;
            }
        }

        // Normalize: flatten field_data array into a flat object per lead
        return allLeads.map(lead => {
            const fields = {};
            (lead.field_data || []).forEach(f => {
                fields[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
            });
            return {
                id: lead.id,
                created_time: lead.created_time,
                ...fields
            };
        });
    } catch (error) {
        console.error(`Erro ao buscar leads do formulário ${formId}:`, error);
        return [];
    }
};

/**
 * Fetch actual lead form submissions for an ad account (Lead Ads API).
 * Returns lead contact data: name, email, phone, and all custom fields.
 */
export const getFormLeads = async (adAccountId, datePreset = 'last_30d') => {
    try {
        const daysMap = { today: 0, last_7d: 7, last_14d: 14, last_30d: 30, last_90d: 90, this_month: 30, this_quarter: 90, this_year: 365 };
        const days = daysMap[datePreset] || 30;
        const since = Math.floor((Date.now() - days * 86400000) / 1000);
        const data = await fetchMeta(`${adAccountId}/leads`, {
            fields: 'created_time,ad_id,ad_name,campaign_id,campaign_name,adset_name,field_data',
            filtering: JSON.stringify([{ field: 'time_range', operator: 'IN_RANGE', value: [since, Math.floor(Date.now() / 1000)] }]),
            limit: 200,
        });
        return (data.data || []).map(lead => {
            const fields = {};
            (lead.field_data || []).forEach(f => { fields[f.name] = f.values?.[0] || ''; });
            return {
                id: lead.id,
                createdAt: lead.created_time,
                adName: lead.ad_name || lead.ad_id,
                campaign: lead.campaign_name || '',
                adset: lead.adset_name || '',
                name: fields.full_name || fields.nome || fields.name || '',
                email: fields.email || '',
                phone: fields.phone_number || fields.telefone || fields.phone || fields.celular || '',
                fields,
            };
        });
    } catch (error) {
        console.error(`Erro ao buscar form leads para ${adAccountId}:`, error);
        return [];
    }
};

// ─── Auto-Sync Social Profiles (Pages + Instagram) ─────────────────────────
/**
 * Discovers Facebook Pages and Instagram accounts for each client
 * Uses 3 strategies for Instagram:
 *   1. promoted_object.instagram_actor_id from adsets (most reliable)
 *   2. BM instagram_accounts endpoint
 *   3. Page instagram_business_account field (fallback)
 */
export const discoverSocialProfiles = async (clients, adAccounts, onLog) => {
    const results = [];
    const log = (msg) => {
        console.log(`[syncSocial] ${msg}`);
        if (onLog) onLog(msg);
    };
    const token = await getGlobalToken();
    if (!token) { log('❌ Token Meta não encontrado!'); return results; }

    // ── Step 1: Fetch all BM owned pages ─────────────────────────────────────
    let bmPages = [];
    let bmIds = [];
    try {
        const bizData = await fetchMeta('me/businesses', { fields: 'id,name', limit: 50 });
        bmIds = (bizData.data || []).map(b => b.id);
        log(`📊 ${bmIds.length} Business Manager(s) encontrado(s)`);
        for (const bm of (bizData.data || [])) {
            try {
                const pagesData = await fetchMeta(`${bm.id}/owned_pages`, {
                    fields: 'id,name,access_token', limit: 100
                });
                bmPages.push(...(pagesData.data || []));
            } catch (e) { /* silent */ }
        }
    } catch (e) {
        try {
            const acc = await fetchMeta('me/accounts', { fields: 'id,name,access_token', limit: 100 });
            bmPages = acc.data || [];
        } catch (e2) { /* silent */ }
    }
    const pageMap = new Map(bmPages.map(p => [p.id, p]));
    log(`📄 ${bmPages.length} página(s) do Facebook encontrada(s) na BM`);

    // ── Step 2: Fetch all BM Instagram accounts ──────────────────────────────
    const bmIgAccounts = new Map(); // id -> { id, username }
    for (const bmId of bmIds) {
        try {
            const igData = await fetchMeta(`${bmId}/instagram_accounts`, {
                fields: 'id,username,name', limit: 100
            });
            for (const ig of (igData.data || [])) {
                bmIgAccounts.set(ig.id, ig);
            }
        } catch (e) {
            log(`⚠️ BM instagram_accounts falhou: ${e.message}`);
        }
        // Also try owned_instagram_accounts
        try {
            const igData2 = await fetchMeta(`${bmId}/owned_instagram_accounts`, {
                fields: 'id,username,name', limit: 100
            });
            for (const ig of (igData2.data || [])) {
                bmIgAccounts.set(ig.id, ig);
            }
        } catch (e) { /* silent */ }
    }
    log(`📸 ${bmIgAccounts.size} conta(s) Instagram encontrada(s) na BM`);

    // ── Step 3: For each client, discover page + IG ──────────────────────────
    for (const client of clients) {
        const clientAccounts = adAccounts.filter(a => a.client_id === client.id);
        if (clientAccounts.length === 0) continue;

        const pageIds = new Set();
        const igActorIds = new Set();

        for (const acc of clientAccounts) {
            const cleanId = acc.meta_id.startsWith('act_') ? acc.meta_id : `act_${acc.meta_id}`;

            // Get page_id AND instagram_actor_id from adsets (most reliable for IG!)
            try {
                const adsets = await fetchMeta(`${cleanId}/adsets`, {
                    fields: 'promoted_object', limit: 100
                });
                for (const as of (adsets.data || [])) {
                    if (as.promoted_object?.page_id) pageIds.add(as.promoted_object.page_id);
                    if (as.promoted_object?.instagram_actor_id) igActorIds.add(as.promoted_object.instagram_actor_id);
                }
            } catch (e) { /* silent */ }

            // Also check campaigns
            try {
                const campaigns = await fetchMeta(`${cleanId}/campaigns`, {
                    fields: 'promoted_object', limit: 50
                });
                for (const c of (campaigns.data || [])) {
                    if (c.promoted_object?.page_id) pageIds.add(c.promoted_object.page_id);
                }
            } catch (e) { /* silent */ }

            // Check ads for instagram_actor_id too
            try {
                const ads = await fetchMeta(`${cleanId}/ads`, {
                    fields: 'creative{instagram_actor_id}', limit: 50
                });
                for (const ad of (ads.data || [])) {
                    if (ad.creative?.instagram_actor_id) igActorIds.add(ad.creative.instagram_actor_id);
                }
            } catch (e) { /* silent */ }
        }

        if (pageIds.size === 0) {
            log(`⚠️ ${client.name}: Nenhuma página encontrada nas campanhas`);
            continue;
        }

        // Get primary page info
        const primaryPageId = [...pageIds][0];
        let pageName = primaryPageId;
        let pageToken = '';
        const bmPage = pageMap.get(primaryPageId);
        if (bmPage) {
            pageName = bmPage.name;
            pageToken = bmPage.access_token || '';
        } else {
            try {
                const info = await fetchMeta(primaryPageId, { fields: 'id,name,access_token' });
                pageName = info.name || primaryPageId;
                pageToken = info.access_token || '';
            } catch (e) { /* silent */ }
        }

        // ── Instagram Discovery (3 strategies) ──────────────────────────────
        let igId = '';
        let igUsername = '';

        // Strategy 1: instagram_actor_id from adsets/ads (most reliable)
        if (igActorIds.size > 0) {
            const primaryIgId = [...igActorIds][0];
            igId = primaryIgId;
            // Try to get username from BM list
            const bmIg = bmIgAccounts.get(primaryIgId);
            if (bmIg) {
                igUsername = bmIg.username || bmIg.name || '';
                log(`✅ ${client.name}: IG encontrado via adset → @${igUsername}`);
            } else {
                // Fetch username directly
                try {
                    const igInfo = await fetchMeta(primaryIgId, { fields: 'id,username,name' });
                    igUsername = igInfo.username || igInfo.name || '';
                    log(`✅ ${client.name}: IG encontrado via adset+fetch → @${igUsername}`);
                } catch (e) {
                    log(`⚠️ ${client.name}: IG ID ${primaryIgId} encontrado mas não consegui buscar username`);
                }
            }
        }

        // Strategy 2: BM instagram_accounts matched by page
        if (!igId && bmIgAccounts.size > 0) {
            // Try page's connected IG via page token
            if (pageToken) {
                try {
                    const pageIg = await fetchMeta(`${primaryPageId}/instagram_accounts`, {
                        fields: 'id,username', access_token: pageToken
                    });
                    if (pageIg.data?.[0]) {
                        igId = pageIg.data[0].id;
                        igUsername = pageIg.data[0].username || '';
                        log(`✅ ${client.name}: IG encontrado via page/instagram_accounts → @${igUsername}`);
                    }
                } catch (e) { /* silent */ }
            }
        }

        // Strategy 3: Page's instagram_business_account (original approach)
        if (!igId) {
            const tokenToUse = pageToken || token;
            try {
                const igData = await fetchMeta(primaryPageId, {
                    fields: 'instagram_business_account{id,username,name}',
                    access_token: tokenToUse
                });
                if (igData.instagram_business_account) {
                    igId = igData.instagram_business_account.id;
                    igUsername = igData.instagram_business_account.username || igData.instagram_business_account.name || '';
                    log(`✅ ${client.name}: IG encontrado via page.instagram_business_account → @${igUsername}`);
                }
            } catch (e) {
                log(`⚠️ ${client.name}: instagram_business_account falhou: ${e.message}`);
            }
        }

        if (!igId) {
            log(`⚠️ ${client.name}: Página FB encontrada ("${pageName}") mas Instagram não encontrado`);
        }

        results.push({
            client_id: client.id,
            facebook_page_id: primaryPageId,
            facebook_page_name: pageName,
            facebook_page_token: pageToken,
            instagram_account_id: igId,
            instagram_username: igUsername,
        });

        log(`📋 ${client.name}: FB="${pageName}" IG="${igUsername ? '@' + igUsername : '(não encontrado)'}"`);
    }

    return results;
};

