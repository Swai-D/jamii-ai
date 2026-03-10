import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Heart, MessageSquare, Bookmark, Share2, Send, Languages, Star, Users, MapPin, Briefcase, ExternalLink, Zap, Github, Linkedin, Twitter, Mail, Phone, CheckCircle2, Trophy, Calendar, Globe, Clock, Search, ChevronRight, LogOut, UserPlus, UserCheck, MoreHorizontal, Flag, Link2 } from "lucide-react";
import { translations } from "../translations";
import ProfilePage from "./jamii-ai-profile";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import DirectMessages from "./DirectMessages";

// ... (existing constants)

const API_URL = "http://localhost:4000/api";

const TAG_COLORS = {
  swali:  { bg: "rgba(96,165,250,0.12)",  color: "#60A5FA" },
  mradi:  { bg: "rgba(52,211,153,0.12)",  color: "#34D399" },
  habari: { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
  kazi:   { bg: "rgba(245,166,35,0.12)",  color: "#F5A623" },
};

const NAV_ITEMS = [
  { id: "nyumbani",    icon: "🏠", label: "Nyumbani",       badge: null },
  { id: "gundua",     icon: "🧭", label: "Gundua",         badge: null },
  { id: "wataalamu",  icon: "👨‍💻", label: "Wataalamu",      badge: null },
  { id: "startups",   icon: "🚀", label: "Startups",       badge: null },
  { id: "vyuo",       icon: "🎓", label: "Vyuo & Taasisi", badge: null },
  { id: "changamoto", icon: "🏆", label: "Changamoto",     badge: "2"  },
  { id: "rasilimali", icon: "📚", label: "Rasilimali",     badge: null },
  { id: "kazi",       icon: "💼", label: "Kazi",           badge: "6"  },
  { id: "habari",     icon: "📰", label: "Habari",         badge: null },
  { id: "matukio",    icon: "🗓️", label: "Matukio",        badge: null },
  { id: "ujumbe",     icon: "💬", label: "Ujumbe",         badge: null },
];

const FILTER_TABS = [
  { id: "all",    label: "Yote"    },
  { id: "swali",  label: "Maswali" },
  { id: "mradi",  label: "Miradi"  },
  { id: "habari", label: "Habari"  },
  { id: "kazi",   label: "Kazi"    },
];

const PAGE_TITLE = {
  nyumbani: "Nyumbani 🏠", gundua: "Gundua 🧭", wataalamu: "Wataalamu 👨‍💻",
  startups: "Startups Tanzania 🚀", vyuo: "Vyuo & Taasisi 🎓",
  changamoto: "Changamoto 🏆", rasilimali: "Rasilimali 📚",
  habari: "Habari za AI 📰", matukio: "Matukio 🗓️", ujumbe: "Ujumbe 💬",
  kazi: "Kazi za AI 💼",
};

const TYPE_LABELS = {
  full_time:  { label: "Full-time",  color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  internship: { label: "Internship", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  remote:     { label: "Remote",     color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
  freelance:  { label: "Freelance",  color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  part_time:  { label: "Part-time",  color: "#F87171", bg: "rgba(248,113,113,0.1)" },
  contract:   { label: "Contract",   color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtSalary(min, max, curr) {
  const fmt = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : `${(n/1000).toFixed(0)}K`;
  if (!min && !max) return "Mshahara wa mazungumzo";
  if (!max) return `${curr} ${fmt(min)}+`;
  return `${curr} ${fmt(min)} – ${fmt(max)}`;
}

function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return diff <= 0 ? "Imekwisha" : diff === 1 ? "Siku 1 imebaki" : `Siku ${diff} zimebaki`;
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval === 1 ? "Mwaka 1 uliopita" : `Miaka ${interval} iliyopita`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval === 1 ? "Mwezi 1 uliopita" : `Miezi ${interval} iliyopita`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval === 1 ? "Siku 1 iliyopita" : `Siku ${interval} zilizopita`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval === 1 ? "Saa 1 lililopita" : `Masaa ${interval} yaliyopita`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval === 1 ? "Dakika 1 iliyopita" : `Dakika ${interval} zilizopita`;
  return seconds <= 10 ? "Sasa hivi" : `Sekunde ${seconds} zilizopita`;
}

function CompanyInitials({ name, size = 44 }) {
  const colors = ["#F5A623","#34D399","#60A5FA","#A78BFA","#F87171"];
  const color  = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: `${color}18`, border: `1.5px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.32, color, fontFamily: "'Roboto Mono',monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function TypeBadge({ type }) {
  const t = TYPE_LABELS[type] || { label: type, color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: t.color, background: t.bg, border: `1px solid ${t.color}25`, fontFamily: "'Roboto Mono',monospace" }}>
      {t.label}
    </span>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function Av({ initials, color, size = 40, userId, src, name }) {
  // Ensure we have initials if name is provided but initials are missing
  const finalInitials = initials || (name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?");
  
  // Derive consistent color from userId, finalInitials, or fallback
  const seed = userId || finalInitials || "x";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const derived = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  const bg = color || derived;
  const textColor = ["#F5A623","#FBBF24","#34D399","#60A5FA"].includes(bg) ? "#0A0F1C" : "#fff";
  
  // Check if src is valid (not empty, not just whitespace)
  const hasImage = src && src.trim().length > 0;

  return (
    <div style={{ 
      width: size, height: size, borderRadius: "50%", 
      background: hasImage ? "transparent" : bg, 
      display: "flex", alignItems: "center", justifyContent: "center", 
      fontFamily: "'Roboto Mono',monospace", fontWeight: 700, 
      fontSize: size * 0.35, color: textColor, flexShrink: 0,
      overflow: "hidden",
      border: hasImage ? `1.5px solid rgba(255,255,255,0.1)` : "none"
    }}>
      {hasImage ? (
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        finalInitials
      )}
    </div>
  );
}

function Pill({ label, bg, color }) {
  return <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>{label}</span>;
}

function SkillTag({ label }) {
  return <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "rgba(220,230,240,0.55)" }}>{label}</span>;
}

function VerifiedBadge({ size = 14 }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4 }}>
      <svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
        <path 
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.01s-2.62-1.27-4.01-.81C14.67 2.53 13.43 1.65 12 1.65s-2.67.88-3.34 2.19c-1.39-.46-2.97-.2-4.01.81s-1.27 2.62-.81 4.01C2.53 9.33 1.65 10.57 1.65 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 4.01s2.62 1.27 4.01.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.97.2 4.01-.81s1.27-2.62.81-4.01c1.31-.67 2.19-1.91 2.19-3.34z" 
          fill="#1D9BF0" 
        />
        <path 
          d="M10.54 16.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" 
          fill="white" 
        />
      </svg>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

// Derive a consistent color from user id/handle — no DB column needed
const AVATAR_COLORS = ["#F5A623","#4ECDC4","#A78BFA","#34D399","#F87171","#60A5FA","#FBBF24","#E879F9"];
function userColor(user) {
  const str = user?.id || user?.handle || "x";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function normalizeUser(u) {
  return {
    ...u,
    skills: Array.isArray(u.skills)
      ? u.skills
      : (typeof u.skills === "string" && u.skills.startsWith("["))
        ? JSON.parse(u.skills)
        : [],
    hourly_rate: u.hourly_rate || null,
    available:   u.available ?? true,
    rating:      u.rating ? Number(u.rating).toFixed(1) : null,
    project_count: u.project_count || 0,
    color: userColor(u),
  };
}

function ExpertDetailModal({ dev: initialDev, onClose, t, onMessage, onFollow, me }) {
  const [fullDev, setFullDev] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!initialDev?.handle && !initialDev?.id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const identifier = initialDev.handle || initialDev.id;
        const res = await axios.get(`${API_URL}/users/${identifier}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setFullDev(res.data);
      } catch (err) {
        console.error("Failed to fetch full profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullProfile();
  }, [initialDev]);

  const dev = normalizeUser(fullDev || initialDev);
  const isSelf = me?.id === dev.id;
  const color = userColor(dev);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }} />
      <div style={{ position: "relative", background: "#0D1322", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 28, width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", padding: 0, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>

        {/* Header gradient */}
        <div style={{ height: 130, background: `linear-gradient(135deg, ${color}44 0%, #0D1322 100%)`, position: "relative", borderRadius: "28px 28px 0 0" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(0,0,0,0.35)", border: "none", color: "#FFF", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "0 28px 28px", marginTop: -52 }}>
          {/* Avatar + social icons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div style={{ position: "relative" }}>
              {dev.avatar_url
                ? <img src={dev.avatar_url} alt={dev.name} style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: `3px solid ${color}` }} />
                : <Av initials={dev.name ? dev.name.split(" ").map(w => w[0]).join("") : "??"} color={color} size={100} />
              }
              {dev.is_verified && (
                <div style={{ position: "absolute", bottom: 4, right: 4, background: "#0D1322", borderRadius: "50%", padding: 3 }}>
                  <VerifiedBadge size={24} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, paddingBottom: 8 }}>
              {(dev.github_url || dev.github)   && <a href={dev.github_url || dev.github}   target="_blank" rel="noreferrer" style={{ color: "rgba(220,230,240,0.4)" }}><Github   size={20} /></a>}
              {(dev.linkedin_url || dev.linkedin) && <a href={dev.linkedin_url || dev.linkedin} target="_blank" rel="noreferrer" style={{ color: "rgba(220,230,240,0.4)" }}><Linkedin size={20} /></a>}
              {(dev.website_url || dev.website)  && <a href={dev.website_url || dev.website}  target="_blank" rel="noreferrer" style={{ color: "rgba(220,230,240,0.4)" }}><Globe    size={20} /></a>}
              {(dev.twitter_url || dev.twitter)  && <a href={dev.twitter_url || dev.twitter}  target="_blank" rel="noreferrer" style={{ color: "rgba(220,230,240,0.4)" }}><Twitter  size={20} /></a>}
            </div>
          </div>

          {/* Name + meta */}
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>{dev.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: "#F5A623", fontFamily: "'Roboto Mono',monospace", fontSize: 14, fontWeight: 600 }}>@{dev.handle}</span>
              <span style={{ opacity: 0.2 }}>·</span>
              <span style={{ fontSize: 13, opacity: 0.6 }}>{dev.role}</span>
              {dev.city && <><span style={{ opacity: 0.2 }}>·</span><span style={{ fontSize: 13, opacity: 0.45 }}>📍 {dev.city}</span></>}
            </div>
          </div>

          {/* Loading indicator for full data */}
          {loading && !fullDev && (
            <div style={{ padding: "20px 0", textAlign: "center", opacity: 0.5, fontSize: 13 }}>
              Inapakia taarifa kamili...
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 28, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 22 }}>
            {dev.rating && (
              <div><div style={{ fontSize: 18, fontWeight: 800, color: "#F5A623" }}>⭐ {dev.rating}</div><div style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Rating</div></div>
            )}
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{dev.project_count || 0}</div>
              <div style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Miradi</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{dev.followers || 0}</div>
              <div style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Wafuasi</div>
            </div>
            {dev.hourly_rate && (
              <div><div style={{ fontSize: 18, fontWeight: 800, color: "#4ECDC4" }}>{dev.hourly_rate}</div><div style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Rate/hr</div></div>
            )}
          </div>

          {/* Bio */}
          {dev.bio && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(220,230,240,0.72)" }}>{dev.bio}</p>
            </div>
          )}

          {/* Skills */}
          {dev.skills.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Ujuzi</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {dev.skills.map(s => (
                  <span key={s} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#F5A623" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Availability badge */}
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: dev.available ? "#34D399" : "#6B7280" }} />
            <span style={{ fontSize: 12, color: dev.available ? "#34D399" : "rgba(220,230,240,0.4)", fontWeight: 600 }}>
              {dev.available ? "Anapatikana sasa" : "Hanapatikani sasa"}
            </span>
          </div>

          {/* Action buttons — hidden for self */}
          {!isSelf && (
            <div style={{ display: "flex", gap: 12, position: "sticky", bottom: 0, background: "#0D1322", paddingTop: 10 }}>
              {dev.available && (
                <button
                  onClick={() => { onMessage(dev); onClose(); }}
                  style={{ flex: 1.5, background: "#F5A623", color: "#0A0F1C", border: "none", padding: "14px", borderRadius: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}
                >
                  <MessageSquare size={18} /> Mtumie Ujumbe
                </button>
              )}
              <button
                onClick={() => { onFollow(dev.id); onClose(); }}
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)", padding: "14px", borderRadius: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}
              >
                <UserPlus size={18} /> Fuata
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpertCard({ dev: rawDev, onClick, t }) {
  const dev = normalizeUser(rawDev);
  return (
    <div onClick={() => onClick(dev)} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18, transition: "all 0.2s", cursor: "pointer" }} className="post-card">
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {dev.avatar_url
          ? <img src={dev.avatar_url} alt={dev.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          : <Av initials={dev.name ? dev.name.split(" ").map(w => w[0]).join("") : "??"} color={dev.color} size={44} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dev.name}</span>
            {dev.is_verified && <VerifiedBadge size={13} />}
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: dev.available ? "#34D399" : "#444", marginLeft: "auto", flexShrink: 0, title: dev.available ? "Anapatikana" : "Hanapatikani" }} />
          </div>
          <div style={{ color: "rgba(220,230,240,0.4)", fontSize: 11, fontFamily: "'Roboto Mono',monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {dev.role}{dev.city ? ` · ${dev.city}` : ""}
          </div>
        </div>
      </div>

      {dev.bio && (
        <p style={{ fontSize: 12, color: "rgba(220,230,240,0.5)", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {dev.bio}
        </p>
      )}

      {dev.skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {dev.skills.slice(0, 3).map(s => <SkillTag key={s} label={s} />)}
          {dev.skills.length > 3 && <span style={{ fontSize: 10, color: "rgba(220,230,240,0.3)", padding: "4px 8px" }}>+{dev.skills.length - 3}</span>}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {dev.rating && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F5A623" }}>⭐ {dev.rating}</span>}
          {dev.hourly_rate && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#4ECDC4" }}>{dev.hourly_rate}</span>}
          {!dev.rating && !dev.hourly_rate && <span style={{ fontSize: 11, color: "rgba(220,230,240,0.25)" }}>{dev.followers || 0} wafuasi</span>}
        </div>
        <span style={{
          background: dev.available ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
          color: dev.available ? "#34D399" : "rgba(220,230,240,0.25)",
          border: `1px solid ${dev.available ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
          padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700
        }}>
          {dev.available ? "Anapatikana" : "Busy"}
        </span>
      </div>
    </div>
  );
}
function StartupCard({ st, t }) {
  const tech = Array.isArray(st.tech_stack) ? st.tech_stack : (Array.isArray(st.tech) ? st.tech : JSON.parse(st.tech_stack || "[]"));
  const color = st.color || "#F5A623";
  
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.02)", 
      border: "1px solid rgba(255,255,255,0.06)", 
      borderRadius: 20, 
      padding: "24px", 
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden"
    }} className="post-card">
      {/* Background Glow */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: `${color}10`, filter: "blur(40px)", borderRadius: "50%" }} />
      
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ 
          width: 70, 
          height: 70, 
          borderRadius: 18, 
          background: `linear-gradient(135deg, ${color}25 0%, ${color}05 100%)`, 
          border: `1px solid ${color}30`, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          fontFamily: "'Roboto Mono',monospace", 
          fontWeight: 800, 
          fontSize: 20, 
          color: color, 
          flexShrink: 0,
          boxShadow: `0 8px 20px ${color}10`
        }}>{st.logo}</div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h3 style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-0.01em" }}>{st.name}</h3>
                <Pill label={st.sector} bg={`${color}12`} color={color} />
                {st.hiring && <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(52,211,153,0.1)", color: "#34D399", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>🔍 Hiring</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, opacity: 0.4 }}>
                <span>📍 {st.loc || st.location}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor" }} />
                <span>Founded {st.founded}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor" }} />
                <span style={{ color }}>{st.stage} Stage</span>
              </div>
            </div>
            <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#FFF", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Visit Website ↗</button>
          </div>
          
          <p style={{ fontSize: 14, color: "rgba(220,230,240,0.7)", lineHeight: 1.65, marginBottom: 20, maxWidth: "90%" }}>{st.description || st.desc}</p>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {tech.map(t => <SkillTag key={t} label={t} />)}
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, opacity: 0.3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Team Size</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>👥 {st.team_size || st.team}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, opacity: 0.3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Funding</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399" }}>💰 {st.funding}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstitutionCard({ ins, t }) {
  const focus = Array.isArray(ins.focus_areas) ? ins.focus_areas : (Array.isArray(ins.focus) ? ins.focus : JSON.parse(ins.focus_areas || "[]"));
  const color = ins.color || "#60A5FA";
  
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, transition: "all 0.2s" }} className="post-card">
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 13, color: color, flexShrink: 0 }}>{ins.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ins.name}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
            <Pill label={ins.type} bg={`${color}18`} color={color} />
          </div>
        </div>
      </div>
      <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: color, marginBottom: 6 }}>{ins.dept || ins.department} · 📍 {ins.loc || ins.location}</div>
      <p style={{ fontSize: 12, color: "rgba(220,230,240,0.55)", lineHeight: 1.6, marginBottom: 12, height: 38, overflow: "hidden" }}>{ins.description || ins.desc}</p>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {focus.slice(0, 3).map(f => <SkillTag key={f} label={f} />)}
      </div>
      <div style={{ display: "flex", gap: 14, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10, marginTop: "auto" }}>
        {ins.student_count && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>👩‍🎓 {ins.student_count.toLocaleString()} {t.wanafunzi}</span>}
        {ins.researcher_count && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>🔬 {ins.researcher_count} {t.watafiti}</span>}
      </div>
    </div>
  );
}

function ChallengeCard({ ch, t }) {
  const tags = Array.isArray(ch.tags) ? ch.tags : JSON.parse(ch.tags || "[]");
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Trophy size={20} color={ch.color} />
            <h3 style={{ fontWeight: 700, fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch.title}</h3>
          </div>
          <p style={{ fontSize: 12, opacity: 0.5 }}>{t.kwa} {ch.org}</p>
        </div>
        <Pill label={(ch.status || 'open').toUpperCase()} bg={ch.status === 'open' ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)"} color={ch.status === 'open' ? "#34D399" : "rgba(220,230,240,0.4)"} />
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(220,230,240,0.7)", marginBottom: 18 }}>{ch.description}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12 }}>
          <div style={{ fontSize: 9, opacity: 0.4, letterSpacing: "0.1em", marginBottom: 4 }}>{t.zawadi}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#F5A623" }}>{ch.prize}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12 }}>
          <div style={{ fontSize: 9, opacity: 0.4, letterSpacing: "0.1em", marginBottom: 4 }}>{t.mwisho}</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(ch.deadline).toLocaleDateString()}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>{tags.map(tag => <SkillTag key={tag} label={tag} />)}</div>
        <button style={{ background: ch.color, color: "#0A0F1C", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{t.jiunge_changamoto}</button>
      </div>
    </div>
  );
}

function EventCard({ ev, t }) {
  const date = new Date(ev.date);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, display: "flex", gap: 20 }}>
      <div style={{ width: 60, height: 75, background: "rgba(255,255,255,0.04)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: ev.color }}>{day}</span>
        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.4, letterSpacing: "0.1em" }}>{month}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</h3>
          <Pill label={ev.type} bg={`${ev.color}15`} color={ev.color} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.5 }}>
            <MapPin size={14} /> {ev.location} {ev.is_online && <span style={{ color: "#34D399" }}>({t.online})</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.5 }}>
            <Clock size={14} /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(220,230,240,0.6)", lineHeight: 1.5, marginBottom: 16 }}>{ev.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, opacity: 0.4 }}>{ev.rsvp_count || 0} {t.wanahudhuria}</span>
          <button style={{ background: "transparent", color: ev.color, border: `1px solid ${ev.color}40`, padding: "6px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{t.rsvp}</button>
        </div>
      </div>
    </div>
  );
}

// ─── JOB COMPONENTS ──────────────────────────────────────────────────────────

function JobCard({ job, onClick, onSave, t }) {
  const [saved, setSaved] = useState(job.is_saved);
  const dl = daysLeft(job.deadline);
  const dlUrgent = dl && dl.includes("Siku") && parseInt(dl) <= 5;

  return (
    <div
      onClick={() => onClick(job)}
      style={{
        background: job.is_featured ? "linear-gradient(135deg,rgba(245,166,35,0.05) 0%, rgba(255,255,255,0.02) 60%)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${job.is_featured ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16, padding: "20px", cursor: "pointer", position: "relative",
        transition: "all 0.2s", overflow: "hidden",
      }}
      className="post-card"
    >
      {job.is_featured && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "linear-gradient(135deg,#F5A623,#e8961a)",
          color: "#0A0F1C", fontSize: 9, fontWeight: 800, padding: "4px 12px",
          borderBottomLeftRadius: 10, letterSpacing: "0.05em"
        }}>⭐ FEATURED</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
        <CompanyInitials name={job.company_name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: "#F2F2F5",
            fontFamily: "'Roboto Mono',monospace", lineHeight: 1.3,
            marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {job.title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(242,242,245,0.4)", fontFamily: "'Roboto Mono',monospace" }}>
            {job.company_name}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setSaved(!saved); onSave?.(job.id); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 16, opacity: saved ? 1 : 0.3,
            transition: "all 0.15s", padding: 2, flexShrink: 0,
          }}
        >
          {saved ? "🔖" : "🔖"}
        </button>
      </div>

      {/* Type + Location */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <TypeBadge type={job.type} />
        <span style={{ fontSize: 11, color: "rgba(242,242,245,0.35)", fontFamily: "'Roboto Mono',monospace" }}>
          📍 {job.is_remote ? "Remote" : job.location}
        </span>
        {job.salary_visible && (
          <span style={{ fontSize: 11, color: "#F5A623", fontFamily: "'Roboto Mono',monospace", fontWeight: 700 }}>
            💰 {fmtSalary(job.salary_min, job.salary_max, job.salary_currency)}
          </span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {job.tags.slice(0, 3).map(tag => <SkillTag key={tag} label={tag} />)}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(242,242,245,0.25)", fontFamily: "'Roboto Mono',monospace" }}>
            👁 {job.views}
          </span>
          <span style={{ fontSize: 10, color: "rgba(242,242,245,0.25)", fontFamily: "'Roboto Mono',monospace" }}>
            📄 {job.applications_count}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {dl && (
            <span style={{
              fontSize: 10, fontFamily: "'Roboto Mono',monospace",
              color: dlUrgent ? "#F87171" : "rgba(242,242,245,0.25)",
              fontWeight: dlUrgent ? 700 : 400,
            }}>
              ⏰ {dl}
            </span>
          )}
          {job.has_applied ? (
            <span style={{
              fontSize: 10, padding: "4px 10px", borderRadius: 20,
              background: "rgba(52,211,153,0.1)", color: "#34D399",
              border: "1px solid rgba(52,211,153,0.2)", fontFamily: "'Roboto Mono',monospace",
              fontWeight: 700,
            }}>{t.umeapply}</span>
          ) : (
            <span style={{
              fontSize: 10, padding: "4px 10px", borderRadius: 20,
              background: "rgba(245,166,35,0.12)", color: "#F5A623",
              border: "1px solid rgba(245,166,35,0.25)", fontFamily: "'Roboto Mono',monospace",
              fontWeight: 700,
            }}>{t.apply_sasa}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function JobModal({ job, onClose, onApply, t }) {
  const [tab, setTab] = useState("maelezo");
  const [form, setForm] = useState({ cover_letter: "", linkedin_url: "", portfolio_url: "" });
  const [submitted, setSubmitted] = useState(job.has_applied);

  if (!job) return null;

  const handleApply = () => {
    if (!form.cover_letter.trim()) return;
    setSubmitted(true);
    onApply?.(job.id, form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          background: "#0D1322", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24,
          width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "hidden",
          display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
        }}
      >
        {/* Modal header */}
        <div style={{ padding: "28px 28px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginBottom: 20 }}>
            <CompanyInitials name={job.company_name} size={60} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFF", fontFamily: "'Roboto Mono',monospace", marginBottom: 4, letterSpacing: "-0.02em" }}>
                {job.title}
              </div>
              <div style={{ fontSize: 14, color: "rgba(220,230,240,0.5)", fontFamily: "'Roboto Mono',monospace", marginBottom: 12 }}>
                {job.company_name} · {job.is_remote ? "Remote" : job.location}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <TypeBadge type={job.type} />
                {job.salary_visible && (
                  <span style={{ fontSize: 12, color: "#F5A623", fontWeight: 700, fontFamily: "'Roboto Mono',monospace" }}>
                    💰 {fmtSalary(job.salary_min, job.salary_max, job.salary_currency)}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#FFF", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {[["maelezo", t.maelezo_ya_kazi], ["mahitaji", t.mahitaji], ["apply", submitted ? t.umeapply : "Apply"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: "12px 20px", background: "none", border: "none",
                cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 12, fontWeight: 700,
                color: tab === id ? "#F5A623" : "rgba(220,230,240,0.4)",
                borderBottom: `2px solid ${tab === id ? "#F5A623" : "transparent"}`,
                transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: 28, overflowY: "auto", flex: 1 }}>
          {tab === "maelezo" && (
            <div>
              <p style={{ fontSize: 14, color: "rgba(220,230,240,0.7)", lineHeight: 1.8, fontFamily: "'Roboto Mono',monospace", marginBottom: 24 }}>
                {job.description}
              </p>
              {job.benefits && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>🎁 {t.benefits}</div>
                  {job.benefits.split("\n").map((b, i) => (
                    <div key={i} style={{ fontSize: 13, color: "rgba(220,230,240,0.6)", fontFamily: "'Roboto Mono',monospace", marginBottom: 6, display: "flex", gap: 8 }}>
                      <span style={{ color: "#34D399" }}>•</span> {b.replace(/^•\s*/, '')}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 16, padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#FFF" }}>{job.applications_count}</div>
                  <div style={{ fontSize: 10, color: "rgba(220,230,240,0.3)", textTransform: "uppercase", marginTop: 4 }}>Wameapply</div>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#FFF" }}>{job.views}</div>
                  <div style={{ fontSize: 10, color: "rgba(220,230,240,0.3)", textTransform: "uppercase", marginTop: 4 }}>Wameona</div>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#F5A623" }}>{daysLeft(job.deadline)}</div>
                  <div style={{ fontSize: 10, color: "rgba(220,230,240,0.3)", textTransform: "uppercase", marginTop: 4 }}>{t.deadline}</div>
                </div>
              </div>
            </div>
          )}

          {tab === "mahitaji" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>📋 {t.mahitaji}</div>
              {(job.requirements || "").split("\n").map((r, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(220,230,240,0.7)", fontFamily: "'Roboto Mono',monospace", marginBottom: 10, paddingLeft: 4 }}>{r}</div>
              ))}
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(220,230,240,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>🏷 Skills Zinazohitajika</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {job.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "rgba(245,166,35,0.1)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)", fontWeight: 700 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "apply" && (
            submitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>🎉</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#34D399", marginBottom: 10 }}>
                  {t.application_imewasilishwa}
                </div>
                <div style={{ fontSize: 14, color: "rgba(220,230,240,0.5)", lineHeight: 1.6 }}>
                  {job.company_name} {t.asante_apply}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: "rgba(220,230,240,0.5)", marginBottom: 24, lineHeight: 1.6 }}>
                  Unaapply kwa <strong style={{ color: "#FFF" }}>{job.title}</strong> kwenye <strong style={{ color: "#FFF" }}>{job.company_name}</strong>.
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                    {t.barua_ya_kuomba} *
                  </label>
                  <textarea
                    value={form.cover_letter}
                    onChange={e => setForm({...form, cover_letter: e.target.value})}
                    placeholder="Eleza kwa nini unataka kazi hii..."
                    rows={6}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px", color: "#FFF", fontSize: 13, fontFamily: "'Roboto Mono',monospace", resize: "none", outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
                   <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(220,230,240,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>LINKEDIN URL</label>
                    <input value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="https://..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 12, outline: "none" }} />
                   </div>
                   <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(220,230,240,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>PORTFOLIO URL</label>
                    <input value={form.portfolio_url} onChange={e => setForm({...form, portfolio_url: e.target.value})} placeholder="https://..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 12, outline: "none" }} />
                   </div>
                </div>

                <button
                  onClick={handleApply}
                  disabled={!form.cover_letter.trim()}
                  style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: form.cover_letter.trim() ? "#F5A623" : "rgba(255,255,255,0.05)", color: form.cover_letter.trim() ? "#0A0F1C" : "rgba(220,230,240,0.2)", fontWeight: 800, fontSize: 14, cursor: form.cover_letter.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                >
                  {t.wasilisha_application}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGING UI ────────────────────────────────────────────────────────────

function MessagingUI({ user, t }) {
  const [convos, setConvos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  const scrollRef = useRef();

  const fetchConvos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      setConvos(res.data);
      if (res.data.length > 0 && !selected) setSelected(res.data[0]);
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async (userId) => {
    setLoadingMsg(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
    } catch (err) { console.error(err); }
    setLoadingMsg(false);
  };

  useEffect(() => { fetchConvos(); }, []);
  useEffect(() => { if (selected) fetchMessages(selected.id); }, [selected]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !selected) return;
    const msgObj = { receiver_id: selected.id, text };
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/messages`, msgObj, { headers: { Authorization: `Bearer ${token}` } });
      setMessages([...messages, res.data]);
      setText("");
      fetchConvos();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
      {/* Conversations list */}
      <div style={{ width: 280, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{t.ujumbe}</div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.25 }} />
            <input placeholder={t.tafuta_chat || "Tafuta..."} style={{ width: "100%", background: "#0C0C0E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "#FFF", fontSize: 12, outline: "none" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {convos.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 16px", color:"rgba(220,230,240,0.3)" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
              <div style={{ fontSize:13 }}>Hakuna mazungumzo bado</div>
            </div>
          ) : convos.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{ display: "flex", gap: 10, padding: "11px 12px", borderRadius: 12, cursor: "pointer", background: selected?.id === c.id ? "rgba(245,166,35,0.1)" : "transparent", marginBottom: 4, transition: "0.2s", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Av initials={c.name ? c.name.split(" ").map(w => w[0]).join("") : "??"} userId={c.id} size={38} />
                {c.is_online && <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: "#34D399", border: "2px solid #0C0C0E" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  <span style={{ fontSize: 9, opacity: 0.3 }}>{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last_message}</div>
              </div>
              {c.unread_count > 0 && (
                <span style={{ background: "#F5A623", color: "#0A0F1C", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 9 }}>{c.unread_count}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.01)" }}>
        {selected ? (
          <>
            <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
              <Av initials={selected.name ? selected.name.split(" ").map(w => w[0]).join("") : "??"} userId={selected.id} size={34} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name}</div>
                <div style={{ fontSize: 10, color: selected.is_online ? "#34D399" : "rgba(220,230,240,0.3)" }}>
                  {selected.is_online ? `● ${t.online}` : `● ${t.offline || 'Offline'}`} · {selected.role}
                </div>
              </div>
              <button style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(220,230,240,0.5)", padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>◈ Profile</button>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {loadingMsg ? <div style={{ textAlign: "center", opacity: 0.3 }}>...</div> : messages.map((m, i) => {
                const isMe = m.sender_id === user.id;
                return (
                  <div key={i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "72%" }}>
                    <div style={{ background: isMe ? "#F5A623" : "#1C1C1E", color: isMe ? "#0A0F1C" : "#F2F2F5", padding: "10px 14px", borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px", fontSize: 14, lineHeight: 1.5, fontWeight: isMe ? 600 : 400 }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.3, marginTop: 4, textAlign: isMe ? "right" : "left" }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea 
                value={text} 
                onChange={e => setText(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`${t.andika_ujumbe}...`} 
                rows={1}
                style={{ flex: 1, background: "#0C0C0E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#FFF", outline: "none", fontSize: 14, resize: "none", lineHeight: 1.5 }} 
              />
              <button onClick={handleSend} style={{ background: text.trim() ? "#F5A623" : "#1C1C1E", color: text.trim() ? "#0A0F1C" : "rgba(220,230,240,0.2)", border: "none", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() ? "pointer" : "default", transition: "0.2s" }}><Send size={20} /></button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: 0.2 }}>
            <MessageSquare size={48} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>{t.chagua_chat}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────

// ── RICH TEXT PARSER — #tags, @mentions, URLs ────────────────────────────────
function parsePostContent(text, onHashtag, onMention) {
  if (!text) return null;
  // Split by tokens: #tag, @mention, https://url
  const parts = text.split(/(#[\w\u0080-\uFFFF]+|@[\w.]+|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (/^#[\w\u0080-\uFFFF]+/.test(part)) {
      return (
        <span
          key={i}
          onClick={(e) => { e.stopPropagation(); onHashtag?.(part.slice(1)); }}
          style={{ color: "#F5A623", fontWeight: 700, cursor: "pointer" }}
          className="rich-token"
        >{part}</span>
      );
    }
    if (/^@[\w.]+/.test(part)) {
      return (
        <span
          key={i}
          onClick={(e) => { e.stopPropagation(); onMention?.(part.slice(1)); }}
          style={{ color: "#4ECDC4", fontWeight: 700, cursor: "pointer" }}
          className="rich-token"
        >{part}</span>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: "#60A5FA", textDecoration: "underline", textDecorationStyle: "dotted", wordBreak: "break-all" }}
        >{part}</a>
      );
    }
    return part;
  });
}

// News link card shown below post content when post has source_url
function NewsLinkCard({ url, title }) {
  if (!url) return null;
  let hostname = "";
  try { hostname = new URL(url).hostname.replace("www.", ""); } catch { return null; }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(96,165,250,0.06)",
        border: "1px solid rgba(96,165,250,0.15)",
        borderRadius: 10, padding: "10px 14px",
        textDecoration: "none", marginBottom: 14,
        transition: "border-color 0.2s",
      }}
      className="news-link-card"
    >
      <div style={{ fontSize: 20, flexShrink: 0 }}>🔗</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#DCE6F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title || url}</div>
        <div style={{ fontSize: 10, color: "rgba(96,165,250,0.7)", marginTop: 2, fontFamily: "'Roboto Mono',monospace" }}>{hostname}</div>
      </div>
      <div style={{ marginLeft: "auto", flexShrink: 0, fontSize: 11, color: "rgba(96,165,250,0.6)" }}>↗</div>
    </a>
  );
}

function ImageLightbox({ src, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "zoom-out", padding: 20,
      }}
    >
      <button onClick={onClose} style={{
        position: "absolute", top: 18, right: 22,
        background: "rgba(255,255,255,0.08)", border: "none",
        color: "#DCE6F0", width: 38, height: 38, borderRadius: "50%",
        cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10000,
      }}>✕</button>
      <img
        src={src}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "92vw", maxHeight: "90vh",
          borderRadius: 14, objectFit: "contain",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          cursor: "default",
        }}
      />
    </div>
  );
}

function PostCard({ post, onLike, onBookmark, onReport, me, t, onHashtag, onMention, onAuthorClick }) {
  const [showComments,    setShowComments]    = useState(false);
  const [newComment,      setNewComment]      = useState("");
  const [comments,        setComments]        = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [imgLoaded,       setImgLoaded]       = useState(false);
  const [imgError,        setImgError]        = useState(false);
  const [lightbox,        setLightbox]        = useState(false);
  const [showMenu,        setShowMenu]        = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ts = TAG_COLORS[post.category] || TAG_COLORS.swali;

  const fetchComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    setLoadingComments(true);
    try {
      const res = await axios.get(`${API_URL}/posts/${post.id}/comments`);
      setComments(res.data);
    } catch { }
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/posts/${post.id}/comments`, { text: newComment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments([...comments, { ...res.data, author_name: me.name, author_handle: me.handle, avatar_url: me.avatar_url }]);
      setNewComment("");
    } catch { alert("Ingia kwanza ili kutoa maoni."); }
  };

  const hasImage = !!post.image_url && !imgError;
  const hasText  = !!post.content?.trim();

  return (
    <>
      {lightbox && <ImageLightbox src={post.image_url} onClose={() => setLightbox(false)} />}

      <div className="post-card" style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, marginBottom: 12,
        overflow: "hidden",
        transition: "border-color 0.2s",
        position: "relative"
      }}>
        {/* ── Card body — padding top ── */}
        <div style={{ padding: "18px 20px 14px" }}>

          {/* Author row */}
          <div style={{ display: "flex", gap: 12, marginBottom: hasText ? 12 : 8, alignItems: "flex-start" }}>
            <div 
              onClick={() => onAuthorClick?.({ id: post.user_id, name: post.author_name, handle: post.author_handle, avatar_url: post.author_avatar, role: post.author_role, is_verified: post.author_verified })}
              style={{ display: "flex", gap: 12, cursor: "pointer", flex: 1, minWidth: 0 }}
            >
              {post.author_avatar ? (
                <img 
                  src={post.author_avatar} 
                  alt={post.author_name} 
                  style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} 
                />
              ) : (
                <Av
                  initials={post.author_name ? post.author_name.split(" ").map(w => w[0]).join("") : "??"}
                  userId={post.user_id || post.author_handle}
                  size={40}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{post.author_name}</span>
                  {post.author_verified && <VerifiedBadge size={14} />}
                  <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.3)" }}>@{post.author_handle}</span>
                  <Pill label={t[post.category] || post.category} bg={ts.bg} color={ts.color} />
                </div>
                <div style={{ fontSize: 11, color: "rgba(220,230,240,0.35)", marginTop: 2, fontFamily: "'Roboto Mono',monospace" }}>
                  {post.author_role || "Mwanachama"} · {timeAgo(post.created_at)}
                </div>
              </div>
            </div>

            {/* 3 DOTS MENU */}
            <div style={{ position: "relative" }} ref={menuRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                style={{ background: "none", border: "none", color: "rgba(220,230,240,0.3)", cursor: "pointer", padding: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <MoreHorizontal size={20} />
              </button>

              {showMenu && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "#161B2C", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 6, zIndex: 100, width: 160, boxShadow: "0 10px 25px rgba(0,0,0,0.4)" }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`); alert("Link imenakiliwa!"); }}
                    style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: "#DCE6F0", padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Link2 size={14} /> Nakili Link
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onReport(post.id); }}
                    style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: "#F87171", padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Flag size={14} /> Ripoti Post
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Caption / text content */}
          {hasText && (
            <p style={{
              fontSize: 14, lineHeight: 1.75,
              color: "rgba(220,230,240,0.88)",
              marginBottom: hasImage ? 14 : 4,
              paddingLeft: 52,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {parsePostContent(post.content,
                (tag)    => onHashtag?.(tag),
                (handle) => onMention?.(handle),
              )}
            </p>
          )}

          {/* News source link — sits between caption and image */}
          {post.source_url && (
            <div style={{ paddingLeft: 52, marginBottom: hasImage ? 14 : 0 }}>
              <NewsLinkCard url={post.source_url} title={post.source_title} />
            </div>
          )}
        </div>

        {/* ── Image — full-bleed below caption ── */}
        {hasImage && (
          <div
            onClick={() => setLightbox(true)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              cursor: "zoom-in",
              position: "relative",
              overflow: "hidden",
              minHeight: imgLoaded ? 0 : 220,
            }}
          >
            {!imgLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }} />
            )}
            <img
              src={post.image_url}
              alt=""
              onLoad={()  => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{
                width: "100%",
                maxHeight: 480,
                objectFit: "cover",
                display: "block",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            />
            <div style={{
              position: "absolute", bottom: 10, right: 10,
              background: "rgba(0,0,0,0.55)", borderRadius: 6,
              padding: "3px 8px", fontSize: 10,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "'Roboto Mono',monospace",
              opacity: 0, transition: "opacity 0.2s",
            }} className="img-zoom-hint">🔍 Panua</div>
          </div>
        )}

        {/* ── Actions + comments ── */}
        <div style={{ padding: "10px 20px 16px" }}>
          <div style={{ display: "flex", gap: 4, paddingLeft: 52 }}>
            <button onClick={() => onLike(post.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: post.user_liked ? "rgba(245,166,35,0.12)" : "transparent", border: "none", color: post.user_liked ? "#F5A623" : "rgba(220,230,240,0.4)", padding: "7px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <Heart size={16} fill={post.user_liked ? "#F5A623" : "none"} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{post.like_count}</span>
            </button>
            <button onClick={fetchComments} style={{ display: "flex", alignItems: "center", gap: 5, background: showComments ? "rgba(78,205,196,0.12)" : "transparent", border: "none", color: showComments ? "#4ECDC4" : "rgba(220,230,240,0.4)", padding: "7px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <MessageSquare size={16} fill={showComments ? "#4ECDC4" : "none"} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{post.comment_count}</span>
            </button>
            <button onClick={() => onBookmark(post.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: post.user_bookmarked ? "rgba(167,139,250,0.12)" : "transparent", border: "none", color: post.user_bookmarked ? "#A78BFA" : "rgba(220,230,240,0.4)", padding: "7px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <Bookmark size={16} fill={post.user_bookmarked ? "#A78BFA" : "none"} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{post.bookmark_count}</span>
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
              {loadingComments && (
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.05)", animation: "shimmer 1.4s infinite" }} />
                  <div style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "shimmer 1.4s infinite" }} />
                </div>
              )}
              {comments.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <Av initials={c.author_name ? c.author_name.split(" ").map(w => w[0]).join("") : "?"} userId={c.user_id || c.author_handle} size={28} src={c.avatar_url} />
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "9px 13px", flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: "#A78BFA" }}>{c.author_name}</span>
                    <p style={{ fontSize: 13, color: "rgba(220,230,240,0.7)", marginTop: 3, lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                  placeholder={t.andika_jibu}
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 13px", color: "#DCE6F0", outline: "none", fontSize: 13 }}
                />
                <button onClick={handleAddComment} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}
        </div>{/* end actions+comments wrapper */}
      </div>{/* end post-card */}
    </>
  );
}

// ─── MAIN COMMUNITY ──────────────────────────────────────────────────────────

export default function JamiiAICommunity({ user, setUser, onLogout, lang = 'sw', toggleLang, socket, onSearch }) {
  const t = translations[lang];
// ... (rest of the component)
  const ME = { 
    id: user?.id,
    name: user?.name || "Mgeni", 
    handle: user?.handle || "mgeni", 
    avatar: user?.name ? user.name.split(" ").map(w => w[0]).join("") : "??", 
    avatar_url: user?.avatar_url,
    color: "#F5A623", 
    role: user?.role || "AI Enthusiast"
  };

  const [activeNav, setActiveNav]         = useState("nyumbani");
  const [activeFilter, setActiveFilter]   = useState("all");
  const [startupFilter, setStartupFilter] = useState("Zote");
  const [instFilter, setInstFilter]       = useState("Zote");
  const [resFilter, setResFilter]         = useState("Zote");
  const [showResForm, setShowResForm]     = useState(false);
  const [resSubmitted, setResSubmitted]   = useState(false);
  const [resForm, setResForm]             = useState({ title: "", type: "Dataset", link: "", tags: "", desc: "" });

  const [jobs, setJobs]                   = useState([]);
  const [selectedJob, setSelectedJob]     = useState(null);
  const [jobSearch, setJobSearch]         = useState("");
  const [jobType, setJobType]             = useState("all");
  const [jobLoc, setJobLoc]               = useState("all");
  const [showJobForm, setShowJobForm]     = useState(false);
  const [jobForm, setJobForm]             = useState({ title: "", company: "", type: "full_time", location: "", desc: "", requirements: "", salary: "" });

  const handleJobSubmit = () => {
    if (!jobForm.title.trim() || !jobForm.company.trim()) return;
    const newJob = {
      id: Date.now().toString(),
      title: jobForm.title,
      company_name: jobForm.company,
      type: jobForm.type,
      location: jobForm.location || "Remote",
      is_remote: !jobForm.location,
      description: jobForm.desc,
      requirements: jobForm.requirements,
      salary_visible: !!jobForm.salary,
      salary_min: jobForm.salary ? parseInt(jobForm.salary) : 0,
      salary_currency: "TZS",
      tags: ["AI", "New"],
      views: 0,
      applications_count: 0,
      deadline: "2026-12-31",
      created_at: new Date().toISOString(),
      is_saved: false,
      has_applied: false
    };
    setJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setJobForm({ title: "", company: "", type: "full_time", location: "", desc: "", requirements: "", salary: "" });
    notify("✓ Kazi imechapishwa!");
  };

  const handleResSubmit = () => {
    if (!resForm.title.trim() || !resForm.link.trim()) return;

    const newRes = {
      id: Date.now(),
      title: resForm.title,
      type: resForm.type,
      author_name: user?.name || "Mwanachama",
      link: resForm.link,
      tags: resForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      description: resForm.desc,
      stars: 0,
      downloads: 0,
      status: "pending"
    };

    setDataList([newRes, ...dataList]);
    setResForm({ title: "", type: "Dataset", link: "", tags: "", desc: "" });
    setShowResForm(false);
    setResSubmitted(true);
    setTimeout(() => setResSubmitted(false), 4000);
    notify("✓ Resource imewasilishwa kwa ajili ya mapitio!");
  };

  const [searchQuery, setSearchQuery]     = useState("");
  const [expertSearch, setExpertSearch]   = useState("");
  const [expertRole, setExpertRole]       = useState("Zote");
  const [expertPage, setExpertPage]       = useState(1);
  const itemsPerPage = 6;
  const [posts, setPosts]                 = useState([]);
  const [dataList, setDataList]           = useState([]);
  const [sidebarData, setSidebarData]     = useState({ trending: [], upcoming_events: [], new_sections: [], online_count: 0 });
  const [loading, setLoading]             = useState(false);
  const [composerText, setComposerText]   = useState("");
  const [composerCat, setComposerCat]     = useState("swali");
  const [composerImage, setComposerImage] = useState(null);   // uploaded image URL
  const [showOptions, setShowOptions]     = useState(false);
  const [notification, setNotification]   = useState(null);
  const [isPosting, setIsPosting]         = useState(false);

  const notify = msg => { setNotification(msg); setTimeout(() => setNotification(null), 2500); };

  // ── REAL-TIME POST UPDATES ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    console.log("🔌 Socket connected in JamiiAICommunity");
    
    const onNewPost = (post) => {
      console.log("📥 New post received via socket:", post);
      
      setPosts(prev => {
        // Avoid duplicates (e.g. if the creator also receives the socket event)
        if (prev.some(p => p.id === post.id)) {
          console.log("⏭️ Post already exists, skipping duplicate.");
          return prev;
        }
        console.log("✨ Adding new post to state");
        return [post, ...prev];
      });
    };

    socket.on("new_post", onNewPost);
    return () => {
      console.log("🔌 Cleaning up socket listeners");
      socket.off("new_post", onNewPost);
    };
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const sRes = await axios.get(`${API_URL}/sidebar`);
      setSidebarData(sRes.data);

      if (activeNav === "ujumbe" || activeNav === "profile") {
        setLoading(false); return;
      }
      
      if (activeNav === "nyumbani" || activeNav === "gundua") {
        const res = await axios.get(`${API_URL}/posts?category=${activeFilter}`, { headers });
        setPosts(res.data.posts);
      } else {
        const endpointMap = { startups: "startups", rasilimali: "resources", changamoto: "challenges", habari: "news", wataalamu: "users", vyuo: "institutions", matukio: "events" };
        if (activeNav === "kazi") {
          const res = await axios.get(`${API_URL}/jobs`);
          setJobs(res.data?.jobs || res.data || []);
        } else {
          const res = await axios.get(`${API_URL}/${endpointMap[activeNav]}`);
          setDataList(activeNav === 'wataalamu' ? res.data.users : res.data);
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeNav, activeFilter]);

  const handleLike = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/posts/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(ps => ps.map(p => p.id === id ? { ...p, user_liked: res.data.liked, like_count: res.data.liked ? parseInt(p.like_count) + 1 : parseInt(p.like_count) - 1 } : p));
    } catch { notify("Ingia kwanza!"); }
  };

  const handleBookmark = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/posts/${id}/bookmark`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(ps => ps.map(p => p.id === id ? { ...p, user_bookmarked: res.data.bookmarked, bookmark_count: res.data.bookmarked ? parseInt(p.bookmark_count) + 1 : parseInt(p.bookmark_count) - 1 } : p));
      notify(res.data.bookmarked ? "◆ Umehifadhi!" : "◇ Ondoa hifadhi");
    } catch { notify("Ingia kwanza!"); }
  };

  const handlePost = async () => {
    if (!composerText.trim() && !composerImage) return;
    setIsPosting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/posts`,
        { content: composerText, category: composerCat, image_url: composerImage || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([res.data, ...posts]);
      setComposerText(""); setComposerImage(null); setShowOptions(false);
      notify("✓ Imetumwa!");
    } catch { notify("Hitilafu imetokea."); }
    setIsPosting(false);
  };

  const handleReport = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { notify("Ingia kwanza ili kuripoti."); return; }
      
      const confirmReport = window.confirm("Je, una uhakika unataka kuripoti post hii kwa kukiuka kanuni za jamii?");
      if (!confirmReport) return;

      await axios.post(`${API_URL}/posts/${id}/report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      notify("🚩 Post imeripotiwa kwa usimamizi.");
    } catch (err) {
      notify("Hitilafu imetokea wakati wa kuripoti.");
    }
  };

  const localizedNav = NAV_ITEMS.map(item => ({ ...item, label: t[item.id] || item.label }));
  const localizedFilters = FILTER_TABS.map(tab => ({ ...tab, label: t[tab.id] || (tab.id === 'habari' ? t.habari_filter : tab.label) }));

  const [selectedExpert, setSelectedExpert] = useState(null);

  return (
    <div style={{ fontFamily: "'Roboto Mono',monospace", background: "#0A0F1C", color: "#DCE6F0", minHeight: "100vh", display: "flex", justifyContent: "center", overflow: "hidden" }}>
      {selectedExpert && <ExpertDetailModal
        dev={selectedExpert}
        onClose={() => setSelectedExpert(null)}
        t={t}
        me={ME}
        onFollow={(id) => handleLike && axios.post(`${API_URL}/users/${id}/follow`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(() => notify("✓ Umemfuata!")).catch(() => {})}
        onMessage={(dev) => { setActiveNav("ujumbe"); }}
      />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#0A0F1C} ::-webkit-scrollbar-thumb{background:#F5A623;border-radius:2px}
        .nav-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:9px;cursor:pointer;transition:all 0.18s}
        .nav-item:hover{background:rgba(255,255,255,0.04)}
        .nav-item.active{background:rgba(245,166,35,0.1);color:#F5A623}
        .ftab{padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s;border:1px solid transparent}
        .ftab.active{background:rgba(245,166,35,0.1);color:#F5A623;border-color:rgba(245,166,35,0.2)}
        .search-input:focus{background:rgba(255,255,255,0.07) !important; border-color:rgba(245,166,35,0.3) !important; box-shadow: 0 0 15px rgba(245,166,35,0.05)}
        .responsive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        .rich-token:hover{opacity:0.75}
        .news-link-card:hover{border-color:rgba(96,165,250,0.35) !important}
        @keyframes notif{0%{opacity:0;transform:translateX(20px)}15%{opacity:1;transform:translateX(0)}85%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(20px)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .post-card:hover .img-zoom-hint{opacity:1 !important}
        .post-card:hover{border-color:rgba(255,255,255,0.12) !important}
        @media (max-width: 1100px) { 
          .right-sidebar { display: none !important; }
          .main-container { max-width: 100% !important; }
        }
        @media (max-width: 768px) {
          .responsive-grid { grid-template-columns: 1fr; }
          aside:first-of-type { width: 70px !important; padding: 16px 8px !important; }
          aside:first-of-type span:last-of-type { display: none; }
          .search-input { width: 140px !important; }
        }
      `}</style>

      <div style={{ display: "flex", width: "100%", maxWidth: "1600px", position: "relative", height: "100vh" }}>
        {notification && <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999, background: "#F5A623", color: "#0A0F1C", padding: "11px 18px", borderRadius: 9, fontWeight: 700, animation: "notif 2.5s ease forwards" }}>{notification}</div>}

        {/* SIDEBAR LEFT — FIXED */}
        <aside style={{ width: 240, flexShrink: 0, height: "100vh", position: "sticky", top: 0, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, background: "#0A0F1C", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingLeft: 6, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: "#F5A623", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🌍</div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>JamiiAI</span>
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
            {localizedNav.map(item => (
              <div key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)}>
                <span style={{ opacity: 0.5, fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: activeNav === item.id ? 800 : 600 }}>{item.label}</span>
              </div>
            ))}
          </div>
          
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, marginTop: "auto", flexShrink: 0 }}>
            <div onClick={toggleLang} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: "pointer", color: "#F5A623", fontWeight: 700, fontFamily: "'Roboto Mono',monospace", padding: "4px 8px" }}><Languages size={14} /> {t.badili_lugha}</div>
            <div onClick={onLogout} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: "pointer", opacity: 0.4, padding: "4px 8px" }}><LogOut size={14} /> {t.toka}</div>
            
            <div 
              style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", background: activeNav === 'profile' ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 12, border: `1px solid ${activeNav === 'profile' ? "rgba(245,166,35,0.2)" : "transparent"}`, transition: "all 0.2s" }} 
              onClick={() => setActiveNav("profile")}
            >
              <Av initials={ME.avatar} size={30} userId={ME.id} src={user?.avatar_url} color={activeNav === 'profile' ? "#F5A623" : undefined} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: activeNav === 'profile' ? "#F5A623" : "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ME.name}</div>
                <div style={{ fontSize: 9, opacity: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{ME.handle}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN — SCROLLABLE */}
        <main style={{ flex: 1, minWidth: 0, borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", height: "100vh", scrollBehavior: "smooth" }}>
          <div style={{ position: "sticky", top: 0, background: "rgba(10,15,28,0.93)", backdropFilter: "blur(20px)", padding: "12px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontWeight: 800, fontSize: 18, whiteSpace: "nowrap" }}>{t['kichwa_' + activeNav] || PAGE_TITLE[activeNav]}</h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <NotificationBell socket={socket} />
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
              <div onClick={() => setActiveNav("profile")} style={{ cursor: "pointer" }}>
                <Av initials={ME.avatar} size={32} userId={ME.id} src={user?.avatar_url} />
              </div>
            </div>
          </div>
          <div style={{ padding: "18px 22px", maxWidth: (activeNav === "ujumbe" || activeNav === "profile" || activeNav === "wataalamu" || activeNav === "startups") ? "1100px" : "800px", margin: "0 auto" }}>
            
            {activeNav === "profile" && (
              <ProfilePage 
                user={user} 
                lang={lang} 
                onLogout={onLogout} 
                onUpdateUser={(updated) => setUser(updated)}
              />
            )}

            {(activeNav === "nyumbani" || activeNav === "gundua") && (
              <div>
                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18, marginBottom: 16 }}>
                  <textarea
                    value={composerText}
                    onChange={e => { setComposerText(e.target.value); setShowOptions(true); }}
                    placeholder={t.shiriki_kitu}
                    style={{ width: "100%", background: "transparent", border: "none", color: "#DCE6F0", fontSize: 14, outline: "none", resize: "none" }}
                    rows={3}
                  />

                  {/* Image preview */}
                  {composerImage && (
                    <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                      <img
                        src={composerImage}
                        alt="preview"
                        style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", display: "block" }}
                      />
                      <button
                        onClick={() => setComposerImage(null)}
                        style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "rgba(248,113,113,0.85)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >×</button>
                    </div>
                  )}

                  {/* Image upload row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <label style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(220,230,240,0.55)", fontSize: 11, fontWeight: 700,
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.3)"; e.currentTarget.style.color = "#F5A623"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(220,230,240,0.55)"; }}
                    >
                      🖼️ Picha
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { notify("❌ Picha kubwa sana (max 5MB)"); return; }
                          // Local preview immediately
                          const localUrl = URL.createObjectURL(file);
                          setComposerImage(localUrl);
                          setShowOptions(true);
                          // Upload to Cloudinary
                          try {
                            const token = localStorage.getItem("token");
                            const fd = new FormData();
                            fd.append("image", file);
                            const res = await axios.post(`${API_URL}/upload/post-image`, fd, {
                              headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
                            });
                            setComposerImage(res.data.imageUrl || res.data.url || localUrl);
                          } catch { /* keep local preview, post will fail gracefully */ }
                          e.target.value = "";
                        }}
                      />
                    </label>

                    {/* char count */}
                    {composerText.length > 0 && (
                      <span style={{ fontSize: 10, color: composerText.length > 500 ? "#F87171" : "rgba(220,230,240,0.25)", marginLeft: "auto" }}>
                        {composerText.length}/500
                      </span>
                    )}
                  </div>

                  {showOptions && (
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {Object.entries({ swali: t.swali, mradi: t.mradi, habari: t.habari_filter, kazi: t.kazi }).map(([k, v]) => (
                          <button key={k} onClick={() => setComposerCat(k)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, border: `1px solid ${composerCat === k ? TAG_COLORS[k].color : "rgba(255,255,255,0.1)"}`, background: composerCat === k ? TAG_COLORS[k].bg : "transparent", color: composerCat === k ? TAG_COLORS[k].color : "#FFF", cursor: "pointer" }}>{v}</button>
                        ))}
                      </div>
                      <button
                        onClick={handlePost}
                        disabled={isPosting || (!composerText.trim() && !composerImage)}
                        style={{
                          background: (!composerText.trim() && !composerImage) ? "rgba(245,166,35,0.3)" : "#F5A623",
                          color: "#0A0F1C", border: "none", padding: "8px 20px", borderRadius: 8,
                          fontWeight: 700, cursor: (!composerText.trim() && !composerImage) ? "default" : "pointer",
                          fontFamily: "'Roboto Mono',monospace", fontSize: 12,
                        }}
                      >{isPosting ? t.inatuma : t.chapisha}</button>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {localizedFilters.map(tab => <span key={tab.id} className={`ftab ${activeFilter === tab.id ? "active" : ""}`} onClick={() => setActiveFilter(tab.id)}>{tab.label}</span>)}
                </div>
                {loading ? <div style={{ opacity: 0.4 }}>{t.inapakia}</div> : posts.map(p => <PostCard
                  key={p.id} post={p}
                  onLike={handleLike} onBookmark={handleBookmark} 
                  onReport={() => setReportingPostId(p.id)}
                  me={ME} t={t}
                  onHashtag={(tag) => { setActiveFilter("zote"); setComposerText(`#${tag} `); notify(`#${tag}`); }}
                  onMention={(handle) => { notify(`@${handle}`); }}
                  onAuthorClick={(author) => setSelectedExpert(author)}
                />)}
              </div>
            )}

            {activeNav === "wataalamu" && (
              <div className="fin">
                <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
                    <input 
                      placeholder={t.tafuta_mtaalamu || "Tafuta kwa jina au ujuzi..."}
                      value={expertSearch}
                      onChange={(e) => { setExpertSearch(e.target.value); setExpertPage(1); }}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px 10px 36px", color: "#FFF", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <select 
                    value={expertRole} 
                    onChange={(e) => { setExpertRole(e.target.value); setExpertPage(1); }}
                    style={{ background: "#0A0F1C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#DCE6F0", fontSize: 13, outline: "none", cursor: "pointer" }}
                  >
                    {["Zote", "ML Engineer", "Data Scientist", "AI Architect", "AI Developer", "AI Researcher", "MLOps Engineer", "AI Enthusiast", "Student"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="responsive-grid">
                  {loading ? t.inapakia : (() => {
                    const fullList = dataList;
                    
                    const filtered = fullList.filter(dev => {
                      const searchStr = expertSearch.toLowerCase();
                      const matchesSearch = (dev.name || "").toLowerCase().includes(searchStr) || 
                                          (dev.bio || "").toLowerCase().includes(searchStr) ||
                                          (dev.city || "").toLowerCase().includes(searchStr) ||
                                          (Array.isArray(dev.skills) ? dev.skills : []).some(s => s.toLowerCase().includes(searchStr));
                      const matchesRole = expertRole === "Zote" || dev.role === expertRole;
                      return matchesSearch && matchesRole;
                    });
                    
                    const startIndex = (expertPage - 1) * itemsPerPage;
                    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
                    const totalPages = Math.ceil(filtered.length / itemsPerPage);

                    if (filtered.length === 0) return <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, opacity: 0.4 }}>Hakuna mtaalamu aliyepatikana</div>;

                    return (
                      <>
                        {paginated.map(dev => <ExpertCard key={dev.id} dev={dev} onClick={setSelectedExpert} t={t} />)}
                        
                        {totalPages > 1 && (
                          <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "center", gap: 10, marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <button 
                              disabled={expertPage === 1} 
                              onClick={() => setExpertPage(p => p - 1)}
                              style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "none", color: "#FFF", cursor: expertPage === 1 ? "default" : "pointer", opacity: expertPage === 1 ? 0.2 : 1 }}
                            >
                              ← {t.nyuma || "Nyuma"}
                            </button>
                            <span style={{ display: "flex", alignItems: "center", fontSize: 13, opacity: 0.5 }}>{expertPage} / {totalPages}</span>
                            <button 
                              disabled={expertPage === totalPages} 
                              onClick={() => setExpertPage(p => p + 1)}
                              style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "none", color: "#FFF", cursor: expertPage === totalPages ? "default" : "pointer", opacity: expertPage === totalPages ? 0.2 : 1 }}
                            >
                              {t.mbele || "Mbele"} →
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeNav === "startups" && (
              <div className="fin">
                <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>AI Startups <span style={{ color: "#F5A623" }}>Tanzania</span></h2>
                    <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14 }}>Makampuni yanayojenga mustakabali wa teknolojia Tanzania</p>
                  </div>
                  <div style={{ padding: "8px 16px", background: "rgba(245,166,35,0.1)", borderRadius: 12, border: "1px solid rgba(245,166,35,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 20 }}>🚀</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#F5A623" }}>{dataList.length} Active</div>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
                  {["Zote", "AgriTech", "HealthTech", "EdTech", "FinTech", "TravelTech", "Language Tech"].map(s => (
                    <button key={s} onClick={() => setStartupFilter(s)} style={{ padding: "6px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${startupFilter === s ? "#F5A623" : "rgba(255,255,255,0.08)"}`, background: startupFilter === s ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.02)", color: startupFilter === s ? "#F5A623" : "rgba(220,230,240,0.4)", fontFamily: "'Roboto Mono',monospace", transition: "all 0.2s", whiteSpace: "nowrap" }}>{s}</button>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {loading ? t.inapakia : dataList.filter(st => startupFilter === "Zote" || st.sector === startupFilter).map(st => <StartupCard key={st.id} st={st} t={t} />)}
                </div>
              </div>
            )}

            {activeNav === "vyuo" && (
              <div className="fin">
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Vyuo & <span style={{ color: "#60A5FA" }}>Taasisi</span></h2>
                  <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Taasisi za AI, utafiti na elimu Tanzania</p>
                </div>
                <div style={{ display: "flex", gap: 5, marginBottom: 20, flexWrap: "wrap" }}>
                  {["Zote", "University", "Research Institute", "Government Body", "NGO / Training"].map(t => (
                    <button key={t} onClick={() => setInstFilter(t)} style={{ padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${instFilter === t ? "#60A5FA" : "rgba(255,255,255,0.1)"}`, background: instFilter === t ? "rgba(96,165,250,0.12)" : "transparent", color: instFilter === t ? "#60A5FA" : "rgba(220,230,240,0.4)", fontFamily: "'Roboto Mono',monospace", transition: "all 0.2s" }}>{t}</button>
                  ))}
                </div>
                <div className="responsive-grid">
                  {loading ? t.inapakia : dataList.filter(ins => instFilter === "Zote" || ins.type === instFilter).map(ins => <InstitutionCard key={ins.id} ins={ins} t={t} />)}
                </div>
              </div>
            )}

            {activeNav === "changamoto" && (
              <div className="fin">
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Changamoto za <span style={{ color: "#F5A623" }}>AI Tanzania</span></h2>
                  <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Shindana, jenga solutions, pata zawadi</p>
                </div>
                {/* Stats */}
                <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.14)", borderRadius: 12, overflow: "hidden" }}>
                  {[["3", "Wazi"], ["208", "Washiriki"], ["TZS 20M+", "Prize Pool"], ["1", "Imekwisha"]].map(([num, label], i) => (
                    <div key={label} style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRight: i < 3 ? "1px solid rgba(245,166,35,0.1)" : "none" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#F5A623", fontFamily: "'Roboto Mono',monospace" }}>{num}</div>
                      <div style={{ fontSize: 10, color: "rgba(220,230,240,0.4)", marginTop: 2, fontFamily: "'Roboto Mono',monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gap: 16 }}>
                  {loading ? t.inapakia : dataList.map(ch => <ChallengeCard key={ch.id} ch={ch} t={t} />)}
                </div>
              </div>
            )}

            {activeNav === "rasilimali" && (
              <div className="fin">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Rasilimali za <span style={{ color: "#34D399" }}>AI Tanzania</span></h2>
                    <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Datasets, tutorials, guides — shiriki na jamii yako</p>
                  </div>
                  <button onClick={() => { setShowResForm(!showResForm); setResSubmitted(false); }} style={{ background: showResForm ? "rgba(255,255,255,0.06)" : "#34D399", color: showResForm ? "rgba(220,230,240,0.6)" : "#0A0F1C", border: "none", padding: "9px 18px", borderRadius: 9, cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 13, transition: "all 0.2s", flexShrink: 0 }}>
                    {showResForm ? "✕ Funga" : "+ Wasilisha Resource"}
                  </button>
                </div>

                {resSubmitted && (
                  <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center" }}>
                    <CheckCircle2 color="#34D399" size={20} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#34D399", marginBottom: 2 }}>Resource imewasilishwa!</div>
                      <div style={{ fontSize: 13, color: "rgba(220,230,240,0.55)" }}>Itapitiwa na admin na kuchapishwa hivi karibuni. Asante kwa mchango wako! 🙏</div>
                    </div>
                  </div>
                )}

                {showResForm && (
                  <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 16, padding: "20px 22px", marginBottom: 22 }}>
                    <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.38)", letterSpacing: "0.04em", marginBottom: 16 }}>WASILISHA RESOURCE MPYA</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.38)", display: "block", marginBottom: 6 }}>JINA LA RESOURCE *</label>
                        <input value={resForm.title} onChange={e => setResForm({...resForm, title: e.target.value})} placeholder="Swahili NLP Dataset..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 13px", color: "#F2F2F5", fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.38)", display: "block", marginBottom: 6 }}>AINA *</label>
                        <select value={resForm.type} onChange={e => setResForm({...resForm, type: e.target.value})} style={{ width: "100%", background: "#0A0F1C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 13px", color: "#F2F2F5", fontSize: 13, outline: "none", appearance: "none" }}>
                          {["Dataset", "Tutorial", "Guide", "Research Paper"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.38)", display: "block", marginBottom: 6 }}>LINK (GitHub, Drive, URL) *</label>
                      <input value={resForm.link} onChange={e => setResForm({...resForm, link: e.target.value})} placeholder="https://github.com/..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 13px", color: "#F2F2F5", fontSize: 13, outline: "none" }} />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.38)", display: "block", marginBottom: 6 }}>MAELEZO MAFUPI</label>
                      <textarea value={resForm.desc} onChange={e => setResForm({...resForm, desc: e.target.value})} rows={3} placeholder="Elezea resource hii — ni ya nini, inasaidia nani..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 13px", color: "#F2F2F5", fontSize: 13, outline: "none", resize: "vertical" }} />
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setShowResForm(false)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", color: "rgba(220,230,240,0.45)", border: "none", padding: "10px", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}>Ghairi</button>
                      <button onClick={handleResSubmit} disabled={!resForm.title.trim() || !resForm.link.trim()} style={{ flex: 3, background: (resForm.title.trim() && resForm.link.trim()) ? "#34D399" : "rgba(255,255,255,0.05)", color: (resForm.title.trim() && resForm.link.trim()) ? "#0A0F1C" : "rgba(220,230,240,0.2)", border: "none", padding: "10px", borderRadius: 9, cursor: "pointer", fontWeight: 800 }}>Wasilisha kwa Review →</button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 5, marginBottom: 20, flexWrap: "wrap" }}>
                  {["Zote", "Dataset", "Tutorial", "Guide", "Research Paper"].map(t => (
                    <button key={t} onClick={() => setResFilter(t)} style={{ padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${resFilter === t ? "#34D399" : "rgba(255,255,255,0.1)"}`, background: resFilter === t ? "rgba(52,211,153,0.12)" : "transparent", color: resFilter === t ? "#34D399" : "rgba(220,230,240,0.4)", fontFamily: "'Roboto Mono',monospace", transition: "all 0.2s" }}>{t}</button>
                  ))}
                </div>
                <div className="responsive-grid">
                  {loading ? t.inapakia : dataList.filter(r => resFilter === "Zote" || r.type === resFilter).map(r => {
                    const typeColor = { Dataset: "#4ECDC4", Tutorial: "#F5A623", Guide: "#34D399", "Research Paper": "#A78BFA" };
                    const tc = typeColor[r.type] || "#F5A623";
                    const tags = Array.isArray(r.tags) ? r.tags : (typeof r.tags === 'string' ? JSON.parse(r.tags || "[]") : []);
                    const isPending = r.status === "pending";
                    return (
                      <div key={r.id} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isPending ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", cursor: "pointer", transition: "all 0.2s", opacity: isPending ? 0.8 : 1 }} className="post-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Pill label={r.type} bg={`${tc}18`} color={tc} />
                            {isPending && <Pill label="⏳ INASUBIRI" bg="rgba(245,166,35,0.1)" color="#F5A623" />}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {!isPending && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623" }}>⭐ {r.stars}</span>}
                            {!isPending && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>↓ {r.downloads?.toLocaleString()}</span>}
                          </div>
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em", marginBottom: 5, lineHeight: 1.3, flex: 1 }}>{r.title}</h3>
                        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)", marginBottom: 8 }}>by {r.author_name || 'JamiiAI Team'}</div>
                        <p style={{ fontSize: 12, color: "rgba(220,230,240,0.52)", lineHeight: 1.6, marginBottom: 12, height: 38, overflow: "hidden" }}>{r.description}</p>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                          {tags.slice(0, 3).map(t => <SkillTag key={t} label={t} />)}
                        </div>
                        {isPending ? (
                          <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "rgba(245,166,35,0.6)", textAlign: "center", fontWeight: 700 }}>MAPITIO YA ADMIN...</div>
                        ) : (
                          <button style={{ background: tc, color: "#0A0F1C", border: "none", padding: "8px", borderRadius: 8, cursor: "pointer", fontFamily: "'Roboto Mono',sans-serif", fontWeight: 800, fontSize: 12, marginTop: "auto" }}>Pakua / Angalia →</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeNav === "habari" && (
              <div className="fin">
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Habari za AI <span style={{ color: "#A78BFA" }}>Tanzania & Dunia</span></h2>
                  <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Uwe wa kwanza kujua kinachoendelea</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loading ? t.inapakia : dataList.map(item => {
                    const catColors = { 
                      Tanzania: { bg: "rgba(245,166,35,0.12)", color: "#F5A623" }, 
                      Global: { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" }, 
                      Jamii: { bg: "rgba(78,205,196,0.12)", color: "#4ECDC4" } 
                    };
                    const cc = catColors[item.category] || { bg: "rgba(255,255,255,0.06)", color: "#FFF" };
                    const itemColor = item.color || cc.color;

                    return (
                      <div key={item.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center", transition: "all 0.2s" }} className="post-card">
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, flexWrap: "wrap" }}>
                            <Pill label={item.category} bg={cc.bg} color={cc.color} />
                            {item.is_hot && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F87171", fontWeight: 700 }}>🔥 HOT</span>}
                            <span style={{ marginLeft: "auto", fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.28)" }}>{new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <h3 style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", marginBottom: 6, lineHeight: 1.3 }}>{item.title}</h3>
                          <p style={{ color: "rgba(220,230,240,0.52)", fontSize: 13, lineHeight: 1.6 }}>{item.summary}</p>
                          <div style={{ marginTop: 8, fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.25)" }}>{item.reads?.toLocaleString() || 0} wasomaji</div>
                        </div>
                        <div style={{ width: 4, height: 54, borderRadius: 2, background: itemColor, opacity: 0.55 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeNav === "matukio" && (
              <div className="fin">
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
                    Matukio <span style={{ color: "#F5A623" }}>ya AI</span>
                  </h2>
                  <p style={{ fontSize: 13, color: "rgba(242,242,245,0.45)", fontWeight: 400 }}>Hackathons, webinars, meetups — karibu Tanzania na dunia</p>
                </div>

                {/* Stats bar */}
                <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                  {[[dataList.length.toString(), t.yanayokuja || "Yanayokuja"], ["1.16K", t.watashuhudia || "Watashuhudia"], ["3", t.wiki_hii || "Wiki hii"], ["2", "Online"]].map(([n, l], i) => (
                    <div key={l} style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#F5A623", fontFamily: "'Roboto Mono',monospace" }}>{n}</div>
                      <div style={{ fontSize: 10, color: "rgba(242,242,245,0.38)", marginTop: 2, fontFamily: "'Roboto Mono',monospace", textTransform: "uppercase" }}>{l}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loading ? t.inapakia : dataList.map(ev => {
                    const pct = Math.round(((ev.rsvp_count || 0) / (ev.max_rsvp || 100)) * 100);
                    return (
                      <div key={ev.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "all 0.2s" }} className="post-card">
                        <div style={{ display: "flex", gap: 14 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 12, background: `${ev.color || '#F5A623'}12`, border: `1px solid ${ev.color || '#F5A623'}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 14, color: ev.color || '#F5A623', fontWeight: 700 }}>{new Date(ev.date).getDate()}</span>
                            <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 8, color: ev.color || '#F5A623', fontWeight: 700, opacity: 0.6 }}>{new Date(ev.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                              <Pill label={ev.type} color={ev.color || '#F5A623'} />
                              <span style={{ marginLeft: "auto", fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(242,242,245,0.3)" }}>📍 {ev.location}</span>
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", marginBottom: 4 }}>{ev.name}</h3>
                            <p style={{ fontSize: 13, color: "rgba(220,230,240,0.58)", lineHeight: 1.6, marginBottom: 12 }}>{ev.description}</p>

                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: pct > 85 ? "#F87171" : (ev.color || "#F5A623"), borderRadius: 2, transition: "width 0.6s ease" }} />
                              </div>
                              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(242,242,245,0.35)", whiteSpace: "nowrap" }}>{ev.rsvp_count || 0}/{ev.max_rsvp || 100}</span>
                              <button
                                style={{ background: "#F5A623", color: "#0C0C0E", border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 12, transition: "all 0.2s", whiteSpace: "nowrap" }}>
                                {t.rsvp || "RSVP →"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeNav === "matukio" && (
              <div className="fin">
                {/* ... existing matukio code ... */}
              </div>
            )}

            {activeNav === "kazi" && (
              <div className="fin">
                {selectedJob && <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} onApply={(id) => setJobs(jobs.map(j => j.id === id ? {...j, has_applied: true} : j))} t={t} />}
                
                <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>{t.kazi_board} <span style={{ color: "#F5A623" }}>Tanzania 🇹🇿</span></h2>
                    <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14 }}>Nafasi zinazochipukia katika ulimwengu wa AI na Data</p>
                  </div>
                  <button 
                    onClick={() => setShowJobForm(!showJobForm)}
                    style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                  >
                    {showJobForm ? "✕ Funga" : `+ ${t.chapisha_kazi}`}
                  </button>
                </div>

                {showJobForm && (
                  <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(220,230,240,0.4)", letterSpacing: "0.1em", marginBottom: 20, textTransform: "uppercase" }}>CHAPISHA NAFASI MPYA YA KAZI</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", display: "block", marginBottom: 8 }}>JINA LA NAFASI *</label>
                        <input value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} placeholder="e.g. Senior ML Engineer" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", display: "block", marginBottom: 8 }}>KAMPUNI *</label>
                        <input value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} placeholder="e.g. JamiiAI Corp" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 13, outline: "none" }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", display: "block", marginBottom: 8 }}>AINA YA KAZI</label>
                        <select value={jobForm.type} onChange={e => setJobForm({...jobForm, type: e.target.value})} style={{ width: "100%", background: "#0A0F1C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 13, outline: "none" }}>
                          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", display: "block", marginBottom: 8 }}>MAHALI (Wacha wazi kama ni Remote)</label>
                        <input value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} placeholder="e.g. Dar es Salaam" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", display: "block", marginBottom: 8 }}>MSHAHARA (TZS)</label>
                        <input type="number" value={jobForm.salary} onChange={e => setJobForm({...jobForm, salary: e.target.value})} placeholder="e.g. 2000000" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 13, outline: "none" }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", display: "block", marginBottom: 8 }}>MAELEZO YA KAZI *</label>
                      <textarea value={jobForm.desc} onChange={e => setJobForm({...jobForm, desc: e.target.value})} rows={4} placeholder="Elezea majukumu ya kazi..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#FFF", fontSize: 13, outline: "none", resize: "none" }} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,230,240,0.4)", display: "block", marginBottom: 8 }}>MAHITAJI (Requirements)</label>
                      <textarea value={jobForm.requirements} onChange={e => setJobForm({...jobForm, requirements: e.target.value})} rows={3} placeholder="e.g. Miaka 3+ ya uzoefu, Python, SQL..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", color: "#FFF", fontSize: 13, outline: "none", resize: "none" }} />
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => setShowJobForm(false)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", padding: "12px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>Ghairi</button>
                      <button onClick={handleJobSubmit} disabled={!jobForm.title.trim() || !jobForm.company.trim()} style={{ flex: 2, background: "#F5A623", color: "#0A0F1C", border: "none", padding: "12px", borderRadius: 12, fontWeight: 800, cursor: "pointer", opacity: (!jobForm.title.trim() || !jobForm.company.trim()) ? 0.5 : 1 }}>Wasilisha Nafasi →</button>
                    </div>
                  </div>
                )}

                {/* Filter Bar */}
                <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
                    <input 
                      placeholder={t.tafuta_kazi}
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px 10px 36px", color: "#FFF", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <select 
                    value={jobType} 
                    onChange={(e) => setJobType(e.target.value)}
                    style={{ background: "#0A0F1C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#DCE6F0", fontSize: 13, outline: "none", cursor: "pointer" }}
                  >
                    <option value="all">{t.all} Types</option>
                    {Object.keys(TYPE_LABELS).map(k => <option key={k} value={k}>{TYPE_LABELS[k].label}</option>)}
                  </select>
                </div>

                {/* Featured Section */}
                {jobs.some(j => j.is_featured) && !jobSearch && jobType === "all" && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#F5A623", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>🔥 Featured Opportunities</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                      {jobs.filter(j => j.is_featured).map(job => (
                        <JobCard key={job.id} job={job} onClick={setSelectedJob} onSave={id => setJobs(jobs.map(j => j.id === id ? {...j, is_saved: !j.is_saved} : j))} t={t} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Jobs */}
                <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(220,230,240,0.3)", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>
                  {jobSearch || jobType !== "all" ? "Search Results" : "Recent Openings"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                  {jobs
                    .filter(j => {
                      const matchesSearch = j.title.toLowerCase().includes(jobSearch.toLowerCase()) || j.company_name.toLowerCase().includes(jobSearch.toLowerCase());
                      const matchesType = jobType === "all" || j.type === jobType;
                      return matchesSearch && matchesType;
                    })
                    .filter(j => !j.is_featured || jobSearch || jobType !== "all")
                    .map(job => (
                      <JobCard key={job.id} job={job} onClick={setSelectedJob} onSave={id => setJobs(jobs.map(j => j.id === id ? {...j, is_saved: !j.is_saved} : j))} t={t} />
                    ))
                  }
                </div>
              </div>
            )}

            {activeNav === "ujumbe" && <DirectMessages user={ME} socket={socket} t={t} />}
          </div>
        </main>

        {/* SIDEBAR RIGHT — FIXED */}
        {activeNav !== "ujumbe" && activeNav !== "profile" && (
          <aside className="right-sidebar" style={{ width: 310, flexShrink: 0, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18, height: "100vh", position: "sticky", top: 0, background: "#0A0F1C", overflow: "hidden" }}>
            
            {/* Search */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <SearchBar onNavigate={(v, p) => { if(v==='search') onSearch(p.q); else setActiveNav(v); }} />
            </div>

            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18, paddingRight: 4 }}>
              {/* Online */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 10px #34D399", position: "relative" }}>
                    <div style={{ position: "absolute", inset: -2, borderRadius: "50%", border: "2px solid #34D399", animation: "pulse 2s infinite" }} />
                  </div>
                  <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.05em", fontWeight: 700 }}>ONLINE — {sidebarData.online_count || 0}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(sidebarData.online_members || []).map(m => (
                    <div key={m.name} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                      <div style={{ position: "relative" }}>
                        <Av initials={m.avatar} userId={m.color || m.sender_id} size={28} />
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 7, height: 7, borderRadius: "50%", background: "#34D399", border: "1.5px solid #0A0F1C" }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(220,230,240,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                        <div style={{ fontSize: 9, opacity: 0.3, fontFamily: "'Roboto Mono',monospace" }}>{m.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.05em", marginBottom: 12, fontWeight: 700 }}>TRENDING SASA</div>
                {(sidebarData.trending || []).map((tag, i) => (
                  <div key={tag} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < (sidebarData.trending?.length || 0) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: i < 3 ? "#F5A623" : "rgba(220,230,240,0.65)" }}>{tag}</span>
                    <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.27)" }}>Hot 🔥</span>
                  </div>
                ))}
              </div>

              {/* Events */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.05em", marginBottom: 12, fontWeight: 700 }}>MATUKIO YANAYOKUJA</div>
                {(sidebarData.upcoming_events || []).map(ev => (
                  <div key={ev.id} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", alignItems: "center" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: `${ev.color || '#F5A623'}18`, border: `1px solid ${ev.color || '#F5A623'}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: ev.color || '#F5A623', fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>
                        {new Date(ev.date).getDate()}<br/>{new Date(ev.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.3, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</div>
                      <Pill label={ev.type} bg={`${ev.color || '#F5A623'}18`} color={ev.color || '#F5A623'} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick links to new sections */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", letterSpacing: "0.05em", marginBottom: 12, fontWeight: 700 }}>SECTIONS MPYA</div>
                {[
                  ["changamoto", "🏆", "#F5A623", t.changamoto, "4 open"],
                  ["rasilimali",  "📚", "#34D399", t.rasilimali,  "8 resources"],
                  ["startups",    "🚀", "#A78BFA", t.startups,    "6 startups"],
                  ["vyuo",        "🎓", "#60A5FA", t.vyuo,        "6 taasisi"],
                ].map(([id, icon, color, label, sub]) => (
                  <div key={id} onClick={() => setActiveNav(id)} style={{ display: "flex", gap: 9, alignItems: "center", padding: "8px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{label}</div>
                      <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>{sub}</div>
                    </div>
                    <span style={{ marginLeft: "auto", color: "rgba(220,230,240,0.22)", fontSize: 11 }}>→</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.18)", lineHeight: 1.9, paddingBottom: 8 }}>
                © 2025 JamiiAI · Made in Tanzania 🇹🇿<br />Privacy · Terms · {t.mawasiliano}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}