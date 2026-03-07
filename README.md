# 🌍 JamiiAI

**Jamii ya AI Tanzania** — A community platform for AI developers, researchers, students, and startups across East Africa. Built with Next.js, Node.js, PostgreSQL, and real-time Socket.io.

> *Jengwa Tanzania. Kwa Afrika.*

---

## ✨ Features

### Community
- 📝 **Feed** — Post, like, comment, bookmark. Filter by category or following
- 👤 **Profiles** — Public profiles with follow system, follower/following counts
- 💬 **Direct Messages** — Real-time DMs with typing indicators and read receipts
- 🔔 **Notifications** — Live bell with in-app notifications via Socket.io
- 🔍 **Search** — Unified search across users, posts, jobs, resources, and challenges

### Content
- 📰 **Habari** — AI news scraped from TechMoran, VentureBeat, TechCrunch, Disrupt Africa — auto-summarized in Kiswahili using Claude AI
- 🏆 **Changamoto** — AI challenges aggregated from Kaggle, AIcrowd, Zindi Africa, and Devpost
- 📚 **Rasilimali** — Community-submitted resources (datasets, tutorials, research papers, tools)
- 📅 **Matukio** — Events with RSVP — hackathons, webinars, meetups, conferences
- 🏢 **Startups & Vyuo** — Tanzanian AI startups and institutions directory

### Jobs (Kazi Board)
- 💼 Post and discover AI/tech jobs across East Africa
- Filter by type (full-time, remote, internship, freelance, contract)
- Apply directly on-platform with CV upload and cover letter
- Featured and Hot job badges

### Admin Panel (`admin.jamii.ai`)
- 📊 Dashboard with live stats — users, posts, revenue, flagged content
- 👥 User management — ban, verify, assign roles
- 🛡 Content moderation — review flagged posts
- 🔑 RBAC — Super Admin / Admin / Moderator / Editor / Analyst
- 📰 Habari inbox — review Apify-scraped articles, edit AI summaries, publish
- 🏆 Changamoto management — approve, feature, track participants
- 💼 Kazi board — approve job postings, feature/hot toggles
- 📣 Announcements — broadcast in-app, email, or WhatsApp
- 📈 Analytics — DAU, retention, top content, revenue
- ⚙️ Settings — Apify config, SMTP, platform settings — saved to DB

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (Vercel)                   │
│   jamii.ai (Next.js)    admin.jamii.ai (Next.js)     │
└──────────────┬─────────────────────┬─────────────────┘
               │   REST API + WS     │
               ▼                     ▼
┌──────────────────────────────────────────────────────┐
│                  BACKEND (Railway)                    │
│              Node.js / Express / Socket.io            │
└──────────┬───────────────────────────────────────────┘
           │
    ┌──────┴───────┐
    ▼              ▼
PostgreSQL     External APIs
(Railway)      • Anthropic Claude (Kiswahili summaries)
               • Apify (news + job scraping)
               • Cloudinary (image/CV uploads)
               • Kaggle / AIcrowd / Zindi (challenges)
               • SMTP / Brevo (email)
               • Stripe (billing)
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, DM Sans, Tailwind |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 15 |
| Real-time | Socket.io |
| File Uploads | Cloudinary + Multer |
| AI Summaries | Anthropic Claude API |
| News Scraping | Apify (Cheerio Scraper) |
| Challenges | Kaggle API, AIcrowd API, Zindi (Apify), Devpost |
| Email | Nodemailer + SMTP / Brevo |
| Billing | Stripe |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

---

## 📁 Project Structure

```
jamii-ai/
├── frontend/                  # Next.js — jamii.ai
│   ├── pages/
│   │   ├── index.jsx          # Landing page
│   │   ├── auth.jsx           # Login, Register, Onboarding
│   │   ├── app.jsx            # Main community app
│   │   ├── search.jsx         # Search results
│   │   └── mazungumzo.jsx     # Direct messages
│   ├── components/
│   │   ├── SearchBar.jsx
│   │   ├── ImageUpload.jsx
│   │   ├── FollowButton.jsx
│   │   └── NotificationBell.jsx
│   ├── lib/
│   │   └── api.js             # Axios client + all API calls
│   └── hooks/
│       ├── useConversations.js
│       └── useNotifications.js
│
├── admin/                     # Next.js — admin.jamii.ai
│   └── pages/
│       └── index.jsx          # Full admin panel (12 sections)
│
├── backend/
│   └── server.js              # Express + Socket.io (all routes)
│
└── database/
    └── schema.sql             # PostgreSQL schema (16+ tables)
```

