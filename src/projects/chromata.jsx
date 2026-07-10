/**
 * Chromata — AI-Powered Design Token Generator
 *
 * Hooks demonstrated: useState · useEffect · useCallback · useRef ·
 *   useMemo · useReducer · useId · useLayoutEffect · forwardRef · memo
 * Patterns: AbortController · custom hooks · error boundary · aria-live ·
 *   focus-visible · prefers-reduced-motion · component decomposition
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, forwardRef, Component,
} from "react";
import {
  Sparkles, Copy, Check, RefreshCw,
  Palette, ArrowRight, AlertCircle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAMPLES = [
  "A luxury skincare brand for minimalists who value science over marketing",
  "A fintech app for Gen Z investors who think banking should feel like a game",
  "A boutique hotel inspired by Japanese wabi-sabi and Scandinavian light",
];

const API_PROMPT = (q) => `Generate a complete design token set for: "${q}".
Return ONLY valid JSON, no markdown, no explanation:
{
  "brandName": "evocative 1-3 word name",
  "tagline": "5-8 word tagline",
  "personality": "2 sentences describing brand personality",
  "colors": {
    "primary":    { "hex": "#RRGGBB", "name": "color name", "role": "primary actions" },
    "secondary":  { "hex": "#RRGGBB", "name": "color name", "role": "supporting elements" },
    "accent":     { "hex": "#RRGGBB", "name": "color name", "role": "highlights, data viz" },
    "background": { "hex": "#RRGGBB", "name": "color name", "role": "page background" },
    "surface":    { "hex": "#RRGGBB", "name": "color name", "role": "cards, panels" },
    "text":       { "hex": "#RRGGBB", "name": "color name", "role": "body copy" }
  },
  "typography": {
    "display": { "family": "Google Font name", "weight": "400", "character": "one adjective" },
    "body":    { "family": "Google Font name", "weight": "400", "character": "one adjective" }
  },
  "radius": "sharp | subtle | rounded | pill",
  "mood": "3 comma-separated adjectives"
}`;

// ─── State Management (useReducer) ────────────────────────────────────────────

const initialState = {
  status: "idle",   // "idle" | "loading" | "success" | "error"
  result: null,
  error: null,
  animKey: 0,
};

function themeReducer(state, action) {
  switch (action.type) {
    case "GENERATE_START":
      return { ...initialState, status: "loading" };
    case "GENERATE_SUCCESS":
      return { status: "success", result: action.payload, error: null, animKey: state.animKey + 1 };
    case "GENERATE_ERROR":
      return { ...state, status: "error", error: action.payload };
    default:
      return state;
  }
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/**
 * usePrefersReducedMotion
 * Reactively tracks the OS-level prefers-reduced-motion media query.
 * Used to disable JS-driven animations for accessibility.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler); // cleanup listener
  }, []);
  return reduced;
}

/**
 * useCopyToClipboard
 * Reusable clipboard hook. Manages its own reset timer via useEffect
 * cleanup so setState never fires on an unmounted consumer.
 */
function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  // Guaranteed cleanup — prevents setState on unmounted component
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);
    });
  }, [resetMs]);

  return [copied, copy];
}

/**
 * useThemeGenerator
 * Encapsulates all API + state logic behind a clean interface.
 * Uses AbortController so stale in-flight requests are cancelled
 * before each new one fires, and on component unmount.
 */
function useThemeGenerator() {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  const abortRef = useRef(null); // holds active AbortController

  // Cancel any in-flight request when the component using this hook unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(async (prompt) => {
    const q = prompt?.trim();
    if (!q) return;

    // Abort the previous request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "GENERATE_START" });

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal, // wire AbortController signal to fetch
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: API_PROMPT(q) }],
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      const raw = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

      dispatch({ type: "GENERATE_SUCCESS", payload: parsed });
    } catch (err) {
      if (err.name === "AbortError") return; // cancelled — not a real error
      dispatch({ type: "GENERATE_ERROR", payload: "Generation failed. Check your connection and try again." });
    }
  }, []); // prompt passed as arg — not captured from closure, so no dep needed

  return { state, generate };
}

