/**
 * Forge — AI Code Review Assistant
 * Senior-level portfolio piece: Claude API for code analysis
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · useLayoutEffect · memo · forwardRef
 * Patterns: AbortController · useReducer state machine · custom hooks ·
 *   error boundary · progressive disclosure · keyboard shortcuts
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, forwardRef, Component,
} from "react";
import {
  Code2, Play, RotateCcw, Copy, Check,
  AlertTriangle, CheckCircle, Info,
  Zap, Shield, Sparkles, AlertCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = ["JavaScript", "TypeScript", "Python", "React/JSX", "SQL", "CSS"];

const EXAMPLES = {
  "React/JSX": `function UserCard({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/users/' + userId)
      .then(r => r.json())
      .then(data => setUser(data));
  }, []);

  return (
    <div onClick={() => console.log(user.name)}>
      <img src={user.avatar} />
      <h2>{user.name}</h2>
    </div>
  );
}`,
  TypeScript: `async function fetchUserData(id: string) {
  try {
    const response = await fetch('/api/user/' + id);
    const data = await response.json();
    return data;
  } catch(e) {
    console.log('Error: ' + e);
  }
}

const users = [];
for (var i = 0; i < 1000; i++) {
  users.push(fetchUserData(i));
}`,
};

const SEVERITY_CONFIG = {
  bug: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", Icon: AlertTriangle, label: "Bug" },
  security: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", Icon: Shield, label: "Security" },
  performance: { color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", Icon: Zap, label: "Performance" },
  suggestion: { color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", Icon: Sparkles, label: "Suggestion" },
  info: { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", Icon: Info, label: "Info" },
};

// ─── State Machine ────────────────────────────────────────────────────────────

const initState = {
  status: "idle",    // "idle" | "loading" | "success" | "error"
  result: null,
  error: null,
};

function reviewReducer(state, action) {
  switch (action.type) {
    case "START": return { status: "loading", result: null, error: null };
    case "SUCCESS": return { status: "success", result: action.payload, error: null };
    case "ERROR": return { status: "error", result: null, error: action.payload };
    case "RESET": return initState;
    default: return state;
  }
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/**
 * useReviewEngine — encapsulates Claude API call + AbortController.
 * Cancels in-flight request on unmount and before each new submission.
 */
function useReviewEngine() {
  const [state, dispatch] = useReducer(reviewReducer, initState);
  const abortRef = useRef(null);

  // Cancel any in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const review = useCallback(async (code, language) => {
    const q = code.trim();
    if (!q) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    dispatch({ type: "START" });

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
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: `Review this ${language} code and return ONLY valid JSON, no markdown:
{
  "score": 0-100,
  "summary": "2 sentence overall assessment",
  "issues": [
    {
      "type": "bug|security|performance|suggestion|info",
      "title": "short title",
      "description": "clear explanation",
      "line": null or line number
    }
  ],
  "strengths": ["up to 3 short strength strings"],
  "refactored": "improved version of the code (same language)"
}

Code to review:
\`\`\`${language}
${q}
\`\`\``,
          }],
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const raw = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      dispatch({ type: "SUCCESS", payload: parsed });
    } catch (err) {
      if (err.name === "AbortError") return;
      dispatch({ type: "ERROR", payload: "Review failed. Check your connection and try again." });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  return { state, review, reset };
}

/**
 * useCopyToClipboard — reusable, timer cleaned up on unmount
 */
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

// ─── forwardRef Textarea ──────────────────────────────────────────────────────

/**
 * CodeEditor — forwardRef so ForgeCore can manage focus on mount
 * without coupling the ref to a specific DOM element through props.
 */
const CodeEditor = forwardRef(function CodeEditor(
  { id, value, onChange, language, disabled },
  ref
) {
  return (
    <div className="fg-editor-wrap">
      <div className="fg-editor-gutter" aria-hidden="true">
        {value.split("\n").map((_, i) => (
          <span key={i} className="fg-line-num">{i + 1}</span>
        ))}
      </div>
      <textarea
        ref={ref}
        id={id}
        className="fg-editor fg-mono"
        value={value}
        onChange={onChange}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        aria-label={`${language} code editor`}
        aria-describedby="fg-editor-hint"
        aria-multiline="true"
      />
    </div>
  );
});

