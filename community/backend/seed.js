const { Pool } = require("pg");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

const ROLES = ["AI Developer", "ML Engineer", "Data Scientist", "AI Researcher", "Student", "AI Enthusiast", "Startup Founder", "Product Manager"];
const CITIES = ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Zanzibar", "Moshi", "Tanga", "Morogoro", "Tabora"];
const SKILLS_LIST = ["Python", "PyTorch", "TensorFlow", "NLP", "Computer Vision", "LLMs", "LangChain", "SQL", "Docker", "MLOps", "React", "Node.js", "Swahili NLP"];
const CATEGORIES = ["swali", "mradi", "habari", "kazi"];
const RESOURCE_TYPES = ["Dataset", "Tutorial", "Guide", "Research Paper", "Tool"];
const SECTORS = ["AgriTech", "HealthTech", "EdTech", "FinTech", "TravelTech", "Language Tech"];
const NEWS_CATS = ["Tanzania", "Global", "Jamii"];

async function seed() {
  console.log("🚀 Kuanza ujazaji wa data tajiri (Rich Data)...");
  
  try {
    // Futa data za zamani ili kuanza upya
    await db.query("TRUNCATE users, posts, startups, institutions, resources, news, comments, post_likes, bookmarks, challenges, messages, events RESTART IDENTITY CASCADE");
    
    const passwordHash = await bcrypt.hash("password123", 12);
    const userIds = [];

    // 0. Test User
    const testUserId = uuid();
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, handle, role, city, bio, skills, onboarded, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())`,
      [testUserId, "Mjaribu JamiiAI", "test@jamii.ai", passwordHash, "test_user", "AI Developer", "Dar es Salaam", "Mimi ni mtumiaji wa majaribio wa JamiiAI.", JSON.stringify(["Python", "React", "AI"]), ]
    );
    userIds.push(testUserId);

    // 1. Seed Users (25)
    for (let i = 0; i < 24; i++) {
      const id = uuid();
      const name = faker.person.fullName();
      const email = faker.internet.email().toLowerCase();
      const handle = faker.internet.username().toLowerCase().replace(/[^a-z0-9]/g, "_");
      const skills = faker.helpers.arrayElements(SKILLS_LIST, { min: 2, max: 5 });
      
      await db.query(
        `INSERT INTO users (id, name, email, password_hash, handle, role, city, bio, skills, hourly_rate, rating, project_count, available, onboarded, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW())`,
        [
          id, name, email, passwordHash, handle, 
          faker.helpers.arrayElement(ROLES), 
          faker.helpers.arrayElement(CITIES), 
          faker.lorem.sentence(),
          JSON.stringify(skills),
          `TZS ${faker.number.int({min: 20, max: 100})}K/hr`,
          faker.number.float({min: 3.5, max: 5.0, fractionDigits: 1}),
          faker.number.int({min: 0, max: 30}),
          faker.datatype.boolean(0.8)
        ]
      );
      userIds.push(id);
    }
    console.log("✅ Wataalamu 25 wameongezwa.");

    // 2. Seed Posts (60)
    const postIds = [];
    for (let i = 0; i < 60; i++) {
      const id = uuid();
      await db.query(
        `INSERT INTO posts (id, user_id, content, category, created_at)
         VALUES ($1, $2, $3, $4, NOW() - interval '${faker.number.int({min: 1, max: 5000})} minutes')`,
        [id, faker.helpers.arrayElement(userIds), faker.lorem.paragraph(), faker.helpers.arrayElement(CATEGORIES)]
      );
      postIds.push(id);
    }
    console.log("✅ Posts 60 zimeongezwa.");

    // 3. Seed Startups (15)
    for (let i = 0; i < 15; i++) {
      const tech = faker.helpers.arrayElements(SKILLS_LIST, { min: 2, max: 4 });
      await db.query(
        `INSERT INTO startups (id, name, logo, color, sector, stage, location, founded, team_size, description, tech_stack, funding, is_hiring, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
        [
          uuid(), faker.company.name(), 
          faker.company.name().substring(0, 2).toUpperCase(),
          faker.color.rgb(),
          faker.helpers.arrayElement(SECTORS), 
          faker.helpers.arrayElement(["Seed", "Pre-seed", "Growth", "Series A"]), 
          faker.helpers.arrayElement(CITIES), 
          faker.number.int({min: 2018, max: 2024}), 
          faker.number.int({min: 2, max: 50}), 
          faker.company.catchPhrase(), 
          JSON.stringify(tech),
          `TZS ${faker.number.int({min: 50, max: 500})}M`,
          faker.datatype.boolean()
        ]
      );
    }
    console.log("✅ Startups 15 zimeongezwa.");

    // 4. Seed Resources (20)
    for (let i = 0; i < 20; i++) {
      const tags = faker.helpers.arrayElements(["NLP", "Python", "Swahili", "Beginner", "Dataset"], { min: 2, max: 3 });
      await db.query(
        `INSERT INTO resources (id, title, type, author_name, description, tags, color, stars, downloads, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          uuid(), faker.commerce.productName(), 
          faker.helpers.arrayElement(RESOURCE_TYPES), 
          faker.person.fullName(),
          faker.lorem.sentence(), 
          JSON.stringify(tags),
          faker.color.rgb(),
          faker.number.int({min: 0, max: 500}), 
          faker.number.int({min: 0, max: 5000})
        ]
      );
    }
    console.log("✅ Rasilimali 20 zimeongezwa.");

    // 5. Seed News (20)
    for (let i = 0; i < 20; i++) {
      await db.query(
        `INSERT INTO news (id, title, summary, category, is_hot, read_count, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() - interval '${faker.number.int({min: 1, max: 10000})} minutes')`,
        [uuid(), faker.lorem.sentence(), faker.lorem.paragraph(), faker.helpers.arrayElement(NEWS_CATS), faker.datatype.boolean(), faker.number.int({min: 100, max: 10000})]
      );
    }
    console.log("✅ Habari 20 zimeongezwa.");

    // 6. Seed Institutions (10)
    const instNames = [
      { name: "University of Dar es Salaam", short: "UDSM", logo: "🎓", color: "#34D399" },
      { name: "Nelson Mandela African Institution of Science and Technology", short: "NM-AIST", logo: "🔬", color: "#60A5FA" },
      { name: "St. Joseph University in Tanzania", short: "SJTU", logo: "🏫", color: "#A78BFA" },
      { name: "Commission for Science and Technology", short: "COSTECH", logo: "🛰️", color: "#F5A623" },
      { name: "University of Dodoma", short: "UDOM", logo: "🏛️", color: "#F87171" }
    ];

    for (let i = 0; i < 10; i++) {
      const inst = instNames[i % instNames.length];
      const focus = faker.helpers.arrayElements(["NLP", "AI Ethics", "Machine Learning", "Data Science", "Agriculture AI"], { min: 2, max: 3 });
      await db.query(
        `INSERT INTO institutions (id, name, short_name, logo, color, type, location, department, focus_areas, description, student_count, researcher_count, website, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
        [
          uuid(), 
          i < instNames.length ? inst.name : faker.company.name() + " Institute",
          i < instNames.length ? inst.short : faker.company.name().substring(0, 4).toUpperCase(),
          i < instNames.length ? inst.logo : "🏢",
          i < instNames.length ? inst.color : faker.color.rgb(),
          faker.helpers.arrayElement(["University", "Research Institute", "Government", "NGO"]),
          faker.helpers.arrayElement(CITIES),
          "Department of ICT & AI",
          JSON.stringify(focus),
          faker.company.catchPhrase(),
          faker.number.int({min: 1000, max: 20000}),
          faker.number.int({min: 10, max: 200}),
          faker.internet.url()
        ]
      );
    }
    console.log("✅ Taasisi 10 zimeongezwa.");

    // 7. Seed Challenges
    const challenges = [
      { title: "Swahili Sentiment Analysis Challenge", org: "JamiiAI + UDSM", prize: "TZS 5,000,000", deadline: "2025-04-15", category: "NLP", difficulty: "Kati", participants: 34, status: "open", desc: "Jenga model inayoweza kuchambua hisia katika maandishi ya Kiswahili.", tags: ["NLP", "Swahili", "Classification"], color: "#4ECDC4" },
      { title: "AI kwa Afya: Disease Detection", org: "MOH Tanzania + JamiiAI", prize: "TZS 10,000,000", deadline: "2025-05-01", category: "Computer Vision", difficulty: "Ngumu", participants: 18, status: "open", desc: "Tumia computer vision kugundua malaria au TB kutoka images.", tags: ["Healthcare", "CV", "Impact"], color: "#F87171" },
    ];
    for (const ch of challenges) {
      await db.query(
        `INSERT INTO challenges (id, title, org, prize, deadline, category, difficulty, status, description, tags, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [uuid(), ch.title, ch.org, ch.prize, ch.deadline, ch.category, ch.difficulty, ch.status, ch.desc, JSON.stringify(ch.tags), ch.color]
      );
    }

    // 8. Seed Events (Upcoming)
    const events = [
      { name: "Tanzania AI Hackathon 2025", type: "Hackathon", date: "2025-03-15 09:00:00+03", location: "UDSM, Dar es Salaam", online: false, color: "#F5A623", desc: "Kutana na wajenzi wenzako wa AI Dar es Salaam." },
      { name: "AI for Agriculture Webinar", type: "Webinar", date: "2025-03-22 14:00:00+03", location: "Online - Zoom", online: true, color: "#4ECDC4", desc: "Jinsi AI inavyoweza kuboresha mavuno Tanzania." },
      { name: "JamiiAI Monthly Meetup DSM", type: "Meetup", date: "2025-04-01 17:00:00+03", location: "iHub, Kariakoo DSM", online: false, color: "#A78BFA", desc: "Networking na Pizza!" },
      { name: "Deep Learning Workshop", type: "Workshop", date: "2025-04-10 10:00:00+03", location: "Arusha Tech Hub", online: false, color: "#60A5FA", desc: "Jifunze PyTorch kwa vitendo." }
    ];
    for (const ev of events) {
      await db.query(
        `INSERT INTO events (id, name, type, date, location, is_online, color, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [uuid(), ev.name, ev.type, ev.date, ev.location, ev.online, ev.color, ev.desc]
      );
    }
    console.log("✅ Matukio 4 ya baadaye yameongezwa.");

    // 9. Seed Messages
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (i === j) continue;
        const count = faker.number.int({min: 2, max: 6});
        for (let k = 0; k < count; k++) {
          await db.query(
            `INSERT INTO messages (id, sender_id, receiver_id, text, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW() - interval '${faker.number.int({min: 1, max: 10000})} minutes')`,
            [uuid(), userIds[i], userIds[j], faker.lorem.sentence(), faker.datatype.boolean()]
          );
        }
      }
    }
    console.log("✅ Ujumbe wa mfano umeongezwa.");

    // 10. Seed Comments & Likes
    for (const postId of postIds) {
      const likesCount = faker.number.int({min: 2, max: 15});
      for (let j = 0; j < likesCount; j++) {
        try { await db.query(`INSERT INTO post_likes (id, post_id, user_id) VALUES ($1, $2, $3)`, [uuid(), postId, faker.helpers.arrayElement(userIds)]); } catch {}
      }
      const commCount = faker.number.int({min: 1, max: 5});
      for (let j = 0; j < commCount; j++) {
        await db.query(`INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES ($1, $2, $3, $4, NOW())`, [uuid(), postId, faker.helpers.arrayElement(userIds), faker.lorem.sentence()]);
      }
    }
    console.log("✅ Likes na Comments zimeongezwa.");

    console.log("\n✨ Data tajiri zimefanikiwa kuingizwa! Tumia test@jamii.ai / password123 kuingia.");
  } catch (err) {
    console.error("❌ Hitilafu:", err);
  } finally {
    await db.end();
  }
}

seed();
