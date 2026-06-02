export const C = {
    bg: "#09090b", // Zinc 950
    surf: "#18181b", // Zinc 900
    card: "#27272a", // Zinc 800
    card2: "#3f3f46", // Zinc 700
    border: "rgba(255,255,255,.08)",
    borderB: "rgba(16,185,129,.3)", // Emerald 500
    text: "#fafafa", // Zinc 50
    muted: "#a1a1aa", // Zinc 400
    dim: "#71717a", // Zinc 500
    blue: "#3b82f6", // Blue 500
    green: "#10b981", // Emerald 500
    cyan: "#06b6d4", // Cyan 500
    violet: "#8b5cf6", // Violet 500
    amber: "#f59e0b", // Amber 500
    red: "#ef4444", // Red 500
    grad: "linear-gradient(135deg,#10b981,#059669)", // Emerald gradient
    gradG: "linear-gradient(135deg,#10b981,#06b6d4)",
    gradA: "linear-gradient(135deg,#f59e0b,#d97706)",
    gradR: "linear-gradient(135deg,#ef4444,#dc2626)",
};

export const fmtBRL = n => `R$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtN = n => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${n}`;

// Temporary static data for charts (can be moved to DB later)
export const chartData7dStatic = [
    { d: "Seg", spend: 3240, leads: 89 },
    { d: "Ter", spend: 4120, leads: 118 },
    { d: "Qua", spend: 3780, leads: 102 },
    { d: "Qui", spend: 5100, leads: 157 },
    { d: "Sex", spend: 5840, leads: 181 },
    { d: "Sáb", spend: 4610, leads: 136 },
    { d: "Dom", spend: 3840, leads: 108 },
];
