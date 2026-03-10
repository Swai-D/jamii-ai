import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:4000/api";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ROLES = ["ML Engineer", "Data Scientist", "AI Architect", "AI Developer", "AI Researcher", "MLOps Engineer", "AI Enthusiast", "Student"];
const CITIES = ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Zanzibar", "Moshi", "Tanga", "Morogoro", "Tabora", "Nyingine"];
const INTERESTS = ["NLP / Swahili AI", "Computer Vision", "LLMs & Agents", "MLOps", "AI for Agriculture", "AI for Health", "Data Science", "AI Ethics", "Startups", "Research"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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

// ─── PANELS ──────────────────────────────────────────────────────────────────

function LoginPanel({ onSwitch, onSuccess, onForgot }) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async () => {
    const iden = form.identifier?.trim();
    if (!iden || !form.password) { setErr("Jaza fields zote."); return; }
    setLoading(true); setErr("");
    try {
      // Tunatuma 'identifier' na 'email' (kama alias) kwa compatibility ya server
      const res = await axios.post(`${API_URL}/auth/login`, {
        identifier: iden,
        email: iden, 
        password: form.password
      });
      setLoading(false);
      onSuccess(res.data);
    } catch (error) {
      setLoading(false);
      setErr(error.response?.data?.error || "Hitilafu imetokea wakati wa kuingia.");
    }
  };

  return (
    <div className="panel-in">
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>Karibu tena 👋</h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14, lineHeight: 1.6 }}>Ingia kwenye JamiiAI — community ya AI Tanzania</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FloatLabel label="Barua Pepe au Handle">
          <Input value={form.identifier} onChange={set("identifier")} placeholder="wewe@mfano.com au handle_yako" />
        </FloatLabel>
        <FloatLabel label="Nywila">
          <Input value={form.password} onChange={set("password")} placeholder="••••••••" type="password" />
        </FloatLabel>

        {err && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F87171" }}>{err}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span onClick={onForgot} style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F5A623", cursor: "pointer" }}>Umesahau nywila?</span>
        </div>

        <Btn onClick={handleLogin} disabled={loading} full>
          {loading ? "Inaingia..." : "Ingia →"}
        </Btn>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)" }}>AU</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Social login placeholder */}
        <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px", cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontWeight: 700, fontSize: 14, color: "rgba(220,230,240,0.7)", transition: "all 0.2s" }}>
          <span style={{ fontSize: 18 }}>G</span> Ingia na Google
        </button>
      </div>

      <p style={{ marginTop: 32, textAlign: "center", color: "rgba(220,230,240,0.4)", fontSize: 13 }}>
        Huna akaunti?{" "}
        <span onClick={onSwitch} style={{ color: "#F5A623", fontWeight: 700, cursor: "pointer" }}>Jiandikishe bure →</span>
      </p>
    </div>
  );
}

function ForgotPasswordPanel({ onBack, onNext }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    if (!email) { setErr("Jaza barua pepe."); return; }
    setLoading(true); setErr("");
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setLoading(false);
      setMsg("Code imetumwa kwenye barua pepe yako.");
      if (res.data.debug_token) {
        alert("DEBUG: Code yako ni " + res.data.debug_token);
      }
      setTimeout(() => onNext(email), 2000);
    } catch (error) {
      setLoading(false);
      setErr(error.response?.data?.error || "Hitilafu imetokea.");
    }
  };

  return (
    <div className="panel-in">
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>Umesahau nywila? 🔐</h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14, lineHeight: 1.6 }}>Tutakutumia code ya siri ili uweze kubadili nywila yako.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FloatLabel label="Barua Pepe">
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="wewe@mfano.com" type="email" />
        </FloatLabel>

        {err && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F87171" }}>{err}</div>}
        {msg && <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#34D399" }}>{msg}</div>}

        <Btn onClick={handleSubmit} disabled={loading} full>
          {loading ? "Inatuma..." : "Tuma Code →"}
        </Btn>

        <p style={{ marginTop: 24, textAlign: "center", color: "rgba(220,230,240,0.4)", fontSize: 13 }}>
          Kumbuka nywila?{" "}
          <span onClick={onBack} style={{ color: "#F5A623", fontWeight: 700, cursor: "pointer" }}>Rudi kwenye Ingia</span>
        </p>
      </div>
    </div>
  );
}

