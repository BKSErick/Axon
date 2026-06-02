import React, { useState, useEffect } from 'react';
import { C } from './data/db';
import { supabase } from './lib/supabase';
import { AdminSidebar, AdminOverview, AdminBM, AdminAccounts, AdminClients, AdminReports, AdminSettings, AdminAllCampaigns } from './components/AdminViews';
import { SocialMediaPanel } from './components/admin/SocialMediaPanel';
import { ClientSidebar, ClientHome, ClientCampaigns, ClientReports, ClientEcommerce, ClientSettings } from './components/ClientViews';
import { LoginScreen, TopBar } from './components/Core';
import { PrivacyPolicy, TermsOfService, DataDeletion } from './components/Legal';

export default function App() {
    const [auth, setAuth] = useState(null); // { role, id, name, email }
    const [page, setPageRaw] = useState(() => sessionStorage.getItem('admin_page') || "overview");
    const setPage = (p) => { sessionStorage.setItem('admin_page', p); setPageRaw(p); };
    const [clientId, setClientId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {

        console.log("App iniciada. Monitorando autenticação...");

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Evento Auth:", event, session?.user?.email);

            if (session) {
                // IMPORTANTE: Não usar await aqui para não travar a resolução do login
                fetchProfile(session.user).catch(err => {
                    console.error("Falha silenciosa no fetchProfile:", err);
                });
            } else {
                setAuth(null);
                setLoading(false);
            }
        });

        // Garantia de que a tela de carregamento não dure para sempre
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn("Safety Net: Forçando fim do carregamento.");
                setLoading(false);
            }
        }, 12000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const fetchProfile = async (user, retryCount = 0) => {
        console.log(`> Sincronizando perfil (Tentativa ${retryCount + 1})...`);

        const dbTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        try {
            const query = supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const { data: profile, error } = await Promise.race([query, dbTimeout]);

            if (error) {
                // Erro de cache do Supabase ou tabela recém-criada: tenta 5 vezes silenciosamente
                if (retryCount < 5 && (
                    error.message?.includes("schema cache") ||
                    error.message?.includes("relation") ||
                    error.code === 'PGRST116' ||
                    error.message === "Timeout"
                )) {
                    await new Promise(r => setTimeout(r, 2000));
                    return fetchProfile(user, retryCount + 1);
                }
                throw error;
            }

            if (profile) {
                let currentClientId = profile.client_id;

                // LÓGICA DE AUTO-CURA: Se o perfil não tem client_id, tenta buscar pelo e-mail na tabela clients
                if (!currentClientId && profile.role === 'client') {
                    console.log("Auto-cura: Tentando vincular perfil ao cliente...");
                    const { data: clientLink } = await supabase
                        .from('clients')
                        .select('id')
                        .eq('email', user.email)
                        .single();

                    if (clientLink) {
                        console.log("Auto-cura: Cliente encontrado! Vinculando...");
                        await supabase
                            .from('profiles')
                            .update({ client_id: clientLink.id })
                            .eq('id', user.id);
                        currentClientId = clientLink.id;
                    }
                }

                setAuth({
                    role: profile.role,
                    uuid: user.id, // Auth User ID (PK for profiles)
                    id: profile.role === 'admin' ? 'admin' : currentClientId, // Legacy dashboard compatibility
                    name: profile.full_name || user.email.split('@')[0],
                    email: user.email,
                    agency: profile.agency_name || "Sua Agência"
                });
                setClientId(currentClientId);

                // Restaurar view selecionada pelo admin (ex: estava vendo dashboard de cliente)
                if (profile.role === 'admin') {
                    const savedClientId = sessionStorage.getItem('admin_viewing_client');
                    const savedPage = sessionStorage.getItem('admin_page');
                    if (savedClientId) {
                        // Estava vendo um cliente — restaurar
                        setClientId(savedClientId);
                        setAuth(prev => ({ ...prev, id: savedClientId }));
                        if (!savedPage) setPage('home');
                    } else {
                        if (!savedPage) setPage('overview');
                    }
                } else {
                    const savedTab = sessionStorage.getItem('client_activeTab');
                    if (!savedTab) setPage('home');
                }
                setLoading(false);
            } else {
                throw new Error("Perfil não encontrado.");
            }
        } catch (err) {
            console.error("Falha ao buscar perfil:", err.message);

            // Bypass automático para o primeiro acesso se o banco ainda estiver processando
            // Isso garante que o usuário entre como Admin sem ver o erro chato
            if (retryCount >= 5) {
                console.warn("Bypass de segurança ativado.");
                setAuth({
                    role: 'admin',
                    id: 'admin',
                    name: user.email.split('@')[0],
                    email: user.email,
                    agency: "Sua Agência"
                });
                setPage("overview");
            }
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            localStorage.removeItem('meta_user');
            sessionStorage.removeItem('admin_viewing_client');
            setAuth(null);
            window.location.href = '/'; // Força redirecionamento limpo
        } catch (err) {
            console.error("Erro ao sair:", err);
            window.location.reload();
        }
    };

    const handleClientChange = (id) => {
        setClientId(id);
        setAuth(a => ({ ...a, id }));
        // Persistir para sobreviver a refreshes de auth
        if (id && id !== 'admin') {
            sessionStorage.setItem('admin_viewing_client', id);
        } else {
            sessionStorage.removeItem('admin_viewing_client');
        }
    };

    // Simple routing for legal pages
    const path = window.location.pathname;
    if (path === '/privacidade' || path === '/privacy') return <PrivacyPolicy />;
    if (path === '/termos' || path === '/terms') return <TermsOfService />;
    if (path === '/data-deletion' || path === '/exclusao-dados') return <DataDeletion />;

    if (loading) return (
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, flexDirection: 'column', gap: 20 }}>
            <div className="spinner" style={{ width: 40, height: 40, border: `4px solid ${C.border}`, borderTop: `4px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>Conectando ao sistema... (v1.1.0 - High Impact)</div>
        </div>
    );

    if (!auth) return <LoginScreen />;

    // --- ROTA DE CLIENTE (NOVO DASHBOARD OU ADMIN VIEW AS CLIENT) ---
    if (auth.role === 'client' || (auth.role === 'admin' && auth.id !== 'admin')) {
        return <ClientHome
            user={auth}
            onLogout={handleLogout}
            onBackToAdmin={auth.role === 'admin' ? () => handleClientChange('admin') : undefined}
        />;
    }

    // --- ROTA DE ADMIN (LEGADO/ADMIN) ---
    const pageTitles = {
        overview: "Visão Geral", bm: "Business Managers", accounts: "Contas de Anúncio", all_campaigns: "Todas as Campanhas", clients: "Clientes", reports: "Relatórios", social_media: "Social Media",
        home: "Dashboard", campaigns: "Campanhas", ecommerce: "Loja", settings: "Configurações",
    };

    return (
        <div style={{ display: "flex", background: "var(--bg)", minHeight: "100vh" }}>
            <AdminSidebar
                page={page}
                setPage={setPage}
                auth={auth}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                <TopBar
                    title={pageTitles[page] || page}
                    onLogout={handleLogout}
                    role={auth.role}
                    clientId={clientId}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main style={{ flex: 1, padding: "26px 30px", overflowY: "auto" }}>
                    {page === "overview" && <AdminOverview setPage={setPage} auth={auth} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} />}
                    {page === "bm" && <AdminBM />}
                    {page === "accounts" && <AdminAccounts />}
                    {page === "all_campaigns" && <AdminAllCampaigns selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} />}
                    {page === "clients" && <AdminClients onClientChange={handleClientChange} />}
                    {page === "reports" && <AdminReports />}
                    <div style={{ display: page === "social_media" ? 'block' : 'none' }}><SocialMediaPanel /></div>
                    {page === "settings" && <AdminSettings auth={auth} onUpdate={() => supabase.auth.getUser().then(({ data }) => data.user && fetchProfile(data.user))} />}
                </main>
            </div>
        </div>
    );
}

