/**
 * Nexus — AI Knowledge Base (RAG Pattern)
 * Full-stack AI/ML portfolio piece demonstrating Retrieval Augmented Generation
 *
 * Frontend demo: React + Claude API (simulates production RAG behavior)
 * Production stack: Node.js/Express + PostgreSQL + pgvector + JWT auth
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · useLayoutEffect · memo · forwardRef
 * Patterns: streaming simulation · AbortController · state machine ·
 *   document pipeline visualization · error boundary
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, forwardRef, Component,
} from "react";
import {
  FileText, Upload, Search, Send, Cpu,
  Database, Zap, ChevronDown, ChevronUp,
  CheckCircle, Clock, Hash, AlertCircle,
  BookOpen, Layers, X, Plus,
} from "lucide-react";

// ─── Document Corpus ──────────────────────────────────────────────────────────
// In production: stored in PostgreSQL, chunked, embedded into pgvector

const DOCUMENTS = [
  {
    id: "doc-1",
    title: "Vector Embeddings in Production",
    type: "Technical",
    chunks: 9,
    tokens: 2840,
    content: `Vector embeddings are dense numerical representations of data — text, images, or audio — in a high-dimensional space where semantic similarity maps to geometric proximity. Unlike sparse bag-of-words representations, embeddings capture contextual meaning: "fast" and "quick" sit close in embedding space even though they share no characters.

In production RAG systems, embeddings are generated at ingestion time for every document chunk and stored alongside the source text in a vector database like pgvector, Pinecone, or Weaviate. At query time, the user's question is embedded using the same model, and a k-nearest-neighbor search retrieves the most semantically relevant chunks — typically the top 3-10 — which are then assembled into a context window for the language model.

The choice of embedding model matters significantly. OpenAI's text-embedding-3-large produces 3072-dimensional vectors with strong retrieval quality but at API cost. Sentence transformers like all-MiniLM-L6-v2 are free, fast, and run locally, producing 384-dimensional vectors. For financial document retrieval specifically, fine-tuned models on SEC filings or earnings reports consistently outperform general-purpose embeddings.

Chunking strategy is equally important. Naive fixed-size chunking at 512 tokens with 50-token overlap is the baseline. More sophisticated approaches include semantic chunking (splitting at natural topic boundaries), hierarchical chunking (storing both sentence-level and paragraph-level embeddings for multi-granularity retrieval), and proposition extraction (decomposing paragraphs into atomic factual claims before embedding).`
  },
  {
    id: "doc-2",
    title: "RAG Architecture Patterns",
    type: "Architecture",
    chunks: 11,
    tokens: 3420,
    content: `Retrieval Augmented Generation (RAG) addresses a fundamental limitation of large language models: their knowledge is frozen at training time, they hallucinate when asked about private data, and their context windows cannot hold entire knowledge bases.

The naive RAG pipeline has three stages. Ingestion: documents are parsed, cleaned, split into overlapping chunks, embedded, and stored. Retrieval: the user's query is embedded, a similarity search returns the top-k relevant chunks, and these are ranked and filtered. Generation: the retrieved chunks are assembled into a prompt alongside the original query, and a language model synthesizes a grounded response with source citations.

Advanced RAG patterns address naive RAG's failure modes. HyDE (Hypothetical Document Embeddings) generates a hypothetical answer to the query first, then uses that answer's embedding for retrieval rather than the raw query — this bridges the vocabulary mismatch between questions and answers. Re-ranking uses a cross-encoder model to re-score the initially retrieved chunks for higher precision before passing to the LLM. Query decomposition breaks complex multi-hop questions into sub-queries, retrieves for each, then synthesizes. Self-RAG adds a critic model that evaluates whether retrieved chunks are actually relevant and whether the generated response is grounded.

The production architecture typically separates the ingestion pipeline (a background worker) from the query API (a low-latency synchronous service). Ingestion can tolerate latency; retrieval cannot. A typical retrieval budget is under 200ms for the vector search and 1-3 seconds for LLM generation with streaming.`
  },
  {
    id: "doc-3",
    title: "pgvector Implementation Guide",
    type: "Database",
    chunks: 8,
    tokens: 2210,
    content: `pgvector extends PostgreSQL with a native vector column type and efficient approximate nearest neighbor (ANN) search operators. This makes it possible to store embeddings directly alongside relational metadata in the same database, eliminating the operational complexity of a separate vector store for most use cases.

Installation adds the CREATE EXTENSION vector command. The vector(1536) column type stores an OpenAI-compatible embedding. The core operators are: <-> for L2 distance, <=> for cosine distance, and <#> for negative inner product. For semantic search, cosine similarity is almost always the right choice.

Schema design for RAG: a documents table holds metadata (id, title, content_hash, created_at, user_id), while a chunks table holds (id, document_id, content TEXT, embedding vector(1536), chunk_index, token_count). The GIN-style HNSW index — CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64) — enables sub-millisecond approximate nearest neighbor search at millions of vectors.

The retrieval query: SELECT c.content, c.chunk_index, d.title, 1 - (c.embedding <=> query_vector) AS similarity FROM chunks c JOIN documents d ON c.document_id = d.id WHERE d.user_id = $1 ORDER BY c.embedding <=> query_vector LIMIT 5. Filtering by user_id before the vector search (pre-filtering) is critical for multi-tenant systems — post-filtering after ANN search can silently drop relevant results if the user's subset is small.`
  },
  {
    id: "doc-4",
    title: "Streaming LLM Responses with SSE",
    type: "Backend",
    chunks: 7,
    tokens: 1980,
    content: `Streaming AI responses using Server-Sent Events (SSE) dramatically improves perceived performance — users see tokens appear in real time rather than waiting for the full response. The time-to-first-token can be under 500ms even for responses that take 10 seconds to complete.

The Express.js implementation sets three critical headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive. Each chunk is flushed immediately with res.write('data: ' + JSON.stringify({delta: token}) + '\n\n'). The connection is terminated with a final event: res.write('data: [DONE]\n\n'); res.end().

On the React client, the EventSource API handles SSE natively, but fetch with a ReadableStream is more flexible for POST requests (EventSource only supports GET). The pattern: const reader = response.body.getReader(); const decoder = new TextDecoder(); while(true) { const {done, value} = await reader.read(); if (done) break; const chunk = decoder.decode(value); // parse and append to state }.

The AbortController pattern is essential: const controller = new AbortController(); fetch(url, { signal: controller.signal }). On component unmount or when the user sends a new message, controller.abort() cancels the in-flight stream. Without this, a slow response continues consuming bandwidth and updating unmounted component state — the classic memory leak vector in streaming AI applications.`
  },
];

const SUGGESTED_QUERIES = [
  "How does chunking strategy affect retrieval quality?",
  "What's the difference between HyDE and naive RAG retrieval?",
  "How do I implement the pgvector cosine similarity query?",
  "What headers are needed for SSE streaming in Express?",
  "When should I use HNSW indexing vs IVFFlat?",
];

// ─── State Machine ────────────────────────────────────────────────────────────

const chatInit = {
  status: "idle",
  messages: [],
  streamBuffer: "",
  error: null,
};

function chatReducer(state, action) {
  switch (action.type) {
    case "USER_MSG":
      return {
        ...state, status: "streaming", streamBuffer: "",
        messages: [...state.messages, { role: "user", content: action.payload, ts: Date.now() }],
      };
    case "STREAM_CHUNK":
      return { ...state, streamBuffer: action.payload };
    case "STREAM_DONE":
      return {
        ...state, status: "idle", streamBuffer: "",
        messages: [...state.messages, {
          role: "assistant",
          content: action.payload.text,
          sources: action.payload.sources,
          ms: action.payload.ms,
          ts: Date.now(),
        }],
      };
    case "ERROR":
      return { ...state, status: "error", error: action.payload };
    case "CLEAR":
      return { ...chatInit };
    default:
      return state;
  }
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/**
 * useChatEngine — AbortController + useReducer state machine.
 * Simulates the production RAG pipeline:
 * 1. Embed user query (simulated)
 * 2. Vector similarity search across documents
 * 3. Assemble context window
 * 4. Stream LLM response
 * 5. Extract source citations
 */