function ResetPasswordPanel({ email, onSuccess }) {
  const [form, setForm] = useState({ token: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.token || !form.password) { setErr("Jaza fields zote."); return; }
    if (form.password !== form.confirm) { setErr("Nywila hazilingani."); return; }
    setLoading(true); setErr("");
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { email, token: form.token, password: form.password });
      setLoading(false);
      onSuccess();
    } catch (error) {
      setLoading(false);
      setErr(error.response?.data?.error || "Hitilafu imetokea.");
    }
  };

  return (
    <div className="panel-in">
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>Badili Nywila ✨</h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14, lineHeight: 1.6 }}>Weka code uliyotumiwa na nywila yako mpya.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FloatLabel label="Code ya Siri (6 digits)">
          <Input value={form.token} onChange={e => setForm({...form, token: e.target.value})} placeholder="123456" />
        </FloatLabel>
        <FloatLabel label="Nywila Mpya">
          <Input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" type="password" />
        </FloatLabel>
        <FloatLabel label="Thibitisha Nywila">
          <Input value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} placeholder="••••••••" type="password" />
        </FloatLabel>

        {err && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: "#F87171" }}>{err}</div>}

        <Btn onClick={handleSubmit} disabled={loading} full>
          {loading ? "Inabadilisha..." : "Badili Nywila →"}
        </Btn>
      </div>
    </div>
  );
}

function RegisterPanel({ onSwitch, onNext }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                           e.name = "Jina linahitajika";
    if (!form.email.includes("@"))                  e.email = "Barua pepe si sahihi";
    if (form.password.length < 6)                   e.password = "Nywila lazima iwe herufi 6+";
    if (form.password !== form.confirm)             e.confirm = "Nywila hazilingani";
    return e;
  };

  const handleRegister = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name: form.name,
        email: form.email,
        password: form.password
      });
      setLoading(false);
      onNext(res.data);
    } catch (error) {
      setLoading(false);
      setErrors({ email: error.response?.data?.error || "Hitilafu imetokea wakati wa kujisajili." });
    }
  };

  return (
    <div className="panel-in">
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>Jiunge na JamiiAI 🌍</h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 14, lineHeight: 1.6 }}>Community ya AI Tanzania — bure kabisa</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FloatLabel label="Jina Kamili" error={errors.name}>
          <Input value={form.name} onChange={set("name")} placeholder="Jina lako" error={errors.name} />
        </FloatLabel>
        <FloatLabel label="Barua Pepe" error={errors.email}>
          <Input value={form.email} onChange={set("email")} placeholder="wewe@mfano.com" type="email" error={errors.email} />
        </FloatLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FloatLabel label="Nywila" error={errors.password}>
            <Input value={form.password} onChange={set("password")} placeholder="••••••••" type="password" error={errors.password} />
          </FloatLabel>
          <FloatLabel label="Thibitisha Nywila" error={errors.confirm}>
            <Input value={form.confirm} onChange={set("confirm")} placeholder="••••••••" type="password" error={errors.confirm} />
          </FloatLabel>
        </div>

        <p style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)", lineHeight: 1.7 }}>
          Kwa kujiandikisha unakubali <span style={{ color: "#F5A623", cursor: "pointer" }}>Masharti ya Huduma</span> na{" "}
          <span style={{ color: "#F5A623", cursor: "pointer" }}>Sera ya Faragha</span> ya JamiiAI.
        </p>

        <Btn onClick={handleRegister} disabled={loading} full>
          {loading ? "Inaendelea..." : "Endelea →"}
        </Btn>
      </div>

      <p style={{ marginTop: 28, textAlign: "center", color: "rgba(220,230,240,0.4)", fontSize: 13 }}>
        Una akaunti tayari?{" "}
        <span onClick={onSwitch} style={{ color: "#F5A623", fontWeight: 700, cursor: "pointer" }}>Ingia →</span>
      </p>
    </div>
  );
}

// ─── ONBOARDING STEPS ────────────────────────────────────────────────────────