// ─── forwardRef Component ─────────────────────────────────────────────────────

/**
 * BrandTextarea — forwardRef so ChromataCore can call .focus()
 * on the underlying DOM node without prop-drilling a callback.
 */
const BrandTextarea = forwardRef(function BrandTextarea(
  { id, value, onChange, onKeyDown, disabled },
  ref
) {
  return (
    <div className="ch-textarea-wrap">
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={3}
        placeholder="A luxury skincare brand for minimalists who value science over marketing..."
        aria-multiline="true"
        aria-describedby="ch-textarea-hint"
      />
    </div>
  );
});

// ─── Presentational Components (React.memo) ───────────────────────────────────

/**
 * ColorSwatch — memo'd so it only re-renders when its specific
 * color data changes. Keyboard accessible: Tab to focus, Enter/Space to copy.
 */
const ColorSwatch = memo(function ColorSwatch({ colorKey, color, index, reduced }) {
  const [hexCopied, copyHex] = useCopyToClipboard();

  const handleCopy = useCallback(() => copyHex(color.hex), [color.hex, copyHex]);
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCopy(); }
  }, [handleCopy]);

  return (
    <div
      className="swatch-in ch-swatch"
      style={{ animationDelay: reduced ? "0s" : `${index * 0.07}s` }}
      role="button"
      tabIndex={0}
      aria-label={`${colorKey}: ${color.name}, ${color.hex}. Activate to copy hex.`}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
    >
      <div className="ch-swatch-color" style={{ background: color.hex }}>
        <span className="ch-mono ch-hex-badge">
          {hexCopied ? "Copied!" : color.hex}
        </span>
      </div>
      <div className="ch-swatch-meta">
        <span className="ch-swatch-key">{colorKey}</span>
        <span className="ch-swatch-name">{color.name}</span>
        <span className="ch-swatch-role">{color.role}</span>
      </div>
    </div>
  );
});

