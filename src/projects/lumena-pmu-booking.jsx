/**
 * Lumena — PMU Artistry Studio Booking Flow
 * 6-step consultation & booking wizard
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · useLayoutEffect · memo · forwardRef · ErrorBoundary
 * Patterns: multi-step form state machine · directional slide transitions ·
 *   calendar generation · progressive disclosure
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, forwardRef, Component,
} from "react";
import {
  ChevronLeft, ChevronRight, Check,
  Star, Clock, AlertCircle, Sparkles,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const SERVICES = [
  { id:"brows",    name:"Brow Artistry",   desc:"Ombre · Nano · Microblading · Combo",  price:"From $350", duration:"2.5–3 hrs",  emoji:"〜" },
  { id:"lips",     name:"Lip Blushing",    desc:"Full Color · Ombre · Aquarelle",        price:"From $400", duration:"2–2.5 hrs",  emoji:"♡" },
  { id:"liner",    name:"Lash Line",       desc:"Natural · Classic · Smoky",             price:"From $280", duration:"1.5–2 hrs",  emoji:"◉" },
  { id:"combo",    name:"Combo Package",   desc:"Brows + Liner · Save $80",             price:"From $560", duration:"4–4.5 hrs",  emoji:"✦" },
];

const STYLES = {
  brows: [
    { id:"ombre",  name:"Powder Ombre",  desc:"Soft, powdery finish — no hair strokes. Best for oily or mature skin.",   bestFor:"Oily · Mature · Full coverage" },
    { id:"nano",   name:"Nano Brow",     desc:"Ultra-fine hair strokes using a digital machine. Looks indistinguishable from real brows.", bestFor:"Normal · Dry · Natural finish" },
    { id:"micro",  name:"Microblading",  desc:"Manual blade technique. Crisp individual strokes. Not recommended for oily skin.", bestFor:"Dry · Normal · Sparse brows" },
    { id:"combob", name:"Combo Brow",    desc:"Microblading at the front + powder shading toward the tail. Best of both.", bestFor:"All skin types · Full + natural" },
  ],
  lips: [
    { id:"full",       name:"Full Lip Color",   desc:"Solid, opaque color deposit across the entire lip. Bold and defined.", bestFor:"All skin types · Statement look" },
    { id:"ombre_lip",  name:"Lip Ombre",        desc:"Deeper color at the border fading to lighter in the center. Creates natural volume.", bestFor:"Thin lips · Natural finish" },
    { id:"aquarelle",  name:"Aquarelle",        desc:"Watercolor-effect blush across the entire lip, very soft and diffused.", bestFor:"Fair skin · No-makeup makeup" },
  ],
  liner: [
    { id:"natural",  name:"Natural Lash Line",  desc:"Fine, precise line at the lash root. Appears as a natural lash enhancement.", bestFor:"Minimal makeup lovers" },
    { id:"classic",  name:"Classic Liner",      desc:"Slightly thicker line with a soft tapered wing. Everyday glamour.", bestFor:"All eye shapes" },
    { id:"smoky",    name:"Smoky Liner",        desc:"Diffused, smudged effect. No hard edges. Sultry and dramatic.",   bestFor:"Hooded · Deep-set eyes" },
  ],
  combo: [
    { id:"classic_combo", name:"Nano Brow + Natural Liner", desc:"The most popular duo. Natural brows, enhanced lash line.",  bestFor:"Natural look seekers" },
    { id:"glam_combo",    name:"Ombre Brow + Smoky Liner",  desc:"Full glamour package. Bold brows, seductive liner.",          bestFor:"Full glam · Events" },
  ],
};

const ARTISTS = [
  { id:"maya",  name:"Maya Chen",     title:"Master PMU Artist",     exp:"8 yrs", specs:["Nano Brow","Powder Ombre","Combo Brow"], rating:4.9, reviews:312, avail:"Next: Jul 14" },
  { id:"sofia", name:"Sofia Reyes",   title:"Brow & Lip Specialist", exp:"5 yrs", specs:["Lip Blushing","Aquarelle","Nano Brow"], rating:4.8, reviews:184, avail:"Next: Jul 11" },
  { id:"zara",  name:"Zara Williams", title:"PMU Technician",        exp:"3 yrs", specs:["Lash Line","Natural Liner","Ombre"],    rating:4.7, reviews: 96, avail:"Next: Jul 10" },
];

const TIME_SLOTS  = ["9:00 AM","10:00 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];
const UNAVAILABLE = new Set(["10:00 AM","2:00 PM"]);

const STEPS = ["Service","Style","Artist","Date & Time","Consultation","Confirm"];

// ─── State Machine ────────────────────────────────────────────────────────────

const bookingInit = {
  step: 0,
  direction: "forward",
  service: null,
  style: null,
  artist: null,
  date: null,
  time: null,
  consult: { name:"", email:"", phone:"", skinType:"", keloids:false, thinners:false, pregnant:false, notes:"" },
};

function bookingReducer(state, action) {
  switch (action.type) {
    case "SET_SERVICE":  return { ...state, service: action.payload, style: null, step: 1, direction:"forward" };
    case "SET_STYLE":    return { ...state, style: action.payload, step: 2, direction:"forward" };
    case "SET_ARTIST":   return { ...state, artist: action.payload, step: 3, direction:"forward" };
    case "SET_DATE":     return { ...state, date: action.payload };
    case "SET_TIME":     return { ...state, time: action.payload };
    case "NEXT":         return { ...state, step: Math.min(state.step + 1, 5), direction:"forward" };
    case "PREV":         return { ...state, step: Math.max(state.step - 1, 0), direction:"backward" };
    case "CONSULT":      return { ...state, consult: { ...state.consult, ...action.payload } };
    case "RESET":        return bookingInit;
    default:             return state;
  }
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/** Generates July 2026 calendar grid — useMemo so it never recomputes */
function useCalendar() {
  return useMemo(() => {
    const year = 2026, month = 6; // July
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const past = new Date(year, month, 8); // simulate "today" = Jul 8
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return { cells, past: 8, month: "July 2026" };
  }, []);
}