function OnboardStep1({ data, setData, onNext, token }) {
  return (
    <div className="panel-in">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", letterSpacing: "0.12em", marginBottom: 12 }}>HATUA 1 / 3 — PROFILE YAKO</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Niambie kuhusu wewe ✨</h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Tutakusaidia kupata watu na maudhui yanayokufaa</p>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {[1, 2, 3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n === 1 ? "#F5A623" : "rgba(255,255,255,0.08)" }} />)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <FloatLabel label="Handle (Username)">
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#F5A623", fontFamily: "'Roboto Mono',monospace", fontSize: 14 }}>@</span>
            <input value={data.handle} onChange={e => setData(d => ({ ...d, handle: e.target.value.toLowerCase().replace(/\s/g, "") })) } placeholder="handle_yako" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px 13px 36px", color: "#DCE6F0", fontFamily: "'Roboto Mono',monospace", fontSize: 15, outline: "none", width: "100%", transition: "border-color 0.2s" }} />
          </div>
        </FloatLabel>

        <FloatLabel label="Jukumu Lako">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ROLES.map(role => (
              <div key={role} onClick={() => setData(d => ({ ...d, role }))} style={{ padding: "10px 14px", borderRadius: 9, border: `1px solid ${data.role === role ? "#F5A623" : "rgba(255,255,255,0.08)"}`, background: data.role === role ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: data.role === role ? "#F5A623" : "rgba(220,230,240,0.55)", transition: "all 0.18s", textAlign: "center" }}>
                {role}
              </div>
            ))}
          </div>
        </FloatLabel>

        <FloatLabel label="Mji Wako">
          <select value={data.city} onChange={e => setData(d => ({ ...d, city: e.target.value }))} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px", color: data.city ? "#DCE6F0" : "rgba(220,230,240,0.35)", fontFamily: "'Roboto Mono',monospace", fontSize: 15, outline: "none", width: "100%", cursor: "pointer", appearance: "none" }}>
            <option value="" style={{ background: "#1a1f2e" }}>Chagua mji...</option>
            {CITIES.map(c => <option key={c} value={c} style={{ background: "#1a1f2e" }}>{c}</option>)}
          </select>
        </FloatLabel>

        <Btn onClick={onNext} disabled={!data.handle || !data.role || !data.city} full>
          Endelea →
        </Btn>
      </div>
    </div>
  );
}

