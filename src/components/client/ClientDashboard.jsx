import React from 'react';
import ReactDOM from 'react-dom';
import { C } from '../../lib/clientTheme';
import { useKpis, usePerformance, useCampaigns, useAds, useEngagementAnalytics } from '../../lib/hooks/useClientData';
import { ClientSettings } from './ClientSettings';
import { PrintableReport } from './PrintableReport';
import { MetaAIChat } from './MetaAIChat';
import { LeadsCenter } from './LeadsCenter';
import { ClientSocialApproval } from './ClientSocialApproval';
import { SocialMediaView } from './SocialMediaView';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Activity, Zap, CheckCircle2, AlertTriangle, Briefcase, ChevronRight, Layout, Image as ImageIcon, MessageSquare, ChevronDown, Sparkles, Link2, Heart, Eye, Bookmark, Clock, Instagram } from 'lucide-react';
import { GLOBAL_TICKET_MEDIO, GLOBAL_CONV_RATE } from '../../lib/metricsAggregator';
import { CreditAlert } from './CreditAlert';
import { fmtBRL, fmtN } from '../../data/db';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ConnectFacebookButton } from '../admin/ConnectFacebookButton';
import { ProfileRaioX } from '../shared/ProfileRaioX';

import { Avatar, Badge, Btn, Stat } from '../Common';
import { CampaignsView } from './CampaignsView';
import { ReportsView } from './ReportsView';
import { SuporteWhatsApp } from './SuporteWhatsApp';

const BadgeScore = ({ score }) => {
    const config = {
        excellent: { color: 'var(--green)', label: 'Excelente' },
        optimizing: { color: 'var(--amber)', label: 'Otimizando' },
        attention: { color: 'var(--red)', label: 'Atenção' },
        neutral: { color: 'var(--text-muted)', label: 'Aguardando Dados' }
    };
    const c = config[score] || config.neutral;
    return (
        <Badge color={c.color} variant="tonal" size="md" style={{ fontWeight: 800 }}>
            {score === 'excellent' && '🟢 '}
            {score === 'optimizing' && '🟡 '}
            {score === 'attention' && '🔴 '}
            {score === 'neutral' && '⚪ '}
            {c.label}
        </Badge>
    );
};

