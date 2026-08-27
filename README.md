# IIIT Pune Knowledge Assistant

<p align="center">
  <strong>A source-grounded, full-stack RAG chatbot for IIIT Pune</strong><br />
  Ask questions about admissions, fees, hostel, academics, placements, scholarships, and more.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/RAG-Hybrid%20Search-C9A84C" alt="RAG" />
  <img src="https://img.shields.io/badge/License-ISC-blue" alt="License" />
</p>

---

## ✨ Overview

The **IIIT Pune Knowledge Assistant** is a secure college-information chatbot built with Retrieval-Augmented Generation (RAG). It retrieves relevant passages from uploaded official documents before asking the language model to answer, helping keep responses accurate, transparent, and grounded in the institute knowledge base.

### What it does

- Answers only from indexed IIIT Pune documents
- Displays expandable source citations with document name, page, and excerpt
- Uses hybrid semantic + keyword search for better exact-term matching
- Supports PDF and TXT uploads with background processing
- Extracts PDF text page-by-page and supports OCR fallback for scanned files
- Includes student authentication, conversations, history, feedback, and export
- Provides an admin dashboard for documents, collections, analytics, and reprocessing
- Offers responsive chat navigation for mobile, tablet, and desktop screens

## 🧱 Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Vector search | MongoDB Atlas Vector Search with keyword fallback |
| Embeddings | Xenova `all-MiniLM-L6-v2` locally, or OpenAI embeddings |
| LLM | Groq, with optional OpenAI or Gemini support |
| Document processing | `pdf-parse`, LangChain text splitters, Tesseract.js OCR |
| Authentication | JWT and bcrypt |
| File storage | Local disk in development; S3-compatible storage can be added for production |

## 🏗️ How It Works

```text
Admin uploads PDF
       ↓
PDF text extraction / OCR
       ↓
Page-aware chunking
       ↓
Local embedding generation
       ↓
MongoDB chunks + embeddings

Student question
       ↓
Question embedding + keyword search
       ↓
Hybrid relevance ranking
       ↓
Grounded LLM prompt with retrieved excerpts
       ↓
Answer + confidence + source citations
```

If relevant context cannot be found, the assistant clearly says that the information is not available in the uploaded documents instead of guessing.

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or newer
- npm
- A MongoDB Atlas cluster
- A Groq API key, or an OpenAI/Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Arvindkumar-star/MYCollegeRagChatBot.git
cd MYCollegeRagChatBot
```

### 2. Configure the backend

Copy `.env.example` to `backend/.env` and fill in your values. Never commit `backend/.env`.

```bash
cd backend
npm install
```

Minimum required configuration:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ragchatbot
JWT_SECRET=replace_with_a_long_random_secret
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key_here
LLM_MODEL=openai/gpt-oss-20b
EMBEDDING_PROVIDER=xenova
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

Create the admin account and default collections:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000` and the health endpoint is available at `http://localhost:5000/health`.

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Create the Atlas vector index

The application automatically falls back to keyword search if the Atlas vector index is unavailable, but semantic search requires a one-time index.

In MongoDB Atlas, open the `chunks` collection and create a Search index named `vector_index` with this definition:

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

## 📚 Adding Documents

1. Sign in with an admin account.
2. Open **Admin Dashboard**.
3. Select **Upload Document**.
4. Provide a title, optional collection, and PDF/TXT file.
5. Wait for the status to change from `processing` to `ready`.
6. Ask a related question in Chat.

Documents uploaded before a server interruption can be reprocessed automatically after restarting the backend. The retry button in the admin dashboard can also restart an individual failed document.

The included `seed-documents/` directory contains sample IIIT Pune material organized by topic.

## 👤 Default Development Admin

The seed script reads these values from `backend/.env`:

```text
Email:    admin@iiitp.ac.in
Password: Admin@1234
```

Change these credentials before deploying anywhere public.

## 📁 Project Structure