function OnboardStep2({ data, setData, onNext, onBack }) {
  const toggle = interest => setData(d => ({ ...d, interests: d.interests.includes(interest) ? d.interests.filter(i => i !== interest) : d.interests.length < 5 ? [...d.interests, interest] : d.interests }));

  return (
    <div className="panel-in">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", letterSpacing: "0.12em", marginBottom: 12 }}>HATUA 2 / 3 — MASLAHI YAKO</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Unafurahia nini kwenye AI? 🎯</h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Chagua hadi 5 — tutakuonyesha content inayokufaa</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {[1, 2, 3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= 2 ? "#F5A623" : "rgba(255,255,255,0.08)" }} />)}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
        {INTERESTS.map(interest => {
          const selected = data.interests.includes(interest);
          return (
            <div key={interest} onClick={() => toggle(interest)} style={{ padding: "9px 16px", borderRadius: 24, border: `1px solid ${selected ? "#F5A623" : "rgba(255,255,255,0.1)"}`, background: selected ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.02)", cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: selected ? "#F5A623" : "rgba(220,230,240,0.6)", transition: "all 0.18s", userSelect: "none" }}>
              {selected && "✓ "}{interest}
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)", marginBottom: 24 }}>
        Umechagua {data.interests.length}/5
      </div>

      <FloatLabel label="Bio Fupi (hiari)">
        <textarea value={data.bio} onChange={e => setData(d => ({ ...d, bio: e.target.value }))} placeholder="Niambie kidogo kuhusu wewe na unachofanya kwenye AI..." rows={3} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px", color: "#DCE6F0", fontFamily: "'Roboto Mono',monospace", fontSize: 14, outline: "none", width: "100%", resize: "none", lineHeight: 1.6, marginTop: 4 }} />
      </FloatLabel>

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <Btn onClick={onBack} variant="ghost">← Rudi</Btn>
        <div style={{ flex: 1 }}>
          <Btn onClick={onNext} disabled={data.interests.length === 0} full>Endelea →</Btn>
        </div>
      </div>
    </div>
  );
}

function OnboardStep3({ data, setData, onFinish, token }) {
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await axios.patch(`${API_URL}/auth/onboard`, {
        handle: data.handle,
        role: data.role,
        city: data.city,
        bio: data.bio,
        interests: data.interests,
        notifications: {
          emailDigest: data.emailDigest,
          notifications: data.notifications,
          newsletter: data.newsletter,
          hiring: data.hiring
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoading(false);
      // Backend sasa inarudisha { success: true, user: safeUser }
      onFinish(res.data.user);
    } catch (error) {
      setLoading(false);
      alert(error.response?.data?.error || "Hitilafu imetokea wakati wa ku-onboard.");
    }
  };

  return (
    <div className="panel-in">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", letterSpacing: "0.12em", marginBottom: 12 }}>HATUA 3 / 3 — MWISHO!</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Utajulishwa vipi? 🔔</h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Chagua jinsi unavyotaka kushiriki kwenye JamiiAI</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {[1, 2, 3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: "#F5A623" }} />)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {[
          { key: "emailDigest",  label: "Email Digest ya Habari",  sub: "Habari bora za AI kila wiki kwa barua pepe", icon: "📧" },
          { key: "notifications", label: "Arifa za Jamii",          sub: "Ukijibiwa au kupata like kwenye post yako",  icon: "🔔" },
          { key: "newsletter",    label: "Newsletter ya JamiiAI",   sub: "Updates za changamoto, matukio, na habari mpya", icon: "📰" },
          { key: "hiring",        label: "Nafasi za Kazi",          sub: "Arifa za AI jobs na gigs za Tanzania",       icon: "💼" },
        ].map(({ key, label, sub, icon }) => (
          <div key={key} onClick={() => setData(d => ({ ...d, [key]: !d[key] }))} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1px solid ${data[key] ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.08)"}`, background: data[key] ? "rgba(245,166,35,0.06)" : "rgba(255,255,255,0.02)", cursor: "pointer", transition: "all 0.18s" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: data[key] ? "#F5A623" : "#DCE6F0" }}>{label}</div>
              <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)", marginTop: 3 }}>{sub}</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${data[key] ? "#F5A623" : "rgba(255,255,255,0.15)"}`, background: data[key] ? "#F5A623" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}>
              {data[key] && <span style={{ color: "#0A0F1C", fontSize: 12, fontWeight: 700 }}>✓</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Summary card */}
      <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 14, padding: "18px 20px", marginBottom: 28 }}>
        <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623", letterSpacing: "0.1em", marginBottom: 14 }}>MUHTASARI WA PROFILE YAKO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["Handle", `@${data.handle || "—"}`],
            ["Jukumu", data.role || "—"],
            ["Mji", data.city || "—"],
            ["Maslahi", `${data.interests.length} mada`],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.35)", marginBottom: 2 }}>{k}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#DCE6F0" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <Btn onClick={handleFinish} disabled={loading} full>
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(10,15,28,0.3)", borderTopColor: "#0A0F1C", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Inaunda akaunti yako...
          </span>
        ) : "Ingia JamiiAI 🚀"}
      </Btn>
    </div>
  );
}

