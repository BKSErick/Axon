import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend } from 'recharts';
import { C, fmtBRL, fmtN, chartData7dStatic } from '../data/db';
import { supabase } from '../lib/supabase';
import { getAdAccounts, getBusinesses, getAccountInsights, getCampaignsWithInsights } from '../lib/meta';
import { fetchUnifiedAggregateInsights, fetchUnifiedCampaignsInsights, fetchExtendedOverviewData, GLOBAL_TICKET_MEDIO } from '../lib/metricsAggregator';
import { Avatar, Badge, Stat, Btn, Modal, Field, Input, Toggle, ChartTooltip, SectionLabel, Divider } from './Common';
import { AdminCreditAlert } from './client/CreditAlert';

import {
    Home,
    Briefcase,
    Layers,
    BarChart3,
    Users,
    User,
    FileText,
    Smartphone,
    Settings,
    LogOut,
    ChevronRight,
    Search,
    Bell,
    TrendingUp,
    Plus,
    Send,
    Trash2,
    Filter,
    Link,
    Map,
    Menu,
    Monitor,
    Save,
    Type
} from 'lucide-react';

// Admin: Sidebar
export const AdminSidebar = ({ page, setPage, auth, open, onClose }) => {
    const nav = [
        { id: "overview", icon: Home, label: "Visão Geral" },
        { id: "bm", icon: Briefcase, label: "Business Managers" },
        { id: "accounts", icon: Layers, label: "Contas de Anúncio" },
        { id: "all_campaigns", icon: TrendingUp, label: "Todas as Campanhas" },
        { id: "clients", icon: Users, label: "Clientes" },
        { id: "reports", icon: BarChart3, label: "Relatórios" },
        { id: "social_media", icon: Smartphone, label: "Social Media" },
        { id: "settings", icon: Settings, label: "Configurações" },
    ];

    const sidebarStyle = {
        width: 260,
        background: "var(--card)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border)",
        position: window.innerWidth < 1024 ? "fixed" : "sticky",
        top: 0,
        left: window.innerWidth < 1024 && !open ? -260 : 0,
        zIndex: 1000,
        flexShrink: 0,
        transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: open && window.innerWidth < 1024 ? "20px 0 50px rgba(0,0,0,0.5)" : "none"
    };

    return (
        <>
            {/* Overlay for mobile */}
            {open && window.innerWidth < 1024 && (
                <div
                    onClick={onClose}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }}
                />
            )}

            <div style={sidebarStyle}>
                <div style={{ padding: "24px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                        <div style={{ padding: 8, background: 'var(--primary)15', borderRadius: 12 }}>
                            <img src="/logo.png" alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
                        </div>
                        <div>
                            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>MetaReports</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--red)", background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2, textTransform: 'uppercase' }}>Admin</div>
                        </div>
                    </div>

                    <SectionLabel>Menu Principal</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {nav.map(item => {
                            const Icon = item.icon;
                            const isActive = page === item.id;
                            return (
                                <button
                                    key={item.id}
                                    className={`nav-btn${isActive ? " active" : ""}`}
                                    onClick={() => {
                                        setPage(item.id);
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                >
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    <span style={{ fontSize: 14 }}>{item.label}</span>
                                    {isActive && (
                                        <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)' }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ padding: "20px", borderTop: "1px solid var(--border)" }}>
                    <div
                        onClick={() => {
                            setPage("settings");
                            if (window.innerWidth < 1024) onClose();
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, cursor: 'pointer', transition: 'all .2s' }}
                        className="card-hover"
                    >
                        <Avatar name={auth.name} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: "var(--text)", fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.name}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.agency}</div>
                        </div>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                    </div>
                </div>
            </div>
        </>
    );
};


// Admin: Overview
export const AdminOverview = ({ setPage, auth, selectedAccount, setSelectedAccount }) => {
    const [datePreset, setDatePreset] = useState('last_30d');
    const [stats, setStats] = useState({ totalSpend: 0, totalLeads: 0, activeAccs: 0, totalAccs: 0, activeClients: 0, totalClients: 0, unlinked: 0 });
    const [clients, setClients] = useState([]);
    const [allAccountsList, setAllAccountsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [extKpis, setExtKpis] = useState(null);
    const [dailyData, setDailyData] = useState([]);
    const [demographics, setDemographics] = useState({ age: [], gender: [] });
    const [selectedCredit, setSelectedCredit] = useState(null);

    useEffect(() => {
        if (selectedAccount === 'all') { setSelectedCredit(null); return; }
        const acc = allAccountsList.find(a => a.id === selectedAccount);
        if (!acc) return;
        const fetchCredit = async () => {
            try {
                const { data: session } = await supabase.auth.getSession();
                const token = session?.session?.access_token;
                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-ad-credit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ client_id: acc.client_id }),
                });
                const data = await res.json();
                const match = (data.accounts || []).find(a => a.meta_id === acc.meta_id);
                setSelectedCredit(match || null);
            } catch (e) {
                console.warn('Inline credit fetch failed:', e);
                setSelectedCredit(null);
            }
        };
        fetchCredit();
    }, [selectedAccount, allAccountsList]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [accsRes, clientsRes] = await Promise.all([
                    supabase.from('ad_accounts').select('*'),
                    supabase.from('clients').select('*, ad_accounts(id, meta_id, spend)')
                ]);

                if (accsRes.data) {
                    const allAccs = accsRes.data;
                    setAllAccountsList(allAccs);
                    const accs = selectedAccount === 'all' ? allAccs : allAccs.filter(a => a.id === selectedAccount);

                    const extData = await fetchExtendedOverviewData(accs, datePreset);
                    setExtKpis(extData.kpis);
                    setDailyData(extData.daily);
                    setDemographics(extData.demographics);

                    const totalSpend = extData.kpis.spend;
                    const totalLeads = extData.kpis.totalLeads;
                    const totalClicks = extData.kpis.linkClicks;

                    const insightsPromises = accs.map(a => getAccountInsights(a.meta_id, datePreset));
                    const insightsData = await Promise.all(insightsPromises);

                    const accountsWithInsights = accs.map((a, i) => ({
                        ...a,
                        liveSpend: insightsData[i].spend || 0,
                        liveLeads: insightsData[i].leads || 0,
                        liveClicks: insightsData[i].clicks || 0,
                    }));

                    const enrichedClients = (clientsRes.data || []).map(cl => {
                        const clAccs = cl.ad_accounts || [];
                        const clLiveSpend = clAccs.reduce((sum, ca) => sum + (accountsWithInsights.find(awi => awi.id === ca.id)?.liveSpend || 0), 0);
                        const clLiveLeads = clAccs.reduce((sum, ca) => sum + (accountsWithInsights.find(awi => awi.id === ca.id)?.liveLeads || 0), 0);
                        const clLiveClicks = clAccs.reduce((sum, ca) => sum + (accountsWithInsights.find(awi => awi.id === ca.id)?.liveClicks || 0), 0);

                        return {
                            ...cl,
                            liveSpend: clLiveSpend,
                            liveLeads: clLiveLeads,
                            liveClicks: clLiveClicks,
                            cpa: clLiveLeads > 0 ? (clLiveSpend / clLiveLeads) : 0,
                            roas: clLiveSpend > 0 ? ((clLiveLeads * GLOBAL_TICKET_MEDIO) / clLiveSpend).toFixed(2) : "0",
                            profit: (clLiveLeads * GLOBAL_TICKET_MEDIO) - clLiveSpend
                        };
                    });

                    setStats(s => ({
                        ...s,
                        totalSpend,
                        totalLeads,
                        totalClicks,
                        globalCpa: totalLeads > 0 ? totalSpend / totalLeads : 0,
                        activeAccs: accs.filter(a => a.status === 'active').length,
                        totalAccs: accs.length,
                        unlinked: accs.filter(a => !a.client_id).length,
                        activeClients: (clientsRes.data || []).filter(c => c.active).length,
                        totalClients: (clientsRes.data || []).length
                    }));
                    setClients(enrichedClients);
                }
            } catch (err) {
                console.error("Overview Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [datePreset, selectedAccount]);

    const DONUT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const GENDER_COLORS = { male: '#3B82F6', female: '#EC4899', unknown: '#64748B' };
    const GENDER_LABELS = { male: 'Masculino', female: 'Feminino', unknown: 'Outros' };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
            <div className="spinner" style={{ width: 40, height: 40, border: `3px solid var(--border)`, borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 500 }}>Sincronizando dados com Meta Ads...</div>
        </div>
    );
    const k = extKpis || {};

    return (
        <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 60 }}>
            {/* Header com Filtros */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: 'wrap', gap: 20 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>Painel Administrativo</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Visão consolidada de todas as contas e clientes sob gestão.</p>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: 'wrap' }}>
                    {selectedCredit && (
                        <div style={{ background: 'var(--surf)', padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', height: 42 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginRight: 12 }}>Créditos Meta:</span>
                            <span style={{ fontSize: 13, fontWeight: 900, color: selectedCredit.balance < 100 ? 'var(--red)' : 'var(--green)' }}>
                                {fmtBRL(selectedCredit.balance)}
                            </span>
                        </div>
                    )}

                    <select
                        value={selectedAccount}
                        onChange={e => setSelectedAccount(e.target.value)}
                        className="pill-input"
                        style={{ height: 42, minWidth: 180 }}
                    >
                        <option value="all">Todas as Contas</option>
                        {allAccountsList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    <select
                        value={datePreset}
                        onChange={e => setDatePreset(e.target.value)}
                        className="pill-input"
                        style={{ height: 42, minWidth: 160 }}
                    >
                        <option value="today">Hoje</option>
                        <option value="last_3d">Últimos 3 Dias</option>
                        <option value="last_7d">Últimos 7 Dias</option>
                        <option value="last_30d">Últimos 30 Dias</option>
                        <option value="this_month">Este Mês</option>
                    </select>
                </div>
            </div>

            {stats.unlinked > 0 && (
                <div style={{ background: "rgba(245,158,11,.08)", border: `1px solid rgba(245,158,11,.2)`, borderRadius: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,158,11,.1)", display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚠️</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--amber)', fontWeight: 800, fontSize: 15 }}>{stats.unlinked} contas sem cliente vinculado</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Estas contas não aparecem nos dashboards dos clientes. Resolva este vínculo para habilitar o reporting.</div>
                    </div>
                    <Btn variant="tonal" size="sm" onClick={() => setPage("accounts")}>Vincular Agora</Btn>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                <Stat icon={Users} label="Total de Leads" value={fmtN(k.totalLeads || 0)} accent="var(--green)" />
                <Stat icon={TrendingUp} label="Investimento Total" value={fmtBRL(k.spend || 0)} accent="var(--blue)" />
                <Stat icon={BarChart3} label="Custo por Lead (CPA)" value={fmtBRL((k.spend / k.totalLeads) || 0)} accent="var(--amber)" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Desempenho Diário</h3>
                        <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green)' }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Leads</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--blue)' }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>CPC</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11, fontWeight: 600 }} tickFormatter={v => v.split('-').slice(1).reverse().join('/')} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11, fontWeight: 600 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 11, fontWeight: 600 }} tickFormatter={v => `R$${v}`} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surf)', opacity: 0.4 }} />
                                <Bar yAxisId="left" dataKey="leads" fill="var(--green)" radius={[4, 4, 0, 0]} barSize={28} />
                                <Line yAxisId="right" type="monotone" dataKey="cpc" stroke="var(--blue)" strokeWidth={3} dot={{ r: 4, fill: 'var(--blue)', strokeWidth: 2, stroke: 'var(--card)' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 32 }}>Distribuição por Idade</h3>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={demographics.age} dataKey="leads" nameKey="label" innerRadius={70} outerRadius={95} paddingAngle={4}>
                                    {demographics.age.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {demographics.age.slice(0, 5).map((item, i) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-dim)' }}>{item.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{item.leads} leads</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: `1px solid var(--border)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>Performance Individual por Cliente</h3>
                    <Btn variant="tonal" size="sm" onClick={() => setPage("clients")}>Gerenciar Carteira</Btn>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surf)' }}>
                                <th style={{ padding: '14px 32px', textAlign: 'left', fontSize: 10, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Cliente</th>
                                <th style={{ padding: '14px 32px', textAlign: 'right', fontSize: 10, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Investido</th>
                                <th style={{ padding: '14px 32px', textAlign: 'right', fontSize: 10, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Leads</th>
                                <th style={{ padding: '14px 32px', textAlign: 'right', fontSize: 10, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>CPA</th>
                                <th style={{ padding: '14px 32px', textAlign: 'right', fontSize: 10, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Lucro Est.</th>
                                <th style={{ padding: '14px 32px', textAlign: 'right', fontSize: 10, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(cl => (
                                <tr key={cl.id} className="list-item" style={{ borderBottom: `1px solid var(--border)` }}>
                                    <td style={{ padding: '16px 32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surf)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>
                                                {cl.name[0]}
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 14 }}>{cl.name}</div>
                                                <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{cl.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 32px', textAlign: 'right', color: 'var(--text)', fontWeight: 800, fontSize: 14 }}>{fmtBRL(cl.liveSpend)}</td>
                                    <td style={{ padding: '16px 32px', textAlign: 'right', color: 'var(--green)', fontWeight: 800, fontSize: 14 }}>{fmtN(cl.liveLeads)}</td>
                                    <td style={{ padding: '16px 32px', textAlign: 'right', color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>{fmtBRL(cl.cpa)}</td>
                                    <td style={{ padding: '16px 32px', textAlign: 'right', color: 'var(--green)', fontWeight: 900, fontSize: 14 }}>{fmtBRL(cl.profit)}</td>
                                    <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                                        <Badge variant="tonal" size="sm" color={cl.active ? 'var(--green)' : 'var(--red)'}>
                                            {cl.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// Admin: Business Managers
export const AdminBM = () => {
    const [bms, setBms] = useState([]);
    const [accs, setAccs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConnect, setShowConnect] = useState(false);
    const [token, setToken] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [bmRes, accRes] = await Promise.all([
            supabase.from('business_managers').select('*').neq('bm_id', 'SYSTEM_USER_TOKEN'),
            supabase.from('ad_accounts').select('*')
        ]);
        if (bmRes.data) setBms(bmRes.data);
        if (accRes.data) setAccs(accRes.data);
        setLoading(false);
    };

    const [syncing, setSyncing] = useState(false);
    const handleSync = async () => {
        console.log("Iniciando sincronização de BMs...");
        setSyncing(true);
        try {
            const metaBms = await getBusinesses();
            console.log("BMs recebidos da Meta:", metaBms);

            if (metaBms && metaBms.length > 0) {
                const toUpsert = metaBms.map(mb => ({
                    bm_id: mb.id,
                    name: mb.name,
                    status: 'connected',
                    connected_at: new Date().toISOString().split('T')[0]
                }));

                const { error } = await supabase
                    .from('business_managers')
                    .upsert(toUpsert, { onConflict: 'bm_id' });

                if (error) throw error;
                await fetchData();
                alert(`Sucesso! ${metaBms.length} Business Managers sincronizados.`);
            } else {
                alert("Nenhum Business Manager encontrado para este Token.");
            }
        } catch (error) {
            console.error('BM Sync Error:', error);
            alert('Erro ao sincronizar BMs: ' + error.message);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleConnect = async () => {
        if (!token) return;
        setConnecting(true);

        try {
            // Fetch BMs and Accounts simultaneously to ensure token works
            const [bmRes, accRes] = await Promise.all([
                fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${token}&fields=id,name`),
                fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${token}&fields=id,name,account_status,currency,amount_spent,business&limit=100`)
            ]);

            const bmData = await bmRes.json();
            const accData = await accRes.json();

            if (bmData.error || accData.error) {
                const err = bmData.error || accData.error;
                alert(`Erro na chave da API: ${err.message}`);
                setConnecting(false);
                return;
            }

            // Save the token globally as a generic BM record using 'SYSTEM_USER_TOKEN'
            await supabase.from('business_managers').upsert({
                bm_id: 'SYSTEM_USER_TOKEN',
                name: token, // We store the actual token in the name column
                status: 'connected',
                token_expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }, { onConflict: 'bm_id' });

            // 1. Process Business Managers
            const metaBms = bmData.data || [];
            let fallbackBmId = null;

            if (metaBms.length > 0) {
                const toUpsert = metaBms.map(mb => ({
                    bm_id: mb.id,
                    name: mb.name,
                    status: 'connected',
                    connected_at: new Date().toISOString().split('T')[0]
                }));
                await supabase.from('business_managers').upsert(toUpsert, { onConflict: 'bm_id' });
            } else if (accData.data && accData.data.length > 0) {
                // If token works for Accounts but not BMs, create a Fallback BM
                fallbackBmId = `DEFAULT_${Math.floor(Math.random() * 1000000)}`;
                await supabase.from('business_managers').upsert({
                    bm_id: fallbackBmId,
                    name: "Agência Principal",
                    status: 'connected',
                    connected_at: new Date().toISOString().split('T')[0]
                }, { onConflict: 'bm_id' });
            }

            // 2. Automatically sync the Ad Accounts we just fetched!
            const metaAccs = accData.data || [];
            if (metaAccs.length > 0) {
                // Get existing to preserve client_id
                const { data: existingAccs } = await supabase.from('ad_accounts').select('meta_id, client_id, bm_id');
                const existingMap = new Map((existingAccs || []).map(a => [a.meta_id, a]));

                // Insert or Update
                const accountsToUpsert = metaAccs.map(ma => {
                    const existing = existingMap.get(ma.id);
                    // Determine which BM owns it. If native BM is returned, use it, else use fallback
                    let assignedBmId = existing?.bm_id || null;
                    if (!assignedBmId) {
                        if (ma.business?.id) assignedBmId = ma.business.id;
                        else if (fallbackBmId) assignedBmId = fallbackBmId;
                    }

                    return {
                        meta_id: ma.id,
                        name: ma.name || ma.id,
                        status: ma.account_status === 1 ? 'active' : 'paused',
                        client_id: existing?.client_id || null,
                        bm_id: assignedBmId
                    };
                });

                await supabase.from('ad_accounts').upsert(accountsToUpsert, { onConflict: 'meta_id' });
            }

            setConnected(true);
            setTimeout(() => {
                setShowConnect(false);
                setConnected(false);
                setToken("");
                // Refresh window to apply global token
                window.location.reload();
            }, 1500);

            alert(`Sucesso! Chave ativada.\nEncontramos ${metaBms.length} BMs e ${metaAccs.length} contas de anúncio.`);

        } catch (err) {
            console.error('Erro ao conectar BM:', err);
            alert('Falha na conexão. Verifique o console.');
            setConnecting(false);
        }
    };

    if (loading) return <div style={{ color: C.dim, padding: 20 }}>Carregando BMs...</div>;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        </div>
    );

    return (
        <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: 'wrap', gap: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>Business Managers</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Gestão centralizada de conexões e tokens da Meta API.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <Btn
                        variant="tonal"
                        onClick={handleSync}
                        loading={syncing}
                        className="glass"
                    >
                        {syncing ? "Sincronizando..." : "Sincronizar Meta"}
                    </Btn>
                    <Btn onClick={() => setShowConnect(true)} icon={<Layers size={16} />}>Novo BM</Btn>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {bms.map(bm => {
                    const bmAccs = accs.filter(a => a.bm_id === bm.id);
                    const isExp = bm.status === "expired";
                    return (
                        <div key={bm.id} className="card" style={{ border: isExp ? `1px solid var(--red)` : undefined }}>
                            <div style={{ padding: "24px 32px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: isExp ? "rgba(255,77,114,.1)" : "var(--surf)", border: '1px solid var(--border)', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                        🏢
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                                            <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: 16 }}>{bm.name}</span>
                                            <Badge variant="tonal" color={isExp ? 'var(--red)' : 'var(--green)'} size="sm">
                                                {isExp ? 'Expirado' : 'Conectado'}
                                            </Badge>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                            <div style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--surf)', padding: '2px 6px', borderRadius: 4 }}>ID: {bm.bm_id}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Conectado em {bm.connected_at} {bm.token_expires && <span style={{ opacity: 0.7 }}>· Expira em: {bm.token_expires}</span>}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ color: 'var(--text)', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{bmAccs.length}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>contas</div>
                                    </div>
                                </div>

                                {isExp && (
                                    <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(255,77,114,.05)", borderRadius: 12, border: `1px solid rgba(255,77,114,.2)`, display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{ fontSize: 18 }}>⚠️</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 800 }}>Token Expirado</div>
                                            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>As contas vinculadas a este BM pararam de receber atualizações.</div>
                                        </div>
                                        <Btn variant="danger" size="sm" onClick={() => setShowConnect(true)}>Renovar Token</Btn>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: "16px 32px", borderTop: `1px solid var(--border)`, background: 'rgba(0,0,0,0.02)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Contas sob gestão</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                    {bmAccs.map(a => (
                                        <div key={a.id} style={{ background: 'var(--card)', borderRadius: 8, padding: "8px 12px", border: `1px solid var(--border)`, display: "flex", alignItems: "center", gap: 8, transition: 'all 0.2s ease' }} className="row-hover">
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.status === 'active' ? 'var(--green)' : 'var(--text-dim)' }} />
                                            <div>
                                                <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700 }}>{a.name}</div>
                                                <div style={{ color: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{a.meta_id}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showConnect && (
                <Modal title="Conectar Business Manager" subtitle="Autorize sua agência a acessar as contas do BM via API" onClose={() => setShowConnect(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="pill-input-container">
                            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-dim)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System User Token (Meta API)</label>
                            <Input
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="pill-input"
                                style={{ width: '100%', height: 48 }}
                            />
                        </div>

                        <div style={{ background: "rgba(16,217,160,.06)", border: `1px solid rgba(16,217,160,.15)`, borderRadius: 12, padding: "16px", fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--primary)', fontWeight: 800 }}>
                                <FileText size={14} /> Permissões necessárias:
                            </div>
                            <code style={{ fontSize: 11, background: 'var(--surf)', padding: '4px 8px', borderRadius: 4, display: 'block' }}>
                                ads_read · ads_management · business_management · pages_read_engagement
                            </code>
                        </div>

                        <Btn full size="lg" onClick={handleConnect} disabled={!token || connecting} loading={connecting}>
                            {connected ? "Conectado com Sucesso" : "Conectar e Importar"}
                        </Btn>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export const AdminAccounts = () => {
    const [linkModal, setLinkModal] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [clients, setClients] = useState([]);
    const [bms, setBms] = useState([]);
    const [pendingProfiles, setPendingProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [accRes, clRes, bmRes, profRes] = await Promise.all([
            supabase.from('ad_accounts').select('*').order('name'),
            supabase.from('clients').select('*'),
            supabase.from('business_managers').select('*'),
            supabase.from('profiles').select('*').eq('role', 'client').is('client_id', null)
        ]);
        if (accRes.data) setAccounts(accRes.data);
        if (clRes.data) setClients(clRes.data);
        if (bmRes.data) setBms(bmRes.data);
        if (profRes.data) setPendingProfiles(profRes.data);
        setLoading(false);
    };

    const [syncing, setSyncing] = useState(false);
    const handleSync = async () => {
        console.log("Iniciando sincronização...");
        setSyncing(true);
        try {
            const { getGlobalToken } = await import('../lib/meta');
            const token = await getGlobalToken();
            if (!token) {
                alert("Erro: Token da Meta não encontrado. Conecte um token válido em Configurações.");
                return;
            }

            const metaAccs = await getAdAccounts();
            console.log("Contas recebidas da Meta:", metaAccs.length);

            if (metaAccs && metaAccs.length > 0) {
                // --- RE-IMPLEMENTAÇÃO ROBUSTA E SEGURA ---
                // Buscamos o que já existe no banco para não perder os vínculos (client_id, bm_id)
                const { data: existingAccs } = await supabase.from('ad_accounts').select('meta_id, client_id, bm_id');
                const existingMap = new Map((existingAccs || []).map(a => [a.meta_id, a]));

                const accountsData = metaAccs.map(ma => {
                    const existing = existingMap.get(ma.id);
                    return {
                        meta_id: ma.id,
                        name: ma.name,
                        status: ma.account_status === 1 ? 'active' : 'paused',
                        // Preserva os vínculos se eles já existirem no banco
                        client_id: existing?.client_id || null,
                        bm_id: existing?.bm_id || null
                    };
                });

                const { data: savedAccs, error: upsertErr } = await supabase
                    .from('ad_accounts')
                    .upsert(accountsData, { onConflict: 'meta_id' })
                    .select();

                if (upsertErr) throw upsertErr;

                let totalCamps = 0;
                let failedAccs = 0;
                let errorDetails = "";

                // Agora sincronizamos os detalhes de cada conta salva
                for (const sa of savedAccs) {
                    try {
                        console.log(`> Detalhando conta: ${sa.name}`);
                        const [insights, camps] = await Promise.all([
                            getAccountInsights(sa.meta_id),
                            getCampaignsWithInsights(sa.meta_id)
                        ]);

                        // Salva campanhas primeiro para ter os dados
                        let accountSpend = 0;
                        let accountLeads = 0;

                        if (camps && camps.length > 0) {
                            const campsToUpsert = camps.map(c => {
                                accountSpend += Number(c.spend || 0);
                                accountLeads += Number(c.leads || 0);

                                return {
                                    account_id: sa.id,
                                    name: c.name,
                                    status: c.status,
                                    spend: c.spend,
                                    leads: c.leads,
                                    ctr: String(c.ctr),
                                    roas: c.spend > 0 ? (c.leads / c.spend).toFixed(2) : 0,
                                    meta_id: c.id
                                };
                            });

                            const { error: campUpsertErr } = await supabase.from('campaigns').upsert(campsToUpsert, { onConflict: 'meta_id' });
                            if (campUpsertErr) {
                                console.error(`Erro ao salvar campanhas da conta ${sa.name}:`, campUpsertErr);
                                errorDetails += `\n- ${sa.name} (Campanhas): ${campUpsertErr.message}`;
                                throw campUpsertErr;
                            }
                            totalCamps += camps.length;
                        }

                        // Atualiza totais da conta com a soma das campanhas (mais confiável que o insight da conta)
                        // Se não tiver campanhas, usa o insight da conta como fallback
                        const finalSpend = accountSpend > 0 ? accountSpend : (insights?.spend || 0);
                        const finalLeads = accountLeads > 0 ? accountLeads : (insights?.leads || 0);

                        const { error: updErr } = await supabase.from('ad_accounts').update({
                            spend: finalSpend,
                            leads: finalLeads
                        }).eq('id', sa.id);

                        if (updErr) {
                            console.error(`Erro ao atualizar totais da conta ${sa.name}:`, updErr);
                            errorDetails += `\n- ${sa.name} (Conta): ${updErr.message}`;
                        }
                    } catch (err) {
                        console.error(`Erro detalhado na conta ${sa.name}:`, err);
                        failedAccs++;
                    }
                }

                await fetchData();
                alert(`Sincronização Finalizada!\n\n✅ ${savedAccs.length} Contas atualizadas\n📣 ${totalCamps} Campanhas importadas\n${failedAccs > 0 ? `⚠️ ${failedAccs} operações falharam.\nERROS DETECTADOS:${errorDetails}\n\nSe o erro mencionar 'meta_id', certifique-se de rodar o script SQL de ajuste.` : ""}`);
            } else {
                alert("Nenhuma conta de anúncio encontrada vinculada a este Token.");
            }
        } catch (error) {
            console.error('Sync Error:', error);
            alert('Erro ao sincronizar com a Meta: ' + error.message);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: 'wrap', gap: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>Contas de Anúncio</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Gerencie a ativação e o vínculo de cada conta com seus clientes.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ background: "rgba(245,158,11,.08)", border: `1px solid rgba(245,158,11,.2)`, borderRadius: 12, padding: "0 16px", fontSize: 12, color: 'var(--amber)', fontWeight: 800, display: "flex", alignItems: "center", height: 42 }}>
                        ⚠️ {accounts.filter(a => !a.client_id).length} sem vínculo
                    </div>
                    <Btn
                        variant="tonal"
                        onClick={handleSync}
                        loading={syncing}
                        className="glass"
                    >
                        {syncing ? "Sincronizando..." : "Sincronizar Meta"}
                    </Btn>
                </div>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surf)' }}>
                                {["Conta", "Informações", "Cliente Vinculado", "Investimento", "Status", ""].map(h => (
                                    <th key={h} style={{ padding: "14px 24px", textAlign: h === "Investimento" || h === "Status" ? "right" : "left", fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => {
                                const bm = bms.find(b => b.id === acc.bm_id);
                                const client = clients.find(c => c.id === acc.client_id);
                                return (
                                    <tr key={acc.id} className="list-item" style={{ borderTop: `1px solid var(--border)` }}>
                                        <td style={{ padding: "16px 24px" }}>
                                            <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 14 }}>{acc.name}</div>
                                            <div style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{acc.meta_id}</div>
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>BM: {bm?.name || "—"}</div>
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            {client ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surf)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--primary)' }}>
                                                        {client.name[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700 }}>{client.name}</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{client.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Badge variant="tonal" color="var(--amber)" size="sm">Sem Vínculo</Badge>
                                            )}
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "right", color: 'var(--text)', fontSize: 14, fontWeight: 800 }}>
                                            {Number(acc.spend) > 0 ? fmtBRL(acc.spend) : <span style={{ opacity: 0.3 }}>—</span>}
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                            <Badge variant="tonal" color={acc.status === 'active' ? 'var(--green)' : 'var(--text-dim)'} size="sm">
                                                {acc.status}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                            <Btn variant="tonal" size="sm" onClick={() => setLinkModal(acc)}>
                                                {client ? "Re-vincular" : "⚡ Vincular"}
                                            </Btn>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {linkModal && (
                <LinkAccountModal
                    account={linkModal}
                    clients={clients}
                    pendingProfiles={pendingProfiles}
                    onClose={() => setLinkModal(null)}
                    onConfirm={async (clientId, isPending, profileId, name, email, chosenPerms) => {
                        let finalClientId = clientId;
                        if (isPending) {
                            const { data: newCl, error: clErr } = await supabase.from('clients').insert([{
                                name: name,
                                email: email,
                                active: true
                            }]).select().single();
                            if (clErr) { alert("Erro ao criar cliente automaticamente: " + clErr.message); return; }
                            finalClientId = newCl.id;
                            await supabase.from('profiles').update({ client_id: finalClientId }).eq('id', profileId);
                        }

                        if (chosenPerms) {
                            await supabase.from('permissions').upsert([{
                                client_id: finalClientId,
                                perms: chosenPerms
                            }], { onConflict: 'client_id' });
                        }

                        await supabase.from('ad_accounts').update({ client_id: finalClientId }).eq('id', linkModal.id);
                        setLinkModal(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

export const LinkAccountModal = ({ account, clients, pendingProfiles = [], onClose, onConfirm }) => {
    const current = clients.find(c => c.id === account.client_id);
    const [search, setSearch] = useState(current?.email || "");
    const [selected, setSelected] = useState(current || null);
    const [perms, setPerms] = useState({ view_spend: true, view_campaigns: true, download_reports: false, view_ecommerce: false });
    const [step, setStep] = useState(1);
    const [loadingPerms, setLoadingPerms] = useState(false);

    useEffect(() => {
        if (selected && !selected.isPending) {
            setLoadingPerms(true);
            supabase.from('permissions').select('perms').eq('client_id', selected.id).single()
                .then(({ data }) => {
                    if (data) setPerms(data.perms);
                    setLoadingPerms(false);
                });
        }
    }, [selected]);

    const combinedList = [
        ...clients,
        ...pendingProfiles.map(p => ({
            id: `pending_${p.id}`,
            name: p.full_name || p.email.split('@')[0],
            email: p.email,
            isPending: true,
            profile_id: p.id
        }))
    ];

    const filtered = combinedList.filter(c =>
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal title="Vincular Conta de Anúncio → Cliente" subtitle={`${account.name} · ${account.meta_id}`} onClose={onClose} width={560}>
            <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
                {["Selecionar Cliente", "Definir Permissões", "Confirmar"].map((s, i) => (
                    <div key={s} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ height: 3, borderRadius: 99, background: i + 1 <= step ? C.grad : C.border, marginBottom: 6, transition: "all .3s" }} />
                        <div style={{ fontSize: 10, color: i + 1 === step ? C.blue : C.muted, fontWeight: 700 }}>{s}</div>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div>
                    <Field label="Buscar cliente por nome ou e-mail">
                        <Input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }} placeholder="cliente@empresa.com" />
                    </Field>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
                        {filtered.map(cl => (
                            <div key={cl.id} onClick={() => { setSelected(cl); setSearch(cl.email); }}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${selected?.id === cl.id ? C.blue : C.border}`, background: selected?.id === cl.id ? `rgba(16,217,160,.08)` : "transparent", cursor: "pointer", transition: "all .2s" }}>
                                <Avatar name={cl.name} size={34} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{cl.name}</div>
                                    <div style={{ color: C.muted, fontSize: 11 }}>{cl.email}</div>
                                </div>
                                {selected?.id === cl.id && <span style={{ color: C.blue, fontWeight: 800, fontSize: 16 }}>✓</span>}
                            </div>
                        ))}
                    </div>
                    {filtered.length === 0 && search.length > 0 && (
                        <div style={{ padding: "12px 14px", background: "rgba(245,158,11,.06)", border: `1px dashed rgba(245,158,11,.25)`, borderRadius: 10, marginTop: 10, color: C.amber, fontSize: 12, lineHeight: 1.5 }}>
                            ⚠️ <strong>Cliente não encontrado?</strong> Se o cliente acabou de se cadastrar no site, ele está como um <strong>"Acesso Pendente"</strong>. Você precisa ir no menu lateral <strong>"Clientes"</strong> e clicar em <strong>"Vincular agora"</strong> para transformá-lo em uma Empresa antes de associar contas de anúncio.
                        </div>
                    )}
                    <div style={{ marginTop: 20 }}>
                        <Btn full onClick={() => setStep(2)} disabled={!selected}>Próximo: Definir permissões →</Btn>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <div style={{ background: C.card2, borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={selected.name} size={38} />
                        <div>
                            <div style={{ color: C.text, fontWeight: 700 }}>{selected.name}</div>
                            <div style={{ color: C.muted, fontSize: 12 }}>{selected.email}</div>
                        </div>
                    </div>
                    {loadingPerms ? <div style={{ color: C.dim, fontSize: 13 }}>Carregando permissões...</div> : (
                        <>
                            <Toggle on={perms.view_spend} onChange={v => setPerms(p => ({ ...p, view_spend: v }))} label="Ver investimento e orçamento" sub="Valores de gasto, budget diário/mensal" />
                            <Toggle on={perms.view_campaigns} onChange={v => setPerms(p => ({ ...p, view_campaigns: v }))} label="Ver campanhas detalhadas" sub="Nome, objetivo, criativos, resultados" />
                            <Toggle on={perms.download_reports} onChange={v => setPerms(p => ({ ...p, download_reports: v }))} label="Baixar relatórios (PDF/Excel)" sub="Exportar dados para fora da plataforma" />
                            <Toggle on={perms.view_ecommerce} onChange={v => setPerms(p => ({ ...p, view_ecommerce: v }))} label="Painel de E-commerce" sub="Pedidos, produtos, estoque" />
                        </>
                    )}
                    <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                        <Btn variant="ghost" onClick={() => setStep(1)}>← Voltar</Btn>
                        <Btn full onClick={() => setStep(3)}>Próximo: Confirmar →</Btn>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div>
                    <div style={{ background: C.card2, borderRadius: 14, padding: "18px 20px", marginBottom: 20, border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: C.dim, fontSize: 12 }}>Conta de anúncio</span>
                                <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{account.name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: C.dim, fontSize: 12 }}>Cliente</span>
                                <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{selected.name}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <Btn variant="ghost" onClick={() => setStep(2)}>← Voltar</Btn>
                        <Btn full variant="primary" onClick={() => onConfirm(selected.id, selected.isPending, selected.profile_id, selected.name, selected.email, perms)}>✓ Confirmar vínculo</Btn>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export const AdminClients = ({ onClientChange }) => {
    const [clients, setClients] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [pendingProfiles, setPendingProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permModal, setPermModal] = useState(null);
    const [inviteModal, setInviteModal] = useState(false);
    const [linkProfileModal, setLinkProfileModal] = useState(null);
    const [notifModal, setNotifModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [sendingReport, setSendingReport] = useState(null);

    const handleSendReport = async (client) => {
        setSendingReport(client.id);
        try {
            const { data, error } = await supabase.rpc('enqueue_single_client_report', { p_client_id: client.id });
            if (error) {
                alert('Erro: ' + error.message);
            } else if (data?.error) {
                if (data.error.includes('WhatsApp')) {
                    // Abre o modal de notificações para cadastrar o número
                    setSendingReport(null);
                    setNotifModal(client);
                    return;
                }
                alert('⚠️ ' + data.error);
            } else {
                alert('✅ ' + (data?.message || 'Relatório enfileirado!'));
            }
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            setSendingReport(null);
        }
    };

    const handleDeleteClient = async (client) => {
        if (!confirm(`⚠️ Tem certeza que deseja EXCLUIR o cliente "${client.name}"?\n\nIsso irá:\n- Remover o acesso de login\n- Desvincular todas as contas de anúncio\n- Apagar todos os dados do cliente\n\nEssa ação NÃO pode ser desfeita!`)) return;
        setDeleting(client.id);
        try {
            // 1) Desvincular ad_accounts
            await supabase.from('ad_accounts').update({ client_id: null }).eq('client_id', client.id);
            // 2) Buscar profile vinculado (para pegar o auth user id)
            const { data: profile } = await supabase.from('profiles').select('id').eq('client_id', client.id).maybeSingle();
            // 3) Deletar profile
            if (profile) {
                await supabase.from('profiles').delete().eq('id', profile.id);
                // 4) Deletar auth user via admin (RPC)
                await supabase.rpc('delete_auth_user', { target_user_id: profile.id });
            }
            // 5) Deletar o cliente
            await supabase.from('clients').delete().eq('id', client.id);
            fetchData();
        } catch (err) {
            console.error('Erro ao excluir cliente:', err);
            alert('Erro ao excluir cliente: ' + err.message);
        } finally {
            setDeleting(null);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const [clRes, accRes, profRes] = await Promise.all([
            supabase.from('clients').select('*').order('name'),
            supabase.from('ad_accounts').select('*'),
            supabase.from('profiles').select('*').eq('role', 'client').is('client_id', null)
        ]);
        if (clRes.data) setClients(clRes.data);
        if (accRes.data) setAccounts(accRes.data);

        // Auto-vincular profiles órfãos que já possuem client com mesmo email
        const actuallyPending = [];
        if (profRes.data && clRes.data) {
            for (const prof of profRes.data) {
                const matchingClient = clRes.data.find(c => c.email === prof.email);
                if (matchingClient) {
                    // Auto-link: atualiza profile com client_id correto (em background)
                    supabase.from('profiles').update({ client_id: matchingClient.id }).eq('id', prof.id).then(() => { });
                } else {
                    actuallyPending.push(prof);
                }
            }
        }
        setPendingProfiles(actuallyPending);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return <div style={{ color: C.dim, padding: 20 }}>Carregando clientes...</div>;

    return (
        <div className="fadeup">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>Gestão de Clientes</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Controle acesso, permissões e synchronize contas de anúncio.</p>
                </div>
                <Btn onClick={() => setInviteModal(true)} icon={<Plus size={16} />}>Cadastrar Cliente</Btn>
            </div>

            {/* SEÇÃO: USUÁRIOS PENDENTES (NOVO) */}
            {pendingProfiles.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <SectionLabel style={{ color: C.amber, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <span>⚠️</span> ACESSOS PENDENTES ({pendingProfiles.length})
                    </SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {pendingProfiles.map(prof => (
                            <div key={prof.id} style={{ background: "rgba(245,158,11,.05)", borderRadius: 16, border: `1px solid rgba(245,158,11,.2)`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 15 }}>
                                <Avatar name={prof.full_name || prof.email} size={38} grad={C.grad} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{prof.full_name || "Usuário sem nome"}</div>
                                    <div style={{ color: C.dim, fontSize: 12 }}>{prof.email}</div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn size="sm" style={{ background: C.amber, color: "#000" }} onClick={() => setLinkProfileModal(prof)}>Vincular agora</Btn>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <SectionLabel style={{ marginBottom: 12 }}>CLIENTES ATIVOS ({clients.length})</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {clients.map(cl => {
                    const clAccs = accounts.filter(a => a.client_id === cl.id);
                    return (
                        <div key={cl.id} className="card list-item" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surf)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                        <Users size={20} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text)', fontSize: 16, fontWeight: 800 }}>{cl.name}</div>
                                        <div style={{ color: 'var(--text-dim)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {cl.email}
                                            <span style={{ fontSize: 10, background: 'var(--surf)', padding: '1px 6px', borderRadius: 4 }}>ID: {cl.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <Btn variant="ghost" size="sm" onClick={() => setPermModal(cl)} icon={<Settings size={14} />}>Permissões</Btn>
                                    <Btn variant="ghost" size="sm" onClick={() => setNotifModal(cl)} icon={<Smartphone size={14} />}>Notif.</Btn>
                                    {onClientChange && (
                                        <Btn variant="tonal" size="sm" onClick={() => onClientChange(cl.id)}>Visualizar</Btn>
                                    )}
                                    <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
                                    <button
                                        title="Enviar relatório manual"
                                        onClick={() => handleSendReport(cl)}
                                        style={{ cursor: sendingReport === cl.id ? "wait" : "pointer", color: 'var(--blue)', background: 'transparent', border: 'none', padding: 8, opacity: sendingReport === cl.id ? 0.3 : 0.7, borderRadius: 8, transition: "all .2s" }}
                                    >
                                        {sendingReport === cl.id ? '⏳' : <Send size={18} />}
                                    </button>
                                    <button
                                        title="Excluir cliente"
                                        onClick={() => handleDeleteClient(cl)}
                                        style={{ cursor: deleting === cl.id ? "wait" : "pointer", color: 'var(--red)', background: 'transparent', border: 'none', padding: 8, opacity: deleting === cl.id ? 0.3 : 0.7, borderRadius: 8, transition: "all .2s" }}
                                    >
                                        {deleting === cl.id ? '⏳' : <Trash2 size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                {clAccs.map(a => (
                                    <div key={a.id} style={{ background: 'var(--surf)', borderRadius: 10, padding: "7px 14px", border: `1px solid var(--border)`, display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.status === 'active' ? 'var(--green)' : 'var(--text-dim)' }} />
                                        <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700 }}>{a.name}</span>
                                        <span
                                            title="Desvincular conta"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!confirm(`Desvincular "${a.name}" do cliente ${cl.name}?`)) return;
                                                await supabase.from('ad_accounts').update({ client_id: null }).eq('id', a.id);
                                                fetchData();
                                            }}
                                            style={{ cursor: "pointer", color: 'var(--red)', fontSize: 14, fontWeight: 900, marginLeft: 4, opacity: 0.6 }}
                                        >×</span>
                                    </div>
                                ))}
                                {clAccs.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: "italic", padding: "7px 0" }}>Nenhuma conta vinculada</span>}
                            </div>
                        </div>
                    );
                })}
                {clients.length === 0 && (
                    <div style={{ padding: 40, textAlign: "center", color: C.muted, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
                        Nenhum cliente cadastrado ainda.
                    </div>
                )}
            </div>

            {inviteModal && (
                <InviteClientModal
                    onClose={() => setInviteModal(false)}
                    onSuccess={() => { setInviteModal(false); fetchData(); }}
                    freeAccounts={accounts.filter(a => !a.client_id)}
                />
            )}
            {linkProfileModal && (
                <LinkProfileModal
                    profile={linkProfileModal}
                    clients={clients}
                    freeAccounts={accounts.filter(a => !a.client_id)}
                    onClose={() => setLinkProfileModal(null)}
                    onSuccess={() => { setLinkProfileModal(null); fetchData(); }}
                />
            )}
            {permModal && (
                <PermissionsModal
                    client={permModal}
                    onClose={() => setPermModal(null)}
                    onSave={() => { setPermModal(null); fetchData(); }}
                />
            )}
            {notifModal && (
                <NotificationPrefsModal
                    client={notifModal}
                    onClose={() => setNotifModal(null)}
                    onSave={() => { setNotifModal(null); fetchData(); }}
                />
            )}
        </div>
    );
};

export const InviteClientModal = ({ onClose, onSuccess, freeAccounts }) => {
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [selectedAccs, setSelectedAccs] = useState([]);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // {success, email, password}
    const [copied, setCopied] = useState(false);

    const toggleAcc = id => setSelectedAccs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    // Gerador de senha forte mas legível
    const generatePassword = () => {
        const words = ['Meta', 'Ads', 'Grow', 'Rise', 'Peak', 'Lead', 'Click', 'View', 'Push', 'Flow', 'Edge', 'Bolt'];
        const word1 = words[Math.floor(Math.random() * words.length)];
        const word2 = words[Math.floor(Math.random() * words.length)];
        const num = Math.floor(Math.random() * 900) + 100;
        const special = ['!', '@', '#', '$'][Math.floor(Math.random() * 4)];
        return `${word1}${word2}${num}${special}`;
    };

    // Auto-gerar senha quando o modal abrir
    useEffect(() => {
        if (!form.password) setForm(f => ({ ...f, password: generatePassword() }));
    }, []);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('create_client_with_auth', {
                p_name: form.name,
                p_email: form.email,
                p_phone: form.phone || null,
                p_password: form.password,
                p_selected_accounts: selectedAccs,
            });

            if (error) {
                console.error('[create-client] RPC error:', error);
                alert("Erro: " + error.message);
                setLoading(false);
                return;
            }

            if (data?.error) {
                console.error('[create-client] Logic error:', data.error);
                alert("Erro: " + data.error);
                setLoading(false);
                return;
            }

            console.log('[create-client] Success:', data);
            alert(`✅ ${data.message || 'Cliente criado com sucesso!'}`);
            setResult({ success: true, email: form.email, password: form.password, name: form.name });
            setStep(3);
        } catch (err) {
            console.error('[create-client] Fatal error:', err);
            alert("Erro fatal: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const platformUrl = window.location.origin;

    const credentialsMessage = result ? `🚀 *Acesso à Plataforma MetaReports*\n\nOlá ${result.name}! Seu painel de performance está pronto.\n\n🔗 Link: ${platformUrl}\n📧 E-mail: ${result.email}\n🔑 Senha: ${result.password}\n\nAcesse para acompanhar campanhas, leads e investimento em tempo real.` : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(credentialsMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const encoded = encodeURIComponent(credentialsMessage);
        const phone = form.phone ? form.phone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    };

    return (
        <Modal title={step === 3 ? "✅ Cliente Criado!" : "Cadastrar Novo Cliente"} subtitle={step === 3 ? "Envie as credenciais para o cliente" : "O gestor cria o acesso completo do cliente"} onClose={step === 3 ? () => { onSuccess(); } : onClose}>
            {/* Progress bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? C.grad : C.border, transition: "all .3s" }} />)}
            </div>

            {step === 1 ? (
                <div>
                    <Field label="Nome completo"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="João Silva" /></Field>
                    <Field label="E-mail"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@empresa.com" /></Field>
                    <Field label="WhatsApp"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+55 11 99999-0000" /></Field>

                    <Field label="Senha de acesso">
                        <div style={{ display: "flex", gap: 8 }}>
                            <Input
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="Senha forte"
                                style={{ flex: 1 }}
                            />
                            <div
                                onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                                style={{ padding: "10px 14px", background: "rgba(56,189,248,.1)", borderRadius: 12, border: `1px solid rgba(56,189,248,.3)`, cursor: "pointer", color: C.primary, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}
                            >
                                🎲 Gerar
                            </div>
                        </div>
                    </Field>

                    <Btn full onClick={() => setStep(2)} disabled={!form.name || !form.email || !form.password}>Próximo: Vincular contas →</Btn>
                </div>
            ) : step === 2 ? (
                <div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Vincular contas de anúncio (opcional):</div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>Ou pule para o cliente conectar o Facebook/Instagram via OAuth depois</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 200, overflowY: "auto" }}>
                        {freeAccounts.map(a => (
                            <div key={a.id} onClick={() => toggleAcc(a.id)}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${selectedAccs.includes(a.id) ? C.blue : C.border}`, background: selectedAccs.includes(a.id) ? `rgba(16,217,160,.07)` : "transparent", cursor: "pointer", transition: "all .2s" }}>
                                <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${selectedAccs.includes(a.id) ? C.blue : C.muted}`, background: selectedAccs.includes(a.id) ? C.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {selectedAccs.includes(a.id) && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                                </div>
                                <div>
                                    <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                                    <div style={{ color: C.muted, fontSize: 10 }}>{a.meta_id}</div>
                                </div>
                            </div>
                        ))}
                        {freeAccounts.length === 0 && <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 10 }}>Nenhuma conta disponível (sincronize antes)</div>}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <Btn variant="ghost" onClick={() => setStep(1)}>← Voltar</Btn>
                        <Btn full onClick={handleCreate} disabled={loading}>{loading ? "Criando acesso..." : selectedAccs.length > 0 ? "🚀 Criar Cliente" : "🚀 Criar sem conta"}</Btn>
                    </div>
                    {selectedAccs.length === 0 && (
                        <div style={{ marginTop: 10, background: 'rgba(24,119,242,0.06)', border: '1px solid rgba(24,119,242,0.15)', borderRadius: 10, padding: '8px 12px', color: 'rgba(24,119,242,0.8)', fontSize: 11, textAlign: 'center' }}>
                            📘 O cliente poderá conectar o Facebook/Instagram via OAuth ao fazer login
                        </div>
                    )}
                </div>
            ) : (
                /* Step 3: Credenciais prontas */
                <div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.2)', padding: 24, marginBottom: 24 }}>
                        <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Acesso Configurado</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>🔗 Plataforma</span>
                                <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{platformUrl}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>📧 E-mail</span>
                                <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{result?.email}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>🔑 Senha</span>
                                <code style={{ color: 'var(--green)', fontSize: 14, fontWeight: 900, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 4 }}>{result?.password}</code>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <Btn variant="ghost" onClick={handleCopy} full>
                            {copied ? "✅ Copiado!" : "📋 Copiar Dados"}
                        </Btn>
                        <Btn onClick={handleWhatsApp} full style={{ background: "#25D366", color: '#fff', border: 'none' }}>
                            💬 Enviar WhatsApp
                        </Btn>
                    </div>

                    <div style={{ background: "var(--surf)", borderRadius: 12, border: `1px solid var(--border)`, padding: 16, maxHeight: 120, overflowY: "auto" }}>
                        <pre style={{ color: 'var(--text-dim)', fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0, lineHeight: 1.5 }}>
                            {credentialsMessage}
                        </pre>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export const PermissionsModal = ({ client, onClose, onSave }) => {
    const [perms, setPerms] = useState({ view_spend: true, view_campaigns: true, download_reports: false, view_ecommerce: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        supabase.from('permissions').select('perms').eq('client_id', client.id).single()
            .then(({ data }) => {
                if (data) setPerms(data.perms);
                setLoading(false);
            });
    }, [client]);

    const handleSave = async () => {
        setSaving(true);
        await supabase.from('permissions').upsert({ client_id: client.id, perms });
        setSaving(false);
        onSave();
    };

    return (
        <Modal title={`Permissões — ${client.name}`} subtitle={client.email} onClose={onClose}>
            {loading ? <div style={{ color: C.dim, padding: 20 }}>Carregando...</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Toggle on={perms.view_spend} onChange={v => setPerms(p => ({ ...p, view_spend: v }))} label="Ver investimento" sub="Valores de gasto, budget" />
                    <Toggle on={perms.view_campaigns} onChange={v => setPerms(p => ({ ...p, view_campaigns: v }))} label="Ver campanhas" sub="Resultados detalhados" />
                    <Toggle on={perms.download_reports} onChange={v => setPerms(p => ({ ...p, download_reports: v }))} label="Baixar relatórios" sub="PDF/Excel" />
                    <Toggle on={perms.view_ecommerce} onChange={v => setPerms(p => ({ ...p, view_ecommerce: v }))} label="Painel E-commerce" sub="Vendas, estoque" />
                    <div style={{ marginTop: 16 }}>
                        <Btn full onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar permissões"}</Btn>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const WEEKDAYS = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const NotificationPrefsModal = ({ client, onClose, onSave }) => {
    const [prefs, setPrefs] = useState({
        whatsapp_number: client.phone || '',
        is_active: false,
        report_frequency: 'daily',
        send_time: '08:00',
        weekly_day: 1
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendAfterSave, setSendAfterSave] = useState(false);

    const hasWhatsapp = !!(prefs.whatsapp_number && prefs.whatsapp_number.trim());

    useEffect(() => {
        supabase.from('client_notification_prefs').select('*').eq('client_id', client.id).single()
            .then(({ data }) => {
                if (data) {
                    setPrefs({
                        whatsapp_number: data.whatsapp_number || client.phone || '',
                        is_active: data.is_active || false,
                        report_frequency: data.report_frequency || 'daily',
                        send_time: (data.send_time || '08:00:00').substring(0, 5),
                        weekly_day: data.weekly_day || 1
                    });
                }
                setLoading(false);
            });
    }, [client]);

    const handleSave = async (andSend = false) => {
        if (!prefs.whatsapp_number.trim()) return alert('Por favor, insira o número de WhatsApp.');
        setSaving(true);
        const payload = {
            client_id: client.id,
            whatsapp_number: prefs.whatsapp_number.trim(),
            is_active: prefs.is_active,
            report_frequency: prefs.report_frequency,
            send_time: prefs.send_time + ':00',
            weekly_day: prefs.weekly_day,
            updated_at: new Date().toISOString()
        };
        await supabase.from('client_notification_prefs').upsert(payload, { onConflict: 'client_id' });

        if (andSend) {
            const { data, error } = await supabase.rpc('enqueue_single_client_report', { p_client_id: client.id });
            setSaving(false);
            if (error || data?.error) {
                alert('⚠️ Erro ao disparar: ' + (error?.message || data?.error));
            } else {
                alert('✅ ' + (data?.message || 'Relatório enfileirado!'));
                onSave();
                return;
            }
        }

        setSaving(false);
        onSave();
    };

    const fieldStyle = { background: C.surf, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 600, outline: "none", width: "100%" };

    return (
        <Modal title={`Notificações — ${client.name}`} subtitle={"Configuração de envio automático"} onClose={onClose}>
            {loading ? <div style={{ color: C.dim, padding: 20 }}>Carregando...</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {!hasWhatsapp && (
                        <div style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#F59E0B", fontWeight: 600 }}>
                            ⚠️ Cadastre o WhatsApp do cliente para continuar o disparo.
                        </div>
                    )}
                    <Toggle on={prefs.is_active} onChange={v => setPrefs(p => ({ ...p, is_active: v }))} label="Relatórios ativos" sub="Habilitar envio automático via WhatsApp" />

                    <div>
                        <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Número WhatsApp</label>
                        <input
                            type="tel"
                            value={prefs.whatsapp_number}
                            onChange={e => setPrefs(p => ({ ...p, whatsapp_number: e.target.value }))}
                            placeholder="5511999999999"
                            style={fieldStyle}
                        />
                        <div style={{ color: C.dim, fontSize: 11, marginTop: 4 }}>Formato: Código país + DDD + número (ex: 5511999999999)</div>
                    </div>

                    <div>
                        <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Frequência</label>
                        <select
                            value={prefs.report_frequency}
                            onChange={e => setPrefs(p => ({ ...p, report_frequency: e.target.value }))}
                            style={fieldStyle}
                        >
                            <option value="daily">Diário</option>
                            <option value="weekly">Semanal</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Horário de envio (Brasília)</label>
                        <input
                            type="time"
                            value={prefs.send_time}
                            onChange={e => setPrefs(p => ({ ...p, send_time: e.target.value }))}
                            style={fieldStyle}
                        />
                    </div>

                    {prefs.report_frequency === 'weekly' && (
                        <div>
                            <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Dia da semana</label>
                            <select
                                value={prefs.weekly_day}
                                onChange={e => setPrefs(p => ({ ...p, weekly_day: Number(e.target.value) }))}
                                style={fieldStyle}
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{WEEKDAYS[d]}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        <Btn full onClick={() => handleSave(false)} disabled={saving}>{saving ? "Salvando..." : "Salvar configurações"}</Btn>
                        {prefs.whatsapp_number.trim() && (
                            <Btn full variant="ghost" onClick={() => handleSave(true)} disabled={saving}>
                                {saving ? "Enviando..." : "📩 Salvar e Disparar Relatório Agora"}
                            </Btn>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export const LinkProfileModal = ({ profile, clients, freeAccounts, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [selectedClientId, setSelectedClientId] = useState(""); // empty = create new
    const [companyName, setCompanyName] = useState(profile.full_name || profile.email.split('@')[0]);
    const [selectedAccs, setSelectedAccs] = useState([]);
    const [loading, setLoading] = useState(false);

    const toggleAcc = id => setSelectedAccs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            let clientId = selectedClientId;

            // 1. Criar empresa se não selecionou uma existente
            if (!clientId) {
                const { data: newCl, error: clErr } = await supabase.from('clients').insert([{
                    name: companyName,
                    email: profile.email,
                    active: true
                }]).select().single();
                if (clErr) throw clErr;
                clientId = newCl.id;

                // Criar permissões padrão
                await supabase.from('permissions').insert([{
                    client_id: clientId,
                    perms: { view_spend: true, view_campaigns: true, download_reports: false, view_ecommerce: false }
                }]);
            }

            // 2. Vincular perfil ao cliente
            const { error: profErr } = await supabase.from('profiles').update({ client_id: clientId }).eq('id', profile.id);
            if (profErr) throw profErr;

            // 3. Vincular contas selecionadas
            if (selectedAccs.length > 0) {
                await supabase.from('ad_accounts').update({ client_id: clientId }).in('id', selectedAccs);
            }

            setStep(3); // Mostrar feedback de sucesso
        } catch (err) {
            console.error(err);
            alert("Erro ao vincular: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title={step === 3 ? "✅ Vínculo Concluído!" : "Aprovar e Vincular Usuário"} subtitle={step === 3 ? "Acesso liberado com sucesso" : profile.email} onClose={step === 3 ? onSuccess : onClose} width={500}>
            <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? C.grad : C.border, transition: "all .3s" }} />)}
            </div>

            {step === 1 && (
                <div>
                    <div style={{ background: "rgba(16,217,160,.06)", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 13, color: C.dim, lineHeight: 1.5 }}>
                        O usuário <strong>{profile.full_name || profile.email}</strong> já tem conta no sistema. Escolha a qual empresa ele pertence:
                    </div>

                    <Field label="Vincular a uma empresa existente:">
                        <select
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.card2, border: `1.5px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none" }}
                        >
                            <option value="">+ Criar nova empresa para este usuário</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                            ))}
                        </select>
                    </Field>

                    {!selectedClientId && (
                        <Field label="Nome da nova empresa:">
                            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Nome do Cliente ou Marca" />
                        </Field>
                    )}

                    <div style={{ marginTop: 24 }}>
                        <Btn full onClick={() => setStep(2)}>Próximo: Vincular Contas →</Btn>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Selecione as contas para liberar acesso:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 220, overflowY: "auto" }}>
                        {freeAccounts.map(a => (
                            <div key={a.id} onClick={() => toggleAcc(a.id)}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${selectedAccs.includes(a.id) ? C.blue : C.border}`, background: selectedAccs.includes(a.id) ? `rgba(16,217,160,.07)` : "transparent", cursor: "pointer", transition: "all .2s" }}>
                                <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${selectedAccs.includes(a.id) ? C.blue : C.muted}`, background: selectedAccs.includes(a.id) ? C.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {selectedAccs.includes(a.id) && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                                    <div style={{ color: C.muted, fontSize: 10 }}>{a.meta_id}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <Btn variant="ghost" onClick={() => setStep(1)}>← Voltar</Btn>
                        <Btn full onClick={handleConfirm} disabled={loading}>{loading ? "Vinculando..." : "✅ Finalizar e Liberar Acesso"}</Btn>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                    <div style={{ color: C.text, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Usuário aprovado e vinculado!</div>
                    <div style={{ color: C.dim, fontSize: 13, marginBottom: 24 }}>
                        A conta {companyName} foi configurada. O usuário já pode acessar o painel e ver as contas de anúncio vinculadas.
                    </div>
                    <Btn full onClick={onSuccess}>Concluir e Fechar</Btn>
                </div>
            )}
        </Modal>
    );
};

export const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [clients, setClients] = useState([]);
    const [queueItems, setQueueItems] = useState([]);
    const [notifLogs, setNotifLogs] = useState([]);
    const [prefs, setPrefs] = useState([]);
    const [queueStats, setQueueStats] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedClient, setSelectedClient] = useState('');
    const [sendingSingle, setSendingSingle] = useState(false);
    const [whatsappInput, setWhatsappInput] = useState('');
    const [needsWhatsapp, setNeedsWhatsapp] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'queue', 'reports', 'diagnostics'

    const fetchData = async () => {
        setLoading(true);
        const [repRes, clRes, qRes, prefsRes, logsRes] = await Promise.all([
            supabase.from('reports').select('*').order('date', { ascending: false }).limit(50),
            supabase.from('clients').select('*'),
            supabase.from('notification_queue').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('client_notification_prefs').select('*'),
            supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(100)
        ]);
        if (repRes.data) setReports(repRes.data);
        if (clRes.data) setClients(clRes.data);
        if (qRes.data) {
            setQueueItems(qRes.data);
            const stats = { pending: 0, processing: 0, completed: 0, failed: 0 };
            qRes.data.forEach(q => { if (stats[q.status] !== undefined) stats[q.status]++; });
            setQueueStats(stats);
        }
        if (prefsRes.data) setPrefs(prefsRes.data);
        if (logsRes.data) setNotifLogs(logsRes.data);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleManualTrigger = async () => {
        setSending(true);
        try {
            const { data, error } = await supabase.rpc('enqueue_manual_reports');
            if (error) {
                alert("Erro ao disparar relatórios: " + error.message);
            } else if (data?.error) {
                alert("Erro: " + data.error);
            } else {
                alert(`✅ ${data?.message || (data?.queued || 0) + ' relatório(s) enfileirado(s)!'}`);
                fetchData();
            }
        } catch (err) {
            alert("Erro: " + err.message);
        }
        setSending(false);
    };

    const handleSingleClientReport = async (overrideWhatsapp = null) => {
        if (!selectedClient) return alert('Selecione um cliente primeiro');
        setSendingSingle(true);
        setNeedsWhatsapp(false);
        try {
            if (overrideWhatsapp) {
                await supabase.from('client_notification_prefs').upsert({
                    client_id: selectedClient,
                    whatsapp_number: overrideWhatsapp.trim(),
                    is_active: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'client_id' });
            }
            const { data, error } = await supabase.rpc('enqueue_single_client_report', { p_client_id: selectedClient });
            if (error) {
                alert('Erro: ' + error.message);
            } else if (data?.error) {
                if (data.error.includes('WhatsApp')) {
                    setNeedsWhatsapp(true);
                    setWhatsappInput('');
                    setSendingSingle(false);
                    return;
                }
                alert('⚠️ ' + data.error);
            } else {
                alert('✅ ' + (data?.message || 'Relatório enfileirado!'));
                fetchData();
            }
        } catch (err) {
            alert('Erro: ' + err.message);
        }
        setSendingSingle(false);
    };

    if (loading) return <div style={{ color: C.dim, padding: 20 }}>Carregando relatórios...</div>;

    // Build unified timeline: merge reports + queue items
    const buildUnifiedItems = () => {
        const items = [];

        // Add reports
        reports.forEach(r => {
            const client = clients.find(c => c.id === r.client_id);
            items.push({
                id: r.id,
                type: 'report',
                title: r.title,
                clientName: client?.name || 'Desconhecido',
                clientId: r.client_id,
                whatsapp: r.whatsapp_number || '—',
                period: r.period || '—',
                date: r.date || r.created_at,
                status: r.status,
                pdfUrl: r.pdf_url,
                adAccount: r.data?.ad_account,
                spend: r.data?.spend,
                leads: r.data?.leads,
            });
        });

        // Add queue items that DON'T already have a matching report
        const reportClientDates = new Set(reports.map(r => `${r.client_id}_${new Date(r.date).toLocaleDateString()}`));
        queueItems.forEach(q => {
            const dateStr = new Date(q.created_at).toLocaleDateString();
            const key = `${q.client_id}_${dateStr}`;
            // Skip if there's already a report for this client+date
            if (reportClientDates.has(key)) return;

            const client = clients.find(c => c.id === q.client_id);
            const typeLabel = q.type === 'weekly_report' ? 'Semanal' : q.type === 'manual_report' ? 'Manual' : 'Diário';
            items.push({
                id: q.id,
                type: 'queue',
                title: `Relatório ${typeLabel} — ${client?.name || 'Cliente'}`,
                clientName: client?.name || 'Desconhecido',
                clientId: q.client_id,
                whatsapp: q.payload?.whatsapp_number || '—',
                period: q.type === 'weekly_report' ? 'Últimos 7 dias' : 'Últimas 24h',
                date: q.created_at,
                status: q.status,
                pdfUrl: null,
                attempts: q.attempts,
            });
        });

        // Sort by date descending
        items.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Filter by active tab
        if (activeTab === 'reports') return items.filter(i => i.type === 'report');
        if (activeTab === 'queue') return items.filter(i => i.type === 'queue');
        return items;
    };

    const unifiedItems = buildUnifiedItems();

    const statusConfig = {
        sent: { bg: "rgba(16,185,129,.12)", color: "#10B981", label: "✅ Enviado" },
        completed: { bg: "rgba(16,185,129,.12)", color: "#10B981", label: "✅ Processado" },
        generating: { bg: "rgba(59,130,246,.12)", color: "#3B82F6", label: "⚙️ Gerando" },
        processing: { bg: "rgba(59,130,246,.12)", color: "#3B82F6", label: "⚙️ Processando" },
        pending: { bg: "rgba(251,191,36,.12)", color: "#F59E0B", label: "⏳ Na Fila" },
        failed: { bg: "rgba(239,68,68,.12)", color: "#EF4444", label: "❌ Falhou" },
        draft: { bg: "rgba(156,163,175,.12)", color: "#9CA3AF", label: "📝 Rascunho" }
    };

    const formatPhone = (phone) => {
        if (!phone || phone === '—') return '—';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 13) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
        if (clean.length === 12) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
        return phone;
    };

    const validatePhone = (phone) => {
        if (!phone) return { valid: false, issue: '❌ Sem número' };
        const clean = phone.replace(/\D/g, '');
        if (!clean.startsWith('55')) return { valid: false, issue: '⚠️ Falta código 55' };
        if (clean.length < 12) return { valid: false, issue: '⚠️ Número curto' };
        if (clean.length > 13) return { valid: false, issue: '⚠️ Número longo' };
        return { valid: true, issue: '✅ OK' };
    };

    // Build diagnostics data
    const errorLogs = notifLogs.filter(l => l.status === 'error');
    const clientDiag = prefs.map(p => {
        const client = clients.find(c => c.id === p.client_id);
        const phoneCheck = validatePhone(p.whatsapp_number);
        const clientExists = !!client;
        const failedItems = queueItems.filter(q => q.client_id === p.client_id && q.status === 'failed');
        const successItems = queueItems.filter(q => q.client_id === p.client_id && q.status === 'completed');
        return {
            ...p,
            clientName: client?.name || '⚠️ Cliente removido',
            clientExists,
            phoneCheck,
            failedCount: failedItems.length,
            successCount: successItems.length,
            hasIssues: !phoneCheck.valid || !clientExists || failedItems.length > 0
        };
    }).sort((a, b) => (b.hasIssues ? 1 : 0) - (a.hasIssues ? 1 : 0));

    const totalDispatched = queueStats.completed + reports.length;
    const diagIssuesCount = clientDiag.filter(d => d.hasIssues).length;

    return (
        <div className="fadeup">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                    <div style={{ color: C.text, fontWeight: 800, fontSize: 20 }}>Relatórios Enviados</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Histórico de PDFs e comunicações via WhatsApp</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Btn icon={<span style={{ fontSize: 14 }}>🚀</span>} onClick={handleManualTrigger} disabled={sending}>
                        {sending ? "Enviando..." : "Disparar Todos"}
                    </Btn>
                </div>
            </div>

            {/* Send controls row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
                <select
                    value={selectedClient}
                    onChange={e => { setSelectedClient(e.target.value); setNeedsWhatsapp(false); }}
                    style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, outline: "none", minWidth: 200 }}
                >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!needsWhatsapp ? (
                    <Btn variant="ghost" onClick={() => handleSingleClientReport()} disabled={sendingSingle || !selectedClient}>
                        {sendingSingle ? "Enviando..." : "📩 Enviar Individual"}
                    </Btn>
                ) : (
                    <>
                        <input
                            autoFocus
                            type="tel"
                            placeholder="WhatsApp: 5511999999999"
                            value={whatsappInput}
                            onChange={e => setWhatsappInput(e.target.value)}
                            style={{ background: C.card, color: C.text, border: `1.5px solid #06b6d4`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, outline: "none", minWidth: 200 }}
                            onKeyDown={e => { if (e.key === 'Enter' && whatsappInput.trim()) handleSingleClientReport(whatsappInput); }}
                        />
                        <Btn onClick={() => handleSingleClientReport(whatsappInput)} disabled={sendingSingle || !whatsappInput.trim()}>
                            {sendingSingle ? "Salvando..." : "🚀 Salvar e Enviar"}
                        </Btn>
                        <Btn variant="ghost" onClick={() => setNeedsWhatsapp(false)}>Cancelar</Btn>
                    </>
                )}
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                    <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total Enviados</div>
                    <div style={{ color: "#10B981", fontSize: 24, fontWeight: 800 }}>{totalDispatched}</div>
                </div>
                <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                    <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Na Fila</div>
                    <div style={{ color: "#F59E0B", fontSize: 24, fontWeight: 800 }}>{queueStats.pending}</div>
                </div>
                <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                    <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Processando</div>
                    <div style={{ color: "#3B82F6", fontSize: 24, fontWeight: 800 }}>{queueStats.processing}</div>
                </div>
                <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                    <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Falhas</div>
                    <div style={{ color: "#EF4444", fontSize: 24, fontWeight: 800 }}>{queueStats.failed}</div>
                </div>
            </div>

            {/* Tab Filter */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {[
                    { id: 'all', label: `📋 Todos (${reports.length + queueItems.length})` },
                    { id: 'reports', label: `📊 Relatórios (${reports.length})` },
                    { id: 'queue', label: `📨 Fila de Envio (${queueItems.length})` },
                    { id: 'diagnostics', label: `🔍 Diagnóstico${diagIssuesCount > 0 ? ` (${diagIssuesCount} ⚠️)` : ''}` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: `1px solid ${activeTab === tab.id ? 'rgba(6,182,212,.4)' : C.border}`,
                            background: activeTab === tab.id ? 'rgba(6,182,212,.1)' : 'transparent',
                            color: activeTab === tab.id ? '#06b6d4' : C.dim,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all .15s"
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <Btn variant="ghost" size="sm" onClick={fetchData} style={{ fontSize: 12 }}>🔄 Atualizar</Btn>
            </div>

            {/* Data Table OR Diagnostics */}
            {activeTab !== 'diagnostics' ? (
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr style={{ background: C.surf }}>
                            {["Título", "Cliente", "Destinatário", "Período", "Data", "Status", "Ações"].map(h => (
                                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {unifiedItems.map(item => {
                                const st = statusConfig[item.status] || statusConfig.draft;
                                return (
                                    <tr key={item.id} className="row-hover" style={{ borderTop: `1px solid ${C.border}` }}>
                                        <td style={{ padding: "13px 18px" }}>
                                            <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                                            {item.adAccount && <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>📋 {item.adAccount}</div>}
                                            {item.type === 'queue' && <div style={{ color: C.cyan || '#06b6d4', fontSize: 9, marginTop: 2, fontWeight: 600 }}>VIA FILA</div>}
                                        </td>
                                        <td style={{ padding: "13px 18px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <Avatar name={item.clientName?.[0] || "?"} size={24} />
                                                <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{item.clientName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "13px 18px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ fontSize: 14 }}>📱</span>
                                                <span style={{ color: C.text, fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>
                                                    {formatPhone(item.whatsapp)}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "13px 18px", color: C.dim, fontSize: 12 }}>{item.period}</td>
                                        <td style={{ padding: "13px 18px", color: C.dim, fontSize: 12 }}>
                                            {item.date ? new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : '—'}
                                        </td>
                                        <td style={{ padding: "13px 18px" }}>
                                            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: st.bg, color: st.color, fontWeight: 700 }}>{st.label}</span>
                                            {item.attempts > 1 && (
                                                <div style={{ color: C.muted, fontSize: 9, marginTop: 3 }}>
                                                    {item.attempts} tentativa{item.attempts > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "13px 18px" }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                {item.pdfUrl ? (
                                                    <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>📄 PDF</a>
                                                ) : (
                                                    <span style={{ color: C.muted, fontSize: 11 }}>—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {unifiedItems.length === 0 && (
                                <tr><td colSpan="7" style={{ padding: 60, textAlign: "center" }}>
                                    <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                                    <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                                        {activeTab === 'all' ? 'Nenhum relatório enviado ainda' : activeTab === 'reports' ? 'Nenhum relatório gerado' : 'Nenhum item na fila'}
                                    </div>
                                    <div style={{ color: C.muted, fontSize: 12, maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
                                        {activeTab === 'all' || activeTab === 'reports' ? (
                                            <>
                                                Para enviar relatórios: <br />
                                                1. Configure o WhatsApp do cliente em <strong>Clientes → Editar</strong><br />
                                                2. Selecione o cliente acima e clique em <strong>"Enviar Individual"</strong><br />
                                                3. Ou clique em <strong>"Disparar Todos"</strong> para enviar para todos os clientes ativos
                                            </>
                                        ) : (
                                            'Nenhum envio na fila de processamento no momento.'
                                        )}
                                    </div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ========== DIAGNOSTICS TAB ========== */
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Client Health */}
                    <div>
                        <div style={{ color: C.text, fontWeight: 800, fontSize: 15, marginBottom: 12 }}>📱 Saúde dos Clientes ({clientDiag.length} configurados)</div>
                        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr style={{ background: C.surf }}>
                                    {["Cliente", "WhatsApp", "Formato", "Ativo", "Envios OK", "Falhas", "Ação"].map(h => (
                                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {clientDiag.map(d => (
                                        <tr key={d.id} style={{ borderTop: `1px solid ${C.border}`, background: d.hasIssues ? 'rgba(239,68,68,.04)' : 'transparent' }}>
                                            <td style={{ padding: "10px 14px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <Avatar name={d.clientName?.[0] || "?"} size={22} />
                                                    <div>
                                                        <div style={{ color: d.clientExists ? C.text : '#EF4444', fontWeight: 700, fontSize: 12 }}>{d.clientName}</div>
                                                        {!d.clientExists && <div style={{ color: '#EF4444', fontSize: 9, fontWeight: 700 }}>CLIENTE NÃO EXISTE MAIS</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: C.text }}>
                                                {formatPhone(d.whatsapp_number) || <span style={{ color: '#EF4444' }}>Não cadastrado</span>}
                                            </td>
                                            <td style={{ padding: "10px 14px" }}>
                                                <span style={{
                                                    fontSize: 11, padding: "3px 8px", borderRadius: 8,
                                                    background: d.phoneCheck.valid ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                                                    color: d.phoneCheck.valid ? '#10B981' : '#EF4444',
                                                    fontWeight: 700
                                                }}>{d.phoneCheck.issue}</span>
                                            </td>
                                            <td style={{ padding: "10px 14px", fontSize: 12, color: d.is_active ? '#10B981' : C.muted }}>
                                                {d.is_active ? '✅ Sim' : '⏸️ Não'}
                                            </td>
                                            <td style={{ padding: "10px 14px", fontSize: 12, color: '#10B981', fontWeight: 700 }}>{d.successCount}</td>
                                            <td style={{ padding: "10px 14px", fontSize: 12, color: d.failedCount > 0 ? '#EF4444' : C.muted, fontWeight: 700 }}>{d.failedCount}</td>
                                            <td style={{ padding: "10px 14px" }}>
                                                {(!d.clientExists || !d.phoneCheck.valid) && d.is_active && (
                                                    <button onClick={async () => {
                                                        if (confirm(`Desativar notificações para ${d.clientName}?`)) {
                                                            await supabase.from('client_notification_prefs').update({ is_active: false }).eq('id', d.id);
                                                            fetchData();
                                                        }
                                                    }} style={{ background: 'rgba(239,68,68,.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Desativar</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {clientDiag.length === 0 && (
                                        <tr><td colSpan="7" style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 12 }}>Nenhum cliente com preferências configuradas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Error Logs */}
                    <div>
                        <div style={{ color: C.text, fontWeight: 800, fontSize: 15, marginBottom: 12 }}>🚨 Logs de Erros ({errorLogs.length} registros)</div>
                        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr style={{ background: C.surf }}>
                                    {["Data", "WhatsApp", "Erro", "Fila ID"].map(h => (
                                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {errorLogs.slice(0, 30).map(log => {
                                        const queueItem = queueItems.find(q => q.id === log.queue_id);
                                        const client = queueItem ? clients.find(c => c.id === queueItem.client_id) : null;
                                        return (
                                            <tr key={log.id} style={{ borderTop: `1px solid ${C.border}` }}>
                                                <td style={{ padding: "10px 14px", fontSize: 11, color: C.dim }}>
                                                    {new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.text }}>{formatPhone(log.whatsapp_number)}</div>
                                                    {client && <div style={{ fontSize: 9, color: C.muted }}>{client.name}</div>}
                                                </td>
                                                <td style={{ padding: "10px 14px", fontSize: 11, color: '#EF4444', maxWidth: 400 }}>
                                                    <div style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{log.error_details || 'Sem detalhes'}</div>
                                                </td>
                                                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 9, color: C.muted }}>{log.queue_id?.slice(0, 8)}...</td>
                                            </tr>
                                        );
                                    })}
                                    {errorLogs.length === 0 && (
                                        <tr><td colSpan="4" style={{ padding: 40, textAlign: "center" }}>
                                            <div style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>✅ Nenhum erro registrado!</div>
                                            <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Os logs aparecem aqui quando o worker encontra problemas ao processar a fila.</div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AdminSettings = ({ auth, onUpdate }) => {
    const [name, setName] = useState(auth.name || "");
    const [agency, setAgency] = useState(auth.agency || "");
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (retryCount = 0) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: name,
                    agency_name: agency
                })
                .eq('id', user.id);

            if (error) {
                // Handling PostgREST schema cache delay (very common after DDL changes)
                const isCacheError =
                    error.message?.toLowerCase().includes("schema cache") ||
                    error.message?.toLowerCase().includes("could not find the table") ||
                    error.code === 'PGRST116';

                if (retryCount < 10 && isCacheError) {
                    console.warn(`Sincronização pendente no banco (Tentativa ${retryCount + 1}/10). Aguardando...`);
                    await new Promise(r => setTimeout(r, 3000));
                    return handleSave(retryCount + 1);
                }
                throw error;
            }

            setSaved(true);
            if (onUpdate) onUpdate(); // Trigger refresh in App.jsx
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Erro ao salvar perfil:", err);
            const msg = err.message?.includes("schema cache")
                ? "O banco de dados ainda está processando a mudança. Por favor, aguarde 1 minuto e recarregue a página (F5) antes de tentar novamente."
                : err.message;
            alert("Erro ao salvar: " + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fadeup" style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 24 }}>
                <div style={{ color: C.text, fontWeight: 800, fontSize: 20 }}>Configurações da Agência</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Personalize o nome da sua agência e seu perfil administrativo.</div>
            </div>

            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px 28px" }}>
                <Field label="Seu Nome Completo">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" />
                </Field>

                <Field label="Nome da Agência" hint="Este nome aparecerá para todos os seus clientes e no topo do painel.">
                    <Input value={agency} onChange={e => setAgency(e.target.value)} placeholder="Ex: Minha Agência Digital" />
                </Field>

                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Btn onClick={handleSave} loading={loading} disabled={saved}>
                        {saved ? "✅ Configurações Salvas" : "Salvar Alterações"}
                    </Btn>
                    {saved && <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>Tudo pronto! As mudanças já foram aplicadas.</span>}
                </div>
            </div>

            <div style={{ marginTop: 32, padding: 20, background: 'rgba(59,130,246,.05)', borderRadius: 12, border: `1px solid rgba(59,130,246,.15)` }}>
                <div style={{ color: C.blue, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>💡 Dica: Gestão de Acessos</div>
                <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.6 }}>
                    Para dar acesso de **Gestor (Admin)** a outra pessoa, peça para ela se cadastrar no sistema e depois mude o "role" dela para "admin" diretamente no banco de dados Supabase. Clientes são vinculados automaticamente pelo e-mail cadastrado na aba Clientes.
                </div>
            </div>
        </div>
    );
};

// Admin: Monitor de Campanhas (Todas as contas)
export const AdminAllCampaigns = ({ selectedAccount, setSelectedAccount }) => {
    const [datePreset, setDatePreset] = useState('last_30d');
    const [camps, setCamps] = useState([]);
    const [allAccountsList, setAllAccountsList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, clientRes] = await Promise.all([
                supabase.from('ad_accounts').select('id, name, meta_id, client_id, status'),
                supabase.from('clients').select('id, name')
            ]);

            const allAccs = accRes.data || [];
            setAllAccountsList(allAccs);
            const accounts = selectedAccount === 'all' ? allAccs : allAccs.filter(a => a.id === selectedAccount);

            // Busca Campanhas em tempo real usando SSOT 🧠
            const accountsByClient = accounts.reduce((acc, a) => {
                if (a.status === 'active') {
                    if (!acc[a.id]) acc[a.id] = [];
                    acc[a.id].push(a);
                }
                return acc;
            }, {});

            const campaignsPromises = Object.entries(accountsByClient).map(async ([accId, actts]) => {
                const metaCamps = await fetchUnifiedCampaignsInsights(actts, datePreset);
                const accNameObj = actts[0];
                return metaCamps.map(mc => ({
                    ...mc,
                    account_id: accNameObj.id,
                    accountName: accNameObj.name,
                    clientName: accNameObj.client_id ? (clientRes.data.find(cl => cl.id === accNameObj.client_id)?.name || 'Sem vínculo') : 'Sem vínculo'
                }));
            });

            const results = await Promise.all(campaignsPromises);
            // Achata o array de arrays em um único array de campanhas
            let joinedData = results.flat();

            joinedData.sort((a, b) => Number(b.ssot?.profit || 0) * -1 - Number(a.ssot?.profit || 0) * -1); // Sort por lucro
            setCamps(joinedData);
        } catch (e) {
            console.error("Erro ao carregar monitor global em tempo real:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [datePreset, selectedAccount]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        </div>
    );

    const totalSpend = camps.reduce((s, c) => s + Number(c.spend), 0);
    const totalLeads = camps.reduce((s, c) => s + Number(c.leads), 0);
    const avgCpa = totalLeads > 0 ? totalSpend / totalLeads : 0;

    const dateLabels = {
        'today': 'Hoje',
        'last_30d': '30 Dias',
        'last_90d': '90 Dias',
        'this_month': 'Este Mês',
        'last_month': 'Mês Passado',
        'lifetime': 'Máximo'
    };

    return (
        <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: 'wrap', gap: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>Todas as Campanhas</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Visão macro de todos os registros da agência: {camps.length} itens encontrados.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Btn variant="tonal" icon={<Search size={14} />} onClick={fetchData} className="glass">Atualizar</Btn>

                    <select
                        value={selectedAccount}
                        onChange={e => setSelectedAccount(e.target.value)}
                        className="pill-input"
                        style={{ height: 42, minWidth: 180 }}
                    >
                        <option value="all">Todas as Contas</option>
                        {allAccountsList.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>

                    <select
                        value={datePreset}
                        onChange={e => setDatePreset(e.target.value)}
                        className="pill-input"
                        style={{ height: 42, minWidth: 160 }}
                    >
                        <option value="today">Hoje</option>
                        <option value="last_30d">Últimos 30 Dias</option>
                        <option value="last_90d">Últimos 90 Dias</option>
                        <option value="this_month">Este Mês</option>
                        <option value="last_month">Mês Passado</option>
                        <option value="lifetime">Tempo Total</option>
                    </select>
                </div>
            </div>

            {datePreset === 'today' && (
                <div style={{ background: "rgba(34,211,238,0.06)", border: '1px solid rgba(34,211,238,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 16 }}>⏳</div>
                    <div style={{ color: '#22D3EE', fontSize: 13, fontWeight: 700 }}>Dados de hoje em processamento. Os valores no Meta podem levar algumas horas para estabilizar.</div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                <Stat label={`Total Investido (${dateLabels[datePreset]})`} value={fmtBRL(totalSpend)} accent="var(--primary)" />
                <Stat label={`Total de Leads (${dateLabels[datePreset]})`} value={fmtN(totalLeads)} accent="var(--green)" />
                <Stat label={`CPA Médio (${dateLabels[datePreset]})`} value={fmtBRL(avgCpa)} accent="var(--blue)" />
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "20px 32px", borderBottom: `1px solid var(--border)`, background: 'var(--surf)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800 }}>Detalhamento por Campanha</h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surf)' }}>
                                {["Campanha", "Conta", "Investimento", "Leads", "CPA", "Lucro Est.", "Status"].map(h => (
                                    <th key={h} style={{
                                        padding: "14px 24px",
                                        textAlign: h === "Campanha" || h === "Conta" ? "left" : "right",
                                        fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', textTransform: "uppercase", letterSpacing: "1px"
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {camps.map((c, i) => (
                                <tr key={c.id || i} className="list-item" style={{ borderTop: `1px solid var(--border)` }}>
                                    <td style={{ padding: "16px 24px" }}>
                                        <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                        <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{c.id}</div>
                                    </td>
                                    <td style={{ padding: "16px 24px" }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.account_name}</div>
                                    </td>
                                    <td style={{ padding: "16px 24px", textAlign: 'right', color: 'var(--text)', fontSize: 13, fontWeight: 800 }}>{fmtBRL(c.spend)}</td>
                                    <td style={{ padding: "16px 24px", textAlign: 'right', color: 'var(--green)', fontSize: 13, fontWeight: 800 }}>{fmtN(c.leads)}</td>
                                    <td style={{ padding: "16px 24px", textAlign: 'right', color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{fmtBRL(Number(c.spend) / (Number(c.leads) || 1))}</td>
                                    <td style={{ padding: "16px 24px", textAlign: 'right', color: 'var(--green)', fontSize: 13, fontWeight: 900 }}>{fmtBRL(c.ssot?.profit || 0)}</td>
                                    <td style={{ padding: "16px 24px", textAlign: 'right' }}>
                                        <Badge variant="tonal" size="sm" color={c.status === 'ACTIVE' ? 'var(--green)' : 'var(--text-dim)'}>
                                            {c.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            {camps.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: 48, textAlign: "center", color: 'var(--text-dim)', fontSize: 14, fontWeight: 600 }}>Nenhuma campanha encontrada no período selecionado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