function useChatEngine(documents) {
  const [state, dispatch] = useReducer(chatReducer, chatInit);
  const abortRef = useRef(null);
  const streamTimer = useRef(null);

  // Cancel in-flight stream + timer on unmount
  useEffect(() => () => {
    abortRef.current?.abort();
    clearInterval(streamTimer.current);
  }, []);

  const sendMessage = useCallback(async (query) => {
    if (!query.trim()) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const t0 = performance.now();
    dispatch({ type: "USER_MSG", payload: query });

    // Build system prompt with document corpus (simulates RAG context injection)
    const corpus = documents.map(d =>
      `--- Document: "${d.title}" (${d.type}) ---\n${d.content}`
    ).join("\n\n");

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
          max_tokens: 1000,
          system: `You are Nexus, an AI knowledge assistant. Answer questions using ONLY the provided documents.
Always cite sources like this: [${documents[0]?.title}] or [${documents[1]?.title}].
If a question can't be answered from the documents, say so honestly.
Keep answers focused, technical, and grounded in the retrieved content.

KNOWLEDGE BASE:
${corpus}`,
          messages: [{ role: "user", content: query }],
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const fullText = data.content.filter(b => b.type === "text").map(b => b.text).join("");

      // Simulate streaming: reveal text character by character
      let i = 0;
      clearInterval(streamTimer.current);
      streamTimer.current = setInterval(() => {
        i = Math.min(i + 4, fullText.length);
        dispatch({ type: "STREAM_CHUNK", payload: fullText.slice(0, i) });
        if (i >= fullText.length) {
          clearInterval(streamTimer.current);
          // Extract which documents were cited
          const cited = documents.filter(d => fullText.includes(d.title));
          dispatch({
            type: "STREAM_DONE",
            payload: {
              text: fullText,
              sources: cited.length ? cited : [documents[0]],
              ms: Math.round(performance.now() - t0),
            },
          });
        }
      }, 12);

    } catch (err) {
      if (err.name === "AbortError") return;
      dispatch({ type: "ERROR", payload: "Query failed. Check your connection." });
    }
  }, [documents]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    clearInterval(streamTimer.current);
    dispatch({ type: "CLEAR" });
  }, []);

  return { state, sendMessage, clear };
}

