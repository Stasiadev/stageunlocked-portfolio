import { useState } from 'react';

// ── TOKENS ───────────────────────────────────────────────────────
const C = {
  bg:      '#07070F',
  sidebar: '#0B0B18',
  card:    '#0D0D1C',
  mg:      '#D4178A',
  pu:      '#7B2DBE',
  white:   '#EEEEF5',
  dim:     '#5A5A7A',
  dimLt:   '#8A8AAA',
  green:   '#00D4A0',
  red:     '#FF4D6D',
  blue:    '#4B9FE1',
  border:  'rgba(255,255,255,0.07)',
  grad:    'linear-gradient(135deg, #D4178A 0%, #7B2DBE 100%)',
};
const FD = "'Syne', sans-serif";
const FB = "'DM Sans', sans-serif";

// ── MOCK DATA ────────────────────────────────────────────────────
const chartData = [
  { month: 'Oct', value: 82000 },
  { month: 'Nov', value: 87500 },
  { month: 'Dec', value: 84200 },
  { month: 'Jan', value: 91000 },
  { month: 'Feb', value: 95400 },
  { month: 'Mar', value: 92100 },
  { month: 'Apr', value: 98750 },
];

const allocations = [
  { label: 'US Equities',    pct: 42, color: '#D4178A' },
  { label: 'International',  pct: 18, color: '#7B2DBE' },
  { label: 'Fixed Income',   pct: 25, color: '#4B9FE1' },
  { label: 'Cash & Other',   pct: 15, color: '#5A5A7A' },
];

const transactions = [
  { name: 'Apple Inc.',      type: 'Buy',  shares: 12, price: 182.50, date: 'Apr 12' },
  { name: 'NVIDIA Corp.',    type: 'Sell', shares: 5,  price: 847.20, date: 'Apr 10' },
  { name: 'S&P 500 ETF',    type: 'Buy',  shares: 8,  price: 521.40, date: 'Apr 8'  },
  { name: 'Treasury Bond',   type: 'Buy',  shares: 20, price: 98.75,  date: 'Apr 5'  },
  { name: 'Microsoft Corp.', type: 'Buy',  shares: 7,  price: 415.30, date: 'Apr 3'  },
];

const watchlist = [
  { ticker: 'AAPL',  name: 'Apple',    price: 182.50, change: +2.3  },
  { ticker: 'NVDA',  name: 'NVIDIA',   price: 847.20, change: -1.4  },
  { ticker: 'MSFT',  name: 'Microsoft',price: 415.30, change: +0.8  },
  { ticker: 'SPY',   name: 'S&P ETF',  price: 521.40, change: +1.1  },
];

