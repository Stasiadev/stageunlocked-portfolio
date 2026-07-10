/**
 * Aura — AI Shade Matching Studio v3
 * Camera-first: live pixel sampling for tone depth + Claude Vision for undertone
 *
 * Architecture:
 *  - getUserMedia → live video → canvas pixel sampling → closest swatch (no AI)
 *  - Capture frame → base64 → Claude Vision → undertone detection
 *  - Static product database → deterministic match (no AI hallucination)
 *  - Claude text API → personalized profile summary only
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · useLayoutEffect · memo · forwardRef · ErrorBoundary
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, forwardRef, Component,
} from "react";
import {
  Camera, Sparkles, RefreshCw, Check, AlertCircle,
  ChevronLeft, SlidersHorizontal, ExternalLink, Sun,
} from "lucide-react";

// ─── Product Database (unchanged from v2) ────────────────────────────────────

const SKIN_TONES = [
  { id: "porcelain", label: "Porcelain", hex: "#F9E4CA", group: 0 },
  { id: "ivory", label: "Ivory", hex: "#F2D4B4", group: 0 },
  { id: "fair", label: "Fair", hex: "#EBC4A0", group: 0 },
  { id: "light", label: "Light", hex: "#E0B48A", group: 1 },
  { id: "light-med", label: "Light Medium", hex: "#D4A478", group: 1 },
  { id: "medium", label: "Medium", hex: "#C29060", group: 1 },
  { id: "med-olive", label: "Medium Olive", hex: "#B07C48", group: 2 },
  { id: "olive", label: "Olive", hex: "#9E6C38", group: 2 },
  { id: "tan", label: "Tan", hex: "#8E5C2C", group: 2 },
  { id: "med-deep", label: "Medium Deep", hex: "#7A4820", group: 3 },
  { id: "deep", label: "Deep", hex: "#623415", group: 3 },
  { id: "rich", label: "Rich", hex: "#4A2010", group: 3 },
];

const UNDERTONES = [
  { id: "cool", label: "Cool", desc: "Pink/bluish hues", swatch: "#E8C0C8" },
  { id: "neutral", label: "Neutral", desc: "No strong lean", swatch: "#D4B48A" },
  { id: "warm", label: "Warm", desc: "Yellow/golden hues", swatch: "#D4A855" },
  { id: "olive", label: "Olive", desc: "Greenish/muted cast", swatch: "#9A9A6A" },
];

const FOUNDATIONS = {
  0: {
    cool: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "104 Soft Ivory", hex: "#F5DCC0", tier: "drugstore" }, { brand: "NARS", product: "Natural Radiant Longwear", shade: "Deauville", hex: "#F4D4B4", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "1 Fair Cool", hex: "#F2D4B8", tier: "luxury" }],
    neutral: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "110 Porcelain", hex: "#F2CCA8", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "100N", hex: "#F8E2CA", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "2 Fair Neutral", hex: "#ECC8A8", tier: "luxury" }],
    warm: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "115 Ivory", hex: "#ECC0A0", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "110W", hex: "#F2D2B4", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "2 Fair Warm", hex: "#F0C898", tier: "luxury" }],
    olive: [{ brand: "L'Oreal", product: "True Match Super-Blendable", shade: "W1 Ivory", hex: "#E8C090", tier: "drugstore" }, { brand: "NARS", product: "Natural Radiant Longwear", shade: "Deauville", hex: "#F0D0B0", tier: "mid-range" }, { brand: "Armani Beauty", product: "Luminous Silk Foundation", shade: "2.5", hex: "#F0CCA8", tier: "luxury" }],
  },
  1: {
    cool: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "120 Classic Ivory", hex: "#E8B880", tier: "drugstore" }, { brand: "NARS", product: "Natural Radiant Longwear", shade: "Syracuse", hex: "#ECC89A", tier: "mid-range" }, { brand: "MAC", product: "Studio Fix Fluid SPF 15", shade: "NC20", hex: "#EACAAA", tier: "mid-range" }],
    neutral: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "125 Nude Beige", hex: "#E4B888", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "175N", hex: "#D0905A", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "5 Light Medium", hex: "#CCA878", tier: "luxury" }],
    warm: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "130 Buff Beige", hex: "#E0A870", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "150W", hex: "#E0A868", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "4 Light Warm", hex: "#D8B488", tier: "luxury" }],
    olive: [{ brand: "L'Oreal", product: "True Match Super-Blendable", shade: "N5 True Beige", hex: "#DAAA70", tier: "drugstore" }, { brand: "MAC", product: "Studio Fix Fluid SPF 15", shade: "NW25", hex: "#E4BC8E", tier: "mid-range" }, { brand: "Armani Beauty", product: "Luminous Silk Foundation", shade: "4.5", hex: "#CCA878", tier: "luxury" }],
  },
  2: {
    cool: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "310 Sun Beige", hex: "#9A7028", tier: "drugstore" }, { brand: "NARS", product: "Natural Radiant Longwear", shade: "Cairo", hex: "#B88848", tier: "mid-range" }, { brand: "MAC", product: "Studio Fix Fluid SPF 15", shade: "NC40", hex: "#CA9868", tier: "mid-range" }],
    neutral: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "320 Natural Tan", hex: "#9A7028", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "270N", hex: "#885020", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "9 Medium Tan", hex: "#9C7040", tier: "luxury" }],
    warm: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "330 Toffee", hex: "#8A6018", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "260W", hex: "#946030", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "10 Tan Warm", hex: "#906238", tier: "luxury" }],
    olive: [{ brand: "L'Oreal", product: "True Match Super-Blendable", shade: "W5 Sun Beige", hex: "#A07830", tier: "drugstore" }, { brand: "MAC", product: "Studio Fix Fluid SPF 15", shade: "NW40", hex: "#CA9258", tier: "mid-range" }, { brand: "NARS", product: "Natural Radiant Longwear", shade: "Macao", hex: "#A87838", tier: "mid-range" }],
  },
  3: {
    cool: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "355 Coconut", hex: "#6A4808", tier: "drugstore" }, { brand: "NARS", product: "Natural Radiant Longwear", shade: "Papete", hex: "#906030", tier: "mid-range" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "420N", hex: "#4C2A10", tier: "mid-range" }],
    neutral: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "360 Mocha", hex: "#664808", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "430N", hex: "#452015", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "13 Deep", hex: "#6C3C20", tier: "luxury" }],
    warm: [{ brand: "Maybelline", product: "Fit Me Matte+Poreless", shade: "370 Toast", hex: "#5A4008", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "450W", hex: "#3E2010", tier: "mid-range" }, { brand: "Charlotte Tilbury", product: "Beautiful Skin Foundation", shade: "14 Deep Warm", hex: "#603018", tier: "luxury" }],
    olive: [{ brand: "L'Oreal", product: "True Match Super-Blendable", shade: "W9 Classic Tan", hex: "#7A5818", tier: "drugstore" }, { brand: "Fenty Beauty", product: "Pro Filt'r Soft Matte", shade: "440N", hex: "#452015", tier: "mid-range" }, { brand: "MAC", product: "Studio Fix Fluid SPF 15", shade: "NW50", hex: "#6A4000", tier: "mid-range" }],
  },
};

const CONCEALERS = {
  0: { cool: { brand: "NARS", product: "Radiant Creamy Concealer", shade: "Chantilly", hex: "#F8DCC8", tip: "Go 1 shade lighter for brightening" }, neutral: { brand: "Tarte", product: "Shape Tape Contour Concealer", shade: "12N Fair", hex: "#F5D8C0", tip: "Match foundation, or lighter for under-eyes" }, warm: { brand: "Maybelline", product: "Instant Age Rewind Eraser", shade: "Fair", hex: "#F0CCA8", tip: "Warm tones prevent ashy under-eyes" }, olive: { brand: "NARS", product: "Radiant Creamy Concealer", shade: "Vanilla", hex: "#F0CEAC", tip: "Avoid strongly pink-toned concealers" } },
  1: { cool: { brand: "NARS", product: "Radiant Creamy Concealer", shade: "Custard", hex: "#ECC8A0", tip: "Cool tones prevent warmth from reading orange" }, neutral: { brand: "Tarte", product: "Shape Tape Contour Concealer", shade: "22N Light", hex: "#E8C090", tip: "The cult classic for balanced undertones" }, warm: { brand: "Maybelline", product: "Instant Age Rewind Eraser", shade: "Light", hex: "#E4B880", tip: "Peach tones neutralize dark circles" }, olive: { brand: "MAC", product: "Pro Longwear Concealer", shade: "NW25", hex: "#E4BC8E", tip: "Use formulas that don't settle into texture" } },
  2: { cool: { brand: "NARS", product: "Radiant Creamy Concealer", shade: "Biscuit", hex: "#C09058", tip: "Cool tones prevent muddy finish on medium-deep skin" }, neutral: { brand: "Tarte", product: "Shape Tape Contour Concealer", shade: "35N Medium", hex: "#B88848", tip: "Go 1-2 shades lighter for under-eye brightening" }, warm: { brand: "Fenty Beauty", product: "Pro Filt'r Instant Retouch Concealer", shade: "260W", hex: "#946030", tip: "Warm correctors offset gray/blue under-eye circles" }, olive: { brand: "MAC", product: "Pro Longwear Concealer", shade: "NW40", hex: "#CA9258", tip: "Avoid yellow-heavy formulas which pull green on olive skin" } },
  3: { cool: { brand: "NARS", product: "Radiant Creamy Concealer", shade: "Caramel", hex: "#7A5020", tip: "Go lighter under eyes for a natural lifted effect" }, neutral: { brand: "Fenty Beauty", product: "Pro Filt'r Instant Retouch Concealer", shade: "430N", hex: "#452015", tip: "Fenty's range is the most comprehensive for rich skin" }, warm: { brand: "Tarte", product: "Shape Tape Contour Concealer", shade: "53W Deep", hex: "#5C3018", tip: "Warm tones add glow without ashy finish" }, olive: { brand: "MAC", product: "Pro Longwear Concealer", shade: "NW50", hex: "#6A4000", tip: "Standard concealers often pull ashy on deep olive skin" } },
};

const LIP_PRODUCTS = {
  0: [{ name: "Pillow Talk", hex: "#C9848C", brand: "Charlotte Tilbury", shade: "Pillow Talk Original", type: "Lipstick", desc: "The iconic dusty rose universally flattering on fair skin" }, { name: "Pink Honey Gloss", hex: "#E8A0A0", brand: "Fenty Beauty", shade: "Gloss Bomb in Fu$$y", type: "Gloss", desc: "Sheer warm pink gloss that adds dimension without overpowering" }, { name: "Ruby Woo", hex: "#8B2020", brand: "MAC", shade: "Ruby Woo", type: "Lipstick", desc: "The classic power red — stunning against fair cool skin" }],
  1: [{ name: "Velvet Teddy", hex: "#C07858", brand: "MAC", shade: "Velvet Teddy", type: "Lipstick", desc: "The ultimate light-skin nude — your lips but perfected" }, { name: "Pillow Talk Med", hex: "#B87070", brand: "Charlotte Tilbury", shade: "Pillow Talk Medium", type: "Lip Liner", desc: "Slightly richer, perfect as liner or worn alone" }, { name: "Whirl", hex: "#9A6878", brand: "MAC", shade: "Whirl", type: "Lipstick", desc: "A cool-toned dusty mauve with cult status for a reason" }],
  2: [{ name: "Chili", hex: "#9A3828", brand: "MAC", shade: "Chili", type: "Lipstick", desc: "Warm brick red — gorgeous contrast on medium-deep skin" }, { name: "Walk of No Shame", hex: "#6B3468", brand: "Charlotte Tilbury", shade: "Walk of No Shame", type: "Lipstick", desc: "Rich plum — sophisticated on olive-medium complexions" }, { name: "Marrakesh", hex: "#A05030", brand: "MAC", shade: "Marrakesh", type: "Lip Liner", desc: "Terra-cotta nude that defines without overpowering" }],
  3: [{ name: "Spice", hex: "#6B3820", brand: "MAC", shade: "Spice", type: "Lipstick", desc: "The legendary chocolate nude — true MLBB for deep skin" }, { name: "Very Victoria", hex: "#4A1830", brand: "Charlotte Tilbury", shade: "Very Victoria", type: "Lipstick", desc: "Burgundy-wine that radiates luxury on deep complexions" }, { name: "Hot Chocolit", hex: "#C0306A", brand: "Fenty Beauty", shade: "Gloss Bomb Hot Chocolit", type: "Gloss", desc: "Bold fuchsia that pops magnificently on rich skin" }],
};

const POWDERS = {
  0: { brand: "Laura Mercier", product: "Translucent Loose Setting Powder", shade: "Translucent", hex: "#F5E0CC", desc: "The gold standard — invisible on fair to light skin" },
  1: { brand: "Charlotte Tilbury", product: "Airbrush Flawless Finish Powder", shade: "1 Fair", hex: "#EED0B0", desc: "Micro-fine formula blurs and perfects without caking" },
  2: { brand: "MAC", product: "Studio Fix Powder Plus Foundation", shade: "NC42", hex: "#C49060", desc: "Sets and perfects in one step for medium-deep skin" },
  3: { brand: "Fenty Beauty", product: "Pro Filt'r Instant Retouch Setting Powder", shade: "Deep 490", hex: "#5A3018", desc: "Formulated specifically to avoid ashy cast on deep skin" },
};

// ─── Color Math ───────────────────────────────────────────────────────────────

/** Parse hex to RGB */
function hexToRGB(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Find closest skin tone by Euclidean distance in RGB space */
function findClosestTone(r, g, b) {
  return SKIN_TONES.reduce((best, tone) => {
    const [tr, tg, tb] = hexToRGB(tone.hex);
    const [br, bg, bb] = hexToRGB(best.hex);
    const d1 = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;
    const d2 = (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2;
    return d1 < d2 ? tone : best;
  }, SKIN_TONES[0]);
}

/** Match products from database */
function matchProducts(tone, undertone) {
  if (!tone || !undertone) return null;
  const g = tone.group;
  const ut = undertone.id;
  return {
    foundations: FOUNDATIONS[g]?.[ut] ?? FOUNDATIONS[g]?.neutral,
    concealer: CONCEALERS[g]?.[ut] ?? CONCEALERS[g]?.neutral,
    lips: LIP_PRODUCTS[g],
    powder: POWDERS[g],
  };
}

// ─── State Machine ────────────────────────────────────────────────────────────
// Phases: choose → camera → analyzing → matched
//                ↘ manual → matched

const initState = {
  phase: "choose",   // "choose"|"camera"|"analyzing"|"matched"|"manual"
  tone: null,
  undertone: null,
  undertoneReason: "",
  sampledRGB: null,
  cameraError: null,
  analysisError: null,
  showManualAdj: false,
  concerns: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "START_CAMERA": return { ...state, phase: "camera", cameraError: null };
    case "CAMERA_ERROR": return { ...state, phase: "choose", cameraError: action.payload };
    case "START_ANALYZING": return { ...state, phase: "analyzing" };
    case "MATCHED": return { ...state, phase: "matched", tone: action.tone, undertone: action.undertone, undertoneReason: action.reason };
    case "ANALYSIS_ERROR": return { ...state, phase: "matched", tone: action.tone, undertone: null, analysisError: "Undertone analysis unavailable — please select below." };
    case "START_MANUAL": return { ...state, phase: "manual", cameraError: null };
    case "SET_SAMPLED": return { ...state, sampledRGB: action.payload };
    case "SET_TONE": return { ...state, tone: action.payload };
    case "SET_UNDERTONE": return { ...state, undertone: action.payload };
    case "TOGGLE_ADJ": return { ...state, showManualAdj: !state.showManualAdj };
    case "TOGGLE_CONCERN": return { ...state, concerns: state.concerns.includes(action.payload) ? state.concerns.filter(c => c !== action.payload) : [...state.concerns, action.payload] };
    case "RESET": return initState;
    default: return state;
  }
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/**
 * useCamera — getUserMedia stream management.
 * Ensures stream tracks are always stopped on unmount or stop().
 */
function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
      return null; // no error
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Camera access denied. Please allow camera permission and try again."
        : "Camera unavailable on this device or browser.";
      return msg;
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return { videoRef, ready, start, stop };
}

/**
 * useColorSampler — rAF loop that samples pixels from the oval
 * center of the video feed every frame. Returns the current
 * average RGB and the closest matching skin tone swatch.
 * Cleanup cancels the pending animation frame on unmount.
 */
function useColorSampler(videoRef, canvasRef, active) {
  const [rgb, setRGB] = useState(null);
  const [closest, setClosest] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const sample = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(sample);
        return;
      }

      const w = 320, h = 320;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, w, h);

      // Sample pixels within the face oval (cx=50%, cy=45%, rx=22%, ry=32%)
      const cx = w * 0.5, cy = h * 0.45;
      const rx = w * 0.22, ry = h * 0.32;
      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        for (let j = 0; j <= steps; j++) {
          const dx = (i / steps - 0.5) * 2;
          const dy = (j / steps - 0.5) * 2;
          if (dx * dx + dy * dy <= 0.85) {
            const px = Math.round(cx + dx * rx);
            const py = Math.round(cy + dy * ry);
            if (px >= 0 && px < w && py >= 0 && py < h) {
              const p = ctx.getImageData(px, py, 1, 1).data;
              rSum += p[0]; gSum += p[1]; bSum += p[2];
              count++;
            }
          }
        }
      }

      if (count > 0) {
        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);
        setRGB({ r, g, b });
        setClosest(findClosestTone(r, g, b));
      }

      rafRef.current = requestAnimationFrame(sample); // loop
    };

    rafRef.current = requestAnimationFrame(sample);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }; // cleanup
  }, [active, videoRef, canvasRef]);

  return { rgb, closest };
}

