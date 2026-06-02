import React, { useState, useEffect } from 'react';
import { loginWithFacebook, logoutFacebook, initFacebookSDK } from '../../lib/facebookSDK';
import { supabase } from '../../lib/supabase';

/**
 * ConnectFacebookButton — Opens a Facebook OAuth popup for clients to self-connect.
 * After authorization, exchanges for long-lived token and discovers Pages + IG.
 * @param {string} clientId - The client UUID to associate the connection with
 * @param {function} onConnected - Callback when connection is successful
 */
export const ConnectFacebookButton = ({ clientId, onConnected, compact = false }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'connecting' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);

  // Load SDK on mount
  useEffect(() => {
    initFacebookSDK()
      .then(() => setSdkReady(true))
      .catch(e => console.warn('FB SDK load error:', e));
  }, []);

  // Check existing connection
  useEffect(() => {
    if (clientId) loadConnection();
  }, [clientId]);

  const loadConnection = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('client_meta_connections')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (queryError) {
        console.warn('[ConnectFB] Query error:', queryError.message);
        return;
      }
      setConnection(data);
    } catch (e) {
      console.warn('[ConnectFB] loadConnection error:', e);
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
      // Step 1: Open Facebook Login popup
      const { accessToken, userID, grantedScopes } = await loginWithFacebook();
      console.log('[ConnectFB] Got short-lived token for user:', userID);

      // Step 2: Call Edge Function to exchange token + discover assets
      setStatus('exchanging');
      const { data: fnData, error: fnError } = await supabase.functions.invoke('meta-oauth', {
        body: {
          shortLivedToken: accessToken,
          clientId,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Edge function error');
      if (fnData?.error) throw new Error(fnData.error);

      // Step 3: Success!
      setResult(fnData);
      setStatus('success');
      await loadConnection();

      if (onConnected) {
        onConnected(fnData);
      }

    } catch (err) {
      console.error('[ConnectFB] Error:', err);
      setError(err.message === 'Facebook login was cancelled' 
        ? 'Login cancelado pelo usuário' 
        : err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    
    const confirmed = window.confirm('Desconectar esta conta do Facebook? As métricas orgânicas ficarão indisponíveis.');
    if (!confirmed) return;

    setLoading(true);
    try {
      await supabase
        .from('client_meta_connections')
        .update({ status: 'revoked' })
        .eq('id', connection.id);
      
      setConnection(null);
      setResult(null);
      setStatus(null);
      
      try { await logoutFacebook(); } catch (_) {}
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
          <span style={{ fontSize: 10, color: '#10B981' }}>✅ Conectado</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            {connection.meta_user_name}
          </span>
        </div>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={loading || !sdkReady}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: loading ? 'rgba(59,130,246,0.05)' : 'rgba(24,119,242,0.12)',
          color: '#1877F2', border: '1px solid rgba(24,119,242,0.2)',
          borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer', transition: 'all .2s',
        }}
      >
        📘 {loading ? 'Conectando...' : 'Conectar FB'}
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
          background: 'linear-gradient(135deg, #1877F2, #0866FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          📘
        </div>
        <div>
          <div style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 800 }}>
            Conexão Facebook/Instagram
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            Conecte a conta do cliente para acessar métricas orgânicas, anúncios e leads
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
              <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>Conta conectada</span>
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
              <InfoPill label="Usuário" value={connection.meta_user_name} />
              <InfoPill label="Status" value={connection.status === 'active' ? '🟢 Ativo' : '🔴 ' + connection.status} />
              <InfoPill label="Pages" value={`${(connection.pages || []).length} página(s)`} />
              <InfoPill label="Instagram" value={`${(connection.instagram_accounts || []).length} conta(s)`} />
            </div>

            {/* Pages List */}
            {(connection.pages || []).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Páginas do Facebook
                </div>
                {connection.pages.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    color: 'rgba(255,255,255,0.7)', fontSize: 12,
                  }}>
                    {p.picture_url ? (
                      <img src={p.picture_url} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />
                    ) : (
                      <span style={{ fontSize: 12 }}>📄</span>
                    )}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    {p.fan_count > 0 && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                        {p.fan_count.toLocaleString()} curtidas
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Instagram List */}
            {(connection.instagram_accounts || []).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Instagram
                </div>
                {connection.instagram_accounts.map((ig, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    color: 'rgba(255,255,255,0.7)', fontSize: 12,
                  }}>
                    {ig.profile_picture_url ? (
                      <img src={ig.profile_picture_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                    ) : (
                      <span style={{ fontSize: 12 }}>📸</span>
                    )}
                    <span style={{ fontWeight: 600 }}>@{ig.username}</span>
                    {ig.followers_count > 0 && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                        {ig.followers_count.toLocaleString()} seguidores
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {connection.token_expires_at && (
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
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
                background: 'rgba(24,119,242,0.12)', color: '#1877F2',
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
            background: 'rgba(24,119,242,0.04)',
            border: '1px dashed rgba(24,119,242,0.2)',
            borderRadius: 12, padding: 16, marginBottom: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
              Conecte o Facebook do cliente para acessar:
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
            }}>
              {['📊 Métricas orgânicas', '📈 Crescimento de seguidores', '💬 Engajamento', '📋 Formulários de Lead', '💰 Dados de Anúncios'].map(item => (
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
            disabled={loading || !sdkReady || !clientId}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none',
              background: loading ? 'rgba(24,119,242,0.08)' : 'linear-gradient(135deg, #1877F2, #0866FF)',
              color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
              transition: 'all .3s', opacity: (!sdkReady || !clientId) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(24,119,242,0.3)',
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                {status === 'exchanging' ? 'Processando token...' : 'Abrindo Facebook...'}
              </>
            ) : (
              <>
                <span style={{ fontSize: 16 }}>📘</span>
                Conectar Facebook / Instagram
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
      {status === 'success' && result && (
        <div style={{
          marginTop: 10, background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10,
          padding: '8px 12px', color: '#10B981', fontSize: 12,
        }}>
          ✅ Conectado! {result.pages?.length || 0} Pages, {result.instagram_accounts?.length || 0} Instagram, {result.ad_accounts?.length || 0} Ad Accounts descobertos.
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
    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, marginTop: 2 }}>
      {value}
    </div>
  </div>
);

export default ConnectFacebookButton;