// Bloco: Análise do Especialista (Intelligent Insights)
const ExpertInsights = ({ m }) => {
    const spend = m.raw?.spend || 0;
    const leads = m.extended?.messagingLeads || m.extended?.totalLeads || m.raw?.leads || 0;
    const cpa = leads > 0 ? (spend / leads) : 0;
    const score = m.score || 'neutral';

    if (spend === 0) return null;

    let text = `Nas últimas semanas, investimos **${fmtBRL(spend)}** em campanhas ativas, gerando **${leads}** interações diretas (Leads/Mensagens). `;

    if (score === 'excellent') {
        text += `O custo por aquisição foi de **${fmtBRL(cpa)}**, o que indica uma performance **excelente** e altamente lucrativa para a marca. O tráfego está bem segmentado e os criativos estão convertendo acima da média. `;
    } else if (score === 'optimizing') {
        text += `O custo por aquisição (CPA) está em **${fmtBRL(cpa)}**. O volume está bom, mas identificamos oportunidades de otimizar os criativos para baratear este custo nas próximas semanas. `;
    } else if (score === 'attention') {
        text += `O custo por aquisição (CPA) de **${fmtBRL(cpa)}** está acima do ideal. Estamos realocando a verba para públicos mais engajados e pausando os anúncios que não trouxeram retorno imediato. `;
    } else {
        text += `O CPA atual é de **${fmtBRL(cpa)}**. Nossa equipe continua acompanhando e maturando os dados para as próximas decisões. `;
    }

    if (m.extended && m.extended.impressions > 0) {
        const ctr = m.extended.clicks > 0 ? ((m.extended.clicks / m.extended.impressions) * 100).toFixed(2) : 0;
        text += `Além disso, a marca alcançou **${m.extended.reach?.toLocaleString()} pessoas** na região, com os anúncios aparecendo na tela **${m.extended.impressions?.toLocaleString()} vezes**. A taxa de clique (CTR) está em **${ctr}%**. `;

        if (ctr > 1.5) text += `Isso confirma que a comunicação visual está chamando **muita atenção** do público alvo.`;
        else text += `Nosso próximo passo será focar em criativos novos para aumentar o volume de cliques e baratear a atenção.`;
    }

    return (
        <div style={{
            background: 'linear-gradient(145deg, rgba(16,185,129,0.08), rgba(0,0,0,0))',
            borderRadius: 20,
            padding: 32,
            border: `1px solid rgba(16,185,129,0.2)`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: 20, opacity: 0.1 }}>
                <Sparkles size={80} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#10B981' }}>Análise do Especialista</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Leitura de performance e próximos passos</p>
                </div>
            </div>

            <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
                {text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#fff', fontWeight: 900 }}>{part}</strong> : part)}
            </p>
        </div>
    );
};

// Bloco: Demográficos (Idade e Gênero)
const DemographicsPanel = ({ demographics }) => {
    if (!demographics || (!demographics.age?.length && !demographics.gender?.length)) return null;

    const COLORS = ['#00DF81', '#22D3EE', '#F59E0B', '#FF4D72', '#8B5CF6'];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Perfil por Idade</h3>
                <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Visão de quem interage com a marca.</p>
                <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={demographics.age} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="leads" nameKey="range">
                                {demographics.age.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: `1px solid #333`, borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Perfil por Gênero</h3>
                <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Distribuição demográfica das interações.</p>
                <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={demographics.gender} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="leads" nameKey="gender">
                                {demographics.gender.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: `1px solid #333`, borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Bloco de Cartões (KPI) focados em Bussiness
const BizCard = ({ title, value, subValue, subLabel, subtitle, icon: Icon, isPrimary = false }) => {
    const isPositive = subValue && String(subValue).includes('+');
    const isNegative = subValue && String(subValue).includes('-');
    return (
        <div
            className={`${isPrimary ? 'card-elite' : 'card'} card-hover`}
            style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'relative', overflow: 'hidden' }}
        >
            {/* Linha de acento no topo — só no card primário */}
            {isPrimary && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', borderRadius: '2px 2px 0 0' }} />
            )}

            {/* HEADER: Label + Ícone */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 'var(--fw-extrabold)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wider)',
                    color: isPrimary ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}>
                    {title}
                </span>
                <div style={{
                    width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-md)',
                    background: isPrimary ? 'var(--color-primary-dim)' : 'var(--color-surface-3)',
                    color: isPrimary ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    flexShrink: 0,
                    boxShadow: isPrimary ? '0 0 12px var(--color-primary-dim)' : 'none',
                }}>
                    <Icon size={16} />
                </div>
            </div>

            {/* VALOR PRINCIPAL */}
            <div>
                <div
                    className={isPrimary ? 'text-gradient' : ''}
                    style={{
                        fontSize: 'var(--text-3xl)',
                        fontWeight: 'var(--fw-black)',
                        color: 'var(--color-text)',
                        letterSpacing: 'var(--tracking-tighter)',
                        lineHeight: 'var(--leading-none)',
                        marginBottom: 'var(--space-2)',
                    }}
                >
                    {value}
                </div>

                {/* BADGE: Variação / subvalor */}
                {subValue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--fw-bold)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            color: isPositive ? 'var(--color-success)' : isNegative ? 'var(--color-danger)' : 'var(--color-text-muted)',
                            background: isPositive ? 'var(--color-success-dim)' : isNegative ? 'var(--color-danger-dim)' : 'var(--color-surface-3)',
                            border: `1px solid ${isPositive ? 'var(--color-success-border)' : isNegative ? 'var(--color-danger-border)' : 'transparent'}`,
                        }}>
                            {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : null}
                            {subValue}
                        </span>
                        {subLabel && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
                                {subLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* SUBTÍTULO */}
            {subtitle && (
                <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    lineHeight: 'var(--leading-relaxed)',
                    marginTop: 'auto',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--color-border-muted)',
                }}>
                    {subtitle}
                </div>
            )}
        </div>
    );
};

