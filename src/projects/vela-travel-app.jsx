/**
 * Vela — Travel Companion App (React Native style)
 * Mobile-first travel planner with itinerary, weather, and bookings
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · memo · ErrorBoundary
 * Patterns: React Native UI patterns · tab navigation · date planning
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, memo, Component,
} from "react";
import {
  MapPin, Calendar, Plane, Hotel, Sun, Cloud, Wind,
  Star, Clock, ChevronRight, Plus, Heart,
  Compass, Coffee, Camera, AlertCircle, Check,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const TRIPS = [
  { id:1, city:"Bali",     country:"Indonesia", dates:"Aug 12–22, 2026", days:10, img:"🌴", color:"#0EA5E9", status:"upcoming",  temp:29, weather:"Sunny" },
  { id:2, city:"Paris",    country:"France",    dates:"Oct 3–10, 2026",  days:7,  img:"🗼", color:"#8B5CF6", status:"planning",  temp:18, weather:"Cloudy" },
  { id:3, city:"Kyoto",    country:"Japan",     dates:"Mar 15–25, 2027", days:10, img:"⛩️", color:"#F59E0B", status:"planning",  temp:12, weather:"Partly Cloudy" },
];

const ITINERARY = [
  { day:1, date:"Aug 12", items:[
    { time:"2:00 PM", type:"flight",  title:"Flight DL 847 Departs",     location:"Hartsfield-Jackson ATL",  icon:Plane,   color:"#6366F1" },
    { time:"8:45 PM", type:"hotel",   title:"Check-in: Alaya Resort",     location:"Ubud, Bali",              icon:Hotel,   color:"#D4178A" },
  ]},
  { day:2, date:"Aug 13", items:[
    { time:"7:00 AM", type:"activity",title:"Sunrise at Campuhan Ridge",  location:"Ubud Ridge Walk",         icon:Compass, color:"#10B981" },
    { time:"10:00 AM",type:"activity",title:"Tegallalang Rice Terraces",  location:"Ceking, Tegallalang",     icon:Camera,  color:"#F59E0B" },
    { time:"1:00 PM", type:"dining",  title:"Lunch at Locavore",          location:"Jl. Dewi Sita, Ubud",    icon:Coffee,  color:"#EF4444" },
    { time:"4:00 PM", type:"activity",title:"Sacred Monkey Forest",       location:"Monkey Forest Road",      icon:Compass, color:"#10B981" },
  ]},
  { day:3, date:"Aug 14", items:[
    { time:"9:00 AM", type:"activity",title:"Tanah Lot Temple",           location:"Beraban, Tabanan",        icon:Camera,  color:"#F59E0B" },
    { time:"3:00 PM", type:"activity",title:"Seminyak Beach Sunset",      location:"Seminyak Beach",          icon:Sun,     color:"#F59E0B" },
    { time:"7:00 PM", type:"dining",  title:"Dinner: Sarong Restaurant",  location:"Seminyak",                icon:Coffee,  color:"#EF4444" },
  ]},
];

const TABS = ["Overview","Itinerary","Bookings","Explore"];

// ─── Error Boundary ───────────────────────────────────────────────────────────

class VelaErrorBoundary extends Component {
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  render(){
    if(this.state.err)return<div style={{display:"flex",gap:10,padding:20,color:"#EF4444"}}><AlertCircle size={18}/><p>Error.</p></div>;
    return this.props.children;
  }
}

// ─── Phone Frame ─────────────────────────────────────────────────────────────

const PhoneFrame = memo(function PhoneFrame({ children }) {
  return (
    <div className="vl-phone">
      <div className="vl-notch" aria-hidden="true"/>
      <div className="vl-screen">{children}</div>
    </div>
  );
});

// ─── Screens ─────────────────────────────────────────────────────────────────

const OverviewScreen = memo(function OverviewScreen({ trip, onTabChange }) {
  return (
    <div className="vl-content">
      {/* Hero */}
      <div className="vl-hero" style={{background:`linear-gradient(160deg,${trip.color}40,${trip.color}15)`}}>
        <div className="vl-hero-emoji">{trip.img}</div>
        <div className="vl-hero-city">{trip.city}</div>
        <div className="vl-hero-country">{trip.country}</div>
        <div className="vl-hero-dates"><Calendar size={11}/>{trip.dates}</div>
        <div className="vl-weather">
          <Sun size={13} color="#F59E0B"/>
          <span>{trip.temp}°C · {trip.weather}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="vl-stats">
        {[{v:trip.days,l:"Days"},{v:"3",l:"Activities"},{v:"1",l:"Hotel"},{v:"2",l:"Flights"}].map(s=>(
          <div key={s.l} className="vl-stat">
            <div className="vl-stat-v" style={{color:trip.color}}>{s.v}</div>
            <div className="vl-stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="vl-section-title">Quick Actions</div>
      <div className="vl-actions">
        {[
          {label:"View Itinerary",Icon:Calendar,tab:1,color:trip.color},
          {label:"Bookings",Icon:Hotel,tab:2,color:"#10B981"},
          {label:"Explore",Icon:Compass,tab:3,color:"#F59E0B"},
        ].map(a=>(
          <button key={a.label} className="vl-action-btn" onClick={()=>onTabChange(a.tab)}
            style={{borderColor:`${a.color}30`,background:`${a.color}08`}}>
            <div className="vl-action-icon" style={{background:`${a.color}18`,color:a.color}}>
              <a.Icon size={14}/>
            </div>
            <span className="vl-action-label">{a.label}</span>
            <ChevronRight size={12} color="#94A3B8"/>
          </button>
        ))}
      </div>

      {/* Countdown */}
      <div className="vl-countdown" style={{borderColor:`${trip.color}25`,background:`${trip.color}08`}}>
        <div className="vl-countdown-num" style={{color:trip.color}}>32</div>
        <div className="vl-countdown-label">days until departure</div>
      </div>
    </div>
  );
});

