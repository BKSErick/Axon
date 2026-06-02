import React from 'react';
import { C } from '../../lib/clientTheme';
import { useEngagementAnalytics } from '../../lib/hooks/useClientData';
import { fmtN } from '../../data/db';
import {
    Users, Heart, Eye, Bookmark, MessageCircle,
    TrendingUp, Zap, Activity, Instagram, ExternalLink,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const HEALTH = {
    excellent: { color: '#00FF94', label: 'Excelente', icon: '🟢' },
    good:      { color: '#00E0FF', label: 'Bom',       icon: '🔵' },
    average:   { color: '#FFB020', label: 'Regular',   icon: '🟡' },
    low:       { color: '#FF4545', label: 'Baixo',     icon: '🔴' },
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, accent = C.primary, loading }) => (
    <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', overflow: 'hidden',
    }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: `${accent}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
            }}>
                <Icon size={15} />
            </div>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 500, lineHeight: 1.2 }}>{label}</span>
        </div>
        {loading ? (
            <div style={{ height: 28, borderRadius: 6, background: C.border, opacity: 0.5 }} />
        ) : (
            <div style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {value}
            </div>
        )}
        {sub && <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.3 }}>{sub}</div>}
    </div>
);

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, rank }) => {
    const TYPE_ICON = { IMAGE: '📷', VIDEO: '🎬', CAROUSEL_ALBUM: '🎠' };
    const erColor = post.engagementRate >= 3 ? '#00FF94' : post.engagementRate >= 1 ? '#00E0FF' : '#FFB020';

    return (
        <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: 'hidden',
            transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer',
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = erColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{
                aspectRatio: '1/1',
                background: post.mediaUrl
                    ? `url(${post.mediaUrl}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                position: 'relative',
            }}>
                <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: rank <= 3 ? C.primary : 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    padding: '2px 7px', borderRadius: 20,
                    fontSize: 10, fontWeight: 900,
                    color: rank <= 3 ? '#000' : C.muted,
                }}>#{rank}</div>
                <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    padding: '2px 7px', borderRadius: 20,
                    fontSize: 10, fontWeight: 800, color: erColor,
                    border: `1px solid ${erColor}50`,
                }}>{post.engagementRate?.toFixed(1)}%</div>
                <div style={{
                    position: 'absolute', bottom: 8, left: 8,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                    padding: '2px 6px', borderRadius: 6, fontSize: 11,
                }}>{TYPE_ICON[post.mediaType] || '📷'}</div>
                {post.permalink && (
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute', bottom: 8, right: 8,
                            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                            width: 26, height: 26, borderRadius: 6,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.muted, textDecoration: 'none', transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = C.muted}
                    >
                        <ExternalLink size={13} />
                    </a>
                )}
            </div>
            <div style={{
                padding: '10px 12px', display: 'flex',
                justifyContent: 'space-between', borderTop: `1px solid ${C.border}`,
            }}>
                {[
                    { icon: <Heart size={11} />,        value: fmtN(post.likes),    color: '#FF4B77' },
                    { icon: <MessageCircle size={11} />, value: fmtN(post.comments), color: '#00E0FF' },
                    { icon: <Eye size={11} />,           value: fmtN(post.reach),    color: '#00FF94' },
                    { icon: <Bookmark size={11} />,      value: fmtN(post.saved),    color: '#FFB020' },
                ].map((s, i) => (
                    <span key={i} style={{ fontSize: 11, color: C.dim, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ color: s.color }}>{s.icon}</span>{s.value}
                    </span>
                ))}
            </div>
        </div>
    );
};

// ── Custom Tooltip for BarChart ───────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#1a2235', border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
        }}>
            <div style={{ color: C.muted, marginBottom: 6 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ color: p.fill, fontWeight: 700 }}>
                    {p.name}: {fmtN(p.value)}
                </div>
            ))}
        </div>
    );
};

