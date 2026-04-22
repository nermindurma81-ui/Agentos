# AgentixOS Android APK Technical Execution Blueprint (FOSS-Only, Production)

## Architecture

### 1) Monorepo + Services Layout

```text
agentixos/
  apps/
    mobile-pwa/                  # Next.js 14 + Tailwind + PWA + Capacitor
    gateway/                     # Node.js 20 + Fastify + Socket.IO + proxy
    backend/                     # FastAPI + Celery + Redis + SQLAlchemy
  infra/
    docker-compose.yml
    nginx/
    prometheus/
    grafana/
  skills/
    coding/
    vibecoding/
    uiux/
    mobile_apk/
    ai/
    cad/
    cnc/
    automation/
    media/
  tools/
    registry/
  scripts/
    bootstrap.sh
    android_build.sh
```

### 2) Frontend (Mobile-First Android PWA wrapped as native APK)

- Framework: `next@14` (App Router), `react@18`, `typescript@5`
- Styling/UI: `tailwindcss`, `shadcn/ui`, `lucide-react`
- PWA: `next-pwa` + Workbox runtime caching + offline shell
- Native APK wrapper: `@capacitor/core`, `@capacitor/android`
- Real-time: `socket.io-client`
- File uploads: `tus-js-client` (primary), `resumablejs` (fallback)
- Voice input: browser-native `Web Speech API` (`webkitSpeechRecognition`)
- Terminal UI: `xterm`, `xterm-addon-fit`, `xterm-addon-web-links`
- State: `zustand` + `tanstack/react-query`
- Encryption (local API keys): `crypto-js` AES-GCM via Web Crypto API
- Local persistence: `idb` (IndexedDB) for offline messages, queued jobs, cached files

### 3) Node Gateway

- Runtime: Node.js 20 LTS
- Framework: `fastify`
- WS bridge: `socket.io`
- Proxy: `@fastify/http-proxy` to FastAPI REST/WS
- Auth: JWT verification (`jose`)
- Rate limiting: `@fastify/rate-limit`
- Redis pub/sub: `ioredis`
- Responsibilities:
  - Session ingress/egress
  - WebSocket fan-out to mobile clients
  - Backpressure + queue signaling
  - Heartbeat aggregation for model indicator

### 4) Backend

- Runtime: Python 3.11
- API: `fastapi`, `uvicorn[standard]`, `pydantic v2`
- Async WS: Starlette WebSocket endpoints (`/ws/agent/{session_id}`)
- Queue: `celery[redis]` + `redis`
- DB ORM: `sqlalchemy 2`, `alembic`
- Primary DB: PostgreSQL 16
- Supabase sync: `supabase-py` (free tier project)
- Firebase sync: `firebase-admin` SDK (Realtime Database)
- Object storage: `minio` Python SDK + local filesystem fallback
- File upload endpoint: tus protocol via `tusd` sidecar + webhook callback into FastAPI
- Background tasks:
  - Chunk merge/process callback
  - OCR/media/CAD/CNC long jobs
  - Agent continuous loop jobs

### 5) Storage + Data Plane

- PostgreSQL schemas:
  - `auth` (users, keys metadata)
  - `chat` (sessions, messages, attachments)
  - `agent` (runs, steps, validations, warnings)
  - `tools` (registry, install log)
  - `skills` (catalog, versions, source)
- Supabase usage:
  - Realtime mirror of `chat.messages`, `agent.runs`, `agent.warnings`
  - Auth optional for hosted deployments
- Firebase RTDB usage:
  - Device presence
  - Mobile push-like sync snapshots
  - Toggle per workspace/session
- Object storage paths (MinIO/local):
  - `inputs/{session_id}/...`
  - `outputs/{session_id}/...`
  - `artifacts/{run_id}/...`

### 6) Native Android Build

- Build chain:
  1. `pnpm build` (Next.js static/SSR bundle)
  2. `npx cap sync android`
  3. `./gradlew assembleRelease`
- Signing:
  - Android keystore via Gradle signing config
  - CI secret injection through GitHub Actions encrypted secrets
- Output: signed `.apk` and optional `.aab`

### 7) Security + Ops

