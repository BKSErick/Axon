import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { C, fmtBRL } from '../data/db';
import { Avatar, Btn, Field, Input } from './Common';

export const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode] = useState("login");
    const [err, setErr] = useState("");

    const handleSubmit = async () => {
        if (!email || !pass) { setErr("Preencha e-mail e senha"); return; }
        setErr("");
        setLoading(true);

        try {
            console.log("Iniciando processo de autenticação...");

            const authRequest = supabase.auth.signInWithPassword({ email, password: pass });

            // 20 second timeout for harsh environments
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("O servidor não respondeu a tempo (20s). Tente recarregar a página ou usar outro navegador.")), 20000)
            );

            const { data, error } = await Promise.race([authRequest, timeout]);

            if (error) throw error;

            console.log("Auth finalizada com sucesso!");
        } catch (error) {
            console.error("Erro na autenticação:", error);
            setErr(error.message);
            alert("Erro: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 420 }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px", display: "block", objectFit: "cover" }}
                    />
                    <div style={{ color: C.text, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>MetaReports</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Plataforma de relatórios para agências</div>
                </div>
                <div style={{ background: C.card, borderRadius: 20, padding: "28px 28px 24px", border: `1px solid ${C.border}` }}>
                    {err && (
                        <div style={{
                            background: "rgba(255,77,114,.08)",
                            border: `1px solid rgba(255,77,114,.2)`,
                            borderRadius: 10,
                            padding: "10px 14px",
                            marginBottom: 16,
                            color: C.red,
                            fontSize: 12,
                            fontWeight: 600,
                            lineHeight: "1.4"
                        }}>
                            ⚠ {err}
                        </div>
                    )}
                    <Field label="E-mail"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" /></Field>
                    <Field label="Senha" ><Input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" /></Field>

                    <Btn
                        full
                        onClick={handleSubmit}
                        loading={loading}
                    >
                        Entrar
                    </Btn>

                    <div style={{ marginTop: 20, textAlign: "center", color: C.dim, fontSize: 11 }}>
                        Acesso criado pelo seu gestor de performance
                    </div>

                </div>
            </div>
        </div>
    );
};

import { LogOut, AlertCircle, Menu } from 'lucide-react';

export const TopBar = ({ title, onLogout, role, onMenuClick }) => {
    const [unlinked, setUnlinked] = useState(0);

    useEffect(() => {
        if (role === "admin") {
            supabase.from('ad_accounts').select('id', { count: 'exact', head: true }).is('client_id', null)
                .then(({ count }) => setUnlinked(count || 0));
        }
    }, [role]);

    return (
        <div style={{
            height: 72,
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 20,
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(12px)'
        }}>
            <button
                onClick={onMenuClick}
                style={{
                    display: window.innerWidth < 1024 ? 'flex' : 'none',
                    background: 'var(--surf)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 8,
                    color: 'var(--text)',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Menu size={20} />
            </button>

            <div style={{ flex: 1, color: "var(--text)", fontWeight: 800, fontSize: 18, letterSpacing: '-0.4px' }}>{title}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {role === "admin" && unlinked > 0 && (
                    <div style={{
                        display: 'none', // Hide on small mobile if needed, or keep
                        alignItems: 'center',
                        gap: 8,
                        background: "rgba(245,158,11,.1)",
                        color: "var(--amber)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: '1px solid rgba(245,158,11,.2)',
                        whiteSpace: 'nowrap'
                    }} className="desktop-only">
                        <AlertCircle size={14} />
                        {unlinked} conta{unlinked > 1 ? "s" : ""} pendente{unlinked > 1 ? "s" : ""}
                    </div>
                )}

                <div style={{ width: 1, height: 24, background: "var(--border)", margin: '0 4px' }} className="desktop-only" />

                <button
                    onClick={onLogout}
                    className="btn-g"
                    style={{
                        padding: "8px 14px",
                        fontSize: 12,
                        gap: 8,
                        borderColor: 'transparent',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: 'var(--red)',
                        opacity: 0.8
                    }}
                >
                    <LogOut size={14} />
                    <span className="desktop-only">Sair</span>
                </button>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                }
            `}</style>
        </div>
    );
};

