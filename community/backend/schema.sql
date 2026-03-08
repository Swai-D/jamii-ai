-- ═══════════════════════════════════════════════════════════════════
--  JamiiAI Database Schema — PostgreSQL
--  Run: psql -U postgres -d jamii_ai -f schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ─────────────────────────────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(120) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  handle            VARCHAR(50)  UNIQUE,
  avatar_url        TEXT,
  cover_image       TEXT,
  role              VARCHAR(100),
  city              VARCHAR(100),
  bio               TEXT,
  skills            JSONB DEFAULT '[]',
  interests         JSONB DEFAULT '[]',
  hourly_rate       VARCHAR(50),
  available         BOOLEAN DEFAULT true,
  rating            NUMERIC(3,1),
  project_count     INTEGER DEFAULT 0,
  github_url        TEXT,
  linkedin_url      TEXT,
  website_url       TEXT,
  notification_prefs JSONB DEFAULT '{}',
  onboarded         BOOLEAN DEFAULT false,
  is_verified       BOOLEAN DEFAULT false,
  is_admin          BOOLEAN DEFAULT false,
  status            VARCHAR(20)  DEFAULT 'active',
  plan              VARCHAR(20)  DEFAULT 'free',
  reset_token       VARCHAR(255),
  reset_token_expiry TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_handle  ON users(handle);
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_city    ON users(city);
CREATE INDEX idx_users_name_search ON users USING gin(name gin_trgm_ops);


-- ─────────────────────────────────────────────────────────────────
--  USER PROJECTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_projects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  tech_stack   JSONB DEFAULT '[]',
  status       VARCHAR(20) DEFAULT 'active',  -- active, completed, paused
  link         TEXT,
  stars        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_projects_user ON user_projects(user_id);

-- ─────────────────────────────────────────────────────────────────
--  FOLLOWS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower  ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ─────────────────────────────────────────────────────────────────
--  POSTS (Community Feed)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  category    VARCHAR(50) DEFAULT 'swali',
  image_url   TEXT,
  is_deleted  BOOLEAN DEFAULT false,
  is_flagged  BOOLEAN DEFAULT false,
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id    ON posts(user_id);
CREATE INDEX idx_posts_category   ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_content_search ON posts USING gin(content gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────
--  COMMENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);

