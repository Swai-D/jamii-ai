import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Heart, MessageSquare, Bookmark, Share2, Send, Languages, Star, Users, MapPin, Briefcase, ExternalLink, Zap, Github, Linkedin, Twitter, Mail, Phone, CheckCircle2, Trophy, Calendar, Globe, Clock, Search, ChevronRight, LogOut } from "lucide-react";
import { translations } from "../translations";
import ProfilePage from "./jamii-ai-profile";

const API_URL = "http://localhost:4000/api";

const TAG_COLORS = {
  swali:  { bg: "rgba(96,165,250,0.12)",  color: "#60A5FA" },
  mradi:  { bg: "rgba(52,211,153,0.12)",  color: "#34D399" },
  habari: { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
  kazi:   { bg: "rgba(245,166,35,0.12)",  color: "#F5A623" },
};

const NAV_ITEMS = [
  { id: "nyumbani",    icon: "⌂",  label: "Nyumbani",       badge: null },
  { id: "gundua",     icon: "◎",  label: "Gundua",         badge: null },
  { id: "wataalamu",  icon: "◈",  label: "Wataalamu",      badge: null },
  { id: "startups",   icon: "◉",  label: "Startups",       badge: null },
  { id: "vyuo",       icon: "◫",  label: "Vyuo & Taasisi", badge: null },
  { id: "changamoto", icon: "◆",  label: "Changamoto",     badge: "2"  },
  { id: "rasilimali", icon: "◧",  label: "Rasilimali",     badge: null },
  { id: "habari",     icon: "◉",  label: "Habari",         badge: null },
  { id: "matukio",    icon: "◷",  label: "Matukio",        badge: null },
  { id: "ujumbe",     icon: "◻",  label: "Ujumbe",         badge: null },
];

const FILTER_TABS = [
  { id: "all",    label: "Yote"    },
  { id: "swali",  label: "Maswali" },
  { id: "mradi",  label: "Miradi"  },
  { id: "habari", label: "Habari"  },
  { id: "kazi",   label: "Kazi"    },
];

const PAGE_TITLE = {
  nyumbani: "Nyumbani 🏠", gundua: "Gundua ◎", wataalamu: "Wataalamu ◈",
  startups: "Startups Tanzania", vyuo: "Vyuo & Taasisi",
  changamoto: "Changamoto ◆", rasilimali: "Rasilimali ◧",
  habari: "Habari za AI 📡", matukio: "Matukio ◷", ujumbe: "Ujumbe ◻",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function Av({ initials, color, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color || "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: size * 0.35, color: "#0A0F1C", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Pill({ label, bg, color }) {
  return <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>{label}</span>;
}

function SkillTag({ label }) {
  return <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "rgba(220,230,240,0.55)" }}>{label}</span>;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function ExpertDetailModal({ dev, onClose, t }) {
  if (!dev) return null;
  const skills = Array.isArray(dev.skills) ? dev.skills : JSON.parse(dev.skills || "[]");
  
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }} />
      <div className="fin" style={{ position: "relative", background: "#0D1322", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 28, width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", padding: 0, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ height: 120, background: `linear-gradient(135deg, ${dev.color || "#F5A623"}44 0%, #0D1322 100%)`, position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,0.3)", border: "none", color: "#FFF", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>×</button>
        </div>
        <div style={{ padding: "0 32px 32px", marginTop: -40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
            <div style={{ position: "relative" }}>
              <Av initials={dev.name ? dev.name.split(" ").map(w => w[0]).join("") : "??"} color={dev.color || "#4ECDC4"} size={100} />
              {dev.is_verified && (
                <div style={{ position: "absolute", bottom: 5, right: 5, background: "#0D1322", borderRadius: "50%", padding: 2 }}>
                  <CheckCircle2 size={24} color="#34D399" fill="#34D399" style={{ stroke: "#0D1322" }} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, paddingBottom: 10 }}>
              <a href={dev.github_url || "#"} style={{ color: "rgba(220,230,240,0.4)" }}><Github size={20} /></a>
              <a href={dev.linkedin_url || "#"} style={{ color: "rgba(220,230,240,0.4)" }}><Linkedin size={20} /></a>
              <a href={dev.website_url || "#"} style={{ color: "rgba(220,230,240,0.4)" }}><ExternalLink size={20} /></a>
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{dev.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ color: "#F5A623", fontFamily: "'Roboto Mono',monospace", fontSize: 15 }}>@{dev.handle}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 14, opacity: 0.6 }}>{dev.role}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <button style={{ flex: 1.5, background: "#F5A623", color: "#0A0F1C", border: "none", padding: "16px", borderRadius: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15 }}>
              <Briefcase size={20} /> {t.ajiri} {dev.name.split(" ")[0]}
            </button>
            <button style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)", padding: "16px", borderRadius: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15 }}>
              <MessageSquare size={20} /> {t.ujumbe}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertCard({ dev, onClick, t }) {
  const skills = Array.isArray(dev.skills) ? dev.skills : JSON.parse(dev.skills || "[]");
  return (
    <div onClick={() => onClick(dev)} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18, transition: "all 0.2s", cursor: "pointer" }} className="post-card">
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Av initials={dev.name ? dev.name.split(" ").map(w => w[0]).join("") : "??"} color="#4ECDC4" size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dev.name}</span>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: dev.available ? "#34D399" : "#444", marginLeft: "auto", flexShrink: 0 }} />
          </div>
          <div style={{ color: "rgba(220,230,240,0.4)", fontSize: 11, fontFamily: "'Roboto Mono',monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{dev.role} · {dev.city}</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "rgba(220,230,240,0.55)", lineHeight: 1.5, marginBottom: 10, height: 36, overflow: "hidden" }}>{dev.bio}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {skills.slice(0, 3).map(s => <SkillTag key={s} label={s} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F5A623" }}>⭐ {dev.rating}</span>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#4ECDC4" }}>{dev.hourly_rate}</span>
        </div>
        <button style={{ background: dev.available ? "#F5A623" : "rgba(255,255,255,0.05)", color: dev.available ? "#0A0F1C" : "rgba(220,230,240,0.2)", border: "none", padding: "6px 14px", borderRadius: 7, cursor: dev.available ? "pointer" : "default", fontFamily: "'Roboto Mono',sans-serif", fontWeight: 700, fontSize: 11 }}>{dev.available ? `${t.ajiri} →` : t.busy}</button>
      </div>
    </div>
  );
}

