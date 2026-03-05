import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const ME = { name: "Davy Mwangi", handle: "davyswai", avatar: "DM", color: "#F5A623", role: "AI Developer", loc: "Dar es Salaam" };

const INITIAL_POSTS = [
  { id: 1, author: "Amina Hassan", handle: "aminahassan", avatar: "AH", color: "#4ECDC4", role: "ML Engineer · Dar es Salaam", time: "Dakika 5 zilizopita", category: "swali", tag: "Swali", content: "Habari wote! 🙋‍♀️ Ninajaribu kujenga sentiment analysis model kwa Kiswahili lakini dataset ni ndogo sana. Kuna mtu ana dataset ya Swahili text au amefanya kitu kama hiki? Ningependa collaboration! #NLP #Swahili #ML", likes: 24, comments: 8, bookmarks: 5, liked: false, bookmarked: false, commentList: [{ author: "Jonas K.", color: "#F87171", text: "Niko interested sana! Nina dataset ndogo lakini tunaweza combine. DM me 🔥" }, { author: "Fatuma S.", color: "#A78BFA", text: "Tumia data augmentation — back-translation works vizuri sana kwa low-resource languages." }] },
  { id: 2, author: "Jonas Kimaro", handle: "jonaskimaro", avatar: "JK", color: "#F87171", role: "AI Architect · Dodoma", time: "Saa 1 iliyopita", category: "mradi", tag: "Mradi", content: "🚀 Nimekamilisha mradi wangu wa kwanza wa RAG system kwa Kiswahili! Bot inaweza kujibu maswali kutoka documents za Kiswahili kwa usahihi wa 89%. Stack: LangChain + Claude API + Pinecone. Code iko GitHub — link kwenye comments. Shukrani jamii! 🇹🇿", likes: 87, comments: 15, bookmarks: 32, liked: true, bookmarked: false, commentList: [{ author: "Amina H.", color: "#4ECDC4", text: "Hongera sana Jonas!! Hii ni milestone kubwa." }, { author: "Davy M.", color: "#F5A623", text: "This is exactly what Tanzania needs. Nzuri sana bro!" }] },
  { id: 3, author: "Fatuma Said", handle: "fatumasaid", avatar: "FS", color: "#A78BFA", role: "Data Scientist · Zanzibar", time: "Masaa 3 yaliyopita", category: "habari", tag: "Habari", content: "📡 Breaking: Tanzania inapanga kuanzisha AI Innovation Hub Dar es Salaam — investment ya $2M kutoka serikali na private sector. Tunaomba maoni yenu: ni nini tunataka kuona kwenye hub hii? #TanzaniaAI #Innovation", likes: 142, comments: 31, bookmarks: 67, liked: false, bookmarked: true, commentList: [{ author: "Jonas K.", color: "#F87171", text: "Tunahitaji training programs kwa vijana ambao hawana degree!" }, { author: "Amina H.", color: "#4ECDC4", text: "Na research lab yenye compute resources accessible kwa wote 🙌" }] },
  { id: 4, author: "David Mkwawa", handle: "davidmkwawa", avatar: "DM2", color: "#34D399", role: "AI Dev · Arusha", time: "Masaa 5 yaliyopita", category: "kazi", tag: "Kazi", content: "🔍 HIRING: Tunatafuta AI Developer kwa startup yetu ya AgriTech hapa Arusha. Requirements: Python, basic ML, interest ya agriculture. Remote-friendly. Mshahara: TZS 1.5M - 2.5M/mwezi. #JobsTanzania #AIJobs", likes: 56, comments: 22, bookmarks: 41, liked: false, bookmarked: false, commentList: [{ author: "Fatuma S.", color: "#A78BFA", text: "Nimeshare kwa WhatsApp group yangu. Great opportunity!" }] },
];

const MEMBERS_ONLINE = [
  { name: "Amina Hassan", color: "#4ECDC4", role: "ML Eng", avatar: "AH" },
  { name: "Jonas Kimaro", color: "#F87171", role: "AI Arch", avatar: "JK" },
  { name: "Grace Mushi", color: "#60A5FA", role: "Student", avatar: "GM" },
  { name: "Said Omar", color: "#34D399", role: "Dev", avatar: "SO" },
  { name: "Lilian Mbise", color: "#F59E0B", role: "Designer", avatar: "LM" },
];

const TRENDING = ["#SwahiliNLP", "#TanzaniaAI", "#ClaudeAPI", "#AIJobs", "#RAGSystem", "#LLMs", "#OpenSource"];
const TRENDING_COUNTS = [234, 189, 156, 134, 98, 87, 65];

const EVENTS = [
  { name: "Tanzania AI Hackathon 2025", date: "Mar 15", type: "Hackathon", color: "#F5A623" },
  { name: "AI for Agriculture Webinar", date: "Mar 22", type: "Webinar", color: "#4ECDC4" },
  { name: "JamiiAI Monthly Meetup DSM", date: "Apr 1", type: "Meetup", color: "#A78BFA" },
];

