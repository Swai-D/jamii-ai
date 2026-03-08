// ═══════════════════════════════════════════════════════════════════
//  JamiiAI Context Engine v3.1 — Trend-Aware Social Intelligence
//  File: context-engine.js
// ═══════════════════════════════════════════════════════════════════

const axios = require("axios");
const EventEmitter = require("events");

const CONFIG = {
  api: { baseUrl: process.env.API_BASE_URL || "http://localhost:4000/api" },
  cache: { ttl: 30 * 60 * 1000 }, // 30 min
  keywords: {
    tz:     ["Tanzania AI", "Sarufi", "UDSM", "Neurotech Africa", "JamiiAI", "Zanzibar tech"],
    africa: ["Africa AI", "East Africa tech", "Kenya AI", "Nairobi tech", "Lagos AI"],
    global: ["LLM", "Claude", "GPT-4", "Gemini", "open source AI", "AI agents", "RAG"],
  }
};

class TrendIntelligence extends EventEmitter {
  constructor() {
    super();
    this.cache = { trends: null, lastUpdate: null };
  }

  isCacheValid() {
    return this.cache.trends && (Date.now() - this.cache.lastUpdate) < CONFIG.cache.ttl;
  }

  async gatherContext(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid()) return this.cache.trends;

    console.log("📡 Gathering fresh context...");

    const [externalNews, platformData] = await Promise.allSettled([
      this.fetchExternalNews(),
      this.fetchPlatformContext(),
    ]);

    const news    = externalNews.status   === "fulfilled" ? externalNews.value   : [];
    const platform = platformData.status === "fulfilled" ? platformData.value    : {};

    const context = {
      timestamp: new Date().toISOString(),
      combined: this.rankTopics(news),
      platform,
    };

    this.cache = { trends: context, lastUpdate: Date.now() };
    this.emit("context:updated", context);
    return context;
  }

  // ── External news (GNews) ────────────────────────────────────────
  async fetchExternalNews() {
    const key = process.env.GNEWS_API_KEY;
    if (!key) return this.getFallbackTopics();

    try {
      const resp = await axios.get("https://gnews.io/api/v4/top-headlines", {
        params: { country: "tz", category: "technology", max: 10, apikey: key },
        timeout: 8000,
      });
      return (resp.data.articles || []).map(a => ({
        source:      "gnews",
        title:       a.title,
        description: a.description || "",
        url:         a.url || null,          // ← article link
        publishedAt: a.publishedAt,
      }));
    } catch {
      return this.getFallbackTopics();
    }
  }

  // ── Internal platform data — trending posts, active challenges ──
  async fetchPlatformContext() {
    try {
      const [postsRes, challengesRes] = await Promise.allSettled([
        axios.get(`${CONFIG.api.baseUrl}/posts?limit=10`, { timeout: 5000 }),
        axios.get(`${CONFIG.api.baseUrl}/challenges`,     { timeout: 5000 }),
      ]);

      const recentPosts = postsRes.status === "fulfilled"
        ? (postsRes.value.data.posts || []).map(p => p.content?.slice(0, 120))
        : [];

      const openChallenges = challengesRes.status === "fulfilled"
        ? (challengesRes.value.data || [])
            .filter(c => c.status === "open")
            .map(c => `${c.title} — ${c.prize || ""}`)
        : [];

      // IDs za posts ili agents waweze kuzipiga like/comment
      const postIds = postsRes.status === "fulfilled"
        ? (postsRes.value.data.posts || []).map(p => ({ id: p.id, content: p.content, userId: p.user_id }))
        : [];

      return { recentPosts, openChallenges, postIds };
    } catch {
      return { recentPosts: [], openChallenges: [], postIds: [] };
    }
  }

  // FIX: Ranking halisi — score inazingatia vitu vya kweli
  rankTopics(news) {
    if (!news.length) return this.getFallbackTopics();

    const tzKeywords   = CONFIG.keywords.tz.map(k => k.toLowerCase());
    const afKeywords   = CONFIG.keywords.africa.map(k => k.toLowerCase());
    const globalKeywords = CONFIG.keywords.global.map(k => k.toLowerCase());

    const scored = news.map(n => {
      const text = `${n.title} ${n.description}`.toLowerCase();
      let score = 50; // baseline

      // Tanzania/Africa content inafaa zaidi kwa JamiiAI
      if (tzKeywords.some(k => text.includes(k)))    score += 40;
      if (afKeywords.some(k => text.includes(k)))    score += 20;
      if (globalKeywords.some(k => text.includes(k))) score += 10;

      // Habari za leo ni bora kuliko za wiki iliyopita
      const hoursOld = (Date.now() - new Date(n.publishedAt).getTime()) / 3_600_000;
      if (hoursOld < 6)  score += 20;
      if (hoursOld < 24) score += 10;

      return { ...n, score, sampleContent: `${n.title}. ${n.description}`, sourceUrl: n.url, sourceTitle: n.title };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  // Fallback topics kama news API haipatikani
  getFallbackTopics() {
    const year = new Date().getFullYear();
    return [
      { sampleContent: `${year}: LLMs za open-source zinaendelea kushinda proprietary models — Afrika inaweza kujenga AI infrastructure yake bila kutegemea Silicon Valley.`, score: 80 },
      { sampleContent: `Swahili NLP imepiga hatua kubwa ${year} — models za Claude na Gemini zinazungumza Kiswahili vizuri zaidi kuliko wakati wowote.`, score: 75 },
      { sampleContent: `AI agents wanaanza kufanya kazi za kweli ${year} — automation ya workflows inasaidia startups ndogo Tanzania kushindana na makampuni makubwa.`, score: 70 },
      { sampleContent: `HealthAI Tanzania ${year}: zaidi ya startups 50 zinafanya kazi kwenye AI kwa afya, kutoka diagnosis hadi drug supply chain.`, score: 65 },
      { sampleContent: `${year} ndiyo mwaka wa AI kwa kilimo Afrika — wakulima wanaanza kupata ushauri wa AI kwa WhatsApp bila kuhitaji smartphone ya kisasa.`, score: 60 },
    ];
  }

  // Chagua topic inayofaa kwa persona fulani
  getTopicForPersona(personaKey, context) {
    const topics = context?.combined;
    if (!topics?.length) return this.getFallbackTopics()[0];

    // EXPERT anapenda topics za technical
    // ENTREPRENEUR anapenda topics za business/impact
    // STUDENT anapenda topics za kujifunza
    // ENTHUSIAST — random
    if (personaKey === "EXPERT") {
      return topics.find(t => /llm|model|npl|cv|ml|deep|neural/i.test(t.sampleContent)) || topics[0];
    }
    if (personaKey === "ENTREPRENEUR") {
      return topics.find(t => /startup|fund|busines|impact|kilimo|afya/i.test(t.sampleContent)) || topics[0];
    }

    return topics[Math.floor(Math.random() * topics.length)];
  }
}

class ContextScheduler {
  constructor(engine) { this.engine = engine; }
  start() {
    // Refresh kila 30 min (tofauti na cache check ya isCacheValid)
    setInterval(() => this.engine.gatherContext(true), CONFIG.cache.ttl);
    console.log("⏰ Context scheduler imeanza (refresh kila 30 min)");
  }
}

async function createContextEngine() {
  const engine = new TrendIntelligence();
  await engine.gatherContext();
  return engine;
}

module.exports = { createContextEngine, ContextScheduler, TrendIntelligence };