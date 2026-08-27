# RAG-Based College Chatbot — Spec-Driven Build Sheet
### Subject Institute: IIIT Pune (iiitp.ac.in) | Difficulty: Medium

This is a spec-first document, written to be fed into an agentic builder (Antigravity). Each phase has: **Goal → Deliverables → Steps → Definition of Done (DoD)**. Follow phases in order — don't start Phase N+1 until Phase N's DoD is met. Bonus features are woven in as **Phase 7**, each independently pluggable so you can cut scope near the deadline without breaking the core.

---

## 0. Project Overview

**What you're building:** A chatbot that answers student questions about IIIT Pune using only information retrieved from real IIIT Pune documents (admissions brochure, department pages, fee structure, academic calendar, hostel/library rules, placement stats, scholarships, policies, events) — not from the LLM's general knowledge. Every answer must be traceable to a source chunk.

**Non-negotiable architectural rule:** If you ever call the LLM without first running a retrieval step and stuffing retrieved chunks into the prompt, it's not a RAG project — it's a wrapper. The grader will explicitly check for a working vector search step.

**Core loop:**
```
Upload Document → Extract Text → Chunk → Embed → Store in Vector DB
                                                        │
User Question → Embed Question → Similarity Search ────┘
                     │
             Top-K Relevant Chunks
                     │
        Prompt = System Instructions + Chunks + Question
                     │
                  LLM Call
                     │
        Answer + Cited Source(s) → shown to user
```

---

## 1. Recommended Tech Stack

**Locked stack (per your call): Node.js + Express backend, MongoDB database.**

| Layer | Recommended | Why |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | Fast iteration, clean component styling for the college theme |
| Backend | **Node.js + Express** | JS end-to-end, huge ecosystem, easy to deploy |
| Auth | JWT (`jsonwebtoken` + `bcrypt`) | Simple, no need to over-engineer |
| Database | **MongoDB** (via Mongoose ODM) | Users, documents metadata, conversations, feedback, analytics |
| Vector Search | **MongoDB Atlas Vector Search** (recommended) **or** a separate vector DB (Qdrant/Chroma) if self-hosting Mongo | Atlas Vector Search keeps everything in one database — no second service to run. Only self-hosted (non-Atlas) MongoDB lacks native vector search, which is why Atlas is the default here |
| Embeddings | OpenAI `text-embedding-3-small` **or** `@xenova/transformers` (`all-MiniLM-L6-v2`, runs locally in Node, free) | MiniLM via Xenova if you want zero API cost |
| LLM | OpenAI GPT-4o-mini / Groq (Llama 3) / Gemini Flash | Groq or Gemini Flash if you want a free tier |
| File storage | Local disk (dev, via `multer`) → S3 / Cloudinary (prod) | For uploaded PDFs |
| Deployment | Frontend: Vercel/Netlify · Backend: Render/Railway · DB: **MongoDB Atlas** (free M0 tier supports Vector Search) | All have free tiers sufficient for a college project |

**Decision to lock before Phase 1:** MongoDB Atlas (cloud, native Vector Search, recommended) vs. self-hosted MongoDB + a bolt-on vector DB (Qdrant/Chroma). Recommendation: **MongoDB Atlas** — one database to manage, one connection string, no second service, and the free tier is enough for this project. Only go self-hosted + Qdrant if you specifically need to run fully offline/on-prem.

---

## 2. Data Sources — What to Pull From iiitp.ac.in

I checked the site — it's a JS-rendered site so raw scraping needs a headless browser (Playwright/Selenium) rather than plain `requests`. Known usable sources so far:

