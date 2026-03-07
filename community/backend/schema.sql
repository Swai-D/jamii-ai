-- ─────────────────────────────────────────────────────────────────
--  JamiiAI Core Tables
-- ─────────────────────────────────────────────────────────────────

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  interests         JSONB DEFAULT '[]',
  skills            JSONB DEFAULT '[]',
  notification_prefs JSONB DEFAULT '{}',
  hourly_rate       VARCHAR(50),
  rating            DECIMAL(3,2) DEFAULT 0.0,
  project_count     INTEGER DEFAULT 0,
  available         BOOLEAN DEFAULT true,
  github_url        TEXT,
  linkedin_url      TEXT,
  website_url       TEXT,
  onboarded         BOOLEAN DEFAULT false,
  is_verified       BOOLEAN DEFAULT false,
  is_admin          BOOLEAN DEFAULT false,
  status            VARCHAR(20) DEFAULT 'active',
  reset_token       VARCHAR(255),
  reset_token_expiry TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT,
  image_url   TEXT,
  category    VARCHAR(50) DEFAULT 'swali',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_deleted  BOOLEAN DEFAULT false,
  is_flagged  BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS news (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(500),
  summary      TEXT,
  category     VARCHAR(50),
  source       VARCHAR(100),
  source_url   TEXT,
  raw_summary  TEXT,
  ai_summary   TEXT,
  scraped_at   TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  status       VARCHAR(20) DEFAULT 'published',
  is_hot       BOOLEAN DEFAULT false,
  read_count   INTEGER DEFAULT 0,
  region       VARCHAR(50) DEFAULT 'Global',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255),
  org          VARCHAR(255),
  prize        VARCHAR(100),
  prize_usd    INTEGER DEFAULT 0,
  prize_display VARCHAR(100),
  deadline     TIMESTAMPTZ,
  category     VARCHAR(100),
  difficulty   VARCHAR(50),
  status       VARCHAR(20) DEFAULT 'open',
  source       VARCHAR(50) DEFAULT 'manual',
  source_url   TEXT,
  external_id  VARCHAR(200),
  description  TEXT,
  raw_desc     TEXT,
  ai_summary   TEXT,
  tags         JSONB DEFAULT '[]',
  color        VARCHAR(20),
  region       VARCHAR(100) DEFAULT 'Global',
  is_hot       BOOLEAN DEFAULT false,
  participants INTEGER DEFAULT 0,
  scraped_at   TIMESTAMPTZ,
  reviewed_by  UUID REFERENCES users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_registrations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id  UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS resources (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255),
  type          VARCHAR(50),
  author_name   VARCHAR(255),
  description   TEXT,
  link          TEXT,
  tags          JSONB DEFAULT '[]',
  color         VARCHAR(20),
  stars         INTEGER DEFAULT 0,
  downloads     INTEGER DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'approved',
  user_id       UUID REFERENCES users(id),
  submitted_by  UUID REFERENCES users(id),
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT,
  image_url   TEXT,
  is_read     BOOLEAN DEFAULT false,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(50) DEFAULT 'general',
  type_str      VARCHAR(50), -- Used in some server routes
  title         TEXT,
  actor_id      UUID REFERENCES users(id),
  actor_name    VARCHAR(200),
  actor_handle  VARCHAR(100),
  actor_avatar  TEXT,
  is_read       BOOLEAN DEFAULT false,
  link          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255),
  type        VARCHAR(100),
  date        TIMESTAMPTZ,
  location    VARCHAR(255),
  is_online   BOOLEAN DEFAULT false,
  color       VARCHAR(20),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS startups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255),
  logo        TEXT,
  color       VARCHAR(20),
  sector      VARCHAR(100),
  stage       VARCHAR(50),
  location    VARCHAR(100),
  founded     INTEGER,
  team_size   INTEGER,
  description TEXT,
  tech_stack  JSONB DEFAULT '[]',
  funding     VARCHAR(100),
  is_hiring   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institutions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(255),
  short_name       VARCHAR(50),
  logo             TEXT,
  color            VARCHAR(20),
  type             VARCHAR(100),
  location         VARCHAR(100),
  department       VARCHAR(255),
  focus_areas      JSONB DEFAULT '[]',
  description      TEXT,
  student_count    INTEGER,
  researcher_count INTEGER,
  website          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- PLATFORM SETTINGS
-- ═══════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════
-- ROLES & PERMISSIONS
-- ═══════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════
-- BILLING & SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════
-- ANNOUNCEMENTS
-- ═══════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════
-- JOBS (Kazi Board)
-- ═══════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type      ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_country   ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline  ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_featured  ON jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_created   ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_job       ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_applicant ON job_applications(applicant_id);

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
