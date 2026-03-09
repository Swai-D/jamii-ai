/**
 * ═══════════════════════════════════════════════════════════════
 *  JamiiAI — seed.js
 *  Inaingiza fake users 30 + posts + follows + likes + comments
 *
 *  Matumizi:
 *    cd community/backend
 *    node seed.js
 *
 *  ⚠️  Run BAADA ya schema.sql kuapplywa
 *  ⚠️  Safe kurun mara nyingi (ON CONFLICT DO NOTHING)
 * ═══════════════════════════════════════════════════════════════
 */

const { Pool }   = require("pg");
const bcrypt     = require("bcryptjs");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false });

// ─── FAKE USERS ───────────────────────────────────────────────────
const SEED_PASSWORD = "JamiiAI2025!";

const FAKE_USERS = [
  { name:"Mgasa James",      handle:"mgasajames",      role:"Data Engineer",          city:"Mwanza",        bio:"Ninajenga AI solutions kwa biashara za Afrika Mashariki.",              skills:["Python","SQL","Apache Spark","MLOps","Data Pipelines"],      hourly_rate:"TZS 45K/hr",  rating:4.5, project_count:8,  available:false, is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/imgasa.jpg",   linkedin_url:"https://www.linkedin.com/in/MgasLucas/" },
  { name:"Kaleb Salim",      handle:"kalebsalim",      role:"AI Enthusiast",          city:"Dar es Salaam", bio:"ML Engineer na passion ya kutatua matatizo ya kweli kwa AI.",           skills:["Computer Vision","Deep Learning","Machine Learning"],           hourly_rate:"TZS 60K/hr",  rating:4.4, project_count:8,  available:false, is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/kaleb.jpeg",   linkedin_url:"https://www.linkedin.com/in/kalebu-gwalugano/" },
  { name:"Dina Jamal",       handle:"dinajamal",       role:"Founder & CEO",          city:"Moshi",         bio:"Building open-source AI tools kwa Waswahili.",                          skills:["Machine Learning","Computer Vision","Python","Research"],       hourly_rate:"TZS 80K/hr",  rating:4.8, project_count:11, available:true,  is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/machuve.jpeg" },
  { name:"Rose Oswald",      handle:"roseoswald",      role:"Researcher / Lecturer",  city:"Mwanza",        bio:"Application of ML and computer vision kwenye kilimo na afya.",          skills:["Python","Machine Learning","Computer Vision","R"],              hourly_rate:"",            rating:4.6, project_count:5,  available:true,  is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/funja.jpg" },
  { name:"Theofrida Pastory",handle:"theofridapastory", role:"AI Enthusiast",         city:"Dar es Salaam", bio:"Lecturer at Sokoine University — IoT and AI applications in precision agriculture.", skills:["Machine Learning","Computer Vision","IoT","Python"],   hourly_rate:"",            rating:4.3, project_count:3,  available:false, is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/maginga.jpeg" },
  { name:"Mahadia Mipawa",   handle:"mahadiamipawa",   role:"Founder & CEO",          city:"Dodoma",        bio:"Co-founder wa Tanzania Data Lab na Lecturer UDSM.",                      skills:["Data Science","Machine Learning","Python","Statistics"],         hourly_rate:"TZS 100K/hr", rating:4.9, project_count:14, available:true,  is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/mahadia.jpeg" },
  { name:"Neema Monko",      handle:"neemamonko",      role:"Researcher / Lecturer",  city:"Moshi",         bio:"Senior lecturer NM-AIST — AI kwa changamoto za kilimo, afya na elimu.",  skills:["Machine Learning","Computer Vision","Python","Deep Learning"],  hourly_rate:"",            rating:4.7, project_count:9,  available:false, is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/mduma.jpeg",   linkedin_url:"https://www.linkedin.com/in/mduma/" },
  { name:"Kevin Yusuf",      handle:"kevinyusuf",      role:"Software Engineer",      city:"Dar es Salaam", bio:"Software engineer with deep commitment to advancing AI across Tanzania.",  skills:["Machine Learning","Data Science","Python","JavaScript"],        hourly_rate:"TZS 50K/hr",  rating:4.2, project_count:6,  available:true,  is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/kevin.jpeg",   linkedin_url:"https://www.linkedin.com/in/kevin-masoy/" },
  { name:"Ally Philipo",     handle:"allyphilipo",     role:"Founder & CEO",          city:"Arusha",        bio:"CEO Elsahealth na CTO Hikmahealth — AI kwa afya Tanzania.",              skills:["NLP","Computer Vision","Machine Learning","Python","HealthAI"],  hourly_rate:"TZS 80K/hr",  rating:4.6, project_count:10, available:true,  is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/allysalim.jpeg", linkedin_url:"https://www.linkedin.com/in/ally-jr-salim-155925159/" },
  { name:"Swalha Lema",      handle:"swalhalema",      role:"AI Enthusiast",          city:"Arusha",        bio:"Passionate about making AI accessible kwa kila Mwafrika.",               skills:["Python","Machine Learning","Data Analysis"],                    hourly_rate:"",            rating:3.8, project_count:2,  available:true,  is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=swalhalema" },
  { name:"Gerald Mipawa",    handle:"geraldmipawa",    role:"Data Scientist",         city:"Dar es Salaam", bio:"Data and Machine Learning Engineer — crafting innovative AI/ML solutions.", skills:["Machine Learning","Data Science","Python","TensorFlow","MLOps"], hourly_rate:"TZS 55K/hr",  rating:4.1, project_count:7,  available:false, is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/antony.jpeg",  linkedin_url:"https://www.linkedin.com/in/anthonymipawa/" },
  { name:"Denis Monko",      handle:"denismonko",      role:"AI Researcher",          city:"Dar es Salaam", bio:"CEO & Founder KimPax | AI Strategy Advisor | Stanford AI Leadership.",   skills:["LLMs","Python","Data Science","ML","Deep Learning","MLOps"],    hourly_rate:"TZS 120K/hr", rating:4.8, project_count:15, available:false, is_verified:true,  avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/denis.jpeg",   linkedin_url:"https://www.linkedin.com/in/denispastory/" },
  { name:"Antony Wilson",    handle:"antonywilson",    role:"AI Enthusiast",          city:"Moshi",         bio:"Researcher specializing in NLP, currently building Swahili language models.", skills:["NLP","Deep Learning","Data Science","Python","Research"],    hourly_rate:"",            rating:4.0, project_count:4,  available:true,  is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/monko.jpg", linkedin_url:"https://www.linkedin.com/in/gloriana-monko-b83368121/" },
  { name:"Gloriana Alex",    handle:"glorianaalex",    role:"AI Student",             city:"Dar es Salaam", bio:"Data Science student — machine learning, data analysis, na FastAPI.",       skills:["NLP","Data Science","Machine Learning","Python","FastAPI"],     hourly_rate:"TZS 25K/hr",  rating:3.9, project_count:3,  available:true,  is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/1000423994.jpg" },
  { name:"Farhan Rogati",    handle:"farhanrogati",    role:"Software Engineer",      city:"Dar es Salaam", bio:"Public health na AI — ninachanganya sayansi mbili hizi kutatua matatizo.",  skills:["Machine Learning","Python","Public Health","Data Analysis"],    hourly_rate:"TZS 40K/hr",  rating:4.0, project_count:3,  available:true,  is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/1730711390121.jpeg" },
  { name:"Philipo Malema",   handle:"philipomalema",   role:"Data Scientist",         city:"Nairobi",       bio:"Freelance software engineer na data science student — smart, data-driven solutions.", skills:["Data Science","Deep Learning","Web Scraping","R","Computer Vision"], hourly_rate:"$15/hr", rating:4.2, project_count:5, available:false, is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/lema.png", github_url:"https://github.com/lematrixai" },
  { name:"Erick Lusigi",     handle:"ericklusigi",     role:"Data Engineer",          city:"Mwanza",        bio:"Driven technologist — AI, IoT, na web solutions kwa real-world applications.", skills:["Machine Learning","IoT","Python","JavaScript","AI"],          hourly_rate:"TZS 35K/hr",  rating:3.7, project_count:4,  available:true,  is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=ericklusigi" },
  { name:"Florence Saria",   handle:"florencesaria",   role:"Data Scientist",         city:"Dar es Salaam", bio:"Data Scientist & Software Developer at Quantum Intelligence | AI & innovation.", skills:["Data Science","Python","Machine Learning","Deep Learning"],  hourly_rate:"TZS 50K/hr",  rating:4.3, project_count:6,  available:true,  is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/IMG-20250107-WA0107.jpg", linkedin_url:"https://www.linkedin.com/in/florence-sway-267b982b6/", github_url:"https://github.com/14FLORENCE" },
  { name:"Samwel Kilasi",    handle:"samwelkilasi",    role:"AI Enthusiast",          city:"Zanzibar",      bio:"Passionate software engineer, solving problems facing the society.",          skills:["Deep Learning","Machine Learning","Python"],                    hourly_rate:"",            rating:3.6, project_count:2,  available:true,  is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=samwelkilasi" },
  { name:"Jimson Magiha",    handle:"jimsonmagiha",    role:"Software Engineer",      city:"Dodoma",        bio:"Engineer building AI-powered systems for East African markets.",               skills:["Deep Learning","Python","JavaScript","React"],                  hourly_rate:"TZS 35K/hr",  rating:3.8, project_count:3,  available:false, is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/jimson.png" },
  { name:"Kamanda Solomon",  handle:"kamandasolomon",  role:"Data Scientist",         city:"Arusha",        bio:"Student interested in AI — ninajenga skills zangu kila siku.",                skills:["Data Science","Python","Machine Learning"],                     hourly_rate:"",            rating:3.5, project_count:1,  available:true,  is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/1000441618.jpg" },
  { name:"Elias Nandi",      handle:"eliasnandi",      role:"Software Engineer",      city:"Arusha",        bio:"Specialized in embedded systems + AI — experience ya miaka 4+ sokoni.",       skills:["Embedded Systems","Machine Learning","IoT","Python"],           hourly_rate:"TZS 40K/hr",  rating:4.1, project_count:6,  available:true,  is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/IMG_0246.JPG" },
  { name:"Khalfani Malema",  handle:"khalfanimalema",  role:"AI Enthusiast",          city:"Dar es Salaam", bio:"Ninasaidia startups za Afrika kuingiza AI kwenye bidhaa zao.",                skills:["Python","Machine Learning","AI Tools"],                         hourly_rate:"",            rating:3.6, project_count:1,  available:true,  is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=khalfanimalema" },
  { name:"Lucas Mgina",      handle:"lucasmgina",      role:"Data Scientist",         city:"Dar es Salaam", bio:"Ninatumia data science kutatua matatizo ya afya na kilimo Tanzania.",         skills:["Data Science","Machine Learning","Deep Learning","Python"],     hourly_rate:"TZS 45K/hr",  rating:4.2, project_count:5,  available:false, is_verified:false, avatar_url:"https://ai-community-media-files.blr1.cdn.digitaloceanspaces.com/media/avatars/Screenshot_20250131-192243_Chrome.jpg" },
  { name:"Kaiza Mwitike",    handle:"kaizamwitike",    role:"AI Enthusiast",          city:"Dar es Salaam", bio:"Full-stack developer with deep interest in LLMs and autonomous agents.",       skills:["Python","JavaScript","LLMs","React","AI Agents"],               hourly_rate:"TZS 45K/hr",  rating:3.9, project_count:4,  available:true,  is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=kaizamwitike" },
  { name:"Eban Matungwa",    handle:"ebanmatungwa",    role:"ML Engineer",            city:"Dar es Salaam", bio:"Building AI-powered fintech solutions for East Africa.",                       skills:["PyTorch","TensorFlow","MLOps","Python","Docker"],                hourly_rate:"TZS 70K/hr",  rating:4.4, project_count:9,  available:true,  is_verified:true,  avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=ebanmatungwa" },
  { name:"Grace Martin",     handle:"gracemartin",     role:"Data Scientist",         city:"Zanzibar",      bio:"Ninahusika na AI policy na ethics kwa Afrika — data kwa faida ya wote.",    skills:["Data Science","Python","AI Ethics","Statistics","Research"],    hourly_rate:"",            rating:4.0, project_count:3,  available:true,  is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=gracemartin" },
  { name:"Joseph Bakari",    handle:"josephbakari",    role:"Software Engineer",      city:"Mwanza",        bio:"Nikitumia AI kutatua changamoto za kilimo na maliasili Tanzania.",            skills:["Python","Machine Learning","AgriTech","FastAPI"],               hourly_rate:"TZS 30K/hr",  rating:3.8, project_count:3,  available:false, is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=josephbakari" },
  { name:"Gideon Msasalaga", handle:"gideonmsasalaga", role:"AI Researcher",          city:"Arusha",        bio:"LLM fine-tuning specialist kwa lugha za Afrika — Swahili, Haya, Sukuma.",    skills:["NLP","Transformers","Python","LLMs","Fine-tuning"],             hourly_rate:"$25/hr",      rating:4.6, project_count:7,  available:true,  is_verified:true,  avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=gideonmsasalaga" },
  { name:"Amina Hassan",     handle:"aminahassan",     role:"AI Student",             city:"Dar es Salaam", bio:"Swahili NLP researcher na open-source contributor — ninapenda lugha + code.",  skills:["NLP","Python","Machine Learning","Deep Learning"],              hourly_rate:"",            rating:3.9, project_count:2,  available:true,  is_verified:false, avatar_url:"https://api.dicebear.com/9.x/avataaars/svg?seed=aminahassan" },
];

// ─── SEED POSTS ───────────────────────────────────────────────────
// handle → who posts it; category: swali/mradi/habari/kazi
const SEED_POSTS = [
  { handle:"mahadiamipawa",  category:"habari",  content:"Tanzania Data Lab imefungua intake mpya! Tunatoa mafunzo ya data science kwa wasomi na wafanyakazi. Apply kabla ya Aprili 15. 🇹🇿 #DataScience #TanzaniaAI" },
  { handle:"denismonko",     category:"mradi",   content:"Nimekamilisha model ya kudetect diabetic retinopathy kutoka fundus images — accuracy 91% kwenye Tanzanian patient dataset. Nitashare code GitHub wiki. Mnafikiria nini?" },
  { handle:"neemamonko",     category:"swali",   content:"Swali kwa ML engineers: mnasuggest framework gani kwa production deployment kwenye low-resource environment kama Tanzania? FastAPI + Docker au kuna njia nzuri zaidi?" },
  { handle:"gideonmsasalaga",category:"mradi",   content:"Nimefine-tune Llama-3 kwa Kiswahili na imeonyesha matokeo mazuri sana! BLEU score 0.67 kwenye translation tasks. Hii ni hatua kubwa kwa Swahili NLP. 🔥" },
  { handle:"allyphilipo",    category:"habari",  content:"Elsahealth imepata funding ya $500K kutoka Villgro Africa! Tutaendelea kujenga AI tools kwa madaktari na wauguzi Tanzania. Asante kwa support yenu wote! 🏥" },
  { handle:"florencesaria",  category:"swali",   content:"Je, kuna watu wanaotumia DVC (Data Version Control) kwa projects zao? Ninatafuta best practices za kumanage large datasets kwenye team setting." },
  { handle:"kalebsalim",     category:"mradi",   content:"Ninajenga AgriBot — WhatsApp chatbot kwa wakulima wa Tanzania. Watauliza maswali kwa Kiswahili na kupata ushauri wa kilimo mara moja. Beta version itakuwa tayari wiki ijayo!" },
  { handle:"kevinyusuf",     category:"swali",   content:"Nani ana experience na Hugging Face Spaces kwa kutumia AI apps deployed? Bei na performance inafananaje na Replicate au RunPod?" },
  { handle:"ebanmatungwa",   category:"mradi",   content:"JamiiPay AI — ninajenga fraud detection system kwa mobile money transactions Tanzania. Dataset imekusanywa, model training inaendelea. Looking for collaborators! 💳🤖" },
  { handle:"dinajamal",      category:"habari",  content:"Habari nzuri: NM-AIST Arusha imefungua AI Research Center mpya! Watafiti 20 wataanza kufanya kazi Mei 2025. Hii ni hatua kubwa kwa AI ecosystem Tanzania. 👏" },
  { handle:"philipomalema",  category:"swali",   content:"Ninashindana kati ya PyTorch na TensorFlow 2.x kwa project yangu ya computer vision. Mnashauri nini kwa 2025? Sababu zenu?" },
  { handle:"glorianaalex",   category:"mradi",   content:"Data analysis project yangu: nimechunguza patterns za mvua Tanzania 2010-2024 kwa ML na kupata insights muhimu kwa wakulima. Ripoti itakuwa online hivi karibuni!" },
  { handle:"mgasajames",     category:"habari",  content:"Data pipeline niliyojenga kwa Stanbic Tanzania imesaidia kupunguza processing time kutoka saa 6 hadi dakika 23. MLOps inamaanisha real business value! 🚀" },
  { handle:"antonywilson",   category:"mradi",   content:"Swahili sentiment analysis model: nimefanikiwa kupata F1-score ya 0.84 kwenye social media data. Dataset itakuwa public domain — AI community yetu inaweza inufaike!" },
  { handle:"kaizamwitike",   category:"swali",   content:"Je, mnafanya prompt engineering kwa Kiswahili? Nimegundua Claude na GPT-4 zinafanya kazi vizuri zaidi ukitoa context ya kuzuri kwa Kiswahili. Mnashiriki tips?" },
  { handle:"roseoswald",     category:"habari",  content:"Tumechapisha paper mpya: 'Drone-based crop disease detection in Tanzanian smallholder farms using transfer learning'. Available ArXiv. DM kwa full PDF! 📄" },
  { handle:"gracemartin",    category:"swali",   content:"AI Ethics Tanzania: tunafikiria vipi kuhusu data privacy ya wananchi wanapotumia AI health apps? Tunahitaji framework ya African context, si copy-paste ya EU GDPR." },
  { handle:"lucasmgina",     category:"mradi",   content:"Nimefika milestone! Model yangu ya kupredicting malaria hotspots Tanzania ina accuracy ya 87%. Collaboration na NIMR inakwenda vizuri. Tunaokoa maisha! 🦟" },
  { handle:"ericklusigi",    category:"swali",   content:"Embedded AI kwenye Raspberry Pi — mtu ana experience? Ninataka kurun object detection offline kwa low-power device. TFLite inatosha au ninahitaji Coral Edge TPU?" },
  { handle:"josephbakari",   category:"mradi",   content:"AfyaBot update: chatbot yangu ya health information kwa Kiswahili imefika users 1,200 Mwanza! Watu wanauliza maswali kuhusu TB, malaria, na lishe. AI inafanya kazi! 🌍" },
  { handle:"theofridapastory",category:"swali",  content:"IoT + AI kwa precision farming: sensor data kutoka shamba inaweza kupitishwa moja kwa moja kwa ML model kupredict harvest. Mtu amefanya hii Tanzania?" },
  { handle:"samwelkilasi",   category:"swali",   content:"GitHub Copilot vs Cursor AI — mnasuggest ipi kwa developers Tanzania? Bei ya Cursor inauma kidogo, lakini quality yake ni bora. Mnafikiria nini?" },
  { handle:"aminahassan",    category:"mradi",   content:"Open-source contribution zangu: nimeongeza Swahili stopwords na stemmer kwa NLTK library. PR imekubaliwa! Mtu yeyote anayefanya Swahili NLP — please test! 🎉" },
  { handle:"jimsonmagiha",   category:"habari",  content:"Startup za AI Tanzania zinaongezeka! Nimehesabu zaidi ya 40 AI startups active 2025. HealthAI, AgriTech, FinTech, na EdTech zote zinaendelea vizuri. 📈" },
  { handle:"khalfanimalema", category:"swali",   content:"Nani ana online AI course nzuri kwa Kiswahili? Ninajua Coursera na fast.ai kwa Kiingereza lakini natafuta resources kwa Kiswahili kwa beginners." },
  { handle:"geraldmipawa",   category:"mradi",   content:"ML pipeline optimization: nimeongeza speed ya model training kwa 3x kwa kutumia mixed precision training na gradient checkpointing. Code tutorial wiki ijayo!" },
  { handle:"eliasnandi",     category:"habari",  content:"Bootcamp ya Embedded AI imefanikiwa! Vijana 25 wa Arusha wamepata certificate. Wanajua sasa kurun ML kwenye microcontrollers. AI Tanzania inakua! 🤖" },
  { handle:"mahadiamipawa",  category:"swali",   content:"Swali kwa data team leaders: mnafanya data quality checks vipi kabla ya ML training? Ninatafuta automated pipeline ya kugundua data drift na outliers." },
  { handle:"farhanrogati",   category:"mradi",   content:"Public health + AI project: ninapredict dengue fever outbreaks Dar es Salaam kwa weather data + population density + historical cases. Model accuracy 79% so far." },
  { handle:"lucasmgina",     category:"swali",   content:"PostgreSQL vs MongoDB kwa ML feature store Tanzania? Data yetu ni semi-structured (JSON heavy). Performance na cost ndiyo vigezo vikuu kwetu." },
];

// ─── SEED COMMENTS ────────────────────────────────────────────────
const COMMENT_POOL = [
  "Hongera sana! Kazi nzuri sana.",
  "Hii ni muhimu sana kwa community yetu. Asante!",
  "Ninapenda approach hii. Unaweza share code?",
  "Mimi pia nimekuwa nikifanya kitu kama hiki. Tushirikiane!",
  "Dataset iko wapi? Nataka kujaribu pia.",
  "Accuracy ya 91% ni nzuri sana kwa medical AI. Hongera!",
  "Hii inanisaidia sana. Nilikuwa nikiuliza swali hilo hilo.",
  "Nimejaribu FastAPI na inafanya kazi vizuri sana. Nashauri!",
  "Paper iko interesting sana. DM nimekutumia.",
  "Open source ni muhimu. Asante kwa kuchangia!",
  "Tanzania AI ecosystem inakua haraka! Tuendelee kujengana.",
  "Niko ready kwa collaboration. Check DM yangu.",
  "Model hii inaweza kutumika pia kwa Kenya na Uganda?",
  "Hii ndio future ya AI Afrika. Tunaendelea! 💪",
  "Ninaweza kujiunga na beta testing?",
  "Swali zuri. Mimi pia ningetaka kujua hii.",
  "PyTorch ndiyo choice yangu. Community nzuri na docs bora.",
  "Sijui dataset ipo wapi lakini nitafute. Asante kwa info!",
  "Embedded AI ni field nzuri sana. Ninafurahi watu wanaifanya TZ.",
  "Hii inafanya kazi! Nimetest kwenye project yangu pia.",
];

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────
async function seed() {
  console.log("🌱 JamiiAI seed.js inaanza...\n");

  // ── 0. APPLY MISSING COLUMNS (safe — IF NOT EXISTS) ──────────
  console.log("🔧 Inaongeza columns zinazokosekana...");
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status       VARCHAR(20)  DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan         VARCHAR(20)  DEFAULT 'free';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image  TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token  VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS skills       JSONB        DEFAULT '[]';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate  VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS available    BOOLEAN      DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS rating       NUMERIC(3,1) DEFAULT 5.0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS project_count INTEGER     DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url  TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone        TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted    BOOLEAN DEFAULT false;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_flagged    BOOLEAN DEFAULT false;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS status        VARCHAR(20) DEFAULT 'active';
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url    TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_title  VARCHAR(300);
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body VARCHAR(300);
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(300);
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_handle VARCHAR(100);
    CREATE TABLE IF NOT EXISTS user_projects (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       VARCHAR(200) NOT NULL,
      description TEXT,
      tech_stack  JSONB DEFAULT '[]',
      status      VARCHAR(20) DEFAULT 'active',
      link        TEXT,
      stars       INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("  ✅ Columns ziko tayari\n");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const userIds = {};

  // ── 1. INSERT USERS ───────────────────────────────────────────
  console.log("👤 Inaingiza users...");
  for (const u of FAKE_USERS) {
    const id = uuid();
    try {
      await db.query(
        `INSERT INTO users (
          id, name, handle, email, password_hash,
          role, city, bio, skills, interests,
          hourly_rate, available, rating, project_count,
          avatar_url, github_url, linkedin_url,
          is_verified, is_admin, onboarded, status, plan,
          created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9::jsonb,$10::jsonb,
          $11,$12,$13,$14,
          $15,$16,$17,
          $18,false,true,'active','free',
          NOW() - (random()*interval'90 days'),
          NOW()
        ) ON CONFLICT (handle) DO UPDATE SET
          name=EXCLUDED.name, role=EXCLUDED.role, city=EXCLUDED.city,
          bio=EXCLUDED.bio, skills=EXCLUDED.skills, rating=EXCLUDED.rating,
          avatar_url=EXCLUDED.avatar_url, onboarded=true`,
        [
          id,
          u.name, u.handle,
          u.email || `${u.handle}@jamii.ai`,
          passwordHash,
          u.role, u.city, u.bio,
          JSON.stringify(u.skills || []),
          JSON.stringify(u.interests || ["NLP","AI","Machine Learning"]),
          u.hourly_rate || null,
          u.available !== false,
          u.rating || 4.0,
          u.project_count || 0,
          u.avatar_url || null,
          u.github_url || null,
          u.linkedin_url || null,
          u.is_verified || false,
        ]
      );
      // Get the actual ID (in case handle existed)
      const { rows:[row] } = await db.query("SELECT id FROM users WHERE handle=$1", [u.handle]);
      userIds[u.handle] = row.id;
      process.stdout.write(`  ✅ ${u.name} (@${u.handle})\n`);
    } catch(err) {
      console.error(`  ❌ ${u.name}: ${err.message}`);
    }
  }

  // ── 2. INSERT FOLLOWS ─────────────────────────────────────────
  console.log("\n🔗 Inaunda follows...");
  const handles = Object.keys(userIds);
  let followCount = 0;
  for (let i = 0; i < handles.length; i++) {
    // Each user follows 5–10 random others
    const numFollows = 5 + Math.floor(Math.random() * 6);
    const others = handles.filter(h => h !== handles[i]).sort(() => 0.5 - Math.random()).slice(0, numFollows);
    for (const target of others) {
      try {
        await db.query(
          `INSERT INTO follows (id,follower_id,following_id,created_at)
           VALUES ($1,$2,$3,NOW()-(random()*interval'60 days'))
           ON CONFLICT DO NOTHING`,
          [uuid(), userIds[handles[i]], userIds[target]]
        );
        followCount++;
      } catch {}
    }
  }
  console.log(`  ✅ ${followCount} follows zimeundwa`);

  // ── 3. INSERT POSTS ───────────────────────────────────────────
  console.log("\n📝 Inaingiza posts...");
  const postIds = [];
  for (const p of SEED_POSTS) {
    const handle = p.handle.toLowerCase();
    const authorId = userIds[handle];
    if (!authorId) { console.warn(`  ⚠️  Handle ${handle} haipatikani, skip`); continue; }
    const id = uuid();
    try {
      await db.query(
        `INSERT INTO posts (id, user_id, content, category, is_deleted, is_flagged, created_at, updated_at)
         VALUES ($1,$2,$3,$4,false,false,NOW()-(random()*interval'30 days'),NOW())
         ON CONFLICT DO NOTHING`,
        [id, authorId, p.content, p.category || "swali"]
      );
      postIds.push({ id, authorId });
    } catch(err) { console.error(`  ❌ Post: ${err.message}`); }
  }
  console.log(`  ✅ ${postIds.length} posts zimeingizwa`);

  // ── 4. INSERT LIKES ───────────────────────────────────────────
  console.log("\n❤️  Inaongeza likes...");
  let likeCount = 0;
  for (const post of postIds) {
    const numLikes = 3 + Math.floor(Math.random() * 15);
    const likers = handles.sort(() => 0.5 - Math.random()).slice(0, numLikes);
    for (const liker of likers) {
      if (userIds[liker] === post.authorId) continue;
      try {
        await db.query(
          `INSERT INTO post_likes (id,post_id,user_id,created_at)
           VALUES ($1,$2,$3,NOW()-(random()*interval'20 days'))
           ON CONFLICT DO NOTHING`,
          [uuid(), post.id, userIds[liker]]
        );
        likeCount++;
      } catch {}
    }
  }
  console.log(`  ✅ ${likeCount} likes zimeongezwa`);

  // ── 5. INSERT COMMENTS ────────────────────────────────────────
  console.log("\n💬 Inaongeza comments...");
  let commentCount = 0;
  for (const post of postIds.slice(0, 20)) {
    const numComments = 1 + Math.floor(Math.random() * 5);
    const commenters = handles.sort(() => 0.5 - Math.random()).slice(0, numComments);
    for (const commenter of commenters) {
      const text = COMMENT_POOL[Math.floor(Math.random() * COMMENT_POOL.length)];
      try {
        await db.query(
          `INSERT INTO comments (id,post_id,user_id,text,created_at)
           VALUES ($1,$2,$3,$4,NOW()-(random()*interval'15 days'))`,
          [uuid(), post.id, userIds[commenter], text]
        );
        commentCount++;
      } catch(err) { console.error(`  ❌ Comment: ${err.message}`); }
    }
  }
  console.log(`  ✅ ${commentCount} comments zimeongezwa`);

  // ── 6. INSERT USER PROJECTS ───────────────────────────────────
  console.log("\n🔨 Inaingiza projects...");
  const SAMPLE_PROJECTS = [
    { title:"Swahili Sentiment Analyzer",  desc:"NLP model kwa sentiment analysis ya Kiswahili social media data.", tech:["Python","HuggingFace","Transformers","FastAPI"], status:"active" },
    { title:"AfyaBot Tanzania",            desc:"WhatsApp chatbot ya health information kwa Kiswahili.",             tech:["Python","Twilio","LangChain","Claude API"],        status:"active" },
    { title:"AgriPredict",                 desc:"ML model kupredicting crop yields kwa mazingira ya Tanzania.",       tech:["Python","Scikit-learn","Flask","PostgreSQL"],      status:"completed" },
    { title:"JamiiData Dashboard",         desc:"Real-time analytics dashboard kwa data ya Tanzania AI community.",  tech:["React","Node.js","PostgreSQL","Recharts"],         status:"active" },
    { title:"Sauti ya AI Podcast",         desc:"Podcast ya kuelimisha kuhusu AI kwa Waafrika wa kawaida.",          tech:["Content","Anchor FM","YouTube"],                   status:"active" },
    { title:"FarmSense IoT",               desc:"IoT sensors + ML kwa monitoring ya hali ya shamba realtime.",       tech:["Arduino","Python","TFLite","MQTT"],                status:"paused" },
    { title:"KijanaCode Bootcamp",         desc:"Mafunzo ya coding na AI kwa vijana Tanzania.",                      tech:["Curriculum","Python","Jupyter","Colab"],           status:"active" },
    { title:"MedVision",                   desc:"Computer vision kwa kudetect magonjwa ya macho Tanzania.",          tech:["PyTorch","OpenCV","FastAPI","Docker"],             status:"active" },
  ];
  let projCount = 0;
  const userArr = Object.values(userIds);
  for (let i = 0; i < Math.min(userArr.length, 20); i++) {
    const numProj = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numProj; j++) {
      const proj = SAMPLE_PROJECTS[(i + j) % SAMPLE_PROJECTS.length];
      try {
        await db.query(
          `INSERT INTO user_projects (id,user_id,title,description,tech_stack,status,stars,created_at)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,NOW()-(random()*interval'60 days'))
           ON CONFLICT DO NOTHING`,
          [uuid(), userArr[i], proj.title, proj.desc, JSON.stringify(proj.tech), proj.status, Math.floor(Math.random()*50)]
        );
        projCount++;
      } catch {}
    }
  }
  console.log(`  ✅ ${projCount} projects zimeingizwa`);

  // ── SUMMARY ───────────────────────────────────────────────────
  const { rows:[stats] } = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE onboarded=true)    AS users,
      (SELECT COUNT(*) FROM posts WHERE is_deleted=false)  AS posts,
      (SELECT COUNT(*) FROM post_likes)                    AS likes,
      (SELECT COUNT(*) FROM comments)                      AS comments,
      (SELECT COUNT(*) FROM follows)                       AS follows,
      (SELECT COUNT(*) FROM user_projects)                 AS projects
  `);

  console.log(`
═══════════════════════════════════════
  ✅ JamiiAI seed.js imekamilika!

  📊 Database stats:
     Users:    ${stats.users}
     Posts:    ${stats.posts}
     Likes:    ${stats.likes}
     Comments: ${stats.comments}
     Follows:  ${stats.follows}
     Projects: ${stats.projects}

  🔑 Login kwa user yeyote:
     Email:    handle@jamii.ai
              (mfano: mgasajames@jamii.ai)
     Password: JamiiAI2025!

  🤖 OpenClaw agents wanaweza kutumia
     credentials hizo kuingia na kuinteract.
═══════════════════════════════════════
  `);

  await db.end();
}

seed().catch(err => {
  console.error("❌ Seed imeshindwa:", err.message);
  process.exit(1);
});