// ─── Step Components ──────────────────────────────────────────────────────────

const ServiceCard = memo(function ServiceCard({ s, selected, onSelect }) {
  return (
    <button
      className={`lm-service-card ${selected ? "lm-service-card--on" : ""}`}
      onClick={() => onSelect(s.id)}
      aria-pressed={selected}
    >
      <span className="lm-service-emoji" aria-hidden="true">{s.emoji}</span>
      <div>
        <p className="lm-service-name">{s.name}</p>
        <p className="lm-service-desc">{s.desc}</p>
      </div>
      <div className="lm-service-meta">
        <span className="lm-service-price">{s.price}</span>
        <span className="lm-service-dur"><Clock size={10} aria-hidden="true" /> {s.duration}</span>
      </div>
      {selected && <div className="lm-check-ring"><Check size={12} aria-hidden="true" /></div>}
    </button>
  );
});

const Step1 = memo(function Step1({ state, dispatch }) {
  return (
    <div className="lm-step">
      <h2 className="lm-step-title">Choose your service</h2>
      <p className="lm-step-sub">Select the treatment you'd like to book a consultation for.</p>
      <div className="lm-service-grid">
        {SERVICES.map(s => (
          <ServiceCard key={s.id} s={s} selected={state.service === s.id} onSelect={id => dispatch({ type:"SET_SERVICE", payload:id })} />
        ))}
      </div>
    </div>
  );
});

const StyleCard = memo(function StyleCard({ st, selected, onSelect }) {
  return (
    <button
      className={`lm-style-card ${selected ? "lm-style-card--on" : ""}`}
      onClick={() => onSelect(st.id)}
      aria-pressed={selected}
    >
      <div className="lm-style-top">
        <p className="lm-style-name">{st.name}</p>
        {selected && <div className="lm-check-mini"><Check size={10} /></div>}
      </div>
      <p className="lm-style-desc">{st.desc}</p>
      <span className="lm-style-best">Best for: {st.bestFor}</span>
    </button>
  );
});

const Step2 = memo(function Step2({ state, dispatch }) {
  const styles = useMemo(() => STYLES[state.service] ?? [], [state.service]);
  const svc = useMemo(() => SERVICES.find(s => s.id === state.service), [state.service]);
  return (
    <div className="lm-step">
      <h2 className="lm-step-title">Choose your style</h2>
      <p className="lm-step-sub">Select the {svc?.name} technique that suits you best.</p>
      <div className="lm-style-grid">
        {styles.map(st => (
          <StyleCard key={st.id} st={st} selected={state.style === st.id} onSelect={id => dispatch({ type:"SET_STYLE", payload:id })} />
        ))}
      </div>
    </div>
  );
});