const CHALLENGES = [
  { id: 1, title: "Swahili Sentiment Analysis Challenge", org: "JamiiAI + UDSM", prize: "TZS 5,000,000", deadline: "Apr 15, 2025", category: "NLP", difficulty: "Kati", participants: 34, status: "open", desc: "Jenga model inayoweza kuchambua hisia (positive/negative/neutral) katika maandishi ya Kiswahili. Dataset itatolewa. Judging itafanyika kwa accuracy na F1 score.", tags: ["NLP", "Swahili", "Classification"], color: "#4ECDC4" },
  { id: 2, title: "AI kwa Afya: Disease Detection Tanzania", org: "MOH Tanzania + JamiiAI", prize: "TZS 10,000,000", deadline: "May 1, 2025", category: "Computer Vision", difficulty: "Ngumu", participants: 18, status: "open", desc: "Tumia computer vision kujenga system inayoweza kugundua malaria, TB au dengue kutoka clinical images. Collaboration na madaktari inaruhusiwa.", tags: ["Healthcare", "CV", "Impact"], color: "#F87171" },
  { id: 3, title: "AgriBot: AI Assistant kwa Wakulima", org: "FAO Tanzania", prize: "TZS 3,000,000", deadline: "Mar 30, 2025", category: "AI Agent", difficulty: "Rahisi", participants: 67, status: "open", desc: "Jenga WhatsApp/SMS chatbot inayosaidia wakulima wa Tanzania kwa Kiswahili — hali ya hewa, magonjwa ya mazao, bei za soko. LLM yoyote inaruhusiwa.", tags: ["Agriculture", "Chatbot", "LLM"], color: "#34D399" },
  { id: 4, title: "Fake News Detector — Habari za Tanzania", org: "JamiiAI Community", prize: "TZS 2,000,000", deadline: "Feb 28, 2025", category: "NLP", difficulty: "Kati", participants: 89, status: "closed", desc: "Challenge hii imefungwa. Mshindi: Team SwahiliAI na accuracy ya 94.2%. Hongera! 🏆", tags: ["NLP", "Media", "Misinformation"], color: "#A78BFA" },
];

const STARTUPS = [
  { name: "FarmSmart AI", logo: "FS", color: "#34D399", sector: "AgriTech", stage: "Seed", loc: "Arusha", founded: 2023, team: 8, desc: "AI-powered platform inayosaidia wakulima Tanzania kwa maamuzi ya kilimo — hali ya hewa, magonjwa, na bei za soko.", tech: ["Computer Vision", "LLMs", "IoT"], funding: "TZS 120M", hiring: true },
  { name: "MedAI Tanzania", logo: "MA", color: "#F87171", sector: "HealthTech", stage: "Pre-seed", loc: "Dar es Salaam", founded: 2024, team: 4, desc: "Telemedicine platform na AI diagnosis assistant kwa hospitali ndogo za Tanzania. Inafanya kazi offline pia.", tech: ["ML", "NLP", "Mobile"], funding: "Bootstrapped", hiring: true },
  { name: "EduBot Swahili", logo: "ES", color: "#A78BFA", sector: "EdTech", stage: "MVP", loc: "Dodoma", founded: 2024, team: 3, desc: "AI tutor anayefundisha kwa Kiswahili — mathematics, science, na Kiingereza kwa wanafunzi wa shule za msingi na sekondari.", tech: ["LLMs", "RAG", "TTS"], funding: "Grant NALA", hiring: false },
  { name: "SafiriAI", logo: "SA", color: "#60A5FA", sector: "TravelTech", stage: "Growth", loc: "Dar es Salaam", founded: 2022, team: 15, desc: "AI travel assistant wa kwanza wa Tanzania — safari planning, hotel recommendations, na transport optimization kwa East Africa.", tech: ["GPT-4", "Recommendation", "Maps API"], funding: "TZS 450M", hiring: true },
  { name: "JazaKash AI", logo: "JK", color: "#F5A623", sector: "FinTech", stage: "Series A", loc: "Dar es Salaam", founded: 2021, team: 32, desc: "AI credit scoring kwa watu wasio na historia ya benki Tanzania. Inatumia mobile money data na ML kuamua mikopo.", tech: ["ML", "Big Data", "M-Pesa API"], funding: "TZS 2.1B", hiring: true },
  { name: "SwahiliVoice", logo: "SV", color: "#F59E0B", sector: "Language Tech", stage: "Seed", loc: "Zanzibar", founded: 2023, team: 6, desc: "Speech recognition na TTS kwa Kiswahili. Tunatengeneza dataset kubwa ya sauti za Kiswahili kwa open source.", tech: ["ASR", "TTS", "NLP"], funding: "TZS 80M", hiring: false },
];

const INSTITUTIONS = [
  { name: "University of Dar es Salaam", short: "UDSM", logo: "UD", color: "#4ECDC4", type: "University", loc: "Dar es Salaam", dept: "CS & AI Research Lab", focus: ["NLP", "Computer Vision", "Data Science"], students: 350, researchers: 28, desc: "Chuo kikuu kikubwa zaidi Tanzania chenye AI research lab mpya yenye GPUs 8x A100. Research: Swahili NLP, medical AI, agricultural AI." },
  { name: "Ardhi University", short: "ARU", logo: "AU", color: "#A78BFA", type: "University", loc: "Dar es Salaam", dept: "GIS & Spatial AI", focus: ["Spatial AI", "Remote Sensing", "GIS"], students: 120, researchers: 12, desc: "Maarufu kwa AI inayotumia satellite data kwa land management na urban planning Tanzania." },
  { name: "Nelson Mandela Institution", short: "NMI", logo: "NM", color: "#34D399", type: "Research Institute", loc: "Arusha", dept: "AI for Development", focus: ["AI4D", "Policy", "Ethics"], students: null, researchers: 45, desc: "Research institute inayofanya kazi kwenye AI for Development — jinsi AI inavyoweza kusaidia maendeleo ya Afrika." },
  { name: "COSTECH", short: "COS", logo: "CO", color: "#F5A623", type: "Government Body", loc: "Dar es Salaam", dept: "Innovation & Technology", focus: ["Innovation", "Grants", "Policy"], students: null, researchers: null, desc: "Commission for Science and Technology — hutoa grants kwa AI projects Tanzania na kusimamia sera za teknolojia." },
  { name: "AIMS Tanzania", short: "AIMS-TZ", logo: "AI", color: "#F87171", type: "Research Institute", loc: "Dar es Salaam", dept: "Mathematics & AI", focus: ["Mathematics", "ML Theory", "Statistics"], students: 60, researchers: 20, desc: "AIMS Tanzania inafundisha AI kwa msingi wa hisabati. Wahitimu wengi wanaenda kusomea PhD nje ya nchi." },
  { name: "Zindua Afrika", short: "ZA", logo: "ZA", color: "#60A5FA", type: "NGO / Training", loc: "Nairobi/DSM", dept: "Tech Training", focus: ["Coding", "AI Basics", "Bootcamp"], students: 800, researchers: null, desc: "Bootcamp inayofundisha AI na coding kwa vijana wa Afrika Mashariki. Wamefunza 800+ developers Tanzania." },
];

