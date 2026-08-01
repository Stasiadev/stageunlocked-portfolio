/**
 * Solara — Real Estate Listings Platform
 * Property search, filtering, saved listings, and detail view
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · memo · ErrorBoundary
 * Patterns: filter state machine · optimistic save · debounced search ·
 *   URL-driven navigation simulation · skeleton loading
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, memo, Component,
} from "react";
import {
  Search, Heart, MapPin, Bed, Bath, Square, SlidersHorizontal,
  X, ChevronDown, Star, Camera, ChevronLeft, Phone, Mail,
  Calendar, Check, AlertCircle, Map,
} from "lucide-react";

// ─── API ─────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://solara-api-jc92.onrender.com';

const TYPES    = ["All","House","Condo","Townhome"];
const PRICE_RANGES = ["Any Price","Under $500k","$500k–$1M","$1M–$2M","$2M+"];
const BEDS_OPTS    = ["Any","1+","2+","3+","4+"];

// ─── Filter reducer ───────────────────────────────────────────────────────────

const filterInit = { type:"All", priceRange:"Any Price", minBeds:"Any", search:"", sortBy:"featured" };

function filterReducer(state, action) {
  switch(action.type) {
    case "TYPE":   return { ...state, type:action.v };
    case "PRICE":  return { ...state, priceRange:action.v };
    case "BEDS":   return { ...state, minBeds:action.v };
    case "SEARCH": return { ...state, search:action.v };
    case "SORT":   return { ...state, sortBy:action.v };
    case "RESET":  return filterInit;
    default:       return state;
  }
}

// ─── Custom hooks ─────────────────────────────────────────────────────────────

function useDebounce(val, delay=300) {
  const [debounced, setDebounced] = useState(val);
  useEffect(() => {
    const t = setTimeout(()=>setDebounced(val), delay);
    return ()=>clearTimeout(t);
  }, [val, delay]);
  return debounced;
}

function useSaved() {
  const [saved, setSaved] = useState(new Set([1,6]));
  const toggle = useCallback((id)=>{
    const nextSaved = !saved.has(id);

    fetch(`${BASE_URL}/api/properties/${id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: nextSaved }),
    });

    setSaved(prev=>{
      const next=new Set(prev);
      nextSaved?next.add(id):next.delete(id);
      return next;
    });
  },[saved]);
  return [saved, toggle];
}

// ─── Property Card ────────────────────────────────────────────────────────────

const PropertyCard = memo(function PropertyCard({ p, saved, onSave, onSelect }) {
  return (
    <div className="sl-card" onClick={()=>onSelect(p)} role="button" tabIndex={0}
      onKeyDown={e=>(e.key==="Enter"||e.key===" ")&&onSelect(p)}
      aria-label={`${p.title}, ${p.type}, $${(p.price/1000).toFixed(0)}k`}>

      {/* Image */}
      <div className="sl-card-img" style={{background:`linear-gradient(135deg,${p.color}20,${p.color}10)`}}>
        <div className="sl-card-img-inner" style={{background:`${p.color}18`,color:p.color}}>
          <MapPin size={20}/>
        </div>
        {p.featured && <div className="sl-featured-badge">Featured</div>}
        <div className="sl-photo-count"><Camera size={10}/> {p.photos}</div>
        <button className={`sl-save-btn ${saved?"sl-save-btn--on":""}`}
          onClick={e=>{e.stopPropagation();onSave(p.id)}}
          aria-label={saved?"Remove from saved":"Save property"}>
          <Heart size={14} fill={saved?"#EF4444":"none"} color={saved?"#EF4444":"#fff"}/>
        </button>
      </div>

      {/* Body */}
      <div className="sl-card-body">
        <div className="sl-card-type">{p.type}</div>
        <div className="sl-card-price">${p.price>=1000000?(p.price/1000000).toFixed(2)+"M":(p.price/1000).toFixed(0)+"k"}</div>
        <div className="sl-card-title">{p.title}</div>
        <div className="sl-card-address"><MapPin size={10}/>{p.address}, {p.city}</div>

        <div className="sl-card-specs">
          <span className="sl-spec"><Bed size={11}/>{p.beds} bd</span>
          <span className="sl-spec-div">·</span>
          <span className="sl-spec"><Bath size={11}/>{p.baths} ba</span>
          <span className="sl-spec-div">·</span>
          <span className="sl-spec"><Square size={11}/>{p.sqft.toLocaleString()} ft²</span>
        </div>

        <div className="sl-card-tags">
          {p.tags.slice(0,2).map(t=><span key={t} className="sl-tag" style={{background:`${p.color}12`,color:p.color,borderColor:`${p.color}30`}}>{t}</span>)}
        </div>

        <div className="sl-card-agent">
          <div className="sl-agent-av" style={{background:`${p.color}20`,color:p.color}}>{p.agent.split(" ").map(n=>n[0]).join("")}</div>
          <span className="sl-agent-name">{p.agent}</span>
          <div className="sl-card-rating"><Star size={10} fill="#F59E0B" color="#F59E0B"/>{p.rating}</div>
        </div>
      </div>
    </div>
  );
});

