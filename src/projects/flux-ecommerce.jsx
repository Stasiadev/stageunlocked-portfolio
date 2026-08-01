/**
 * Flux — E-Commerce Product & Checkout Flow
 * Multi-step cart and checkout with product detail, cart, and order confirmation
 *
 * Hooks: useState · useEffect · useCallback · useRef · useMemo ·
 *   useReducer · useId · useLayoutEffect · memo · ErrorBoundary
 * Patterns: cart state machine · multi-step checkout · optimistic UI
 */

import {
  useState, useEffect, useCallback, useRef,
  useMemo, useReducer, useId, useLayoutEffect,
  memo, Component,
} from "react";
import { ShoppingBag, Heart, Star, Plus, Minus, X, Check,
  ChevronRight, Package, Truck, CreditCard, AlertCircle } from "lucide-react";

// ─── API ─────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://flux-api-jpbv.onrender.com';

const STEPS = ["Cart","Shipping","Payment","Confirmation"];

// ─── State ────────────────────────────────────────────────────────────────────
// Cart items now live server-side (fetched/mutated via the API) — this reducer
// only tracks local UI/form state: which step we're on, and the shipping/card
// forms in progress.

const cartInit = { step:0, shipping:{ name:"",email:"",address:"",city:"",state:"",zip:"" }, card:{ num:"",exp:"",cvv:"",name:"" } };

