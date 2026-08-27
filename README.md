<div align="center">

# 🎓 CampusSaathi

### *IIIT Pune's Official Knowledge Assistant*

**A source-grounded, full-stack RAG chatbot — zero hallucinations, always cited.**

Ask about admissions, fees, hostel life, academics, placements, and scholarships — and get answers backed by real institute documents.

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-Visit_Now-c9a84c?style=for-the-badge&labelColor=0b1437)](https://my-college-rag-chat-bot.vercel.app/)

<br/>

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=0b1437)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white&labelColor=0b1437)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white&labelColor=0b1437)
![RAG](https://img.shields.io/badge/RAG-Hybrid%20Search-c9a84c?style=flat-square&labelColor=0b1437)
![License](https://img.shields.io/badge/License-ISC-6366f1?style=flat-square&labelColor=0b1437)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square&labelColor=0b1437)

</div>

<br/>

<div align="center">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

</div>

## ✨ Overview

> **CampusSaathi** is a secure, college-specific chatbot built on **Retrieval-Augmented Generation (RAG)**. Instead of guessing, it retrieves the exact relevant passages from official IIIT Pune documents *before* generating an answer — keeping every response accurate, transparent, and traceable back to its source.

<table>
<tr>
<td width="50%" valign="top">

### 🎯 What it does

- 📚 Answers **only** from indexed IIIT Pune documents
- 🔍 Displays expandable **source citations** — document, page, excerpt
- ⚡ Hybrid **semantic + keyword** search for precise matching
- 📄 Supports **PDF & TXT** uploads with background processing
- 🖨️ Page-by-page extraction with **OCR fallback** for scans
- 🔐 Full **student authentication**, history, feedback & export
- 🛠️ Admin dashboard for documents, collections & analytics
- 📱 Fully **responsive** — mobile, tablet, desktop

</td>
<td width="50%" valign="top">

### 🧭 Design Principles

```
  ┌─────────────────────────┐
  │   NO HALLUCINATIONS     │
  │   ─────────────────     │
  │   If it's not in the    │
  │   documents, the bot    │
  │   says "I don't know."  │
  └─────────────────────────┘

  ┌─────────────────────────┐
  │   FULL AUDITABILITY     │
  │   ─────────────────     │
  │   Every answer traces   │
  │   back to file + page.  │
  └─────────────────────────┘
```

</td>
</tr>
</table>

<br/>

## 🧱 Tech Stack

<div align="center">

| Layer | Technology |
|:---|:---|
| 🎨 **Frontend** | React · Vite · Tailwind CSS · Axios · React Router |
| ⚙️ **Backend** | Node.js · Express · Mongoose |
| 🗄️ **Database** | MongoDB Atlas |
| 🔎 **Vector Search** | MongoDB Atlas Vector Search + keyword fallback |
| 🧠 **Embeddings** | Xenova `all-MiniLM-L6-v2` (local) or OpenAI |
| 🤖 **LLM** | Groq — with optional OpenAI / Gemini support |
| 📑 **Document Processing** | `pdf-parse` · LangChain splitters · Tesseract.js OCR |
| 🔑 **Authentication** | JWT + bcrypt |
| 💾 **File Storage** | Local disk (dev) · S3-compatible (production-ready) |

</div>

<br/>

<div align="center">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

</div>

## 🏗️ How It Works

<div align="center">

```
   📄  ADMIN UPLOADS PDF
         │
         ▼
   🔍  TEXT EXTRACTION  /  OCR
         │
         ▼
   ✂️   PAGE-AWARE CHUNKING
         │
         ▼
   🧬  LOCAL EMBEDDING GENERATION
         │
         ▼
   🗄️   MONGODB   ·   CHUNKS + EMBEDDINGS


   ═══════════════════════════════════


   ❓  STUDENT ASKS A QUESTION
         │
         ▼
   🧬  QUESTION EMBEDDING  +  KEYWORD SEARCH
         │
         ▼
   ⚖️   HYBRID RELEVANCE RANKING
         │
         ▼
   🤖  GROUNDED LLM PROMPT  (retrieved excerpts only)
         │
         ▼
   ✅  ANSWER  +  CONFIDENCE  +  SOURCE CITATIONS
```

</div>

> 💡 **Fail-safe by design:** if no relevant context is found, CampusSaathi clearly states the information isn't in the uploaded documents — it never guesses.

<br/>

## 🚀 Quick Start

### ✅ Prerequisites

| Requirement | Details |
|:---|:---|
| Node.js | `v18` or newer |
| Package manager | `npm` |
| Database | A MongoDB Atlas cluster |
| LLM API key | Groq, OpenAI, or Gemini |

<br/>

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Arvindkumar-star/MYCollegeRagChatBot.git
cd MYCollegeRagChatBot
```

### 2️⃣ Configure the backend

Copy `.env.example` to `backend/.env` and fill in your values.
> ⚠️ **Never commit `backend/.env`.**

```bash
cd backend
npm install
```

<details>
<summary><strong>📋 Minimum required configuration (click to expand)</strong></summary>

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ragchatbot
JWT_SECRET=replace_with_a_long_random_secret
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key_here
LLM_MODEL=openai/gpt-oss-20b
EMBEDDING_PROVIDER=xenova
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

</details>

Create the admin account and default collections:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

🟢 API running at `http://localhost:5000` · Health check at `http://localhost:5000/health`

<br/>

### 3️⃣ Configure the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

🟢 Open **`http://localhost:5173`** in your browser.

<br/>

### 4️⃣ Create the Atlas vector index

> The app automatically falls back to keyword search if the Atlas vector index is unavailable — but semantic search needs a one-time setup.

In MongoDB Atlas, open the `chunks` collection → create a Search index named **`vector_index`**:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    }
  ]
}
```

<br/>

<div align="center">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

</div>

## 📚 Adding Documents

<table>
<tr><td width="40" align="center">1️⃣</td><td>Sign in with an <strong>admin account</strong></td></tr>
<tr><td width="40" align="center">2️⃣</td><td>Open the <strong>Admin Dashboard</strong></td></tr>
<tr><td width="40" align="center">3️⃣</td><td>Select <strong>Upload Document</strong></td></tr>
<tr><td width="40" align="center">4️⃣</td><td>Provide a title, optional collection, and PDF/TXT file</td></tr>
<tr><td width="40" align="center">5️⃣</td><td>Wait for status to change from <code>processing</code> → <code>ready</code></td></tr>
<tr><td width="40" align="center">6️⃣</td><td>Ask a related question in <strong>Chat</strong> 🎉</td></tr>
</table>

> 🔁 Documents interrupted mid-processing are **automatically retried** after a server restart. Use the retry button in the admin dashboard to restart any individual failed document.

The included [`seed-documents/`](./seed-documents) directory contains sample IIIT Pune material organized by topic.

<br/>

## 👤 Default Development Admin

> ⚠️ **Change these credentials before deploying anywhere public.**

| Field | Value |
|:---|:---|
| **Email** | `admin@iiitp.ac.in` |
| **Password** | `Admin@1234` |

<br/>

## 📁 Project Structure

```text
MYCollegeRagChatBot/
├── backend/
│   ├── scripts/seed.js
│   ├── server.js
│   └── src/
│       ├── config/          🔧 MongoDB connection
│       ├── middleware/      🔐 JWT authentication and admin guards
│       ├── models/          🗄️ Users, documents, chunks, messages, analytics
│       ├── routes/          🛣️ Auth, chat, admin documents, collections, analytics
│       └── services/        ⚙️ Ingestion, embeddings, retrieval, RAG, LLM
├── frontend/
│   └── src/
│       ├── api/              🌐 Axios API client
│       ├── components/       🧩 Chat UI, sidebar, protected routes
│       ├── context/          🧠 Authentication state
│       └── pages/            📄 Chat, history, auth, and admin pages
├── seed-documents/           📚 Sample source documents
├── .env.example               🔑 Safe environment template
└── spec.md                    📜 Original implementation specification
```

<br/>

<div align="center">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

</div>

## 🔌 API Reference

> All protected endpoints require `Authorization: Bearer <jwt>`

<details open>
<summary><strong>🌍 Public & Student Endpoints</strong></summary>
<br/>

| Method | Endpoint | Access | Purpose |
|:---:|:---|:---:|:---|
| `GET` | `/health` | 🌐 Public | API and database health |
| `POST` | `/auth/register` | 🌐 Public | Register a student |
| `POST` | `/auth/login` | 🌐 Public | Login and receive a JWT |
| `GET` | `/auth/me` | 👤 User | Get the current profile |
| `POST` | `/chat` | 👤 User | Ask a grounded question |
| `GET` | `/conversations` | 👤 User | List conversations |
| `GET` | `/conversations/:id` | 👤 User | Read conversation messages |
| `POST` | `/conversations/:id/export` | 👤 User | Export a conversation |
| `POST` | `/messages/:id/feedback` | 👤 User | Submit helpful/not-helpful feedback |

</details>

<details>
<summary><strong>🛡️ Admin-Only Endpoints</strong></summary>
<br/>

| Method | Endpoint | Access | Purpose |
|:---:|:---|:---:|:---|
| `POST` | `/admin/documents` | 🛡️ Admin | Upload a document |
| `GET` | `/admin/documents` | 🛡️ Admin | List documents and statuses |
| `POST` | `/admin/documents/:id/retry` | 🛡️ Admin | Retry document ingestion |
| `PUT` | `/admin/documents/:id` | 🛡️ Admin | Upload a new document version |
| `DELETE` | `/admin/documents/:id` | 🛡️ Admin | Soft-delete a document |
| `GET` | `/admin/collections` | 🛡️ Admin | List collections |
| `POST` | `/admin/collections` | 🛡️ Admin | Create a collection |
| `GET` | `/admin/analytics` | 🛡️ Admin | View usage analytics |

</details>

<br/>

## 🧪 Useful Commands

<table>
<tr valign="top">
<td width="50%">

**⚙️ Backend**
```bash
npm run dev       # Dev server with watch mode
npm start         # Start server normally
npm run seed      # Create admin & default collections
```

</td>
<td width="50%">

**🎨 Frontend**
```bash
npm run dev       # Vite development server
npm run build     # Production build
npm run lint      # Oxlint checks
npm run preview   # Preview production build
```

</td>
</tr>
</table>

<br/>

<div align="center">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

</div>

## 🛠️ Troubleshooting

<details>
<summary><strong>📄 Documents remain in <code>processing</code></strong></summary>
<br/>

Restart the backend — unfinished active documents are automatically retried. You can also use the **refresh/retry** control beside the document in the admin dashboard.

</details>

<details>
<summary><strong>❓ Answers show no relevant information</strong></summary>
<br/>

Confirm the document status is `ready` and that the upload produced chunks. Check the backend console for `[Ingestion]` messages. For semantic search, verify the Atlas index name is exactly `vector_index` — keyword fallback still works without it.

</details>

<details>
<summary><strong>🤖 LLM response fails</strong></summary>
<br/>

Check `LLM_PROVIDER`, `LLM_API_KEY`, and `LLM_MODEL` in `backend/.env`, then restart the backend. The configured Groq model must be available to your account.

</details>

<details>
<summary><strong>🗄️ MongoDB connection fails</strong></summary>
<br/>

Verify the connection string, database user permissions, and Atlas Network Access allowlist. The backend exits intentionally when it cannot connect to MongoDB.

</details>

<br/>

## 🔐 Security Notes

> - 🚫 Never commit `.env` files, API keys, JWT secrets, passwords, or uploaded private documents
> - 🔑 Use a new JWT secret and admin password in production
> - 🌐 Restrict MongoDB Atlas Network Access in production
> - 💾 Local disk uploads are for development only — use persistent object storage for deployment
> - 🔄 Rotate any API key that has been accidentally exposed

<br/>

## 🚢 Deployment Checklist

- [ ] Configure production environment variables in the hosting provider
- [ ] Use persistent storage for uploaded files
- [ ] Configure MongoDB Atlas Network Access and the `vector_index`
- [ ] Deploy the backend and confirm `/health` returns `200`
- [ ] Set the frontend API URL to the deployed backend
- [ ] Configure CORS with the production frontend URL
- [ ] Create a production admin account and upload verified documents
- [ ] Test authentication, upload, retrieval, citations, and mobile layout

<br/>

## 📄 License

Released under the **ISC License**, as declared in the backend package configuration.

<br/>

<div align="center">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🎓 Built for a clearer, more trustworthy way to find information about IIIT Pune

[![Live Demo](https://img.shields.io/badge/🔗_Try_it_now-my--college--rag--chat--bot.vercel.app-c9a84c?style=for-the-badge&labelColor=0b1437)](https://my-college-rag-chat-bot.vercel.app/)

</div>
