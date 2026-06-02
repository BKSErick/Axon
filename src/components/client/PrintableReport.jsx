import React from 'react';
import { C } from '../../lib/clientTheme';
import { Activity, Target, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { fmtBRL, fmtN } from '../../data/db';
import { GLOBAL_TICKET_MEDIO } from '../../lib/metricsAggregator';

export const PrintableReport = ({ user, realClient, kpis, campaigns, perf, adAccounts }) => {
    // Definir as cores para impressão (fundo claro/branco para economizar tinta e ficar formal)
    const printTheme = {
        bg: '#ffffff',
        text: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
        primary: '#0ea5e9',
        card: '#F9FAFB'
    };

    const sortedByLucro = campaigns ? [...campaigns].sort((a, b) => (b.ssot?.profit || 0) - (a.ssot?.profit || 0)) : [];
    const topCampaigns = sortedByLucro.slice(0, 3);

    return (
        <div id="pdf-report-template" style={{
            width: '794px',  // A4 width
            minHeight: '1123px', // A4 height
            background: printTheme.bg,
            color: printTheme.text,
            fontFamily: "'Inter', sans-serif",
            padding: '40px 50px',
            position: 'absolute',
            left: '-9999px',
            top: 0,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
        }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${printTheme.border}`, paddingBottom: 20, marginBottom: 30 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Logo da Agência */}
                    <img src="/logo_backstage.png" alt="Backstage Grow" style={{ height: 46, objectFit: 'contain', objectPosition: 'left' }} />
                    <div style={{ color: printTheme.muted, fontSize: 13, fontWeight: 500 }}>Relatório de Performance Executiva</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name || realClient?.name || 'Cliente'}</div>
                    <div style={{ fontSize: 13, color: printTheme.muted }}>Conta: {realClient?.ad_accounts?.[0]?.meta_id || 'Não vinculada'}</div>
                    <div style={{ fontSize: 13, color: printTheme.muted, marginTop: 4 }}>Gerado em: {new Date().toLocaleDateString('pt-BR')}</div>
                </div>
            </div>

            {/* RESUMO EXECUTIVO (KPIS) */}
            <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 15, borderBottom: `1px solid ${printTheme.border}`, paddingBottom: 8 }}>Resumo Executivo (30 Dias)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
                    <div style={{ background: printTheme.card, padding: 16, borderRadius: 12, border: `1px solid ${printTheme.border}` }}>
                        <div style={{ fontSize: 12, color: printTheme.muted, fontWeight: 600, textTransform: 'uppercase' }}>Investimento</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: printTheme.text, margin: '4px 0' }}>{fmtBRL(kpis?.raw?.spend || 0)}</div>
                    </div>

                    <div style={{ background: printTheme.card, padding: 16, borderRadius: 12, border: `1px solid ${printTheme.border}` }}>
                        <div style={{ fontSize: 12, color: printTheme.primary, fontWeight: 600, textTransform: 'uppercase' }}>Oportunidades</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: printTheme.text, margin: '4px 0' }}>{fmtN(kpis?.raw?.leads || 0)}</div>
                        <div style={{ fontSize: 11, color: printTheme.muted }}>CPA: {fmtBRL(kpis?.cpa || 0)}</div>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>Vendas Estimadas</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#065F46', margin: '4px 0' }}>{fmtN(kpis?.sales || 0)}</div>
                        <div style={{ fontSize: 11, color: '#059669' }}>Ticket: {fmtBRL(GLOBAL_TICKET_MEDIO)}</div>
                    </div>

                    <div style={{ background: kpis?.roi > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12 }}>
                        <div style={{ fontSize: 12, color: kpis?.roi > 0 ? '#059669' : '#B91C1C', fontWeight: 600, textTransform: 'uppercase' }}>Lucro Bruto ROAS</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: kpis?.roi > 0 ? '#065F46' : '#991B1B', margin: '4px 0' }}>{fmtBRL(kpis?.profit || 0)}</div>
                        <div style={{ fontSize: 11, color: kpis?.roi > 0 ? '#059669' : '#B91C1C' }}>ROI: {kpis?.roi || 0}%</div>
                    </div>
                </div>
            </div>

            {/* GRÁFICO - MOTOR DE AQUISIÇÃO */}
            <div style={{ marginBottom: 30, background: printTheme.card, padding: 24, borderRadius: 12, border: `1px solid ${printTheme.border}` }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 15 }}>Motor de Aquisição (Gráfico de Funil)</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: '100%', background: '#F3F4F6', padding: '12px 16px', borderRadius: 8, borderLeft: `4px solid ${printTheme.muted}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, color: printTheme.muted, fontWeight: 600, textTransform: 'uppercase' }}>Investimento em Tráfego</div>
                                <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtBRL(kpis?.raw?.spend || 0)}</div>
                            </div>
                            <Activity size={20} color={printTheme.muted} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: '5%' }}>
                        <div style={{ width: '95%', background: '#E0F2FE', padding: '12px 16px', borderRadius: 8, borderLeft: `4px solid ${printTheme.primary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, color: printTheme.primary, fontWeight: 600, textTransform: 'uppercase' }}>Oportunidades (Leads)</div>
                                <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtN(kpis?.raw?.leads || 0)} contatos</div>
                            </div>
                            <span style={{ color: printTheme.primary, fontWeight: 700, fontSize: 13 }}>CPA: {fmtBRL(kpis?.cpa || 0)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: '10%' }}>
                        <div style={{ width: '90%', background: '#D1FAE5', padding: '12px 16px', borderRadius: 8, borderLeft: '4px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>Vendas Estimadas</div>
                                <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtN(kpis?.sales || 0)} clientes</div>
                            </div>
                            <span style={{ color: '#059669', fontWeight: 700, fontSize: 13 }}>Ticket: {fmtBRL(GLOBAL_TICKET_MEDIO)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CAMPANHAS DE DESTAQUE */}
            <div style={{ marginBottom: 30, flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 15, borderBottom: `1px solid ${printTheme.border}`, paddingBottom: 8 }}>Detalhamento das Principais Campanhas</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: printTheme.card, borderBottom: `2px solid ${printTheme.border}`, textAlign: 'left' }}>
                            <th style={{ padding: '12px', color: printTheme.muted, fontWeight: 600 }}>CAMPANHA</th>
                            <th style={{ padding: '12px', color: printTheme.muted, fontWeight: 600 }}>INVESTIDO</th>
                            <th style={{ padding: '12px', color: printTheme.muted, fontWeight: 600 }}>LEADS</th>
                            <th style={{ padding: '12px', color: printTheme.muted, fontWeight: 600 }}>CPA</th>
                            <th style={{ padding: '12px', color: printTheme.muted, fontWeight: 600 }}>LUCRO/SSOT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topCampaigns.map((c, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${printTheme.border}` }}>
                                <td style={{ padding: '12px', fontWeight: 600 }}>{c.name}</td>
                                <td style={{ padding: '12px' }}>{fmtBRL(c.spend)}</td>
                                <td style={{ padding: '12px' }}>{fmtN(c.leads)}</td>
                                <td style={{ padding: '12px' }}>{fmtBRL(c.ssot?.cpa || (c.spend / (c.leads || 1)))}</td>
                                <td style={{ padding: '12px', fontWeight: 700, color: c.ssot?.profit > 0 ? '#059669' : '#B91C1C' }}>
                                    {fmtBRL(c.ssot?.profit || 0)}
                                </td>
                            </tr>
                        ))}
                        {topCampaigns.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: printTheme.muted }}>Nenhuma campanha ativa no momento.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* AÇÕES DA AGÊNCIA (TIMELINE) */}
            <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 15, borderBottom: `1px solid ${printTheme.border}`, paddingBottom: 8 }}>Observações da Equipe (Mesa de Operações)</h2>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: printTheme.muted }}>
                    - <strong>Abertura de Opcional Lookalike 1%:</strong> Expansão de público para capturar tráfego morno.<br />
                    - <strong>Pausa no Criativo de Vídeo 03:</strong> Identificamos redução de CTR; pausado preventivamente.<br />
                    - <strong>Refino de Segmentação Geográfica:</strong> Exclusão de bairros com baixa taxa de conversão no CRM.
                </p>
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: 'auto', borderTop: `1px solid ${printTheme.border}`, paddingTop: 20, textAlign: 'center', color: printTheme.muted, fontSize: 11 }}>
                <p>Relatório confidencial gerado automaticamente pela plataforma SSOT para {user?.name || 'Cliente'}.</p>
                <p>© {new Date().getFullYear()} {user?.agency || 'Sua Agência'} - Todos os direitos reservados.</p>
            </div>

        </div>
    );
};