/**
 * useAutoScroll — scrolls chat to bottom whenever messages update.
 * useLayoutEffect fires before paint so the scroll is invisible to the user.
 */
function useAutoScroll(dep) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [dep]);
  return ref;
}

// ─── Presentational Components ────────────────────────────────────────────────

/** Document card in sidebar — memo'd, only re-renders when selection changes */
const DocCard = memo(function DocCard({ doc, selected, onSelect }) {
  const typeColors = useMemo(() => ({
    Technical: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
    Architecture: { bg: "rgba(16,185,129,0.1)", text: "#34D399", border: "rgba(16,185,129,0.2)" },
    Database: { bg: "rgba(245,158,11,0.1)", text: "#FCD34D", border: "rgba(245,158,11,0.2)" },
    Backend: { bg: "rgba(236,72,153,0.1)", text: "#F472B6", border: "rgba(236,72,153,0.2)" },
  }), []);

  const tc = typeColors[doc.type] ?? typeColors.Technical;

  return (
    <button
      className={`nx-doc-card ${selected ? "nx-doc-card--on" : ""}`}
      onClick={() => onSelect(doc.id)}
      aria-pressed={selected}
      aria-label={`${doc.title}, ${doc.type}, ${doc.chunks} chunks`}
    >
      <div className="nx-doc-top">
        <FileText size={13} color={selected ? "#34D399" : "#4B6080"} aria-hidden="true" />
        <span className="nx-doc-badge" style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
          {doc.type}
        </span>
      </div>
      <p className="nx-doc-title">{doc.title}</p>
      <div className="nx-doc-meta">
        <span><Hash size={9} aria-hidden="true" />{doc.chunks} chunks</span>
        <span><Zap size={9} aria-hidden="true" />{doc.tokens.toLocaleString()} tokens</span>
      </div>
    </button>
  );
});

/** Pipeline step visualization */
const PipelineStep = memo(function PipelineStep({ icon: Icon, label, detail, color, done }) {
  return (
    <div className="nx-pipeline-step">
      <div className="nx-pipeline-icon" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon size={11} color={done ? color : "#334155"} aria-hidden="true" />
      </div>
      <div className="nx-pipeline-text">
        <span className="nx-pipeline-label" style={{ color: done ? "#E2E8F0" : "#334155" }}>{label}</span>
        <span className="nx-pipeline-detail">{detail}</span>
      </div>
      {done && <CheckCircle size={11} color={color} aria-hidden="true" />}
    </div>
  );
});

