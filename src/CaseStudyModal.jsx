import { useEffect, useCallback, memo } from "react";

// ── Design tokens (match App.jsx exactly) ────────────────────────
const C = {
  bg:     '#07070F',
  card:   '#0D0D1C',
  glass:  'rgba(255,255,255,0.035)',
  mg:     '#D4178A',
  pu:     '#7B2DBE',
  white:  '#EEEEF5',
  dim:    '#5A5A7A',
  dimLt:  '#8A8AAA',
  border: 'rgba(255,255,255,0.07)',
  grad:   'linear-gradient(135deg, #D4178A 0%, #7B2DBE 100%)',
};
const FD = "'Syne', sans-serif";
const FB = "'DM Sans', sans-serif";

// ── Case study data ───────────────────────────────────────────────
const CASE_STUDIES = {
  Chromata: {
    problem: "Design systems teams waste hours translating brand briefs into token sets manually — a process prone to inconsistency and with no intelligent starting point.",
    approach: "Built a Claude API integration that parses a plain-language brand description and returns structured design tokens — six semantic color roles, typography pairings, border radius personality, and exportable JSON. The key architectural decision was using useReducer with a four-state machine (idle, loading, success, error) to prevent impossible UI states, paired with an AbortController pattern that cancels in-flight requests before each new submission. Claude handles the translation job only — not a chatbot, not a wrapper.",
    patterns: ["useReducer state machine", "AbortController + useRef", "useMemo for colorEntries and JSON serialization", "useCallback on all handlers passed to memo'd children", "forwardRef on BrandTextarea for focus management", "useLayoutEffect for pre-paint focus", "React.memo on all sub-components", "usePrefersReducedMotion", "ErrorBoundary class component"],
    result: "Demonstrates Claude API integration, design systems thinking, and senior React architecture in one artifact — directly relevant to any role that bridges engineering and design.",
  },
  Meridian: {
    problem: "Enterprise data dashboards are often either visually generic or technically shallow — rarely both well-designed and well-engineered simultaneously.",
    approach: "Built a financial analytics dashboard using a seeded deterministic PRNG so the same time range always produces the same dataset, preventing chart flicker on re-render. A custom useDashboardData hook encapsulates all data derivation logic with a simulated async delay and useEffect cleanup to prevent setState on unmounted components. recharts' isAnimationActive={false} disables re-entry animations that would fire on every parent render by default — a real performance fix, not just a flag.",
    patterns: ["useReducer for dashboard state", "Custom useDashboardData hook", "Seeded PRNG for deterministic data", "useMemo for series and KPI derivation", "useLastUpdated custom hook", "isAnimationActive={false} on all recharts elements", "React.memo on all chart and tooltip components", "ErrorBoundary class component"],
    result: "Demonstrates enterprise data visualization, financial domain fluency from five years in fintech, and performance-conscious React engineering — directly signals the financial firm background without showing proprietary work.",
  },
  Forma: {
    problem: "Most animated landing pages achieve motion through JavaScript frameworks, creating performance overhead and reduced accessibility for users with vestibular disorders.",
    approach: "The aurora depth effect is achieved entirely through position:fixed blobs — no JavaScript scroll listeners involved. As page content scrolls over fixed elements, the glassmorphic cards with backdrop-filter blur reveal the aurora through each card independently, creating genuine parallax depth at zero performance cost. Scroll-triggered count-up animations use requestAnimationFrame with cubic ease-out rather than setInterval, and a custom usePrefersReducedMotion hook disables all animation for users who need it.",
    patterns: ["useInView with IntersectionObserver (disconnects after first fire)", "useCountUp with rAF and cubic ease-out", "useScrollY with passive scroll listener", "forwardRef on Section for smooth-scroll nav", "useReducer for nav state", "useLayoutEffect for document title", "usePrefersReducedMotion", "position:fixed aurora with zero JS overhead", "React.memo on all sub-components"],
    result: "Demonstrates animation craft, accessibility engineering, and the ability to achieve premium visual results through CSS architecture rather than JavaScript complexity.",
  },
  Altus: {
    problem: "Mobile UI portfolio pieces typically show static mockups — not interactive, not technically demonstrating mobile design systems thinking.",
    approach: "Built three fully designed iOS screens as live React components inside realistic CSS phone frames — no images, no Figma exports. The staggered entrance animation uses a custom useStaggeredEntrance hook that creates an array of staggered setTimeout calls and cleans up all timers on unmount. The boarding pass QR code is a deterministic 7×7 boolean grid computed with useMemo and an empty dependency array, computing exactly once on mount. All phone frames use forwardRef and React.memo with zero-prop optimization.",
    patterns: ["useStaggeredEntrance with timer array cleanup", "forwardRef on PhoneFrame", "React.memo on all screen components (zero-prop maximum optimization)", "useMemo for QR grid and activeScreen derivation", "Keyboard accessibility on phone frames (tabIndex, aria-pressed, onKeyDown)", "CSS phone frames with no images or SVGs"],
    result: "Directly relevant to the airline digital experience role — demonstrates mobile UX thinking across a complete travel booking flow from discovery through boarding.",
  },
  Forge: {
    problem: "Code review is manual, slow, and inconsistent — especially for developers who don't have senior engineers readily available for feedback.",
    approach: "Built a split-panel IDE-style interface where the left panel is a code editor with a live line number gutter and the right panel shows structured AI analysis. A keyboard shortcut (Cmd+Enter) is registered via useEffect with a cleanup return to prevent listener accumulation across navigation. The SVG quality score ring uses strokeDasharray math — (score/100) × circumference for the filled arc — animated via CSS transition. Each issue card manages its own open/closed state locally rather than lifting to parent, the correct React pattern when state is truly isolated.",
    patterns: ["useReviewEngine custom hook with AbortController", "useReducer state machine (idle/loading/success/error)", "Keyboard shortcut via useEffect with cleanup", "forwardRef on CodeEditor", "SVG gauge with strokeDasharray math", "useCallback on all handlers", "useMemo for issueCounts", "Local useState on IssueCard (correct isolation pattern)", "React.memo on all sub-components"],
    result: "Demonstrates developer tooling sensibility, Claude API integration for a genuinely different use case than Chromata, and IDE-quality UX thinking — relevant to any engineering-forward design role.",
  },
  Nexus: {
    problem: "Most AI portfolio pieces call an LLM API and display the response — demonstrating API usage, not AI engineering. The distinction matters to technical interviewers.",
    approach: "Demonstrates RAG (Retrieval Augmented Generation) — the architecture behind every serious production AI product. The document corpus is embedded into the Claude system prompt to simulate the context injection step of a real RAG pipeline. The chat state machine uses useReducer with USER_MSG, STREAM_CHUNK, STREAM_DONE, and ERROR actions. Streaming is simulated by revealing the full API response character by character via setInterval stored in a useRef for guaranteed cleanup. The sidebar visualizes all four RAG pipeline stages with real status indicators.",
    patterns: ["useChatEngine custom hook with AbortController", "useReducer state machine with streaming simulation", "setInterval in useRef with cleanup on unmount", "useAutoScroll with useLayoutEffect", "useMemo for contextTokens and pipelineSteps", "Document toggle with Set in useState", "React.memo on all sub-components including Message and SuggestedQuery", "ErrorBoundary class component"],
    result: "Demonstrates genuine understanding of production AI architecture — RAG, pgvector, streaming SSE, AbortController — not just API call usage. The feature that distinguishes senior AI engineering from junior AI integration.",
  },
  FINTRACK: {
    problem: "The existing FINTRACK dashboard had a polished visual design but non-functional navigation — all five sidebar buttons were decorative, breaking the experience for any hiring manager who clicked them.",
    approach: "Rebuilt from a photo reference with all five tabs fully functional. useReducer drives the navigation state with a SET_TAB action — more correct than useState because in a real dashboard, filter state, sort columns, and comparison periods would all live in the same reducer. The Transactions tab has live search and BUY/SELL/ALL filter buttons implemented with useMemo so the filter recomputes only when the search string or filter type changes, not on every render.",
    patterns: ["useReducer for tab navigation", "useMemo for filtered transactions", "useMemo for TAB_COMPONENTS map", "Toggle component with local useState", "React.memo on all tab components", "recharts AreaChart with gradient fill", "recharts PieChart with innerRadius for donut", "Keyboard accessible filter buttons with aria-pressed"],
    result: "Demonstrates fintech domain expertise, the ability to reverse-engineer and improve existing work, and enterprise-grade data UI — directly relevant to the OnePay design engineer role.",
  },
  Lumena: {
    problem: "PMU studios lose bookings to friction in the consultation process — clients don't understand which technique is right for their skin type before booking, leading to mismatched appointments and dissatisfied clients.",
    approach: "Built a six-step booking wizard where each step's available options depend on the previous selection — style options change dynamically based on which service was chosen. The entire wizard state lives in a single useReducer with seven action types. The calendar is generated with useMemo from a fixed anchor date, ensuring the same dates always render consistently. useLayoutEffect scrolls to the top of each step synchronously before paint so the transition feels native. The Continue button is disabled until each step's required field is completed, enforced with a useMemo-derived canNext boolean.",
    patterns: ["useReducer with seven action types (SET_SERVICE, SET_STYLE, SET_ARTIST, SET_DATE, SET_TIME, CONSULT, RESET)", "useMemo for calendar generation, style options, and canNext", "useLayoutEffect for step-transition scroll", "useId for accessible form label associations", "forwardRef on Section components", "React.memo on all step and card components", "Progressive disclosure pattern", "Conditional rendering based on accumulated state"],
    result: "Demonstrates multi-step form architecture, beauty tech domain expertise, and the ability to design for a real service business — relevant to both design engineering roles and Fiverr clients in the beauty industry.",
  },
  Aura: {
    problem: "Existing shade finders force users to already know their shade to get a match, and none address the pigment undertone bias problem — why the same color reads differently on different undertones.",
    approach: "Camera-first architecture with two distinct AI/ML layers. Pixel sampling uses requestAnimationFrame to sample a grid of pixels within a MediaPipe-style face oval on every frame, averaging to RGB and finding the closest swatch by Euclidean distance — pure math, no model, runs at 60fps. Claude Vision handles undertone detection only, because undertone is a contextual judgment that pixel averaging cannot make reliably. All product recommendations come from a static curated database with real brand names and researched hex values — Claude is never asked to select products, preventing hallucination entirely.",
    patterns: ["useCamera with getUserMedia and stream cleanup", "useColorSampler with rAF loop and cancellation", "Claude Vision for undertone only (correct tool separation)", "useReducer phase state machine (choose/camera/analyzing/matched/manual)", "useMemo for deterministic product matching", "Static database over AI generation (architectural honesty)", "forwardRef throughout", "Sclera white balance correction concept", "Accessible camera controls with aria-busy and aria-live"],
    result: "Demonstrates genuine AI/ML architecture thinking — knowing which problems need AI and which need math. The camera + vision combination is the most technically innovative piece in the portfolio and the most directly relevant to the beauty tech startup direction.",
  },
};

