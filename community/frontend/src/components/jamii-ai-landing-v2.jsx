import { useState, useEffect } from "react";

const FEATURES = [
  { icon: "⚡", title: "Hire AI Dev", swahili: "Haraka", desc: "Pata AI developer wa Tanzania kwa dakika chache. Verified profiles, real projects, real skills.", color: "#F5A623", nav: "wataalamu" },
  { icon: "🌍", title: "Jamii Hub",   swahili: "Unganika", desc: "Connect na AI builders, share code, uliza maswali, gundua projects za Tanzania.",           color: "#4ECDC4", nav: "nyumbani"  },
  { icon: "📡", title: "AI Habari",   swahili: "Jua Kwanza", desc: "Breaking AI news — local Tanzania na global. Uwe wa kwanza kujua nini kinaendelea.",        color: "#A78BFA", nav: "habari"   },
  { icon: "◆",  title: "Changamoto", swahili: "Shindana",   desc: "Innovation challenges za AI na prize pool ya TZS 20M+. Shindana na wabunifu wa Tanzania.",  color: "#34D399", nav: "changamoto" },
];

const STATS = [["500+", "AI Devs"], ["2,000+", "Wanachama"], ["TZS 20M+", "Prize Pool"], ["24/7", "Active"]];

const TRENDING_TAGS = ["#SwahiliNLP", "#TanzaniaAI", "#ClaudeAPI", "#AIJobs", "#RAGSystem"];

const RECENT_ACTIVITY = [
  { user: "Amina H.",  color: "#4ECDC4", av: "AH", msg: "Amechapisha swali kuhusu Swahili NLP dataset 💬",       time: "1min" },
  { user: "Jonas K.",  color: "#F87171", av: "JK", msg: "Ameshiriki kwenye Swahili Sentiment Challenge ◆",       time: "8min" },
  { user: "Grace M.",  color: "#60A5FA", av: "GM", msg: "Amepakua ML Roadmap kwa Waanzilishi wa Tanzania ◧",     time: "15min"},
  { user: "Fatuma S.", color: "#A78BFA", av: "FS", msg: "Amechapisha habari: Tanzania AI Hub $2M investment 📡",  time: "32min"},
];

// ─────────────────────────────────────────────────────────────────

