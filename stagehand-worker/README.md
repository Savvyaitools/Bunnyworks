# Stagehand Worker

HTTP service that drives a Browserbase session with Stagehand on behalf of the
`browser-agent` edge function.

## Endpoints

- `GET /health` — liveness probe
- `POST /run` — execute a workflow (requires `Authorization: Bearer $WORKER_TOKEN`). Accepts an optional `runId`; one is generated if omitted. Returns `{ ok, runId, logs, result }`.
- `GET /run/:id` — status of an in-progress run (`{ runId, task, startedAt, cancelled }`); 404 once finished.
- `DELETE /run/:id` — cancel an in-progress run. Closes the Stagehand session so any in-flight `act`/`extract`/`goto` aborts; the `POST /run` call returns HTTP 499 with `cancelled: true`.

### Request body

```json
{
  "connectUrl": "wss://connect.browserbase.com/...",
  "systemPrompt": "You are a VA...",
  "task": "Find leads on X",
  "steps": [
    { "type": "goto", "url": "https://x.com/explore" },
    { "type": "act",  "instruction": "Search for fitness model" },
    { "type": "wait", "ms": 1500 },
    { "type": "extract", "instruction": "Top 10 accounts", "schema": { "accounts": "array" } }
  ]
}
```

### Response

```json
{ "ok": true, "logs": [...], "result": { "extracted": [...], "currentUrl": "..." } }
```

## Local dev

```bash
cp .env.example .env
npm install
npm run dev
```

## Deploy

Deploy to any Node 20 host (Fly.io, Render, Railway, Cloud Run) using the included
`Dockerfile`. Then set on the Supabase edge function:

- `STAGEHAND_SERVER_URL` — public URL of this worker
- `STAGEHAND_WORKER_TOKEN` — must match `WORKER_TOKEN` here