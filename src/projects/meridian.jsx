/**
 * Meridian — Financial Analytics Dashboard
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · useLayoutEffect · memo · forwardRef
 * Patterns: deterministic data generation · recharts integration ·
 *   simulated async with cleanup · error boundary · aria throughout
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, Component,
} from "react";
import {
  AreaChart, Area, BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw, DollarSign, ShoppingCart,
  Users, BarChart2, ChevronUp, ChevronDown,
  Download, AlertCircle, TrendingUp,
} from "lucide-react";

// ─── Data Layer ───────────────────────────────────────────────────────────────

/** Deterministic PRNG — same seed → same data every render */
function seededRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const RANGE_CFG = {
  "7d":  { points: 7,  seed: 42,  trend: 180, isWeekly: false },
  "30d": { points: 30, seed: 137, trend: 220, isWeekly: false },
  "90d": { points: 90, seed: 251, trend: 360, isWeekly: false },
  "1y":  { points: 52, seed: 389, trend: 640, isWeekly: true  },
};

function generateSeries(timeRange) {
  const { points, seed, trend, isWeekly } = RANGE_CFG[timeRange] ?? RANGE_CFG["30d"];
  const rand  = seededRNG(seed);
  let   value = 42000;
  const anchor = new Date(2026, 5, 17); // stable anchor date

  return Array.from({ length: points }, (_, i) => {
    const d = new Date(anchor);
    isWeekly
      ? d.setDate(d.getDate() - (points - i) * 7)
      : d.setDate(d.getDate() - (points - i));

    value += trend * (rand() - 0.30) * 2 + trend * 0.30;
    value  = Math.max(12000, value);

    return {
      label:   d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.round(value),
      target:  Math.round(36000 + (i / points) * trend * points * 0.42),
    };
  });
}

function deriveKPIs(series) {
  const half   = Math.ceil(series.length / 2);
  const recent = series.slice(-half).reduce((s, d) => s + d.revenue, 0);
  const prior  = series.slice(0, series.length - half).reduce((s, d) => s + d.revenue, 0);
  const total  = recent + prior;
  const growth = prior > 0 ? +((recent - prior) / prior * 100).toFixed(1) : 0;

  return [
    {
      id: "revenue", label: "Total Revenue",  format: "currency",
      value: total,  growth,                   Icon: DollarSign,
      spark: series.map(d => ({ v: d.revenue })),
    },
    {
      id: "orders", label: "Orders",           format: "number",
      value: Math.round(total / 248),
      growth: +(growth * 0.85).toFixed(1),      Icon: ShoppingCart,
      spark: series.map(d => ({ v: Math.round(d.revenue / 248) })),
    },
    {
      id: "customers", label: "New Customers", format: "number",
      value: Math.round(total / 1840),
      growth: +(growth * 1.12).toFixed(1),      Icon: Users,
      spark: series.map(d => ({ v: Math.round(d.revenue / 1840) })),
    },
    {
      id: "aov", label: "Avg Order Value",     format: "currency",
      value: 248, growth: 3.2,                  Icon: BarChart2,
      spark: series.map((_, i) => ({ v: 238 + Math.sin(i * 0.8) * 7 + i * 0.12 })),
    },
  ];
}

const CHANNELS = [
  { channel: "Direct",   revenue: 38400, prev: 35200 },
  { channel: "Organic",  revenue: 29100, prev: 31400 },
  { channel: "Paid",     revenue: 22800, prev: 19600 },
  { channel: "Referral", revenue: 14700, prev: 13200 },
  { channel: "Email",    revenue: 11200, prev: 10800 },
];

const PERFORMERS = [
  { name: "Enterprise Suite", revenue: 142800, growth:  18.4, units:  47 },
  { name: "Pro Plan",         revenue:  98600, growth:  12.1, units: 312 },
  { name: "Growth Bundle",    revenue:  74200, growth:  -3.8, units: 188 },
  { name: "Starter Plan",     revenue:  52100, growth:  24.7, units: 847 },
  { name: "Add-ons",          revenue:  31400, growth:   8.9, units: 624 },
];