- Official admission brochure PDF (structured, text-extractable): `https://www.iiitp.ac.in/sites/default/files/2019-06/Download_Admission%20Brochure.pdf` — good seed doc, has Academics, Academic Departments, Course Structures, Co-curricular, ICPC, Achievements, Induction Schedule.
- Site sections to scrape (check current URLs on the live site, they may have changed since 2019): Admissions, Departments, Academic Calendar, Hostel, Library, Clubs, Placements, Scholarships, Policies, Events, Fees, Notices/Circulars page.
- Background facts confirmed: Established 2016, Institute of National Importance (2017), PPP model, Director: Prof. Vineet Kansal, 100-acre campus at Sadumbre/Nanoli-Tarf Chakan, Maval, Pune, ~1500+ students (1200+ UG, 70+ PG, 90+ PhD), colors Blue & Red.

**Action item for you (I can't browse the live rendered site or download files myself in this chat):** Open iiitp.ac.in, go through Admissions / Departments / Notices / Academic Calendar / Placements pages, and either:
1. Save each relevant page as PDF (Ctrl+P → Save as PDF), or
2. Copy the page text into `.txt` files, or
3. Download any linked PDFs (fee structure, calendar, brochures) directly.

Drop them all in a `seed-documents/` folder — this becomes your test corpus for Phase 2 onward, organized by category (this doubles as your data for the "Department-wise knowledge bases" bonus feature):
```
seed-documents/
  admissions/
  departments/
  fees/
  academic-calendar/
  hostel/
  library/
  clubs/
  placements/
  scholarships/
  policies/
  events/
```
If you get stuck finding a specific page or PDF on the live site, tell me the section and I'll search for it.

---

## 3. Database Schema (Mongoose / MongoDB)

Each block below is a Mongoose schema — put each in its own `models/*.js` file.

```js
// models/User.js — needed for auth + role-based access bonus
const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  role: { type: String, enum: ['student', 'admin', 'faculty'], default: 'student' },
}, { timestamps: true });

// models/Collection.js — bonus: multiple collections / dept-wise KBs
const CollectionSchema = new Schema({
  name: String,              // e.g. "CSE Department", "Admissions", "Hostel"
  description: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// models/Document.js — uploaded documents
const DocumentSchema = new Schema({
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
  title: String,
  filename: String,
  fileUrl: String,
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },       // bonus: version management
  isActive: { type: Boolean, default: true },  // soft delete / superseded versions
  summary: String,                             // bonus: auto-summarization
  ocrUsed: { type: Boolean, default: false },   // bonus: OCR flag
  status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
}, { timestamps: true });

// models/Chunk.js — chunks + embeddings (this is the collection Atlas Vector Search indexes)
const ChunkSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
  content: String,
  chunkIndex: Number,
  pageNumber: Number,
  embedding: { type: [Number], index: false },  // vector array — indexed via Atlas Vector Search, not a normal Mongo index
  // MongoDB text index on `content` for the hybrid keyword-search bonus:
  // ChunkSchema.index({ content: 'text' });
}, { timestamps: true });

// models/Conversation.js
const ConversationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  language: { type: String, default: 'en' },   // bonus: multilingual
}, { timestamps: true });

// models/Message.js
const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  role: { type: String, enum: ['user', 'assistant'] },
  content: String,
  sources: [{ documentId: Schema.Types.ObjectId, chunkId: Schema.Types.ObjectId, page: Number, score: Number }],
  confidenceScore: Number,   // bonus: confidence/relevance score
}, { timestamps: true });

// models/Feedback.js — bonus: 👍/👎
const FeedbackSchema = new Schema({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  rating: { type: String, enum: ['up', 'down'] },
  comment: String,
}, { timestamps: true });

// models/AnalyticsEvent.js — bonus: admin analytics
const AnalyticsEventSchema = new Schema({
  eventType: { type: String, enum: ['query', 'upload', 'feedback', 'no_answer'] },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  metadata: Schema.Types.Mixed,
}, { timestamps: true });
```

**Atlas Vector Search index** (create this in the Atlas UI or via `mongosh` on the `chunks` collection — this is not a Mongoose-defined index):
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "documentId" }
  ]
}
```
`numDimensions` must match your embedding model's output size (384 for MiniLM, 1536 for OpenAI `text-embedding-3-small`).

---

## 4. Phase-by-Phase Build Plan

### Phase 0 — Setup & Planning
**Goal:** Repo, environments, and contracts locked before writing feature code.
**Steps:**
1. Init monorepo: `/frontend`, `/backend`, `/docs`, `/seed-documents`.
2. Set up MongoDB: create a free MongoDB Atlas cluster (M0 tier — supports Vector Search) and get your connection string. For local dev without internet, you can run `mongod` in Docker, but Vector Search itself only works against Atlas (or `mongot` via Atlas CLI's local deployment) — so point dev at Atlas from day one to avoid surprises later.
3. Scaffold Express app: `npm init`, install `express`, `mongoose`, `dotenv`, `cors`, `jsonwebtoken`, `bcrypt`, `multer`. Set up `src/app.js`, `src/routes/`, `src/models/`, `src/controllers/`.
4. Create `.env.example` with all keys you'll need (`MONGODB_URI`, `LLM_API_KEY`, `EMBEDDING_API_KEY`, `JWT_SECRET`, storage keys).
5. Write the API contract (see Section 5) before coding — this is your spec, don't let it drift.
6. Set up CI-lite: a `README.md` with run instructions, so future-you doesn't get stuck.
**DoD:** `npm run dev` connects to MongoDB Atlas successfully (log a "Mongo connected" message), backend and frontend both boot with placeholder routes.

---

### Phase 1 — Auth & User Management
**Goal:** Students and admins can register/log in; role is enforced server-side.
**Steps:**
1. `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
2. Password hashing (bcrypt/argon2), JWT issue + verify middleware.
3. Role field on user (`student` / `admin`) — seed one admin account manually.
4. Protect all `/admin/*` routes with role-check middleware (this is also your foundation for the role-based-access bonus).
**DoD:** A student can sign up and log in; an admin-only route rejects non-admin JWTs with 403.

