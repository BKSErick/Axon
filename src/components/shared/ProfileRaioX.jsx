import React from 'react';
import { Clock, Heart, MessageSquare, Bookmark, Eye, Instagram, Zap, Activity, Users, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { C } from '../../lib/clientTheme';

const HealthGauge = ({ score, level }) => {
    const config = {
        excellent: { color: '#10B981', label: 'Excelente', emoji: '🟢' },
        good: { color: '#22D3EE', label: 'Bom', emoji: '🔵' },
        average: { color: '#F59E0B', label: 'Médio', emoji: '🟡' },
        low: { color: '#EF4444', label: 'Baixo', emoji: '🔴' },
    };
    const c = config[level] || config.low;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 160, height: 90, overflow: 'hidden' }}>
                {/* Background arc */}
                <div style={{
                    position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                    border: '12px solid rgba(255,255,255,0.05)',
                    borderBottomColor: 'transparent', borderRightColor: 'transparent',
                    transform: 'rotate(225deg)', top: 0
                }} />
                {/* Filled arc */}
                <div style={{
                    position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                    border: `12px solid ${c.color}`,
                    borderBottomColor: 'transparent', borderRightColor: 'transparent',
                    transform: `rotate(225deg)`,
                    top: 0, transition: 'all 1s ease',
                    filter: `drop-shadow(0 0 8px ${c.color}40)`
                }} />
                {/* Score number */}
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: c.color, letterSpacing: '-0.03em' }}>{score}</div>
                </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.emoji} {c.label}</div>
            <div style={{ fontSize: 10, color: C.dim, textAlign: 'center', maxWidth: 140 }}>Baseado na taxa de engajamento dos últimos 25 posts</div>
        </div>
    );
};

const OrganicCard = ({ label, value, sub, icon: Icon, color = C.primary }) => (
    <div style={{
        background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '18px 20px',
        border: `1px solid rgba(255,255,255,0.06)`, flex: 1, minWidth: 140
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ padding: 6, background: `${color}15`, borderRadius: 8, color }}>
                <Icon size={14} />
            </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
);

const TopPostCard = ({ post, rank }) => {
    const [hovered, setHovered] = React.useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                minWidth: 200, width: 200, height: 260, borderRadius: 14,
                overflow: 'hidden', position: 'relative', cursor: 'pointer',
                background: C.surf, border: `1px solid ${C.border}`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.5)' : 'none', flexShrink: 0
            }}
        >
            {post.mediaUrl ? (
                <img src={post.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1e2d, #151521)', color: C.dim }}>
                    <ImageIcon size={40} opacity={0.4} />
                </div>
            )}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%)', pointerEvents: 'none' }} />
            {rank === 1 && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 800, background: '#F59E0B', color: '#000', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>🏆 Melhor Post</div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {post.caption && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.caption}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 700 }}>
                    <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={12} /> {post.likes}</span>
                    <span style={{ color: '#22D3EE', display: 'flex', alignItems: 'center', gap: 3 }}><MessageSquare size={12} /> {post.comments}</span>
                    {post.saved > 0 && <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 3 }}><Bookmark size={12} /> {post.saved}</span>}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                    Engajamento: {post.engagementRate?.toFixed(1)}%
                </div>
            </div>
        </div>
    );
};

