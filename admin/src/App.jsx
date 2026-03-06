import { useState } from "react";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

// ── SEED DATA ─────────────────────────────────────────────────────
const STATS = {
  totalUsers: 1247, newToday: 23, activeToday: 341,
  totalPosts: 8932, postsToday: 147, flaggedContent: 12,
  totalRevenue: 4250000, mrr: 850000,
  challenges: 4, events: 5, resources: 38, news: 24,
};

const USERS = [
  { id:1,  name:"Kaleb Gwalugano",  handle:"kalebu",      email:"kaleb@neurotech.africa", role:"Founder & CEO",  city:"DSM", joined:"Jan 2025", status:"active",   verified:true,  posts:34, badge:"Pro"     },
  { id:2,  name:"Amina Hassan",     handle:"aminahassan",  email:"amina@gmail.com",         role:"ML Engineer",    city:"DSM", joined:"Jan 2025", status:"active",   verified:true,  posts:67, badge:"Pro"     },
  { id:3,  name:"Jonas Kimaro",     handle:"jonaskimaro",  email:"jonas@gmail.com",         role:"AI Architect",   city:"Dodoma", joined:"Feb 2025", status:"active", verified:false, posts:45, badge:"Free"    },
  { id:4,  name:"Fatuma Said",      handle:"fatumasaid",   email:"fatuma@gmail.com",        role:"Data Scientist", city:"Zanzibar", joined:"Feb 2025", status:"active",verified:true,  posts:28, badge:"Basic"   },
  { id:5,  name:"David Mkwawa",     handle:"davidmkwawa",  email:"david@gmail.com",         role:"AI Dev",         city:"Arusha", joined:"Mar 2025", status:"banned", verified:false, posts:3,  badge:"Free"    },
  { id:6,  name:"Grace Mushi",      handle:"gracemushi",   email:"grace@gmail.com",         role:"Student",        city:"DSM", joined:"Mar 2025", status:"active",   verified:false, posts:12, badge:"Free"    },
  { id:7,  name:"Said Omar",        handle:"saidomar",     email:"said@gmail.com",          role:"AI Dev",         city:"Mwanza", joined:"Apr 2025", status:"active", verified:false, posts:19, badge:"Basic"   },
  { id:8,  name:"Lilian Mbise",     handle:"lilianmbise",  email:"lilian@gmail.com",        role:"Designer",       city:"DSM", joined:"Apr 2025", status:"pending",  verified:false, posts:0,  badge:"Free"    },
];

const FLAGGED_POSTS = [
  { id:1, author:"David Mkwawa",  handle:"davidmkwawa", content:"Nunua followers za cheap hapa...", reason:"Spam",        reports:8,  time:"Leo 09:12",  status:"pending"  },
  { id:2, author:"Unknown123",    handle:"unknwn123",    content:"Tuma pesa upate double...",        reason:"Scam",        reports:15, time:"Leo 07:45",  status:"pending"  },
  { id:3, author:"Grace Mushi",   handle:"gracemushi",   content:"Hii model yangu iko GitHub...",    reason:"Off-topic",   reports:2,  time:"Jana 18:30", status:"reviewed" },
  { id:4, author:"Said Omar",     handle:"saidomar",     content:"AI tools za piracy...",            reason:"Prohibited",  reports:6,  time:"Jana 14:20", status:"pending"  },
];

const CHALLENGES_DATA = [
  { id:1, title:"Swahili Sentiment Analysis",  org:"JamiiAI + UDSM",    prize:"TZS 5,000,000",  deadline:"Apr 15", status:"open",      participants:34, color:"#4ECDC4" },
  { id:2, title:"AI kwa Afya: Disease Detect", org:"MOH + JamiiAI",     prize:"TZS 10,000,000", deadline:"May 1",  status:"open",      participants:18, color:"#F87171" },
  { id:3, title:"AgriBot Wakulima",            org:"FAO Tanzania",       prize:"TZS 3,000,000",  deadline:"Mar 30", status:"judging",   participants:67, color:"#34D399" },
  { id:4, title:"Fake News Detector",          org:"JamiiAI Community",  prize:"TZS 2,000,000",  deadline:"Feb 28", status:"completed", participants:89, color:"#A78BFA" },
];

const EVENTS_DATA = [
  { id:1, name:"Tanzania AI Hackathon 2025",  date:"Mar 15–17", type:"Hackathon", status:"upcoming", rsvp:128, color:"#F5A623" },
  { id:2, name:"AI for Agriculture Webinar",  date:"Mar 22",    type:"Webinar",   status:"upcoming", rsvp:67,  color:"#4ECDC4" },
  { id:3, name:"JamiiAI Monthly Meetup DSM",  date:"Apr 1",     type:"Meetup",    status:"upcoming", rsvp:44,  color:"#A78BFA" },
  { id:4, name:"LLMs & Swahili NLP Workshop", date:"Apr 12",    type:"Workshop",  status:"draft",    rsvp:0,   color:"#F87171" },
  { id:5, name:"East Africa AI Summit 2025",  date:"May 20–22", type:"Conference",status:"upcoming", rsvp:892, color:"#60A5FA" },
];

const RESOURCES_DATA = [
  { id:1, title:"Swahili NLP Dataset — 50K",    type:"Dataset",      author:"UDSM",        downloads:1240, status:"approved", color:"#4ECDC4" },
  { id:2, title:"Kuanza na Claude API",         type:"Tutorial",     author:"Davy Mwangi", downloads:567,  status:"approved", color:"#F5A623" },
  { id:3, title:"ML Roadmap Tanzania",          type:"Guide",        author:"JamiiAI",     downloads:2300, status:"approved", color:"#34D399" },
  { id:4, title:"Agricultural AI Dataset TZ",  type:"Dataset",      author:"FarmSmart",   downloads:340,  status:"pending",  color:"#A78BFA" },
  { id:5, title:"LangChain + Swahili RAG",      type:"Tutorial",     author:"Jonas K.",    downloads:890,  status:"pending",  color:"#F87171" },
  { id:6, title:"AI Ethics Afrika",             type:"Research",     author:"NMI",         downloads:430,  status:"approved", color:"#60A5FA" },
];

const NEWS_DATA = [
  { id:1, title:"Tanzania inaanza AI Innovation Hub",    category:"Tanzania", status:"published", reads:1240, time:"Leo 09:30"   },
  { id:2, title:"Claude 4 inabadilisha AI agents",       category:"Global",   status:"published", reads:3450, time:"Jana 15:00"  },
  { id:3, title:"JamiiAI Hackathon — Registrations wazi",category:"Jamii",   status:"published", reads:892,  time:"Jana 11:00"  },
  { id:4, title:"Meta wanafungua Llama 4",               category:"Global",   status:"published", reads:5670, time:"Siku 2"      },
  { id:5, title:"UDSM AI Lab — Apply sasa",              category:"Tanzania", status:"draft",     reads:0,    time:"Draft"       },
  { id:6, title:"AI Startups Funding Q1 2025 Tanzania",  category:"Tanzania", status:"draft",     reads:0,    time:"Draft"       },
];

const WEEKLY = [
  { day:"Jum",  users:34,  posts:89  },
  { day:"Alh",  users:28,  posts:67  },
  { day:"Ijm",  users:45,  posts:112 },
  { day:"Alm",  users:67,  posts:145 },
  { day:"Jtn",  users:89,  posts:198 },
  { day:"Jmt",  users:52,  posts:134 },
  { day:"Leo",  users:73,  posts:147 },
];

const NAV = [
  { id:"dashboard",      icon:"◈", label:"Dashboard"                },
  { id:"users",          icon:"◉", label:"Watumiaji",  badge:"8"    },
  { id:"content",        icon:"◆", label:"Moderation", badge:"12"   },
  { id:"roles",          icon:"◐", label:"Roles"                    },
  { id:"changamoto",     icon:"◇", label:"Changamoto"               },
  { id:"matukio",        icon:"◷", label:"Matukio"                  },
  { id:"rasilimali",     icon:"◧", label:"Rasilimali", badge:"2"    },
  { id:"habari",         icon:"◻", label:"Habari",     badge:"2"    },
  { id:"billing",        icon:"💰", label:"Billing"                  },
  { id:"analytics",      icon:"📊", label:"Analytics"               },
  { id:"announcements",  icon:"📣", label:"Matangazo"               },
  { id:"settings",       icon:"⚙", label:"Settings"                 },
];

// ── HELPERS ───────────────────────────────────────────────────────
function Av({ i, c, s = 34 }) {
  return (
    <div style={{ width:s, height:s, borderRadius:"50%", background:c, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:MONO, fontWeight:700, fontSize:s*.3, color:"#0C0C0E", flexShrink:0 }}>{i}</div>
  );
}