const ArtistCard = memo(function ArtistCard({ a, selected, onSelect }) {
  const initials = useMemo(() => a.name.split(" ").map(n => n[0]).join(""), [a.name]);
  return (
    <button
      className={`lm-artist-card ${selected ? "lm-artist-card--on" : ""}`}
      onClick={() => onSelect(a.id)}
      aria-pressed={selected}
    >
      <div className="lm-artist-avatar" aria-hidden="true">{initials}</div>
      <div className="lm-artist-info">
        <p className="lm-artist-name">{a.name}</p>
        <p className="lm-artist-title">{a.title} · {a.exp}</p>
        <div className="lm-artist-specs">
          {a.specs.map(s => <span key={s} className="lm-spec-chip">{s}</span>)}
        </div>
      </div>
      <div className="lm-artist-right">
        <div className="lm-artist-rating"><Star size={10} fill="#C9A87A" color="#C9A87A" />{a.rating} <span style={{ color:"#7B5B69" }}>({a.reviews})</span></div>
        <span className="lm-artist-avail">{a.avail}</span>
        {selected && <div className="lm-check-mini" style={{ marginTop:6 }}><Check size={10} /></div>}
      </div>
    </button>
  );
});

const Step3 = memo(function Step3({ state, dispatch }) {
  return (
    <div className="lm-step">
      <h2 className="lm-step-title">Choose your artist</h2>
      <p className="lm-step-sub">All artists are certified PMU technicians. Select by specialty and availability.</p>
      <div className="lm-artist-list">
        {ARTISTS.map(a => (
          <ArtistCard key={a.id} a={a} selected={state.artist === a.id} onSelect={id => dispatch({ type:"SET_ARTIST", payload:id })} />
        ))}
      </div>
    </div>
  );
});

