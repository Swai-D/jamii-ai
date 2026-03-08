import { useState, useEffect, useRef } from "react";
import { searchAPI } from "../lib/api";
import { Search } from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────────────
function Av({ name, src, size = 38 }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const colors   = ["#F5A623","#4ECDC4","#A78BFA","#34D399","#60A5FA","#F87171"];
  const color    = colors[name?.charCodeAt(0) % colors.length] || "#F5A623";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: src ? "transparent" : color,
      border: `2px solid ${color}30`, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Roboto Mono',monospace", fontWeight: 900,
      fontSize: size * 0.3, color: "#0A0F1C",
    }}>
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  );
}

function Tag({ label, color = "#F5A623" }) {
  return (
    <span style={{
      fontFamily: "'Roboto Mono',monospace", fontSize: 9, fontWeight: 700,
      padding: "3px 8px", borderRadius: 20,
      background: `${color}15`, color, border: `1px solid ${color}30`,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function EmptyState({ query }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 16, fontWeight: 700, color: "rgba(220,230,240,0.7)", marginBottom: 8 }}>
        Hakuna matokeo kwa "{query}"
      </div>
      <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.3)" }}>
        Jaribu maneno mengine au angalia tahajia
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: "16px 18px",
          display: "flex", gap: 14, alignItems: "center",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 12, width: `${55 + i * 10}%`, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
            <div style={{ height: 10, width: "40%", background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RESULT CARDS ─────────────────────────────────────────────────
function UserCard({ user, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate?.("profile", { handle: user.handle })}
      style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "16px 18px", display: "flex",
        alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.18s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
    >
      <Av name={user.name} src={user.avatar_url} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, color: "#DCE6F0" }}>{user.name}</span>
          {user.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>@{user.handle}</span>
          {user.role && <Tag label={user.role} color="#A78BFA" />}
          {user.city && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.25)" }}>📍 {user.city}</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F5A623", fontWeight: 700 }}>
          {user.followers || 0}
        </div>
        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.3)", marginTop: 2 }}>wafuasi</div>
      </div>
    </div>
  );
}

const CAT_COLORS = {
  mradi:  "#34D399", swali: "#60A5FA",
  habari: "#A78BFA", kazi:  "#F5A623",
};

function PostCard({ post, onNavigate }) {
  const cat = post.category || "swali";
  return (
    <div
      onClick={() => onNavigate?.("post", { id: post.id })}
      style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.18s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Av name={post.author_name} src={post.author_avatar} size={32} />
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, fontWeight: 700, color: "rgba(220,230,240,0.8)" }}>{post.author_name}</span>
        {post.author_handle && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>@{post.author_handle}</span>}
        <Tag label={cat} color={CAT_COLORS[cat] || "#F5A623"} />
      </div>
      <p style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 13, color: "rgba(220,230,240,0.75)", lineHeight: 1.7, margin: "0 0 10px" }}>
        {post.content?.slice(0, 180)}{post.content?.length > 180 ? "…" : ""}
      </p>
      <div style={{ display: "flex", gap: 16 }}>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F5A623" }}>♥ {post.like_count || 0}</span>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.3)" }}>💬 {post.comment_count || 0}</span>
      </div>
    </div>
  );
}

