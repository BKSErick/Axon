import React, { useState, useMemo } from 'react';
import { C } from '../../lib/clientTheme';
import { Badge } from '../Common';
import { fmtBRL, fmtN } from '../../data/db';
import { Target, ChevronUp, ChevronDown, Search } from 'lucide-react';

const PERIOD_OPTIONS = [
    { value: 'last_7d', label: '7 dias' },
    { value: 'last_30d', label: '30 dias' },
    { value: 'last_90d', label: '90 dias' },
    { value: 'this_month', label: 'Este mês' },
];

const STATUS_CONFIG = {
    active: { color: 'var(--green)', label: 'Ativa' },
    paused: { color: 'var(--amber)', label: 'Pausada' },
    archived: { color: 'var(--text-dim)', label: 'Arquivada' },
    deleted: { color: 'var(--red)', label: 'Removida' },
};

const COLS = [
    { key: 'name',   label: 'Campanha',   width: '28%', sortable: true },
    { key: 'status', label: 'Status',     width: '10%', sortable: false },
    { key: 'spend',  label: 'Investido',  width: '12%', sortable: true },
    { key: 'leads',  label: 'Leads',      width: '9%',  sortable: true },
    { key: 'cpa',    label: 'CPA',        width: '10%', sortable: true },
    { key: 'ctr',    label: 'CTR',        width: '9%',  sortable: true },
    { key: 'clicks', label: 'Cliques',    width: '9%',  sortable: true },
    { key: 'profit', label: 'Lucro Est.', width: '13%', sortable: true },
];

const KpiCard = ({ label, value, sub, color }) => (
    <div style={{
        background: C.card,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        padding: '20px 24px',
        flex: '1 1 160px',
        minWidth: 0,
    }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: color || C.text, lineHeight: 1 }}>
            {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{sub}</div>}
    </div>
);

