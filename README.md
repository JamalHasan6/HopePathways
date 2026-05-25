# 🌿 Hope Pathways

**Suicide Prevention Network Hackathon — Prototype**

A calm, anonymous mental health navigation tool that helps someone who feels overwhelmed take the next safe step toward support.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 · TypeScript · Vite · React Router |
| Backend | Node.js · Express · TypeScript |
| Data | SQLite (`better-sqlite3`) + localStorage |

---

## Problem statement

People in crisis or emotional distress often face too many choices and not enough clarity. Hope Pathways provides a guided, 3-minute check-in that gently asks a few plain-language questions and matches the person with a clear next step — whether that is urgent support, a local service, peer connection, or self-guided resources.

---

## MVP scope (3 pages)

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Calm entry point with urgent help links |
| Guided check-in | `/chat` | 4-step chat-style triage |
| Result | `/result` | Matched pathway recommendation |

---

## How to run

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start the backend

```bash
cd backend
npm run dev
```

The API server starts at **http://localhost:3001**.

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

The app opens at **http://localhost:5173**. The Vite dev server proxies `/api` requests to the backend automatically.

### 4. Build for production

```bash
# Backend
cd backend
npm run build        # outputs to backend/dist/

# Frontend
cd ../frontend
npm run build        # outputs to frontend/dist/
```

---

## Project structure

```
HopePathways/
├── frontend/                   React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Chat.tsx
│   │   │   └── Result.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── UrgentSupport.tsx
│   │   ├── styles/global.css
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                    Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/session.ts
│   │   └── types/index.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/session` | Create anonymous check-in session |
| POST | `/api/session/:id/answer` | Submit a step answer |
| POST | `/api/session/:id/complete` | Finalize session & get triage result |
| GET | `/api/session/:id` | Retrieve session data |
| GET | `/api/health` | Health check |

---

## Safety disclaimer

> **Hope Pathways does not replace professional crisis support, emergency services, therapy, or medical care.**
>
> This is a hackathon prototype only. It is not a medical, clinical, diagnostic, or therapy tool. It must not be used as a substitute for professional help.
>
> If you or someone else is in immediate danger, call **000** (Australia) or your local emergency number.

---

## Future enhancements

- **AI-guided triage** — Use LLMs to provide empathetic, personalised navigation.
- **SMS / WhatsApp entry** — Let users start the check-in via text message.
- **Local support directory** — Real-time service availability and distance-based results.
- **Staff dashboard** — Alert duty managers when a crisis pathway is triggered.
- **Human escalation** — Warm handoff to a trained support worker mid-conversation.
- **Follow-up check-ins** — Scheduled, opt-in follow-ups via preferred channel.
- **Database** — Persist anonymous sessions (PostgreSQL / MongoDB).
- **Deployment** — Docker container with CI/CD pipeline.

---

## Azure hosting (recommended minimum)

You can host the current prototype in Azure **without** a managed database initially.

### Required services

1. **Backend API**: Azure App Service (Linux, Node 20) for `/backend`
2. **User frontend**: Azure Static Web App (or App Service) for `/frontend`
3. **Admin frontend (optional)**: Azure Static Web App (or App Service) for `/Admin/frontend`

### Why no Azure DB is required initially

The backend currently stores data in a local SQLite file:

- `backend/data/hopepathways.db`

This is enough for early/demo hosting. Add a managed Azure database later for scale, backup, and multi-instance reliability.

### Environment variables

#### Backend (`backend` App Service)

- `ALLOWED_ORIGINS` (comma-separated origins for CORS + Socket.IO), for example:
  - `https://your-user-app.azurestaticapps.net,https://your-admin-app.azurestaticapps.net`
  - In production, this must be set and uses HTTPS origins only
- `OPENAI_API_KEY` or `GITHUB_TOKEN` (optional, enables AI triage)
- `PORT` is provided by App Service automatically

#### User frontend (`frontend`)

- `VITE_API_BASE_URL` (optional)
  - Leave empty if `/api` is reverse proxied to backend (frontend will use relative `/api/...` paths)
  - Set to backend URL if calling backend directly (for example `https://your-backend.azurewebsites.net`)

#### Admin frontend (`Admin/frontend`)

- `VITE_API_BASE_URL` (same behavior as above)
- `VITE_SOCKET_URL` (Socket.IO server URL, for example `https://your-backend.azurewebsites.net`)
  - If explicitly set to an empty value, Socket.IO live updates are disabled and the dashboard falls back to 30-second interval polling

### Deployment flow

1. Create Resource Group
2. Create App Service Plan + backend Web App (Linux Node 20)
3. Deploy `/backend`
4. Configure backend app settings (`ALLOWED_ORIGINS`, AI key if needed)
5. Build/deploy `/frontend`
6. Build/deploy `/Admin/frontend` (if using admin dashboard)
7. Configure frontend/admin environment variables for backend routing
8. Validate:
   - `GET /api/health`
   - end-user session flow (`/api/session`, `/answer`, `/complete`)
   - admin real-time updates (Socket.IO events)
9. Add custom domain, HTTPS, monitoring (Application Insights), and secret management (Key Vault)

### When to add managed Azure DB

Move from SQLite to Azure Database for PostgreSQL (or similar) when you need:

- multi-instance backend scaling
- durable backups and recovery
- stronger production reliability and operations

---

## Team

Built at the Suicide Prevention Network Hackathon.