function JobCard({ job, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate?.("kazi", { jobId: job.id })}
      style={{
        background: "rgba(255,255,255,0.025)", border: `1px solid ${job.is_featured ? "rgba(245,166,35,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.18s",
        position: "relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
    >
      {job.is_featured && (
        <div style={{
          position: "absolute", top: 12, right: 14,
          fontFamily: "'Roboto Mono',monospace", fontSize: 9, fontWeight: 700,
          background: "rgba(245,166,35,0.1)", color: "#F5A623",
          padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(245,166,35,0.25)",
        }}>⭐ FEATURED</div>
      )}
      <div style={{ fontFamily: "'Roboto Mono',monospace", fontWeight: 800, fontSize: 15, color: "#DCE6F0", marginBottom: 6 }}>{job.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.55)", fontWeight: 600 }}>{job.company_name}</span>
        {job.location && <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>📍 {job.location}</span>}
        {job.is_remote && <Tag label="Remote" color="#34D399" />}
        <Tag label={(job.type || "full_time").replace("_", " ")} color="#60A5FA" />
      </div>
      {job.salary_visible && (job.salary_min || job.salary_max) && (
        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F5A623", fontWeight: 700 }}>
          {job.salary_currency} {job.salary_min?.toLocaleString()}{job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : "+"}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ res }) {
  return (
    <a
      href={res.link || res.url || "#"}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "block", textDecoration: "none",
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "16px 18px", transition: "all 0.18s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Tag label={res.type || "Resource"} color="#A78BFA" />
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontWeight: 800, fontSize: 14, color: "#DCE6F0" }}>{res.title}</span>
      </div>
      {res.description && (
        <p style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.45)", lineHeight: 1.6, margin: "0 0 8px" }}>
          {res.description?.slice(0, 130)}{res.description?.length > 130 ? "…" : ""}
        </p>
      )}
      <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#60A5FA" }}>🔗 Fungua →</span>
    </a>
  );
}

function ChallengeCard({ ch, onNavigate }) {
  const isOpen = ch.status === "open";
  return (
    <div
      onClick={() => onNavigate?.("changamoto", { id: ch.id })}
      style={{
        background: "rgba(255,255,255,0.025)", border: `1px solid ${ch.is_hot ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.18s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            {ch.is_hot && <Tag label="🔥 HOT" color="#F87171" />}
            <Tag label={isOpen ? "Wazi" : "Imefungwa"} color={isOpen ? "#34D399" : "#94A3B8"} />
            {ch.region && <Tag label={ch.region} color="#60A5FA" />}
          </div>
          <div style={{ fontFamily: "'Roboto Mono',monospace", fontWeight: 800, fontSize: 14, color: "#DCE6F0", marginBottom: 4 }}>{ch.title}</div>
          {ch.participants > 0 && <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>👥 {ch.participants} washiriki</div>}
        </div>
        {ch.prize_display && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 13, fontWeight: 900, color: "#F5A623" }}>{ch.prize_display}</div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.3)", marginTop: 2 }}>zawadi</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TABS CONFIG ──────────────────────────────────────────────────
const TABS = [
  { id: "all",        label: "Zote",       icon: "🔎" },
  { id: "users",      label: "Watu",       icon: "👤" },
  { id: "posts",      label: "Machapisho", icon: "📝" },
  { id: "jobs",       label: "Kazi",       icon: "💼" },
  { id: "resources",  label: "Rasilimali", icon: "📚" },
  { id: "challenges", label: "Changamoto", icon: "🏆" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function SearchResultsPage({ query: initialQuery = "", onNavigate }) {
  const [q,          setQ]          = useState(initialQuery);
  const [inputVal,   setInputVal]   = useState(initialQuery);
  const [tab,        setTab]        = useState("all");
  const [results,    setResults]    = useState({ users: [], posts: [], jobs: [], resources: [], challenges: [] });
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const inputRef                    = useRef();

  const total = Object.values(results).reduce((s, arr) => s + (arr?.length || 0), 0);

  const doSearch = async (searchQ) => {
    const trimmed = (searchQ || "").trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await searchAPI.search(trimmed, "all");
      setResults(data.results || { users: [], posts: [], jobs: [], resources: [], challenges: [] });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Auto-search when query prop changes
  useEffect(() => {
    if (initialQuery?.length >= 2) {
      setInputVal(initialQuery);
      setQ(initialQuery);
      doSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (inputVal.trim().length < 2) return;
    setQ(inputVal.trim());
    doSearch(inputVal.trim());
  };

  const getTabResults = () => {
    if (tab === "all") return null; // rendered in sections below
    return results[tab] || [];
  };

  const countFor = (key) => results[key]?.length || 0;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'Roboto Mono',monospace",
      color: "#DCE6F0",
      minHeight: "100vh",
      padding: "0 0 60px",
    }}>
      <style>{`
        @keyframes shimmer {
          0%,100% { opacity:1 } 50% { opacity:0.5 }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .sr-card { animation: fadeIn 0.22s ease both; }
        .sr-tab  { background:transparent; border:1px solid rgba(255,255,255,0.08); color:rgba(220,230,240,0.45); padding:7px 14px; border-radius:20px; cursor:pointer; font-family:'Roboto Mono',monospace; font-size:11px; font-weight:700; transition:all 0.18s; }
        .sr-tab:hover { background:rgba(255,255,255,0.05); color:#DCE6F0; }
        .sr-tab.active { background:rgba(245,166,35,0.12); color:#F5A623; border-color:rgba(245,166,35,0.3); }
      `}</style>

      {/* ── Search bar ── */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 24px",
        marginBottom: 24,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 640 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(220,230,240,0.3)", display: "flex" }}>
              <Search size={14} />
            </span>
            <input
              ref={inputRef}
              autoFocus
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Tafuta watu, machapisho, kazi, rasilimali..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                padding: "12px 14px 12px 36px", color: "#DCE6F0",
                fontFamily: "'Roboto Mono',monospace", fontSize: 14, outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: "#F5A623", color: "#0A0F1C", border: "none",
              padding: "12px 22px", borderRadius: 12, cursor: "pointer",
              fontFamily: "'Roboto Mono',monospace", fontWeight: 800, fontSize: 13,
              flexShrink: 0,
            }}
          >Tafuta</button>
        </form>

        {/* Summary */}
        {searched && !loading && q && (
          <div style={{ marginTop: 10, fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.35)" }}>
            {total > 0
              ? <><span style={{ color: "#F5A623", fontWeight: 700 }}>{total}</span> matokeo kwa "<span style={{ color: "#DCE6F0" }}>{q}</span>"</>
              : <>Hakuna matokeo kwa "<span style={{ color: "#DCE6F0" }}>{q}</span>"</>
            }
          </div>
        )}
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* ── Tabs ── */}
        {searched && !loading && total > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
            {TABS.map(t => {
              const count = t.id === "all" ? total : countFor(t.id);
              if (t.id !== "all" && count === 0) return null;
              return (
                <button
                  key={t.id}
                  className={`sr-tab${tab === t.id ? " active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.icon} {t.label}
                  {count > 0 && (
                    <span style={{
                      marginLeft: 5, background: tab === t.id ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)",
                      color: tab === t.id ? "#F5A623" : "rgba(220,230,240,0.4)",
                      padding: "1px 6px", borderRadius: 20, fontSize: 9,
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <Skeleton />}

        {/* ── No results ── */}
        {searched && !loading && total === 0 && q && <EmptyState query={q} />}

        {/* ── Empty initial state ── */}
        {!searched && !loading && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>🔎</div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 18, fontWeight: 800, color: "rgba(220,230,240,0.6)", marginBottom: 10 }}>
              Tafuta kila kitu kwenye JamiiAI
            </div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.25)", lineHeight: 1.8 }}>
              Watu • Machapisho • Kazi • Rasilimali • Changamoto
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!loading && searched && total > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Specific tab */}
            {tab !== "all" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tab === "users"      && results.users.map(u => <div key={u.id} className="sr-card"><UserCard user={u} onNavigate={onNavigate} /></div>)}
                {tab === "posts"      && results.posts.map(p => <div key={p.id} className="sr-card"><PostCard post={p} onNavigate={onNavigate} /></div>)}
                {tab === "jobs"       && results.jobs.map(j  => <div key={j.id} className="sr-card"><JobCard  job={j}  onNavigate={onNavigate} /></div>)}
                {tab === "resources"  && results.resources.map(r => <div key={r.id} className="sr-card"><ResourceCard res={r} /></div>)}
                {tab === "challenges" && results.challenges.map(c => <div key={c.id} className="sr-card"><ChallengeCard ch={c} onNavigate={onNavigate} /></div>)}
              </div>
            )}

            {/* All tab — show sections */}
            {tab === "all" && (
              <>
                {results.users?.length > 0 && (
                  <section>
                    <SectionHeader label="Watu" icon="👤" count={results.users.length} onMore={() => setTab("users")} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {results.users.slice(0, 3).map(u => <div key={u.id} className="sr-card"><UserCard user={u} onNavigate={onNavigate} /></div>)}
                    </div>
                  </section>
                )}

                {results.posts?.length > 0 && (
                  <section>
                    <SectionHeader label="Machapisho" icon="📝" count={results.posts.length} onMore={() => setTab("posts")} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {results.posts.slice(0, 3).map(p => <div key={p.id} className="sr-card"><PostCard post={p} onNavigate={onNavigate} /></div>)}
                    </div>
                  </section>
                )}

                {results.jobs?.length > 0 && (
                  <section>
                    <SectionHeader label="Kazi" icon="💼" count={results.jobs.length} onMore={() => setTab("jobs")} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {results.jobs.slice(0, 3).map(j => <div key={j.id} className="sr-card"><JobCard job={j} onNavigate={onNavigate} /></div>)}
                    </div>
                  </section>
                )}

                {results.resources?.length > 0 && (
                  <section>
                    <SectionHeader label="Rasilimali" icon="📚" count={results.resources.length} onMore={() => setTab("resources")} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {results.resources.slice(0, 2).map(r => <div key={r.id} className="sr-card"><ResourceCard res={r} /></div>)}
                    </div>
                  </section>
                )}

                {results.challenges?.length > 0 && (
                  <section>
                    <SectionHeader label="Changamoto" icon="🏆" count={results.challenges.length} onMore={() => setTab("challenges")} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {results.challenges.slice(0, 2).map(c => <div key={c.id} className="sr-card"><ChallengeCard ch={c} onNavigate={onNavigate} /></div>)}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, icon, count, onMore }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(220,230,240,0.5)", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, background: "rgba(255,255,255,0.05)", color: "rgba(220,230,240,0.3)", padding: "2px 7px", borderRadius: 20 }}>{count}</span>
      </div>
      {count > 3 && (
        <button onClick={onMore} style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
          Ona zote →
        </button>
      )}
    </div>
  );
}