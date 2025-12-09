# Document Extractor

Document Extractor is a two-part application that uploads documents to an Unstract LLM Whisperer backend, extracts layout-preserving text with line-level highlights, and displays the result in a rich viewer UI built with Next.js.

## Features

- FastAPI backend that proxies document uploads to Unstract LLM Whisperer and returns extracted text plus highlight metadata.
- Next.js 16 frontend for uploading files, previewing PDF pages, and reviewing extracted text with visual highlights.
- Persistent local storage between upload and viewer routes so users can revisit the last processed document.
- Health-check and modular routing for clean backend integration.

## Project Structure

```
.
├── backend/              # FastAPI service
│   ├── app/
│   │   ├── main.py       # FastAPI entrypoint (uvicorn app.main:app ...)
│   │   ├── routes/       # Extract + health routers
│   │   ├── services/     # LLM Whisperer integration
│   │   └── inputfiles/   # Uploaded files (gitignored)
│   └── requirements.txt
└── frontend/             # Next.js app (app router)
    ├── app/              # Pages: home, upload, viewer
    ├── components/       # Reusable UI building blocks
    ├── lib/              # Utility helpers
    └── package.json
```

## Prerequisites

- Python 3.11+
- Node.js 18+ (or 20+ LTS recommended)
- An Unstract LLM Whisperer API key (`LLMWHISPERER_API_KEY`)

## Environment Setup

1. Copy `.env.example` to `.env` at the repository root (or create the file) and set the following variable:
   ```
   LLMWHISPERER_API_KEY=<your-api-key>
   ```
2. The backend reads the `.env` file via `python-dotenv`; restart the server after updating credentials.

## Backend (FastAPI)

```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

- Health check: `GET http://localhost:8003/health/`
- Extraction endpoint: `POST http://localhost:8003/extract/` (multipart form with `file`)

Uploaded files are temporarily stored under `backend/app/inputfiles/` and ignored by git.

## Frontend (Next.js)

```cmd
cd frontend
npm install
npm run dev
```

The development server runs on `http://localhost:3000`. The UI expects the backend at `http://localhost:8003` (configure via environment variables if needed).

## Usage

1. Start the backend and frontend as outlined above.
2. Visit `http://localhost:3000/upload` and choose a document to upload.
3. After processing, the app redirects to `/viewer`, showing the extracted text side by side with a PDF preview and highlight overlays.

## Testing & Linting

- Backend: add FastAPI route tests with your preferred framework (e.g., `pytest`).
- Frontend: run `npm run lint` to check for ESLint issues.

## Troubleshooting

- **CORS or network errors**: confirm backend port `8003` is reachable from the frontend; adjust fetch URL if hosting separately.
- **Missing highlights**: ensure your API key has highlight access; the backend gracefully yields empty data when unavailable.
- **Large files**: the example configuration uses synchronous processing; consider background tasks for larger workloads.

## License

Provide licensing details here if applicable.
