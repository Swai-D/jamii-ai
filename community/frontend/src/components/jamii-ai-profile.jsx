import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ImageUpload from "./ImageUpload";

const API_URL = "http://localhost:4000/api";

const ALL_SKILLS = ["Python","JavaScript","TypeScript","Node.js","React","Next.js","FastAPI","Django","TensorFlow","PyTorch","Scikit-learn","HuggingFace","LangChain","LlamaIndex","Claude API","OpenAI","Gemini API","RAG Systems","Vector DB","Pinecone","Weaviate","PostgreSQL","MongoDB","Redis","Docker","Kubernetes","AWS","GCP","Azure","MLflow","Weights & Biases","Computer Vision","NLP","Speech Recognition","Data Science","Pandas","NumPy","Matplotlib"];
const ALL_INTERESTS = ["NLP / Swahili AI","Computer Vision","LLMs & Agents","MLOps","AI for Agriculture","AI for Health","Data Science","AI Ethics","Startups","Research","Open Source","AI Policy"];
const CITIES = ["Dar es Salaam","Arusha","Mwanza","Dodoma","Zanzibar","Moshi","Tanga","Morogoro","Tabora","Nyingine"];
const ROLES = ["AI Developer","ML Engineer","Data Scientist","AI Researcher","Student","AI Enthusiast","Startup Founder","Product Manager","AI Architect","MLOps Engineer"];
const STATUS_COLORS = { active: { bg: "rgba(52,211,153,0.12)", color: "#34D399", label: "Active" }, completed: { bg: "rgba(96,165,250,0.12)", color: "#60A5FA", label: "Completed" }, paused: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", label: "Paused" } };
const CAT_COLORS = { mradi: { bg: "rgba(52,211,153,0.12)", color: "#34D399" }, swali: { bg: "rgba(96,165,250,0.12)", color: "#60A5FA" }, habari: { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" }, kazi: { bg: "rgba(245,166,35,0.12)", color: "#F5A623" } };

// ─── HELPERS ─────────────────────────────────────────────────────
const AVATAR_COLORS = ["#F5A623","#4ECDC4","#A78BFA","#34D399","#F87171","#60A5FA","#FBBF24","#E879F9"];
function deriveColor(seed) {
  if (!seed) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Av({ initials, color, size = 80, src, userId }) {
  const bg = color || deriveColor(userId || initials || "x");
  const textColor = ["#F5A623","#FBBF24","#34D399","#60A5FA"].includes(bg) ? "#0A0F1C" : "#fff";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: src ? "transparent" : bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: size * 0.28, color: textColor, flexShrink: 0, overflow: "hidden", border: `3px solid ${bg}40` }}>
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  );
}

function Pill({ label, bg, color, onRemove }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Roboto Mono',monospace", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>
      {label}
      {onRemove && <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.7, fontSize: 12, lineHeight: 1 }}>×</span>}
    </span>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", multiline, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  const base = { background: "rgba(255,255,255,0.04)", border: `1px solid ${focused ? "#F5A623" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "11px 14px", color: "#DCE6F0", fontFamily: "'Roboto Mono',monospace", fontSize: 14, outline: "none", width: "100%", transition: "border-color 0.2s" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase" }}>{label}</label>}
      {multiline
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...base, resize: "vertical", lineHeight: 1.6 }} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={base} />
      }
    </div>
  );
}

const TABS = [
  { id: "overview",  label: "Maelezo"   },
  { id: "miradi",    label: "Miradi"    },
  { id: "posts",     label: "Posts"     },
  { id: "settings",  label: "Mipangilio"},
];