// ── Heatmap — best posting times ─────────────────────────────────────────────
const PostingHeatmap = ({ heatmap }) => {
    if (!heatmap) return null;

    // Flatten to find max score for color scaling
    const allScores = heatmap.flatMap(row => row);
    const maxScore = Math.max(...allScores, 1);

    // Show only hours 6-23 to reduce width
    const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)`, gap: 3, minWidth: 500 }}>
                {/* Header row */}
                <div />
                {HOURS.map(h => (
                    <div key={h} style={{ fontSize: 9, color: C.dim, textAlign: 'center', paddingBottom: 4 }}>
                        {h}h
                    </div>
                ))}
                {/* Day rows */}
                {DAYS.map((day, d) => (
                    <React.Fragment key={day}>
                        <div style={{ fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', paddingRight: 4 }}>
                            {day}
                        </div>
                        {HOURS.map(h => {
                            const score = heatmap[d][h];
                            const intensity = score / maxScore;
                            const bg = score === 0
                                ? C.border
                                : `rgba(0, 255, 148, ${0.1 + intensity * 0.9})`;
                            return (
                                <div
                                    key={h}
                                    title={score > 0 ? `${day} ${h}h — Score ${score}` : undefined}
                                    style={{
                                        height: 18, borderRadius: 3,
                                        background: bg,
                                        transition: 'transform 0.1s',
                                        cursor: score > 0 ? 'pointer' : 'default',
                                    }}
                                    onMouseEnter={e => { if (score > 0) e.currentTarget.style.transform = 'scale(1.3)'; }}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: C.dim }}>Menos</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                    <div key={v} style={{
                        width: 12, height: 12, borderRadius: 2,
                        background: `rgba(0, 255, 148, ${v})`,
                    }} />
                ))}
                <span style={{ fontSize: 10, color: C.dim }}>Mais</span>
            </div>
        </div>
    );
};

// ── Main View ─────────────────────────────────────────────────────────────────
export const SocialMediaView = ({ user }) => {
    const { data: analytics, loading } = useEngagementAnalytics(user?.id);

    const p  = analytics?.profile;
    const e  = analytics?.engagement;
    const h  = analytics?.health;
    const hc = HEALTH[h?.level] || HEALTH.low;

    const noConnection = !loading && !analytics;

    const kpis = [
        {
            icon: Users,    label: 'Seguidores',
            value: p ? fmtN(p.followers) : '—',
            sub: p?.pageFans ? `${fmtN(p.pageFans)} fãs no Facebook` : 'Instagram',
            accent: '#00E0FF',
        },
        {
            icon: Activity, label: 'Taxa de Engajamento',
            value: e ? `${e.rate}%` : '—',
            sub: e ? (e.rate >= 3 ? '✅ Acima da média' : e.rate >= 1 ? '📊 Na média do setor' : '⚠️ Abaixo da média') : undefined,
            accent: e?.rate >= 3 ? '#00FF94' : e?.rate >= 1 ? '#00E0FF' : '#FFB020',
        },
        {
            icon: Eye,      label: 'Alcance Médio / Post',
            value: e ? fmtN(e.avgReach) : '—',
            sub: e ? `Total: ${fmtN(e.totalReach)}` : undefined,
            accent: '#00FF94',
        },
        {
            icon: TrendingUp, label: 'Impressões Totais',
            value: e ? fmtN(e.totalImpressions) : '—',
            sub: `${analytics?.postsAnalyzed ?? 0} posts analisados`,
            accent: '#A78BFA',
        },
        {
            icon: Heart,    label: 'Curtidas Totais',
            value: e ? fmtN(e.totalLikes) : '—',
            sub: e ? `Média ${fmtN(e.avgLikes)}/post` : undefined,
            accent: '#FF4B77',
        },
        {
            icon: MessageCircle, label: 'Comentários Totais',
            value: e ? fmtN(e.totalComments) : '—',
            sub: e ? `Média ${fmtN(e.avgComments)}/post` : undefined,
            accent: '#00E0FF',
        },
        {
            icon: Bookmark, label: 'Salvamentos',
            value: e ? fmtN(e.totalSaved) : '—',
            sub: 'Indica intenção de revisita',
            accent: '#FFB020',
        },
        {
            icon: Zap,      label: 'Health Score',
            value: h ? `${h.score}/100` : '—',
            sub: h ? `${hc.icon} ${hc.label}` : undefined,
            accent: hc.color,
        },
    ];

    // Chart data: top posts ER bar chart
    const barData = (analytics?.topPosts || []).map((p, i) => ({
        name: `#${i + 1}`,
        Curtidas: p.likes,
        Comentários: p.comments,
        Alcance: p.reach,
        er: p.engagementRate,
    }));

    // Pie chart: engagement mix
    const pieData = e ? [
        { name: 'Curtidas',    value: e.totalLikes,    fill: '#FF4B77' },
        { name: 'Comentários', value: e.totalComments, fill: '#00E0FF' },
        { name: 'Salvamentos', value: e.totalSaved,    fill: '#FFB020' },
    ].filter(d => d.value > 0) : [];

    return (
        <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 28 }} className="fadeup">

            {/* No connection */}
            {noConnection && (
                <div style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 20, padding: 48,
                    textAlign: 'center', maxWidth: 520, margin: '0 auto',
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'rgba(0,224,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', color: '#00E0FF',
                    }}>
                        <Instagram size={32} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>
                        Conta não conectada
                    </h2>
                    <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>
                        Para visualizar métricas orgânicas do Instagram e Facebook, conecte suas contas via OAuth nas{' '}
                        <strong style={{ color: C.text }}>Configurações</strong>.
                    </p>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 16, padding: '20px 22px', height: 100,
                            opacity: 0.5,
                        }} />
                    ))}
                </div>
            )}

            {analytics && (
                <>
                    {/* Profile Header */}
                    {p && (
                        <div style={{
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 16, padding: '18px 28px',
                            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
                        }}>
                            {p.profilePicture ? (
                                <img src={p.profilePicture} alt={p.username} style={{
                                    width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
                                    flexShrink: 0, border: `2px solid ${C.primary}`,
                                }} />
                            ) : (
                                <div style={{
                                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                                    background: C.gradientPrimary,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, fontWeight: 900, color: '#000',
                                }}>
                                    {(p.username?.[0] || p.pageName?.[0] || 'I').toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                                    @{p.username || p.pageName}
                                </div>
                                {p.bio && (
                                    <div style={{
                                        fontSize: 12, color: C.muted, marginTop: 3,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {p.bio.substring(0, 90)}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 28, flexShrink: 0 }}>
                                {[
                                    { label: 'Seguidores', value: fmtN(p.followers) },
                                    { label: 'Seguindo',   value: fmtN(p.following) },
                                    { label: 'Posts',      value: fmtN(p.totalPosts) },
                                    { label: 'Ratio F/F',  value: p.ffRatio },
                                ].map(stat => (
                                    <div key={stat.label} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{stat.value}</div>
                                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
                        {kpis.map(kpi => (
                            <KpiCard key={kpi.label} {...kpi} loading={false} />
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

                        {/* Bar chart — top posts performance */}
                        <div style={{
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 16, padding: '22px 24px',
                        }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                                📊 Performance dos Top Posts
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
                                Curtidas, comentários e alcance por post (top {barData.length})
                            </div>
                            {barData.length === 0 ? (
                                <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 32 }}>
                                    Nenhum post disponível.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={barData} barGap={2} barCategoryGap="25%">
                                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmtN(v)} />
                                        <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                        <Bar dataKey="Curtidas"    fill="#FF4B77" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Comentários" fill="#00E0FF" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Alcance"     fill="#00FF94" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Pie chart — engagement mix */}
                        <div style={{
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 16, padding: '22px 24px',
                        }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                                🥧 Mix de Engajamento
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                                Distribuição por tipo de interação
                            </div>
                            {pieData.length === 0 ? (
                                <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 32 }}>
                                    Sem dados de engajamento.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%" cy="45%"
                                            innerRadius={55} outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value, entry) => (
                                                <span style={{ color: C.muted, fontSize: 12 }}>
                                                    {value} — <strong style={{ color: C.text }}>{fmtN(entry.payload.value)}</strong>
                                                </span>
                                            )}
                                        />
                                        <Tooltip
                                            formatter={(v, name) => [fmtN(v), name]}
                                            contentStyle={{ background: '#1a2235', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Heatmap + Top Posts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                        {/* Posting Heatmap */}
                        <div style={{
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 16, padding: '22px 24px',
                        }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                                ⏰ Melhores Horários para Postar
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
                                Score de engajamento por dia e hora (6h–23h)
                            </div>
                            <PostingHeatmap heatmap={analytics.heatmap} />
                        </div>

                        {/* Top Posts Grid */}
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 14 }}>
                                🏆 Top Posts por Engajamento
                            </div>
                            {analytics.topPosts.length === 0 ? (
                                <div style={{
                                    background: C.card, border: `1px solid ${C.border}`,
                                    borderRadius: 14, padding: 32, textAlign: 'center', color: C.muted, fontSize: 13,
                                }}>
                                    Nenhum post disponível ainda.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {analytics.topPosts.map((post, i) => (
                                        <PostCard key={post.id} post={post} rank={i + 1} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
