/**
 * Beacon — Restaurant Order Management System
 * Real-time order queue, table management, menu, and kitchen display
 *
 * Hooks: useState · useEffect · useCallback · useMemo · useReducer · memo
 * Patterns: real-time simulation · kanban order states · table grid · timer
 */

import {
  useState, useEffect, useCallback, useMemo, useReducer, memo, Component, useRef,
} from "react";
import {
  Clock, CheckCircle, AlertCircle, ChevronRight, Plus, Minus,
  Flame, Coffee, UtensilsCrossed, Bell, Users, TrendingUp,
  Star, X, Check, Package,
} from "lucide-react";

// ─── API ─────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://beacon-api-r5eo.onrender.com';

const ORDER_STATUSES = ["pending","cooking","ready","delivered"];

const TABS = ["Orders","Tables","Menu","Analytics"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useOrderTimer(orders, setOrders) {
  const ref = useRef(null);
  useEffect(()=>{
    ref.current = setInterval(()=>{
      setOrders(prev=>prev.map(o=>o.status!=="delivered"?{...o,time:o.time+1}:o));
    },60000);
    return ()=>clearInterval(ref.current);
  },[setOrders]);
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

class BeaconErrorBoundary extends Component {
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  render(){if(this.state.err)return<div style={{padding:20,color:"#EF4444"}}>Error.</div>;return this.props.children;}
}

// ─── Order Card ──────────────────────────────────────────────────────────────

const OrderCard = memo(function OrderCard({ order, onAdvance, onDeliver }) {
  const urgent = order.time > 30 && order.status !== "delivered";
  const statusColors = { pending:"#F97316", cooking:"#EAB308", ready:"#10B981", delivered:"#94A3B8" };
  const statusColor = statusColors[order.status];

  return (
    <div className={`bc-order-card ${urgent?"bc-order-card--urgent":""}`}
      style={{borderColor:urgent?"#F97316":`${statusColor}25`,borderTopColor:statusColor}}>
      <div className="bc-order-header">
        <div>
          <div className="bc-order-id">{order.id}</div>
          <div className="bc-order-table">Table {order.table} · {order.server}</div>
        </div>
        <div className="bc-order-time" style={{color:urgent?"#F97316":"#64748B"}}>
          <Clock size={11}/> {order.time}m
          {urgent&&<span className="bc-urgent-badge">!</span>}
        </div>
      </div>
      <div className="bc-order-items">
        {order.items.map((item,i)=>(
          <div key={i} className="bc-order-item">
            <span className="bc-item-qty">×{item.qty}</span>
            <span className="bc-item-name">{item.name}</span>
          </div>
        ))}
      </div>
      <div className="bc-order-footer">
        <div className="bc-order-total">${order.total}</div>
        {order.status!=="delivered"&&(
          <button className="bc-advance-btn" style={{background:statusColor}}
            onClick={()=>order.status==="ready"?onDeliver(order.id):onAdvance(order.id)}>
            {order.status==="pending"&&<><Flame size={12}/> Start Cooking</>}
            {order.status==="cooking"&&<><Bell size={12}/> Mark Ready</>}
            {order.status==="ready"&&<><Check size={12}/> Delivered</>}
          </button>
        )}
        {order.status==="delivered"&&<div className="bc-delivered-label"><CheckCircle size={12}/> Delivered</div>}
      </div>
    </div>
  );
});

// ─── Orders Tab ──────────────────────────────────────────────────────────────

const OrdersTab = memo(function OrdersTab({ orders, setOrders }) {
  const advance = useCallback(async (id)=>{
    const order = orders.find(o=>o.id===id);
    const next = ORDER_STATUSES[Math.min(ORDER_STATUSES.indexOf(order.status)+1, ORDER_STATUSES.length-1)];

    await fetch(`${BASE_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });

    setOrders(prev=>prev.map(o=>o.id===id?{...o,status:next}:o));
  },[orders, setOrders]);

  const deliver = useCallback(async (id)=>{
    await fetch(`${BASE_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    });

    setOrders(prev=>prev.map(o=>o.id===id?{...o,status:"delivered"}:o));
  },[setOrders]);

  const lanes = useMemo(()=>({
    pending:  orders.filter(o=>o.status==="pending"),
    cooking:  orders.filter(o=>o.status==="cooking"),
    ready:    orders.filter(o=>o.status==="ready"),
    delivered:orders.filter(o=>o.status==="delivered"),
  }),[orders]);

  const laneConfig = [
    {key:"pending",  label:"Pending",  color:"#F97316",emoji:"📋"},
    {key:"cooking",  label:"Cooking",  color:"#EAB308",emoji:"🔥"},
    {key:"ready",    label:"Ready",    color:"#10B981",emoji:"🔔"},
    {key:"delivered",label:"Delivered",color:"#94A3B8",emoji:"✅"},
  ];

  return (
    <div className="bc-orders-board">
      {laneConfig.map(lane=>(
        <div key={lane.key} className="bc-lane">
          <div className="bc-lane-header">
            <span>{lane.emoji}</span>
            <span className="bc-lane-title">{lane.label}</span>
            <span className="bc-lane-count" style={{background:`${lane.color}20`,color:lane.color}}>
              {lanes[lane.key].length}
            </span>
          </div>
          <div className="bc-lane-cards">
            {lanes[lane.key].map(order=>(
              <OrderCard key={order.id} order={order} onAdvance={advance} onDeliver={deliver}/>
            ))}
            {lanes[lane.key].length===0&&(
              <div className="bc-lane-empty">No orders</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

// ─── Tables Tab ───────────────────────────────────────────────────────────────

const TablesTab = memo(function TablesTab({ tables }) {
  const statusConfig = {
    available: {color:"#10B981",bg:"#F0FDF4",label:"Available"},
    occupied:  {color:"#F97316",bg:"#FFF7ED",label:"Occupied"},
    reserved:  {color:"#6366F1",bg:"#EEF2FF",label:"Reserved"},
    cleaning:  {color:"#F59E0B",bg:"#FFFBEB",label:"Cleaning"},
  };

  const summary = useMemo(()=>({
    available:tables.filter(t=>t.status==="available").length,
    occupied: tables.filter(t=>t.status==="occupied").length,
    reserved: tables.filter(t=>t.status==="reserved").length,
    guests:   tables.filter(t=>t.guests).reduce((s,t)=>s+(t.guests||0),0),
  }),[tables]);

  return (
    <div className="bc-tables-tab">
      <div className="bc-table-stats">
        {[
          {label:"Available",value:summary.available,color:"#10B981"},
          {label:"Occupied", value:summary.occupied, color:"#F97316"},
          {label:"Reserved", value:summary.reserved, color:"#6366F1"},
          {label:"Guests",   value:summary.guests,   color:"#0EA5E9"},
        ].map(s=>(
          <div key={s.label} className="bc-table-stat">
            <div className="bc-table-stat-num" style={{color:s.color}}>{s.value}</div>
            <div className="bc-table-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bc-tables-grid">
        {tables.map(t=>{
          const cfg = statusConfig[t.status];
          return(
            <div key={t.id} className="bc-table-cell" style={{background:cfg.bg,borderColor:`${cfg.color}30`}}>
              <div className="bc-table-num" style={{color:cfg.color}}>T{t.id}</div>
              <div className="bc-table-seats"><Users size={10}/>{t.seats} seats</div>
              <div className="bc-table-status-badge" style={{color:cfg.color,background:`${cfg.color}15`}}>
                {cfg.label}
              </div>
              {t.guests&&<div className="bc-table-guests">{t.guests} guests · {t.server}</div>}
              {t.elapsed&&<div className="bc-table-elapsed" style={{color:t.elapsed>50?"#EF4444":"#94A3B8"}}><Clock size={9}/>{t.elapsed}m</div>}
              {t.time&&<div className="bc-table-res">{t.time} · {t.name}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Menu Tab ─────────────────────────────────────────────────────────────────

const MenuTab = memo(function MenuTab({ menuItems }) {
  const [activeCat, setActiveCat] = useState("All");
  const cats = useMemo(()=>["All",...new Set(menuItems.map(m=>m.cat))],[menuItems]);
  const filtered = useMemo(()=>activeCat==="All"?menuItems:menuItems.filter(m=>m.cat===activeCat),[activeCat, menuItems]);

  return (
    <div className="bc-menu-tab">
      <div className="bc-menu-cats">
        {cats.map(c=>(
          <button key={c} className={`bc-cat-btn ${activeCat===c?"bc-cat-btn--on":""}`}
            onClick={()=>setActiveCat(c)}>{c}</button>
        ))}
      </div>
      <div className="bc-menu-grid">
        {filtered.map(item=>(
          <div key={item.id} className="bc-menu-item">
            <div className="bc-menu-emoji">{item.emoji}</div>
            <div className="bc-menu-info">
              <div className="bc-menu-name">{item.name}
                {item.popular&&<span className="bc-popular-badge">Popular</span>}
              </div>
              <div className="bc-menu-meta"><Clock size={9}/>{item.prep}m · {item.cat}</div>
            </div>
            <div className="bc-menu-price">${item.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Analytics Tab ────────────────────────────────────────────────────────────

const AnalyticsTab = memo(function AnalyticsTab({ orders, tables, menuItems }) {
  const stats = useMemo(()=>({
    revenue: orders.reduce((s,o)=>s+o.total,0),
    orders:  orders.length,
    avgTime: Math.round(orders.reduce((s,o)=>s+o.time,0)/orders.length),
    occupied:tables.filter(t=>t.status==="occupied").length,
  }),[orders, tables]);

  return (
    <div className="bc-analytics-tab">
      <div className="bc-analytics-stats">
        {[
          {label:"Today's Revenue",  value:`$${(stats.revenue*8.4).toFixed(0)}`,    color:"#10B981",Icon:TrendingUp},
          {label:"Orders Today",     value:`${stats.orders*14}`,                    color:"#F97316",Icon:UtensilsCrossed},
          {label:"Avg Ticket",       value:`$${(stats.revenue*8.4/stats.orders/14).toFixed(0)}`,color:"#6366F1",Icon:Coffee},
          {label:"Tables Occupied",  value:`${stats.occupied}/${tables.length}`,   color:"#0EA5E9",Icon:Users},
        ].map(s=>(
          <div key={s.label} className="bc-analytics-stat">
            <div className="bc-stat-icon" style={{background:`${s.color}15`}}><s.Icon size={14} color={s.color}/></div>
            <div className="bc-stat-val" style={{color:s.color}}>{s.value}</div>
            <div className="bc-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bc-top-items">
        <div className="bc-section-label">Top Sellers Today</div>
        {menuItems.filter(m=>m.popular).map((item,i)=>(
          <div key={item.id} className="bc-top-item">
            <div className="bc-top-rank">#{i+1}</div>
            <div className="bc-top-emoji">{item.emoji}</div>
            <div className="bc-top-name">{item.name}</div>
            <div className="bc-top-count">{[34,28,22,18][i]} orders</div>
            <div className="bc-top-rev">${([34,28,22,18][i]*item.price).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles=()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .bc-root{font-family:'Inter',sans-serif;background:#FFF8F0;min-height:100vh;color:#1A1207;-webkit-font-smoothing:antialiased;}
    .bc-topbar{background:#fff;border-bottom:1px solid #FDE8D0;padding:0 20px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
    .bc-brand{font-size:20px;font-weight:800;color:#1A1207;letter-spacing:-0.02em;}
    .bc-brand span{color:#F97316;}
    .bc-live{display:flex;align-items:center;gap:6px;font-size:11px;color:#10B981;font-family:'JetBrains Mono',monospace;}
    .bc-live-dot{width:6px;height:6px;border-radius:50%;background:#10B981;animation:bcPulse 1.5s ease-in-out infinite;}
    @keyframes bcPulse{0%,100%{opacity:1}50%{opacity:0.3}}
    .bc-topbar-right{display:flex;align-items:center;gap:10px;}
    .bc-stat-pill{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid;}
    .bc-tabs{display:flex;background:#fff;border-bottom:1px solid #FDE8D0;padding:0 20px;}
    .bc-tab{padding:12px 16px;font-size:13px;font-weight:500;color:#9CA3AF;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;font-family:'Inter',sans-serif;}
    .bc-tab--on{color:#F97316;border-bottom-color:#F97316;font-weight:600;}
    .bc-orders-board{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:16px;}
    .bc-lane{background:#fff;border-radius:14px;border:1px solid #FDE8D0;overflow:hidden;}
    .bc-lane-header{display:flex;align-items:center;gap:7px;padding:12px 14px;border-bottom:1px solid #FDE8D0;background:#FFF8F0;}
    .bc-lane-title{font-size:13px;font-weight:700;color:#1A1207;flex:1;}
    .bc-lane-count{font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;}
    .bc-lane-cards{padding:10px;display:flex;flex-direction:column;gap:8px;min-height:200px;}
    .bc-lane-empty{text-align:center;padding:24px;font-size:12px;color:#CBD5E1;}
    .bc-order-card{border-radius:10px;border:1px solid;border-top:3px solid;padding:12px;background:#fff;transition:box-shadow 0.2s;}
    .bc-order-card--urgent{animation:urgentPulse 2s ease-in-out infinite;}
    @keyframes urgentPulse{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 2px rgba(249,115,22,0.2)}}
    .bc-order-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
    .bc-order-id{font-size:12px;font-weight:700;color:#1A1207;font-family:'JetBrains Mono',monospace;}
    .bc-order-table{font-size:10px;color:#9CA3AF;margin-top:1px;}
    .bc-order-time{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace;}
    .bc-urgent-badge{background:#F97316;color:#fff;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;margin-left:3px;}
    .bc-order-items{display:flex;flex-direction:column;gap:3px;margin-bottom:10px;}
    .bc-order-item{display:flex;align-items:center;gap:5px;font-size:11px;}
    .bc-item-qty{font-weight:700;color:#F97316;font-family:'JetBrains Mono',monospace;width:20px;}
    .bc-item-name{color:#374151;}
    .bc-order-footer{display:flex;align-items:center;justify-content:space-between;}
    .bc-order-total{font-size:14px;font-weight:700;color:#1A1207;}
    .bc-advance-btn{display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:7px;border:none;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
    .bc-delivered-label{display:flex;align-items:center;gap:4px;font-size:11px;color:#10B981;font-weight:600;}
    .bc-tables-tab{padding:16px;}
    .bc-table-stats{display:flex;gap:12px;margin-bottom:16px;}
    .bc-table-stat{flex:1;background:#fff;border-radius:12px;padding:14px;text-align:center;border:1px solid #FDE8D0;}
    .bc-table-stat-num{font-size:28px;font-weight:800;letter-spacing:-0.02em;}
    .bc-table-stat-lbl{font-size:11px;color:#9CA3AF;}
    .bc-tables-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;}
    .bc-table-cell{border-radius:12px;padding:14px;border:1px solid;display:flex;flex-direction:column;gap:4px;}
    .bc-table-num{font-size:16px;font-weight:800;letter-spacing:-0.01em;}
    .bc-table-seats{font-size:10px;color:#9CA3AF;display:flex;align-items:center;gap:3px;}
    .bc-table-status-badge{font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;width:fit-content;}
    .bc-table-guests{font-size:10px;color:#6B7280;}
    .bc-table-elapsed{font-size:10px;display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;}
    .bc-table-res{font-size:10px;color:#6B7280;}
    .bc-menu-tab{padding:16px;}
    .bc-menu-cats{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
    .bc-cat-btn{padding:7px 14px;border-radius:8px;border:1.5px solid #FDE8D0;background:#fff;font-size:12px;font-weight:500;color:#6B7280;cursor:pointer;font-family:'Inter',sans-serif;}
    .bc-cat-btn--on{background:#F97316;border-color:#F97316;color:#fff;}
    .bc-menu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;}
    .bc-menu-item{display:flex;align-items:center;gap:12px;padding:14px;background:#fff;border-radius:12px;border:1px solid #FDE8D0;}
    .bc-menu-emoji{font-size:24px;}
    .bc-menu-info{flex:1;}
    .bc-menu-name{font-size:13px;font-weight:600;color:#1A1207;display:flex;align-items:center;gap:6px;margin-bottom:3px;}
    .bc-popular-badge{font-size:9px;padding:2px 6px;border-radius:4px;background:#FFF7ED;color:#F97316;border:1px solid #FED7AA;font-weight:600;}
    .bc-menu-meta{font-size:10px;color:#9CA3AF;display:flex;align-items:center;gap:3px;}
    .bc-menu-price{font-size:16px;font-weight:700;color:#1A1207;}
    .bc-analytics-tab{padding:16px;}
    .bc-analytics-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
    .bc-analytics-stat{background:#fff;border-radius:14px;padding:16px;border:1px solid #FDE8D0;text-align:center;}
    .bc-stat-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;}
    .bc-stat-val{font-size:26px;font-weight:800;letter-spacing:-0.02em;margin-bottom:3px;}
    .bc-stat-lbl{font-size:11px;color:#9CA3AF;}
    .bc-top-items{background:#fff;border-radius:14px;padding:18px;border:1px solid #FDE8D0;}
    .bc-section-label{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;}
    .bc-top-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #FFF8F0;}
    .bc-top-item:last-child{border-bottom:none;}
    .bc-top-rank{font-size:12px;font-weight:700;color:#F97316;width:24px;font-family:'JetBrains Mono',monospace;}
    .bc-top-emoji{font-size:20px;}
    .bc-top-name{font-size:13px;font-weight:500;color:#1A1207;flex:1;}
    .bc-top-count{font-size:12px;color:#9CA3AF;margin-right:8px;}
    .bc-top-rev{font-size:13px;font-weight:700;color:#10B981;}
    @media(max-width:900px){.bc-orders-board{grid-template-columns:1fr 1fr}.bc-analytics-stats{grid-template-columns:1fr 1fr}}
    @media(max-width:600px){.bc-orders-board{grid-template-columns:1fr}.bc-table-stats{flex-wrap:wrap}}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function BeaconCore() {
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  useOrderTimer(orders, setOrders);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/api/orders`).then(r => r.json()),
      fetch(`${BASE_URL}/api/menu`).then(r => r.json()),
      fetch(`${BASE_URL}/api/tables`).then(r => r.json()),
    ]).then(([ordersData, menuData, tablesData]) => {
      setOrders(ordersData);
      setMenuItems(menuData);
      setTables(tablesData);
      setLoading(false);
    });
  }, []);

  const pendingCount = useMemo(()=>orders.filter(o=>o.status==="pending").length,[orders]);
  const readyCount   = useMemo(()=>orders.filter(o=>o.status==="ready").length,[orders]);

  if (loading) return (
    <>
      <GlobalStyles/>
      <div style={{
        fontFamily:"'Inter',sans-serif",
        background:"#FFF8F0",
        minHeight:"100vh",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        flexDirection:"column",
        gap:12,
      }}>
        <div style={{
          width:40,
          height:40,
          borderRadius:"50%",
          border:"3px solid #FDE8D0",
          borderTop:"3px solid #F97316",
          animation:"bcSpin 0.8s linear infinite",
        }}/>
        <div style={{fontSize:13,color:"#9CA3AF",fontWeight:500}}>
          Loading Beacon...
        </div>
        <style>{`@keyframes bcSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles/>
      <div className="bc-root">
        <div className="bc-topbar">
          <div className="bc-brand">Bea<span>con</span></div>
          <div className="bc-live"><div className="bc-live-dot"/> LIVE ORDERS</div>
          <div className="bc-topbar-right">
            {pendingCount>0&&(
              <div className="bc-stat-pill" style={{background:"#FFF7ED",color:"#F97316",borderColor:"#FED7AA"}}>
                <Clock size={11}/> {pendingCount} pending
              </div>
            )}
            {readyCount>0&&(
              <div className="bc-stat-pill" style={{background:"#F0FDF4",color:"#10B981",borderColor:"#BBF7D0"}}>
                <Bell size={11}/> {readyCount} ready
              </div>
            )}
          </div>
        </div>
        <div className="bc-tabs">
          {TABS.map((t,i)=>(
            <button key={t} className={`bc-tab ${tab===i?"bc-tab--on":""}`} onClick={()=>setTab(i)}>{t}</button>
          ))}
        </div>
        {tab===0&&<OrdersTab orders={orders} setOrders={setOrders}/>}
        {tab===1&&<TablesTab tables={tables}/>}
        {tab===2&&<MenuTab menuItems={menuItems}/>}
        {tab===3&&<AnalyticsTab orders={orders} tables={tables} menuItems={menuItems}/>}
      </div>
    </>
  );
}

export default function Beacon() {
  return <BeaconErrorBoundary><BeaconCore/></BeaconErrorBoundary>;
}