```text
MYCollegeRagChatBot/
├── backend/
│   ├── scripts/seed.js
│   ├── server.js
│   └── src/
│       ├── config/          # MongoDB connection
│       ├── middleware/      # JWT authentication and admin guards
│       ├── models/          # Users, documents, chunks, messages, analytics
│       ├── routes/          # Auth, chat, admin documents, collections, analytics
│       └── services/        # Ingestion, embeddings, retrieval, RAG, LLM
├── frontend/
│   └── src/
│       ├── api/             # Axios API client
│       ├── components/      # Chat UI, sidebar, protected routes
│       ├── context/         # Authentication state
│       └── pages/            # Chat, history, auth, and admin pages
├── seed-documents/          # Sample source documents
├── .env.example             # Safe environment template
└── spec.md                  # Original implementation specification
```

## 🔌 API Reference

All protected endpoints require `Authorization: Bearer <jwt>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | API and database health |
| `POST` | `/auth/register` | Public | Register a student |
| `POST` | `/auth/login` | Public | Login and receive a JWT |
| `GET` | `/auth/me` | User | Get the current profile |
| `POST` | `/chat` | User | Ask a grounded question |
| `GET` | `/conversations` | User | List conversations |
| `GET` | `/conversations/:id` | User | Read conversation messages |
| `POST` | `/conversations/:id/export` | User | Export a conversation |
| `POST` | `/messages/:id/feedback` | User | Submit helpful/not-helpful feedback |
| `POST` | `/admin/documents` | Admin | Upload a document |
| `GET` | `/admin/documents` | Admin | List documents and statuses |
| `POST` | `/admin/documents/:id/retry` | Admin | Retry document ingestion |
| `PUT` | `/admin/documents/:id` | Admin | Upload a new document version |
| `DELETE` | `/admin/documents/:id` | Admin | Soft-delete a document |
| `GET` | `/admin/collections` | Admin | List collections |
| `POST` | `/admin/collections` | Admin | Create a collection |
| `GET` | `/admin/analytics` | Admin | View usage analytics |

## 🧪 Useful Commands

### Backend

```bash
npm run dev       # Development server with watch mode
npm start         # Start server normally
npm run seed      # Create admin and default collections
```

### Frontend

```bash
npm run dev       # Vite development server
npm run build     # Production build
npm run lint      # Oxlint checks
npm run preview   # Preview production build
```

## 🛠️ Troubleshooting

### Documents remain in `processing`

Restart the backend. Unfinished active documents are automatically retried. You can also use the refresh/retry control beside the document in the admin dashboard.

### Answers show no relevant information

Confirm that the document status is `ready` and that the upload produced chunks. Check the backend console for `[Ingestion]` messages. For semantic search, verify the Atlas index name is exactly `vector_index`; keyword fallback still works without it.

### LLM response fails

Check `LLM_PROVIDER`, `LLM_API_KEY`, and `LLM_MODEL` in `backend/.env`, then restart the backend. The configured Groq model must be available to your account.

### MongoDB connection fails

Verify the connection string, database user permissions, and Atlas Network Access allowlist. The backend exits intentionally when it cannot connect to MongoDB.

## 🔐 Security Notes

- Never commit `.env` files, API keys, JWT secrets, passwords, or uploaded private documents.
- Use a new JWT secret and admin password in production.
- Restrict MongoDB Atlas Network Access in production.
- Local disk uploads are suitable for development only; use persistent object storage for deployment.
- Rotate any API key that has been accidentally exposed.

## 🚢 Deployment Checklist

- [ ] Configure production environment variables in the hosting provider.
- [ ] Use persistent storage for uploaded files.
- [ ] Configure MongoDB Atlas Network Access and the `vector_index`.
- [ ] Deploy the backend and confirm `/health` returns `200`.
- [ ] Set the frontend API URL to the deployed backend.
- [ ] Configure CORS with the production frontend URL.
- [ ] Create a production admin account and upload verified documents.
- [ ] Test authentication, upload, retrieval, citations, and mobile layout.

## 📄 License

This project is released under the ISC license declared in the backend package configuration.

---

<p align="center">Built for a clearer, more trustworthy way to find information about IIIT Pune.</p>
