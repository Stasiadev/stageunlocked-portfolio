/**
 * Pulse — Real-Time Social Analytics Dashboard
 * Live-updating metrics with WebSocket simulation
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · memo · ErrorBoundary
 * Patterns: simulated real-time data · interval cleanup · sparkline SVG
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, memo, Component,
} from "react";
import {
  TrendingUp, TrendingDown, Users, Heart, MessageCircle,
  Share2, Eye, Zap, RefreshCw, AlertCircle,
  Camera, AtSign, Video,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Data generation ─────────────────────────────────────────────────────────

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function genTimeSeries(seed, base, variance, points=24) {
  const rng = seeded(seed);
  let val = base;
  return Array.from({length:points},(_,i)=>{
    val = Math.max(0, val + (rng()-0.45)*variance);
    const h = i < 12 ? `${i+1}am` : i===12 ? "12pm" : `${i-11}pm`;
    return { time:h, value:Math.round(val) };
  });
}

const PLATFORMS = [
  { id:"instagram", label:"Instagram", Icon:Camera, color:"#E1306C", followers:48200, growth:12.4, engagement:6.8 },
  { id:"twitter",   label:"Twitter/X", Icon:AtSign, color:"#1DA1F2", followers:22100, growth:3.2,  engagement:2.1 },
  { id:"youtube",   label:"YouTube",   Icon:Video,  color:"#FF0000", followers:8940,  growth:28.6, engagement:9.4 },
];

const METRICS = [
  { key:"impressions", label:"Impressions",    value:284700, change:18.2, Icon:Eye,            color:"#6366F1", seed:1001 },
  { key:"reach",       label:"Reach",          value:142300, change:11.6, Icon:Users,          color:"#D4178A", seed:1002 },
  { key:"engagement",  label:"Engagements",    value:18940,  change:24.3, Icon:Heart,          color:"#F59E0B", seed:1003 },
  { key:"shares",      label:"Shares",         value:3420,   change:-4.1, Icon:Share2,         color:"#10B981", seed:1004 },
];

const TOP_POSTS = [
  { id:1, platform:"instagram", caption:"New shade drop! ✨ Our best-selling formula...",  likes:4820, comments:312, reach:28400 },
  { id:2, platform:"youtube",   caption:"6-month skin transformation using clean beauty...", likes:2940, comments:891, reach:41200 },
  { id:3, platform:"twitter",   caption:"Thread: Everything wrong with synthetic fragrance...", likes:1820, comments:240, reach:19800 },
];

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

function useLiveMetrics(baseMetrics) {
  const [metrics, setMetrics] = useState(baseMetrics);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.value + Math.floor((Math.random()-0.4)*m.value*0.003),
      })));
    }, 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return metrics;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

const Sparkline = memo(function Sparkline({ data, color }) {
  const max = useMemo(()=>Math.max(...data.map(d=>d.value)),[data]);
  const min = useMemo(()=>Math.min(...data.map(d=>d.value)),[data]);
  const w=80, h=32;
  const pts = useMemo(()=>data.map((d,i)=>{
    const x = (i/(data.length-1))*w;
    const y = h - ((d.value-min)/(max-min||1))*(h-4) - 2;
    return `${x},${y}`;
  }).join(" "),[data,max,min,w,h]);

  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
});

// ─── Metric Card ──────────────────────────────────────────────────────────────

const MetricCard = memo(function MetricCard({ m, sparkData }) {
  const up = m.change >= 0;
  return (
    <div className="pu-metric">
      <div className="pu-metric-top">
        <div className="pu-metric-icon" style={{background:`${m.color}15`}}>
          <m.Icon size={14} color={m.color}/>
        </div>
        <div className={`pu-change ${up?"pu-change--up":"pu-change--down"}`}>
          {up?<TrendingUp size={10}/>:<TrendingDown size={10}/>}
          {Math.abs(m.change)}%
        </div>
      </div>
      <div className="pu-metric-value">{m.value.toLocaleString()}</div>
      <div className="pu-metric-label">{m.label}</div>
      <Sparkline data={sparkData} color={m.color}/>
    </div>
  );
});

// ─── Platform Card ────────────────────────────────────────────────────────────

const PlatformCard = memo(function PlatformCard({ p, selected, onSelect }) {
  return (
    <button className={`pu-platform ${selected?"pu-platform--on":""}`}
      style={selected?{borderColor:p.color,background:`${p.color}08`}:{}}
      onClick={()=>onSelect(p.id)} aria-pressed={selected}>
      <p.Icon size={16} color={selected?p.color:"#94A3B8"}/>
      <div>
        <div className="pu-platform-name" style={selected?{color:p.color}:{}}>{p.label}</div>
        <div className="pu-platform-followers">{(p.followers/1000).toFixed(1)}K followers</div>
      </div>
      <div className={`pu-growth ${p.growth>0?"pu-change--up":"pu-change--down"}`}>
        {p.growth>0?"+":""}{p.growth}%
      </div>
    </button>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class PulseErrorBoundary extends Component {
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  render(){
    if(this.state.err)return<div style={{display:"flex",alignItems:"center",gap:10,padding:20,color:"#EF4444"}}><AlertCircle size={18}/><p>Error.</p></div>;
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles=()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .pu-root{font-family:'Inter',sans-serif;background:#07080F;color:#E2E8F0;min-height:100vh;-webkit-font-smoothing:antialiased;}
    .pu-mono{font-family:'JetBrains Mono',monospace;}
    .pu-topbar{background:#0D0E1C;border-bottom:1px solid #1A1B2E;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;}
    .pu-brand{font-size:16px;font-weight:700;color:#E2E8F0;letter-spacing:-0.01em;display:flex;align-items:center;gap:8px;}
    .pu-live{display:flex;align-items:center;gap:6px;font-size:11px;color:#10B981;font-family:'JetBrains Mono',monospace;}
    .pu-live-dot{width:6px;height:6px;border-radius:50%;background:#10B981;animation:livePulse 1.5s ease-in-out infinite;}
    @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}
    .pu-layout{padding:24px;display:flex;flex-direction:column;gap:20px;max-width:1100px;margin:0 auto;}
    .pu-metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
    .pu-metric{background:#0D0E1C;border:1px solid #1A1B2E;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:6px;}
    .pu-metric-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
    .pu-metric-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;}
    .pu-change{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;}
    .pu-change--up{color:#10B981;}
    .pu-change--down{color:#F87171;}
    .pu-metric-value{font-size:24px;font-weight:700;color:#F0F0FF;letter-spacing:-0.02em;}
    .pu-metric-label{font-size:11px;color:#4B5563;margin-bottom:4px;}
    .pu-main-row{display:grid;grid-template-columns:1fr 280px;gap:16px;}
    .pu-chart-card{background:#0D0E1C;border:1px solid #1A1B2E;border-radius:14px;padding:18px;}
    .pu-card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
    .pu-card-title{font-size:14px;font-weight:600;color:#E2E8F0;}
    .pu-card-sub{font-size:10px;color:#4B5563;margin-top:2px;font-family:'JetBrains Mono',monospace;}
    .pu-platforms{display:flex;flex-direction:column;gap:8px;}
    .pu-platform{display:flex;align-items:center;gap:10px;padding:12px;border-radius:11px;border:1px solid #1A1B2E;background:transparent;cursor:pointer;transition:all 0.15s;text-align:left;width:100%;font-family:'Inter',sans-serif;}
    .pu-platform-name{font-size:12px;font-weight:600;color:#E2E8F0;}
    .pu-platform-followers{font-size:10px;color:#4B5563;font-family:'JetBrains Mono',monospace;}
    .pu-growth{font-size:10px;font-weight:700;margin-left:auto;font-family:'JetBrains Mono',monospace;}
    .pu-bottom-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .pu-posts{display:flex;flex-direction:column;gap:8px;}
    .pu-post{display:flex;gap:10px;padding:12px;border-radius:11px;background:#0D0E1C;border:1px solid #1A1B2E;}
    .pu-post-platform{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .pu-post-caption{font-size:12px;color:#94A3B8;line-height:1.5;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .pu-post-stats{display:flex;gap:12px;}
    .pu-post-stat{display:flex;align-items:center;gap:4px;font-size:10px;color:#4B5563;font-family:'JetBrains Mono',monospace;}
    .pu-tooltip{background:#1A1B2E;border:1px solid #2E2E3E;border-radius:8px;padding:8px 12px;}
    .pu-tooltip-label{font-size:10px;color:#4B5563;margin-bottom:4px;font-family:'JetBrains Mono',monospace;}
    .pu-tooltip-val{font-size:13px;font-weight:600;color:#E2E8F0;}
    @media(max-width:700px){.pu-metrics-grid{grid-template-columns:1fr 1fr}.pu-main-row,.pu-bottom-row{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function PulseCore() {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const liveMetrics = useLiveMetrics(METRICS);

  const sparkData = useMemo(()=>METRICS.reduce((acc,m)=>({
    ...acc, [m.key]: genTimeSeries(m.seed, m.value*0.85, m.value*0.08)
  }),{}),[]);

  const chartData = useMemo(()=>genTimeSeries(activePlatform==="instagram"?2001:activePlatform==="twitter"?2002:2003, 12000, 3000),[activePlatform]);

  const CustomTooltip = memo(function CustomTooltip({active,payload,label}){
    if(!active||!payload?.length)return null;
    return<div className="pu-tooltip"><div className="pu-tooltip-label">{label}</div><div className="pu-tooltip-val">{payload[0].value?.toLocaleString()}</div></div>;
  });

  const activePlatformData = useMemo(()=>PLATFORMS.find(p=>p.id===activePlatform),[activePlatform]);

  return (
    <>
      <GlobalStyles/>
      <div className="pu-root">
        <div className="pu-topbar">
          <div className="pu-brand">
            <Zap size={16} color="#D4178A"/> Pulse Analytics
          </div>
          <div className="pu-live">
            <div className="pu-live-dot"/>
            LIVE · Updated 2s ago
          </div>
        </div>

        <div className="pu-layout">
          {/* Metrics */}
          <div className="pu-metrics-grid">
            {liveMetrics.map(m=>(
              <MetricCard key={m.key} m={m} sparkData={sparkData[m.key]||[]}/>
            ))}
          </div>

          {/* Main row */}
          <div className="pu-main-row">
            <div className="pu-chart-card">
              <div className="pu-card-header">
                <div>
                  <div className="pu-card-title">Reach Over Time</div>
                  <div className="pu-card-sub">{activePlatformData?.label} · Last 24 hours</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{top:8,right:8,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="puGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activePlatformData?.color||"#D4178A"} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={activePlatformData?.color||"#D4178A"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1B2E" vertical={false}/>
                  <XAxis dataKey="time" tick={{fill:"#4B5563",fontSize:10}} axisLine={false} tickLine={false} interval={5}/>
                  <YAxis tick={{fill:"#4B5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="value" stroke={activePlatformData?.color||"#D4178A"} strokeWidth={2} fill="url(#puGrad)" isAnimationActive={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pu-chart-card">
              <div className="pu-card-header">
                <div className="pu-card-title">Platforms</div>
              </div>
              <div className="pu-platforms">
                {PLATFORMS.map(p=>(
                  <PlatformCard key={p.id} p={p} selected={activePlatform===p.id} onSelect={setActivePlatform}/>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="pu-bottom-row">
            <div className="pu-chart-card">
              <div className="pu-card-header">
                <div className="pu-card-title">Engagement by Hour</div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={genTimeSeries(3001,800,400,12)} margin={{top:4,right:8,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1B2E" vertical={false}/>
                  <XAxis dataKey="time" tick={{fill:"#4B5563",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#4B5563",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="value" radius={[4,4,0,0]} isAnimationActive={false}>
                    {genTimeSeries(3001,800,400,12).map((_,i)=>(
                      <Cell key={i} fill={i===genTimeSeries(3001,800,400,12).reduce((mi,v,idx,arr)=>v.value>arr[mi].value?idx:mi,0)?"#D4178A":"#1A1B2E"}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pu-chart-card">
              <div className="pu-card-header"><div className="pu-card-title">Top Posts</div></div>
              <div className="pu-posts">
                {TOP_POSTS.map(post=>{
                  const plat = PLATFORMS.find(p=>p.id===post.platform);
                  return(
                    <div key={post.id} className="pu-post">
                      <div className="pu-post-platform" style={{background:`${plat?.color}18`}}>
                        {plat&&<plat.Icon size={14} color={plat.color}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="pu-post-caption">{post.caption}</div>
                        <div className="pu-post-stats">
                          <div className="pu-post-stat"><Heart size={9}/>{post.likes.toLocaleString()}</div>
                          <div className="pu-post-stat"><MessageCircle size={9}/>{post.comments}</div>
                          <div className="pu-post-stat"><Eye size={9}/>{(post.reach/1000).toFixed(1)}k</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Pulse() {
  return <PulseErrorBoundary><PulseCore/></PulseErrorBoundary>;
}