---

### Phase 2 — Document Upload & Processing Pipeline
**Goal:** Admin can upload a PDF and the system reliably extracts clean text from it.
**Steps:**
1. `POST /admin/documents` — `multer` handles the multipart upload, store file (disk in dev, S3 in prod), create a `Document` doc with `status: 'processing'`.
2. Text extraction: `pdf-parse` or `pdfjs-dist` for text PDFs. For scanned PDFs, detect low extracted-text density and fall back to OCR (`tesseract.js`, pure JS, no external binary needed) — this is the OCR bonus feature, build it now since your pipeline needs it anyway for scanned notices.
3. Chunking: split by ~500 tokens with ~50-token overlap; keep page number metadata per chunk (needed for source display + highlighting bonus). Use `langchain`'s `RecursiveCharacterTextSplitter` (the Node/JS build, `@langchain/textsplitters`) for sentence-aware splitting rather than blind character slicing.
4. Run this as a background job — simplest option is an `async` fire-and-forget after responding to the upload request; for something more robust use a queue (`BullMQ` with Redis). Update `status: 'ready'` when done.
**DoD:** Upload a real IIIT Pune PDF (the admission brochure is a good test case), and the `Chunk` collection populates with readable, correctly-ordered text tied to page numbers.

---

### Phase 3 — Embeddings & Vector Store
**Goal:** Every chunk has a vector; similarity search returns genuinely relevant results.
**Steps:**
1. On chunk creation, call the embedding model, store the vector array in `Chunk.embedding`.
2. In MongoDB Atlas, create a **Vector Search index** on the `chunks` collection (see JSON definition in Section 3) — this is done once via the Atlas UI/CLI, not in application code.
3. Write a `similaritySearch(queryEmbedding, topK, collectionId=null)` function using Mongoose's aggregation pipeline with the `$vectorSearch` stage:
   ```js
   const results = await Chunk.aggregate([
     { $vectorSearch: {
         index: "vector_index", path: "embedding", queryVector: queryEmbedding,
         numCandidates: 100, limit: topK,
         ...(collectionId && { filter: { documentId: { $in: docIdsInCollection } } })
     }},
     { $project: { content: 1, documentId: 1, pageNumber: 1, score: { $meta: "vectorSearchScore" } } }
   ]);
   ```
