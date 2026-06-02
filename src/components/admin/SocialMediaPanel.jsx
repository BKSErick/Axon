import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { ConnectFacebookButton } from './ConnectFacebookButton';
import { ConnectLinkedInButton } from './ConnectLinkedInButton';
import { C, fmtBRL, fmtN } from '../../data/db';
import { supabase } from '../../lib/supabase';
import { discoverSocialProfiles } from '../../lib/meta';
import { Btn, Modal, Field, Input, Select, Badge } from '../Common';
import {
    Send, Calendar, FileText, Users, Clock, Sparkles, Eye,
    CheckCircle, XCircle, Plus, RefreshCw, ChevronDown, Loader2,
    Image, MessageSquare, Instagram, Facebook, Edit3, Trash2, Filter,
    Bell, ChevronLeft, ChevronRight, LayoutGrid, Monitor, Link2, Activity
} from 'lucide-react';
import { ProfileRaioX } from '../shared/ProfileRaioX';
import { useEngagementAnalytics } from '../../lib/hooks/useClientData';

const NotionDashboard = lazy(() => import('./NotionDashboard'));

// ==========================================
// SOCIAL MEDIA PANEL — ADMIN MODULE
// ==========================================

const PLATFORMS = [
    { value: 'facebook', label: 'Facebook', icon: '📘', color: '#1877F2' },
    { value: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
];

const POST_TYPES = [
    { value: 'feed', label: 'Feed', icon: '🖼️' },
    { value: 'carousel', label: 'Carrossel', icon: '🎠' },
    { value: 'stories', label: 'Stories', icon: '📱' },
    { value: 'reels', label: 'Reels', icon: '🎬' },
];

const STATUS_MAP = {
    draft: { label: 'Rascunho', color: C.dim, bg: 'rgba(100,116,139,.12)' },
    pending_approval: { label: 'Aguardando Aprovação', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
    approved: { label: 'Aprovado', color: '#10B981', bg: 'rgba(16,185,129,.12)' },
    scheduled: { label: 'Agendado', color: '#3B82F6', bg: 'rgba(59,130,246,.12)' },
    publishing: { label: 'Publicando...', color: '#06B6D4', bg: 'rgba(6,182,212,.12)' },
    published: { label: 'Publicado', color: '#10B981', bg: 'rgba(16,185,129,.2)' },
    failed: { label: 'Falhou', color: '#EF4444', bg: 'rgba(239,68,68,.12)' },
    rejected: { label: 'Recusado', color: '#EF4444', bg: 'rgba(239,68,68,.12)' },
};

// ---- Instagram/Facebook Preview Mockup (Template per post type) ----
const SocialPreview = ({ platform, text, mediaUrls, clientName, clientAvatar, postType = 'feed' }) => {
    const isIG = platform === 'instagram';
    const avatarLetter = (clientName || 'C')[0].toUpperCase();
    const [slide, setSlide] = useState(0);
    const total = mediaUrls?.length || 0;
    const multi = total > 1;
    const firstMedia = mediaUrls?.[0];

    const avatarGradient = isIG
        ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
        : '#1877F2';

    const Avatar = () => (
        <div style={{
            width: 32, height: 32, borderRadius: '50%', background: avatarGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0, overflow: 'hidden'
        }}>
            {clientAvatar ? (
                <img src={clientAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                avatarLetter
            )}
        </div>
    );

    // ========== STORIES (9:16 vertical, progress bar, reply) ==========
    if (postType === 'stories') {
        return (
            <div style={{
                background: '#000', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #363636', maxWidth: 260, width: '100%',
                position: 'relative',
            }}>
                {/* Full bleed image */}
                <div style={{
                    width: '100%', aspectRatio: '9/16',
                    background: firstMedia ? `url(${firstMedia}) center/cover no-repeat` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    position: 'relative',
                }}>
                    {/* Progress bar */}
                    <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', gap: 3 }}>
                        {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
                            <div key={i} style={{
                                flex: 1, height: 2, borderRadius: 2,
                                background: i <= slide ? '#fff' : 'rgba(255,255,255,0.3)',
                            }} />
                        ))}
                    </div>
                    {/* Header overlay */}
                    <div style={{
                        position: 'absolute', top: 16, left: 10, right: 10,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Avatar />
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{clientName || 'Cliente'}</span>
                        <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 10 }}>2h</span>
                        <span style={{ marginLeft: 'auto', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</span>
                    </div>
                    {/* Caption overlay at bottom */}
                    {text && (
                        <div style={{
                            position: 'absolute', bottom: 50, left: 10, right: 10,
                            color: '#fff', fontSize: 11.5, lineHeight: 1.5,
                            textShadow: '0 1px 4px rgba(0,0,0,.7)',
                        }}>
                            {text.substring(0, 100)}{text.length > 100 ? '...' : ''}
                        </div>
                    )}
                    {/* Reply bar */}
                    <div style={{
                        position: 'absolute', bottom: 10, left: 10, right: 10,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <div style={{
                            flex: 1, padding: '8px 14px', borderRadius: 999,
                            border: '1px solid rgba(255,255,255,.4)', color: 'rgba(255,255,255,.5)',
                            fontSize: 12,
                        }}>Enviar mensagem</div>
                        <span style={{ fontSize: 18 }}>♡</span>
                        <span style={{ fontSize: 18 }}>✈️</span>
                    </div>
                    {/* Navigation areas */}
                    {multi && (
                        <>
                            <div onClick={() => setSlide(s => Math.max(0, s - 1))} style={{
                                position: 'absolute', left: 0, top: 0, width: '30%', height: '100%', cursor: 'pointer',
                            }} />
                            <div onClick={() => setSlide(s => Math.min(total - 1, s + 1))} style={{
                                position: 'absolute', right: 0, top: 0, width: '30%', height: '100%', cursor: 'pointer',
                            }} />
                        </>
                    )}
                </div>
                {/* Stories label */}
                <div style={{ textAlign: 'center', padding: '6px 0', background: '#111' }}>
                    <span style={{ color: '#8E8E8E', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>📱 Story Preview</span>
                </div>
            </div>
        );
    }

    // ========== REELS (9:16 vertical, play button, vertical action bar) ==========
    if (postType === 'reels') {
        return (
            <div style={{
                background: '#000', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #363636', maxWidth: 260, width: '100%',
                position: 'relative',
            }}>
                <div style={{
                    width: '100%', aspectRatio: '9/16',
                    background: firstMedia ? `url(${firstMedia}) center/cover no-repeat` : 'linear-gradient(135deg, #0d0d0d, #1a1a2e, #2a0845)',
                    position: 'relative',
                }}>
                    {/* Play button center */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid rgba(255,255,255,.7)',
                    }}>
                        <span style={{ fontSize: 22, marginLeft: 3 }}>▶</span>
                    </div>
                    {/* Vertical action bar (right side) */}
                    <div style={{
                        position: 'absolute', right: 10, bottom: 100,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 22, display: 'block' }}>♡</span>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>1.2K</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 22, display: 'block' }}>💬</span>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>84</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 22, display: 'block' }}>✈️</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 22, display: 'block' }}>⋯</span>
                        </div>
                        {/* Music disc */}
                        <div style={{
                            width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,.3)',
                            background: firstMedia ? `url(${firstMedia}) center/cover` : '#333',
                        }} />
                    </div>
                    {/* Bottom info */}
                    <div style={{
                        position: 'absolute', bottom: 12, left: 10, right: 50,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Avatar />
                            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{clientName || 'Cliente'}</span>
                        </div>
                        {text && (
                            <div style={{ color: '#fff', fontSize: 11, lineHeight: 1.4, textShadow: '0 1px 4px rgba(0,0,0,.7)' }}>
                                {text.substring(0, 80)}{text.length > 80 ? '...' : ''}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <span style={{ fontSize: 12 }}>🎵</span>
                            <span style={{ color: '#fff', fontSize: 10 }}>Áudio original · {clientName || 'Cliente'}</span>
                        </div>
                    </div>
                </div>
                {/* Reels label */}
                <div style={{ textAlign: 'center', padding: '6px 0', background: '#111' }}>
                    <span style={{ color: '#8E8E8E', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🎬 Reels Preview</span>
                </div>
            </div>
        );
    }

    // ========== FEED & CAROUSEL (1:1 square, with carousel extras) ==========
    const isCarousel = postType === 'carousel' && multi;

    return (
        <div style={{
            background: isIG ? '#000' : '#242526',
            borderRadius: 16, overflow: 'hidden',
            border: `1px solid ${isIG ? '#363636' : '#3E4042'}`,
            maxWidth: 380, width: '100%',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                <Avatar />
                <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{clientName || 'Cliente'}</div>
                    <div style={{ color: '#8E8E8E', fontSize: 10 }}>{isIG ? 'Instagram' : 'Facebook'}</div>
                </div>
                {isCarousel && (
                    <span style={{
                        background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 700,
                        borderRadius: 999, padding: '3px 10px',
                    }}>{slide + 1}/{total}</span>
                )}
            </div>

            {/* Media */}
            {total > 0 ? (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderTop: '1px solid #363636', borderBottom: '1px solid #363636' }}>
                    <div style={{
                        display: 'flex', width: `${total * 100}%`,
                        transform: `translateX(-${slide * (100 / total)}%)`,
                        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', height: '100%',
                    }}>
                        {mediaUrls.map((url, i) => (
                            <div key={i} style={{
                                width: `${100 / total}%`, height: '100%', flexShrink: 0,
                                background: `url(${url}) center/cover no-repeat`,
                            }} />
                        ))}
                    </div>
                    {isCarousel && slide > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); setSlide(s => s - 1); }} style={{
                            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                            width: 28, height: 28, borderRadius: '50%', border: 'none',
                            background: 'rgba(255,255,255,0.85)', color: '#000', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 900, boxShadow: '0 2px 8px rgba(0,0,0,.4)',
                        }}>‹</button>
                    )}
                    {isCarousel && slide < total - 1 && (
                        <button onClick={(e) => { e.stopPropagation(); setSlide(s => s + 1); }} style={{
                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                            width: 28, height: 28, borderRadius: '50%', border: 'none',
                            background: 'rgba(255,255,255,0.85)', color: '#000', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 900, boxShadow: '0 2px 8px rgba(0,0,0,.4)',
                        }}>›</button>
                    )}
                </div>
            ) : (
                <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #363636', borderBottom: '1px solid #363636' }}>
                    <Image size={48} color="#555" />
                </div>
            )}

            {/* Interaction Bar + Dots */}
            {isIG && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 20 }}>♡</span>
                        <span style={{ fontSize: 20 }}>💬</span>
                        <span style={{ fontSize: 20 }}>✈️</span>
                    </div>
                    {isCarousel && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flex: 1 }}>
                            {mediaUrls.map((_, i) => (
                                <div key={i} onClick={() => setSlide(i)} style={{
                                    width: slide === i ? 7 : 5, height: slide === i ? 7 : 5,
                                    borderRadius: '50%', cursor: 'pointer',
                                    background: slide === i ? '#0095F6' : 'rgba(255,255,255,0.3)',
                                    transition: 'all .2s',
                                }} />
                            ))}
                        </div>
                    )}
                    <span style={{ fontSize: 20, marginLeft: isCarousel ? 0 : 'auto' }}>🔖</span>
                </div>
            )}

            {/* Caption */}
            <div style={{ padding: '4px 14px 14px' }}>
                <div style={{ color: '#fff', fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    <span style={{ fontWeight: 700 }}>{clientName || 'cliente'}</span>{' '}
                    {text?.substring(0, 150)}{text?.length > 150 ? '...' : ''}
                </div>
            </div>
        </div>
    );
};

