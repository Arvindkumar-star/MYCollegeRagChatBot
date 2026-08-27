# RAG-Based IIIT Pune Chatbot

A full-stack RAG (Retrieval-Augmented Generation) chatbot that answers student questions about IIIT Pune using **only** information retrieved from real IIIT Pune documents. Every answer cites its source.

**Stack:** Node.js + Express · MongoDB Atlas (Vector Search) · React + Vite + Tailwind · Groq LLM · Xenova Embeddings

---

## Quick Start

### Prerequisites
- Node.js 18+
- A **MongoDB Atlas** account (free M0 tier) with a cluster — [create one here](https://www.mongodb.com/atlas)
- A **Groq API key** (free) from [console.groq.com](https://console.groq.com) **or** an OpenAI/Gemini key

---

### 1. Clone & configure

```bash
git clone <repo-url>
cd RagChatbot
```

**Backend `.env`** — edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ragchatbot
JWT_SECRET=some_long_random_string
LLM_PROVIDER=groq
LLM_API_KEY=gsk_your_groq_key_here
```

---

### 2. Backend setup

```bash
cd backend
npm install
npm run seed        # Creates admin user + default collections
npm run dev         # Starts on http://localhost:5000
```

✅ You should see: `✅ MongoDB connected: <cluster>.mongodb.net`

---

### 3. Atlas Vector Search index (one-time setup)

In your MongoDB Atlas UI:
1. Go to your cluster → **Search** → **Create Index**
2. Select the `ragchatbot` database → `chunks` collection
3. Choose **JSON Editor** and paste:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "documentId" }
  ]
}
```
4. Name it `vector_index` and create.

---

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev         # Starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

### 5. Seed documents

Drop real IIIT Pune PDFs into `seed-documents/` by category, then upload them via the Admin Dashboard (`/admin`).

**Default admin credentials:**
- Email: `admin@iiitp.ac.in`
- Password: `Admin@1234`

---

## Architecture

```
Upload PDF → Extract Text → Chunk (~500 tokens) → Embed (MiniLM) → Store in MongoDB Atlas
                                                                              │
User Question → Embed → Atlas $vectorSearch (top-5) ─────────────────────────┘
                              │
                  Hybrid: 0.7 × semantic + 0.3 × keyword
                              │
                  Threshold check (score < 0.35 → "I don't know")
                              │
           Prompt = System + Chunks + History + Question
                              │
                         LLM (Groq Llama 3)
                              │
                  Answer + Cited Sources → User
```

---

## Project Structure

```
RagChatbot/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app
│   │   ├── config/db.js        # MongoDB connection
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # auth.js, chat.js, admin/
│   │   ├── middleware/auth.js  # JWT + role guards
│   │   └── services/
│   │       ├── embeddingService.js   # Xenova/OpenAI embeddings
│   │       ├── vectorSearchService.js # Atlas $vectorSearch + hybrid
│   │       ├── llmService.js         # Groq/OpenAI/Gemini client
│   │       ├── ingestionService.js   # PDF parse + chunk + embed
│   │       └── ragService.js         # Full RAG pipeline
│   ├── scripts/seed.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/index.js        # Axios client
│       ├── context/AuthContext.jsx
│       ├── components/         # MessageBubble, Sidebar, ChatInput, ProtectedRoute
│       └── pages/              # LoginPage, RegisterPage, ChatPage, AdminPage
└── seed-documents/             # Drop IIIT Pune PDFs here
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register student |
| POST | `/auth/login` | — | Login → JWT |
| GET | `/auth/me` | ✓ | Current user |
| POST | `/chat` | ✓ | RAG chat |
| GET | `/conversations` | ✓ | List conversations |
| GET | `/conversations/:id` | ✓ | Get messages |
| POST | `/conversations/:id/export` | ✓ | Export as .txt |
| POST | `/messages/:id/feedback` | ✓ | 👍/👎 rating |
| POST | `/admin/documents` | admin | Upload PDF |
| GET | `/admin/documents` | admin | List documents |
| DELETE | `/admin/documents/:id` | admin | Soft delete |
| PUT | `/admin/documents/:id` | admin | New version |
| GET | `/admin/collections` | ✓ | List collections |
| POST | `/admin/collections` | admin | Create collection |
| GET | `/admin/analytics` | admin | Usage stats |
| GET | `/health` | — | Health check |

---

## Deployment

See `spec.md` → Section 9 for the full deployment checklist (Render + MongoDB Atlas + Vercel).