function cartReducer(state, action) {
  switch(action.type) {
    case "NEXT": return { ...state, step:Math.min(state.step+1,3) };
    case "PREV": return { ...state, step:Math.max(state.step-1,0) };
    case "SHIP": return { ...state, shipping:{...state.shipping,...action.payload} };
    case "CARD": return { ...state, card:{...state.card,...action.payload} };
    case "RESET": return cartInit;
    default: return state;
  }
}

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = memo(function ProductCard({ p, onAdd }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    setAdding(true);
    await onAdd(p.id);
    setTimeout(()=>setAdding(false),1200);
  },[onAdd,p.id]);

  return (
    <div className="fx-product">
      {/* Image area */}
      <div className="fx-product-img" style={{ background:`linear-gradient(135deg,${p.image_color}18,${p.image_color}08)` }}>
        <div className="fx-product-icon" style={{ background:`${p.image_color}20`, color:p.image_color }}>
          {p.name[0]}
        </div>
        <button className={`fx-wish ${wishlisted?"fx-wish--on":""}`} onClick={()=>setWishlisted(w=>!w)} aria-label="Add to wishlist">
          <Heart size={14} fill={wishlisted?"#D4178A":"none"} color={wishlisted?"#D4178A":"#94A3B8"} />
        </button>
        <div className="fx-tags">
          <span className="fx-tag">{p.category}</span>
          {!p.in_stock&&<span className="fx-tag fx-tag--sale">Out of Stock</span>}
        </div>
      </div>

      <div className="fx-product-body">
        <div className="fx-product-brand">{p.brand}</div>
        <div className="fx-product-name">{p.name}</div>
        <div className="fx-rating">
          {Array(5).fill(0).map((_,i)=><Star key={i} size={11} fill={i<Math.floor(p.rating)?"#F59E0B":"none"} color="#F59E0B"/>)}
          <span className="fx-rating-num">{p.rating}</span>
          <span className="fx-rating-count">({p.review_count.toLocaleString()})</span>
        </div>
        <div className="fx-product-desc">{p.description}</div>

        {p.shade && (
          <div className="fx-variants">
            <span className="fx-variant-label">Shade</span>
            <div className="fx-variant-opts">
              <span className="fx-variant fx-variant--on" style={{borderColor:p.image_color,color:p.image_color}}>{p.shade}</span>
            </div>
          </div>
        )}

        <div className="fx-price-row">
          <div>
            <span className="fx-price" style={{color:p.image_color}}>${p.price}</span>
          </div>
          <button className={`fx-add-btn ${adding?"fx-add-btn--done":""}`}
            style={{background:adding?"#10B981":p.image_color}}
            disabled={!p.in_stock}
            onClick={handleAdd} aria-label="Add to cart">
            {adding?<Check size={14}/>:<><ShoppingBag size={13}/> Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

const CartView = memo(function CartView({ cart, onQtyChange, onRemove, onNext }) {
  const items = cart?.items ?? [];

  if(!items.length) return (
    <div className="fx-empty">
      <ShoppingBag size={36} color="#CBD5E1" />
      <div className="fx-empty-title">Your cart is empty</div>
      <div className="fx-empty-sub">Add some products to get started</div>
    </div>
  );

  return (
    <div className="fx-cart">
      <div className="fx-cart-items">
        {items.map(item=>(
          <div key={item.product_id} className="fx-cart-item">
            <div className="fx-cart-img" style={{background:`${item.product.image_color}18`,color:item.product.image_color}}>
              {item.product.name[0]}
            </div>
            <div className="fx-cart-info">
              <div className="fx-cart-brand">{item.product.brand}</div>
              <div className="fx-cart-name">{item.product.name}</div>
              {item.product.shade&&<div className="fx-cart-variant">{item.product.shade}</div>}
              <div className="fx-cart-controls">
                <div className="fx-qty">
                  <button onClick={()=>onQtyChange(item.product_id,Math.max(1,item.quantity-1))}><Minus size={11}/></button>
                  <span>{item.quantity}</span>
                  <button onClick={()=>onQtyChange(item.product_id,item.quantity+1)}><Plus size={11}/></button>
                </div>
                <span className="fx-cart-price">${(item.product.price*item.quantity).toFixed(2)}</span>
              </div>
            </div>
            <button className="fx-remove" onClick={()=>onRemove(item.product_id)} aria-label="Remove item">
              <X size={13}/>
            </button>
          </div>
        ))}
      </div>
      <div className="fx-summary">
        <div className="fx-summary-row"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
        <div className="fx-summary-row"><span>Shipping</span><span style={{color:cart.shipping===0?"#10B981":undefined}}>{cart.shipping===0?"Free":"$"+cart.shipping.toFixed(2)}</span></div>
        <div className="fx-summary-row"><span>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
        <div className="fx-summary-row fx-summary-total"><span>Total</span><span>${cart.total.toFixed(2)}</span></div>
        <button className="fx-checkout-btn" onClick={onNext}>
          Checkout <ChevronRight size={15}/>
        </button>
      </div>
    </div>
  );
});

// ─── Shipping & Payment ────────────────────────────────────────────────────────

const ShippingView = memo(function ShippingView({ state, dispatch }) {
  const id = useId();
  const { shipping } = state;
  const ok = useMemo(()=>Object.values(shipping).every(v=>v.trim().length>0),[shipping]);
  return (
    <div className="fx-form-view">
      <div className="fx-form-grid">
        {[["Full Name","name","Your name","text"],["Email","email","your@email.com","email"],["Address","address","123 Main Street","text"],["City","city","Atlanta","text"],["State","state","GA","text"],["ZIP Code","zip","30301","text"]].map(([label,key,ph,type])=>(
          <div key={key} className={`fx-field ${key==="address"||key==="name"?"fx-field--full":""}`}>
            <label className="fx-label" htmlFor={`${id}-${key}`}>{label}</label>
            <input id={`${id}-${key}`} className="fx-input" type={type} placeholder={ph} value={shipping[key]}
              onChange={e=>dispatch({type:"SHIP",payload:{[key]:e.target.value}})}/>
          </div>
        ))}
      </div>
      <div className="fx-form-actions">
        <button className="fx-back-btn" onClick={()=>dispatch({type:"PREV"})}>← Back</button>
        <button className="fx-next-btn" disabled={!ok} onClick={()=>dispatch({type:"NEXT"})}>Continue to Payment <ChevronRight size={14}/></button>
      </div>
    </div>
  );
});

const PaymentView = memo(function PaymentView({ state, dispatch, onPlaceOrder, placingOrder }) {
  const id = useId();
  const { card } = state;
  const ok = useMemo(()=>card.num.replace(/\s/g,"").length>=16&&card.exp.length>=5&&card.cvv.length>=3&&card.name.trim().length>0,[card]);
  const formatCard = useCallback(v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim(),[]);
  const formatExp = useCallback(v=>v.replace(/\D/g,"").slice(0,4).replace(/^(\d{2})/,"$1/"),[]);
  return (
    <div className="fx-form-view">
      <div className="fx-card-preview" style={{background:"linear-gradient(135deg,#D4178A,#7B2DBE)"}}>
        <div className="fx-card-chip">◼◼◼◼</div>
        <div className="fx-card-num">{card.num||"•••• •••• •••• ••••"}</div>
        <div className="fx-card-bottom">
          <div><div className="fx-card-lbl">VALID THRU</div><div className="fx-card-val">{card.exp||"MM/YY"}</div></div>
          <div style={{textAlign:"right"}}><div className="fx-card-lbl">CVV</div><div className="fx-card-val">{card.cvv?"•••":"•••"}</div></div>
        </div>
      </div>
      <div className="fx-form-grid" style={{marginTop:20}}>
        <div className="fx-field fx-field--full">
          <label className="fx-label" htmlFor={`${id}-name`}>Name on Card</label>
          <input id={`${id}-name`} className="fx-input" placeholder="Your name" value={card.name} onChange={e=>dispatch({type:"CARD",payload:{name:e.target.value}})}/>
        </div>
        <div className="fx-field fx-field--full">
          <label className="fx-label" htmlFor={`${id}-num`}>Card Number</label>
          <input id={`${id}-num`} className="fx-input" placeholder="1234 5678 9012 3456" value={card.num} onChange={e=>dispatch({type:"CARD",payload:{num:formatCard(e.target.value)}})}/>
        </div>
        <div className="fx-field">
          <label className="fx-label" htmlFor={`${id}-exp`}>Expiry</label>
          <input id={`${id}-exp`} className="fx-input" placeholder="MM/YY" value={card.exp} onChange={e=>dispatch({type:"CARD",payload:{exp:formatExp(e.target.value)}})}/>
        </div>
        <div className="fx-field">
          <label className="fx-label" htmlFor={`${id}-cvv`}>CVV</label>
          <input id={`${id}-cvv`} className="fx-input" placeholder="•••" value={card.cvv} onChange={e=>dispatch({type:"CARD",payload:{cvv:e.target.value.slice(0,4)}})}/>
        </div>
      </div>
      <div className="fx-form-actions">
        <button className="fx-back-btn" onClick={()=>dispatch({type:"PREV"})}>← Back</button>
        <button className="fx-next-btn" disabled={!ok||placingOrder} onClick={onPlaceOrder}>{placingOrder?"Placing Order...":"Place Order"} <ChevronRight size={14}/></button>
      </div>
    </div>
  );
});

// ─── Confirmation ─────────────────────────────────────────────────────────────

const ConfirmView = memo(function ConfirmView({ order, dispatch }) {
  if(!order) return null;
  const firstName = order.shipping?.first_name || "there";
  return (
    <div className="fx-confirm">
      <div className="fx-confirm-icon"><Check size={28} color="#10B981"/></div>
      <h2 className="fx-confirm-title">Order Confirmed!</h2>
      <p className="fx-confirm-sub">Thank you, {firstName}. Your order is on its way.</p>
      <div className="fx-order-num">Order #{order.id}</div>
      <div className="fx-confirm-steps">
        {[{Icon:Package,label:"Processing",done:true},{Icon:Truck,label:"Shipping to "+(order.shipping?.city||""),done:false},{Icon:Check,label:"Delivered",done:false}].map(({Icon,label,done},i)=>(
          <div key={i} className={`fx-conf-step ${done?"fx-conf-step--done":""}`}>
            <div className="fx-conf-dot"><Icon size={13}/></div>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="fx-confirm-total">Total charged: ${Number(order.total).toFixed(2)}</div>
      <button className="fx-checkout-btn" style={{marginTop:16}} onClick={()=>dispatch({type:"RESET"})}>Continue Shopping</button>
    </div>
  );
});

// ─── Error Boundary ───────────────────────────────────────────────────────────

class FluxErrorBoundary extends Component {
  constructor(props){super(props);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  render(){
    if(this.state.err)return<div style={{display:"flex",alignItems:"center",gap:10,padding:20,color:"#EF4444"}}><AlertCircle size={18}/><p>Something went wrong.</p></div>;
    return this.props.children;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles = ()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .fx-root{font-family:'Inter',sans-serif;background:#FAFBFC;min-height:100vh;color:#0F172A;-webkit-font-smoothing:antialiased;}
    .fx-serif{font-family:'Playfair Display',Georgia,serif;}
    .fx-topbar{background:#fff;border-bottom:1px solid #F1F5F9;padding:0 28px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
    .fx-brand{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#0F172A;letter-spacing:-0.02em;}
    .fx-brand span{background:linear-gradient(135deg,#D4178A,#7B2DBE);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
    .fx-cart-badge{display:flex;align-items:center;gap:8px;padding:7px 14px;border-radius:8px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:13px;font-weight:600;color:#0F172A;cursor:pointer;}
    .fx-badge-count{background:linear-gradient(135deg,#D4178A,#7B2DBE);color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .fx-layout{display:grid;grid-template-columns:1fr 360px;gap:24px;max-width:1100px;margin:0 auto;padding:28px;}
    .fx-products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
    .fx-section-title{font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#0F172A;margin-bottom:20px;letter-spacing:-0.02em;}
    .fx-product{background:#fff;border:1px solid #F1F5F9;border-radius:16px;overflow:hidden;transition:box-shadow 0.2s,transform 0.2s;}
    .fx-product:hover{box-shadow:0 8px 32px rgba(0,0,0,0.08);transform:translateY(-2px);}
    .fx-product-img{height:180px;display:flex;align-items:center;justify-content:center;position:relative;}
    .fx-product-icon{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;}
    .fx-wish{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;background:#fff;border:1px solid #F1F5F9;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:border-color 0.15s;}
    .fx-wish:hover{border-color:#D4178A;}
    .fx-tags{position:absolute;top:12px;left:12px;display:flex;gap:4px;flex-wrap:wrap;}
    .fx-tag{font-size:9px;padding:3px 7px;border-radius:6px;background:#F8FAFC;border:1px solid #E2E8F0;color:#64748B;font-weight:600;}
    .fx-tag--sale{background:rgba(212,23,138,0.08);border-color:rgba(212,23,138,0.2);color:#D4178A;}
    .fx-product-body{padding:16px;}
    .fx-product-brand{font-size:10px;color:#D4178A;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:3px;}
    .fx-product-name{font-size:15px;font-weight:600;color:#0F172A;margin-bottom:6px;}
    .fx-rating{display:flex;align-items:center;gap:3px;margin-bottom:8px;}
    .fx-rating-num{font-size:12px;font-weight:600;color:#0F172A;margin-left:2px;}
    .fx-rating-count{font-size:11px;color:#94A3B8;}
    .fx-product-desc{font-size:12px;color:#64748B;line-height:1.6;margin-bottom:12px;}
    .fx-variants{margin-bottom:12px;}
    .fx-variant-label{font-size:10px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:6px;}
    .fx-variant-opts{display:flex;gap:6px;flex-wrap:wrap;}
    .fx-variant{padding:4px 10px;border-radius:7px;border:1px solid #E2E8F0;background:transparent;font-size:11px;color:#64748B;cursor:pointer;transition:all 0.13s;}
    .fx-variant--on{font-weight:600;}
    .fx-price-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}
    .fx-price{font-size:20px;font-weight:700;}
    .fx-price-orig{font-size:13px;color:#94A3B8;text-decoration:line-through;margin-left:4px;}
    .fx-add-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;border:none;color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s,transform 0.1s;font-family:'Inter',sans-serif;}
    .fx-add-btn:active{transform:scale(0.97);}
    .fx-add-btn:disabled{opacity:0.4;cursor:not-allowed;}
    .fx-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#FAFBFC;gap:16px;}
    .fx-loading-brand{font-size:24px;font-weight:700;color:#0F172A;letter-spacing:-0.02em;}
    .fx-loading-brand span{background:linear-gradient(135deg,#D4178A,#7B2DBE);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
    .fx-loading-spinner{width:36px;height:36px;border-radius:50%;border:3px solid #FCE7F3;border-top-color:#D4178A;animation:flSpin 0.8s linear infinite;}
    .fx-loading-text{font-size:13px;color:#64748B;}
    @keyframes flSpin{to{transform:rotate(360deg);}}
    .fx-sidebar{display:flex;flex-direction:column;gap:0;}
    .fx-checkout-panel{background:#fff;border:1px solid #F1F5F9;border-radius:16px;overflow:hidden;}
    .fx-checkout-header{padding:16px 20px;border-bottom:1px solid #F1F5F9;}
    .fx-checkout-title{font-size:16px;font-weight:700;color:#0F172A;}
    .fx-steps{display:flex;gap:0;padding:12px 20px;border-bottom:1px solid #F1F5F9;overflow-x:auto;}
    .fx-step{display:flex;align-items:center;gap:4px;font-size:11px;color:#94A3B8;white-space:nowrap;}
    .fx-step--on{color:#D4178A;font-weight:600;}
    .fx-step-dot{width:18px;height:18px;border-radius:50%;border:1.5px solid #E2E8F0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94A3B8;font-weight:600;flex-shrink:0;}
    .fx-step--on .fx-step-dot{border-color:#D4178A;color:#D4178A;}
    .fx-step-divider{width:16px;height:1px;background:#E2E8F0;flex-shrink:0;}
    .fx-panel-body{padding:16px 20px;max-height:560px;overflow-y:auto;}
    .fx-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;gap:10px;text-align:center;}
    .fx-empty-title{font-size:15px;font-weight:600;color:#0F172A;}
    .fx-empty-sub{font-size:13px;color:#94A3B8;}
    .fx-cart{display:flex;flex-direction:column;gap:16px;}
    .fx-cart-items{display:flex;flex-direction:column;gap:10px;}
    .fx-cart-item{display:flex;gap:10px;padding:12px;border-radius:12px;background:#F8FAFC;border:1px solid #F1F5F9;position:relative;}
    .fx-cart-img{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;}
    .fx-cart-brand{font-size:9px;color:#D4178A;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;}
    .fx-cart-name{font-size:12px;font-weight:600;color:#0F172A;margin-bottom:2px;}
    .fx-cart-variant{font-size:10px;color:#94A3B8;margin-bottom:6px;}
    .fx-cart-controls{display:flex;align-items:center;justify-content:space-between;}
    .fx-qty{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E2E8F0;border-radius:7px;padding:3px 8px;}
    .fx-qty button{background:none;border:none;cursor:pointer;color:#64748B;display:flex;align-items:center;}
    .fx-qty span{font-size:12px;font-weight:600;min-width:16px;text-align:center;}
    .fx-cart-price{font-size:13px;font-weight:700;color:#0F172A;}
    .fx-remove{position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:#CBD5E1;padding:2px;}
    .fx-remove:hover{color:#94A3B8;}
    .fx-summary{background:#F8FAFC;border:1px solid #F1F5F9;border-radius:12px;padding:14px;}
    .fx-summary-row{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#64748B;}
    .fx-summary-total{font-size:15px;font-weight:700;color:#0F172A;border-top:1px solid #E2E8F0;padding-top:10px;margin-top:4px;}
    .fx-free-ship{font-size:10px;color:#10B981;font-weight:600;padding:4px 0;}
    .fx-checkout-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:13px;border-radius:11px;background:linear-gradient(135deg,#D4178A,#7B2DBE);border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:12px;font-family:'Inter',sans-serif;transition:opacity 0.15s;}
    .fx-checkout-btn:hover{opacity:0.9;}
    .fx-form-view{display:flex;flex-direction:column;gap:14px;}
    .fx-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .fx-field{display:flex;flex-direction:column;gap:4px;}
    .fx-field--full{grid-column:span 2;}
    .fx-label{font-size:10px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;}
    .fx-input{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;padding:9px 12px;font-size:13px;color:#0F172A;outline:none;font-family:'Inter',sans-serif;transition:border-color 0.13s;}
    .fx-input:focus{border-color:#D4178A;}
    .fx-input::placeholder{color:#CBD5E1;}
    .fx-form-actions{display:flex;gap:8px;margin-top:4px;}
    .fx-back-btn{padding:10px 16px;border-radius:9px;border:1px solid #E2E8F0;background:transparent;color:#64748B;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
    .fx-next-btn{flex:1;padding:10px 16px;border-radius:9px;background:linear-gradient(135deg,#D4178A,#7B2DBE);border:none;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;font-family:'Inter',sans-serif;}
    .fx-next-btn:disabled{opacity:0.4;cursor:not-allowed;}
    .fx-card-preview{border-radius:14px;padding:20px;color:#fff;margin-bottom:4px;min-height:100px;}
    .fx-card-chip{font-size:10px;letter-spacing:3px;opacity:0.7;margin-bottom:16px;}
    .fx-card-num{font-size:16px;letter-spacing:3px;font-weight:600;margin-bottom:16px;}
    .fx-card-bottom{display:flex;justify-content:space-between;}
    .fx-card-lbl{font-size:8px;opacity:0.6;letter-spacing:1px;margin-bottom:3px;}
    .fx-card-val{font-size:13px;font-weight:600;letter-spacing:1px;}
    .fx-confirm{display:flex;flex-direction:column;align-items:center;text-align:center;padding:8px 0;}
    .fx-confirm-icon{width:56px;height:56px;border-radius:50%;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
    .fx-confirm-title{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#0F172A;margin-bottom:6px;}
    .fx-confirm-sub{font-size:13px;color:#64748B;margin-bottom:14px;}
    .fx-order-num{font-size:11px;padding:5px 12px;border-radius:7px;background:#F8FAFC;border:1px solid #E2E8F0;color:#64748B;margin-bottom:20px;font-weight:600;}
    .fx-confirm-steps{display:flex;flex-direction:column;gap:10px;width:100%;margin-bottom:16px;}
    .fx-conf-step{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:#F8FAFC;border:1px solid #F1F5F9;font-size:12px;color:#64748B;}
    .fx-conf-step--done{background:rgba(16,185,129,0.06);border-color:rgba(16,185,129,0.2);color:#10B981;}
    .fx-conf-dot{width:26px;height:26px;border-radius:50%;background:#fff;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .fx-conf-step--done .fx-conf-dot{background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.2);}
    .fx-confirm-total{font-size:15px;font-weight:700;color:#0F172A;}
    @media(max-width:700px){.fx-layout{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

function FluxCore() {
  const [state, dispatch] = useReducer(cartReducer, cartInit);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(()=>{
    Promise.all([
      fetch(`${BASE_URL}/api/products`).then(r=>r.json()),
      fetch(`${BASE_URL}/api/cart`).then(r=>r.json()),
    ]).then(([productsData, cartData])=>{
      setProducts(productsData);
      setCart(cartData);
      setLoading(false);
    });
  },[]);

  const itemCount = cart?.item_count ?? 0;

  const handleAdd = useCallback(async (productId)=>{
    const res = await fetch(`${BASE_URL}/api/cart`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({product_id:productId, quantity:1}),
    });
    setCart(await res.json());
  },[]);

  const handleQtyChange = useCallback(async (productId, quantity)=>{
    const res = await fetch(`${BASE_URL}/api/cart/${productId}`,{
      method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({quantity}),
    });
    setCart(await res.json());
  },[]);

  const handleRemove = useCallback(async (productId)=>{
    const res = await fetch(`${BASE_URL}/api/cart/${productId}`,{method:"DELETE"});
    setCart(await res.json());
  },[]);

  const handlePlaceOrder = useCallback(async ()=>{
    setPlacingOrder(true);
    const [firstName, ...rest] = state.shipping.name.trim().split(" ");
    const payload = {
      shipping:{
        first_name: firstName || "",
        last_name: rest.join(" ") || "",
        email: state.shipping.email,
        address: state.shipping.address,
        city: state.shipping.city,
        state: state.shipping.state,
        zip_code: state.shipping.zip,
      },
      payment:{
        card_number: state.card.num.replace(/\s/g,""),
        expiry: state.card.exp,
        cvv: state.card.cvv,
        name_on_card: state.card.name,
      },
    };
    try{
      const res = await fetch(`${BASE_URL}/api/orders`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
      });
      const data = await res.json();
      setOrder(data);
      dispatch({type:"NEXT"});
    } finally {
      setPlacingOrder(false);
    }
  },[state.shipping, state.card]);

  if(loading){
    return (
      <>
        <GlobalStyles/>
        <div className="fx-loading">
          <div className="fx-loading-brand fx-serif">Lumé <span>Beauty</span></div>
          <div className="fx-loading-spinner"/>
          <p className="fx-loading-text">Loading your store...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles/>
      <div className="fx-root">
        <div className="fx-topbar">
          <div className="fx-brand fx-serif">Lumé <span>Beauty</span></div>
          <button className="fx-cart-badge" aria-label={`Cart with ${itemCount} items`}>
            <ShoppingBag size={15}/>
            <span>Cart</span>
            {itemCount>0&&<span className="fx-badge-count">{itemCount}</span>}
          </button>
        </div>

        <div className="fx-layout">
          <div>
            <h1 className="fx-section-title fx-serif">Clean Beauty Essentials</h1>
            <div className="fx-products-grid">
              {products.map(p=><ProductCard key={p.id} p={p} onAdd={handleAdd}/>)}
            </div>
          </div>

          <div className="fx-sidebar">
            <div className="fx-checkout-panel">
              <div className="fx-checkout-header">
                <div className="fx-checkout-title">{STEPS[state.step]}</div>
              </div>
              <div className="fx-steps">
                {STEPS.map((s,i)=>(
                  <div key={s} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div className={`fx-step ${i<=state.step?"fx-step--on":""}`}>
                      <div className="fx-step-dot">{i<state.step?<Check size={9}/>:i+1}</div>
                      <span>{s}</span>
                    </div>
                    {i<STEPS.length-1&&<div className="fx-step-divider"/>}
                  </div>
                ))}
              </div>
              <div className="fx-panel-body">
                {state.step===0&&<CartView cart={cart} onQtyChange={handleQtyChange} onRemove={handleRemove} onNext={()=>dispatch({type:"NEXT"})}/>}
                {state.step===1&&<ShippingView state={state} dispatch={dispatch}/>}
                {state.step===2&&<PaymentView state={state} dispatch={dispatch} onPlaceOrder={handlePlaceOrder} placingOrder={placingOrder}/>}
                {state.step===3&&<ConfirmView order={order} dispatch={dispatch}/>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Flux() {
  return <FluxErrorBoundary><FluxCore/></FluxErrorBoundary>;
}