// ---- Calendar View Component ----
const CalendarTab = ({ posts, clients, socialProfiles }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedClient, setSelectedClient] = useState('all');
    const [previewPost, setPreviewPost] = useState(null);

    const scheduledPosts = posts.filter(p => ['scheduled', 'published', 'approved', 'pending_approval'].includes(p.status));

    const filteredPosts = selectedClient === 'all'
        ? scheduledPosts
        : scheduledPosts.filter(p => p.client_id === selectedClient);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const getPostsForDay = (day) => {
        return filteredPosts.filter(p => {
            const d = new Date(p.scheduled_for || p.created_at);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
    };

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    // Client color map
    const clientColors = useMemo(() => {
        const colors = ['#38BDF8', '#A78BFA', '#F472B6', '#34D399', '#FB923C', '#FBBF24', '#F87171', '#22D3EE'];
        const map = {};
        clients.forEach((c, i) => { map[c.id] = colors[i % colors.length]; });
        return map;
    }, [clients]);

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Calendário de Conteúdos</h3>
                    <p style={{ color: C.muted, fontSize: 13 }}>Visualize todos os conteúdos agendados</p>
                </div>
            </div>

            {/* Client filter tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                    onClick={() => setSelectedClient('all')}
                    style={{
                        padding: '5px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: selectedClient === 'all' ? '2px solid #38BDF8' : `1px solid ${C.border}`,
                        background: selectedClient === 'all' ? 'rgba(56,189,248,0.15)' : 'transparent',
                        color: selectedClient === 'all' ? '#38BDF8' : C.dim,
                    }}
                >Todos</button>
                {clients.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedClient(c.id)}
                        style={{
                            padding: '5px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            border: selectedClient === c.id ? `2px solid ${clientColors[c.id]}` : `1px solid ${C.border}`,
                            background: selectedClient === c.id ? `${clientColors[c.id]}22` : 'transparent',
                            color: selectedClient === c.id ? clientColors[c.id] : C.dim,
                        }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: clientColors[c.id], display: 'inline-block', marginRight: 6 }} />
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Calendar Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <button onClick={prevMonth} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, cursor: 'pointer', color: C.dim, display: 'flex' }}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text, minWidth: 180, textAlign: 'center' }}>
                    {monthNames[month]} {year}
                </span>
                <button onClick={nextMonth} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, cursor: 'pointer', color: C.dim, display: 'flex' }}>
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {dayNames.map(d => (
                        <div key={d} style={{ padding: '10px 4px', textAlign: 'center', color: C.dim, fontSize: 11, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
                            {d}
                        </div>
                    ))}
                </div>
                {/* Day cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} style={{ minHeight: 90, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayPosts = getPostsForDay(day);
                        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

                        return (
                            <div key={day} style={{
                                minHeight: 90, padding: 4, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                                background: isToday ? 'rgba(56,189,248,0.06)' : 'transparent',
                            }}>
                                <div style={{
                                    fontSize: 11, fontWeight: isToday ? 800 : 600,
                                    color: isToday ? '#38BDF8' : C.dim,
                                    marginBottom: 4, padding: '2px 4px',
                                }}>{day}</div>
                                {dayPosts.map(p => {
                                    const s = STATUS_MAP[p.status] || STATUS_MAP.draft;
                                    const client = clients.find(c => c.id === p.client_id);
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => setPreviewPost(p)}
                                            style={{
                                                background: `${clientColors[p.client_id] || '#38BDF8'}18`,
                                                borderLeft: `3px solid ${clientColors[p.client_id] || '#38BDF8'}`,
                                                borderRadius: 6, padding: '3px 6px', marginBottom: 3,
                                                cursor: 'pointer', transition: 'all .15s',
                                            }}
                                        >
                                            <div style={{ fontSize: 10, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.platform === 'instagram' ? '📸' : '📘'} {client?.name || ''}
                                            </div>
                                            <div style={{ fontSize: 9, color: s.color, fontWeight: 600 }}>{s.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Post Preview Modal */}
            {previewPost && (
                <Modal title="Conteúdo Agendado" onClose={() => setPreviewPost(null)} width={480}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(() => {
                            const profile = socialProfiles.find(p => p.client_id === previewPost.client_id) || {};
                            const clientAvatar = previewPost.platform === 'facebook' ? profile.facebookAvatar : profile.instagramAvatar;
                            return (
                                <SocialPreview
                                    platform={previewPost.platform}
                                    text={previewPost.content_text}
                                    mediaUrls={previewPost.media_urls}
                                    clientName={clients.find(c => c.id === previewPost.client_id)?.name}
                                    clientAvatar={clientAvatar}
                                />
                            );
                        })()}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Badge color={(STATUS_MAP[previewPost.status] || STATUS_MAP.draft).color}>
                                {(STATUS_MAP[previewPost.status] || STATUS_MAP.draft).label}
                            </Badge>
                            {previewPost.scheduled_for && (
                                <span style={{ color: C.dim, fontSize: 12 }}>
                                    📅 {new Date(previewPost.scheduled_for).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    {' às '}
                                    {new Date(previewPost.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ---- Tab Selector ----
const TabBar = ({ tabs, active, onChange }) => (
    <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {tabs.map(t => (
            <button
                key={t.id}
                onClick={() => onChange(t.id)}
                style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: active === t.id ? 'rgba(56,189,248,0.12)' : 'transparent',
                    color: active === t.id ? '#38BDF8' : C.dim,
                    fontSize: 13,
                    fontWeight: active === t.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                }}
            >
                {t.icon}
                {t.label}
                {t.badge > 0 && (
                    <span style={{
                        background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800,
                        borderRadius: 999, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                        lineHeight: '16px',
                    }}>{t.badge}</span>
                )}
            </button>
        ))}
    </div>
);

// ---- StatusBadge ----
const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.draft;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: s.bg, color: s.color,
            padding: '3px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
            {s.label}
        </span>
    );
};

// ---- PostCard ----
const PostCard = ({ post, onEdit, onDelete, clients }) => {
    const client = clients.find(c => c.id === post.client_id);
    const platform = PLATFORMS.find(p => p.value === post.platform);

    return (
        <div style={{
            background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
            padding: 20, transition: 'all .2s',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{platform?.icon || '📄'}</span>
                    <div>
                        <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>
                            {client?.name || 'Cliente'}
                        </div>
                        <div style={{ color: C.muted, fontSize: 11 }}>
                            {platform?.label} · {POST_TYPES.find(t => t.value === post.post_type)?.label || post.post_type}
                        </div>
                    </div>
                </div>
                <StatusBadge status={post.status} />
            </div>

            {/* Content preview */}
            <div style={{
                color: C.text, fontSize: 13, lineHeight: 1.6,
                marginBottom: 12, maxHeight: 80, overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12,
            }}>
                {post.content_text?.substring(0, 200)}
                {post.content_text?.length > 200 ? '...' : ''}
            </div>

            {/* Media thumbnails */}
            {post.media_urls?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {post.media_urls.slice(0, 4).map((url, i) => (
                        <div key={i} style={{
                            width: 60, height: 60, borderRadius: 8,
                            background: `url(${url}) center/cover`, border: `1px solid ${C.border}`
                        }} />
                    ))}
                    {post.media_urls.length > 4 && (
                        <div style={{
                            width: 60, height: 60, borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.muted, fontSize: 12, fontWeight: 700,
                        }}>
                            +{post.media_urls.length - 4}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: C.dim, fontSize: 11 }}>
                    {post.scheduled_at
                        ? `📅 ${new Date(post.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                        : `Criado ${new Date(post.created_at).toLocaleDateString('pt-BR')}`
                    }
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => onEdit(post)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }} title="Editar">
                        <Edit3 size={14} />
                    </button>
                    <button onClick={() => onDelete(post.id)} style={{ background: 'transparent', border: 'none', color: C.red, cursor: 'pointer', padding: 4 }} title="Excluir">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// TAB 1: CREATE POST (AI + MANUAL + MEDIA)
// ==========================================
const DRAFT_KEY = 'social_draft';

const loadDraft = () => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
};
const saveDraft = (patch) => {
    const current = loadDraft();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
};
const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

const CreatePostTab = ({ clients, socialProfiles, onPostCreated }) => {
    const draft = loadDraft();
    const [selectedClient, setSelectedClient] = useState(draft.client || '');

    // Build enriched client list with page/account names
    const enrichedClients = clients.map(c => {
        const profile = (socialProfiles || []).find(p => p.client_id === c.id);
        let label = c.name;
        const details = [];
        if (profile?.facebook_page_name) details.push(`📘 ${profile.facebook_page_name}`);
        if (profile?.instagram_username) details.push(`📸 @${profile.instagram_username.replace(/^@/, '')}`);
        if (details.length > 0) label += ` — ${details.join(' · ')}`;
        return { ...c, label };
    });
    const [platform, setPlatform] = useState(draft.platform || 'instagram');
    const [postType, setPostType] = useState(draft.postType || 'feed');
    const [briefing, setBriefing] = useState(draft.briefing || '');
    const [tone, setTone] = useState(draft.tone || 'profissional');
    const [generating, setGenerating] = useState(false);
    const [variations, setVariations] = useState([]);
    const [selectedVariation, setSelectedVariation] = useState(0);
    const [saving, setSaving] = useState(false);

    // NEW: Mode toggle (IA vs Manual)
    const [mode, setMode] = useState(draft.mode || 'ia'); // 'ia' | 'manual'
    const [manualText, setManualText] = useState(draft.manualText || '');

    // NEW: Media upload
    const [mediaFiles, setMediaFiles] = useState([]); // [{ file, preview, uploading }]
    const [dragging, setDragging] = useState(false);

    // NEW: AI creative analysis
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');

    // Auto-save draft on changes
    useEffect(() => {
        saveDraft({ client: selectedClient, platform, postType, briefing, tone, mode, manualText });
    }, [selectedClient, platform, postType, briefing, tone, mode, manualText]);

    const fileInputRef = React.useRef(null);

    const tones = [
        { value: 'profissional', label: '💼 Profissional' },
        { value: 'descontraido', label: '😎 Descontraído' },
        { value: 'urgente', label: '🔥 Urgente' },
        { value: 'inspiracional', label: '✨ Inspiracional' },
        { value: 'educativo', label: '📚 Educativo' },
        { value: 'humoristico', label: '😂 Humorístico' },
    ];

    // ---- Media handlers ----
    const handleFiles = (files) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
        const maxSize = 100 * 1024 * 1024; // 100MB

        const newFiles = Array.from(files)
            .filter(f => validTypes.includes(f.type) && f.size <= maxSize)
            .map(f => ({
                file: f,
                preview: f.type.startsWith('image') ? URL.createObjectURL(f) : null,
                name: f.name,
                type: f.type,
                size: f.size,
            }));

        if (newFiles.length === 0) {
            alert('Formatos aceitos: JPG, PNG, WebP, MP4. Máximo 100MB.');
            return;
        }

        setMediaFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Max 10 files
    };

    const removeMedia = (index) => {
        setMediaFiles(prev => {
            const updated = [...prev];
            if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const uploadMediaToStorage = async (postId) => {
        if (mediaFiles.length === 0) return [];

        const urls = [];
        for (const media of mediaFiles) {
            const ext = media.name.split('.').pop();
            const path = `social-media/${postId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            const { data, error } = await supabase.storage
                .from('social-media')
                .upload(path, media.file, { contentType: media.type });

            if (error) {
                console.error('Upload error:', error);
                continue;
            }

            const { data: urlData } = supabase.storage
                .from('social-media')
                .getPublicUrl(path);

            urls.push(urlData.publicUrl);
        }
        return urls;
    };

    // ---- AI Analysis of uploaded media ----
    const analyzeCreative = async () => {
        if (mediaFiles.length === 0 || !selectedClient) return;
        setAnalyzing(true);
        setAiAnalysis('');

        try {
            const client = clients.find(c => c.id === selectedClient);
            const platformLabel = PLATFORMS.find(p => p.value === platform)?.label;

            const prompt = `Você é um especialista em social media marketing. Analise o criativo que a equipe de social media preparou e dê feedback construtivo.

CLIENTE: ${client?.name || 'Empresa'}
PLATAFORMA: ${platformLabel}
TIPO DE POST: ${POST_TYPES.find(t => t.value === postType)?.label}
QUANTIDADE DE MÍDIAS: ${mediaFiles.length} arquivo(s)
TIPOS: ${mediaFiles.map(f => f.type.startsWith('video') ? 'Vídeo' : 'Imagem').join(', ')}

${briefing ? `BRIEFING: ${briefing}` : ''}

Por favor, analise e forneça:
1. 📊 Nota geral (0-10) para engajamento esperado
2. ✅ Pontos fortes do criativo (composição, cores, formato)
3. ⚠️ Sugestões de melhoria
4. 📝 Sugestão de legenda otimizada (se não tiver texto manual)
5. #️⃣ Hashtags recomendadas
6. 📅 Melhor horário para postar

Responda em português brasileiro, de forma objetiva e profissional.`;

            const { data, error } = await supabase.functions.invoke('generate-social-post', {
                body: { prompt, platform, postType }
            });

            if (error) throw error;

            // The analysis comes as a single text, not variations
            const fullText = data.variations?.join('\n\n') || data.text || 'Análise não disponível.';
            setAiAnalysis(fullText);
        } catch (err) {
            console.error('Erro na análise:', err);
            setAiAnalysis('Erro ao analisar criativo: ' + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // ---- AI text generation ----
    const generatePost = async () => {
        if (!selectedClient || !briefing.trim()) return;
        setGenerating(true);
        setVariations([]);

        try {
            const client = clients.find(c => c.id === selectedClient);
            const { data: profile } = await supabase
                .from('social_client_profiles')
                .select('*')
                .eq('client_id', selectedClient)
                .single();

            const prompt = buildPrompt({
                client,
                profile,
                platform,
                postType,
                briefing,
                tone,
            });

            const { data, error } = await supabase.functions.invoke('generate-social-post', {
                body: { prompt, platform, postType }
            });

            if (error) throw error;

            setVariations(data.variations || []);
            setSelectedVariation(0);
        } catch (err) {
            console.error('Erro ao gerar post:', err);
            alert('Erro ao gerar post: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const buildPrompt = ({ client, profile, platform, postType, briefing, tone }) => {
        const platformLabel = PLATFORMS.find(p => p.value === platform)?.label;
        const typeLabel = POST_TYPES.find(t => t.value === postType)?.label;

        return `Você é um social media manager especialista. Gere 3 variações de texto para um post de ${platformLabel} (${typeLabel}).

CLIENTE: ${client?.name || 'Empresa'}
NICHO: ${profile?.niche || 'Não informado'}
PÚBLICO-ALVO: ${profile?.target_audience || 'Geral'}
TOM DE VOZ: ${tone}

BRIEFING DO SOCIAL MEDIA:
${briefing}

${profile?.extra_context ? `CONTEXTO ADICIONAL: ${profile.extra_context}` : ''}

REGRAS:
- Crie exatamente 3 variações diferentes
- Cada variação deve ter no máximo 2200 caracteres (limite do Instagram)
- Inclua hashtags relevantes ao final de cada variação
- Use emojis de forma estratégica
- Adapte o formato para ${typeLabel} de ${platformLabel}
${postType === 'carousel' ? '- Para carrossel: descreva o texto de cada slide separadamente, numerando-os' : ''}
${postType === 'reels' ? '- Para Reels: inclua uma sugestão de roteiro curto e hook inicial' : ''}
- Responda APENAS em português brasileiro natural
- Separe cada variação com "---VARIAÇÃO---"

FORMATO DA RESPOSTA:
Variação 1:
[texto completo]
---VARIAÇÃO---
Variação 2:
[texto completo]
---VARIAÇÃO---
Variação 3:
[texto completo]`;
    };

    // ---- Save post (both IA and Manual modes) ----
    const savePost = async (status = 'draft') => {
        const text = mode === 'ia'
            ? (variations.length > 0 ? variations[selectedVariation] : '')
            : manualText.trim();

        if (!text && mediaFiles.length === 0) {
            alert('Adicione um texto ou pelo menos uma mídia antes de salvar.');
            return;
        }
        if (!selectedClient) {
            alert('Selecione um cliente.');
            return;
        }
        setSaving(true);

        try {
            // Insert the post first
            const postPayload = {
                client_id: selectedClient,
                platform,
                post_type: postType,
                content_text: text || null,
                status,
                briefing: briefing || null,
                ai_model: mode === 'ia' ? 'gemini-2.0-flash' : null,
            };

            const { data: post, error } = await supabase
                .from('social_posts')
                .insert(postPayload)
                .select()
                .single();

            if (error) throw error;

            // Upload media if any
            if (mediaFiles.length > 0) {
                const urls = await uploadMediaToStorage(post.id);
                if (urls.length > 0) {
                    await supabase
                        .from('social_posts')
                        .update({ media_urls: urls })
                        .eq('id', post.id);
                }
            }

            // Save AI variations if applicable
            if (mode === 'ia' && variations.length > 0) {
                const variationRows = variations.map((v, i) => ({
                    post_id: post.id,
                    variation_index: i,
                    content_text: v,
                }));
                await supabase.from('social_post_variations').insert(variationRows);
            }

            // Reset form
            setBriefing('');
            setManualText('');
            setVariations([]);
            setMediaFiles([]);
            setAiAnalysis('');
            clearDraft();
            onPostCreated?.();
            alert(status === 'pending_approval' ? 'Post enviado para aprovação do cliente! ✅' : 'Rascunho salvo! 📝');
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ---- Check if can save ----
    const hasContent = mode === 'ia'
        ? variations.length > 0 || mediaFiles.length > 0
        : manualText.trim().length > 0 || mediaFiles.length > 0;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* LEFT: Briefing Form */}
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>

                {/* Mode Toggle: IA vs Manual */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
                    <button
                        onClick={() => setMode('ia')}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: mode === 'ia' ? 'rgba(56,189,248,0.15)' : 'transparent',
                            color: mode === 'ia' ? '#38BDF8' : C.dim,
                            fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        <Sparkles size={14} /> Gerar com IA
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: mode === 'manual' ? 'rgba(16,185,129,0.15)' : 'transparent',
                            color: mode === 'manual' ? '#10B981' : C.dim,
                            fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        <Edit3 size={14} /> Escrever Manual
                    </button>
                </div>

                {/* Client selector */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cliente</label>
                    <select
                        value={selectedClient}
                        onChange={e => setSelectedClient(e.target.value)}
                        style={{ width: '100%', background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13 }}
                    >
                        <option value="">Selecione um cliente...</option>
                        {enrichedClients.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                    </select>
                </div>

                {/* Platform + Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                        <label style={{ display: 'block', color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plataforma</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {PLATFORMS.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setPlatform(p.value)}
                                    style={{
                                        flex: 1, padding: '8px 12px', borderRadius: 10,
                                        border: platform === p.value ? `2px solid ${p.color}` : `1px solid ${C.border}`,
                                        background: platform === p.value ? `${p.color}15` : C.surf,
                                        color: platform === p.value ? p.color : C.dim,
                                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    }}
                                >
                                    {p.icon} {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</label>
                        <select
                            value={postType}
                            onChange={e => setPostType(e.target.value)}
                            style={{ width: '100%', background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13 }}
                        >
                            {POST_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tone (only in IA mode) */}
                {mode === 'ia' && (
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tom de Voz</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {tones.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setTone(t.value)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 999,
                                        border: tone === t.value ? '2px solid #38BDF8' : `1px solid ${C.border}`,
                                        background: tone === t.value ? 'rgba(56,189,248,0.1)' : 'transparent',
                                        color: tone === t.value ? '#38BDF8' : C.dim,
                                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Briefing (IA mode) or Manual text */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {mode === 'ia' ? 'Briefing' : 'Texto do Post'}
                    </label>
                    <textarea
                        value={mode === 'ia' ? briefing : manualText}
                        onChange={e => mode === 'ia' ? setBriefing(e.target.value) : setManualText(e.target.value)}
                        placeholder={mode === 'ia'
                            ? "Descreva o que você quer comunicar no post... Ex: Promover o novo serviço de design de interiores com foco em apartamentos compactos."
                            : "Digite o texto do post aqui... Inclua emojis, hashtags e a legenda completa."
                        }
                        rows={mode === 'manual' ? 8 : 5}
                        style={{
                            width: '100%', background: C.surf, border: `1px solid ${C.border}`,
                            borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 13,
                            resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                        }}
                    />
                    {mode === 'manual' && manualText.length > 0 && (
                        <div style={{ textAlign: 'right', color: manualText.length > 2200 ? '#EF4444' : C.dim, fontSize: 11, marginTop: 4 }}>
                            {manualText.length}/2200 caracteres
                        </div>
                    )}
                </div>

                {/* ===== MEDIA UPLOAD ZONE ===== */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        📎 Mídia (Imagem ou Vídeo)
                    </label>

                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragging ? '#38BDF8' : C.border}`,
                            borderRadius: 12, padding: mediaFiles.length > 0 ? 12 : '24px 16px',
                            textAlign: 'center', cursor: 'pointer',
                            background: dragging ? 'rgba(56,189,248,0.05)' : 'rgba(255,255,255,0.02)',
                            transition: 'all .2s',
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                            style={{ display: 'none' }}
                            onChange={e => handleFiles(e.target.files)}
                        />

                        {mediaFiles.length === 0 ? (
                            <>
                                <Image size={28} color={C.dim} style={{ opacity: 0.5, marginBottom: 8 }} />
                                <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5 }}>
                                    Arraste imagens ou vídeos aqui<br />
                                    <span style={{ color: '#38BDF8', fontWeight: 600 }}>ou clique para selecionar</span><br />
                                    <span style={{ fontSize: 10, color: C.muted }}>JPG, PNG, WebP, MP4 · Máx 100MB · Até 10 arquivos</span>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                {mediaFiles.map((m, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        {m.preview ? (
                                            <img
                                                src={m.preview}
                                                alt={m.name}
                                                style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.border}` }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 72, height: 72, borderRadius: 10,
                                                background: 'rgba(56,189,248,0.1)', border: `1px solid ${C.border}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexDirection: 'column', gap: 2,
                                            }}>
                                                <span style={{ fontSize: 20 }}>🎬</span>
                                                <span style={{ fontSize: 9, color: C.dim }}>Vídeo</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeMedia(i); }}
                                            style={{
                                                position: 'absolute', top: -6, right: -6,
                                                width: 20, height: 20, borderRadius: '50%',
                                                background: '#EF4444', border: 'none', color: '#fff',
                                                fontSize: 12, cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {mediaFiles.length < 10 && (
                                    <div style={{
                                        width: 72, height: 72, borderRadius: 10,
                                        border: `2px dashed ${C.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: C.dim, fontSize: 24,
                                    }}>
                                        +
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {mode === 'ia' ? (
                        <Btn
                            full
                            onClick={generatePost}
                            loading={generating}
                            disabled={!selectedClient || !briefing.trim()}
                            icon={<Sparkles size={16} />}
                        >
                            {generating ? 'Gerando com IA...' : '✨ Gerar Texto com IA'}
                        </Btn>
                    ) : null}

                    {/* AI Analysis button (available in both modes when media exists) */}
                    {mediaFiles.length > 0 && (
                        <Btn
                            full
                            variant="ghost"
                            onClick={analyzeCreative}
                            loading={analyzing}
                            disabled={!selectedClient}
                            icon={<Eye size={16} />}
                        >
                            {analyzing ? 'Analisando criativo...' : '🤖 Analisar Criativo com IA'}
                        </Btn>
                    )}
                </div>
            </div>

            {/* RIGHT: Preview Panel */}
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={18} color="#38BDF8" /> Preview & Variações
                </h3>

                {/* AI Analysis result */}
                {aiAnalysis && (
                    <div style={{
                        background: 'rgba(56,189,248,0.05)', borderRadius: 12, padding: 16,
                        border: '1px solid rgba(56,189,248,0.2)', marginBottom: 16,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ color: '#38BDF8', fontSize: 13, fontWeight: 700 }}>🤖 Análise do Criativo</div>
                            <button onClick={() => setAiAnalysis('')} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>✕</button>
                        </div>
                        <div style={{ color: C.text, fontSize: 12.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                            {aiAnalysis}
                        </div>
                    </div>
                )}


                {/* IA mode: show variations */}
                {mode === 'ia' && (
                    variations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                            <Sparkles size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <p style={{ fontSize: 14 }}>Preencha o briefing e clique em "Gerar Texto com IA" para ver as variações aqui.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                {variations.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedVariation(i)}
                                        style={{
                                            padding: '6px 16px', borderRadius: 999,
                                            border: selectedVariation === i ? '2px solid #38BDF8' : `1px solid ${C.border}`,
                                            background: selectedVariation === i ? 'rgba(56,189,248,0.12)' : 'transparent',
                                            color: selectedVariation === i ? '#38BDF8' : C.dim,
                                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        }}
                                    >
                                        Variação {i + 1}
                                    </button>
                                ))}
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16,
                                border: `1px solid ${C.border}`, marginBottom: 16, maxHeight: 300, overflowY: 'auto',
                            }}>
                                <div style={{ color: C.text, fontSize: 13.5, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {variations[selectedVariation]}
                                </div>
                            </div>
                        </>
                    )
                )}

                {/* Manual mode: preview — Instagram/Facebook mockup */}
                {mode === 'manual' && (manualText.trim() || mediaFiles.length > 0) && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ color: C.dim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                            {platform === 'instagram' ? '📸' : '📘'} Preview — Como ficará no {platform === 'instagram' ? 'Instagram' : 'Facebook'}
                        </div>
                        {(() => {
                            const profile = socialProfiles.find(p => p.client_id === selectedClient) || {};
                            const clientAvatar = platform === 'facebook' ? profile.facebookAvatar : profile.instagramAvatar;
                            return (
                                <SocialPreview
                                    platform={platform}
                                    text={manualText}
                                    mediaUrls={mediaFiles.filter(m => m.preview).map(m => m.preview)}
                                    clientName={clients.find(c => c.id === selectedClient)?.name}
                                    clientAvatar={clientAvatar}
                                    postType={postType}
                                />
                            );
                        })()}
                    </div>
                )}

                {/* Manual mode: empty state */}
                {mode === 'manual' && !manualText.trim() && mediaFiles.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                        <Edit3 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p style={{ fontSize: 14 }}>Escreva o texto do post e/ou anexe mídias para ver a preview aqui.</p>
                    </div>
                )}

                {/* Save buttons (visible when there's content) */}
                {hasContent && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <Btn variant="ghost" onClick={() => savePost('draft')} loading={saving} icon={<FileText size={14} />}>
                            Salvar Rascunho
                        </Btn>
                        <Btn onClick={() => savePost('pending_approval')} loading={saving} icon={<Send size={14} />}>
                            Enviar p/ Aprovação
                        </Btn>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// TAB 2: QUEUE / SCHEDULER
// ==========================================
const QueueTab = ({ posts, clients, socialProfiles, onRefresh }) => {
    const queuePosts = posts.filter(p => ['draft', 'pending_approval', 'approved', 'scheduled'].includes(p.status));
    const [schedulingId, setSchedulingId] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const [previewPost, setPreviewPost] = useState(null);

    const schedulePost = async (postId) => {
        if (!scheduleDate || !scheduleTime) {
            alert('Selecione data e hora para agendar.');
            return;
        }
        setScheduling(true);
        try {
            const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}:00-03:00`).toISOString();

            // Update post status to scheduled
            const { error } = await supabase
                .from('social_posts')
                .update({ status: 'scheduled', scheduled_for: scheduledFor })
                .eq('id', postId);

            if (error) throw error;

            // Insert into schedule queue
            await supabase.from('social_schedule_queue').insert({
                post_id: postId,
                scheduled_for: scheduledFor,
                status: 'pending',
            });

            setSchedulingId(null);
            setScheduleDate('');
            setScheduleTime('');
            onRefresh();
            alert('Post agendado com sucesso! 📅');
        } catch (err) {
            console.error('Erro ao agendar:', err);
            alert('Erro: ' + err.message);
        } finally {
            setScheduling(false);
        }
    };

    const deletePost = async (postId) => {
        if (!confirm('Excluir este post permanentemente?')) return;
        await supabase.from('social_posts').delete().eq('id', postId);
        onRefresh();
    };

    const STATUS_MAP = {
        draft: { label: 'Rascunho', color: '#6B7280', bg: 'rgba(107,114,128,.12)', icon: '📝' },
        pending_approval: { label: 'Aguardando Aprovação', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', icon: '⏳' },
        approved: { label: 'Aprovado ✅', color: '#10B981', bg: 'rgba(16,185,129,.12)', icon: '✅' },
        scheduled: { label: 'Agendado', color: '#3B82F6', bg: 'rgba(59,130,246,.12)', icon: '📅' },
    };

    // Get minimum date (tomorrow)
    const getMinDate = () => {
        const d = new Date();
        d.setDate(d.getDate());
        return d.toISOString().split('T')[0];
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Conteúdos p/ Aprovação</h3>
                    <p style={{ color: C.muted, fontSize: 13 }}>{queuePosts.length} conteúdo{queuePosts.length !== 1 ? 's' : ''} pendente{queuePosts.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={onRefresh} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', color: C.dim, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={13} /> Atualizar
                </button>
            </div>

            {queuePosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                    <FileText size={48} style={{ opacity: 0.3, marginBottom: 16, color: C.text }} />
                    <p>Nenhum conteúdo pendente. Crie um novo post na aba "Criar Post".</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                    {queuePosts.map(post => {
                        const s = STATUS_MAP[post.status] || STATUS_MAP.draft;
                        const client = clients.find(c => c.id === post.client_id);
                        const isApproved = post.status === 'approved';
                        const isScheduled = post.status === 'scheduled';

                        return (
                            <div key={post.id} style={{
                                background: C.card, borderRadius: 16,
                                border: isApproved ? '1px solid rgba(16,185,129,.3)' : `1px solid ${C.border}`,
                                padding: 20, position: 'relative',
                            }}>
                                {/* Header: Client + Status */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>{post.platform === 'facebook' ? '📘' : '📸'}</span>
                                        <div>
                                            <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{client?.name || 'Cliente'}</div>
                                            <div style={{ color: C.dim, fontSize: 10 }}>
                                                {post.platform === 'facebook' ? 'Facebook' : 'Instagram'} · {post.post_type}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '3px 10px',
                                        borderRadius: 999, background: s.bg, color: s.color,
                                    }}>
                                        {s.icon} {s.label}
                                    </span>
                                </div>

                                {/* Instagram/Facebook Preview */}
                                {(() => {
                                    const profile = socialProfiles.find(p => p.client_id === post.client_id) || {};
                                    const clientAvatar = post.platform === 'facebook' ? profile.facebookAvatar : profile.instagramAvatar;
                                    return (
                                        <SocialPreview
                                            platform={post.platform}
                                            text={post.content_text}
                                            mediaUrls={post.media_urls}
                                            clientName={client?.name}
                                            clientAvatar={clientAvatar}
                                            postType={post.post_type}
                                        />
                                    );
                                })()}

                                {/* Scheduled time (if scheduled) */}
                                {isScheduled && post.scheduled_for && (
                                    <div style={{
                                        background: 'rgba(59,130,246,.08)', borderRadius: 10, padding: '8px 12px',
                                        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        <Clock size={14} color="#3B82F6" />
                                        <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 700 }}>
                                            📅 {new Date(post.scheduled_for).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                            {' às '}
                                            {new Date(post.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}

                                {/* Schedule picker (only for APPROVED posts) */}
                                {isApproved && schedulingId === post.id && (
                                    <div style={{
                                        background: 'rgba(16,185,129,.05)', borderRadius: 12, padding: 14,
                                        border: '1px solid rgba(16,185,129,.2)', marginBottom: 12,
                                    }}>
                                        <div style={{ color: '#10B981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                                            📅 Agendar Publicação
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                            <div>
                                                <label style={{ display: 'block', color: C.dim, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>DATA</label>
                                                <input
                                                    type="date"
                                                    value={scheduleDate}
                                                    onChange={e => setScheduleDate(e.target.value)}
                                                    min={getMinDate()}
                                                    style={{
                                                        width: '100%', background: C.surf, border: `1px solid ${C.border}`,
                                                        borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 12,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', color: C.dim, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>HORA</label>
                                                <input
                                                    type="time"
                                                    value={scheduleTime}
                                                    onChange={e => setScheduleTime(e.target.value)}
                                                    style={{
                                                        width: '100%', background: C.surf, border: `1px solid ${C.border}`,
                                                        borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 12,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => schedulePost(post.id)}
                                                disabled={scheduling || !scheduleDate || !scheduleTime}
                                                style={{
                                                    flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                                                    background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 700,
                                                    cursor: 'pointer', opacity: scheduling ? 0.6 : 1,
                                                }}
                                            >
                                                {scheduling ? 'Agendando...' : '📅 Confirmar Agendamento'}
                                            </button>
                                            <button
                                                onClick={() => setSchedulingId(null)}
                                                style={{
                                                    padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                                                    background: 'transparent', color: C.dim, fontSize: 12, cursor: 'pointer',
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {/* Schedule button — only for approved posts */}
                                    {isApproved && schedulingId !== post.id && (
                                        <button
                                            onClick={() => setSchedulingId(post.id)}
                                            style={{
                                                padding: '6px 14px', borderRadius: 8, border: 'none',
                                                background: 'rgba(16,185,129,.12)', color: '#10B981',
                                                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}
                                        >
                                            <Clock size={12} /> Agendar
                                        </button>
                                    )}

                                    {/* Info for pending_approval */}
                                    {post.status === 'pending_approval' && (
                                        <span style={{
                                            padding: '6px 14px', borderRadius: 8,
                                            background: 'rgba(245,158,11,.08)', color: '#F59E0B',
                                            fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                                        }}>
                                            ⏳ Aguardando aprovação do cliente
                                        </span>
                                    )}

                                    {/* Info for draft */}
                                    {post.status === 'draft' && (
                                        <button
                                            onClick={async () => {
                                                await supabase.from('social_posts').update({ status: 'pending_approval' }).eq('id', post.id);
                                                onRefresh();
                                            }}
                                            style={{
                                                padding: '6px 14px', borderRadius: 8, border: 'none',
                                                background: 'rgba(56,189,248,.12)', color: '#38BDF8',
                                                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}
                                        >
                                            <Send size={12} /> Enviar p/ Aprovação
                                        </button>
                                    )}

                                    {/* Delete */}
                                    {!isScheduled && (
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            style={{
                                                padding: '6px 14px', borderRadius: 8,
                                                border: `1px solid ${C.border}`, background: 'transparent',
                                                color: C.dim, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            🗑️ Excluir
                                        </button>
                                    )}
                                </div>

                                {/* Preview Button */}
                                <button
                                    onClick={() => setPreviewPost(post)}
                                    style={{
                                        width: '100%', padding: '8px', borderRadius: 8,
                                        border: `1px solid ${C.border}`, background: 'rgba(56,189,248,0.06)',
                                        color: '#38BDF8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        marginBottom: 10,
                                    }}
                                >
                                    <Eye size={13} /> Preview {post.platform === 'instagram' ? 'Instagram' : 'Facebook'}
                                </button>

                                {/* Timestamp */}
                                <div style={{ color: C.muted, fontSize: 10, marginTop: 10 }}>
                                    Criado em {new Date(post.created_at).toLocaleDateString('pt-BR')} às {new Date(post.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    {post.ai_model && <span> · 🤖 {post.ai_model}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Preview Modal */}
            {previewPost && (
                <Modal title={`Preview — ${previewPost.platform === 'instagram' ? 'Instagram' : 'Facebook'}`} onClose={() => setPreviewPost(null)} width={440}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        {(() => {
                            const profile = socialProfiles.find(p => p.client_id === previewPost.client_id) || {};
                            const clientAvatar = previewPost.platform === 'facebook' ? profile.facebookAvatar : profile.instagramAvatar;
                            return (
                                <SocialPreview
                                    platform={previewPost.platform}
                                    text={previewPost.content_text}
                                    mediaUrls={previewPost.media_urls}
                                    clientName={clients.find(c => c.id === previewPost.client_id)?.name}
                                    clientAvatar={clientAvatar}
                                />
                            );
                        })()}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
                            <Badge color={(STATUS_MAP[previewPost.status] || STATUS_MAP.draft).color}>
                                {(STATUS_MAP[previewPost.status] || STATUS_MAP.draft).label}
                            </Badge>
                            {previewPost.scheduled_for && (
                                <span style={{ color: C.dim, fontSize: 12 }}>
                                    📅 {new Date(previewPost.scheduled_for).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    {' às '}
                                    {new Date(previewPost.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ==========================================
// TAB 3: PUBLISHED
// ==========================================
const PublishedTab = ({ posts, clients }) => {
    const published = posts.filter(p => p.status === 'published');

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Posts Publicados</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>{published.length} publicações</p>

            {published.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                    <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <p>Nenhum post publicado ainda. Os posts aparecem aqui após serem publicados.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {published.map(post => {
                        const client = clients.find(c => c.id === post.client_id);
                        return (
                            <div key={post.id} style={{
                                background: C.card, borderRadius: 16, border: `1px solid rgba(16,185,129,.2)`,
                                padding: 20,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>{post.platform === 'facebook' ? '📘' : '📸'}</span>
                                        <div>
                                            <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{client?.name || 'Cliente'}</div>
                                            <div style={{ color: C.dim, fontSize: 10 }}>
                                                {post.platform === 'facebook' ? 'Facebook' : 'Instagram'} · {post.post_type}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '3px 10px',
                                        borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#10B981',
                                    }}>
                                        🟢 Publicado
                                    </span>
                                </div>

                                <div style={{
                                    background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12,
                                    marginBottom: 12, maxHeight: 100, overflowY: 'auto',
                                }}>
                                    <div style={{ color: C.text, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {post.content_text?.substring(0, 200)}{post.content_text?.length > 200 ? '...' : ''}
                                    </div>
                                </div>

                                {post.published_at && (
                                    <div style={{ color: C.muted, fontSize: 10 }}>
                                        Publicado em {new Date(post.published_at).toLocaleDateString('pt-BR')} às {new Date(post.published_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ==========================================
// TAB 4: CLIENT PROFILES (AI CONTEXT)
// ==========================================
const ProfilesTab = ({ clients }) => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncLog, setSyncLog] = useState('');

    useEffect(() => { loadProfiles(); }, []);

    const loadProfiles = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('social_client_profiles')
            .select('*, clients(name)')
            .order('created_at', { ascending: false });
        setProfiles(data || []);
        setLoading(false);
    };

    // Auto-sync from Meta API
    const handleSyncMeta = async () => {
        setSyncing(true);
        setSyncLog('🔍 Buscando contas de anúncio...');
        try {
            // Get ad accounts from Supabase
            const { data: adAccounts } = await supabase.from('ad_accounts').select('meta_id, client_id');
            if (!adAccounts || adAccounts.length === 0) {
                setSyncLog('❌ Nenhuma conta de anúncio encontrada. Sincronize as contas primeiro.');
                setSyncing(false);
                return;
            }

            const discovered = await discoverSocialProfiles(
                clients, adAccounts,
                (msg) => setSyncLog(msg) // Real-time log updates
            );

            if (discovered.length === 0) {
                setSyncLog('⚠️ Nenhuma página encontrada nas campanhas. Verifique se os clientes têm campanhas ativas.');
                setSyncing(false);
                return;
            }

            setSyncLog(`💾 Salvando ${discovered.length} perfis...`);

            // Upsert each discovered profile
            for (const profile of discovered) {
                const existing = profiles.find(p => p.client_id === profile.client_id);
                if (existing) {
                    await supabase.from('social_client_profiles').update({
                        facebook_page_id: profile.facebook_page_id,
                        facebook_page_name: profile.facebook_page_name,
                        facebook_page_token: profile.facebook_page_token,
                        instagram_account_id: profile.instagram_account_id,
                        instagram_username: profile.instagram_username,
                    }).eq('id', existing.id);
                } else {
                    await supabase.from('social_client_profiles').insert({
                        ...profile,
                        tone_of_voice: 'profissional',
                    });
                }
            }

            const fbCount = discovered.filter(d => d.facebook_page_name).length;
            const igCount = discovered.filter(d => d.instagram_username).length;
            setSyncLog(`✅ ${discovered.length} perfis sincronizados! 📘 ${fbCount} páginas FB · 📸 ${igCount} contas IG`);
            loadProfiles();
        } catch (err) {
            setSyncLog(`❌ Erro: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const saveProfile = async () => {
        if (!editingProfile) return;
        setSaving(true);

        try {
            const { id, clients: _, ...profileData } = editingProfile;

            if (id) {
                await supabase.from('social_client_profiles').update(profileData).eq('id', id);
            } else {
                await supabase.from('social_client_profiles').insert(profileData);
            }
            setEditingProfile(null);
            loadProfiles();
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Clients without profiles
    const profiledClientIds = profiles.map(p => p.client_id);
    const unprofiledClients = clients.filter(c => !profiledClientIds.includes(c.id));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Perfis de Clientes (IA)</h3>
                    <p style={{ color: C.muted, fontSize: 13 }}>Configure o contexto que a IA usa para gerar posts de cada cliente</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Btn
                        variant="ghost"
                        onClick={handleSyncMeta}
                        loading={syncing}
                        icon={<RefreshCw size={14} />}
                        style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
                    >
                        Sincronizar Meta
                    </Btn>
                    {unprofiledClients.length > 0 && (
                        <Btn
                            variant="ghost"
                            onClick={() => setEditingProfile({
                                client_id: unprofiledClients[0].id,
                                niche: '', target_audience: '', tone_of_voice: 'profissional',
                                extra_context: '', brand_colors: [],
                            })}
                            icon={<Plus size={14} />}
                        >
                            Novo Perfil
                        </Btn>
                    )}
                </div>
            </div>

            {/* Sync log */}
            {syncLog && (
                <div style={{
                    background: syncLog.startsWith('✅') ? 'rgba(16,185,129,0.1)' : syncLog.startsWith('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)',
                    border: `1px solid ${syncLog.startsWith('✅') ? '#10B981' : syncLog.startsWith('❌') ? '#EF4444' : '#38BDF8'}`,
                    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    color: syncLog.startsWith('✅') ? '#10B981' : syncLog.startsWith('❌') ? '#EF4444' : '#38BDF8',
                    fontSize: 13
                }}>
                    {syncLog}
                </div>
            )}

            {/* Profile cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {profiles.map(p => (
                    <div key={p.id} style={{
                        background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                        padding: 20,
                    }}>                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>
                                {p.clients?.name || 'Cliente'}
                            </div>
                            <button
                                onClick={() => setEditingProfile(p)}
                                style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}
                            >
                                <Edit3 size={14} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {p.facebook_page_name && <div style={{ color: C.dim, fontSize: 12 }}>📘 <strong>Facebook:</strong> {p.facebook_page_name}</div>}
                            {p.instagram_username && <div style={{ color: C.dim, fontSize: 12 }}>📸 <strong>Instagram:</strong> @{(p.instagram_username || '').replace(/^@/, '')}</div>}
                            {p.niche && <div style={{ color: C.dim, fontSize: 12 }}>📌 <strong>Nicho:</strong> {p.niche}</div>}
                            {p.target_audience && <div style={{ color: C.dim, fontSize: 12 }}>🎯 <strong>Público:</strong> {p.target_audience}</div>}
                            <div style={{ color: C.dim, fontSize: 12 }}>🎤 <strong>Tom:</strong> {p.tone_of_voice}</div>
                            {p.extra_context && <div style={{ color: C.dim, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>💡 {p.extra_context.substring(0, 100)}...</div>}
                        </div>
                    </div>
                ))}
            </div>

            {/* No profiles */}
            {profiles.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                    <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <p>Nenhum perfil de IA configurado. Crie perfis para que a IA gere textos mais precisos.</p>
                </div>
            )}

            {/* Profile Edit Modal */}
            {editingProfile && (
                <Modal title={editingProfile.id ? 'Editar Perfil' : 'Novo Perfil'} onClose={() => setEditingProfile(null)} width={560}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase' }}>Cliente</label>
                        <select
                            value={editingProfile.client_id}
                            onChange={e => setEditingProfile(ep => ({ ...ep, client_id: e.target.value }))}
                            disabled={!!editingProfile.id}
                            style={{ width: '100%', background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13 }}
                        >
                            <option value="">Selecione...</option>
                            {(editingProfile.id ? clients : unprofiledClients).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <Field label="Nicho">
                        <Input value={editingProfile.niche || ''} onChange={e => setEditingProfile(ep => ({ ...ep, niche: e.target.value }))} placeholder="Ex: Academias, Restaurantes, Estética..." />
                    </Field>
                    <Field label="Público-alvo">
                        <Input value={editingProfile.target_audience || ''} onChange={e => setEditingProfile(ep => ({ ...ep, target_audience: e.target.value }))} placeholder="Ex: Mulheres 25-45, empreendedoras..." />
                    </Field>
                    <Field label="Tom de Voz">
                        <select
                            value={editingProfile.tone_of_voice || 'profissional'}
                            onChange={e => setEditingProfile(ep => ({ ...ep, tone_of_voice: e.target.value }))}
                            style={{ width: '100%', background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13 }}
                        >
                            <option value="profissional">💼 Profissional</option>
                            <option value="descontraido">😎 Descontraído</option>
                            <option value="inspiracional">✨ Inspiracional</option>
                            <option value="educativo">📚 Educativo</option>
                        </select>
                    </Field>
                    <Field label="Contexto Extra (opcional)">
                        <textarea
                            value={editingProfile.extra_context || ''}
                            onChange={e => setEditingProfile(ep => ({ ...ep, extra_context: e.target.value }))}
                            placeholder="Informações adicionais sobre a marca, diferenciais, palavras-chave que devem ser usadas..."
                            rows={4}
                            style={{
                                width: '100%', background: C.surf, border: `1px solid ${C.border}`,
                                borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 13,
                                resize: 'vertical', fontFamily: 'inherit',
                            }}
                        />
                    </Field>

                    {/* Meta Publishing Config */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                        <div style={{ color: C.accent, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
                            🔗 Configuração de Publicação (Meta)
                        </div>
                        <Field label="📘 Nome da Página Facebook">
                            <Input
                                value={editingProfile.facebook_page_name || ''}
                                onChange={e => setEditingProfile(ep => ({ ...ep, facebook_page_name: e.target.value }))}
                                placeholder="Ex: GT House Oficial"
                            />
                        </Field>
                        <Field label="Facebook Page ID">
                            <Input
                                value={editingProfile.facebook_page_id || ''}
                                onChange={e => setEditingProfile(ep => ({ ...ep, facebook_page_id: e.target.value }))}
                                placeholder="Ex: 683322041532599"
                            />
                        </Field>
                        <Field label="Facebook Page Token">
                            <Input
                                value={editingProfile.facebook_page_token || ''}
                                onChange={e => setEditingProfile(ep => ({ ...ep, facebook_page_token: e.target.value }))}
                                placeholder="Token de acesso da página (Page Access Token)"
                                type="password"
                            />
                        </Field>
                        <Field label="📸 @ do Instagram">
                            <Input
                                value={editingProfile.instagram_username || ''}
                                onChange={e => setEditingProfile(ep => ({ ...ep, instagram_username: e.target.value }))}
                                placeholder="Ex: gthouse"
                            />
                        </Field>
                        <Field label="Instagram Account ID (opcional)">
                            <Input
                                value={editingProfile.instagram_account_id || ''}
                                onChange={e => setEditingProfile(ep => ({ ...ep, instagram_account_id: e.target.value }))}
                                placeholder="Ex: 17841400123456789"
                            />
                        </Field>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                        <Btn variant="ghost" onClick={() => setEditingProfile(null)}>Cancelar</Btn>
                        <Btn onClick={saveProfile} loading={saving} disabled={!editingProfile.client_id}>Salvar Perfil</Btn>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ==========================================
// CONNECTIONS TAB — OAuth Facebook/Instagram
// ==========================================
const ConnectionsTab = ({ clients }) => {
    const [metaConnections, setMetaConnections] = useState([]);
    const [linkedinConnections, setLinkedinConnections] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadConnections(); }, []);

    const loadConnections = async () => {
        setLoading(true);
        try {
            const [metaRes, linkedinRes] = await Promise.all([
                supabase.from('client_meta_connections').select('*').order('connected_at', { ascending: false }),
                supabase.from('client_linkedin_connections').select('*').order('connected_at', { ascending: false }),
            ]);
            if (metaRes.error) console.warn('[ConnectionsTab] Meta query error:', metaRes.error.message);
            if (linkedinRes.error) console.warn('[ConnectionsTab] LinkedIn query error:', linkedinRes.error.message);
            setMetaConnections(metaRes.data || []);
            setLinkedinConnections(linkedinRes.data || []);
        } catch (e) {
            console.warn('[ConnectionsTab] loadConnections error:', e);
            setMetaConnections([]);
            setLinkedinConnections([]);
        }
        setLoading(false);
    };

    const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Desconhecido';

    // Combine all active connection client IDs
    const metaActiveIds = new Set(metaConnections.filter(c => c.status === 'active').map(c => c.client_id));
    const linkedinActiveIds = new Set(linkedinConnections.filter(c => c.status === 'active').map(c => c.client_id));
    const connectedClientIds = new Set([...metaActiveIds, ...linkedinActiveIds]);

    const unconnectedClients = clients.filter(c => !connectedClientIds.has(c.id));

    // Merge all connections with a source flag
    const allConnections = [
        ...metaConnections.map(c => ({ ...c, _source: 'meta' })),
        ...linkedinConnections.map(c => ({ ...c, _source: 'linkedin' })),
    ].sort((a, b) => new Date(b.connected_at || 0) - new Date(a.connected_at || 0));

    const activeCount = allConnections.filter(c => c.status === 'active').length;

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Connect new client */}
            <div style={{
                background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                padding: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #1877F2, #0077B5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>🔗</div>
                    <div>
                        <div style={{ color: '#F9FAFB', fontSize: 15, fontWeight: 800 }}>
                            Conectar Redes Sociais do Cliente
                        </div>
                        <div style={{ color: C.muted, fontSize: 12 }}>
                            Conecte Facebook, Instagram e LinkedIn — métricas orgânicas, anúncios e leads
                        </div>
                    </div>
                </div>

                {/* Client selector */}
                <div style={{ marginBottom: 14 }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                        Selecione o Cliente
                    </label>
                    <select
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: 10,
                            background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`,
                            color: '#F9FAFB', fontSize: 13, appearance: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="">— Escolha um cliente —</option>
                        {clients.map(c => {
                            const hasMeta = metaActiveIds.has(c.id);
                            const hasLinkedin = linkedinActiveIds.has(c.id);
                            const badges = [hasMeta ? '📘' : '', hasLinkedin ? '💼' : ''].filter(Boolean).join(' ');
                            return (
                                <option key={c.id} value={c.id}>
                                    {c.name} {badges || ''}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Connect buttons */}
                {selectedClientId && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <ConnectFacebookButton
                            clientId={selectedClientId}
                            onConnected={() => loadConnections()}
                        />
                        <ConnectLinkedInButton
                            clientId={selectedClientId}
                            onConnected={() => loadConnections()}
                        />
                    </div>
                )}
            </div>

            {/* Existing connections list */}
            <div style={{
                background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                padding: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>📋</span>
                    <div>
                        <div style={{ color: '#F9FAFB', fontSize: 15, fontWeight: 800 }}>
                            Conexões Ativas ({activeCount})
                        </div>
                        <div style={{ color: C.muted, fontSize: 12 }}>
                            Clientes com redes sociais conectadas via OAuth
                        </div>
                    </div>
                    <button
                        onClick={loadConnections}
                        style={{
                            marginLeft: 'auto', background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${C.border}`, borderRadius: 8,
                            padding: '6px 12px', color: C.muted, fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                    >
                        <RefreshCw size={12} /> Atualizar
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>
                        Carregando conexões...
                    </div>
                ) : allConnections.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: 40, color: C.muted,
                        background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                        border: '1px dashed rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum cliente conectado ainda</div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                            Selecione um cliente acima e conecte Facebook/Instagram ou LinkedIn
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {allConnections.map(conn => {
                            const statusColors = {
                                active: { bg: 'rgba(16,185,129,0.1)', color: '#10B981', label: '🟢 Ativo' },
                                expired: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', label: '🟡 Expirado' },
                                revoked: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: '🔴 Revogado' },
                            };
                            const s = statusColors[conn.status] || statusColors.active;
                            const isLinkedin = conn._source === 'linkedin';
                            const isExpiringSoon = conn.token_expires_at &&
                                new Date(conn.token_expires_at) < new Date(Date.now() + 7 * 86400000);

                            if (isLinkedin) {
                                // ── LinkedIn Connection Card ──
                                const orgsCount = (conn.organizations || []).length;
                                const adsCount = (conn.ad_accounts || []).length;
                                return (
                                    <div key={`li-${conn.id}`} style={{
                                        background: 'rgba(0,119,181,0.03)',
                                        border: '1px solid rgba(0,119,181,0.12)',
                                        borderRadius: 12, padding: 14,
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        transition: 'all .15s',
                                    }}>
                                        {/* LinkedIn Avatar */}
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: 'linear-gradient(135deg, #0077B5, #00A0DC)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 16, color: '#fff', fontWeight: 800, flexShrink: 0,
                                        }}>
                                            {conn.linkedin_profile_picture ? (
                                                <img src={conn.linkedin_profile_picture} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                                            ) : (
                                                (getClientName(conn.client_id)[0] || 'L').toUpperCase()
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 700 }}>
                                                    {getClientName(conn.client_id)}
                                                </span>
                                                <span style={{
                                                    background: 'rgba(0,119,181,0.15)', color: '#0077B5',
                                                    fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                                                }}>
                                                    💼 LinkedIn
                                                </span>
                                                <span style={{
                                                    background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
                                                    padding: '2px 8px', borderRadius: 999,
                                                }}>
                                                    {s.label}
                                                </span>
                                                {isExpiringSoon && (
                                                    <span style={{
                                                        background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
                                                        fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999,
                                                    }}>
                                                        ⚠️ Renovar
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: C.muted, fontSize: 11, marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                <span>👤 {conn.linkedin_user_name || 'N/A'}</span>
                                                <span>🏢 {orgsCount} Company Page{orgsCount !== 1 ? 's' : ''}</span>
                                                <span>💰 {adsCount} Ad Account{adsCount !== 1 ? 's' : ''}</span>
                                            </div>
                                            {(conn.organizations || []).map((org, i) => (
                                                <span key={i} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    marginTop: 4, marginRight: 6,
                                                    background: 'rgba(0,119,181,0.08)', color: '#0077B5',
                                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                                }}>
                                                    {org.logo_url && <img src={org.logo_url} alt="" style={{ width: 12, height: 12, borderRadius: 2 }} />}
                                                    {org.name}
                                                </span>
                                            ))}
                                            {conn.linkedin_email && (
                                                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 3 }}>
                                                    📧 {conn.linkedin_email}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expiry */}
                                        {conn.token_expires_at && (
                                            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'right', flexShrink: 0 }}>
                                                Até {new Date(conn.token_expires_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // ── Meta Connection Card (Facebook/Instagram) ──
                            const pagesCount = (conn.pages || []).length;
                            const igCount = (conn.instagram_accounts || []).length;
                            return (
                                <div key={`meta-${conn.id}`} style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12, padding: 14,
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    transition: 'all .15s',
                                }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: 'linear-gradient(135deg, #1877F2, #0866FF)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, color: '#fff', fontWeight: 800, flexShrink: 0,
                                    }}>
                                        {(getClientName(conn.client_id)[0] || 'C').toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 700 }}>
                                                {getClientName(conn.client_id)}
                                            </span>
                                            <span style={{
                                                background: 'rgba(24,119,242,0.15)', color: '#1877F2',
                                                fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                                            }}>
                                                📘 Meta
                                            </span>
                                            <span style={{
                                                background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
                                                padding: '2px 8px', borderRadius: 999,
                                            }}>
                                                {s.label}
                                            </span>
                                            {isExpiringSoon && (
                                                <span style={{
                                                    background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
                                                    fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999,
                                                }}>
                                                    ⚠️ Renovar
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: C.muted, fontSize: 11, marginTop: 3, display: 'flex', gap: 12 }}>
                                            <span>👤 {conn.meta_user_name}</span>
                                            <span>📄 {pagesCount} Pages</span>
                                            <span>📸 {igCount} Instagram</span>
                                        </div>
                                        {conn.instagram_accounts?.map(ig => (
                                            <span key={ig.id} style={{
                                                display: 'inline-block', marginTop: 4, marginRight: 6,
                                                background: 'rgba(225,48,108,0.08)', color: '#E1306C',
                                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                            }}>
                                                @{ig.username}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Expiry */}
                                    {conn.token_expires_at && (
                                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'right', flexShrink: 0 }}>
                                            Até {new Date(conn.token_expires_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                    { label: 'Meta Conectados', value: metaConnections.filter(c => c.status === 'active').length, icon: '📘', color: '#1877F2' },
                    { label: 'LinkedIn Conectados', value: linkedinConnections.filter(c => c.status === 'active').length, icon: '💼', color: '#0077B5' },
                    { label: 'Sem Conexão', value: unconnectedClients.length, icon: '⚪', color: '#6B7280' },
                    { label: 'Tokens Expirando', value: allConnections.filter(c => c.status === 'active' && c.token_expires_at && new Date(c.token_expires_at) < new Date(Date.now() + 7 * 86400000)).length, icon: '⚠️', color: '#F59E0B' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
                        padding: 16, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                        <div style={{ color: stat.color, fontSize: 22, fontWeight: 900 }}>{stat.value}</div>
                        <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// ANALYTICS TAB
// ==========================================
const AnalyticsTab = ({ clients }) => {
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [connMap, setConnMap] = useState({});
    const { data: analyticsData, loading: analyticsLoading } = useEngagementAnalytics(selectedClientId);

    // Fetch connections for all clients to show IG usernames
    useEffect(() => {
        (async () => {
            const { data: conns } = await supabase
                .from('client_meta_connections')
                .select('client_id, instagram_accounts, pages, status')
                .eq('status', 'active');
            if (conns) {
                const map = {};
                conns.forEach(c => {
                    const igs = (c.instagram_accounts || []).map(ig => ig.username).filter(Boolean);
                    map[c.client_id] = { igUsernames: igs, hasConnection: true };
                });
                setConnMap(map);
            }
        })();
    }, []);

    // Sort clients: connected first, then alphabetically
    const sortedClients = useMemo(() => {
        return [...clients].sort((a, b) => {
            const aConn = connMap[a.id]?.hasConnection ? 1 : 0;
            const bConn = connMap[b.id]?.hasConnection ? 1 : 0;
            if (bConn !== aConn) return bConn - aConn;
            return a.name.localeCompare(b.name);
        });
    }, [clients, connMap]);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Client selector */}
            <div style={{
                background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                padding: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Activity size={20} style={{ color: '#8B5CF6' }} />
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#F9FAFB' }}>Raio-X do Perfil</div>
                        <div style={{ fontSize: 12, color: C.muted }}>Selecione um perfil para ver métricas orgânicas de engajamento</div>
                    </div>
                </div>
                <select
                    value={selectedClientId || ''}
                    onChange={e => setSelectedClientId(e.target.value || null)}
                    style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                        color: '#F9FAFB', fontSize: 13, fontWeight: 600,
                        outline: 'none', cursor: 'pointer',
                    }}
                >
                    <option value="">— Selecione um perfil —</option>
                    {sortedClients.map(c => {
                        const info = connMap[c.id];
                        const igLabel = info?.igUsernames?.length
                            ? ` · @${info.igUsernames.join(', @')}`
                            : '';
                        const prefix = info?.hasConnection ? '🟢' : '⚪';
                        return (
                            <option key={c.id} value={c.id} style={{ background: '#1E293B', color: '#F9FAFB' }}>
                                {prefix} {c.name}{igLabel}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Content */}
            {!selectedClientId ? (
                <div style={{
                    textAlign: 'center', padding: 60, color: C.muted,
                    background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                }}>
                    <Activity size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: 14, fontWeight: 600 }}>Selecione um cliente acima para visualizar o Raio-X do Perfil</p>
                </div>
            ) : analyticsLoading ? (
                <div style={{
                    textAlign: 'center', padding: 60, color: C.muted,
                    background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                }}>
                    <div className="spinner" style={{
                        width: 32, height: 32, border: `3px solid ${C.border}`,
                        borderTop: `3px solid #8B5CF6`, borderRadius: '50%',
                        animation: 'spin 1s linear infinite', margin: '0 auto 16px',
                    }} />
                    <p style={{ fontSize: 13 }}>Buscando dados orgânicos...</p>
                </div>
            ) : analyticsData ? (
                <ProfileRaioX data={analyticsData} />
            ) : (
                <div style={{
                    textAlign: 'center', padding: 60, color: C.muted,
                    background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
                }}>
                    <Instagram size={48} style={{ marginBottom: 16, opacity: 0.3, color: '#E1306C' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', marginBottom: 6 }}>Nenhum dado orgânico encontrado</p>
                    <p style={{ fontSize: 12 }}>Este cliente não possui uma conexão ativa com a Meta API, ou a conexão não retornou dados orgânicos.</p>
                </div>
            )}
        </div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const SocialMediaPanel = () => {
    const [tab, setTab] = useState(() => localStorage.getItem('social_tab') || 'create');
    const [clients, setClients] = useState([]);
    const [posts, setPosts] = useState([]);
    const [socialProfiles, setSocialProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Persist active tab
    useEffect(() => { localStorage.setItem('social_tab', tab); }, [tab]);

    const [approvalCount, setApprovalCount] = useState(0);

    const tabs = [
        { id: 'create', label: 'Criar Post', icon: <Sparkles size={15} /> },
        { id: 'queue', label: 'Aprovação', icon: <Bell size={15} />, badge: approvalCount },
        { id: 'calendar', label: 'Agenda', icon: <Calendar size={15} /> },
        { id: 'published', label: 'Publicados', icon: <CheckCircle size={15} /> },
        { id: 'profiles', label: 'Perfis IA', icon: <Users size={15} /> },
        { id: 'connections', label: 'Conexões', icon: <Link2 size={15} /> },
        { id: 'analytics', label: 'Analytics', icon: <Activity size={15} /> },
        { id: 'notion', label: 'Central', icon: <Monitor size={15} /> },
    ];

    const loadData = useCallback(async () => {
        setLoading(true);
        const [clientsRes, postsRes, profilesRes, connectionsRes] = await Promise.all([
            supabase.from('clients').select('id, name').order('name'),
            supabase.from('social_posts').select('*').order('created_at', { ascending: false }).limit(200),
            supabase.from('social_client_profiles').select('client_id, facebook_page_name, instagram_username'),
            supabase.from('client_meta_connections').select('client_id, pages, instagram_accounts').eq('status', 'active')
        ]);
        setClients(clientsRes.data || []);
        
        // Merge profile info with connection avatars
        const connections = connectionsRes.data || [];
        const mergedProfiles = (profilesRes.data || []).map(profile => {
            const conn = connections.find(c => c.client_id === profile.client_id);
            let facebookAvatar = null;
            let instagramAvatar = null;
            if (conn) {
                // Find matching page or just take first
                const page = (conn.pages || []).find(p => p.name === profile.facebook_page_name) || (conn.pages || [])[0];
                if (page) facebookAvatar = page.picture_url;
                
                const ig = (conn.instagram_accounts || []).find(i => i.username === profile.instagram_username) || (conn.instagram_accounts || [])[0];
                if (ig) instagramAvatar = ig.profile_picture_url;
            }
            return { ...profile, facebookAvatar, instagramAvatar };
        });
        
        setSocialProfiles(mergedProfiles);
        const allPosts = postsRes.data || [];
        setPosts(allPosts);
        setApprovalCount(allPosts.filter(p => p.status === 'pending_approval').length);
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    return (
        <div style={{ maxWidth: 1200 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
                    Social Media <span style={{ color: '#38BDF8', fontSize: 14, fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '3px 10px', borderRadius: 999, marginLeft: 8 }}>IA</span>
                </h1>
                <p style={{ color: C.muted, fontSize: 14 }}>Crie, agende e publique posts com inteligência artificial</p>
            </div>

            {/* Tab bar */}
            <TabBar tabs={tabs} active={tab} onChange={setTab} />

            {/* Tab content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
                    <div className="spinner" style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p>Carregando módulo social...</p>
                </div>
            ) : (
                <>
                    {tab === 'create' && <CreatePostTab clients={clients} socialProfiles={socialProfiles} onPostCreated={loadData} />}
                    {tab === 'queue' && <QueueTab posts={posts} clients={clients} socialProfiles={socialProfiles} onRefresh={loadData} />}
                    {tab === 'calendar' && <CalendarTab posts={posts} clients={clients} socialProfiles={socialProfiles} />}
                    {tab === 'published' && <PublishedTab posts={posts} clients={clients} />}
                    {tab === 'profiles' && <ProfilesTab clients={clients} />}
                    {tab === 'connections' && <ConnectionsTab clients={clients} />}
                    {tab === 'analytics' && <AnalyticsTab clients={clients} />}
                    {tab === 'notion' && <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}><div className="spinner" style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} /><p>Carregando Central...</p></div>}><NotionDashboard /></Suspense>}
                </>
            )}
        </div>
    );
};

export default SocialMediaPanel;
