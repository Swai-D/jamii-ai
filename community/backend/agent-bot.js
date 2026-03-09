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
  api:        { baseUrl: process.env.API_BASE_URL || "http://localhost:4000/api" },
  agent:      { password: "JamiiAI2025!", count: 5 },
  cycle:      { minWait: 10 * 60 * 1000, maxWait: 5 * 60 * 1000 }, // 10-15 min
  llm:        { timeout: 30_000 },
  // Masaa ya kazi ya bots (EAT = UTC+3) — binadamu hapost 3am
  activeHours: { start: 7, end: 23 }, // 7:00am – 11:00pm EAT
};

// Angalia kama saa ya sasa iko ndani ya masaa ya kawaida (EAT = UTC+3)
function isActiveHour() {
  const nowEAT = new Date(Date.now() + 3 * 60 * 60 * 1000); // shift to EAT
  const hour   = nowEAT.getUTCHours();
  return hour >= CONFIG.activeHours.start && hour < CONFIG.activeHours.end;
}

// ── LLM MANAGER ─────────────────────────────────────────────────────
// ── LLM TASK CONFIGS ─────────────────────────────────────────────────────────
// Kila task ina settings zake — posts zinahitaji ubunifu, comments zinahitaji
// usahihi wa context. Kuitumia model moja kwa kila kitu ndiyo chanzo cha bugs.
const LLM_TASK = {
  post: {
    maxTokens:   250,   // Enough for 2-3 mistari
    temperature: 0.85,  // Ubunifu — lakini si chaos
    system: `Wewe ni mwanajamii wa kweli wa Tanzania AI community. Unaandika posts za asili — za kibinadamu, za kuvutia, mfupi. KAMWE usitumie Markdown (*, **, ##). KAMWE usiseme maneno ya AI-generic kama "Ni muhimu sana!", "Hii ni hatua kubwa". Ongea kama mtu wa kawaida anayejua AI.`,
    // Post: prefer models zenye ubunifu — deepseek na grok zinafanya vizuri
    providerOrder: ["deepseek", "grok", "openrouter", "gemini"],
  },
  comment: {
    maxTokens:   80,    // Fupi — comment si essay
    temperature: 0.65,  // Chini zaidi — tunahitaji accuracy ya context
    system: `Wewe ni mwanajamii anayejibu post ya mtu. SHERIA KUU: Jibu LAZIMA iwe specific kwa POST iliyotolewa — usiseme chochote ambacho hakiko kwenye post. Jibu ni mstari 1-2 TU. Hakuna Markdown. Hakuna "Vizuri sana!" generic. Hakuna kurudia maneno ya prompt.`,
    // Comment: prefer models ambazo zinafuata maelekezo vizuri — deepseek bora
    providerOrder: ["deepseek", "grok", "gemini", "openrouter"],
  },
  reply: {
    maxTokens:   90,
    temperature: 0.70,
    system: `Wewe ni mwanajamii anayejibu comment ya mtu kwenye post yako. Jibu lazima liwe conversational, fupi (mstari 1-2), na SPECIFIC kwa comment iliyotolewa. Usiseme maneno yasiyo na maana kama "Asante sana kwa maoni yako!". Ongea kama binadamu wa kawaida.`,
    providerOrder: ["deepseek", "grok", "gemini", "openrouter"],
  },
};