function fmt(value, format) {
  if (format === "currency") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value}`;
  }
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

// ─── State Management ─────────────────────────────────────────────────────────

const initState = { timeRange: "30d" };

function dashReducer(state, action) {
  switch (action.type) {
    case "SET_RANGE": return { ...state, timeRange: action.payload };
    default:          return state;
  }
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/**
 * useDashboardData — simulates an async data fetch.
 * useEffect cleanup ensures the loading timer never fires
 * setState on an unmounted component.
 */
function useDashboardData(timeRange) {
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    timerRef.current = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timerRef.current); // cleanup
  }, [timeRange]);

  // useMemo — recomputes only when timeRange changes, not on every render
  const series = useMemo(() => generateSeries(timeRange), [timeRange]);
  const kpis   = useMemo(() => deriveKPIs(series),        [series]);

  return { loading, series, kpis };
}

/**
 * useLastUpdated — tracks when data last finished loading.
 * Gives the dashboard a "live" feel with a human-readable timestamp.
 */
function useLastUpdated(loading) {
  const [ts, setTs] = useState(null);
  useEffect(() => {
    if (!loading) setTs(new Date());
  }, [loading]);
  return ts;
}

// ─── Presentational Components (React.memo) ───────────────────────────────────

/** Tiny recharts sparkline — isAnimationActive=false prevents re-animation on every render */
const Sparkline = memo(function Sparkline({ data, positive }) {
  return (
    <ResponsiveContainer width="100%" height={34}>
      <LineChart data={data}>
        <Line
          type="monotone" dataKey="v"
          stroke={positive ? "#22C55E" : "#EF4444"}
          strokeWidth={1.5} dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

/** KPI metric card with sparkline — memo'd; re-renders only when metric object changes */
const KPICard = memo(function KPICard({ metric }) {
  const { label, value, growth, format, Icon, spark } = metric;
  const positive = growth >= 0;

  // useMemo inside memo — prevents re-formatting on unrelated parent renders
  const display = useMemo(() => fmt(value, format), [value, format]);

  return (
    <div className="mr-kpi">
      <div className="mr-kpi-top">
        <div className="mr-kpi-icon" aria-hidden="true"><Icon size={13} /></div>
        <span className="mr-eyebrow">{label}</span>
      </div>
      <div className="mr-kpi-value mr-num">{display}</div>
      <div className="mr-kpi-bottom">
        <span
          className={`mr-badge ${positive ? "mr-badge-pos" : "mr-badge-neg"}`}
          aria-label={`${positive ? "Up" : "Down"} ${Math.abs(growth)}%`}
        >
          {positive
            ? <ChevronUp size={10} aria-hidden="true" />
            : <ChevronDown size={10} aria-hidden="true" />}
          {Math.abs(growth)}%
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Sparkline data={spark} positive={positive} />
        </div>
      </div>
    </div>
  );
});

/** Skeleton placeholder — pure, memo'd, renders identically every time */
const Skeleton = memo(function Skeleton({ height = 260 }) {
  return <div className="shimmer mr-skeleton" style={{ height }} />;
});

/** Custom tooltip for recharts — memo prevents recreation on every chart hover */
const RevenueTooltip = memo(function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mr-tooltip" role="tooltip">
      <span className="mr-tooltip-label">{label}</span>
      {payload.map((p, i) => (
        <div key={i} className="mr-tooltip-row">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="mr-mono">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
});

const ChannelTooltip = memo(function ChannelTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mr-tooltip" role="tooltip">
      <span className="mr-tooltip-label">{label}</span>
      {payload.map((p, i) => (
        <div key={i} className="mr-tooltip-row">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="mr-mono">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
});

/** Revenue area chart — AreaChart gives us the gradient fill under the line */
const RevenueChart = memo(function RevenueChart({ data, loading }) {
  if (loading) return <Skeleton height={300} />;
  return (
    <div className="mr-chart-card" aria-label="Revenue over time chart">
      <div className="mr-chart-header">
        <div>
          <span className="mr-eyebrow">Revenue Over Time</span>
          <h3 className="mr-chart-title">Actual vs Target</h3>
        </div>
        <div className="mr-chart-legend">
          <span className="mr-legend-dot" style={{ background: "#F59E0B" }} />
          <span className="mr-legend-label">Actual</span>
          <span className="mr-legend-dot" style={{ background: "#252E3E" }} />
          <span className="mr-legend-label">Target</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={228}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#F59E0B" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1C2434" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
          <Tooltip content={<RevenueTooltip />} />
          <Area type="monotone" dataKey="target"  stroke="#252E3E" strokeWidth={1.5} fill="none" dot={false} name="Target" strokeDasharray="4 3" isAnimationActive={false} />
          <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2}   fill="url(#revGrad)" dot={false} name="Actual" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

/** Channel breakdown bar chart */
const ChannelChart = memo(function ChannelChart({ loading }) {
  if (loading) return <Skeleton height={300} />;
  return (
    <div className="mr-chart-card" aria-label="Revenue by acquisition channel">
      <div className="mr-chart-header">
        <div>
          <span className="mr-eyebrow">Acquisition</span>
          <h3 className="mr-chart-title">Revenue by Channel</h3>
        </div>
        <div className="mr-chart-legend">
          <span className="mr-legend-dot" style={{ background: "#1C2434" }} />
          <span className="mr-legend-label">Previous</span>
          <span className="mr-legend-dot" style={{ background: "#F59E0B" }} />
          <span className="mr-legend-label">Current</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={228}>
        <BarChart data={CHANNELS} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1C2434" vertical={false} />
          <XAxis dataKey="channel" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
          <Tooltip content={<ChannelTooltip />} />
          <Bar dataKey="prev"    fill="#1C2434" radius={[3,3,0,0]} name="Previous"  isAnimationActive={false} />
          <Bar dataKey="revenue" fill="#F59E0B" radius={[3,3,0,0]} name="Current"   isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

/** Top performers table — useMemo computes maxRevenue once for progress bar widths */
const TopPerformers = memo(function TopPerformers({ loading }) {
  const maxRevenue = useMemo(
    () => Math.max(...PERFORMERS.map(p => p.revenue)),
    [] // PERFORMERS is static — no dep needed
  );

  if (loading) return <Skeleton height={300} />;
  return (
    <div className="mr-chart-card">
      <div className="mr-chart-header">
        <div>
          <span className="mr-eyebrow">Rankings</span>
          <h3 className="mr-chart-title">Top Performers</h3>
        </div>
      </div>
      <table className="mr-table" aria-label="Top performing products and plans">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Product</th>
            <th scope="col">Revenue</th>
            <th scope="col">Growth</th>
          </tr>
        </thead>
        <tbody>
          {PERFORMERS.map((row, i) => (
            <tr key={row.name}>
              <td className="mr-rank">{i + 1}</td>
              <td>
                <span className="mr-product-name">{row.name}</span>
                <div className="mr-bar-track">
                  <div
                    className="mr-bar-fill"
                    style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
                    role="presentation"
                  />
                </div>
              </td>
              <td className="mr-mono mr-col-revenue">{fmt(row.revenue, "currency")}</td>
              <td>
                <span
                  className={`mr-badge ${row.growth >= 0 ? "mr-badge-pos" : "mr-badge-neg"}`}
                  aria-label={`${row.growth >= 0 ? "Up" : "Down"} ${Math.abs(row.growth)} percent`}
                >
                  {row.growth >= 0
                    ? <ChevronUp size={10} aria-hidden="true" />
                    : <ChevronDown size={10} aria-hidden="true" />}
                  {Math.abs(row.growth)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

/** Time range picker — memo'd, aria-pressed on active button */
const TIME_RANGES = ["7d", "30d", "90d", "1y"];

const RangePicker = memo(function RangePicker({ active, onChange, disabled }) {
  return (
    <div className="mr-range-group" role="group" aria-label="Select time range">
      {TIME_RANGES.map(r => (
        <button
          key={r}
          className={`mr-range-btn ${active === r ? "mr-range-btn--on" : ""}`}
          onClick={() => onChange(r)}
          disabled={disabled}
          aria-pressed={active === r}
        >
          {r}
        </button>
      ))}
    </div>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class MeridianErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(err, info) { console.error("[Meridian]", err, info.componentStack); }
  render() {
    if (this.state.error) {
      return (
        <div className="mr-boundary" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <p>Dashboard failed to render. Refresh to retry.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Global Styles ────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .mr-root { font-family: 'Inter', -apple-system, sans-serif; background: #0B0D11; min-height: 100vh; color: #CBD5E1; -webkit-font-smoothing: antialiased; }
    .mr-inner { max-width: 1100px; margin: 0 auto; padding: 28px 24px 60px; }
    .mr-num  { font-family: 'Space Grotesk', sans-serif; }
    .mr-mono { font-family: 'JetBrains Mono', monospace; }

    /* Topbar */
    .mr-topbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #1C2434; }
    .mr-brand  { display: flex; align-items: center; gap: 10px; }
    .mr-brand-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #D97706, #F59E0B); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mr-brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px; color: #F1F5F9; letter-spacing: -0.01em; }
    .mr-brand-sub  { font-size: 11px; color: #475569; margin-top: 1px; }
    .mr-topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mr-last-updated { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #334155; white-space: nowrap; }

    /* Range picker */
    .mr-range-group { display: flex; background: #141820; border: 1px solid #1C2434; border-radius: 8px; padding: 3px; gap: 2px; }
    .mr-range-btn { padding: 5px 10px; border-radius: 5px; border: none; background: transparent; color: #475569; font-size: 11px; font-weight: 500; cursor: pointer; transition: background 0.12s, color 0.12s; font-family: 'Space Grotesk', sans-serif; }
    .mr-range-btn:hover:not(:disabled) { color: #94A3B8; }
    .mr-range-btn--on { background: #1C2434; color: #F59E0B; }
    .mr-range-btn:focus-visible { outline: 2px solid #F59E0B; outline-offset: 1px; }
    .mr-range-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Refresh + export buttons */
    .mr-icon-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 8px; border: 1px solid #1C2434; background: #141820; color: #64748B; font-size: 12px; cursor: pointer; transition: color 0.12s, border-color 0.12s; font-family: 'Inter', sans-serif; }
    .mr-icon-btn:hover { color: #94A3B8; border-color: #252E3E; }
    .mr-icon-btn:focus-visible { outline: 2px solid #F59E0B; outline-offset: 2px; }

    /* Eyebrow */
    .mr-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #334155; }

    /* KPI grid */
    .mr-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .mr-kpi { background: #141820; border: 1px solid #1C2434; border-radius: 12px; padding: 16px 18px; transition: border-color 0.15s; }
    .mr-kpi:hover { border-color: #252E3E; }
    .mr-kpi-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .mr-kpi-icon { width: 26px; height: 26px; border-radius: 6px; background: rgba(245,158,11,0.1); display: flex; align-items: center; justify-content: center; color: #F59E0B; flex-shrink: 0; }
    .mr-kpi-value { font-size: 26px; font-weight: 600; color: #F1F5F9; letter-spacing: -0.02em; line-height: 1; margin-bottom: 10px; }
    .mr-kpi-bottom { display: flex; align-items: center; gap: 10px; }

    /* Badges */
    .mr-badge { display: inline-flex; align-items: center; gap: 2px; padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 500; white-space: nowrap; font-family: 'Space Grotesk', sans-serif; }
    .mr-badge-pos { background: rgba(34,197,94,0.12);  color: #22C55E; }
    .mr-badge-neg { background: rgba(239,68,68,0.12);  color: #EF4444; }

    /* Chart cards */
    .mr-chart-card { background: #141820; border: 1px solid #1C2434; border-radius: 12px; padding: 20px 20px 14px; }
    .mr-chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 8px; }
    .mr-chart-title { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 600; color: #E2E8F0; margin-top: 4px; }
    .mr-chart-legend { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .mr-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .mr-legend-label { font-size: 11px; color: #475569; }

    /* Tooltip */
    .mr-tooltip { background: #1C2434; border: 1px solid #252E3E; border-radius: 8px; padding: 10px 14px; }
    .mr-tooltip-label { display: block; font-size: 10px; color: #475569; margin-bottom: 6px; font-family: 'JetBrains Mono', monospace; }
    .mr-tooltip-row { display: flex; justify-content: space-between; gap: 16px; font-size: 12px; line-height: 1.8; }

    /* Bottom grid */
    .mr-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }

    /* Table */
    .mr-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .mr-table th { text-align: left; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; padding: 0 0 10px; font-family: 'JetBrains Mono', monospace; font-weight: 400; }
    .mr-table td { padding: 9px 0; border-top: 1px solid #1C2434; vertical-align: middle; }
    .mr-table tr:first-child td { border-top: none; }
    .mr-rank { color: #334155; font-family: 'JetBrains Mono', monospace; font-size: 11px; width: 24px; }
    .mr-product-name { color: #94A3B8; display: block; margin-bottom: 4px; }
    .mr-bar-track { height: 3px; background: #1C2434; border-radius: 2px; }
    .mr-bar-fill  { height: 3px; background: #F59E0B; border-radius: 2px; transition: width 0.4s ease; }
    .mr-col-revenue { color: #E2E8F0; font-size: 11px; padding-right: 12px; }

    /* Skeleton shimmer */
    .mr-skeleton { border-radius: 12px; }
    .shimmer { background: linear-gradient(90deg, #141820 25%, #1C2434 50%, #141820 75%); background-size: 400% 100%; animation: shimmerMove 1.4s ease infinite; }
    @keyframes shimmerMove { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

    /* Error boundary */
    .mr-boundary { display: flex; align-items: center; gap: 10px; padding: 20px 24px; border-radius: 12px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #EF4444; font-size: 13px; margin: 40px 24px; }

    /* Spin */
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive — collapse to 2-col KPI grid on narrow screens */
    @media (max-width: 700px) {
      .mr-kpi-grid    { grid-template-columns: 1fr 1fr; }
      .mr-bottom-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 400px) {
      .mr-kpi-grid { grid-template-columns: 1fr; }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .shimmer { animation: none !important; }
    }
  `}</style>
);