const RESOURCES = [
  { id: 1, title: "Swahili NLP Dataset — 50K sentences", type: "Dataset", author: "UDSM Research Lab", downloads: 1240, stars: 89, tags: ["NLP", "Swahili", "Free"], color: "#4ECDC4", desc: "Dataset kubwa ya Kiswahili kwa NLP tasks. CC BY 4.0 license." },
  { id: 2, title: "Kuanza na Claude API — Mwongozo kwa Kiswahili", type: "Tutorial", author: "Davy Mwangi", downloads: 567, stars: 134, tags: ["Claude", "API", "Beginner"], color: "#F5A623", desc: "Tutorial ya kina jinsi ya kuanza kutumia Claude API. Code examples, prompting tips, use cases za Tanzania." },
  { id: 3, title: "ML Roadmap kwa Waanzilishi wa Tanzania", type: "Guide", author: "JamiiAI Team", downloads: 2300, stars: 445, tags: ["Learning", "Roadmap", "Free"], color: "#34D399", desc: "Roadmap kamili ya kujifunza Machine Learning — Python basics hadi deployment. Resources zote za bure." },
  { id: 4, title: "Agricultural AI Dataset — Tanzania Crops", type: "Dataset", author: "FarmSmart AI", downloads: 340, stars: 56, tags: ["Agriculture", "Computer Vision", "Tanzania"], color: "#A78BFA", desc: "Images 15,000+ za mazao ya Tanzania na labels za magonjwa. Kwa computer vision projects." },
  { id: 5, title: "LangChain + Swahili — Building RAG Systems", type: "Tutorial", author: "Jonas Kimaro", downloads: 890, stars: 201, tags: ["LangChain", "RAG", "Advanced"], color: "#F87171", desc: "Video tutorial + code jinsi ya kujenga RAG system inayoweza ku-process documents za Kiswahili." },
  { id: 6, title: "AI Ethics kwa Muktadha wa Afrika", type: "Research Paper", author: "NMI Research", downloads: 430, stars: 78, tags: ["Ethics", "Policy", "Research"], color: "#60A5FA", desc: "Research paper inayochunguza AI ethics kwa muktadha wa Afrika — maadili, usawa, na haki." },
  { id: 7, title: "Tanzania AI Startup Funding Guide", type: "Guide", author: "COSTECH", downloads: 1100, stars: 167, tags: ["Startup", "Funding", "Business"], color: "#F59E0B", desc: "Mwongozo wa kupata funding kwa AI startup Tanzania — grants, angel investors, accelerators za Afrika." },
  { id: 8, title: "Swahili Speech Dataset — 200hrs Audio", type: "Dataset", author: "SwahiliVoice", downloads: 760, stars: 312, tags: ["Speech", "ASR", "Open Source"], color: "#34D399", desc: "200 hours za recorded Kiswahili speech — accents mbalimbali za Tanzania. Apache 2.0." },
];

const NAV_ITEMS = [
  { id: "nyumbani",    icon: "⌂",  label: "Nyumbani",       badge: null },
  { id: "gundua",     icon: "◎",  label: "Gundua",         badge: null },
  { id: "wataalamu",  icon: "◈",  label: "Wataalamu",      badge: null },
  { id: "startups",   icon: "◉",  label: "Startups",       badge: null },
  { id: "vyuo",       icon: "◫",  label: "Vyuo & Taasisi", badge: null },
  { id: "changamoto", icon: "◆",  label: "Changamoto",     badge: "4"  },
  { id: "rasilimali", icon: "◧",  label: "Rasilimali",     badge: null },
  { id: "habari",     icon: "◉",  label: "Habari",         badge: "3"  },
  { id: "matukio",    icon: "◷",  label: "Matukio",        badge: "2"  },
  { id: "ujumbe",     icon: "◻",  label: "Ujumbe",         badge: "5"  },
];

const TAG_COLORS = {
  swali:  { bg: "rgba(96,165,250,0.12)",  color: "#60A5FA" },
  mradi:  { bg: "rgba(52,211,153,0.12)",  color: "#34D399" },
  habari: { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
  kazi:   { bg: "rgba(245,166,35,0.12)",  color: "#F5A623" },
};

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
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: size * 0.3, color: "#DCE6F0", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Pill({ label, bg, color }) {
  return <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>{label}</span>;
}

function SectionHead({ main, accent }) {
  return <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>{main} <span style={{ color: accent }}></span>{accent && <span style={{ color: accent }}>{accent}</span>}</h2>;
}

function SkillTag({ label }) {
  return <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "rgba(220,230,240,0.55)" }}>{label}</span>;
}

// ─── POST CARD ────────────────────────────────────────────────────────────────