// ─── MAIN ─────────────────────────────────────────────────────────
export default function ProfilePage({ user, lang, onLogout, onUpdateUser }) {
  const [profile, setProfile]   = useState({});
  const [projects, setProjects] = useState([]);
  const [posts, setPosts]       = useState([]);
  const [tab, setTab]           = useState("overview");
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(null);
  const [toast, setToast]       = useState(null);
  const [loading, setLoading]   = useState(true);

  // For project management
  const [editingProject, setEditingProject] = useState(null);
  const [projectDraft, setProjectDraft] = useState(null);
  const [newProject, setNewProject] = useState({ title: "", description: "", link: "", tech: [], techInput: "", status: "active" });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const notify = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      let userData = user;
      
      // If we only have partial user, fetch full profile
      if (user?.id) {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.data) userData = res.data;
        } catch (e) {
          console.warn("API User fetch failed, using local prop data");
        }
      }

      // Build profile from API data — normalize DB field names
      setProfile({
        ...userData,
        // Normalize field names: DB uses snake_case, UI uses camelCase in some places
        avatar:      userData?.avatar_url    || null,
        github:      userData?.github_url    || "",
        linkedin:    userData?.linkedin_url  || "",
        website:     userData?.website_url   || "",
        hourlyRate:  userData?.hourly_rate   || "",
        avatarColor: userData?.avatarColor || deriveColor(userData?.id || userData?.handle),
        avatarInitials: userData?.name ? userData.name.split(" ").map(w => w[0]).join("") : "??",
        skills:    Array.isArray(userData?.skills)    ? userData.skills    : (typeof userData?.skills    === "string" ? JSON.parse(userData.skills    || "[]") : []),
        interests: Array.isArray(userData?.interests) ? userData.interests : (typeof userData?.interests === "string" ? JSON.parse(userData.interests || "[]") : []),
      });

      // Fetch projects
      try {
        const pRes = await axios.get(`${API_URL}/projects/user/${userData?.id}`);
        setProjects(pRes.data.map(p => ({
          ...p,
          tech: Array.isArray(p.tech_stack) ? p.tech_stack : JSON.parse(p.tech_stack || "[]"),
        })));
      } catch (e) {}

      // Fetch posts
      try {
        const token = localStorage.getItem("token");
        const poRes = await axios.get(`${API_URL}/posts?user_id=${userData?.id}`, { headers: { Authorization: `Bearer ${token}` } });
        setPosts(poRes.data.posts || []);
      } catch (e) {}

      setLoading(false);
    };
    init();
  }, [user?.id]);

  const P = profile;

  const startEdit = () => {
    setDraft({
      name:       profile.name        || "",
      handle:     profile.handle      || "",
      role:       profile.role        || "",
      city:       profile.city        || "",
      bio:        profile.bio         || "",
      hourlyRate: profile.hourlyRate  || profile.hourly_rate || "",
      github:     profile.github      || profile.github_url  || "",
      linkedin:   profile.linkedin    || profile.linkedin_url || "",
      website:    profile.website     || profile.website_url  || "",
      skills:     profile.skills      || [],
      interests:  profile.interests   || [],
      available:  profile.available   !== undefined ? profile.available : true,
      avatarColor: profile.avatarColor || deriveColor(profile.id || profile.handle),
      avatar:     profile.avatar      || profile.avatar_url || null,
      cover_image: profile.cover_image || null,
      id:         profile.id,
    });
    setEditing(true);
  };
  const cancelEdit = () => { setDraft(null); setEditing(false); };

  const saveProfile = async () => {
    if (!draft.name.trim()) return notify("❌ Jina linahitajika!");
    setProfile({ ...draft }); // Save locally first
    setEditing(false);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/users/${profile.id}`, {
        ...draft,
        github_url: draft.github,
        linkedin_url: draft.linkedin,
        website_url: draft.website,
        hourly_rate: draft.hourlyRate,
        skills: JSON.stringify(draft.skills),
        interests: JSON.stringify(draft.interests),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updated = {
        ...res.data,
        avatar: res.data.avatar_url,
        skills: Array.isArray(res.data.skills) ? res.data.skills : JSON.parse(res.data.skills || "[]"),
        interests: Array.isArray(res.data.interests) ? res.data.interests : JSON.parse(res.data.interests || "[]"),
      };
      setProfile(updated);
      onUpdateUser?.(updated);
      notify("✅ Profile imesasishwa!");
    } catch (err) {
      notify("⚠️ Tatizo la kuhifadhi profile");
    }
  };

  const handleAvatarUpload = (url) => {
    setProfile(prev => {
      const updated = { ...prev, avatar: url, avatar_url: url };
      onUpdateUser?.(updated);
      return updated;
    });
    if (editing) setDraft(d => ({ ...d, avatar: url, avatar_url: url }));
    notify("✅ Picha ya profile imesasishwa!");
  };

  const handleCoverUpload = (url) => {
    setProfile(prev => {
      const updated = { ...prev, cover_image: url };
      onUpdateUser?.(updated);
      return updated;
    });
    if (editing) setDraft(d => ({ ...d, cover_image: url }));
    notify("✅ Cover ya profile imesasishwa!");
  };

  // ── PROJECT HANDLERS ──────────────────────────────────────────
  const saveProject = async () => {
    try {
      const token = localStorage.getItem("token");
      const proj = editingProject ? projectDraft : newProject;
      const data = {
        ...proj,
        tech_stack: JSON.stringify(proj.tech)
      };

      let res;
      if (editingProject) {
        res = await axios.put(`${API_URL}/projects/${editingProject.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
        setProjects(projects.map(p => p.id === editingProject.id ? { ...res.data, tech: proj.tech } : p));
      } else {
        res = await axios.post(`${API_URL}/projects`, data, { headers: { Authorization: `Bearer ${token}` } });
        setProjects([{ ...res.data, tech: proj.tech }, ...projects]);
        setNewProject({ title: "", description: "", link: "", tech: [], techInput: "", status: "active" });
      }
      setEditingProject(null); setProjectDraft(null);
      notify("✅ Mradi umehifadhiwa!");
    } catch (err) { notify("⚠️ Kushindwa kuhifadhi mradi"); }
  };

  const addProjectTech = () => {
    if (!newProject.techInput.trim()) return;
    setNewProject(p => ({ ...p, tech: [...p.tech, p.techInput.trim()], techInput: "" }));
  };

  // ── Settings handlers ─────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState({ emailDigest: true, notifications: true, newsletter: false, hiring: true });
  const [notifLoaded, setNotifLoaded] = useState(false);

  const loadNotifSettings = async () => {
    if (notifLoaded) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/users/me/settings`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.notifications) setNotifSettings(res.data.notifications);
      setNotifLoaded(true);
    } catch (e) {}
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_URL}/users/me/settings`, { notifications: notifSettings }, { headers: { Authorization: `Bearer ${token}` } });
      notify("✅ Mipangilio imehifadhiwa!");
    } catch (e) { notify("⚠️ Hitilafu ya kuhifadhi"); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>Inapakia profile...</div>;

  return (
    <div className="fin" style={{ paddingBottom: 80 }}>
      <style>{`
        .card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:24px;margin-bottom:20px}
        .icon-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#DCE6F0;padding:8px 16px;border-radius:10px;cursor:pointer;font-family:'Roboto Mono',monospace;font-size:13px;display:flex;align-items:center;gap:8px;transition:0.2s}
        .icon-btn:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.2)}
        .stat-item{text-align:center;flex:1}
        .stat-val{font-size:20px;font-weight:800;color:#F5A623;margin-bottom:4px}
        .stat-lab{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.4}
        @keyframes notif{0%{opacity:0;transform:translateX(20px)}15%{opacity:1;transform:translateX(0)}85%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(20px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fin{animation:fadeIn 0.22s ease both}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px}
        .modal{background:#111827;border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:32px;width:100%;max-width:520px;max-height:80vh;overflow-y:auto;animation:fadeIn 0.22s ease both}
      `}</style>

      {toast && <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999, background: "#F5A623", color: "#0A0F1C", padding: "11px 18px", borderRadius: 9, fontWeight: 700, animation: "notif 3s ease forwards" }}>{toast}</div>}

      {/* ── CONFIRM DELETE MODAL ── */}
      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🗑️</div>
              <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Futa Mradi?</h3>
              <p style={{ color: "rgba(220,230,240,0.5)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Je, una uhakika unataka kufuta mradi huu? Kitendo hiki hakiwezi kurejeshwa.</p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 600 }}>Ghairi</button>
                <button onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    await axios.delete(`${API_URL}/projects/${confirmDelete}`, { headers: { Authorization: `Bearer ${token}` } });
                    setProjects(projects.filter(p => p.id !== confirmDelete));
                    setConfirmDelete(null);
                    notify("✅ Mradi umefutwa!");
                  } catch (e) { notify("⚠️ Hitilafu wakati wa kufuta"); }
                }} style={{ flex: 1, background: "#F87171", color: "#fff", border: "none", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Ndio, Futa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COVER + HEADER ── */}
      <div style={{ position: "relative" }}>
        {/* Cover */}
        <div style={{ height: 180, background: P.cover_image ? `url(${P.cover_image}) center/cover` : `linear-gradient(135deg, ${P.avatarColor}22 0%, rgba(78,205,196,0.08) 50%, rgba(167,139,250,0.06) 100%)`, backgroundImage: !P.cover_image && "linear-gradient(rgba(245,166,35,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,0.04) 1px,transparent 1px)", backgroundSize: !P.cover_image && "40px 40px", position: "relative", overflow: "hidden", borderRadius: "0 0 24px 24px" }}>
          {!P.cover_image && <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: `${P.avatarColor}12`, filter: "blur(80px)", top: -150, right: -100 }} />}
          
          <div style={{ position: "absolute", bottom: 12, right: 16 }}>
            <ImageUpload 
              type="post-image" 
              onUpload={handleCoverUpload} 
              label="Badilisha Cover"
              compact={false}
              className="cover-upload-btn"
            />
          </div>
        </div>

        {/* Avatar + name row */}
        <div style={{ padding: "0 40px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ position: "relative", marginTop: -50 }}>
              <ImageUpload 
                type="avatar" 
                onUpload={handleAvatarUpload} 
                currentUrl={P.avatar}
                compact={true}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 12 }}>
              {editing ? (
                <>
                  <button className="icon-btn" onClick={cancelEdit}>✕ Ghairi</button>
                  <button onClick={saveProfile} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "9px 22px", borderRadius: 9, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>✓ Hifadhi Mabadiliko</button>
                </>
              ) : (
                <button className="icon-btn" onClick={startEdit}>✏️ Hariri Profile</button>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{P.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, color: "rgba(220,230,240,0.4)" }}>
              <span style={{ color: "#F5A623", fontWeight: 700 }}>@{P.handle}</span>
              <span>·</span>
              <span>{P.role}</span>
              {P.city && <span>· 📍 {P.city}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ padding: "0 40px", marginTop: 32 }}>
        <div style={{ display: "flex", gap: 32, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "settings") loadNotifSettings(); }} style={{ padding: "12px 4px", background: "none", border: "none", color: tab === t.id ? "#F5A623" : "rgba(220,230,240,0.4)", fontFamily: "'Roboto Mono',monospace", fontSize: 13, fontWeight: 700, cursor: "pointer", borderBottom: `2px solid ${tab === t.id ? "#F5A623" : "transparent"}`, transition: "all 0.2s" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: tab === "overview" ? "1.8fr 1fr" : "1fr", gap: 32 }}>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              <div className="fin">
                {editing ? (
                  <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <InputField label="Jina Kamili" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
                      <InputField label="Handle (@)" value={draft.handle} onChange={e => setDraft({ ...draft, handle: e.target.value.replace(/[^a-zA-Z0-9_.]/g, "") })} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase" }}>Role</label>
                        <select value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value })} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#DCE6F0", outline: "none" }}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase" }}>City</label>
                        <select value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#DCE6F0", outline: "none" }}>
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <InputField label="Bio / Kuhusu Mimi" value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} multiline rows={4} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <InputField label="Hourly Rate (e.g. $50)" value={draft.hourlyRate} onChange={e => setDraft({ ...draft, hourlyRate: e.target.value })} />
                      <div style={{ display: "flex", alignItems: "center", gap: 12, height: "100%", paddingTop: 20 }}>
                        <input type="checkbox" checked={draft.available} onChange={e => setDraft({ ...draft, available: e.target.checked })} style={{ width: 18, height: 18, accentColor: "#F5A623" }} id="avail" />
                        <label htmlFor="avail" style={{ fontSize: 14, cursor: "pointer" }}>Napatikana kwa kazi (Available)</label>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <InputField label="GitHub URL" value={draft.github} onChange={e => setDraft({ ...draft, github: e.target.value })} />
                      <InputField label="LinkedIn URL" value={draft.linkedin} onChange={e => setDraft({ ...draft, linkedin: e.target.value })} />
                      <InputField label="Website URL" value={draft.website} onChange={e => setDraft({ ...draft, website: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card">
                      <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 16 }}>BIOGRAPHY</div>
                      <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(220,230,240,0.8)" }}>{P.bio || "Hujaweka bio bado."}</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <div className="card">
                        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 16 }}>SKILLS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {P.skills?.length > 0 ? P.skills.map(s => <Pill key={s} label={s} bg="rgba(245,166,35,0.1)" color="#F5A623" />) : <span style={{ opacity: 0.3, fontSize: 13 }}>Hakuna ujuzi uliowekwa.</span>}
                        </div>
                      </div>
                      <div className="card">
                        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 16 }}>INTERESTS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {P.interests?.length > 0 ? P.interests.map(i => <Pill key={i} label={i} bg="rgba(78,205,196,0.1)" color="#4ECDC4" />) : <span style={{ opacity: 0.3, fontSize: 13 }}>Hakuna mapendeleo yaliyowekwa.</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="fin">
                <div className="card">
                  <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 20 }}>STATS ^ SOCIAL</div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                    <div className="stat-item"><div className="stat-val">{P.rating || "—"}</div><div className="stat-lab">Rating</div></div>
                    <div className="stat-item"><div className="stat-val">{P.followers || 0}</div><div className="stat-lab">Followers</div></div>
                    <div className="stat-item"><div className="stat-val">{projects.length}</div><div className="stat-lab">Projects</div></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {P.github && <a href={P.github} target="_blank" rel="noreferrer" className="icon-btn" style={{ textDecoration: "none", width: "100%" }}><Github size={16} /> GitHub Profile</a>}
                    {P.linkedin && <a href={P.linkedin} target="_blank" rel="noreferrer" className="icon-btn" style={{ textDecoration: "none", width: "100%" }}><Linkedin size={16} /> LinkedIn Profile</a>}
                    {P.website && <a href={P.website} target="_blank" rel="noreferrer" className="icon-btn" style={{ textDecoration: "none", width: "100%" }}><Globe size={16} /> Personal Website</a>}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 12 }}>RECORDS</div>
                  {[
                    ["💰 Hourly Rate", P.hourlyRate || P.hourly_rate],
                    ["📍 Location", P.city],
                    ["🗂 Miradi", P.projectCount + " iliyokamilika"],
                    ["📅 Alijiunga", P.joinedAt],
                  ].filter(([,v]) => v).map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                      <span style={{ color: "rgba(220,230,240,0.45)", fontFamily: "'Roboto Mono',monospace", fontSize: 11 }}>{label}</span>
                      <span style={{ fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Avatar color */}
                {editing === false && (
                  <div className="card">
                    <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 12 }}>RANGI YA AVATAR</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["#F5A623","#4ECDC4","#A78BFA","#F87171","#34D399","#60A5FA","#F59E0B","#EC4899"].map(c => (
                        <div key={c} onClick={() => {
                          const updated = { ...profile, avatarColor: c };
                          setProfile(updated);
                          onUpdateUser?.(updated);
                        }} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${P.avatarColor === c ? "#fff" : "transparent"}`, transition: "all 0.18s" }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── MIRADI ── */}
          {tab === "miradi" && (
            <div className="fin">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>Miradi Yangu ({projects.length})</h3>
                <button onClick={() => { setEditingProject(null); setProjectDraft(null); document.getElementById('new-project-btn')?.click(); }} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>+ Ongeza Mradi</button>
              </div>

              {projects.length === 0 && (
                <div style={{ padding: 60, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 20 }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
                  <p style={{ opacity: 0.4 }}>Hujaweka mradi wowote bado. Onyesha ulichojenga!</p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {projects.map(p => (
                  <div key={p.id} className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", transition: "transform 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <Pill label={p.status.toUpperCase()} bg={STATUS_COLORS[p.status]?.bg} color={STATUS_COLORS[p.status]?.color} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setEditingProject(p); setProjectDraft({ ...p }); }} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}>✏️</button>
                        <button onClick={() => setConfirmDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}>🗑️</button>
                      </div>
                    </div>
                    <h4 style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{p.title}</h4>
                    <p style={{ fontSize: 13, color: "rgba(220,230,240,0.5)", lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{p.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {p.tech?.map(t => <SkillTag key={t} label={t} />)}
                    </div>
                    {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ color: "#F5A623", fontSize: 12, textDecoration: "none", fontWeight: 700 }}>View Project ↗</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── POSTS ── */}
          {tab === "posts" && (
            <div className="fin">
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Mchango wa Jamii</h3>
              {posts.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", opacity: 0.3 }}>Hakuna posts bado.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {posts.map(p => (
                    <div key={p.id} className="card" style={{ padding: 20, marginBottom: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                        <Pill label={p.category.toUpperCase()} bg={CAT_COLORS[p.category]?.bg} color={CAT_COLORS[p.category]?.color} />
                        <span style={{ fontSize: 11, opacity: 0.3 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.6 }}>{p.content}</p>
                      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <span style={{ fontSize: 12, opacity: 0.4 }}>♥ {p.like_count} likes</span>
                        <span style={{ fontSize: 12, opacity: 0.4 }}>💬 {p.comment_count} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === "settings" && (
            <div className="fin">
              <div className="card">
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Taarifa na Arifa</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    ["emailDigest", "Muhtasari wa Wiki", "Pokea muhtasari wa matukio ya AI kila wiki kupitia barua pepe."],
                    ["notifications", "Arifa za Papo Hapo", "Pata arifa mtu anapokufuata au kujibu post yako."],
                    ["newsletter", "Jarida la JamiiAI", "Pokea habari mpya na fursa za kipekee."],
                    ["hiring", "Fursa za Kazi", "Ruhusu makampuni kuona profile yako kwa ajili ya ajira."],
                  ].map(([key, label, desc]) => (
                    <div key={key} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <input type="checkbox" checked={notifSettings[key]} onChange={e => setNotifSettings({ ...notifSettings, [key]: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#F5A623", marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                        <div style={{ fontSize: 12, color: "rgba(220,230,240,0.4)", marginTop: 2 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={saveSettings} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 800, cursor: "pointer", marginTop: 24 }}>Hifadhi Mipangilio</button>
              </div>

              <div className="card" style={{ borderColor: "rgba(248,113,113,0.2)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#F87171", marginBottom: 12 }}>Eneo la Hatari</h3>
                <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 20 }}>Ukifuta akaunti yako, data zako zote zitafutwa kabisa na hazitaweza kurejeshwa.</p>
                <button style={{ background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Futa Akaunti</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillTag({ label }) {
  return <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "rgba(220,230,240,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>{label}</span>;
}