- Transport: TLS via Nginx reverse proxy
- Secrets: `.env` + Doppler/SOPS optional; never hardcoded
- API key manager: AES-encrypted at rest in IndexedDB + server-side envelope encryption
- Sandbox command execution:
  - Linux namespace/containerized workers
  - command allowlist/denylist
  - timeout + memory + CPU quotas
- Observability:
  - `prometheus-client` (FastAPI metrics)
  - Grafana dashboards
  - Sentry self-hosted for error tracking

---

## Agents

### 1) Real Agent Repositories + Integration

- Hermes stack:
  - `NousResearch/Hermes-Function-Calling` (function calling behavior and schema style)
  - Hermes-capable models via OpenRouter/Groq/Mistral/Ollama
- Goose stack:
  - `block/goose` (autonomous coding/execution agent runtime)
- Orchestration framework:
  - `langgraph` for deterministic graph-state orchestration
  - `litellm` for provider abstraction + failover routing

### 2) Dual-Agent Contract

- `Hermes` responsibilities:
  - Task decomposition
  - Plan graph generation
  - Tool selection proposal
  - Output validation + hallucination checks
- `Goose` responsibilities:
  - Execute planned tool calls
  - Shell/filesystem/web actions
  - Generate artifacts
  - Emit structured step observations
- Cross-validation protocol:
  - Goose step result -> Hermes validator
  - Hermes failure verdict triggers retry or alternate tool path
  - Warning persisted to `agent.warnings`

### 3) Continuous Run + Manual Stop + Mid-Run Message Intake

- Run states: `queued`, `running`, `awaiting_approval`, `paused`, `stopped`, `completed`, `failed`
- Continuous loop controlled by Celery worker + Redis queue
- Manual stop endpoint: `POST /api/v1/agents/{run_id}/stop`
- Mid-run inbound messages endpoint: `POST /api/v1/agents/{run_id}/messages`
- Async queue merge strategy:
  - New messages appended to run inbox
  - Hermes re-plans from current state checkpoint

### 4) Provider Routing + Failover (Session Continuity)

- Primary: Polinations (free)
- Secondary chain: Groq -> OpenRouter free models -> Mistral hosted/free trial -> Ollama local
- Implemented in LiteLLM routing config with health probes
- Continuity mechanism:
  - Persist conversation state in PostgreSQL
  - Rehydrate prompts/system memory on provider switch

### 5) Heartbeat Model Indicator

- FastAPI task pings active provider/model every 5s
- Gateway emits `model_heartbeat` over Socket.IO
- UI top bar indicator:
  - green: heartbeat < 10s
  - amber: 10-30s
  - red: > 30s / disconnected

---

## Tools

### 1) Core Tool Runtime

- Dynamic registry path: `backend/tools/`
- Registration method:
  - Python entrypoint discovery via `importlib.metadata` and folder scan
  - JSON Schema for args + return types
- Tool execution contract:
  - `ToolRequest{name,args,run_id,timeout_s}`
  - `ToolResult{ok,stdout,stderr,artifacts,metrics}`

### 2) Real Toolchain Map

- Code/search: `tree-sitter`, `ripgrep`, `git`
- Web: `playwright`, `requests`, `httpx`, `beautifulsoup4`
- Files/media: `ffmpeg`, `imagemagick`, `pdfplumber`, `python-docx`, `openpyxl`
- AI/local: `ollama`, `transformers`, `sentence-transformers`
- Vision: `opencv-python`, `ultralytics` (YOLOv8), `pytesseract`, `pyzbar`
- CAD: `FreeCAD` Python API, `pythonocc-core` (OpenCascade bindings), `ezdxf`, `cadquery`
- CNC: `pycam`, `bCNC` CLI integration, post-processors for GRBL/Fanuc
- Terminal: restricted `bash` subprocess executor with cgroup/timeout caps

### 3) Missing Tool Auto-Install Flow

- Detect missing executable/import
- Query GitHub API (`/search/repositories`) + PyPI/npm metadata
- Return candidate package list to UI approval dialog
- On approval:
  - Python: `pip install <pkg>` in managed venv
  - Node: `pnpm add <pkg>` in gateway/frontend scope
  - System binary: apt/apk package recipe if available
- Append install result to `tools.install_log`
- Hot-reload registry

### 4) Live Terminal

- Frontend: xterm.js
- Backend PTY bridge:
  - Python `ptyprocess`/`pexpect` or Node `node-pty`
