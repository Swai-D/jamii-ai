-- ─────────────────────────────────────────────────────────────────
--  JamiiAI Core Tables (Minimal required for SEHEMU A to run)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(120),
  email             VARCHAR(255) UNIQUE,
  password_hash     VARCHAR(255),
  handle            VARCHAR(50)  UNIQUE,
  avatar_url        TEXT,
  role              VARCHAR(100),
  city              VARCHAR(100),
  bio               TEXT,
  onboarded         BOOLEAN DEFAULT false,
  is_verified       BOOLEAN DEFAULT false,
  is_admin          BOOLEAN DEFAULT false,
  status            VARCHAR(20) DEFAULT 'active',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_deleted  BOOLEAN DEFAULT false,
  is_flagged  BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS news (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(500),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255),
  description TEXT,
  tags        JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- SEHEMU A — DATABASE (schema.sql)
-- ═══════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- A1 — Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(100) UNIQUE NOT NULL,
  value      TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('apify_schedule_hours',  '6'),
  ('apify_sources',         '{"techcrunch":true,"venturebeat":true,"techmoran":true,"disruptafrica":true}'),
  ('apify_keywords_tz',     'Tanzania AI, JamiiAI, UDSM AI, Sarufi, Neurotech Africa'),
  ('apify_keywords_af',     'Africa AI, East Africa tech, Kenya AI'),
  ('apify_keywords_gl',     'artificial intelligence, LLM, Claude, GPT, Gemini'),
  ('apify_auto_publish',    'false'),
  ('apify_summary_lang',    'Kiswahili'),
  ('platform_name',         'JamiiAI'),
  ('platform_url',          'https://jamii.ai'),
  ('registration_open',     'true'),
  ('maintenance_mode',      'false'),
  ('free_plan_messages',    '50'),
  ('smtp_host',             'smtp.gmail.com'),
  ('smtp_port',             '587'),
  ('smtp_user',             ''),
  ('challenges_fetch_kaggle',   'true'),
  ('challenges_fetch_aicrowd',  'true'),
  ('challenges_fetch_devpost',  'true'),
  ('challenges_fetch_zindi',    'true'),
  ('challenges_auto_approve',   'false'),
  ('challenges_min_prize_usd',  '0'),
  ('jobs_require_approval',         'true'),
  ('jobs_free_posts_per_month',     '3'),
  ('jobs_featured_price_tzs',       '50000'),
  ('jobs_max_active_per_employer',  '10'),
  ('jobs_default_deadline_days',    '30')
ON CONFLICT (key) DO NOTHING;

-- A2 — Roles & Permissions
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

-- A3 — Billing & Subscriptions
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

-- A4 — Announcements
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

-- A5 — Jobs (Kazi Board)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
        CREATE TYPE job_type   AS ENUM ('full_time','part_time','remote','internship','freelance','contract');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('inbox','active','closed','rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_status') THEN
        CREATE TYPE app_status AS ENUM ('submitted','viewed','shortlisted','rejected','hired');
    END IF;
END $$;

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
  job_id     UUID    REFERENCES jobs(id)  ON DELETE CASCADE,
  saved_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type      ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_country   ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline  ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_featured  ON jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_created   ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_job       ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_applicant ON job_applications(applicant_id);

-- A6 — Alter existing tables

-- posts — image uploads
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;

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

-- challenges — external sources
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS status         VARCHAR(20) DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS source         VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_url     TEXT,
  ADD COLUMN IF NOT EXISTS external_id    VARCHAR(200),
  ADD COLUMN IF NOT EXISTS prize_usd      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prize_display  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS deadline       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS difficulty     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS region         VARCHAR(100) DEFAULT 'Global',
  ADD COLUMN IF NOT EXISTS ai_summary     TEXT,
  ADD COLUMN IF NOT EXISTS raw_desc       TEXT,
  ADD COLUMN IF NOT EXISTS is_hot         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS participants   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scraped_at     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewed_by    UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_external
  ON challenges(source, external_id)
  WHERE external_id IS NOT NULL;

-- messages — DM additional fields
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url  TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- notifications — full fields
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type         VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS actor_id     UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS actor_name   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS actor_handle VARCHAR(100),
  ADD COLUMN IF NOT EXISTS actor_avatar TEXT,
  ADD COLUMN IF NOT EXISTS is_read      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS link         TEXT;

-- A7 — Full-text Search Indexes
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(
  to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(handle,'') || ' ' ||
    coalesce(role,'') || ' '  || coalesce(bio,'')   || ' ' || coalesce(city,'')
  )
);

CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(
  to_tsvector('english', coalesce(content,''))
);

CREATE INDEX IF NOT EXISTS idx_resources_search ON resources USING gin(
  to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(tags::text,'')
  )
);

CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING gin(
  to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(company_name,'') || ' ' ||
    coalesce(description,'') || ' ' || coalesce(tags::text,'')
  )
);