4. Add a MongoDB **text index** on `Chunk.content` (`ChunkSchema.index({ content: 'text' })`) alongside — sets up the hybrid search bonus without extra infra.
**DoD:** Given a test query embedding, `similaritySearch` returns chunks that are actually topically relevant, verified manually against 5 sample questions.

---

### Phase 4 — RAG Pipeline & LLM Integration
**Goal:** End-to-end retrieval → answer, grounded and honest about what it doesn't know.
**Steps:**
1. `POST /chat` endpoint: accepts `{conversation_id, message}`.
2. Embed the user question → run `similarity_search` (top-k = 4–6) → optionally re-rank (see bonus 4).
3. Build the prompt: system instructions ("Answer only from the provided context. If the context doesn't contain the answer, say so explicitly and do not guess.") + retrieved chunks (with source labels) + conversation history (last N turns) + the question.
4. Call LLM, stream or return full response.
5. Parse/attach `sources` (document title + page) to the response and store on the `messages` row.
6. **Unknown-question handling:** if top similarity scores are all below a threshold, skip the LLM call for "answering" and return a clear "I don't have information about that in the uploaded documents" message — cheaper and more honest than letting the LLM improvise.
**DoD:** Ask 10 real questions about IIIT Pune (fees, hostel rules, a department, a scholarship) sourced only from your uploaded docs — answers are correct and cite the right document. Ask one question with no matching document — it correctly says it doesn't know instead of hallucinating.

---

### Phase 5 — Chat Frontend (Student-Facing)
**Goal:** Clean, simple, unmistakably "college portal" UI — not a generic chat template.
**Design direction (see Section 6 for detail):**
- Sidebar: conversation history list, "New Chat" button.
- Main panel: message bubbles, source citations shown as small expandable cards under each AI answer (document name + page + snippet).
- Input bar: text field + optional mic icon (voice bonus) + send button.
- Header: college name/logo placeholder, user avatar/menu.
**Steps:**
1. Auth pages (login/register).
2. Chat page wired to `/chat` and `/conversations` endpoints.
3. Render sources as collapsible "Sources (2)" chip under each AI message.
4. Loading state while retrieval + generation happens (skeleton or typing indicator — pairs with streaming bonus).
5. Empty state: show suggested starter questions (bonus feature — see 7.10).
**DoD:** A student can register, start a new chat, ask a question, see an answer with visible sources, and revisit past conversations from the sidebar.

---

### Phase 6 — Admin Dashboard
**Goal:** Non-technical admin can manage the knowledge base without touching the DB.
**Steps:**
1. Document list view: title, collection, status, version, upload date, actions (view/delete/replace).
2. Upload form with collection/category picker.
3. Delete = soft delete (`is_active=false`) so chat history referencing that doc doesn't break; re-upload = new version, old version deactivated but retrievable for audit (version management bonus).
4. Collections management: create/rename/delete collections (department-wise KB bonus).
**DoD:** Admin can upload, categorize, replace, and remove documents, and immediately see the effect reflected in chat answers (upload something, ask about it, delete it, confirm the bot no longer references it).

---

## 5. API Contract (lock this before building UI)

