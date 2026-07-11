/**
 * Zephyr — HR & People Operations Platform
 * Employee directory, onboarding tracker, org chart, leave management
 *
 * Hooks: useState · useEffect · useCallback · useMemo · useReducer · memo
 * Patterns: tabbed navigation · search/filter · progress tracking · data tables
 */

import {
  useState, useCallback, useMemo, useReducer, memo, Component,
} from "react";
import {
  Users, Search, Filter, CheckCircle, Clock, AlertCircle,
  ChevronRight, Plus, Mail, Phone, MapPin, Calendar,
  TrendingUp, Award, Coffee, Briefcase, Star, MoreHorizontal,
  UserCheck, FileText, Bell,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const EMPLOYEES = [
  { id:1,  name:"Jordan Pierce",    role:"Senior Engineer",      dept:"Engineering",  location:"Atlanta, GA", email:"j.pierce@co.io",   phone:"404-555-0182", joined:"Jan 2022", status:"active",  avatar:"JP", color:"#0EA5E9", level:"Senior",   manager:"Alex Kim" },
  { id:2,  name:"Camille Dubois",   role:"Product Designer",     dept:"Design",       location:"Remote",      email:"c.dubois@co.io",   phone:"404-555-0241", joined:"Mar 2021", status:"active",  avatar:"CD", color:"#D4178A", level:"Mid",      manager:"Sam Torres" },
  { id:3,  name:"Marcus Webb",      role:"Data Analyst",         dept:"Analytics",    location:"New York, NY",email:"m.webb@co.io",     phone:"212-555-0198", joined:"Jun 2023", status:"active",  avatar:"MW", color:"#F59E0B", level:"Junior",   manager:"Jordan Pierce" },
  { id:4,  name:"Priya Sharma",     role:"Engineering Manager",  dept:"Engineering",  location:"Atlanta, GA", email:"p.sharma@co.io",   phone:"404-555-0317", joined:"Aug 2020", status:"active",  avatar:"PS", color:"#10B981", level:"Manager",  manager:"Alex Kim" },
  { id:5,  name:"Devon Carter",     role:"UX Researcher",        dept:"Design",       location:"Remote",      email:"d.carter@co.io",   phone:"404-555-0429", joined:"Nov 2022", status:"leave",   avatar:"DC", color:"#8B5CF6", level:"Mid",      manager:"Sam Torres" },
  { id:6,  name:"Aisha Okonkwo",    role:"Frontend Engineer",    dept:"Engineering",  location:"Chicago, IL", email:"a.okonkwo@co.io",  phone:"312-555-0156", joined:"Feb 2024", status:"onboarding", avatar:"AO", color:"#F97316", level:"Junior", manager:"Priya Sharma" },
  { id:7,  name:"Lucas Ferreira",   role:"Growth Marketer",      dept:"Marketing",    location:"Remote",      email:"l.ferreira@co.io", phone:"404-555-0538", joined:"Sep 2021", status:"active",  avatar:"LF", color:"#0EA5E9", level:"Senior",   manager:"Sam Torres" },
  { id:8,  name:"Naomi Osei",       role:"Backend Engineer",     dept:"Engineering",  location:"Atlanta, GA", email:"n.osei@co.io",     phone:"404-555-0617", joined:"Apr 2023", status:"active",  avatar:"NO", color:"#10B981", level:"Mid",      manager:"Priya Sharma" },
];

const ONBOARDING = [
  { id:1, employee:"Aisha Okonkwo", role:"Frontend Engineer", startDate:"Jul 7, 2026", progress:65,
    tasks:[
      { label:"IT Setup & Equipment",        done:true  },
      { label:"System Access & Credentials", done:true  },
      { label:"Benefits Enrollment",         done:true  },
      { label:"Meet Your Team",             done:false },
      { label:"30-Day Check-In",            done:false },
      { label:"First Project Assignment",    done:false },
    ]
  },
];

const LEAVE_REQUESTS = [
  { id:1, employee:"Devon Carter",  type:"Parental Leave", start:"Jun 15", end:"Aug 15", days:43, status:"approved" },
  { id:2, employee:"Marcus Webb",   type:"Vacation",       start:"Jul 20", end:"Jul 27", days:5,  status:"pending"  },
  { id:3, employee:"Lucas Ferreira",type:"Sick Leave",     start:"Jul 10", end:"Jul 11", days:2,  status:"approved" },
  { id:4, employee:"Naomi Osei",    type:"Personal Day",   start:"Jul 18", end:"Jul 18", days:1,  status:"pending"  },
];

const TABS = ["Directory","Onboarding","Leave","Analytics"];

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ZephyrErrorBoundary extends Component {
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  render(){if(this.state.err)return<div style={{padding:20,color:"#EF4444"}}>Error.</div>;return this.props.children;}
}

// ─── Employee Card ────────────────────────────────────────────────────────────

const EmployeeCard = memo(function EmployeeCard({ e }) {
  const statusColor = e.status==="active"?"#10B981":e.status==="leave"?"#F59E0B":"#6366F1";
  const statusLabel = e.status==="onboarding"?"Onboarding":e.status==="leave"?"On Leave":"Active";

  return (
    <div className="zh-employee-card">
      <div className="zh-emp-header">
        <div className="zh-emp-avatar" style={{background:`${e.color}20`,color:e.color}}>{e.avatar}</div>
        <div className={`zh-status-badge`} style={{background:`${statusColor}12`,color:statusColor,borderColor:`${statusColor}25`}}>
          {statusLabel}
        </div>
      </div>
      <div className="zh-emp-name">{e.name}</div>
      <div className="zh-emp-role">{e.role}</div>
      <div className="zh-emp-dept" style={{background:`${e.color}10`,color:e.color}}>{e.dept}</div>
      <div className="zh-emp-details">
        <div className="zh-emp-detail"><MapPin size={10}/>{e.location}</div>
        <div className="zh-emp-detail"><Calendar size={10}/>Joined {e.joined}</div>
        <div className="zh-emp-detail"><Mail size={10}/>{e.email}</div>
      </div>
      <div className="zh-emp-actions">
        <button className="zh-emp-btn"><Mail size={12}/>Message</button>
        <button className="zh-emp-btn"><FileText size={12}/>Profile</button>
      </div>
    </div>
  );
});

// ─── Directory Tab ────────────────────────────────────────────────────────────

const DirectoryTab = memo(function DirectoryTab() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const depts = useMemo(()=>["All",...new Set(EMPLOYEES.map(e=>e.dept))],[]);

  const filtered = useMemo(()=>{
    let list = EMPLOYEES;
    if(dept!=="All") list=list.filter(e=>e.dept===dept);
    if(search) list=list.filter(e=>e.name.toLowerCase().includes(search.toLowerCase())||e.role.toLowerCase().includes(search.toLowerCase()));
    return list;
  },[dept,search]);

  return (
    <div className="zh-tab-content">
      <div className="zh-toolbar">
        <div className="zh-search-wrap">
          <Search size={14} className="zh-search-icon" color="#9CA3AF"/>
          <input className="zh-search" placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="zh-dept-filters">
          {depts.map(d=>(
            <button key={d} className={`zh-dept-btn ${dept===d?"zh-dept-btn--on":""}`} onClick={()=>setDept(d)}>{d}</button>
          ))}
        </div>
        <button className="zh-add-btn"><Plus size={14}/> Add Employee</button>
      </div>
      <div className="zh-emp-grid">
        {filtered.map(e=><EmployeeCard key={e.id} e={e}/>)}
      </div>
    </div>
  );
});

