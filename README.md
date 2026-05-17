# 🚀 Varta AI — WhatsApp AI Agent Platform

> **AI-powered WhatsApp automation platform for businesses**

**Varta AI** is a production-style WhatsApp assistant platform: businesses connect their number via **Twilio**, customers chat on WhatsApp, and a **FastAPI** backend answers with a **LangChain**-powered agent—booking flows, FAQs, and **RAG** over your own knowledge base—while a **React** dashboard lets operators manage tenants, upload KB text, and review conversations.

---

## ✨ Features

- **AI-powered WhatsApp assistant** — inbound messages handled by a lightweight agent tuned for customer conversations  
- **RAG-based business knowledge** — answers grounded in uploaded `business.txt` per tenant  
- **Conversation memory** — per-user buffer memory (e.g. WhatsApp `From`) for coherent follow-ups  
- **Multi-business SaaS dashboard** — create businesses, see `has_data`, and manage workspaces from one UI  
- **Live WhatsApp simulation** — try flows in the browser before going live  
- **Knowledge base upload & edit** — file upload or inline text update via REST + UI  
- **Chat logs** — persisted messages for analytics and support (when webhook maps to a DB business)  
- **FastAPI + React architecture** — typed APIs, OpenAPI docs, and a modern Vite SPA  

---

## 📸 Screenshots

Add your own captures under **`assets/`**. Until then, these paths act as placeholders:

### Dashboard

![Dashboard overview](assets/dashboard-overview.png)

### Live chat simulation

![Live chat simulation](assets/live-chat-simulation.png)

### Business management

![Business management](assets/business-management.png)

### Knowledge base editor

![Knowledge base editor](assets/knowledge-base-editor.png)

**Adding your images:** use the repo’s **`assets/`** folder. Name files to match the paths above (or update the markdown). Commit images you’re comfortable sharing publicly—useful for LinkedIn and portfolio traffic from GitHub.

---

## 🏗️ Architecture

High-level message flow:

```text
User → WhatsApp → Twilio → FastAPI
                    ↓
        LangChain Agent → RAG (FAISS)
                    ↓
        Response → Twilio → WhatsApp
```

- **Twilio** delivers `POST /webhook` with form fields (`Body`, `From`, `To`).  
- **FastAPI** runs intent-style routing (booking / FAQ / RAG), calls **Groq** for generation where needed, and returns **TwiML XML** (escaped for safety).  
- **Dashboard** talks to the same API over JSON (`/business`, `/messages/...`) with CORS enabled for local dev.

For a deeper breakdown, see [`ARCHITECTURE.txt`](./ARCHITECTURE.txt).

---

## 🧰 Tech Stack

- **FastAPI** — REST API, Twilio webhook, OpenAPI docs  
- **React + Vite** — operator dashboard (TypeScript, Tailwind)  
- **LangChain** — agent tools, text splitting, vector integrations  
- **FAISS** — vector index built when you upload or update a KB (`faiss_db/`)  
- **Groq** — fast LLM inference (e.g. Llama 3.3)  
- **Twilio WhatsApp API** — message ingress and TwiML responses  
- **SQLite** / **PostgreSQL** — configurable via `DATABASE_URL`  

> **Note:** Live WhatsApp RAG retrieval uses **Chroma** (see `CHROMA_DIR` in env vars and `app/services/rag.py`), alongside the FAISS artifacts produced on upload.

---

## 🔮 Future improvements

- **Real-time analytics** — live volume, latency, and intent dashboards  
- **CRM integrations** — sync leads and conversations to HubSpot, Salesforce, Zoho, etc.  
- **Voice support** — WhatsApp voice notes or telephony bridges  
- **Multi-user authentication** — orgs, roles, and audit logs for the operator console  

---

## 📁 Repo structure

- **Backend**: `app/` (FastAPI)  
- **Frontend**: `frontend/` (Vite + React)  
- **Database**: SQLite — uses `./samvaad.db` if it already exists (legacy), otherwise `./varta.db`; override with `DATABASE_URL`  
- **Knowledge base**  
  - API-managed: `app/data/<business_id>/business.txt` (upload/update endpoints)  
  - RAG runtime path (fallback): `app/data/<business_key>/business.txt` or `app/data/business.txt`  

---

## Prerequisites

- **Python**: 3.10+ recommended  
- **Node.js**: 18+ (for `frontend/`)  
- **Twilio WhatsApp**: sandbox or approved WhatsApp sender (for `/webhook`)  

---

## Backend (FastAPI)

### Install & run (Windows PowerShell)

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Environment variables

Create a `.env` file in the project root (optional but recommended).

**Required**

- `GROQ_API_KEY` — Groq API key (backend will fail to start/respond without it)

**Optional (LLM)**

- `GROQ_MODEL` — default `llama-3.3-70b-versatile`

**Optional (storage)**

- `DATABASE_URL` — if unset: **`samvaad.db` in the project root is used when that file exists** (so existing businesses keep showing); otherwise **`varta.db`**. Set this explicitly to pick any other path or Postgres.

**Optional (CORS for frontend)**

- `CORS_ORIGINS` — comma-separated origins (default includes `http://localhost:5173`)  
- `CORS_ORIGIN_REGEX` — regex allowlist for origins  

**Optional (Twilio business routing)**

- `BUSINESS_ID_BY_TO` — map Twilio `To` number → internal business identifier  
  - Example: `BUSINESS_ID_BY_TO="whatsapp:+14155238886=gym,whatsapp:+14155230000=saloon"`

**Optional (RAG storage)**

- `CHROMA_DIR` — base dir for persistent Chroma stores (default: `./chroma_db`)  
- `CHROMA_COLLECTION` — override collection name prefix  

### API endpoints (backend)

- **Twilio webhook**  
  - `POST /webhook` — expects Twilio form fields like `Body`, `From`, `To`; responds with TwiML XML  

- **Business management**  
  - `POST /business` — create a business  
  - `GET /business` — list businesses  
  - `GET /business/{business_id}/data` — fetch KB text  
  - `PUT /business/{business_id}/data` — replace KB text  
  - `POST /business/{business_id}/upload` — upload `business.txt`  

- **Chat logs**  
  - `GET /messages/{business_id}`  

Interactive docs: **`http://localhost:8000/docs`**

---

## Frontend (Vite + React)

### Install & run

```bash
cd frontend
npm install
npm run dev
```

### Frontend environment (optional)

By default, the UI calls `http://localhost:8000`. To override, create `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Then open the UI at **`http://localhost:5173`**.

---

## Twilio WhatsApp setup

1. Run the backend locally on port **8000**.  
2. Expose it publicly (example with [ngrok](https://ngrok.com)):

```bash
ngrok http 8000
```

3. In Twilio WhatsApp settings, set the incoming message webhook to:  
   - **`POST <public-url>/webhook`**

---

## Notes / troubleshooting

- **Webhook replies must be XML (TwiML)** — the backend returns `application/xml` and escapes model output.  
- **If the agent always says it can’t answer** — upload business KB via the UI or `POST /business/{id}/upload`.  
- **SQLite file location** — project root: `samvaad.db` if present, else `varta.db`, unless `DATABASE_URL` is set.
