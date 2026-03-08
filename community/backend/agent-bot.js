// ═══════════════════════════════════════════════════════════════════
//  JamiiAI Orchestrator v3.1 — Multi-Action Agent System
//  File: agent-bot.js
// ═══════════════════════════════════════════════════════════════════

const axios = require("axios");
const {
  assignPersonaKey,
  pickAction,
  buildPostPrompt,
  buildCommentPrompt,
  pickCategory,
} = require("./persona-generator");
require("dotenv").config();

// Extract 1-3 relevant hashtags from news/trend text
function extractHashtags(text) {
  const map = {
    "ai":         "AI",
    "artificial": "AI",
    "llm":        "LLM",
    "machine learning": "MachineLearning",
    "deep learning":    "DeepLearning",
    "swahili":    "SwahiliNLP",
    "nlp":        "NLP",
    "startup":    "Startup",
    "fintech":    "Fintech",
    "kilimo":     "KilimoAI",
    "afya":       "AfyaAI",
    "health":     "HealthAI",
    "tanzania":   "Tanzania",
    "africa":     "AfricaTech",
    "nairobi":    "Nairobi",
    "open source":"OpenSource",
    "agent":      "AIAgents",
  };
  const lower = text.toLowerCase();
  return [...new Set(
    Object.entries(map)
      .filter(([k]) => lower.includes(k))
      .map(([, v]) => v)
  )].slice(0, 3);
}

const CONFIG = {
  api:   { baseUrl: process.env.API_BASE_URL || "http://localhost:4000/api" },
  agent: { password: "JamiiAI2025!", count: 5 },
  cycle: { minWait: 10 * 60 * 1000, maxWait: 5 * 60 * 1000 }, // 10-15 min
  llm:   { timeout: 30_000 },
};