---

## 🗄 Database Schema

```
users                 posts               follows
comments              post_likes          bookmarks
notifications         messages            challenges
challenge_registrations resources         jobs
job_applications      saved_jobs          events
event_registrations   news                startups
institutions          subscriptions       invoices
announcements         roles               user_roles
platform_settings
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15
- Cloudinary account
- Apify account (for news scraping)
- Anthropic API key

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/jamii-ai.git
cd jamii-ai
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env (see Environment Variables below)
```

Run the database schema:
```bash
psql $DATABASE_URL < database/schema.sql
```

Start the backend:
```bash
npm run dev   # http://localhost:4000
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL etc.
npm run dev   # http://localhost:3000
```

### 4. Admin panel setup

```bash
cd admin
npm install
cp .env.local.example .env.local
npm run dev   # http://localhost:3001
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/jamii_ai

# Auth
JWT_SECRET=your_64_char_secret_here
PORT=4000
NODE_ENV=development

# URLs
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
BACKEND_URL=http://localhost:4000

# Anthropic (AI summaries)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Apify (news scraping)
APIFY_API_TOKEN=apify_api_...
APIFY_ACTOR_ID=apify~cheerio-scraper

# Cloudinary (uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
SMTP_PASSWORD=your_app_password

# Challenges
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_API_KEY=your_kaggle_key
AICROWD_API_KEY=your_aicrowd_key

# Billing (optional)
STRIPE_SECRET_KEY=sk_test_...
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=jamii_uploads
```

---

## 🌐 Deployment

### Backend → Railway

1. Create a new Railway project
2. Add a **PostgreSQL** plugin — `DATABASE_URL` fills automatically
3. Connect your GitHub repo (backend folder)
4. Add all environment variables from the list above
5. Railway deploys on every push to `main`

### Frontend → Vercel

```bash
vercel --prod
```

Set environment variables in the Vercel dashboard. Use separate Vercel projects for `jamii.ai` and `admin.jamii.ai`.

### DNS

```
jamii.ai        → CNAME → cname.vercel-dns.com
admin.jamii.ai  → CNAME → cname.vercel-dns.com
```

### First Admin Account

After deploying, register an account then promote it via SQL:

```sql
-- Get your user ID first
SELECT id FROM users WHERE email = 'your@email.com';

-- Assign super_admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 42, id FROM roles WHERE name = 'super_admin';
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/onboard` | Complete onboarding |

### Community
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts?feed=all\|following` | Feed |
| POST | `/api/posts` | Create post |
| POST | `/api/posts/:id/like` | Like/unlike |
| GET | `/api/users/suggestions` | Who to follow |
| POST | `/api/users/:id/follow` | Follow/unfollow |
| GET | `/api/search?q=&type=` | Unified search |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Conversations list |
| GET | `/api/messages/:userId` | Message thread |
| POST | `/api/messages/:userId` | Send message |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs |
| POST | `/api/jobs` | Post a job |
| POST | `/api/jobs/:id/apply` | Apply |
| POST | `/api/jobs/:id/save` | Save/unsave |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | User list |
| PATCH | `/api/admin/users/:id/ban` | Ban/unban |
| POST | `/api/admin/apify/run` | Trigger news scrape |
| GET | `/api/admin/settings` | Platform settings |
| POST | `/api/admin/announcements` | Broadcast message |

---

## 🌍 Supported Languages

| Sehemu | Lugha |
|--------|-------|
| UI / Navigation | Kiswahili |
| AI news summaries | Kiswahili (Claude API) |
| Code / Docs | English |
| Admin panel | English + Kiswahili |

---

## 💰 Pricing Tiers

| Plan | Messages | Bei |
|------|----------|-----|
| Free | 50/month | TSH 0 |
| Basic | 500/month | TSH 50,000 |
| Pro | 5,000/month | TSH 150,000 |
| Enterprise | Unlimited | Custom |

---

## 🤝 Contributing

Contributions za AI developers wa Tanzania na Afrika zanakaribisha sana.

```bash
# Fork the repo
git checkout -b feature/jina-la-feature
git commit -m "feat: elezea mabadiliko yako"
git push origin feature/jina-la-feature
# Open a Pull Request
```

Please follow the existing code style and write descriptive commit messages.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

Built by **[Davy Swai](https://github.com/Swai-D)** · Tanzania 🇹🇿

---

<div align="center">
  <strong>🌍 Jengwa Tanzania. Kwa Afrika. Kwa Dunia.</strong>
</div>
