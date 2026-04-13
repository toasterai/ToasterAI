# ToasterAI

**Don't get burnt by a bot.** 🍞🔥

ToasterAI is an AI-generated image detector designed for dating app users. Upload a photo — we'll toast it and tell you if it's likely real or AI-generated.

## Quick Start

```bash
# 1. Install all dependencies
cd toasterai
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Start both servers
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Auth | bcryptjs + JWT |
| Image Processing | sharp, exifr |
| Upload | multer (memory storage) |

## How It Works

1. **Upload** — User uploads an image (file, URL, or clipboard paste)
2. **Hash** — SHA256 hash is computed immediately. The image is never permanently stored.
3. **Analyze** — 6 parallel analyzers examine the image:
   - **Pixel Analyzer** — Checks skin smoothness, noise consistency, color banding, background repetition
   - **Metadata Analyzer** — Reads EXIF data, camera info, AI software signatures, image dimensions
   - **Frequency Analyzer** — Detects GAN frequency fingerprints, checkerboard artifacts
   - **Face Analyzer** — Measures facial symmetry, skin uniformity, hair boundaries, eye reflections
   - **Watermark Analyzer** — Checks C2PA credentials, IPTC tags, LSB patterns, AI service signatures
   - **Compression Analyzer** — JPEG quality analysis, double compression, uniformity checks
4. **Score** — Weighted combination with confidence calibration produces a 0-100 "Freshness Score"
5. **Explain** — Technical findings are converted to friendly, plain-language explanations
6. **Display** — Results shown as a toast category: Fresh Bread, Lightly Toasted, Getting Crispy, or Burnt Toast

## Freshness Score Categories

| Score | Category | Meaning |
|-------|----------|---------|
| 0-25 | 🍞 Fresh Bread | Looks like a real human! |
| 26-50 | 🍞 Lightly Toasted | Probably real, minor flags |
| 51-75 | 🍞 Getting Crispy | Some suspicious signs detected |
| 76-100 | 🔥 Burnt Toast | High probability of AI generation |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/scan/single` | Upload single image |
| POST | `/api/scan/gallery` | Upload 2-6 images (Premium) |
| POST | `/api/scan/url` | Analyze image from URL |
| GET | `/api/scan/history` | Paginated scan history |
| GET | `/api/scan/:id` | Specific scan result |
| POST | `/api/feedback/:scanId` | Submit accuracy feedback |

## Privacy & Security

- **Images are NEVER stored.** Processed in memory, deleted immediately after analysis.
- **Only SHA256 hashes** are stored in the database for history/dedup.
- **Passwords** hashed with bcrypt (12 salt rounds).
- **JWT tokens** expire in 7 days.
- **Rate limiting:** 30 requests/minute per IP. Free: 3 scans/day. Premium: unlimited.
- **Helmet + CORS** configured. No image data in logs.

## Project Structure

```
toasterai/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route pages
│       ├── hooks/              # Auth + scan state hooks
│       └── utils/              # API client
├── server/
│   ├── routes/                 # Auth, scan, feedback endpoints
│   ├── middleware/             # JWT auth, rate limiter, file validation
│   ├── services/
│   │   ├── analyzers/          # 7 image analysis modules
│   │   ├── detector.js         # Orchestrator
│   │   ├── scoring.js          # Score combination
│   │   └── humanExplainer.js   # Technical → friendly text
│   └── db/                     # SQLite setup
└── README.md
```

## Roadmap

### Scam Pattern Detector
Analyze profile text for love-bombing, urgency tactics, isolation language. Combine with image analysis for a holistic "Dating Scam Risk Score."

### Browser Extension
Chrome/Firefox extension that passively scans dating sites and shows ToasterAI ratings as an overlay on profile photos.

### Reverse Image Search Plus
Standard reverse search misses AI faces (they've never existed). ToasterAI would analyze pixel DNA and compare against known AI generation signatures.

### ML Model Integration
Replace heuristic analyzers with trained models (DIRE, UniversalFakeDetect, or custom CNN). The modular analyzer architecture makes this a drop-in replacement.

### Behavioral Analysis API
For dating platforms (B2B): API combining image analysis + profile text + messaging patterns + account metadata for a comprehensive trust score.

### Regional Scam Pattern Library
Localized scam pattern detection for LATAM, Southeast Asia, and other regions with region-specific romance scam tactics.

## Deployment

**Local (MVP):** Runs with `npm run dev` using concurrently (Vite on 5173, Express on 3001).

**Production:**
- Frontend → Vercel or Netlify (static build)
- Backend → Railway, Render, or Fly.io
- Database → Migrate SQLite to PostgreSQL
- Images → Process in-memory only (no disk writes)

## Environment Variables

Copy `.env.example` to `server/.env` and customize:

```
PORT=3001
JWT_SECRET=your-secret-here
NODE_ENV=development
```

---

Built with 🍞 by ToasterAI