function PostCard({ post, onLike, onBookmark, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const ts = TAG_COLORS[post.category] || TAG_COLORS.swali;

  return (
    <div className="post-card" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22, marginBottom: 12, transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <Av initials={post.avatar} color={post.color} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{post.author}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.3)" }}>@{post.handle}</span>
            <Pill label={post.tag} bg={ts.bg} color={ts.color} />
          </div>
          <div style={{ fontSize: 12, color: "rgba(220,230,240,0.38)", marginTop: 2, fontFamily: "'Space Mono',monospace" }}>{post.role} · {post.time}</div>
        </div>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(220,230,240,0.88)", marginBottom: 18, paddingLeft: 56 }}>{post.content}</p>
      <div style={{ display: "flex", gap: 6, paddingLeft: 56 }}>
        {[
          { icon: post.liked ? "♥" : "♡", count: post.likes, active: post.liked, ac: "#F5A623", fn: () => onLike(post.id) },
          { icon: "◻", count: post.comments, active: showComments, ac: "#4ECDC4", fn: () => setShowComments(!showComments) },
          { icon: post.bookmarked ? "◆" : "◇", count: post.bookmarks, active: post.bookmarked, ac: "#A78BFA", fn: () => onBookmark(post.id) },
        ].map((btn, i) => (
          <button key={i} onClick={btn.fn} style={{ display: "flex", alignItems: "center", gap: 6, background: btn.active ? `${btn.ac}18` : "transparent", border: `1px solid ${btn.active ? btn.ac + "50" : "rgba(255,255,255,0.07)"}`, color: btn.active ? btn.ac : "rgba(220,230,240,0.4)", padding: "7px 13px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono',monospace", fontWeight: 700, transition: "all 0.2s" }}>{btn.icon} {btn.count}</button>
        ))}
        <button style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(220,230,240,0.28)", padding: "7px 13px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>↗</button>
      </div>
      {showComments && (
        <div style={{ marginTop: 18, paddingLeft: 56, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 16 }}>
          {post.commentList.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <Av initials={c.author.split(" ").map(w => w[0]).join("")} color={c.color} size={28} />
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "9px 13px", flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: c.color }}>{c.author}</span>
                <p style={{ fontSize: 13, color: "rgba(220,230,240,0.7)", marginTop: 3, lineHeight: 1.5 }}>{c.text}</p>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <Av initials={ME.avatar} color={ME.color} size={28} />
            <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newComment.trim()) { onComment(post.id, newComment); setNewComment(""); } }} placeholder="Andika jibu..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "8px 12px", color: "#DCE6F0", fontSize: 13, fontFamily: "'Syne',sans-serif", outline: "none" }} />
            <button onClick={() => { if (newComment.trim()) { onComment(post.id, newComment); setNewComment(""); } }} style={{ background: "#F5A623", color: "#DCE6F0", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13 }}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUB-PAGES ────────────────────────────────────────────────────────────────