- WS stream channels:
  - `terminal:stdin`
  - `terminal:stdout`
  - `terminal:exit`

### 5) Output Folder Viewer

- API endpoints:
  - `GET /api/v1/runs/{run_id}/outputs`
  - `GET /api/v1/files/{file_id}/download`
- Support previews:
  - Text/code direct render
  - Image thumbnails
  - Video playable blobs
  - CAD/CNC files downloadable + metadata panel

---

## Execution Flow

### 1) ReAct Loop (Hard Implementation)

```text
INPUT -> HERMES_THOUGHT -> GOOSE_ACTION -> OBSERVATION -> HERMES_VALIDATE ->
{PASS => OUTPUT_STREAM, FAIL => REPLAN/RETRY} -> LOOP UNTIL TASK_COMPLETE
```

- Persist every step in `agent.steps`
- Max per-step timeout configurable
- Run never ends until one of:
  - explicit completion criteria matched
  - user-issued stop
  - unrecoverable error threshold exceeded

### 2) API + WS Endpoints (Real)

- Gateway:
  - `POST /api/v1/session`
  - `POST /api/v1/chat/{session_id}/message`
  - `GET /api/v1/health`
- FastAPI:
  - `POST /api/v1/agents/run`
  - `POST /api/v1/agents/{run_id}/stop`
  - `POST /api/v1/agents/{run_id}/messages`
  - `POST /api/v1/tools/install`
  - `POST /api/v1/skills/sync`
  - `GET /api/v1/providers/status`
  - `WS /ws/agent/{session_id}`
- tus upload:
  - `PATCH /files/*` handled by `tusd`
  - `POST /api/v1/uploads/callback` (tusd hook)

### 3) Main UI Functional Spec (Mobile-First)

- Chat-first screen:
  - message stream
  - composer + voice input
  - running status + stop button
- Left hamburger modules:
  1. Providers (Polinations default, OpenRouter/Groq/Mistral optional)
  2. Tools registry (dynamic list + install state)
  3. Skills manager (preloaded catalog + enable/disable)
  4. System prompt editor (global enforced prompt)
  5. Databases panel (Supabase/Firebase config + sync toggle)
- Top bar:
  - Active model heartbeat indicator
  - Live terminal toggle
  - Output folder viewer toggle

### 4) Skills System (Executable)

- Load path: `/skills`
- Manifest per skill: `skill.yaml` + executable module/script
- Categories:
  - coding, vibecoding, uiux, mobile_apk, ai, cad, cnc, automation, media
- Preload minimum 15 skills/category (repo-included modules)
- Missing skill flow:
  - Search GitHub/PyPI/npm
  - Approval required
  - Download/install into `/skills/<category>/<name>`
  - Register in DB + live reload

### 5) File Handling Pipeline

- Upload:
  - tus chunked uploads for unlimited size/resume support
- Process:
  - Celery worker consumes upload completion events
- Access:
  - agents mount read/write workspace path
- Outputs:
  - code, images, video, DXF, STL, STEP, G-code, PDF

### 6) Connectors

- Telegram:
  - `python-telegram-bot` webhook mode
- WhatsApp:
  - Meta WhatsApp Cloud API Graph endpoints
- GitHub:
  - `PyGithub` + `git` for clone/commit/push/PR
- Custom:
  - user-defined webhooks mapped to FastAPI handlers

### 7) Printing

- WiFi printing:
  - CUPS server + IPP via `pycups`
- Bluetooth printing:
  - Web Bluetooth API from Android WebView/Chrome context

### 8) Language + Translation

- Default locale: `bs` (Bosnian)
- Frontend i18n: `next-i18next`
- Offline translation: `argos-translate`
- Flow:
  - detect user input language
  - translate to agent working language if needed
  - translate response back to Bosnian by default

### 9) Deployment + CI/CD

- Docker Compose services:
  - nginx, gateway, backend, celery-worker, redis, postgres, minio, tusd, prometheus, grafana
- GitHub Actions workflows:
  - lint/test/build for frontend/backend/gateway
  - Android APK build + artifact upload
  - container image build/push

### 10) Non-Negotiable Runtime Rules

- No mock endpoints
- No fake data
- No placeholder integrations
- Tool execution only via installed/runnable binaries/packages
- Dual-agent mutual verification mandatory per execution turn
- All agent/tool/database actions logged with trace IDs