const Step4 = memo(function Step4({ state, dispatch }) {
  const { cells, past, month } = useCalendar();

  return (
    <div className="lm-step">
      <h2 className="lm-step-title">Select a date & time</h2>
      <p className="lm-step-sub">Availability shown for your selected artist.</p>
      <div className="lm-dt-grid">
        {/* Calendar */}
        <div className="lm-cal">
          <div className="lm-cal-header">
            <button className="lm-cal-nav" aria-label="Previous month"><ChevronLeft size={14} /></button>
            <span className="lm-cal-month">{month}</span>
            <button className="lm-cal-nav" aria-label="Next month"><ChevronRight size={14} /></button>
          </div>
          <div className="lm-cal-weekdays">
            {["S","M","T","W","T","F","S"].map((d,i) => <span key={i} className="lm-cal-wd">{d}</span>)}
          </div>
          <div className="lm-cal-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const isPast = d <= past;
              const isSelected = state.date === d;
              return (
                <button
                  key={i}
                  className={`lm-cal-day ${isPast ? "lm-cal-day--past" : ""} ${isSelected ? "lm-cal-day--on" : ""}`}
                  onClick={() => !isPast && dispatch({ type:"SET_DATE", payload:d })}
                  disabled={isPast}
                  aria-label={`July ${d}, 2026${isPast ? ", unavailable" : ""}`}
                  aria-pressed={isSelected}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="lm-time-panel">
          <p className="lm-time-title">Available Times</p>
          {state.date ? (
            <div className="lm-time-grid">
              {TIME_SLOTS.map(t => {
                const unavail = UNAVAILABLE.has(t);
                const selected = state.time === t;
                return (
                  <button
                    key={t}
                    className={`lm-time-slot ${unavail ? "lm-time-slot--unavail" : ""} ${selected ? "lm-time-slot--on" : ""}`}
                    disabled={unavail}
                    onClick={() => !unavail && dispatch({ type:"SET_TIME", payload:t })}
                    aria-pressed={selected}
                    aria-label={`${t}${unavail ? ", booked" : ""}`}
                  >
                    {t}
                    {unavail && <span className="lm-booked">Booked</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="lm-time-empty">Select a date to see available times.</p>
          )}
        </div>
      </div>
    </div>
  );
});

const Step5 = memo(function Step5({ state, dispatch }) {
  const { consult } = state;
  const update = useCallback((key, val) => dispatch({ type:"CONSULT", payload:{ [key]:val } }), [dispatch]);
  const consultId = useId();

  return (
    <div className="lm-step">
      <h2 className="lm-step-title">Consultation intake</h2>
      <p className="lm-step-sub">This helps your artist prepare and ensure your treatment is safe and personalized.</p>
      <div className="lm-consult-grid">
        <div className="lm-field">
          <label className="lm-label" htmlFor={`${consultId}-name`}>Full Name</label>
          <input id={`${consultId}-name`} className="lm-input" value={consult.name} onChange={e=>update("name",e.target.value)} placeholder="Your full name" />
        </div>
        <div className="lm-field">
          <label className="lm-label" htmlFor={`${consultId}-email`}>Email</label>
          <input id={`${consultId}-email`} className="lm-input" value={consult.email} onChange={e=>update("email",e.target.value)} placeholder="your@email.com" type="email" />
        </div>
        <div className="lm-field">
          <label className="lm-label" htmlFor={`${consultId}-phone`}>Phone</label>
          <input id={`${consultId}-phone`} className="lm-input" value={consult.phone} onChange={e=>update("phone",e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
        </div>
        <div className="lm-field">
          <label className="lm-label" htmlFor={`${consultId}-skin`}>Skin Type</label>
          <select id={`${consultId}-skin`} className="lm-input" value={consult.skinType} onChange={e=>update("skinType",e.target.value)}>
            <option value="">Select skin type…</option>
            {["Normal","Dry","Oily","Combination","Sensitive"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <p className="lm-section-label">Medical Screening</p>
      <div className="lm-checks">
        {[
          { key:"keloids",  label:"I have a history of keloid or hypertrophic scarring" },
          { key:"thinners", label:"I am currently taking blood thinners or anticoagulants" },
          { key:"pregnant", label:"I am pregnant or currently nursing" },
        ].map(({ key, label }) => (
          <label key={key} className="lm-check-row">
            <input type="checkbox" className="lm-checkbox" checked={consult[key]} onChange={e=>update(key,e.target.checked)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <div className="lm-field" style={{ marginTop:12 }}>
        <label className="lm-label">Additional Notes</label>
        <textarea className="lm-input lm-textarea" value={consult.notes} onChange={e=>update("notes",e.target.value)} placeholder="Allergies, concerns, reference photos link, or anything else…" rows={3} />
      </div>
    </div>
  );
});

const Step6 = memo(function Step6({ state, onReset }) {
  const svc    = useMemo(() => SERVICES.find(s => s.id === state.service), [state.service]);
  const styles = useMemo(() => STYLES[state.service] ?? [], [state.service]);
  const style  = useMemo(() => styles.find(s => s.id === state.style), [styles, state.style]);
  const artist = useMemo(() => ARTISTS.find(a => a.id === state.artist), [state.artist]);

  return (
    <div className="lm-step lm-step--confirm">
      <div className="lm-confirm-icon" aria-hidden="true"><Sparkles size={24} color="#C9A87A" /></div>
      <h2 className="lm-step-title">Review & Confirm</h2>
      <p className="lm-step-sub">Please review your booking details before confirming.</p>

      <div className="lm-summary">
        <div className="lm-summary-row"><span className="lm-summary-key">Service</span><span className="lm-summary-val">{svc?.name}</span></div>
        <div className="lm-summary-row"><span className="lm-summary-key">Style</span><span className="lm-summary-val">{style?.name}</span></div>
        <div className="lm-summary-row"><span className="lm-summary-key">Artist</span><span className="lm-summary-val">{artist?.name}</span></div>
        <div className="lm-summary-row"><span className="lm-summary-key">Date</span><span className="lm-summary-val">July {state.date}, 2026</span></div>
        <div className="lm-summary-row"><span className="lm-summary-key">Time</span><span className="lm-summary-val">{state.time}</span></div>
        <div className="lm-summary-row"><span className="lm-summary-key">Duration</span><span className="lm-summary-val">{svc?.duration}</span></div>
        <div className="lm-summary-row lm-summary-row--total"><span className="lm-summary-key">Starting Price</span><span className="lm-summary-val lm-gold">{svc?.price}</span></div>
      </div>

      <p className="lm-consent">By confirming, you agree to our <span className="lm-link">cancellation policy</span> (48-hour notice required) and consent to your consultation data being used to prepare for your appointment.</p>

      <button className="lm-confirm-btn" aria-label="Confirm booking">
        Confirm Booking
      </button>
      <button className="lm-reset-btn" onClick={onReset}>Start over</button>
    </div>
  );
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = memo(function ProgressBar({ step }) {
  return (
    <div className="lm-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={6} aria-label={`Step ${step + 1} of 6: ${STEPS[step]}`}>
      <div className="lm-progress-steps">
        {STEPS.map((label, i) => (
          <div key={i} className={`lm-progress-step ${i <= step ? "lm-progress-step--done" : ""}`}>
            <div className="lm-progress-dot">
              {i < step ? <Check size={10} aria-hidden="true" /> : <span>{i + 1}</span>}
            </div>
            <span className="lm-progress-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="lm-progress-track">
        <div className="lm-progress-fill" style={{ width:`${(step / (STEPS.length - 1)) * 100}%` }} />
      </div>
    </div>
  );
});

// ─── Nav Buttons ──────────────────────────────────────────────────────────────

const NavButtons = memo(function NavButtons({ state, dispatch }) {
  const { step, service, style, artist, date, time } = state;
  const canNext = useMemo(() => {
    if (step === 0) return !!service;
    if (step === 1) return !!style;
    if (step === 2) return !!artist;
    if (step === 3) return !!(date && time);
    if (step === 4) return !!(state.consult.name && state.consult.email);
    return false;
  }, [step, service, style, artist, date, time, state.consult]);

  if (step === 5) return null;

  return (
    <div className="lm-nav-btns">
      {step > 0 && (
        <button className="lm-btn-back" onClick={() => dispatch({ type:"PREV" })} aria-label="Go back">
          <ChevronLeft size={15} aria-hidden="true" /> Back
        </button>
      )}
      <button
        className="lm-btn-next"
        disabled={!canNext}
        onClick={() => dispatch({ type:"NEXT" })}
        aria-label="Continue to next step"
      >
        {step === 4 ? "Review Booking" : "Continue"} <ChevronRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class LumenaErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e, i) { console.error("[Lumena]", e, i.componentStack); }
  render() {
    if (this.state.err) return (
      <div className="lm-boundary" role="alert">
        <AlertCircle size={18} aria-hidden="true" /><p>Something went wrong. Refresh to retry.</p>
      </div>
    );
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .lm-root { background: #0F0A10; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; color: #F5EEF2; -webkit-font-smoothing: antialiased; display: flex; flex-direction: column; }
    .lm-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
    .lm-mono  { font-family: 'JetBrains Mono', monospace; }
    .lm-gold  { color: #C9A87A; }

    /* ── Header ── */
    .lm-header { padding: 20px 32px; border-bottom: 1px solid rgba(201,168,122,0.12); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .lm-brand { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 600; color: #C9A87A; letter-spacing: 0.1em; }
    .lm-brand-sub { font-size: 10px; color: #7B5B69; letter-spacing: 0.15em; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }

    /* ── Progress ── */
    .lm-progress { padding: 20px 32px; border-bottom: 1px solid rgba(201,168,122,0.08); flex-shrink: 0; }
    .lm-progress-steps { display: flex; justify-content: space-between; margin-bottom: 10px; position: relative; z-index: 1; }
    .lm-progress-step { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .lm-progress-dot { width: 24px; height: 24px; border-radius: 50%; border: 1px solid #3A2A35; background: #1A1018; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #7B5B69; transition: all 0.25s; }
    .lm-progress-step--done .lm-progress-dot { background: #C9A87A; border-color: #C9A87A; color: #0F0A10; }
    .lm-progress-label { font-size: 9px; color: #7B5B69; letter-spacing: 0.08em; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
    .lm-progress-step--done .lm-progress-label { color: #C9A87A; }
    .lm-progress-track { height: 2px; background: #1E1018; border-radius: 1px; margin-top: 4px; }
    .lm-progress-fill { height: 100%; background: linear-gradient(90deg,#C9A87A,#E8B4C0); border-radius: 1px; transition: width 0.4s cubic-bezier(0.22,1,0.36,1); }

    /* ── Content ── */
    .lm-content { flex: 1; overflow-y: auto; padding: 28px 32px; max-width: 680px; margin: 0 auto; width: 100%; }
    .lm-step { animation: stepIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes stepIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    .lm-step-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: #F5EEF2; margin-bottom: 6px; letter-spacing: -0.01em; }
    .lm-step-sub { font-size: 13px; color: #7B5B69; margin-bottom: 24px; line-height: 1.6; }
    .lm-section-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #4A3040; margin: 16px 0 10px; display: block; }

    /* ── Service Cards ── */
    .lm-service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .lm-service-card { background: #1A1018; border: 1px solid #2E1E28; border-radius: 16px; padding: 18px; text-align: left; cursor: pointer; transition: border-color 0.2s, background 0.2s; position: relative; }
    .lm-service-card:hover { border-color: rgba(201,168,122,0.3); background: #201520; }
    .lm-service-card--on { border-color: #C9A87A; background: rgba(201,168,122,0.06); }
    .lm-service-card:focus-visible { outline: 2px solid #C9A87A; outline-offset: 2px; }
    .lm-service-emoji { font-size: 22px; display: block; margin-bottom: 10px; }
    .lm-service-name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; font-weight: 600; color: #F5EEF2; margin-bottom: 3px; }
    .lm-service-desc { font-size: 11px; color: #7B5B69; line-height: 1.5; margin-bottom: 12px; }
    .lm-service-meta { display: flex; justify-content: space-between; align-items: center; }
    .lm-service-price { font-size: 13px; font-weight: 600; color: #C9A87A; }
    .lm-service-dur { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #4A3040; font-family: 'JetBrains Mono', monospace; }

    /* ── Style Cards ── */
    .lm-style-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .lm-style-card { background: #1A1018; border: 1px solid #2E1E28; border-radius: 14px; padding: 16px; text-align: left; cursor: pointer; transition: border-color 0.18s; position: relative; }
    .lm-style-card:hover { border-color: rgba(201,168,122,0.25); }
    .lm-style-card--on { border-color: #C9A87A; background: rgba(201,168,122,0.05); }
    .lm-style-card:focus-visible { outline: 2px solid #C9A87A; outline-offset: 2px; }
    .lm-style-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .lm-style-name { font-size: 14px; font-weight: 600; color: #F5EEF2; }
    .lm-style-desc { font-size: 11px; color: #9B8090; line-height: 1.55; margin-bottom: 8px; }
    .lm-style-best { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #4A3040; }

    /* ── Artist Cards ── */
    .lm-artist-list { display: flex; flex-direction: column; gap: 10px; }
    .lm-artist-card { background: #1A1018; border: 1px solid #2E1E28; border-radius: 14px; padding: 16px; display: flex; gap: 14px; align-items: flex-start; text-align: left; cursor: pointer; transition: border-color 0.18s; position: relative; }
    .lm-artist-card:hover { border-color: rgba(201,168,122,0.25); }
    .lm-artist-card--on { border-color: #C9A87A; background: rgba(201,168,122,0.05); }
    .lm-artist-card:focus-visible { outline: 2px solid #C9A87A; outline-offset: 2px; }
    .lm-artist-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg,#C9A87A,#E8B4C0); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #0F0A10; flex-shrink: 0; }
    .lm-artist-info { flex: 1; }
    .lm-artist-name { font-size: 14px; font-weight: 600; color: #F5EEF2; margin-bottom: 2px; }
    .lm-artist-title { font-size: 11px; color: #7B5B69; margin-bottom: 6px; }
    .lm-artist-specs { display: flex; flex-wrap: wrap; gap: 4px; }
    .lm-spec-chip { font-size: 9px; padding: 2px 7px; border-radius: 6px; background: rgba(201,168,122,0.08); border: 1px solid rgba(201,168,122,0.15); color: #C9A87A; font-family: 'JetBrains Mono', monospace; }
    .lm-artist-right { text-align: right; flex-shrink: 0; }
    .lm-artist-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #F5EEF2; font-weight: 600; justify-content: flex-end; margin-bottom: 3px; }
    .lm-artist-avail { font-size: 10px; color: #7B5B69; font-family: 'JetBrains Mono', monospace; }

    /* ── Calendar ── */
    .lm-dt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .lm-cal { background: #1A1018; border: 1px solid #2E1E28; border-radius: 14px; padding: 16px; }
    .lm-cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .lm-cal-nav { background: none; border: 1px solid #2E1E28; border-radius: 7px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #7B5B69; cursor: pointer; transition: color 0.12s, border-color 0.12s; }
    .lm-cal-nav:hover { color: #C9A87A; border-color: rgba(201,168,122,0.3); }
    .lm-cal-month { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; font-weight: 600; color: #F5EEF2; }
    .lm-cal-weekdays { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 6px; }
    .lm-cal-wd { text-align: center; font-size: 9px; color: #4A3040; font-family: 'JetBrains Mono', monospace; padding: 4px 0; }
    .lm-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
    .lm-cal-day { width: 100%; aspect-ratio: 1; border-radius: 50%; border: none; background: transparent; color: #9B8090; font-size: 11px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
    .lm-cal-day:hover:not(:disabled) { background: rgba(201,168,122,0.1); color: #C9A87A; }
    .lm-cal-day--on { background: #C9A87A !important; color: #0F0A10 !important; font-weight: 700; }
    .lm-cal-day--past { color: #2E1E28; cursor: not-allowed; }
    .lm-time-panel { background: #1A1018; border: 1px solid #2E1E28; border-radius: 14px; padding: 16px; }
    .lm-time-title { font-size: 12px; font-weight: 600; color: #9B8090; margin-bottom: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; }
    .lm-time-grid { display: flex; flex-direction: column; gap: 6px; }
    .lm-time-slot { padding: 9px 14px; border-radius: 9px; border: 1px solid #2E1E28; background: transparent; color: #9B8090; font-size: 12px; cursor: pointer; transition: all 0.15s; text-align: left; display: flex; justify-content: space-between; align-items: center; font-family: 'Plus Jakarta Sans', sans-serif; }
    .lm-time-slot:hover:not(:disabled) { border-color: rgba(201,168,122,0.3); color: #C9A87A; }
    .lm-time-slot--on { border-color: #C9A87A; background: rgba(201,168,122,0.08); color: #C9A87A; font-weight: 600; }
    .lm-time-slot--unavail { opacity: 0.35; cursor: not-allowed; }
    .lm-time-slot:focus-visible { outline: 2px solid #C9A87A; outline-offset: 2px; }
    .lm-booked { font-size: 9px; color: #4A3040; font-family: 'JetBrains Mono', monospace; }
    .lm-time-empty { font-size: 12px; color: #4A3040; font-style: italic; text-align: center; padding: 24px 0; }

    /* ── Consultation Form ── */
    .lm-consult-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }
    .lm-field { display: flex; flex-direction: column; gap: 5px; }
    .lm-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #4A3040; }
    .lm-input { background: #1A1018; border: 1px solid #2E1E28; border-radius: 9px; padding: 10px 12px; color: #F5EEF2; font-size: 13px; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; transition: border-color 0.15s; }
    .lm-input:focus { border-color: rgba(201,168,122,0.4); }
    .lm-input::placeholder { color: #3A2A35; }
    .lm-textarea { resize: vertical; min-height: 72px; }
    .lm-checks { display: flex; flex-direction: column; gap: 8px; }
    .lm-check-row { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: #9B8090; cursor: pointer; line-height: 1.5; }
    .lm-checkbox { accent-color: #C9A87A; width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; }

    /* ── Confirm ── */
    .lm-step--confirm { text-align: center; }
    .lm-confirm-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(201,168,122,0.1); border: 1px solid rgba(201,168,122,0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .lm-summary { background: #1A1018; border: 1px solid rgba(201,168,122,0.15); border-radius: 16px; padding: 6px 20px; margin-bottom: 16px; text-align: left; }
    .lm-summary-row { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid #1E1018; }
    .lm-summary-row:last-child { border-bottom: none; }
    .lm-summary-row--total .lm-summary-val { font-size: 15px; font-weight: 700; }
    .lm-summary-key { font-size: 11px; color: #7B5B69; }
    .lm-summary-val { font-size: 12px; color: #F5EEF2; font-weight: 500; }
    .lm-consent { font-size: 11px; color: #4A3040; line-height: 1.6; margin-bottom: 16px; }
    .lm-link { color: #C9A87A; text-decoration: underline; cursor: pointer; }
    .lm-confirm-btn { width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg,#C9A87A,#E8B4C0); border: none; color: #0F0A10; font-size: 15px; font-weight: 700; cursor: pointer; margin-bottom: 10px; font-family: 'Plus Jakarta Sans', sans-serif; transition: opacity 0.15s; }
    .lm-confirm-btn:hover { opacity: 0.9; }
    .lm-confirm-btn:focus-visible { outline: 2px solid #C9A87A; outline-offset: 3px; }
    .lm-reset-btn { background: none; border: none; color: #4A3040; font-size: 12px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
    .lm-reset-btn:hover { color: #7B5B69; }

    /* ── Shared ── */
    .lm-check-ring { position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; border-radius: 50%; background: #C9A87A; display: flex; align-items: center; justify-content: center; color: #0F0A10; }
    .lm-check-mini { width: 18px; height: 18px; border-radius: 50%; background: #C9A87A; display: flex; align-items: center; justify-content: center; color: #0F0A10; }

    /* ── Nav ── */
    .lm-nav-btns { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px 24px; max-width: 680px; margin: 0 auto; width: 100%; }
    .lm-btn-back { display: flex; align-items: center; gap: 5px; background: transparent; border: 1px solid #2E1E28; border-radius: 10px; padding: 11px 18px; color: #7B5B69; font-size: 13px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: color 0.14s, border-color 0.14s; }
    .lm-btn-back:hover { color: #C9A87A; border-color: rgba(201,168,122,0.3); }
    .lm-btn-back:focus-visible { outline: 2px solid #C9A87A; outline-offset: 2px; }
    .lm-btn-next { display: flex; align-items: center; gap: 6px; padding: 11px 24px; border-radius: 10px; background: #C9A87A; border: none; color: #0F0A10; font-size: 13px; font-weight: 700; cursor: pointer; margin-left: auto; transition: opacity 0.15s; font-family: 'Plus Jakarta Sans', sans-serif; }
    .lm-btn-next:disabled { opacity: 0.3; cursor: not-allowed; }
    .lm-btn-next:hover:not(:disabled) { opacity: 0.88; }
    .lm-btn-next:focus-visible { outline: 2px solid #C9A87A; outline-offset: 3px; }

    /* ── Error ── */
    .lm-boundary { display: flex; align-items: center; gap: 10px; padding: 20px; border-radius: 12px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #F87171; font-size: 13px; margin: 40px; }

    @media(max-width:580px) { .lm-service-grid,.lm-style-grid,.lm-dt-grid,.lm-consult-grid{grid-template-columns:1fr} .lm-progress-label{display:none} }
    @media(prefers-reduced-motion:reduce) { .lm-step,.lm-progress-fill{animation:none!important;transition:none!important} }
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function LumenaCore() {
  const [state, dispatch] = useReducer(bookingReducer, bookingInit);
  const { step } = state;

  // useLayoutEffect — scroll to top on step change before paint
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleReset = useCallback(() => dispatch({ type:"RESET" }), []);

  // useMemo — only switch between step components when step actually changes
  const ActiveStep = useMemo(() => {
    switch (step) {
      case 0: return <Step1 state={state} dispatch={dispatch} />;
      case 1: return <Step2 state={state} dispatch={dispatch} />;
      case 2: return <Step3 state={state} dispatch={dispatch} />;
      case 3: return <Step4 state={state} dispatch={dispatch} />;
      case 4: return <Step5 state={state} dispatch={dispatch} />;
      case 5: return <Step6 state={state} onReset={handleReset} />;
      default: return null;
    }
  }, [step, state, dispatch, handleReset]);

  return (
    <>
      <GlobalStyles />
      <div className="lm-root">
        <header className="lm-header">
          <div>
            <div className="lm-brand lm-serif">LUMENA</div>
            <div className="lm-brand-sub">PMU Artistry Studio</div>
          </div>
          <div style={{ fontSize:11, color:"#4A3040", fontFamily:"'JetBrains Mono',monospace" }}>
            Atlanta, GA
          </div>
        </header>

        <ProgressBar step={step} />

        <div className="lm-content" key={step}>
          {ActiveStep}
        </div>

        <NavButtons state={state} dispatch={dispatch} />
      </div>
    </>
  );
}

export default function Lumena() {
  return <LumenaErrorBoundary><LumenaCore /></LumenaErrorBoundary>;
}
