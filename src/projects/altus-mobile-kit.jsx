/**
 * Altus — Travel App Mobile UI Kit
 * Three complete phone screens: Explore, Trip Detail, Boarding Pass
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo · memo · forwardRef
 * Patterns: staggered entrance · focus/expand interaction · pure screen components ·
 *   error boundary · keyboard accessible phone selection
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, memo, forwardRef, Component,
} from "react";
import {
  Search, MapPin, Heart, Home, Plane,
  User, ChevronLeft, ChevronRight,
  AlertCircle, Wifi, Battery, Signal,
} from "lucide-react";

// ─── Screen Data ──────────────────────────────────────────────────────────────

const SCREENS = [
  {
    id: "explore",
    label: "Explore",
    desc: "Home dashboard — personalized destination suggestions and upcoming trips, adapting to time of day.",
    tags: ["Home", "Discovery", "Cards"],
  },
  {
    id: "detail",
    label: "Trip Detail",
    desc: "Flight booking confirmation — structured information hierarchy with glassmorphic fare card and upsell options.",
    tags: ["Booking", "Detail", "Upsell"],
  },
  {
    id: "boarding",
    label: "Boarding Pass",
    desc: "Digital boarding pass — dark, dramatic treatment optimised for gate scanning and low-light readability.",
    tags: ["Dark Mode", "Utility", "NFC"],
  },
];

const DESTINATIONS = [
  { name: "Bali",   emoji: "🌴", sub: "Indonesia",  from: "$842",  grad: "linear-gradient(145deg,#0EA5E9,#6366F1)" },
  { name: "Paris",  emoji: "🗼", sub: "France",     from: "$610",  grad: "linear-gradient(145deg,#EC4899,#8B5CF6)" },
  { name: "Tokyo",  emoji: "⛩️", sub: "Japan",      from: "$990",  grad: "linear-gradient(145deg,#F59E0B,#EF4444)" },
];

// ─── State ────────────────────────────────────────────────────────────────────

// No useReducer needed here — two independent state values that don't interact
// useState is the correct, idiomatic choice for flat independent state

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/**
 * useStaggeredEntrance — drives a staggered opacity/transform animation
 * on mount using useEffect. Returns an array of visible booleans,
 * one per phone, triggered with staggered timeouts.
 * Cleans up all timers on unmount.
 */
function useStaggeredEntrance(count, baseDelay = 120) {
  const [visible, setVisible] = useState(() => Array(count).fill(false));
  const timers = useRef([]);

  useEffect(() => {
    timers.current = Array.from({ length: count }, (_, i) =>
      setTimeout(() => {
        setVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 200 + i * baseDelay)
    );
    // Cleanup all pending timers on unmount
    return () => timers.current.forEach(clearTimeout);
  }, [count, baseDelay]);

  return visible;
}

// ─── Screen Components (pure, memo'd) ─────────────────────────────────────────

/** iOS-style status bar */
const StatusBar = memo(function StatusBar({ light = false }) {
  const c = light ? "rgba(255,255,255,0.9)" : "#0F172A";
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px 4px", position:"relative", zIndex:2 }}>
      <span style={{ fontSize:11, fontWeight:600, color:c, fontFamily:"'SF Pro Display',-apple-system,sans-serif" }}>9:41</span>
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:90, height:24, background: light ? "rgba(0,0,0,0.85)" : "#0F172A", borderRadius:"0 0 14px 14px" }} />
      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
        <Signal size={10} color={c} /><Wifi size={10} color={c} /><Battery size={11} color={c} />
      </div>
    </div>
  );
});

/** Tab bar at the bottom of home screen */
const TabBar = memo(function TabBar() {
  const tabs = [
    { Icon: Home,  label: "Explore", active: true  },
    { Icon: Plane, label: "Trips",   active: false },
    { Icon: Heart, label: "Saved",   active: false },
    { Icon: User,  label: "Profile", active: false },
  ];
  return (
    <div style={{ display:"flex", justifyContent:"space-around", padding:"8px 0 12px", borderTop:"1px solid rgba(15,23,42,0.06)", background:"rgba(255,255,255,0.95)", backdropFilter:"blur(12px)" }}>
      {tabs.map(({ Icon, label, active }) => (
        <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
          <Icon size={20} color={active ? "#0EA5E9" : "#94A3B8"} />
          <span style={{ fontSize:9, color: active ? "#0EA5E9" : "#94A3B8", fontWeight: active ? 600 : 400 }}>{label}</span>
        </div>
      ))}
    </div>
  );
});

