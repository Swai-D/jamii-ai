// ═══════════════════════════════════════════════════════════════════
//  JamiiAI Persona Generator v3.1
//  File: persona-generator.js
// ═══════════════════════════════════════════════════════════════════

const PERSONA_TYPES = {
  EXPERT: {
    traits: ["Technical", "Serious", "Mentoring", "Strategic"],
    prefix: "Kama mtaalamu wa AI...",
    vibe: "Anapenda kuelezea 'How' na 'Why'. Anatumia technical terms. Anashare uzoefu halisi.",
    // Post categories hizi persona hupenda
    postCategories: ["mradi", "swali", "habari"],
    // Probability ya kufanya action fulani (0-1)
    actionWeights: { post: 0.25, like: 0.35, comment: 0.30, follow: 0.10 },
    commentStyle: "analytical", // ataandika comment za kina
    postFrequency: "low",       // expert hapost kila wakati — quality over quantity
  },
  STUDENT: {
    traits: ["Inquisitive", "Energetic", "Learning", "Fresh"],
    prefix: "Leo nimejifunza kuwa...",
    vibe: "Anapenda kuuliza maswali, anashare mafanikio madogo, anatumia lugha ya vijana.",
    postCategories: ["swali", "mradi", "habari"],
    actionWeights: { post: 0.20, like: 0.45, comment: 0.25, follow: 0.10 },
    commentStyle: "curious",
    postFrequency: "medium",
  },
  ENTREPRENEUR: {
    traits: ["Visionary", "Pragmatic", "Business-oriented", "Ambitious"],
    prefix: "AI inaweza kubadilisha biashara yetu kwa...",
    vibe: "Anajikita kwenye Impact, Money, Efficiency, na kukuza Afrika.",
    postCategories: ["habari", "kazi", "mradi"],
    actionWeights: { post: 0.30, like: 0.30, comment: 0.20, follow: 0.20 },
    commentStyle: "strategic",
    postFrequency: "medium",
  },
  ENTHUSIAST: {
    traits: ["Passionate", "Social", "Optimistic", "Curious"],
    prefix: "Inasisimua kuona...",
    vibe: "Anashare habari za kusisimua, anachangamsha community, mchangamfu sana.",
    postCategories: ["habari", "swali"],
    actionWeights: { post: 0.15, like: 0.50, comment: 0.25, follow: 0.10 },
    commentStyle: "enthusiastic",
    postFrequency: "high",
  }
};

// FIX: ilikuwa inarudisha object — sasa inarudisha KEY (string)
// ili iweze kutumika kwa context.getTopicForPersona(personaType, ...)
function assignPersonaKey(user) {
  const role = (user.role || "").toLowerCase();
  if (role.includes("founder") || role.includes("ceo") || role.includes("entrepreneur"))
    return "ENTREPRENEUR";
  if (role.includes("researcher") || role.includes("lecturer") || role.includes("academia"))
    return "EXPERT";
  if (role.includes("engineer") || role.includes("scientist") || role.includes("developer") || role.includes("ml"))
    return "EXPERT";
  if (role.includes("student"))
    return "STUDENT";
  return "ENTHUSIAST";
}

function getPersona(user) {
  return PERSONA_TYPES[assignPersonaKey(user)];
}

// Category za post zinazofaa kwa persona
function pickCategory(user) {
  const persona = getPersona(user);
  const cats = persona.postCategories;
  return cats[Math.floor(Math.random() * cats.length)];
}

// Amua action itakayofanywa kwenye cycle hii
function pickAction(user) {
  const persona = getPersona(user);
  const weights = persona.actionWeights;
  const rand = Math.random();
  let cumulative = 0;
  for (const [action, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand < cumulative) return action;
  }
  return "like"; // fallback
}

