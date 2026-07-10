/**
 * Forma — Design Systems Platform
 * Light mode · Glassmorphic · Aurora-dreamy · Layered · Organic
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · useLayoutEffect · memo · forwardRef
 * Patterns: IntersectionObserver · rAF counter · passive scroll ·
 *   prefers-reduced-motion · staggered reveal · error boundary
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, forwardRef, Component,
} from "react";
import { Zap, Cpu, ShieldCheck, ArrowRight, Menu, X, CheckCircle, AlertCircle, Layers } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "Process",  id: "stats"    },
  { label: "Pricing",  id: "cta"      },
];

const STATS = [
  { label: "Teams shipping faster",  raw: 18400, suffix: "+",  decimal: false },
  { label: "Design tokens synced",   raw: 240,   suffix: "M",  decimal: false },
  { label: "Faster release cycles",  raw: 48,    suffix: "×",  decimal: true  },
];

const FEATURES = [
  {
    id: "tokens",
    eyebrow: "Token Automation",
    title: "Figma to code without the copy-paste.",
    body: "Forma watches your Figma library and pushes token changes the moment you publish — colors, spacing, radius — straight to your repo as a PR.",
    Icon: Zap, hue: "#7C3AED", rotate: "-1.2deg",
  },
  {
    id: "intelligence",
    eyebrow: "Component AI",
    title: "Stories and a11y tests, written for you.",
    body: "Point Forma at a component. It reads your props, generates Storybook stories for every variant, and writes the WCAG audit suite. All on push.",
    Icon: Cpu, hue: "#2563EB", rotate: "0.8deg",
  },
  {
    id: "drift",
    eyebrow: "Drift Detection",
    title: "Catch inconsistencies before they ship.",
    body: "Forma runs a design-spec diff on every pull request and flags components that have drifted from your system. Review it like any code review.",
    Icon: ShieldCheck, hue: "#DB2777", rotate: "-0.6deg",
  },
];

const CHECKS = [
  "Figma plugin included", "GitHub, GitLab, Bitbucket",
  "Storybook 7 + 8 ready", "SOC 2 Type II certified",
];

// ─── State ────────────────────────────────────────────────────────────────────

const navInit = { open: false };
function navReducer(state, action) {
  switch (action.type) {
    case "TOGGLE": return { open: !state.open };
    case "CLOSE":  return { open: false };
    default:       return state;
  }
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/** IntersectionObserver — disconnects after first fire, no memory leak */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSeen(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect(); // cleanup
  }, [seen, threshold]);
  return [ref, seen];
}

/** rAF counter with cubic ease-out + cleanup on unmount */
function useCountUp(target, duration = 1800, started = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!started || target === 0) return;
    let t0 = null;
    const tick = (now) => {
      if (!t0) t0 = now;
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current); // cleanup
  }, [target, duration, started]);
  return count;
}

/** Passive scroll — tells browser not to expect preventDefault() */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h); // cleanup
  }, []);
  return y;
}

/** Reactive OS-level reduced-motion preference */
function usePrefersReducedMotion() {
  const [r, setR] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = (e) => setR(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h); // cleanup
  }, []);
  return r;
}

// ─── forwardRef Section ───────────────────────────────────────────────────────

const Section = forwardRef(function Section({ id, className = "", style, children }, ref) {
  return (
    <section ref={ref} id={id} className={`fm-section ${className}`} style={style}>
      {children}
    </section>
  );
});

// ─── Presentational Components ────────────────────────────────────────────────

