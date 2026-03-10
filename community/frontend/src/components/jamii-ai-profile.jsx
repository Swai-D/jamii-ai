import { useState, useRef, useEffect } from "react";
import axios from "axios";

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

function Av({ initials, color, size = 80, src, userId, name }) {
  // Ensure we have initials if name is provided but initials are missing
  const finalInitials = initials || (name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?");
  
  const bg = color || deriveColor(userId || finalInitials || "x");
  const textColor = ["#F5A623","#FBBF24","#34D399","#60A5FA"].includes(bg) ? "#0A0F1C" : "#fff";
  
  // Check if src is valid (not empty, not just whitespace)
  const hasImage = src && src.trim().length > 0;

  return (
    <div style={{ 
      width: size, height: size, borderRadius: "50%", 
      background: hasImage ? "transparent" : bg, 
      display: "flex", alignItems: "center", justifyContent: "center", 
      fontFamily: "'Roboto Mono',monospace", fontWeight: 700, 
      fontSize: size * 0.28, color: textColor, flexShrink: 0, 
      overflow: "hidden", 
      border: hasImage ? `1.5px solid rgba(255,255,255,0.1)` : `3px solid ${bg}40` 
    }}>
      {hasImage ? (
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        finalInitials
      )}
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

function Toast({ msg, onDone }) {
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: "#F5A623", color: "#0A0F1C", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, fontFamily: "'Roboto Mono',monospace", animation: "notif 2.5s ease forwards", pointerEvents: "none" }}>{msg}</div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  label: "Overview"  },
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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", desc: "", tech: [], techInput: "", status: "active", link: "" });
  const [showSkillSearch, setShowSkillSearch] = useState(false);
  const [skillQ, setSkillQ]     = useState("");
  const fileRef                 = useRef();
  const coverFileRef            = useRef();

  // ── Settings state ────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    likes_comments: true, email_digest: true, new_challenges: true,
    newsletter: false, ai_jobs: true
  });
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let userData = user;

      // Only attempt to fetch if we have an ID and a token
      if (user?.id && token) {
        try {
          const res = await axios.get(`${API_URL}/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
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
          desc: p.description
        })));
      } catch (e) { 
        setProjects([]);
      }

    } catch (err) { 
      console.error("Profile load error:", err); 
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  // ── Edit helpers ─────────────────────────────────────────────
  const startEdit = () => {
    setDraft({
      name:       profile.name        || "",
      handle:     profile.handle      || "",
      email:      profile.email       || "",
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
      await axios.put(`${API_URL}/users/${draft.id}`, {
        name:         draft.name,
        handle:       draft.handle,
        bio:          draft.bio,
        role:         draft.role,
        city:         draft.city,
        hourly_rate:  draft.hourlyRate,
        available:    draft.available,
        github_url:   draft.github,
        linkedin_url: draft.linkedin,
        website_url:  draft.website,
        skills:       draft.skills,
        interests:    draft.interests,
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (onUpdateUser) {
        onUpdateUser({ 
          ...user, 
          ...draft, 
          avatar_url: draft.avatar, 
          hourly_rate: draft.hourlyRate,
          github_url: draft.github,
          linkedin_url: draft.linkedin,
          website_url: draft.website
        });
      }
      notify("✅ Profile imehifadhiwa!");
    } catch (err) { 
      console.warn("API save failed, profile updated locally only");
      notify("💾 Imehifadhiwa (Local)");
    }
    setDraft(null);
  };

  const setD = (key) => (e) => setDraft(d => ({ ...d, [key]: e.target.value }));

  const toggleSkill = (skill) => {
    setDraft(d => ({
      ...d,
      skills: d.skills.includes(skill)
        ? d.skills.filter(s => s !== skill)
        : d.skills.length < 10 ? [...d.skills, skill] : d.skills
    }));
  };

  const toggleInterest = (interest) => {
    setDraft(d => ({
      ...d,
      interests: d.interests.includes(interest)
        ? d.interests.filter(i => i !== interest)
        : d.interests.length < 6 ? [...d.interests, interest] : d.interests
    }));
  };

  // ── Project CRUD ─────────────────────────────────────────────
  const saveProject = async () => {
    if (!newProject.title.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/projects`, {
        title: newProject.title,
        description: newProject.desc,
        tech_stack: JSON.stringify(newProject.tech),
        status: newProject.status,
        link: newProject.link
      }, { headers: { Authorization: `Bearer ${token}` } });

      const p = { ...res.data, tech: newProject.tech, desc: newProject.desc, stars: 0 };
      setProjects(ps => [p, ...ps]);
      setNewProject({ title: "", desc: "", tech: [], techInput: "", status: "active", link: "" });
      setShowNewProject(false);
      notify("✅ Mradi umeongezwa!");
    } catch (err) { notify("⚠️ Kushindwa kuongeza mradi"); }
  };

  const deleteProject = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProjects(ps => ps.filter(p => p.id !== id));
      setConfirmDelete(null);
      notify("🗑 Mradi umefutwa");
    } catch (err) { notify("⚠️ Kushindwa kufuta mradi"); }
  };

  const [editingProject, setEditingProject] = useState(null);
  const [projectDraft, setProjectDraft] = useState(null);

  const startEditProject = (p) => { setEditingProject(p.id); setProjectDraft({ ...p }); };
  
  const saveProjectEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/projects/${editingProject}`, {
        title: projectDraft.title,
        description: projectDraft.desc,
        tech_stack: JSON.stringify(projectDraft.tech),
        status: projectDraft.status,
        link: projectDraft.link
      }, { headers: { Authorization: `Bearer ${token}` } });

      setProjects(ps => ps.map(p => p.id === editingProject ? { ...projectDraft } : p));
      setEditingProject(null); setProjectDraft(null);
      notify("✅ Mradi umehifadhiwa!");
    } catch (err) { notify("⚠️ Kushindwa kuhifadhi mradi"); }
  };

  const addProjectTech = () => {
    if (!newProject.techInput.trim()) return;
    setNewProject(p => ({ ...p, tech: [...p.tech, p.techInput.trim()], techInput: "" }));
  };

  // ── Avatar/Cover upload logic ─────────────────────────────────
  const uploadFile = async (file, type) => {
    const formData = new FormData();
    // Backend expects 'avatar' for avatar and 'image' for cover (reusing post logic)
    formData.append(type === 'avatar' ? 'avatar' : 'image', file);
    
    try {
      const token = localStorage.getItem("token");
      const endpoint = type === 'avatar' ? 'upload/avatar' : 'upload/cover';
      const res = await axios.post(`${API_URL}/${endpoint}`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      // Backend returns avatarUrl or coverUrl
      return type === 'avatar' ? res.data.avatarUrl : res.data.coverUrl;
    } catch (err) {
      console.error("Upload error:", err);
      notify("❌ Kushindwa kupakia picha");
      return null;
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show local preview first
    const localUrl = URL.createObjectURL(file);
    const field = type === 'avatar' ? 'avatar' : 'cover_image';
    
    if (editing) {
      setDraft(d => ({ ...d, [field]: localUrl }));
    } else {
      setProfile(p => ({ ...p, [field]: localUrl }));
    }

    // Actual upload
    const remoteUrl = await uploadFile(file, type);
    if (remoteUrl) {
      // Update state with remote URL
      if (editing) {
        setDraft(d => ({ ...d, [field]: remoteUrl }));
      }
      setProfile(p => ({ ...p, [field]: remoteUrl }));
      
      // Update the main user object in parent
      if (onUpdateUser) {
        const field_key = type === 'avatar' ? 'avatar_url' : 'cover_image';
        onUpdateUser({ ...user, [field_key]: remoteUrl });
      }
      
      notify(`✅ ${type === 'avatar' ? 'Picha' : 'Cover'} imesasishwa!`);
    }
  };

  // ── Settings handlers ─────────────────────────────────────────
  const loadNotifSettings = async () => {
    if (notifLoaded) return;
    try {
      const token = localStorage.getItem("token");
      // Since there's no GET /settings, we'll use the profile data we already have
      // or just stick with defaults. Most notification_prefs are in user object.
      if (profile.notification_prefs) {
        setNotifSettings(prev => ({ ...prev, ...profile.notification_prefs }));
      }
      setNotifLoaded(true);
    } catch (e) { 
      setNotifLoaded(true); 
    }
  };

  const saveNotifSettings = async (key, val) => {
    const updated = { ...notifSettings, [key]: val };
    setNotifSettings(updated);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_URL}/users/me/settings`, { notifications: updated }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { console.warn("Notif settings save failed"); }
  };

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.next) return notify("❌ Jaza nywila zote!");
    if (pwForm.next !== pwForm.confirm) return notify("❌ Nywila mpya hazilingani!");
    if (pwForm.next.length < 8) return notify("❌ Nywila iwe na herufi 8 au zaidi!");
    setPwLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/auth/change-password`, { currentPassword: pwForm.current, newPassword: pwForm.next }, { headers: { Authorization: `Bearer ${token}` } });
      notify("✅ Nywila imebadilishwa!");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      notify(err.response?.data?.error || "❌ Nywila ya sasa si sahihi");
    }
    setPwLoading(false);
  };

  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (e) { notify("❌ Kushindwa kufuta akaunti"); }
  };

  const filteredSkills = ALL_SKILLS.filter(s => s.toLowerCase().includes(skillQ.toLowerCase()) && !(draft?.skills || []).includes(s));

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "rgba(220,230,240,0.4)" }}>Pakia profile...</div>;

  // ─────────────────────────────────────────────────────────────
  const P = editing ? draft : profile;

  return (
    <div style={{ fontFamily: "'Roboto Mono',monospace", background: "#0A0F1C", color: "#DCE6F0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#F5A623;border-radius:2px}
        input,textarea,select,button{font-family:inherit}
        input:focus,textarea:focus,select:focus,button:focus{outline:none}
        textarea{resize:vertical}
        .tab-btn{padding:9px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.18s;border:1px solid transparent;background:transparent;color:rgba(220,230,240,0.5)}
        .tab-btn:hover{background:rgba(255,255,255,0.04)}
        .tab-btn.active{background:rgba(245,166,35,0.1);color:#F5A623;border-color:rgba(245,166,35,0.18)}
        .icon-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(220,230,240,0.6);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s}
        .icon-btn:hover{background:rgba(255,255,255,0.09);color:#DCE6F0}
        .icon-btn.danger:hover{background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.25);color:#F87171}
        .card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px}
        .card:hover{border-color:rgba(255,255,255,0.11)}
        .skill-chip{display:inline-flex;align-items:center;gap:4px;font-family:'Roboto Mono',monospace;font-size:10px;font-weight:700;padding:4px 10px;border-radius:5px;background:rgba(255,255,255,0.06);color:rgba(220,230,240,0.65);cursor:default}
        .skill-chip.add{cursor:pointer;background:rgba(245,166,35,0.08);color:#F5A623;border:1px solid rgba(245,166,35,0.2)}
        .skill-chip.add:hover{background:rgba(245,166,35,0.15)}
        .skill-chip.selected{background:rgba(245,166,35,0.12);color:#F5A623}
        .project-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:22px;transition:all 0.2s}
        .project-card:hover{border-color:rgba(255,255,255,0.12)}
        @keyframes notif{0%{opacity:0;transform:translateX(20px)}15%{opacity:1;transform:translateX(0)}85%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(20px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fin{animation:fadeIn 0.22s ease both}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px}
        .modal{background:#111827;border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:32px;width:100%;max-width:520px;max-height:80vh;overflow-y:auto;animation:fadeIn 0.22s ease both}
      `}</style>

      {toast && <Toast msg={toast} />}

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, 'avatar')} />
      <input ref={coverFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, 'cover')} />

      {/* ── CONFIRM DELETE MODAL ── */}
      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🗑️</div>
              <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Futa Mradi?</h3>
              <p style={{ color: "rgba(220,230,240,0.5)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Mradi huu utafutwa kabisa. Hakuna njia ya kuurejesha tena.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="icon-btn" onClick={() => setConfirmDelete(null)}>Ghairi</button>
                <button onClick={() => deleteProject(confirmDelete)} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 13 }}>Futa Kabisa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW PROJECT MODAL ── */}
      {showNewProject && (
        <div className="overlay" onClick={() => setShowNewProject(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Ongeza Mradi Mpya ◧</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <InputField label="Jina la Mradi" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} placeholder="Mfano: SwahiliBot" />
              <InputField label="Maelezo" value={newProject.desc} onChange={e => setNewProject(p => ({ ...p, desc: e.target.value }))} placeholder="Elezea mradi wako kwa ufupi..." multiline rows={3} />
              <InputField label="Link (hiari)" value={newProject.link} onChange={e => setNewProject(p => ({ ...p, link: e.target.value }))} placeholder="github.com/wewe/mradi" />

              <div>
                <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase" }}>Status</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {["active", "completed", "paused"].map(s => (
                    <div key={s} onClick={() => setNewProject(p => ({ ...p, status: s }))} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 11, fontWeight: 700, border: `1px solid ${newProject.status === s ? STATUS_COLORS[s].color : "rgba(255,255,255,0.1)"}`, background: newProject.status === s ? STATUS_COLORS[s].bg : "transparent", color: newProject.status === s ? STATUS_COLORS[s].color : "rgba(220,230,240,0.4)", transition: "all 0.18s" }}>
                      {STATUS_COLORS[s].label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase" }}>Tech Stack</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input value={newProject.techInput} onChange={e => setNewProject(p => ({ ...p, techInput: e.target.value }))} onKeyDown={e => e.key === "Enter" && addProjectTech()} placeholder="Ongeza tech..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#DCE6F0", fontSize: 13 }} />
                  <button onClick={addProjectTech} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontWeight: 700 }}>+</button>
                </div>
                {newProject.tech.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {newProject.tech.map(t => (
                      <Pill key={t} label={t} bg="rgba(245,166,35,0.1)" color="#F5A623" onRemove={() => setNewProject(p => ({ ...p, tech: p.tech.filter(x => x !== t) }))} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="icon-btn" style={{ flex: 1 }} onClick={() => setShowNewProject(false)}>Ghairi</button>
                <button onClick={saveProject} disabled={!newProject.title.trim()} style={{ flex: 2, background: newProject.title.trim() ? "#F5A623" : "rgba(245,166,35,0.2)", color: newProject.title.trim() ? "#0A0F1C" : "rgba(220,230,240,0.25)", border: "none", padding: "11px", borderRadius: 9, cursor: newProject.title.trim() ? "pointer" : "default", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14 }}>Hifadhi Mradi →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COVER + HEADER ── */}
      <div style={{ position: "relative" }}>
        {/* Cover */}
        <div style={{ 
          height: 180, 
          backgroundColor: !P.cover_image ? `${P.avatarColor}22` : "transparent",
          backgroundImage: P.cover_image 
            ? `url(${P.cover_image})` 
            : "linear-gradient(rgba(245,166,35,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,0.04) 1px,transparent 1px)", 
          backgroundPosition: "center",
          backgroundSize: P.cover_image ? "cover" : "40px 40px", 
          position: "relative", 
          overflow: "hidden" 
        }}>
          {!P.cover_image && <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: `${P.avatarColor}12`, filter: "blur(80px)", top: -150, right: -100 }} />}
          {editing && (
            <button onClick={() => coverFileRef.current?.click()} style={{ position: "absolute", bottom: 12, right: 16, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#DCE6F0", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              📷 Badilisha Cover
            </button>
          )}
        </div>

        {/* Avatar + name row */}
        <div style={{ padding: "0 40px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ position: "relative", marginTop: -50 }}>
              <div style={{ cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                <Av initials={P.avatarInitials} color={P.avatarColor} size={100} src={P.avatar} />
                <div style={{ position: "absolute", bottom: 4, right: 4, width: 28, height: 28, borderRadius: "50%", background: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0A0F1C", cursor: "pointer", fontSize: 13 }}>📷</div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 12 }}>
              {editing ? (
                <>
                  <button className="icon-btn" onClick={cancelEdit}>✕ Ghairi</button>
                  <button onClick={saveProfile} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "9px 22px", borderRadius: 9, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>✓ Hifadhi Mabadiliko</button>
                </>
              ) : (
                <>
                  <button className="icon-btn" onClick={startEdit}>✏️ Hariri Profile</button>
                  <button style={{ background: P.available ? "rgba(52,211,153,0.12)" : "rgba(100,100,100,0.12)", border: `1px solid ${P.available ? "rgba(52,211,153,0.3)" : "rgba(100,100,100,0.2)"}`, color: P.available ? "#34D399" : "#666", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 11, fontWeight: 700, transition: "all 0.2s" }} onClick={() => setProfile(p => ({ ...p, available: !p.available }))}>
                    {P.available ? "● Available" : "● Busy"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE INFO ── */}
      <div style={{ padding: "16px 40px 0" }}>
        {editing ? (
          /* ── EDIT MODE ── */
          <div className="fin">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <InputField label="Jina Kamili" value={draft.name} onChange={setD("name")} placeholder="Jina lako" />
              <InputField label="Handle" value={draft.handle} onChange={e => setDraft(d => ({ ...d, handle: e.target.value.toLowerCase().replace(/\s/g,"") }))} placeholder="handle_yako" />
              <div>
                <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Jukumu</label>
                <select value={draft.role} onChange={setD("role")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#DCE6F0", fontFamily: "'Roboto Mono',monospace", fontSize: 14, outline: "none", width: "100%", appearance: "none", cursor: "pointer" }}>
                  {ROLES.map(r => <option key={r} value={r} style={{ background: "#111827" }}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Mji</label>
                <select value={draft.city} onChange={setD("city")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#DCE6F0", fontFamily: "'Roboto Mono',monospace", fontSize: 14, outline: "none", width: "100%", appearance: "none", cursor: "pointer" }}>
                  {CITIES.map(c => <option key={c} value={c} style={{ background: "#111827" }}>{c}</option>)}
                </select>
              </div>
              <InputField label="Kiwango cha Saa (Hourly Rate)" value={draft.hourlyRate} onChange={setD("hourlyRate")} placeholder="TZS 45K" />
              <InputField label="Barua Pepe" value={draft.email} onChange={setD("email")} placeholder="wewe@mfano.com" type="email" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <InputField label="Bio" value={draft.bio} onChange={setD("bio")} placeholder="Elezea wewe ni nani na unafanya nini kwenye AI..." multiline rows={4} />
            </div>

            {/* Links */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <InputField label="GitHub" value={draft.github} onChange={setD("github")} placeholder="github.com/wewe" />
              <InputField label="LinkedIn" value={draft.linkedin} onChange={setD("linkedin")} placeholder="linkedin.com/in/wewe" />
              <InputField label="Website" value={draft.website} onChange={setD("website")} placeholder="wewe.co.tz" />
            </div>

            {/* Skills editor */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase" }}>Skills ({draft.skills.length}/10)</label>
                <button onClick={() => setShowSkillSearch(!showSkillSearch)} className="skill-chip add">+ Ongeza Skill</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {draft.skills.map(s => (
                  <Pill key={s} label={s} bg="rgba(245,166,35,0.1)" color="#F5A623" onRemove={() => toggleSkill(s)} />
                ))}
              </div>
              {showSkillSearch && (
                <div className="fin" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
                  <input value={skillQ} onChange={e => setSkillQ(e.target.value)} placeholder="Tafuta skill..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#DCE6F0", fontSize: 13, marginBottom: 12 }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflowY: "auto" }}>
                    {filteredSkills.slice(0, 30).map(s => (
                      <span key={s} className="skill-chip add" onClick={() => { toggleSkill(s); setSkillQ(""); }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interests editor */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(220,230,240,0.45)", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Maslahi ({draft.interests.length}/6)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {ALL_INTERESTS.map(interest => {
                  const sel = draft.interests.includes(interest);
                  return (
                    <div key={interest} onClick={() => toggleInterest(interest)} style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 11, fontWeight: 700, border: `1px solid ${sel ? "#4ECDC4" : "rgba(255,255,255,0.09)"}`, background: sel ? "rgba(78,205,196,0.1)" : "transparent", color: sel ? "#4ECDC4" : "rgba(220,230,240,0.45)", transition: "all 0.18s", userSelect: "none" }}>
                      {sel && "✓ "}{interest}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F87171", letterSpacing: "0.12em", marginBottom: 12 }}>DANGER ZONE</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Futa Akaunti Yangu</div>
                  <div style={{ fontSize: 12, color: "rgba(220,230,240,0.4)" }}>Hatua hii haiwezi kubatilishwa. Data yote itafutwa kabisa.</div>
                </div>
                <button className="icon-btn danger" style={{ flexShrink: 0 }}>🗑 Futa Akaunti</button>
              </div>
            </div>
          </div>
        ) : (
          /* ── VIEW MODE ── */
          <div className="fin">
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.035em", marginBottom: 4 }}>{P.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.4)" }}>@{P.handle}</span>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>{P.role}</span>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.4)" }}>📍 {P.city}</span>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.4)" }}>⭐ {P.rating}</span>
              {P.hourlyRate && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "rgba(78,205,196,0.1)", color: "#4ECDC4" }}>{P.hourlyRate}/hr</span>}
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>Alijiunga: {P.joinedAt}</span>
            </div>
            {P.bio && <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(220,230,240,0.65)", maxWidth: 680, marginBottom: 16 }}>{P.bio}</p>}

            {/* Social links */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
              {P.github   && <a href={`https://${P.github}`}   target="_blank" rel="noreferrer" style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#60A5FA", textDecoration: "none" }}>⎇ {P.github}</a>}
              {P.linkedin && <a href={`https://${P.linkedin}`} target="_blank" rel="noreferrer" style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#60A5FA", textDecoration: "none" }}>in {P.linkedin}</a>}
              {P.website  && <a href={`https://${P.website}`}  target="_blank" rel="noreferrer" style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#60A5FA", textDecoration: "none" }}>🔗 {P.website}</a>}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 28, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                [P.postCount,    "Posts"],
                [P.followers,    "Wafuasi"],
                [P.following,    "Wanaofuatwa"],
                [P.projectCount, "Miradi"],
              ].map(([n, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#F5A623", fontFamily: "'Roboto Mono',monospace" }}>{n}</div>
                  <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.35)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        {!editing && (
          <div style={{ display: "flex", gap: 4, marginTop: 28, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── TAB CONTENT ── */}
      {!editing && (
        <div style={{ padding: "28px 40px 60px" }}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="fin" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Skills */}
                <div className="card">
                  <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", letterSpacing: "0.12em", marginBottom: 14 }}>SKILLS ({P.skills.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {P.skills.length ? P.skills.map(s => <span key={s} className="skill-chip">{s}</span>) : <span style={{ color: "rgba(220,230,240,0.35)", fontSize: 13 }}>Bado haujajaza skills — bonyeza "Hariri Profile"</span>}
                  </div>
                </div>

                {/* Interests */}
                <div className="card">
                  <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#4ECDC4", letterSpacing: "0.12em", marginBottom: 14 }}>MASLAHI</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {P.interests.length ? P.interests.map(i => (
                      <Pill key={i} label={i} bg="rgba(78,205,196,0.1)" color="#4ECDC4" />
                    )) : <span style={{ color: "rgba(220,230,240,0.35)", fontSize: 13 }}>Bado haujajaza maslahi</span>}
                  </div>
                </div>

                {/* Recent Projects preview */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#A78BFA", letterSpacing: "0.12em" }}>MIRADI YA HIVI KARIBUNI</div>
                    <span onClick={() => setTab("miradi")} style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", cursor: "pointer" }}>Tazama Yote →</span>
                  </div>
                  {projects.slice(0, 2).map(p => (
                    <div key={p.id} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</span>
                        <Pill label={STATUS_COLORS[p.status]?.label || p.status} bg={STATUS_COLORS[p.status]?.bg} color={STATUS_COLORS[p.status]?.color} />
                      </div>
                      <p style={{ fontSize: 13, color: "rgba(220,230,240,0.55)", lineHeight: 1.6, marginBottom: 8 }}>{p.desc}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {p.tech.map(t => <span key={t} className="skill-chip">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Contact card */}
                <div className="card">
                  <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 14 }}>WASILIANA</div>
                  <button style={{ width: "100%", background: "#F5A623", color: "#0A0F1C", border: "none", padding: "11px", borderRadius: 9, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>💬 Tuma Ujumbe</button>
                  <button style={{ width: "100%", background: "transparent", color: "#4ECDC4", border: "1px solid rgba(78,205,196,0.25)", padding: "11px", borderRadius: 9, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14 }}>⚡ Hire Now</button>
                </div>

                {/* Info */}
                <div className="card">
                  <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 14 }}>MAELEZO</div>
                  {[
                    ["📍 Mji", P.city],
                    ["💰 Kiwango", P.hourlyRate + "/hr"],
                    ["⭐ Rating", P.rating + " / 5.0"],
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
                        <div key={c} onClick={() => setProfile(p => ({ ...p, avatarColor: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${P.avatarColor === c ? "#fff" : "transparent"}`, transition: "all 0.18s" }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MIRADI ── */}
          {tab === "miradi" && (
            <div className="fin">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h2 style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}>Miradi Yangu ({projects.length})</h2>
                <button onClick={() => setShowNewProject(true)} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "10px 20px", borderRadius: 9, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>+ Mradi Mpya</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {projects.map(p => (
                  <div key={p.id} className="project-card">
                    {editingProject === p.id ? (
                      /* Inline project edit */
                      <div className="fin">
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <InputField label="Jina" value={projectDraft.title} onChange={e => setProjectDraft(d => ({ ...d, title: e.target.value }))} />
                          <InputField label="Maelezo" value={projectDraft.desc} onChange={e => setProjectDraft(d => ({ ...d, desc: e.target.value }))} multiline rows={3} />
                          <InputField label="Link" value={projectDraft.link} onChange={e => setProjectDraft(d => ({ ...d, link: e.target.value }))} />
                          <div style={{ display: "flex", gap: 8 }}>
                            {["active","completed","paused"].map(s => (
                              <div key={s} onClick={() => setProjectDraft(d => ({ ...d, status: s }))} style={{ padding: "6px 13px", borderRadius: 8, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 11, fontWeight: 700, border: `1px solid ${projectDraft.status === s ? STATUS_COLORS[s].color : "rgba(255,255,255,0.1)"}`, background: projectDraft.status === s ? STATUS_COLORS[s].bg : "transparent", color: projectDraft.status === s ? STATUS_COLORS[s].color : "rgba(220,230,240,0.4)", transition: "all 0.18s" }}>{STATUS_COLORS[s].label}</div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button className="icon-btn" onClick={() => setEditingProject(null)}>Ghairi</button>
                            <button onClick={saveProjectEdit} style={{ flex: 1, background: "#F5A623", color: "#0A0F1C", border: "none", padding: "9px", borderRadius: 8, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 13 }}>✓ Hifadhi</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                              <h3 style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>{p.title}</h3>
                              <Pill label={STATUS_COLORS[p.status]?.label || p.status} bg={STATUS_COLORS[p.status]?.bg} color={STATUS_COLORS[p.status]?.color} />
                            </div>
                            <p style={{ fontSize: 13, color: "rgba(220,230,240,0.6)", lineHeight: 1.65 }}>{p.desc}</p>
                          </div>
                          <div style={{ display: "flex", gap: 7, flexShrink: 0, marginLeft: 16 }}>
                            <button className="icon-btn" onClick={() => startEditProject(p)}>✏️</button>
                            <button className="icon-btn danger" onClick={() => setConfirmDelete(p.id)}>🗑</button>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                          {p.tech.map(t => <span key={t} className="skill-chip">{t}</span>)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {p.link ? <a href={`https://${p.link}`} target="_blank" rel="noreferrer" style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#60A5FA", textDecoration: "none" }}>🔗 {p.link}</a> : <span />}
                          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F5A623" }}>⭐ {p.stars}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {projects.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ fontSize: 44, marginBottom: 16 }}>📂</div>
                    <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>Hakuna miradi bado</h3>
                    <p style={{ color: "rgba(220,230,240,0.4)", marginBottom: 20 }}>Ongeza mradi wako wa kwanza!</p>
                    <button onClick={() => setShowNewProject(true)} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "11px 24px", borderRadius: 9, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14 }}>+ Ongeza Mradi</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── POSTS ── */}
          {tab === "posts" && (
            <div className="fin">
              <h2 style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em", marginBottom: 22 }}>Posts Zangu ({posts.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {posts.map(p => {
                  const cc = CAT_COLORS[p.category] || CAT_COLORS.swali;
                  return (
                    <div key={p.id} className="card">
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                        <Pill label={p.category.charAt(0).toUpperCase() + p.category.slice(1)} bg={cc.bg} color={cc.color} />
                        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>{p.time}</span>
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(220,230,240,0.82)" }}>{p.content}</p>
                      <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
                        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "#F5A623" }}>♥ {p.likes}</span>
                        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.35)" }}>◻ {p.comments}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === "settings" && (
            <div className="fin" style={{ maxWidth: 600 }} ref={el => { if (el && !notifLoaded) loadNotifSettings(); }}>
              <h2 style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em", marginBottom: 24 }}>Mipangilio ya Akaunti</h2>

              {/* Password change */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 16 }}>BADILISHA NYWILA</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <InputField label="Nywila ya Sasa" placeholder="••••••••" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
                  <InputField label="Nywila Mpya" placeholder="••••••••" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
                  <InputField label="Thibitisha Nywila Mpya" placeholder="••••••••" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                  <button onClick={changePassword} disabled={pwLoading} style={{ background: pwLoading ? "rgba(245,166,35,0.5)" : "#F5A623", color: "#0A0F1C", border: "none", padding: "11px", borderRadius: 9, cursor: pwLoading ? "default" : "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14 }}>
                    {pwLoading ? "Inabadilisha..." : "Badilisha Nywila"}
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.12em", marginBottom: 16 }}>ARIFA</div>
                {[
                  ["likes_comments", "Arifa za Likes na Comments"],
                  ["email_digest",   "Email Digest ya Wiki"],
                  ["new_challenges", "Arifa za Changamoto Mpya"],
                  ["newsletter",     "Newsletter ya JamiiAI"],
                  ["ai_jobs",        "Arifa za AI Jobs"],
                ].map(([key, label]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
                    <div onClick={() => saveNotifSettings(key, !notifSettings[key])} style={{ width: 40, height: 22, borderRadius: 11, background: notifSettings[key] ? "#F5A623" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                      <div style={{ position: "absolute", top: 3, left: notifSettings[key] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: notifSettings[key] ? "#0A0F1C" : "rgba(220,230,240,0.5)", transition: "left 0.2s" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Danger zone */}
              <div style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F87171", letterSpacing: "0.12em", marginBottom: 16 }}>DANGER ZONE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Weka Profile Kuwa Private</div>
                      <div style={{ fontSize: 12, color: "rgba(220,230,240,0.4)", marginTop: 3 }}>Watu wengine hawataona profile yako</div>
                    </div>
                    <button className="icon-btn" onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        await axios.patch(`${API_URL}/users/me/settings`, { private: true }, { headers: { Authorization: `Bearer ${token}` } });
                        notify("🔒 Profile imewekwa private");
                      } catch { notify("❌ Imeshindwa"); }
                    }}>Weka Private</button>
                  </div>
                  <div style={{ height: 1, background: "rgba(248,113,113,0.15)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#F87171" }}>Futa Akaunti Yangu</div>
                      <div style={{ fontSize: 12, color: "rgba(220,230,240,0.4)", marginTop: 3 }}>Hatua hii haiwezi kubatilishwa kabisa</div>
                    </div>
                    {!deleteConfirm
                      ? <button className="icon-btn danger" onClick={() => setDeleteConfirm(true)}>🗑 Futa Akaunti</button>
                      : <div style={{ display: "flex", gap: 8 }}>
                          <button className="icon-btn" onClick={() => setDeleteConfirm(false)}>Ghairi</button>
                          <button onClick={deleteAccount} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 13 }}>Thibitisha Kufuta</button>
                        </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}