// ── LINE CHART ───────────────────────────────────────────────────
function LineChart({ data }) {
  const W = 560, H = 180;
  const pad = { top: 16, right: 16, bottom: 28, left: 56 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const vals = data.map(d => d.value);
  const min = Math.min(...vals) * 0.975;
  const max = Math.max(...vals) * 1.02;

  const xS = i => pad.left + (i / (data.length - 1)) * cW;
  const yS = v => H - pad.bottom - ((v - min) / (max - min)) * cH;

  const linePts = data.map((d, i) => `${xS(i)},${yS(d.value)}`).join(' ');
  const areaPts = `${xS(0)},${H - pad.bottom} ${linePts} ${xS(data.length - 1)},${H - pad.bottom}`;

  const yTicks = [0, 0.33, 0.66, 1].map(t => ({
    y: pad.top + t * cH,
    val: max - t * (max - min),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4178A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#D4178A" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#D4178A" />
          <stop offset="100%" stopColor="#7B2DBE" />
        </linearGradient>
      </defs>

      {/* Y grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.left} x2={W - pad.right} y1={t.y} y2={t.y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={pad.left - 8} y={t.y + 4} textAnchor="end"
            fill="#5A5A7A" fontSize="9" fontFamily="DM Sans">
            ${(t.val / 1000).toFixed(0)}k
          </text>
        </g>
      ))}

      {/* Area */}
      <polygon points={areaPts} fill="url(#areaFill)" />

      {/* Line */}
      <polyline points={linePts} fill="none"
        stroke="url(#lineStroke)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots + labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xS(i)} cy={yS(d.value)} r="4.5"
            fill="#D4178A" stroke="#07070F" strokeWidth="2" />
          <text x={xS(i)} y={H - 6} textAnchor="middle"
            fill="#5A5A7A" fontSize="9" fontFamily="DM Sans">
            {d.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── DONUT CHART ──────────────────────────────────────────────────
function DonutChart({ data }) {
  const r = 68, cx = 90, cy = 90, sw = 26;
  const circ = 2 * Math.PI * r;
  let cum = 0;

  const segs = data.map(d => {
    const dash   = (d.pct / 100) * circ;
    const offset = circ - (cum / 100) * circ;
    cum += d.pct;
    return { ...d, dash, gap: circ - dash, offset };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <svg viewBox="0 0 180 180" style={{ width: 140, flexShrink: 0 }}>
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={s.color} strokeWidth={sw}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        ))}
        <text x={cx} y={cy - 7} textAnchor="middle"
          fill="#EEEEF5" fontSize="17" fontWeight="700" fontFamily="Syne">
          $98.7k
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle"
          fill="#5A5A7A" fontSize="8" fontFamily="DM Sans" letterSpacing="1">
          TOTAL
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3,
              background: d.color, flexShrink: 0 }} />
            <span style={{ color: C.dim, fontSize: 12, flex: 1, fontFamily: FB }}>{d.label}</span>
            <span style={{ color: C.white, fontSize: 12, fontWeight: 600, fontFamily: FB }}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI CARD ─────────────────────────────────────────────────────
function KpiCard({ label, value, change, up }) {
  return (
    <div style={{ background: C.card, borderRadius: 18, padding: '22px 24px',
      border: `1px solid ${C.border}` }}>
      <p style={{ color: C.dim, fontSize: 12, marginBottom: 10, fontFamily: FB }}>{label}</p>
      <p style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1 }}>
        {value}
      </p>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
        fontFamily: FB,
        background: up === null
          ? 'rgba(90,90,122,0.2)'
          : up ? 'rgba(0,212,160,0.13)' : 'rgba(255,77,109,0.13)',
        color: up === null ? C.dim : up ? C.green : C.red,
      }}>
        {up !== null && (up ? '↑ ' : '↓ ')}{change}
      </span>
    </div>
  );
}

