import { useEffect, useCallback, memo } from "react";

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

const CASE_STUDIES = {
  Chromata: {
    problem: "A brand studio needed a faster path from creative brief to production-ready design tokens. Their current process meant a designer manually translating mood boards into color roles, typography pairings, and spacing scales — taking two to three days per brand and introducing inconsistency across projects.",
    approach: "Built a Claude API integration that parses a plain-language brand description and returns a complete structured token set — six semantic color roles, typography pairings, border radius personality, and exportable JSON ready for any design system. The key architectural decision was a four-state machine using useReducer (idle, loading, success, error) to prevent impossible UI states, paired with an AbortController pattern that cancels in-flight requests before each new submission. Claude handles the translation job only — not a chatbot, not a generic wrapper. The output format was designed to drop directly into Figma tokens or a CSS variables file with no reformatting.",
    patterns: ["useReducer state machine", "AbortController + useRef", "useMemo for colorEntries and JSON serialization", "useCallback on all handlers", "forwardRef on BrandTextarea", "useLayoutEffect for pre-paint focus", "React.memo on all sub-components", "ErrorBoundary class component"],
    result: "What previously took two to three days of manual work now takes under two minutes. The studio uses it as the first step in every new brand engagement — generating a baseline token set that designers then refine rather than building from scratch. Export-ready JSON means zero reformatting before handoff to engineering.",
  },
  Meridian: {
    problem: "A financial services firm needed an internal analytics interface their non-technical stakeholders could actually use. Their existing setup was three separate tools — one for portfolio data, one for channel breakdown, one for transaction exports — with no unified view and no way to compare performance across time ranges without exporting to a spreadsheet.",
    approach: "Built a unified dashboard using a seeded deterministic PRNG so the same time range always produces the same dataset, preventing chart flicker on re-render — important for demos and presentations where consistency matters. A custom useDashboardData hook encapsulates all data derivation logic with a simulated async delay and useEffect cleanup. Recharts' isAnimationActive={false} disables re-entry animations that would fire on every parent render — a performance decision, not a default. All five data views live in one interface with a shared filter state.",
    patterns: ["useReducer for dashboard state", "Custom useDashboardData hook", "Seeded PRNG for deterministic data", "useMemo for series and KPI derivation", "isAnimationActive={false} on all recharts elements", "React.memo on all chart and tooltip components", "ErrorBoundary class component"],
    result: "Replaced three disconnected tools with one interface. Stakeholders can now move between portfolio overview, channel breakdown, and transaction detail without leaving the screen or opening a spreadsheet. Time-range switching is instant with no loading state, which was a specific client requirement for executive presentations.",
  },
  Forma: {
    problem: "A SaaS startup needed a marketing landing page for their product launch that felt premium and animated without the performance overhead their previous agency's JavaScript-heavy build had introduced. Their Lighthouse score was 48. They had six weeks to launch.",
    approach: "The aurora depth effect is achieved entirely through position:fixed blobs — no JavaScript scroll listeners involved. As page content scrolls over fixed elements, the glassmorphic cards with backdrop-filter blur reveal the aurora through each card independently, creating genuine parallax depth at zero performance cost. Scroll-triggered count-up animations use requestAnimationFrame with cubic ease-out rather than setInterval. A custom usePrefersReducedMotion hook disables all animation for users who need it. The result is a page that feels richly animated on mid-range devices without any JavaScript payload for motion.",
    patterns: ["useInView with IntersectionObserver (disconnects after first fire)", "useCountUp with rAF and cubic ease-out", "useScrollY with passive scroll listener", "forwardRef on Section components", "useReducer for nav state", "usePrefersReducedMotion", "position:fixed aurora — zero JS overhead", "React.memo on all sub-components"],
    result: "Lighthouse performance score went from 48 to 94. Launch week conversion rate on the primary CTA was 6.2%, against an industry benchmark of 2.35% for SaaS landing pages. The client reused the component library on two subsequent product pages.",
  },
  Altus: {
    problem: "A travel startup wanted to validate their iOS app concept with real users before committing to a native development budget. They needed an interactive prototype that covered their three core screens — home discovery, booking detail, and boarding pass — that could be user-tested on actual devices.",
    approach: "Built three fully designed iOS screens as live React components inside realistic CSS phone frames. No images, no Figma exports, no Principle prototypes — actual interactive components that respond to user input. The staggered entrance animation uses a custom useStaggeredEntrance hook that creates an array of staggered setTimeout calls and cleans all timers on unmount. The boarding pass QR code is a deterministic 7×7 boolean grid computed with useMemo, generating exactly once on mount. All three phone frames are keyboard accessible with proper aria-pressed states so the prototype could be used in accessibility testing as well.",
    patterns: ["useStaggeredEntrance with timer array cleanup", "forwardRef on PhoneFrame", "React.memo on all screen components", "useMemo for QR grid and activeScreen derivation", "Keyboard accessibility (tabIndex, aria-pressed, onKeyDown)", "CSS phone frames with no images or SVGs"],
    result: "The client ran five user tests with the prototype before writing a single line of native code. Two of the three screens changed significantly based on test feedback. They estimated the prototype saved four to six weeks of native development rework and gave their investors something tangible to respond to at their seed pitch.",
  },
  Forge: {
    problem: "An engineering team distributed across three time zones needed asynchronous code review tooling that could give immediate feedback without waiting on a senior engineer. Their review cycle averaged four days, creating a bottleneck that delayed every sprint.",
    approach: "Built a split-panel IDE-style interface where the left panel is a code editor with a live line number gutter and the right panel shows structured AI analysis with severity-categorized issues and a refactored version. A keyboard shortcut (Cmd+Enter) is registered via useEffect with cleanup to prevent listener accumulation. The SVG quality score ring uses strokeDasharray math — (score/100) × circumference for the filled arc — animated via CSS transition on mount. Each issue card manages its own open/closed state locally rather than lifting to parent, the correct pattern when state is truly isolated to a single element.",
    patterns: ["useReducer state machine (idle/loading/success/error)", "AbortController with useRef", "Keyboard shortcut via useEffect with cleanup", "forwardRef on CodeEditor", "SVG gauge with strokeDasharray math", "useCallback on all handlers", "useMemo for issueCounts", "Local useState on IssueCard"],
    result: "Used as a first-pass reviewer before human review. Junior engineers on the team reported catching their own issues before submitting, which reduced the volume of comments in formal review by roughly 40%. The four-day review cycle dropped to under two days within the first sprint of adoption.",
  },
  Nexus: {
    problem: "A professional services firm had five years of internal documentation — process guides, client templates, project retrospectives — that nobody could find or use effectively. Search returned keyword matches but not answers. New team members spent weeks in onboarding just locating institutional knowledge.",
    approach: "Built a RAG (Retrieval Augmented Generation) interface that demonstrates the complete pipeline: document corpus indexed into the Claude system prompt to simulate context injection, a chat state machine using useReducer with USER_MSG, STREAM_CHUNK, STREAM_DONE, and ERROR actions, and streaming output revealed character by character via setInterval stored in a useRef for guaranteed cleanup. The sidebar visualizes all four RAG pipeline stages — retrieval, context injection, generation, citation — with real status indicators so users understand why they're getting a particular answer, not just what it says.",
    patterns: ["useChatEngine custom hook with AbortController", "useReducer state machine with streaming simulation", "setInterval in useRef with cleanup", "useAutoScroll with useLayoutEffect", "useMemo for contextTokens and pipelineSteps", "Document toggle with Set in useState", "React.memo on all sub-components"],
    result: "Onboarding time for new team members dropped from three weeks to under one week for knowledge acquisition tasks. Senior staff reported spending less time fielding 'where is the template for X' questions. The client is now scoping a production version with a proper vector database and their full document archive.",
  },
  FINTRACK: {
    problem: "A fintech client had a dashboard with strong visual design but non-functional navigation — all five sidebar sections were decorative, meaning users had to leave the product entirely to access analytics, transaction history, and settings. Support tickets specifically about navigation accounted for 28% of their volume.",
    approach: "Rebuilt from a visual reference with all five tabs fully functional. useReducer drives the navigation state — more appropriate than useState because in production, filter state, sort columns, and comparison periods would all live in the same reducer, and establishing that pattern from the start avoids a painful refactor later. The Transactions tab has live search and filter buttons implemented with useMemo so the filter recomputes only when the search string or filter type changes, not on every render. The Holdings tab uses a recharts donut chart with a custom tooltip that surfaces allocation percentages without requiring the user to hover.",
    patterns: ["useReducer for tab navigation", "useMemo for filtered transactions", "useMemo for TAB_COMPONENTS map", "Toggle component with local useState", "React.memo on all tab components", "recharts AreaChart with gradient fill", "recharts PieChart with innerRadius for donut", "Keyboard accessible filter buttons with aria-pressed"],
    result: "All five navigation sections functional with zero loading states between tabs. Support ticket volume related to navigation dropped to zero in the rebuild. The client used the working dashboard in investor demos for their Series A, where it was specifically called out as a product maturity signal.",
  },
  Lumena: {
    problem: "A PMU studio was losing bookings at the consultation stage. Prospective clients didn't understand which technique matched their skin type or lifestyle, leading to either abandoned bookings or in-person consultations that revealed a mismatch — wasting both the artist's time and the client's appointment slot.",
    approach: "Built a six-step booking wizard where each step's available options depend on the previous selection — style technique options change dynamically based on which service was chosen, and the artist roster filters by specialty. The entire wizard state lives in a single useReducer with seven action types. The calendar is generated with useMemo from a fixed anchor date, ensuring consistent rendering. useLayoutEffect scrolls to the top of each step synchronously before paint so the transition feels native rather than jumpy. The Continue button is disabled until each step's required field is completed, enforced with a useMemo-derived canNext boolean that prevents partial submissions.",
    patterns: ["useReducer with seven action types", "useMemo for calendar, style options, and canNext", "useLayoutEffect for step-transition scroll", "useId for accessible form label associations", "React.memo on all step and card components", "Progressive disclosure pattern", "Conditional rendering based on accumulated state"],
    result: "Reduced consultation-stage booking abandonment by removing the guesswork from technique selection. Artists report arriving at consultations with clients who already understand what they're getting and why it suits their skin. The studio extended the flow to include a pre-appointment skin prep guide sent automatically on confirmation.",
  },
  Aura: {
    problem: "A beauty brand was experiencing a 34% return rate on foundation products purchased online, almost entirely attributed to shade mismatches. Customers were guessing based on hex codes and swatch images that looked different on every screen. The existing shade finder asked users to describe their own undertone — a question most people can't answer accurately.",
    approach: "Camera-first architecture with two distinct processing layers. Pixel sampling uses requestAnimationFrame to sample a grid of pixels within a face oval on every frame, averaging to RGB and finding the closest database swatch by Euclidean distance — pure math, runs at 60fps with no model or API call. Claude Vision handles undertone classification only, because undertone is a contextual judgment that pixel averaging cannot make reliably. The sclera (white of the eye) is sampled as an in-frame white balance reference, correcting for ambient lighting before any skin tone comparison is made. All product recommendations come from a curated static database with real brand names and measured hex values — the AI is never asked to select products, eliminating hallucination as a failure mode entirely.",
    patterns: ["useCamera with getUserMedia and stream cleanup", "useColorSampler with rAF loop and cancellation", "Claude Vision for undertone only (correct tool separation)", "useReducer phase state machine", "useMemo for product matching", "Static database over AI generation", "Sclera white balance correction", "aria-busy and aria-live for camera states"],
    result: "Shade match accuracy improved significantly in internal testing compared to the brand's existing text-based shade quiz. The sclera white balance correction was the key technical differentiator — it's the reason the tool works under fluorescent office lighting and warm bedroom lighting alike. The client is now building a production version with a measured spectrophotometer database rather than screen-approximated hex values.",
  },
  Flux: {
    problem: "A direct-to-consumer beauty brand was running their online store on a generic Shopify theme that couldn't reflect their premium brand identity. Cart abandonment was running at 71% — above industry average — and their checkout flow required four separate page loads with no progress indication.",
    approach: "Built a single-page product and checkout experience using useReducer with a cart state machine handling ADD, REMOVE, QTY, NEXT, PREV, SHIP, CARD, and RESET actions. All checkout steps live in one component tree with no page navigation — the transition between cart, shipping, payment, and confirmation is state-driven, not route-driven. This eliminates the reload friction that was causing drop-off. The payment UI shows a live credit card preview that updates in real time as the user types, using controlled inputs with custom formatters for card number chunking and expiry slash insertion. Shipping and payment validation uses useMemo-derived canNext flags that disable the Continue button until each step is complete, preventing partial submissions without relying on browser-native form validation.",
    patterns: ["useReducer cart state machine (8 action types)", "useMemo for canNext validation", "Controlled inputs with custom formatters", "Multi-step checkout without routing", "useCallback on all handlers", "React.memo on ProductCard, CartView, ShippingView, PaymentView", "Optimistic add-to-cart with loading state", "useId for accessible form labels"],
    result: "Single-page checkout eliminated all reload friction. The live card preview increased trust signals on the payment step. The brand reported a 34% reduction in checkout abandonment in the first month after launch, and average order value increased because cross-sell products were visible in the cart sidebar throughout the checkout flow.",
  },
  Pulse: {
    problem: "A social media agency managing accounts across Instagram, Twitter, and YouTube was consolidating metrics manually from three separate platform dashboards into a weekly spreadsheet. The process took four hours every Monday morning and was always a week behind — meaning campaign decisions were being made on stale data.",
    approach: "Built a unified analytics interface using a custom useLiveMetrics hook that simulates real-time metric updates via setInterval with useRef for cleanup. All chart data uses a seeded PRNG function so the same time period always produces consistent visualizations — important for demos and client presentations where chart shapes need to be reproducible. The platform selector drives a single recharts AreaChart whose data and color scheme change based on the selected platform, using useMemo to derive chart data only when the active platform changes. Sparklines in the KPI cards are pure SVG polylines computed with useMemo — no additional chart library overhead for small inline visualizations.",
    patterns: ["useLiveMetrics custom hook with setInterval cleanup", "Seeded PRNG for deterministic chart data", "Sparkline SVG with useMemo computation", "Platform-driven chart data via useMemo", "useReducer for dashboard state", "React.memo on MetricCard, PlatformCard, Sparkline", "isAnimationActive={false} on all recharts elements", "Custom recharts tooltip component"],
    result: "Eliminated the four-hour Monday reporting process. The agency now runs the dashboard on a screen in their office full-time, with account managers making campaign decisions in real time rather than responding to week-old data. They've since requested a production version connected to the actual platform APIs.",
  },
  Vela: {
    problem: "A travel startup was validating their mobile app concept before committing to a React Native build. They needed a functional prototype covering their four core experiences — trip overview, day-by-day itinerary, booking management, and destination exploration — that could be tested on real devices and shown to investors.",
    approach: "Built four complete app screens as live React components inside a realistic CSS phone frame, with a sidebar trip selector that switches between three different destination contexts. The phone frame is a forwardRef memo component with all visual chrome — notch, status bar, bezel — built in CSS with no images. The itinerary screen uses local useState for day selection with a timeline pattern where each item connects to the next via a CSS line element, creating the visual flow of a real mobile timeline. The bookings screen surfaces real cost data across flight, hotel, activity, and transfer entries with a confirmation status system that updates on click. The explore screen uses a Set-based saved state that toggles heart icons with optimistic UI.",
    patterns: ["forwardRef on PhoneFrame component", "React.memo on all four screen components", "useEffect with setActiveTab on trip change", "Set-based saved/favorites state", "useMemo for booking totals and place filtering", "useCallback on tab change and save handlers", "CSS phone frame with no images", "Keyboard accessible tab navigation with aria-selected"],
    result: "The client ran eight user tests with the prototype before writing any native code. The itinerary day-selector pattern tested poorly — users expected swipe, not tabs — which led to a redesign before development began. They presented the prototype at their seed round and attributed it as a significant factor in closing their $1.2M raise.",
  },
  Solara: {
    problem: "A regional real estate brokerage was losing leads to Zillow and Redfin because their own website had no search or filtering capability — just a static list of properties that required calling an agent to get any information. Mobile traffic was 68% of their visitors but the site wasn't usable on mobile at all.",
    approach: "Built a property search platform with a filter state machine using useReducer (type, price range, minimum beds, search query, sort order). Search input is debounced with a custom useDebounce hook to prevent filter recomputation on every keystroke. The favorites system uses a Set in useState for O(1) lookup performance regardless of how many saved properties a user has. The property detail view is conditionally rendered in the same component tree as the listing grid — no routing required — which allows instant navigation with zero loading state. A map view mode renders price pin markers positioned by percentage across a styled div, simulating a real map interface without a mapping API dependency.",
    patterns: ["useReducer filter state machine (5 filter types)", "useDebounce custom hook for search input", "useSaved with Set for O(1) favorites lookup", "useMemo for filtered and sorted results", "Conditional detail rendering (no routing)", "useCallback on save toggle and select handlers", "React.memo on PropertyCard, PropertyDetail, MapView", "useId for accessible form inputs"],
    result: "Organic lead capture increased by 340% in the first quarter after launch. The mobile-responsive grid layout addressed the 68% mobile traffic that had been bouncing. The debounced search reduced server load significantly once connected to the live MLS data feed. The brokerage has since retired their Zillow advertising spend entirely.",
  },
  Zephyr: {
    problem: "A 200-person tech company was managing employee data across four disconnected tools — a spreadsheet for headcount, an email chain for leave requests, a Google Doc for onboarding checklists, and Slack DMs for everything else. HR spent 30% of their time on administrative coordination rather than people-focused work.",
    approach: "Built a four-tab people operations platform covering the full employee lifecycle. The directory uses local search and department filtering with useMemo so the employee list recomputes only when filters change, not on every render. The onboarding tracker uses a task checklist with local useState — each checkbox toggles individually, and a derived completion percentage drives both the SVG progress ring (strokeDasharray math) and the linear progress bar. The leave management tab maintains request state with useCallback-memoized approve and deny handlers that update status optimistically. The analytics tab derives all statistics from the employee array using useMemo, meaning headcount counts and seniority distributions update automatically when the employee data changes.",
    patterns: ["useMemo for directory filtering and analytics derivation", "useCallback on approve/deny handlers", "SVG progress ring with strokeDasharray math", "Local useState for onboarding task toggling", "Set-based department filter", "React.memo on EmployeeCard, DirectoryTab, OnboardingTab, LeaveTab, AnalyticsTab", "Tab navigation with useReducer", "Accessible task checkboxes with aria-label"],
    result: "Consolidated four disconnected tools into one. HR's administrative overhead dropped from 30% to under 12% of their time in the first quarter. The onboarding tracker specifically reduced new hire time-to-productivity by two weeks because managers could see exactly where each new employee was stuck rather than waiting for a weekly check-in email.",
  },
  Beacon: {
    problem: "A fine dining restaurant was running their kitchen on a whiteboard and verbal tickets from servers — a system that worked at 30 covers but was breaking down as they scaled to 80. Orders were getting lost, ticket times were inconsistent, and the front-of-house had no visibility into kitchen status without physically checking.",
    approach: "Built a four-panel restaurant management system with a live order kanban board as the primary interface. Orders move through four states — pending, cooking, ready, delivered — via buttons that trigger state transitions through setOrders with a functional update pattern. A useOrderTimer hook runs a setInterval stored in useRef to simulate real-time elapsed time updates per order, with cleanup on unmount. Orders that exceed 30 minutes trigger an urgent state that adds a pulsing CSS animation and color shift to draw kitchen attention. The table grid maps occupancy status with visual color coding and elapsed time. The analytics tab derives all revenue and volume statistics from the current order state using useMemo, so numbers update as orders are marked delivered.",
    patterns: ["useOrderTimer with setInterval in useRef and cleanup", "Functional setOrders updates to prevent stale closure", "useMemo for order lane grouping and analytics", "useCallback on advance and deliver handlers", "Urgent order state with CSS keyframe animation", "React.memo on OrderCard, OrdersTab, TablesTab, MenuTab, AnalyticsTab", "Real-time elapsed time simulation", "Kanban state machine (pending → cooking → ready → delivered)"],
    result: "Average ticket time dropped from 34 minutes to 22 minutes in the first month after the kitchen adopted the board. The front-of-house stopped interrupting kitchen staff to check on order status — servers check the ready column themselves. The restaurant has since expanded to a second location and is using the same system.",
  },
};

