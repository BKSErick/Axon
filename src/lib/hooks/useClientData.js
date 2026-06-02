import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { fetchExtendedOverviewData, fetchUnifiedCampaignsInsights, calculateBusinessMetrics } from '../metricsAggregator';
import { getAdsWithInsights } from '../meta';

// --- MOCK DATA GENERATORS ---
const generateDailyMetrics = (days = 30) => {
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        data.push({
            date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            spend: Math.floor(Math.random() * 500) + 100,
            leads: Math.floor(Math.random() * 50) + 5,
            revenue: Math.floor(Math.random() * 2000) + 500,
        });
    }
    return data;
};

const mockOrders = [
    { id: '#ORD-7782', customer: 'Fernanda Lima', total: 299.90, status: 'delivered', date: 'Hoje' },
    { id: '#ORD-7781', customer: 'Carlos Moura', total: 149.50, status: 'processing', date: 'Hoje' },
    { id: '#ORD-7780', customer: 'Beatriz Souza', total: 890.00, status: 'shipped', date: 'Ontem' },
    { id: '#ORD-7779', customer: 'Marcos Silva', total: 59.90, status: 'delivered', date: 'Ontem' },
];

// --- HOOKS ---

export const useKpis = (clientId) => {
    const [data, setData] = useState(null); // Return raw SSOT object
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clientId) { setLoading(false); return; }

        const fetchKpis = async () => {
            try {
                const { data: accounts } = await supabase
                    .from('ad_accounts')
                    .select('meta_id')
                    .eq('client_id', clientId);

                const metrics = await fetchExtendedOverviewData(accounts, 'last_30d');

                if (metrics._error) {
                    setError(metrics._error);
                }

                // Adicionamos a camada de negócios (Lucro, ROI, Score)
                const bizMetrics = calculateBusinessMetrics(metrics.kpis.spend, metrics.kpis.totalLeads);

                setData({
                    ...bizMetrics,
                    extended: metrics.kpis,
                    daily: metrics.daily,
                    demographics: metrics.demographics
                });
            } catch (error) {
                console.error("Erro ao buscar KPIs Reais do cliente:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchKpis();
    }, [clientId]);

    return { data, loading, error };
};

export const usePerformance = (clientId, period = '30d') => {
    // Mocking daily metrics which we don't sync yet
    const [data, setData] = useState([]);
    useEffect(() => {
        setData(generateDailyMetrics(period === '7d' ? 7 : 30));
    }, [period]);
    return { data, loading: false };
};

export const useCampaigns = (clientId, period = 'last_30d') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clientId) { setLoading(false); return; }
        setLoading(true);

        const fetchCampaigns = async () => {
            try {
                const { data: accounts } = await supabase
                    .from('ad_accounts')
                    .select('meta_id')
                    .eq('client_id', clientId);

                const campaignsMetrics = await fetchUnifiedCampaignsInsights(accounts, period);
                setData(campaignsMetrics);
            } catch (error) {
                console.error("Erro ao buscar Campanhas em tempo real:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [clientId, period]);

    return { data, loading };
};

export const useAds = (clientId, period = 'last_30d') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clientId) { setLoading(false); return; }
        setLoading(true);

        const fetchAds = async () => {
            try {
                const { data: accounts } = await supabase
                    .from('ad_accounts')
                    .select('meta_id')
                    .eq('client_id', clientId);

                if (!accounts || accounts.length === 0) {
                    setLoading(false);
                    return;
                }

                const adsPromises = accounts.map(a => getAdsWithInsights(a.meta_id, period));
                const results = await Promise.all(adsPromises);

                setData(results.flat());
            } catch (error) {
                console.error("Erro ao buscar Anúncios/Criativos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, [clientId, period]);

    return { data, loading };
};

export const useOrders = (clientId) => {
    return { data: mockOrders, loading: false };
};

export const useReports = (clientId) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clientId) { setLoading(false); return; }
        let mounted = true;
        (async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('reports')
                    .select('id, title, period, status, date, size, pdf_url, whatsapp_number')
                    .eq('client_id', clientId)
                    .order('date', { ascending: false })
                    .limit(50);
                if (error) throw error;
                if (mounted) setData(rows || []);
            } catch (error) {
                console.error('[useReports]', error);
                if (mounted) setData([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [clientId]);

    return { data, loading };
};

export const useEngagementAnalytics = (clientId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clientId) { setLoading(false); return; }

        const fetchAnalytics = async () => {
            try {
                const { data: result, error: fnError } = await supabase.functions.invoke('meta-organic-analytics', {
                    body: { clientId },
                });
                if (fnError) throw fnError;
                if (result?.data) setData(result.data);
            } catch (e) {
                console.error('[useEngagementAnalytics] Error:', e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [clientId]);

    return { data, loading, error };
};
