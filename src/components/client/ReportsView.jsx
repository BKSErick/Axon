import React from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Send, CheckCircle2, AlertTriangle, Clock, DollarSign, Users, Activity, TrendingUp } from 'lucide-react';
import { C } from '../../lib/clientTheme';
import { supabase } from '../../lib/supabase';
import { fmtBRL, fmtN } from '../../data/db';

// ─── Mini KPI card ────────────────────────────────────────────────────────────
const MiniKpi = ({ label, value, sub, accent }) => (
    <div style={{
        background: accent ? `rgba(16,185,129,0.08)` : C.card,
        border: `1px solid ${accent ? 'rgba(16,185,129,0.25)' : C.border}`,
        borderRadius: 16,
        padding: '20px 24px',
    }}>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: accent ? '#10B981' : C.muted, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const ReportsView = ({ user, kpis, campaigns }) => {
    const [exporting, setExporting] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [sendStatus, setSendStatus] = React.useState(null); // { type: 'success'|'error', msg }
    const [notifPrefs, setNotifPrefs] = React.useState(null);

    // Load WhatsApp prefs
    React.useEffect(() => {
        if (!user?.id) return;
        supabase
            .from('client_notification_prefs')
            .select('whatsapp_number, is_active, report_frequency, send_time, weekly_day')
            .eq('client_id', user.id)
            .maybeSingle()
            .then(({ data }) => setNotifPrefs(data));
    }, [user?.id]);

    const m = kpis || {};
    const spend = m.raw?.spend || 0;
    const leads = m.extended?.totalLeads ?? m.raw?.leads ?? 0;
    const cpa = leads > 0 ? spend / leads : 0;
    const topCampaigns = campaigns
        ? [...campaigns].sort((a, b) => (b.ssot?.profit || 0) - (a.ssot?.profit || 0)).slice(0, 5)
        : [];

    const handleExportPDF = async () => {
        const input = document.getElementById('pdf-report-template');
        if (!input) { alert('Aguarde o carregamento completo antes de exportar.'); return; }
        setExporting(true);
        try {
            const canvas = await html2canvas(input, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const w = pdf.internal.pageSize.getWidth();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
            pdf.save(`Relatorio_${user?.name || 'Cliente'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.pdf`);
        } catch (e) {
            console.error(e);
            alert('Erro ao gerar PDF. Verifique o console.');
        } finally {
            setExporting(false);
        }
    };

    const handleSendWhatsApp = async () => {
        setSending(true);
        setSendStatus(null);
        try {
            const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const message = [
                `📊 *Relatório de Performance — ${user?.name || 'Cliente'}*`,
                `📅 ${today}`,
                ``,
                `💰 *Investimento (30 dias):* ${fmtBRL(spend)}`,
                `🎯 *Oportunidades geradas:* ${fmtN(leads)}`,
                `📉 *Custo por Lead (CPA):* ${fmtBRL(cpa)}`,
                `📈 *Vendas estimadas:* ${fmtN(m.sales || 0)} (ROI ${m.roi || 0}%)`,
                `💵 *Lucro estimado:* ${fmtBRL(m.profit || 0)}`,
                ``,
                `_Relatório gerado pela plataforma MetaReports._`,
                `_Dúvidas? Fale com seu gestor de tráfego._`,
            ].join('\n');

            // 1. Enqueue (RPC inserts into report_queue, returns queue_id)
            const { data: queueId, error: rpcError } = await supabase.rpc('enqueue_single_client_report', {
                p_client_id: user.id,
                p_message: message,
            });
            if (rpcError) throw rpcError;

            // 2. Trigger Edge Function directly (more reliable than pg_net)
            const { data: { session } } = await supabase.auth.getSession();
            const fnRes = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp-report`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({ queue_id: queueId }),
                }
            );
            if (!fnRes.ok) {
                const err = await fnRes.json().catch(() => ({}));
                throw new Error(err?.error || 'Falha no envio pelo servidor.');
            }
            setSendStatus({ type: 'success', msg: 'Relatório enviado com sucesso para o WhatsApp!' });
        } catch (e) {
            setSendStatus({ type: 'error', msg: e.message?.includes('configurado') ? e.message : 'Falha ao enviar. Verifique se o número está configurado em Configurações.' });
        } finally {
            setSending(false);
        }
    };

    const freqLabel = notifPrefs?.report_frequency === 'weekly' ? 'Semanal' : 'Diário';
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 60 }} className="fadeup">

            {/* HEADER */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 24 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', marginBottom: 6 }}>Relatórios</h1>
                <p style={{ color: C.muted, fontSize: 14 }}>
                    Exporte seu relatório executivo em PDF ou receba direto no WhatsApp.
                </p>
            </div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 24px', borderRadius: 12, border: 'none', cursor: exporting ? 'not-allowed' : 'pointer',
                        background: 'var(--primary)', color: '#000', fontWeight: 800, fontSize: 14,
                        opacity: exporting ? 0.7 : 1, transition: '0.2s',
                    }}
                >
                    <Download size={16} />
                    {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
                </button>

                <button
                    onClick={handleSendWhatsApp}
                    disabled={sending || !notifPrefs?.is_active}
                    title={!notifPrefs?.is_active ? 'Ative o WhatsApp em Configurações' : ''}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 24px', borderRadius: 12, border: `1px solid ${C.border}`, cursor: (sending || !notifPrefs?.is_active) ? 'not-allowed' : 'pointer',
                        background: C.card, color: C.text, fontWeight: 800, fontSize: 14,
                        opacity: (sending || !notifPrefs?.is_active) ? 0.5 : 1, transition: '0.2s',
                    }}
                >
                    <Send size={16} />
                    {sending ? 'Enviando...' : 'Enviar por WhatsApp'}
                </button>
            </div>

            {/* SEND STATUS */}
            {sendStatus && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 20px', borderRadius: 12,
                    background: sendStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${sendStatus.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: sendStatus.type === 'success' ? '#10B981' : '#EF4444',
                    fontSize: 14, fontWeight: 600,
                }}>
                    {sendStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {sendStatus.msg}
                </div>
            )}

            {/* KPI SUMMARY */}
            <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 16 }}>Resumo Executivo (30 dias)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    <MiniKpi label="Investimento" value={fmtBRL(spend)} />
                    <MiniKpi label="Oportunidades" value={fmtN(leads)} sub={`CPA ${fmtBRL(cpa)}`} accent />
                    <MiniKpi label="Vendas Estimadas" value={fmtN(m.sales || 0)} sub={`ROI ${m.roi || 0}%`} accent />
                    <MiniKpi label="Lucro Estimado" value={fmtBRL(m.profit || 0)} />
                </div>
            </div>

            {/* TOP CAMPAIGNS TABLE */}
            {topCampaigns.length > 0 && (
                <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Top Campanhas</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                {['Campanha', 'Investido', 'Leads', 'CPA', 'Lucro'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {topCampaigns.map((c, i) => {
                                const profit = c.ssot?.profit || 0;
                                return (
                                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: C.text, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                                        <td style={{ padding: '14px 16px', color: C.muted }}>{fmtBRL(c.spend)}</td>
                                        <td style={{ padding: '14px 16px', color: C.muted }}>{fmtN(c.leads)}</td>
                                        <td style={{ padding: '14px 16px', color: C.muted }}>{fmtBRL(c.ssot?.cpa || (c.spend / (c.leads || 1)))}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 800, color: profit > 0 ? '#10B981' : '#EF4444' }}>{fmtBRL(profit)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* WHATSAPP SCHEDULE INFO */}
            <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Clock size={18} color={C.primary} />
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Envio Automático por WhatsApp</h2>
                </div>

                {notifPrefs?.is_active ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 20px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#10B981', marginBottom: 4 }}>Número</div>
                            <div style={{ fontWeight: 800, color: C.text }}>+55 {notifPrefs.whatsapp_number?.replace(/^55/, '') || '—'}</div>
                        </div>
                        <div style={{ background: C.surf, borderRadius: 12, padding: '12px 20px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Frequência</div>
                            <div style={{ fontWeight: 800, color: C.text }}>{freqLabel}</div>
                        </div>
                        <div style={{ background: C.surf, borderRadius: 12, padding: '12px 20px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Horário</div>
                            <div style={{ fontWeight: 800, color: C.text }}>{notifPrefs.send_time || '—'} (BSB)</div>
                        </div>
                        {notifPrefs.report_frequency === 'weekly' && notifPrefs.weekly_day && (
                            <div style={{ background: C.surf, borderRadius: 12, padding: '12px 20px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Dia</div>
                                <div style={{ fontWeight: 800, color: C.text }}>{days[notifPrefs.weekly_day - 1]}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ color: C.muted, fontSize: 14 }}>
                        Envio automático desativado.{' '}
                        <span style={{ color: C.primary, fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => { sessionStorage.setItem('client_activeTab', 'settings'); window.dispatchEvent(new Event('storage')); }}>
                            Configure em Configurações →
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};
