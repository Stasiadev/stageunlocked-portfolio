/**
 * FINTRACK — Portfolio Dashboard
 * Recreated from design reference with fully working navigation
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · memo · forwardRef · ErrorBoundary
 * Features: 5 working tabs · recharts · live watchlist · transactions
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, memo, Component,
} from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Briefcase, BarChart2,
  ArrowLeftRight, Settings, TrendingUp,
  TrendingDown, Plus, Search, Bell,
  ChevronDown, AlertCircle,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const PORTFOLIO_GROWTH = [
  { month: "Oct", value: 80200 }, { month: "Nov", value: 82500 },
  { month: "Dec", value: 81800 }, { month: "Jan", value: 85600 },
  { month: "Feb", value: 87200 }, { month: "Mar", value: 91400 },
  { month: "Apr", value: 98750 },
];

const MONTHLY_RETURNS = [
  { month: "Oct", return: 2.1 }, { month: "Nov", return: 2.9 },
  { month: "Dec", return: -0.9 }, { month: "Jan", return: 4.7 },
  { month: "Feb", return: 1.9 }, { month: "Mar", return: 4.8 },
  { month: "Apr", return: 4.3 },
];

const ALLOCATION = [
  { name: "US Equities",    value: 42, color: "#E879F9" },
  { name: "International",  value: 18, color: "#818CF8" },
  { name: "Fixed Income",   value: 25, color: "#60A5FA" },
  { name: "Cash & Other",   value: 15, color: "#4B5563" },
];

const WATCHLIST = [
  { symbol: "AAPL", name: "Apple",     price: 182.50, change:  2.3 },
  { symbol: "NVDA", name: "NVIDIA",    price: 847.20, change: -1.4 },
  { symbol: "MSFT", name: "Microsoft", price: 415.30, change:  0.8 },
  { symbol: "SPY",  name: "S&P ETF",   price: 521.40, change:  1.1 },
];

const TRANSACTIONS = [
  { asset: "Apple Inc.",      type: "BUY",  shares: 12, price: 182.50, total: 2190,  date: "Apr 12" },
  { asset: "NVIDIA Corp.",    type: "SELL", shares: 5,  price: 847.20, total: 4236,  date: "Apr 10" },
  { asset: "S&P 500 ETF",     type: "BUY",  shares: 8,  price: 521.40, total: 4171,  date: "Apr 8"  },
  { asset: "Treasury Bond",   type: "BUY",  shares: 20, price: 98.75,  total: 1975,  date: "Apr 5"  },
  { asset: "Microsoft Corp.", type: "BUY",  shares: 7,  price: 415.30, total: 2907,  date: "Apr 3"  },
  { asset: "Apple Inc.",      type: "BUY",  shares: 5,  price: 178.20, total: 891,   date: "Mar 28" },
  { asset: "Vanguard BND",    type: "BUY",  shares: 50, price: 72.50,  total: 3625,  date: "Mar 22" },
  { asset: "NVIDIA Corp.",    type: "BUY",  shares: 3,  price: 795.00, total: 2385,  date: "Mar 15" },
];

const HOLDINGS = [
  { symbol: "AAPL", name: "Apple Inc.",      shares: 45, avgCost: 142.30, price: 182.50, value: 8213,  gainPct:  28.2 },
  { symbol: "NVDA", name: "NVIDIA Corp.",    shares: 12, avgCost: 520.00, price: 847.20, value: 10166, gainPct:  62.9 },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 28, avgCost: 380.00, price: 415.30, value: 11628, gainPct:   9.3 },
  { symbol: "SPY",  name: "S&P 500 ETF",     shares: 30, avgCost: 480.00, price: 521.40, value: 15642, gainPct:   8.6 },
  { symbol: "BND",  name: "Vanguard Bond",   shares: 100,avgCost: 72.50,  price: 75.20,  value: 7520,  gainPct:   3.7 },
  { symbol: "AMZN", name: "Amazon.com",      shares: 8,  avgCost: 3100.00,price: 182.50, value: 1460,  gainPct:  -5.1 },
];

const RISK_METRICS = [
  { label: "Beta",            value: "1.12", note: "Slightly above market" },
  { label: "Sharpe Ratio",    value: "1.84", note: "Strong risk-adjusted return" },
  { label: "Max Drawdown",    value: "-8.3%",note: "Last 12 months" },
  { label: "Volatility",      value: "14.2%",note: "Annualized std dev" },
  { label: "Alpha",           value: "+2.6%",note: "vs S&P 500 benchmark" },
];

// ─── State ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "overview",      label: "Overview",     Icon: LayoutDashboard },
  { id: "portfolio",     label: "Portfolio",    Icon: Briefcase        },
  { id: "analytics",     label: "Analytics",    Icon: BarChart2        },
  { id: "transactions",  label: "Transactions", Icon: ArrowLeftRight   },
  { id: "settings",      label: "Settings",     Icon: Settings         },
];

const initState = { activeTab: "overview" };
function navReducer(state, action) {
  if (action.type === "SET_TAB") return { activeTab: action.payload };
  return state;
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

function useCopyToClipboard(ms = 2000) {
  const [copied, setCopied] = useState(false);
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), []);
  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(t.current);
      t.current = setTimeout(() => setCopied(false), ms);
    });
  }, [ms]);
  return [copied, copy];
}

// ─── Shared Components ────────────────────────────────────────────────────────

const KPICard = memo(function KPICard({ label, value, badge, badgeColor = "#4ADE80", sub }) {
  return (
    <div className="ft-kpi">
      <span className="ft-kpi-label">{label}</span>
      <span className="ft-kpi-value">{value}</span>
      {badge && (
        <div className="ft-kpi-badge" style={{ background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30` }}>
          <TrendingUp size={10} aria-hidden="true" /> {badge}
        </div>
      )}
      {sub && <span className="ft-kpi-sub">{sub}</span>}
    </div>
  );
});

const CustomTooltip = memo(function CustomTooltip({ active, payload, label, prefix = "$" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ft-tooltip">
      <span className="ft-tooltip-label">{label}</span>
      {payload.map((p, i) => (
        <div key={i} className="ft-tooltip-row">
          <span style={{ color: p.color || p.fill }}>{p.name}</span>
          <span>{prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
});

// ─── Tab: Overview ────────────────────────────────────────────────────────────

const OverviewTab = memo(function OverviewTab() {
  const centerLabel = useMemo(() => "$98.7k", []);

  return (
    <div className="ft-tab-content">
      {/* KPI row */}
      <div className="ft-kpi-grid">
        <KPICard label="Portfolio Value"  value="$98,750" badge="↑ 4.3% this month" />
        <KPICard label="Monthly Return"   value="$4,120"  badge="↑ 7.1% vs last mo." />
        <KPICard label="Annual Return"    value="+18.4%"  badge="↑ 2.1% above target" />
        <KPICard label="Risk Score"       value="Moderate" sub="Stable" badgeColor="#818CF8" />
      </div>

      {/* Charts row */}
      <div className="ft-charts-row">
        {/* Portfolio Growth */}
        <div className="ft-chart-card" style={{ flex: "1.6" }}>
          <div className="ft-chart-header">
            <div>
              <h3 className="ft-chart-title">Portfolio Growth</h3>
              <span className="ft-chart-sub">Oct 2025 — Apr 2026</span>
            </div>
            <span className="ft-green-badge">↑ +20.4%</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PORTFOLIO_GROWTH} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#E879F9" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#E879F9" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
              <XAxis dataKey="month" tick={{ fill:"#4B5563", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#4B5563", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="Value" stroke="#E879F9" strokeWidth={2} fill="url(#pgGrad)" dot={{ r:4, fill:"#E879F9", strokeWidth:0 }} activeDot={{ r:6 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation donut */}
        <div className="ft-chart-card" style={{ flex: "1" }}>
          <div className="ft-chart-header">
            <div>
              <h3 className="ft-chart-title">Allocation</h3>
              <span className="ft-chart-sub">Current distribution</span>
            </div>
          </div>
          <div style={{ position:"relative", display:"flex", justifyContent:"center" }}>
            <PieChart width={160} height={160}>
              <Pie data={ALLOCATION} cx={75} cy={75} innerRadius={48} outerRadius={72} dataKey="value" strokeWidth={0} isAnimationActive={false}>
                {ALLOCATION.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#F0F0FF" }}>$98.7k</div>
              <div style={{ fontSize:9, color:"#4B5563" }}>TOTAL</div>
            </div>
          </div>
          <div className="ft-legend">
            {ALLOCATION.map(a => (
              <div key={a.name} className="ft-legend-item">
                <span className="ft-legend-dot" style={{ background:a.color }} />
                <span className="ft-legend-name">{a.name}</span>
                <span className="ft-legend-pct">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="ft-table-card">
        <div className="ft-table-header">
          <h3 className="ft-chart-title">Recent Transactions</h3>
          <button className="ft-view-all">View All</button>
        </div>
        <table className="ft-table" aria-label="Recent transactions">
          <thead>
            <tr>
              {["ASSET","TYPE","SHARES","PRICE","TOTAL","DATE"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.slice(0, 5).map((tx, i) => (
              <tr key={i}>
                <td className="ft-td-bold">{tx.asset}</td>
                <td>
                  <span className={`ft-tx-badge ${tx.type === "BUY" ? "ft-tx-buy" : "ft-tx-sell"}`}>
                    {tx.type}
                  </span>
                </td>
                <td>{tx.shares}</td>
                <td>${tx.price.toLocaleString()}</td>
                <td className="ft-td-bold">${tx.total.toLocaleString()}</td>
                <td className="ft-td-muted">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── Tab: Portfolio ───────────────────────────────────────────────────────────

const PortfolioTab = memo(function PortfolioTab() {
  return (
    <div className="ft-tab-content">
      <div className="ft-kpi-grid">
        <KPICard label="Total Value"   value="$98,750" badge="↑ 4.3% today" />
        <KPICard label="Total Gain"    value="+$18,340" badge="↑ 22.8% all time" />
        <KPICard label="Day's Change"  value="+$420"   badge="↑ 0.43% today" />
        <KPICard label="Positions"     value="6" sub="Active holdings" />
      </div>
      <div className="ft-table-card">
        <div className="ft-table-header">
          <h3 className="ft-chart-title">Holdings</h3>
          <button className="ft-add-btn"><Plus size={13} /> Add Position</button>
        </div>
        <table className="ft-table" aria-label="Portfolio holdings">
          <thead>
            <tr>{["SYMBOL","NAME","SHARES","AVG COST","CURRENT","VALUE","GAIN/LOSS"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {HOLDINGS.map((h, i) => (
              <tr key={i}>
                <td><span className="ft-symbol-chip">{h.symbol}</span></td>
                <td className="ft-td-bold">{h.name}</td>
                <td>{h.shares}</td>
                <td>${h.avgCost.toLocaleString()}</td>
                <td>${h.price.toLocaleString()}</td>
                <td className="ft-td-bold">${h.value.toLocaleString()}</td>
                <td>
                  <span style={{ color: h.gainPct >= 0 ? "#4ADE80" : "#F87171", fontWeight:600, fontSize:12 }}>
                    {h.gainPct >= 0 ? "+" : ""}{h.gainPct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── Tab: Analytics ───────────────────────────────────────────────────────────

const AnalyticsTab = memo(function AnalyticsTab() {
  return (
    <div className="ft-tab-content">
      <div className="ft-charts-row">
        <div className="ft-chart-card" style={{ flex:1 }}>
          <div className="ft-chart-header">
            <div>
              <h3 className="ft-chart-title">Monthly Returns</h3>
              <span className="ft-chart-sub">Oct 2025 — Apr 2026</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_RETURNS} margin={{ top:8, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
              <XAxis dataKey="month" tick={{ fill:"#4B5563", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#4B5563", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip prefix="" />} />
              <Bar dataKey="return" name="Return %" radius={[4,4,0,0]} isAnimationActive={false}>
                {MONTHLY_RETURNS.map((e, i) => <Cell key={i} fill={e.return >= 0 ? "#E879F9" : "#F87171"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ft-chart-card" style={{ flex:1 }}>
          <div className="ft-chart-header">
            <div>
              <h3 className="ft-chart-title">Risk Metrics</h3>
              <span className="ft-chart-sub">Portfolio analysis</span>
            </div>
          </div>
          <div className="ft-risk-list">
            {RISK_METRICS.map(m => (
              <div key={m.label} className="ft-risk-row">
                <div>
                  <span className="ft-risk-label">{m.label}</span>
                  <span className="ft-risk-note">{m.note}</span>
                </div>
                <span className="ft-risk-value">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ft-chart-card">
        <div className="ft-chart-header">
          <div>
            <h3 className="ft-chart-title">Portfolio vs S&P 500</h3>
            <span className="ft-chart-sub">Indexed to 100 — Oct 2025</span>
          </div>
          <div className="ft-chart-legend-row">
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#94A3B8" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#E879F9", display:"inline-block" }} />Portfolio
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#94A3B8" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#60A5FA", display:"inline-block" }} />S&P 500
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={[
              { m:"Oct", port:100, sp:100 }, { m:"Nov", port:102.9, sp:101.4 },
              { m:"Dec", port:102.0, sp:100.9 }, { m:"Jan", port:106.7, sp:103.1 },
              { m:"Feb", port:108.7, sp:104.2 }, { m:"Mar", port:113.9, sp:106.8 },
              { m:"Apr", port:123.1, sp:109.2 },
            ]}
            margin={{ top:8, right:8, left:-20, bottom:0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
            <XAxis dataKey="m" tick={{ fill:"#4B5563", fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#4B5563", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}`} />
            <Tooltip content={<CustomTooltip prefix="" />} />
            <Line type="monotone" dataKey="port" name="Portfolio" stroke="#E879F9" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="sp"   name="S&P 500"  stroke="#60A5FA" strokeWidth={2} dot={false} isAnimationActive={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// ─── Tab: Transactions ────────────────────────────────────────────────────────

const TransactionsTab = memo(function TransactionsTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => TRANSACTIONS.filter(tx => {
    const matchSearch = tx.asset.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || tx.type === filter;
    return matchSearch && matchFilter;
  }), [search, filter]);

  return (
    <div className="ft-tab-content">
      <div className="ft-table-card">
        <div className="ft-table-header">
          <h3 className="ft-chart-title">Transaction History</h3>
          <div style={{ display:"flex", gap:8 }}>
            <div className="ft-search-wrap">
              <Search size={12} color="#4B5563" aria-hidden="true" />
              <input
                className="ft-search"
                placeholder="Search assets…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search transactions"
              />
            </div>
            {["ALL","BUY","SELL"].map(f => (
              <button
                key={f}
                className={`ft-filter-btn ${filter === f ? "ft-filter-btn--on" : ""}`}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >{f}</button>
            ))}
          </div>
        </div>
        <table className="ft-table" aria-label="Transaction history">
          <thead>
            <tr>{["ASSET","TYPE","SHARES","PRICE","TOTAL","DATE"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((tx, i) => (
              <tr key={i}>
                <td className="ft-td-bold">{tx.asset}</td>
                <td><span className={`ft-tx-badge ${tx.type==="BUY"?"ft-tx-buy":"ft-tx-sell"}`}>{tx.type}</span></td>
                <td>{tx.shares}</td>
                <td>${tx.price.toLocaleString()}</td>
                <td className="ft-td-bold">${tx.total.toLocaleString()}</td>
                <td className="ft-td-muted">{tx.date}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:"center", padding:24, color:"#4B5563", fontSize:12 }}>No transactions match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── Tab: Settings ────────────────────────────────────────────────────────────

const Toggle = memo(function Toggle({ checked, onChange, label }) {
  return (
    <div className="ft-toggle-row" onClick={onChange} role="switch" aria-checked={checked} tabIndex={0}
      onKeyDown={e => (e.key==="Enter"||e.key===" ") && onChange()}
      aria-label={label}
    >
      <span className="ft-toggle-label">{label}</span>
      <div className="ft-toggle-track" style={{ background: checked ? "#E879F9" : "#1E1E2E" }}>
        <div className="ft-toggle-thumb" style={{ transform: checked ? "translateX(18px)" : "translateX(0)" }} />
      </div>
    </div>
  );
});

const SettingsTab = memo(function SettingsTab() {
  const [notifs, setNotifs]     = useState(true);
  const [darkMode, setDark]     = useState(true);
  const [twoFactor, set2FA]     = useState(false);
  const [priceAlerts, setAlerts] = useState(true);

  return (
    <div className="ft-tab-content">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="ft-settings-card">
          <h3 className="ft-settings-title">Profile</h3>
          <div className="ft-field-group">
            <label className="ft-field-label">Display Name</label>
            <input className="ft-field-input" defaultValue="Anastasia" />
          </div>
          <div className="ft-field-group">
            <label className="ft-field-label">Email</label>
            <input className="ft-field-input" defaultValue="stasia@stageunlocked.com" />
          </div>
          <div className="ft-field-group">
            <label className="ft-field-label">Currency</label>
            <select className="ft-field-input">
              <option>USD — US Dollar</option>
              <option>EUR — Euro</option>
              <option>GBP — British Pound</option>
            </select>
          </div>
          <button className="ft-save-btn">Save Changes</button>
        </div>

        <div className="ft-settings-card">
          <h3 className="ft-settings-title">Preferences</h3>
          <Toggle checked={notifs}    onChange={() => setNotifs(p=>!p)}    label="Push Notifications" />
          <Toggle checked={darkMode}  onChange={() => setDark(p=>!p)}      label="Dark Mode" />
          <Toggle checked={twoFactor} onChange={() => set2FA(p=>!p)}       label="Two-Factor Auth" />
          <Toggle checked={priceAlerts} onChange={() => setAlerts(p=>!p)}  label="Price Alerts" />
          <div className="ft-settings-divider" />
          <h3 className="ft-settings-title" style={{ marginTop:0 }}>Danger Zone</h3>
          <button className="ft-danger-btn">Delete Account</button>
        </div>
      </div>
    </div>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class FTErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e, i) { console.error("[FINTRACK]", e, i.componentStack); }
  render() {
    if (this.state.err) return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:20, color:"#F87171", fontFamily:"sans-serif" }}>
        <AlertCircle size={18} /><p>Something went wrong. Refresh to retry.</p>
      </div>
    );
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .ft-root { display: flex; height: 100vh; background: #0B0B12; color: #E2E8F0; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; overflow: hidden; }
    .ft-mono { font-family: 'JetBrains Mono', monospace; }

    /* ── Sidebar ── */
    .ft-sidebar { width: 200px; flex-shrink: 0; background: #0E0E18; border-right: 1px solid #1A1A2A; display: flex; flex-direction: column; padding: 20px 12px; overflow: hidden; }
    .ft-brand { margin-bottom: 28px; padding: 0 4px; }
    .ft-brand-name { font-size: 17px; font-weight: 800; color: #E879F9; letter-spacing: 0.05em; }
    .ft-brand-sub { font-size: 10px; color: #4B5563; margin-top: 1px; }
    .ft-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .ft-nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 9px; border: none; background: transparent; color: #4B5563; font-size: 13px; cursor: pointer; transition: all 0.14s; width: 100%; text-align: left; font-family: 'Inter', sans-serif; }
    .ft-nav-item:hover { color: #94A3B8; background: rgba(255,255,255,0.03); }
    .ft-nav-item--on { background: rgba(232,121,249,0.1); color: #E879F9; border: 1px solid rgba(232,121,249,0.15); }
    .ft-nav-item:focus-visible { outline: 2px solid #E879F9; outline-offset: 2px; }

    /* Watchlist */
    .ft-watchlist { border-top: 1px solid #1A1A2A; padding-top: 16px; margin-top: 8px; }
    .ft-watchlist-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #1E2A3A; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; padding: 0 4px; }
    .ft-watch-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 4px; border-bottom: 1px solid #13131E; }
    .ft-watch-item:last-child { border-bottom: none; }
    .ft-watch-symbol { font-size: 12px; font-weight: 700; color: #E2E8F0; display: block; }
    .ft-watch-name { font-size: 9px; color: #4B5563; }
    .ft-watch-right { text-align: right; }
    .ft-watch-price { font-size: 11px; font-weight: 600; color: #E2E8F0; display: block; }
    .ft-watch-change { font-size: 10px; font-weight: 600; }

    /* ── Main ── */
    .ft-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .ft-topbar { padding: 20px 24px 16px; border-bottom: 1px solid #1A1A2A; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .ft-greeting { font-size: 22px; font-weight: 700; color: #F0F0FF; letter-spacing: -0.02em; }
    .ft-greeting-sub { font-size: 12px; color: #4B5563; margin-top: 3px; }
    .ft-greeting-sub span { color: #4ADE80; font-weight: 600; }
    .ft-topbar-right { display: flex; align-items: center; gap: 10px; }
    .ft-month-sel { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 8px; border: 1px solid #1E1E2E; background: transparent; color: #94A3B8; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; }
    .ft-add-asset { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: #E879F9; color: #fff; border: none; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.13s; }
    .ft-add-asset:hover { background: #D946EF; }
    .ft-add-asset:focus-visible { outline: 2px solid #E879F9; outline-offset: 3px; }
    .ft-bell { background: none; border: none; color: #4B5563; cursor: pointer; padding: 6px; border-radius: 7px; }
    .ft-bell:hover { color: #94A3B8; }

    /* ── Tab content area ── */
    .ft-content { flex: 1; overflow-y: auto; padding: 20px 24px; scrollbar-width: thin; scrollbar-color: #1E1E2E transparent; }
    .ft-tab-content { display: flex; flex-direction: column; gap: 16px; }

    /* ── KPI Grid ── */
    .ft-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .ft-kpi { background: #13131E; border: 1px solid #1E1E2E; border-radius: 14px; padding: 16px 18px; }
    .ft-kpi-label { font-size: 11px; color: #4B5563; display: block; margin-bottom: 8px; }
    .ft-kpi-value { font-size: 24px; font-weight: 700; color: #F0F0FF; display: block; letter-spacing: -0.02em; margin-bottom: 8px; }
    .ft-kpi-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; }
    .ft-kpi-sub { font-size: 11px; color: #4B5563; display: block; margin-top: 4px; }

    /* ── Charts ── */
    .ft-charts-row { display: flex; gap: 12px; }
    .ft-chart-card { background: #13131E; border: 1px solid #1E1E2E; border-radius: 14px; padding: 18px 20px; }
    .ft-chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
    .ft-chart-title { font-size: 14px; font-weight: 600; color: #F0F0FF; }
    .ft-chart-sub { font-size: 10px; color: #4B5563; display: block; margin-top: 2px; }
    .ft-green-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 7px; background: rgba(74,222,128,0.1); color: #4ADE80; font-size: 11px; font-weight: 700; border: 1px solid rgba(74,222,128,0.2); }
    .ft-chart-legend-row { display: flex; gap: 12px; align-items: center; }
    .ft-legend { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
    .ft-legend-item { display: flex; align-items: center; gap: 7px; }
    .ft-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .ft-legend-name { font-size: 11px; color: #94A3B8; flex: 1; }
    .ft-legend-pct { font-size: 11px; color: #4B5563; font-family: 'JetBrains Mono', monospace; }

    /* ── Tables ── */
    .ft-table-card { background: #13131E; border: 1px solid #1E1E2E; border-radius: 14px; padding: 18px 20px; }
    .ft-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .ft-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .ft-table th { text-align: left; font-size: 10px; color: #1E3050; text-transform: uppercase; letter-spacing: 0.1em; padding: 0 0 10px; font-family: 'JetBrains Mono', monospace; font-weight: 400; border-bottom: 1px solid #1A1A2A; }
    .ft-table td { padding: 11px 0; border-bottom: 1px solid #13131E; color: #94A3B8; vertical-align: middle; }
    .ft-table tr:last-child td { border-bottom: none; }
    .ft-td-bold { color: #E2E8F0; font-weight: 500; }
    .ft-td-muted { color: #4B5563; }
    .ft-tx-badge { display: inline-block; padding: 3px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
    .ft-tx-buy  { background: rgba(74,222,128,0.1);  color: #4ADE80; border: 1px solid rgba(74,222,128,0.2);  }
    .ft-tx-sell { background: rgba(248,113,113,0.1); color: #F87171; border: 1px solid rgba(248,113,113,0.2); }
    .ft-symbol-chip { display: inline-block; padding: 3px 8px; background: rgba(232,121,249,0.1); border: 1px solid rgba(232,121,249,0.2); color: #E879F9; border-radius: 6px; font-weight: 700; font-size: 11px; }
    .ft-view-all { background: none; border: 1px solid #1E1E2E; border-radius: 7px; padding: 5px 12px; color: #4B5563; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; transition: color 0.12s, border-color 0.12s; }
    .ft-view-all:hover { color: #94A3B8; border-color: #2E2E3E; }
    .ft-add-btn { display: inline-flex; align-items: center; gap: 5px; background: rgba(232,121,249,0.1); border: 1px solid rgba(232,121,249,0.2); border-radius: 7px; padding: 6px 12px; color: #E879F9; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; }

    /* ── Tooltip ── */
    .ft-tooltip { background: #1A1A2A; border: 1px solid #2E2E3E; border-radius: 8px; padding: 10px 14px; }
    .ft-tooltip-label { display: block; font-size: 10px; color: #4B5563; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace; }
    .ft-tooltip-row { display: flex; justify-content: space-between; gap: 16px; font-size: 12px; color: #E2E8F0; }

    /* ── Search / filter ── */
    .ft-search-wrap { display: flex; align-items: center; gap: 7px; background: #0B0B12; border: 1px solid #1E1E2E; border-radius: 8px; padding: 6px 10px; }
    .ft-search { background: none; border: none; outline: none; color: #E2E8F0; font-size: 12px; font-family: 'Inter', sans-serif; width: 140px; }
    .ft-search::placeholder { color: #1E3050; }
    .ft-filter-btn { padding: 6px 12px; border-radius: 7px; border: 1px solid #1E1E2E; background: transparent; color: #4B5563; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.12s; }
    .ft-filter-btn:hover { color: #94A3B8; }
    .ft-filter-btn--on { background: rgba(232,121,249,0.1); border-color: rgba(232,121,249,0.2); color: #E879F9; }
    .ft-filter-btn:focus-visible { outline: 2px solid #E879F9; outline-offset: 2px; }

    /* ── Risk ── */
    .ft-risk-list { display: flex; flex-direction: column; gap: 0; }
    .ft-risk-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #1A1A2A; }
    .ft-risk-row:last-child { border-bottom: none; }
    .ft-risk-label { font-size: 12px; color: #E2E8F0; font-weight: 500; display: block; }
    .ft-risk-note { font-size: 10px; color: #4B5563; display: block; margin-top: 1px; }
    .ft-risk-value { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #E879F9; }

    /* ── Settings ── */
    .ft-settings-card { background: #13131E; border: 1px solid #1E1E2E; border-radius: 14px; padding: 20px; }
    .ft-settings-title { font-size: 13px; font-weight: 600; color: #F0F0FF; margin-bottom: 16px; }
    .ft-field-group { margin-bottom: 12px; }
    .ft-field-label { font-size: 10px; color: #4B5563; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.08em; font-family: 'JetBrains Mono', monospace; }
    .ft-field-input { width: 100%; background: #0B0B12; border: 1px solid #1E1E2E; border-radius: 8px; padding: 9px 12px; color: #E2E8F0; font-size: 12px; outline: none; font-family: 'Inter', sans-serif; transition: border-color 0.13s; }
    .ft-field-input:focus { border-color: #E879F9; }
    .ft-save-btn { width: 100%; padding: 10px; border-radius: 9px; background: #E879F9; border: none; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 8px; font-family: 'Inter', sans-serif; transition: background 0.13s; }
    .ft-save-btn:hover { background: #D946EF; }
    .ft-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #1A1A2A; cursor: pointer; user-select: none; }
    .ft-toggle-row:last-of-type { border-bottom: none; }
    .ft-toggle-label { font-size: 12px; color: #94A3B8; }
    .ft-toggle-track { width: 36px; height: 18px; border-radius: 9px; position: relative; transition: background 0.2s; flex-shrink: 0; }
    .ft-toggle-thumb { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
    .ft-toggle-row:focus-visible { outline: 2px solid #E879F9; outline-offset: 2px; border-radius: 4px; }
    .ft-settings-divider { height: 1px; background: #1A1A2A; margin: 14px 0; }
    .ft-danger-btn { width: 100%; padding: 9px; border-radius: 9px; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #F87171; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
    .ft-danger-btn:hover { background: rgba(248,113,113,0.12); }

    @media(max-width:680px) { .ft-sidebar{display:none} .ft-kpi-grid{grid-template-columns:1fr 1fr} .ft-charts-row{flex-direction:column} }
    @media(prefers-reduced-motion:reduce) { * { transition:none!important; animation:none!important; } }
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function FINTRACKCore() {
  const [state, dispatch] = useReducer(navReducer, initState);
  const { activeTab } = state;

  const setTab = useCallback((id) => dispatch({ type:"SET_TAB", payload:id }), []);

  const TAB_COMPONENTS = useMemo(() => ({
    overview:     <OverviewTab />,
    portfolio:    <PortfolioTab />,
    analytics:    <AnalyticsTab />,
    transactions: <TransactionsTab />,
    settings:     <SettingsTab />,
  }), []);

  return (
    <>
      <GlobalStyles />
      <div className="ft-root">

        {/* ── Sidebar ── */}
        <aside className="ft-sidebar" aria-label="Navigation">
          <div className="ft-brand">
            <div className="ft-brand-name">FINTRACK</div>
            <div className="ft-brand-sub">Portfolio Dashboard</div>
          </div>

          <nav className="ft-nav" aria-label="Main navigation">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`ft-nav-item ${activeTab === id ? "ft-nav-item--on" : ""}`}
                onClick={() => setTab(id)}
                aria-current={activeTab === id ? "page" : undefined}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          <div className="ft-watchlist" aria-label="Watchlist">
            <div className="ft-watchlist-title">Watchlist</div>
            {WATCHLIST.map(w => (
              <div key={w.symbol} className="ft-watch-item">
                <div>
                  <span className="ft-watch-symbol">{w.symbol}</span>
                  <span className="ft-watch-name">{w.name}</span>
                </div>
                <div className="ft-watch-right">
                  <span className="ft-watch-price">${w.price.toLocaleString()}</span>
                  <span className="ft-watch-change" style={{ color: w.change >= 0 ? "#4ADE80" : "#F87171" }}>
                    {w.change >= 0 ? "+" : ""}{w.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="ft-main">
          <div className="ft-topbar">
            <div>
              <div className="ft-greeting">Good morning, Anastasia 👋</div>
              <div className="ft-greeting-sub">
                Your portfolio is up <span>+4.3%</span> this month · Apr 15, 2026
              </div>
            </div>
            <div className="ft-topbar-right">
              <button className="ft-bell" aria-label="Notifications">
                <Bell size={17} />
              </button>
              <button className="ft-month-sel" aria-label="Select month">
                Apr 2026 <ChevronDown size={12} aria-hidden="true" />
              </button>
              <button className="ft-add-asset">
                <Plus size={14} aria-hidden="true" /> Add Asset
              </button>
            </div>
          </div>

          <div className="ft-content" role="main" aria-label={`${activeTab} view`}>
            {TAB_COMPONENTS[activeTab]}
          </div>
        </main>

      </div>
    </>
  );
}

export default function FINTRACK() {
  return <FTErrorBoundary><FINTRACKCore /></FTErrorBoundary>;
}