/** Glass nav — scrolled state adds stronger blur + shadow */
const Navbar = memo(function Navbar({ state, dispatch, scrollY, onNav }) {
  const scrolled = scrollY > 30;

  useEffect(() => {
    if (scrollY > 80 && state.open) dispatch({ type: "CLOSE" });
  }, [scrollY, state.open, dispatch]);

  return (
    <nav className={`fm-nav ${scrolled ? "fm-nav--scrolled" : ""}`} aria-label="Main navigation">
      <div className="fm-nav-inner">
        <a href="#hero" className="fm-logo" onClick={(e) => { e.preventDefault(); onNav("hero"); }}>
          <div className="fm-logo-mark" aria-hidden="true"><Layers size={14} color="#fff" /></div>
          <span className="fm-logo-text">Forma</span>
        </a>
        <div className="fm-nav-links" role="list">
          {NAV_LINKS.map(l => (
            <a key={l.id} href={`#${l.id}`} className="fm-nav-link" role="listitem"
              onClick={(e) => { e.preventDefault(); onNav(l.id); }}>{l.label}</a>
          ))}
        </div>
        <div className="fm-nav-end">
          <a href="#cta" className="fm-nav-ghost" onClick={(e) => { e.preventDefault(); onNav("cta"); }}>Log in</a>
          <a href="#cta" className="fm-nav-cta" onClick={(e) => { e.preventDefault(); onNav("cta"); }}>Get started</a>
          <button className="fm-hamburger" onClick={() => dispatch({ type: "TOGGLE" })}
            aria-expanded={state.open} aria-label={state.open ? "Close menu" : "Open menu"}>
            {state.open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <div id="fm-mobile-menu" className={`fm-mobile ${state.open ? "fm-mobile--open" : ""}`} aria-hidden={!state.open}>
        {NAV_LINKS.map(l => (
          <a key={l.id} href={`#${l.id}`} className="fm-mobile-link" tabIndex={state.open ? 0 : -1}
            onClick={(e) => { e.preventDefault(); onNav(l.id); dispatch({ type: "CLOSE" }); }}>{l.label}</a>
        ))}
        <a href="#cta" className="fm-mobile-cta" tabIndex={state.open ? 0 : -1}
          onClick={(e) => { e.preventDefault(); onNav("cta"); dispatch({ type: "CLOSE" }); }}>
          Get started free
        </a>
      </div>
    </nav>
  );
});

/** Glass mock UI — light-mode redesign matching the aurora palette */
const MockUI = memo(function MockUI() {
  return (
    <div className="fm-mock" aria-hidden="true" role="presentation">
      <div className="fm-mock-bar">
        <span className="fm-dot fm-dot--r" /><span className="fm-dot fm-dot--y" /><span className="fm-dot fm-dot--g" />
        <span className="fm-mono fm-mock-file">Button.tsx — Forma Studio</span>
      </div>
      <div className="fm-mock-body">
        {/* Props panel */}
        <div className="fm-mock-props">
          <span className="fm-mock-section">COMPONENT</span>
          <div className="fm-mock-field"><span>Variant</span><span className="fm-mock-pill">Primary ▾</span></div>
          <div className="fm-mock-field"><span>Size</span><span className="fm-mock-pill">Large ▾</span></div>
          <div className="fm-mock-field"><span>Icon</span><span className="fm-mock-pill">None ▾</span></div>
          <div className="fm-mock-rule" />
          <span className="fm-mock-section">TOKENS</span>
          <div className="fm-mock-token">
            <span className="fm-tok-swatch" style={{ background: "#7C3AED" }} />
            <span className="fm-tok-name">--color-brand</span>
            <code className="fm-mono fm-tok-hex">#7C3AED</code>
          </div>
          <div className="fm-mock-token">
            <span className="fm-tok-swatch" style={{ background: "#DB2777" }} />
            <span className="fm-tok-name">--color-accent</span>
            <code className="fm-mono fm-tok-hex">#DB2777</code>
          </div>
          <div className="fm-mock-token">
            <span className="fm-tok-swatch" style={{ background: "#F5F4FF", border: "1px solid #DDD6FE" }} />
            <span className="fm-tok-name">--radius-lg</span>
            <code className="fm-mono fm-tok-hex">12px</code>
          </div>
        </div>
        {/* Preview panel */}
        <div className="fm-mock-preview">
          <span className="fm-mock-section">PREVIEW</span>
          <button className="fm-mock-btn">Get Started</button>
          <div className="fm-mock-rule" style={{ margin: "12px 0 8px" }} />
          <span className="fm-mock-section">AUDIT</span>
          <div className="fm-audit fm-audit--pass">✓ Renders correctly</div>
          <div className="fm-audit fm-audit--pass">✓ 4.5:1 contrast ratio</div>
          <div className="fm-audit fm-audit--pass">✓ Focus ring visible</div>
          <div className="fm-audit fm-audit--warn">⚠ aria-label on icon variant</div>
        </div>
      </div>
    </div>
  );
});

/** Stat item with rAF count-up — memo isolates re-renders to each counter */
const StatItem = memo(function StatItem({ stat, started, reduced }) {
  const { label, raw, suffix, decimal } = stat;
  const counted = useCountUp(decimal ? raw * 10 : raw, 1800, started && !reduced);
  const display = useMemo(() => {
    const n = reduced ? raw : counted;
    return decimal ? (n / 10).toFixed(1) : n.toLocaleString();
  }, [reduced, decimal, raw, counted]);

  return (
    <div className="fm-stat" aria-label={`${display}${suffix} — ${label}`}>
      <span className="fm-stat-num fm-syne">
        {display}<span className="fm-stat-suffix">{suffix}</span>
      </span>
      <span className="fm-stat-label">{label}</span>
    </div>
  );
});

/** Feature card — IntersectionObserver reveal + organic rotation */
const FeatureCard = memo(function FeatureCard({ feature, index, reduced }) {
  const [ref, inView] = useInView(0.1);
  const { eyebrow, title, body, Icon, hue, rotate } = feature;

  return (
    <article
      ref={ref}
      className={`fm-card fm-reveal ${inView ? "fm-in-view" : ""}`}
      style={{
        transitionDelay: reduced ? "0ms" : `${index * 110}ms`,
        "--card-rotate": rotate,
        "--card-hue": hue,
      }}
    >
      <div className="fm-card-icon" style={{ background: `${hue}15`, border: `1px solid ${hue}30` }}>
        <Icon size={18} color={hue} aria-hidden="true" />
      </div>
      <span className="fm-card-eyebrow fm-mono" style={{ color: hue }}>{eyebrow}</span>
      <h3 className="fm-card-title fm-syne">{title}</h3>
      <p className="fm-card-body">{body}</p>
      <span className="fm-card-link" style={{ color: hue }}>
        Learn more <ArrowRight size={13} aria-hidden="true" />
      </span>
    </article>
  );
});

/** Check item — pure, fully static */
const Check = memo(function Check({ text }) {
  return (
    <div className="fm-check">
      <CheckCircle size={14} color="#7C3AED" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class FormaErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e, i) { console.error("[Forma]", e, i.componentStack); }
  render() {
    if (this.state.err) return (
      <div className="fm-err-boundary" role="alert">
        <AlertCircle size={18} aria-hidden="true" />
        <p>Page failed to load. Refresh to retry.</p>
      </div>
    );
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=Nunito:ital,wght@0,300;0,400;0,500;0,600;1,300&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    /* ── Root & Aurora ── */
    .fm-root { font-family: 'Nunito', system-ui, sans-serif; background: #F4F2FF; color: #2D1B69; min-height: 100vh; overflow-x: hidden; position: relative; -webkit-font-smoothing: antialiased; }

    /* Four fixed aurora blobs — they stay in place as content scrolls over them */
    .fm-aurora { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .fm-blob { position: absolute; border-radius: 50%; filter: blur(80px); }
    .fm-blob-1 { width: 680px; height: 680px; top: -180px; left: -120px; background: radial-gradient(circle, rgba(167,139,250,0.38) 0%, transparent 65%); animation: drift1 16s ease-in-out infinite; }
    .fm-blob-2 { width: 560px; height: 560px; bottom: -80px; right: -80px; background: radial-gradient(circle, rgba(110,231,183,0.28) 0%, transparent 65%); animation: drift2 20s ease-in-out infinite; }
    .fm-blob-3 { width: 480px; height: 480px; top: 35%; right: -60px; background: radial-gradient(circle, rgba(251,182,206,0.32) 0%, transparent 65%); animation: drift3 14s ease-in-out infinite; }
    .fm-blob-4 { width: 400px; height: 400px; top: 55%; left: 10%; background: radial-gradient(circle, rgba(147,197,253,0.24) 0%, transparent 65%); animation: drift4 18s ease-in-out infinite; }

    @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(30px,-24px) scale(1.05)} 75%{transform:translate(-18px,14px) scale(0.97)} }
    @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-22px,18px) scale(1.04)} 70%{transform:translate(16px,-12px) scale(0.98)} }
    @keyframes drift3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-28px,20px) scale(1.06)} }
    @keyframes drift4 { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(20px,-16px) scale(1.03)} }

    /* Everything above the aurora */
    .fm-page { position: relative; z-index: 1; }
    .fm-inner { max-width: 1060px; margin: 0 auto; padding: 0 24px; }
    .fm-syne { font-family: 'Fraunces', Georgia, serif; }
    .fm-mono { font-family: 'JetBrains Mono', monospace; }
    .fm-section { padding: 100px 0; }

    /* ── Glass mixin ── */
    .fm-glass {
      background: rgba(255,255,255,0.68);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      border: 1px solid rgba(255,255,255,0.9);
      box-shadow: 0 4px 32px rgba(109,40,217,0.07), 0 1px 0 rgba(255,255,255,1) inset;
    }

    /* ── Nav ── */
    .fm-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; transition: background 0.25s, box-shadow 0.25s; }
    .fm-nav--scrolled { background: rgba(244,242,255,0.82); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); box-shadow: 0 1px 0 rgba(139,92,246,0.12); }
    .fm-nav-inner { max-width: 1060px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .fm-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
    .fm-logo-mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #7C3AED, #DB2777); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(124,58,237,0.35); }
    .fm-logo-text { font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 18px; color: #1E1245; letter-spacing: -0.02em; }
    .fm-nav-links { display: flex; gap: 2px; }
    .fm-nav-link { padding: 7px 14px; border-radius: 10px; font-size: 14px; color: #5E4D8A; text-decoration: none; transition: color 0.14s, background 0.14s; font-weight: 500; }
    .fm-nav-link:hover { color: #1E1245; background: rgba(124,58,237,0.07); }
    .fm-nav-link:focus-visible { outline: 2px solid #7C3AED; outline-offset: 2px; }
    .fm-nav-end { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .fm-nav-ghost { padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #5E4D8A; text-decoration: none; transition: color 0.14s; }
    .fm-nav-ghost:hover { color: #1E1245; }
    .fm-nav-cta { padding: 9px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #fff; background: linear-gradient(135deg, #7C3AED, #DB2777); text-decoration: none; box-shadow: 0 4px 18px rgba(124,58,237,0.28); transition: box-shadow 0.15s, transform 0.1s; }
    .fm-nav-cta:hover { box-shadow: 0 6px 24px rgba(124,58,237,0.38); transform: translateY(-1px); }
    .fm-nav-cta:focus-visible { outline: 2px solid #7C3AED; outline-offset: 3px; }
    .fm-hamburger { display: none; background: none; border: none; color: #5E4D8A; cursor: pointer; padding: 6px; border-radius: 8px; }
    .fm-hamburger:focus-visible { outline: 2px solid #7C3AED; }

    /* Mobile menu */
    .fm-mobile { display: none; flex-direction: column; padding: 8px 16px 20px; border-top: 1px solid rgba(139,92,246,0.12); background: rgba(244,242,255,0.95); backdrop-filter: blur(16px); max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    .fm-mobile--open { max-height: 320px; }
    .fm-mobile-link { display: block; padding: 13px 4px; color: #5E4D8A; text-decoration: none; font-size: 16px; font-weight: 500; border-bottom: 1px solid rgba(139,92,246,0.08); }
    .fm-mobile-cta { display: block; margin-top: 14px; padding: 13px; text-align: center; border-radius: 12px; background: linear-gradient(135deg,#7C3AED,#DB2777); color: #fff; font-weight: 600; text-decoration: none; }
    @media(max-width:680px) { .fm-nav-links,.fm-nav-ghost,.fm-nav-cta{display:none} .fm-hamburger{display:flex} .fm-mobile{display:flex} }

    /* ── Hero ── */
    .fm-hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 80px; gap: 48px; max-width: 1060px; margin: 0 auto; }
    .fm-hero-text { max-width: 700px; }
    .fm-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.18); font-size: 12px; font-weight: 600; color: #7C3AED; margin-bottom: 28px; letter-spacing: 0.02em; }
    .fm-badge-pulse { width: 6px; height: 6px; border-radius: 50%; background: #7C3AED; animation: blink 2.2s ease-in-out infinite; }
    @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.3} }
    .fm-h1 { font-size: clamp(40px,6vw,72px); font-weight: 700; line-height: 1.04; letter-spacing: -0.03em; color: #1E1245; margin-bottom: 22px; }
    .fm-gradient { background: linear-gradient(135deg, #7C3AED 0%, #DB2777 55%, #F59E0B 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .fm-hero-sub { font-size: 18px; color: #5E4D8A; line-height: 1.65; font-weight: 300; max-width: 500px; margin: 0 auto 36px; }
    .fm-actions { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
    .fm-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 14px; font-size: 15px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: box-shadow 0.15s, transform 0.1s; font-family: 'Nunito', sans-serif; }
    .fm-btn--primary { background: linear-gradient(135deg, #7C3AED, #DB2777); color: #fff; box-shadow: 0 8px 28px rgba(124,58,237,0.32); }
    .fm-btn--primary:hover { box-shadow: 0 12px 36px rgba(124,58,237,0.42); transform: translateY(-2px); }
    .fm-btn--primary:focus-visible { outline: 2px solid #7C3AED; outline-offset: 3px; }
    .fm-btn--ghost { background: rgba(255,255,255,0.6); color: #5E4D8A; border: 1px solid rgba(124,58,237,0.15); backdrop-filter: blur(8px); }
    .fm-btn--ghost:hover { background: rgba(255,255,255,0.85); color: #1E1245; }
    .fm-btn--ghost:focus-visible { outline: 2px solid #7C3AED; outline-offset: 2px; }
    .fm-social { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .fm-avatars { display: flex; }
    .fm-avatar { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #F4F2FF; margin-left: -7px; }
    .fm-avatar:first-child { margin-left: 0; }
    .fm-social-text { font-size: 13px; color: #9B8FBF; }
    .fm-social-text strong { color: #5E4D8A; }

    /* Hero mock UI */
    .fm-mock-wrap { position: relative; width: 100%; max-width: 500px; }
    .fm-mock-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 130%; height: 130%; background: radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, rgba(219,39,119,0.08) 40%, transparent 70%); filter: blur(30px); pointer-events: none; z-index: 0; border-radius: 50%; }
    .fm-mock { position: relative; z-index: 1; border-radius: 18px; overflow: hidden; background: rgba(255,255,255,0.82); backdrop-filter: blur(24px) saturate(200%); border: 1px solid rgba(255,255,255,0.95); box-shadow: 0 20px 60px rgba(109,40,217,0.12), 0 2px 8px rgba(109,40,217,0.06); animation: mockLevitate 7s ease-in-out infinite; }
    @keyframes mockLevitate { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    .fm-mock-bar { display: flex; align-items: center; gap: 5px; padding: 10px 16px; background: rgba(245,244,255,0.9); border-bottom: 1px solid rgba(139,92,246,0.1); }
    .fm-dot { width: 10px; height: 10px; border-radius: 50%; }
    .fm-dot--r { background: #FC5753; }
    .fm-dot--y { background: #FDBC40; }
    .fm-dot--g { background: #33C748; }
    .fm-mock-file { font-size: 10px; color: #9B8FBF; margin-left: 8px; }
    .fm-mock-body { display: flex; }
    .fm-mock-props { flex: 1; padding: 14px; border-right: 1px solid rgba(139,92,246,0.1); }
    .fm-mock-preview { flex: 1; padding: 14px; }
    .fm-mock-section { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #C4BAE0; display: block; margin-bottom: 8px; }
    .fm-mock-field { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; color: #9B8FBF; }
    .fm-mock-pill { background: rgba(124,58,237,0.08); color: #7C3AED; padding: 1px 7px; border-radius: 6px; font-size: 10px; font-weight: 500; }
    .fm-mock-rule { height: 1px; background: rgba(139,92,246,0.1); margin: 10px 0; }
    .fm-mock-token { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; }
    .fm-tok-swatch { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .fm-tok-name { font-size: 9px; color: #9B8FBF; flex: 1; }
    .fm-tok-hex { font-size: 9px; color: #C4BAE0; }
    .fm-mock-btn { display: block; width: 100%; padding: 8px 0; border-radius: 8px; background: linear-gradient(135deg,#7C3AED,#DB2777); color: #fff; font-size: 11px; font-weight: 600; border: none; margin-top: 10px; cursor: default; font-family: 'Nunito', sans-serif; box-shadow: 0 4px 14px rgba(124,58,237,0.3); }
    .fm-audit { font-size: 10px; line-height: 1.7; }
    .fm-audit--pass { color: #059669; }
    .fm-audit--warn { color: #D97706; }

    /* ── Stats ── */
    .fm-stats-strip { border-radius: 24px; padding: 36px 48px; display: grid; grid-template-columns: repeat(3,1fr); gap: 0; }
    .fm-stat { text-align: center; padding: 12px 24px; border-right: 1px solid rgba(139,92,246,0.12); }
    .fm-stat:last-child { border-right: none; }
    .fm-stat-num { display: block; font-size: 52px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; background: linear-gradient(135deg,#7C3AED,#DB2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
    .fm-stat-suffix { font-size: 32px; }
    .fm-stat-label { font-size: 13px; color: #9B8FBF; font-weight: 400; }
    @media(max-width:580px) { .fm-stats-strip{grid-template-columns:1fr;padding:24px} .fm-stat{border-right:none;border-bottom:1px solid rgba(139,92,246,0.1)} .fm-stat:last-child{border-bottom:none} }

    /* ── Features ── */
    .fm-section-header { text-align: center; margin-bottom: 56px; }
    .fm-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #7C3AED; display: block; margin-bottom: 10px; }
    .fm-section-title { font-size: clamp(28px,4vw,44px); font-weight: 700; color: #1E1245; letter-spacing: -0.02em; line-height: 1.1; }
    .fm-section-sub { font-size: 16px; color: #9B8FBF; max-width: 440px; margin: 14px auto 0; line-height: 1.65; font-weight: 300; }
    .fm-cards-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }

    /* Glass card with organic rotation — rotation lives in CSS custom prop --card-rotate */
    .fm-card {
      padding: 28px 24px; border-radius: 24px;
      background: rgba(255,255,255,0.65);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      border: 1px solid rgba(255,255,255,0.92);
      box-shadow: 0 4px 28px rgba(109,40,217,0.06), 0 1px 0 rgba(255,255,255,1) inset;
      transform: rotate(var(--card-rotate, 0deg));
      transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s, border-color 0.3s;
    }
    .fm-card:hover {
      transform: rotate(0deg) translateY(-6px);
      box-shadow: 0 16px 48px rgba(109,40,217,0.10), 0 1px 0 rgba(255,255,255,1) inset;
      border-color: rgba(255,255,255,1);
    }
    .fm-card-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .fm-card-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; display: block; margin-bottom: 8px; }
    .fm-card-title { font-size: 17px; font-weight: 700; color: #1E1245; line-height: 1.3; margin-bottom: 10px; }
    .fm-card-body { font-size: 13px; color: #9B8FBF; line-height: 1.72; font-weight: 300; margin-bottom: 20px; }
    .fm-card-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; cursor: pointer; }
    @media(max-width:720px) { .fm-cards-grid{grid-template-columns:1fr} .fm-card{transform:none!important} }

    /* ── CTA ── */
    .fm-cta-wrap { border-radius: 32px; padding: 80px 48px; text-align: center; position: relative; overflow: hidden;
      background: rgba(255,255,255,0.60);
      backdrop-filter: blur(32px) saturate(200%);
      -webkit-backdrop-filter: blur(32px) saturate(200%);
      border: 1px solid rgba(255,255,255,0.92);
      box-shadow: 0 8px 48px rgba(109,40,217,0.09), 0 1px 0 rgba(255,255,255,1) inset;
    }
    .fm-cta-inner-blob { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 600px; height: 400px; border-radius: 50%; background: radial-gradient(ellipse,rgba(167,139,250,0.18) 0%,rgba(251,182,206,0.12) 50%,transparent 70%); filter: blur(40px); pointer-events: none; }
    .fm-cta-title { font-size: clamp(28px,4.5vw,52px); font-weight: 700; color: #1E1245; letter-spacing: -0.03em; line-height: 1.08; margin-bottom: 16px; position: relative; z-index: 1; }
    .fm-cta-sub { font-size: 16px; color: #9B8FBF; margin-bottom: 36px; line-height: 1.6; font-weight: 300; position: relative; z-index: 1; }
    .fm-cta-buttons { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; position: relative; z-index: 1; }
    .fm-checks-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; position: relative; z-index: 1; }
    .fm-check { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9B8FBF; font-weight: 400; }

    /* ── Footer ── */
    .fm-footer { border-top: 1px solid rgba(139,92,246,0.1); padding: 32px 24px; text-align: center; }
    .fm-footer-text { font-size: 12px; color: #C4BAE0; font-family: 'JetBrains Mono', monospace; }

    /* ── Reveal ── */
    .fm-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1); }
    .fm-in-view { opacity: 1; transform: translateY(0); }

    /* ── Error boundary ── */
    .fm-err-boundary { display: flex; align-items: center; gap: 10px; padding: 20px 24px; margin: 40px 24px; border-radius: 16px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #DC2626; font-size: 13px; }

    /* ── Reduced motion ── */
    @media(prefers-reduced-motion:reduce) {
      .fm-reveal{transition:none!important;opacity:1;transform:none}
      .fm-mock,.fm-blob-1,.fm-blob-2,.fm-blob-3,.fm-blob-4,.fm-badge-pulse{animation:none!important}
    }
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function FormaCore() {
  const [navState, dispatch] = useReducer(navReducer, navInit);
  const reduced = usePrefersReducedMotion();
  const scrollY = useScrollY();

  // Section refs for smooth-scroll nav (forwardRef makes this clean)
  const heroRef     = useRef(null);
  const statsRef    = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef      = useRef(null);

  // Stable accessible IDs even if multiple instances render on a page
  const heroId = useId();
  const ctaId  = useId();

  // Stats visibility for count-up trigger
  const [statsObsRef, statsInView] = useInView(0.2);

  // Set document title synchronously before paint
  useLayoutEffect(() => {
    const prev = document.title;
    document.title = "Forma — Design Systems, Automated";
    return () => { document.title = prev; };
  }, []);

  // Stable reference for Navbar memo
  const handleNav = useCallback((id) => {
    const map = { hero: heroRef, stats: statsRef, features: featuresRef, cta: ctaRef };
    map[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Avatar gradients — computed once
  const avatars = useMemo(() => [
    "linear-gradient(135deg,#7C3AED,#A855F7)",
    "linear-gradient(135deg,#A855F7,#DB2777)",
    "linear-gradient(135deg,#DB2777,#F59E0B)",
    "linear-gradient(135deg,#2563EB,#7C3AED)",
  ], []);

  return (
    <>
      <GlobalStyles />
      <div className="fm-root">

        {/* Fixed aurora layer — sits behind everything */}
        <div className="fm-aurora" aria-hidden="true">
          <div className="fm-blob fm-blob-1" />
          <div className="fm-blob fm-blob-2" />
          <div className="fm-blob fm-blob-3" />
          <div className="fm-blob fm-blob-4" />
        </div>

        <div className="fm-page">
          <Navbar state={navState} dispatch={dispatch} scrollY={scrollY} onNav={handleNav} />

          {/* ── Hero ── */}
          <Section ref={heroRef} id="hero" style={{ padding: 0 }}>
            <div className="fm-hero" aria-labelledby={heroId}>
              <div className="fm-hero-text">
                <div className="fm-badge" aria-label="Now in public beta">
                  <span className="fm-badge-pulse" aria-hidden="true" />
                  Now in public beta
                </div>
                <h1 className="fm-h1 fm-syne" id={heroId}>
                  The design platform<br />
                  <span className="fm-gradient">teams dream about.</span>
                </h1>
                <p className="fm-hero-sub">
                  Forma syncs your Figma tokens, generates component stories, and
                  catches drift before the PR merges — automatically.
                </p>
                <div className="fm-actions">
                  <button className="fm-btn fm-btn--primary" onClick={() => handleNav("cta")} aria-label="Start your free trial">
                    Start for free <ArrowRight size={15} aria-hidden="true" />
                  </button>
                  <button className="fm-btn fm-btn--ghost" onClick={() => handleNav("features")}>
                    How it works
                  </button>
                </div>
                <div className="fm-social" aria-label="Trusted by 18,000+ teams">
                  <div className="fm-avatars" aria-hidden="true">
                    {avatars.map((bg, i) => (
                      <div key={i} className="fm-avatar" style={{ background: bg }} />
                    ))}
                  </div>
                  <p className="fm-social-text">Loved by <strong>18,000+</strong> design engineers</p>
                </div>
              </div>

              <div className="fm-mock-wrap" aria-hidden="true">
                <div className="fm-mock-glow" />
                <MockUI />
              </div>
            </div>
          </Section>

          {/* ── Stats ── */}
          <Section ref={statsRef} id="stats" style={{ padding: "40px 0 80px" }}>
            <div className="fm-inner">
              <div ref={statsObsRef} className="fm-stats-strip fm-glass" aria-label="Key metrics">
                {STATS.map((s, i) => (
                  <StatItem key={i} stat={s} started={statsInView} reduced={reduced} />
                ))}
              </div>
            </div>
          </Section>

          {/* ── Features ── */}
          <Section ref={featuresRef} id="features">
            <div className="fm-inner">
              <div className="fm-section-header">
                <span className="fm-eyebrow">How it works</span>
                <h2 className="fm-section-title fm-syne">Three problems.<br />One platform.</h2>
                <p className="fm-section-sub">
                  Forma handles the tedious parts so your team ships faster, together.
                </p>
              </div>
              <div className="fm-cards-grid" role="list" aria-label="Forma features">
                {FEATURES.map((f, i) => (
                  <FeatureCard key={f.id} feature={f} index={i} reduced={reduced} />
                ))}
              </div>
            </div>
          </Section>

          {/* ── CTA ── */}
          <Section ref={ctaRef} id="cta">
            <div className="fm-inner">
              <div className="fm-cta-wrap" aria-labelledby={ctaId}>
                <div className="fm-cta-inner-blob" aria-hidden="true" />
                <h2 className="fm-cta-title fm-syne" id={ctaId}>
                  Ready to close the<br />
                  <span className="fm-gradient">design-to-code gap?</span>
                </h2>
                <p className="fm-cta-sub">Set up in under 10 minutes. No configuration required.</p>
                <div className="fm-cta-buttons">
                  <button className="fm-btn fm-btn--primary" aria-label="Start your free Forma trial">
                    Start free trial <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="fm-checks-row" role="list" aria-label="What's included">
                  {CHECKS.map(c => <div key={c} role="listitem"><Check text={c} /></div>)}
                </div>
              </div>
            </div>
          </Section>

          <footer className="fm-footer">
            <p className="fm-footer-text">© 2026 Forma, Inc. — Portfolio piece by Anastasia.</p>
          </footer>
        </div>
      </div>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Forma() {
  return <FormaErrorBoundary><FormaCore /></FormaErrorBoundary>;
}