/**
 * Captures the current video frame, compresses to 256×256 JPEG,
 * and returns base64 for Claude Vision API.
 */
function captureFrame(videoRef) {
  const video = videoRef.current;
  if (!video) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  // Mirror to match display (front camera CSS mirror)
  ctx.translate(256, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, 256, 256);
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
}

// ─── Presentational Components ────────────────────────────────────────────────

const TIER_BADGE = {
  drugstore: { bg: "rgba(34,197,94,0.08)", color: "#16A34A" },
  "mid-range": { bg: "rgba(59,130,246,0.08)", color: "#2563EB" },
  luxury: { bg: "rgba(168,85,247,0.08)", color: "#7C3AED" },
};

const ProductRow = memo(function ProductRow({ p }) {
  const tb = TIER_BADGE[p.tier] ?? TIER_BADGE["mid-range"];
  return (
    <div className="au-product-row">
      <div className="au-product-swatch" style={{ background: p.hex }} aria-label={p.shade} />
      <div className="au-product-info">
        <div className="au-product-top">
          <span className="au-brand">{p.brand}</span>
          <span className="au-tier" style={{ background: tb.bg, color: tb.color }}>{p.tier}</span>
        </div>
        <span className="au-product-name">{p.product}</span>
        <span className="au-product-shade">{p.shade}</span>
        {p.tip && <span className="au-product-tip">💡 {p.tip}</span>}
      </div>
    </div>
  );
});

