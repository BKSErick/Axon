import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, XCircle, RefreshCw, Wallet, ChevronDown } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const fmtBRL = (value, currency = 'BRL') => {
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `R$ ${Number(value).toFixed(2)}`;
    }
};

const fetchCreditForClient = async (client_id, token) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/check-ad-credit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ client_id }),
    });
    const data = await res.json();
    return data.accounts || [];
};

// Status label and color
const getStatus = (acc) => {
    if (acc.error) return { label: 'Erro ao verificar', color: '#64748B', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', icon: null };
    if (acc.isDisabled) return { label: 'Conta desativada', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: <XCircle size={14} /> };
    if (acc.isEmpty) return { label: 'Sem crédito', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: <XCircle size={14} /> };
    if (acc.isLow) return { label: 'Crédito baixo', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: <AlertTriangle size={14} /> };
    return { label: 'Ativo', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: null };
};

// Compact summary badges shown when collapsed
const CollapsedSummary = ({ accounts }) => {
    const problems = accounts.filter(a => a.isEmpty || a.isDisabled);
    const warnings = accounts.filter(a => a.isLow && !a.isEmpty && !a.isDisabled);
    const healthy = accounts.filter(a => !a.isEmpty && !a.isDisabled && !a.isLow && !a.error);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {problems.length > 0 && (
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#EF4444',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    padding: '3px 10px', borderRadius: 99,
                }}>
                    <XCircle size={11} /> {problems.length} sem crédito
                </span>
            )}
            {warnings.length > 0 && (
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#F59E0B',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                    padding: '3px 10px', borderRadius: 99,
                }}>
                    <AlertTriangle size={11} /> {warnings.length} crédito baixo
                </span>
            )}
            {healthy.length > 0 && (
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                    padding: '3px 10px', borderRadius: 99,
                }}>
                    ✓ {healthy.length} ativo{healthy.length > 1 ? 's' : ''}
                </span>
            )}
        </div>
    );
};

// Single account row — always visible
const AccountCreditRow = ({ acc, isAdmin }) => {
    const status = getStatus(acc);
    const isRed = acc.isEmpty || acc.isDisabled;
    const isYellow = acc.isLow && !acc.isEmpty && !acc.isDisabled;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            borderRadius: 12,
            background: status.bg,
            border: `1px solid ${status.border}`,
        }}>
            {/* Wallet icon */}
            <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                color: status.color,
            }}>
                <Wallet size={16} />
            </div>

            {/* Name + client tag */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isAdmin && acc.clientName && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginRight: 6, fontSize: 11 }}>
                            [{acc.clientName}]
                        </span>
                    )}
                    {acc.name || `Conta ${acc.meta_id}`}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    ID: {acc.meta_id}
                </div>
            </div>

            {/* Balance */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: isRed ? '#EF4444' : isYellow ? '#F59E0B' : '#10B981',
                }}>
                    {acc.error ? '—' : fmtBRL(acc.balance || 0, acc.currency)}
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                    fontSize: 11, fontWeight: 600, color: status.color, marginTop: 2,
                }}>
                    {status.icon}
                    {status.label}
                </div>
            </div>
        </div>
    );
};

