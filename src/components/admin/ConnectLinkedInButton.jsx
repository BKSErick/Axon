import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * ConnectLinkedInButton — Initiates LinkedIn OAuth flow via Edge Function.
 * Opens LinkedIn authorization in a new window, waits for callback redirect.
 * @param {string} clientId - The client UUID to associate the connection with
 * @param {function} onConnected - Callback when connection is successful
 * @param {boolean} compact - If true, renders inline compact version
 */
export const ConnectLinkedInButton = ({ clientId, onConnected, compact = false }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'connecting' | 'success' | 'error'
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);

  // Check existing connection on mount
  useEffect(() => {
    if (clientId) loadConnection();
  }, [clientId]);

  // Listen for URL params from callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedinStatus = params.get('linkedin');

    if (linkedinStatus === 'connected') {
      setStatus('success');
      loadConnection();
      // Clean URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else if (linkedinStatus === 'error') {
      setStatus('error');
      setError(params.get('message') || 'Erro ao conectar LinkedIn');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  const loadConnection = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('client_linkedin_connections')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.warn('[ConnectLI] Query error:', queryError.message);
        return;
      }
      setConnection(data);
    } catch (e) {
      console.warn('[ConnectLI] loadConnection error:', e);
    }
  };

  const handleConnect = async () => {
    if (!clientId) {
      setError('Selecione um cliente primeiro');
      return;
    }

    setLoading(true);
    setStatus('connecting');
    setError(null);

    try {
      // Call Edge Function to get LinkedIn auth URL
      const { data, error: fnError } = await supabase.functions.invoke('linkedin-oauth', {
        body: { clientId },
      });

      if (fnError) throw new Error(fnError.message || 'Edge function error');
      if (data?.error) throw new Error(data.error);

      // Open LinkedIn OAuth in the same window (redirect flow)
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('[ConnectLI] Error:', err);
      setError(err.message);
      setStatus('error');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    const confirmed = window.confirm(
      'Desconectar esta conta do LinkedIn? As métricas orgânicas e de anúncios do LinkedIn ficarão indisponíveis.'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await supabase
        .from('client_linkedin_connections')
        .update({ status: 'revoked' })
        .eq('id', connection.id);

      setConnection(null);
      setStatus(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Compact mode (inline button) ──────────────────────────────────
  if (compact) {
    if (connection) {
      return (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(16,185,129,0.1)', borderRadius: 8, padding: '4px 10px',
        }}>
          <span style={{ fontSize: 10, color: '#10B981' }}>✅ LinkedIn</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            {connection.linkedin_user_name}
          </span>
        </div>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: loading ? 'rgba(0,119,181,0.05)' : 'rgba(0,119,181,0.12)',
          color: '#0077B5', border: '1px solid rgba(0,119,181,0.2)',
          borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer', transition: 'all .2s',
        }}
      >
        💼 {loading ? 'Conectando...' : 'Conectar LinkedIn'}
      </button>
    );
  }

  // ── Full mode (card) ──────────────────────────────────────────────
  const isExpiringSoon = connection?.token_expires_at &&
    new Date(connection.token_expires_at) < new Date(Date.now() + 7 * 86400000);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #0077B5, #00A0DC)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          💼
        </div>
        <div>
          <div style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 800 }}>
            Conexão LinkedIn
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            Conecte o LinkedIn para acessar métricas de Company Pages e Anúncios
          </div>
        </div>
      </div>

      {/* Connected State */}
      {connection ? (
        <div>
          <div style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: 12, padding: 14, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ color: '#10B981', fontSize: 14 }}>✅</span>
              <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>LinkedIn conectado</span>
              {isExpiringSoon && (
                <span style={{
                  background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                  fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                }}>
                  ⚠️ Token expira em breve
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoPill label="Usuário" value={connection.linkedin_user_name} />
              <InfoPill label="Status" value={connection.status === 'active' ? '🟢 Ativo' : '🔴 ' + connection.status} />
              <InfoPill label="Organizações" value={`${(connection.organizations || []).length} page(s)`} />
              <InfoPill label="Ad Accounts" value={`${(connection.ad_accounts || []).length} conta(s)`} />
            </div>

            {/* Organizations List */}
            {(connection.organizations || []).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{
                  color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700,
                  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Company Pages
                </div>
                {connection.organizations.map((org, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    color: 'rgba(255,255,255,0.7)', fontSize: 12,
                  }}>
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />
                    ) : (
                      <span style={{ fontSize: 12 }}>🏢</span>
                    )}
                    <span style={{ fontWeight: 600 }}>{org.name}</span>
                    {org.vanity_name && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                        /{org.vanity_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Email */}
            {connection.linkedin_email && (
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                📧 {connection.linkedin_email}
              </div>
            )}

            {connection.token_expires_at && (
              <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                Token válido até {new Date(connection.token_expires_at).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{
                flex: 1, padding: '8px 14px', borderRadius: 10, border: 'none',
                background: 'rgba(0,119,181,0.12)', color: '#0077B5',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
              }}
            >
              🔄 Reconectar
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.06)', color: '#EF4444',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
              }}
            >
              Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Not connected */}
          <div style={{
            background: 'rgba(0,119,181,0.04)',
            border: '1px dashed rgba(0,119,181,0.2)',
            borderRadius: 12, padding: 16, marginBottom: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
              Conecte o LinkedIn do cliente para acessar:
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
            }}>
              {['📊 Métricas de Company Page', '📈 Crescimento de seguidores', '💬 Engajamento', '💰 Dados de Anúncios', '📋 Análise de Posts'].map(item => (
                <span key={item} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 6,
                  padding: '3px 8px', fontSize: 10, color: 'rgba(255,255,255,0.5)',
                  fontWeight: 600,
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading || !clientId}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none',
              background: loading ? 'rgba(0,119,181,0.08)' : 'linear-gradient(135deg, #0077B5, #00A0DC)',
              color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
              transition: 'all .3s', opacity: !clientId ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(0,119,181,0.3)',
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                Conectando ao LinkedIn...
              </>
            ) : (
              <>
                <span style={{ fontSize: 16 }}>💼</span>
                Conectar LinkedIn
              </>
            )}
          </button>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

          {!clientId && (
            <div style={{ color: '#F59E0B', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              ⚠️ Selecione um cliente acima para conectar
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: 10, background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
          padding: '8px 12px', color: '#EF4444', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Success message */}
      {status === 'success' && (
        <div style={{
          marginTop: 10, background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10,
          padding: '8px 12px', color: '#10B981', fontSize: 12,
        }}>
          ✅ LinkedIn conectado com sucesso!
        </div>
      )}
    </div>
  );
};

// ── Helper ──────────────────────────────────────────────────────────
const InfoPill = ({ label, value }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 10px',
  }}>
    <div style={{
      color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {label}
    </div>
    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, marginTop: 2 }}>
      {value}
    </div>
  </div>
);

export default ConnectLinkedInButton;