```
POST   /auth/register              { name, email, password }
POST   /auth/login                 { email, password } → { token }
GET    /auth/me                    (auth) → user profile

POST   /chat                       (auth) { conversation_id?, message, language? }
                                    → { conversation_id, answer, sources[], confidence, message_id }
GET    /conversations              (auth) → list
GET    /conversations/:id          (auth) → messages[]
POST   /conversations/:id/export   (auth) → file (txt/pdf) [bonus]

POST   /admin/documents            (admin) multipart upload
GET    /admin/documents            (admin) → list w/ status
DELETE /admin/documents/:id        (admin)
PUT    /admin/documents/:id        (admin) → new version

GET    /admin/collections          (admin/all)
POST   /admin/collections          (admin)

POST   /messages/:id/feedback      (auth) { rating, comment? }   [bonus]
GET    /admin/analytics            (admin) → usage stats          [bonus]
GET    /suggested-questions        (auth) → string[]              [bonus]
POST   /admin/documents/:id/faq    (admin) → generated FAQ list   [bonus]
```

---

## 6. UI/UX Guidelines — "College Portal" Feel

You explicitly want this to *read* as a college project, not a generic SaaS chatbot demo. Concrete direction:

- **Color palette:** Pull from IIIT Pune's actual brand — blue & red, on a white/off-white base. Avoid purple-gradient "AI startup" aesthetics.
- **Typography:** One clean sans-serif (Inter, Poppins, or similar), consistent sizing scale. No more than 2 font weights on a single screen.
- **Header:** Institute name + a simple crest/logo placeholder + nav (Chat / My Conversations / Admin if applicable). Feels like a portal, not an app.
- **Chat bubbles:** Student messages right-aligned, neutral gray; AI messages left-aligned, white card with a subtle border, source chips below in a lighter tone.
- **Source citation card:** small, collapsible, shows document title, page number, and a 1–2 line excerpt — this is what makes it feel institutional and trustworthy rather than a black box.
- **Empty/first-load state:** "Ask me about admissions, fees, hostel, departments, or placements at IIIT Pune" + 4 suggested-question chips.
- **Admin dashboard:** table-based, not card-heavy — admins want density and clarity, not marketing polish.
- **Accessibility basics:** sufficient contrast, visible focus states, readable font sizes — small touches that read as "well-engineered" to evaluators.

I can generate an actual clickable mockup (HTML/React) of this chat screen and the admin dashboard right now if you want to see it before building — just say the word.

---

## 7. Bonus Features — Implementation Notes (build after core is fully working)

Treat these as a checklist. Build in roughly this order — earlier ones are cheap given the core pipeline, later ones need more new infra.

