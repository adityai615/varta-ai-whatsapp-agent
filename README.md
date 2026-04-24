# Samvaad AI — WhatsApp AI Agent (FastAPI + Vite)

Samvaad AI is a **Twilio WhatsApp webhook** + **FastAPI backend** that replies using a lightweight agent (booking/FAQ/RAG), plus a **Vite + React dashboard** to manage businesses, upload knowledge-base text, and view chat logs.

## Repo structure

- **Backend**: `app/` (FastAPI)
- **Frontend**: `frontend/` (Vite + React)
- **Database**: SQLite by default (`./samvaad.db`)
- **Knowledge base**:
  - API-managed: `app/data/<business_id>/business.txt` (used by upload/update endpoints)
  - RAG runtime path (fallback): `app/data/<business_key>/business.txt` or `app/data/business.txt`

## Prerequisites

- **Python**: 3.10+ recommended
- **Node.js**: 18+ (for `frontend/`)
- **Twilio WhatsApp**: a sandbox or approved WhatsApp sender (to hit `/webhook`)

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

- **Required**
  - `GROQ_API_KEY`: Groq API key (backend will fail to start/respond without it)
- **Optional (LLM)**
  - `GROQ_MODEL`: default `llama-3.3-70b-versatile`
- **Optional (storage)**
  - `DATABASE_URL`: defaults to `sqlite:///./samvaad.db`
- **Optional (CORS for frontend)**
  - `CORS_ORIGINS`: comma-separated origins (default includes `http://localhost:5173`)
  - `CORS_ORIGIN_REGEX`: regex allowlist for origins
- **Optional (Twilio business routing)**
  - `BUSINESS_ID_BY_TO`: map Twilio `To` number → internal business identifier
    - Example: `BUSINESS_ID_BY_TO="whatsapp:+14155238886=gym,whatsapp:+14155230000=saloon"`
- **Optional (RAG storage)**
  - `CHROMA_DIR`: base dir for persistent Chroma stores (default: `./chroma_db`)
  - `CHROMA_COLLECTION`: override collection name prefix

### API endpoints (backend)

- **Twilio webhook**
  - `POST /webhook` (expects Twilio form fields like `Body`, `From`, `To`; responds with TwiML XML)
- **Business management**
  - `POST /business` (create a business)
  - `GET /business` (list businesses)
  - `GET /business/{business_id}/data` (fetch KB text)
  - `PUT /business/{business_id}/data` (replace KB text)
  - `POST /business/{business_id}/upload` (upload `business.txt`)
- **Chat logs**
  - `GET /messages/{business_id}`

Open FastAPI docs at `http://localhost:8000/docs`.

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

Then open the UI at `http://localhost:5173`.

## Twilio WhatsApp setup

1. Run the backend locally on port 8000.
2. Expose it publicly (example with ngrok):

```bash
ngrok http 8000
```

3. In Twilio WhatsApp settings, set the incoming message webhook to:
   - `POST <public-url>/webhook`

## Notes / troubleshooting

- **Webhook replies must be XML (TwiML)**: the backend returns `application/xml` and escapes model output.
- **If the agent always says it can’t answer**: upload business KB via the UI or `POST /business/{id}/upload`.
- **SQLite file location**: project root `samvaad.db` unless `DATABASE_URL` is set.