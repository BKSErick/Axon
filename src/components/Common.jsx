import React from 'react';
import { C } from '../data/db';

export const Avatar = ({ name, size = 32, grad = 'var(--primary)' }) => (
    <div style={{
        width: size,
        height: size,
        borderRadius: '25%',
        background: grad,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: size * 0.4,
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)'
    }}>
        {name?.[0]?.toUpperCase()}
    </div>
);

export const Badge = ({ status }) => {
    const m = {
        active: { l: "Ativa", c: "var(--primary)" },
        paused: { l: "Pausada", c: "var(--amber)" },
        disconnected: { l: "Desconectada", c: "var(--red)" },
        expired: { l: "Token Expirado", c: "var(--red)" },
        connected: { l: "Conectado", c: "var(--primary)" },
        completed: { l: "Pronto", c: "var(--primary)" },
        processing: { l: "Processando", c: "var(--blue)" },
        error: { l: "Erro", c: "var(--red)" },
        unlinked: { l: "Sem vínculo", c: "var(--amber)" },
        inactive: { l: "Inativo", c: "var(--text-muted)" },
        delivered: { l: "Entregue", c: "var(--primary)" },
        shipped: { l: "Enviado", c: "var(--blue)" },
    };
    const s = m[status] || { l: status, c: "var(--text-muted)" };
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: `${s.c}15`,
            color: s.c,
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            border: `1px solid ${s.c}25`
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.c, flexShrink: 0 }} />
            {s.l}
        </span>
    );
};

export const Divider = () => <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />;

export const SectionLabel = ({ children }) => (
    <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "0 8px",
        marginBottom: 10,
        marginTop: 16
    }}>{children}</div>
);

export const Stat = ({ label, value, accent = "var(--primary)", delta, sub, icon: Icon }) => (
    <div className="card card-hover" style={{
        padding: "24px",
        transition: "all .3s ease",
        position: "relative",
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }}>
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                {Icon && (
                    <div style={{ padding: 8, background: `${accent}15`, color: accent, borderRadius: "var(--radius-md)" }}>
                        <Icon size={16} />
                    </div>
                )}
            </div>

            <div style={{ color: "var(--text)", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>{value}</div>

            {(delta !== undefined || sub) && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {delta !== undefined && (
                        <div style={{ fontSize: 12, color: delta >= 0 ? "var(--primary)" : "var(--red)", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
                        </div>
                    )}
                    {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{sub}</div>}
                </div>
            )}
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: accent, opacity: 0.5 }} />
    </div>
);

export const Btn = ({ children, onClick, variant = "primary", size = "md", icon, disabled, full, loading }) => {
    const baseClass = variant === "primary" ? "btn-p" : "btn-g";
    const styles = {
        primary: {},
        ghost: {},
        danger: { background: "rgba(239, 68, 68, 0.1)", color: "var(--red)", borderColor: "rgba(239, 68, 68, 0.2)" },
        success: { background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)", borderColor: "rgba(16, 185, 129, 0.2)" },
    };

    return (
        <button
            className={baseClass}
            onClick={loading ? null : onClick}
            disabled={disabled || loading}
            style={{
                ...styles[variant] || {},
                width: full ? "100%" : "auto",
                opacity: (disabled || loading) ? .5 : 1,
                cursor: (disabled || loading) ? "not-allowed" : "pointer",
                padding: size === 'sm' ? '8px 14px' : undefined,
                fontSize: size === 'sm' ? '12px' : undefined,
                gap: 8
            }}>
            {loading ? (
                <div className="spinner" />
            ) : icon}
            {loading ? "Processando..." : children}
        </button>
    );
};

export const Modal = ({ title, subtitle, onClose, children, width = 520 }) => (
    <div className="fadein" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.8)", backdropFilter: 'blur(4px)', zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card fadeup" style={{
            width: "100%",
            maxWidth: width,
            boxShadow: "var(--shadow-xl)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column"
        }}>
            <div style={{
                padding: "24px 28px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexShrink: 0
            }}>
                <div>
                    <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 18, letterSpacing: '-0.2px' }}>{title}</div>
                    {subtitle && <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
                </div>
                <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 18, lineHeight: 1, cursor: "pointer", padding: 4 }}>✕</button>
            </div>
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, scrollbarGutter: 'stable' }}>{children}</div>
        </div>
    </div>
);

export const Field = ({ label, children, hint }) => (
    <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", color: "var(--text-dim)", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
        {children}
        {hint && <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>{hint}</div>}
    </div>
);

export const Input = ({ value, onChange, placeholder, type = "text", readOnly }) => (
    <input className="pill-input" type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />
);

export const Select = ({ value, onChange, options }) => (
    <select className="pill-input" value={value} onChange={onChange}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
);

export const Toggle = ({ on, onChange, label, sub }) => (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border-muted)" }}>
        <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 600 }}>{label}</div>
            {sub && <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
        </div>
        <div onClick={() => onChange(!on)} style={{
            width: 44,
            height: 24,
            borderRadius: 999,
            background: on ? "var(--primary)" : "var(--surf)",
            position: "relative",
            cursor: "pointer",
            transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
            marginLeft: 16,
            border: "1px solid var(--border)"
        }}>
            <div style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 2,
                left: on ? 22 : 2,
                transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "var(--shadow-sm)"
            }} />
        </div>
    </div>
);

export const ChartTooltip = ({ active, payload, label, prefix = "" }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card" style={{ padding: "12px 16px", fontSize: 12, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || "var(--primary)" }} />
                    <div style={{ color: "var(--text)", fontWeight: 700 }}>
                        {p.name && <span style={{ color: "var(--text-dim)", fontWeight: 500, marginRight: 4 }}>{p.name}:</span>}
                        {prefix}{typeof p.value === "number" && p.value > 999 ? p.value.toLocaleString("pt-BR") : p.value}
                    </div>
                </div>
            ))}
        </div>
    );
};