1. **Multiple document collections** — Already in schema (Phase 2/6). Just expose collection filter in admin + optionally let chat scope search to a collection.
2. **Department-wise knowledge bases** — Same mechanism as #1, seeded with department-specific docs (CSE, ECE, etc. from iiitp.ac.in). Add a department picker on the chat UI so students can scope questions.
3. **Admin dashboard** — Phase 6, already covered.
4. **Document version management** — Already in schema (`version`, `is_active`). Show version history in admin UI.
5. **Source highlighting** — When rendering the source snippet, bold/highlight the sentence(s) in the chunk with highest similarity to the question (compute per-sentence similarity within the top chunk, or just highlight overlapping keywords as a cheaper version).
6. **Confidence/relevance score** — Store the top similarity score with each message; show as a small badge ("High confidence" / "Low confidence") next to the answer.
7. **Multilingual chatbot** — Detect question language (langdetect or ask LLM), translate query → English for retrieval if your corpus is English-only, then translate the answer back. Store `language` on conversation.
8. **Voice input and responses** — Frontend: Web Speech API (`SpeechRecognition` for input, `SpeechSynthesis` for output) — no backend change needed for a basic version.
9. **Conversation export** — Serialize a conversation's messages to `.txt` easily, or `.pdf` using a Node PDF library (`pdfkit` or `puppeteer` to render HTML→PDF) and return as a download.
10. **Suggested questions** — Static curated list per collection (fast) or LLM-generated from document summaries (better, ties into #13).
11. **Answer feedback (👍/👎)** — `feedback` table + simple two-button UI under each AI message.
12. **Admin analytics** — Dashboard charts: queries per day, top unanswered questions (from the "unknown question" logging), most-used documents, feedback ratio. Log every chat turn to `analytics_events`.
13. **Automatic document summarization** — On upload, after text extraction, one LLM call to summarize the doc; store in `documents.summary`, show in admin list and optionally to students before they open a source.
14. **OCR for scanned documents** — Already folded into Phase 2 pipeline (Tesseract fallback for image-based PDFs like scanned notices/circulars).
15. **Hybrid keyword + semantic search** — Combine `$vectorSearch` results with MongoDB Atlas Search's `$search` text stage (or the plain `text` index for a non-Atlas fallback) using a weighted score (e.g., `0.7*semantic + 0.3*keyword`) — noticeably improves retrieval for exact terms like course codes or scheme names. Atlas also supports `$rankFusion`/`$scoreFusion` (reciprocal rank fusion) as a built-in way to blend the two result sets instead of hand-rolling the weighting.
16. **Document re-ranking** — After initial top-k retrieval (say top 10), re-rank with a cross-encoder (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2`) or an LLM-as-reranker call, then keep top 4 for the final prompt. Improves precision meaningfully.
17. **Role-based access** — Already in schema (`role` field). Extend: some collections could be admin/faculty-only (e.g., internal policy docs) — filter `similarity_search` by allowed collections per role.
18. **AI-generated FAQs** — Batch job over all documents in a collection: LLM generates likely Q&A pairs, store and surface as a static FAQ page per department — good for reducing repeat chatbot load too.
19. **Streaming AI responses** — Switch `/chat` to Server-Sent Events or a streaming HTTP response; frontend renders tokens as they arrive instead of waiting for the full answer.

---

## 8. Testing Checklist Before You Call It Done

- [ ] Upload 5+ real IIIT Pune documents across different categories.
- [ ] 15 test questions covering: admissions, fees, a specific department, hostel, library, placements, scholarships, one policy, one event — all answered correctly with correct sources.
- [ ] 3 "trap" questions with no matching document — correctly returns "I don't know" instead of hallucinating.
- [ ] Multi-turn conversation — second question referencing "it" from the first still resolves correctly (context retention).
- [ ] Non-admin user hitting `/admin/*` routes gets rejected.
- [ ] Delete a document → ask about it again → bot no longer cites it.
- [ ] Mobile-width layout doesn't break (test at 375px).
- [ ] Each implemented bonus feature has at least one manual test pass logged.

---

## 9. Deployment Checklist

- [ ] Environment variables set in hosting provider (never commit `.env`).
- [ ] MongoDB Atlas cluster provisioned (M0 free tier is fine), IP access list includes your backend host (or `0.0.0.0/0` for simplicity during grading), Vector Search index created on `chunks`.
- [ ] Backend deployed (Render/Railway/Fly.io), health-check endpoint (`GET /health`) returns 200 and confirms Mongo connectivity.
- [ ] Frontend deployed (Vercel/Netlify), API base URL pointed at deployed backend.
- [ ] CORS configured correctly between frontend and backend domains.
- [ ] File storage for uploaded PDFs is persistent (not local disk in prod — use S3/Supabase Storage).
- [ ] Seed the deployed DB with your IIIT Pune documents so the live demo actually works.
- [ ] Final smoke test: run the full testing checklist (Section 8) against the **deployed** URL, not just localhost.

---

## 10. Suggested Milestone Order (if you want a linear checklist)

Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → [core deployed & tested] → Phase 7 bonuses (in the order listed) → final re-deploy → Section 8 full pass → Section 9 checklist.

Don't start bonus features until the core loop (Phases 0–6) passes every item in Section 8's core tests — a chatbot with 10 bonus features and a broken retrieval step scores worse than a clean core with 5 bonuses.

---

*If you get stuck on any phase, or need me to pull specific info off iiitp.ac.in (a department page, fee structure, specific policy), just tell me exactly what you need and I'll go get it. I can also generate an actual working mockup of the chat UI/admin dashboard, or scaffold starter code for any phase — just ask.*