function buildPostPrompt(user, trendContent) {
  const persona = getPersona(user);
  const category = pickCategory(user);
  const now = new Date();
  const dateStr = now.toLocaleDateString("sw-TZ", { year: "numeric", month: "long", day: "numeric" });

  const categoryGuides = {
    swali:  "Uliza swali moja zito kuhusu AI kwa community — swali ambalo kweli ungependa kujua jibu lake.",
    mradi:  "Shirkisha maendeleo ya mradi wako wa AI — milestone, challenge, au discovery.",
    habari: "Shirkisha mawazo yako kuhusu habari hii ya AI. Ongeza perspective yako ya Afrika Mashariki.",
    kazi:   "Tangaza nafasi ya kazi au collaboration katika AI field yako.",
  };

  return `Wewe ni ${user.name} (@${user.handle}).
ROLE: ${user.role} | CITY: ${user.city || "Tanzania"}
BIO: ${user.bio}
TABIA YAKO: ${persona.traits.join(", ")}
STYLE: ${persona.vibe}

TAREHE YA LEO: ${dateStr} — andika kana kwamba unaishi sasa hivi ${now.getFullYear()}, si 2024 wala 2025.
USIANDIKE mambo kama "mwaka huu 2025" au "Januari 2025" — tumia "${now.getFullYear()}" au "mwaka huu" bila kutaja 2025.

MADA YA LEO: ${trendContent || `Maendeleo ya AI Tanzania na Afrika Mashariki ${now.getFullYear()}`}
AINA YA POST: ${category} — ${categoryGuides[category]}

KANUNI ZA KUANDIKA:
1. USITUMIE Markdown (**bold**, *italics*, bullets). Andika kama binadamu kwenye X/WhatsApp.
2. Tumia Kiswahili cha kawaida, unaweza mix na Kiingereza kidogo (code-switching ya kawaida TZ).
3. Post iwe mistari 2-4 tu. Fupi na yenye nguvu.
4. Anza moja kwa moja — bila "Habari!" au "Ninaomba..." kama utangulizi.
5. Emojis zinafaa — lakini 1-2 tu, si nyingi.
6. MUHIMU: USITUMIE mistari mitupu (blank lines) kati ya sentensi. Andika kama ujumbe mmoja unaoendelea — si makala wala essay.
7. USITUMIE "Kama mtaalamu wa AI..." wala prefix nyingine — nenda moja kwa moja kwenye mada.
8. ${persona.prefix} ni style tu ya kufikiri — si maneno ya kwanza ya post.

JIBU NA POST TU — hakuna kitu kingine. Mistari 2-4, bila nafasi kati yao.`;
}

function buildCommentPrompt(user, postContent) {
  const persona = getPersona(user);
  const year = new Date().getFullYear();
  
  const styleGuides = {
    analytical:   "Ongeza insight ya technical au swali la kina. Comment iwe na value halisi.",
    curious:      "Uliza swali moja fupi au shirkisha enthusiasm yako kwa uhalisi.",
    strategic:    "Ongeza angle ya biashara au impact ya practical.",
    enthusiastic: "Comment fupi ya kuchangamsha — supportive na ya kweli.",
  };

  return `Wewe ni ${user.name}, ${user.role} kutoka ${user.city || "Tanzania"}.
STYLE YAKO: ${persona.vibe}
MWAKA WA LEO: ${year} — usirejee matukio ya 2024 au 2025 kana kwamba ni ya "sasa hivi".

POST UNAPIGIA COMMENT:
"${postContent?.slice(0, 200)}"

KAZI: Andika comment moja fupi (mistari 1-2) kwenye post hii.
STYLE: ${styleGuides[persona.commentStyle]}
KANUNI: Hakuna Markdown. Hakuna "Great post!" generic. Iwe ya kweli na specific kwa post.

JIBU NA COMMENT TU.`;
}

module.exports = {
  PERSONA_TYPES,
  assignPersonaKey,
  getPersona,
  pickCategory,
  pickAction,
  buildPostPrompt,
  buildCommentPrompt,
};