// ─── Onboarding Tab ───────────────────────────────────────────────────────────

const OnboardingTab = memo(function OnboardingTab() {
  const [tasks, setTasks] = useState(ONBOARDING[0].tasks);
  const completed = tasks.filter(t=>t.done).length;
  const pct = Math.round((completed/tasks.length)*100);
  const o = ONBOARDING[0];

  return (
    <div className="zh-tab-content">
      <div className="zh-onb-card">
        <div className="zh-onb-header">
          <div className="zh-emp-avatar zh-emp-avatar--lg" style={{background:"#F97316"+"20",color:"#F97316"}}>AO</div>
          <div>
            <div className="zh-onb-name">{o.employee}</div>
            <div className="zh-onb-role">{o.role}</div>
            <div className="zh-onb-start"><Calendar size={11}/> Start date: {o.startDate}</div>
          </div>
          <div className="zh-progress-circle">
            <svg viewBox="0 0 44 44" width={60} height={60}>
              <circle cx={22} cy={22} r={18} fill="none" stroke="#F3F4F6" strokeWidth={4}/>
              <circle cx={22} cy={22} r={18} fill="none" stroke="#10B981" strokeWidth={4}
                strokeDasharray={`${2*Math.PI*18*pct/100} ${2*Math.PI*18*(1-pct/100)}`}
                strokeLinecap="round" transform="rotate(-90 22 22)"/>
            </svg>
            <div className="zh-progress-label">{pct}%</div>
          </div>
        </div>

        <div className="zh-progress-bar-wrap">
          <div className="zh-progress-bar">
            <div className="zh-progress-fill" style={{width:`${pct}%`,background:"#10B981"}}/>
          </div>
          <span className="zh-progress-text">{completed} of {tasks.length} tasks complete</span>
        </div>

        <div className="zh-task-list">
          {tasks.map((t,i)=>(
            <div key={i} className={`zh-task ${t.done?"zh-task--done":""}`}>
              <button className="zh-task-check" onClick={()=>setTasks(prev=>prev.map((tt,ii)=>ii===i?{...tt,done:!tt.done}:tt))}
                aria-label={t.done?"Mark incomplete":"Mark complete"}>
                {t.done?<CheckCircle size={18} color="#10B981"/>:<div className="zh-task-circle"/>}
              </button>
              <span>{t.label}</span>
              {t.done&&<span className="zh-task-done-label">Done</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── Leave Tab ────────────────────────────────────────────────────────────────

const LeaveTab = memo(function LeaveTab() {
  const [requests, setRequests] = useState(LEAVE_REQUESTS);

  const approve = useCallback((id)=>setRequests(prev=>prev.map(r=>r.id===id?{...r,status:"approved"}:r)),[]);
  const deny    = useCallback((id)=>setRequests(prev=>prev.map(r=>r.id===id?{...r,status:"denied"}:r)),[]);

  return (
    <div className="zh-tab-content">
      <div className="zh-leave-header">
        <div className="zh-stat-chips">
          {[
            {label:"Approved",count:requests.filter(r=>r.status==="approved").length,color:"#10B981"},
            {label:"Pending", count:requests.filter(r=>r.status==="pending").length, color:"#F59E0B"},
            {label:"Total Days",count:requests.reduce((s,r)=>s+r.days,0), color:"#0EA5E9"},
          ].map(s=>(
            <div key={s.label} className="zh-stat-chip" style={{borderColor:`${s.color}25`,background:`${s.color}08`}}>
              <div className="zh-stat-num" style={{color:s.color}}>{s.count}</div>
              <div className="zh-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
        <button className="zh-add-btn"><Plus size={14}/> New Request</button>
      </div>
      <div className="zh-leave-list">
        {requests.map(r=>(
          <div key={r.id} className="zh-leave-row">
            <div className="zh-emp-avatar" style={{background:"#0EA5E9"+"20",color:"#0EA5E9",fontSize:11}}>
              {r.employee.split(" ").map(n=>n[0]).join("")}
            </div>
            <div className="zh-leave-info">
              <div className="zh-leave-name">{r.employee}</div>
              <div className="zh-leave-type">{r.type} · {r.start} – {r.end} · {r.days} day{r.days!==1?"s":""}</div>
            </div>
            <div className={`zh-leave-status zh-leave-status--${r.status}`}>
              {r.status==="approved"?<CheckCircle size={12}/>:r.status==="pending"?<Clock size={12}/>:<AlertCircle size={12}/>}
              {r.status.charAt(0).toUpperCase()+r.status.slice(1)}
            </div>
            {r.status==="pending"&&(
              <div className="zh-leave-actions">
                <button className="zh-approve-btn" onClick={()=>approve(r.id)}>Approve</button>
                <button className="zh-deny-btn" onClick={()=>deny(r.id)}>Deny</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Analytics Tab ────────────────────────────────────────────────────────────

const AnalyticsTab = memo(function AnalyticsTab() {
  const deptCounts = useMemo(()=>{
    const counts = {};
    EMPLOYEES.forEach(e=>{counts[e.dept]=(counts[e.dept]||0)+1;});
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  },[]);

  const colors = {"Engineering":"#0EA5E9","Design":"#D4178A","Analytics":"#F59E0B","Marketing":"#10B981"};

  return (
    <div className="zh-tab-content">
      <div className="zh-analytics-grid">
        {[
          {label:"Total Headcount",value:EMPLOYEES.length,icon:Users,color:"#0EA5E9",change:"+2 this month"},
          {label:"Active",value:EMPLOYEES.filter(e=>e.status==="active").length,icon:UserCheck,color:"#10B981",change:"87.5% of team"},
          {label:"Onboarding",value:EMPLOYEES.filter(e=>e.status==="onboarding").length,icon:Coffee,color:"#F97316",change:"Avg 65% complete"},
          {label:"On Leave",value:EMPLOYEES.filter(e=>e.status==="leave").length,icon:Calendar,color:"#8B5CF6",change:"Planned leave"},
        ].map(s=>(
          <div key={s.label} className="zh-analytics-stat">
            <div className="zh-stat-icon" style={{background:`${s.color}15`}}><s.icon size={14} color={s.color}/></div>
            <div className="zh-big-num" style={{color:s.color}}>{s.value}</div>
            <div className="zh-stat-title">{s.label}</div>
            <div className="zh-stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="zh-dept-breakdown">
        <div className="zh-section-label">Headcount by Department</div>
        {deptCounts.map(([dept,count])=>(
          <div key={dept} className="zh-dept-row">
            <span className="zh-dept-name">{dept}</span>
            <div className="zh-dept-bar-wrap">
              <div className="zh-dept-bar" style={{width:`${(count/EMPLOYEES.length)*100}%`,background:colors[dept]||"#6366F1"}}/>
            </div>
            <span className="zh-dept-count">{count}</span>
          </div>
        ))}
      </div>

      <div className="zh-level-breakdown">
        <div className="zh-section-label">Seniority Distribution</div>
        <div className="zh-level-chips">
          {["Junior","Mid","Senior","Manager"].map(level=>{
            const count=EMPLOYEES.filter(e=>e.level===level).length;
            const colors={"Junior":"#F97316","Mid":"#0EA5E9","Senior":"#10B981","Manager":"#D4178A"};
            return(
              <div key={level} className="zh-level-chip" style={{borderColor:`${colors[level]}25`,background:`${colors[level]}08`}}>
                <div className="zh-level-num" style={{color:colors[level]}}>{count}</div>
                <div className="zh-level-label">{level}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const GlobalStyles=()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .zh-root{font-family:'Inter',sans-serif;background:#F0F9FF;min-height:100vh;color:#0F172A;-webkit-font-smoothing:antialiased;display:flex;}
    .zh-sidebar{width:220px;background:#fff;border-right:1px solid #E0F2FE;display:flex;flex-direction:column;padding:20px 0;position:sticky;top:0;height:100vh;flex-shrink:0;}
    .zh-brand{font-size:20px;font-weight:700;color:#0F172A;letter-spacing:-0.02em;padding:0 20px 24px;border-bottom:1px solid #E0F2FE;margin-bottom:8px;}
    .zh-brand span{color:#0EA5E9;}
    .zh-nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;border-left:2px solid transparent;transition:all 0.13s;}
    .zh-nav-item:hover{color:#0F172A;background:#F0F9FF;}
    .zh-nav-item--on{color:#0EA5E9;background:#EFF6FF;border-left-color:#0EA5E9;font-weight:600;}
    .zh-nav-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;}
    .zh-sidebar-footer{margin-top:auto;padding:16px 20px;border-top:1px solid #E0F2FE;}
    .zh-user-row{display:flex;align-items:center;gap:8px;}
    .zh-user-av{width:32px;height:32px;border-radius:50%;background:#EFF6FF;color:#0EA5E9;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
    .zh-user-name{font-size:12px;font-weight:600;color:#0F172A;}
    .zh-user-role{font-size:10px;color:#64748B;}
    .zh-main{flex:1;overflow-y:auto;}
    .zh-topbar{background:#fff;border-bottom:1px solid #E0F2FE;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
    .zh-page-title{font-size:16px;font-weight:700;color:#0F172A;}
    .zh-topbar-actions{display:flex;align-items:center;gap:10px;}
    .zh-icon-btn{width:36px;height:36px;border-radius:9px;border:1px solid #E0F2FE;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748B;}
    .zh-tabs{display:flex;border-bottom:1px solid #E0F2FE;padding:0 24px;background:#fff;}
    .zh-tab{padding:12px 16px;font-size:13px;font-weight:500;color:#64748B;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;font-family:'Inter',sans-serif;transition:all 0.13s;}
    .zh-tab--on{color:#0EA5E9;border-bottom-color:#0EA5E9;font-weight:600;}
    .zh-tab-content{padding:20px 24px;}
    .zh-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
    .zh-search-wrap{display:flex;align-items:center;gap:8px;padding:9px 14px;border:1.5px solid #E0F2FE;border-radius:10px;background:#fff;flex:1;min-width:200px;}
    .zh-search{border:none;outline:none;font-size:13px;font-family:'Inter',sans-serif;background:transparent;color:#0F172A;width:100%;}
    .zh-dept-filters{display:flex;gap:6px;flex-wrap:wrap;}
    .zh-dept-btn{padding:6px 12px;border-radius:7px;border:1.5px solid #E0F2FE;background:#fff;font-size:12px;font-weight:500;color:#64748B;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.12s;}
    .zh-dept-btn--on{border-color:#0EA5E9;background:#EFF6FF;color:#0EA5E9;}
    .zh-add-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;background:#0EA5E9;border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;}
    .zh-emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;}
    .zh-employee-card{background:#fff;border:1px solid #E0F2FE;border-radius:14px;padding:16px;transition:box-shadow 0.2s;}
    .zh-employee-card:hover{box-shadow:0 4px 16px rgba(14,165,233,0.08);}
    .zh-emp-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}
    .zh-emp-avatar{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;}
    .zh-emp-avatar--lg{width:52px;height:52px;border-radius:14px;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .zh-status-badge{font-size:10px;padding:3px 8px;border-radius:5px;font-weight:600;border:1px solid;}
    .zh-emp-name{font-size:14px;font-weight:700;color:#0F172A;margin-bottom:2px;}
    .zh-emp-role{font-size:12px;color:#64748B;margin-bottom:8px;}
    .zh-emp-dept{display:inline-block;font-size:10px;font-weight:600;padding:3px 8px;border-radius:5px;margin-bottom:10px;}
    .zh-emp-details{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;}
    .zh-emp-detail{display:flex;align-items:center;gap:5px;font-size:11px;color:#94A3B8;}
    .zh-emp-actions{display:flex;gap:6px;}
    .zh-emp-btn{flex:1;padding:6px;border-radius:7px;border:1px solid #E0F2FE;background:#F8FAFC;font-size:11px;font-weight:500;color:#64748B;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;font-family:'Inter',sans-serif;}
    .zh-emp-btn:hover{border-color:#0EA5E9;color:#0EA5E9;}
    .zh-onb-card{background:#fff;border:1px solid #E0F2FE;border-radius:16px;padding:24px;}
    .zh-onb-header{display:flex;align-items:center;gap:14px;margin-bottom:20px;}
    .zh-onb-name{font-size:18px;font-weight:700;color:#0F172A;margin-bottom:2px;}
    .zh-onb-role{font-size:13px;color:#64748B;margin-bottom:4px;}
    .zh-onb-start{display:flex;align-items:center;gap:4px;font-size:11px;color:#94A3B8;}
    .zh-progress-circle{position:relative;margin-left:auto;}
    .zh-progress-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#10B981;}
    .zh-progress-bar-wrap{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
    .zh-progress-bar{flex:1;height:8px;background:#F3F4F6;border-radius:4px;overflow:hidden;}
    .zh-progress-fill{height:100%;border-radius:4px;transition:width 0.4s ease;}
    .zh-progress-text{font-size:12px;color:#64748B;white-space:nowrap;}
    .zh-task-list{display:flex;flex-direction:column;gap:10px;}
    .zh-task{display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:#F8FAFC;border:1px solid #F1F5F9;transition:all 0.15s;}
    .zh-task--done{opacity:0.65;}
    .zh-task-check{background:none;border:none;cursor:pointer;display:flex;align-items:center;flex-shrink:0;}
    .zh-task-circle{width:18px;height:18px;border-radius:50%;border:2px solid #D1D5DB;}
    .zh-task span{flex:1;font-size:13px;font-weight:500;color:#0F172A;}
    .zh-task--done span{text-decoration:line-through;color:#9CA3AF;}
    .zh-task-done-label{font-size:10px;color:#10B981;font-weight:600;background:#F0FDF4;padding:2px 7px;border-radius:4px;border:1px solid #BBF7D0;}
    .zh-leave-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
    .zh-stat-chips{display:flex;gap:10px;}
    .zh-stat-chip{padding:10px 16px;border-radius:10px;border:1px solid;text-align:center;}
    .zh-stat-num{font-size:22px;font-weight:700;}
    .zh-stat-lbl{font-size:11px;color:#64748B;}
    .zh-leave-list{display:flex;flex-direction:column;gap:10px;}
    .zh-leave-row{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:#fff;border:1px solid #E0F2FE;}
    .zh-leave-info{flex:1;}
    .zh-leave-name{font-size:13px;font-weight:600;color:#0F172A;margin-bottom:2px;}
    .zh-leave-type{font-size:11px;color:#64748B;}
    .zh-leave-status{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;}
    .zh-leave-status--approved{background:#F0FDF4;color:#10B981;}
    .zh-leave-status--pending{background:#FFFBEB;color:#F59E0B;}
    .zh-leave-status--denied{background:#FEF2F2;color:#EF4444;}
    .zh-leave-actions{display:flex;gap:6px;}
    .zh-approve-btn{padding:6px 12px;border-radius:7px;background:#10B981;border:none;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
    .zh-deny-btn{padding:6px 12px;border-radius:7px;background:#FEF2F2;border:1px solid #FECACA;color:#EF4444;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
    .zh-analytics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
    .zh-analytics-stat{background:#fff;border:1px solid #E0F2FE;border-radius:14px;padding:16px;text-align:center;}
    .zh-stat-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;}
    .zh-big-num{font-size:32px;font-weight:800;letter-spacing:-0.02em;margin-bottom:3px;}
    .zh-stat-title{font-size:12px;font-weight:600;color:#0F172A;margin-bottom:3px;}
    .zh-stat-change{font-size:10px;color:#94A3B8;}
    .zh-dept-breakdown,.zh-level-breakdown{background:#fff;border:1px solid #E0F2FE;border-radius:14px;padding:18px;margin-bottom:14px;}
    .zh-section-label{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;}
    .zh-dept-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
    .zh-dept-name{font-size:12px;font-weight:500;color:#374151;width:90px;flex-shrink:0;}
    .zh-dept-bar-wrap{flex:1;height:8px;background:#F3F4F6;border-radius:4px;overflow:hidden;}
    .zh-dept-bar{height:100%;border-radius:4px;transition:width 0.4s;}
    .zh-dept-count{font-size:12px;font-weight:600;color:#374151;width:20px;text-align:right;}
    .zh-level-chips{display:flex;gap:12px;}
    .zh-level-chip{flex:1;padding:14px;border-radius:10px;border:1px solid;text-align:center;}
    .zh-level-num{font-size:28px;font-weight:800;margin-bottom:3px;}
    .zh-level-label{font-size:11px;color:#64748B;}
    @media(max-width:700px){.zh-analytics-grid{grid-template-columns:1fr 1fr}.zh-sidebar{display:none}.zh-level-chips{flex-wrap:wrap}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  `}</style>
);

// ─── Core ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {label:"Dashboard",Icon:TrendingUp},{label:"People",Icon:Users},{label:"Onboarding",Icon:Award},
  {label:"Leave",Icon:Calendar},{label:"Payroll",Icon:Briefcase},{label:"Reports",Icon:FileText},
];

function ZephyrCore() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <GlobalStyles/>
      <div className="zh-root">
        <div className="zh-sidebar">
          <div className="zh-brand">Ze<span>phyr</span></div>
          {NAV_ITEMS.map((n,i)=>(
            <div key={n.label} className={`zh-nav-item ${i===1||i===2||i===3?"":""}${tab===[0,0,1,2,0,0][i]&&[1,1,2,3].includes(i)?"zh-nav-item--on":""}`}
              onClick={()=>[1,2,3].includes(i)&&setTab([0,0,1,2][i])}>
              <div className="zh-nav-icon"><n.Icon size={14}/></div>
              {n.label}
            </div>
          ))}
          <div className="zh-sidebar-footer">
            <div className="zh-user-row">
              <div className="zh-user-av">AM</div>
              <div>
                <div className="zh-user-name">Anastasia M.</div>
                <div className="zh-user-role">HR Admin</div>
              </div>
            </div>
          </div>
        </div>
        <div className="zh-main">
          <div className="zh-topbar">
            <div className="zh-page-title">{["People Directory","Onboarding","Leave Management","Analytics"][tab]}</div>
            <div className="zh-topbar-actions">
              <div className="zh-icon-btn"><Bell size={15}/></div>
              <div className="zh-icon-btn"><Filter size={15}/></div>
            </div>
          </div>
          <div className="zh-tabs">
            {TABS.map((t,i)=>(
              <button key={t} className={`zh-tab ${tab===i?"zh-tab--on":""}`} onClick={()=>setTab(i)}>{t}</button>
            ))}
          </div>
          {tab===0&&<DirectoryTab/>}
          {tab===1&&<OnboardingTab/>}
          {tab===2&&<LeaveTab/>}
          {tab===3&&<AnalyticsTab/>}
        </div>
      </div>
    </>
  );
}

export default function Zephyr() {
  return <ZephyrErrorBoundary><ZephyrCore/></ZephyrErrorBoundary>;
}
