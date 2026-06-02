import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { C } from '../../lib/clientTheme';
import { Sparkles, X, Send, ChevronDown } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const SUGGESTIONS = [
    'Como estão minhas campanhas esta semana?',
    'Qual campanha está trazendo mais leads?',
    'Meu CPA está bom?',
    'O que podemos melhorar nos anúncios?',
    'Qual meu ROI estimado?',
];

// Remove markdown residual que a IA por ventura envie
const cleanMarkdown = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
        .replace(/\*(.*?)\*/g, '$1')         // *italic*
        .replace(/__(.*?)__/g, '$1')         // __bold__
        .replace(/_(.*?)_/g, '$1')           // _italic_
        .replace(/^#+\s/gm, '')              // # headings
        .replace(/^[-•]\s/gm, '→ ')         // - listas → ícone neutro
        .replace(/^\d+\.\s/gm, '')           // 1. listas numeradas
        .trim();
};

const Bubble = ({ msg }) => {
    const isAI = msg.role === 'model';
    return (
        <div style={{
            display: 'flex',
            justifyContent: isAI ? 'flex-start' : 'flex-end',
            marginBottom: 12,
        }}>
            {isAI && (
                <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00DF81, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 8, flexShrink: 0, marginTop: 2
                }}>
                    <Sparkles size={14} color="#000" />
                </div>
            )}
            <div style={{
                maxWidth: '78%',
                background: isAI ? 'rgba(0,223,129,0.08)' : 'rgba(56,189,248,0.12)',
                border: `1px solid ${isAI ? 'rgba(0,223,129,0.2)' : 'rgba(56,189,248,0.2)'}`,
                borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                padding: '10px 14px',
                fontSize: 13.5,
                lineHeight: 1.55,
                color: C.text,
                whiteSpace: 'pre-wrap',
            }}>
                {isAI ? cleanMarkdown(msg.content) : msg.content}
            </div>
        </div>
    );
};

const TypingIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00DF81, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Sparkles size={14} color="#000" />
        </div>
        <div style={{
            background: 'rgba(0,223,129,0.08)', border: '1px solid rgba(0,223,129,0.2)',
            borderRadius: '4px 16px 16px 16px', padding: '12px 16px',
            display: 'flex', gap: 5, alignItems: 'center',
        }}>
            {[0, 1, 2].map(i => (
                <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#00DF81',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
            ))}
        </div>
    </div>
);

export const MetaAIChat = ({ clientId }) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', content: '👋 Olá! Eu sou a Grow, sua gestora de tráfego pago. Tenho acesso em tempo real aos dados da sua conta Meta e posso responder qualquer dúvida sobre suas campanhas, investimento, leads e muito mais!\n\nComo posso te ajudar hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, messages]);

    const sendMessage = async (text = input) => {
        const question = text.trim();
        if (!question || loading) return;

        const userMsg = { role: 'user', content: question };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        // Build history (excluding the welcome message)
        const history = newMessages.slice(1, -1).map(m => ({
            role: m.role,
            content: m.content
        }));

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(`${SUPABASE_URL}/functions/v1/meta-ai-analyst`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ client_id: clientId, question, history }),
            });

            const data = await res.json();

            if (data.error || !data.reply) {
                setMessages(prev => [...prev, { role: 'model', content: '⚠️ Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em instantes.' }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', content: '⚠️ Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.' }]);
        }

        setLoading(false);
    };

    return (
        <>
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-6px); opacity: 1; }
                }
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(0,223,129,0.4); }
                    50% { box-shadow: 0 0 0 12px rgba(0,223,129,0); }
                }
            `}</style>

            {/* Floating Button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    style={{
                        position: 'fixed', bottom: 32, right: 32, zIndex: 1000,
                        background: 'linear-gradient(135deg, #00DF81, #06b6d4)',
                        border: 'none', borderRadius: '50%', width: 60, height: 60,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,223,129,0.4)',
                        animation: 'pulseGlow 2.5s ease-in-out infinite',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title="Perguntar para a Grow"
                >
                    <Sparkles size={26} color="#000" />
                </button>
            )}

            {/* Chat Window */}
            {open && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
                    width: 400, height: 560,
                    background: 'rgba(10,10,12,0.97)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,223,129,0.2)',
                    borderRadius: 24,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,223,129,0.1)',
                    animation: 'chatSlideUp 0.25s ease-out',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(0,223,129,0.12), rgba(6,182,212,0.08))',
                        borderBottom: '1px solid rgba(0,223,129,0.15)',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00DF81, #06b6d4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Sparkles size={18} color="#000" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Grow</div>
                            <div style={{ fontSize: 11, color: '#00DF81', fontWeight: 600 }}>● Online • Gestora de Tráfego</div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 8, transition: '0.2s', display: 'flex' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                        {loading && <TypingIndicator />}
                        <div ref={bottomRef} />
                    </div>

                    {/* Suggestions (show only at start) */}
                    {messages.length <= 1 && !loading && (
                        <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(s)}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 20, padding: '5px 12px', fontSize: 11.5, fontWeight: 600,
                                        color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: '0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,223,129,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,223,129,0.3)'; e.currentTarget.style.color = '#00DF81'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{
                        padding: '10px 12px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', gap: 8, alignItems: 'flex-end',
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Pergunte sobre suas campanhas..."
                            rows={1}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
                                padding: '10px 14px', color: '#fff', fontSize: 13.5,
                                outline: 'none', resize: 'none', fontFamily: 'inherit',
                                maxHeight: 100, overflowY: 'auto', lineHeight: 1.5,
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(0,223,129,0.4)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            style={{
                                width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
                                background: input.trim() && !loading ? 'linear-gradient(135deg, #00DF81, #06b6d4)' : 'rgba(255,255,255,0.08)',
                                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                color: input.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
                            }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
