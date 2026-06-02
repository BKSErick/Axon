import React, { useState, useEffect } from 'react';
import { C } from '../../lib/clientTheme';
import { supabase } from '../../lib/supabase';

const STATUS_MAP = {
    pending_approval: { label: 'Aguardando', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', icon: '⏳' },
    approved: { label: 'Aprovado', color: '#10B981', bg: 'rgba(16,185,129,.12)', icon: '✅' },
    scheduled: { label: 'Agendado', color: '#3B82F6', bg: 'rgba(59,130,246,.12)', icon: '📅' },
    published: { label: 'Publicado', color: '#10B981', bg: 'rgba(16,185,129,.2)', icon: '🟢' },
    rejected: { label: 'Recusado', color: '#EF4444', bg: 'rgba(239,68,68,.12)', icon: '❌' },
};

const PLATFORM_ICONS = { facebook: '📘', instagram: '📸' };
const TYPE_LABELS = { feed: '📷 Feed', carousel: '🎠 Carousel', stories: '📱 Story', reels: '🎬 Reels' };

// ---- Compact Thumbnail Preview ----
const PostThumbnail = ({ mediaUrls, postType = 'feed', slide, setSlide }) => {
    const total = mediaUrls?.length || 0;
    const firstMedia = mediaUrls?.[slide] || mediaUrls?.[0];
    const isVertical = postType === 'stories' || postType === 'reels';
    const multi = total > 1;

    return (
        <div style={{
            position: 'relative',
            width: isVertical ? 90 : 140,
            minWidth: isVertical ? 90 : 140,
            aspectRatio: isVertical ? '9/16' : '1/1',
            borderRadius: 12,
            overflow: 'hidden',
            background: firstMedia
                ? `url(${firstMedia}) center/cover no-repeat`
                : 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
            border: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
        }}>
            {/* Overlay gradient at bottom */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            }} />

            {/* Carousel dots */}
            {multi && (
                <div style={{
                    position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: 3,
                }}>
                    {mediaUrls.map((_, i) => (
                        <div key={i}
                            onClick={(e) => { e.stopPropagation(); setSlide(i); }}
                            style={{
                                width: slide === i ? 6 : 4, height: slide === i ? 6 : 4,
                                borderRadius: '50%', cursor: 'pointer',
                                background: slide === i ? '#0095F6' : 'rgba(255,255,255,.5)',
                                transition: 'all .2s',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Slide counter badge */}
            {multi && (
                <div style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.6)', borderRadius: 8,
                    padding: '2px 6px', fontSize: 9, fontWeight: 700,
                    color: '#fff', backdropFilter: 'blur(4px)',
                }}>
                    {slide + 1}/{total}
                </div>
            )}

            {/* Nav arrows for carousel */}
            {multi && slide > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setSlide(s => s - 1); }}
                    style={{
                        position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                        width: 20, height: 20, borderRadius: '50%', border: 'none',
                        background: 'rgba(0,0,0,0.5)', cursor: 'pointer', fontSize: 10,
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >‹</button>
            )}
            {multi && slide < total - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setSlide(s => s + 1); }}
                    style={{
                        position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                        width: 20, height: 20, borderRadius: '50%', border: 'none',
                        background: 'rgba(0,0,0,0.5)', cursor: 'pointer', fontSize: 10,
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >›</button>
            )}

            {/* Play icon for reels */}
            {postType === 'reels' && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid rgba(255,255,255,.6)',
                }}>
                    <span style={{ fontSize: 11, marginLeft: 1, color: '#fff' }}>▶</span>
                </div>
            )}

            {/* Story progress bar */}
            {postType === 'stories' && (
                <div style={{ position: 'absolute', top: 4, left: 4, right: 4, display: 'flex', gap: 2 }}>
                    {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= slide ? '#fff' : 'rgba(255,255,255,.3)' }} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ---- Expanded Preview Modal ----
const ExpandedPreview = ({ post, onClose }) => {
    const [slide, setSlide] = React.useState(0);
    const total = post.media_urls?.length || 0;
    const multi = total > 1;
    const isVertical = post.post_type === 'stories' || post.post_type === 'reels';

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeIn .2s ease',
            }}
        >
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: isVertical ? 340 : 520,
                    width: '90%',
                    background: 'rgba(18,18,22,0.98)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <span style={{ fontSize: 16 }}>{PLATFORM_ICONS[post.platform] || '📄'}</span>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, flex: 1 }}>
                        {post.platform === 'facebook' ? 'Facebook' : 'Instagram'} — {TYPE_LABELS[post.post_type] || post.post_type}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
                            width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >✕</button>
                </div>

                {/* Image */}
                {total > 0 && (
                    <div style={{
                        position: 'relative', width: '100%',
                        aspectRatio: isVertical ? '9/16' : '1/1',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            display: 'flex', width: `${total * 100}%`,
                            transform: `translateX(-${slide * (100 / total)}%)`,
                            transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
                            height: '100%',
                        }}>
                            {post.media_urls.map((url, i) => (
                                <div key={i} style={{
                                    width: `${100 / total}%`, height: '100%', flexShrink: 0,
                                    background: `url(${url}) center/cover no-repeat`,
                                }} />
                            ))}
                        </div>
                        {multi && slide > 0 && (
                            <button onClick={() => setSlide(s => s - 1)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>‹</button>
                        )}
                        {multi && slide < total - 1 && (
                            <button onClick={() => setSlide(s => s + 1)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>›</button>
                        )}
                        {multi && (
                            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                                {post.media_urls.map((_, i) => (
                                    <div key={i} onClick={() => setSlide(i)} style={{ width: slide === i ? 8 : 6, height: slide === i ? 8 : 6, borderRadius: '50%', cursor: 'pointer', background: slide === i ? '#0095F6' : 'rgba(255,255,255,.4)', transition: 'all .2s' }} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Caption */}
                {post.content_text && (
                    <div style={{ padding: '12px 16px', maxHeight: 120, overflowY: 'auto' }}>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {post.content_text}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * ClientSocialApproval — Card that appears on the client dashboard.
 * Shows pending posts for approval and recent publications.
 * Redesigned: compact cards with thumbnail + info side-by-side.
 */
export const ClientSocialApproval = ({ clientId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [expandedPost, setExpandedPost] = useState(null);
    const [slides, setSlides] = useState({});

    useEffect(() => {
        if (clientId) loadPosts();
    }, [clientId]);

    const loadPosts = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('social_posts')
            .select('*')
            .eq('client_id', clientId)
            .in('status', ['pending_approval', 'approved', 'scheduled', 'published', 'rejected'])
            .order('created_at', { ascending: false })
            .limit(10);
        setPosts(data || []);
        setLoading(false);
    };

    const approvePost = async (postId) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('social_posts').update({
            status: 'approved',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
        }).eq('id', postId);
        loadPosts();
    };

    const rejectPost = async (postId) => {
        await supabase.from('social_posts').update({
            status: 'rejected',
            rejection_reason: rejectReason || 'Sem motivo informado',
        }).eq('id', postId);
        setRejectingId(null);
        setRejectReason('');
        loadPosts();
    };

    const getSlide = (postId) => slides[postId] || 0;
    const setSlideFor = (postId) => (valOrFn) => {
        setSlides(prev => ({
            ...prev,
            [postId]: typeof valOrFn === 'function' ? valOrFn(prev[postId] || 0) : valOrFn,
        }));
    };

    const pendingPosts = posts.filter(p => p.status === 'pending_approval');
    const otherPosts = posts.filter(p => p.status !== 'pending_approval');

    if (loading) return null;
    if (posts.length === 0) return null;

    return (
        <>
            {expandedPost && (
                <ExpandedPreview post={expandedPost} onClose={() => setExpandedPost(null)} />
            )}

            <div style={{
                background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
                padding: 24, marginBottom: 24,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: 22 }}>📱</span>
                    <div>
                        <div style={{ color: C.text, fontSize: 16, fontWeight: 800 }}>Social Media</div>
                        <div style={{ color: C.muted, fontSize: 12 }}>
                            {pendingPosts.length > 0
                                ? `${pendingPosts.length} post${pendingPosts.length > 1 ? 's' : ''} aguardando sua aprovação`
                                : 'Seus posts recentes'
                            }
                        </div>
                    </div>
                    {pendingPosts.length > 0 && (
                        <span style={{
                            marginLeft: 'auto', background: 'rgba(245,158,11,.15)',
                            color: '#F59E0B', fontSize: 12, fontWeight: 800,
                            padding: '4px 12px', borderRadius: 999,
                        }}>
                            {pendingPosts.length} PENDENTE{pendingPosts.length > 1 ? 'S' : ''}
                        </span>
                    )}
                </div>

                {/* Pending posts — compact card with thumbnail */}
                {pendingPosts.map(post => (
                    <div key={post.id} style={{
                        background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.18)',
                        borderRadius: 16, padding: 14, marginBottom: 12,
                    }}>
                        <div style={{
                            display: 'flex', gap: 14, alignItems: 'flex-start',
                        }}>
                            {/* Thumbnail */}
                            {post.media_urls?.length > 0 && (
                                <div
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setExpandedPost(post)}
                                    title="Clique para ampliar"
                                >
                                    <PostThumbnail
                                        mediaUrls={post.media_urls}
                                        postType={post.post_type}
                                        slide={getSlide(post.id)}
                                        setSlide={setSlideFor(post.id)}
                                    />
                                </div>
                            )}

                            {/* Post info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Header row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 14 }}>{PLATFORM_ICONS[post.platform] || '📄'}</span>
                                    <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>
                                        {post.platform === 'facebook' ? 'Facebook' : 'Instagram'}
                                    </span>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                        textTransform: 'uppercase', letterSpacing: '0.04em',
                                    }}>
                                        {TYPE_LABELS[post.post_type] || post.post_type}
                                    </span>
                                    <span style={{
                                        background: 'rgba(245,158,11,.15)', color: '#F59E0B',
                                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                                    }}>
                                        ⏳ Aguardando
                                    </span>
                                </div>

                                {/* Caption preview */}
                                {post.content_text && (
                                    <div style={{
                                        color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5,
                                        marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        wordBreak: 'break-word',
                                    }}>
                                        {post.content_text}
                                    </div>
                                )}

                                {/* Media count info */}
                                {post.media_urls?.length > 1 && (
                                    <div style={{
                                        color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 10, fontWeight: 600,
                                    }}>
                                        🖼️ {post.media_urls.length} imagens • Clique na miniatura para ampliar
                                    </div>
                                )}

                                {/* Actions */}
                                {rejectingId === post.id ? (
                                    <div>
                                        <textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Motivo do ajuste (opcional)..."
                                            rows={2}
                                            style={{
                                                width: '100%', background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: 10, padding: '8px 12px', color: '#F9FAFB',
                                                fontSize: 12, fontFamily: 'inherit', marginBottom: 8, outline: 'none',
                                                resize: 'none',
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => { setRejectingId(null); setRejectReason(''); }} style={btnStyle('ghost')}>Cancelar</button>
                                            <button onClick={() => rejectPost(post.id)} style={btnStyle('red')}>Confirmar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => approvePost(post.id)}
                                            style={btnStyle('green')}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,.25)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,.12)'; }}
                                        >
                                            ✅ Aprovar
                                        </button>
                                        <button
                                            onClick={() => setRejectingId(post.id)}
                                            style={btnStyle('ghost')}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                        >
                                            ✏️ Pedir Ajuste
                                        </button>
                                        <button
                                            onClick={() => setExpandedPost(post)}
                                            style={btnStyle('ghost')}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                        >
                                            🔍 Ver Completo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Other posts — compact list */}
                {otherPosts.length > 0 && (
                    <div style={{ marginTop: pendingPosts.length > 0 ? 12 : 0 }}>
                        {pendingPosts.length > 0 && (
                            <div style={{ color: C.dim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>
                                Posts Recentes
                            </div>
                        )}
                        {otherPosts.slice(0, 5).map(post => {
                            const s = STATUS_MAP[post.status] || {};
                            return (
                                <div
                                    key={post.id}
                                    onClick={() => setExpandedPost(post)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 8px', borderBottom: `1px solid ${C.border}`,
                                        cursor: 'pointer', borderRadius: 8,
                                        transition: 'background .15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Mini thumbnail */}
                                    {post.media_urls?.[0] ? (
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                            background: `url(${post.media_urls[0]}) center/cover no-repeat`,
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }} />
                                    ) : (
                                        <span style={{ fontSize: 14, width: 36, textAlign: 'center' }}>{PLATFORM_ICONS[post.platform]}</span>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            color: C.text, fontSize: 12, fontWeight: 600,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {post.content_text?.substring(0, 60) || 'Sem legenda'}
                                        </div>
                                        <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>
                                            {TYPE_LABELS[post.post_type] || post.post_type}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '3px 10px',
                                        borderRadius: 999, background: s.bg, color: s.color,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {s.icon} {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

// Button styles helper
const btnStyle = (variant) => ({
    padding: '7px 14px',
    borderRadius: 10,
    border: variant === 'ghost' ? `1px solid rgba(255,255,255,0.1)` : 'none',
    background: variant === 'green' ? 'rgba(16,185,129,.12)'
        : variant === 'red' ? 'rgba(239,68,68,.12)'
            : variant === 'ghost' ? 'rgba(255,255,255,0.04)'
                : 'transparent',
    color: variant === 'green' ? '#10B981'
        : variant === 'red' ? '#EF4444'
            : variant === 'ghost' ? 'rgba(255,255,255,0.7)'
                : C.dim,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all .15s',
});
