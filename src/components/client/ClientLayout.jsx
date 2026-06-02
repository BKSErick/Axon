import React, { useState, useEffect } from 'react';
import { C } from '../../lib/clientTheme';
import { LayoutDashboard, Megaphone, FileText, ShoppingBag, Settings, MessageCircle, Menu, X, LogOut, ChevronDown, ChevronLeft, Download, Inbox, RefreshCw, Smartphone } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import { clearMetaCache } from '../../lib/meta';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
    <div
        onClick={onClick}
        className={`nav-btn${active ? ' active' : ''}`}
        style={{
            margin: '2px 0',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 'var(--space-2)' : 'var(--space-2) var(--space-4)',
            borderLeft: active ? `3px solid var(--color-primary)` : '3px solid transparent',
            borderRadius: active ? '0 var(--radius-md) var(--radius-md) 0' : 'var(--radius-md)',
        }}
        title={collapsed ? label : undefined}
    >
        <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
        {!collapsed && (
            <span style={{
                fontSize: 'var(--text-sm)',
                fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {label}
            </span>
        )}
    </div>
);

const TAB_TITLES = {
    dashboard:   'Visão Geral',
    campaigns:   'Campanhas',
    leads:       'Central de Leads',
    social_media:'Social Media',
    reports:     'Relatórios',
    settings:    'Configurações',
    support:     'Suporte',
};

export const ClientLayout = ({ children, user, onLogout, onBackToAdmin }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeTab, setActiveTabRaw] = useState(() => sessionStorage.getItem('client_activeTab') || 'dashboard');
    const setActiveTab = (tab) => {
        sessionStorage.setItem('client_activeTab', tab);
        setActiveTabRaw(tab);
        setMobileOpen(false); // fecha sidebar no mobile ao navegar
    };
    const [realClient, setRealClient] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Fecha sidebar mobile ao redimensionar para desktop
    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleExportPDF = async () => {
        // Agora busca o template A4 escondido e não a tela!
        const input = document.getElementById('pdf-report-template');
        if (!input) {
            alert("Aguarde o carregamento completo do dashboard para gerar o PDF.");
            return;
        }

        setIsExporting(true);
        try {
            const canvas = await html2canvas(input, {
                scale: 2, // Melhor qualidade
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');

            // A4 page setup
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Relatorio_Performance_${user?.name || 'Cliente'}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Não foi possível gerar o PDF. Verifique o console.");
        } finally {
            setIsExporting(false);
        }
    };

    React.useEffect(() => {
        if (!user?.id || user.id === 'admin') return;
        const fetchRealClient = async () => {
            const { data } = await supabase.from('clients').select('name, ad_accounts(meta_id)').eq('id', user.id).single();
            if (data) setRealClient(data);
        };
        fetchRealClient();
    }, [user?.id]);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
        { id: 'leads', label: 'Central de Leads', icon: Inbox },
        { id: 'social_media', label: 'Social Media', icon: Smartphone },
        { id: 'reports', label: 'Relatórios', icon: FileText },
        { id: 'settings', label: 'Configurações', icon: Settings },
        { id: 'support', label: 'Suporte WhatsApp', icon: MessageCircle },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "var(--font-family)" }}>

            {/* OVERLAY MOBILE — fecha sidebar ao clicar fora */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="sidebar-mobile-overlay active"
                />
            )}

            {/* SIDEBAR */}
            <div
                className={`client-sidebar${mobileOpen ? ' mobile-open' : ''}`}
                style={{
                    width: collapsed ? 80 : 260,
                    background: C.card,
                    borderRight: `1px solid var(--color-border)`,
                    display: "flex",
                    flexDirection: "column",
                    transition: "width 0.3s ease, transform 0.3s ease",
                    position: "fixed",
                    height: "100vh",
                    zIndex: 300,
                }}
            >
                {/* Logo Area */}
                <div style={{ padding: collapsed ? 'var(--space-5) var(--space-2)' : 'var(--space-5) var(--space-5) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 'var(--space-2)' }}>
                        {!collapsed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                {/* Ícone da marca */}
                                <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: 14, fontWeight: 'var(--fw-black)', color: '#000' }}>M</span>
                                </div>
                                <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-black)', letterSpacing: 'var(--tracking-wide)', background: 'linear-gradient(135deg, var(--color-text) 40%, var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    METAREPORTS
                                </span>
                            </div>
                        )}
                        {collapsed && (
                            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 16, fontWeight: 'var(--fw-black)', color: '#000' }}>M</span>
                            </div>
                        )}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)', display: 'flex', flexShrink: 0 }}
                            title={collapsed ? 'Expandir' : 'Recolher'}
                        >
                            <Menu size={18} />
                        </button>
                    </div>

                    {!collapsed && realClient && (
                        <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-0)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-muted)' }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {realClient.name}
                            </div>
                            {realClient.ad_accounts?.[0]?.meta_id && (
                                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-disabled)', marginTop: 2, fontFamily: 'monospace', letterSpacing: 'var(--tracking-wide)' }}>
                                    ID: {realClient.ad_accounts[0].meta_id}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Menu */}
                <div style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
                    {menuItems.map(item => (
                        <SidebarItem
                            key={item.id}
                            {...item}
                            active={activeTab === item.id}
                            collapsed={collapsed}
                            onClick={() => setActiveTab(item.id)}
                        />
                    ))}
                </div>

                {/* User Profile Footer */}
                <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', overflow: 'hidden' }}>
                        {/* Avatar */}
                        <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--color-primary-dim), var(--color-accent-dim))',
                            border: '1px solid var(--color-primary-dim)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-black)', color: 'var(--color-primary)',
                        }}>
                            {(realClient?.name?.[0] || user?.name?.[0] || 'C').toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text)' }}>
                                    {realClient?.name || user?.name || 'Cliente'}
                                </div>
                                <button
                                    onClick={onLogout}
                                    style={{ background: 'none', border: 'none', padding: 0, fontSize: 'var(--text-xs)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 2, fontFamily: 'inherit' }}
                                >
                                    <LogOut size={10} /> Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="client-main" style={{ flex: 1, marginLeft: collapsed ? 80 : 260, transition: "margin-left 0.3s ease", display: "flex", flexDirection: "column" }}>

                {onBackToAdmin && (
                    <div style={{
                        background: 'rgba(234, 179, 8, 0.15)',
                        borderBottom: '1px solid rgba(234, 179, 8, 0.4)',
                        color: '#fff',
                        padding: '10px 32px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                        fontSize: 13,
                        zIndex: 60,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>⚠️</span>
                            <span style={{ color: '#fff' }}>Modo Auditoria: Você está visualizando o painel exatamente como o cliente vê.</span>
                        </div>
                        <button
                            onClick={onBackToAdmin}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                color: '#fff',
                                padding: '6px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'background .2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <ChevronLeft size={16} />
                            Voltar ao Painel Admin
                        </button>
                    </div>
                )}

                {/* HEADER */}
                <div style={{
                    height: 72,
                    borderBottom: `1px solid var(--color-border)`,
                    background: `${C.bg}e6`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 var(--space-8)",
                    gap: "var(--space-4)",
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        {/* Hamburger — só aparece em mobile via CSS */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setMobileOpen(o => !o)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', padding: 'var(--space-1)', display: 'none' }}
                            aria-label="Abrir menu"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-tight)', lineHeight: 1 }}>
                                {TAB_TITLES[activeTab] || 'Dashboard'}
                            </h1>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 3 }}>Última atualização: Hoje, 14:30</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: 'center' }}>
                        {/* Quick Filters Mockup */}
                        <button
                            onClick={() => { clearMetaCache(); window.location.reload(); }}
                            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 16px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: 'all 0.2s' }}
                            title="Clique para atualizar dados"
                        >
                            <RefreshCw size={14} />
                            Dados Sincronizados
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            style={{ background: isExporting ? C.muted : C.primary, color: "#000", border: "none", padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: isExporting ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
                        >
                            <Download size={16} />
                            {isExporting ? "Gerando PDF..." : "Exportar PDF"}
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div id="pdf-content" className="content-area" style={{ flex: 1 }}>
                    {React.Children.map(children, child => React.cloneElement(child, { activeTab }))}
                </div>
            </div>
        </div>
    );
};