export const CampaignsView = ({ campaigns, creativePeriod, setCreativePeriod }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortKey, setSortKey] = useState('spend');
    const [sortDir, setSortDir] = useState('desc');

    const handleSort = (key) => {
        if (!COLS.find(c => c.key === key)?.sortable) return;
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    // Normalize campaign data (compute cpa + profit once)
    const processed = useMemo(() => {
        return (campaigns.data || []).map(c => ({
            ...c,
            cpa: c.ssot?.cpa ?? (c.leads > 0 ? c.spend / c.leads : 0),
            profit: c.ssot?.profit ?? 0,
        }));
    }, [campaigns.data]);

    // Filter + sort
    const filtered = useMemo(() => {
        let list = processed;
        if (search.trim()) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
        return [...list].sort((a, b) => {
            const va = sortKey === 'name' ? a.name : (a[sortKey] ?? 0);
            const vb = sortKey === 'name' ? b.name : (b[sortKey] ?? 0);
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? va - vb : vb - va;
        });
    }, [processed, search, statusFilter, sortKey, sortDir]);

    // Summary KPIs (from ALL data, not filtered)
    const totalSpend  = processed.reduce((s, c) => s + c.spend, 0);
    const totalLeads  = processed.reduce((s, c) => s + c.leads, 0);
    const totalProfit = processed.reduce((s, c) => s + c.profit, 0);
    const avgCtr      = processed.length > 0 ? processed.reduce((s, c) => s + c.ctr, 0) / processed.length : 0;
    const avgCpa      = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const activeCount = processed.filter(c => c.status === 'active').length;

    // Available statuses for filter pills
    const statuses = ['all', ...Array.from(new Set(processed.map(c => c.status)))];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }} className="fadeup">

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: '-0.3px' }}>
                        Campanhas
                    </h1>
                    <p style={{ color: C.muted, fontSize: 14 }}>
                        Performance granular por campanha no Meta Ads
                    </p>
                </div>
                {/* Period selector */}
                <div className="pill-input" style={{ width: 'auto', padding: 4, display: 'flex', gap: 2 }}>
                    {PERIOD_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setCreativePeriod(opt.value)}
                            style={{
                                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: 'none',
                                background: creativePeriod === opt.value ? 'var(--surf)' : 'transparent',
                                color: creativePeriod === opt.value ? 'var(--primary)' : 'var(--text-dim)',
                                transition: 'all 0.2s',
                                boxShadow: creativePeriod === opt.value ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Loading ── */}
            {campaigns.loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: C.muted, gap: 12 }}>
                    <div className="spinner" style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Carregando campanhas...
                </div>
            )}

            {/* ── KPI Cards ── */}
            {!campaigns.loading && processed.length > 0 && (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <KpiCard
                        label="Total Investido"
                        value={fmtBRL(totalSpend)}
                        sub={`${activeCount} campanha${activeCount !== 1 ? 's' : ''} ativa${activeCount !== 1 ? 's' : ''}`}
                    />
                    <KpiCard
                        label="Total de Leads"
                        value={fmtN(totalLeads)}
                        sub={totalLeads > 0 ? `CPA médio: ${fmtBRL(avgCpa)}` : 'Sem leads no período'}
                        color={totalLeads > 0 ? 'var(--green)' : undefined}
                    />
                    <KpiCard
                        label="CTR Médio"
                        value={avgCtr > 0 ? `${avgCtr.toFixed(2)}%` : '—'}
                        sub="Taxa de clique nas campanhas"
                    />
                    <KpiCard
                        label="Lucro Estimado"
                        value={fmtBRL(totalProfit)}
                        sub="Baseado no ticket médio"
                        color={totalProfit >= 0 ? 'var(--green)' : 'var(--red)'}
                    />
                </div>
            )}

            {/* ── Empty state (no data at all) ── */}
            {!campaigns.loading && processed.length === 0 && (
                <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 48, textAlign: 'center' }}>
                    <Target size={40} style={{ color: C.muted, marginBottom: 16, opacity: 0.5 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Nenhuma campanha encontrada</h3>
                    <p style={{ color: C.muted, fontSize: 14 }}>Não há campanhas com dados no período selecionado.</p>
                </div>
            )}

            {/* ── Search + Status filters ── */}
            {!campaigns.loading && processed.length > 0 && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.dim, pointerEvents: 'none' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar campanha..."
                            style={{
                                width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                                background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                                color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {statuses.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            const isActive = statusFilter === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        border: `1px solid ${isActive ? (cfg?.color || C.primary) : C.border}`,
                                        background: isActive ? `${cfg?.color || C.primary}18` : 'transparent',
                                        color: isActive ? (cfg?.color || C.primary) : C.muted,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {s === 'all' ? 'Todas' : (cfg?.label || s)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Empty filtered state ── */}
            {!campaigns.loading && processed.length > 0 && filtered.length === 0 && (
                <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 32, textAlign: 'center' }}>
                    <p style={{ color: C.muted, fontSize: 14 }}>Nenhuma campanha corresponde aos filtros aplicados.</p>
                </div>
            )}

            {/* ── Table ── */}
            {!campaigns.loading && filtered.length > 0 && (
                <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>

                    {/* Header row */}
                    <div style={{ display: 'grid', gridTemplateColumns: COLS.map(c => c.width).join(' '), padding: '14px 24px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                        {COLS.map(col => (
                            <div
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                style={{
                                    fontSize: 11, fontWeight: 700,
                                    color: sortKey === col.key ? C.primary : C.dim,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    cursor: col.sortable ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    userSelect: 'none',
                                }}
                            >
                                {col.label}
                                {col.sortable && sortKey === col.key && (
                                    sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Data rows */}
                    {filtered.map((camp, i) => {
                        const st = STATUS_CONFIG[camp.status] || STATUS_CONFIG.archived;
                        const profitPositive = camp.profit >= 0;

                        return (
                            <div
                                key={camp.id || i}
                                className="list-item"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: COLS.map(c => c.width).join(' '),
                                    padding: '16px 24px',
                                    borderBottom: i < filtered.length - 1 ? `1px solid var(--border)` : 'none',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }} title={camp.name}>
                                    {camp.name}
                                </div>
                                <div>
                                    <Badge color={st.color} variant="tonal" size="sm">{st.label}</Badge>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                                    {fmtBRL(camp.spend)}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: camp.leads > 0 ? 'var(--green)' : 'var(--text-dim)' }}>
                                    {fmtN(camp.leads)}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                    {camp.leads > 0 ? fmtBRL(camp.cpa) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                    {camp.ctr > 0 ? `${Number(camp.ctr).toFixed(2)}%` : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                    {fmtN(camp.clicks)}
                                </div>
                                <div>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: profitPositive ? 'var(--green)' : 'var(--red)' }}>
                                        {fmtBRL(camp.profit)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer totals */}
                    {(() => {
                        const tSpend  = filtered.reduce((s, c) => s + c.spend, 0);
                        const tLeads  = filtered.reduce((s, c) => s + c.leads, 0);
                        const tProfit = filtered.reduce((s, c) => s + c.profit, 0);
                        const tCtr    = filtered.length > 0 ? filtered.reduce((s, c) => s + c.ctr, 0) / filtered.length : 0;
                        const tClicks = filtered.reduce((s, c) => s + c.clicks, 0);
                        const tCpa    = tLeads > 0 ? tSpend / tLeads : 0;
                        const isSubset = filtered.length !== processed.length;
                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: COLS.map(c => c.width).join(' '), padding: '16px 24px', background: 'var(--surf)', borderTop: '2px solid var(--border)' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    TOTAL {isSubset && <span style={{ color: C.dim, fontWeight: 600, fontSize: 11 }}>({filtered.length}/{processed.length})</span>}
                                </div>
                                <div />
                                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>{fmtBRL(tSpend)}</div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--green)' }}>{fmtN(tLeads)}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{tLeads > 0 ? fmtBRL(tCpa) : '—'}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{tCtr > 0 ? `${tCtr.toFixed(2)}%` : '—'}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{fmtN(tClicks)}</div>
                                <div style={{ fontSize: 13, fontWeight: 900, color: tProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtBRL(tProfit)}</div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