-- ─────────────────────────────────────────────────────────────────
--  LIKES & BOOKMARKS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post    ON post_likes(post_id);
CREATE INDEX idx_likes_user    ON post_likes(user_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- ─────────────────────────────────────────────────────────────────
--  CHALLENGES (Innovation Competitions)
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE challenge_status     AS ENUM ('open', 'closed', 'judging', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE challenge_difficulty AS ENUM ('Rahisi', 'Kati', 'Ngumu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS challenges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  org          VARCHAR(255),
  prize        VARCHAR(100),
  deadline     DATE,
  category     VARCHAR(100),
  difficulty   challenge_difficulty DEFAULT 'Kati',
  status       challenge_status DEFAULT 'open',
  description  TEXT,
  tags         JSONB DEFAULT '[]',
  color        VARCHAR(20) DEFAULT '#F5A623',
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_registrations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_challenge_status ON challenges(status);
CREATE INDEX idx_challenge_reg ON challenge_registrations(challenge_id);

-- ─────────────────────────────────────────────────────────────────
--  RESOURCES (Datasets, Tutorials, Guides)
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('Dataset', 'Tutorial', 'Guide', 'Research Paper', 'Tool');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  type        resource_type NOT NULL,
  user_id     UUID REFERENCES users(id),
  author_name VARCHAR(120),
  description TEXT,
  url         TEXT,
  tags        JSONB DEFAULT '[]',
  color       VARCHAR(20) DEFAULT '#F5A623',
  downloads   INTEGER DEFAULT 0,
  stars       INTEGER DEFAULT 0,
  is_free     BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_type  ON resources(type);
CREATE INDEX idx_resources_stars ON resources(stars DESC);

-- ─────────────────────────────────────────────────────────────────
--  STARTUPS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS startups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120) NOT NULL,
  logo        VARCHAR(10),
  color       VARCHAR(20),
  sector      VARCHAR(100),
  stage       VARCHAR(50),         -- Seed, Pre-seed, MVP, Growth, Series A
  location    VARCHAR(100),
  founded     INTEGER,
  team_size   INTEGER,
  description TEXT,
  tech_stack  JSONB DEFAULT '[]',
  funding     VARCHAR(100),
  website     VARCHAR(255),
  is_hiring   BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_startups_sector ON startups(sector);
CREATE INDEX idx_startups_hiring ON startups(is_hiring) WHERE is_hiring = true;

-- ─────────────────────────────────────────────────────────────────
--  INSTITUTIONS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institutions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  short_name  VARCHAR(20),
  logo        VARCHAR(10),
  color       VARCHAR(20),
  type        VARCHAR(100),        -- University, Research Institute, Government, NGO
  location    VARCHAR(100),
  department  VARCHAR(200),
  focus_areas JSONB DEFAULT '[]',
  description TEXT,
  student_count    INTEGER,
  researcher_count INTEGER,
  website     VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_institutions_type ON institutions(type);

-- ─────────────────────────────────────────────────────────────────
--  NEWS
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE news_category AS ENUM ('Tanzania', 'Global', 'Jamii');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS news (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(500) NOT NULL,
  summary      TEXT,
  content      TEXT,
  category     news_category DEFAULT 'Global',
  source_url   TEXT,
  image_url    TEXT,
  is_hot       BOOLEAN DEFAULT false,
  read_count   INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_by   UUID REFERENCES users(id)
);

CREATE INDEX idx_news_category     ON news(category);
CREATE INDEX idx_news_published_at ON news(published_at DESC);

-- ─────────────────────────────────────────────────────────────────
--  EVENTS
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('Hackathon', 'Webinar', 'Meetup', 'Workshop', 'Conference');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  type        event_type DEFAULT 'Meetup',
  date        TIMESTAMPTZ NOT NULL,
  location    VARCHAR(255),
  is_online   BOOLEAN DEFAULT false,
  color       VARCHAR(20) DEFAULT '#F5A623',
  max_rsvp    INTEGER,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_events_date ON events(date);

-- ─────────────────────────────────────────────────────────────────
--  NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type         VARCHAR(50) NOT NULL DEFAULT 'general',
  title        TEXT,
  body         TEXT,
  entity_id    UUID,
  actor_name   VARCHAR(200),
  actor_handle VARCHAR(100),
  actor_avatar TEXT,
  link         TEXT,
  message      TEXT,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifs_user    ON notifications(user_id);
CREATE INDEX idx_notifs_unread  ON notifications(user_id) WHERE is_read = false;

-- ─────────────────────────────────────────────────────────────────
--  MESSAGES (Direct Messages)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_sender   ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_convo    ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));

-- ─────────────────────────────────────────────────────────────────
--  UPDATED_AT TRIGGER (auto-update)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_posts_updated  BEFORE UPDATE ON posts  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────
--  SEED DATA (development only)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO challenges (title, org, prize, deadline, category, difficulty, status, description, tags, color)
VALUES
  ('Swahili Sentiment Analysis',    'JamiiAI + UDSM',     'TZS 5,000,000',  '2025-04-15', 'NLP',             'Kati',  'open',   'Jenga model ya sentiment analysis kwa Kiswahili.',            '["NLP","Swahili","Classification"]', '#4ECDC4'),
  ('AI kwa Afya: Disease Detection','MOH Tanzania',        'TZS 10,000,000', '2025-05-01', 'Computer Vision', 'Ngumu', 'open',   'Tumia CV kugundua malaria, TB kutoka clinical images.',       '["Healthcare","CV","Impact"]',       '#F87171'),
  ('AgriBot: AI kwa Wakulima',      'FAO Tanzania',        'TZS 3,000,000',  '2025-03-30', 'AI Agent',        'Rahisi','open',   'Jenga WhatsApp chatbot kwa wakulima wa Tanzania.',            '["Agriculture","Chatbot","LLM"]',    '#34D399'),
  ('Fake News Detector Tanzania',   'JamiiAI Community',   'TZS 2,000,000',  '2025-02-28', 'NLP',             'Kati',  'closed', 'Imefungwa. Mshindi: Team SwahiliAI — accuracy 94.2%.',        '["NLP","Media","Misinformation"]',   '#A78BFA')