const ItineraryScreen = memo(function ItineraryScreen({ trip }) {
  const [activeDay, setActiveDay] = useState(0);
  const day = ITINERARY[activeDay];

  return (
    <div className="vl-content">
      <div className="vl-screen-title">Itinerary</div>

      {/* Day selector */}
      <div className="vl-day-tabs">
        {ITINERARY.map((d,i)=>(
          <button key={i} className={`vl-day-tab ${activeDay===i?"vl-day-tab--on":""}`}
            style={activeDay===i?{background:trip.color,borderColor:trip.color}:{}}
            onClick={()=>setActiveDay(i)}>
            <div className="vl-day-num">Day {d.day}</div>
            <div className="vl-day-date">{d.date}</div>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="vl-timeline">
        {day.items.map((item,i)=>(
          <div key={i} className="vl-timeline-item">
            <div className="vl-timeline-left">
              <div className="vl-timeline-icon" style={{background:`${item.color}18`,color:item.color}}>
                <item.icon size={13}/>
              </div>
              {i<day.items.length-1&&<div className="vl-timeline-line"/>}
            </div>
            <div className="vl-timeline-card">
              <div className="vl-timeline-time"><Clock size={9}/>{item.time}</div>
              <div className="vl-timeline-title">{item.title}</div>
              <div className="vl-timeline-loc"><MapPin size={9}/>{item.location}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const BookingsScreen = memo(function BookingsScreen({ trip }) {
  const bookings = useMemo(()=>[
    { type:"Flight",   icon:Plane,  title:"Delta DL 847",                detail:"ATL → DPS · Economy+",     status:"confirmed", price:"$842",  color:"#6366F1" },
    { type:"Hotel",    icon:Hotel,  title:"Alaya Resort Ubud",           detail:"Aug 12–22 · 10 nights",    status:"confirmed", price:"$2,200",color:"#D4178A" },
    { type:"Activity", icon:Camera, title:"Mount Batur Sunrise Trek",    detail:"Aug 15 · 3:00 AM pickup",  status:"pending",   price:"$85",   color:"#F59E0B" },
    { type:"Transfer", icon:Plane,  title:"Airport Transfer",            detail:"DPS → Ubud · Private Car", status:"confirmed", price:"$35",   color:"#10B981" },
  ],[]);

  return (
    <div className="vl-content">
      <div className="vl-screen-title">Bookings</div>
      <div className="vl-total-card" style={{background:`linear-gradient(135deg,${trip.color}20,${trip.color}08)`,borderColor:`${trip.color}25`}}>
        <div className="vl-total-label">Total Trip Cost</div>
        <div className="vl-total-val" style={{color:trip.color}}>$3,162</div>
        <div className="vl-total-sub">4 bookings · all currencies in USD</div>
      </div>
      <div className="vl-bookings">
        {bookings.map((b,i)=>(
          <div key={i} className="vl-booking">
            <div className="vl-booking-icon" style={{background:`${b.color}18`,color:b.color}}>
              <b.icon size={14}/>
            </div>
            <div className="vl-booking-info">
              <div className="vl-booking-type">{b.type}</div>
              <div className="vl-booking-title">{b.title}</div>
              <div className="vl-booking-detail">{b.detail}</div>
            </div>
            <div className="vl-booking-right">
              <div className="vl-booking-price">{b.price}</div>
              <div className={`vl-booking-status ${b.status==="confirmed"?"vl-status--ok":"vl-status--pend"}`}>
                {b.status==="confirmed"?<Check size={9}/>:<Clock size={9}/>}
                {b.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const ExploreScreen = memo(function ExploreScreen({ trip }) {
  const places = useMemo(()=>[
    { name:"Tegallalang",  cat:"Nature",     rating:4.8, reviews:12400, saved:true  },
    { name:"Tanah Lot",    cat:"Temple",     rating:4.9, reviews:28100, saved:false },
    { name:"Monkey Forest",cat:"Wildlife",   rating:4.6, reviews:8900,  saved:true  },
    { name:"Seminyak",     cat:"Beach",      rating:4.7, reviews:15200, saved:false },
    { name:"Locavore",     cat:"Restaurant", rating:4.9, reviews:3200,  saved:false },
    { name:"Alila Villas", cat:"Resort",     rating:5.0, reviews:1800,  saved:true  },
  ],[]);

  const [saved, setSaved] = useState(new Set(places.filter(p=>p.saved).map(p=>p.name)));

  return (
    <div className="vl-content">
      <div className="vl-screen-title">Explore {trip.city}</div>
      <div className="vl-explore-grid">
        {places.map((p,i)=>(
          <div key={i} className="vl-explore-card">
            <div className="vl-explore-img" style={{background:`${trip.color}15`,color:trip.color}}>
              <Compass size={20}/>
            </div>
            <div className="vl-explore-info">
              <div className="vl-explore-name">{p.name}</div>
              <div className="vl-explore-cat">{p.cat}</div>
              <div className="vl-explore-rating">
                <Star size={9} fill="#F59E0B" color="#F59E0B"/>
                <span>{p.rating}</span>
                <span className="vl-explore-reviews">({(p.reviews/1000).toFixed(1)}k)</span>
              </div>
            </div>
            <button className="vl-save-btn" onClick={()=>setSaved(s=>{const n=new Set(s);n.has(p.name)?n.delete(p.name):n.add(p.name);return n;})} aria-label="Save place">
              <Heart size={13} fill={saved.has(p.name)?"#D4178A":"none"} color={saved.has(p.name)?"#D4178A":"#94A3B8"}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles=()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .vl-root{font-family:'Plus Jakarta Sans',sans-serif;background:#080B14;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 24px;-webkit-font-smoothing:antialiased;}
    .vl-app{display:flex;gap:32px;align-items:flex-start;max-width:900px;width:100%;}
    .vl-sidebar{flex:1;min-width:200px;}
    .vl-sidebar-title{font-size:22px;font-weight:800;color:#F0F6FF;letter-spacing:-0.02em;margin-bottom:6px;}
    .vl-sidebar-sub{font-size:13px;color:#4B5E7A;margin-bottom:20px;}
    .vl-trips{display:flex;flex-direction:column;gap:10px;}
    .vl-trip-card{padding:14px;border-radius:14px;border:1px solid #142030;background:#0D1420;cursor:pointer;transition:all 0.15s;text-align:left;width:100%;font-family:'Plus Jakarta Sans',sans-serif;}
    .vl-trip-card--on{border-color:rgba(14,165,233,0.35);background:rgba(14,165,233,0.06);}
    .vl-trip-row{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
    .vl-trip-emoji{font-size:18px;}
    .vl-trip-city{font-size:14px;font-weight:700;color:#F0F6FF;}
    .vl-trip-country{font-size:11px;color:#4B5E7A;}
    .vl-trip-dates{font-size:10px;color:#4B5E7A;font-family:'JetBrains Mono',monospace;}
    .vl-trip-badge{display:inline-block;font-size:9px;padding:2px 7px;border-radius:5px;font-weight:700;margin-top:5px;}
    .vl-badge-upcoming{background:rgba(16,185,129,0.1);color:#10B981;border:1px solid rgba(16,185,129,0.2);}
    .vl-badge-planning{background:rgba(99,102,241,0.1);color:#818CF8;border:1px solid rgba(99,102,241,0.2);}
    .vl-phone{width:280px;flex-shrink:0;background:#1A1A2E;border-radius:40px;padding:12px;box-shadow:0 32px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06) inset;position:relative;}
    .vl-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:80px;height:24px;background:#1A1A2E;border-radius:0 0 14px 14px;z-index:10;}
    .vl-screen{border-radius:30px;overflow:hidden;background:#F8FAFF;height:580px;display:flex;flex-direction:column;}
    .vl-status-bar{display:flex;justify-content:space-between;padding:10px 16px 4px;background:#F8FAFF;font-size:10px;font-weight:600;color:#0F172A;position:relative;z-index:2;flex-shrink:0;}
    .vl-tabs{display:flex;background:#fff;border-bottom:1px solid #F1F5F9;flex-shrink:0;}
    .vl-tab{flex:1;padding:10px 4px;font-size:10px;font-weight:600;color:#94A3B8;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.14s;font-family:'Plus Jakarta Sans',sans-serif;}
    .vl-tab--on{color:#0F172A;border-bottom-color:#0EA5E9;}
    .vl-content{flex:1;overflow-y:auto;scrollbar-width:none;}
    .vl-content::-webkit-scrollbar{display:none;}
    .vl-hero{padding:20px 16px;text-align:center;border-bottom:1px solid #F1F5F9;}
    .vl-hero-emoji{font-size:36px;margin-bottom:8px;}
    .vl-hero-city{font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#0F172A;letter-spacing:-0.02em;}
    .vl-hero-country{font-size:12px;color:#64748B;margin-bottom:6px;}
    .vl-hero-dates{display:flex;align-items:center;gap:4px;justify-content:center;font-size:11px;color:#64748B;margin-bottom:8px;}
    .vl-weather{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#64748B;padding:4px 10px;border-radius:20px;background:#F8FAFC;border:1px solid #F1F5F9;}
    .vl-stats{display:flex;border-bottom:1px solid #F1F5F9;}
    .vl-stat{flex:1;padding:12px 8px;text-align:center;border-right:1px solid #F1F5F9;}
    .vl-stat:last-child{border-right:none;}
    .vl-stat-v{font-size:18px;font-weight:800;letter-spacing:-0.02em;}
    .vl-stat-l{font-size:9px;color:#94A3B8;margin-top:1px;}
    .vl-section-title{font-size:11px;font-weight:700;color:#0F172A;padding:14px 16px 8px;letter-spacing:0.02em;}
    .vl-actions{padding:0 12px;display:flex;flex-direction:column;gap:6px;}
    .vl-action-btn{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;width:100%;}
    .vl-action-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vl-action-label{flex:1;font-size:12px;font-weight:600;color:#0F172A;text-align:left;}
    .vl-countdown{margin:14px 16px;border-radius:12px;border:1px solid;padding:12px;text-align:center;}
    .vl-countdown-num{font-size:32px;font-weight:800;letter-spacing:-0.02em;}
    .vl-countdown-label{font-size:11px;color:#64748B;margin-top:2px;}
    .vl-screen-title{font-size:16px;font-weight:800;color:#0F172A;padding:14px 16px 10px;letter-spacing:-0.01em;}
    .vl-day-tabs{display:flex;gap:8px;padding:0 16px 12px;overflow-x:auto;scrollbar-width:none;}
    .vl-day-tab{padding:7px 12px;border-radius:10px;border:1px solid #E2E8F0;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.14s;}
    .vl-day-tab--on{color:#fff;}
    .vl-day-num{font-size:11px;font-weight:700;}
    .vl-day-date{font-size:9px;opacity:0.8;}
    .vl-timeline{padding:0 16px;display:flex;flex-direction:column;}
    .vl-timeline-item{display:flex;gap:10px;}
    .vl-timeline-left{display:flex;flex-direction:column;align-items:center;gap:0;}
    .vl-timeline-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vl-timeline-line{width:1px;flex:1;background:#F1F5F9;min-height:12px;}
    .vl-timeline-card{flex:1;padding-bottom:14px;}
    .vl-timeline-time{display:flex;align-items:center;gap:3px;font-size:9px;color:#94A3B8;font-family:'JetBrains Mono',monospace;margin-bottom:3px;margin-top:5px;}
    .vl-timeline-title{font-size:12px;font-weight:600;color:#0F172A;margin-bottom:2px;}
    .vl-timeline-loc{display:flex;align-items:center;gap:3px;font-size:10px;color:#94A3B8;}
    .vl-total-card{padding:14px;border-radius:12px;border:1px solid;margin:0 16px 14px;text-align:center;}
    .vl-total-label{font-size:10px;color:#64748B;margin-bottom:4px;}
    .vl-total-val{font-size:28px;font-weight:800;letter-spacing:-0.02em;}
    .vl-total-sub{font-size:10px;color:#94A3B8;margin-top:3px;}
    .vl-bookings{padding:0 16px;display:flex;flex-direction:column;gap:8px;}
    .vl-booking{display:flex;gap:10px;align-items:center;padding:12px;border-radius:12px;background:#F8FAFC;border:1px solid #F1F5F9;}
    .vl-booking-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vl-booking-info{flex:1;min-width:0;}
    .vl-booking-type{font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;}
    .vl-booking-title{font-size:12px;font-weight:600;color:#0F172A;}
    .vl-booking-detail{font-size:10px;color:#94A3B8;}
    .vl-booking-right{text-align:right;flex-shrink:0;}
    .vl-booking-price{font-size:13px;font-weight:700;color:#0F172A;margin-bottom:3px;}
    .vl-booking-status{display:flex;align-items:center;gap:3px;font-size:9px;font-weight:600;justify-content:flex-end;}
    .vl-status--ok{color:#10B981;}
    .vl-status--pend{color:#F59E0B;}
    .vl-explore-grid{padding:0 16px;display:flex;flex-direction:column;gap:8px;}
    .vl-explore-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#F8FAFC;border:1px solid #F1F5F9;}
    .vl-explore-img{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vl-explore-info{flex:1;}
    .vl-explore-name{font-size:12px;font-weight:600;color:#0F172A;}
    .vl-explore-cat{font-size:10px;color:#94A3B8;margin-bottom:3px;}
    .vl-explore-rating{display:flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:#0F172A;}
    .vl-explore-reviews{color:#94A3B8;font-weight:400;}
    .vl-save-btn{background:none;border:none;cursor:pointer;padding:4px;}
    @media(max-width:640px){.vl-app{flex-direction:column;align-items:center}.vl-sidebar{width:100%;max-width:280px}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function VelaCore() {
  const [activeTrip, setActiveTrip] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const trip = TRIPS[activeTrip];

  useEffect(()=>{ setActiveTab(0); },[activeTrip]);

  return (
    <>
      <GlobalStyles/>
      <div className="vl-root">
        <div className="vl-app">
          {/* Sidebar */}
          <div className="vl-sidebar">
            <div className="vl-sidebar-title">My Trips</div>
            <div className="vl-sidebar-sub">3 upcoming adventures</div>
            <div className="vl-trips">
              {TRIPS.map((t,i)=>(
                <button key={t.id} className={`vl-trip-card ${activeTrip===i?"vl-trip-card--on":""}`}
                  style={activeTrip===i?{borderColor:`${t.color}35`,background:`${t.color}08`}:{}}
                  onClick={()=>setActiveTrip(i)}>
                  <div className="vl-trip-row">
                    <span className="vl-trip-emoji">{t.img}</span>
                    <div>
                      <div className="vl-trip-city" style={activeTrip===i?{color:t.color}:{}}>{t.city}</div>
                      <div className="vl-trip-country">{t.country}</div>
                    </div>
                  </div>
                  <div className="vl-trip-dates">{t.dates}</div>
                  <div className={`vl-trip-badge ${t.status==="upcoming"?"vl-badge-upcoming":"vl-badge-planning"}`}>
                    {t.status}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <PhoneFrame>
            {/* Status bar */}
            <div className="vl-status-bar">
              <span>9:41</span>
              <span>◼◼◼◼ ◼◼ ▮</span>
            </div>

            {/* Tabs */}
            <div className="vl-tabs" role="tablist">
              {TABS.map((t,i)=>(
                <button key={t} className={`vl-tab ${activeTab===i?"vl-tab--on":""}`}
                  role="tab" aria-selected={activeTab===i}
                  onClick={()=>setActiveTab(i)}>{t}</button>
              ))}
            </div>

            {/* Screen content */}
            {activeTab===0&&<OverviewScreen trip={trip} onTabChange={setActiveTab}/>}
            {activeTab===1&&<ItineraryScreen trip={trip}/>}
            {activeTab===2&&<BookingsScreen trip={trip}/>}
            {activeTab===3&&<ExploreScreen trip={trip}/>}
          </PhoneFrame>
        </div>
      </div>
    </>
  );
}

export default function Vela() {
  return <VelaErrorBoundary><VelaCore/></VelaErrorBoundary>;
}
