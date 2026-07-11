# Quantum AI — Frontend

React chat UI for the Quantum AI Assistant API.

**Port:** `5175`  
**URL:** `http://localhost:5175`

## Setup

```powershell
cd frontend
npm install
```

Optional: copy `.env.example` to `.env` (defaults work in dev via Vite proxy).

## Run

```powershell
npm run dev      # development
npm run build    # production build
npm run preview  # preview production build
```

> **Note:** The backend must be running on port **5001**. Vite proxies `/api` to `http://localhost:5001`.

## Features

- Streaming AI chat
- Conversation history
- Document upload (PDF, DOCX, TXT, etc.)
- Summarize documents
- Generate PowerPoint from PDFs

## Structure

```
frontend/
├── src/
│   ├── api/          # API client + SSE streaming
│   ├── components/   # Chat UI components
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
└── vite.config.ts    # proxy /api → localhost:5001
```
