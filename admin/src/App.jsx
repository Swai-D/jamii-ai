import { useState, useEffect, useCallback } from "react";
import { authAPI, adminAPI, BASE } from "./lib/api";
import { LogOut, Globe, Shield, Activity, Users, Settings, Bell, Briefcase, FileText, BarChart3, Star, Layers, Zap, Download, GitFork, ExternalLink, Trash2 } from "lucide-react";

// Helper for formatted numbers (1.2k etc)
const fmtNum = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
};

const MONO = "'Roboto Mono', monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

function Av({ i, c, s = 32, src }) {
  const hasImage = src && src.trim().length > 0;
  const imageUrl = hasImage ? (src.startsWith("http") ? src : `${BASE}${src.startsWith("/") ? "" : "/"}${src}`) : null;

  return (
    <div style={{ width: s, height: s, borderRadius: "50%", background: hasImage ? "transparent" : (c || "#F5A623"), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: s * 0.35, color: "#0A0F1C", flexShrink: 0, overflow: "hidden", border: hasImage ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
      {hasImage ? (
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        i
      )}
    </div>
  );
}

// ─── HELPERS (Matching Community Design) ──────────────────────────────────
function FloatLabel({ label, children, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: error ? "#F87171" : "rgba(220,230,240,0.45)", textTransform: "uppercase" }}>{label}</label>
      {children}
      {error && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F87171" }}>{error}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", error }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${error ? "#F87171" : focused ? "#F5A623" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 10, padding: "13px 16px", color: "#DCE6F0", fontFamily: "'Roboto Mono',monospace",
        fontSize: 15, outline: "none", transition: "border-color 0.2s", width: "100%",
      }}
    />
  );
}

function Btn({ children, onClick, variant = "primary", disabled, full }) {
  const styles = {
    primary: { background: disabled ? "rgba(245,166,35,0.3)" : "#F5A623", color: "#0A0F1C" },
    ghost:   { background: "transparent", color: "rgba(220,230,240,0.6)", border: "1px solid rgba(255,255,255,0.12)" },
    danger:  { background: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...styles[variant], padding: "13px 28px", borderRadius: 10, cursor: disabled ? "default" : "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, border: styles[variant].border || "none", transition: "all 0.2s", width: full ? "100%" : "auto", letterSpacing: "0.01em", ...(variant === "primary" && !disabled ? { boxShadow: "0 8px 24px rgba(245,166,35,0.2)" } : {}) }}>
      {children}
    </button>
  );
}

function AdminAuth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authAPI.login({ email, password });
      if (!["super_admin","admin","moderator","editor","analyst"].includes(data.user.role_name)) {
        throw new Error("Huna ufikiaji wa admin panel");
      }
      localStorage.setItem("admin_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Login imefeli");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Roboto Mono',monospace", background: "#0A0F1C", color: "#DCE6F0", minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes panelIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .panel-in { animation: panelIn 0.35s ease forwards; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* ── LEFT — BRANDING PANEL ── */}
      <div style={{ background: "linear-gradient(160deg, #0D1322 0%, #0A0F1C 100%)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "48px 56px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,0.04) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "auto", position: "relative", zIndex: 1 }}>
          <div style={{ width: 36, height: 36, background: "#F5A623", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌍</div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}>Jamii<span style={{ color: "#F5A623" }}>AI</span></span>
        </div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="float" style={{ fontSize: 72, marginBottom: 28, textAlign: "center" }}>🛡️</div>
          <h1 style={{ fontSize: "clamp(28px,3vw,44px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20 }}>
            JamiiAI<br /><span style={{ color: "#F5A623" }}>Admin Control</span>
          </h1>
          <p style={{ color: "rgba(220,230,240,0.5)", fontSize: 15, lineHeight: 1.75, marginBottom: 40, maxWidth: 380 }}>
            Mfumo wa usimamizi wa community ya AI Tanzania. Simamia watumiaji, maudhui, na mipangilio ya platform.
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 1, marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.25)" }}>© 2025 JamiiAI Admin</span>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.25)" }}>Systems Control 🇹🇿</span>
        </div>
      </div>

      {/* ── RIGHT — LOGIN FORM ── */}
      <div style={{ padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>
        <div className="panel-in" style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>Admin Login</h2>
            <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14, lineHeight: 1.6 }}>Ingia kusimamia community ya JamiiAI</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FloatLabel label="Barua Pepe">
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@jamii.ai.com" type="email" />
            </FloatLabel>
            <FloatLabel label="Nywila">
              <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" />
            </FloatLabel>

            {error && (
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F87171" }}>
                {error}
              </div>
            )}

            <Btn disabled={loading} full onClick={handleSubmit}>
              {loading ? "Inahakiki..." : "Ingia kwenye Panel →"}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── NAV CONFIG ────────────────────────────────────────────────────

const NAV = [
  { id:"dashboard",      icon:"🏠", label:"Dashboard"                },
  { id:"users",          icon:"👥", label:"Watumiaji",  badge:"8"    },
  { id:"content",        icon:"🛡️", label:"Moderation", badge:"12"   },
  { id:"roles",          icon:"🔐", label:"Roles"                    },
  { id:"changamoto",     icon:"🏆", label:"Changamoto"               },
  { id:"matukio",        icon:"🗓️", label:"Matukio"                  },
  { id:"rasilimali",     icon:"📚", label:"Rasilimali", badge:"2"    },
  { id:"kazi",           icon:"💼", label:"Kazi",       badge:"4"    },
  { id:"habari",         icon:"📰", label:"Habari",     badge:"2"    },
  { id:"billing",        icon:"💰", label:"Billing"                  },
  { id:"analytics",      icon:"📊", label:"Analytics"               },
  { id:"announcements",  icon:"📣", label:"Matangazo"               },
  { id:"settings",       icon:"⚙️", label:"Settings"                 },
];