// Bloco Visual de Funil (Motor de Aquisição)
const FunnelFlow = ({ spend, leads, sales }) => {
    const cpa = leads > 0 ? (spend / leads).toFixed(2) : '0.00';

    return (
        <div className="card" style={{ padding: 32, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>Motor de Aquisição</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Fluxo de conversão do capital investido.</p>
                </div>
                <div className="neon-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* TOPO: Investimento */}
                <div style={{ background: 'var(--surf)', borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'var(--text-muted)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Investimento Bruto</div>
                            <div style={{ fontSize: 24, fontWeight: 950, color: 'var(--text)' }}>{fmtBRL(spend)}</div>
                        </div>
                        <DollarSign size={24} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    </div>
                </div>

                {/* MEIO: Leads */}
                <div style={{ marginLeft: '6%', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(16, 185, 129, 0.2)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'var(--primary)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Oportunidades Únicas</div>
                            <div style={{ fontSize: 24, fontWeight: 950, color: 'var(--text)' }}>{fmtN(leads)} <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>contatos</span></div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary)' }}>CPA {fmtBRL(cpa)}</div>
                        </div>
                    </div>
                </div>

                {/* FUNDO: Vendas */}
                <div style={{ marginLeft: '12%', background: sales > 0 ? 'rgba(6, 182, 212, 0.08)' : 'var(--surf)', borderRadius: 16, padding: '20px 24px', border: sales > 0 ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid var(--border-muted)', opacity: sales > 0 ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 10, color: sales > 0 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Vendas Estimadas</div>
                            <div style={{ fontSize: 24, fontWeight: 950, color: 'var(--text)' }}>{sales > 0 ? `${fmtN(sales)} conversões` : 'Aguardando Maturação'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: sales > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>Ticket {fmtBRL(GLOBAL_TICKET_MEDIO)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Bloco 4: Inteligência (Melhor e Pior)
const IntelligencePanel = ({ campaigns }) => {
    if (!campaigns || campaigns.length === 0) return null;

    // Sort campaigns based on our new unified 'ssot' prop representing profit or leads
    const sortedByLucro = [...campaigns].sort((a, b) => (b.ssot?.profit || 0) - (a.ssot?.profit || 0));
    const hero = sortedByLucro[0];
    const villian = [...sortedByLucro].reverse().find(c => c.spend > 50) || sortedByLucro[sortedByLucro.length - 1];

    return (
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Inteligência de Escala</h3>
                <p style={{ color: C.muted, fontSize: 14 }}>Nossa auditoria cruzada indicando onde os holofotes estão.</p>
            </div>
            <div style={{ display: 'flex' }}>
                {/* HERO */}
                {hero && (
                    <div style={{ flex: 1, padding: 32, borderRight: `1px solid ${C.border}` }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12, marginBottom: 16 }}>
                            <TrendingUp size={16} /> CAMPANHA REVELAÇÃO
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{hero.name}</div>
                        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>Gerou o maior volume de lucro líquido na esteira atual.</div>

                        <div style={{ display: 'flex', gap: 24 }}>
                            <div><div style={{ fontSize: 11, color: C.dim, textTransform: 'uppercase', fontWeight: 700 }}>Lucro Estimado</div><div style={{ fontSize: 18, fontWeight: 800 }}>R$ {(hero.ssot?.profit || 0).toLocaleString()}</div></div>
                            <div><div style={{ fontSize: 11, color: C.dim, textTransform: 'uppercase', fontWeight: 700 }}>Oportunidades</div><div style={{ fontSize: 18, fontWeight: 800 }}>{hero.leads}</div></div>
                        </div>
                    </div>
                )}

                {/* VILLIAN (Atenção) */}
                {villian && villian.id !== hero.id && (
                    <div style={{ flex: 1, padding: 32 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12, marginBottom: 16 }}>
                            <AlertTriangle size={16} /> EM OTIMIZAÇÃO (ALERTA)
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{villian.name}</div>
                        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>Está com um custo por aquisição elevado. Ações formatadas pela equipe.</div>

                        <div style={{ display: 'flex', gap: 24 }}>
                            <div><div style={{ fontSize: 11, color: C.dim, textTransform: 'uppercase', fontWeight: 700 }}>Custo por Lead</div><div style={{ fontSize: 18, fontWeight: 800 }}>R$ {(villian.ssot?.cpa || 0).toLocaleString()}</div></div>
                            <div><div style={{ fontSize: 11, color: C.dim, textTransform: 'uppercase', fontWeight: 700 }}>Leads Fracos</div><div style={{ fontSize: 18, fontWeight: 800 }}>{villian.leads}</div></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Bloco 5: Ações do Enxame (Gestão de Agência / Transparência)
const AgencyTimeline = () => {
    const actions = [
        { date: 'Hoje, 10:30', title: 'Abertura de Opcional Lookalike 1%', desc: 'Expansão de público para capturar tráfego morno após saturação do público primário.', icon: Users, color: 'var(--primary)' },
        { date: 'Ontem, 16:45', title: 'Pausa no Criativo de Vídeo 03', desc: 'Identificamos que o CTR caiu abaixo de 0.8% consumindo verba inútil. Pausado preventivamente.', icon: AlertTriangle, color: 'var(--amber)' },
        { date: '2 dias atrás', title: 'Refino de Segmentação Geográfica', desc: 'Exclusão de bairros com taxa de conversão final (no CRM) menor que 2%.', icon: Target, color: 'var(--green)' }
    ];

    return (
        <div className="card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Mesa de Operações (Seu Time)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>Transparência total do que nossa equipe está ajustando nos bastidores da sua conta.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {actions.map((act, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                        <div style={{ marginTop: 2 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${act.color}15`, color: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <act.icon size={18} />
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {act.title}
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', background: 'var(--surf)', padding: '2px 8px', borderRadius: 4 }}>{act.date}</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{act.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};



export const ClientDashboard = ({ user, activeTab, onLogout }) => {
    const [creativePeriod, setCreativePeriod] = React.useState('last_30d');
    const [hasAccounts, setHasAccounts] = React.useState(null); // null = loading, true/false
    const [oauthConnected, setOauthConnected] = React.useState(false);

    const kpis = useKpis(user?.id);
    const campaigns = useCampaigns(user?.id, creativePeriod);
    const ads = useAds(user?.id, creativePeriod);
    const engagementAnalytics = useEngagementAnalytics(user?.id);

    // Check if client has any ad accounts or OAuth connections
    React.useEffect(() => {
        if (!user?.id) return;
        const check = async () => {
            try {
                // Check ad_accounts
                const accRes = await supabase.from('ad_accounts').select('id', { count: 'exact', head: true }).eq('client_id', user.id);
                const accCount = accRes.count || 0;
                setHasAccounts(accCount > 0);

                // Check OAuth connections (table may not exist)
                try {
                    const connRes = await supabase.from('client_meta_connections').select('id', { count: 'exact', head: true }).eq('client_id', user.id).eq('status', 'active');
                    setOauthConnected((connRes.count || 0) > 0);
                } catch (_) {
                    setOauthConnected(false);
                }
            } catch (e) {
                console.warn('Error checking accounts:', e);
                setHasAccounts(true); // fallback: assume connected to avoid blocking
                setOauthConnected(false);
            }
        };
        check();
    }, [user?.id]);

    if (kpis.loading || hasAccounts === null) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: '60vh', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 42, height: 42, border: `3px solid var(--border)`, borderTop: `3px solid var(--primary)`, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 24 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>Analisando Performance...</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8 }}>Sincronizando dados dos Pixels e APIs</div>
            </div>
        );
    }

    const m = kpis.data || null;
    const hasData = m && m.raw && m.raw.spend > 0;

    // --- ONBOARDING: Client has NO ad accounts AND NO OAuth connection ---
    if (!hasAccounts && !oauthConnected && activeTab === 'dashboard') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 40 }} className="fadeup">
                <div style={{
                    background: C.card, borderRadius: 24, border: `1px solid ${C.border}`,
                    padding: '56px 48px', textAlign: 'center', maxWidth: 560, width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    {/* Icon */}
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(24,119,242,0.15), rgba(16,185,129,0.1))',
                        width: 88, height: 88, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 28px',
                        border: '1px solid rgba(24,119,242,0.2)'
                    }}>
                        <Link2 size={40} color="#1877F2" />
                    </div>

                    <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 12, letterSpacing: '-0.02em' }}>
                        Conecte seu Facebook
                    </h2>
                    <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
                        Para visualizar seus relatórios e métricas, conecte sua conta do Facebook/Instagram.
                        Seus dados ficarão disponíveis automaticamente após a conexão.
                    </p>

                    {/* Facebook Connect Button */}
                    <ConnectFacebookButton clientId={user?.id} onConnected={() => {
                        setOauthConnected(true);
                        window.location.reload();
                    }} />

                    {/* Segurança note */}
                    <div style={{
                        marginTop: 28, background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${C.border}`, borderRadius: 14,
                        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                        justifyContent: 'center'
                    }}>
                        <CheckCircle2 size={16} color="#10B981" />
                        <span style={{ color: C.dim, fontSize: 12, fontWeight: 600 }}>
                            Conexão segura via Facebook Login — seus dados ficam protegidos
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasData && activeTab === 'dashboard') {
        return (
            <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 48, textAlign: "center", maxWidth: 600, margin: "40px auto" }}>
                <div style={{ background: "rgba(0, 255, 148, 0.1)", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: C.primary }}>
                    <Target size={40} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 12 }}>Conectando a Torre de Comando</h2>
                <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                    Seu gestor de performance está aquecendo os motores da sua conta dentro da Meta.
                    Assim que a primeira verba monetizar e os rastros financeiros se iniciarem, sua Mesa de Resultados aparecerá aqui.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim, fontWeight: 700 }}>
                    <Activity size={16} /> Monitoramento Estrito Ativado
                </div>
            </div>
        );
    }

    // TAB: CAMPANHAS
    if (activeTab === 'campaigns') {
        return (
            <CampaignsView
                campaigns={campaigns}
                creativePeriod={creativePeriod}
                setCreativePeriod={setCreativePeriod}
            />
        );
    }

    if (activeTab === 'settings') {
        return <ClientSettings user={user} onLogout={onLogout} />;
    }

    if (activeTab === 'leads') {
        return <LeadsCenter user={user} />;
    }

    if (activeTab === 'social_media') {
        return <SocialMediaView user={user} />;
    }

    if (activeTab === 'reports') {
        return <ReportsView user={user} kpis={kpis.data} campaigns={campaigns.data} />;
    }

    if (activeTab === 'support') {
        return <SuporteWhatsApp />;
    }

    // TABS NÃO MIGRADAS PRO OWNER VIEW
    if (activeTab !== 'dashboard') {
        return (
            <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
                <Briefcase size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <h3>Visão Gerencial (Em Andamento)</h3>
                <p>Retorne para o Dashboard para a visão primária executiva.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 40, paddingBottom: 60 }} className="fadeup">

            {/* HEADER ELITE SECTION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Live Performance</span>
                    </div>
                    <h1 className="text-gradient" style={{ fontSize: 42, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.04em' }}>Resumo Executivo</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: 15, fontWeight: 500 }}>Inteligência de tráfego e projeções financeiras para sua marca.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <CreditAlert clientId={user?.id} />
                    <div style={{ height: 48, width: 1, background: 'var(--border)' }} />
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.1em' }}>Score da Conta</div>
                        <BadgeScore score={m.score} />
                    </div>
                </div>
            </div>

            {/* BLOCO 1 E 2 MESCLADOS: OVERVIEW FINANCEIRO (KPI GRID) */}
            <div className="kpi-grid">
                <BizCard
                    title="Lucro Estimado"
                    value={fmtBRL(m.profit || 0)}
                    subValue={(() => {
                        const roi = m.roi || 0;
                        const profit = m.profit || 0;
                        if (profit < 0) return `-${Math.abs(roi)}%`;
                        return roi > 0 ? `+${roi}%` : '0%';
                    })()}
                    subLabel="ROI"
                    icon={DollarSign}
                    isPrimary={true}
                    subtitle={(() => {
                        const profit = m.profit || 0;
                        if (profit < 0) return 'O investimento ainda está em fase de maturação. Os leads gerados podem converter em vendas nos próximos dias.';
                        if (profit > 0) return 'Retorno positivo! O investimento está gerando lucro além do custo operacional.';
                        return null;
                    })()}
                />
                <BizCard
                    title="Oportunidades Geradas"
                    value={m.extended?.totalLeads ?? m.raw?.leads ?? 0}
                    subValue={m.sales > 0 ? `+${m.sales}` : null}
                    subLabel={m.sales > 0 ? `vendas projetadas` : null}
                    icon={MessageSquare}
                    subtitle={(() => {
                        const formL = m.extended?.leads || 0;
                        const msgL = m.extended?.messagingLeads || 0;
                        const breakdown = [];
                        if (formL > 0) breakdown.push(`${formL} formulários`);
                        if (msgL > 0) breakdown.push(`${msgL} mensagens`);
                        const parts = breakdown.length > 0 ? `(${breakdown.join(' + ')}) — ` : '';
                        return m.sales > 0
                            ? `${parts}Taxa de conversão de ${GLOBAL_CONV_RATE * 100}% do mercado`
                            : `${parts}Potencial de vendas cresce com o volume de leads.`;
                    })()}
                />
                <BizCard
                    title="Visualizações da Marca"
                    value={(m.extended?.impressions || 0).toLocaleString()}
                    subValue={`${(m.extended?.reach || 0).toLocaleString()}`}
                    subLabel="alcance único"
                    icon={Target}
                    subtitle="Volume total de vezes que sua marca apareceu para o público"
                />
                <BizCard
                    title="Custos da Operação"
                    value={fmtBRL(m.raw?.spend || 0)}
                    subValue={(() => {
                        const leads = m.extended?.totalLeads ?? m.raw?.leads ?? 0;
                        const spend = m.raw?.spend || 0;
                        const cpa = leads > 0 ? (spend / leads).toFixed(2) : '0.00';
                        return fmtBRL(Number(cpa));
                    })()}
                    subLabel="Investido por Lead"
                    icon={Activity}
                    subtitle="Eficiência financeira na conquista de novos interessados"
                />
            </div>

            {/* BLOCOS CENTRAIS (FUNIL E INTELIGÊNCIA) */}
            <div className="grid-2">
                <FunnelFlow spend={m.raw?.spend || 0} leads={m.extended?.totalLeads || m.raw?.leads || 0} sales={m.sales || 0} />
                <AgencyTimeline />
            </div>

            {/* SOCIAL MEDIA — APROVAÇÃO DE POSTS (apenas modo admin) */}
            {!!sessionStorage.getItem('admin_viewing_client') && (
                <ClientSocialApproval clientId={user?.id} />
            )}

            {/* DEMOGRÁFICO */}
            <DemographicsPanel demographics={m.demographics} />

            {/* RAIO-X DO PERFIL (ENGAGEMENT ANALYTICS) */}
            {!engagementAnalytics.loading && engagementAnalytics.data && (
                <ProfileRaioX data={engagementAnalytics.data} />
            )}

            {/* BLOCO INTELLIGENCE DE CAMPANHAS */}
            <IntelligencePanel campaigns={campaigns.data} />

            {/* ANÁLISE IA DO ESPECIALISTA */}
            <ExpertInsights m={m} />

            {/* RELATORIO PDF OCULTO */}
            <div style={{ position: 'absolute', top: -9999, left: -9999, zIndex: -1 }}>
                <PrintableReport user={user} kpis={m} campaigns={campaigns.data} />
            </div>

            <MetaAIChat clientId={user?.id} />
        </div>
    );
};