/** Screen 1 — Explore / Home */
const ExploreScreen = memo(function ExploreScreen() {
  return (
    <div style={{ height:"100%", background:"#F8FAFF", display:"flex", flexDirection:"column", fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif", overflow:"hidden" }}>
      <StatusBar />
      <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 0" }}>
        {/* Greeting */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11, color:"#94A3B8", marginBottom:1 }}>Good morning ✨</p>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#0F172A", letterSpacing:"-0.02em" }}>Where to next?</h2>
        </div>
        {/* Search */}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fff", borderRadius:14, padding:"10px 14px", marginBottom:18, boxShadow:"0 2px 12px rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.1)" }}>
          <Search size={14} color="#94A3B8" />
          <span style={{ fontSize:12, color:"#CBD5E1" }}>Flights, hotels, experiences…</span>
        </div>
        {/* Destinations */}
        <p style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Popular This Week</p>
        <div style={{ display:"flex", gap:8, marginBottom:18, overflowX:"auto", paddingBottom:4 }}>
          {DESTINATIONS.map(d => (
            <div key={d.name} style={{ flex:"0 0 90px", height:110, borderRadius:14, background:d.grad, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"10px 10px", boxShadow:"0 6px 20px rgba(0,0,0,0.12)" }}>
              <span style={{ fontSize:18, lineHeight:1 }}>{d.emoji}</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#fff", marginTop:4 }}>{d.name}</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.75)" }}>from {d.from}</span>
            </div>
          ))}
        </div>
        {/* Upcoming trip */}
        <p style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Upcoming Trip</p>
        <div style={{ borderRadius:16, padding:"12px 14px", background:"#fff", boxShadow:"0 2px 12px rgba(14,165,233,0.07)", border:"1px solid rgba(14,165,233,0.08)", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#0EA5E9,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Plane size={16} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>ATL → CDG</p>
            <p style={{ fontSize:10, color:"#94A3B8" }}>Delta 847 · Mar 12 · 8h 45m</p>
          </div>
          <ChevronRight size={14} color="#CBD5E1" style={{ marginLeft:"auto" }} />
        </div>
        <div style={{ borderRadius:16, padding:"12px 14px", background:"#fff", boxShadow:"0 2px 12px rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.08)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#A855F7,#EC4899)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <MapPin size={14} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>Hotel Costes, Paris</p>
            <p style={{ fontSize:10, color:"#94A3B8" }}>Check-in Mar 14 · 3 nights</p>
          </div>
          <ChevronRight size={14} color="#CBD5E1" style={{ marginLeft:"auto" }} />
        </div>
      </div>
      <TabBar />
    </div>
  );
});

/** Screen 2 — Trip Detail */
const DetailScreen = memo(function DetailScreen() {
  return (
    <div style={{ height:"100%", background:"#F8FAFF", display:"flex", flexDirection:"column", fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif", overflow:"hidden" }}>
      <StatusBar />
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px 12px" }}>
        <div style={{ width:28, height:28, borderRadius:8, background:"rgba(14,165,233,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ChevronLeft size={14} color="#0EA5E9" />
        </div>
        <span style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>Trip Details</span>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px" }}>
        {/* Flight card */}
        <div style={{ borderRadius:20, padding:"18px 16px", background:"linear-gradient(135deg,#0369A1,#4F46E5)", marginBottom:16, boxShadow:"0 12px 32px rgba(3,105,161,0.28)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <p style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>ATL</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.65)" }}>Hartsfield–Jackson</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                <div style={{ width:28, height:1, background:"rgba(255,255,255,0.4)" }} />
                <Plane size={12} color="#fff" />
                <div style={{ width:28, height:1, background:"rgba(255,255,255,0.4)" }} />
              </div>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.6)", marginTop:3 }}>8h 45m · Nonstop</span>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>CDG</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.65)" }}>Charles de Gaulle</p>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", borderTop:"1px solid rgba(255,255,255,0.15)" }}>
            <div>
              <p style={{ fontSize:18, fontWeight:700, color:"#fff" }}>11:20</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>Mar 12, 2026</p>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>Delta</p>
              <p style={{ fontSize:10, fontWeight:700, color:"#fff" }}>DL 847</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:18, fontWeight:700, color:"#fff" }}>19:05</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>Mar 13, 2026</p>
            </div>
          </div>
        </div>
        {/* Passenger */}
        <p style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Passenger</p>
        <div style={{ borderRadius:14, padding:"11px 14px", background:"#fff", border:"1px solid rgba(15,23,42,0.06)", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, fontWeight:600, color:"#0F172A" }}>Stasia Rampertab</span>
          <span style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:"rgba(14,165,233,0.08)", color:"#0EA5E9", fontWeight:600 }}>Economy+</span>
        </div>
        {/* Extras */}
        <p style={{ fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Add-ons</p>
        {[{ l:"Priority boarding", p:"+$25" },{ l:"Extra legroom seat", p:"+$45" }].map(e => (
          <div key={e.l} style={{ borderRadius:14, padding:"11px 14px", background:"#fff", border:"1px solid rgba(15,23,42,0.06)", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#475569" }}>{e.l}</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#64748B" }}>{e.p}</span>
          </div>
        ))}
        {/* Total */}
        <div style={{ borderRadius:14, padding:"12px 14px", background:"rgba(14,165,233,0.05)", border:"1px solid rgba(14,165,233,0.12)", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, fontWeight:600, color:"#0F172A" }}>Total</span>
          <span style={{ fontSize:16, fontWeight:800, color:"#0EA5E9" }}>$387</span>
        </div>
        <button style={{ width:"100%", padding:"13px", borderRadius:14, background:"linear-gradient(135deg,#0EA5E9,#6366F1)", color:"#fff", fontSize:13, fontWeight:700, border:"none", boxShadow:"0 8px 22px rgba(14,165,233,0.3)", marginBottom:16, fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif" }}>
          Select Seats →
        </button>
      </div>
    </div>
  );
});

/** Screen 3 — Boarding Pass (dark, dramatic) */
const BoardingScreen = memo(function BoardingScreen() {
  // Deterministic "QR" pattern — same every render
  const qrRows = useMemo(() => Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => ((r * 7 + c * 3 + r + c) % 3 !== 0))
  ), []);

  return (
    <div style={{ height:"100%", background:"linear-gradient(160deg,#0F172A 0%,#1E1B4B 55%,#312E81 100%)", display:"flex", flexDirection:"column", fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif", overflow:"hidden" }}>
      <StatusBar light />
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"4px 18px 18px", overflowY:"auto" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:18 }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.45)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:4 }}>Boarding Pass</p>
          <h2 style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>ATL → CDG</h2>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>Delta Air Lines · DL 847</p>
        </div>
        {/* Key info grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, marginBottom:18 }}>
          {[{ l:"GATE", v:"D22" },{ l:"SEAT", v:"14A" },{ l:"BOARDS", v:"10:50" }].map(item => (
            <div key={item.l} style={{ textAlign:"center", padding:"12px 4px", background:"rgba(255,255,255,0.06)", borderRadius:item.l === "GATE" ? "12px 0 0 12px" : item.l === "BOARDS" ? "0 12px 12px 0" : "0" }}>
              <p style={{ fontSize:8, color:"rgba(255,255,255,0.4)", letterSpacing:"0.12em", marginBottom:3 }}>{item.l}</p>
              <p style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.01em" }}>{item.v}</p>
            </div>
          ))}
        </div>
        {/* Dashed separator */}
        <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:16 }}>
          <div style={{ width:18, height:18, borderRadius:"50%", background:"#0F172A", flexShrink:0, marginLeft:-18 }} />
          <div style={{ flex:1, borderTop:"1.5px dashed rgba(255,255,255,0.15)" }} />
          <div style={{ width:18, height:18, borderRadius:"50%", background:"#0F172A", flexShrink:0, marginRight:-18 }} />
        </div>
        {/* Barcode */}
        <div style={{ borderRadius:12, padding:"10px 8px", background:"rgba(255,255,255,0.95)", marginBottom:16, display:"flex", gap:1.5, justifyContent:"center", alignItems:"stretch", height:44 }}>
          {Array.from({ length: 42 }, (_, i) => (
            <div key={i} style={{ width: i % 5 === 0 ? 3 : 1.5, background: (i * 3 + i) % 4 === 0 ? "#F8FAFF" : "#0F172A", borderRadius:1 }} />
          ))}
        </div>
        {/* Passenger info */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:1 }}>Stasia Rampertab</p>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>Economy+ · Mar 12, 2026 · Departs 11:20</p>
        </div>
        {/* QR code */}
        <div style={{ display:"flex", justifyContent:"center" }}>
          <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:12, padding:10, display:"inline-block" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1.5 }}>
              {qrRows.flat().map((filled, i) => (
                <div key={i} style={{ width:10, height:10, borderRadius:2, background: filled ? "#0F172A" : "transparent" }} />
              ))}
            </div>
          </div>
        </div>
        <p style={{ textAlign:"center", fontSize:8, color:"rgba(255,255,255,0.25)", marginTop:10, letterSpacing:"0.1em" }}>SCAN AT GATE · ALTUS PASS</p>
      </div>
    </div>
  );
});