const LipRow = memo(function LipRow({ lip }) {
  return (
    <div className="au-lip-row">
      <div className="au-lip-swatch" style={{ background: lip.hex }} aria-label={lip.name} />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <span className="au-product-name" style={{ marginBottom: 0 }}>{lip.name}</span>
          <span className="au-tier" style={{ background: "rgba(123,45,66,0.07)", color: "#7B2D42" }}>{lip.type}</span>
        </div>
        <span className="au-brand">{lip.brand} · {lip.shade}</span>
        <span className="au-product-tip" style={{ display: "block", marginTop: 2 }}>{lip.desc}</span>
      </div>
    </div>
  );
});

const ToneChip = memo(function ToneChip({ tone, selected, onSelect }) {
  return (
    <button
      className={`au-tone-chip ${selected ? "au-tone-chip--on" : ""}`}
      style={{ background: tone.hex }}
      onClick={() => onSelect(tone)}
      title={tone.label}
      aria-label={`${tone.label}${selected ? ", selected" : ""}`}
      aria-pressed={selected}
    >
      {selected && <Check size={10} color="#fff" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />}
    </button>
  );
});

const UndertoneChip = memo(function UndertoneChip({ u, selected, onSelect }) {
  return (
    <button className={`au-ut-chip ${selected ? "au-ut-chip--on" : ""}`} onClick={() => onSelect(u)} aria-pressed={selected}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: u.swatch, border: "1px solid rgba(0,0,0,0.1)", display: "inline-block", flexShrink: 0 }} />
      <span>{u.label}</span>
    </button>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class AuraErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e, i) { console.error("[Aura]", e, i.componentStack); }
  render() {
    if (this.state.err) return (
      <div className="au-boundary" role="alert"><AlertCircle size={18} /><p>Something went wrong. Refresh to retry.</p></div>
    );
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .au-root { background: #FEFAF6; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; color: #2C1A1D; -webkit-font-smoothing: antialiased; }
    .au-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
    .au-mono  { font-family: 'JetBrains Mono', monospace; }

    /* ── Header ── */
    .au-header { padding: 16px 28px; border-bottom: 1px solid #EFE0D8; display: flex; align-items: center; justify-content: space-between; background: #FFFAF7; }
    .au-header-brand { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 700; color: #7B2D42; letter-spacing: 0.08em; }
    .au-header-sub { font-size: 9px; color: #C0A0A8; letter-spacing: 0.16em; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
    .au-header-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 20px; background: rgba(123,45,66,0.07); border: 1px solid rgba(123,45,66,0.12); font-size: 11px; color: #7B2D42; }
    .au-back-btn { display: flex; align-items: center; gap: 5px; background: none; border: none; color: #9B7080; font-size: 12px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; padding: 0; }
    .au-back-btn:hover { color: #7B2D42; }

    /* ── Choose phase ── */
    .au-choose { max-width: 480px; margin: 0 auto; padding: 56px 24px; text-align: center; }
    .au-choose-headline { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 40px; font-weight: 700; color: #2C1A1D; letter-spacing: -0.02em; margin-bottom: 10px; line-height: 1.05; }
    .au-choose-sub { font-size: 14px; color: #C0A0A8; margin-bottom: 44px; line-height: 1.6; font-weight: 300; }
    .au-choose-options { display: flex; flex-direction: column; gap: 12px; }
    .au-option-primary { padding: 28px 24px; border-radius: 20px; background: linear-gradient(135deg,#7B2D42,#C0848A); border: none; cursor: pointer; text-align: left; transition: transform 0.15s, box-shadow 0.15s; font-family: 'Plus Jakarta Sans', sans-serif; }
    .au-option-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(123,45,66,0.28); }
    .au-option-primary:focus-visible { outline: 2px solid #7B2D42; outline-offset: 3px; }
    .au-option-icon { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .au-option-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .au-option-desc { font-size: 12px; color: rgba(255,255,255,0.75); line-height: 1.5; }
    .au-option-secondary { padding: 18px 24px; border-radius: 16px; border: 1px solid #EFE0D8; background: transparent; cursor: pointer; text-align: left; transition: border-color 0.14s, background 0.14s; display: flex; align-items: center; justify-content: space-between; font-family: 'Plus Jakarta Sans', sans-serif; }
    .au-option-secondary:hover { border-color: rgba(123,45,66,0.25); background: rgba(123,45,66,0.03); }
    .au-option-secondary:focus-visible { outline: 2px solid #7B2D42; outline-offset: 2px; }
    .au-option-sec-label { font-size: 14px; font-weight: 600; color: #2C1A1D; }
    .au-option-sec-sub { font-size: 11px; color: #C0A0A8; margin-top: 2px; }
    .au-camera-error { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); color: #EF4444; font-size: 12px; display: flex; align-items: flex-start; gap: 7px; line-height: 1.5; }

    /* ── Camera phase ── */
    .au-camera-wrap { position: relative; width: 100%; max-width: 480px; margin: 0 auto; aspect-ratio: 1; overflow: hidden; background: #0A0608; }
    .au-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); display: block; }
    .au-camera-overlay { position: absolute; inset: 0; pointer-events: none; }
    .au-canvas-hidden { display: none; }
    .au-camera-hud { max-width: 480px; margin: 0 auto; padding: 16px 20px; }
    .au-camera-match { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background: #FFFAF7; border: 1px solid #EFE0D8; margin-bottom: 12px; }
    .au-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #EF4444; animation: livePulse 1.2s ease-in-out infinite; }
    @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
    .au-live-label { font-size: 9px; color: #EF4444; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; }
    .au-detected-swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(123,45,66,0.2); flex-shrink: 0; transition: background 0.3s; }
    .au-detected-tone { font-size: 13px; font-weight: 600; color: #2C1A1D; }
    .au-tip-row { display: flex; align-items: center; gap: 7px; font-size: 11px; color: #C0A0A8; margin-bottom: 14px; }
    .au-camera-btns { display: flex; gap: 10px; }
    .au-cancel-btn { flex: 1; padding: 12px; border-radius: 11px; border: 1px solid #EFE0D8; background: transparent; color: #9B7080; font-size: 13px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
    .au-capture-btn { flex: 2; padding: 12px; border-radius: 11px; background: #7B2D42; border: none; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 0.14s; font-family: 'Plus Jakarta Sans', sans-serif; }
    .au-capture-btn:hover { background: #6A2438; }
    .au-capture-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .au-capture-btn:focus-visible { outline: 2px solid #7B2D42; outline-offset: 3px; }

    /* ── Analyzing phase ── */
    .au-analyzing { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 20px; padding: 40px 24px; text-align: center; }
    .au-analyze-preview { width: 100px; height: 100px; border-radius: 50%; border: 3px solid rgba(123,45,66,0.15); overflow: hidden; position: relative; }
    .au-analyze-preview img { width: 100%; height: 100%; object-fit: cover; }
    .au-analyze-ring { position: absolute; inset: -3px; border-radius: 50%; border: 3px solid transparent; border-top-color: #7B2D42; animation: spin 1s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg)}}
    .au-analyze-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; color: #2C1A1D; }
    .au-analyze-sub { font-size: 12px; color: #C0A0A8; }

    /* ── Matched / Manual results layout ── */
    .au-results-layout { display: grid; grid-template-columns: 300px 1fr; min-height: calc(100vh - 65px); }
    .au-results-left { border-right: 1px solid #EFE0D8; padding: 24px; background: #FFFAF7; overflow-y: auto; }
    .au-results-right { padding: 24px 28px; overflow-y: auto; }

    /* Detected banner */
    .au-detected-banner { padding: 14px 16px; border-radius: 13px; background: linear-gradient(135deg,rgba(123,45,66,0.06),rgba(192,132,138,0.03)); border: 1px solid rgba(123,45,66,0.12); margin-bottom: 16px; }
    .au-banner-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .au-banner-swatch { width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(123,45,66,0.2); flex-shrink: 0; }
    .au-banner-tone { font-size: 14px; font-weight: 700; color: #2C1A1D; }
    .au-banner-ut { font-size: 12px; color: #9B7080; }
    .au-banner-reason { font-size: 11px; color: #C0A0A8; line-height: 1.55; font-style: italic; }
    .au-adj-toggle { display: flex; align-items: center; gap: 6px; background: none; border: none; color: #9B7080; font-size: 11px; cursor: pointer; margin-top: 8px; font-family: 'Plus Jakarta Sans', sans-serif; padding: 0; }
    .au-adj-toggle:hover { color: #7B2D42; }

    /* Manual adjustment / manual picker */
    .au-adj-panel { margin-top: 10px; padding-top: 10px; border-top: 1px solid #EFE0D8; }
    .au-sec-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #C0A0A8; display: block; margin-bottom: 7px; }
    .au-tones { display: grid; grid-template-columns: repeat(6,1fr); gap: 6px; margin-bottom: 12px; }
    .au-tone-chip { width: 100%; aspect-ratio: 1; border-radius: 50%; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.12s, box-shadow 0.12s; outline: none; }
    .au-tone-chip:hover { transform: scale(1.12); }
    .au-tone-chip--on { border-color: #7B2D42; box-shadow: 0 0 0 3px rgba(123,45,66,0.2); }
    .au-tone-chip:focus-visible { box-shadow: 0 0 0 3px rgba(123,45,66,0.35); }
    .au-uts { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 12px; }
    .au-ut-chip { display: flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: 8px; border: 1px solid #EFE0D8; background: transparent; cursor: pointer; font-size: 11px; color: #9B7080; transition: all 0.13s; font-family: 'Plus Jakarta Sans', sans-serif; }
    .au-ut-chip:hover { border-color: rgba(123,45,66,0.25); color: #2C1A1D; }
    .au-ut-chip--on { border-color: #7B2D42; background: rgba(123,45,66,0.06); color: #7B2D42; font-weight: 600; }
    .au-ut-chip:focus-visible { outline: 2px solid #7B2D42; outline-offset: 2px; }
    .au-scan-again { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid rgba(123,45,66,0.2); background: transparent; color: #7B2D42; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 14px; font-family: 'Plus Jakarta Sans', sans-serif; }
    .au-scan-again:hover { background: rgba(123,45,66,0.05); }
    .au-analysis-error { font-size: 11px; color: #C0A0A8; font-style: italic; margin-bottom: 10px; display: block; }

    /* Product results */
    .au-result-section { background: #fff; border: 1px solid #EFE0D8; border-radius: 13px; padding: 16px 18px; margin-bottom: 10px; }
    .au-result-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; font-weight: 600; color: #7B2D42; margin-bottom: 12px; }
    .au-product-row { display: flex; gap: 11px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid #F5EDE8; }
    .au-product-row:last-child { border-bottom: none; padding-bottom: 0; }
    .au-product-swatch { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.07); flex-shrink: 0; }
    .au-product-info { flex: 1; }
    .au-product-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
    .au-brand { font-size: 10px; font-weight: 700; color: #7B2D42; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; }
    .au-product-name { font-size: 12px; color: #2C1A1D; font-weight: 500; display: block; margin-bottom: 1px; }
    .au-product-shade { font-size: 10px; color: #9B7080; font-family: 'JetBrains Mono', monospace; display: block; margin-bottom: 2px; }
    .au-product-tip { font-size: 10px; color: #C0A0A8; font-style: italic; line-height: 1.5; }
    .au-tier { font-size: 9px; padding: 1px 6px; border-radius: 5px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
    .au-lip-row { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid #F5EDE8; }
    .au-lip-row:last-child { border-bottom: none; }
    .au-lip-swatch { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.07); flex-shrink: 0; }
    .au-powder-row { display: flex; gap: 10px; align-items: center; }
    .au-powder-swatch { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.07); flex-shrink: 0; }
    .au-findation { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding: 8px 12px; border-radius: 9px; background: rgba(123,45,66,0.04); border: 1px solid rgba(123,45,66,0.08); font-size: 11px; color: #9B7080; }
    .au-findation a { color: #7B2D42; font-weight: 600; }

    /* Manual input empty state */
    .au-manual-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 10px; padding: 40px; color: #C0A0A8; font-size: 13px; }

    /* Error / boundary */
    .au-boundary { display: flex; align-items: center; gap: 10px; padding: 20px; border-radius: 12px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); color: #EF4444; font-size: 13px; margin: 40px; }

    @media(max-width:680px){ .au-results-layout{grid-template-columns:1fr} .au-results-left{border-right:none;border-bottom:1px solid #EFE0D8} }
    @media(prefers-reduced-motion:reduce){.au-live-dot,.au-analyze-ring{animation:none!important}}
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function AuraCore() {
  const [state, dispatch] = useReducer(reducer, initState);
  const { phase, tone, undertone, undertoneReason, showManualAdj, concerns, cameraError, analysisError } = state;

  const canvasRef = useRef(null);
  const capturedRef = useRef(null); // stores base64 of captured frame
  const abortRef = useRef(null);

  const { videoRef, ready, start, stop } = useCamera();
  const isCameraActive = phase === "camera";
  const { rgb, closest } = useColorSampler(videoRef, canvasRef, isCameraActive && ready);

  // Abort vision request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // Start camera when entering camera phase
  useEffect(() => {
    if (phase !== "camera") return;
    start().then(err => {
      if (err) {
        stop();
        dispatch({ type: "CAMERA_ERROR", payload: err });
      }
    });
    return () => stop(); // stop stream when leaving camera phase
  }, [phase]);

  const handleCapture = useCallback(async () => {
    const b64 = captureFrame(videoRef);
    if (!b64) return;
    capturedRef.current = b64;

    const detectedTone = closest ?? SKIN_TONES[3];
    dispatch({ type: "START_ANALYZING" });
    stop();

    // Claude Vision — undertone only
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 150,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
              {
                type: "text", text: `Analyze the skin undertone in this face photo. The detected skin depth is ${detectedTone.label}. Reply with ONLY this JSON:
{"undertone":"cool|neutral|warm|olive","reason":"one short sentence explaining what you see in the skin"}` }
            ],
          }],
        }),
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const raw = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      const parsed = JSON.parse(raw.replace(/```json|```/g, ""));
      const matchedUT = UNDERTONES.find(u => u.id === parsed.undertone) ?? UNDERTONES[1];
      dispatch({ type: "MATCHED", tone: detectedTone, undertone: matchedUT, reason: parsed.reason ?? "" });
    } catch (err) {
      if (err.name === "AbortError") return;
      dispatch({ type: "ANALYSIS_ERROR", tone: detectedTone });
    }
  }, [closest, stop]);

  // useMemo — deterministic product match
  const match = useMemo(() => matchProducts(tone, undertone), [tone, undertone]);

  // Scroll results panel to top when match arrives
  useLayoutEffect(() => {
    if (phase === "matched" && match) {
      document.querySelector(".au-results-right")?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [phase, match]);

  const resetToChoose = useCallback(() => {
    stop();
    capturedRef.current = null;
    dispatch({ type: "RESET" });
  }, [stop]);

  // ── Render ────────────────────────────────────────────────────────────────

  const Header = (
    <header className="au-header">
      <div>
        <div className="au-header-brand au-serif">AURA</div>
        <div className="au-header-sub">Shade Matching Studio</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {phase !== "choose" && (
          <button className="au-back-btn" onClick={resetToChoose}><ChevronLeft size={14} /> Start over</button>
        )}
        <div className="au-header-tag"><Camera size={11} /> Camera + AI</div>
      </div>
    </header>
  );

  // ── Choose phase ─────────────────────────────────────────────────────────
  if (phase === "choose") return (
    <>
      <GlobalStyles />
      <div className="au-root">
        {Header}
        <div className="au-choose">
          <h1 className="au-choose-headline au-serif">Find your<br />perfect shade.</h1>
          <p className="au-choose-sub">Point your camera at your face and Aura detects your shade and undertone automatically — then recommends real products instantly.</p>
          <div className="au-choose-options">
            <button className="au-option-primary" onClick={() => dispatch({ type: "START_CAMERA" })} aria-label="Scan with camera — AI detects your shade">
              <div className="au-option-icon"><Camera size={20} color="#fff" aria-hidden="true" /></div>
              <div className="au-option-title">Scan with Camera</div>
              <div className="au-option-desc">Live pixel detection + Claude Vision for undertone analysis · best in natural light</div>
            </button>
            <button className="au-option-secondary" onClick={() => dispatch({ type: "START_MANUAL" })} aria-label="Select shade manually">
              <div>
                <div className="au-option-sec-label">Select shade manually</div>
                <div className="au-option-sec-sub">Choose from our curated tone and undertone swatches</div>
              </div>
              <ChevronLeft size={16} color="#C0A0A8" style={{ transform: "rotate(180deg)" }} aria-hidden="true" />
            </button>
            {cameraError && (
              <div className="au-camera-error" role="alert">
                <AlertCircle size={13} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />{cameraError}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // ── Camera phase ─────────────────────────────────────────────────────────
  if (phase === "camera") return (
    <>
      <GlobalStyles />
      <div className="au-root">
        {Header}
        {/* Hidden canvas for pixel sampling */}
        <canvas ref={canvasRef} className="au-canvas-hidden" aria-hidden="true" />

        <div className="au-camera-wrap" aria-label="Camera viewfinder">
          <video ref={videoRef} className="au-video" playsInline muted aria-hidden="true" />
          {/* SVG overlay with oval face guide */}
          <svg className="au-camera-overlay" viewBox="0 0 480 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <mask id="faceMask">
                <rect width="480" height="480" fill="white" />
                <ellipse cx="240" cy="216" rx="105" ry="154" fill="black" />
              </mask>
            </defs>
            {/* Dark overlay with oval cutout */}
            <rect width="480" height="480" fill="rgba(15,5,8,0.55)" mask="url(#faceMask)" />
            {/* Animated oval border */}
            <ellipse cx="240" cy="216" rx="105" ry="154"
              fill="none" stroke="#E8B4C0" strokeWidth="1.5" strokeDasharray="8 5" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" from="0 240 216" to="360 240 216" dur="20s" repeatCount="indefinite" />
            </ellipse>
            {/* Corner guides */}
            <text x="240" y="392" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="'JetBrains Mono',monospace">
              Position face in oval
            </text>
          </svg>
        </div>

        <div className="au-camera-hud">
          {/* Live match preview */}
          <div className="au-camera-match" aria-live="polite" aria-label={`Live detection: ${closest?.label ?? "detecting"}`}>
            <div className="au-live-dot" aria-hidden="true" />
            <span className="au-live-label">LIVE</span>
            <div className="au-detected-swatch"
              style={{ background: closest?.hex ?? "#E0B48A" }}
              aria-hidden="true"
            />
            <div>
              <span className="au-detected-tone">{closest?.label ?? "Detecting…"}</span>
              {rgb && <span style={{ fontSize: 10, color: "#C0A0A8", display: "block", fontFamily: "'JetBrains Mono',monospace" }}>
                rgb({rgb.r},{rgb.g},{rgb.b})
              </span>}
            </div>
          </div>

          <div className="au-tip-row"><Sun size={12} aria-hidden="true" /> Face a window or bright light for best results</div>

          <div className="au-camera-btns">
            <button className="au-cancel-btn" onClick={resetToChoose}>Cancel</button>
            <button
              className="au-capture-btn"
              onClick={handleCapture}
              disabled={!ready}
              aria-label="Capture and analyze skin"
            >
              <Camera size={15} aria-hidden="true" />
              {ready ? "Capture & Analyze" : "Starting camera…"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── Analyzing phase ───────────────────────────────────────────────────────
  if (phase === "analyzing") return (
    <>
      <GlobalStyles />
      <div className="au-root">
        {Header}
        <div className="au-analyzing" role="status" aria-label="Analyzing your skin tone and undertone">
          <div className="au-analyze-preview">
            {capturedRef.current && <img src={`data:image/jpeg;base64,${capturedRef.current}`} alt="Your captured photo" />}
            <div className="au-analyze-ring" aria-hidden="true" />
          </div>
          <h2 className="au-analyze-title au-serif">Analyzing undertone…</h2>
          <p className="au-analyze-sub">Claude Vision is reading your skin's warm, cool, or olive characteristics</p>
        </div>
      </div>
    </>
  );

  // ── Matched + Manual phases (both show results) ───────────────────────────
  if (phase === "matched" || phase === "manual") {
    const hasResult = !!(tone && undertone && match);

    return (
      <>
        <GlobalStyles />
        <div className="au-root">
          {Header}
          <div className="au-results-layout">

            {/* ── Left: detected result + adjustments ── */}
            <aside className="au-results-left" aria-label="Detected shade profile">

              {/* Detected banner (matched phase) */}
              {phase === "matched" && tone && (
                <div className="au-detected-banner">
                  <div className="au-banner-row">
                    <div className="au-banner-swatch" style={{ background: tone.hex }} aria-hidden="true" />
                    <div>
                      <div className="au-banner-tone">{tone.label}</div>
                      {undertone && <div className="au-banner-ut">{undertone.label} undertone</div>}
                    </div>
                    <Check size={16} color="#7B2D42" style={{ marginLeft: "auto" }} aria-hidden="true" />
                  </div>
                  {undertoneReason && <p className="au-banner-reason">"{undertoneReason}"</p>}
                  {analysisError && <span className="au-analysis-error">{analysisError}</span>}
                  <button className="au-adj-toggle" onClick={() => dispatch({ type: "TOGGLE_ADJ" })} aria-expanded={showManualAdj}>
                    <SlidersHorizontal size={12} aria-hidden="true" />
                    {showManualAdj ? "Hide adjustments" : "Adjust manually"}
                  </button>
                </div>
              )}

              {/* Manual picker (always shown in manual phase, toggled in matched) */}
              {(phase === "manual" || showManualAdj) && (
                <div className={phase === "manual" ? "" : "au-adj-panel"}>
                  <span className="au-sec-label">Skin Tone</span>
                  <div className="au-tones" role="group" aria-label="Select skin tone">
                    {SKIN_TONES.map(t => (
                      <ToneChip key={t.id} tone={t} selected={tone?.id === t.id} onSelect={t => dispatch({ type: "SET_TONE", payload: t })} />
                    ))}
                  </div>
                  <span className="au-sec-label">Undertone</span>
                  <div className="au-uts" role="group" aria-label="Select undertone">
                    {UNDERTONES.map(u => (
                      <UndertoneChip key={u.id} u={u} selected={undertone?.id === u.id} onSelect={u => dispatch({ type: "SET_UNDERTONE", payload: u })} />
                    ))}
                  </div>
                </div>
              )}

              {/* Scan again button */}
              {phase === "matched" && (
                <button className="au-scan-again" onClick={() => dispatch({ type: "START_CAMERA" })}>
                  <Camera size={13} aria-hidden="true" /> Scan again
                </button>
              )}
            </aside>

            {/* ── Right: product results ── */}
            <main className="au-results-right" aria-label="Product recommendations">
              {!hasResult && (
                <div className="au-manual-empty" role="status">
                  <Sparkles size={28} color="#E8B4C0" aria-hidden="true" />
                  Select your tone and undertone to see your product matches.
                </div>
              )}

              {hasResult && (
                <>
                  {/* Foundations */}
                  <div className="au-result-section">
                    <h2 className="au-result-title">Foundation</h2>
                    {match.foundations.map((f, i) => <ProductRow key={i} p={f} />)}
                    <div className="au-findation">
                      <ExternalLink size={11} aria-hidden="true" />
                      Find exact shade equivalents at <a href="https://findation.com" target="_blank" rel="noopener noreferrer">findation.com</a>
                    </div>
                  </div>

                  {/* Concealer */}
                  <div className="au-result-section">
                    <h2 className="au-result-title">Concealer</h2>
                    <ProductRow p={match.concealer} />
                  </div>

                  {/* Lip Colors */}
                  <div className="au-result-section">
                    <h2 className="au-result-title">Lip Colors</h2>
                    {match.lips.map((lip, i) => <LipRow key={i} lip={lip} />)}
                  </div>

                  {/* Setting Powder */}
                  <div className="au-result-section">
                    <h2 className="au-result-title">Setting Powder</h2>
                    <div className="au-powder-row">
                      <div className="au-powder-swatch" style={{ background: match.powder.hex }} aria-hidden="true" />
                      <div>
                        <span className="au-brand" style={{ display: "block" }}>{match.powder.brand}</span>
                        <span className="au-product-name">{match.powder.product}</span>
                        <span className="au-product-shade" style={{ display: "block" }}>{match.powder.shade}</span>
                        <span className="au-product-tip" style={{ display: "block", marginTop: 3 }}>{match.powder.desc}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </>
    );
  }

  return null;
}

export default function AuraShadeMatch() {
  return <AuraErrorBoundary><AuraCore /></AuraErrorBoundary>;
}