ON CONFLICT DO NOTHING;

INSERT INTO events (name, type, date, location, is_online, color)
VALUES
  ('Tanzania AI Hackathon 2025', 'Hackathon',  '2025-03-15 09:00:00+03', 'UDSM, Dar es Salaam', false, '#F5A623'),
  ('AI for Agriculture Webinar', 'Webinar',    '2025-03-22 14:00:00+03', 'Online - Zoom',       true,  '#4ECDC4'),
  ('JamiiAI Monthly Meetup DSM', 'Meetup',     '2025-04-01 17:00:00+03', 'iHub, Kariakoo DSM',  false, '#A78BFA')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
--  A1 — PLATFORM SETTINGS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(100) UNIQUE NOT NULL,
  value      TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('apify_schedule_hours',         '6'),
  ('apify_sources',                '{"techcrunch":true,"venturebeat":true,"techmoran":true,"disruptafrica":true}'),
  ('apify_keywords_tz',            'Tanzania AI, JamiiAI, UDSM AI, Sarufi, Neurotech Africa'),
  ('apify_keywords_af',            'Africa AI, East Africa tech, Kenya AI'),
  ('apify_keywords_gl',            'artificial intelligence, LLM, Claude, GPT, Gemini'),
  ('apify_auto_publish',           'false'),
  ('apify_summary_lang',           'Kiswahili'),
  ('platform_name',                'JamiiAI'),
  ('platform_url',                 'https://jamii.ai'),
  ('registration_open',            'true'),
  ('maintenance_mode',             'false'),
  ('free_plan_messages',           '50'),
  ('smtp_host',                    'smtp.gmail.com'),
  ('smtp_port',                    '587'),
  ('smtp_user',                    ''),
  ('challenges_fetch_kaggle',      'true'),
  ('challenges_fetch_aicrowd',     'true'),
  ('challenges_fetch_devpost',     'true'),
  ('challenges_fetch_zindi',       'true'),
  ('challenges_auto_approve',      'false'),
  ('challenges_min_prize_usd',     '0'),
  ('jobs_require_approval',        'true'),
  ('jobs_free_posts_per_month',    '3'),
  ('jobs_featured_price_tzs',      '50000'),
  ('jobs_max_active_per_employer', '10'),
  ('jobs_default_deadline_days',   '30')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
--  A2 — ROLES & PERMISSIONS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]',
  color       VARCHAR(20) DEFAULT '#94A3B8',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id     INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name, permissions, color) VALUES
  ('super_admin', '["all"]',                                          '#F5A623'),
  ('admin',       '["users","content","news","resources","billing"]', '#4ADE80'),
  ('moderator',   '["content","users.ban"]',                         '#60A5FA'),
  ('editor',      '["news","resources"]',                            '#C084FC'),
  ('analyst',     '["analytics","billing.view"]',                    '#94A3B8')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
--  A3 — BILLING & SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  plan          VARCHAR(20) NOT NULL DEFAULT 'free',
  status        VARCHAR(20) DEFAULT 'active',
  amount        INTEGER DEFAULT 0,
  stripe_sub_id VARCHAR(100),
  started_at    TIMESTAMP DEFAULT NOW(),
  next_billing  TIMESTAMP,
  cancelled_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  amount          INTEGER NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  invoice_num     VARCHAR(20) UNIQUE,
  paid_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
--  A4 — ANNOUNCEMENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  target       VARCHAR(50) DEFAULT 'all',
  channels     JSONB DEFAULT '["in-app"]',
  admin_id     UUID REFERENCES users(id),
  scheduled_at TIMESTAMP,
  sent_at      TIMESTAMP,
  reach        INTEGER DEFAULT 0,
  opens        INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