// ─── Property Detail ──────────────────────────────────────────────────────────

const PropertyDetail = memo(function PropertyDetail({ p, saved, onSave, onBack }) {
  const [showContact, setShowContact] = useState(false);
  const [requested, setRequested] = useState(false);

  return (
    <div className="sl-detail">
      <button className="sl-back-btn" onClick={onBack} aria-label="Back to listings">
        <ChevronLeft size={16}/> Back to Listings
      </button>

      <div className="sl-detail-img" style={{background:`linear-gradient(135deg,${p.color}20,${p.color}08)`}}>
        <div style={{fontSize:64}}><MapPin size={48} color={p.color}/></div>
        <div className="sl-detail-photo-strip">
          {Array(Math.min(5,p.photos)).fill(0).map((_,i)=>(
            <div key={i} className="sl-thumb" style={{background:`${p.color}${15+i*5}`}}/>
          ))}
          <div className="sl-thumb sl-thumb--more">+{p.photos-5}</div>
        </div>
      </div>

      <div className="sl-detail-body">
        <div className="sl-detail-header">
          <div>
            <div className="sl-detail-type">{p.type} · {p.city}</div>
            <div className="sl-detail-price">${p.price>=1000000?(p.price/1000000).toFixed(2)+"M":(p.price/1000).toFixed(0)+"k"}</div>
            <div className="sl-detail-title">{p.title}</div>
            <div className="sl-detail-address"><MapPin size={12}/>{p.address}</div>
          </div>
          <button className={`sl-save-lg ${saved?"sl-save-lg--on":""}`} onClick={()=>onSave(p.id)}>
            <Heart size={18} fill={saved?"#EF4444":"none"} color={saved?"#EF4444":"#94A3B8"}/>
          </button>
        </div>

        <div className="sl-detail-specs">
          {[[<Bed size={16}/>,p.beds+" Beds"],[<Bath size={16}/>,p.baths+" Baths"],[<Square size={16}/>,p.sqft.toLocaleString()+" ft²"],[<Calendar size={16}/>,p.built+" Built"]].map(([icon,val],i)=>(
            <div key={i} className="sl-detail-spec">
              <div className="sl-detail-spec-icon" style={{color:p.color}}>{icon}</div>
              <div className="sl-detail-spec-val">{val}</div>
            </div>
          ))}
        </div>

        <div className="sl-detail-tags">
          {p.tags.map(t=><span key={t} className="sl-tag" style={{background:`${p.color}12`,color:p.color,borderColor:`${p.color}30`}}>{t}</span>)}
        </div>

        <div className="sl-detail-section-label">About This Property</div>
        <p className="sl-detail-desc">
          This {p.type.toLowerCase()} at {p.address} offers {p.beds} bedrooms and {p.baths} bathrooms across {p.sqft.toLocaleString()} square feet of living space. Built in {p.built}, the property features {p.tags.join(", ").toLowerCase()}. Located in {p.city}, this is a rare opportunity in one of Atlanta's most desirable neighborhoods.
        </p>

        <div className="sl-agent-card" style={{borderColor:`${p.color}25`,background:`${p.color}06`}}>
          <div className="sl-agent-av sl-agent-av--lg" style={{background:`${p.color}20`,color:p.color}}>
            {p.agent.split(" ").map(n=>n[0]).join("")}
          </div>
          <div>
            <div className="sl-agent-name-lg">{p.agent}</div>
            <div className="sl-agent-title">Listing Agent · Solara Realty</div>
            <div className="sl-agent-rating-row"><Star size={11} fill="#F59E0B" color="#F59E0B"/><span>{p.rating} rating</span></div>
          </div>
        </div>

        <div className="sl-cta-row">
          <button className="sl-cta-primary" style={{background:p.color}}
            onClick={()=>{ setShowContact(true); setTimeout(()=>setRequested(true),800); }}>
            {requested?<><Check size={14}/> Tour Requested</>:<><Phone size={14}/> Request Tour</>}
          </button>
          <button className="sl-cta-secondary" style={{borderColor:`${p.color}30`,color:p.color}}>
            <Mail size={14}/> Email Agent
          </button>
        </div>

        {showContact&&!requested&&(
          <div className="sl-contact-form">
            <div className="sl-form-row">
              <input className="sl-input" placeholder="Your name"/>
              <input className="sl-input" placeholder="Phone number"/>
            </div>
            <textarea className="sl-input sl-textarea" placeholder="When would you like to tour?" rows={2}/>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Map View ─────────────────────────────────────────────────────────────────

const MapView = memo(function MapView({ properties, saved, onSave, onSelect }) {
  return (
    <div className="sl-map">
      <div className="sl-map-bg">
        <div className="sl-map-grid"/>
        {properties.map((p,i)=>(
          <button key={p.id} className="sl-map-pin"
            style={{ left:`${15+i*14}%`, top:`${20+((i*37)%50)}%`, background:p.color }}
            onClick={()=>onSelect(p)} aria-label={`View ${p.title}`}>
            ${p.price>=1000000?(p.price/1000000).toFixed(1)+"M":(p.price/1000).toFixed(0)+"k"}
          </button>
        ))}
        <div className="sl-map-label">Atlanta Metro Area</div>
      </div>
    </div>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class SolaraErrorBoundary extends Component {
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  render(){
    if(this.state.err)return<div style={{display:"flex",gap:10,padding:20,color:"#EF4444"}}><AlertCircle size={18}/><p>Error.</p></div>;
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles=()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .sl-root{font-family:'Inter',sans-serif;background:#FAFAF5;min-height:100vh;color:#1A1A2E;-webkit-font-smoothing:antialiased;}
    .sl-topbar{background:#fff;border-bottom:1px solid #F1EDE0;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
    .sl-brand{font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#1A1A2E;letter-spacing:-0.02em;}
    .sl-brand span{color:#F59E0B;}
    .sl-nav-links{display:flex;gap:24px;font-size:13px;color:#6B7280;}
    .sl-nav-cta{padding:8px 18px;border-radius:8px;background:#F59E0B;color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
    .sl-search-bar{display:flex;align-items:center;gap:0;background:#fff;border:1.5px solid #E8E0D0;border-radius:12px;overflow:hidden;margin:16px 24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
    .sl-search-input{flex:1;padding:14px 16px;border:none;outline:none;font-size:14px;color:#1A1A2E;font-family:'Inter',sans-serif;background:transparent;}
    .sl-search-input::placeholder{color:#9CA3AF;}
    .sl-search-btn{padding:0 20px;height:48px;background:#F59E0B;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;color:#fff;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;}
    .sl-filters{display:flex;gap:8px;padding:0 24px 16px;flex-wrap:wrap;align-items:center;}
    .sl-filter-btn{padding:7px 14px;border-radius:8px;border:1.5px solid #E8E0D0;background:#fff;font-size:12px;font-weight:500;color:#374151;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:'Inter',sans-serif;transition:all 0.13s;}
    .sl-filter-btn--on{border-color:#F59E0B;background:#FFFBEB;color:#D97706;}
    .sl-filter-btn:hover{border-color:#F59E0B;}
    .sl-results-bar{display:flex;justify-content:space-between;align-items:center;padding:0 24px 14px;font-size:13px;color:#6B7280;}
    .sl-view-btns{display:flex;gap:4px;}
    .sl-view-btn{padding:6px 12px;border-radius:7px;border:1px solid #E8E0D0;background:transparent;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:4px;}
    .sl-view-btn--on{background:#F59E0B;border-color:#F59E0B;color:#fff;}
    .sl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;padding:0 24px 40px;}
    .sl-card{background:#fff;border:1px solid #F1EDE0;border-radius:16px;overflow:hidden;cursor:pointer;transition:box-shadow 0.2s,transform 0.2s;}
    .sl-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.08);transform:translateY(-2px);}
    .sl-card-img{height:180px;display:flex;align-items:center;justify-content:center;position:relative;}
    .sl-card-img-inner{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .sl-featured-badge{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:6px;background:#F59E0B;color:#fff;font-size:10px;font-weight:700;letter-spacing:0.05em;}
    .sl-photo-count{position:absolute;bottom:10px;left:12px;display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.5);color:#fff;font-size:10px;font-weight:600;}
    .sl-save-btn{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.3);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.15s;}
    .sl-save-btn--on{background:rgba(255,255,255,0.9);}
    .sl-card-body{padding:14px;}
    .sl-card-type{font-size:10px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;}
    .sl-card-price{font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#1A1A2E;letter-spacing:-0.02em;margin-bottom:3px;}
    .sl-card-title{font-size:15px;font-weight:600;color:#1A1A2E;margin-bottom:4px;}
    .sl-card-address{font-size:11px;color:#9CA3AF;display:flex;align-items:center;gap:3px;margin-bottom:10px;}
    .sl-card-specs{display:flex;align-items:center;gap:6px;font-size:12px;color:#6B7280;margin-bottom:10px;}
    .sl-spec{display:flex;align-items:center;gap:3px;}
    .sl-spec-div{color:#E8E0D0;}
    .sl-card-tags{display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;}
    .sl-tag{padding:3px 8px;border-radius:5px;font-size:10px;font-weight:500;border:1px solid;}
    .sl-card-agent{display:flex;align-items:center;gap:7px;}
    .sl-agent-av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;}
    .sl-agent-name{font-size:11px;color:#6B7280;flex:1;}
    .sl-card-rating{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:600;color:#1A1A2E;}
    .sl-back-btn{display:flex;align-items:center;gap:5px;background:none;border:none;font-size:13px;color:#6B7280;cursor:pointer;padding:16px 24px;font-family:'Inter',sans-serif;}
    .sl-back-btn:hover{color:#1A1A2E;}
    .sl-detail{padding-bottom:40px;}
    .sl-detail-img{height:300px;display:flex;align-items:center;justify-content:center;position:relative;flex-direction:column;gap:16px;}
    .sl-detail-photo-strip{display:flex;gap:6px;position:absolute;bottom:12px;left:24px;}
    .sl-thumb{width:48px;height:36px;border-radius:6px;}
    .sl-thumb--more{background:#00000040;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:600;}
    .sl-detail-body{padding:20px 24px;}
    .sl-detail-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
    .sl-detail-type{font-size:11px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;}
    .sl-detail-price{font-family:'Fraunces',Georgia,serif;font-size:32px;font-weight:700;color:#1A1A2E;letter-spacing:-0.02em;margin-bottom:4px;}
    .sl-detail-title{font-size:18px;font-weight:700;color:#1A1A2E;margin-bottom:4px;}
    .sl-detail-address{font-size:12px;color:#9CA3AF;display:flex;align-items:center;gap:4px;}
    .sl-save-lg{background:none;border:1.5px solid #E8E0D0;border-radius:10px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
    .sl-save-lg--on{border-color:#FEE2E2;background:#FEF2F2;}
    .sl-detail-specs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}
    .sl-detail-spec{text-align:center;padding:12px 8px;background:#FAFAF5;border-radius:10px;border:1px solid #F1EDE0;}
    .sl-detail-spec-icon{display:flex;justify-content:center;margin-bottom:4px;}
    .sl-detail-spec-val{font-size:12px;font-weight:600;color:#1A1A2E;}
    .sl-detail-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
    .sl-detail-section-label{font-size:11px;color:#9CA3AF;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;}
    .sl-detail-desc{font-size:14px;color:#6B7280;line-height:1.75;margin-bottom:20px;}
    .sl-agent-card{display:flex;align-items:center;gap:14px;padding:14px;border-radius:12px;border:1px solid;margin-bottom:16px;}
    .sl-agent-av--lg{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;}
    .sl-agent-name-lg{font-size:14px;font-weight:600;color:#1A1A2E;margin-bottom:2px;}
    .sl-agent-title{font-size:11px;color:#9CA3AF;margin-bottom:3px;}
    .sl-agent-rating-row{display:flex;align-items:center;gap:4px;font-size:11px;color:#1A1A2E;font-weight:600;}
    .sl-cta-row{display:flex;gap:10px;margin-bottom:14px;}
    .sl-cta-primary{flex:1;padding:13px;border-radius:10px;border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:'Inter',sans-serif;transition:opacity 0.15s;}
    .sl-cta-primary:hover{opacity:0.88;}
    .sl-cta-secondary{flex:1;padding:13px;border-radius:10px;background:transparent;border:1.5px solid;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:'Inter',sans-serif;}
    .sl-contact-form{display:flex;flex-direction:column;gap:8px;padding:14px;background:#FAFAF5;border-radius:10px;border:1px solid #F1EDE0;}
    .sl-form-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .sl-input{padding:10px 12px;border-radius:8px;border:1.5px solid #E8E0D0;background:#fff;font-size:13px;color:#1A1A2E;outline:none;font-family:'Inter',sans-serif;}
    .sl-input:focus{border-color:#F59E0B;}
    .sl-textarea{resize:none;}
    .sl-map{padding:0 24px 40px;}
    .sl-map-bg{border-radius:16px;overflow:hidden;height:460px;position:relative;background:#E8F0E0;border:1px solid #D4E4C4;}
    .sl-map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px);background-size:60px 60px;}
    .sl-map-pin{position:absolute;padding:5px 10px;border-radius:20px;color:#fff;font-size:11px;font-weight:700;border:2px solid rgba(255,255,255,0.8);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-family:'Inter',sans-serif;transform:translate(-50%,-50%);transition:transform 0.15s;}
    .sl-map-pin:hover{transform:translate(-50%,-50%) scale(1.1);}
    .sl-map-label{position:absolute;bottom:16px;right:16px;font-size:11px;color:#6B7280;font-weight:600;background:#fff;padding:5px 10px;border-radius:6px;border:1px solid #F1EDE0;}
    .sl-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;text-align:center;color:#9CA3AF;}
    @media(max-width:600px){.sl-grid{grid-template-columns:1fr}.sl-detail-specs{grid-template-columns:1fr 1fr}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function SolaraCore() {
  const [filters, dispatch] = useReducer(filterReducer, filterInit);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("grid");
  const [saved, toggleSaved] = useSaved();
  const debouncedSearch = useDebounce(filters.search);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/properties`)
      .then(r => r.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(()=>{
    let list = [...properties];
    if(filters.type!=="All") list=list.filter(p=>p.type===filters.type);
    if(filters.priceRange==="Under $500k") list=list.filter(p=>p.price<500000);
    else if(filters.priceRange==="$500k–$1M") list=list.filter(p=>p.price>=500000&&p.price<1000000);
    else if(filters.priceRange==="$1M–$2M") list=list.filter(p=>p.price>=1000000&&p.price<2000000);
    else if(filters.priceRange==="$2M+") list=list.filter(p=>p.price>=2000000);
    if(filters.minBeds!=="Any") list=list.filter(p=>p.beds>=parseInt(filters.minBeds));
    if(debouncedSearch) list=list.filter(p=>p.title.toLowerCase().includes(debouncedSearch.toLowerCase())||p.city.toLowerCase().includes(debouncedSearch.toLowerCase()));
    if(filters.sortBy==="featured") list.sort((a,b)=>b.featured-a.featured);
    else if(filters.sortBy==="price-asc") list.sort((a,b)=>a.price-b.price);
    else if(filters.sortBy==="price-desc") list.sort((a,b)=>b.price-a.price);
    return list;
  },[properties, filters, debouncedSearch]);

  if (loading) return (
    <>
      <GlobalStyles/>
      <div style={{
        fontFamily:"'Inter',sans-serif",
        background:"#FAFAF5",
        minHeight:"100vh",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        flexDirection:"column",
        gap:16,
      }}>
        <div style={{
          fontFamily:"'Fraunces',Georgia,serif",
          fontSize:28,
          fontWeight:700,
          color:"#1A1A2E",
          letterSpacing:"-0.02em",
        }}>Sol<span style={{color:"#F59E0B"}}>ara</span></div>
        <div style={{
          width:40,
          height:40,
          borderRadius:"50%",
          border:"3px solid #F1EDE0",
          borderTop:"3px solid #F59E0B",
          animation:"slSpin 0.8s linear infinite",
        }}/>
        <div style={{fontSize:13,color:"#9CA3AF",fontWeight:500}}>
          Finding properties...
        </div>
        <style>{`@keyframes slSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  if(selected) return (
    <>
      <GlobalStyles/>
      <div className="sl-root">
        <div className="sl-topbar">
          <div className="sl-brand">Sol<span>ara</span></div>
          <div className="sl-nav-links"><span>Buy</span><span>Rent</span><span>Sell</span></div>
          <button className="sl-nav-cta">Sign In</button>
        </div>
        <PropertyDetail p={selected} saved={saved.has(selected.id)} onSave={toggleSaved} onBack={()=>setSelected(null)}/>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles/>
      <div className="sl-root">
        <div className="sl-topbar">
          <div className="sl-brand">Sol<span>ara</span></div>
          <div className="sl-nav-links"><span>Buy</span><span>Rent</span><span>Sell</span></div>
          <button className="sl-nav-cta">List Your Home</button>
        </div>

        <div className="sl-search-bar">
          <Search size={16} color="#9CA3AF" style={{marginLeft:16}}/>
          <input className="sl-search-input" placeholder="Search by city, neighborhood, or address..."
            value={filters.search} onChange={e=>dispatch({type:"SEARCH",v:e.target.value})} aria-label="Search properties"/>
          <button className="sl-search-btn"><Search size={14}/> Search</button>
        </div>

        <div className="sl-filters">
          {TYPES.map(t=>(
            <button key={t} className={`sl-filter-btn ${filters.type===t?"sl-filter-btn--on":""}`}
              onClick={()=>dispatch({type:"TYPE",v:t})}>{t}</button>
          ))}
          <div style={{width:1,height:20,background:"#E8E0D0",margin:"0 4px"}}/>
          {PRICE_RANGES.map(p=>(
            <button key={p} className={`sl-filter-btn ${filters.priceRange===p?"sl-filter-btn--on":""}`}
              onClick={()=>dispatch({type:"PRICE",v:p})}>{p}<ChevronDown size={11}/></button>
          ))}
          <div style={{width:1,height:20,background:"#E8E0D0",margin:"0 4px"}}/>
          {BEDS_OPTS.map(b=>(
            <button key={b} className={`sl-filter-btn ${filters.minBeds===b?"sl-filter-btn--on":""}`}
              onClick={()=>dispatch({type:"BEDS",v:b})}>{b==="Any"?"Any Beds":b+" Beds"}</button>
          ))}
          {(filters.type!=="All"||filters.priceRange!=="Any Price"||filters.minBeds!=="Any"||filters.search)&&(
            <button className="sl-filter-btn" onClick={()=>dispatch({type:"RESET"})} style={{color:"#EF4444",borderColor:"#FECACA"}}>
              <X size={11}/> Clear
            </button>
          )}
        </div>

        <div className="sl-results-bar">
          <span>{filtered.length} propert{filtered.length!==1?"ies":"y"} found</span>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <select style={{border:"1.5px solid #E8E0D0",borderRadius:7,padding:"5px 10px",fontSize:12,color:"#374151",background:"#fff",fontFamily:"'Inter',sans-serif"}}
              value={filters.sortBy} onChange={e=>dispatch({type:"SORT",v:e.target.value})}>
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <div className="sl-view-btns">
              <button className={`sl-view-btn ${view==="grid"?"sl-view-btn--on":""}`} onClick={()=>setView("grid")}>Grid</button>
              <button className={`sl-view-btn ${view==="map"?"sl-view-btn--on":""}`} onClick={()=>setView("map")}><Map size={12}/> Map</button>
            </div>
          </div>
        </div>

        {view==="map"?(
          <MapView properties={filtered} saved={saved} onSave={toggleSaved} onSelect={setSelected}/>
        ):filtered.length===0?(
          <div className="sl-empty">
            <Search size={32} style={{marginBottom:12}}/>
            <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>No properties found</div>
            <div style={{fontSize:13}}>Try adjusting your filters</div>
          </div>
        ):(
          <div className="sl-grid">
            {filtered.map(p=>(
              <PropertyCard key={p.id} p={p} saved={saved.has(p.id)} onSave={toggleSaved} onSelect={setSelected}/>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function Solara() {
  return <SolaraErrorBoundary><SolaraCore/></SolaraErrorBoundary>;
}