// ─── SUCCESS ─────────────────────────────────────────────────────────────────
function SuccessScreen({ user, onFinish }) {
  return (
    <div className="panel-in" style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 20, animation: "bounce 0.6s ease" }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 12 }}>
        Karibu, <span style={{ color: "#F5A623" }}>{user?.name?.split(" ")[0]}!</span>
      </h2>
      <p style={{ color: "rgba(220,230,240,0.5)", fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 32px" }}>
        Akaunti yako ya JamiiAI imefanikiwa kuundwa. Uko sehemu ya community ya AI Tanzania! 🇹🇿
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300, margin: "0 auto" }}>
        <Btn full onClick={onFinish}>Nenda kwenye Jamii →</Btn>
        <Btn variant="ghost" full>Kamilisha Profile Yako</Btn>
      </div>
      <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 24 }}>
        {[["🧑‍💻", "Wataalamu"], ["◆", "Changamoto"], ["◧", "Rasilimali"]].map(([icon, label]) => (
          <div key={label} style={{ textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.4)" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function JamiiAIAuth({ onAuthSuccess, onBack }) {
  const [screen, setScreen] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [authData, setAuthData] = useState(null); // stores { token, user }
  const [onboardData, setOnboardData] = useState({
    handle: "", role: "", city: "", bio: "",
    interests: [],
    emailDigest: true, notifications: true, newsletter: false, hiring: true,
  });

  const handleAuthResult = (data) => {
    setAuthData(data);
    if (data.user.onboarded) {
      onAuthSuccess(data);
    } else {
      setScreen("onboard1");
    }
  };

  const handleOnboardSuccess = (updatedUser) => {
    setAuthData(prev => ({ ...prev, user: updatedUser }));
    setScreen("success");
  };

  const handleOnboardFinish = () => {
    onAuthSuccess(authData);
  };

  const quotes = [
    { text: "AI itabadilisha Tanzania — sisi wenyewe tunajenga mustakabali huo.", author: "Jonas K., AI Architect" },
    { text: "Swahili NLP ni frontier ya kweli. JamiiAI inanisaidia kupata washirika.", author: "Amina H., ML Engineer" },
    { text: "Kutoka Zanzibar, ninachangia AI ecosystem ya Afrika. Pamoja tunaweza!", author: "Fatuma S., Data Scientist" },
  ];
  const q = quotes[Math.floor(Date.now() / 10000) % quotes.length];

  return (
    <div style={{ fontFamily: "'Roboto Mono',monospace", background: "#0A0F1C", color: "#DCE6F0", minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#F5A623;border-radius:2px}
        input,select,textarea,button { font-family:inherit; }
        button:focus,input:focus,textarea:focus,select:focus { outline:none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes panelIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .panel-in { animation: panelIn 0.35s ease forwards; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* ── LEFT — BRANDING PANEL ── */}
      <div style={{ background: "linear-gradient(160deg, #0D1322 0%, #0A0F1C 100%)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "48px 56px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,0.04) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(245,166,35,0.05)", filter: "blur(100px)", top: -100, left: -100, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(78,205,196,0.04)", filter: "blur(80px)", bottom: 50, right: -50, pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "auto", position: "relative", zIndex: 1 }}>
          <span onClick={onBack} style={{ cursor: "pointer", fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: "rgba(220,230,240,0.4)", marginRight: 10 }}>← Rudi</span>
          <div style={{ width: 36, height: 36, background: "#F5A623", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌍</div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}>Jamii<span style={{ color: "#F5A623" }}>AI</span></span>
        </div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="float" style={{ fontSize: 72, marginBottom: 28, textAlign: "center" }}>🇹🇿</div>
          <h1 style={{ fontSize: "clamp(28px,3vw,44px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20 }}>
            Tanzania's AI<br /><span style={{ color: "#F5A623" }}>Community Hub</span>
          </h1>
          <p style={{ color: "rgba(220,230,240,0.5)", fontSize: 15, lineHeight: 1.75, marginBottom: 40, maxWidth: 380 }}>
            Jiunge na 2,000+ AI developers, researchers, na enthusiasts wa Tanzania. Hire, Shiriki, na Jifunze pamoja.
          </p>

          <div style={{ display: "flex", gap: 24, marginBottom: 40 }}>
            {[["2K+", "Wanachama"], ["500+", "AI Devs"], ["20M+", "Prize Pool"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#F5A623", fontFamily: "'Roboto Mono',monospace" }}>{n}</div>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", borderLeft: "3px solid #F5A623" }}>
            <p style={{ fontSize: 13, color: "rgba(220,230,240,0.65)", lineHeight: 1.7, marginBottom: 10, fontStyle: "italic" }}>"{q.text}"</p>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "#F5A623" }}>— {q.author}</div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.25)" }}>© 2025 JamiiAI</span>
          <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.25)" }}>Made in Tanzania 🇹🇿</span>
        </div>
      </div>

      <div style={{ padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>
        <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          {screen === "login"    && <LoginPanel    onSwitch={() => setScreen("register")} onSuccess={handleAuthResult} onForgot={() => setScreen("forgot")} />}
          {screen === "register" && <RegisterPanel onSwitch={() => setScreen("login")} onNext={handleAuthResult} />}
          {screen === "forgot"   && <ForgotPasswordPanel onBack={() => setScreen("login")} onNext={(email) => { setResetEmail(email); setScreen("reset"); }} />}
          {screen === "reset"    && <ResetPasswordPanel email={resetEmail} onSuccess={() => setScreen("login")} />}
          {screen === "onboard1" && <OnboardStep1  data={onboardData} setData={setOnboardData} onNext={() => setScreen("onboard2")} token={authData?.token} />}
          {screen === "onboard2" && <OnboardStep2  data={onboardData} setData={setOnboardData} onNext={() => setScreen("onboard3")} onBack={() => setScreen("onboard1")} />}
          {screen === "onboard3" && <OnboardStep3  data={onboardData} setData={setOnboardData} onFinish={() => setScreen("success")} token={authData?.token} />}
          {screen === "success"  && <SuccessScreen user={authData?.user} onFinish={handleOnboardFinish} />}
        </div>
      </div>
    </div>
  );
}
