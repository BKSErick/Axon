/* ============================================
   Axon — Common UI primitives (KPI, Spark, fmt…)
   ============================================ */
import React, { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import { I } from './icons';

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

export { fmt, Spark, KPI, Status, TT };
// Re-export recharts for screen modules
export const R = {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ReferenceLine,
};