// ─── Core Component ───────────────────────────────────────────────────────────

function MeridianCore() {
  const [state, dispatch] = useReducer(dashReducer, initState);
  const { timeRange } = state;

  const { loading, series, kpis } = useDashboardData(timeRange);
  const lastUpdated = useLastUpdated(loading);

  // useId — stable accessible IDs even if multiple dashboards render on one page
  const titleId = useId();

  // useCallback — stable handler references so memo'd children don't re-render
  const handleRangeChange = useCallback(
    (range) => dispatch({ type: "SET_RANGE", payload: range }),
    []
  );

  // useLayoutEffect — synchronous read/write of layout before paint;
  // here used to set the document title once and only on mount
  useLayoutEffect(() => {
    const prev = document.title;
    document.title = "Meridian — Analytics";
    return () => { document.title = prev; };
  }, []);

  // useMemo — format timestamp once; recomputes only when lastUpdated changes
  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return `Updated ${lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }, [lastUpdated]);

  return (
    <>
      <GlobalStyles />
      <main className="mr-root" aria-labelledby={titleId}>
        <div className="mr-inner">

          {/* ── Top bar ── */}
          <header className="mr-topbar">
            <div className="mr-brand">
              <div className="mr-brand-icon" aria-hidden="true">
                <TrendingUp size={15} color="#fff" />
              </div>
              <div>
                <div className="mr-brand-name" id={titleId}>Meridian</div>
                <div className="mr-brand-sub">Analytics Dashboard</div>
              </div>
            </div>

            <div className="mr-topbar-right">
              {updatedLabel && (
                <span className="mr-last-updated" aria-live="polite">{updatedLabel}</span>
              )}
              <RangePicker active={timeRange} onChange={handleRangeChange} disabled={loading} />
              <button
                className="mr-icon-btn"
                onClick={() => handleRangeChange(timeRange)} // re-trigger same range = refresh
                disabled={loading}
                aria-label="Refresh dashboard data"
                aria-busy={loading}
              >
                <RefreshCw
                  size={13}
                  aria-hidden="true"
                  style={loading ? { animation: "spin 0.8s linear infinite" } : undefined}
                />
                Refresh
              </button>
              <button className="mr-icon-btn" aria-label="Export dashboard data">
                <Download size={13} aria-hidden="true" />
                Export
              </button>
            </div>
          </header>

          {/* ── KPI row ── */}
          {/* aria-live so screen readers announce metric changes when time range updates */}
          <section
            aria-label="Key performance indicators"
            aria-live="polite"
            aria-busy={loading}
          >
            <div className="mr-kpi-grid">
              {loading
                ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={120} />)
                : kpis.map(metric => <KPICard key={metric.id} metric={metric} />)
              }
            </div>
          </section>

          {/* ── Revenue chart ── */}
          <RevenueChart data={series} loading={loading} />

          {/* ── Bottom row ── */}
          <div className="mr-bottom-grid">
            <ChannelChart loading={loading} />
            <TopPerformers loading={loading} />
          </div>

        </div>
      </main>
    </>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function Meridian() {
  return (
    <MeridianErrorBoundary>
      <MeridianCore />
    </MeridianErrorBoundary>
  );
}