function Av({ initials, color, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: size * 0.3, color: "#0A0F1C", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function OnlineCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
    fetch(`${API}/users?limit=1`)
      .then(r => {
        if (!r.ok) throw new Error('API not available');
        return r.json();
      })
      .then(d => {
        const total = d.total || d.count || 30;
        const online = Math.max(12, Math.floor(total * (0.08 + Math.random() * 0.07)));
        setCount(online);
      })
      .catch(() => setCount(Math.floor(12 + Math.random() * 8)));
  }, []);
  if (!count) return null;
  return (
    <span style={{fontWeight:800,color:"#4ECDC4"}}>{count} online •&nbsp;</span>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  AUTENTIKASHONI PREVIEW
// ═══════════════════════════════════════════════════════════════════

function AuthPreview({ mode, onSwitch, onSuccess, onBack }) {
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1100));
    setLoading(false);
    onSuccess();
  };

  return (
    <div style={{ fontFamily: "'Roboto Mono',monospace", background: "#0A0F1C", color: "#DCE6F0", minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}input,button{font-family:inherit}input:focus,button:focus{outline:none}@keyframes fup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fin{animation:fup 0.3s ease both}`}</style>

      {/* Left branding */}
      <div style={{ background: "linear-gradient(160deg,#0D1322,#0A0F1C)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "48px 56px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,0.04) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "rgba(245,166,35,0.05)", filter: "blur(90px)", top: -100, left: -100 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
          <span onClick={onBack} style={{ cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.4)", marginRight: 10 }}>← Rudi</span>
          <div style={{ width: 32, height: 32, background: "#F5A623", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>🌍</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>Jamii<span style={{ color: "#F5A623" }}>AI</span></span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 64, textAlign: "center", marginBottom: 24 }}>🇹🇿</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 18 }}>Tanzania's AI <span style={{ color: "#F5A623" }}>Community</span></h2>
          <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14, lineHeight: 1.8 }}>Jiunge na 2,000+ AI developers, researchers, na enthusiasts wa Tanzania.</p>
          <div style={{ display: "flex", gap: 28, marginTop: 36 }}>
            {[["2K+","Wanachama"],["500+","AI Devs"],["20M+","Prize TZS"]].map(([n,l])=>(
              <div key={l}><div style={{fontSize:22,fontWeight:800,color:"#F5A623",fontFamily:"'Roboto Mono',monospace"}}>{n}</div><div style={{fontFamily:"'Roboto Mono',monospace",fontSize:9,color:"rgba(220,230,240,0.35)",marginTop:2}}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth form */}
      <div style={{ padding: "48px 56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="fin" style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>
            {mode === "login" ? "Karibu tena 👋" : "Jiunge na JamiiAI 🌍"}
          </h2>
          <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13, marginBottom: 32 }}>
            {mode === "login" ? "Ingia kwenye community ya AI Tanzania" : "Community ya AI Tanzania — bure kabisa"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <input value={form.name} onChange={set("name")} placeholder="Jina lako kamili" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px", color: "#DCE6F0", fontSize: 14 }} />
            )}
            <input value={form.email} onChange={set("email")} placeholder="Barua Pepe" type="email" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px", color: "#DCE6F0", fontSize: 14 }} />
            <input value={form.password} onChange={set("password")} placeholder="Nywila" type="password" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px", color: "#DCE6F0", fontSize: 14 }} />
            <button onClick={handle} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "14px", borderRadius: 10, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 800, fontSize: 15, transition: "all 0.2s" }}>
              {loading ? "Inaendelea..." : mode === "login" ? "Ingia →" : "Jiandikishe →"}
            </button>
          </div>
          <p style={{ marginTop: 24, textAlign: "center", color: "rgba(220,230,240,0.4)", fontSize: 13 }}>
            {mode === "login" ? "Huna akaunti? " : "Una akaunti? "}
            <span onClick={() => onSwitch(mode === "login" ? "register" : "login")} style={{ color: "#F5A623", fontWeight: 700, cursor: "pointer" }}>
              {mode === "login" ? "Jiandikishe bure →" : "Ingia →"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  JAMII DASHBOARD PREVIEW
// ═══════════════════════════════════════════════════════════════════

function CommunityPreview({ activeNav, setActiveNav, onLogout, user }) {
  const NAV = [
    { id: "nyumbani",    icon: "🏠", label: "Nyumbani" },
    { id: "gundua",     icon: "🧭", label: "Gundua" },
    { id: "wataalamu",  icon: "👨‍💻", label: "Wataalamu" },
    { id: "startups",   icon: "🚀", label: "Startups" },
    { id: "vyuo",       icon: "🎓", label: "Vyuo & Taasisi" },
    { id: "changamoto", icon: "🏆", label: "Changamoto" },
    { id: "rasilimali", icon: "📚", label: "Rasilimali" },
    { id: "kazi",       icon: "💼", label: "Kazi" },
    { id: "habari",     icon: "📰", label: "Habari" },
  ];

  const labels = { 
    nyumbani: "Nyumbani 🏠", gundua: "Gundua 🧭", wataalamu: "Wataalamu 👨‍💻",
    startups: "Startups 🚀", vyuo: "Vyuo & Taasisi 🎓", changamoto: "Changamoto 🏆",
    rasilimali: "Rasilimali 📚", kazi: "Kazi 💼", habari: "Habari 📰" 
  };

  // MOCK DATA GENERATOR
  const renderContent = () => {
    switch(activeNav) {
      case "wataalamu":
        return (
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
            {[
              { name: "Dr. Elias N.", role: "Computer Vision Expert", loc: "Dar es Salaam", tags: ["PyTorch", "OpenCV"], av: "EN", color: "#4ECDC4" },
              { name: "Fatuma Ally", role: "ML Engineer", loc: "Arusha", tags: ["LLMs", "RAG Systems"], av: "FA", color: "#F5A623" },
              { name: "Kelvin Mshana", role: "Data Scientist", loc: "Mwanza", tags: ["NLP", "TensorFlow"], av: "KM", color: "#A78BFA" },
              { name: "Sarah John", role: "AI Ethicist", loc: "Zanzibar", tags: ["Policy", "Bias Detection"], av: "SJ", color: "#F87171" }
            ].map(p => (
              <div key={p.name} style={{background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:20, display:"flex", gap:15, alignItems:"center"}}>
                <Av initials={p.av} color={p.color} size={50} />
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, fontSize:15}}>{p.name}</div>
                  <div style={{fontSize:12, color:"#F5A623", marginBottom:4}}>{p.role}</div>
                  <div style={{fontSize:11, opacity:0.5}}>📍 {p.loc}</div>
                  <div style={{display:"flex", gap:6, marginTop:10}}>
                    {p.tags.map(t => <span key={t} style={{fontSize:9, background:"rgba(255,255,255,0.05)", padding:"3px 8px", borderRadius:4}}>{t}</span>)}
                  </div>
                </div>
                <div style={{fontSize:12, cursor:"pointer", color:"#4ECDC4", fontWeight:700}}>Connect</div>
              </div>
            ))}
          </div>
        );
      case "changamoto":
        return (
          <div style={{display:"flex", flexDirection:"column", gap:16}}>
            {[
              { title: "Swahili Sentiment Analysis Challenge", prize: "TZS 5,000,000", days: "12 left", participants: 142 },
              { title: "AI for Agriculture Hackathon 🇹🇿", prize: "TZS 10,000,000", days: "24 left", participants: 86 }
            ].map(c => (
              <div key={c.title} style={{background:"linear-gradient(90deg, rgba(245,166,35,0.05) 0%, transparent 100%)", border:"1px solid rgba(245,166,35,0.2)", borderRadius:16, padding:24, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>
                  <h3 style={{fontSize:18, fontWeight:800, marginBottom:8}}>{c.title}</h3>
                  <div style={{display:"flex", gap:20, fontSize:13, opacity:0.7}}>
                    <span>💰 Zawadi: <b style={{color:"#F5A623"}}>{c.prize}</b></span>
                    <span>👥 {c.participants} Washiriki</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11, color:"#F87171", fontWeight:700, marginBottom:8}}>⏳ {c.days}</div>
                  <button style={{background:"#F5A623", border:"none", padding:"8px 20px", borderRadius:8, fontWeight:800, fontSize:12, cursor:"pointer", color:"#0A0F1C"}}>Shiriki Sasa</button>
                </div>
              </div>
            ))}
          </div>
        );
      case "startups":
        return (
          <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16}}>
            {[
              { name: "KilimoAI", desc: "Using AI to detect crop diseases via smartphone photos.", tag: "AgriTech" },
              { name: "AfyaIntel", desc: "Swahili NLP for processing hospital records automatically.", tag: "Health" },
              { name: "BodaBot", desc: "Optimizing logistics for delivery riders in Dar.", tag: "Logistics" }
            ].map(s => (
              <div key={s.name} style={{background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20}}>
                <div style={{width:40, height:40, background:"rgba(255,255,255,0.05)", borderRadius:8, marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20}}>🚀</div>
                <div style={{fontWeight:800, fontSize:16, marginBottom:6}}>{s.name}</div>
                <div style={{fontSize:10, color:"#4ECDC4", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10}}>{s.tag}</div>
                <p style={{fontSize:12, lineHeight:1.5, opacity:0.6}}>{s.desc}</p>
              </div>
            ))}
          </div>
        );
      default: // Nyumbani (Feed)
        return (
          <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:28}}>
            <div>
              {/* Post Box */}
              <div style={{background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16, marginBottom:24}}>
                <div style={{display:"flex", gap:12}}>
                  <div style={{width:36, height:36, borderRadius:"50%", background:"#F5A623", display:"flex", alignItems:"center", justifyContent: "center", fontWeight:800, color:"#0A0F1C"}}>JD</div>
                  <div style={{flex:1, background:"rgba(255,255,255,0.05)", borderRadius:20, padding:"10px 16px", fontSize:13, color:"rgba(220,230,240,0.4)", cursor:"text"}}>Unawaza nini leo?</div>
                </div>
                <div style={{display:"flex", gap:16, marginTop:14, paddingLeft:48}}>
                  <span style={{fontSize:12, opacity:0.6, cursor:"pointer"}}>🖼️ Picha</span>
                  <span style={{fontSize:12, opacity:0.6, cursor:"pointer"}}>🎞️ Video</span>
                  <span style={{fontSize:12, opacity:0.6, cursor:"pointer"}}>📊 Poll</span>
                </div>
              </div>

              {/* Mock Feed Items */}
              {[
                { name: "Amina Mohammed", role: "AI Researcher", time: "Saa 1 lililopita", text: "Nimemaliza kufanya finetuning ya model yangu ya kwanza ya Swahili NLP! 🚀 Inafanya kazi vizuri sana kwenye datasets za habari za Tanzania. Nani anataka kuona demo?", likes: 24, cmts: 8, av: "AM", color: "#4ECDC4" },
                { name: "Juma Bakari", role: "ML Engineer", time: "Saa 3 zilizopita", text: "Natafuta dataset ya picha za mazao (pamba na korosho) kwa ajili ya project ya chuo. Kuna mtu ana link au anaweza kushare?", likes: 12, cmts: 15, av: "JB", color: "#F5A623" },
                { name: "Sarah K.", role: "Software Dev", time: "Saa 5 zilizopita", text: "Nimechapisha 'Swahili-Voice' — open-source TTS model ya kwanza kabisa ya kiswahili sanifu! Ipo GitHub, cheki link kwenye bio yangu.", likes: 156, cmts: 42, av: "SK", color: "#A78BFA" }
              ].map(post => (
                <div key={post.name} style={{background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:20}}>
                  <div style={{display:"flex", gap:12, marginBottom:16}}>
                    <Av initials={post.av} color={post.color} size={42} />
                    <div>
                      <div style={{fontWeight:700, fontSize:14}}>{post.name} <span style={{color:"#F5A623"}}>●</span></div>
                      <div style={{fontSize:11, opacity:0.4, marginTop:2}}>{post.role} · {post.time}</div>
                    </div>
                  </div>
                  <p style={{fontSize:14, lineHeight:1.6, color:"rgba(220,230,240,0.8)", marginBottom:16}}>{post.text}</p>
                  <div style={{display:"flex", gap:16, borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:14}}>
                    <span style={{fontSize:12, opacity:0.5, cursor:"pointer"}}>❤️ {post.likes} Likes</span>
                    <span style={{fontSize:12, opacity:0.5, cursor:"pointer"}}>💬 {post.cmts} Comments</span>
                    <span style={{fontSize:12, opacity:0.5, cursor:"pointer", marginLeft:"auto"}}>🔖 Save</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Trending */}
            <div>
              <div style={{fontFamily:"'Roboto Mono',monospace", fontSize:11, color:"#F5A623", letterSpacing:"0.1em", marginBottom:16, textTransform:"uppercase", fontWeight:700}}>Trending Sasa</div>
              <div style={{background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:18}}>
                {["#SwahiliNLP", "#TanzaniaAI", "#ClaudeAPI", "#AIJobs", "#RAGSystem"].map((t,i)=>(
                  <div key={t} style={{padding:"8px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#F5A623"} onMouseLeave={e=>e.currentTarget.style.color="inherit"}>
                    <span style={{fontSize:13, fontWeight:600}}>{t}</span>
                    <span style={{fontSize:10, opacity:0.3}}>{Math.floor(Math.random()*100+10)} posts</span>
                  </div>
                ))}
              </div>
              
              <div style={{marginTop:24, background:"rgba(78,205,196,0.05)", border:"1px solid rgba(78,205,196,0.15)", borderRadius:16, padding:18}}>
                <div style={{fontSize:13, fontWeight:700, marginBottom:10, color:"#4ECDC4"}}>Msaada wa AI 🤖</div>
                <p style={{fontSize:11, lineHeight:1.5, opacity:0.6}}>Tumia AI Assistant yetu kusaidia kuandika code au kutafuta rasilimali haraka zaidi.</p>
                <button style={{width:"100%", marginTop:12, background:"rgba(78,205,196,0.15)", border:"1px solid rgba(78,205,196,0.3)", color:"#4ECDC4", padding:"8px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer"}}>Anza Chat</button>
              </div>

              <button onClick={onLogout} style={{width:"100%", marginTop:24, background:"rgba(245,166,35,0.12)", border:"1px solid rgba(245,166,35,0.3)", color:"#F5A623", padding:"12px", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", transition:"0.2s"}}>
                ← Rudi Landing Page
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{fontFamily:"'Roboto Mono',monospace", background:"#0A0F1C", color:"#DCE6F0", minHeight:"100vh", display:"flex"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#F5A623;border-radius:2px}
        .nv{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;cursor:pointer;transition:all 0.18s;margin-bottom:2px}
        .nv:hover{background:rgba(255,255,255,0.04)}
        .nv.active{background:rgba(245,166,35,0.1);color:#F5A623}
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* SIDEBAR */}
      <aside style={{width:240, flexShrink:0, height:"100vh", position:"sticky", top:0, borderRight:"1px solid rgba(255,255,255,0.06)", padding:"20px 14px", display:"flex", flexDirection:"column", background:"#0A0F1C"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:28, paddingLeft:6}}>
          <div style={{width:32, height:32, background:"#F5A623", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15}}>🌍</div>
          <span style={{fontWeight:800, fontSize:19, letterSpacing:"-0.02em"}}>Jamii<span style={{color:"#F5A623"}}>AI</span></span>
        </div>
        <div style={{flex:1, overflowY:"auto"}} className="hide-scrollbar">
          {NAV.map(item=>(
            <div key={item.id} className={`nv ${activeNav===item.id?"active":""}`} onClick={()=>setActiveNav(item.id)}>
              <span style={{fontSize:16}}>{item.icon}</span>
              <span style={{fontSize:13, fontWeight:activeNav===item.id?700:500, opacity:activeNav===item.id?1:0.7}}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:16, marginTop:10}}>
          <div onClick={onLogout} style={{display:"flex", gap:10, alignItems:"center", padding:"10px 12px", borderRadius:10, cursor:"pointer", color:"rgba(220,230,240,0.4)", transition:"0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{fontSize:14}}>🚪</span>
            <span style={{fontSize:13, fontWeight:600}}>Toka kwenye Demo</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{flex:1, height:"100vh", overflowY:"auto", background:"linear-gradient(180deg, rgba(245,166,35,0.02) 0%, rgba(10,15,28,0) 100%)"}}>
        <div style={{position:"sticky", top:0, background:"rgba(10,15,28,0.85)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"16px 28px", zIndex:10, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{fontWeight:800, fontSize:18, letterSpacing:"-0.01em"}}>{labels[activeNav]||activeNav}</span>
          <div style={{display:"flex", gap:12}}>
            <div style={{width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor:"pointer"}}>🔔</div>
            <div style={{width:34, height:34, borderRadius:"50%", background:"#F5A623", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0A0F1C", fontSize:13, cursor:"pointer"}}>JD</div>
          </div>
        </div>

        <div style={{padding:"32px 40px", maxWidth:1000, margin:"0 auto"}}>
          {/* Welcome Banner */}
          {activeNav === "nyumbani" && (
            <div style={{background:"linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(78,205,196,0.05) 100%)", border:"1px solid rgba(245,166,35,0.15)", borderRadius:20, padding:"32px", marginBottom:32, position:"relative", overflow:"hidden"}}>
              <div style={{position:"absolute", right:-20, top:-20, fontSize:120, opacity:0.05}}>🌍</div>
              <h2 style={{fontSize:28, fontWeight:900, marginBottom:10, letterSpacing:"-0.02em"}}>Karibu <span style={{color:"#F5A623"}}>JamiiAI</span> Demo! 🇹🇿</h2>
              <p style={{color:"rgba(220,230,240,0.6)", fontSize:15, lineHeight:1.6, maxWidth:550}}>
                Huu ni muonekano wa awali wa jinsi platform yetu inavyofanya kazi. Hapa unaweza kuona feed, wataalamu, changamoto, na rasilimali zote za AI nchini Tanzania.
              </p>
            </div>
          )}

          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function JamiiAILanding({ initialPage = "landing", user, onLogin, onRegister, onLogout }) {
  // page: "landing" | "auth" | "community"
  const [page, setPage] = useState(initialPage);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [activeNav, setActiveNav] = useState("nyumbani");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (initialPage) setPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    const mm = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const sc = () => setScrollY(window.scrollY);
    window.addEventListener("mousemove", mm);
    window.addEventListener("scroll", sc);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("scroll", sc); };
  }, []);

  const px = typeof window !== "undefined" ? (mousePos.x / window.innerWidth  - 0.5) * 18 : 0;
  const py = typeof window !== "undefined" ? (mousePos.y / window.innerHeight - 0.5) * 18 : 0;

  const goAuth = (mode = "login") => { 
    if (onLogin && mode === "login") onLogin();
    else if (onRegister && mode === "register") onRegister();
    else { setAuthMode(mode); setPage("auth"); }
  };
  const goCommunity = (nav = "nyumbani") => { 
    setActiveNav(nav); 
    setPage("community"); 
  };

  // ── AUTENTIKASHONI ──
  if (page === "auth") {
    return <AuthPreview mode={authMode} onSwitch={m => setAuthMode(m)} onSuccess={() => goCommunity()} onBack={() => setPage("landing")} />;
  }

  // ── DASHBOARD PREVIEW ──
  if (page === "community") {
    return <CommunityPreview activeNav={activeNav} setActiveNav={setActiveNav} onLogout={onLogout || (() => setPage("landing"))} user={user} />;
  }

  // ── LANDING ───────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Roboto Mono',monospace", background: "#080C14", color: "#E8EDF5", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#F5A623;border-radius:2px}
        .glow-orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;transition:transform 0.1s ease-out}
        .grid-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(245,166,35,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,0.035) 1px,transparent 1px);background-size:60px 60px}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
        .fcard{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px;transition:all 0.28s;cursor:default}
        .fcard:hover{background:rgba(255,255,255,0.05);border-color:rgba(245,166,35,0.18);transform:translateY(-4px)}
        .btn-p{background:#F5A623;color:#080C14;border:none;cursor:pointer;font-family:'Roboto Mono',monospace;font-weight:700;font-size:14px;padding:13px 30px;border-radius:9px;letter-spacing:0.02em;transition:all 0.2s;text-transform:uppercase}
        .btn-p:hover{background:#FFB940;transform:translateY(-2px);box-shadow:0 12px 36px rgba(245,166,35,0.3)}
        .btn-g{background:transparent;color:#E8EDF5;border:1px solid rgba(232,237,245,0.14);cursor:pointer;font-family:'Roboto Mono',monospace;font-weight:600;font-size:14px;padding:13px 30px;border-radius:9px;transition:all 0.2s;text-transform:uppercase}
        .btn-g:hover{border-color:rgba(245,166,35,0.45);color:#F5A623}
        .nav-link{cursor:pointer;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;transition:all 0.2s;letter-spacing:0.06em;text-transform:uppercase;color:rgba(232,237,245,0.5)}
        .nav-link:hover,.nav-link.active{color:#F5A623}
        .act-item{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);transition:padding 0.2s;cursor:pointer}
        .act-item:hover{padding-left:4px}
        .act-item:last-child{border-bottom:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp 0.7s 0.1s ease both}
        .fu2{animation:fadeUp 0.7s 0.22s ease both}
        .fu3{animation:fadeUp 0.7s 0.34s ease both}
        .fu4{animation:fadeUp 0.7s 0.46s ease both}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .mtrack{display:flex;gap:56px;animation:marquee 22s linear infinite;white-space:nowrap}
        .slabel{font-family:'Roboto Mono',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#F5A623;display:flex;align-items:center;gap:8px}
        .slabel::before{content:'';display:block;width:22px;height:1px;background:#F5A623}
        button:focus,input:focus{outline:none}
      `}</style>

      <div className="noise" />
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 600, height: 600, background: "rgba(245,166,35,0.055)", top: -200, right: -200, transform: `translate(${px * 0.5}px,${py * 0.5}px)` }} />
      <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(78,205,196,0.04)", bottom: "30%", left: -200, transform: `translate(${-px * 0.3}px,${-py * 0.3}px)` }} />

      {/* ── NAVBAR ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 48px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(255,255,255,${scrollY > 20 ? "0.07" : "0"})`, backdropFilter: scrollY > 20 ? "blur(20px)" : "none", background: scrollY > 20 ? "rgba(8,12,20,0.88)" : "transparent", transition: "all 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#F5A623", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>🌍</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>Jamii<span style={{ color: "#F5A623" }}>AI</span></span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["Wataalamu", "Changamoto", "Rasilimali", "Habari"].map(l => (
            <span key={l} className="nav-link" onClick={() => goCommunity(l.toLowerCase())}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-g" style={{ padding: "8px 18px", fontSize: 12 }} onClick={() => goAuth("login")}>Ingia</button>
          <button className="btn-p" style={{ padding: "8px 18px", fontSize: 12 }} onClick={() => goAuth("register")}>Jiunge Bure</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 80px 80px", position: "relative", zIndex: 1 }}>
        <div className="fu1" style={{ marginBottom: 28 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(78,205,196,0.1)", border: "1px solid rgba(78,205,196,0.22)", color: "#4ECDC4", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "'Roboto Mono',monospace" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ECDC4", animation: "pulse 2s infinite" }} />
            <OnlineCount /> Tanzania's First AI Community Platform
          </span>
        </div>

        <div className="fu2" style={{ fontSize: "clamp(50px, 7.5vw, 96px)", fontWeight: 800, lineHeight: 0.96, letterSpacing: "-0.045em", marginBottom: 30 }}>
          <div>Karibu</div>
          <div>Kwenye <span style={{ color: "#F5A623", position: "relative" }}>Jamii
            <svg style={{ position: "absolute", bottom: -6, left: 0, width: "100%", height: 8 }} viewBox="0 0 200 8" fill="none">
              <path d="M0 6 Q50 1 100 5 Q150 9 200 3" stroke="#F5A623" strokeWidth="2" fill="none" opacity="0.5"/>
            </svg>
          </span></div>
          <div>ya AI <span style={{ color: "#4ECDC4" }}>🇹🇿</span></div>
        </div>

        <p className="fu3" style={{ maxWidth: 500, fontSize: 17, lineHeight: 1.75, color: "rgba(232,237,245,0.55)", marginBottom: 44 }}>
          Hire AI developers haraka, shiriki kwenye jamii, shindana kwenye changamoto za AI, na jua habari za Tanzania na duniani kote.
        </p>

        <div className="fu4" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 64 }}>
          <button className="btn-p" style={{ fontSize: 15, padding: "15px 36px" }} onClick={() => goAuth("register")}>Jiunge Bure →</button>
          <button className="btn-g" style={{ fontSize: 15, padding: "15px 36px" }} onClick={() => goCommunity("nyumbani")}>Tazama Demo</button>
        </div>

        <div className="fu4" style={{ display: "flex", gap: 44, paddingTop: 44, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {STATS.map(([num, label]) => (
            <div key={label}>
              <div style={{ fontSize: 30, fontWeight: 800, color: "#F5A623", letterSpacing: "-0.03em", fontFamily: "'Roboto Mono',monospace" }}>{num}</div>
              <div style={{ fontSize: 11, color: "rgba(232,237,245,0.38)", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Roboto Mono',monospace" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.35 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", fontFamily: "'Roboto Mono',monospace" }}>SCROLL</span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom,rgba(245,166,35,0.8),transparent)" }} />
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ overflow: "hidden", padding: "18px 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 1 }}>
        <div className="mtrack">
          {["Machine Learning","LLMs","AI Agents","Computer Vision","NLP","RAG Systems","Claude API","TensorFlow","PyTorch","Swahili AI","Tanzania AI","Open Source","Machine Learning","LLMs","AI Agents","Computer Vision","NLP","RAG Systems","Claude API","TensorFlow","PyTorch","Swahili AI","Tanzania AI","Open Source"].map((item, i) => (
            <span key={i} style={{ fontSize: 12, fontFamily: "'Roboto Mono',monospace", color: i % 3 === 0 ? "#F5A623" : "rgba(232,237,245,0.2)", letterSpacing: "0.08em" }}>
              {item} <span style={{ opacity: 0.25, margin: "0 8px" }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 80px", position: "relative", zIndex: 1 }}>
        <div className="slabel" style={{ marginBottom: 20 }}>Features</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,50px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.08, maxWidth: 440 }}>
            Kila kitu mahali <span style={{ color: "#F5A623" }}>pamoja</span>
          </h2>
          <p style={{ maxWidth: 300, color: "rgba(232,237,245,0.45)", fontSize: 14, lineHeight: 1.75 }}>
            JamiiAI ni zaidi ya website — ni ecosystem nzima ya AI developers Tanzania.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="fcard" onClick={() => goCommunity(f.nav)}>
              <div style={{ fontSize: 32, marginBottom: 18 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: f.color, letterSpacing: "0.14em", marginBottom: 7, textTransform: "uppercase" }}>{f.swahili}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.02em" }}>{f.title}</h3>
              <p style={{ color: "rgba(232,237,245,0.48)", fontSize: 13, lineHeight: 1.75 }}>{f.desc}</p>
              <div style={{ marginTop: 20, color: f.color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Angalia →</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVITY + TRENDING ── */}
      <section style={{ padding: "0 80px 100px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 32 }}>

          {/* Recent Activity */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div className="slabel" style={{ marginBottom: 10 }}>Live Feed</div>
                <h3 style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em" }}>Kinachoendelea <span style={{ color: "#4ECDC4" }}>Sasa</span></h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399" }} />
                <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(232,237,245,0.4)" }}>LIVE</span>
              </div>
            </div>
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="act-item" onClick={() => goCommunity("nyumbani")}>
                <Av initials={act.av} color={act.color} size={36} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: act.color }}>{act.user}</span>
                  <span style={{ fontSize: 13, color: "rgba(232,237,245,0.6)", marginLeft: 6 }}>{act.msg}</span>
                </div>
                <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(232,237,245,0.28)", flexShrink: 0 }}>{act.time}</span>
              </div>
            ))}
            <button className="btn-g" style={{ width: "100%", marginTop: 20, fontSize: 13, padding: "11px" }} onClick={() => goCommunity("nyumbani")}>
              Tazama Feed Yote →
            </button>
          </div>

          {/* Trending + Quick access */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
              <div className="slabel" style={{ marginBottom: 16 }}>Trending</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TRENDING_TAGS.map((tag, i) => (
                  <span key={tag} onClick={() => goCommunity("gundua")} style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, fontWeight: 700, padding: "7px 13px", borderRadius: 20, background: i < 2 ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.05)", color: i < 2 ? "#F5A623" : "rgba(232,237,245,0.55)", cursor: "pointer", border: `1px solid ${i < 2 ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.2s" }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
              <div className="slabel" style={{ marginBottom: 16 }}>Fungua Haraka</div>
              {[
                { icon: "◈", label: "Wataalamu", sub: "500+ AI Devs", color: "#4ECDC4", nav: "wataalamu"  },
                { icon: "◆", label: "Changamoto", sub: "TZS 20M+ Prize Pool", color: "#F5A623", nav: "changamoto" },
                { icon: "◧", label: "Rasilimali", sub: "Datasets & Tutorials", color: "#34D399", nav: "rasilimali" },
                { icon: "◉", label: "Startups",   sub: "6 Tanzania AI Startups", color: "#A78BFA", nav: "startups"   },
              ].map(item => (
                <div key={item.label} onClick={() => goCommunity(item.nav)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "padding 0.2s" }}>
                  <span style={{ color: item.color, fontSize: 16, fontFamily: "'Roboto Mono',monospace" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</div>
                    <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(232,237,245,0.35)" }}>{item.sub}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "rgba(232,237,245,0.2)", fontSize: 12 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 80px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "linear-gradient(135deg,rgba(245,166,35,0.08),rgba(78,205,196,0.05))", border: "1px solid rgba(245,166,35,0.14)", borderRadius: 24, padding: "72px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", borderRadius: 24 }} />
          <div style={{ position: "relative" }}>
            <div className="slabel" style={{ justifyContent: "center", marginBottom: 20 }}>Jiunge Leo</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,60px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 18, lineHeight: 1.06 }}>
              Tanzania AI Community<br /><span style={{ color: "#F5A623" }}>Inaanza Nawe</span>
            </h2>
            <p style={{ color: "rgba(232,237,245,0.5)", fontSize: 16, maxWidth: 440, margin: "0 auto 36px", lineHeight: 1.75 }}>
              Jiunge na wenzako wa AI Tanzania. Pamoja tutajenga ecosystem ambayo itabadilisha Afrika.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-p" style={{ fontSize: 15, padding: "15px 40px" }} onClick={() => goAuth("register")}>Jiunge Bure — Sasa Hivi 🚀</button>
              <button className="btn-g" style={{ fontSize: 15, padding: "15px 40px" }} onClick={() => goCommunity("wataalamu")}>Hire AI Dev</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "32px 80px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#F5A623", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌍</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Jamii<span style={{ color: "#F5A623" }}>AI</span></span>
        </div>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(232,237,245,0.25)" }}>Built with ❤️ Tanzania · 2025</span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Twitter", "LinkedIn", "GitHub", "Discord"].map(s => (
            <span key={s} style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(232,237,245,0.3)", cursor: "pointer" }}>{s}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
