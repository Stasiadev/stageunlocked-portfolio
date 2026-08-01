# Stage Unlocked — Design Engineering Portfolio

**Anastasia Matadi** · Design Engineer · Atlanta, GA · [Live Portfolio](https://stagedunlocked-portfolio.vercel.app)

---

## About

A collection of 15 production-quality projects spanning AI integration, full-stack interfaces, data visualization, mobile UX, and beauty tech. Each project is built with React, with Python/FastAPI backends across all full-stack projects. Every project demonstrates senior-level engineering patterns — custom hooks, state machines, AbortController, memoization, and accessibility — applied correctly for each use case.

---

## Tech Stack

**Frontend:** React, JavaScript, TailwindCSS, CSS Modules  
**Backend:** Python, FastAPI, Pydantic, Uvicorn  
**AI/ML:** Claude API (Anthropic), TensorFlow.js, RAG architecture  
**Data:** recharts, pgvector, PostgreSQL  
**Tooling:** Vite, Vercel, Git  

---

## Projects

### AI & Machine Learning

| Project | Description | Stack |
|---------|-------------|-------|
| **Chromata** | AI design token generator — describe a brand in plain text, get a complete token set with color roles, typography pairings, and exportable JSON | React, Claude API |
| **Forge** | AI code review tool — split-panel IDE interface with quality score ring, severity-categorized issue cards, and refactored output | React, Claude API |
| **Nexus** | RAG knowledge base — document Q&A with pgvector similarity search, context assembly pipeline visualization, and streaming responses | React, Claude API, pgvector |
| **Aura** | AI shade matching — camera-based skin tone detection, in-browser undertone classification, sclera white balance correction, personalized foundation recommendations | React, TensorFlow.js, Claude Vision |

---

### Fintech & Analytics

| Project | Description | Stack |
|---------|-------------|-------|
| **Meridian** | Financial analytics dashboard — KPI cards with sparklines, revenue area chart, channel breakdown, deterministic seeded data per time range | React, recharts |
| **FINTRACK** | Portfolio management dashboard — all five navigation tabs functional, live transaction search and filter, donut allocation chart, holdings table, analytics | React, recharts |
| **Pulse** | Social media analytics — real-time updating KPIs across Instagram, Twitter, and YouTube, sparklines, platform comparison charts | React, recharts |

---

### Full-Stack & Product

| Project | Description | Stack |
|---------|-------------|-------|
| **Solara** | Real estate listings platform — debounced property search, filter state machine, Set-based favorites, map view, property detail with agent contact flow. Python/FastAPI backend with property filtering, saved listings, agent contact, and market summary endpoints. | React · Python · FastAPI |
| **Zephyr** | HR & people operations — employee directory, onboarding progress tracker, leave request management, headcount analytics. Python/FastAPI backend with 11 endpoints covering employee CRUD, onboarding task completion, leave approval workflow, and analytics. | React · Python · FastAPI |
| **Beacon** | Restaurant order management — live kanban order board, table occupancy grid, menu management, real-time sales analytics. Python/FastAPI backend deployed on Render, connected to the live React frontend. | React · Python · FastAPI |
| **Flux** | E-commerce checkout — single-page multi-step checkout, live credit card preview, cart state machine, shipping and payment validation. Python/FastAPI backend with full cart management, Pydantic payment validation, and order processing. | React · Python · FastAPI |

---

### Design & UX

| Project | Description | Stack |
|---------|-------------|-------|
| **Forma** | Animated SaaS landing page — position:fixed aurora depth effect, glassmorphic cards with backdrop-filter blur, scroll-triggered count-up stats | React, CSS |
| **Altus** | Travel app mobile UI kit — three complete iOS screens (Explore, Trip Detail, Boarding Pass) inside CSS phone frames | React |
| **Vela** | Travel companion app — four-screen iOS prototype with itinerary, bookings, and destination exploration inside a phone frame | React |

---

### Beauty Tech

| Project | Description | Stack |
|---------|-------------|-------|
| **Lumena** | PMU studio booking flow — six-step consultation wizard with progressive disclosure, calendar, artist selection, and intake form | React |

---

## Engineering Patterns

Every project consistently applies:

- `useReducer` state machines for multi-stage flows
- `AbortController` with `useRef` for cancellable API calls
- `useMemo` and `useCallback` paired with `React.memo` to prevent unnecessary re-renders
- `forwardRef` for ref-forwarding across component boundaries
- `useLayoutEffect` for synchronous DOM operations before paint
- `ErrorBoundary` class components on every project root
- Custom hooks that encapsulate side effects and expose clean interfaces
- WCAG 2.1 AA accessibility patterns throughout

---

## Backend

The `/backend` directory contains four Python/FastAPI backends — one for each full-stack project. Each demonstrates REST API design, Pydantic v2 data validation, enum-based status enforcement, query parameter filtering, and async Python in a web development context.

| Backend | Endpoints | Port | Description |
|---|---|---|---|
| `beacon/` | 8 | 8000 | Restaurant order management — menu, tables, orders, analytics |
| `zephyr/` | 11 | 8001 | HR platform — employee CRUD, onboarding tasks, leave approval, analytics |
| `solara/` | 6 | 8002 | Real estate — property search and filtering, saved listings, agent contact |
| `flux/` | 9 | 8003 | E-commerce — product catalog, cart management, checkout, order processing |

**To run any backend:**
```bash
cd backend/beacon        # or zephyr, solara, flux
py -m pip install fastapi uvicorn[standard] pydantic python-multipart
py -m uvicorn main:app --reload --port 8000
```

Interactive API docs auto-generated at `http://localhost:{port}/docs`

---

## Running Locally

```bash
git clone https://github.com/Stasiadev/stageunlocked-portfolio.git
cd stageunlocked-portfolio
npm install
```

Create a `.env` file in the root:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

```bash
npm run dev
```

AI-powered projects (Chromata, Forge, Nexus, Aura) require an Anthropic API key.

---

## Contact

**Email:** Amatadi00@gmail.com  
**LinkedIn:** [linkedin.com/in/anastasia-m-916350356](https://linkedin.com/in/anastasia-m-916350356)  
**Portfolio:** [stagedunlocked-portfolio.vercel.app](https://stagedunlocked-portfolio.vercel.app)