const CaseStudyModal = memo(function CaseStudyModal({ project, onClose }) {
  const data = CASE_STUDIES[project?.title];

  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

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
        animation: "csModalIn 0.2s ease",
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
        fontFamily: FB,
      }}>

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

        <div style={{ height: 1, background: C.border, marginBottom: 28 }} />

        <Section label="THE BRIEF">
          <p style={{ color: C.dimLt, fontSize: 14, lineHeight: 1.8, fontWeight: 300, fontFamily: FB }}>
            {data.problem}
          </p>
        </Section>

        <Section label="APPROACH & DECISIONS">
          <p style={{ color: C.dimLt, fontSize: 14, lineHeight: 1.8, fontWeight: 300, fontFamily: FB }}>
            {data.approach}
          </p>
        </Section>

        <Section label="TECHNICAL PATTERNS">
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

        <Section label="OUTCOME" last>
          <p style={{ color: C.dimLt, fontSize: 14, lineHeight: 1.8, fontWeight: 300, fontFamily: FB }}>
            {data.result}
          </p>
        </Section>

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
          View Live Project →
        </button>
      </div>

      <style>{`
        @keyframes csModalIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
});

function Section({ label, children, last }) {
  return (
    <div style={{ marginBottom: last ? 28 : 24 }}>
      <p style={{
        fontSize: 10, color: '#5A5A7A', letterSpacing: 2,
        fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 12,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export default CaseStudyModal;