// ─── Phone Frame ──────────────────────────────────────────────────────────────

/**
 * PhoneFrame — forwardRef so parent can measure or focus it.
 * memo'd — only re-renders when activeId or its own index changes.
 */
const PhoneFrame = memo(forwardRef(function PhoneFrame(
  { screenId, index, activeId, onSelect, visible },
  ref
) {
  const isActive = activeId === screenId;

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(screenId); }
  }, [onSelect, screenId]);

  // Stagger Y offset for organic arrangement
  const yOffset = [12, 0, 8][index] ?? 0;

  return (
    <div
      ref={ref}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:14,
        opacity: visible ? 1 : 0,
        transform: visible ? `translateY(${yOffset}px) scale(1)` : `translateY(${yOffset + 20}px) scale(0.96)`,
        transition: "opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)",
        transitionDelay: `${index * 0.08}s`,
        cursor: "pointer",
      }}
      onClick={() => onSelect(screenId)}
      onKeyDown={handleKey}
      tabIndex={0}
      role="button"
      aria-label={`View ${SCREENS[index].label} screen. ${isActive ? "Currently selected." : ""}`}
      aria-pressed={isActive}
    >
      {/* Phone body */}
      <div style={{
        width: 200, height: 420,
        borderRadius: 36,
        background: "#1A1A2E",
        padding: 10,
        boxShadow: isActive
          ? "0 32px 80px rgba(14,165,233,0.25), 0 0 0 2px #0EA5E9, 0 0 0 1px rgba(255,255,255,0.1) inset"
          : "0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
        transform: isActive ? "scale(1.04)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s",
      }}>
        {/* Screen */}
        <div style={{ width:"100%", height:"100%", borderRadius:27, overflow:"hidden", background:"#fff" }}>
          {screenId === "explore"  && <ExploreScreen />}
          {screenId === "detail"   && <DetailScreen  />}
          {screenId === "boarding" && <BoardingScreen />}
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign:"center" }}>
        <p style={{ fontSize:12, fontWeight:700, color: isActive ? "#0EA5E9" : "#94A3B8", transition:"color 0.2s" }}>
          {SCREENS[index].label}
        </p>
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:4 }}>
          {SCREENS[index].tags.map(t => (
            <span key={t} style={{ fontSize:9, padding:"2px 7px", borderRadius:8, background:"rgba(255,255,255,0.06)", color:"#475569", border:"1px solid rgba(255,255,255,0.07)" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}));

// ─── Error Boundary ───────────────────────────────────────────────────────────

class AltusErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e, i) { console.error("[Altus]", e, i.componentStack); }
  render() {
    if (this.state.err) return (
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:20,color:"#EF4444",fontFamily:"sans-serif" }}>
        <AlertCircle size={18} /><p>Failed to render. Refresh to retry.</p>
      </div>
    );
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&family=JetBrains+Mono:wght@400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .al-root { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background: #080B14; min-height: 100vh; -webkit-font-smoothing: antialiased; }
    .al-inner { max-width: 820px; margin: 0 auto; padding: 60px 24px 80px; }
    .al-header { margin-bottom: 56px; }
    .al-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #0EA5E9; display: block; margin-bottom: 12px; }
    .al-title { font-family: 'Fraunces', Georgia, serif; font-size: 40px; font-weight: 800; color: #F0F6FF; letter-spacing: -0.02em; line-height: 1.08; margin-bottom: 12px; }
    .al-sub { font-size: 14px; color: #4B5E7A; line-height: 1.65; max-width: 480px; font-weight: 300; }
    .al-phones { display: flex; justify-content: center; align-items: flex-end; gap: 28px; margin-bottom: 48px; }
    .al-info { border-radius: 18px; padding: 24px 28px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); min-height: 80px; transition: opacity 0.3s; }
    .al-info-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #0EA5E9; display: block; margin-bottom: 6px; }
    .al-info-desc { font-size: 13px; color: #64748B; line-height: 1.65; font-weight: 300; }
    .al-meta { margin-top: 40px; display: flex; gap: 20px; flex-wrap: wrap; }
    .al-meta-item { display: flex; flex-direction: column; gap: 3px; }
    .al-meta-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #1E3050; text-transform: uppercase; letter-spacing: 0.1em; }
    .al-meta-value { font-size: 12px; color: #4B5E7A; font-weight: 500; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function AltusCore() {
  // Which phone is focused — null means none
  const [activeId, setActiveId] = useState(null);
  const visible = useStaggeredEntrance(3, 130);
  const phoneRefs = useRef([]);

  // Stable selection handler — memo'd children only re-render when id changes
  const handleSelect = useCallback((id) => {
    setActiveId(prev => prev === id ? null : id);
  }, []);

  // useMemo — derive description once, not on every keystroke/state change
  const activeScreen = useMemo(
    () => SCREENS.find(s => s.id === activeId) ?? null,
    [activeId]
  );

  return (
    <>
      <GlobalStyles />
      <div className="al-root">
        <div className="al-inner">
          <header className="al-header">
            <span className="al-eyebrow">Mobile UI Kit · iOS 17</span>
            <h1 className="al-title">Altus — Travel App</h1>
            <p className="al-sub">
              Three complete screens from a travel booking app —
              home discovery, trip detail, and digital boarding pass.
              Select any screen to inspect it.
            </p>
          </header>

          {/* Phone frames */}
          <div className="al-phones" role="list" aria-label="App screen mockups">
            {SCREENS.map((screen, i) => (
              <div key={screen.id} role="listitem">
                <PhoneFrame
                  ref={el => (phoneRefs.current[i] = el)}
                  screenId={screen.id}
                  index={i}
                  activeId={activeId}
                  onSelect={handleSelect}
                  visible={visible[i]}
                />
              </div>
            ))}
          </div>

          {/* Info panel */}
          <div
            className="al-info"
            aria-live="polite"
            aria-label={activeScreen ? `${activeScreen.label} screen details` : "Select a screen to see details"}
            style={{ opacity: activeScreen ? 1 : 0.4 }}
          >
            {activeScreen ? (
              <>
                <span className="al-info-eyebrow">{activeScreen.label}</span>
                <p className="al-info-desc">{activeScreen.desc}</p>
              </>
            ) : (
              <p className="al-info-desc" style={{ fontStyle:"italic" }}>
                Click any phone to inspect that screen.
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="al-meta" aria-label="Project details">
            {[
              { label:"Platform",  value:"iOS · Android · React Native" },
              { label:"Screens",   value:"3 of 18 in full kit"           },
              { label:"Typeface",  value:"Plus Jakarta Sans"             },
              { label:"Category",  value:"Travel · Booking · Utility"    },
            ].map(m => (
              <div key={m.label} className="al-meta-item">
                <span className="al-meta-label">{m.label}</span>
                <span className="al-meta-value">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Altus() {
  return <AltusErrorBoundary><AltusCore /></AltusErrorBoundary>;
}