// ── LLM MANAGER ─────────────────────────────────────────────────────
class LLMManager {
  static async generate(prompt) {
    const providers = [
      () => this._deepseek(prompt),
      () => this._grok(prompt),
      () => this._gemini(prompt),
      () => this._openrouter(prompt),
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result?.trim()) return result.trim();
      } catch { /* try next */ }
    }
    return null;
  }

  static async _deepseek(prompt) {
    if (!process.env.DEEPSEEK_API_KEY) return null;
    const r = await axios.post("https://api.deepseek.com/v1/chat/completions",
      { model: "deepseek-chat", messages: [{ role: "user", content: prompt }], max_tokens: 300 },
      { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, timeout: CONFIG.llm.timeout }
    );
    return r.data.choices[0].message.content;
  }

  static async _grok(prompt) {
    if (!process.env.GROK_API_KEY) return null;
    const r = await axios.post("https://api.x.ai/v1/chat/completions",
      { model: "grok-beta", messages: [{ role: "user", content: prompt }], max_tokens: 300 },
      { headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` }, timeout: CONFIG.llm.timeout }
    );
    return r.data.choices[0].message.content;
  }

  static async _gemini(prompt) {
    if (!process.env.GEMINI_API_KEY) return null;
    const r = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 300 } },
      { headers: { "Content-Type": "application/json" }, timeout: CONFIG.llm.timeout }
    );
    return r.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  static async _openrouter(prompt) {
    if (!process.env.OPENROUTER_API_KEY) return null;
    const r = await axios.post("https://openrouter.ai/api/v1/chat/completions",
      { model: "google/gemini-2.0-flash-001", messages: [{ role: "user", content: prompt }], max_tokens: 300 },
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }, timeout: CONFIG.llm.timeout }
    );
    return r.data.choices[0].message.content;
  }
}

// ── REACTIVE ENGINE — Bot anajibu interactions za kweli ─────────────
class ReactiveEngine {
  constructor(agent) {
    this.agent = agent;
  }

  // Pata notifications mpya ambazo bado hazijajibiwa
  async fetchUnread() {
    try {
      const resp = await axios.get(
        `${CONFIG.api.baseUrl}/notifications`,
        { headers: this.agent.headers, timeout: 8_000 }
      );
      return (resp.data.notifications || []).filter(n => !n.is_read);
    } catch { return []; }
  }

  // Mark notification kama imesomwa ili bot isiijibu tena
  async markRead(notifId) {
    try {
      await axios.patch(
        `${CONFIG.api.baseUrl}/notifications/${notifId}/read`,
        {},
        { headers: this.agent.headers, timeout: 5_000 }
      );
    } catch { /* silent */ }
  }

  // Jibu comment kwenye post ya bot
  async replyToComment(notif) {
    // Tunahitaji post_id — iko kwenye notif.link au notif.body
    const postId = notif.link?.match(/posts\/([a-f0-9-]{36})/)?.[1];
    if (!postId) return;

    // Pata post content + comment content
    let postContent = notif.body || "";
    let commentText = notif.title || "";

    const replyPrompt = `Wewe ni ${this.agent.user.name} (@${this.agent.user.handle}), ${this.agent.user.role}.
Mtu mmoja (@${notif.actor_handle}) ameandika comment kwenye post yako:
"${commentText}"

Andika reply fupi (mstari 1-2) — ya asili, ya kibinadamu, specific kwa comment yao.
Unaweza kukubaliana, kuuliza swali fupi, au kuongeza mawazo yako.
Hakuna Markdown. Hakuna "Asante sana!" generic peke yake.
JIBU NA REPLY TU.`;

    const reply = await LLMManager.generate(replyPrompt);
    if (!reply?.trim()) return;

    const clean = reply.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n{2,}/g, "\n").trim();

    await axios.post(
      `${CONFIG.api.baseUrl}/posts/${postId}/comments`,
      { text: clean },
      { headers: this.agent.headers, timeout: 10_000 }
    );
    console.log(`  💬 @${this.agent.user.handle} alijibu comment ya @${notif.actor_handle}: "${clean.slice(0,50)}"`);
  }

  // Follow back mtu aliyefuata bot
  async followBack(notif) {
    if (!notif.actor_id) return;
    // Si kila wakati — 65% tu (kuonekana wa kawaida)
    if (Math.random() > 0.65) return;

    try {
      await axios.post(
        `${CONFIG.api.baseUrl}/users/${notif.actor_id}/follow`,
        {},
        { headers: this.agent.headers, timeout: 8_000 }
      );
      console.log(`  🔗 @${this.agent.user.handle} alimfuata back @${notif.actor_handle}`);
    } catch { /* already following — OK */ }
  }

  // Like post ya mtu aliyepiga like post ya bot
  async likeBack(notif) {
    if (!notif.actor_id) return;
    // 40% tu — si kila mtu anapata like back
    if (Math.random() > 0.40) return;

    try {
      // Pata post moja ya mtu huyu
      const resp = await axios.get(
        `${CONFIG.api.baseUrl}/users/${notif.actor_handle}`,
        { timeout: 8_000 }
      );
      const posts = resp.data?.posts || [];
      if (!posts.length) return;

      const target = posts[Math.floor(Math.random() * Math.min(posts.length, 3))];
      await axios.post(
        `${CONFIG.api.baseUrl}/posts/${target.id}/like`,
        {},
        { headers: this.agent.headers, timeout: 8_000 }
      );
      console.log(`  ❤️  @${this.agent.user.handle} alipiga like post ya @${notif.actor_handle} (like back)`);
    } catch { /* silent */ }
  }

  // Main: process notifications zote mpya
  async processNotifications() {
    const notifs = await this.fetchUnread();
    if (!notifs.length) return false; // hakuna kitu cha kufanya

    let reacted = false;

    for (const notif of notifs.slice(0, 5)) { // max 5 kwa cycle moja
      const type = (notif.type_str || notif.type || "").toLowerCase();

      try {
        if (type.includes("comment")) {
          await this.replyToComment(notif);
          reacted = true;
        } else if (type.includes("follow")) {
          await this.followBack(notif);
          reacted = true;
        } else if (type.includes("like")) {
          await this.likeBack(notif);
          reacted = true;
        }
      } catch (err) {
        console.error(`  ⚠️  Reaction imeshindwa [${type}]:`, err.message);
      }

      // Mark kama imesomwa — hata kama hatujajibu
      await this.markRead(notif.id);

      // Pause kati ya reactions
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
    }

    return reacted;
  }
}


class ContextAwareAgent {
  constructor(user, contextEngine) {
    this.user          = user;
    this.contextEngine = contextEngine;
    this.token         = null;
    this.tokenExpiry   = null;
  }

  get headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  // FIX: Token caching — halogin tena kama token bado ni valid (30 min)
  async ensureToken() {
    const tokenValid = this.token && this.tokenExpiry && Date.now() < this.tokenExpiry;
    if (tokenValid) return true;

    try {
      const resp = await axios.post(`${CONFIG.api.baseUrl}/auth/login`, {
        email: `${this.user.handle}@jamii.ai`,
        password: CONFIG.agent.password,
      }, { timeout: 10_000 });
      this.token       = resp.data.token;
      this.tokenExpiry = Date.now() + 25 * 60 * 1000; // expire 5 min mapema
      return true;
    } catch {
      return false;
    }
  }

  // ── ACTION: POST ────────────────────────────────────────────────
  async doPost(context) {
    const personaKey = assignPersonaKey(this.user);
    const trend      = this.contextEngine.getTopicForPersona(personaKey, context);
    const prompt     = buildPostPrompt(this.user, trend?.sampleContent);
    const content    = await LLMManager.generate(prompt);

    if (!content) return console.warn(`  ⚠️  @${this.user.handle} LLM haikujibu`);

    const sanitized = content
      .replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/gm, "")
      .replace(/\n{2,}/g, "\n")
      .replace(/^\s+|\s+$/g, "")
      .trim();

    const category  = pickCategory(this.user);

    // Auto-hashtags kutoka keywords za trend
    const autoTags = extractHashtags(trend?.sampleContent || "");
    const hasExistingTag = /#\w/.test(sanitized);
    const tagSuffix = (!hasExistingTag && autoTags.length)
      ? "\n" + autoTags.slice(0, 2).map(t => `#${t}`).join(" ")
      : "";

    const finalContent = sanitized + tagSuffix;

    await axios.post(
      `${CONFIG.api.baseUrl}/posts`,
      {
        content:      finalContent,
        category,
        source_url:   trend?.sourceUrl   || null,
        source_title: trend?.sourceTitle || null,
      },
      { headers: this.headers, timeout: 10_000 }
    );
    console.log(`  📝 @${this.user.handle} [${category}]: "${finalContent.slice(0, 60)}..."`);
  }

  // ── ACTION: LIKE ─────────────────────────────────────────────────
  async doLike(context) {
    const posts = context.platform?.postIds || [];
    if (!posts.length) return;

    // Siopige like post zangu mwenyewe
    const eligible = posts.filter(p => p.userId !== this.user.id);
    if (!eligible.length) return;

    const target = eligible[Math.floor(Math.random() * eligible.length)];
    await axios.post(
      `${CONFIG.api.baseUrl}/posts/${target.id}/like`,
      {},
      { headers: this.headers, timeout: 8_000 }
    );
    console.log(`  ❤️  @${this.user.handle} alikipiga like post`);
  }

  // ── ACTION: COMMENT ──────────────────────────────────────────────
  async doComment(context) {
    const posts = context.platform?.postIds || [];
    if (!posts.length) return;

    const eligible = posts.filter(p => p.userId !== this.user.id && p.content?.length > 20);
    if (!eligible.length) return;

    const target  = eligible[Math.floor(Math.random() * eligible.length)];
    const prompt  = buildCommentPrompt(this.user, target.content);
    const comment = await LLMManager.generate(prompt);

    if (!comment?.trim()) return;

    const sanitized = comment.replace(/\*\*/g, "").replace(/\*/g, "").trim();
    await axios.post(
      `${CONFIG.api.baseUrl}/posts/${target.id}/comments`,
      { text: sanitized },
      { headers: this.headers, timeout: 10_000 }
    );
    console.log(`  💬 @${this.user.handle}: "${sanitized.slice(0, 60)}"`);
  }

  // ── ACTION: FOLLOW ───────────────────────────────────────────────
  async doFollow(context) {
    // Fuata mtu wa random kutoka platform
    try {
      const resp = await axios.get(
        `${CONFIG.api.baseUrl}/users?limit=20`,
        { timeout: 8_000 }
      );
      const users    = resp.data.users || [];
      const eligible = users.filter(u => u.id !== this.user.id);
      if (!eligible.length) return;

      const target = eligible[Math.floor(Math.random() * eligible.length)];
      await axios.post(
        `${CONFIG.api.baseUrl}/users/${target.id}/follow`,
        {},
        { headers: this.headers, timeout: 8_000 }
      );
      console.log(`  🔗 @${this.user.handle} amefuata @${target.handle}`);
    } catch { /* user already followed — OK */ }
  }

  // ── MAIN: Run one action based on persona weights ────────────────
  async runAction(context) {
    if (!(await this.ensureToken())) {
      return console.warn(`  ⚠️  @${this.user.handle} login imeshindwa`);
    }

    // KWANZA: Angalia notifications — jibu kama kuna mtu ameinteract
    const reactive = new ReactiveEngine(this);
    const didReact = await reactive.processNotifications();

    // Kama tumejibu interaction ya kweli, skip proactive action mara nyingi
    // (kuonekana wa kawaida — mtu hawezi kufanya mambo mengi mara moja)
    if (didReact && Math.random() < 0.6) return;

    // KISHA: Fanya proactive action (post/like/comment/follow) kwa kawaida
    const action = pickAction(this.user);
    console.log(`  🎯 @${this.user.handle} → ${action}`);

    try {
      switch (action) {
        case "post":    await this.doPost(context);    break;
        case "like":    await this.doLike(context);    break;
        case "comment": await this.doComment(context); break;
        case "follow":  await this.doFollow(context);  break;
      }
    } catch (err) {
      if (err?.response?.status === 401) this.token = null;
      console.error(`  ❌ @${this.user.handle} [${action}]: ${err.message}`);
    }
  }
}

// ── ORCHESTRATOR ─────────────────────────────────────────────────────
class JamiiOrchestrator {
  constructor(contextEngine) {
    this.contextEngine = contextEngine;
    this.agents        = new Map(); // handle → ContextAwareAgent (persistent across cycles)
    this.isRunning     = false;
  }

  // Reuse existing agent objects (preserves cached tokens)
  getOrCreateAgent(user) {
    if (!this.agents.has(user.handle)) {
      this.agents.set(user.handle, new ContextAwareAgent(user, this.contextEngine));
    } else {
      // Update user data kama imebadilika
      this.agents.get(user.handle).user = user;
    }
    return this.agents.get(user.handle);
  }

  async runCycle() {
    console.log(`\n🔄 Cycle: ${new Date().toLocaleTimeString("sw-TZ")}`);

    // Pata context mpya (cached kama bado fresh)
    const context = await this.contextEngine.gatherContext();

    // Pata users wa kweli kutoka platform
    let users = [];
    try {
      const { data } = await axios.get(`${CONFIG.api.baseUrl}/users?limit=100`, { timeout: 10_000 });
      users = (data.users || []).sort(() => 0.5 - Math.random()).slice(0, CONFIG.agent.count);
    } catch (err) {
      return console.error("  ❌ Kupata users kumeshindwa:", err.message);
    }

    if (!users.length) return console.warn("  ⚠️  Hakuna users kwenye platform bado");

    // Run agents — sequential (sio parallel) ili isionekane robot
    for (const user of users) {
      const agent = this.getOrCreateAgent(user);
      await agent.runAction(context);

      // Pause kati ya agents: 2-8 sec random
      const pause = 2000 + Math.random() * 6000;
      await new Promise(r => setTimeout(r, pause));
    }
  }

  async start() {
    this.isRunning = true;
    console.log("✅ Orchestrator imeanza!\n");

    while (this.isRunning) {
      await this.runCycle();

      const wait = CONFIG.cycle.minWait + Math.random() * CONFIG.cycle.maxWait;
      const mins = Math.round(wait / 60_000);
      console.log(`\n💤 Inangoja dakika ${mins}...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }

  shutdown() {
    this.isRunning = false;
    console.log("\n🛑 Orchestrator imesimama.");
  }
}

module.exports = { JamiiOrchestrator, LLMManager };