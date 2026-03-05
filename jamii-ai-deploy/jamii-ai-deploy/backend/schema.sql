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
  role              VARCHAR(100),
  city              VARCHAR(100),
  bio               TEXT,
  skills            JSONB DEFAULT '[]',        -- ["Python","LangChain",...]
  interests         JSONB DEFAULT '[]',        -- ["NLP","Computer Vision",...]
  hourly_rate       VARCHAR(50),               -- "TZS 45K/hr"
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
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_handle  ON users(handle);
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_city    ON users(city);
CREATE INDEX idx_users_name_search ON users USING gin(name gin_trgm_ops);

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
CREATE TYPE post_category AS ENUM ('swali', 'mradi', 'habari', 'kazi');

CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  category    post_category DEFAULT 'swali',
  image_url   TEXT,
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
CREATE TYPE challenge_status     AS ENUM ('open', 'closed', 'judging', 'completed');
CREATE TYPE challenge_difficulty AS ENUM ('Rahisi', 'Kati', 'Ngumu');

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
CREATE TYPE resource_type AS ENUM ('Dataset', 'Tutorial', 'Guide', 'Research Paper', 'Tool');

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
CREATE TYPE news_category AS ENUM ('Tanzania', 'Global', 'Jamii');

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
CREATE TYPE event_type AS ENUM ('Hackathon', 'Webinar', 'Meetup', 'Workshop', 'Conference');

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
CREATE TYPE notif_type AS ENUM ('like', 'comment', 'follow', 'mention', 'challenge', 'news');

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  type        notif_type NOT NULL,
  entity_id   UUID,               -- post_id, challenge_id, etc
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
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
--  DONE
-- ─────────────────────────────────────────────────────────────────
-- psql output: "Schema ya JamiiAI imefanikiwa kuundwa! 🇹🇿"
SELECT 'Schema ya JamiiAI imefanikiwa! 🇹🇿' AS status;