class LLMManager {
  // generate(prompt, taskType) — taskType: "post" | "comment" | "reply"
  static async generate(prompt, taskType = "post") {
    const task      = LLM_TASK[taskType] || LLM_TASK.post;
    const providers = task.providerOrder.map(name => () => this._call(name, prompt, task));

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result?.trim()) return result.trim();
      } catch { /* jaribu provider inayofuata */ }
    }
    return null;
  }

  // Universal caller — provider moja inashughulikia kila model
  static async _call(name, prompt, task) {
    switch (name) {
      case "deepseek":   return this._deepseek(prompt, task);
      case "grok":       return this._grok(prompt, task);
      case "gemini":     return this._gemini(prompt, task);
      case "openrouter": return this._openrouter(prompt, task);
      default:           return null;
    }
  }

  static async _deepseek(prompt, task) {
    if (!process.env.DEEPSEEK_API_KEY) return null;
    const r = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model:       "deepseek-chat",
        max_tokens:  task.maxTokens,
        temperature: task.temperature,
        messages: [
          { role: "system", content: task.system },
          { role: "user",   content: prompt },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, timeout: CONFIG.llm.timeout }
    );
    return r.data.choices[0].message.content;
  }

  static async _grok(prompt, task) {
    if (!process.env.GROK_API_KEY) return null;
    const r = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model:       "grok-beta",
        max_tokens:  task.maxTokens,
        temperature: task.temperature,
        messages: [
          { role: "system", content: task.system },
          { role: "user",   content: prompt },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` }, timeout: CONFIG.llm.timeout }
    );
    return r.data.choices[0].message.content;
  }

  static async _gemini(prompt, task) {
    if (!process.env.GEMINI_API_KEY) return null;
    // Gemini inatumia format tofauti — system prompt inaingia kama "system_instruction"
    const r = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        system_instruction: { parts: [{ text: task.system }] },
        contents:           [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig:   { maxOutputTokens: task.maxTokens, temperature: task.temperature },
      },
      { headers: { "Content-Type": "application/json" }, timeout: CONFIG.llm.timeout }
    );
    return r.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  static async _openrouter(prompt, task) {
    if (!process.env.OPENROUTER_API_KEY) return null;
    const r = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model:       "google/gemini-2.0-flash-001",
        max_tokens:  task.maxTokens,
        temperature: task.temperature,
        messages: [
          { role: "system", content: task.system },
          { role: "user",   content: prompt },
        ],
      },
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
    const postId = notif.link?.match(/posts\/([a-f0-9-]{36})/)?.[1];
    if (!postId) return;

    const commentText = notif.body || notif.title || "";
    if (!commentText.trim()) return;

    // Fetch post ya kweli + comments zilizopo — LLM ihitaji context kamili
    let postContent = "";
    let existingComments = [];
    try {
      const [postRes, commentsRes] = await Promise.allSettled([
        axios.get(`${CONFIG.api.baseUrl}/posts/${postId}`,          { timeout: 6_000 }),
        axios.get(`${CONFIG.api.baseUrl}/posts/${postId}/comments`, { timeout: 6_000 }),
      ]);
      if (postRes.status === "fulfilled") {
        postContent = postRes.value.data?.content || postRes.value.data?.post?.content || "";
      }
      if (commentsRes.status === "fulfilled") {
        existingComments = (commentsRes.value.data || [])
          .filter(c => c.user_id !== this.agent.user.id)
          .map(c => `@${c.author_handle}: ${c.text}`)
          .slice(0, 3);
      }
    } catch { /* tumia notif info peke yake */ }

    const commentsBlock = existingComments.length
      ? `\nCOMMENTS NYINGINE:\n${existingComments.join("\n")}` : "";

    const replyPrompt = `Wewe ni ${this.agent.user.name} (@${this.agent.user.handle}), ${this.agent.user.role} kutoka ${this.agent.user.city || "Tanzania"}.

POST YAKO ILIKUWA:
"${postContent.slice(0, 250) || "(post yako)"}"

COMMENT ALIYOANDIKA @${notif.actor_handle}:
"${commentText}"${commentsBlock}

KAZI: Jibu comment ya @${notif.actor_handle} kuhusu kile walichosema HASA.
KANUNI: Reply fupi (mstari 1-2). Hakuna Markdown. Usizungumzie mada ambazo hazikutajwa.

JIBU NA REPLY TU.`;

    const reply = await LLMManager.generate(replyPrompt, "reply");
    if (!reply?.trim()) return;

    const clean = reply.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n{2,}/g, "\n").trim();
    if (clean.length < 5) return;

    await axios.post(
      `${CONFIG.api.baseUrl}/posts/${postId}/comments`,
      { text: clean },
      { headers: this.agent.headers, timeout: 10_000 }
    );
    console.log(`  💬 @${this.agent.user.handle} alijibu @${notif.actor_handle}: "${clean.slice(0, 50)}"`);
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

    // ── Action memory — inabaki kati ya cycles ──────────────────────
    // Post IDs ambazo bot imeshafanya kitu (like/comment) — kuepuka kurudia
    this.seenPostIds   = new Set();
    // Aina ya action iliyofanyika cycle iliyopita — post inafuatiwa na starehe
    this.lastAction    = null; // "post" | "comment" | "like" | "follow" | null
    // Timestamp ya action kubwa iliyopita (post/comment) — rate limiting ya kibinadamu
    this.lastHeavyAt   = 0;
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
    const content    = await LLMManager.generate(prompt, "post");

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

    // ③ ACTION MEMORY — usipige like post uliyoshafanyia kitu
    const eligible = posts.filter(p =>
      p.userId !== this.user.id &&
      !this.seenPostIds.has(p.id)
    );
    if (!eligible.length) return;

    const target = eligible[Math.floor(Math.random() * eligible.length)];
    await axios.post(
      `${CONFIG.api.baseUrl}/posts/${target.id}/like`,
      {},
      { headers: this.headers, timeout: 8_000 }
    );
    this.seenPostIds.add(target.id); // Kumbuka — usirudi hapa
    // Limit size ya Set — kumbuka 200 tu za karibuni
    if (this.seenPostIds.size > 200) {
      const first = this.seenPostIds.values().next().value;
      this.seenPostIds.delete(first);
    }
    console.log(`  ❤️  @${this.user.handle} alikipiga like post`);
  }

  // ── ACTION: COMMENT ──────────────────────────────────────────────
  async doComment(context) {
    // Step 1: Pata posts fresh kutoka API — si kutoka cache ya 30min
    let candidates = [];
    try {
      const resp = await axios.get(
        `${CONFIG.api.baseUrl}/posts?limit=20`,
        { timeout: 8_000 }
      );
      candidates = (resp.data.posts || []).filter(p =>
        p.user_id !== this.user.id &&         // si post yangu mwenyewe
        p.content?.trim().length > 30 &&      // ina content ya kutosha
        !p.is_deleted &&
        !this.seenPostIds.has(p.id)           // ③ sijawahi comment/like hapa
      );
    } catch { return; }

    if (!candidates.length) return;

    // Step 2: Prefer posts zenye comments chache — kuongeza mazungumzo mapya
    // si kujibu post ambayo imejaa comments za bots
    candidates.sort((a, b) => {
      const scoreA = (parseInt(a.like_count) || 0) - (parseInt(a.comment_count) || 0) * 2;
      const scoreB = (parseInt(b.like_count) || 0) - (parseInt(b.comment_count) || 0) * 2;
      return scoreB - scoreA;
    });
    const target = candidates[Math.floor(Math.random() * Math.min(candidates.length, 5))];

    // Step 3: Pata comments zilizopo — bot isije ikajibu kitu kimeshasemwa
    let existingComments = [];
    try {
      const cr = await axios.get(`${CONFIG.api.baseUrl}/posts/${target.id}/comments`, { timeout: 5_000 });
      existingComments = (cr.data || []).map(c => `@${c.author_handle}: ${c.text}`).slice(0, 3);
    } catch { /* optional */ }

    // Step 4: Tengeneza prompt yenye context kamili
    const prompt = buildCommentPrompt(this.user, {
      content:     target.content,
      authorName:  target.author_name,
      authorRole:  target.author_role,
      comments:    existingComments,
    });

    const comment = await LLMManager.generate(prompt, "comment");
    if (!comment?.trim()) return;

    const sanitized = comment
      .replace(/\*\*/g, "").replace(/\*/g, "")
      .replace(/\n{2,}/g, "\n").trim();

    // Sanity check — comment lazima iwe na content halisi (si mfupi sana)
    if (sanitized.length < 8) return;

    await axios.post(
      `${CONFIG.api.baseUrl}/posts/${target.id}/comments`,
      { text: sanitized },
      { headers: this.headers, timeout: 10_000 }
    );
    this.seenPostIds.add(target.id); // Kumbuka — usirudie comment hapa
    if (this.seenPostIds.size > 200) {
      const first = this.seenPostIds.values().next().value;
      this.seenPostIds.delete(first);
    }
    console.log(`  💬 @${this.user.handle} → @${target.author_handle}: "${sanitized.slice(0, 60)}"`);
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
    // ① TIME GATE — bots hazifanyi kazi usiku wa manane (EAT 7am-11pm)
    if (!isActiveHour()) {
      console.log(`  😴 @${this.user.handle} analala (nje ya masaa ya kazi)`);
      return;
    }

    if (!(await this.ensureToken())) {
      return console.warn(`  ⚠️  @${this.user.handle} login imeshindwa`);
    }

    // KWANZA: Angalia notifications — jibu kama kuna mtu ameinteract
    const reactive = new ReactiveEngine(this);
    const didReact = await reactive.processNotifications();

    // Kama tumejibu interaction ya kweli, skip proactive action mara nyingi
    if (didReact && Math.random() < 0.6) return;

    // ② MAX 1 HEAVY ACTION — kama cycle iliyopita tulifanya post/comment,
    //    cycle hii tunaepuka heavy action nyingine (like/follow tu)
    //    Hii inamaanisha bot haonekani "machine-gun posting"
    const timeSinceHeavy  = Date.now() - this.lastHeavyAt;
    const cooldownMs      = 18 * 60 * 1000; // dakika 18 kati ya heavy actions
    const heavyCoolingDown = timeSinceHeavy < cooldownMs;

    let action = pickAction(this.user);

    // Kama tuko kwenye cooldown ya heavy action, force lite action
    if (heavyCoolingDown && (action === "post" || action === "comment")) {
      action = Math.random() < 0.6 ? "like" : "follow";
      console.log(`  🧘 @${this.user.handle} cooldown → ${action}`);
    } else {
      console.log(`  🎯 @${this.user.handle} → ${action}`);
    }

    try {
      switch (action) {
        case "post":
          await this.doPost(context);
          this.lastAction  = "post";
          this.lastHeavyAt = Date.now();
          break;
        case "like":
          await this.doLike(context);
          this.lastAction = "like";
          break;
        case "comment":
          await this.doComment(context);
          this.lastAction  = "comment";
          this.lastHeavyAt = Date.now();
          break;
        case "follow":
          await this.doFollow(context);
          this.lastAction = "follow";
          break;
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

    // ① TIME GATE — kama nje ya masaa ya kazi, lala hadi asubuhi
    if (!isActiveHour()) {
      const nowEAT   = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const hoursLeft = (CONFIG.activeHours.start + 24 - nowEAT.getUTCHours()) % 24;
      console.log(`🌙 Nje ya masaa ya kazi — bots zinalala. Itaanza tena baada ya saa ~${hoursLeft}.`);
      return;
    }

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