function Badge({ label, color }) {
  return <span style={{ fontFamily:MONO, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${color}18`, color, whiteSpace:"nowrap" }}>{label}</span>;
}

function StatCard({ icon, label, value, sub, color="#F5A623", delta }) {
  return (
    <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:"18px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        {delta && <span style={{ fontFamily:MONO, fontSize:10, color: delta>0 ? "#34D399":"#F87171" }}>{delta>0?"+":""}{delta}% ↑</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color, fontFamily:MONO, letterSpacing:"-0.03em", marginBottom:4 }}>{value}</div>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)" }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ data, valueKey, color, max }) {
  const m = max || Math.max(...data.map(d => d[valueKey]));
  return (
    <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:60 }}>
      {data.map(d => (
        <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ width:"100%", borderRadius:"3px 3px 0 0", background:color, height:`${(d[valueKey]/m)*52}px`, minHeight:4, transition:"height 0.5s ease" }} />
          <span style={{ fontFamily:MONO, fontSize:8, color:"rgba(242,242,245,0.3)" }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ label, color="#F5A623", danger, onClick, small }) {
  return (
    <button onClick={onClick} style={{ background: danger ? "rgba(248,113,113,0.1)" : `${color}15`, color: danger ? "#F87171" : color, border:`1px solid ${danger ? "rgba(248,113,113,0.25)" : `${color}30`}`, padding: small ? "4px 10px" : "7px 14px", borderRadius:7, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize: small ? 11 : 12, transition:"all 0.18s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
      <div>
        <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.02em", marginBottom:3 }}>{title}</h2>
        {sub && <p style={{ fontSize:13, color:"rgba(242,242,245,0.42)", fontWeight:400 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Tbl({ cols, rows }) {
  return (
    <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, overflow:"hidden" }}>
      <div style={{ display:"grid", gridTemplateColumns:cols.map(c=>c.w||"1fr").join(" "), background:"#0C0C0E", borderBottom:"1px solid #232325", padding:"10px 18px" }}>
        {cols.map(c => <div key={c.key} style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)", fontWeight:700, letterSpacing:"0.04em" }}>{c.label}</div>)}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:cols.map(c=>c.w||"1fr").join(" "), padding:"12px 18px", borderBottom: i<rows.length-1 ? "1px solid #1A1A1C" : "none", alignItems:"center" }}>
          {cols.map(c => <div key={c.key}>{row[c.key]}</div>)}
        </div>
      ))}
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={onClose}>
      <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:18, padding:28, width:"100%", maxWidth:520, maxHeight:"80vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ fontWeight:800, fontSize:17, letterSpacing:"-0.02em" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"1px solid #232325", color:"rgba(242,242,245,0.45)", width:30, height:30, borderRadius:7, cursor:"pointer", fontSize:14 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type="text", multiline, options }) {
  const [focused, setFocused] = useState(false);
  const base = { background:"rgba(255,255,255,0.04)", border:`1px solid ${focused?"rgba(245,166,35,0.4)":"#232325"}`, borderRadius:9, padding:"10px 13px", color:"#F2F2F5", fontFamily:"'Inter',sans-serif", fontSize:13, outline:"none", width:"100%", transition:"border-color 0.2s" };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.4)", letterSpacing:"0.04em", display:"block", marginBottom:6 }}>{label}</label>
      {options
        ? <select value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ ...base, appearance:"none", cursor:"pointer" }}>
            {options.map(o=><option key={o} value={o} style={{background:"#161618"}}>{o}</option>)}
          </select>
        : multiline
        ? <textarea value={value} onChange={onChange} rows={3} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ ...base, resize:"vertical", lineHeight:1.6 }} />
        : <input type={type} value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={base} />
      }
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function DashboardPage() {
  return (
    <div>
      <SectionHead title="Dashboard" sub="JamiiAI Community — Overview ya leo" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <StatCard icon="👥" label="Total Members"    value="1,247"   sub="+23 leo"        color="#F5A623"  delta={8}  />
        <StatCard icon="📝" label="Posts Leo"        value="147"     sub="8,932 total"    color="#4ECDC4"  delta={12} />
        <StatCard icon="🚩" label="Flagged Content"  value="12"      sub="Zinahitaji review" color="#F87171" />
        <StatCard icon="💰" label="MRR"              value="850K"    sub="TZS / mwezi"   color="#34D399"  delta={5}  />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
          <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>WATUMIAJI WAPYA — WIKI HII</div>
          <MiniBar data={WEEKLY} valueKey="users" color="#F5A623" />
        </div>
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
          <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>POSTS — WIKI HII</div>
          <MiniBar data={WEEKLY} valueKey="posts" color="#4ECDC4" />
        </div>
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
          <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>PLATFORM STATS</div>
          {[
            ["Challenges Wazi","3","#F5A623"],
            ["Events Yanayokuja","5","#4ECDC4"],
            ["Rasilimali","38","#A78BFA"],
            ["Pending Approval","4","#F87171"],
          ].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1A1A1C" }}>
              <span style={{ fontSize:13, color:"rgba(242,242,245,0.55)" }}>{l}</span>
              <span style={{ fontFamily:MONO, fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
        <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>ACTIVITY YA HIVI KARIBUNI</div>
        {[
          { icon:"👤", msg:"Mtumiaji mpya: Kaleb Gwalugano amejiunga",   time:"Dakika 2",  color:"#34D399" },
          { icon:"🚩", msg:"Post imeflagiwa na watu 8 — David Mkwawa",   time:"Dakika 15", color:"#F87171" },
          { icon:"✅", msg:"Resource imeidhinishwa: ML Roadmap Tanzania", time:"Saa 1",     color:"#4ECDC4" },
          { icon:"🏆", msg:"Challenge mpya imeundwa: AgriBot Wakulima",   time:"Saa 2",     color:"#F5A623" },
          { icon:"📰", msg:"Habari imechapishwa: AI Innovation Hub DSM",  time:"Saa 3",     color:"#A78BFA" },
          { icon:"🎫", msg:"Event mpya: LLMs Workshop — Draft saved",     time:"Saa 4",     color:"#60A5FA" },
        ].map((a,i)=>(
          <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"9px 0", borderBottom: i<5?"1px solid #1A1A1C":"none" }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`${a.color}15`, border:`1px solid ${a.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{a.icon}</div>
            <span style={{ fontSize:13, color:"rgba(242,242,245,0.7)", flex:1 }}>{a.msg}</span>
            <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.28)", flexShrink:0 }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState(USERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Wote");
  const [toast, setToast] = useState(null);

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };

  const filtered = users.filter(u => {
    const matchQ = u.name.toLowerCase().includes(search.toLowerCase()) || u.handle.toLowerCase().includes(search.toLowerCase());
    const matchF = filter==="Wote" || (filter==="Active" && u.status==="active") || (filter==="Banned" && u.status==="banned") || (filter==="Pending" && u.status==="pending") || (filter==="Verified" && u.verified);
    return matchQ && matchF;
  });

  const toggleBan = id => {
    setUsers(us => us.map(u => u.id===id ? { ...u, status: u.status==="banned" ? "active" : "banned" } : u));
    const u = users.find(u=>u.id===id);
    notify(u.status==="banned" ? `✅ ${u.name} ameachiliwa` : `🚫 ${u.name} amebaniwa`);
  };
  const toggleVerify = id => {
    setUsers(us => us.map(u => u.id===id ? { ...u, verified:!u.verified } : u));
    const u = users.find(u=>u.id===id);
    notify(u.verified ? `❌ Verification imeondolewa — ${u.name}` : `✅ ${u.name} ameverified`);
  };

  const STATUS_C = { active:"#34D399", banned:"#F87171", pending:"#F5A623" };

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}
      <SectionHead title="Watumiaji" sub={`Wanachama ${users.length} wote wa JamiiAI`} />

      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tafuta jina au handle..." style={{ background:"#161618", border:"1px solid #232325", borderRadius:9, padding:"9px 12px 9px 32px", color:"#F2F2F5", fontFamily:"'Inter',sans-serif", fontSize:13, outline:"none", width:"100%" }} />
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(242,242,245,0.28)", fontSize:13 }}>◎</span>
        </div>
        {["Wote","Active","Banned","Pending","Verified"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 14px", borderRadius:8, cursor:"pointer", fontFamily:MONO, fontSize:11, fontWeight:700, border:`1px solid ${filter===f?"#F5A623":"#232325"}`, background:filter===f?"rgba(245,166,35,0.1)":"transparent", color:filter===f?"#F5A623":"rgba(242,242,245,0.4)", transition:"all 0.18s" }}>{f}</button>
        ))}
      </div>

      <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 80px 80px 120px", background:"#0C0C0E", borderBottom:"1px solid #232325", padding:"10px 18px" }}>
          {["MTUMIAJI","JUKUMU / MJI","BADGE","STATUS","VERIFIED","VITENDO"].map(h=>(
            <div key={h} style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.32)", fontWeight:700, letterSpacing:"0.04em" }}>{h}</div>
          ))}
        </div>
        {filtered.map((u,i)=>(
          <div key={u.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 80px 80px 120px", padding:"11px 18px", borderBottom:i<filtered.length-1?"1px solid #1A1A1C":"none", alignItems:"center" }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <Av i={u.name.split(" ").map(w=>w[0]).join("").slice(0,2)} c={["#F5A623","#4ECDC4","#A78BFA","#F87171","#34D399","#60A5FA"][u.id%6]} />
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.32)" }}>@{u.handle}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize:12, color:"rgba(242,242,245,0.65)" }}>{u.role}</div>
              <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)" }}>📍{u.city} · {u.posts} posts</div>
            </div>
            <Badge label={u.badge} color={u.badge==="Pro"?"#F5A623":u.badge==="Basic"?"#4ECDC4":"rgba(242,242,245,0.4)"} />
            <div>
              <span style={{ fontFamily:MONO, fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:`${STATUS_C[u.status]}18`, color:STATUS_C[u.status] }}>{u.status}</span>
            </div>
            <div style={{ fontSize:16 }}>{u.verified ? "✅" : "⬜"}</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              <ActionBtn label={u.verified?"Unverify":"Verify"} color="#4ECDC4" small onClick={()=>toggleVerify(u.id)} />
              <ActionBtn label={u.status==="banned"?"Unban":"Ban"} danger={u.status!=="banned"} color="#34D399" small onClick={()=>toggleBan(u.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CONTENT MODERATION ────────────────────────────────────────────
function ContentPage() {
  const [posts, setPosts] = useState(FLAGGED_POSTS);
  const [toast, setToast] = useState(null);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };

  const action = (id, act) => {
    if (act==="delete") {
      setPosts(ps=>ps.filter(p=>p.id!==id));
      notify("🗑 Post imefutwa");
    } else {
      setPosts(ps=>ps.map(p=>p.id===id?{...p,status:"reviewed"}:p));
      notify("✅ Post imeruhusiwa — imepitiwa");
    }
  };

  const REASON_C = { Spam:"#F5A623", Scam:"#F87171", "Off-topic":"#A78BFA", Prohibited:"#F87171" };
  const pending = posts.filter(p=>p.status==="pending");

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}
      <SectionHead title="Content Moderation" sub={`${pending.length} zinasubiri review`} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        <StatCard icon="🚩" label="Pending Review" value={pending.length}     color="#F87171" />
        <StatCard icon="✅" label="Zilizopitishwa"  value={posts.filter(p=>p.status==="reviewed").length} color="#34D399" />
        <StatCard icon="🗑" label="Zilizofutwa"     value="34"  sub="Mwezi huu" color="#A78BFA" />
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {posts.map(p=>(
          <div key={p.id} style={{ background:"#161618", border:`1px solid ${p.status==="pending"?"rgba(248,113,113,0.25)":"#232325"}`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap", marginBottom:8 }}>
                  <Badge label={p.reason} color={REASON_C[p.reason]||"#F87171"} />
                  <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)" }}>🚩 {p.reports} reports</span>
                  <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.28)" }}>{p.time}</span>
                  {p.status==="reviewed" && <Badge label="✓ Reviewed" color="#34D399" />}
                </div>
                <div style={{ fontFamily:MONO, fontSize:11, color:"rgba(242,242,245,0.4)", marginBottom:6 }}>@{p.handle}</div>
                <p style={{ fontSize:14, color:"rgba(242,242,245,0.75)", lineHeight:1.6, background:"rgba(248,113,113,0.05)", border:"1px solid rgba(248,113,113,0.1)", borderRadius:8, padding:"10px 13px" }}>{p.content}</p>
              </div>
              {p.status==="pending" && (
                <div style={{ display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
                  <ActionBtn label="✓ Approve" color="#34D399" onClick={()=>action(p.id,"approve")} />
                  <ActionBtn label="🗑 Delete"  danger onClick={()=>action(p.id,"delete")} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CHANGAMOTO ────────────────────────────────────────────────────
function ChangamotoPage() {
  const [challenges, setChallenges] = useState(CHALLENGES_DATA);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title:"", org:"", prize:"", deadline:"", difficulty:"Kati", desc:"" });
  const [toast, setToast] = useState(null);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };

  const STATUS_C = { open:"#34D399", judging:"#F5A623", completed:"#4ECDC4", closed:"#F87171" };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = () => {
    if (!form.title.trim()) return;
    setChallenges(cs=>[{ id:Date.now(), ...form, status:"open", participants:0, color:["#4ECDC4","#F5A623","#A78BFA","#F87171"][Math.floor(Math.random()*4)] }, ...cs]);
    setForm({ title:"", org:"", prize:"", deadline:"", difficulty:"Kati", desc:"" });
    setShowNew(false);
    notify("✅ Challenge mpya imeundwa!");
  };

  const toggleStatus = (id, next) => {
    setChallenges(cs=>cs.map(c=>c.id===id?{...c,status:next}:c));
    notify(`✅ Status imebadilishwa → ${next}`);
  };

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}
      {showNew && (
        <Modal title="Challenge Mpya ◆" onClose={()=>setShowNew(false)}>
          <FormField label="JINA LA CHALLENGE" value={form.title} onChange={f("title")} placeholder="Swahili Sentiment Analysis..." />
          <FormField label="ORGANIZER" value={form.org} onChange={f("org")} placeholder="JamiiAI + UDSM" />
          <FormField label="PRIZE (TZS)" value={form.prize} onChange={f("prize")} placeholder="5,000,000" />
          <FormField label="DEADLINE" value={form.deadline} onChange={f("deadline")} type="date" />
          <FormField label="UGUMU" value={form.difficulty} onChange={f("difficulty")} options={["Rahisi","Kati","Ngumu"]} />
          <FormField label="MAELEZO" value={form.desc} onChange={f("desc")} placeholder="Elezea challenge..." multiline />
          <button onClick={save} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:14 }}>Hifadhi Challenge →</button>
        </Modal>
      )}

      <SectionHead title="Changamoto" sub="Manage AI challenges na competitions"
        action={<ActionBtn label="+ Challenge Mpya" onClick={()=>setShowNew(true)} />} />

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {challenges.map(ch=>(
          <div key={ch.id} style={{ background:"#161618", border:`1px solid ${ch.color}30`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:4, borderRadius:2, background:ch.color, alignSelf:"stretch", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:7, alignItems:"center" }}>
                  <Badge label={ch.status.toUpperCase()} color={STATUS_C[ch.status]||"#F5A623"} />
                  <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)" }}>{ch.org}</span>
                  <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.28)" }}>👥 {ch.participants} washiriki</span>
                </div>
                <h3 style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{ch.title}</h3>
                <div style={{ display:"flex", gap:14, fontFamily:MONO, fontSize:11, color:"rgba(242,242,245,0.4)" }}>
                  <span>🏆 {ch.prize}</span>
                  <span>📅 {ch.deadline}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:7, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                {ch.status==="open"      && <ActionBtn label="Funga"   color="#F87171" small onClick={()=>toggleStatus(ch.id,"closed")}    />}
                {ch.status==="open"      && <ActionBtn label="Judging" color="#F5A623" small onClick={()=>toggleStatus(ch.id,"judging")}   />}
                {ch.status==="judging"   && <ActionBtn label="Kamilisha" color="#4ECDC4" small onClick={()=>toggleStatus(ch.id,"completed")} />}
                {ch.status==="closed"    && <ActionBtn label="Fungua" color="#34D399" small onClick={()=>toggleStatus(ch.id,"open")}       />}
                <ActionBtn label="✏ Hariri" color="#A78BFA" small />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MATUKIO ───────────────────────────────────────────────────────
function MatukioPage() {
  const [events, setEvents] = useState(EVENTS_DATA);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name:"", date:"", type:"Webinar", loc:"", desc:"" });
  const [toast, setToast] = useState(null);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const TYPE_C = { Hackathon:"#F5A623", Webinar:"#4ECDC4", Meetup:"#A78BFA", Workshop:"#F87171", Conference:"#60A5FA" };
  const STATUS_C = { upcoming:"#34D399", draft:"#F5A623", past:"rgba(242,242,245,0.3)" };

  const save = () => {
    if (!form.name.trim()) return;
    setEvents(es=>[{ id:Date.now(), ...form, status:"draft", rsvp:0, color:TYPE_C[form.type]||"#F5A623" }, ...es]);
    setForm({ name:"", date:"", type:"Webinar", loc:"", desc:"" });
    setShowNew(false);
    notify("✅ Event imeundwa — Draft!");
  };

  const publish = id => {
    setEvents(es=>es.map(e=>e.id===id?{...e,status:"upcoming"}:e));
    notify("🚀 Event imechapishwa!");
  };

  const del = id => { setEvents(es=>es.filter(e=>e.id!==id)); notify("🗑 Event imefutwa"); };

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}
      {showNew && (
        <Modal title="Event Mpya ◷" onClose={()=>setShowNew(false)}>
          <FormField label="JINA LA EVENT" value={form.name} onChange={f("name")} placeholder="Tanzania AI Hackathon..." />
          <FormField label="TAREHE" value={form.date} onChange={f("date")} type="date" />
          <FormField label="AINA" value={form.type} onChange={f("type")} options={["Hackathon","Webinar","Meetup","Workshop","Conference"]} />
          <FormField label="MAHALI" value={form.loc} onChange={f("loc")} placeholder="DSM / Online — Zoom" />
          <FormField label="MAELEZO" value={form.desc} onChange={f("desc")} multiline placeholder="Elezea event..." />
          <button onClick={save} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:14 }}>Hifadhi Draft →</button>
        </Modal>
      )}

      <SectionHead title="Matukio" sub="Manage events na hackathons"
        action={<ActionBtn label="+ Event Mpya" onClick={()=>setShowNew(true)} />} />

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {events.map(ev=>(
          <div key={ev.id} style={{ background:"#161618", border:`1px solid ${ev.status==="draft"?"rgba(245,166,35,0.2)":"#232325"}`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:48, height:48, borderRadius:11, background:`${ev.color}15`, border:`1px solid ${ev.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:MONO, fontSize:9, color:ev.color, fontWeight:700, textAlign:"center", lineHeight:1.4, flexShrink:0, padding:"0 4px" }}>{ev.date}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                  <Badge label={ev.type} color={TYPE_C[ev.type]||"#F5A623"} />
                  <Badge label={ev.status} color={STATUS_C[ev.status]||"#F5A623"} />
                  <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)" }}>👥 {ev.rsvp} RSVPs</span>
                </div>
                <h3 style={{ fontWeight:700, fontSize:14 }}>{ev.name}</h3>
              </div>
              <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                {ev.status==="draft" && <ActionBtn label="🚀 Publish" color="#34D399" small onClick={()=>publish(ev.id)} />}
                <ActionBtn label="✏ Hariri" color="#A78BFA" small />
                <ActionBtn label="🗑" danger small onClick={()=>del(ev.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RASILIMALI ────────────────────────────────────────────────────
function RasilimaliPage() {
  const [resources, setResources] = useState(RESOURCES_DATA);
  const [showNew, setShowNew]     = useState(false);
  const [tab, setTab]             = useState("zote");
  const [form, setForm]           = useState({ title:"", type:"Dataset", author:"JamiiAI", link:"", tags:"", desc:"" });
  const [toast, setToast]         = useState(null);

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };
  const TYPE_C = { Dataset:"#4ECDC4", Tutorial:"#F5A623", Guide:"#34D399", Research:"#A78BFA" };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const approve = id => { setResources(rs=>rs.map(r=>r.id===id?{...r,status:"approved"}:r)); notify("✅ Resource imeidhinishwa!"); };
  const reject  = id => { setResources(rs=>rs.filter(r=>r.id!==id)); notify("🗑 Resource imekataliwa/imefutwa"); };

  const save = () => {
    if (!form.title.trim()) return;
    const color = TYPE_C[form.type] || "#F5A623";
    setResources(rs=>[{
      id: Date.now(), title:form.title, type:form.type,
      author:form.author, link:form.link,
      tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      desc: form.desc, downloads:0, status:"approved", color,
      source:"admin",
    }, ...rs]);
    setForm({ title:"", type:"Dataset", author:"JamiiAI", link:"", tags:"", desc:"" });
    setShowNew(false);
    notify("✅ Resource imeongezwa na kuidhinishwa!");
  };

  const pending  = resources.filter(r=>r.status==="pending");
  const filtered = tab==="zote" ? resources : tab==="pending" ? pending : resources.filter(r=>r.status==="approved");

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}

      {/* Add modal */}
      {showNew && (
        <Modal title="Rasilimali Mpya ◧" onClose={()=>setShowNew(false)}>
          <div style={{ background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.15)", borderRadius:9, padding:"10px 13px", marginBottom:16, fontSize:12, color:"rgba(242,242,245,0.6)", lineHeight:1.6 }}>
            💡 Resources zinazoongezwa na admin <strong style={{color:"#F5A623"}}>zinapita moja kwa moja</strong> — hazipitii approval queue.
          </div>
          <FormField label="JINA LA RESOURCE" value={form.title} onChange={f("title")} placeholder="Swahili NLP Dataset — 50K sentences" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="AINA" value={form.type} onChange={f("type")} options={["Dataset","Tutorial","Guide","Research"]} />
            <FormField label="MWANDISHI / CHANZO" value={form.author} onChange={f("author")} placeholder="JamiiAI / UDSM..." />
          </div>
          <FormField label="LINK (GitHub, Drive, URL)" value={form.link} onChange={f("link")} placeholder="https://github.com/..." />
          <FormField label="TAGS (tenganisha kwa koma)" value={form.tags} onChange={f("tags")} placeholder="NLP, Swahili, Free" />
          <FormField label="MAELEZO MAFUPI" value={form.desc} onChange={f("desc")} multiline placeholder="Elezea resource hii — ni ya nini, inasaidia nani..." />
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={()=>setShowNew(false)} style={{ flex:1, background:"rgba(255,255,255,0.04)", color:"rgba(242,242,245,0.5)", border:"1px solid #232325", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:13 }}>Ghairi</button>
            <button onClick={save} style={{ flex:2, background:"#F5A623", color:"#0C0C0E", border:"none", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:13 }}>✅ Ongeza Resource →</button>
          </div>
        </Modal>
      )}

      <SectionHead
        title="Rasilimali"
        sub={`${resources.length} zote · ${pending.length} zinasubiri idhini`}
        action={<ActionBtn label="+ Resource Mpya" onClick={()=>setShowNew(true)} />}
      />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
        <StatCard icon="📦" label="Resources Zote"     value={resources.length}          color="#4ECDC4" />
        <StatCard icon="⏳" label="Zinasubiri Idhini"  value={pending.length}            color="#F5A623" />
        <StatCard icon="✅" label="Zilizoidhinishwa"    value={resources.filter(r=>r.status==="approved").length} color="#34D399" />
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div onClick={()=>setTab("pending")} style={{ background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
          <span style={{ fontSize:18 }}>⏳</span>
          <span style={{ fontSize:13, color:"rgba(242,242,245,0.7)", flex:1 }}>
            <strong style={{ color:"#F5A623" }}>{pending.length} resource{pending.length>1?"s":""}</strong> zimewasilishwa na community — zinasubiri idhini yako
          </span>
          <span style={{ fontFamily:MONO, fontSize:11, color:"#F5A623" }}>Angalia →</span>
        </div>
      )}

      {/* Tab filter */}
      <div style={{ display:"flex", gap:5, marginBottom:16 }}>
        {[["zote","Zote",resources.length],["pending","Pending",pending.length],["approved","Zilizoidhinishwa",resources.filter(r=>r.status==="approved").length]].map(([id,label,count])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"6px 14px", borderRadius:8, cursor:"pointer", fontFamily:MONO, fontSize:11, fontWeight:700, border:`1px solid ${tab===id?"#F5A623":"#232325"}`, background:tab===id?"rgba(245,166,35,0.1)":"transparent", color:tab===id?"#F5A623":"rgba(242,242,245,0.4)", transition:"all 0.18s" }}>
            {label} <span style={{ opacity:0.6 }}>({count})</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(r=>(
          <div key={r.id} style={{ background:"#161618", border:`1px solid ${r.status==="pending"?"rgba(245,166,35,0.25)":"#232325"}`, borderRadius:14, padding:"14px 18px", transition:"border-color 0.2s" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              {/* Type badge */}
              <div style={{ width:46, height:46, borderRadius:10, background:`${TYPE_C[r.type]||r.color}15`, border:`1px solid ${TYPE_C[r.type]||r.color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontFamily:MONO, fontSize:9, color:TYPE_C[r.type]||r.color, fontWeight:700 }}>{r.type?.slice(0,3).toUpperCase()}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                  <Badge label={r.type} color={TYPE_C[r.type]||r.color} />
                  <Badge label={r.status==="approved"?"✓ Approved":"⏳ Pending"} color={r.status==="approved"?"#34D399":"#F5A623"} />
                  {r.source==="admin" && <Badge label="Admin" color="#A78BFA" />}
                </div>
                <h3 style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{r.title}</h3>
                <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.32)" }}>
                  by {r.author} · ↓ {(r.downloads||0).toLocaleString()} downloads
                  {r.tags?.length > 0 && <span style={{ marginLeft:8 }}>{r.tags.slice(0,3).map(t=>`#${t}`).join(" ")}</span>}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                {r.status==="pending" ? (
                  <>
                    <ActionBtn label="✓ Approve" color="#34D399" small onClick={()=>approve(r.id)} />
                    <ActionBtn label="✕ Reject"  danger small onClick={()=>reject(r.id)} />
                  </>
                ) : (
                  <>
                    <ActionBtn label="✏ Hariri" color="#A78BFA" small />
                    <ActionBtn label="🗑 Remove" danger small onClick={()=>reject(r.id)} />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"48px 0", color:"rgba(242,242,245,0.25)" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>◧</div>
            <div style={{ fontSize:14 }}>Hakuna resources {tab==="pending"?"zinazosubiri":"hapa"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HABARI ────────────────────────────────────────────────────────
// ── APIFY INBOX SEED DATA ─────────────────────────────────────────
const APIFY_INBOX = [
  {
    id:101, title:"Google DeepMind announces Gemini 2.0 Ultra — beats GPT-4o on every benchmark",
    source:"TechCrunch", sourceUrl:"https://techcrunch.com", scrapedAt:"Leo 08:14",
    category:"Global", region:"Global",
    rawSummary:"Google DeepMind has released Gemini 2.0 Ultra, claiming state-of-the-art performance across reasoning, coding, and multimodal benchmarks. The model is now available via Google Cloud API.",
    aiSummary:"Google DeepMind wametoa Gemini 2.0 Ultra — modeli mpya inayodai kushinda GPT-4o kwenye kila kipimo cha majaribio, ikiwa ni pamoja na ufikiriaji, uandishi wa code, na uchanganuzi wa picha. Inapatikana sasa kwa developers kupitia Google Cloud API.",
    tags:["LLMs","Google","Benchmark"], hot:true, status:"inbox",
  },
  {
    id:102, title:"Sarufi.io raises $1.2M seed to expand Swahili NLP platform across East Africa",
    source:"Disrupt Africa", sourceUrl:"https://disrupt-africa.com", scrapedAt:"Leo 07:45",
    category:"Tanzania", region:"Africa",
    rawSummary:"Sarufi, the Tanzanian conversational AI platform, has raised $1.2M in seed funding led by pan-African VC Uncovered Fund. The company plans to expand its Swahili language models to Kenya and Uganda.",
    aiSummary:"Sarufi, kampuni ya AI ya Tanzania inayojengwa na Kaleb Gwalugano, imepata ufadhili wa dola milioni 1.2 kutoka kwa wawekezaji wa Afrika. Fedha hizi zitatumika kupanua modeli za lugha ya Kiswahili kwenye Kenya na Uganda — hatua kubwa kwa teknolojia ya lugha za Afrika.",
    tags:["Tanzania","Funding","NLP","Swahili"], hot:true, status:"inbox",
  },
  {
    id:103, title:"Anthropic releases Claude 4 Opus with 1M token context window",
    source:"VentureBeat", sourceUrl:"https://venturebeat.com", scrapedAt:"Leo 06:30",
    category:"Global", region:"Global",
    rawSummary:"Anthropic has launched Claude 4 Opus featuring a 1 million token context window, improved reasoning, and new tool use capabilities. Pricing starts at $15 per million input tokens.",
    aiSummary:"Anthropic wametoa Claude 4 Opus na uwezo wa kusoma hati zenye maneno milioni moja kwa wakati mmoja — mara tano zaidi ya toleo la awali. Hii inamaanisha developers wa Tanzania wanaweza sasa ku-analyze hati ndefu kwa urahisi zaidi.",
    tags:["Claude","Anthropic","LLMs"], hot:false, status:"inbox",
  },
  {
    id:104, title:"Kenya's AI startup M-Pawa raises $800K to bring ML credit scoring to rural Tanzania",
    source:"TechMoran", sourceUrl:"https://techmoran.com", scrapedAt:"Jana 22:10",
    category:"Africa", region:"Africa",
    rawSummary:"Nairobi-based fintech M-Pawa has secured $800K to expand AI-powered micro-credit services to rural Tanzania, partnering with CRDB Bank.",
    aiSummary:"Startup ya Kenya, M-Pawa, imepata dola 800K ili kuleta huduma za mikopo ya AI vijijini Tanzania kwa ushirikiano na CRDB Bank. Teknolojia yao inatumia historia ya simu ya mkononi kutathmini uwezo wa mkopo badala ya dhamana ya kawaida.",
    tags:["FinTech","Africa","ML","Tanzania"], hot:false, status:"inbox",
  },
  {
    id:105, title:"OpenAI launches GPT-5 with real-time web search and autonomous agent mode",
    source:"The Verge", sourceUrl:"https://theverge.com", scrapedAt:"Jana 18:55",
    category:"Global", region:"Global",
    rawSummary:"OpenAI officially released GPT-5, featuring integrated real-time web search, an autonomous agent mode for multi-step tasks, and improved multilingual support including several African languages.",
    aiSummary:"OpenAI wametoa GPT-5 yenye uwezo wa kutafuta mtandaoni kwa wakati halisi na kufanya kazi ngumu za hatua nyingi bila msaada wa mtu. Toleo hili pia linasaidia lugha zaidi za Kiafrika — habari nzuri kwa watengenezaji programu Afrika.",
    tags:["OpenAI","GPT-5","Agents"], hot:true, status:"inbox",
  },
  {
    id:106, title:"UDSM AI Lab partners with NVIDIA to provide A100 GPU access to Tanzanian researchers",
    source:"Daily News TZ", sourceUrl:"https://dailynews.co.tz", scrapedAt:"Jana 14:20",
    category:"Tanzania", region:"Tanzania",
    rawSummary:"The University of Dar es Salaam AI Research Lab has signed a partnership with NVIDIA's Academic Program, granting Tanzanian AI researchers access to A100 GPUs via cloud credits worth $250,000.",
    aiSummary:"Chuo Kikuu cha Dar es Salaam kimeingia makubaliano na NVIDIA — watafiti wa AI Tanzania watapata ufikiaji wa GPU za kisasa zenye thamani ya dola 250,000. Hii ni fursa kubwa kwa utafiti wa lugha za Kiswahili na AI kwa mazingira ya Afrika.",
    tags:["Tanzania","UDSM","NVIDIA","Research"], hot:false, status:"inbox",
  },
];

const PUBLISHED_NEWS = [
  { id:1, title:"Tanzania inaanza AI Innovation Hub DSM — $2M investment", category:"Tanzania", status:"published", reads:1240, time:"Leo 09:30", source:"Habari Leo", hot:true },
  { id:2, title:"Claude 4 inabadilisha jinsi ya kujenga AI agents",          category:"Global",   status:"published", reads:3450, time:"Jana 15:00", source:"VentureBeat", hot:true },
  { id:3, title:"JamiiAI Hackathon — Registrations zimefunguliwa!",           category:"Jamii",    status:"published", reads:892,  time:"Jana 11:00", source:"JamiiAI", hot:false },
  { id:4, title:"Meta wanafungua Llama 4 — multimodal, open source",          category:"Global",   status:"published", reads:5670, time:"Siku 2",     source:"The Verge", hot:false },
];

function HabariPage() {
  const [inbox, setInbox]         = useState(APIFY_INBOX);
  const [published, setPublished] = useState(PUBLISHED_NEWS);
  const [tab, setTab]             = useState("inbox");
  const [expanded, setExpanded]   = useState(null);
  const [editId, setEditId]       = useState(null);
  const [editSummary, setEditSummary] = useState("");
  const [scraping, setScraping]   = useState(false);
  const [summarizing, setSummarizing] = useState(null);
  const [toast, setToast]         = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ title:"", category:"Tanzania", summary:"", source:"" });

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2800); };
  const CAT_C  = { Tanzania:"#F5A623", Africa:"#4ECDC4", Global:"#A78BFA", Jamii:"#34D399" };
  const mf = k => e => setManualForm(p=>({...p,[k]:e.target.value}));

  // Simulate Apify scrape
  const runScraper = () => {
    setScraping(true);
    setTimeout(() => {
      const newItem = {
        id: Date.now(),
        title:"Africa's AI Investment hits $2.4B in Q1 2025 — East Africa leads growth",
        source:"Quartz Africa", sourceUrl:"https://qz.com/africa", scrapedAt:"Sasa hivi",
        category:"Africa", region:"Africa",
        rawSummary:"A new report from Africa Tech Ventures shows AI investment across the continent reached $2.4 billion in Q1 2025, with East Africa — led by Kenya and Tanzania — accounting for 34% of all deals.",
        aiSummary:"Ripoti mpya inaonyesha uwekezaji wa AI Afrika ulifika dola bilioni 2.4 katika robo ya kwanza ya 2025, na Afrika Mashariki — hasa Kenya na Tanzania — ikiongoza kwa 34% ya mikataba yote. Mwaka huu unatarajiwa kuwa mkubwa zaidi kwa teknolojia ya AI barani Afrika.",
        tags:["Africa","Investment","EastAfrica"], hot:true, status:"inbox",
      };
      setInbox(prev => [newItem, ...prev]);
      setScraping(false);
      notify("✅ Apify imekimbia — habari 1 mpya imepatikana!");
    }, 2800);
  };

  // Simulate AI re-summarize
  const reSummarize = (id) => {
    setSummarizing(id);
    setTimeout(() => {
      setInbox(prev => prev.map(n => n.id===id ? {
        ...n,
        aiSummary: n.aiSummary + " [AI imesasisha muhtasari — toleo jipya la Kiswahili lenye usahihi zaidi.]"
      } : n));
      setSummarizing(null);
      notify("🤖 AI imesasisha muhtasari wa Kiswahili!");
    }, 1800);
  };

  // Publish from inbox
  const publishFromInbox = (item) => {
    const summary = editId===item.id ? editSummary : item.aiSummary;
    setPublished(prev => [{
      id: Date.now(),
      title: item.title,
      category: item.category,
      status: "published",
      reads: 0,
      time: "Sasa",
      source: item.source,
      hot: item.hot,
      summary,
    }, ...prev]);
    setInbox(prev => prev.filter(n => n.id !== item.id));
    setEditId(null);
    notify("🚀 Habari imechapishwa kwenye community feed!");
  };

  // Discard from inbox
  const discard = (id) => {
    setInbox(prev => prev.filter(n => n.id !== id));
    notify("🗑 Habari imeondolewa kutoka inbox");
  };

  // Unpublish
  const unpublish = (id) => {
    setPublished(prev => prev.filter(n => n.id !== id));
    notify("↩ Habari imefutwa kutoka community");
  };

  // Manual publish
  const saveManual = () => {
    if (!manualForm.title.trim()) return;
    setPublished(prev => [{
      id: Date.now(), ...manualForm,
      status:"published", reads:0, time:"Sasa", hot:false,
    }, ...prev]);
    setManualForm({ title:"", category:"Tanzania", summary:"", source:"" });
    setShowManual(false);
    notify("✅ Habari ya manual imechapishwa!");
  };

  const inboxCount     = inbox.length;
  const publishedCount = published.length;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:13, fontFamily:MONO, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}

      {/* Manual modal */}
      {showManual && (
        <Modal title="Habari ya Manual ◻" onClose={()=>setShowManual(false)}>
          <FormField label="KICHWA CHA HABARI" value={manualForm.title} onChange={mf("title")} placeholder="Tanzania inaanza AI Hub..." />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="KATEGORIA" value={manualForm.category} onChange={mf("category")} options={["Tanzania","Africa","Global","Jamii"]} />
            <FormField label="CHANZO" value={manualForm.source} onChange={mf("source")} placeholder="JamiiAI / TechMoran..." />
          </div>
          <FormField label="MUHTASARI (Kiswahili)" value={manualForm.summary} onChange={mf("summary")} multiline placeholder="Elezea habari kwa Kiswahili — mistari 2-3..." />
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={()=>setShowManual(false)} style={{ flex:1, background:"rgba(255,255,255,0.04)", color:"rgba(242,242,245,0.5)", border:"1px solid #232325", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:13 }}>Ghairi</button>
            <button onClick={saveManual} style={{ flex:2, background:"#F5A623", color:"#0C0C0E", border:"none", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:13 }}>🚀 Chapisha Sasa</button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <SectionHead
        title="Habari za AI"
        sub="Apify inascrape kila masaa 6 — angalia inbox na chapisha"
        action={
          <div style={{ display:"flex", gap:8 }}>
            <ActionBtn label="+ Manual" color="#A78BFA" onClick={()=>setShowManual(true)} />
            <button onClick={runScraper} disabled={scraping} style={{ background: scraping ? "rgba(245,166,35,0.1)" : "#F5A623", color: scraping ? "#F5A623" : "#0C0C0E", border: scraping ? "1px solid rgba(245,166,35,0.3)" : "none", padding:"8px 16px", borderRadius:9, cursor: scraping ? "default":"pointer", fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:7, transition:"all 0.2s" }}>
              {scraping
                ? <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span> Inascrape...</>
                : <>⟳ Scrape Sasa</>
              }
            </button>
          </div>
        }
      />

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <StatCard icon="📥" label="Inbox"           value={inboxCount}     color="#F5A623" />
        <StatCard icon="✅" label="Zilizochapishwa" value={publishedCount}  color="#34D399" />
        <StatCard icon="🔥" label="Hot Stories"     value={inbox.filter(n=>n.hot).length} color="#F87171" />
        <StatCard icon="⏰" label="Scrape Ijayo"    value="02:14"           color="#A78BFA" sub="saa:dakika" />
      </div>

      {/* Apify pipeline info */}
      <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:12, padding:"14px 18px", marginBottom:20 }}>
        <div style={{ display:"flex", gap:0, alignItems:"center" }}>
          {[
            { icon:"🌐", label:"Apify Scraper",    sub:"Kila masaa 6",        color:"#4ECDC4", status:"active"  },
            { icon:"→",  label:"",                  sub:"",                    color:"#232325", status:"arrow"   },
            { icon:"🤖", label:"Claude API",         sub:"Inatafsiri Kiswahili",color:"#F5A623", status:"active"  },
            { icon:"→",  label:"",                  sub:"",                    color:"#232325", status:"arrow"   },
            { icon:"📥", label:"Admin Inbox",        sub:`${inboxCount} zinasubiri`, color:"#A78BFA", status:"active" },
            { icon:"→",  label:"",                  sub:"",                    color:"#232325", status:"arrow"   },
            { icon:"📡", label:"Community Feed",     sub:`${publishedCount} zimechapishwa`, color:"#34D399", status:"active" },
          ].map((s,i) => s.status==="arrow"
            ? <div key={i} style={{ fontSize:16, color:"#2C2C2E", margin:"0 8px" }}>→</div>
            : <div key={i} style={{ flex:1, textAlign:"center", padding:"8px 6px" }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontWeight:700, fontSize:11, color:s.color }}>{s.label}</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)", marginTop:2 }}>{s.sub}</div>
              </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:5, marginBottom:18 }}>
        {[["inbox",`📥 Inbox (${inboxCount})`],["published",`✅ Zilizochapishwa (${publishedCount})`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"7px 16px", borderRadius:9, cursor:"pointer", fontFamily:MONO, fontSize:11, fontWeight:700, border:`1px solid ${tab===id?"#F5A623":"#232325"}`, background:tab===id?"rgba(245,166,35,0.1)":"transparent", color:tab===id?"#F5A623":"rgba(242,242,245,0.4)", transition:"all 0.18s" }}>{label}</button>
        ))}
      </div>

      {/* ── INBOX TAB ── */}
      {tab==="inbox" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {inbox.length===0 && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(242,242,245,0.25)" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:14, marginBottom:6 }}>Inbox iko tupu</div>
              <div style={{ fontSize:12 }}>Bonyeza "Scrape Sasa" kupata habari mpya</div>
            </div>
          )}
          {inbox.map(item => {
            const isExpanded  = expanded===item.id;
            const isEditing   = editId===item.id;
            const isSumming   = summarizing===item.id;
            const cc          = CAT_C[item.category]||"#F5A623";
            return (
              <div key={item.id} style={{ background:"#161618", border:`1px solid ${item.hot?"rgba(248,113,113,0.25)":"#232325"}`, borderRadius:14, overflow:"hidden", transition:"border-color 0.2s" }}>
                {/* Item header */}
                <div style={{ padding:"14px 18px", cursor:"pointer" }} onClick={()=>setExpanded(isExpanded?null:item.id)}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                    <Badge label={item.category} color={cc} />
                    <Badge label={item.source}   color="rgba(242,242,245,0.35)" />
                    {item.hot && <Badge label="🔥 Hot" color="#F87171" />}
                    <span style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.28)", marginLeft:"auto" }}>{item.scrapedAt}</span>
                  </div>
                  <h3 style={{ fontWeight:700, fontSize:14, lineHeight:1.4, marginBottom:6 }}>{item.title}</h3>
                  {/* AI summary preview */}
                  <div style={{ background:"rgba(245,166,35,0.05)", border:"1px solid rgba(245,166,35,0.12)", borderRadius:8, padding:"9px 12px" }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5 }}>
                      <span style={{ fontFamily:MONO, fontSize:9, color:"#F5A623", fontWeight:700 }}>🤖 AI SUMMARY — KISWAHILI</span>
                      <button onClick={e=>{e.stopPropagation();reSummarize(item.id);}} disabled={isSumming} style={{ marginLeft:"auto", background:"transparent", border:"1px solid rgba(245,166,35,0.2)", color:"#F5A623", borderRadius:5, padding:"2px 8px", cursor:"pointer", fontFamily:MONO, fontSize:9, fontWeight:700 }}>
                        {isSumming ? "⟳ ..." : "⟳ Sasisha"}
                      </button>
                    </div>
                    <p style={{ fontSize:12, color:"rgba(242,242,245,0.7)", lineHeight:1.65, margin:0 }}>{item.aiSummary}</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop:"1px solid #1E1E20", padding:"14px 18px", background:"rgba(255,255,255,0.015)" }}>
                    {/* Raw original */}
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)", letterSpacing:"0.04em", marginBottom:6 }}>ORIGINAL (English) — {item.source}</div>
                      <p style={{ fontSize:12, color:"rgba(242,242,245,0.45)", lineHeight:1.7, fontStyle:"italic" }}>{item.rawSummary}</p>
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily:MONO, fontSize:10, color:"#4ECDC4", textDecoration:"none", marginTop:4, display:"inline-block" }}>↗ Angalia chanzo asili</a>
                    </div>

                    {/* Edit AI summary */}
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)", letterSpacing:"0.04em" }}>MUHTASARI WA KISWAHILI — HARIRI KABLA YA KUCHAPISHA</div>
                        {!isEditing && (
                          <button onClick={e=>{e.stopPropagation();setEditId(item.id);setEditSummary(item.aiSummary);}} style={{ background:"transparent", border:"1px solid #232325", color:"#A78BFA", borderRadius:6, padding:"3px 10px", cursor:"pointer", fontFamily:MONO, fontSize:9, fontWeight:700 }}>✏ Hariri</button>
                        )}
                      </div>
                      {isEditing
                        ? <textarea value={editSummary} onChange={e=>setEditSummary(e.target.value)} rows={4} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(245,166,35,0.3)", borderRadius:8, padding:"10px 12px", color:"#F2F2F5", fontFamily:"'Inter',sans-serif", fontSize:13, lineHeight:1.65, outline:"none", resize:"vertical" }} />
                        : <p style={{ fontSize:13, color:"rgba(242,242,245,0.75)", lineHeight:1.7 }}>{item.aiSummary}</p>
                      }
                      {isEditing && (
                        <div style={{ display:"flex", gap:7, marginTop:8 }}>
                          <button onClick={()=>{setInbox(prev=>prev.map(n=>n.id===item.id?{...n,aiSummary:editSummary}:n));setEditId(null);notify("✅ Muhtasari umehifadhiwa");}} style={{ background:"rgba(167,139,250,0.1)", color:"#A78BFA", border:"1px solid rgba(167,139,250,0.25)", borderRadius:7, padding:"5px 12px", cursor:"pointer", fontFamily:MONO, fontSize:10, fontWeight:700 }}>💾 Hifadhi</button>
                          <button onClick={()=>setEditId(null)} style={{ background:"transparent", color:"rgba(242,242,245,0.4)", border:"1px solid #232325", borderRadius:7, padding:"5px 12px", cursor:"pointer", fontFamily:MONO, fontSize:10 }}>Ghairi</button>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
                      {item.tags.map(t=><span key={t} style={{ fontFamily:MONO, fontSize:10, padding:"2px 8px", borderRadius:4, background:"rgba(255,255,255,0.05)", color:"rgba(242,242,245,0.45)" }}>#{t}</span>)}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>publishFromInbox(item)} style={{ flex:2, background:"#34D399", color:"#0C0C0E", border:"none", padding:"10px", borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:13 }}>
                        🚀 Chapisha kwenye Community
                      </button>
                      <button onClick={()=>discard(item.id)} style={{ flex:1, background:"rgba(248,113,113,0.08)", color:"#F87171", border:"1px solid rgba(248,113,113,0.2)", padding:"10px", borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:13 }}>
                        🗑 Discard
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick actions bar (collapsed state) */}
                {!isExpanded && (
                  <div style={{ borderTop:"1px solid #1A1A1C", padding:"10px 18px", display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.25)", flex:1 }}>Tags: {item.tags.join(", ")}</span>
                    <button onClick={e=>{e.stopPropagation();publishFromInbox(item);}} style={{ background:"rgba(52,211,153,0.1)", color:"#34D399", border:"1px solid rgba(52,211,153,0.25)", padding:"5px 12px", borderRadius:7, cursor:"pointer", fontFamily:MONO, fontSize:10, fontWeight:700 }}>🚀 Chapisha</button>
                    <button onClick={e=>{e.stopPropagation();discard(item.id);}} style={{ background:"transparent", color:"rgba(248,113,113,0.6)", border:"1px solid rgba(248,113,113,0.15)", padding:"5px 10px", borderRadius:7, cursor:"pointer", fontFamily:MONO, fontSize:10 }}>🗑</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PUBLISHED TAB ── */}
      {tab==="published" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {published.map(n=>(
            <div key={n.id} style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:"14px 18px" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:7, marginBottom:7, alignItems:"center", flexWrap:"wrap" }}>
                    <Badge label={n.category} color={CAT_C[n.category]||"#F5A623"} />
                    <Badge label="✓ Published"  color="#34D399" />
                    {n.hot && <Badge label="🔥 Hot" color="#F87171" />}
                    <span style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.28)" }}>{n.time}</span>
                    {n.reads>0 && <span style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.28)" }}>👁 {n.reads.toLocaleString()}</span>}
                    {n.source && <span style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.22)" }}>· {n.source}</span>}
                  </div>
                  <h3 style={{ fontWeight:600, fontSize:14 }}>{n.title}</h3>
                </div>
                <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                  <ActionBtn label="↩ Unpublish" danger small onClick={()=>unpublish(n.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── ROLES ─────────────────────────────────────────────────────────
const ROLES_DATA = [
  { id:"super_admin", label:"Super Admin",  color:"#F87171", icon:"👑", perms:["all"],                         members:["Davy Mwangi"],               desc:"Ufikiaji kamili wa kila kitu — admin ya admin" },
  { id:"admin",       label:"Admin",        color:"#F5A623", icon:"🛡", perms:["users","content","habari","events","challenges","resources"], members:["Amina Hassan"], desc:"Manage community yote isipokuwa billing na settings" },
  { id:"moderator",   label:"Moderator",    color:"#4ECDC4", icon:"⚖", perms:["content","users_view"],        members:["Jonas Kimaro","Fatuma Said"], desc:"Pitiwa content iliyoflagiwa, ban watu wahalifu" },
  { id:"editor",      label:"Editor",       color:"#A78BFA", icon:"✏", perms:["habari","resources"],          members:["Grace Mushi"],               desc:"Chapisha habari na approve resources" },
  { id:"analyst",     label:"Analyst",      color:"#60A5FA", icon:"📊", perms:["analytics","dashboard_view"], members:[],                            desc:"Angalia analytics na reports tu" },
  { id:"member",      label:"Member",       color:"rgba(242,242,245,0.4)", icon:"👤", perms:["community"],  members:["...wanachama 1,240"],          desc:"Mwanachama wa kawaida wa JamiiAI" },
];

const ALL_PERMS = [
  { id:"all",          label:"Full Access",           group:"System"    },
  { id:"users",        label:"Manage Users",          group:"Community" },
  { id:"users_view",   label:"View Users",            group:"Community" },
  { id:"content",      label:"Moderate Content",      group:"Community" },
  { id:"habari",       label:"Publish News",          group:"Content"   },
  { id:"resources",    label:"Approve Resources",     group:"Content"   },
  { id:"events",       label:"Manage Events",         group:"Content"   },
  { id:"challenges",   label:"Manage Challenges",     group:"Content"   },
  { id:"billing",      label:"View Billing",          group:"Finance"   },
  { id:"analytics",    label:"View Analytics",        group:"Finance"   },
  { id:"dashboard_view",label:"View Dashboard",       group:"System"    },
  { id:"settings",     label:"Edit Settings",         group:"System"    },
  { id:"community",    label:"Use Community",         group:"Community" },
];

function RolesPage() {
  const [roles, setRoles]       = useState(ROLES_DATA);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [assignHandle, setAssignHandle] = useState("");
  const [newRole, setNewRole]   = useState({ label:"", color:"#4ECDC4", desc:"" });

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2400); };
  const sel = roles.find(r=>r.id===selected);

  const togglePerm = (roleId, permId) => {
    setRoles(rs=>rs.map(r=>{
      if (r.id!==roleId) return r;
      const has = r.perms.includes(permId);
      return { ...r, perms: has ? r.perms.filter(p=>p!==permId) : [...r.perms, permId] };
    }));
  };

  const assign = () => {
    if (!assignHandle.trim() || !selected) return;
    setRoles(rs=>rs.map(r=>r.id===selected?{...r,members:[...r.members,assignHandle.trim()]}:r));
    notify(`✅ @${assignHandle} amepewa role ya ${sel?.label}!`);
    setAssignHandle("");
  };

  const removeMember = (roleId, member) => {
    setRoles(rs=>rs.map(r=>r.id===roleId?{...r,members:r.members.filter(m=>m!==member)}:r));
    notify(`↩ ${member} ameondolewa kutoka role`);
  };

  const GROUPS = [...new Set(ALL_PERMS.map(p=>p.group))];

  return (
    <div>
      {toast && <div style={{position:"fixed",bottom:24,right:24,zIndex:999,background:"#F5A623",color:"#0C0C0E",padding:"12px 20px",borderRadius:10,fontWeight:700,fontSize:13,fontFamily:MONO}}>{toast}</div>}
      <SectionHead title="Roles & Permissions" sub="Simamia ufikiaji wa kila mwanachama wa admin team"
        action={<ActionBtn label="+ Role Mpya" onClick={()=>setShowNew(true)} />} />

      {showNew && (
        <Modal title="Role Mpya ◐" onClose={()=>setShowNew(false)}>
          <FormField label="JINA LA ROLE" value={newRole.label} onChange={e=>setNewRole(p=>({...p,label:e.target.value}))} placeholder="Content Manager..." />
          <FormField label="MAELEZO" value={newRole.desc} onChange={e=>setNewRole(p=>({...p,desc:e.target.value}))} placeholder="Nini anaweza kufanya..." />
          <div style={{marginBottom:14}}>
            <label style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.38)",letterSpacing:"0.04em",display:"block",marginBottom:8}}>RANGI</label>
            <div style={{display:"flex",gap:8}}>
              {["#F5A623","#4ECDC4","#A78BFA","#F87171","#34D399","#60A5FA"].map(c=>(
                <div key={c} onClick={()=>setNewRole(p=>({...p,color:c}))} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:newRole.color===c?"3px solid #F2F2F5":"3px solid transparent",transition:"border 0.15s"}} />
              ))}
            </div>
          </div>
          <button onClick={()=>{if(!newRole.label.trim())return;setRoles(rs=>[...rs,{id:Date.now().toString(),label:newRole.label,color:newRole.color,icon:"🎭",perms:[],members:[],desc:newRole.desc}]);setShowNew(false);setNewRole({label:"",color:"#4ECDC4",desc:""});notify("✅ Role mpya imeundwa!");}} style={{width:"100%",background:"#F5A623",color:"#0C0C0E",border:"none",padding:12,borderRadius:9,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:14}}>Unda Role →</button>
        </Modal>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
        {/* Roles list */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {roles.map(r=>(
            <div key={r.id} onClick={()=>setSelected(selected===r.id?null:r.id)} style={{background:"#161618",border:`1px solid ${selected===r.id?r.color+"60":"#232325"}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"all 0.18s"}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                <div style={{width:36,height:36,borderRadius:9,background:`${r.color}18`,border:`1px solid ${r.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{r.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:r.color}}>{r.label}</div>
                  <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)"}}>👥 {r.members.length} watu</div>
                </div>
                <span style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.3)"}}>{selected===r.id?"▲":"▼"}</span>
              </div>
              <p style={{fontSize:12,color:"rgba(242,242,245,0.45)",lineHeight:1.5,marginBottom:8}}>{r.desc}</p>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {r.perms.slice(0,4).map(p=><span key={p} style={{fontFamily:MONO,fontSize:9,padding:"2px 7px",borderRadius:4,background:`${r.color}12`,color:r.color}}>{p}</span>)}
                {r.perms.length>4 && <span style={{fontFamily:MONO,fontSize:9,padding:"2px 7px",borderRadius:4,background:"rgba(255,255,255,0.05)",color:"rgba(242,242,245,0.3)"}}>+{r.perms.length-4}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Edit panel */}
        {sel ? (
          <div style={{background:"#161618",border:`1px solid ${sel.color}40`,borderRadius:14,padding:"18px 20px",position:"sticky",top:80}}>
            <div style={{fontFamily:MONO,fontSize:10,color:sel.color,letterSpacing:"0.04em",marginBottom:16}}>{sel.icon} HARIRI — {sel.label.toUpperCase()}</div>

            {/* Permissions */}
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:10}}>PERMISSIONS</div>
              {GROUPS.map(group=>(
                <div key={group} style={{marginBottom:12}}>
                  <div style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.25)",letterSpacing:"0.05em",marginBottom:6}}>{group.toUpperCase()}</div>
                  {ALL_PERMS.filter(p=>p.group===group).map(p=>{
                    const has = sel.perms.includes(p.id) || sel.perms.includes("all");
                    const locked = sel.id==="super_admin" || sel.id==="member";
                    return (
                      <div key={p.id} onClick={()=>!locked&&togglePerm(sel.id,p.id)} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",cursor:locked?"default":"pointer",opacity:locked?0.5:1}}>
                        <div style={{width:16,height:16,borderRadius:4,background:has?sel.color:"transparent",border:`2px solid ${has?sel.color:"#3C3C3E"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                          {has&&<span style={{color:"#0C0C0E",fontSize:10,fontWeight:900}}>✓</span>}
                        </div>
                        <span style={{fontSize:13,color:has?"#F2F2F5":"rgba(242,242,245,0.45)"}}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Members */}
            <div style={{borderTop:"1px solid #1E1E20",paddingTop:16,marginBottom:16}}>
              <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:10}}>WANACHAMA ({sel.members.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
                {sel.members.map(m=>(
                  <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7}}>
                    <span style={{fontSize:13,fontWeight:500}}>{m}</span>
                    {sel.id!=="super_admin"&&sel.id!=="member"&&<button onClick={()=>removeMember(sel.id,m)} style={{background:"transparent",border:"none",color:"rgba(248,113,113,0.6)",cursor:"pointer",fontSize:12}}>✕</button>}
                  </div>
                ))}
              </div>
              {sel.id!=="member" && (
                <div style={{display:"flex",gap:8}}>
                  <input value={assignHandle} onChange={e=>setAssignHandle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&assign()} placeholder="@handle au email..." style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid #2C2C2E",borderRadius:8,padding:"8px 12px",color:"#F2F2F5",fontFamily:"'Inter',sans-serif",fontSize:13,outline:"none"}} />
                  <button onClick={assign} style={{background:sel.color,color:"#0C0C0E",border:"none",padding:"0 14px",borderRadius:8,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13}}>+ Ongeza</button>
                </div>
              )}
            </div>

            <button onClick={()=>notify(`✅ ${sel.label} permissions zimehifadhiwa!`)} style={{width:"100%",background:"#F5A623",color:"#0C0C0E",border:"none",padding:11,borderRadius:9,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:13}}>Hifadhi Mabadiliko →</button>
          </div>
        ) : (
          <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"40px 24px",textAlign:"center",color:"rgba(242,242,245,0.25)"}}>
            <div style={{fontSize:32,marginBottom:10}}>◐</div>
            <div style={{fontSize:14}}>Chagua role kushoto kuhariri permissions</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BILLING ───────────────────────────────────────────────────────
const INVOICES = [
  { id:"INV-001", user:"Amina Hassan",  plan:"Pro",   amount:150000, date:"Mar 1, 2025",  status:"paid"    },
  { id:"INV-002", user:"Jonas Kimaro",  plan:"Basic", amount:50000,  date:"Mar 1, 2025",  status:"paid"    },
  { id:"INV-003", user:"Fatuma Said",   plan:"Basic", amount:50000,  date:"Mar 1, 2025",  status:"paid"    },
  { id:"INV-004", user:"Said Omar",     plan:"Basic", amount:50000,  date:"Mar 1, 2025",  status:"pending" },
  { id:"INV-005", user:"Grace Mushi",   plan:"Pro",   amount:150000, date:"Feb 1, 2025",  status:"paid"    },
  { id:"INV-006", user:"David Mkwawa",  plan:"Basic", amount:50000,  date:"Feb 1, 2025",  status:"failed"  },
  { id:"INV-007", user:"Lilian Mbise",  plan:"Pro",   amount:150000, date:"Feb 1, 2025",  status:"paid"    },
];

const SUBS = [
  { user:"Amina Hassan",  plan:"Pro",   amount:150000, since:"Jan 2025", nextDate:"Apr 1", status:"active"   },
  { user:"Jonas Kimaro",  plan:"Basic", amount:50000,  since:"Feb 2025", nextDate:"Apr 1", status:"active"   },
  { user:"Fatuma Said",   plan:"Basic", amount:50000,  since:"Feb 2025", nextDate:"Apr 1", status:"active"   },
  { user:"Said Omar",     plan:"Basic", amount:50000,  since:"Mar 2025", nextDate:"Apr 1", status:"past_due" },
  { user:"Grace Mushi",   plan:"Pro",   amount:150000, since:"Jan 2025", nextDate:"Apr 1", status:"active"   },
  { user:"Lilian Mbise",  plan:"Pro",   amount:150000, since:"Jan 2025", nextDate:"Apr 1", status:"active"   },
  { user:"David Mkwawa",  plan:"Basic", amount:50000,  since:"Feb 2025", nextDate:"—",     status:"cancelled"},
];

const MRR_DATA = [
  {month:"Oct",mrr:180},{month:"Nov",mrr:280},{month:"Dec",mrr:410},
  {month:"Jan",mrr:550},{month:"Feb",mrr:710},{month:"Mar",mrr:850},
];

function BillingPage() {
  const [tab, setTab]     = useState("overview");
  const [toast, setToast] = useState(null);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2400); };

  const PLAN_C  = { Pro:"#F5A623", Basic:"#4ECDC4", Free:"rgba(242,242,245,0.3)" };
  const STAT_C  = { active:"#34D399", past_due:"#F87171", cancelled:"rgba(242,242,245,0.3)", paid:"#34D399", pending:"#F5A623", failed:"#F87171" };
  const mrr     = 850000;
  const arr     = mrr * 12;
  const proSubs = SUBS.filter(s=>s.plan==="Pro"&&s.status==="active").length;
  const basicSubs = SUBS.filter(s=>s.plan==="Basic"&&s.status==="active").length;
  const maxMRR  = Math.max(...MRR_DATA.map(d=>d.mrr));

  return (
    <div>
      {toast && <div style={{position:"fixed",bottom:24,right:24,zIndex:999,background:"#F5A623",color:"#0C0C0E",padding:"12px 20px",borderRadius:10,fontWeight:700,fontSize:13,fontFamily:MONO}}>{toast}</div>}
      <SectionHead title="Billing & Subscriptions" sub="Revenue, plans, na malipo ya wanachama" />

      {/* Tabs */}
      <div style={{display:"flex",gap:5,marginBottom:20}}>
        {[["overview","📊 Overview"],["subscriptions","💳 Subscriptions"],["invoices","🧾 Invoices"],["plans","⚙ Plans"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",borderRadius:9,cursor:"pointer",fontFamily:MONO,fontSize:11,fontWeight:700,border:`1px solid ${tab===id?"#F5A623":"#232325"}`,background:tab===id?"rgba(245,166,35,0.1)":"transparent",color:tab===id?"#F5A623":"rgba(242,242,245,0.4)",transition:"all 0.18s"}}>{label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==="overview" && <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          <StatCard icon="💰" label="MRR"       value="850K"    sub="TZS / mwezi"   color="#F5A623" delta={20} />
          <StatCard icon="📈" label="ARR"       value="10.2M"   sub="TZS / mwaka"   color="#34D399" delta={20} />
          <StatCard icon="👑" label="Pro Plans" value={proSubs} sub="@ TZS 150k/mo" color="#A78BFA" />
          <StatCard icon="⭐" label="Basic Plans" value={basicSubs} sub="@ TZS 50k/mo" color="#4ECDC4" />
        </div>

        {/* MRR chart */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
          <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:16}}>MRR GROWTH — MIEZI 6</div>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
            {MRR_DATA.map((d,i)=>(
              <div key={d.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <span style={{fontFamily:MONO,fontSize:9,color:"#F5A623"}}>
                  {i===MRR_DATA.length-1?`${d.mrr}K`:""}
                </span>
                <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:i===MRR_DATA.length-1?"#F5A623":"rgba(245,166,35,0.35)",height:`${(d.mrr/maxMRR)*64}px`,minHeight:6,transition:"height 0.5s ease"}} />
                <span style={{fontFamily:MONO,fontSize:8,color:"rgba(242,242,245,0.3)"}}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan breakdown */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {[
            {plan:"Pro",price:"150,000",count:proSubs,color:"#F5A623",revenue:proSubs*150000},
            {plan:"Basic",price:"50,000",count:basicSubs,color:"#4ECDC4",revenue:basicSubs*50000},
            {plan:"Free",price:"0",count:1240-proSubs-basicSubs,color:"rgba(242,242,245,0.3)",revenue:0},
          ].map(p=>(
            <div key={p.plan} style={{background:"#161618",border:`1px solid ${p.color}25`,borderRadius:14,padding:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontWeight:700,fontSize:14,color:p.color}}>{p.plan}</span>
                <span style={{fontFamily:MONO,fontSize:11,color:"rgba(242,242,245,0.4)"}}>TZS {p.price}</span>
              </div>
              <div style={{fontFamily:MONO,fontSize:24,fontWeight:800,color:p.color,marginBottom:4}}>{p.count}</div>
              <div style={{fontSize:12,color:"rgba(242,242,245,0.4)"}}>wanachama</div>
              {p.revenue>0 && <div style={{fontFamily:MONO,fontSize:11,color:p.color,marginTop:8,borderTop:"1px solid #1E1E20",paddingTop:8}}>TZS {p.revenue.toLocaleString()}/mo</div>}
            </div>
          ))}
        </div>
      </>}

      {/* SUBSCRIPTIONS */}
      {tab==="subscriptions" && (
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 100px",background:"#0C0C0E",borderBottom:"1px solid #232325",padding:"10px 18px"}}>
            {["MTUMIAJI","PLAN","KIASI/MO","TAREHE IJAYO","HALI"].map(h=>(
              <div key={h} style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.32)",fontWeight:700,letterSpacing:"0.04em"}}>{h}</div>
            ))}
          </div>
          {SUBS.map((s,i)=>(
            <div key={s.user} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 100px",padding:"11px 18px",borderBottom:i<SUBS.length-1?"1px solid #1A1A1C":"none",alignItems:"center"}}>
              <span style={{fontWeight:600,fontSize:13}}>{s.user}</span>
              <Badge label={s.plan} color={PLAN_C[s.plan]||"#F5A623"} />
              <span style={{fontFamily:MONO,fontSize:12,color:"rgba(242,242,245,0.6)"}}>TZS {s.amount.toLocaleString()}</span>
              <span style={{fontFamily:MONO,fontSize:11,color:"rgba(242,242,245,0.4)"}}>{s.nextDate}</span>
              <span style={{fontFamily:MONO,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:`${STAT_C[s.status]}18`,color:STAT_C[s.status]}}>{s.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* INVOICES */}
      {tab==="invoices" && (
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr 1fr 100px",background:"#0C0C0E",borderBottom:"1px solid #232325",padding:"10px 18px"}}>
            {["NAMBA","MTUMIAJI","PLAN","KIASI","TAREHE","HALI"].map(h=>(
              <div key={h} style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.32)",fontWeight:700,letterSpacing:"0.04em"}}>{h}</div>
            ))}
          </div>
          {INVOICES.map((inv,i)=>(
            <div key={inv.id} style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr 1fr 100px",padding:"11px 18px",borderBottom:i<INVOICES.length-1?"1px solid #1A1A1C":"none",alignItems:"center"}}>
              <span style={{fontFamily:MONO,fontSize:11,color:"rgba(242,242,245,0.4)"}}>{inv.id}</span>
              <span style={{fontWeight:600,fontSize:13}}>{inv.user}</span>
              <Badge label={inv.plan} color={PLAN_C[inv.plan]||"#F5A623"} />
              <span style={{fontFamily:MONO,fontSize:12}}>TZS {inv.amount.toLocaleString()}</span>
              <span style={{fontFamily:MONO,fontSize:11,color:"rgba(242,242,245,0.4)"}}>{inv.date}</span>
              <span style={{fontFamily:MONO,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:`${STAT_C[inv.status]}18`,color:STAT_C[inv.status]}}>{inv.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* PLANS */}
      {tab==="plans" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {[
            { name:"Free", price:"0", color:"rgba(242,242,245,0.5)", features:["Mazungumzo 50/mwezi","Basic community access","Read-only rasilimali"], limits:"50 msgs/mo" },
            { name:"Basic", price:"50,000", color:"#4ECDC4", features:["Mazungumzo 500/mwezi","Full community access","Download rasilimali","Shiriki changamoto"], limits:"500 msgs/mo" },
            { name:"Pro", price:"150,000", color:"#F5A623", features:["Mazungumzo 5,000/mwezi","Priority support","AI assistant bila mipaka","Analytics ya profile","Featured kwenye directory"], limits:"5000 msgs/mo" },
          ].map(plan=>(
            <div key={plan.name} style={{background:"#161618",border:`1px solid ${plan.color}35`,borderRadius:16,padding:"20px"}}>
              <div style={{fontWeight:800,fontSize:18,color:plan.color,marginBottom:4}}>{plan.name}</div>
              <div style={{fontFamily:MONO,fontSize:22,fontWeight:800,marginBottom:4}}>TZS {plan.price}<span style={{fontSize:12,color:"rgba(242,242,245,0.35)"}}>/mo</span></div>
              <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.3)",marginBottom:16}}>{plan.limits}</div>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>
                {plan.features.map(f=>(
                  <div key={f} style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:plan.color,fontSize:12}}>✓</span>
                    <span style={{fontSize:13,color:"rgba(242,242,245,0.65)"}}>{f}</span>
                  </div>
                ))}
              </div>
              <ActionBtn label="✏ Hariri Plan" color={plan.color} onClick={()=>notify(`✏ Editing ${plan.name} plan...`)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────
const DAILY_USERS = [
  {d:"M",u:145,p:89},{d:"T",u:198,p:134},{d:"W",u:167,p:102},
  {d:"T",u:234,p:178},{d:"F",u:289,p:201},{d:"S",u:178,p:123},{d:"S",u:312,p:256},
];
const TOP_CONTENT = [
  {title:"Swahili NLP Dataset — 50K",type:"Resource",views:2340,likes:189,section:"Rasilimali"},
  {title:"Tanzania AI Hackathon 2025",type:"Event",views:1890,likes:342,section:"Matukio"},
  {title:"AI kwa Afya challenge",type:"Challenge",views:1456,likes:267,section:"Changamoto"},
  {title:"Kuanza na Claude API",type:"Tutorial",views:1230,likes:145,section:"Rasilimali"},
  {title:"JamiiAI imefika watu 1000!",type:"Post",views:987,likes:432,section:"Feed"},
];
const TRAFFIC = [
  {source:"Direct",pct:34,color:"#F5A623"},
  {source:"Google",pct:28,color:"#4ECDC4"},
  {source:"Twitter/X",pct:18,color:"#A78BFA"},
  {source:"LinkedIn",pct:12,color:"#60A5FA"},
  {source:"WhatsApp",pct:8,color:"#34D399"},
];
const RETENTION = [
  {week:"Wiki 1",rate:100},{week:"Wiki 2",rate:68},{week:"Wiki 3",rate:54},
  {week:"Wiki 4",rate:47},{week:"Wiki 8",rate:38},{week:"Wiki 12",rate:31},
];

function AnalyticsPage() {
  const [range, setRange] = useState("wiki");
  const maxU = Math.max(...DAILY_USERS.map(d=>d.u));
  const maxP = Math.max(...DAILY_USERS.map(d=>d.p));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,letterSpacing:"-0.02em",marginBottom:3}}>Analytics</h2>
          <p style={{fontSize:13,color:"rgba(242,242,245,0.42)"}}>Jinsi JamiiAI inavyokua — data ya kweli</p>
        </div>
        <div style={{display:"flex",gap:5}}>
          {["leo","wiki","mwezi"].map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={{padding:"6px 14px",borderRadius:8,cursor:"pointer",fontFamily:MONO,fontSize:11,fontWeight:700,border:`1px solid ${range===r?"#F5A623":"#232325"}`,background:range===r?"rgba(245,166,35,0.1)":"transparent",color:range===r?"#F5A623":"rgba(242,242,245,0.4)",transition:"all 0.18s",textTransform:"capitalize"}}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard icon="👥" label="DAU"            value="312"  sub="Daily Active Users"    color="#F5A623" delta={8}  />
        <StatCard icon="🔁" label="Retention (30d)" value="31%" sub="Wanarudi baada ya mwezi" color="#4ECDC4" delta={3}  />
        <StatCard icon="📈" label="Conversion"      value="4.2%" sub="Free → Paid"           color="#34D399" delta={1}  />
        <StatCard icon="⏱" label="Avg Session"      value="8.4m" sub="Dakika per visit"      color="#A78BFA" delta={12} />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        {/* Users + Posts chart */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px"}}>
          <div style={{display:"flex",gap:16,marginBottom:14,alignItems:"center"}}>
            <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",flex:1}}>WATUMIAJI & POSTS — WIKI HII</div>
            <div style={{display:"flex",gap:12}}>
              <div style={{display:"flex",gap:5,alignItems:"center"}}><div style={{width:10,height:3,background:"#F5A623",borderRadius:2}}/><span style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.4)"}}>Users</span></div>
              <div style={{display:"flex",gap:5,alignItems:"center"}}><div style={{width:10,height:3,background:"#4ECDC4",borderRadius:2}}/><span style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.4)"}}>Posts</span></div>
            </div>
          </div>
          <div style={{display:"flex",gap:5,alignItems:"flex-end",height:90}}>
            {DAILY_USERS.map(d=>(
              <div key={d.d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:72}}>
                  <div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#F5A623",height:`${(d.u/maxU)*72}px`,minHeight:4}} />
                  <div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#4ECDC4",height:`${(d.p/maxP)*72}px`,minHeight:4}} />
                </div>
                <span style={{fontFamily:MONO,fontSize:8,color:"rgba(242,242,245,0.3)"}}>{d.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic sources */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px"}}>
          <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:14}}>TRAFFIC SOURCES</div>
          {TRAFFIC.map(t=>(
            <div key={t.source} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:500}}>{t.source}</span>
                <span style={{fontFamily:MONO,fontSize:11,color:t.color}}>{t.pct}%</span>
              </div>
              <div style={{height:4,borderRadius:2,background:"#232325",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${t.pct}%`,background:t.color,borderRadius:2,transition:"width 0.6s ease"}} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* Retention */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px"}}>
          <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:14}}>USER RETENTION</div>
          <div style={{display:"flex",gap:5,alignItems:"flex-end",height:72}}>
            {RETENTION.map(r=>(
              <div key={r.week} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontFamily:MONO,fontSize:8,color:"#4ECDC4"}}>{r.rate}%</span>
                <div style={{width:"100%",borderRadius:"3px 3px 0 0",background:`rgba(78,205,196,${r.rate/100*0.8+0.1})`,height:`${(r.rate/100)*52}px`,minHeight:4}} />
                <span style={{fontFamily:MONO,fontSize:7,color:"rgba(242,242,245,0.25)",textAlign:"center",lineHeight:1.2}}>{r.week.replace("Wiki ","W")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top content */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px"}}>
          <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:14}}>TOP CONTENT — WIKI HII</div>
          {TOP_CONTENT.map((c,i)=>(
            <div key={c.title} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",borderBottom:i<TOP_CONTENT.length-1?"1px solid #1A1A1C":"none"}}>
              <span style={{fontFamily:MONO,fontSize:11,color:"rgba(242,242,245,0.2)",width:16,flexShrink:0}}>#{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
                <div style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.3)"}}>{c.section} · 👁 {c.views.toLocaleString()} · ♥ {c.likes}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────
const SENT_ANNOUNCEMENTS = [
  { id:1, title:"Hackathon registrations zimefunguliwa!",  target:"Wote",     channel:"in-app,email", sent:"Leo 10:00",   reach:1247, opens:834  },
  { id:2, title:"JamiiAI itakuwa down Ijumaa 2AM-4AM",    target:"Wote",     channel:"in-app",       sent:"Jana 16:30",  reach:1247, opens:567  },
  { id:3, title:"Pro plan yako inaisha kesho",             target:"Pro",      channel:"email",        sent:"Jana 09:00",  reach:6,    opens:5    },
  { id:4, title:"Challenge mpya: AgriBot Wakulima",        target:"Wote",     channel:"in-app,email", sent:"Siku 3",      reach:1247, opens:923  },
];

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(SENT_ANNOUNCEMENTS);
  const [showNew, setShowNew]   = useState(false);
  const [preview, setPreview]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [form, setForm]         = useState({
    title:"", body:"", target:"Wote",
    channels:{ inapp:true, email:false, whatsapp:false },
    schedule:"now", scheduleTime:"",
  });

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2400); };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const toggleCh = ch => setForm(p=>({...p,channels:{...p.channels,[ch]:!p.channels[ch]}}));

  const TARGETS = ["Wote","Free","Basic","Pro","Wataalamu","Waliojiunga leo"];
  const targetCount = { Wote:1247, Free:1205, Basic:28, Pro:14, Wataalamu:89, "Waliojiunga leo":23 };

  const send = () => {
    if (!form.title.trim()||!form.body.trim()) return;
    const chs = Object.entries(form.channels).filter(([,v])=>v).map(([k])=>k==="inapp"?"in-app":k).join(",");
    setAnnouncements(prev=>[{
      id:Date.now(), title:form.title, target:form.target,
      channel:chs, sent:"Sasa hivi",
      reach:targetCount[form.target]||0, opens:0,
    },...prev]);
    setForm({title:"",body:"",target:"Wote",channels:{inapp:true,email:false,whatsapp:false},schedule:"now",scheduleTime:""});
    setShowNew(false);
    notify("📣 Tangazo limetumwa!");
  };

  const inputS = { background:"rgba(255,255,255,0.04)", border:"1px solid #2C2C2E", borderRadius:9, padding:"10px 13px", color:"#F2F2F5", fontFamily:"'Inter',sans-serif", fontSize:13, outline:"none", width:"100%", transition:"border-color 0.2s" };

  return (
    <div>
      {toast && <div style={{position:"fixed",bottom:24,right:24,zIndex:999,background:"#F5A623",color:"#0C0C0E",padding:"12px 20px",borderRadius:10,fontWeight:700,fontSize:13,fontFamily:MONO}}>{toast}</div>}

      <SectionHead title="Matangazo" sub="Wasiliana na community yako yote kwa wakati mmoja"
        action={<ActionBtn label="+ Tangazo Jipya" onClick={()=>{setShowNew(true);setPreview(false);}} />} />

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <StatCard icon="📣" label="Yaliyotumwa"    value={announcements.length} color="#F5A623" />
        <StatCard icon="👁" label="Total Reach"    value="4,884"               color="#4ECDC4" sub="impressions zote" />
        <StatCard icon="📧" label="Avg Open Rate"  value="67%"                 color="#34D399" delta={5} />
        <StatCard icon="👥" label="Wanachama Wote" value="1,247"               color="#A78BFA" />
      </div>

      {/* Compose form */}
      {showNew && (
        <div style={{background:"#161618",border:"1px solid rgba(245,166,35,0.25)",borderRadius:16,padding:"20px 22px",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div style={{fontFamily:MONO,fontSize:10,color:"#F5A623",letterSpacing:"0.04em"}}>📣 UNDA TANGAZO JIPYA</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setPreview(!preview)} style={{background:preview?"rgba(167,139,250,0.1)":"transparent",color:preview?"#A78BFA":"rgba(242,242,245,0.4)",border:`1px solid ${preview?"rgba(167,139,250,0.3)":"#232325"}`,padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:MONO,fontSize:10,fontWeight:700}}>👁 Preview</button>
              <button onClick={()=>setShowNew(false)} style={{background:"transparent",border:"1px solid #232325",color:"rgba(242,242,245,0.4)",padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:MONO,fontSize:10}}>✕</button>
            </div>
          </div>

          {!preview ? (
            <>
              <div style={{marginBottom:14}}>
                <label style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.38)",letterSpacing:"0.04em",display:"block",marginBottom:6}}>KICHWA (SUBJECT)</label>
                <input value={form.title} onChange={f("title")} placeholder="Hackathon registrations zimefunguliwa! 🚀" style={inputS} />
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.38)",letterSpacing:"0.04em",display:"block",marginBottom:6}}>UJUMBE</label>
                <textarea value={form.body} onChange={f("body")} rows={4} placeholder="Andika tangazo lako hapa — linaweza kuwa Kiswahili au Kiingereza..." style={{...inputS,resize:"vertical",lineHeight:1.65}} />
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                {/* Target */}
                <div>
                  <label style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.38)",letterSpacing:"0.04em",display:"block",marginBottom:8}}>WAPOKEAJI</label>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {TARGETS.map(t=>(
                      <div key={t} onClick={()=>setForm(p=>({...p,target:t}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,border:`1px solid ${form.target===t?"rgba(245,166,35,0.3)":"#232325"}`,background:form.target===t?"rgba(245,166,35,0.07)":"transparent",cursor:"pointer",transition:"all 0.15s"}}>
                        <span style={{fontSize:13,fontWeight:form.target===t?700:500,color:form.target===t?"#F5A623":"rgba(242,242,245,0.6)"}}>{t}</span>
                        <span style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.3)"}}>{targetCount[t]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channels + Schedule */}
                <div>
                  <label style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.38)",letterSpacing:"0.04em",display:"block",marginBottom:8}}>CHANNELS</label>
                  {[["inapp","🔔 In-App Notification","Inaonekana ndani ya app"],["email","📧 Email","Inatumwa kwa barua pepe"],["whatsapp","💬 WhatsApp","Inahitaji Meta API key"]].map(([k,label,sub])=>(
                    <div key={k} onClick={()=>toggleCh(k)} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 12px",borderRadius:8,border:`1px solid ${form.channels[k]?"rgba(78,205,196,0.3)":"#232325"}`,background:form.channels[k]?"rgba(78,205,196,0.07)":"transparent",cursor:"pointer",marginBottom:6,transition:"all 0.15s"}}>
                      <div style={{width:16,height:16,borderRadius:4,background:form.channels[k]?"#4ECDC4":"transparent",border:`2px solid ${form.channels[k]?"#4ECDC4":"#3C3C3E"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {form.channels[k]&&<span style={{color:"#0C0C0E",fontSize:9,fontWeight:900}}>✓</span>}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{label}</div>
                        <div style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.3)"}}>{sub}</div>
                      </div>
                    </div>
                  ))}

                  <div style={{marginTop:14}}>
                    <label style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.38)",letterSpacing:"0.04em",display:"block",marginBottom:8}}>TUMA LINI</label>
                    <div style={{display:"flex",gap:6}}>
                      {[["now","Sasa"],["schedule","Panga Wakati"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setForm(p=>({...p,schedule:v}))} style={{flex:1,padding:"8px",borderRadius:8,cursor:"pointer",fontFamily:MONO,fontSize:11,fontWeight:700,border:`1px solid ${form.schedule===v?"#F5A623":"#232325"}`,background:form.schedule===v?"rgba(245,166,35,0.1)":"transparent",color:form.schedule===v?"#F5A623":"rgba(242,242,245,0.4)",transition:"all 0.18s"}}>{l}</button>
                      ))}
                    </div>
                    {form.schedule==="schedule" && <input type="datetime-local" value={form.scheduleTime} onChange={f("scheduleTime")} style={{...inputS,marginTop:8}} />}
                  </div>
                </div>
              </div>

              <div style={{background:"rgba(245,166,35,0.06)",border:"1px solid rgba(245,166,35,0.15)",borderRadius:9,padding:"10px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:16}}>📊</span>
                <span style={{fontSize:13,color:"rgba(242,242,245,0.6)"}}>Tangazo hili litawafikia <strong style={{color:"#F5A623"}}>{targetCount[form.target]||0} wanachama</strong> kupitia {Object.entries(form.channels).filter(([,v])=>v).length} channel(s)</span>
              </div>

              <button onClick={send} disabled={!form.title.trim()||!form.body.trim()} style={{width:"100%",background:form.title.trim()&&form.body.trim()?"#F5A623":"#1C1C1E",color:form.title.trim()&&form.body.trim()?"#0C0C0E":"rgba(242,242,245,0.2)",border:"none",padding:12,borderRadius:9,cursor:form.title.trim()&&form.body.trim()?"pointer":"default",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:14,transition:"all 0.2s"}}>
                {form.schedule==="now"?"📣 Tuma Sasa →":"⏰ Panga Kutuma →"}
              </button>
            </>
          ) : (
            /* Preview */
            <div>
              <div style={{background:"#0C0C0E",border:"1px solid #232325",borderRadius:12,padding:"20px",marginBottom:14}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12}}>
                  <div style={{width:36,height:36,borderRadius:8,background:"#F5A623",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🌍</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>JamiiAI</div>
                    <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)"}}>Tangazo la Admin · Sasa hivi</div>
                  </div>
                </div>
                <h3 style={{fontWeight:800,fontSize:16,marginBottom:8}}>{form.title||"Kichwa kitaonekana hapa..."}</h3>
                <p style={{fontSize:14,color:"rgba(242,242,245,0.7)",lineHeight:1.7}}>{form.body||"Ujumbe utaonekana hapa..."}</p>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <Badge label={`👥 ${form.target} — ${targetCount[form.target]} watu`} color="#F5A623" />
                {form.channels.inapp && <Badge label="🔔 In-App" color="#4ECDC4" />}
                {form.channels.email && <Badge label="📧 Email" color="#A78BFA" />}
                {form.channels.whatsapp && <Badge label="💬 WhatsApp" color="#34D399" />}
              </div>
              <button onClick={()=>setPreview(false)} style={{width:"100%",background:"transparent",color:"rgba(242,242,245,0.5)",border:"1px solid #232325",padding:11,borderRadius:9,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:13,marginTop:14}}>← Rudi Kuhariri</button>
            </div>
          )}
        </div>
      )}

      {/* Sent list */}
      <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",background:"#0C0C0E",borderBottom:"1px solid #232325",padding:"10px 18px"}}>
          {["TANGAZO","WAPOKEAJI","CHANNELS","REACH","OPENS"].map(h=>(
            <div key={h} style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.32)",fontWeight:700,letterSpacing:"0.04em"}}>{h}</div>
          ))}
        </div>
        {announcements.map((a,i)=>(
          <div key={a.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"12px 18px",borderBottom:i<announcements.length-1?"1px solid #1A1A1C":"none",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{a.title}</div>
              <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.28)"}}>{a.sent}</div>
            </div>
            <Badge label={a.target} color="#F5A623" />
            <span style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.4)"}}>{a.channel}</span>
            <span style={{fontFamily:MONO,fontSize:12,fontWeight:700}}>{a.reach.toLocaleString()}</span>
            <span style={{fontFamily:MONO,fontSize:12,color:"#34D399"}}>{a.opens>0?`${a.opens} (${Math.round(a.opens/a.reach*100)}%)`:"—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────────────────
function SettingsPage() {
  const [toast, setToast]   = useState(null);
  const [saved, setSaved]   = useState({});
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2400); };

  // API Keys state
  const [keys, setKeys] = useState({
    anthropic:    { value:"sk-ant-••••••••••••••••••••••••••••••••••••", visible:false, status:"connected", label:"Anthropic (Claude API)",   hint:"Inatumika: AI summaries za habari, Kiswahili translation", color:"#F5A623"  },
    apify:        { value:"apify_api_••••••••••••••••••••••••••••",       visible:false, status:"connected", label:"Apify API Token",           hint:"Inatumika: Scraping ya habari za AI kila masaa 6",         color:"#4ECDC4"  },
    meta:         { value:"",                                              visible:false, status:"missing",   label:"Meta (WhatsApp/Instagram)", hint:"Inahitajika: Notifications za WhatsApp kwa wanachama",     color:"#60A5FA"  },
    smtp_pass:    { value:"",                                              visible:false, status:"missing",   label:"SMTP Password (Email)",     hint:"Inahitajika: Kutuma barua pepe za welcome, notifications", color:"#A78BFA"  },
    stripe:       { value:"",                                              visible:false, status:"optional",  label:"Stripe Secret Key",         hint:"Optional: Malipo ya subscription (Basic/Pro plans)",       color:"#34D399"  },
    railway_db:   { value:"postgresql://postgres:••••@••••.railway.app",  visible:false, status:"connected", label:"DATABASE_URL (Railway)",    hint:"Auto-set na Railway — usibadilishe isipokuwa lazima",      color:"#34D399"  },
    jwt:          { value:"••••••••••••••••••••••••••••••••••••••••••••", visible:false, status:"connected", label:"JWT_SECRET",                hint:"Secret ya authentication tokens — lazima iwe strong 64+ chars", color:"#34D399" },
  });

  // Apify settings
  const [apify, setApify] = useState({
    schedule:       "6",
    sources:        { techcrunch:true, venturebeat:true, techmoran:true, disruptafrica:true, twitterai:false, bbc:false },
    keywords_tz:    "Tanzania AI, JamiiAI, UDSM AI, Sarufi, Neurotech Africa",
    keywords_af:    "Africa AI, East Africa tech, Kenya AI, Nigeria AI",
    keywords_gl:    "artificial intelligence, LLM, Claude, GPT, Gemini, machine learning",
    autoPublish:    false,
    summaryLang:    "Kiswahili",
  });

  // Platform settings
  const [platform, setPlatform] = useState({
    siteName:       "JamiiAI",
    siteUrl:        "https://jamii.ai",
    adminEmail:     "admin@jamii.ai",
    smtpHost:       "smtp.gmail.com",
    smtpPort:       "587",
    smtpUser:       "noreply@jamii.ai",
    maintenanceMode: false,
    registrationOpen: true,
    requireApproval: false,
    maxFreeMessages: "50",
  });

  // Sections state
  const [section, setSection] = useState("api");

  const toggleVisible = k => setKeys(prev=>({...prev,[k]:{...prev[k],visible:!prev[k].visible}}));
  const updateKey     = (k,v) => setKeys(prev=>({...prev,[k]:{...prev[k],value:v}}));
  const saveKey       = k => {
    setSaved(s=>({...s,[k]:true}));
    setTimeout(()=>setSaved(s=>({...s,[k]:false})),2000);
    notify(`✅ ${keys[k].label} imehifadhiwa!`);
  };
  const testConnection = k => notify(`🔄 Testing ${keys[k].label}... Connected ✅`);
  const ap = k => e => setApify(p=>({...p,[k]:e.target.value}));
  const pp = k => e => setPlatform(p=>({...p,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));

  const STATUS_C = { connected:"#34D399", missing:"#F87171", optional:"rgba(242,242,245,0.3)" };
  const STATUS_L = { connected:"● Connected", missing:"● Missing", optional:"● Optional" };

  const inputS = (focus) => ({ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${focus?"rgba(245,166,35,0.4)":"#2C2C2E"}`, borderRadius:9, padding:"10px 13px", color:"#F2F2F5", fontFamily:"'Inter',sans-serif", fontSize:13, outline:"none", transition:"border-color 0.2s" });

  function FocusInput({ value, onChange, placeholder, type="text" }) {
    const [f,setF] = useState(false);
    return <input type={type} value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={inputS(f)} />;
  }

  function Toggle({ checked, onChange, label, sub }) {
    return (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #1A1A1C" }}>
        <div>
          <div style={{ fontWeight:600, fontSize:13 }}>{label}</div>
          {sub && <div style={{ fontSize:12, color:"rgba(242,242,245,0.4)", marginTop:2 }}>{sub}</div>}
        </div>
        <div onClick={onChange} style={{ width:42, height:24, borderRadius:12, background:checked?"#F5A623":"#2C2C2E", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
          <div style={{ position:"absolute", top:3, left:checked?20:3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
        </div>
      </div>
    );
  }

  const SECTIONS = [
    { id:"api",      label:"🔑 API Keys"       },
    { id:"apify",    label:"🕷 Apify / Scraper"  },
    { id:"platform", label:"⚙ Platform"         },
    { id:"smtp",     label:"📧 Email (SMTP)"     },
    { id:"danger",   label:"🚨 Danger Zone"      },
  ];

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:13, fontFamily:MONO, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>{toast}</div>}

      <SectionHead title="Settings" sub="API keys, integrations, na mipangilio ya platform" />

      {/* Status overview */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        {[
          ["🔑","API Keys","3/7 connected","#F5A623"],
          ["🕷","Apify Scraper","Active — kila masaa 6","#4ECDC4"],
          ["📧","Email (SMTP)","Haijawekwa","#F87171"],
        ].map(([icon,label,sub,color])=>(
          <div key={label} style={{ background:"#161618", border:`1px solid ${color}25`, borderRadius:12, padding:"14px 16px", display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:38, height:38, borderRadius:9, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:13 }}>{label}</div>
              <div style={{ fontFamily:MONO, fontSize:10, color, marginTop:2 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:16, alignItems:"start" }}>

        {/* Left nav */}
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:8, position:"sticky", top:80 }}>
          {SECTIONS.map(s=>(
            <div key={s.id} onClick={()=>setSection(s.id)} style={{ padding:"10px 12px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:section===s.id?700:500, color:section===s.id?"#F5A623":"rgba(242,242,245,0.55)", background:section===s.id?"rgba(245,166,35,0.08)":"transparent", transition:"all 0.15s", marginBottom:2 }}>
              {s.label}
            </div>
          ))}
        </div>

        {/* Right content */}
        <div>

          {/* ── API KEYS ── */}
          {section==="api" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.15)", borderRadius:12, padding:"12px 16px", fontSize:12, color:"rgba(242,242,245,0.55)", lineHeight:1.7 }}>
                🔒 API keys zimehifadhiwa kwenye Railway Environment Variables — hazionekani wazi. Ili kubadilisha key halisi, nenda Railway Dashboard → Variables.
              </div>
              {Object.entries(keys).map(([k, key]) => (
                <div key={k} style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{key.label}</div>
                      <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)", marginBottom:4 }}>{key.hint}</div>
                      <span style={{ fontFamily:MONO, fontSize:10, fontWeight:700, color:STATUS_C[key.status] }}>{STATUS_L[key.status]}</span>
                    </div>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:STATUS_C[key.status], flexShrink:0, marginTop:4 }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1, position:"relative" }}>
                      <input
                        type={key.visible?"text":"password"}
                        value={key.value}
                        onChange={e=>updateKey(k,e.target.value)}
                        placeholder={key.status==="missing"?"Weka key hapa...":"••••••••••••••••••••••"}
                        style={{ ...inputS(false), paddingRight:80, fontFamily:MONO, fontSize:12 }}
                      />
                      <button onClick={()=>toggleVisible(k)} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"rgba(242,242,245,0.35)", cursor:"pointer", fontFamily:MONO, fontSize:10 }}>
                        {key.visible?"HIDE":"SHOW"}
                      </button>
                    </div>
                    <button onClick={()=>testConnection(k)} style={{ background:"rgba(255,255,255,0.04)", color:"rgba(242,242,245,0.55)", border:"1px solid #2C2C2E", padding:"0 12px", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>Test</button>
                    <button onClick={()=>saveKey(k)} style={{ background: saved[k]?"rgba(52,211,153,0.1)":"#F5A623", color: saved[k]?"#34D399":"#0C0C0E", border: saved[k]?"1px solid rgba(52,211,153,0.3)":"none", padding:"0 16px", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:700, whiteSpace:"nowrap", transition:"all 0.2s" }}>
                      {saved[k]?"✓ Saved":"Save"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── APIFY / SCRAPER ── */}
          {section==="apify" && (
            <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:"20px 22px" }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)", letterSpacing:"0.04em", marginBottom:18 }}>APIFY SCRAPER — MIPANGILIO</div>

              {/* Schedule */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", display:"block", marginBottom:8 }}>SCRAPE KILA (MASAA)</label>
                <div style={{ display:"flex", gap:8 }}>
                  {["3","6","12","24"].map(h=>(
                    <button key={h} onClick={()=>setApify(p=>({...p,schedule:h}))} style={{ flex:1, padding:"9px 0", borderRadius:9, cursor:"pointer", fontFamily:MONO, fontSize:12, fontWeight:700, border:`1px solid ${apify.schedule===h?"#4ECDC4":"#2C2C2E"}`, background:apify.schedule===h?"rgba(78,205,196,0.1)":"transparent", color:apify.schedule===h?"#4ECDC4":"rgba(242,242,245,0.4)", transition:"all 0.18s" }}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", display:"block", marginBottom:10 }}>VYANZO (SOURCES)</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {Object.entries({
                    techcrunch:"TechCrunch AI", venturebeat:"VentureBeat", techmoran:"TechMoran TZ",
                    disruptafrica:"Disrupt Africa", twitterai:"X/Twitter #AI", bbc:"BBC Technology"
                  }).map(([k,label])=>(
                    <div key={k} onClick={()=>setApify(p=>({...p,sources:{...p.sources,[k]:!p.sources[k]}}))} style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 13px", borderRadius:9, border:`1px solid ${apify.sources[k]?"rgba(78,205,196,0.3)":"#2C2C2E"}`, background:apify.sources[k]?"rgba(78,205,196,0.07)":"transparent", cursor:"pointer", transition:"all 0.18s" }}>
                      <div style={{ width:16, height:16, borderRadius:4, background:apify.sources[k]?"#4ECDC4":"transparent", border:`2px solid ${apify.sources[k]?"#4ECDC4":"#3C3C3E"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                        {apify.sources[k] && <span style={{ color:"#0C0C0E", fontSize:10, fontWeight:900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize:13, fontWeight:500, color:apify.sources[k]?"#F2F2F5":"rgba(242,242,245,0.45)" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              {[
                ["keywords_tz","KEYWORDS — TANZANIA 🇹🇿","Tanzania AI, JamiiAI, UDSM..."],
                ["keywords_af","KEYWORDS — AFRICA 🌍","Africa AI, East Africa tech..."],
                ["keywords_gl","KEYWORDS — GLOBAL 🌐","artificial intelligence, LLM, Claude..."],
              ].map(([k,label,ph])=>(
                <div key={k} style={{ marginBottom:14 }}>
                  <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", display:"block", marginBottom:6 }}>{label}</label>
                  <input value={apify[k]} onChange={ap(k)} placeholder={ph} style={inputS(false)} />
                </div>
              ))}

              {/* Summary language */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", display:"block", marginBottom:8 }}>LUGHA YA AI SUMMARY</label>
                <div style={{ display:"flex", gap:8 }}>
                  {["Kiswahili","English","Zote mbili"].map(l=>(
                    <button key={l} onClick={()=>setApify(p=>({...p,summaryLang:l}))} style={{ flex:1, padding:"9px 0", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:700, border:`1px solid ${apify.summaryLang===l?"#F5A623":"#2C2C2E"}`, background:apify.summaryLang===l?"rgba(245,166,35,0.1)":"transparent", color:apify.summaryLang===l?"#F5A623":"rgba(242,242,245,0.4)", transition:"all 0.18s" }}>{l}</button>
                  ))}
                </div>
              </div>

              <Toggle
                checked={apify.autoPublish}
                onChange={()=>setApify(p=>({...p,autoPublish:!p.autoPublish}))}
                label="Auto-Publish"
                sub="Chapisha habari moja kwa moja bila admin review — HATARI, usiwashe bila makini"
              />

              <button onClick={()=>notify("✅ Mipangilio ya Apify imehifadhiwa!")} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:14, marginTop:20 }}>
                Hifadhi Mipangilio →
              </button>
            </div>
          )}

          {/* ── PLATFORM ── */}
          {section==="platform" && (
            <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:"20px 22px" }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)", letterSpacing:"0.04em", marginBottom:18 }}>PLATFORM — MIPANGILIO YA MSINGI</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 }}>
                {[
                  ["siteName","JINA LA PLATFORM","JamiiAI"],
                  ["siteUrl","URL YA PRODUCTION","https://jamii.ai"],
                  ["adminEmail","ADMIN EMAIL","admin@jamii.ai"],
                  ["maxFreeMessages","FREE PLAN — MAX MESSAGES","50"],
                ].map(([k,label,ph])=>(
                  <div key={k}>
                    <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", display:"block", marginBottom:6 }}>{label}</label>
                    <input value={platform[k]} onChange={pp(k)} placeholder={ph} style={inputS(false)} />
                  </div>
                ))}
              </div>
              <div style={{ height:1, background:"#1E1E20", margin:"18px 0" }} />
              <Toggle checked={platform.registrationOpen} onChange={()=>setPlatform(p=>({...p,registrationOpen:!p.registrationOpen}))} label="Usajili Wazi" sub="Ruhusu watu wapya kujisajili JamiiAI" />
              <Toggle checked={platform.requireApproval}  onChange={()=>setPlatform(p=>({...p,requireApproval:!p.requireApproval}))} label="Idhini ya Admin kwa Wanachama Wapya" sub="Kila mwanachama mpya anahitaji idhini yako kabla ya kutumia platform" />
              <Toggle checked={platform.maintenanceMode}  onChange={()=>setPlatform(p=>({...p,maintenanceMode:!p.maintenanceMode}))} label="Maintenance Mode" sub="Zuia ufikiaji wa platform — inaonyesha ukurasa wa 'Tunafanya kazi'" />
              <button onClick={()=>notify("✅ Platform settings zimehifadhiwa!")} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:14, marginTop:20 }}>
                Hifadhi Mipangilio →
              </button>
            </div>
          )}

          {/* ── SMTP / EMAIL ── */}
          {section==="smtp" && (
            <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:"20px 22px" }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)", letterSpacing:"0.04em", marginBottom:6 }}>EMAIL (SMTP) — MIPANGILIO</div>
              <div style={{ fontSize:12, color:"rgba(242,242,245,0.4)", marginBottom:18, lineHeight:1.7 }}>
                Inatumika kutuma: Welcome email, notifications, password reset, weekly digest.
                Tumia Gmail App Password au Brevo (free 300 emails/day).
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  ["smtpHost","SMTP HOST","smtp.gmail.com"],
                  ["smtpPort","PORT","587"],
                  ["smtpUser","SMTP USERNAME / EMAIL","noreply@jamii.ai"],
                ].map(([k,label,ph])=>(
                  <div key={k}>
                    <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", display:"block", marginBottom:6 }}>{label}</label>
                    <input value={platform[k]} onChange={pp(k)} placeholder={ph} style={inputS(false)} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", display:"block", marginBottom:6 }}>SMTP PASSWORD</label>
                  <input type="password" value={keys.smtp_pass?.value||""} onChange={e=>updateKey("smtp_pass",e.target.value)} placeholder="Gmail App Password..." style={inputS(false)} />
                </div>
              </div>
              <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.15)", borderRadius:10, padding:"12px 14px", marginTop:16, fontSize:12, color:"rgba(242,242,245,0.5)", lineHeight:1.7 }}>
                💡 <strong style={{color:"#60A5FA"}}>Gmail App Password:</strong> Gmail → Security → 2FA → App Passwords → Generate.<br/>
                💡 <strong style={{color:"#60A5FA"}}>Brevo (Sendinblue):</strong> brevo.com — free plan ina 300 emails/siku, recommended kwa production.
              </div>
              <div style={{ display:"flex", gap:8, marginTop:16 }}>
                <button onClick={()=>notify("📧 Test email imetumwa kwa admin@jamii.ai!")} style={{ flex:1, background:"rgba(255,255,255,0.04)", color:"rgba(242,242,245,0.55)", border:"1px solid #2C2C2E", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:13 }}>📧 Tuma Test Email</button>
                <button onClick={()=>notify("✅ SMTP settings zimehifadhiwa!")} style={{ flex:2, background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:14 }}>Hifadhi →</button>
              </div>
            </div>
          )}

          {/* ── DANGER ZONE ── */}
          {section==="danger" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:"rgba(248,113,113,0.05)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:14, padding:"18px 20px" }}>
                <div style={{ fontFamily:MONO, fontSize:10, color:"#F87171", letterSpacing:"0.04em", marginBottom:14 }}>🚨 DANGER ZONE — VITENDO VISIVYOWEZA KURUDISHWA</div>
                {[
                  { label:"Futa Cache Yote", sub:"Inafuta cached content na sessions — haitaathiri data", btn:"Futa Cache", color:"#F5A623", action:"🗑 Cache imefutwa!" },
                  { label:"Export Data Yote (CSV)", sub:"Pakua wanachama, posts, na analytics kama CSV backup", btn:"Download CSV", color:"#4ECDC4", action:"📦 Export imeanza — itumwe kwa admin@jamii.ai" },
                  { label:"Weka Upya Scraper", sub:"Anzisha Apify scraper upya kama kuna tatizo la connection", btn:"Restart Scraper", color:"#A78BFA", action:"⟳ Apify scraper imeanzishwa upya!" },
                  { label:"Futa Watumiaji wa Test", sub:"Ondoa accounts zote zilizo na @test.com au @example.com", btn:"Futa Test Users", color:"#F87171", action:"🗑 Test users 12 wamefutwa!" },
                ].map(({label,sub,btn,color,action})=>(
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(248,113,113,0.08)" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:12, color:"rgba(242,242,245,0.4)" }}>{sub}</div>
                    </div>
                    <button onClick={()=>notify(action)} style={{ background:`${color}12`, color, border:`1px solid ${color}30`, padding:"8px 16px", borderRadius:8, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:12, whiteSpace:"nowrap", flexShrink:0 }}>{btn}</button>
                  </div>
                ))}
              </div>

              {/* Nuclear option */}
              <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.35)", borderRadius:14, padding:"18px 20px" }}>
                <div style={{ fontWeight:800, fontSize:14, color:"#F87171", marginBottom:6 }}>☢ Futa Database Yote</div>
                <div style={{ fontSize:13, color:"rgba(242,242,245,0.5)", marginBottom:14, lineHeight:1.7 }}>
                  Hatua hii itafuta <strong style={{color:"#F87171"}}>data yote</strong> — wanachama, posts, challenges, events. Haiwezi kurudishwa. Tumia tu kama una backup kamili.
                </div>
                <button onClick={()=>notify("⛔ Hatua hii imezuiwa — wasiliana na developer kwanza!")} style={{ background:"rgba(248,113,113,0.15)", color:"#F87171", border:"1px solid rgba(248,113,113,0.4)", padding:"11px 20px", borderRadius:9, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:13 }}>
                  ⛔ Futa Yote — Bila Kurudisha
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const [page, setPage] = useState("dashboard");

  const PAGES = {
    dashboard:     <DashboardPage />,
    users:         <UsersPage />,
    content:       <ContentPage />,
    roles:         <RolesPage />,
    changamoto:    <ChangamotoPage />,
    matukio:       <MatukioPage />,
    rasilimali:    <RasilimaliPage />,
    habari:        <HabariPage />,
    billing:       <BillingPage />,
    analytics:     <AnalyticsPage />,
    announcements: <AnnouncementsPage />,
    settings:      <SettingsPage />,
  };

  const PAGE_TITLE = {
    dashboard:"Dashboard", users:"Watumiaji", content:"Moderation",
    roles:"Roles & Permissions", changamoto:"Changamoto", matukio:"Matukio",
    rasilimali:"Rasilimali", habari:"Habari", billing:"Billing & Subscriptions",
    analytics:"Analytics", announcements:"Matangazo", settings:"Settings ⚙",
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:"#0C0C0E", color:"#F2F2F5", minHeight:"100vh", display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0C0C0E}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}::-webkit-scrollbar-thumb:hover{background:#F5A623}
        input::placeholder,textarea::placeholder{color:rgba(242,242,245,0.25)}
        input,textarea,select,button{font-family:inherit}
        input:focus,textarea:focus,select:focus,button:focus{outline:none}
        textarea{resize:vertical}
        .nv{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;cursor:pointer;transition:all 0.18s;font-size:13px;font-weight:500}
        .nv:hover{background:#1A1A1C}
        .nv.on{background:rgba(245,166,35,0.1);color:#F5A623}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:220, flexShrink:0, height:"100vh", position:"sticky", top:0, borderRight:"1px solid #1E1E20", padding:"20px 12px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:6, paddingLeft:6 }}>
          <div style={{ width:28, height:28, background:"#F5A623", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🌍</div>
          <div>
            <span style={{ fontWeight:800, fontSize:15, letterSpacing:"-0.02em" }}>Jamii<span style={{ color:"#F5A623" }}>AI</span></span>
            <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)", marginTop:1 }}>Admin Panel</div>
          </div>
        </div>

        <div style={{ height:1, background:"#1E1E20", margin:"10px 0" }} />

        {/* Nav */}
        {NAV.map(n => (
          <div key={n.id} className={`nv ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
            <span style={{ fontFamily:MONO, fontSize:11, opacity:page===n.id?1:0.4 }}>{n.icon}</span>
            <span style={{ fontSize:12, fontWeight:page===n.id?700:500, flex:1, color:page===n.id?"#F5A623":"rgba(242,242,245,0.65)" }}>{n.label}</span>
            {n.badge && <span style={{ background: n.id==="content"?"#F87171":"#F5A623", color:"#0C0C0E", fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:9, fontFamily:MONO }}>{n.badge}</span>}
          </div>
        ))}

        <div style={{ flex:1 }} />

        {/* Admin user */}
        <div style={{ borderTop:"1px solid #1E1E20", paddingTop:14 }}>
          <div style={{ display:"flex", gap:9, alignItems:"center", padding:"8px 6px", borderRadius:9, cursor:"pointer" }}>
            <Av i="DM" c="#F5A623" s={30} />
            <div>
              <div style={{ fontWeight:600, fontSize:12 }}>Davy Mwangi</div>
              <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)" }}>Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflowY:"auto", height:"100vh" }}>
        {/* Top bar */}
        <div style={{ position:"sticky", top:0, background:"rgba(12,12,14,0.96)", backdropFilter:"blur(24px)", borderBottom:"1px solid #1E1E20", padding:"13px 28px", zIndex:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h1 style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.02em" }}>{PAGE_TITLE[page]}</h1>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.28)" }}>JamiiAI Admin · v1.0</span>
            <a href="#" style={{ fontFamily:MONO, fontSize:11, color:"#F5A623", textDecoration:"none" }}>← Community</a>
          </div>
        </div>

        <div style={{ padding:"24px 28px 48px" }}>
          {PAGES[page]}
        </div>
      </main>
    </div>
  );
}