// ── MAIN DASHBOARD ───────────────────────────────────────────────
export default function Dashboard({ onBack }) {
  const [activeNav, setActiveNav] = useState('Overview');
  const navItems = [
    { label: 'Overview',     icon: '◉' },
    { label: 'Portfolio',    icon: '◈' },
    { label: 'Analytics',    icon: '◌' },
    { label: 'Transactions', icon: '◎' },
    { label: 'Settings',     icon: '◍' },
  ];

  const kpis = [
    { label: 'Portfolio Value', value: '$98,750',  change: '4.3% this month', up: true  },
    { label: 'Monthly Return',  value: '$4,120',   change: '7.1% vs last mo.', up: true  },
    { label: 'Annual Return',   value: '+18.4%',   change: '2.1% above target', up: true  },
    { label: 'Risk Score',      value: 'Moderate', change: 'Stable',           up: null  },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg,
      fontFamily: FB, overflow: 'hidden', color: C.white }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 228, background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 22px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FD, fontWeight: 800, fontSize: 16, letterSpacing: 1.5,
            background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FINTRACK
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 3, fontFamily: FB }}>
            Portfolio Dashboard
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ label, icon }) => {
            const active = activeNav === label;
            return (
              <button key={label} onClick={() => setActiveNav(label)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '11px 14px', borderRadius: 10,
                border: 'none',
                borderLeft: active ? `2px solid ${C.mg}` : '2px solid transparent',
                background: active ? 'rgba(212,23,138,0.09)' : 'transparent',
                color: active ? C.mg : C.dim,
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', textAlign: 'left', fontFamily: FB,
                transition: 'all 0.2s ease',
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Watchlist mini */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, color: C.dim, letterSpacing: 1.5,
            marginBottom: 12, fontWeight: 700 }}>
            WATCHLIST
          </p>
          {watchlist.map(s => (
            <div key={s.ticker} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{s.ticker}</p>
                <p style={{ fontSize: 10, color: C.dim }}>{s.name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 500 }}>${s.price.toFixed(2)}</p>
                <p style={{ fontSize: 10, color: s.change > 0 ? C.green : C.red, fontWeight: 600 }}>
                  {s.change > 0 ? '+' : ''}{s.change}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Back button */}
        <div style={{ padding: '14px 12px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 14px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: 'transparent',
            color: C.dim, fontSize: 12, cursor: 'pointer', fontFamily: FB,
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.mg; e.currentTarget.style.color = C.mg; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}
          >
            ← Portfolio Site
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, marginBottom: 5 }}>
              Good morning, Anastasia 👋
            </h1>
            <p style={{ color: C.dim, fontSize: 13 }}>
              Your portfolio is up&nbsp;
              <span style={{ color: C.green, fontWeight: 600 }}>+4.3%</span>
              &nbsp;this month · April 15, 2026
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ padding: '9px 18px', borderRadius: 9,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.dim, fontSize: 12, cursor: 'pointer', fontFamily: FB }}>
              Apr 2026 ▾
            </button>
            <button style={{ padding: '9px 20px', borderRadius: 9, border: 'none',
              background: C.grad, color: '#fff', fontSize: 12,
              cursor: 'pointer', fontFamily: FB, fontWeight: 600,
              boxShadow: '0 4px 14px rgba(212,23,138,0.28)' }}>
              + Add Asset
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Line chart */}
          <div style={{ background: C.card, borderRadius: 20, padding: '24px 28px',
            border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <p style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}>Portfolio Growth</p>
                <p style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Oct 2025 — Apr 2026</p>
              </div>
              <span style={{ background: 'rgba(0,212,160,0.12)', color: C.green,
                fontSize: 11, padding: '4px 12px', borderRadius: 100,
                fontWeight: 700, fontFamily: FB }}>
                ↑ +20.4%
              </span>
            </div>
            <LineChart data={chartData} />
          </div>

          {/* Donut */}
          <div style={{ background: C.card, borderRadius: 20, padding: '24px 28px',
            border: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Allocation
            </p>
            <p style={{ color: C.dim, fontSize: 12, marginBottom: 24 }}>
              Current distribution
            </p>
            <DonutChart data={allocations} />
          </div>
        </div>

        {/* Transactions */}
        <div style={{ background: C.card, borderRadius: 20, padding: '24px 28px',
          border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}>Recent Transactions</p>
            <button style={{ background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.dim, fontSize: 12,
              padding: '7px 16px', cursor: 'pointer', fontFamily: FB }}>
              View All
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Asset', 'Type', 'Shares', 'Price', 'Total', 'Date'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left',
                    color: C.dim, fontSize: 10, fontWeight: 700,
                    letterSpacing: 1.2, fontFamily: FB }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} style={{
                  borderBottom: i < transactions.length - 1
                    ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <td style={{ padding: '14px 12px', fontSize: 14, fontWeight: 600 }}>
                    {t.name}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '4px 11px',
                      borderRadius: 100, fontFamily: FB,
                      background: t.type === 'Buy'
                        ? 'rgba(0,212,160,0.12)' : 'rgba(255,77,109,0.12)',
                      color: t.type === 'Buy' ? C.green : C.red,
                    }}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', color: C.dimLt, fontSize: 13 }}>
                    {t.shares}
                  </td>
                  <td style={{ padding: '14px 12px', color: C.dimLt, fontSize: 13 }}>
                    ${t.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 12px', fontSize: 14, fontWeight: 600 }}>
                    ${(t.shares * t.price).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: '14px 12px', color: C.dim, fontSize: 13 }}>
                    {t.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
