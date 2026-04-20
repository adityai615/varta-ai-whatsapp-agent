# Samvaad AI — FastAPI WhatsApp Assistant Backend

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## LLM config (LangChain)

Set env vars (recommended in `.env`):

- **Groq (default)**:
  - `LLM_PROVIDER=groq`
  - `GROQ_API_KEY=...`
  - `GROQ_MODEL=llama-3.3-70b-versatile` (optional)
- **OpenAI**:
  - `LLM_PROVIDER=openai`
  - `OPENAI_API_KEY=...`
  - `OPENAI_MODEL=gpt-4o-mini` (optional)

## Twilio webhook

- Set your Twilio WhatsApp webhook URL to `POST /webhook` (e.g. `http://<your-host>/webhook`)
- Twilio will send form-encoded fields like `Body` and `From`
- for ngrok = ngrok http 8000