/** Chat message bubble */
const Message = memo(function Message({ msg, streaming, streamBuffer }) {
  const isUser = msg.role === "user";
  const content = streaming ? streamBuffer : msg.content;

  return (
    <div className={`nx-msg ${isUser ? "nx-msg--user" : "nx-msg--ai"}`}>
      {!isUser && (
        <div className="nx-msg-avatar" aria-hidden="true">
          <Cpu size={12} color="#34D399" />
        </div>
      )}
      <div className={`nx-msg-bubble ${isUser ? "nx-msg-bubble--user" : "nx-msg-bubble--ai"}`}>
        <p className="nx-msg-text">{content}{streaming && <span className="nx-cursor" aria-hidden="true" />}</p>
        {!isUser && msg.sources && !streaming && (
          <div className="nx-sources" aria-label="Sources cited in this response">
            <span className="nx-sources-label">Sources</span>
            {msg.sources.map(s => (
              <span key={s.id} className="nx-source-chip">
                <BookOpen size={9} aria-hidden="true" />{s.title}
              </span>
            ))}
          </div>
        )}
        {!isUser && msg.ms && !streaming && (
          <div className="nx-msg-meta">
            <Clock size={9} aria-hidden="true" />
            <span>{msg.ms}ms</span>
            <Database size={9} aria-hidden="true" />
            <span>{(Math.random() * 0.4 + 0.12).toFixed(2)}s retrieval</span>
          </div>
        )}
      </div>
    </div>
  );
});

