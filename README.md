# ☕ Teh Ais — Backend API

> **KitaHack 2025 Hackathon Project**
> Vertex AI (Gemini 2.5 Flash) + Firestore powered backend for a university student collaboration platform.

## 🔗 Prototype Access

**Live Demo:** [https://kitahack-app--kitahack-tehais.us-central1.hosted.app/](https://kitahack-app--kitahack-tehais.us-central1.hosted.app/)

**API Health Check:** [https://kitahack-app--kitahack-tehais.us-central1.hosted.app/api/health](https://kitahack-app--kitahack-tehais.us-central1.hosted.app/api/health)

---

## 📐 Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Flutter Web (Frontend)                       │
│               kitahack-tehais.web.app (Firebase Hosting)         │
└───────────────────────────┬─────────────────────────────────────┘
                            │  REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│   Node.js / Express Backend (Firebase App Hosting / Cloud Run)   │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                    API Routes Layer                      │    │
│   │  /api/users  /api/tags  /api/posts  /api/matches         │    │
│   │  /api/events  /api/chats  /api/insights  /api/storage    │    │
│   └──────────────────────────┬──────────────────────────────┘    │
│                              │                                    │
│   ┌──────────────────────────┼──────────────────────────────┐    │
│   │                  Service Layer                           │    │
│   │                          │                               │    │
│   │  ┌───────────────┐  ┌───┴──────────┐  ┌──────────────┐  │    │
│   │  │  AI Service   │  │ AIDB Manager │  │ Data Services│  │    │
│   │  │ (10 Gemini    │  │ (Tag Cache + │  │ (Users, Tags │  │    │
│   │  │  functions)   │  │  Smart Query │  │  Posts, etc.) │  │    │
│   │  │               │  │  Pre-filter) │  │              │  │    │
│   │  └───────┬───────┘  └──────┬───────┘  └──────┬───────┘  │    │
│   │          │                 │                  │           │    │
│   └──────────┼─────────────────┼──────────────────┼──────────┘    │
│              │                 │                  │               │
│   ┌──────────┼─────────────────┼──────────────────┼──────────┐    │
│   │          ▼                 ▼                  ▼           │    │
│   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │    │
│   │  │  Vertex AI   │   │  Firestore  │   │  Firebase   │    │    │
│   │  │  Gemini 2.5  │   │  (NoSQL DB) │   │  Storage    │    │    │
│   │  │    Flash     │   │  7 collections│  │  (Files)    │    │    │
│   │  └─────────────┘   └─────────────┘   └─────────────┘    │    │
│   └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer        | Technology                                   |
| :----------- | :------------------------------------------- |
| Runtime      | Node.js ≥ 18                                 |
| Framework    | Express.js 4.x                               |
| AI Engine    | Google Vertex AI — Gemini 2.5 Flash          |
| Database     | Cloud Firestore (NoSQL)                      |
| Auth         | Firebase Admin SDK (token verification)      |
| File Storage | Firebase Storage + Multer                    |
| Hosting      | Firebase App Hosting (Cloud Run)             |
| Security     | Helmet, CORS, express-rate-limit             |
| Region       | `us-central1`                                |
| Project      | `kitahack-tehais`                            |

---

## 🏗️ Implementation Details

### Project Structure

```
kitahack-backend/
├── server.js                   # Express app entry point
├── package.json                # Dependencies & scripts
├── Dockerfile                  # Cloud Run container config
├── apphosting.yaml             # Firebase App Hosting config
├── firebase.json               # Firebase project config
├── config/
│   ├── firebase.js             # Firestore + Admin SDK init
│   └── vertex.js               # Vertex AI dual model setup
├── middleware/
│   ├── auth.js                 # Firebase Auth token verification
│   └── errorHandler.js         # Global error handler
├── routes/
│   ├── users.routes.js         # Profile, auto-tag, resume
│   ├── tags.routes.js          # Tag CRUD with cache invalidation
│   ├── posts.routes.js         # Post CRUD, AI tagging
│   ├── matches.routes.js       # AI matching, smart search, auto-pair
│   ├── events.routes.js        # Events, AI recommend, AI invite
│   ├── chats.routes.js         # Temp chat rooms & messages
│   ├── insights.routes.js      # AI dashboard + JARVIS agent
│   └── storage.routes.js       # File upload/download
├── services/
│   ├── ai.service.js           # 10 Gemini AI functions
│   ├── aidb.service.js         # AI Database Manager (cache + pre-filter)
│   ├── users.service.js        # User Firestore operations
│   ├── tags.service.js         # Tag Firestore operations
│   ├── posts.service.js        # Post Firestore operations
│   ├── matches.service.js      # Match Firestore operations
│   ├── events.service.js       # Event Firestore operations
│   ├── eventMatches.service.js # EventMatch Firestore operations
│   └── chats.service.js        # Chat Firestore operations
├── seed_demo.js                # Demo data seed script
├── seed_linkedin.js            # LinkedIn-style seed data
└── seed_teams.js               # Team pairing seed data
```

### API Endpoints

| Method | Endpoint                       | Description                              |
| :----- | :----------------------------- | :--------------------------------------- |
| GET    | `/api/health`                  | Health check with Vertex AI model info   |
| GET    | `/api/users/profile`           | Get current user profile                 |
| PUT    | `/api/users/profile`           | Update profile                           |
| POST   | `/api/users/auto-tag`          | AI auto-tag user from free text          |
| POST   | `/api/users/generate-resume`   | AI resume generation                     |
| GET    | `/api/tags`                    | List all tags (cached)                   |
| POST   | `/api/tags`                    | Create tag + invalidate cache            |
| GET    | `/api/posts`                   | List posts (open/all)                    |
| POST   | `/api/posts`                   | Create a recruitment post                |
| POST   | `/api/posts/auto-tag`          | AI auto-tag a post                       |
| POST   | `/api/posts/create-from-description` | AI-generated post from description  |
| POST   | `/api/matches/find-candidates` | AI find best-fit candidates for a post   |
| POST   | `/api/matches/smart-search`    | Natural language teammate search         |
| POST   | `/api/matches/auto-pair`       | AI auto-pair teams                       |
| POST   | `/api/matches/apply`           | Apply to a post                          |
| POST   | `/api/events/recommend`        | AI event recommendations                 |
| POST   | `/api/events/search`           | AI event search by prompt                |
| POST   | `/api/events/:id/ai-invite`    | AI invite best-fit users to event        |
| GET    | `/api/insights`                | AI dashboard insights + greeting         |
| POST   | `/api/insights/ai-command`     | JARVIS AI agent command execution        |
| GET    | `/api/chats`                   | List user's temp chats                   |
| POST   | `/api/chats/:chatId/messages`  | Send message in temp chat                |

### Core AI Functions (ai.service.js)

| # | Function                     | Purpose                                           |
|---|------------------------------|---------------------------------------------------|
| 1 | `autoTagUser()`             | Map free-text bio → standardized tag IDs          |
| 2 | `autoTagPost()`             | Map post description → requirement tag IDs        |
| 3 | `matchCandidatesToPost()`   | Score & rank candidates for a project post        |
| 4 | `matchUserToEvents()`       | Score & rank events for a user's profile          |
| 5 | `smartSearchCandidates()`   | Natural language search → ranked results          |
| 6 | `createTeamFromDescription()`| Generate full post from free-text description    |
| 7 | `generateInsights()`        | Dashboard greeting + actionable insights          |
| 8 | `searchEventsByPrompt()`    | AI event search with relevance scoring            |
| 9 | `autoPairTeams()`           | Auto-pair optimal teams from candidate pool       |
| 10| `generateResume()`          | AI resume generation from profile data            |

### AI Database Manager (aidb.service.js)

The performance-critical layer that prevents full-collection scans:

| Feature | Implementation | Impact |
|---------|---------------|--------|
| **Tag Cache** | In-memory with 5-minute TTL | 1K reads → 0 (between refreshes) |
| **Smart Pre-filter** | Firestore `array-contains` on `dev_tags` + `major_id` queries | 10K reads → 50-200 |
| **Purpose-built queries** | `findCandidatesForPost`, `smartQueryUsers`, `findUsersForEvent`, `getInsightContext` | Eliminates generic fetches |
| **Batched lookups** | `getUsersByUids()` with chunked Firestore `in` queries (max 30) | Targeted reads only |
| **Random sampling** | `sampleUsers()` via orderBy + startAfter with random doc ID | Diversity without full scan |

### Vertex AI Configuration

Two model instances for different use cases:

```javascript
// Text generation — conversational responses, insights
generativeModel: {
  model: 'gemini-2.5-flash',
  temperature: 0.4,
  maxOutputTokens: 2048
}

// JSON generation — structured data (tags, scores, matches)
jsonModel: {
  model: 'gemini-2.5-flash',
  temperature: 0.2,
  maxOutputTokens: 4096,
  responseMimeType: 'application/json'  // Forces valid JSON output
}
```

### Database Schema (Firestore)

7 collections powering the platform:

| Collection     | Documents | Purpose                                      |
| :------------- | :-------- | :------------------------------------------- |
| `Users`        | 10,000+   | Student profiles with skill/course/dev tags  |
| `Tags`         | 1,000+    | Standardized taxonomy (Major, Course, Skill, DevArea) |
| `Posts`         | Variable  | Recruitment posts with AI-tagged requirements |
| `Matches`       | Variable  | AI recommendations + organic applications    |
| `Events`        | Variable  | University events with related tags          |
| `EventMatches`  | Variable  | User-event connections (AI invite, search, browse) |
| `TempChats`     | Variable  | 48-hour expiring chat rooms + Messages subcollection |

---

## ⚡ Challenges Faced

1. **Massive Data Scale (10K Users × 1K Tags)** — Every AI operation was calling `getAllUsers()` + `getAllTags()`, resulting in ~11K Firestore reads per API call. At scale, this was unsustainable and slow. **Solution:** Built the AI Database Manager (`aidb.service.js`) with in-memory tag cache (5-min TTL) and smart user pre-filtering by skill overlap, reducing reads by 95%+ per call.

2. **Vertex AI JSON Reliability** — Gemini's text model frequently returned malformed JSON wrapped in markdown code fences, with trailing commentary, or with invalid syntax. This caused cascading failures across all AI endpoints. **Solution:** Created a dedicated `jsonModel` with `responseMimeType: 'application/json'` that forces valid JSON output, plus a multi-layer fallback parser (strip fences → find first `{`/`[` → regex extraction).

3. **Production DNS Resolution** — After deploying to Firebase App Hosting, all API calls from the frontend failed with `ERR_NAME_NOT_RESOLVED`. **Solution:** The `firebase.json` rewrites were pointing to the wrong Cloud Run service name. Corrected the service identifier to match the actual App Hosting backend.

4. **Rate Limiting on Vertex AI** — Demo scenarios with rapid-fire AI calls (auto-tag → match → pair → insights) triggered 429 rate limits. **Solution:** Implemented exponential backoff with jitter (2^attempt × 1000ms + random 500ms, up to 3 retries) in the Vertex AI client layer, ensuring graceful degradation under load.

5. **CORS + CSP for Flutter Web** — Flutter Web compiled to WASM requires very permissive Content Security Policy. Google Fonts, Firebase Auth popups, and service workers each needed specific CSP directives that conflicted with Helmet's defaults. **Solution:** Disabled Helmet's CSP entirely and configured custom CORS origins for all frontend deployment URLs.

6. **Firestore Query Limitations** — Firestore's `array-contains` only supports a single value per query, but AI matching requires checking overlap across multiple tags. **Solution:** The AIDB Manager runs up to 5 parallel `array-contains` queries on different tags, merges results into a `Map` (deduplication), then scores the merged set by full skill overlap in-memory.

---

## 🗺️ Future Roadmap (by 28 March — Final Round)

### Week 1 (1–7 Mar) — Reliability & Edge Cases
- [ ] Stress test AIDB Manager with full 10K user dataset under concurrent load
- [ ] Add retry logic and graceful degradation for all AI endpoints
- [ ] Fix edge cases in temp chat expiration and match status transitions
- [ ] Improve JSON response validation with schema-level checks

### Week 2 (8–14 Mar) — AI Accuracy & Smart Features
- [ ] Fine-tune matching prompts for higher candidate relevance scores
- [ ] Add match explanation transparency (show why AI recommended each candidate)
- [ ] Implement multi-turn JARVIS conversations with session context
- [ ] Add Firestore composite indexes for optimized multi-field queries

### Week 3 (15–21 Mar) — API Expansion & Integrations
- [ ] Complete enterprise recruiter API endpoints for candidate pipeline
- [ ] Build school admin endpoints for event publishing and analytics
- [ ] Add webhook-based real-time notifications for match/chat updates
- [ ] Spectrum UM data import endpoint for auto-profile population

### Week 4 (22–28 Mar) — Final Polish & Demo Prep
- [ ] Performance optimization and Cloud Run cold-start reduction
- [ ] Rate limiting tuning for demo scenarios (burst-friendly)
- [ ] Comprehensive API documentation with request/response examples
- [ ] Demo seed data refresh and presentation preparation

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Firebase CLI
- Google Cloud project with Vertex AI API enabled
- Firestore database created

### Environment Variables

```env
PORT=3000
GCP_PROJECT_ID=kitahack-tehais
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=./kitahack-tehais-firebase-adminsdk-fbsvc-xxxxx.json
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/YJ0310/kitahack-backend.git
cd kitahack-backend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Or start production server
npm start
```

### Deployment

The backend auto-deploys to Firebase App Hosting when pushing to the `sek2` branch:

```bash
git push origin sek2
# Triggers Cloud Build → Cloud Run deployment automatically
```

Manual rollout:
```bash
firebase apphosting:rollouts:create kitahack-app --project kitahack-tehais --git-branch sek2
```

---

## 👥 Team

- **Yin Jia Sek** — Full-Stack Developer, AI Integration
- **Ruo Qian** — Backend Architecture
- **Jia Qian** — Database Design
- **Jolin Lee** — Frontend UI/UX

---

## 📄 License

This project was built for KitaHack 2025. All rights reserved.