// ─── Client Dashboard ──────────────────────────────────────────────────────
export const CreditAlert = ({ clientId }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetail, setShowDetail] = useState(false);

    const fetchCredit = async () => {
        if (!clientId) { setLoading(false); return; }
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session?.session?.access_token;
            const accs = await fetchCreditForClient(clientId, token);
            setAccounts(accs);
        } catch (err) {
            console.error('CreditAlert error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCredit(); }, [clientId]);

    if (!clientId || loading || accounts.length === 0) return null;

    // Determine worst status across accounts
    const hasEmpty = accounts.some(a => a.isEmpty || a.isDisabled);
    const hasLow = accounts.some(a => a.isLow && !a.isEmpty && !a.isDisabled);
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const currency = accounts[0]?.currency || 'BRL';

    const isRed = hasEmpty;
    const isYellow = hasLow && !hasEmpty;
    const color = isRed ? '#EF4444' : isYellow ? '#F59E0B' : '#10B981';
    const bg = isRed ? 'rgba(239,68,68,0.1)' : isYellow ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.08)';
    const border = isRed ? 'rgba(239,68,68,0.3)' : isYellow ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.2)';
    const statusLabel = isRed ? 'Sem crédito' : isYellow ? 'Crédito baixo' : 'Ativo';

    return (
        <div style={{ position: 'relative' }}>
            <div
                onClick={() => setShowDetail(d => !d)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 10, padding: '6px 14px',
                    cursor: 'pointer', userSelect: 'none',
                    transition: 'all 0.2s ease',
                }}
            >
                <Wallet size={14} style={{ color }} />
                <span style={{ fontSize: 14, fontWeight: 800, color }}>
                    {fmtBRL(totalBalance, currency)}
                </span>
                {accounts.length > 1 && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        ({accounts.length})
                    </span>
                )}
                <span style={{ fontSize: 10, fontWeight: 600, color, marginLeft: 2 }}>
                    ● {statusLabel}
                </span>
                <ChevronDown
                    size={12}
                    style={{
                        color: 'rgba(255,255,255,0.3)',
                        transition: 'transform 0.2s ease',
                        transform: showDetail ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </div>

            {/* Popover detail */}
            {showDetail && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, padding: 12, minWidth: 320,
                    zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
                        💳 Saldo por Conta
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {accounts.map(acc => (
                            <AccountCreditRow key={acc.meta_id} acc={acc} isAdmin={false} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Admin Dashboard ───────────────────────────────────────────────────────
export const AdminCreditAlert = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expanded, setExpanded] = useState(false); // Collapsed by default for admin

    const fetchAllCredits = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session?.session?.access_token;

            const { data: clients } = await supabase.from('clients').select('id, name');
            if (!clients || clients.length === 0) { setLoading(false); return; }

            const results = await Promise.allSettled(
                clients.map(async client => {
                    const accs = await fetchCreditForClient(client.id, token);
                    return accs.map(acc => ({ ...acc, clientName: client.name }));
                })
            );

            const allAccounts = results
                .filter(r => r.status === 'fulfilled')
                .flatMap(r => r.value);

            // Sort: problems first
            allAccounts.sort((a, b) => {
                const score = (x) => (x.isEmpty || x.isDisabled) ? 0 : x.isLow ? 1 : 2;
                return score(a) - score(b);
            });

            setAccounts(allAccounts);
        } catch (err) {
            console.error('AdminCreditAlert error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAllCredits(); }, []);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 16,
            padding: '16px 18px',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 20,
        }}>
            <div
                onClick={() => setExpanded(e => !e)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
                        💳 Saldo das Contas de Anúncio
                        {accounts.length > 0 && (
                            <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                                ({accounts.length} {accounts.length === 1 ? 'conta' : 'contas'})
                            </span>
                        )}
                    </div>
                    {!expanded && !loading && accounts.length > 0 && (
                        <CollapsedSummary accounts={accounts} />
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchAllCredits(true); }}
                        disabled={refreshing}
                        title="Atualizar saldo"
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 11, fontWeight: 600,
                        }}
                    >
                        <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        Atualizar
                    </button>
                    <ChevronDown
                        size={16}
                        style={{
                            color: 'rgba(255,255,255,0.3)',
                            transition: 'transform 0.2s ease',
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    />
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: 12 }}>
                    {loading ? (
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                            Verificando saldo de todas as contas...
                        </div>
                    ) : accounts.length === 0 ? (
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                            Nenhuma conta encontrada
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {accounts.map(acc => (
                                <AccountCreditRow key={acc.meta_id} acc={acc} isAdmin={true} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