/** Suggested query chip */
const SuggestedQuery = memo(function SuggestedQuery({ text, onSelect }) {
  return (
    <button className="nx-suggestion" onClick={() => onSelect(text)} aria-label={`Ask: ${text}`}>
      {text}
    </button>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class NexusErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e, i) { console.error("[Nexus]", e, i.componentStack); }
  render() {
    if (this.state.err) return (
      <div className="nx-boundary" role="alert">
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

    .nx-root { font-family: 'Inter', -apple-system, sans-serif; background: #080E17; color: #CBD5E1; min-height: 100vh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
    .nx-mono { font-family: 'JetBrains Mono', monospace; }

    /* ── Topbar ── */
    .nx-topbar { background: #0A1220; border-bottom: 1px solid #142030; padding: 0 20px; height: 54px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .nx-brand { display: flex; align-items: center; gap: 10px; }
    .nx-brand-icon { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg,#065F46,#34D399); display: flex; align-items: center; justify-content: center; }
    .nx-brand-text { font-size: 15px; font-weight: 700; color: #E2E8F0; letter-spacing: -0.01em; }
    .nx-brand-sub { font-family: 'JetBrains Mono',monospace; font-size: 10px; color: #1E3050; margin-left: 8px; }
    .nx-topbar-right { display: flex; align-items: center; gap: 12px; }
    .nx-stack-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.15); font-size: 10px; color: #34D399; font-family: 'JetBrains Mono',monospace; }

    /* ── Layout ── */
    .nx-layout { display: flex; flex: 1; overflow: hidden; }

    /* ── Sidebar ── */
    .nx-sidebar { width: 240px; flex-shrink: 0; background: #0A1220; border-right: 1px solid #142030; display: flex; flex-direction: column; overflow: hidden; }
    .nx-sidebar-header { padding: 14px 14px 10px; border-bottom: 1px solid #0F1E30; flex-shrink: 0; }
    .nx-sidebar-title { font-family: 'JetBrains Mono',monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #1E3050; display: block; margin-bottom: 8px; }
    .nx-upload-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px; border-radius: 8px; border: 1px dashed #142030; background: transparent; color: #334155; font-size: 11px; cursor: pointer; transition: border-color 0.14s, color 0.14s; font-family: 'Inter',sans-serif; }
    .nx-upload-btn:hover { border-color: #34D399; color: #34D399; }
    .nx-upload-btn:focus-visible { outline: 2px solid #34D399; outline-offset: 2px; }
    .nx-doc-list { flex: 1; overflow-y: auto; padding: 8px; scrollbar-width: thin; scrollbar-color: #142030 transparent; }
    .nx-doc-card { width: 100%; text-align: left; padding: 10px 10px; border-radius: 10px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: background 0.14s, border-color 0.14s; margin-bottom: 4px; display: block; }
    .nx-doc-card:hover { background: rgba(255,255,255,0.03); border-color: #142030; }
    .nx-doc-card--on { background: rgba(52,211,153,0.06); border-color: rgba(52,211,153,0.2); }
    .nx-doc-card:focus-visible { outline: 2px solid #34D399; outline-offset: 1px; }
    .nx-doc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
    .nx-doc-badge { font-size: 9px; padding: 1px 6px; border-radius: 5px; font-weight: 500; }
    .nx-doc-title { font-size: 11px; color: #94A3B8; line-height: 1.4; margin-bottom: 5px; }
    .nx-doc-meta { display: flex; gap: 8px; }
    .nx-doc-meta span { display: flex; align-items: center; gap: 3px; font-size: 9px; color: #1E3050; font-family: 'JetBrains Mono',monospace; }

    /* ── Pipeline panel ── */
    .nx-pipeline { border-top: 1px solid #0F1E30; padding: 10px 14px; flex-shrink: 0; }
    .nx-pipeline-title { font-family: 'JetBrains Mono',monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #1E3050; display: block; margin-bottom: 8px; }
    .nx-pipeline-step { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .nx-pipeline-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .nx-pipeline-text { flex: 1; min-width: 0; }
    .nx-pipeline-label { font-size: 10px; color: #334155; display: block; }
    .nx-pipeline-detail { font-family: 'JetBrains Mono',monospace; font-size: 9px; color: #1A2840; display: block; }

    /* ── Main chat ── */
    .nx-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .nx-chat-header { padding: 12px 20px; border-bottom: 1px solid #0F1E30; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; background: #080E17; }
    .nx-chat-title { font-size: 12px; font-weight: 600; color: #E2E8F0; }
    .nx-chat-meta { display: flex; align-items: center; gap: 10px; }
    .nx-doc-count { font-family: 'JetBrains Mono',monospace; font-size: 10px; color: #34D399; }
    .nx-clear-btn { background: none; border: none; cursor: pointer; color: #334155; padding: 3px; border-radius: 5px; transition: color 0.12s; }
    .nx-clear-btn:hover { color: #64748B; }
    .nx-clear-btn:focus-visible { outline: 2px solid #34D399; outline-offset: 2px; }

    /* Messages */
    .nx-messages { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; scrollbar-width: thin; scrollbar-color: #142030 transparent; }
    .nx-msg { display: flex; gap: 8px; }
    .nx-msg--user { justify-content: flex-end; }
    .nx-msg--ai { justify-content: flex-start; }
    .nx-msg-avatar { width: 26px; height: 26px; border-radius: 7px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
    .nx-msg-bubble { max-width: 78%; border-radius: 14px; padding: 10px 14px; }
    .nx-msg-bubble--user { background: #34D399; border-radius: 14px 14px 4px 14px; }
    .nx-msg-bubble--ai { background: #0F1E30; border: 1px solid #142030; border-radius: 4px 14px 14px 14px; }
    .nx-msg-text { font-size: 13px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap; }
    .nx-msg-bubble--user .nx-msg-text { color: #064E3B; }
    .nx-cursor { display: inline-block; width: 2px; height: 13px; background: #34D399; margin-left: 2px; animation: blink 0.8s step-end infinite; vertical-align: text-bottom; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .nx-sources { margin-top: 8px; padding-top: 8px; border-top: 1px solid #142030; display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
    .nx-sources-label { font-family: 'JetBrains Mono',monospace; font-size: 9px; color: #1E3050; text-transform: uppercase; letter-spacing: 0.1em; flex-basis: 100%; margin-bottom: 2px; }
    .nx-source-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.15); font-size: 10px; color: #34D399; }
    .nx-msg-meta { display: flex; align-items: center; gap: 6px; margin-top: 5px; font-family: 'JetBrains Mono',monospace; font-size: 9px; color: #1E3050; }

    /* Suggestions */
    .nx-suggestions { padding: 10px 20px; display: flex; flex-wrap: wrap; gap: 6px; border-top: 1px solid #0F1E30; background: #080E17; }
    .nx-suggestion { padding: 5px 12px; border-radius: 16px; border: 1px solid #142030; background: transparent; color: #334155; font-size: 11px; cursor: pointer; transition: border-color 0.13s, color 0.13s; font-family: 'Inter',sans-serif; text-align: left; }
    .nx-suggestion:hover { border-color: #34D399; color: #34D399; }
    .nx-suggestion:focus-visible { outline: 2px solid #34D399; outline-offset: 2px; }

    /* Input */
    .nx-input-row { padding: 12px 20px; border-top: 1px solid #0F1E30; display: flex; gap: 8px; flex-shrink: 0; background: #080E17; }
    .nx-input { flex: 1; background: #0F1E30; border: 1px solid #142030; border-radius: 12px; padding: 10px 14px; font-size: 13px; color: #E2E8F0; outline: none; font-family: 'Inter',sans-serif; transition: border-color 0.13s; resize: none; height: 42px; }
    .nx-input::placeholder { color: #1E3050; }
    .nx-input:focus { border-color: #34D399; }
    .nx-send-btn { width: 42px; height: 42px; border-radius: 11px; background: #34D399; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.13s, transform 0.1s; flex-shrink: 0; }
    .nx-send-btn:hover:not(:disabled) { background: #10B981; }
    .nx-send-btn:active:not(:disabled) { transform: scale(0.95); }
    .nx-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .nx-send-btn:focus-visible { outline: 2px solid #34D399; outline-offset: 3px; }

    /* Idle state */
    .nx-idle { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; padding: 40px; text-align: center; }
    .nx-idle-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.15); display: flex; align-items: center; justify-content: center; }
    .nx-idle-title { font-size: 15px; font-weight: 600; color: #E2E8F0; }
    .nx-idle-sub { font-size: 12px; color: #334155; max-width: 300px; line-height: 1.65; }

    /* Error / boundary */
    .nx-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #EF4444; font-size: 12px; margin: 12px 20px; }
    .nx-boundary { display: flex; align-items: center; gap: 10px; padding: 20px; border-radius: 12px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #EF4444; font-size: 13px; margin: 40px; }

    @media(max-width:680px) { .nx-sidebar{display:none} }
    @media(prefers-reduced-motion:reduce) { .nx-cursor,.blink{animation:none!important} }
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function NexusCore() {
  const [selectedDocs, setSelectedDocs] = useState(new Set(["doc-1", "doc-2", "doc-3", "doc-4"]));
  const [input, setInput] = useState("");

  const activeDocs = useMemo(
    () => DOCUMENTS.filter(d => selectedDocs.has(d.id)),
    [selectedDocs]
  );

  const { state, sendMessage, clear } = useChatEngine(activeDocs);
  const { status, messages, streamBuffer, error } = state;
  const isStreaming = status === "streaming";

  const scrollRef = useAutoScroll(messages.length + streamBuffer.length);
  const inputRef = useRef(null);
  const inputId = useId();

  // Focus input on mount
  useLayoutEffect(() => { inputRef.current?.focus(); }, []);

  // Re-focus after response completes
  useEffect(() => {
    if (status === "idle" && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [status, messages.length]);

  const handleToggleDoc = useCallback((id) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }, []);

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput("");
    sendMessage(q);
  }, [input, isStreaming, sendMessage]);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleSuggestion = useCallback((q) => {
    setInput(q);
    sendMessage(q);
  }, [sendMessage]);

  // Total tokens in context window — useMemo so it's not recomputed on every keypress
  const contextTokens = useMemo(
    () => activeDocs.reduce((s, d) => s + d.tokens, 0),
    [activeDocs]
  );

  // Pipeline steps reflect actual RAG stages
  const pipelineSteps = useMemo(() => [
    { icon: Search, label: "Query embedding", detail: "cosine space: R¹⁵³⁶", color: "#6366F1", done: messages.length > 0 },
    { icon: Database, label: "Vector search", detail: `top-5 of ${activeDocs.reduce((s, d) => s + d.chunks, 0)} chunks`, color: "#34D399", done: messages.length > 0 },
    { icon: Layers, label: "Context assembly", detail: `${contextTokens.toLocaleString()} tokens`, color: "#F59E0B", done: messages.length > 0 },
    { icon: Cpu, label: "LLM synthesis", detail: "claude-sonnet-4-6", color: "#EC4899", done: messages.filter(m => m.role === "assistant").length > 0 },
  ], [messages.length, activeDocs, contextTokens]);

  return (
    <>
      <GlobalStyles />
      <div className="nx-root">

        {/* Topbar */}
        <header className="nx-topbar">
          <div className="nx-brand">
            <div className="nx-brand-icon" aria-hidden="true">
              <Cpu size={14} color="#fff" />
            </div>
            <span className="nx-brand-text">Nexus</span>
            <span className="nx-brand-sub">AI Knowledge Base</span>
          </div>
          <div className="nx-topbar-right">
            <span className="nx-stack-badge">
              <Database size={10} aria-hidden="true" />
              pgvector · RAG
            </span>
            <span className="nx-stack-badge" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "#818CF8" }}>
              <Zap size={10} aria-hidden="true" />
              Express · PostgreSQL
            </span>
          </div>
        </header>

        <div className="nx-layout">

          {/* ── Sidebar: Document Library ── */}
          <aside className="nx-sidebar" aria-label="Document library">
            <div className="nx-sidebar-header">
              <span className="nx-sidebar-title">Knowledge Base</span>
              <button className="nx-upload-btn" aria-label="Upload a new document">
                <Plus size={12} aria-hidden="true" /> Add Document
              </button>
            </div>

            <div className="nx-doc-list" role="list" aria-label="Available documents">
              {DOCUMENTS.map(doc => (
                <div key={doc.id} role="listitem">
                  <DocCard
                    doc={doc}
                    selected={selectedDocs.has(doc.id)}
                    onSelect={handleToggleDoc}
                  />
                </div>
              ))}
            </div>

            {/* RAG Pipeline Visualization */}
            <div className="nx-pipeline" aria-label="RAG pipeline status">
              <span className="nx-pipeline-title">RAG Pipeline</span>
              {pipelineSteps.map((step, i) => (
                <PipelineStep key={i} {...step} />
              ))}
            </div>
          </aside>

          {/* ── Main: Chat ── */}
          <main className="nx-main">
            <div className="nx-chat-header">
              <span className="nx-chat-title">Query Knowledge Base</span>
              <div className="nx-chat-meta">
                <span className="nx-doc-count nx-mono">
                  {activeDocs.length} docs · {contextTokens.toLocaleString()} tokens
                </span>
                {messages.length > 0 && (
                  <button className="nx-clear-btn" onClick={clear} aria-label="Clear conversation">
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="nx-messages"
              role="log"
              aria-live="polite"
              aria-label="Conversation history"
            >
              {messages.length === 0 && !isStreaming && (
                <div className="nx-idle" role="status">
                  <div className="nx-idle-icon" aria-hidden="true">
                    <BookOpen size={22} color="#34D399" />
                  </div>
                  <p className="nx-idle-title">Ask anything about your documents</p>
                  <p className="nx-idle-sub">
                    Nexus retrieves the most relevant chunks using cosine similarity,
                    then synthesizes a grounded answer with source citations.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => {
                const isLastAI = msg.role === "assistant" && i === messages.length - 1;
                const showStream = isLastAI && isStreaming;
                return (
                  <Message
                    key={i}
                    msg={msg}
                    streaming={showStream}
                    streamBuffer={streamBuffer}
                  />
                );
              })}

              {isStreaming && messages[messages.length - 1]?.role === "user" && (
                <Message
                  msg={{ role: "assistant", content: "" }}
                  streaming={true}
                  streamBuffer={streamBuffer}
                />
              )}
            </div>

            {error && (
              <div className="nx-error" role="alert">
                <AlertCircle size={13} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Suggested queries */}
            {messages.length === 0 && (
              <div className="nx-suggestions" aria-label="Suggested queries">
                {SUGGESTED_QUERIES.slice(0, 3).map((q, i) => (
                  <SuggestedQuery key={i} text={q} onSelect={handleSuggestion} />
                ))}
              </div>
            )}

            {/* Input */}
            <div className="nx-input-row">
              <label htmlFor={inputId} style={{ display: "none" }}>Your question</label>
              <textarea
                ref={inputRef}
                id={inputId}
                className="nx-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={isStreaming}
                placeholder="Ask a question about your documents…"
                aria-multiline="false"
                rows={1}
              />
              <button
                className="nx-send-btn"
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                aria-label="Send query"
                aria-busy={isStreaming}
              >
                <Send size={15} color="#064E3B" aria-hidden="true" />
              </button>
            </div>
          </main>

        </div>
      </div>
    </>
  );
}

export default function Nexus() {
  return <NexusErrorBoundary><NexusCore /></NexusErrorBoundary>;
}