function WataalaMuPage() {
  const devs = [
    { name: "Amina Hassan", avatar: "AH", color: "#4ECDC4", role: "ML Engineer", loc: "Dar es Salaam", skills: ["Python", "TensorFlow", "NLP", "LLMs"], rating: 4.9, projects: 12, rate: "TZS 45K/hr", available: true, bio: "Specialized katika NLP na low-resource language models. PhD candidate UDSM." },
    { name: "Jonas Kimaro", avatar: "JK", color: "#F87171", role: "AI Architect", loc: "Dodoma", skills: ["LangChain", "RAG", "AWS", "Claude API"], rating: 4.8, projects: 20, rate: "TZS 60K/hr", available: true, bio: "Ninajenga AI systems kwa enterprises. 5+ years experience." },
    { name: "Fatuma Said", avatar: "FS", color: "#A78BFA", role: "Data Scientist", loc: "Zanzibar", skills: ["Pandas", "Computer Vision", "PyTorch"], rating: 5.0, projects: 15, rate: "TZS 50K/hr", available: false, bio: "Computer vision na data pipeline specialist. Open source contributor." },
    { name: "David Mkwawa", avatar: "DM2", color: "#34D399", role: "AI Dev", loc: "Arusha", skills: ["Node.js", "OpenAI", "Vector DB"], rating: 4.7, projects: 8, rate: "TZS 35K/hr", available: true, bio: "Full-stack AI developer. Najua kuintegrisha AI kwenye apps za biashara." },
    { name: "Grace Mushi", avatar: "GM", color: "#60A5FA", role: "AI Researcher", loc: "Dar es Salaam", skills: ["Research", "Transformers", "HuggingFace"], rating: 4.6, projects: 5, rate: "TZS 28K/hr", available: true, bio: "PhD candidate. Research focus: AI kwa lugha za Afrika." },
    { name: "Said Omar", avatar: "SO", color: "#F59E0B", role: "MLOps Engineer", loc: "Mwanza", skills: ["Docker", "Kubernetes", "MLflow"], rating: 4.8, projects: 11, rate: "TZS 55K/hr", available: false, bio: "Nasaidia teams deploy na scale ML models kwa production." },
  ];
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Wataalamu wa AI <span style={{ color: "#4ECDC4" }}>Tanzania</span></h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Verified AI developers — hire moja kwa moja</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {devs.map(dev => (
          <div key={dev.name} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18, transition: "all 0.2s", cursor: "pointer" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <Av initials={dev.avatar} color={dev.color} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{dev.name}</span>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: dev.available ? "#34D399" : "#444", marginLeft: "auto" }} />
                </div>
                <div style={{ color: "rgba(220,230,240,0.4)", fontSize: 11, fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{dev.role} · {dev.loc}</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "rgba(220,230,240,0.55)", lineHeight: 1.5, marginBottom: 10 }}>{dev.bio}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
              {dev.skills.map(s => <SkillTag key={s} label={s} />)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#F5A623" }}>⭐ {dev.rating}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#4ECDC4" }}>{dev.rate}</span>
              </div>
              <button style={{ background: dev.available ? "#F5A623" : "rgba(255,255,255,0.04)", color: dev.available ? "#DCE6F0" : "rgba(220,230,240,0.2)", border: "none", padding: "6px 14px", borderRadius: 7, cursor: dev.available ? "pointer" : "default", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11 }}>{dev.available ? "Hire →" : "Busy"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StartupsPage() {
  const sectors = ["Zote", "AgriTech", "HealthTech", "EdTech", "FinTech", "TravelTech", "Language Tech"];
  const [filter, setFilter] = useState("Zote");
  const filtered = filter === "Zote" ? STARTUPS : STARTUPS.filter(s => s.sector === filter);
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>AI Startups <span style={{ color: "#F5A623" }}>Tanzania</span></h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Makampuni yanayojenga mustakabali wa Tanzania</p>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 20, flexWrap: "wrap" }}>
        {sectors.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${filter === s ? "#F5A623" : "rgba(255,255,255,0.09)"}`, background: filter === s ? "rgba(245,166,35,0.12)" : "transparent", color: filter === s ? "#F5A623" : "rgba(220,230,240,0.4)", fontFamily: "'Space Mono',monospace", transition: "all 0.2s" }}>{s}</button>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(st => (
          <div key={st.name} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: `${st.color}20`, border: `1px solid ${st.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 14, color: st.color, flexShrink: 0 }}>{st.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{st.name}</span>
                  <Pill label={st.sector} bg={`${st.color}18`} color={st.color} />
                  <Pill label={st.stage} bg="rgba(255,255,255,0.06)" color="rgba(220,230,240,0.5)" />
                  {st.hiring && <Pill label="🔍 Hiring" bg="rgba(52,211,153,0.12)" color="#34D399" />}
                  <span style={{ marginLeft: "auto", fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>📍 {st.loc} · {st.founded}</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(220,230,240,0.6)", lineHeight: 1.6, marginBottom: 12 }}>{st.desc}</p>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 5 }}>{st.tech.map(t => <SkillTag key={t} label={t} />)}</div>
                  <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(220,230,240,0.4)" }}>👥 {st.team}</span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#34D399" }}>💰 {st.funding}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VyuoPage() {
  const types = ["Zote", "University", "Research Institute", "Government Body", "NGO / Training"];
  const [filter, setFilter] = useState("Zote");
  const filtered = filter === "Zote" ? INSTITUTIONS : INSTITUTIONS.filter(i => i.type === filter);
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Vyuo & <span style={{ color: "#60A5FA" }}>Taasisi</span></h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Taasisi za AI, utafiti na elimu Tanzania</p>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 20, flexWrap: "wrap" }}>
        {types.map(t => <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${filter === t ? "#60A5FA" : "rgba(255,255,255,0.09)"}`, background: filter === t ? "rgba(96,165,250,0.12)" : "transparent", color: filter === t ? "#60A5FA" : "rgba(220,230,240,0.4)", fontFamily: "'Space Mono',monospace", transition: "all 0.2s" }}>{t}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filtered.map(inst => (
          <div key={inst.name} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${inst.color}20`, border: `1px solid ${inst.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 13, color: inst.color, flexShrink: 0 }}>{inst.logo}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>{inst.name}</div>
                <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                  <Pill label={inst.type} bg={`${inst.color}18`} color={inst.color} />
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: inst.color, marginBottom: 6 }}>{inst.dept} · 📍 {inst.loc}</div>
            <p style={{ fontSize: 12, color: "rgba(220,230,240,0.55)", lineHeight: 1.6, marginBottom: 12 }}>{inst.desc}</p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {inst.focus.map(f => <SkillTag key={f} label={f} />)}
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {inst.students && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>👩‍🎓 {inst.students}</span>}
              {inst.researchers && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>🔬 {inst.researchers} researchers</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangamotoPage() {
  const [selected, setSelected] = useState(null);
  const diffColor = { Rahisi: "#34D399", Kati: "#F5A623", Ngumu: "#F87171" };
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Changamoto za <span style={{ color: "#F5A623" }}>AI Tanzania</span></h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Shindana, jenga solutions, pata zawadi</p>
      </div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.14)", borderRadius: 12, overflow: "hidden" }}>
        {[["3", "Wazi"], ["208", "Washiriki"], ["TZS 20M+", "Prize Pool"], ["1", "Imekwisha"]].map(([num, label], i) => (
          <div key={label} style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRight: i < 3 ? "1px solid rgba(245,166,35,0.1)" : "none" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#F5A623", fontFamily: "'Space Mono',monospace" }}>{num}</div>
            <div style={{ fontSize: 10, color: "rgba(220,230,240,0.4)", marginTop: 2, fontFamily: "'Space Mono',monospace" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CHALLENGES.map(ch => (
          <div key={ch.id} onClick={() => setSelected(selected?.id === ch.id ? null : ch)} style={{ background: selected?.id === ch.id ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)", border: `1px solid ${selected?.id === ch.id ? ch.color + "45" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "20px 22px", cursor: "pointer", transition: "all 0.2s", opacity: ch.status === "closed" ? 0.6 : 1 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ width: 4, borderRadius: 2, background: ch.color, alignSelf: "stretch", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                  <Pill label={ch.category} bg={`${ch.color}18`} color={ch.color} />
                  <Pill label={ch.difficulty} bg={`${diffColor[ch.difficulty]}18`} color={diffColor[ch.difficulty]} />
                  {ch.status === "open" ? <Pill label="🟢 Wazi" bg="rgba(52,211,153,0.12)" color="#34D399" /> : <Pill label="🔴 Imefungwa" bg="rgba(80,80,80,0.15)" color="#666" />}
                  <span style={{ marginLeft: "auto", fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>👥 {ch.participants}</span>
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", marginBottom: 4 }}>{ch.title}</h3>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)", marginBottom: 8 }}>{ch.org} · Deadline: {ch.deadline}</div>
                <p style={{ fontSize: 13, color: "rgba(220,230,240,0.6)", lineHeight: 1.6 }}>{ch.desc}</p>
                {selected?.id === ch.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                      {ch.tags.map(t => <SkillTag key={t} label={t} />)}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {ch.status === "open" && <button style={{ background: "#F5A623", color: "#DCE6F0", border: "none", padding: "10px 22px", borderRadius: 9, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13 }}>Jiandikishe →</button>}
                      <button style={{ background: "transparent", color: "rgba(220,230,240,0.55)", border: "1px solid rgba(255,255,255,0.09)", padding: "10px 22px", borderRadius: 9, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>Maelezo</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#F5A623", fontFamily: "'Space Mono',monospace" }}>{ch.prize}</div>
                <div style={{ fontSize: 10, color: "rgba(220,230,240,0.3)", fontFamily: "'Space Mono',monospace", marginTop: 2 }}>Prize</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RasilimaliPage() {
  const types = ["Zote", "Dataset", "Tutorial", "Guide", "Research Paper"];
  const [filter, setFilter] = useState("Zote");
  const filtered = filter === "Zote" ? RESOURCES : RESOURCES.filter(r => r.type === filter);
  const typeColor = { Dataset: "#4ECDC4", Tutorial: "#F5A623", Guide: "#34D399", "Research Paper": "#A78BFA" };
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Rasilimali za <span style={{ color: "#34D399" }}>AI Tanzania</span></h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Datasets, tutorials, guides — nyingi bure</p>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 20, flexWrap: "wrap" }}>
        {types.map(t => <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${filter === t ? "#34D399" : "rgba(255,255,255,0.09)"}`, background: filter === t ? "rgba(52,211,153,0.12)" : "transparent", color: filter === t ? "#34D399" : "rgba(220,230,240,0.4)", fontFamily: "'Space Mono',monospace", transition: "all 0.2s" }}>{t}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filtered.map(r => {
          const tc = typeColor[r.type] || "#F5A623";
          return (
            <div key={r.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <Pill label={r.type} bg={`${tc}18`} color={tc} />
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#F5A623" }}>⭐ {r.stars}</span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.35)" }}>↓ {r.downloads.toLocaleString()}</span>
                </div>
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em", marginBottom: 5, lineHeight: 1.3, flex: 1 }}>{r.title}</h3>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.3)", marginBottom: 8 }}>by {r.author}</div>
              <p style={{ fontSize: 12, color: "rgba(220,230,240,0.52)", lineHeight: 1.6, marginBottom: 12 }}>{r.desc}</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                {r.tags.map(t => <SkillTag key={t} label={t} />)}
              </div>
              <button style={{ background: tc, color: "#DCE6F0", border: "none", padding: "8px", borderRadius: 8, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12, marginTop: "auto" }}>Pakua / Angalia →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HabariPage() {
  const news = [
    { id: 1, category: "Tanzania", title: "Tanzania inaanza AI Innovation Hub DSM — $2M investment", summary: "Serikali imeshirikiana na private sector kuanzisha hub ya kwanza ya AI ambayo itasaidia vijana kujifunza na kujenga solutions.", time: "Leo, 9:30 AM", hot: true, reads: 1240, color: "#F5A623" },
    { id: 2, category: "Global", title: "Claude 4 inabadilisha jinsi ya kujenga AI agents", summary: "Anthropic wamefungua Claude 4 na capabilities mpya. Developers wa Africa wanaona fursa kubwa.", time: "Jana, 3PM", hot: true, reads: 3450, color: "#4ECDC4" },
    { id: 3, category: "Jamii", title: "JamiiAI Hackathon — Registrations zimefunguliwa! Prize TZS 10M", summary: "Hackathon ya kwanza ya AI Tanzania Machi 15-17. Teams za 2-4 watu. Focus: AI solutions za Afrika.", time: "Jana, 11AM", hot: false, reads: 892, color: "#34D399" },
    { id: 4, category: "Global", title: "Meta wanafungua Llama 4 — multimodal, open source", summary: "Llama 4 model mpya parameters 400B inaweza process maandishi, picha, na sauti.", time: "2 siku zilizopita", hot: false, reads: 5670, color: "#A78BFA" },
    { id: 5, category: "Tanzania", title: "UDSM inafungua AI Research Lab — apply sasa", summary: "University of Dar es Salaam imefungua AI lab mpya na GPUs 8x A100. Students wa CS wanaweza apply.", time: "3 siku zilizopita", hot: false, reads: 678, color: "#F5A623" },
  ];
  const catC = { Tanzania: { bg: "rgba(245,166,35,0.12)", color: "#F5A623" }, Global: { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" }, Jamii: { bg: "rgba(78,205,196,0.12)", color: "#4ECDC4" } };
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Habari za AI <span style={{ color: "#A78BFA" }}>Tanzania & Dunia</span></h2>
        <p style={{ color: "rgba(220,230,240,0.45)", fontSize: 13 }}>Uwe wa kwanza kujua kinachoendelea</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {news.map(item => (
          <div key={item.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, flexWrap: "wrap" }}>
                <Pill label={item.category} bg={catC[item.category]?.bg} color={catC[item.category]?.color} />
                {item.hot && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#F87171" }}>🔥 HOT</span>}
                <span style={{ marginLeft: "auto", fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.28)" }}>{item.time}</span>
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", marginBottom: 6, lineHeight: 1.3 }}>{item.title}</h3>
              <p style={{ color: "rgba(220,230,240,0.52)", fontSize: 13, lineHeight: 1.6 }}>{item.summary}</p>
              <div style={{ marginTop: 8, fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.25)" }}>{item.reads.toLocaleString()} wasomaji</div>
            </div>
            <div style={{ width: 4, height: 54, borderRadius: 2, background: item.color, opacity: 0.55 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function JamiiAICommunity() {
  const [activeNav, setActiveNav]         = useState("nyumbani");
  const [activeFilter, setActiveFilter]   = useState("all");
  const [posts, setPosts]                 = useState(INITIAL_POSTS);
  const [composerText, setComposerText]   = useState("");
  const [composerCat, setComposerCat]     = useState("swali");
  const [showOptions, setShowOptions]     = useState(false);
  const [notification, setNotification]   = useState(null);

  const notify = msg => { setNotification(msg); setTimeout(() => setNotification(null), 2500); };

  const filteredPosts = activeFilter === "all" ? posts : posts.filter(p => p.category === activeFilter);

  const handleLike     = id => setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  const handleBookmark = id => { setPosts(ps => ps.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked, bookmarks: p.bookmarked ? p.bookmarks - 1 : p.bookmarks + 1 } : p)); notify("◆ Umehifadhi post hii"); };
  const handleComment  = (id, text) => setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: p.comments + 1, commentList: [...p.commentList, { author: ME.name, color: ME.color, text }] } : p));
  const handlePost     = () => {
    if (!composerText.trim()) return;
    const tagMap = { swali: "Swali", mradi: "Mradi", habari: "Habari", kazi: "Kazi" };
    setPosts(ps => [{ id: Date.now(), author: ME.name, handle: ME.handle, avatar: ME.avatar, color: ME.color, role: `${ME.role} · ${ME.loc}`, time: "Sasa hivi", category: composerCat, tag: tagMap[composerCat], content: composerText, likes: 0, comments: 0, bookmarks: 0, liked: false, bookmarked: false, commentList: [] }, ...ps]);
    setComposerText(""); setShowOptions(false); notify("✓ Post yako imechapishwa!");
  };

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", background: "#0A0F1C", color: "#DCE6F0", minHeight: "100vh", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar{width:3px}  ::-webkit-scrollbar-thumb{background:#F5A623;border-radius:2px}
        .post-card:hover{border-color:rgba(245,166,35,0.2)}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;cursor:pointer;transition:all 0.18s}
        .nav-item:hover{background:rgba(255,255,255,0.04)}
        .nav-item.active{background:rgba(245,166,35,0.1);color:#F5A623}
        .ftab{padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s;border:1px solid transparent}
        .ftab:hover{background:rgba(255,255,255,0.04)}
        .ftab.active{background:rgba(245,166,35,0.1);color:#F5A623;border-color:rgba(245,166,35,0.2)}
        textarea{resize:none} textarea:focus,input:focus,button:focus{outline:none}
        @keyframes notif{0%{opacity:0;transform:translateX(20px)}15%{opacity:1;transform:translateX(0)}85%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(20px)}}
        @keyframes fup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fin{animation:fup 0.2s ease forwards}
      `}</style>

      {notification && <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999, background: "#F5A623", color: "#DCE6F0", padding: "11px 18px", borderRadius: 9, fontWeight: 800, fontSize: 13, fontFamily: "'Space Mono',monospace", animation: "notif 2.5s ease forwards", pointerEvents: "none" }}>{notification}</div>}

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{ width: 230, flexShrink: 0, height: "100vh", position: "sticky", top: 0, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, paddingLeft: 6 }}>
          <div style={{ width: 32, height: 32, background: "#F5A623", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🌍</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>Jamii<span style={{ color: "#F5A623" }}>AI</span></span>
        </div>
        {NAV_ITEMS.map(item => (
          <div key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)}>
            <span style={{ fontSize: 13, fontFamily: "'Space Mono',monospace", opacity: activeNav === item.id ? 1 : 0.4 }}>{item.icon}</span>
            <span style={{ fontSize: 12, fontWeight: activeNav === item.id ? 800 : 600, flex: 1, color: activeNav === item.id ? "#F5A623" : "rgba(220,230,240,0.72)" }}>{item.label}</span>
            {item.badge && <span style={{ background: "#F5A623", color: "#DCE6F0", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 9, fontFamily: "'Space Mono',monospace" }}>{item.badge}</span>}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 6px", borderRadius: 9, cursor: "pointer" }}>
            <Av initials={ME.avatar} color={ME.color} size={34} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{ME.name}</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.38)" }}>@{ME.handle}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: 670, borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", height: "100vh" }}>
        <div style={{ position: "sticky", top: 0, background: "rgba(10,15,28,0.93)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "15px 22px", zIndex: 10 }}>
          <h1 style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>{PAGE_TITLE[activeNav]}</h1>
        </div>
        <div style={{ padding: "18px 22px" }}>

          {/* HOME / GUNDUA */}
          {(activeNav === "nyumbani" || activeNav === "gundua") && (
            <>
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18, marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Av initials={ME.avatar} color={ME.color} size={42} />
                  <div style={{ flex: 1 }}>
                    <textarea value={composerText} onChange={e => { setComposerText(e.target.value); if (e.target.value.length > 0) setShowOptions(true); }} placeholder="Shiriki kitu na jamii — swali, mradi, habari, au fursa ya kazi 🌍" rows={composerText.length > 0 || showOptions ? 3 : 1} style={{ width: "100%", background: "transparent", border: "none", color: "#DCE6F0", fontFamily: "'Syne',sans-serif", fontSize: 14, lineHeight: 1.65 }} />
                    {showOptions && (
                      <div className="fin" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(220,230,240,0.38)" }}>Aina:</span>
                        {Object.entries({ swali: "Swali", mradi: "Mradi", habari: "Habari", kazi: "Kazi" }).map(([k, v]) => {
                          const tc = TAG_COLORS[k];
                          return <button key={k} onClick={() => setComposerCat(k)} style={{ padding: "3px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${composerCat === k ? tc.color : "rgba(255,255,255,0.09)"}`, background: composerCat === k ? tc.bg : "transparent", color: composerCat === k ? tc.color : "rgba(220,230,240,0.38)", fontFamily: "'Space Mono',monospace", transition: "all 0.2s" }}>{v}</button>;
                        })}
                        <button onClick={handlePost} style={{ marginLeft: "auto", background: composerText.trim() ? "#F5A623" : "rgba(255,255,255,0.04)", color: composerText.trim() ? "#DCE6F0" : "rgba(220,230,240,0.2)", border: "none", padding: "8px 20px", borderRadius: 8, cursor: composerText.trim() ? "pointer" : "default", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, transition: "all 0.2s" }}>Chapisha →</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                {FILTER_TABS.map(tab => <span key={tab.id} className={`ftab ${activeFilter === tab.id ? "active" : ""}`} onClick={() => setActiveFilter(tab.id)} style={{ color: activeFilter === tab.id ? "#F5A623" : "rgba(220,230,240,0.5)" }}>{tab.label}</span>)}
              </div>
              {filteredPosts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} onBookmark={handleBookmark} onComment={handleComment} />)}
            </>
          )}

          {activeNav === "wataalamu"  && <WataalaMuPage />}
          {activeNav === "startups"   && <StartupsPage />}
          {activeNav === "vyuo"       && <VyuoPage />}
          {activeNav === "changamoto" && <ChangamotoPage />}
          {activeNav === "rasilimali" && <RasilimaliPage />}
          {activeNav === "habari"     && <HabariPage />}

          {(activeNav === "matukio" || activeNav === "ujumbe") && (
            <div style={{ textAlign: "center", padding: "70px 30px" }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🔨</div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Inajengwa...</h3>
              <p style={{ color: "rgba(220,230,240,0.42)", lineHeight: 1.7, fontSize: 14 }}>Sehemu hii ipo njiani. Utajulishwa ukitayari!</p>
            </div>
          )}
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      <aside style={{ width: 280, flexShrink: 0, height: "100vh", overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <input placeholder="Tafuta JamiiAI..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px 10px 34px", color: "#DCE6F0", fontFamily: "'Syne',sans-serif", fontSize: 13 }} />
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(220,230,240,0.28)", fontSize: 13 }}>◎</span>
        </div>

        {/* Online */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.4)", letterSpacing: "0.1em" }}>ONLINE — {MEMBERS_ONLINE.length}</span>
          </div>
          {MEMBERS_ONLINE.map(m => (
            <div key={m.name} style={{ display: "flex", gap: 9, alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <Av initials={m.avatar} color={m.color} size={30} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 7, height: 7, borderRadius: "50%", background: "#34D399", border: "2px solid #0A0F1C" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{m.name}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.32)" }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trending */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.4)", letterSpacing: "0.1em", marginBottom: 12 }}>TRENDING SASA</div>
          {TRENDING.map((tag, i) => (
            <div key={tag} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < TRENDING.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: i < 3 ? "#F5A623" : "rgba(220,230,240,0.65)" }}>{tag}</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.27)" }}>{TRENDING_COUNTS[i]} posts</span>
            </div>
          ))}
        </div>

        {/* Events */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.4)", letterSpacing: "0.1em", marginBottom: 12 }}>MATUKIO YANAYOKUJA</div>
          {EVENTS.map(ev => (
            <div key={ev.name} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: `${ev.color}18`, border: `1px solid ${ev.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: ev.color, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{ev.date}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.3, marginBottom: 3 }}>{ev.name}</div>
                <Pill label={ev.type} bg={`${ev.color}18`} color={ev.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Quick links to new sections */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.4)", letterSpacing: "0.1em", marginBottom: 12 }}>SECTIONS MPYA</div>
          {[
            ["changamoto", "◆", "#F5A623", "Changamoto", "4 open"],
            ["rasilimali",  "◧", "#34D399", "Rasilimali",  "8 resources"],
            ["startups",    "◉", "#A78BFA", "Startups",    "6 startups"],
            ["vyuo",        "◫", "#60A5FA", "Vyuo & Taasisi", "6 taasisi"],
          ].map(([id, icon, color, label, sub]) => (
            <div key={id} onClick={() => setActiveNav(id)} style={{ display: "flex", gap: 9, alignItems: "center", padding: "8px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color, fontSize: 12, fontFamily: "'Space Mono',monospace" }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{label}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.3)" }}>{sub}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "rgba(220,230,240,0.22)", fontSize: 11 }}>→</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "rgba(220,230,240,0.18)", lineHeight: 1.9, paddingBottom: 8 }}>
          © 2025 JamiiAI · Made in Tanzania 🇹🇿<br />Privacy · Terms · Mawasiliano
        </div>
      </aside>
    </div>
  );
}