// ─── Presentational Components (memo'd) ───────────────────────────────────────

/** Score ring — pure SVG gauge, memo'd */
const ScoreRing = memo(function ScoreRing({ score }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="fg-score-ring" aria-label={`Code quality score: ${score} out of 100`}>
      <svg width={72} height={72} viewBox="0 0 72 72" aria-hidden="true">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#F1F5F9" strokeWidth={5} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="fg-score-num" style={{ color }}>{score}</span>
    </div>
  );
});

/** Individual issue card — expandable, memo'd */
const IssueCard = memo(function IssueCard({ issue, index }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[issue.type] ?? SEVERITY_CONFIG.info;
  const { Icon } = cfg;
  const handleKey = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(p => !p); }
  }, []);

  return (
    <div
      className="fg-issue"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={`${cfg.label}: ${issue.title}. ${open ? "Collapse" : "Expand"} for details.`}
      onClick={() => setOpen(p => !p)}
      onKeyDown={handleKey}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, animationDelay: `${index * 0.06}s` }}
    >
      <div className="fg-issue-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={13} color={cfg.color} aria-hidden="true" />
          <span className="fg-issue-type" style={{ color: cfg.color }}>{cfg.label}</span>
          {issue.line && <span className="fg-issue-line fg-mono">L{issue.line}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="fg-issue-title">{issue.title}</span>
          {open ? <ChevronUp size={12} color="#94A3B8" aria-hidden="true" /> : <ChevronDown size={12} color="#94A3B8" aria-hidden="true" />}
        </div>
      </div>
      {open && <p className="fg-issue-body">{issue.description}</p>}
    </div>
  );
});

