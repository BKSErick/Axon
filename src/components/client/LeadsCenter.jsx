import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { C } from '../../lib/clientTheme';
import { getLeadForms, getLeadsByForm, clearMetaCache } from '../../lib/meta';
import { supabase } from '../../lib/supabase';
import { Inbox, Download, RefreshCw, ChevronDown, Search, Users, Calendar, AlertCircle, FileText, Send, CheckCircle, Loader, Phone, Mail, MessageCircle, Building2, Clock, MapPin, ChevronRight, X, Copy, Briefcase, Globe, Heart } from 'lucide-react';

// ─── Build Version (for Cloudflare deploy verification) ────────────────────────
console.log('[LeadsCenter] BUILD v2026.03.16.1 — last deploy marker');

// ─── CAPI Status Config ────────────────────────────────────────────────────────
const LEAD_STATUSES = [
    { value: 'novo', label: '✨ Novo', color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
    { value: 'qualificado', label: '🎯 Qualificado', color: '#22D3EE', bg: 'rgba(34,211,238,0.12)' },
    { value: 'agendou', label: '📅 Agendou', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { value: 'venda_fechada', label: '🏆 Venda Fechada', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
];

const STATUS_TO_EVENT_NAME = {
    qualificado: 'Lead Qualificado',
    agendou: 'Agendou Visita',
    venda_fechada: 'Venda Fechada',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtRelative = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'ontem';
    return `há ${days} dias`;
};

const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
};

const getWhatsAppUrl = (phone) => {
    const clean = formatPhone(phone);
    if (!clean) return '';
    return `https://wa.me/${clean.startsWith('55') ? clean : '55' + clean}`;
};

const getTelUrl = (phone) => {
    const clean = formatPhone(phone);
    if (!clean) return '';
    return `tel:+${clean.startsWith('55') ? clean : '55' + clean}`;
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
};

const FIELD_LABELS = {
    full_name: 'Nome Completo', first_name: 'Nome', last_name: 'Sobrenome',
    email: 'E-mail', phone_number: 'Telefone', phone: 'Telefone',
    city: 'Cidade', state: 'Estado', zip_code: 'CEP', country: 'País',
    company_name: 'Empresa', job_title: 'Cargo', work_email: 'E-mail Corporativo',
    date_of_birth: 'Nascimento', gender: 'Gênero', nome_completo: 'Nome Completo',
    nome: 'Nome', telefone: 'Telefone', celular: 'Celular', e_mail: 'E-mail',
    nome_da_empresa: 'Empresa', cidade: 'Cidade',
    work_phone_number: 'Tel. Comercial', street_address: 'Endereço', post_code: 'CEP',
};

const labelFor = (key) => FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const AVATAR_COLORS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
];

// Clean up ugly field values (underscores, markdown, etc)
const cleanValue = (val) => {
    if (val == null) return '';
    let s = String(val);
    // Replace underscores with spaces
    s = s.replace(/_/g, ' ');
    // Fix double spaces
    s = s.replace(/\s{2,}/g, ' ');
    // Capitalize first letter of each sentence
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s.trim();
};

// Helper to extract lead fields (with fuzzy key matching for custom forms)
const extractLead = (lead) => {
    // Try standard keys first, then fuzzy-match all keys
    const findValue = (lead, standardKeys, fuzzyPatterns) => {
        // 1. Check standard keys
        for (const k of standardKeys) {
            if (lead[k]) return lead[k];
        }
        // 2. Fuzzy match: check all keys against patterns
        const allKeys = Object.keys(lead);
        for (const pattern of fuzzyPatterns) {
            const match = allKeys.find(k => k.toLowerCase().includes(pattern));
            if (match && lead[match]) return lead[match];
        }
        return '';
    };

    const name = findValue(lead,
        ['full_name', 'first_name', 'last_name', 'nome_completo', 'nome'],
        ['full_name', 'first_name', 'nome_completo', 'nome', 'name', 'sobrenome']
    ) || '';

    const email = findValue(lead,
        ['email', 'e_mail', 'work_email'],
        ['email', 'e-mail', 'e_mail', 'mail']
    ) || '';

    const phone = findValue(lead,
        ['phone_number', 'phone', 'telefone', 'celular', 'work_phone_number'],
        ['phone', 'telefone', 'celular', 'fone', 'whatsapp', 'whats', 'contato']
    ) || '';

    const company = findValue(lead,
        ['company_name', 'nome_da_empresa', 'empresa'],
        ['empresa', 'company', 'negocio', 'negócio']
    ) || '';

    const city = findValue(lead,
        ['city', 'cidade'],
        ['city', 'cidade', 'municipio']
    ) || '';

    const state = findValue(lead,
        ['state', 'estado'],
        ['state', 'estado', 'uf']
    ) || '';

    const job = findValue(lead,
        ['job_title', 'cargo'],
        ['cargo', 'job', 'profissao', 'profissão', 'ocupacao']
    ) || '';

    // If still no name, use phone as display name
    const displayName = name || (phone ? `📞 ${phone}` : 'Lead sem nome');

    return { name: displayName, email, phone, company, city, state, job };
};

// ─── Contact Button ──────────────────────────────────────────────────────────
const ContactBtn = ({ icon: Icon, label, href, color, bgColor, size = 'normal', onClick }) => {
    const isLarge = size === 'large';
    return (
        <a
            href={href}
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: isLarge ? 10 : 7,
                background: bgColor, color: color,
                padding: isLarge ? '14px 24px' : '8px 14px',
                borderRadius: isLarge ? 14 : 10,
                fontSize: isLarge ? 15 : 12,
                fontWeight: 700, textDecoration: 'none', cursor: 'pointer',
                border: `1px solid ${color}22`, transition: 'all .25s ease',
                letterSpacing: '0.01em', fontFamily: 'inherit',
                justifyContent: 'center', flex: isLarge ? 1 : undefined,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${color}35`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <Icon size={isLarge ? 18 : 14} />
            {label}
        </a>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── LEAD DETAIL MODAL ─────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LeadDetailModal = ({ lead, idx, columns, onClose, leadStatuses, setLeadStatuses, sendingCapi, sentCapi, handleSendCapi }) => {
    const [copied, setCopied] = useState(null);
    if (!lead) return null;

    const lid = lead.id || `idx-${idx}`;
    const { name, email, phone, company, city, state, job } = extractLead(lead);
    const cleanPhone = formatPhone(phone);
    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
    const currentStatus = leadStatuses[lid] || 'novo';
    const isSending = sendingCapi[lid];
    const wasSent = sentCapi[lid];
    const statusConfig = LEAD_STATUSES.find(s => s.value === (wasSent || currentStatus)) || LEAD_STATUSES[0];

    // All fields except system ones
    const skipKeys = new Set(['id', 'created_time']);
    const allFields = columns.filter(c => !skipKeys.has(c) && lead[c]);

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 9998, animation: 'fadeIn .2s ease',
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '95%', maxWidth: 520, maxHeight: '90vh',
                overflowY: 'auto',
                background: 'linear-gradient(180deg, #1a1f2e 0%, #111827 100%)',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                zIndex: 9999,
                animation: 'scaleIn .25s ease',
            }}>

                {/* ─── Header gradient banner ─── */}
                <div style={{
                    background: avatarColor,
                    padding: '32px 28px 60px',
                    position: 'relative',
                    borderRadius: '24px 24px 0 0',
                }}>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 16, right: 16,
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.3)', border: 'none',
                            color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(10px)', transition: 'all .2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                    >
                        <X size={18} />
                    </button>

                    {/* Status badge */}
                    <div style={{
                        position: 'absolute', top: 16, left: 20,
                        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
                        padding: '6px 14px', borderRadius: 20,
                        fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                        {statusConfig.label}
                    </div>

                    {/* Time */}
                    <div style={{
                        position: 'absolute', bottom: 68, right: 28,
                        fontSize: 12, color: 'rgba(255,255,255,0.7)',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <Clock size={12} />
                        {fmtRelative(lead.created_time)} • {fmtDate(lead.created_time)}
                    </div>
                </div>

                {/* ─── Avatar (overlapping) ─── */}
                <div style={{
                    display: 'flex', justifyContent: 'center',
                    marginTop: -44, position: 'relative', zIndex: 2,
                }}>
                    <div style={{
                        width: 88, height: 88, borderRadius: 22,
                        background: avatarColor,
                        border: '4px solid #111827',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, fontWeight: 900, color: '#fff',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}>
                        {getInitials(name)}
                    </div>
                </div>

                {/* ─── Body ─── */}
                <div style={{ padding: '16px 28px 28px' }}>

                    {/* Name */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: '-0.01em' }}>
                            {name}
                        </h2>
                        {(company || job) && (
                            <p style={{ fontSize: 14, color: C.muted, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                {job && <><Briefcase size={13} /> {job}</>}
                                {job && company && <span style={{ opacity: 0.3 }}>•</span>}
                                {company && <><Building2 size={13} /> {company}</>}
                            </p>
                        )}
                        {(city || state) && (
                            <p style={{ fontSize: 13, color: C.dim, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                                <MapPin size={12} /> {[city, state].filter(Boolean).join(', ')}
                            </p>
                        )}
                    </div>

                    {/* ── Quick Contact Buttons ── */}
                    <div style={{
                        display: 'flex', gap: 10, marginBottom: 24,
                    }}>
                        {cleanPhone && (
                            <ContactBtn
                                icon={MessageCircle}
                                label="Falar no WhatsApp"
                                href={getWhatsAppUrl(phone)}
                                color="#25D366"
                                bgColor="rgba(37,211,102,0.12)"
                                size="large"
                            />
                        )}
                        {cleanPhone && (
                            <ContactBtn
                                icon={Phone}
                                label="Ligar"
                                href={getTelUrl(phone)}
                                color="#22D3EE"
                                bgColor="rgba(34,211,238,0.1)"
                                size="large"
                            />
                        )}
                    </div>

                    {email && (
                        <div style={{ marginBottom: 24 }}>
                            <ContactBtn
                                icon={Mail}
                                label={`Enviar E-mail para ${email}`}
                                href={`mailto:${email}`}
                                color="#818CF8"
                                bgColor="rgba(129,140,248,0.08)"
                                size="large"
                            />
                        </div>
                    )}

                    {/* ── Contact Info Cards ── */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                        marginBottom: 24,
                    }}>
                        {phone && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                                padding: '12px 16px', border: `1px solid ${C.border}`,
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Phone size={16} color="#22D3EE" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Telefone</div>
                                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{phone}</div>
                                </div>
                                <button onClick={() => handleCopy(phone, 'phone')} style={{
                                    background: 'none', border: 'none', cursor: 'pointer', color: copied === 'phone' ? '#10B981' : C.muted,
                                    padding: 6, borderRadius: 6, transition: 'color .2s',
                                }}>
                                    {copied === 'phone' ? <CheckCircle size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        )}

                        {email && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                                padding: '12px 16px', border: `1px solid ${C.border}`,
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Mail size={16} color="#818CF8" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>E-mail</div>
                                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
                                </div>
                                <button onClick={() => handleCopy(email, 'email')} style={{
                                    background: 'none', border: 'none', cursor: 'pointer', color: copied === 'email' ? '#10B981' : C.muted,
                                    padding: 6, borderRadius: 6, transition: 'color .2s',
                                }}>
                                    {copied === 'email' ? <CheckCircle size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── All Form Fields ── */}
                    {allFields.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FileText size={13} />
                                Dados do Formulário
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.02)', borderRadius: 14,
                                border: `1px solid ${C.border}`, overflow: 'hidden',
                            }}>
                                {allFields.map((key, i) => {
                                    const val = cleanValue(lead[key]);
                                    const label = labelFor(key);
                                    const isLong = val.length > 30 || label.length > 25;
                                    return (
                                        <div key={key} style={{
                                            display: 'flex',
                                            flexDirection: isLong ? 'column' : 'row',
                                            justifyContent: isLong ? 'flex-start' : 'space-between',
                                            alignItems: isLong ? 'stretch' : 'flex-start',
                                            padding: '12px 16px', gap: isLong ? 4 : 12,
                                            borderBottom: i < allFields.length - 1 ? `1px solid ${C.border}` : 'none',
                                        }}>
                                            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, flexShrink: 0 }}>
                                                {label}
                                            </span>
                                            <span style={{ fontSize: 13, color: C.text, fontWeight: 500, textAlign: isLong ? 'left' : 'right', wordBreak: 'break-word', lineHeight: 1.5 }}>
                                                {val}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Status & CAPI ── */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)', borderRadius: 14,
                        border: `1px solid ${C.border}`, padding: '16px 18px',
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            📡 Meta CAPI — Conversão
                        </div>
                        {wasSent ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                                borderRadius: 12, padding: '12px 16px',
                            }}>
                                <CheckCircle size={18} color="#10B981" />
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                                        {LEAD_STATUSES.find(s => s.value === wasSent)?.label} — Enviado!
                                    </div>
                                    <div style={{ fontSize: 11, color: '#10B981', opacity: 0.7 }}>Evento de conversão enviado para o Meta.</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <select
                                    value={currentStatus}
                                    onChange={e => setLeadStatuses(s => ({ ...s, [lid]: e.target.value }))}
                                    style={{
                                        appearance: 'none', flex: 1,
                                        background: statusConfig.bg,
                                        border: `1px solid ${statusConfig.color}33`,
                                        color: statusConfig.color,
                                        padding: '10px 14px', borderRadius: 10,
                                        fontSize: 13, fontWeight: 700,
                                        cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                                    }}
                                >
                                    {LEAD_STATUSES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                {currentStatus !== 'novo' && (
                                    <button
                                        onClick={() => handleSendCapi(lead)}
                                        disabled={isSending}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '10px 18px', borderRadius: 10,
                                            border: 'none',
                                            background: isSending ? 'rgba(34,211,238,0.08)' : 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))',
                                            color: '#22D3EE', fontSize: 13, fontWeight: 700,
                                            cursor: isSending ? 'wait' : 'pointer',
                                            transition: 'all .2s', fontFamily: 'inherit',
                                        }}
                                    >
                                        {isSending
                                            ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                            : <Send size={14} />}
                                        Enviar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes scaleIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.92) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
            `}</style>
        </>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── LEAD CARD ──────────────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LeadCard = ({ lead, idx, columns, leadStatuses, setLeadStatuses, sendingCapi, sentCapi, handleSendCapi, onOpenDetail }) => {
    const lid = lead.id || `idx-${idx}`;
    const currentStatus = leadStatuses[lid] || 'novo';
    const wasSent = sentCapi[lid];
    const statusConfig = LEAD_STATUSES.find(s => s.value === (wasSent || currentStatus)) || LEAD_STATUSES[0];

    const { name, email, phone, company, city } = extractLead(lead);
    const cleanPhone = formatPhone(phone);
    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

    // Count extra fields
    const skipKeys = new Set(['full_name', 'first_name', 'last_name', 'nome_completo', 'nome', 'email', 'e_mail', 'phone_number', 'phone', 'telefone', 'celular', 'company_name', 'nome_da_empresa', 'empresa', 'city', 'cidade', 'id', 'created_time']);
    const extraCount = columns.filter(c => !skipKeys.has(c) && lead[c]).length;

    return (
        <div
            style={{
                background: C.card, borderRadius: 18,
                border: `1px solid ${C.border}`, overflow: 'hidden',
                transition: 'all .3s ease', cursor: 'pointer', position: 'relative',
            }}
            onClick={() => onOpenDetail(lead, idx)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = statusConfig.color + '44'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {/* Status ribbon */}
            <div style={{ height: 3, background: statusConfig.color, opacity: 0.7 }} />

            <div style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, background: avatarColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0,
                        textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}>
                        {getInitials(name)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 2, lineHeight: 1.3 }}>
                            {name}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', alignItems: 'center' }}>
                            {company && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: C.muted }}><Building2 size={11} style={{ opacity: 0.6 }} /> {company}</span>}
                            {city && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: C.muted }}><MapPin size={11} style={{ opacity: 0.6 }} /> {city}</span>}
                        </div>
                    </div>

                    {/* Right side */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                            <Clock size={10} style={{ opacity: 0.5 }} />
                            {fmtRelative(lead.created_time)}
                        </div>

                        {/* Quick action buttons */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
                            {cleanPhone && (
                                <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: 'rgba(37,211,102,0.12)', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#25D366', cursor: 'pointer', transition: 'all .2s', textDecoration: 'none',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.25)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.12)'}
                                    title="WhatsApp"
                                >
                                    <MessageCircle size={15} />
                                </a>
                            )}
                            {email && (
                                <a href={`mailto:${email}`}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: 'rgba(129,140,248,0.12)', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#818CF8', cursor: 'pointer', transition: 'all .2s', textDecoration: 'none',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.25)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.12)'}
                                    title="E-mail"
                                >
                                    <Mail size={15} />
                                </a>
                            )}
                            {cleanPhone && (
                                <a href={getTelUrl(phone)}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: 'rgba(34,211,238,0.12)', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#22D3EE', cursor: 'pointer', transition: 'all .2s', textDecoration: 'none',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.25)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.12)'}
                                    title="Ligar"
                                >
                                    <Phone size={15} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom info row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                            fontSize: 11, fontWeight: 700, color: statusConfig.color,
                            background: statusConfig.bg, padding: '4px 10px', borderRadius: 6,
                        }}>
                            {statusConfig.label}
                        </span>
                        {extraCount > 0 && (
                            <span style={{ fontSize: 11, color: C.dim }}>
                                +{extraCount} campo{extraCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Ver detalhes <ChevronRight size={12} />
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color = C.primary, emoji }) => (
    <div style={{
        background: `linear-gradient(135deg, ${C.card} 0%, rgba(255,255,255,0.02) 100%)`,
        borderRadius: 18, padding: '22px 26px',
        border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 16,
        flex: 1, minWidth: 160, transition: 'all .3s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {emoji || <Icon size={22} style={{ color }} />}
        </div>
        <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1 }}>{value}</div>
        </div>
    </div>
);

const EmptyState = ({ icon: Icon, title, subtitle, children }) => (
    <div style={{ textAlign: 'center', padding: '60px 32px', color: C.muted }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon size={32} style={{ opacity: 0.6, color: '#818CF8' }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>{subtitle}</p>
        {children && <div style={{ marginTop: 24 }}>{children}</div>}
    </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const LeadsCenter = ({ user }) => {
    const [forms, setForms] = useState([]);
    const [selectedFormId, setSelectedFormId] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loadingForms, setLoadingForms] = useState(true);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [detailLead, setDetailLead] = useState(null);
    const [detailIdx, setDetailIdx] = useState(0);
    // CAPI state
    const [leadStatuses, setLeadStatuses] = useState({});
    const [sendingCapi, setSendingCapi] = useState({});
    const [sentCapi, setSentCapi] = useState({});
    const [capiError, setCapiError] = useState(null);
    const [period, setPeriod] = useState('total');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const [clientAdAccountId, setClientAdAccountId] = useState(null);

    // Fetch the client's ad account meta_id from Supabase
    useEffect(() => {
        const fetchAdAccountId = async () => {
            if (!user?.id || user.id === 'admin') {
                fetchForms(null);
                return;
            }
            
            let metaId = null;
            
            // Strategy 1: Direct lookup by client_id (user.id = client UUID)
            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('ad_accounts(meta_id)')
                    .eq('id', user.id)
                    .single();
                
                if (!error && data?.ad_accounts?.[0]?.meta_id) {
                    metaId = data.ad_accounts[0].meta_id;
                    console.log('[LeadsCenter] Strategy 1 (client_id): meta_id =', metaId);
                }
            } catch (e) {
                console.warn('[LeadsCenter] Strategy 1 failed:', e.message);
            }
            
            // Strategy 2: Lookup via profiles table (user.uuid = auth user id)
            if (!metaId && user.uuid) {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('client_id')
                        .eq('id', user.uuid)
                        .single();
                    
                    if (profile?.client_id) {
                        const { data } = await supabase
                            .from('clients')
                            .select('ad_accounts(meta_id)')
                            .eq('id', profile.client_id)
                            .single();
                        
                        if (data?.ad_accounts?.[0]?.meta_id) {
                            metaId = data.ad_accounts[0].meta_id;
                            console.log('[LeadsCenter] Strategy 2 (profile→client_id): meta_id =', metaId);
                        }
                    }
                } catch (e) {
                    console.warn('[LeadsCenter] Strategy 2 failed:', e.message);
                }
            }
            
            // Strategy 3: Lookup by email
            if (!metaId && user.email) {
                try {
                    const { data } = await supabase
                        .from('clients')
                        .select('ad_accounts(meta_id)')
                        .eq('email', user.email)
                        .single();
                    
                    if (data?.ad_accounts?.[0]?.meta_id) {
                        metaId = data.ad_accounts[0].meta_id;
                        console.log('[LeadsCenter] Strategy 3 (email): meta_id =', metaId);
                    }
                } catch (e) {
                    console.warn('[LeadsCenter] Strategy 3 failed:', e.message);
                }
            }
            
            console.log('[LeadsCenter] Final meta_id:', metaId);
            setClientAdAccountId(metaId);
            fetchForms(metaId);
        };
        fetchAdAccountId();
    }, [user?.id]);

    const fetchForms = async (adAccountId) => {
        setLoadingForms(true); setError(null);
        try {
            console.log('[LeadsCenter] fetchForms called with adAccountId:', adAccountId);
            clearMetaCache(); // Fresh start — no stale cache
            
            // Use ad account filter when available (client mode) to show only their forms
            let result = await getLeadForms(adAccountId);
            console.log('[LeadsCenter] fetchForms result:', result?.length, 'forms found');
            
            // Fallback: if filtered search returned 0 results, try without filter
            if ((!result || result.length === 0) && adAccountId) {
                console.log('[LeadsCenter] No forms with filter, retrying unfiltered...');
                clearMetaCache();
                result = await getLeadForms(null);
                console.log('[LeadsCenter] Fallback result:', result?.length, 'forms found');
            }
            
            setForms(result || []);
            if (result && result.length > 0) setSelectedFormId(result[0].id);
        } catch (e) {
            console.error('[LeadsCenter] fetchForms error:', e.message);
            if (e.message?.includes('pages_manage_ads') || e.message?.includes('pages_read_engagement')) {
                setError('Token do Meta sem permissão suficiente. Verifique as permissões pages_manage_ads e pages_read_engagement.');
            } else {
                setError(e.message);
            }
        }
        finally { setLoadingForms(false); }
    };

    useEffect(() => {
        if (!selectedFormId) return;
        const form = forms.find(f => f.id === selectedFormId);
        fetchLeads(selectedFormId, form?.pageToken);
    }, [selectedFormId]);

    const fetchLeads = async (formId, pageToken) => {
        setLoadingLeads(true); setLeads([]);
        try {
            const result = await getLeadsByForm(formId, pageToken);
            setLeads(result);
            setLastUpdated(new Date());
        } catch (e) { setError(e.message); }
        finally { setLoadingLeads(false); }
    };

    const handleRefresh = () => {
        const form = forms.find(f => f.id === selectedFormId);
        if (form) fetchLeads(selectedFormId, form.pageToken);
    };

    const handleSendCapi = async (lead) => {
        const leadId = lead.id;
        const status = leadStatuses[leadId];
        if (!status || !STATUS_TO_EVENT_NAME[status]) return;

        const eventName = STATUS_TO_EVENT_NAME[status];
        const email = lead.email || lead.e_mail || '';
        const phone = lead.phone_number || lead.phone || lead.telefone || lead.celular || '';

        if (!email && !phone) {
            setCapiError('Lead sem e-mail ou telefone — não é possível enviar.');
            setTimeout(() => setCapiError(null), 5000);
            return;
        }

        setSendingCapi(s => ({ ...s, [leadId]: true }));
        setCapiError(null);

        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session?.session?.access_token;
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

            const res = await fetch(`${SUPABASE_URL}/functions/v1/send-crm-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ event_name: eventName, lead_email: email, lead_phone: phone, lead_id: leadId }),
            });

            const data = await res.json();
            if (data.success) {
                setSentCapi(s => ({ ...s, [leadId]: status }));
            } else {
                setCapiError(`Erro Meta: ${data.error || 'Desconhecido'}`);
                setTimeout(() => setCapiError(null), 8000);
            }
        } catch (err) {
            setCapiError(`Erro de rede: ${err.message}`);
            setTimeout(() => setCapiError(null), 8000);
        } finally {
            setSendingCapi(s => ({ ...s, [leadId]: false }));
        }
    };

    const columns = useMemo(() => {
        if (!leads || leads.length === 0) return [];
        const keys = new Set();
        leads.forEach(l => Object.keys(l).forEach(k => { if (k !== 'id' && k !== 'created_time') keys.add(k); }));
        return [...keys];
    }, [leads]);

    // Period filtering
    const periodFilteredLeads = useMemo(() => {
        if (period === 'total') return leads;
        const now = new Date();
        let startDate;
        if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === '7d') {
            startDate = new Date(now.getTime() - 7 * 86400000);
        } else if (period === '30d') {
            startDate = new Date(now.getTime() - 30 * 86400000);
        } else if (period === '90d') {
            startDate = new Date(now.getTime() - 90 * 86400000);
        } else if (period === 'custom') {
            const from = customFrom ? new Date(customFrom) : new Date(0);
            const to = customTo ? new Date(customTo + 'T23:59:59') : now;
            return leads.filter(l => {
                const d = new Date(l.created_time);
                return d >= from && d <= to;
            });
        }
        return leads.filter(l => new Date(l.created_time) >= startDate);
    }, [leads, period, customFrom, customTo]);

    const filteredLeads = useMemo(() => {
        if (!search.trim()) return periodFilteredLeads;
        const q = search.toLowerCase();
        return periodFilteredLeads.filter(lead => Object.values(lead).some(v => String(v || '').toLowerCase().includes(q)));
    }, [periodFilteredLeads, search]);

    const todayLeads = useMemo(() => {
        const today = new Date().toDateString();
        return periodFilteredLeads.filter(l => new Date(l.created_time).toDateString() === today).length;
    }, [periodFilteredLeads]);

    const lastLeadTime = leads.length > 0
        ? fmtDate(leads.sort((a, b) => new Date(b.created_time) - new Date(a.created_time))[0]?.created_time)
        : '—';

    const handleExportCSV = () => {
        if (filteredLeads.length === 0) return;
        const headers = ['Data', 'Hora', ...columns.map(labelFor)];
        const rows = filteredLeads.map(lead => {
            const d = new Date(lead.created_time);
            return [
                d.toLocaleDateString('pt-BR'),
                d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                ...columns.map(col => `"${String(lead[col] || '').replace(/"/g, '""')}"`)
            ].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const formName = forms.find(f => f.id === selectedFormId)?.name || 'leads';
        a.href = url;
        a.download = `${formName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const openDetail = (lead, idx) => { setDetailLead(lead); setDetailIdx(idx); };
    const closeDetail = () => { setDetailLead(null); };

    // Close modal on escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') closeDetail(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }} className="fadeup">

            {/* LEAD DETAIL MODAL — rendered via portal to avoid stacking context issues */}
            {detailLead && ReactDOM.createPortal(
                <LeadDetailModal
                    lead={detailLead}
                    idx={detailIdx}
                    columns={columns}
                    onClose={closeDetail}
                    leadStatuses={leadStatuses}
                    setLeadStatuses={setLeadStatuses}
                    sendingCapi={sendingCapi}
                    sentCapi={sentCapi}
                    handleSendCapi={handleSendCapi}
                />,
                document.body
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 6, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 28 }}>💬</span> Central de Leads
                    </h1>
                    <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                        Gerencie e entre em contato direto com seus leads.
                        {lastUpdated && <span style={{ marginLeft: 8, color: C.dim, fontSize: 12 }}>Atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {forms.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedFormId || ''} onChange={e => setSelectedFormId(e.target.value)}
                                style={{
                                    appearance: 'none', background: C.card, border: `1px solid ${C.border}`,
                                    color: C.text, padding: '10px 36px 10px 14px', borderRadius: 12,
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none', maxWidth: 300, fontFamily: 'inherit',
                                }}
                            >
                                {forms.map(f => (<option key={f.id} value={f.id}>{f.name} ({f.pageName})</option>))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                        </div>
                    )}
                    <button onClick={handleRefresh} disabled={loadingLeads || !selectedFormId}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loadingLeads ? 0.6 : 1, transition: 'all .2s', fontFamily: 'inherit' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.primary} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                    >
                        <RefreshCw size={14} style={{ animation: loadingLeads ? 'spin 1s linear infinite' : 'none' }} /> Atualizar
                    </button>
                    <button onClick={handleExportCSV} disabled={filteredLeads.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: filteredLeads.length > 0 ? 'linear-gradient(135deg, #10B981, #059669)' : C.card, border: 'none', color: filteredLeads.length > 0 ? '#fff' : C.muted, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: filteredLeads.length > 0 ? 'pointer' : 'default', opacity: filteredLeads.length === 0 ? 0.5 : 1, transition: 'all .2s', fontFamily: 'inherit' }}
                    >
                        <Download size={14} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* ERRORS */}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>Erro ao carregar dados</div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{error}</div>
                    </div>
                </div>
            )}

            {capiError && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', flex: 1 }}>{capiError}</div>
                    <button onClick={() => setCapiError(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
            )}

            {/* LOADING */}
            {loadingForms && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, color: C.muted }}>
                    <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 14 }}>Buscando formulários de lead...</span>
                </div>
            )}

            {/* EMPTY */}
            {!loadingForms && !error && forms.length === 0 && (
                <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
                    <EmptyState icon={FileText} title="Nenhum formulário encontrado" subtitle="Para usar a Central de Leads, você precisa ter campanhas Lead Ads ativas com formulários nativos no Meta." />
                </div>
            )}

            {/* MAIN */}
            {!loadingForms && forms.length > 0 && (
                <>
                    {/* PERIOD FILTER */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {[
                            { key: 'today', label: 'Hoje' },
                            { key: '7d', label: '7 dias' },
                            { key: '30d', label: '30 dias' },
                            { key: '90d', label: '90 dias' },
                            { key: 'total', label: 'Total' },
                            { key: 'custom', label: '📅 Personalizado' },
                        ].map(p => (
                            <button key={p.key} onClick={() => setPeriod(p.key)}
                                style={{
                                    padding: '8px 16px', borderRadius: 10,
                                    background: period === p.key ? 'rgba(0,255,148,0.12)' : C.card,
                                    border: `1px solid ${period === p.key ? C.primary + '55' : C.border}`,
                                    color: period === p.key ? C.primary : C.muted,
                                    fontSize: 13, fontWeight: period === p.key ? 700 : 600,
                                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                        {period === 'custom' && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                                <span style={{ color: C.muted, fontSize: 12 }}>até</span>
                                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                            </div>
                        )}
                    </div>

                    {/* KPIs */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <KpiCard icon={Users} label="Total de Leads" value={filteredLeads.length} color="#10B981" emoji="👥" />
                        <KpiCard icon={Calendar} label="Leads Hoje" value={todayLeads} color="#22D3EE" emoji="📅" />
                        <KpiCard icon={Clock} label="Último Lead" value={lastLeadTime} color="#A78BFA" emoji="⏰" />
                    </div>

                    {/* SEARCH */}
                    {leads.length > 0 && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
                                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                                <input type="text" placeholder="🔍 Buscar por nome, e-mail, telefone..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, color: C.text, padding: '12px 16px 12px 40px', borderRadius: 14, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                                    onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border}
                                />
                            </div>

                            {selectedFormId && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>📝 {forms.find(f => f.id === selectedFormId)?.name}</span>
                                    {filteredLeads.length !== leads.length && (
                                        <span style={{ fontSize: 12, color: C.muted }}>({filteredLeads.length} de {leads.length})</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* LOADING LEADS */}
                    {loadingLeads && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 14, color: C.muted }}>
                            <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: 14 }}>Carregando leads...</span>
                        </div>
                    )}

                    {/* EMPTY LEADS */}
                    {!loadingLeads && leads.length === 0 && (
                        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
                            <EmptyState icon={Inbox} title="Nenhum lead capturado ainda" subtitle="Quando alguém preencher o formulário, o contato aparecerá aqui 💫" />
                        </div>
                    )}

                    {/* NO RESULTS */}
                    {!loadingLeads && leads.length > 0 && filteredLeads.length === 0 && (
                        <EmptyState icon={Search} title="Nenhum resultado" subtitle="Tente outros termos ou limpe o campo de busca." />
                    )}

                    {/* LEAD CARDS */}
                    {!loadingLeads && filteredLeads.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(380px, 100%), 1fr))', gap: 14 }}>
                            {filteredLeads.map((lead, idx) => (
                                <LeadCard
                                    key={lead.id || idx}
                                    lead={lead} idx={idx} columns={columns}
                                    leadStatuses={leadStatuses} setLeadStatuses={setLeadStatuses}
                                    sendingCapi={sendingCapi} sentCapi={sentCapi} handleSendCapi={handleSendCapi}
                                    onOpenDetail={openDetail}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