const PostingHeatmap = ({ heatmap, bestTimes }) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hours = [6, 9, 12, 15, 18, 21];
    const maxVal = Math.max(...heatmap.flat(), 1);

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(6, 1fr)', gap: 3, marginBottom: 16 }}>
                <div />
                {hours.map(h => (
                    <div key={h} style={{ fontSize: 9, fontWeight: 700, color: C.dim, textAlign: 'center' }}>{h}h</div>
                ))}
                {days.map((day, di) => (
                    <React.Fragment key={day}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: 'flex', alignItems: 'center' }}>{day}</div>
                        {hours.map(h => {
                            const val = heatmap[di]?.[h] || 0;
                            const intensity = val / maxVal;
                            return (
                                <div key={h} style={{
                                    width: '100%', height: 28, borderRadius: 6,
                                    background: intensity > 0
                                        ? `rgba(16, 185, 129, ${0.1 + intensity * 0.7})`
                                        : 'rgba(255,255,255,0.02)',
                                    border: `1px solid rgba(255,255,255,${intensity > 0.5 ? 0.15 : 0.04})`,
                                    transition: 'all 0.3s ease'
                                }} title={`${day} ${h}h: score ${val}`} />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
            {bestTimes && bestTimes.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {bestTimes.slice(0, 3).map((t, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            background: 'rgba(16,185,129,0.1)', borderRadius: 8,
                            border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, fontWeight: 700, color: '#10B981'
                        }}>
                            <Clock size={12} /> {days[t.day]} às {t.hour}h
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ProfileRaioX = ({ data }) => {
    if (!data) return null;
    const { profile, engagement, health, topPosts, heatmap, bestTimes, postsAnalyzed } = data;

    const scrollRef = React.useRef(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(true);
    const checkScroll = React.useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollWidth > clientWidth + 5 && scrollLeft < scrollWidth - clientWidth - 5);
        }
    }, []);
    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        const t = setTimeout(checkScroll, 500);
        el.addEventListener('scroll', checkScroll);
        return () => { el.removeEventListener('scroll', checkScroll); clearTimeout(t); };
    }, [topPosts, checkScroll]);
    const scroll = (dir) => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <Instagram size={22} color="#E4405F" /> Raio-X do Perfil
                    </h2>
                    <p style={{ color: C.muted, fontSize: 13 }}>
                        Análise de engajamento orgânico baseada nos últimos {postsAnalyzed} posts
                        {profile.username && <span> · <strong>@{profile.username}</strong></span>}
                    </p>
                </div>
                {profile.profilePicture && (
                    <img src={profile.profilePicture} alt="" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(228,64,95,0.3)' }} />
                )}
            </div>

            {/* Score + Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
                <div style={{
                    background: C.card, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Score de Saúde</div>
                    <HealthGauge score={health.score} level={health.level} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    <OrganicCard label="Taxa de Engajamento" value={`${engagement.rate}%`} sub={engagement.rate >= 3 ? 'Acima da média!' : engagement.rate >= 1 ? 'Na média' : 'Abaixo da média'} icon={Activity} color="#E4405F" />
                    <OrganicCard label="Seguidores" value={profile.followers?.toLocaleString()} sub={`Ratio: ${profile.ffRatio}x (seg/seguindo)`} icon={Users} color="#22D3EE" />
                    <OrganicCard label="Alcance Médio" value={engagement.avgReach?.toLocaleString()} sub="pessoas/post" icon={Eye} color="#10B981" />
                    <OrganicCard label="Média de Curtidas" value={engagement.avgLikes?.toLocaleString()} sub={`${engagement.avgComments} comentários/post`} icon={Heart} color="#EF4444" />
                </div>
            </div>

            {/* Top Posts Carousel */}
            {topPosts && topPosts.length > 0 && (
                <div style={{ background: C.card, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🏆 Top Posts por Engajamento</h3>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>Posts que geraram mais interações em relação ao alcance</p>
                    <div style={{ position: 'relative' }}>
                        {canScrollLeft && (
                            <button onClick={() => scroll('left')} style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                                <ChevronRight size={20} color="#fff" style={{ transform: 'rotate(180deg)' }} />
                            </button>
                        )}
                        <div ref={scrollRef} className="netflix-scroll" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '4px 0 10px', scrollBehavior: 'smooth' }}>
                            {topPosts.map((post, idx) => (
                                <TopPostCard key={post.id} post={post} rank={idx + 1} />
                            ))}
                        </div>
                        {canScrollRight && (
                            <button onClick={() => scroll('right')} style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                                <ChevronRight size={20} color="#fff" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Best Times + Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: C.card, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={16} color="#10B981" /> Melhores Horários
                    </h3>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>Quando seus posts geram mais resultado</p>
                    <PostingHeatmap heatmap={heatmap} bestTimes={bestTimes} />
                </div>

                <div style={{ background: C.card, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} color="#F59E0B" /> Resumo Orgânico
                    </h3>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>Números consolidados dos últimos posts</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { label: 'Total de Curtidas', value: engagement.totalLikes?.toLocaleString(), icon: '❤️' },
                            { label: 'Total de Comentários', value: engagement.totalComments?.toLocaleString(), icon: '💬' },
                            { label: 'Total de Salvamentos', value: engagement.totalSaved?.toLocaleString(), icon: '🔖' },
                            { label: 'Alcance Total', value: engagement.totalReach?.toLocaleString(), icon: '👁️' },
                            { label: 'Impressões', value: engagement.totalImpressions?.toLocaleString(), icon: '📊' },
                            { label: 'Posts na Conta', value: profile.totalPosts?.toLocaleString(), icon: '📸' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13, fontWeight: 600 }}>
                                    <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
                                </div>
                                <div style={{ color: C.text, fontSize: 16, fontWeight: 800 }}>{item.value || 0}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