--  A5 — JOBS (KAZI BOARD)
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE job_type   AS ENUM ('full_time','part_time','remote','internship','freelance','contract');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('inbox','active','closed','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE app_status AS ENUM ('submitted','viewed','shortlisted','rejected','hired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS jobs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posted_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  company_name     VARCHAR(200) NOT NULL,
  company_logo     TEXT,
  title            VARCHAR(200) NOT NULL,
  type             job_type NOT NULL DEFAULT 'full_time',
  category         VARCHAR(100),
  description      TEXT NOT NULL,
  requirements     TEXT,
  benefits         TEXT,
  location         VARCHAR(100),
  country          VARCHAR(100) DEFAULT 'Tanzania',
  is_remote        BOOLEAN DEFAULT false,
  salary_min       INTEGER,
  salary_max       INTEGER,
  salary_currency  VARCHAR(10) DEFAULT 'TZS',
  salary_visible   BOOLEAN DEFAULT true,
  apply_url        TEXT,
  apply_email      VARCHAR(200),
  apply_internal   BOOLEAN DEFAULT false,
  tags             JSONB DEFAULT '[]',
  status           job_status DEFAULT 'inbox',
  is_featured      BOOLEAN DEFAULT false,
  is_hot           BOOLEAN DEFAULT false,
  views            INTEGER DEFAULT 0,
  deadline         DATE,
  source           VARCHAR(50) DEFAULT 'direct',
  poster_name      VARCHAR(200),
  poster_email     VARCHAR(200),
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_letter  TEXT,
  cv_url        TEXT,
  linkedin_url  TEXT,
  portfolio_url TEXT,
  status        app_status DEFAULT 'submitted',
  employer_notes TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id     UUID REFERENCES jobs(id)  ON DELETE CASCADE,
  saved_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_status   ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type     ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_country  ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_created  ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_job      ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_applicant ON job_applications(applicant_id);

-- ─────────────────────────────────────────────────────────────────
--  A6 — ALTER EXISTING TABLES (add missing columns)
-- ─────────────────────────────────────────────────────────────────

-- resources — community submissions
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS status       VARCHAR(20) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS link         TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_by  UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMP;

-- news — Apify scraping fields
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS source      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_url  TEXT,
  ADD COLUMN IF NOT EXISTS raw_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary  TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at  TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status      VARCHAR(20) DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_hot      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS region      VARCHAR(50) DEFAULT 'Global';

-- challenges — external source fields
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS source        VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_url    TEXT,
  ADD COLUMN IF NOT EXISTS external_id   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS prize_usd     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prize_display VARCHAR(100),
  ADD COLUMN IF NOT EXISTS difficulty    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS region        VARCHAR(100) DEFAULT 'Global',
  ADD COLUMN IF NOT EXISTS ai_summary    TEXT,
  ADD COLUMN IF NOT EXISTS raw_desc      TEXT,
  ADD COLUMN IF NOT EXISTS is_hot        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS participants  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scraped_at    TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_external
  ON challenges(source, external_id)
  WHERE external_id IS NOT NULL;

-- messages — DM additional fields
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url  TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- notifications — additional fields (type, title, actor fields already defined in CREATE TABLE above)
-- These are safe no-ops if columns already exist
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS body         TEXT,
  ADD COLUMN IF NOT EXISTS actor_name   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS actor_handle VARCHAR(100),
  ADD COLUMN IF NOT EXISTS actor_avatar TEXT,
  ADD COLUMN IF NOT EXISTS link         TEXT;

-- ─────────────────────────────────────────────────────────────────
--  A7 — FULL-TEXT SEARCH INDEXES
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_fts ON users USING gin(
  to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(handle,'') || ' ' ||
    coalesce(role,'') || ' '  || coalesce(bio,'')   || ' ' || coalesce(city,'')
  )
);

CREATE INDEX IF NOT EXISTS idx_posts_fts ON posts USING gin(
  to_tsvector('english', coalesce(content,''))
);

CREATE INDEX IF NOT EXISTS idx_resources_fts ON resources USING gin(
  to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(tags::text,'')
  )
);

CREATE INDEX IF NOT EXISTS idx_jobs_fts ON jobs USING gin(
  to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(company_name,'') || ' ' ||
    coalesce(description,'') || ' ' || coalesce(tags::text,'')
  )
);

-- ─────────────────────────────────────────────────────────────────
--  DONE
-- ─────────────────────────────────────────────────────────────────
-- psql output: "Schema ya JamiiAI imefanikiwa kuundwa! 🇹🇿"
SELECT 'Schema ya JamiiAI imefanikiwa! 🇹🇿' AS status;