/** Refactored code panel with copy button */
const RefactoredPanel = memo(function RefactoredPanel({ code }) {
  const [copied, copy] = useCopyToClipboard();
  return (
    <div className="fg-refactor">
      <div className="fg-refactor-header">
        <span className="fg-label">Refactored</span>
        <button className="fg-copy-btn" onClick={() => copy(code)} aria-label="Copy refactored code">
          {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="fg-mono fg-code-block" tabIndex={0} aria-label="Refactored code">{code}</pre>
    </div>
  );
});

/** Skeleton for loading state */
const ResultSkeleton = memo(function ResultSkeleton() {
  return (
    <div aria-busy="true" aria-label="Analyzing code…" className="fg-skeleton-wrap">
      {[80, 120, 80, 100].map((h, i) => (
        <div key={i} className="shimmer fg-skeleton" style={{ height: h, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ForgeErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e, i) { console.error("[Forge]", e, i.componentStack); }
  render() {
    if (this.state.err) return (
      <div className="fg-boundary" role="alert">
        <AlertCircle size={18} aria-hidden="true" />
        <p>Something went wrong. Refresh to retry.</p>
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

    .fg-root { font-family: 'Inter', -apple-system, sans-serif; background: #FAFBFC; color: #0F172A; min-height: 100vh; -webkit-font-smoothing: antialiased; }
    .fg-mono { font-family: 'JetBrains Mono', monospace; }
    .fg-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #94A3B8; }

    /* ── Topbar ── */
    .fg-topbar { background: #fff; border-bottom: 1px solid #E2E8F0; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
    .fg-brand { display: flex; align-items: center; gap: 9px; }
    .fg-brand-icon { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg,#10B981,#0EA5E9); display: flex; align-items: center; justify-content: center; }
    .fg-brand-name { font-size: 15px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em; }
    .fg-brand-sub { font-size: 10px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; }
    .fg-topbar-right { display: flex; align-items: center; gap: 12px; }
    .fg-shortcut { font-size: 10px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; }
    .fg-shortcut kbd { display: inline-block; padding: 1px 5px; border-radius: 4px; background: #F1F5F9; border: 1px solid #E2E8F0; font-size: 9px; }

    /* ── Layout ── */
    .fg-layout { display: grid; grid-template-columns: 1fr 1fr; height: calc(100vh - 56px); }
    .fg-pane { display: flex; flex-direction: column; overflow: hidden; }
    .fg-pane-left { border-right: 1px solid #E2E8F0; background: #fff; }
    .fg-pane-right { background: #FAFBFC; }
    .fg-pane-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #F1F5F9; flex-shrink: 0; }

    /* Language selector */
    .fg-lang-select { display: flex; gap: 4px; flex-wrap: wrap; }
    .fg-lang-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid #E2E8F0; background: transparent; font-size: 11px; color: #64748B; cursor: pointer; transition: all 0.12s; font-family: 'Inter', sans-serif; }
    .fg-lang-btn:hover { border-color: #10B981; color: #10B981; }
    .fg-lang-btn--on { background: rgba(16,185,129,0.08); border-color: #10B981; color: #10B981; font-weight: 600; }
    .fg-lang-btn:focus-visible { outline: 2px solid #10B981; outline-offset: 2px; }

    /* Editor */
    .fg-editor-wrap { flex: 1; display: flex; overflow: hidden; font-size: 12px; line-height: 1.7; }
    .fg-editor-gutter { padding: 14px 12px 14px 18px; background: #F8FAFC; border-right: 1px solid #F1F5F9; display: flex; flex-direction: column; user-select: none; min-width: 44px; overflow: hidden; }
    .fg-line-num { display: block; color: #CBD5E1; font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.7; text-align: right; }
    .fg-editor { flex: 1; resize: none; border: none; outline: none; padding: 14px 18px; font-size: 12px; line-height: 1.7; color: #1E293B; background: transparent; font-family: 'JetBrains Mono', monospace; }
    .fg-editor:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Run button */
    .fg-run-row { padding: 12px 18px; border-top: 1px solid #F1F5F9; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .fg-run-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 9px; background: #10B981; color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: background 0.13s, transform 0.1s; font-family: 'Inter', sans-serif; }
    .fg-run-btn:hover:not(:disabled) { background: #059669; }
    .fg-run-btn:active:not(:disabled) { transform: scale(0.98); }
    .fg-run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .fg-run-btn:focus-visible { outline: 2px solid #10B981; outline-offset: 3px; }
    .fg-reset-btn { display: inline-flex; align-items: center; gap: 5px; padding: 9px 14px; border-radius: 9px; border: 1px solid #E2E8F0; background: transparent; color: #64748B; font-size: 12px; cursor: pointer; transition: border-color 0.12s, color 0.12s; font-family: 'Inter', sans-serif; }
    .fg-reset-btn:hover { border-color: #94A3B8; color: #475569; }
    .fg-reset-btn:focus-visible { outline: 2px solid #10B981; outline-offset: 2px; }

    /* Result pane content */
    .fg-result-scroll { flex: 1; overflow-y: auto; padding: 18px; scrollbar-width: thin; scrollbar-color: #E2E8F0 transparent; }

    /* Score + summary */
    .fg-score-section { display: flex; align-items: flex-start; gap: 16px; padding: 16px 18px; background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 12px; }
    .fg-score-ring { position: relative; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .fg-score-num { position: absolute; font-size: 14px; font-weight: 700; }
    .fg-score-right { flex: 1; }
    .fg-score-title { font-size: 13px; font-weight: 600; color: #0F172A; margin-bottom: 5px; }
    .fg-score-summary { font-size: 12px; color: #64748B; line-height: 1.65; }

    /* Strengths */
    .fg-strengths { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
    .fg-strength { display: flex; align-items: flex-start; gap: 7px; font-size: 12px; color: #475569; line-height: 1.5; }

    /* Issues */
    .fg-issues-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .fg-issue { border-radius: 10px; padding: 10px 14px; cursor: pointer; animation: issueIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes issueIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .fg-issue:focus-visible { outline: 2px solid #10B981; outline-offset: 2px; }
    .fg-issue-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .fg-issue-type { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
    .fg-issue-line { font-size: 9px; color: #94A3B8; padding: 1px 5px; background: rgba(0,0,0,0.04); border-radius: 4px; }
    .fg-issue-title { font-size: 12px; color: #1E293B; font-weight: 500; }
    .fg-issue-body { font-size: 11px; color: #64748B; line-height: 1.65; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.05); }

    /* Refactored */
    .fg-refactor { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
    .fg-refactor-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #F1F5F9; }
    .fg-copy-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; color: #10B981; font-size: 11px; padding: 3px 8px; border-radius: 5px; transition: background 0.12s; font-family: 'JetBrains Mono', monospace; }
    .fg-copy-btn:hover { background: rgba(16,185,129,0.08); }
    .fg-copy-btn:focus-visible { outline: 2px solid #10B981; outline-offset: 2px; }
    .fg-code-block { font-size: 11px; color: #334155; line-height: 1.7; padding: 14px 16px; overflow-x: auto; max-height: 220px; scrollbar-width: thin; scrollbar-color: #E2E8F0 transparent; }

    /* Skeleton */
    .fg-skeleton-wrap { display: flex; flex-direction: column; gap: 10px; }
    .fg-skeleton { border-radius: 10px; }
    .shimmer { background: linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size: 400% 100%; animation: shimmerMove 1.4s ease infinite; }
    @keyframes shimmerMove { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

    /* Idle / error states */
    .fg-idle { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 14px; padding: 40px; text-align: center; }
    .fg-idle-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15); display: flex; align-items: center; justify-content: center; }
    .fg-idle-title { font-size: 15px; font-weight: 600; color: #0F172A; }
    .fg-idle-sub { font-size: 13px; color: #94A3B8; max-width: 280px; line-height: 1.6; }
    .fg-error-msg { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-radius: 10px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #EF4444; font-size: 12px; }
    .fg-boundary { display: flex; align-items: center; gap: 10px; padding: 20px 24px; border-radius: 12px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #EF4444; font-size: 13px; margin: 40px 24px; }

    /* Section headers in results */
    .fg-section-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }

    /* Responsive */
    @media(max-width:680px) { .fg-layout{grid-template-columns:1fr;height:auto} .fg-pane-left{border-right:none;border-bottom:1px solid #E2E8F0;height:50vh} }
    @media(prefers-reduced-motion:reduce) { .shimmer,.fg-issue{animation:none!important} }
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function ForgeCore() {
  const { state, review, reset } = useReviewEngine();
  const [language, setLanguage] = useState("React/JSX");
  const [code, setCode] = useState(EXAMPLES["React/JSX"]);
  const editorRef = useRef(null);
  const inputId = useId();

  const { status, result, error } = state;
  const isLoading = status === "loading";

  // useLayoutEffect — focus the editor synchronously before first paint
  useLayoutEffect(() => {
    editorRef.current?.focus();
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + Enter to run review
  useEffect(() => {
    const handle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isLoading && code.trim()) review(code, language);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle); // cleanup
  }, [isLoading, code, language, review]);

  const handleLang = useCallback((l) => {
    setLanguage(l);
    if (EXAMPLES[l]) setCode(EXAMPLES[l]);
    reset();
  }, [reset]);

  const handleCode = useCallback((e) => setCode(e.target.value), []);
  const handleRun = useCallback(() => review(code, language), [review, code, language]);
  const handleReset = useCallback(() => { setCode(EXAMPLES[language] ?? ""); reset(); }, [language, reset]);

  // useMemo — don't re-derive counts on every render
  const issueCounts = useMemo(() => {
    if (!result?.issues) return {};
    return result.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [result]);

  return (
    <>
      <GlobalStyles />
      <div className="fg-root">

        {/* Topbar */}
        <header className="fg-topbar">
          <div className="fg-brand">
            <div className="fg-brand-icon" aria-hidden="true">
              <Code2 size={14} color="#fff" />
            </div>
            <div>
              <span className="fg-brand-name">Forge</span>
              <span style={{ marginLeft: 8 }} className="fg-brand-sub">AI Code Review</span>
            </div>
          </div>
          <div className="fg-topbar-right">
            <span className="fg-shortcut" aria-label="Keyboard shortcut: Command or Control plus Enter to run review">
              <kbd>⌘</kbd> + <kbd>↵</kbd> to review
            </span>
          </div>
        </header>

        <div className="fg-layout">

          {/* ── Left: Editor ── */}
          <div className="fg-pane fg-pane-left">
            <div className="fg-pane-header">
              <label htmlFor={inputId} className="fg-label">Code Input</label>
              <div className="fg-lang-select" role="group" aria-label="Select programming language">
                {LANGUAGES.map(l => (
                  <button
                    key={l}
                    className={`fg-lang-btn ${language === l ? "fg-lang-btn--on" : ""}`}
                    onClick={() => handleLang(l)}
                    aria-pressed={language === l}
                    disabled={isLoading}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* forwardRef editor component */}
            <CodeEditor
              ref={editorRef}
              id={inputId}
              value={code}
              onChange={handleCode}
              language={language}
              disabled={isLoading}
            />
            <span id="fg-editor-hint" style={{ display: "none" }}>
              Paste or write {language} code. Use Cmd+Enter to run the review.
            </span>

            <div className="fg-run-row">
              <button
                className="fg-run-btn"
                onClick={handleRun}
                disabled={isLoading || !code.trim()}
                aria-busy={isLoading}
                aria-label="Run AI code review"
              >
                {isLoading
                  ? <><RotateCcw size={13} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" /> Reviewing…</>
                  : <><Play size={13} aria-hidden="true" /> Review Code</>
                }
              </button>
              <button className="fg-reset-btn" onClick={handleReset} disabled={isLoading} aria-label="Reset to example code">
                <RotateCcw size={12} aria-hidden="true" /> Reset
              </button>
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="fg-pane fg-pane-right">
            <div className="fg-pane-header">
              <span className="fg-label">Analysis</span>
              {result && (
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(issueCounts).map(([type, count]) => {
                    const cfg = SEVERITY_CONFIG[type];
                    return cfg ? (
                      <span key={type} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 600 }}>
                        {count} {cfg.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* aria-live — screen readers announce results as they appear */}
            <div
              className="fg-result-scroll"
              aria-live="polite"
              aria-atomic="false"
              aria-busy={isLoading}
            >
              {isLoading && <ResultSkeleton />}

              {status === "error" && error && (
                <div className="fg-error-msg" role="alert">
                  <AlertCircle size={14} aria-hidden="true" /><span>{error}</span>
                </div>
              )}

              {status === "success" && result && (
                <>
                  {/* Score */}
                  <div className="fg-score-section">
                    <ScoreRing score={result.score} />
                    <div className="fg-score-right">
                      <p className="fg-score-title">Quality Score</p>
                      <p className="fg-score-summary">{result.summary}</p>
                    </div>
                  </div>

                  {/* Strengths */}
                  {result.strengths?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="fg-section-header">
                        <CheckCircle size={12} color="#10B981" aria-hidden="true" />
                        <span className="fg-label">Strengths</span>
                      </div>
                      <div className="fg-strengths">
                        {result.strengths.map((s, i) => (
                          <div key={i} className="fg-strength">
                            <CheckCircle size={11} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {result.issues?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="fg-section-header">
                        <AlertTriangle size={12} color="#F59E0B" aria-hidden="true" />
                        <span className="fg-label">Issues · {result.issues.length} found</span>
                      </div>
                      <div className="fg-issues-list" role="list" aria-label="Code issues">
                        {result.issues.map((issue, i) => (
                          <div key={i} role="listitem">
                            <IssueCard issue={issue} index={i} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refactored code */}
                  {result.refactored && (
                    <div>
                      <div className="fg-section-header" style={{ marginBottom: 8 }}>
                        <Sparkles size={12} color="#8B5CF6" aria-hidden="true" />
                        <span className="fg-label">Suggested Refactor</span>
                      </div>
                      <RefactoredPanel code={result.refactored} />
                    </div>
                  )}
                </>
              )}

              {status === "idle" && (
                <div className="fg-idle" role="status">
                  <div className="fg-idle-icon" aria-hidden="true">
                    <Code2 size={22} color="#10B981" />
                  </div>
                  <p className="fg-idle-title">Ready to review</p>
                  <p className="fg-idle-sub">
                    Paste any code into the editor and click Review — or press ⌘↵.
                    Forge will check for bugs, security issues, and performance improvements.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function Forge() {
  return <ForgeErrorBoundary><ForgeCore /></ForgeErrorBoundary>;
}
