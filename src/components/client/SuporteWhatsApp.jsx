import React, { useState } from 'react';
import { C } from '../../lib/clientTheme';
import {
    MessageCircle, Clock, CheckCircle2, ChevronDown, ChevronUp,
    Zap, Target, BarChart2, PauseCircle, DollarSign, Users,
    RefreshCw, Image as ImageIcon,
} from 'lucide-react';

// ─── Config ────────────────────────────────────────────────────────────────
const SUPPORT_PHONE = '5511998577077';
const SUPPORT_NAME  = 'BackstageFY';
const WA_GREEN      = '#25D366';

const getWhatsAppUrl = (phone, message = '') =>
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

const isBusinessHours = () => {
    const now = new Date();
    const day  = now.getDay();  // 0=Dom, 6=Sab
    const hour = now.getHours();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
};

// ─── Dados ─────────────────────────────────────────────────────────────────
const TOPICS = [
    { icon: BarChart2,   label: 'Resultado da Campanha',  msg: 'Olá! Gostaria de entender melhor os resultados da minha campanha atual.' },
    { icon: DollarSign,  label: 'Ajuste de Verba',        msg: 'Olá! Preciso ajustar o investimento mensal das minhas campanhas.' },
    { icon: ImageIcon,   label: 'Novo Criativo',          msg: 'Olá! Quero solicitar a criação de um novo criativo para minha campanha.' },
    { icon: Target,      label: 'Explorar Novo Público',  msg: 'Olá! Gostaria de explorar novos públicos para minhas campanhas.' },
    { icon: PauseCircle, label: 'Pausar Campanha',        msg: 'Olá! Preciso pausar uma das minhas campanhas com urgência.' },
    { icon: RefreshCw,   label: 'Mudar Estratégia',       msg: 'Olá! Quero conversar sobre uma mudança de estratégia nas campanhas.' },
];

const FAQS = [
    { q: 'Em quanto tempo recebo retorno?',              a: 'Nosso SLA é de até 2 horas em horário comercial (Seg–Sex, 9h–18h). Mensagens fora deste horário são respondidas no próximo dia útil.' },
    { q: 'Como acompanho os resultados em tempo real?',  a: 'Pelo Dashboard — a aba "Visão Geral" mostra métricas atualizadas diariamente com dados diretos da Meta.' },
    { q: 'Posso solicitar um relatório personalizado?',  a: 'Sim! Acesse "Relatórios" → "Exportar PDF". Para análises customizadas, fale conosco pelo WhatsApp.' },
    { q: 'Como funciona a criação de criativos?',        a: 'Solicite pelo WhatsApp, criamos o material em até 48 horas úteis e enviamos para aprovação antes de publicar.' },
    { q: 'Posso ajustar minha verba a qualquer momento?', a: 'Sim. Ajustes de verba levam até 24 horas para entrar em vigor na plataforma da Meta.' },
];

// ─── Sub-componentes ────────────────────────────────────────────────────────
const StatusDot = ({ online }) => (
    <span style={{
        display:      'inline-block',
        width:        10,
        height:       10,
        borderRadius: '50%',
        background:   online ? WA_GREEN : C.muted,
        boxShadow:    online ? `0 0 8px ${WA_GREEN}` : 'none',
        flexShrink:   0,
    }} />
);

const SlaCard = ({ icon: Icon, label, value, sub, color }) => (
    <div style={{
        background:   C.card,
        borderRadius: 18,
        border:       `1px solid ${C.border}`,
        padding:      '20px 24px',
        display:      'flex',
        alignItems:   'flex-start',
        gap:          14,
    }}>
        <div style={{
            width:          40,
            height:         40,
            borderRadius:   12,
            background:     `${color}20`,
            color,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
        }}>
            <Icon size={20} />
        </div>
        <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 12, color: C.dim }}>{sub}</div>
        </div>
    </div>
);

const TopicCard = ({ icon: Icon, label, msg }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <a
            href={getWhatsAppUrl(SUPPORT_PHONE, msg)}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'flex-start',
                gap:            10,
                background:     hovered ? `${WA_GREEN}08` : C.surf,
                borderRadius:   16,
                border:         `1px solid ${hovered ? `${WA_GREEN}40` : C.border}`,
                padding:        '18px 20px',
                textDecoration: 'none',
                cursor:         'pointer',
                transition:     'border 0.15s, background 0.15s',
            }}
        >
            <div style={{
                width:          36,
                height:         36,
                borderRadius:   10,
                background:     `${WA_GREEN}18`,
                color:          WA_GREEN,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
            }}>
                <Icon size={18} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{label}</span>
            <span style={{ fontSize: 11, color: hovered ? WA_GREEN : C.muted, fontWeight: 600, transition: 'color 0.15s' }}>
                Abrir WhatsApp →
            </span>
        </a>
    );
};

const FaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div
            onClick={() => setOpen(o => !o)}
            style={{
                background:   open ? `${WA_GREEN}08` : C.surf,
                borderRadius: 14,
                border:       `1px solid ${open ? `${WA_GREEN}28` : C.border}`,
                cursor:       'pointer',
                overflow:     'hidden',
                transition:   'background 0.15s, border 0.15s',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{q}</span>
                {open
                    ? <ChevronUp size={16} color={C.muted} style={{ flexShrink: 0 }} />
                    : <ChevronDown size={16} color={C.muted} style={{ flexShrink: 0 }} />}
            </div>
            {open && (
                <div style={{ padding: '0 20px 16px', fontSize: 14, color: C.muted, lineHeight: 1.65 }}>
                    {a}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const SuporteWhatsApp = () => {
    const online = isBusinessHours();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 60 }} className="fadeup">

            {/* ── HERO ── */}
            <div style={{
                background:    'linear-gradient(140deg, rgba(37,211,102,0.13) 0%, rgba(0,224,255,0.05) 100%)',
                borderRadius:  24,
                border:        `1px solid rgba(37,211,102,0.22)`,
                padding:       '44px 44px',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'space-between',
                gap:           32,
                flexWrap:      'wrap',
                position:      'relative',
                overflow:      'hidden',
            }}>
                {/* bg decoration */}
                <div style={{ position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)', opacity: 0.04, pointerEvents: 'none' }}>
                    <MessageCircle size={160} />
                </div>

                {/* left copy */}
                <div style={{ flex: 1, minWidth: 260, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <StatusDot online={online} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: online ? WA_GREEN : C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {online ? 'Equipe Online Agora' : 'Fora do Horário Comercial'}
                        </span>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
                        Suporte via <span style={{ color: WA_GREEN }}>WhatsApp</span>
                    </h1>
                    <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 440 }}>
                        Fale diretamente com seu time de performance. Estratégia, criativos, verba, resultados — tudo resolvido em uma mensagem.
                    </p>
                </div>

                {/* right CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 }}>
                    <CtaButton
                        href={getWhatsAppUrl(SUPPORT_PHONE, 'Olá! Preciso de suporte com minha conta.')}
                        label="Abrir WhatsApp"
                        icon={<MessageCircle size={20} />}
                    />
                    <div style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>
                        Seg–Sex, 9h às 18h · SLA 2h
                    </div>
                </div>
            </div>

            {/* ── SLA CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <SlaCard icon={Zap}          label="Resposta"         value="≤ 2 horas"   sub="Em horário comercial"  color="#F59E0B" />
                <SlaCard icon={Clock}        label="Atendimento"      value="Seg–Sex"     sub="Das 9h00 às 18h00"     color={C.secondary} />
                <SlaCard icon={CheckCircle2} label="Satisfação"       value="98%"         sub="Média histórica"       color={WA_GREEN} />
                <SlaCard icon={Users}        label="Equipe Dedicada"  value="1 gestor"    sub="Exclusivo para você"   color={C.primary} />
            </div>

            {/* ── TOPICS + FAQ ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>

                {/* Quick Topics */}
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>Precisa de ajuda com...</h2>
                    <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
                        Clique no assunto e o WhatsApp abre com a mensagem pronta.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {TOPICS.map((t, i) => <TopicCard key={i} {...t} />)}
                    </div>
                </div>

                {/* FAQ */}
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>Dúvidas Frequentes</h2>
                    <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
                        Respostas rápidas para as perguntas mais comuns.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {FAQS.map((f, i) => <FaqItem key={i} {...f} />)}
                    </div>
                </div>
            </div>

            {/* ── FOOTER NOTE ── */}
            <div style={{
                background:   C.surf,
                borderRadius: 14,
                border:       `1px solid ${C.border}`,
                padding:      '16px 24px',
                display:      'flex',
                alignItems:   'center',
                gap:          12,
                fontSize:     13,
                color:        C.dim,
            }}>
                <CheckCircle2 size={16} color={WA_GREEN} style={{ flexShrink: 0 }} />
                <span>
                    Todas as conversas são atendidas pela equipe{' '}
                    <strong style={{ color: C.text }}>{SUPPORT_NAME}</strong>{' '}
                    — real, humana, especializada no seu negócio.
                </span>
            </div>
        </div>
    );
};

// ─── CTA Button helper (stateful hover) ────────────────────────────────────
const CtaButton = ({ href, label, icon }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                background:     WA_GREEN,
                color:          '#fff',
                fontWeight:     800,
                fontSize:       15,
                padding:        '14px 32px',
                borderRadius:   14,
                textDecoration: 'none',
                boxShadow:      hovered ? `0 10px 32px rgba(37,211,102,0.55)` : `0 4px 20px rgba(37,211,102,0.3)`,
                transform:      hovered ? 'translateY(-2px)' : 'translateY(0)',
                transition:     'transform 0.15s, box-shadow 0.15s',
                whiteSpace:     'nowrap',
            }}
        >
            {icon}
            {label}
        </a>
    );
};
