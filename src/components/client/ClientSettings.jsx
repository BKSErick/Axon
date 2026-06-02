import React, { useState, useEffect } from 'react';
import { C } from '../../lib/clientTheme';
import { supabase } from '../../lib/supabase';
import { User, Mail, Shield, LogOut, Camera, Lock, CheckCircle, AlertCircle, Phone, Link2, Info } from 'lucide-react';
import { ConnectFacebookButton } from '../admin/ConnectFacebookButton';
import { ConnectLinkedInButton } from '../admin/ConnectLinkedInButton';

export const ClientSettings = ({ user, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Unified client identifier — prefer user.id (used by ReportsView RPC), fallback to uuid
    const clientId = user?.id || user?.uuid;

    // Profile States
    const [fullName, setFullName] = useState(user?.name || '');
    const [whatsapp, setWhatsapp] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Password States
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });

    // WhatsApp Prefs States
    const [whatsPrefs, setWhatsPrefs] = useState({
        is_active: false,
        report_frequency: 'daily',
        send_time: '08:00',
        weekly_day: 1
    });
    const [whatsPrefsId, setWhatsPrefsId] = useState(null);

    // Load extra data (phone and whatsapp prefs)
    useEffect(() => {
        if (!clientId) return;
        const loadProfileAndPrefs = async () => {
            // Profile Base
            const { data: profile } = await supabase
                .from('profiles')
                .select('phone, avatar_url')
                .eq('id', clientId)
                .single();
            if (profile) {
                setWhatsapp(profile.phone || '');
                setAvatarPreview(profile.avatar_url || null);
            }

            // WhatsApp Prefs
            const { data: prefs } = await supabase
                .from('client_notification_prefs')
                .select('*')
                .eq('client_id', clientId)
                .single();

            if (prefs) {
                setWhatsPrefs({
                    is_active: prefs.is_active,
                    report_frequency: prefs.report_frequency,
                    send_time: (prefs.send_time || '08:00').substring(0, 5), // '08:00:00' -> '08:00'
                    weekly_day: prefs.weekly_day || 1
                });
                setWhatsPrefsId(prefs.id);
            }
        };
        loadProfileAndPrefs();
    }, [clientId]);

    const handleProfileUpdate = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            // 1. Upload do Avatar (Se foi alterado)
            let newAvatarUrl = undefined;
            if (avatar) {
                const fileExt = avatar.name.split('.').pop();
                const fileName = `${clientId}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatar);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                newAvatarUrl = publicUrl;
            }

            // 2. Atualizar Perfil Base
            const updates = {
                full_name: fullName,
                phone: whatsapp
            };
            if (newAvatarUrl) {
                updates.avatar_url = newAvatarUrl;
            }

            const { error: errorProfile } = await supabase.from('profiles').update(updates).eq('id', clientId);
            if (errorProfile) throw errorProfile;

            // 3. Atualizar ou Criar Preferências de WhatsApp
            const parsedPhone = whatsapp.replace(/\D/g, ''); // Somente números
            const prefsPayload = {
                client_id: clientId,
                whatsapp_number: parsedPhone,
                is_active: whatsPrefs.is_active,
                report_frequency: whatsPrefs.report_frequency,
                send_time: whatsPrefs.send_time,
                weekly_day: whatsPrefs.report_frequency === 'weekly' ? whatsPrefs.weekly_day : null
            };

            const { data: newPrefs, error: errorPrefs } = await supabase
                .from('client_notification_prefs')
                .upsert(prefsPayload, { onConflict: 'client_id' })
                .select()
                .single();
            if (errorPrefs) throw errorPrefs;

            if (newPrefs) {
                setWhatsPrefsId(newPrefs.id);
            }

            setMessage({ type: 'success', text: 'Configurações e Perfil atualizados com sucesso!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            return setMessage({ type: 'error', text: 'As senhas não coincidem.' });
        }
        if (passwords.new.length < 6) {
            return setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setPasswords({ new: '', confirm: '' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao trocar senha: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32, paddingBottom: 100 }}>

            {/* Header Area */}
            <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Configurações</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, fontWeight: 600, color: C.muted }}>
                    <span>Início</span>
                    <span>›</span>
                    <span style={{ color: C.primary }}>Perfil do Usuário</span>
                </div>
            </div>

            {/* Notifications Alert (Top Right Floating) */}
            {message.text && (
                <div style={{
                    position: 'fixed', top: 32, right: 32, zIndex: 60,
                    padding: "16px 20px", borderRadius: 12,
                    background: message.type === 'success' ? 'rgba(0, 253, 147, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? C.primary : C.danger}`,
                    color: message.type === 'success' ? C.primary : C.danger,
                    display: "flex", alignItems: "center", gap: 12, fontSize: 14,
                    backdropFilter: 'blur(12px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            {/* Layout Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
                
                {/* Left Column (5fr) */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 32 }}>
                    
                    {/* My Account Card */}
                    <div style={{ background: 'rgba(21, 26, 33, 0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, border: `1px solid rgba(255,255,255,0.05)`, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Minha Conta</h3>
                            <div style={{ background: `${C.primary}15`, padding: 8, borderRadius: 12 }}>
                                <User size={20} color={C.primary} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                            <div style={{ position: 'relative', cursor: 'pointer', borderRadius: 24 }}>
                                <div style={{ width: 128, height: 128, borderRadius: 24, border: `4px solid ${C.card}`, overflow: 'hidden', background: C.gradientPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, color: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', transition: 'all 0.3s ease' }}>
                                    {avatarPreview ? <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.[0]?.toUpperCase() || 'C'}
                                </div>
                                <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', opacity: 0, transition: '0.2s', borderRadius: 24, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                                    <Camera size={32} color="#fff" />
                                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p style={{ marginTop: 16, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted }}>Avatar do Usuário</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>Nome Completo</label>
                                <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 12, padding: 16, color: C.text, fontSize: 14, outline: 'none', transition: '0.2s' }} onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}40`} onBlur={e => e.currentTarget.style.boxShadow = 'none'} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>E-mail (Leitura)</label>
                                <div style={{ position: 'relative' }}>
                                    <input value={user?.email || ''} readOnly style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: 'none', borderRadius: 12, padding: 16, color: C.muted, fontSize: 14, outline: 'none', cursor: 'not-allowed' }} />
                                    <Lock size={16} color={C.muted} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div style={{ background: 'rgba(21, 26, 33, 0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, border: `1px solid rgba(255,255,255,0.05)`, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Segurança</h3>
                            <div style={{ background: `${C.primary}15`, padding: 8, borderRadius: 12 }}>
                                <Shield size={20} color={C.primary} />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>Nova Senha</label>
                                <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 12, padding: 16, color: C.text, fontSize: 14, outline: 'none', transition: '0.2s' }} onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}40`} onBlur={e => e.currentTarget.style.boxShadow = 'none'} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>Confirmar Senha</label>
                                <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 12, padding: 16, color: C.text, fontSize: 14, outline: 'none', transition: '0.2s' }} onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}40`} onBlur={e => e.currentTarget.style.boxShadow = 'none'} />
                            </div>
                            <button onClick={handlePasswordChange} disabled={loading || !passwords.new} style={{ width: '100%', padding: '16px 0', background: 'rgba(255,255,255,0.05)', color: C.text, fontWeight: 800, borderRadius: 12, border: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                Atualizar Senha
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <button
                            onClick={onLogout}
                            style={{ color: C.danger, background: "transparent", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        >
                            <LogOut size={16} /> Sair da Conta Agora
                        </button>
                    </div>

                </div>

                {/* Right Column (7fr) */}
                <div style={{ flex: '1.4 1 450px', display: 'flex', flexDirection: 'column', gap: 32 }}>

                    {/* Social Connections */}
                    <FacebookConnectionSection user={user} />

                    {/* LinkedIn Connection */}
                    <LinkedInConnectionSection user={user} />

                    {/* WhatsApp Reports */}
                    <div style={{ background: 'rgba(21, 26, 33, 0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, border: `1px solid rgba(255,255,255,0.05)`, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Relatórios WhatsApp</h3>
                                <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Receba atualizações do seu painel no celular.</p>
                            </div>
                            <Toggle active={whatsPrefs.is_active} onClick={() => setWhatsPrefs({ ...whatsPrefs, is_active: !whatsPrefs.is_active })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 24, opacity: whatsPrefs.is_active ? 1 : 0.4, pointerEvents: whatsPrefs.is_active ? 'auto' : 'none', transition: '0.3s' }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>Número do WhatsApp</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: C.primary, fontSize: 12, fontWeight: 800 }}>+55</span>
                                    <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 98765-4321" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 12, padding: '16px 16px 16px 48px', color: C.text, fontSize: 14, outline: 'none', transition: '0.2s' }} onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}40`} onBlur={e => e.currentTarget.style.boxShadow = 'none'} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>Frequência</label>
                                    <select value={whatsPrefs.report_frequency} onChange={e => setWhatsPrefs({...whatsPrefs, report_frequency: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 12, padding: 16, color: C.text, fontSize: 14, outline: 'none', transition: '0.2s', WebkitAppearance: 'none', appearance: 'none' }} onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}40`} onBlur={e => e.currentTarget.style.boxShadow = 'none'}>
                                        <option value="daily">Diário</option>
                                        <option value="weekly">Semanal</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>Horário (Fuso BSB)</label>
                                    <input type="time" value={whatsPrefs.send_time} onChange={e => setWhatsPrefs({...whatsPrefs, send_time: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 12, padding: 16, color: C.text, fontSize: 14, outline: 'none', transition: '0.2s' }} onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}40`} onBlur={e => e.currentTarget.style.boxShadow = 'none'} />
                                </div>
                            </div>

                            {whatsPrefs.report_frequency === 'weekly' && (
                                <div style={{ animation: 'fadeup 0.3s ease-out' }}>
                                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginLeft: 4, marginBottom: 8, display: 'block' }}>Qual dia da semana?</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setWhatsPrefs({ ...whatsPrefs, weekly_day: idx + 1 })}
                                                style={{
                                                    padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    background: whatsPrefs.weekly_day === idx + 1 ? `${C.primary}20` : 'rgba(255,255,255,0.03)',
                                                    color: whatsPrefs.weekly_day === idx + 1 ? C.primary : C.muted,
                                                    border: `1px solid ${whatsPrefs.weekly_day === idx + 1 ? C.primary : 'transparent'}`
                                                }}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>

            {/* Floating Glass Save Bar */}
            <div style={{ position: 'sticky', bottom: 32, left: 0, right: 0, zIndex: 30, marginTop: 16 }}>
                <div style={{ backdropFilter: 'blur(16px)', background: 'rgba(21, 26, 33, 0.85)', borderRadius: 24, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid rgba(255,255,255,0.08)`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: C.primary, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: `${C.primary}15`, fontWeight: 800 }}>
                           <Info size={16} />
                        </span>
                        <p style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Alterações não salvas serão perdidas ao sair.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginLeft: 'auto' }}>
                        <button onClick={() => window.location.reload()} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}>Descartar</button>
                        <button onClick={handleProfileUpdate} disabled={loading} style={{ background: `linear-gradient(to right, ${C.primary}, #00ED89)`, color: '#004624', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0, 253, 147, 0.25)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            {loading ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

const FacebookConnectionSection = ({ user }) => {
    const [connection, setConnection] = useState(null);
    const [loadingConn, setLoadingConn] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);

    const clientId = user?.id || user?.uuid;

    const loadConnection = async () => {
        if (!clientId) return;
        try {
            const { data } = await supabase
                .from('client_meta_connections')
                .select('*')
                .eq('client_id', clientId)
                .eq('status', 'active')
                .order('connected_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            setConnection(data);
        } catch (e) {
            console.warn('[Settings] loadConnection error:', e);
        } finally {
            setLoadingConn(false);
        }
    };

    useEffect(() => { loadConnection(); }, [clientId]);

    const handleDisconnect = async () => {
        if (!connection) return;
        const ok = window.confirm('Desconectar sua conta do Facebook/Instagram? Você poderá reconectar a qualquer momento.');
        if (!ok) return;
        setDisconnecting(true);
        try {
            await supabase
                .from('client_meta_connections')
                .update({ status: 'revoked' })
                .eq('id', connection.id);
            setConnection(null);
        } catch (e) {
            alert('Erro ao desconectar: ' + e.message);
        } finally {
            setDisconnecting(false);
        }
    };

    if (loadingConn) return null;

    return (
        <div style={{ background: 'rgba(21, 26, 33, 0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, border: `1px solid rgba(255,255,255,0.05)`, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: `${C.primary}15`, filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, position: 'relative', zIndex: 1 }}>
                <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Conexões Sociais</h3>
                    
                    {connection ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                            <div style={{ display: 'flex', position: 'relative', width: 8, height: 8 }}>
                                <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: C.primary, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                                <span style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: C.primary }} />
                            </div>
                            <p style={{ fontSize: 10, fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conectado como {connection.meta_user_name}</p>
                        </div>
                    ) : (
                        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Conecte sua conta para métricas orgânicas, leads e automações.</p>
                    )}
                </div>

                {connection && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => loadConnection()} disabled={loadingConn} style={{ padding: '10px 24px', background: `${C.primary}20`, color: C.primary, border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: '0.2s', boxShadow: `0 4px 10px ${C.primary}10` }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            Refresh
                        </button>
                        <button onClick={handleDisconnect} disabled={disconnecting} style={{ padding: '10px 24px', background: 'transparent', color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = `${C.danger}15`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {disconnecting ? 'Wait...' : 'Disconnect'}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {connection ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        
                        {connection.pages?.map(p => (
                            <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 12 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#3B82F6"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text }}>Página Facebook</h4>
                                    <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{p.name}</p>
                                </div>
                            </div>
                        ))}

                        {connection.instagram_accounts?.map(ig => (
                            <div key={ig.id} style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{ padding: 12, background: 'rgba(236, 72, 153, 0.1)', borderRadius: 12 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#EC4899"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07s-3.585-.015-4.85-.074c-1.17-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text }}>Instagram Business</h4>
                                    <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>@{ig.username}</p>
                                </div>
                            </div>
                        ))}

                    </div>
                ) : (
                    <div style={{ marginTop: 24 }}>
                        <ConnectFacebookButton clientId={clientId} onConnected={() => loadConnection()} />
                    </div>
                )}
            </div>
        </div>
    );
};

const LinkedInConnectionSection = ({ user }) => {
    const clientId = user?.id || user?.uuid;

    return (
        <div style={{ background: 'rgba(21, 26, 33, 0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, border: `1px solid rgba(255,255,255,0.05)`, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(0,119,181,0.08)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative', zIndex: 1 }}>
                <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Conexão LinkedIn</h3>
                    <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Acesse métricas da Company Page e anúncios do LinkedIn.</p>
                </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <ConnectLinkedInButton clientId={clientId} onConnected={() => {}} />
            </div>
        </div>
    );
};

const Toggle = ({ active, onClick }) => (
    <div
        onClick={onClick}
        style={{
            width: 56, height: 28, borderRadius: 14,
            background: active ? `${C.primary}30` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${active ? C.primary : 'rgba(255,255,255,0.1)'}`,
            position: "relative", cursor: "pointer", transition: "all .3s ease"
        }}
    >
        <div style={{
            width: 20, height: 20, borderRadius: "50%", background: active ? C.primary : '#888',
            position: "absolute", top: 3, left: active ? 31 : 3,
            transition: "all .3s ease",
            boxShadow: active ? `0 0 10px ${C.primary}` : 'none'
        }} />
    </div>
);