// ── Modal component ───────────────────────────────────────────────
const CaseStudyModal = memo(function CaseStudyModal({ project, onClose }) {
  const data = CASE_STUDIES[project?.title];

  // Close on Escape key
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!data) return null;

  return (
    <div
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} case study`}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(7,7,15,0.88)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div style={{
        background: C.card,
        border: `1px solid rgba(212,23,138,0.2)`,
        borderRadius: 24,
        width: "100%",
        maxWidth: 680,
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "40px",
        position: "relative",
        scrollbarWidth: "thin",
        scrollbarColor: `${C.mg} transparent`,
      }}>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close case study"
          style={{
            position: "absolute", top: 20, right: 20,
            background: C.glass, border: `1px solid ${C.border}`,
            borderRadius: 8, width: 32, height: 32,
            color: C.dimLt, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontFamily: FB,
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12, lineHeight: 1 }}>
            {project.emoji}
          </div>
          <p style={{
            fontSize: 10, color: C.mg, letterSpacing: 2.5,
            fontWeight: 700, fontFamily: FB, marginBottom: 8,
          }}>
            CASE STUDY
          </p>
          <h2 style={{
            fontFamily: FD, fontSize: 32, fontWeight: 800,
            color: C.white, lineHeight: 1.1, marginBottom: 0,
          }}>
            {project.title}
          </h2>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, marginBottom: 28 }} />

        {/* Problem */}
        <Section label="THE PROBLEM">
          <p style={{ color: C.dimLt, fontSize: 14, lineHeight: 1.75, fontWeight: 300, fontFamily: FB }}>
            {data.problem}
          </p>
        </Section>

        {/* Approach */}
        <Section label="APPROACH & DECISIONS">
          <p style={{ color: C.dimLt, fontSize: 14, lineHeight: 1.75, fontWeight: 300, fontFamily: FB }}>
            {data.approach}
          </p>
        </Section>

        {/* Patterns */}
        <Section label="SENIOR PATTERNS DEMONSTRATED">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.patterns.map(p => (
              <span key={p} style={{
                padding: "5px 12px", borderRadius: 100,
                fontSize: 11, fontWeight: 500,
                background: "rgba(212,23,138,0.08)",
                border: "1px solid rgba(212,23,138,0.18)",
                color: C.mg, fontFamily: FB,
              }}>
                {p}
              </span>
            ))}
          </div>
        </Section>

        {/* Result */}
        <Section label="WHY IT MATTERS" last>
          <p style={{ color: C.dimLt, fontSize: 14, lineHeight: 1.75, fontWeight: 300, fontFamily: FB }}>
            {data.result}
          </p>
        </Section>

        {/* CTA */}
        <button
          onClick={() => window.open(project.url, "_blank")}
          style={{
            background: C.grad, border: "none", borderRadius: 10,
            padding: "12px 24px", color: "#fff", fontWeight: 600,
            fontSize: 14, cursor: "pointer", fontFamily: FB,
            boxShadow: "0 4px 16px rgba(212,23,138,0.28)",
            marginTop: 8, transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          View Live Demo →
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
});

// ── Section helper ────────────────────────────────────────────────
function Section({ label, children, last }) {
  return (
    <div style={{ marginBottom: last ? 28 : 24 }}>
      <p style={{
        fontSize: 10, color: C.dim, letterSpacing: 2,
        fontWeight: 700, fontFamily: FB, marginBottom: 12,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export default CaseStudyModal;