function StartupCard({ st, t }) {
  const tech = Array.isArray(st.tech_stack) ? st.tech_stack : JSON.parse(st.tech_stack || "[]");
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 13, background: `${st.color}20`, border: `1px solid ${st.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, color: st.color, flexShrink: 0 }}>{st.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</span>
            <Pill label={st.sector} bg={`${st.color}18`} color={st.color} />
            {st.is_hiring && <Pill label={`🔍 ${t.ajira}`} bg="rgba(52,211,153,0.12)" color="#34D399" />}
          </div>
          <p style={{ fontSize: 13, color: "rgba(220,230,240,0.6)", lineHeight: 1.6, marginBottom: 12 }}>{st.description}</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 5 }}>{tech.map(t => <SkillTag key={t} label={t} />)}</div>
            <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.4)" }}>👥 {st.team_size}</span>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#34D399" }}>💰 {st.funding}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstitutionCard({ ins, t }) {
  const focus = Array.isArray(ins.focus_areas) ? ins.focus_areas : JSON.parse(ins.focus_areas || "[]");
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 13, background: `${ins.color}20`, border: `1px solid ${ins.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, color: ins.color, flexShrink: 0 }}>{ins.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ins.name} ({ins.short_name})</span>
            <Pill label={ins.type} bg={`${ins.color}18`} color={ins.color} />
          </div>
          <p style={{ fontSize: 13, color: "rgba(220,230,240,0.6)", lineHeight: 1.6, marginBottom: 12 }}>{ins.description}</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 5 }}>{focus.map(f => <SkillTag key={f} label={f} />)}</div>
            <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.4)" }}>🎓 {ins.student_count?.toLocaleString() || 0} {t.wanafunzi}</span>
              <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#34D399" }}>🔬 {ins.researcher_count || 0} {t.watafiti}</span>
            </div>
          </div>
        </div>
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
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/messages`, { receiver_id: selected.id, text }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages([...messages, res.data]);
      setText("");
      fetchConvos();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ width: 280, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
            <input placeholder={t.tafuta_chat} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px 10px 36px", color: "#FFF", fontSize: 13 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {convos.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: selected?.id === c.id ? "rgba(245,166,35,0.1)" : "transparent", marginBottom: 4, transition: "0.2s" }}>
              <Av initials={c.name ? c.name.split(" ").map(w => w[0]).join("") : "??"} color="#4ECDC4" size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  <span style={{ fontSize: 9, opacity: 0.3, flexShrink: 0 }}>{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last_message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
              <Av initials={selected.name ? selected.name.split(" ").map(w => w[0]).join("") : "??"} color="#4ECDC4" size={32} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name}</div>
                <div style={{ fontSize: 10, color: "#34D399" }}>● {t.online}</div>
              </div>
            </div>
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => {
                const isMe = m.sender_id === user.id;
                return (
                  <div key={i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{ background: isMe ? "#F5A623" : "rgba(255,255,255,0.06)", color: isMe ? "#0A0F1C" : "#DCE6F0", padding: "10px 14px", borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px", fontSize: 14, fontWeight: isMe ? 600 : 400, lineHeight: 1.5 }}>
                      {m.text}
                    </div>
                    <span style={{ fontSize: 9, opacity: 0.3, marginTop: 4 }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={t.andika_ujumbe} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px", color: "#FFF", outline: "none", fontSize: 14 }} />
                <button onClick={handleSend} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", borderRadius: 10, width: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Send size={18} /></button>
              </div>
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

function PostCard({ post, onLike, onBookmark, me, t }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const ts = TAG_COLORS[post.category] || TAG_COLORS.swali;

  const fetchComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    setLoadingComments(true);
    try {
      const res = await axios.get(`${API_URL}/posts/${post.id}/comments`);
      setComments(res.data);
    } catch (error) { console.error(error); }
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/posts/${post.id}/comments`, { text: newComment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments([...comments, { ...res.data, author_name: me.name, author_handle: me.handle }]);
      setNewComment("");
    } catch { alert("Ingia kwanza ili kutoa maoni."); }
  };

  return (
    <div className="post-card" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22, marginBottom: 12, transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <Av initials={post.author_name ? post.author_name.split(" ").map(w => w[0]).join("") : "??"} color="#4ECDC4" size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.author_name}</span>
            <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.3)" }}>@{post.author_handle}</span>
            <Pill label={t[post.category] || post.category} bg={ts.bg} color={ts.color} />
          </div>
          <div style={{ fontSize: 12, color: "rgba(220,230,240,0.38)", marginTop: 2, fontFamily: "'Roboto Mono',monospace" }}>{post.author_role || "Mwanachama"} · {new Date(post.created_at).toLocaleDateString()}</div>
        </div>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(220,230,240,0.88)", marginBottom: 18, paddingLeft: 56 }}>{post.content}</p>
      <div style={{ display: "flex", gap: 12, paddingLeft: 56 }}>
        <button onClick={() => onLike(post.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: post.user_liked ? "rgba(245,166,35,0.12)" : "transparent", border: "none", color: post.user_liked ? "#F5A623" : "rgba(220,230,240,0.45)", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>
          <Heart size={18} fill={post.user_liked ? "#F5A623" : "none"} strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{post.like_count}</span>
        </button>
        <button onClick={fetchComments} style={{ display: "flex", alignItems: "center", gap: 6, background: showComments ? "rgba(78,205,196,0.12)" : "transparent", border: "none", color: showComments ? "#4ECDC4" : "rgba(220,230,240,0.45)", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>
          <MessageSquare size={18} fill={showComments ? "#4ECDC4" : "none"} strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{post.comment_count}</span>
        </button>
        <button onClick={() => onBookmark(post.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: post.user_bookmarked ? "rgba(167,139,250,0.12)" : "transparent", border: "none", color: post.user_bookmarked ? "#A78BFA" : "rgba(220,230,240,0.45)", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>
          <Bookmark size={18} fill={post.user_bookmarked ? "#A78BFA" : "none"} strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{post.bookmark_count}</span>
        </button>
      </div>
      {showComments && (
        <div style={{ marginTop: 18, paddingLeft: 56, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
          {comments.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <Av initials={c.author_name ? c.author_name.split(" ").map(w => w[0]).join("") : "?"} color="#A78BFA" size={30} />
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#A78BFA" }}>{c.author_name}</span>
                <p style={{ fontSize: 13, color: "rgba(220,230,240,0.7)", marginTop: 3 }}>{c.text}</p>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t.andika_jibu} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#DCE6F0", outline: "none" }} />
            <button onClick={handleAddComment} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMMUNITY ──────────────────────────────────────────────────────────

export default function JamiiAICommunity({ user, onLogout, lang = 'sw', toggleLang }) {
  const t = translations[lang];
  const ME = { 
    id: user?.id,
    name: user?.name || "Mgeni", 
    handle: user?.handle || "mgeni", 
    avatar: user?.name ? user.name.split(" ").map(w => w[0]).join("") : "??", 
    color: "#F5A623", 
    role: user?.role || "AI Enthusiast"
  };

  const [activeNav, setActiveNav]         = useState("nyumbani");
  const [activeFilter, setActiveFilter]   = useState("all");
  const [posts, setPosts]                 = useState([]);
  const [dataList, setDataList]           = useState([]);
  const [sidebarData, setSidebarData]     = useState({ trending: [], upcoming_events: [], new_sections: [], online_count: 0 });
  const [loading, setLoading]             = useState(false);
  const [composerText, setComposerText]   = useState("");
  const [composerCat, setComposerCat]     = useState("swali");
  const [showOptions, setShowOptions]     = useState(false);
  const [notification, setNotification]   = useState(null);
  const [isPosting, setIsPosting]         = useState(false);

  const notify = msg => { setNotification(msg); setTimeout(() => setNotification(null), 2500); };

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
        const res = await axios.get(`${API_URL}/${endpointMap[activeNav]}`);
        setDataList(activeNav === 'wataalamu' ? res.data.users : res.data);
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
    if (!composerText.trim()) return;
    setIsPosting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/posts`, { content: composerText, category: composerCat }, { headers: { Authorization: `Bearer ${token}` } });
      setPosts([{ ...res.data, author_name: ME.name, author_handle: ME.handle, author_role: ME.role, like_count: 0, comment_count: 0, bookmark_count: 0, user_liked: false, user_bookmarked: false }, ...posts]);
      setComposerText(""); setShowOptions(false); notify("✓ Imetumwa!");
    } catch { notify("Hitilafu imetokea."); }
    setIsPosting(false);
  };

  const localizedNav = NAV_ITEMS.map(item => ({ ...item, label: t[item.id] || item.label }));
  const localizedFilters = FILTER_TABS.map(tab => ({ ...tab, label: t[tab.id] || (tab.id === 'habari' ? t.habari_filter : tab.label) }));

  const [selectedExpert, setSelectedExpert] = useState(null);

  return (
    <div style={{ fontFamily: "'Roboto Mono',monospace", background: "#0A0F1C", color: "#DCE6F0", minHeight: "100vh", display: "flex", justifyContent: "center", overflow: "hidden" }}>
      {selectedExpert && <ExpertDetailModal dev={selectedExpert} onClose={() => setSelectedExpert(null)} t={t} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#0A0F1C} ::-webkit-scrollbar-thumb{background:#F5A623;border-radius:2px}
        .nav-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:9px;cursor:pointer;transition:all 0.18s}
        .nav-item:hover{background:rgba(255,255,255,0.04)}
        .nav-item.active{background:rgba(245,166,35,0.1);color:#F5A623}
        .ftab{padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s;border:1px solid transparent}
        .ftab.active{background:rgba(245,166,35,0.1);color:#F5A623;border-color:rgba(245,166,35,0.2)}
        @keyframes notif{0%{opacity:0;transform:translateX(20px)}15%{opacity:1;transform:translateX(0)}85%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(20px)}}
        @media (max-width: 1100px) { .right-sidebar { display: none !important; } }
      `}</style>

      <div style={{ display: "flex", width: "100%", maxWidth: "1250px", position: "relative", height: "100vh" }}>
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
              <Av initials={ME.avatar} size={30} color={activeNav === 'profile' ? "#F5A623" : "#4ECDC4"} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: activeNav === 'profile' ? "#F5A623" : "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ME.name}</div>
                <div style={{ fontSize: 9, opacity: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{ME.handle}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN — SCROLLABLE */}
        <main style={{ flex: 1, minWidth: 0, borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", height: "100vh", scrollBehavior: "smooth" }}>
          <div style={{ position: "sticky", top: 0, background: "rgba(10,15,28,0.93)", backdropFilter: "blur(20px)", padding: "15px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}>
            <h1 style={{ fontWeight: 700, fontSize: 17 }}>{activeNav === 'profile' ? (lang === 'sw' ? 'Profile Yako 👤' : 'Your Profile 👤') : (t['kichwa_' + activeNav] || PAGE_TITLE[activeNav])}</h1>
          </div>
          <div style={{ padding: "18px 22px", maxWidth: (activeNav === "ujumbe" || activeNav === "profile") ? "900px" : "700px", margin: "0 auto" }}>
            
            {activeNav === "profile" && <ProfilePage user={user} lang={lang} onLogout={onLogout} />}

            {(activeNav === "nyumbani" || activeNav === "gundua") && (
              <>
                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18, marginBottom: 16 }}>
                  <textarea value={composerText} onChange={e => { setComposerText(e.target.value); setShowOptions(true); }} placeholder={t.shiriki_kitu} style={{ width: "100%", background: "transparent", border: "none", color: "#DCE6F0", fontSize: 14, outline: "none", resize: "none" }} rows={3} />
                  {showOptions && (
                    <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {Object.entries({ swali: t.swali, mradi: t.mradi, habari: t.habari_filter, kazi: t.kazi }).map(([k, v]) => (
                          <button key={k} onClick={() => setComposerCat(k)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, border: `1px solid ${composerCat === k ? TAG_COLORS[k].color : "rgba(255,255,255,0.1)"}`, background: composerCat === k ? TAG_COLORS[k].bg : "transparent", color: composerCat === k ? TAG_COLORS[k].color : "#FFF", cursor: "pointer" }}>{v}</button>
                        ))}
                      </div>
                      <button onClick={handlePost} disabled={isPosting} style={{ background: "#F5A623", color: "#0A0F1C", border: "none", padding: "8px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{isPosting ? t.inatuma : t.chapisha}</button>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {localizedFilters.map(tab => <span key={tab.id} className={`ftab ${activeFilter === tab.id ? "active" : ""}`} onClick={() => setActiveFilter(tab.id)}>{tab.label}</span>)}
                </div>
                {loading ? <div style={{ opacity: 0.4 }}>{t.inapakia}</div> : posts.map(p => <PostCard key={p.id} post={p} onLike={handleLike} onBookmark={handleBookmark} me={ME} t={t} />)}
              </>
            )}

            {activeNav === "wataalamu" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {loading ? t.inapakia : dataList.map(dev => <ExpertCard key={dev.id} dev={dev} onClick={setSelectedExpert} t={t} />)}
              </div>
            )}

            {activeNav === "startups" && (
              <div style={{ display: "grid", gap: 12 }}>
                {loading ? t.inapakia : dataList.map(st => <StartupCard key={st.id} st={st} t={t} />)}
              </div>
            )}

            {activeNav === "vyuo" && (
              <div style={{ display: "grid", gap: 12 }}>
                {loading ? t.inapakia : dataList.map(ins => <InstitutionCard key={ins.id} ins={ins} t={t} />)}
              </div>
            )}

            {activeNav === "changamoto" && (
              <div style={{ display: "grid", gap: 16 }}>
                {loading ? t.inapakia : dataList.map(ch => <ChallengeCard key={ch.id} ch={ch} t={t} />)}
              </div>
            )}

            {activeNav === "rasilimali" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {loading ? t.inapakia : dataList.map(r => (
                  <div key={r.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18 }}>
                    <Pill label={r.type} bg={`${r.color}18`} color={r.color} />
                    <h3 style={{ fontWeight: 700, fontSize: 14, marginTop: 10 }}>{r.title}</h3>
                    <p style={{ opacity: 0.5, fontSize: 12, marginTop: 5 }}>{r.description}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 11, opacity: 0.4 }}>
                      <span>⭐ {r.stars}</span><span>↓ {r.downloads}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeNav === "habari" && (
              <div style={{ display: "grid", gap: 12 }}>
                {loading ? t.inapakia : dataList.map(n => (
                  <div key={n.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Pill label={n.category} bg="rgba(245,166,35,0.12)" color="#F5A623" />
                      {n.is_hot && <span style={{ color: "#F87171", fontSize: 10, fontWeight: 700 }}>🔥 HOT</span>}
                    </div>
                    <h3 style={{ fontWeight: 700, marginTop: 8 }}>{n.title}</h3>
                    <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>{n.summary}</p>
                  </div>
                ))}
              </div>
            )}

            {activeNav === "matukio" && (
              <div style={{ display: "grid", gap: 16 }}>
                {loading ? t.inapakia : dataList.map(ev => <EventCard key={ev.id} ev={ev} t={t} />)}
              </div>
            )}

            {activeNav === "ujumbe" && <MessagingUI user={ME} t={t} />}
          </div>
        </main>

        {/* SIDEBAR RIGHT — FIXED */}
        {activeNav !== "ujumbe" && activeNav !== "profile" && (
          <aside className="right-sidebar" style={{ width: 310, flexShrink: 0, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18, height: "100vh", position: "sticky", top: 0, background: "#0A0F1C", overflow: "hidden" }}>
            <div style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.12)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 10px #34D399" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#34D399" }}>{sidebarData.online_count} {lang === 'sw' ? 'Wako Online' : 'Online Now'}</span>
            </div>
            
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18, paddingRight: 4 }}>
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 12, letterSpacing: "0.1em", fontWeight: 700 }}>{t.trending}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sidebarData.trending.map(item => (
                    <div key={item} style={{ fontWeight: 700, fontSize: 14, color: "#F5A623", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      <Zap size={14} style={{ opacity: 0.5 }} /> {item}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 14, letterSpacing: "0.1em", fontWeight: 700 }}>{t.matukio_yajayo}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {sidebarData.upcoming_events.map(ev => (
                    <div key={ev.id} style={{ display: "flex", gap: 12, cursor: "pointer" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ev.color}15`, border: `1px solid ${ev.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🗓️</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</div>
                        <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{new Date(ev.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 12, letterSpacing: "0.1em", fontWeight: 700 }}>{t.sehemu_mpya}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sidebarData.new_sections.map(sec => (
                    <div key={sec.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", cursor: "pointer" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{sec.label}</span>
                      <span style={{ fontSize: 8, background: "#F5A623", color: "#0A0F1C", padding: "2px 5px", borderRadius: 4, fontWeight: 700 }}>NEW</span>
                    </div>
                  ))}
                </div>
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