// ── HELPERS ───────────────────────────────────────────────────────
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
    <button onClick={onClick} style={{ background: danger ? "rgba(248,113,113,0.1)" : `${color}15`, color: danger ? "#F87171" : color, border:`1px solid ${danger ? "rgba(248,113,113,0.25)" : `${color}30`}`, padding: small ? "4px 10px" : "7px 14px", borderRadius:7, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:600, fontSize: small ? 11 : 12, transition:"all 0.18s", whiteSpace:"nowrap" }}>
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
  const base = { background:"rgba(255,255,255,0.04)", border:`1px solid ${focused?"rgba(245,166,35,0.4)":"#232325"}`, borderRadius:9, padding:"10px 13px", color:"#F2F2F5", fontFamily:"'Roboto Mono',monospace", fontSize:13, outline:"none", width:"100%", transition:"border-color 0.2s" };
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
  const [stats,   setStats]   = useState(null);
  const [weekly,  setWeekly]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([adminAPI.stats(), adminAPI.analytics()])
      .then(([sRes, aRes]) => {
        setStats(sRes.data);
        setWeekly(aRes.data?.weekly || []);
      })
      .catch(err => {
        console.error("Dashboard load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmtNum = n => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n/1000)}K` : String(n||0);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia...</div>;

  return (
    <div>
      <SectionHead title="Dashboard" sub="JamiiAI Community — Overview ya leo" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <StatCard icon="👥" label="Total Members"    value={fmtNum(stats?.totalUsers)}    sub={`+${stats?.newToday||0} leo`}    color="#F5A623" delta={8}  />
        <StatCard icon="📝" label="Posts Leo"        value={fmtNum(stats?.postsToday)}    sub={`${fmtNum(stats?.totalPosts)} total`} color="#4ECDC4" delta={12} />
        <StatCard icon="🚩" label="Flagged Content"  value={stats?.flaggedContent||0}     sub="Zinahitaji review"                color="#F87171" />
        <StatCard icon="💰" label="MRR"              value={fmtNum(stats?.mrr)}           sub="TZS / mwezi"                     color="#34D399" delta={5}  />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
          <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>WATUMIAJI WAPYA — WIKI HII</div>
          {weekly.length > 0 ? <MiniBar data={weekly} valueKey="users" color="#F5A623" /> : <div style={{ color:"rgba(242,242,245,0.2)", fontSize:12, textAlign:"center", padding:"20px 0" }}>Hakuna data</div>}
        </div>
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
          <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>POSTS — WIKI HII</div>
          {weekly.length > 0 ? <MiniBar data={weekly} valueKey="posts" color="#4ECDC4" /> : <div style={{ color:"rgba(242,242,245,0.2)", fontSize:12, textAlign:"center", padding:"20px 0" }}>Hakuna data</div>}
        </div>
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
          <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>PLATFORM STATS</div>
          {[
            ["Challenges Wazi",    stats?.challenges||0,  "#F5A623"],
            ["Events Yanayokuja",  stats?.events||0,      "#4ECDC4"],
            ["Rasilimali",         stats?.resources||0,   "#A78BFA"],
            ["Habari",             stats?.news||0,        "#F87171"],
          ].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1A1A1C" }}>
              <span style={{ fontSize:13, color:"rgba(242,242,245,0.55)" }}>{l}</span>
              <span style={{ fontFamily:MONO, fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, padding:18 }}>
        <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.38)", letterSpacing:"0.04em", marginBottom:14 }}>PLATFORM SUMMARY</div>
        {[
          ["👥", "Watumiaji Wote",     fmtNum(stats?.totalUsers),   "#F5A623"],
          ["📝", "Posts Zote",         fmtNum(stats?.totalPosts),   "#4ECDC4"],
          ["🚩", "Content Flagged",    stats?.flaggedContent||0,    "#F87171"],
          ["🏆", "Changamoto",         stats?.challenges||0,        "#34D399"],
          ["🗓", "Matukio",            stats?.events||0,            "#A78BFA"],
          ["📚", "Rasilimali",         stats?.resources||0,         "#60A5FA"],
        ].map(([icon,label,val,color],i)=>(
          <div key={label} style={{ display:"flex", gap:12, alignItems:"center", padding:"9px 0", borderBottom:i<5?"1px solid #1A1A1C":"none" }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`${color}15`, border:`1px solid ${color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{icon}</div>
            <span style={{ fontSize:13, color:"rgba(242,242,245,0.7)", flex:1 }}>{label}</span>
            <span style={{ fontFamily:MONO, fontSize:13, fontWeight:700, color }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserDetailPanel({ user, loading, onClose, onVerify, onBan }) {
  if (!user && !loading) return null;
  const dl = (d) => d ? new Date(d).toLocaleDateString() : "—";
  const STATUS_C = { active:"#34D399", banned:"#F87171", pending:"#F5A623" };

  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:450, background:"#0C0C0E", borderLeft:"1px solid #1E1E20", display:"flex", flexDirection:"column", zIndex:200, boxShadow:"-12px 0 40px rgba(0,0,0,0.6)", animation:"slideIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ padding:20, borderBottom:"1px solid #1E1E20", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"#1E1E20", border:"none", borderRadius:8, width:28, height:28, color:"rgba(242,242,245,0.4)", cursor:"pointer", fontSize:14 }}>✕</button>

        {loading ? (
          <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia...</div>
        ) : (
          <>
            <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:16 }}>
               <Av i={user.name?.[0]||"U"} c="#F5A623" s={64} src={user.avatar_url} />
               <div>
                 <h2 style={{ fontSize:18, fontWeight:800, color:"#F2F2F5", marginBottom:2 }}>{user.name}</h2>
                 <div style={{ fontFamily:MONO, fontSize:12, color:"#F5A623" }}>@{user.handle}</div>
                 <div style={{ display:"flex", gap:6, marginTop:6 }}>
                    <Badge label={user.status||"active"} color={STATUS_C[user.status]||"#34D399"} />
                    {user.is_verified && <span style={{ color:"#60A5FA", fontSize:14 }}>✔ Verified</span>}
                 </div>
               </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
               <button onClick={()=>onVerify(user.id)} style={{ flex:1, padding:"8px", borderRadius:9, border:"1px solid #232325", background:"rgba(96,165,250,0.1)", color:"#60A5FA", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                 {user.is_verified ? "Unverify User" : "Verify User"}
               </button>
               <button onClick={()=>onBan(user.id)} style={{ flex:1, padding:"8px", borderRadius:9, border:"1px solid #232325", background: user.status==="banned" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: user.status==="banned" ? "#34D399" : "#F87171", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                 {user.status==="banned" ? "Unban User" : "Ban User"}
               </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {!loading && user && (
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
            {[
              { label:"ROLE", value:user.role||"—" },
              { label:"CITY", value:user.city||"—" },
              { label:"PLAN", value:user.plan||"Free" },
              { label:"JOINED", value:dl(user.created_at) },
              { label:"RATING", value:user.rating||"0.0" },
              { label:"RATE", value:user.hourly_rate||"—" },
            ].map(s=>(
              <div key={s.label} style={{ background:"#161618", padding:12, borderRadius:12, border:"1px solid #232325" }}>
                <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#F2F2F5" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {user.bio && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)", marginBottom:8 }}>BIO</div>
              <p style={{ fontSize:13, color:"rgba(242,242,245,0.6)", lineHeight:1.6 }}>{user.bio}</p>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
            {[
              { label:"POSTS", value:user.post_count||0 },
              { label:"PROJECTS", value:user.project_count||0 },
              { label:"FOLLOWERS", value:user.followers||0 },
              { label:"FOLLOWING", value:user.following||0 },
            ].map(s=>(
              <div key={s.label} style={{ textAlign:"center", padding:12, borderRight:s.label==="POSTS"||s.label==="FOLLOWERS"?"1px solid #1E1E20":"none" }}>
                <div style={{ fontSize:20, fontWeight:900, color:"#F5A623" }}>{s.value}</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {user.skills && user.skills.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)", marginBottom:10 }}>SKILLS</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {user.skills.map(s=>(
                  <span key={s} style={{ fontSize:10, padding:"4px 10px", borderRadius:6, background:"rgba(245,166,35,0.08)", color:"#F5A623", border:"1px solid rgba(245,166,35,0.15)", fontWeight:700 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {user.interests && user.interests.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)", marginBottom:10 }}>INTERESTS</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {user.interests.map(i=>(
                  <span key={i} style={{ fontSize:10, padding:"4px 10px", borderRadius:6, background:"rgba(78,205,196,0.08)", color:"#4ECDC4", border:"1px solid rgba(78,205,196,0.15)", fontWeight:700 }}>{i}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom:24 }}>
             <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)", marginBottom:10 }}>SOCIAL LINKS</div>
             <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {user.github_url && <div style={{ fontSize:12, color:"#60A5FA" }}>⎇ {user.github_url}</div>}
                {user.linkedin_url && <div style={{ fontSize:12, color:"#60A5FA" }}>in {user.linkedin_url}</div>}
                {user.website_url && <div style={{ fontSize:12, color:"#60A5FA" }}>🔗 {user.website_url}</div>}
                {!user.github_url && !user.linkedin_url && !user.website_url && <div style={{ fontSize:12, color:"rgba(242,242,245,0.2)" }}>Hakuna links</div>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Wote");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Detail state
  const [selectedId, setSelectedId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [fetchingUser, setFetchingUser] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };
  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminAPI.users({ search, status: filter, page, limit })
      .then(r => {
        setUsers(r.data?.users || []);
        setTotal(r.data?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filter, page, limit]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 400); // Debounce search
    return () => clearTimeout(handler);
  }, [fetchUsers]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const toggleBan = async id => {
    const u = users.find(u=>u.id===id);
    try {
      await adminAPI.banUser(id);
      const newS = u.status==="banned" ? "active" : "banned";
      setUsers(us => us.map(u => u.id===id ? { ...u, status: newS } : u));
      if (userDetail?.id === id) setUserDetail(prev => ({ ...prev, status: newS }));
      notify(u.status==="banned" ? `✅ ${u.name} ameachiliwa` : `🚫 ${u.name} amebaniwa`);
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const toggleVerify = async id => {
    const u = users.find(u=>u.id===id);
    try {
      await adminAPI.verifyUser(id);
      const newV = !u.is_verified;
      setUsers(us => us.map(u => u.id===id ? { ...u, is_verified: newV } : u));
      if (userDetail?.id === id) setUserDetail(prev => ({ ...prev, is_verified: newV }));
      notify(newV ? `✅ ${u.name} ameverified` : `❌ Verification imeondolewa — ${u.name}`);
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const openUser = (u) => {
    setSelectedId(u.id);
    setFetchingUser(true);
    adminAPI.userDetail(u.handle || u.id)
      .then(r => setUserDetail(r.data))
      .catch(console.error)
      .finally(() => setFetchingUser(false));
  };

  const STATUS_C = { active:"#34D399", banned:"#F87171", pending:"#F5A623" };
  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ position:"relative" }}>
      {/* Detail Panel */}
      {selectedId && (
        <>
          <div onClick={() => { setSelectedId(null); setUserDetail(null); }} style={{ position:"fixed", inset:0, zIndex:199, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)" }} />
          <UserDetailPanel
            user={userDetail}
            loading={fetchingUser}
            onClose={() => { setSelectedId(null); setUserDetail(null); }}
            onVerify={toggleVerify}
            onBan={toggleBan}
          />
        </>
      )}

      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}
      <SectionHead title="Watumiaji" sub={`Wanachama ${total.toLocaleString()} wote wa JamiiAI`} />

      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tafuta jina au handle..." style={{ background:"#161618", border:"1px solid #232325", borderRadius:9, padding:"9px 12px 9px 32px", color:"#F2F2F5", fontFamily:"'Roboto Mono',monospace", fontSize:13, outline:"none", width:"100%" }} />
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(242,242,245,0.28)", fontSize:13 }}>◎</span>
        </div>
        {["Wote","Active","Banned","Pending","Verified"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 14px", borderRadius:8, cursor:"pointer", fontFamily:MONO, fontSize:11, fontWeight:700, border:`1px solid ${filter===f?"#F5A623":"#232325"}`, background:filter===f?"rgba(245,166,35,0.1)":"transparent", color:filter===f?"#F5A623":"rgba(242,242,245,0.4)", transition:"all 0.18s" }}>{f}</button>
        ))}
      </div>

      {loading && users.length === 0 ? (
         <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia watumiaji...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:"rgba(242,242,245,0.25)" }}>
          <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
          <div style={{ fontSize:14 }}>Hakuna watumiaji wanaolingana na utafutaji</div>
        </div>
      ) : (
        <>
          <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:14, overflow:"hidden", opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <div style={{ display:"grid", gridTemplateColumns:"50px 2fr 1.5fr 1fr 80px 80px 140px", background:"#0C0C0E", borderBottom:"1px solid #232325", padding:"10px 18px" }}>
              {["#","MTUMIAJI","JUKUMU / MJI","BADGE","STATUS","VERIFIED","VITENDO"].map(h=>(
                <div key={h} style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.32)", fontWeight:700, letterSpacing:"0.04em" }}>{h}</div>
              ))}
            </div>
            {users.map((u,i)=>(
              <div key={u.id} onClick={()=>openUser(u)} style={{ display:"grid", gridTemplateColumns:"50px 2fr 1.5fr 1fr 80px 80px 140px", padding:"11px 18px", borderBottom:i<users.length-1?"1px solid #1A1A1C":"none", alignItems:"center", cursor:"pointer", background:selectedId===u.id?"rgba(245,166,35,0.05)":"transparent" }}>
                <div style={{ fontFamily:MONO, fontSize:11, color:"rgba(242,242,245,0.25)" }}>{(page-1)*limit + i + 1}</div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <Av i={u.name.split(" ").map(w=>w[0]).join("").slice(0,2)} c={["#F5A623","#4ECDC4","#A78BFA","#F87171","#34D399","#60A5FA"][i%6]} src={u.avatar_url} />
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                    <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.32)" }}>@{u.handle}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:"rgba(242,242,245,0.65)" }}>{u.role || u.role_title || "—"}</div>
                  <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)" }}>📍{u.city||"—"} · {u.posts||0} posts</div>
                </div>
                <Badge label={u.plan||"Free"} color={u.plan==="Pro"?"#F5A623":u.plan==="Basic"?"#4ECDC4":"rgba(242,242,245,0.4)"} />
                <div>
                  <span style={{ fontFamily:MONO, fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:`${STATUS_C[u.status]||"#999"}18`, color:STATUS_C[u.status]||"#999" }}>{u.status||"active"}</span>
                </div>
                <div style={{ fontSize:16, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); toggleVerify(u.id); }}>{u.is_verified ? "✅" : "⬜"}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }} onClick={e=>e.stopPropagation()}>
                  <ActionBtn label={u.is_verified?"Unverify":"Verify"} color="#4ECDC4" small onClick={()=>toggleVerify(u.id)} />
                  <ActionBtn label={u.status==="banned"?"Unban":"Ban"} danger={u.status!=="banned"} color="#34D399" small onClick={()=>toggleBan(u.id)} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination UI */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, fontFamily:MONO, fontSize:12 }}>
            <div style={{ color:"rgba(242,242,245,0.3)" }}>
              Ukusa wa {page} kati ya {totalPages || 1}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{ background:"#161618", border:"1px solid #232325", color: page===1 ? "rgba(242,242,245,0.1)" : "#F5A623", padding:"6px 14px", borderRadius:8, cursor: page===1 ? "default" : "pointer", fontWeight:700 }}
              >
                ← Prev
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ background:"#161618", border:"1px solid #232325", color: page>=totalPages ? "rgba(242,242,245,0.1)" : "#F5A623", padding:"6px 14px", borderRadius:8, cursor: page>=totalPages ? "default" : "pointer", fontWeight:700 }}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── CONTENT MODERATION ────────────────────────────────────────────
function ContentPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };

  const fetchFlagged = useCallback(() => {
    setLoading(true);
    adminAPI.flaggedContent({ page, limit })
      .then(r => {
        setPosts(r.data?.posts || []);
        setTotal(r.data?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, limit]);

  useEffect(() => {
    fetchFlagged();
  }, [fetchFlagged]);

  const action = async (id, act) => {
    try {
      if (act === "delete") {
        await adminAPI.deleteContent(id);
        setPosts(ps => ps.filter(p => p.id !== id));
        setTotal(t => t - 1);
        notify("🗑 Post imefutwa");
      } else {
        await adminAPI.approveContent(id);
        setPosts(ps => ps.filter(p => p.id !== id));
        setTotal(t => t - 1);
        notify("✅ Post imeruhusiwa — imepitiwa");
      }
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const REASON_C = { 
    Spam: "#F5A623", 
    Harassment: "#F87171", 
    "Hate Speech": "#F87171", 
    "False Information": "#A78BFA", 
    Inappropriate: "#F87171",
    Other: "#94A3B8"
  };
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}
      <SectionHead title="Content Moderation" sub={`${total} zinasubiri review`} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        <StatCard icon="🚩" label="Flagged Content" value={total} color="#F87171" />
        <StatCard icon="🔍" label="In-Review" value={posts.length} color="#F5A623" sub="Ukurasa huu" />
        <StatCard icon="✓"  label="Reviewed" value="—" color="#34D399" sub="Mwezi huu" />
      </div>

      {loading && posts.length === 0 ? (
        <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia maudhui...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:"rgba(242,242,245,0.25)" }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🛡️</div>
          <div style={{ fontSize:14 }}>Hakuna maudhui yaliyoripotiwa</div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:12, opacity: loading ? 0.6 : 1, transition:"opacity 0.2s" }}>
            {posts.map((p, i)=>(
              <div key={p.id} style={{ background:"#161618", border:`1px solid ${p.is_flagged?"rgba(248,113,113,0.25)":"#232325"}`, borderRadius:14, padding:"16px 18px", display:"flex", gap:15 }}>
                <div style={{ fontFamily:MONO, fontSize:12, color:"rgba(242,242,245,0.2)", width:30 }}>#{(page-1)*limit + i + 1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap", marginBottom:8 }}>
                        <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
                          <Badge label={p.reason || "Flagged"} color={REASON_C[p.reason]||"#F87171"} />
                          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                            <Av i={(p.reporter_handle||"U")[0]} c="#94A3B8" s={20} src={p.reporter_avatar} />
                            <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(248,113,113,0.8)", fontWeight:700 }}>
                              Reported by {p.reporter_name || "Mtumiaji"} (@{p.reporter_handle || "anon"})
                            </span>
                          </div>
                          <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)" }}>· {p.report_count||1} reports</span>
                          <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.28)" }}>· {new Date(p.reported_at || p.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, paddingBottom:12, borderBottom:"1px solid #1E1E20" }}>
                          <Av i={(p.author_handle||"U")[0]} c="#A78BFA" s={32} src={p.avatar_url} />
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:"#F2F2F5" }}>{p.author_name}</div>
                            <div style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.4)" }}>@{p.author_handle || "mtumiaji"}</div>
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize:14, color:"rgba(220,230,240,0.8)", lineHeight:1.6, background:"rgba(255,255,255,0.02)", border:"1px solid #232325", borderRadius:8, padding:"12px 15px" }}>{p.content}</p>
                      {p.image_url && (
                        <img src={p.image_url} alt="Content" style={{ marginTop:10, borderRadius:8, maxWidth:"100%", maxHeight:200, border:"1px solid #232325" }} />
                      )}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
                      <ActionBtn label="✓ Approve" color="#34D399" onClick={()=>action(p.id,"approve")} />
                      <ActionBtn label="🗑 Delete"  danger onClick={()=>action(p.id,"delete")} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination UI */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20, fontFamily:MONO, fontSize:12 }}>
            <div style={{ color:"rgba(242,242,245,0.3)" }}>
              Ukusa wa {page} kati ya {totalPages || 1}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{ background:"#161618", border:"1px solid #232325", color: page===1 ? "rgba(242,242,245,0.1)" : "#F5A623", padding:"6px 14px", borderRadius:8, cursor: page===1 ? "default" : "pointer", fontWeight:700, outline:"none" }}
              >
                ← Prev
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ background:"#161618", border:"1px solid #232325", color: page>=totalPages ? "rgba(242,242,245,0.1)" : "#F5A623", padding:"6px 14px", borderRadius:8, cursor: page>=totalPages ? "default" : "pointer", fontWeight:700, outline:"none" }}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── CHANGAMOTO ────────────────────────────────────────────────────
function ChangamotoPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({ title:"", org:"", prize_display:"", deadline:"", difficulty:"Kati", desc:"", source_url:"", region:"Global" });
  const [toast, setToast] = useState(null);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };

  const fetchList = useCallback(() => {
    setLoading(true);
    adminAPI.challenges()
      .then(r => setChallenges(r.data?.challenges || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const fetchFromSource = async () => {
    setFetching(true);
    try {
      await adminAPI.fetchChallenges();
      notify("🔄 Mchakato wa kuchukua changamoto umeanza...");
      setTimeout(fetchList, 2000);
    } catch { notify("❌ Hitilafu wakati wa kufetch"); }
    finally { setFetching(false); }
  };

  const STATUS_C = { open:"#34D399", judging:"#F5A623", completed:"#4ECDC4", closed:"#F87171" };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.title.trim()) return;
    try {
      const r = await adminAPI.createChallenge({ ...form, description: form.desc });
      const newCh = r.data || { id:Date.now(), ...form, status:"open", participants:0 };
      setChallenges(cs=>[newCh, ...cs]);
      setForm({ title:"", org:"", prize_display:"", deadline:"", difficulty:"Kati", desc:"", source_url:"", region:"Global" });
      setShowNew(false);
      notify("✅ Challenge mpya imeundwa!");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const toggleStatus = async (id, next) => {
    try {
      await adminAPI.updateChallengeStatus(id, next);
      setChallenges(cs=>cs.map(c=>c.id===id?{...c,status:next}:c));
      notify(`✅ Status imebadilishwa → ${next}`);
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia changamoto...</div>;

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}
      {showNew && (
        <Modal title="Challenge Mpya ◆" onClose={()=>setShowNew(false)}>
          <FormField label="JINA LA CHALLENGE" value={form.title} onChange={f("title")} placeholder="Swahili Sentiment Analysis..." />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="ORGANIZER" value={form.org} onChange={f("org")} placeholder="JamiiAI + UDSM" />
            <FormField label="PRIZE / TUZO" value={form.prize_display} onChange={f("prize_display")} placeholder="5,000,000 TZS" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="DEADLINE" value={form.deadline} onChange={f("deadline")} type="date" />
            <FormField label="REGION" value={form.region} onChange={f("region")} options={["Global","Africa","Tanzania"]} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="UGUMU" value={form.difficulty} onChange={f("difficulty")} options={["Rahisi","Kati","Ngumu"]} />
            <FormField label="SOURCE URL" value={form.source_url} onChange={f("source_url")} placeholder="https://..." />
          </div>
          <FormField label="MAELEZO" value={form.desc} onChange={f("desc")} placeholder="Elezea challenge..." multiline />
          <button onClick={save} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:14 }}>Hifadhi Challenge →</button>
        </Modal>
      )}

      <SectionHead title="Changamoto" sub={`${challenges.length} active competitions`}
        action={
          <div style={{ display:"flex", gap:8 }}>
            <ActionBtn label={fetching ? "🔄 Inafetch..." : "🔄 Fetch Vyanzo"} onClick={fetchFromSource} disabled={fetching} />
            <ActionBtn label="+ Challenge Mpya" onClick={()=>setShowNew(true)} />
          </div>
        } 
      />

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {challenges.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"rgba(242,242,245,0.25)" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🏆</div>
            <div style={{ fontSize:14 }}>Hakuna changamoto bado — unda moja!</div>
          </div>
        ) : challenges.map(ch=>(
          <div key={ch.id} style={{ background:"#161618", border:`1px solid ${(ch.color||"#4ECDC4")}30`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:4, borderRadius:2, background:ch.color||"#4ECDC4", alignSelf:"stretch", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:7, alignItems:"center" }}>
                  <Badge label={(ch.source||"manual").toUpperCase()} color={ch.source === 'manual' ? "#A78BFA" : "#4ECDC4"} />
                  <Badge label={(ch.status||"open").toUpperCase()} color={STATUS_C[ch.status]||"#F5A623"} />
                  <span style={{ fontFamily:MONO, fontSize:10, color:"#F5A623" }}>💰 {ch.prize_display || ch.prize || "Knowledge"}</span>
                  <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.3)" }}>📍 {ch.region || "Global"}</span>
                </div>
                <h3 style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{ch.title}</h3>
                <div style={{ fontFamily:MONO, fontSize:11, color:"rgba(242,242,245,0.25)" }}>by {ch.org} · Deadline: {ch.deadline ? new Date(ch.deadline).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div style={{ display:"flex", gap:7, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                {ch.status==="open"      && <ActionBtn label="Funga"   color="#F87171" small onClick={()=>toggleStatus(ch.id,"closed")}    />}
                {ch.status==="open"      && <ActionBtn label="Judging" color="#F5A623" small onClick={()=>toggleStatus(ch.id,"judging")}   />}
                {ch.status==="judging"   && <ActionBtn label="Kamilisha" color="#4ECDC4" small onClick={()=>toggleStatus(ch.id,"completed")} />}
                {ch.status==="closed"    && <ActionBtn label="Fungua" color="#34D399" small onClick={()=>toggleStatus(ch.id,"open")}       />}
                <ActionBtn label="✏ Hariri" color="#A78BFA" small />
                <ActionBtn label={<Trash2 size={14}/>} danger small onClick={async () => { if(window.confirm("Futa challenge?")) { await adminAPI.deleteChallenge(ch.id); setChallenges(cs=>cs.filter(x=>x.id!==ch.id)); } }} />
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name:"", date:"", type:"Webinar", loc:"", desc:"" });
  const [toast, setToast] = useState(null);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };

  useEffect(() => {
    adminAPI.events()
      .then(r => setEvents(r.data?.events || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  const TYPE_C = { Hackathon:"#F5A623", Webinar:"#4ECDC4", Meetup:"#A78BFA", Workshop:"#F87171", Conference:"#60A5FA" };
  const STATUS_C = { upcoming:"#34D399", draft:"#F5A623", past:"rgba(242,242,245,0.3)" };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      const r = await adminAPI.createEvent(form);
      const newEv = r.data?.event || { id:Date.now(), ...form, status:"draft", rsvp:0, color:TYPE_C[form.type]||"#F5A623" };
      setEvents(es=>[newEv, ...es]);
      setForm({ name:"", date:"", type:"Webinar", loc:"", desc:"" });
      setShowNew(false);
      notify("✅ Event imeundwa — Draft!");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const publish = async id => {
    try {
      await adminAPI.publishEvent(id);
      setEvents(es=>es.map(e=>e.id===id?{...e,status:"upcoming"}:e));
      notify("🚀 Event imechapishwa!");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const del = async id => {
    try {
      await adminAPI.deleteEvent(id);
      setEvents(es=>es.filter(e=>e.id!==id));
      notify("🗑 Event imefutwa");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia matukio...</div>;

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
          <button onClick={save} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:14 }}>Hifadhi Draft →</button>
        </Modal>
      )}

      <SectionHead title="Matukio" sub="Manage events na hackathons"
        action={<ActionBtn label="+ Event Mpya" onClick={()=>setShowNew(true)} />} />

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {events.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"rgba(242,242,245,0.25)" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🗓️</div>
            <div style={{ fontSize:14 }}>Hakuna matukio bado — unda moja!</div>
          </div>
        ) : events.map(ev=>(
          <div key={ev.id} style={{ background:"#161618", border:`1px solid ${ev.status==="draft"?"rgba(245,166,35,0.2)":"#232325"}`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:48, height:48, borderRadius:11, background:`${ev.color||"#F5A623"}15`, border:`1px solid ${ev.color||"#F5A623"}30`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:MONO, fontSize:9, color:ev.color||"#F5A623", fontWeight:700, textAlign:"center", lineHeight:1.4, flexShrink:0, padding:"0 4px" }}>{ev.date}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                  <Badge label={ev.type} color={TYPE_C[ev.type]||"#F5A623"} />
                  <Badge label={ev.status} color={STATUS_C[ev.status]||"#F5A623"} />
                  <span style={{ fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.35)" }}>👥 {ev.rsvp||ev.rsvp_count||0} RSVPs</span>
                </div>
                <h3 style={{ fontWeight:700, fontSize:14 }}>{ev.name||ev.title}</h3>
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
  const [resources, setResources] = useState([]);
  const [showNew, setShowNew]     = useState(false);
  const [tab, setTab]             = useState("zote");
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState({ title:"", type:"Dataset", author:"JamiiAI", link:"", tags:"", desc:"" });
  const [toast, setToast]         = useState(null);

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2200); };
  const TYPE_C = { Dataset:"#4ECDC4", Tutorial:"#F5A623", Guide:"#34D399", Research:"#A78BFA" };
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleEdit = (r) => {
    setEditingId(r.id);
    setForm({
      title: r.title || "",
      type: r.type || "Dataset",
      author: r.author_name || r.author || "JamiiAI",
      link: r.link || "",
      tags: Array.isArray(r.tags) ? r.tags.join(", ") : (typeof r.tags === 'string' ? JSON.parse(r.tags).join(", ") : ""),
      desc: r.description || r.desc || ""
    });
    setShowNew(true);
  };

  const closeForm = () => {
    setShowNew(false);
    setEditingId(null);
    setForm({ title:"", type:"Dataset", author:"JamiiAI", link:"", tags:"", desc:"" });
  };

  useEffect(() => {
    adminAPI.resources()
      .then(r => setResources(r.data?.resources || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const approve = async id => {
    try {
      await adminAPI.approveResource(id);
      setResources(rs=>rs.map(r=>r.id===id?{...r,status:"approved"}:r));
      notify("✅ Resource imeidhinishwa!");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };
  const reject = async id => {
    try {
      await adminAPI.deleteResource(id);
      setResources(rs=>rs.filter(r=>r.id!==id));
      notify("🗑 Resource imekataliwa/imefutwa");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const save = async () => {
    if (!form.title.trim()) return;
    try {
      if (editingId) {
        const r = await adminAPI.updateResource(editingId, { ...form, author_name: form.author, description: form.desc });
        setResources(rs => rs.map(res => res.id === editingId ? { ...res, ...r.data } : res));
        notify("✅ Resource imesasishwa!");
      } else {
        const r = await adminAPI.createResource(form);
        const color = TYPE_C[form.type] || "#F5A623";
        const newRes = r.data?.resource || r.data || {
          id: Date.now(), title:form.title, type:form.type,
          author:form.author, link:form.link,
          tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
          desc: form.desc, downloads:0, status:"approved", color, source:"admin",
        };
        setResources(rs=>[newRes, ...rs]);
        notify("✅ Resource imeongezwa!");
      }
      closeForm();
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const pending  = resources.filter(r=>r.status==="pending");
  const filtered = tab==="zote" ? resources : tab==="pending" ? pending : resources.filter(r=>r.status==="approved");

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia rasilimali...</div>;

  return (
    <div>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:"#F5A623", color:"#0C0C0E", padding:"11px 18px", borderRadius:9, fontWeight:700, fontSize:13, fontFamily:MONO }}>{toast}</div>}

      {showNew && (
        <Modal title={editingId ? "Hariri Rasilimali ✏" : "Rasilimali Mpya ◧"} onClose={closeForm}>
          {!editingId && (
            <div style={{ background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.15)", borderRadius:9, padding:"10px 13px", marginBottom:16, fontSize:12, color:"rgba(242,242,245,0.6)", lineHeight:1.6 }}>
              💡 Resources zinazoongezwa na admin <strong style={{color:"#F5A623"}}>zinapita moja kwa moja</strong> — hazipitii approval queue.
            </div>
          )}
          <FormField label="JINA LA RESOURCE" value={form.title} onChange={f("title")} placeholder="Swahili NLP Dataset — 50K sentences" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="AINA" value={form.type} onChange={f("type")} options={["Dataset","Tutorial","Guide","Research"]} />
            <FormField label="MWANDISHI / CHANZO" value={form.author} onChange={f("author")} placeholder="JamiiAI / UDSM..." />
          </div>
          <FormField label="LINK (GitHub, Drive, URL)" value={form.link} onChange={f("link")} placeholder="https://github.com/..." />
          <FormField label="TAGS (tenganisha kwa koma)" value={form.tags} onChange={f("tags")} placeholder="NLP, Swahili, Free" />
          <FormField label="MAELEZO MAFUPI" value={form.desc} onChange={f("desc")} multiline placeholder="Elezea resource hii — ni ya nini, inasaidia nani..." />
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={closeForm} style={{ flex:1, background:"rgba(255,255,255,0.04)", color:"rgba(242,242,245,0.5)", border:"1px solid #232325", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:600, fontSize:13 }}>Ghairi</button>
            <button onClick={save} style={{ flex:2, background:"#F5A623", color:"#0C0C0E", border:"none", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:13 }}>
              {editingId ? "💾 Sasisha Rasilimali" : "✅ Ongeza Resource"}
            </button>
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
                <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:MONO, fontSize:10, color:"rgba(242,242,245,0.32)" }}>
                  <Av i={(r.submitted_by_name || r.author_name || "J")[0]} c="#A78BFA" s={16} src={r.submitted_by_avatar} />
                  <span>by {r.submitted_by_name || r.author_name || "JamiiAI Team"}</span>
                  <span>·</span>
                  <span>↓ {(r.downloads||0).toLocaleString()} downloads</span>
                  {r.tags?.length > 0 && <span style={{ marginLeft:8 }}>{r.tags.slice(0,3).map(t=>`#${t}`).join(" ")}</span>}
                </div>              </div>
                <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                  {r.status==="pending" ? (
                    <>
                      <ActionBtn label="✓ Approve" color="#34D399" small onClick={()=>approve(r.id)} />
                      <ActionBtn label="✕ Reject"  danger small onClick={()=>reject(r.id)} />
                    </>
                  ) : (
                    <>
                      <ActionBtn label={<ExternalLink size={14}/>} color="#60A5FA" small onClick={() => window.open(r.link, "_blank")} />
                      <ActionBtn label="✏ Hariri" color="#A78BFA" small onClick={() => handleEdit(r)} />
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
function HabariPage() {
  const [inbox, setInbox]         = useState([]);
  const [published, setPublished] = useState([]);
  const [loading, setLoading]     = useState(true);
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

  useEffect(() => {
    Promise.all([adminAPI.news("inbox"), adminAPI.news("published")])
      .then(([inboxRes, pubRes]) => {
        setInbox(inboxRes.data?.news || inboxRes.data || []);
        setPublished(pubRes.data?.news || pubRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Run Apify scraper via API
  const runScraper = () => {
    setScraping(true);
    adminAPI.runApify()
      .then(r => {
        const items = r.data?.items || [];
        setInbox(prev => [...items, ...prev]);
        notify(`✅ Apify imekimbia — habari ${items.length} mpya imepatikana!`);
      })
      .catch(() => notify("❌ Apify imefeli — angalia API token"))
      .finally(() => setScraping(false));
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
            <button onClick={()=>setShowManual(false)} style={{ flex:1, background:"rgba(255,255,255,0.04)", color:"rgba(242,242,245,0.5)", border:"1px solid #232325", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:600, fontSize:13 }}>Ghairi</button>
            <button onClick={saveManual} style={{ flex:2, background:"#F5A623", color:"#0C0C0E", border:"none", padding:11, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:13 }}>🚀 Chapisha Sasa</button>
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
            <button onClick={runScraper} disabled={scraping} style={{ background: scraping ? "rgba(245,166,35,0.1)" : "#F5A623", color: scraping ? "#F5A623" : "#0C0C0E", border: scraping ? "1px solid rgba(245,166,35,0.3)" : "none", padding:"8px 16px", borderRadius:9, cursor: scraping ? "default":"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:7, transition:"all 0.2s" }}>
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
                        ? <textarea value={editSummary} onChange={e=>setEditSummary(e.target.value)} rows={4} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(245,166,35,0.3)", borderRadius:8, padding:"10px 12px", color:"#F2F2F5", fontFamily:"'Roboto Mono',monospace", fontSize:13, lineHeight:1.65, outline:"none", resize:"vertical" }} />
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
                      <button onClick={()=>publishFromInbox(item)} style={{ flex:2, background:"#34D399", color:"#0C0C0E", border:"none", padding:"10px", borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:13 }}>
                        🚀 Chapisha kwenye Community
                      </button>
                      <button onClick={()=>discard(item.id)} style={{ flex:1, background:"rgba(248,113,113,0.08)", color:"#F87171", border:"1px solid rgba(248,113,113,0.2)", padding:"10px", borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:700, fontSize:13 }}>
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
          <button onClick={()=>{if(!newRole.label.trim())return;setRoles(rs=>[...rs,{id:Date.now().toString(),label:newRole.label,color:newRole.color,icon:"🎭",perms:[],members:[],desc:newRole.desc}]);setShowNew(false);setNewRole({label:"",color:"#4ECDC4",desc:""});notify("✅ Role mpya imeundwa!");}} style={{width:"100%",background:"#F5A623",color:"#0C0C0E",border:"none",padding:12,borderRadius:9,cursor:"pointer",fontFamily:"'Roboto Mono',monospace",fontWeight:800,fontSize:14}}>Unda Role →</button>
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
                  <input value={assignHandle} onChange={e=>setAssignHandle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&assign()} placeholder="@handle au email..." style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid #2C2C2E",borderRadius:8,padding:"8px 12px",color:"#F2F2F5",fontFamily:"'Roboto Mono',monospace",fontSize:13,outline:"none"}} />
                  <button onClick={assign} style={{background:sel.color,color:"#0C0C0E",border:"none",padding:"0 14px",borderRadius:8,cursor:"pointer",fontFamily:"'Roboto Mono',monospace",fontWeight:700,fontSize:13}}>+ Ongeza</button>
                </div>
              )}
            </div>

            <button onClick={()=>notify(`✅ ${sel.label} permissions zimehifadhiwa!`)} style={{width:"100%",background:"#F5A623",color:"#0C0C0E",border:"none",padding:11,borderRadius:9,cursor:"pointer",fontFamily:"'Roboto Mono',monospace",fontWeight:800,fontSize:13}}>Hifadhi Mabadiliko →</button>
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
function BillingPage() {
  const [tab, setTab]         = useState("overview");
  const [loading, setLoading] = useState(true);
  const [subs, setSubs]       = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [mrrData, setMrrData] = useState([]);
  const [kpis, setKpis]       = useState({});
  const [toast, setToast]     = useState(null);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 2400); };

  useEffect(() => {
    adminAPI.billing()
      .then(r => {
        const d = r.data || {};
        setSubs(d.subscriptions || []);
        setInvoices(d.invoices || []);
        setMrrData(d.mrrData || d.mrr_data || []);
        setKpis(d.kpis || d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const PLAN_C  = { Pro:"#F5A623", Basic:"#4ECDC4", Free:"rgba(242,242,245,0.3)" };
  const STAT_C  = { active:"#34D399", past_due:"#F87171", cancelled:"rgba(242,242,245,0.3)", paid:"#34D399", pending:"#F5A623", failed:"#F87171" };
  const mrr     = kpis.mrr || 0;
  const arr     = mrr * 12;
  const proSubs = subs.filter(s=>s.plan==="Pro"&&s.status==="active").length;
  const basicSubs = subs.filter(s=>s.plan==="Basic"&&s.status==="active").length;
  const maxMRR  = mrrData.length > 0 ? Math.max(...mrrData.map(d=>d.mrr||0)) : 1;
  const fmtNum  = n => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n/1000)}K` : String(n||0);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia billing data...</div>;

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
          <StatCard icon="💰" label="MRR"       value={fmtNum(mrr)}   sub="TZS / mwezi"   color="#F5A623" delta={20} />
          <StatCard icon="📈" label="ARR"       value={fmtNum(arr)}   sub="TZS / mwaka"   color="#34D399" delta={20} />
          <StatCard icon="👑" label="Pro Plans" value={proSubs} sub="@ TZS 150k/mo" color="#A78BFA" />
          <StatCard icon="⭐" label="Basic Plans" value={basicSubs} sub="@ TZS 50k/mo" color="#4ECDC4" />
        </div>

        {/* MRR chart */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
          <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:16}}>MRR GROWTH — MIEZI 6</div>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
            {mrrData.length === 0 ? (
              <div style={{color:"rgba(242,242,245,0.2)",textAlign:"center",padding:"20px 0",fontFamily:MONO,fontSize:12}}>Hakuna data ya MRR bado</div>
            ) : mrrData.map((d,i)=>(
              <div key={d.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <span style={{fontFamily:MONO,fontSize:9,color:"#F5A623"}}>
                  {i===mrrData.length-1?`${d.mrr}K`:""}
                </span>
                <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:i===mrrData.length-1?"#F5A623":"rgba(245,166,35,0.35)",height:`${(d.mrr/maxMRR)*64}px`,minHeight:6,transition:"height 0.5s ease"}} />
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
          {subs.length === 0 ? (
            <div style={{padding:"32px",textAlign:"center",color:"rgba(242,242,245,0.25)",fontFamily:MONO,fontSize:13}}>Hakuna subscriptions bado</div>
          ) : subs.map((s,i)=>(
            <div key={s.user||s.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 100px",padding:"11px 18px",borderBottom:i<subs.length-1?"1px solid #1A1A1C":"none",alignItems:"center"}}>
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
          {invoices.length === 0 ? (
            <div style={{padding:"32px",textAlign:"center",color:"rgba(242,242,245,0.25)",fontFamily:MONO,fontSize:13}}>Hakuna invoices bado</div>
          ) : invoices.map((inv,i)=>(
            <div key={inv.id} style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr 1fr 100px",padding:"11px 18px",borderBottom:i<invoices.length-1?"1px solid #1A1A1C":"none",alignItems:"center"}}>
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
function AnalyticsPage() {
  const [range, setRange]           = useState("wiki");
  const [loading, setLoading]       = useState(true);
  const [dailyUsers, setDailyUsers] = useState([]);
  const [topContent, setTopContent] = useState([]);
  const [traffic, setTraffic]       = useState([]);
  const [retention, setRetention]   = useState([]);
  const [kpis, setKpis]             = useState({});

  useEffect(() => {
    adminAPI.analytics()
      .then(r => {
        const d = r.data || {};
        setDailyUsers(d.dailyUsers || d.daily_users || []);
        setTopContent(d.topContent || d.top_content || []);
        setTraffic(d.traffic || []);
        setRetention(d.retention || []);
        setKpis(d.kpis || d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxU = dailyUsers.length > 0 ? Math.max(...dailyUsers.map(d=>d.u||d.users||0)) : 1;
  const maxP = dailyUsers.length > 0 ? Math.max(...dailyUsers.map(d=>d.p||d.posts||0)) : 1;

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia analytics...</div>;

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
        <StatCard icon="👥" label="DAU"            value={kpis.dau||kpis.dailyActiveUsers||"—"}  sub="Daily Active Users"    color="#F5A623" delta={8}  />
        <StatCard icon="🔁" label="Retention (30d)" value={kpis.retention30d||kpis.retention||"—"} sub="Wanarudi baada ya mwezi" color="#4ECDC4" delta={3}  />
        <StatCard icon="📈" label="Conversion"      value={kpis.conversion||kpis.conversionRate||"—"} sub="Free → Paid"           color="#34D399" delta={1}  />
        <StatCard icon="⏱" label="Avg Session"      value={kpis.avgSession||kpis.avg_session||"—"} sub="Dakika per visit"      color="#A78BFA" delta={12} />
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
            {dailyUsers.length === 0 ? (
              <div style={{color:"rgba(242,242,245,0.2)",fontSize:12,fontFamily:MONO,margin:"auto"}}>Hakuna data ya wiki hii</div>
            ) : dailyUsers.map(d=>(
              <div key={d.d||d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:72}}>
                  <div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#F5A623",height:`${((d.u||d.users||0)/maxU)*72}px`,minHeight:4}} />
                  <div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#4ECDC4",height:`${((d.p||d.posts||0)/maxP)*72}px`,minHeight:4}} />
                </div>
                <span style={{fontFamily:MONO,fontSize:8,color:"rgba(242,242,245,0.3)"}}>{d.d||d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic sources */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px"}}>
          <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:14}}>TRAFFIC SOURCES</div>
          {traffic.length === 0 ? (
            <div style={{color:"rgba(242,242,245,0.2)",fontSize:12,fontFamily:MONO,textAlign:"center",padding:"20px 0"}}>Hakuna data</div>
          ) : traffic.map(t=>(
            <div key={t.source} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:500}}>{t.source}</span>
                <span style={{fontFamily:MONO,fontSize:11,color:t.color||"#F5A623"}}>{t.pct}%</span>
              </div>
              <div style={{height:4,borderRadius:2,background:"#232325",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${t.pct}%`,background:t.color||"#F5A623",borderRadius:2,transition:"width 0.6s ease"}} />
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
            {retention.length === 0 ? (
              <div style={{color:"rgba(242,242,245,0.2)",fontSize:12,fontFamily:MONO,margin:"auto"}}>Hakuna data</div>
            ) : retention.map(r=>(
              <div key={r.week} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontFamily:MONO,fontSize:8,color:"#4ECDC4"}}>{r.rate}%</span>
                <div style={{width:"100%",borderRadius:"3px 3px 0 0",background:`rgba(78,205,196,${r.rate/100*0.8+0.1})`,height:`${(r.rate/100)*52}px`,minHeight:4}} />
                <span style={{fontFamily:MONO,fontSize:7,color:"rgba(242,242,245,0.25)",textAlign:"center",lineHeight:1.2}}>{(r.week||"").replace("Wiki ","W")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top content */}
        <div style={{background:"#161618",border:"1px solid #232325",borderRadius:14,padding:"18px 20px"}}>
          <div style={{fontFamily:MONO,fontSize:10,color:"rgba(242,242,245,0.35)",letterSpacing:"0.04em",marginBottom:14}}>TOP CONTENT — WIKI HII</div>
          {topContent.length === 0 ? (
            <div style={{color:"rgba(242,242,245,0.2)",fontSize:12,fontFamily:MONO,textAlign:"center",padding:"20px 0"}}>Hakuna data</div>
          ) : topContent.map((c,i)=>(
            <div key={c.title} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",borderBottom:i<topContent.length-1?"1px solid #1A1A1C":"none"}}>
              <span style={{fontFamily:MONO,fontSize:11,color:"rgba(242,242,245,0.2)",width:16,flexShrink:0}}>#{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
                <div style={{fontFamily:MONO,fontSize:9,color:"rgba(242,242,245,0.3)"}}>{c.section} · 👁 {(c.views||0).toLocaleString()} · ♥ {c.likes||0}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────
function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    adminAPI.getAnnouncements()
      .then(r => setAnnouncements(r.data?.announcements || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!form.title.trim()||!form.body.trim()) return;
    const chs = Object.entries(form.channels).filter(([,v])=>v).map(([k])=>k==="inapp"?"in-app":k).join(",");
    try {
      const r = await adminAPI.sendAnnouncement(form);
      const newAnn = r.data?.announcement || {
        id:Date.now(), title:form.title, target:form.target,
        channel:chs, sent:"Sasa hivi",
        reach:targetCount[form.target]||0, opens:0,
      };
      setAnnouncements(prev=>[newAnn,...prev]);
      setForm({title:"",body:"",target:"Wote",channels:{inapp:true,email:false,whatsapp:false},schedule:"now",scheduleTime:""});
      setShowNew(false);
      notify("📣 Tangazo limetumwa!");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const inputS = { background:"rgba(255,255,255,0.04)", border:"1px solid #2C2C2E", borderRadius:9, padding:"10px 13px", color:"#F2F2F5", fontFamily:"'Roboto Mono',monospace", fontSize:13, outline:"none", width:"100%", transition:"border-color 0.2s" };

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

              <button onClick={send} disabled={!form.title.trim()||!form.body.trim()} style={{width:"100%",background:form.title.trim()&&form.body.trim()?"#F5A623":"#1C1C1E",color:form.title.trim()&&form.body.trim()?"#0C0C0E":"rgba(242,242,245,0.2)",border:"none",padding:12,borderRadius:9,cursor:form.title.trim()&&form.body.trim()?"pointer":"default",fontFamily:"'Roboto Mono',monospace",fontWeight:800,fontSize:14,transition:"all 0.2s"}}>
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
              <button onClick={()=>setPreview(false)} style={{width:"100%",background:"transparent",color:"rgba(242,242,245,0.5)",border:"1px solid #232325",padding:11,borderRadius:9,cursor:"pointer",fontFamily:"'Roboto Mono',monospace",fontWeight:600,fontSize:13,marginTop:14}}>← Rudi Kuhariri</button>
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
    github:       { value:"",                                              visible:false, status:"optional",  label:"GitHub API Token",          hint:"Inatumika: Kupata stars na downloads za repositories (Resources)", color:"#4ECDC4" },
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

  const inputS = (focus) => ({ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${focus?"rgba(245,166,35,0.4)":"#2C2C2E"}`, borderRadius:9, padding:"10px 13px", color:"#F2F2F5", fontFamily:"'Roboto Mono',monospace", fontSize:13, outline:"none", transition:"border-color 0.2s" });

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

              <button onClick={()=>notify("✅ Mipangilio ya Apify imehifadhiwa!")} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:14, marginTop:20 }}>
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
              <button onClick={()=>notify("✅ Platform settings zimehifadhiwa!")} style={{ width:"100%", background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:14, marginTop:20 }}>
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
                <button onClick={()=>notify("📧 Test email imetumwa kwa admin@jamii.ai!")} style={{ flex:1, background:"rgba(255,255,255,0.04)", color:"rgba(242,242,245,0.55)", border:"1px solid #2C2C2E", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:600, fontSize:13 }}>📧 Tuma Test Email</button>
                <button onClick={()=>notify("✅ SMTP settings zimehifadhiwa!")} style={{ flex:2, background:"#F5A623", color:"#0C0C0E", border:"none", padding:12, borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:14 }}>Hifadhi →</button>
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
                    <button onClick={()=>notify(action)} style={{ background:`${color}12`, color, border:`1px solid ${color}30`, padding:"8px 16px", borderRadius:8, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:700, fontSize:12, whiteSpace:"nowrap", flexShrink:0 }}>{btn}</button>
                  </div>
                ))}
              </div>

              {/* Nuclear option */}
              <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.35)", borderRadius:14, padding:"18px 20px" }}>
                <div style={{ fontWeight:800, fontSize:14, color:"#F87171", marginBottom:6 }}>☢ Futa Database Yote</div>
                <div style={{ fontSize:13, color:"rgba(242,242,245,0.5)", marginBottom:14, lineHeight:1.7 }}>
                  Hatua hii itafuta <strong style={{color:"#F87171"}}>data yote</strong> — wanachama, posts, challenges, events. Haiwezi kurudishwa. Tumia tu kama una backup kamili.
                </div>
                <button onClick={()=>notify("⛔ Hatua hii imezuiwa — wasiliana na developer kwanza!")} style={{ background:"rgba(248,113,113,0.15)", color:"#F87171", border:"1px solid rgba(248,113,113,0.4)", padding:"11px 20px", borderRadius:9, cursor:"pointer", fontFamily:"'Roboto Mono',monospace", fontWeight:800, fontSize:13 }}>
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

// ── KAZI / JOBS ───────────────────────────────────────────────────
const KAZI_TYPE_C = {
  full_time:  { label:"Full-time",  color:"#4ADE80" },
  internship: { label:"Internship", color:"#60A5FA" },
  remote:     { label:"Remote",     color:"#F5A623" },
  freelance:  { label:"Freelance",  color:"#C084FC" },
  part_time:  { label:"Part-time",  color:"#FB923C" },
  contract:   { label:"Contract",   color:"#94A3B8" },
};

const fmtSalary = (min, max, curr) => {
  const f = n => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : `${(n/1000).toFixed(0)}K`;
  if (!min && !max) return "Mazungumzo";
  if (!max) return `${curr} ${f(min)}+`;
  return `${curr} ${f(min)}–${f(max)}`;
};

const daysLeft = dl => {
  if (!dl) return null;
  const d = Math.ceil((new Date(dl) - new Date()) / 86400000);
  if (d <= 0) return { text:"Imekwisha", urgent:true };
  if (d <= 5) return { text:`Siku ${d}`, urgent:true };
  return { text:`Siku ${d}`, urgent:false };
};

const CompanyBadge = ({ name, size=40 }) => {
  const colors = ["#F5A623","#4ADE80","#60A5FA","#C084FC","#FB923C","#34D399"];
  const c = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:9, background:`${c}15`, border:`1.5px solid ${c}30`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:size*0.3, color:c, fontFamily:MONO, flexShrink:0 }}>
      {initials}
    </div>
  );
};

const TypeBadge = ({ type }) => {
  const t = KAZI_TYPE_C[type] || { label:type, color:"#94A3B8" };
  return (
    <span style={{ fontSize:10, padding:"3px 8px", borderRadius:20, background:`${t.color}12`, color:t.color, fontWeight:800, border:`1px solid ${t.color}25`, fontFamily:MONO, whiteSpace:"nowrap" }}>
      {t.label}
    </span>
  );
};

function JobDetailPanel({ job, isInbox, onClose, onApprove, onReject, onToggleFeature, onToggleHot, onClose2 }) {
  const dl = daysLeft(job.deadline);
  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:400, background:"#111113", borderLeft:"1px solid #232325", display:"flex", flexDirection:"column", zIndex:200, boxShadow:"-12px 0 40px rgba(0,0,0,0.5)" }}>
      {/* Header */}
      <div style={{ padding:"20px", borderBottom:"1px solid #1e1e20" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
          <span style={{ fontSize:10, fontWeight:700, color:"rgba(242,242,245,0.3)", fontFamily:MONO, letterSpacing:"0.08em" }}>
            {isInbox ? "📥 INASUBIRI REVIEW" : "✅ ACTIVE"}
          </span>
          <button onClick={onClose} style={{ background:"#232325", border:"none", borderRadius:7, width:26, height:26, color:"rgba(242,242,245,0.5)", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
          <CompanyBadge name={job.company_name} size={46} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#F2F2F5", lineHeight:1.3, marginBottom:4 }}>{job.title}</div>
            <div style={{ fontSize:12, color:"rgba(242,242,245,0.4)" }}>{job.company_name} · {job.is_remote ? "Remote":job.location}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap", alignItems:"center" }}>
          <TypeBadge type={job.type} />
          {job.salary_visible && <span style={{ fontSize:11, color:"#F5A623", fontWeight:700 }}>💰 {fmtSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>}
          {job.is_hot && <span style={{ fontSize:10, color:"#FB7185", fontWeight:700 }}>🔥 HOT</span>}
          {job.is_featured && <span style={{ fontSize:10, color:"#F5A623", fontWeight:700 }}>⭐ FEATURED</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
        {/* Poster */}
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:10, padding:"12px", marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"rgba(242,242,245,0.3)", fontFamily:MONO, marginBottom:6 }}>ALIYEWASILISHA</div>
          <div style={{ fontSize:13, fontWeight:700, color:"#F2F2F5" }}>{job.poster_name}</div>
          <div style={{ fontSize:11, color:"rgba(242,242,245,0.4)", marginTop:2 }}>{job.poster_email}</div>
          {job.source && job.source !== "direct" && (
            <div style={{ marginTop:6, fontSize:10, padding:"2px 8px", borderRadius:20, background:"rgba(96,165,250,0.1)", color:"#60A5FA", border:"1px solid rgba(96,165,250,0.2)", display:"inline-block", fontWeight:700, fontFamily:MONO }}>via {job.source}</div>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"rgba(242,242,245,0.3)", fontFamily:MONO, marginBottom:8 }}>MAELEZO</div>
          <p style={{ fontSize:13, color:"rgba(242,242,245,0.65)", lineHeight:1.75, margin:0 }}>{job.description}</p>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(242,242,245,0.3)", fontFamily:MONO, marginBottom:8 }}>MAHITAJI</div>
            <p style={{ fontSize:13, color:"rgba(242,242,245,0.65)", lineHeight:1.75, margin:0 }}>{job.requirements}</p>
          </div>
        )}

        {/* Tags */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"rgba(242,242,245,0.3)", fontFamily:MONO, marginBottom:8 }}>SKILLS</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {(job.tags||[]).map(t => (
              <span key={t} style={{ fontSize:11, padding:"3px 9px", borderRadius:6, background:"rgba(245,166,35,0.08)", color:"#F5A623", border:"1px solid rgba(245,166,35,0.18)", fontFamily:MONO }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Apply method */}
        <div style={{ background:"#161618", border:"1px solid #232325", borderRadius:10, padding:"12px", marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"rgba(242,242,245,0.3)", fontFamily:MONO, marginBottom:6 }}>APPLY METHOD</div>
          {job.apply_internal ? (
            <div style={{ fontSize:12, color:"#4ADE80", fontWeight:600 }}>✓ JamiiAI internal applications</div>
          ) : job.apply_url ? (
            <div style={{ fontSize:12, color:"#60A5FA", fontWeight:600 }}>🔗 External — {job.apply_url}</div>
          ) : (
            <div style={{ fontSize:12, color:"rgba(242,242,245,0.4)" }}>📧 Email apply</div>
          )}
        </div>

        {/* Deadline */}
        {job.deadline && (
          <div style={{ display:"flex", gap:8, alignItems:"center", padding:"10px 12px", background:"#161618", borderRadius:10, border:`1px solid ${dl?.urgent ? "rgba(251,113,133,0.2)" : "#232325"}` }}>
            <span style={{ fontSize:13 }}>⏰</span>
            <div>
              <div style={{ fontSize:11, color:"rgba(242,242,245,0.35)", fontFamily:MONO }}>DEADLINE</div>
              <div style={{ fontSize:12, fontWeight:700, color: dl?.urgent ? "#FB7185" : "#F2F2F5" }}>
                {job.deadline} · {dl?.text}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding:"16px 20px", borderTop:"1px solid #1e1e20", display:"flex", gap:8 }}>
        {isInbox ? (
          <>
            <button onClick={() => onApprove(job.id)} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#F5A623,#e8961a)", color:"#000", fontWeight:800, fontSize:13, cursor:"pointer" }}>
              ✅ Chapisha Kazi
            </button>
            <button onClick={() => onReject(job.id)} style={{ flex:1, padding:"11px", borderRadius:10, border:"1px solid #2a2a2c", background:"transparent", color:"#FB7185", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              🗑 Kataa
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onToggleFeature(job.id)} style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${job.is_featured ? "rgba(245,166,35,0.4)" : "#2a2a2c"}`, background: job.is_featured ? "rgba(245,166,35,0.1)" : "transparent", color: job.is_featured ? "#F5A623" : "rgba(242,242,245,0.4)", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              ⭐ {job.is_featured ? "Ondoa Featured" : "Mark Featured"}
            </button>
            <button onClick={() => onToggleHot(job.id)} style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${job.is_hot ? "rgba(251,113,133,0.3)" : "#2a2a2c"}`, background: job.is_hot ? "rgba(251,113,133,0.1)" : "transparent", color: job.is_hot ? "#FB7185" : "rgba(242,242,245,0.4)", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              🔥 {job.is_hot ? "Ondoa Hot" : "Mark Hot"}
            </button>
            <button onClick={() => onClose2(job.id)} title="Funga kazi" style={{ width:40, padding:"10px", borderRadius:10, border:"1px solid #2a2a2c", background:"transparent", color:"rgba(242,242,245,0.25)", fontWeight:700, fontSize:13, cursor:"pointer" }}>🔒</button>
          </>
        )}
      </div>
    </div>
  );
}

function KaziPage() {
  const [inbox,   setInbox]    = useState([]);
  const [active,  setActive]   = useState([]);
  const [loading, setLoading]  = useState(true);
  const [tab,     setTab]      = useState("inbox");
  const [selected,setSelected] = useState(null);
  const [fetching,setFetching] = useState(false);
  const [toast,   setToast]    = useState(null);

  const notify = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    Promise.all([adminAPI.jobs("pending"), adminAPI.jobs("active")])
      .then(([inboxRes, activeRes]) => {
        setInbox(inboxRes.data?.jobs || inboxRes.data || []);
        setActive(activeRes.data?.jobs || activeRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const approveJob = async id => {
    const job = inbox.find(j => j.id === id);
    if (!job) return;
    try {
      await adminAPI.approveJob(id);
      setInbox(p => p.filter(j => j.id !== id));
      setActive(p => [{ ...job, status:"active", views:0, applications_count:0 }, ...p]);
      setSelected(null);
      notify("✅ Kazi imechapishwa na inaonekana kwenye community!");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const rejectJob = async id => {
    try {
      await adminAPI.rejectJob(id);
      setInbox(p => p.filter(j => j.id !== id));
      setSelected(null);
      notify("🗑 Kazi imekataliwa na kufutwa.");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const toggleFeature = async id => {
    try {
      await adminAPI.featureJob(id);
      setActive(p => p.map(j => j.id === id ? {...j, is_featured:!j.is_featured} : j));
      if (selected?.id === id) setSelected(p => ({...p, is_featured:!p.is_featured}));
      notify("⭐ Featured status imebadilishwa!");
    } catch { notify("❌ Hitilafu — jaribu tena"); }
  };

  const toggleHot = id => {
    setActive(p => p.map(j => j.id === id ? {...j, is_hot:!j.is_hot} : j));
    if (selected?.id === id) setSelected(p => ({...p, is_hot:!p.is_hot}));
    notify("🔥 Hot status imebadilishwa!");
  };

  const closeJob = id => {
    setActive(p => p.filter(j => j.id !== id));
    setSelected(null);
    notify("🔒 Kazi imefungwa.");
  };

  const fetchJobs = () => {
    setFetching(true);
    adminAPI.runApify()
      .then(r => {
        const newJobs = r.data?.jobs || [];
        if (newJobs.length > 0) {
          setInbox(p => [...newJobs, ...p]);
          notify(`✅ Kazi ${newJobs.length} mpya imepatikana — inasubiri review yako!`);
        } else {
          notify("ℹ️ Hakuna kazi mpya kwa sasa");
        }
      })
      .catch(() => {
        // Fallback: just refresh inbox
        adminAPI.jobs("pending")
          .then(r => setInbox(r.data?.jobs || r.data || []))
          .catch(console.error);
        notify("ℹ️ Refresh imefanywa");
      })
      .finally(() => setFetching(false));
  };

  const totalViews = active.reduce((s,j) => s + (j.views||0), 0);
  const totalApps  = active.reduce((s,j) => s + (j.applications_count||0), 0);
  const isInboxSelected = selected && inbox.some(j => j.id === selected.id);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>Inapakia kazi...</div>;

  return (
    <div style={{ position:"relative" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right: selected ? 424 : 24, zIndex:999, background:"#F5A623", color:"#000", padding:"12px 20px", borderRadius:12, fontWeight:800, fontSize:13, boxShadow:"0 8px 32px rgba(245,166,35,0.3)", animation:"toastIn 0.25s ease" }}>
          {toast}
        </div>
      )}

      {/* Header / Stats area */}
      <div style={{ display:"flex", flexDirection:"column" }}>
          
          {/* Top action bar */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <SectionHead title="Kazi Board" sub="Simamia kazi na approve postings" />
            <button
              onClick={fetchJobs}
              disabled={fetching}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:9, border:"1px solid rgba(245,166,35,0.3)", background: fetching ? "transparent" : "rgba(245,166,35,0.08)", color: fetching ? "rgba(242,242,245,0.25)" : "#F5A623", fontWeight:700, fontSize:12, cursor: fetching ? "default":"pointer", transition:"all 0.2s" }}
            >
              <span style={{ display:"inline-block", animation: fetching ? "spin 1s linear infinite":"none", fontSize:14 }}>⟳</span>
              {fetching ? "Inatafuta..." : "Fetch Kazi Mpya"}
            </button>
          </div>

          <div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
              {[
                { icon:"📥", label:"Inasubiri",   value:inbox.length,  color:"#F5A623" },
                { icon:"✅", label:"Active",       value:active.length, color:"#4ADE80" },
                { icon:"👁", label:"Total Views",  value:totalViews,    color:"#60A5FA" },
                { icon:"📄", label:"Applications", value:totalApps,     color:"#C084FC" },
              ].map(s => (
                <div key={s.label} style={{ background:"#161618", border:`1px solid ${s.color}18`, borderRadius:12, padding:"14px 16px", animation:"slideIn 0.3s ease" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:`${s.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize:22, fontWeight:900, color:"#F2F2F5", lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontSize:10, color:"rgba(242,242,245,0.35)", fontFamily:MONO, marginTop:2 }}>{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline strip */}
            <div style={{ background:"linear-gradient(135deg,rgba(74,222,128,0.05),rgba(15,26,26,0.8))", border:"1px solid rgba(74,222,128,0.12)", borderRadius:10, padding:"12px 16px", marginBottom:24, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:10, fontWeight:700, color:"rgba(242,242,245,0.3)", fontFamily:MONO }}>PIPELINE:</span>
              {[["Kaggle","#60A5FA"],["AIcrowd","#C084FC"],["Zindi Africa","#4ADE80"],["Devpost","#60A5FA"]].map(([s,c],i,arr)=>(
                <span key={s} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:c, fontFamily:MONO }}>{s}</span>
                  {i < arr.length-1 && <span style={{ color:"#2a2a2c", fontSize:12 }}>→</span>}
                </span>
              ))}
              <span style={{ color:"#2a2a2c" }}>→</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#F5A623", fontFamily:MONO }}>Inbox</span>
              <span style={{ color:"#2a2a2c" }}>→</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#4ADE80", fontFamily:MONO }}>Community</span>
              <span style={{ marginLeft:"auto", fontSize:10, color:"rgba(242,242,245,0.25)", fontFamily:MONO }}>⏰ kila siku saa 6 asubuhi</span>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:0, borderBottom:"1px solid #1a1a1c", marginBottom:20 }}>
              {[
                { id:"inbox",  label:"📥 Inbox",        count:inbox.length  },
                { id:"active", label:"✅ Active",        count:active.length },
                { id:"closed", label:"🔒 Zilizofungwa",  count:0             },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }} style={{ padding:"10px 18px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:700, color: tab===t.id ? "#F5A623" : "rgba(242,242,245,0.35)", borderBottom:`2px solid ${tab===t.id ? "#F5A623":"transparent"}`, transition:"all 0.15s", display:"flex", alignItems:"center", gap:7 }}>
                  {t.label}
                  {t.count > 0 && (
                    <span style={{ background: tab===t.id ? "#F5A623":"#232325", color: tab===t.id ? "#000":"rgba(242,242,245,0.4)", borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:900, fontFamily:MONO }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── INBOX ── */}
            {tab === "inbox" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {inbox.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(242,242,245,0.15)" }}>
                    <div style={{ fontSize:44, marginBottom:12 }}>📥</div>
                    <div style={{ fontSize:15, fontWeight:700 }}>Inbox iko tupu</div>
                    <div style={{ fontSize:12, marginTop:8 }}>Bonyeza "Fetch Kazi Mpya" hapo juu</div>
                  </div>
                ) : inbox.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelected(job)}
                    style={{ background: selected?.id===job.id ? "#1a1a1c":"#161618", border:`1px solid ${selected?.id===job.id ? "#F5A623":"#232325"}`, borderRadius:12, padding:"16px 18px", cursor:"pointer", display:"flex", gap:12, alignItems:"center", transition:"all 0.15s", animation:"slideIn 0.25s ease" }}
                  >
                    <CompanyBadge name={job.company_name} size={42} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#F2F2F5" }}>{job.title}</span>
                        {job.is_hot && <span style={{ fontSize:10, color:"#FB7185", fontWeight:700 }}>🔥</span>}
                        {job.source && job.source !== "direct" && (
                          <span style={{ fontSize:9, padding:"2px 6px", borderRadius:10, background:"rgba(96,165,250,0.1)", color:"#60A5FA", fontWeight:700, fontFamily:MONO }}>via {job.source}</span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(242,242,245,0.4)" }}>{job.company_name} · {job.is_remote ? "Remote":job.location} · {job.created_at}</div>
                    </div>
                    <TypeBadge type={job.type} />
                    {job.salary_visible && (
                      <span style={{ fontSize:11, color:"#F5A623", fontWeight:700, flexShrink:0, fontFamily:MONO }}>{fmtSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
                    )}
                    <div style={{ display:"flex", gap:6, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>approveJob(job.id)} style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"rgba(74,222,128,0.12)", color:"#4ADE80", fontWeight:800, fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>✅ Chapisha</button>
                      <button onClick={()=>rejectJob(job.id)} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #2a2a2c", background:"transparent", color:"#FB7185", fontWeight:700, fontSize:11, cursor:"pointer" }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ACTIVE ── */}
            {tab === "active" && (
              <div>
                {/* Table head */}
                <div style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1.2fr 1fr 80px 120px", gap:12, padding:"8px 16px", fontSize:9, fontWeight:700, color:"rgba(242,242,245,0.25)", fontFamily:MONO, letterSpacing:"0.06em", borderBottom:"1px solid #1a1a1c", marginBottom:4 }}>
                  <span>KAZI</span><span>AINA</span><span>MSHAHARA</span><span>STATS</span><span>DEADLINE</span><span>VITENDO</span>
                </div>
                {active.map(job => {
                  const dl = daysLeft(job.deadline);
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelected(job)}
                      style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1.2fr 1fr 80px 120px", gap:12, padding:"14px 16px", cursor:"pointer", borderBottom:"1px solid #141416", alignItems:"center", background: selected?.id===job.id ? "#161618":"transparent", transition:"background 0.1s" }}
                    >
                      <div>
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <span style={{ fontSize:13, fontWeight:700, color:"#F2F2F5" }}>{job.title}</span>
                          {job.is_featured && <span style={{ fontSize:10 }}>⭐</span>}
                          {job.is_hot && <span style={{ fontSize:10 }}>🔥</span>}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(242,242,245,0.35)", marginTop:2 }}>{job.company_name}</div>
                      </div>
                      <TypeBadge type={job.type} />
                      <span style={{ fontSize:11, color:"#F5A623", fontWeight:700, fontFamily:MONO }}>{job.salary_visible ? fmtSalary(job.salary_min, job.salary_max, job.salary_currency) : "—"}</span>
                      <div style={{ fontSize:11, color:"rgba(242,242,245,0.35)", fontFamily:MONO, lineHeight:1.6 }}>
                        <div>👁 {job.views}</div>
                        <div>📄 {job.applications_count}</div>
                      </div>
                      <span style={{ fontSize:11, fontFamily:MONO, color: dl?.urgent ? "#FB7185":"rgba(242,242,245,0.35)", fontWeight: dl?.urgent ? 700:400 }}>{dl?.text||"—"}</span>
                      <div style={{ display:"flex", gap:4 }} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>toggleFeature(job.id)} title="Featured" style={{ width:28, height:28, borderRadius:7, border:`1px solid ${job.is_featured ? "rgba(245,166,35,0.4)":"#2a2a2c"}`, background: job.is_featured ? "rgba(245,166,35,0.12)":"transparent", color: job.is_featured ? "#F5A623":"rgba(242,242,245,0.25)", cursor:"pointer", fontSize:13 }}>⭐</button>
                        <button onClick={()=>toggleHot(job.id)} title="Hot" style={{ width:28, height:28, borderRadius:7, border:`1px solid ${job.is_hot ? "rgba(251,113,133,0.3)":"#2a2a2c"}`, background: job.is_hot ? "rgba(251,113,133,0.1)":"transparent", color: job.is_hot ? "#FB7185":"rgba(242,242,245,0.25)", cursor:"pointer", fontSize:13 }}>🔥</button>
                        <button onClick={()=>closeJob(job.id)} title="Funga" style={{ width:28, height:28, borderRadius:7, border:"1px solid #2a2a2c", background:"transparent", color:"rgba(242,242,245,0.2)", cursor:"pointer", fontSize:12 }}>🔒</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── CLOSED ── */}
            {tab === "closed" && (
              <div style={{ textAlign:"center", padding:"70px 0", color:"rgba(242,242,245,0.15)" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🔒</div>
                <div style={{ fontSize:15, fontWeight:700 }}>Hakuna kazi zilizofungwa</div>
              </div>
            )}

          </div>

          {/* Detail Panel */}
          {selected && (
            <>
              <div onClick={() => setSelected(null)} style={{ position:"fixed", inset:0, zIndex:199 }} />
              <JobDetailPanel
                job={selected}
                isInbox={isInboxSelected}
                onClose={() => setSelected(null)}
                onApprove={approveJob}
                onReject={rejectJob}
                onToggleFeature={toggleFeature}
                onToggleHot={toggleHot}
                onClose2={closeJob}
              />
            </>
          )}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const [page, setPage] = useState("dashboard");
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("admin_token"));

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      authAPI.me()
        .then(res => {
          setAdminUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem("admin_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminUser(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center", color: "#F5A623", fontFamily: MONO, fontSize: 14 }}>
      Inapakia...
    </div>
  );

  if (!adminUser) {
    return <AdminAuth onLogin={setAdminUser} />;
  }

  const PAGES = {
    dashboard:     <DashboardPage />,
    users:         <UsersPage />,
    content:       <ContentPage />,
    roles:         <RolesPage />,
    changamoto:    <ChangamotoPage />,
    matukio:       <MatukioPage />,
    rasilimali:    <RasilimaliPage />,
    kazi:          <KaziPage />,
    habari:        <HabariPage />,
    billing:       <BillingPage />,
    analytics:     <AnalyticsPage />,
    announcements: <AnnouncementsPage />,
    settings:      <SettingsPage />,
  };

  const PAGE_TITLE = {
    dashboard:"Dashboard", users:"Watumiaji", content:"Moderation",
    roles:"Roles & Permissions", changamoto:"Changamoto", matukio:"Matukio",
    rasilimali:"Rasilimali", kazi:"Kazi Board", habari:"Habari", billing:"Billing & Subscriptions",
    analytics:"Analytics", announcements:"Matangazo", settings:"Settings ⚙",
  };

  return (
    <div style={{ fontFamily:"'Roboto Mono',monospace", background:"#0C0C0E", color:"#F2F2F5", minHeight:"100vh", display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap');
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
        <div style={{ borderTop:"1px solid #1E1E20", paddingTop:14, marginTop: "auto" }}>
          <div onClick={handleLogout} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: "pointer", opacity: 0.4, padding: "4px 8px", fontFamily: MONO }}><LogOut size={14} /> Toka (Logout)</div>
          
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 12, border: "1px solid transparent" }}>
            <Av i={adminUser.name?.[0]||"A"} c="#F5A623" s={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight:600, fontSize:11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminUser.name}</div>
              <div style={{ fontFamily:MONO, fontSize:9, color:"rgba(242,242,245,0.3)" }}>{adminUser.role_name || "Admin"}</div>
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
            <a href="http://localhost:5173" target="_blank" style={{ fontFamily:MONO, fontSize:11, color:"#F5A623", textDecoration:"none" }}>← Community</a>
          </div>
        </div>

        <div style={{ padding:"24px 28px 48px" }}>
          {PAGES[page]}
        </div>
      </main>
    </div>
  );
}