# 🚀 JamiiAI — Deployment Guide (Phase G)
## Vercel (Frontend) + Railway (Backend + PostgreSQL)

---

## 📁 MUUNDO WA FILES

```
jamii-ai/
├── frontend/                  ← Deploy hii Vercel
│   ├── pages/
│   │   ├── _app.js
│   │   ├── index.js           ← Landing page
│   │   ├── auth.js            ← Login / Register / Onboarding
│   │   ├── community.js       ← Main app (protected)
│   │   └── profile.js         ← Profile page (protected)
│   ├── components/
│   │   ├── JamiiAILanding.jsx
│   │   ├── JamiiAIAuth.jsx
│   │   ├── JamiiAICommunity.jsx
│   │   └── JamiiAIProfile.jsx
│   ├── lib/
│   │   ├── api.js             ← Axios client
│   │   └── auth.js            ← Auth context
│   ├── next.config.js
│   ├── vercel.json
│   ├── package.json
│   └── .env.local             ← Development only (gitignore hii!)
│
└── backend/                   ← Deploy hii Railway
    ├── server.js
    ├── schema.sql
    ├── package.json
    ├── railway.json
    ├── Procfile
    └── .env.example           ← Template tu (gitignore actual .env!)
```

---

## ═══════════════════════════════════════
## STEP 1 — SETUP GITHUB REPO
## ═══════════════════════════════════════

```bash
# 1. Unda repo mbili GitHub:
#    - jamii-ai-frontend
#    - jamii-ai-backend

# Frontend
cd frontend
git init
git add .
git commit -m "feat: JamiiAI frontend initial commit"
git remote add origin https://github.com/WEWE/jamii-ai-frontend.git
git push -u origin main

# Backend
cd ../backend
git init
git add .
git commit -m "feat: JamiiAI backend initial commit"
git remote add origin https://github.com/WEWE/jamii-ai-backend.git
git push -u origin main
```

⚠️  **MUHIMU:** Unda `.gitignore` kabla ya push:
```
# .gitignore (tumia kwa frontend na backend)
node_modules/
.env
.env.local
.env.production
.DS_Store
.next/
dist/
```

---

## ═══════════════════════════════════════
## STEP 2 — DEPLOY BACKEND (Railway)
## ═══════════════════════════════════════

### 2a. Unda project Railway

1. Nenda → **railway.app** → Login na GitHub
2. Click **"New Project"**
3. Chagua **"Deploy from GitHub repo"**
4. Chagua `jamii-ai-backend`
5. Railway itadetect Node.js automatically ✅

### 2b. Ongeza PostgreSQL

1. Kwenye project yako → Click **"+ New"**
2. Chagua **"Database" → "PostgreSQL"**
3. Railway itaunda database na ku-set `DATABASE_URL` automatically ✅

### 2c. Weka Environment Variables

Railway Dashboard → **Variables** tab → Ongeza:

```
JWT_SECRET        = [generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
CLIENT_URL        = https://jamii-ai.vercel.app   ← (utabadilisha baadaye)
NODE_ENV          = production
PORT              = 4000
```

> `DATABASE_URL` itajaza yenyewe kutoka PostgreSQL plugin ✅

### 2d. Run Database Schema

Baada ya Railway kudeploy backend:

```bash
# Option 1: Railway CLI
npm install -g @railway/cli
railway login
railway run psql $DATABASE_URL -f schema.sql

# Option 2: Railway Dashboard
# Settings → Database → Connect → paste schema.sql content
```

### 2e. Verify backend inafanya kazi

```bash
curl https://jamii-ai-backend.up.railway.app/api/health
# Jibu: {"status":"ok","app":"JamiiAI","time":"..."}
```

---

## ═══════════════════════════════════════
## STEP 3 — DEPLOY FRONTEND (Vercel)
## ═══════════════════════════════════════

### 3a. Unda project Vercel

1. Nenda → **vercel.com** → Login na GitHub
2. Click **"New Project"**
3. Import `jamii-ai-frontend`
4. Framework: **Next.js** (auto-detected) ✅
5. Root Directory: **`./`** (au `frontend/` kama uko monorepo)

### 3b. Weka Environment Variables

Vercel Dashboard → **Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://jamii-ai-backend.up.railway.app
```

### 3c. Deploy

Click **"Deploy"** — Vercel itabuild na kutoa URL kama:
`https://jamii-ai-xxxxxx.vercel.app`

### 3d. Update Backend CORS

Rudi Railway → Variables → Badilisha:
```
CLIENT_URL = https://jamii-ai-xxxxxx.vercel.app
```

---

## ═══════════════════════════════════════
## STEP 4 — CUSTOM DOMAIN (Optional)
## ═══════════════════════════════════════

Kama una domain (e.g., `jamii.ai`):

### Vercel (Frontend):
```
Vercel Dashboard → Settings → Domains → Add "jamii.ai"
```
Kisha DNS records kwenye domain registrar:
```
Type: A       Name: @    Value: 76.76.21.21
Type: CNAME   Name: www  Value: cname.vercel-dns.com
```

### Railway (Backend):
```
Railway → Settings → Domains → Add "api.jamii.ai"
```
DNS:
```
Type: CNAME   Name: api   Value: [railway-provided-value].up.railway.app
```

---

## ═══════════════════════════════════════
## STEP 5 — VERIFY EVERYTHING INAFANYA KAZI
## ═══════════════════════════════════════

```bash
# ✅ Check 1: Backend health
curl https://api.jamii.ai/api/health

# ✅ Check 2: Register mtumiaji
curl -X POST https://api.jamii.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@jamii.ai","password":"password123"}'

# ✅ Check 3: Frontend inaload
open https://jamii.ai
```

---

## ═══════════════════════════════════════
## PRICING (Free tiers)
## ═══════════════════════════════════════

| Service  | Plan  | Limit                  | Bei        |
|----------|-------|------------------------|------------|
| Vercel   | Hobby | 100GB bandwidth/mo     | **FREE** ✅ |
| Railway  | Hobby | $5 credit/mo           | ~**FREE** ✅|
| Railway PostgreSQL | - | 1GB storage | Included ✅|

> Railway hutoa $5 credit ya kila mwezi — kwa app ndogo inakutosha kabisa!

---

## ═══════════════════════════════════════
## QUICK COMMANDS (baada ya setup)
## ═══════════════════════════════════════

```bash
# Angalia logs za backend (Railway CLI)
railway logs

# Redeploy baada ya code change
git push origin main   # Auto-deploy Railway na Vercel ✅

# Connect database directly (debugging)
railway connect PostgreSQL

# Local development
# Terminal 1 — Backend
cd backend && npm run dev   # http://localhost:4000

# Terminal 2 — Frontend
cd frontend && npm run dev  # http://localhost:3000
```

---

## ═══════════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════════

| Tatizo | Sababu | Fix |
|--------|--------|-----|
| CORS error | CLIENT_URL si sahihi | Update Railway variable |
| 401 Unauthorized | JWT_SECRET tofauti | Check Railway variables |
| DB connection failed | DATABASE_URL wrong | Check Railway PostgreSQL plugin |
| Build failed Vercel | Missing env vars | Check Vercel → Settings → Env |
| Schema tables missing | Haujafanya psql | Run schema.sql kwenye Railway |

---

**🇹🇿 JamiiAI — Made in Tanzania. Built to last.**