/** SkeletonLoader — pure component, memo'd — only ever renders one way */
const SkeletonLoader = memo(function SkeletonLoader() {
  return (
    <div aria-busy="true" aria-label="Generating design tokens…" className="ch-skeleton-grid">
      {[120, 80, 80, 160].map((h, i) => (
        <div key={i} className="shimmer" style={{
          height: h, borderRadius: 14,
          gridColumn: i === 3 ? "1 / -1" : "auto",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
});

/** BrandCard — memo'd; only re-renders when result reference changes */
const BrandCard = memo(function BrandCard({ result }) {
  return (
    <div className="ch-brand-card result-in">
      <div className="ch-brand-top">
        <div>
          <span className="ch-eyebrow" style={{ display: "block", marginBottom: 6 }}>Generated Identity</span>
          <h2 className="ch-display ch-brand-name">{result.brandName}</h2>
          <p className="ch-brand-tagline">{result.tagline}</p>
        </div>
        <div className="ch-mono ch-brand-meta">
          <span>{result.radius} radius</span>
          <span>{result.mood}</span>
        </div>
      </div>
      <p className="ch-brand-personality">{result.personality}</p>
    </div>
  );
});

/**
 * PaletteGrid — memo'd at the grid level.
 * useMemo inside derives colorEntries so Object.entries()
 * doesn't run on every render of the parent.
 */
const PaletteGrid = memo(function PaletteGrid({ colors, reduced }) {
  const entries = useMemo(() => Object.entries(colors), [colors]);
  return (
    <section aria-label="Color tokens" className="ch-palette-section">
      <span className="ch-eyebrow" style={{ display: "block", marginBottom: 10 }}>Color Tokens</span>
      <div className="ch-palette-grid">
        {entries.map(([key, val], i) => (
          <ColorSwatch key={key} colorKey={key} color={val} index={i} reduced={reduced} />
        ))}
      </div>
    </section>
  );
});

/** TypographyPanel — memo'd; re-renders only when typography object changes */
const TypographyPanel = memo(function TypographyPanel({ typography }) {
  return (
    <div className="ch-card result-in ch-type-panel" style={{ animationDelay: "0.15s" }}>
      <span className="ch-eyebrow" style={{ display: "block", marginBottom: 12 }}>Typography</span>
      {["display", "body"].map((t) => (
        <div key={t} style={{ marginBottom: t === "display" ? 14 : 0 }}>
          <span className="ch-eyebrow" style={{ color: "#2E2B50", display: "block", marginBottom: 4 }}>{t}</span>
          <span className="ch-type-family">{typography?.[t]?.family}</span>
          <span className="ch-type-meta">{typography?.[t]?.weight} · {typography?.[t]?.character}</span>
        </div>
      ))}
    </div>
  );
});

/** PreviewPanel — renders generated tokens as a live mini UI preview */
const PreviewPanel = memo(function PreviewPanel({ result }) {
  const { colors, radius, brandName } = result;
  const radiusMap = useMemo(() => ({ pill: 20, rounded: 8, subtle: 4, sharp: 2 }), []);
  const r = radiusMap[radius] ?? 8;

  return (
    <div className="ch-card result-in ch-preview-panel" style={{ animationDelay: "0.2s" }}>
      <span className="ch-eyebrow" style={{ display: "block", marginBottom: 12 }}>Live Preview</span>
      <div className="ch-preview-card" aria-hidden="true">
        <div style={{ height: 5, background: `linear-gradient(90deg, ${colors.primary?.hex}, ${colors.accent?.hex})` }} />
        <div style={{ padding: "12px 14px", background: colors.surface?.hex }}>
          <div style={{
            display: "inline-block", padding: "2px 8px", borderRadius: 20,
            background: colors.primary?.hex + "22", color: colors.primary?.hex,
            fontSize: 9, marginBottom: 6,
          }}>{brandName}</div>
          <div style={{ height: 8, borderRadius: 4, background: colors.text?.hex + "33", marginBottom: 5, width: "80%" }} />
          <div style={{ height: 6, borderRadius: 4, background: colors.text?.hex + "1A", marginBottom: 10, width: "60%" }} />
          <div style={{
            display: "inline-block", padding: "5px 12px", borderRadius: r,
            background: colors.primary?.hex, color: "#fff", fontSize: 9, fontWeight: 500,
          }}>Get started</div>
        </div>
      </div>
    </div>
  );
});

/**
 * TokenExport — memo'd with its own copy state via useCopyToClipboard.
 * useMemo serializes the JSON once; only recomputes when result changes.
 */
const TokenExport = memo(function TokenExport({ result }) {
  const [copied, copy] = useCopyToClipboard();

  const json = useMemo(() => JSON.stringify({
    brand: result.brandName,
    colors: Object.fromEntries(Object.entries(result.colors).map(([k, v]) => [k, v.hex])),
    typography: result.typography,
    borderRadius: result.radius,
  }, null, 2), [result]);

  const handleCopy = useCallback(() => copy(json), [copy, json]);

  return (
    <div className="ch-card result-in ch-export" style={{ animationDelay: "0.25s" }}>
      <div className="ch-export-header">
        <span className="ch-eyebrow">Export Tokens · JSON</span>
        <button className="ch-copy-btn" onClick={handleCopy} aria-label="Copy token JSON to clipboard">
          {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="ch-mono ch-export-pre" tabIndex={0} aria-label="Token JSON output">{json}</pre>
    </div>
  );
});

/** EmptyState — fully static, memo'd so it's only ever created once */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="ch-empty" role="status">
      <div className="orb-pulse ch-orb" aria-hidden="true" />
      <p className="ch-mono ch-empty-label">Your design system appears here</p>
    </div>
  );
});

/** ExampleChips — memo'd; stable onSelect ref from useCallback in parent */
const ExampleChips = memo(function ExampleChips({ onSelect, disabled }) {
  return (
    <div className="ch-chips" role="group" aria-label="Example prompts">
      {EXAMPLES.map((ex, i) => (
        <button key={i} className="ch-chip" onClick={() => onSelect(ex)}
          disabled={disabled} aria-label={`Use example: ${ex}`}>
          <ArrowRight size={10} aria-hidden="true" />
          <span>{ex.split(" ").slice(0, 5).join(" ")}…</span>
        </button>
      ))}
    </div>
  );
});

// ─── Error Boundary (class component — no hook equivalent exists) ─────────────

class ChromataErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("[Chromata]", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="ch-boundary-error" role="alert">
          <AlertCircle size={20} aria-hidden="true" />
          <p>Something went wrong. Refresh the page to reset.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Global Styles ────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .ch-root { font-family: 'Inter', -apple-system, sans-serif; background: #07070D; min-height: 100vh; color: #DDD9FF; -webkit-font-smoothing: antialiased; }
    .ch-inner { max-width: 780px; margin: 0 auto; padding: 40px 24px 80px; }
    .ch-display { font-family: 'DM Serif Display', Georgia, serif; }
    .ch-mono    { font-family: 'JetBrains Mono', 'Courier New', monospace; }

    .ch-textarea-wrap { position: relative; border-radius: 14px; padding: 1px; background: linear-gradient(135deg, #6B5CE7 0%, #9B7BE8 40%, #C084FC 70%, #6B5CE7 100%); background-size: 300% 300%; animation: gradShift 4s ease infinite; }
    .ch-textarea-wrap::before { content: ''; position: absolute; inset: 1px; border-radius: 13px; background: #07070D; }
    .ch-textarea-wrap textarea { position: relative; z-index: 1; background: transparent; border: none; outline: none; width: 100%; resize: none; color: #DDD9FF; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.65; padding: 16px 18px; border-radius: 13px; }
    .ch-textarea-wrap textarea::placeholder { color: #3D3760; }
    .ch-textarea-wrap textarea:disabled { opacity: 0.5; cursor: not-allowed; }
    .ch-textarea-wrap textarea:focus-visible { box-shadow: 0 0 0 2px #6B5CE7 inset; }

    .ch-input-label { display: block; margin-bottom: 8px; font-size: 11px; color: #3D3760; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; text-transform: uppercase; }
    .ch-input-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 12px; }

    .ch-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .ch-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 20px; border: 1px solid #1E1C35; background: transparent; color: #6B5CE7; font-size: 11px; cursor: pointer; transition: border-color 0.15s, color 0.15s; font-family: 'Inter', sans-serif; }
    .ch-chip:hover:not(:disabled) { border-color: #6B5CE7; color: #9B7BE8; }
    .ch-chip:focus-visible { outline: 2px solid #6B5CE7; outline-offset: 2px; border-radius: 20px; }
    .ch-chip:disabled { opacity: 0.35; cursor: not-allowed; }

    .ch-btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; background: #6B5CE7; color: #fff; font-size: 13px; font-weight: 500; border: none; cursor: pointer; transition: background 0.15s, transform 0.1s; font-family: 'Inter', sans-serif; }
    .ch-btn:hover:not(:disabled) { background: #7D6FF0; }
    .ch-btn:active:not(:disabled) { transform: scale(0.98); }
    .ch-btn:focus-visible { outline: 2px solid #C084FC; outline-offset: 3px; }
    .ch-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    .ch-card { border-radius: 14px; background: #0E0E1A; border: 1px solid rgba(255,255,255,0.04); }
    .ch-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #3D3760; }

    .ch-brand-card { margin-bottom: 16px; padding: 20px 22px; border-radius: 14px; background: linear-gradient(135deg, rgba(107,92,231,0.1) 0%, rgba(192,132,252,0.05) 100%); border: 1px solid rgba(107,92,231,0.18); }
    .ch-brand-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .ch-brand-name { font-size: 28px; color: #fff; margin-bottom: 4px; }
    .ch-brand-tagline { font-size: 13px; color: #6B5CE7; }
    .ch-brand-meta { font-size: 10px; color: #3D3760; text-align: right; line-height: 1.8; }
    .ch-brand-meta span { display: block; }
    .ch-brand-personality { margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(107,92,231,0.12); font-size: 12px; color: #4A4670; line-height: 1.7; }

    .ch-palette-section { margin-bottom: 12px; }
    .ch-palette-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .ch-swatch { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: transform 0.12s, box-shadow 0.12s; }
    .ch-swatch:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .ch-swatch:focus-visible { outline: 2px solid #6B5CE7; outline-offset: 2px; }
    .ch-swatch-color { height: 72px; position: relative; }
    .ch-hex-badge { position: absolute; bottom: 8px; right: 10px; font-size: 10px; color: rgba(255,255,255,0.6); text-shadow: 0 1px 3px rgba(0,0,0,0.6); }
    .ch-swatch-meta { padding: 10px 12px; background: #0E0E1A; }
    .ch-swatch-key  { font-size: 11px; color: #DDD9FF; font-weight: 500; display: block; text-transform: capitalize; }
    .ch-swatch-name { font-size: 10px; color: #6B5CE7; display: block; }
    .ch-swatch-role { font-size: 10px; color: #2E2B50; display: block; margin-top: 1px; }

    .ch-panel-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .ch-type-panel { padding: 18px 20px; }
    .ch-type-family { color: #DDD9FF; font-size: 13px; font-weight: 500; display: block; }
    .ch-type-meta { color: #3D3760; font-size: 11px; display: block; margin-top: 2px; }
    .ch-preview-panel { padding: 18px 20px; }
    .ch-preview-card { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }

    .ch-export { padding: 18px 20px; }
    .ch-export-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .ch-copy-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; color: #6B5CE7; font-size: 12px; padding: 4px 8px; border-radius: 6px; transition: color 0.15s, background 0.15s; font-family: 'JetBrains Mono', monospace; }
    .ch-copy-btn:hover { color: #9B7BE8; background: rgba(107,92,231,0.08); }
    .ch-copy-btn:focus-visible { outline: 2px solid #6B5CE7; outline-offset: 2px; }
    .ch-export-pre { font-size: 11px; color: #4A4670; line-height: 1.75; overflow-x: auto; max-height: 180px; scrollbar-width: thin; scrollbar-color: #3D3760 transparent; }
    .ch-export-pre:focus-visible { outline: 2px solid #6B5CE7; border-radius: 4px; }

    .ch-skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ch-empty { text-align: center; padding: 60px 0 40px; }
    .ch-orb { width: 80px; height: 80px; border-radius: 50%; background: radial-gradient(circle, rgba(107,92,231,0.2) 0%, transparent 70%); border: 1px solid rgba(107,92,231,0.15); margin: 0 auto 16px; }
    .ch-empty-label { font-size: 11px; color: #2E2B50; }

    .ch-error { border-radius: 12px; padding: 14px 18px; border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.06); color: #F87171; font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .ch-boundary-error { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-radius: 12px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #F87171; font-size: 13px; margin: 40px 24px; }

    .ch-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .ch-logo-icon { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #6B5CE7, #C084FC); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ch-logo-name { font-size: 11px; letter-spacing: 0.15em; color: #6B5CE7; }
    .ch-headline { font-size: 44px; line-height: 1.1; color: #fff; margin-bottom: 12px; }
    .ch-headline-accent { color: #6B5CE7; }
    .ch-subhead { font-size: 14px; color: #4A4670; max-width: 440px; line-height: 1.6; margin-bottom: 36px; }

    @keyframes gradShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .swatch-in { animation: swatchIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
    @keyframes swatchIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .result-in { animation: resultIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
    @keyframes resultIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .shimmer { background: linear-gradient(90deg, #111120 25%, #1A1A30 50%, #111120 75%); background-size: 400% 100%; animation: shimmerMove 1.4s ease infinite; }
    @keyframes shimmerMove { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
    .orb-pulse { animation: orbPulse 3s ease-in-out infinite; }
    @keyframes orbPulse { 0%, 100% { transform: scale(1); opacity: 0.25; } 50% { transform: scale(1.08); opacity: 0.45; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Respect OS-level motion preference in CSS — JS hook handles JS animations */
    @media (prefers-reduced-motion: reduce) {
      .swatch-in, .result-in, .shimmer, .orb-pulse, .ch-textarea-wrap { animation: none !important; }
    }
  `}</style>
);

// ─── Core Component ───────────────────────────────────────────────────────────

function ChromataCore() {
  const [prompt, setPrompt] = useState("");
  const { state, generate } = useThemeGenerator();
  const reduced = usePrefersReducedMotion();
  const textareaRef = useRef(null);

  // useId — generates a stable, unique ID for label ↔ textarea association
  // Ensures accessibility even when multiple instances render on one page
  const inputId = useId();

  const { status, result, error, animKey } = state;
  const isLoading = status === "loading";

  // useLayoutEffect for focus — fires synchronously after DOM mutations,
  // before paint, so the element is focused before the user sees the screen.
  // Correct choice over useEffect for any DOM measurement or focus operation.
  useLayoutEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = useCallback((e) => setPrompt(e.target.value), []);
  const handleGenerate = useCallback(() => generate(prompt), [generate, prompt]);
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(prompt); }
  }, [generate, prompt]);

  // Stable reference passed to ExampleChips — memo on that component
  // only works if this callback doesn't change identity every render
  const handleExampleSelect = useCallback((ex) => {
    setPrompt(ex);
    generate(ex);
  }, [generate]);

  return (
    <>
      <GlobalStyles />
      <main className="ch-root">
        <div className="ch-inner">

          <header>
            <div className="ch-logo">
              <div className="ch-logo-icon" aria-hidden="true">
                <Palette size={14} color="#fff" />
              </div>
              <span className="ch-mono ch-logo-name">CHROMATA</span>
            </div>
            <h1 className="ch-display ch-headline">
              Describe a feeling.<br />
              <span className="ch-headline-accent">Get a design system.</span>
            </h1>
            <p className="ch-subhead">
              AI-generated color tokens, typography pairings, and brand personality — from a single sentence.
            </p>
          </header>

          <section aria-label="Prompt input">
            <label htmlFor={inputId} className="ch-input-label">
              Brand or mood description
            </label>
            {/* forwardRef component — parent manages focus via ref */}
            <BrandTextarea
              ref={textareaRef}
              id={inputId}
              value={prompt}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            {/* visually hidden hint wired to textarea via aria-describedby */}
            <span id="ch-textarea-hint" style={{ display: "none" }}>
              Describe your brand or mood. Press Enter to generate, Shift+Enter for a new line.
            </span>
            <div className="ch-input-row">
              <ExampleChips onSelect={handleExampleSelect} disabled={isLoading} />
              <button
                className="ch-btn"
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                aria-busy={isLoading}
              >
                {isLoading
                  ? <RefreshCw size={13} aria-hidden="true" style={{ animation: "spin 0.8s linear infinite" }} />
                  : <Sparkles size={13} aria-hidden="true" />
                }
                <span>{isLoading ? "Generating…" : "Generate"}</span>
              </button>
            </div>
          </section>

          {/*
            aria-live="polite" — screen readers announce content changes
            aria-atomic="false" — announces each new child as it appears
            This is the correct pattern for progressive disclosure of results
          */}
          <section
            aria-live="polite"
            aria-atomic="false"
            aria-label="Generated design tokens"
            style={{ marginTop: 28 }}
          >
            {isLoading && <SkeletonLoader />}

            {status === "error" && error && (
              <div className="ch-error" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {status === "success" && result && (
              <div key={animKey}>
                <BrandCard result={result} />
                <PaletteGrid colors={result.colors} reduced={reduced} />
                <div className="ch-panel-row">
                  <TypographyPanel typography={result.typography} />
                  <PreviewPanel result={result} />
                </div>
                <TokenExport result={result} />
              </div>
            )}

            {status === "idle" && <EmptyState />}
          </section>

        </div>
      </main>
    </>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

/**
 * Error boundary wraps ChromataCore so any render-phase exceptions
 * surface a clean fallback UI instead of a blank white screen.
 * Class-based because no hook equivalent for componentDidCatch exists.
 */
export default function Chromata() {
  return (
    <ChromataErrorBoundary>
      <ChromataCore />
    </ChromataErrorBoundary>
  );
}
