/* global React, Recharts */
const { useState, useMemo, useEffect } = React;
const { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ReferenceLine } = Recharts;

/* ============================================
   ICONS — minimal stroke icons (Lucide-style)
   ============================================ */
const I = {
  home: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></svg>,
  briefcase: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>,
  layers: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/></svg>,
  trend: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>,
  users: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  file: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>,
  insta: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.7" fill="currentColor"/></svg>,
  cog: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>,
  chat: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.6-.8L3 21l1.8-5.9A8.4 8.4 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5z"/></svg>,
  bell: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  search: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  plus: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  refresh: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>,
  download: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>,
  up: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6"/></svg>,
  dn: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  arrowUp: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>,
  arrowDn: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7 17 17"/><path d="M17 7v10H7"/></svg>,
  warn: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.7 3h16.96a2 2 0 0 0 1.7-3L13.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  check: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  x: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  sun: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  link: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19"/></svg>,
  ext: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>,
  filter: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>,
  more: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  send: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>,
  mail: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>,
  phone: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  eye: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  trash: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  shield: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bolt: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>,
  target: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  dollar: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  pulse: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>,
  image: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>,
  cal: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  clock: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  out: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>,
  sparkle: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>,
  fb: (p)=> <svg className={"ico " + (p?.className||"")} viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9V15h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 3h-2.4v6.9A10 10 0 0 0 22 12"/></svg>,
};

/* ============================================
   BRAND mark — AXON (neural node)
   ============================================ */
function BrandMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} fill="none" aria-label="Axon">
      <rect width="28" height="28" rx="7" fill="rgb(var(--accent))"/>
      {/* connection lines */}
      <path d="M9 9 L14 14 M19 9 L14 14 M14 14 L14 20" stroke="#001a10" strokeWidth="1.6" strokeLinecap="round"/>
      {/* nodes */}
      <circle cx="9" cy="9" r="2.2" fill="#001a10"/>
      <circle cx="19" cy="9" r="2.2" fill="#001a10"/>
      <circle cx="14" cy="14" r="2.4" fill="#001a10"/>
      <circle cx="14" cy="20" r="2.2" fill="#001a10"/>
    </svg>
  );
}

/* ============================================
   FORMAT helpers
   ============================================ */
const fmt = {
  brl: (n) => {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n);
  },
  brlShort: (n) => {
    if (n === null || n === undefined || isNaN(n)) return "—";
    if (Math.abs(n) >= 1000) return "R$ " + (n/1000).toFixed(1).replace('.', ',') + "K";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(n);
  },
  int: (n) => new Intl.NumberFormat('pt-BR').format(n),
  pct: (n, digits=2) => (n>0?"+":"") + n.toFixed(digits).replace('.', ',') + "%",
  date: (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
};

/* ============================================
   Sparkline (mini line)
   ============================================ */
function Spark({ data, color, height=28, fill=true, negative }) {
  const c = color || (negative ? "rgb(var(--c-danger))" : "rgb(var(--accent))");
  const id = useMemo(()=> "sg" + Math.random().toString(36).slice(2,8), []);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{top:2,right:0,left:0,bottom:0}}>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={fill?0.28:0}/>
            <stop offset="100%" stopColor={c} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={c} strokeWidth={1.6} fill={`url(#${id})`} dot={false} isAnimationActive={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ============================================
   KPI Card
   ============================================ */
function KPI({ label, value, delta, deltaLabel, spark, negative, icon, fmtVal }) {
  const v = fmtVal ? fmtVal(value) : value;
  const dCls = delta == null ? "flat" : delta >= 0 ? (negative ? "dn" : "up") : (negative ? "up" : "dn");
  const showArrow = delta != null && delta !== 0;
  return (
    <div className="kpi">
      <div className="label">{icon}{label}</div>
      <div className="value num">{v}</div>
      <div className="row" style={{justifyContent:"space-between", marginTop:2}}>
        {delta != null ? (
          <span className={`delta ${dCls}`}>
            {showArrow && (delta >= 0 ? <I.up className="ico" style={{width:12,height:12}}/> : <I.dn className="ico" style={{width:12,height:12}}/>)}
            {Math.abs(delta).toFixed(1).replace('.', ',')}% <span style={{color:"rgb(var(--text-3))", fontWeight:400, marginLeft:4}}>{deltaLabel||"vs 30d"}</span>
          </span>
        ) : <span/>}
        {spark && <div style={{width:80, height:28}}><Spark data={spark} negative={negative && delta < 0}/></div>}
      </div>
    </div>
  );
}

/* ============================================
   StatusDot
   ============================================ */
function Status({ s, label }) {
  return <span className="row" style={{gap:6}}><span className={`sd ${s}`}/>{label && <span className="muted" style={{fontSize:12}}>{label}</span>}</span>;
}

/* ============================================
   Tooltip skin
   ============================================ */
function TT({ active, payload, label, prefix, suffix, fmt: f }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background:"rgb(var(--bg-elev))", border:"1px solid rgb(var(--border-strong))", borderRadius:8, padding:"8px 10px", fontSize:12, boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>
      <div style={{ color:"rgb(var(--text-3))", marginBottom:4, fontWeight:500 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color }}/>
          <span style={{ color:"rgb(var(--text-2))" }}>{p.name}</span>
          <span className="num" style={{ marginLeft:"auto", color:"rgb(var(--text))", fontWeight:600 }}>
            {prefix||""}{f ? f(p.value) : new Intl.NumberFormat('pt-BR').format(p.value)}{suffix||""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* expose */
Object.assign(window, { I, BrandMark, fmt, Spark, KPI, Status, TT, R: Recharts });
