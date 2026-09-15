<div align="center">

# 🚀 OmniRoute-MS

**Run [OmniRoute](https://github.com/diegosouzapw/OmniRoute) on free [ModelScope](https://www.modelscope.ai) Studio — one stable endpoint, automatic provider fallback.**

[![Docker](https://img.shields.io/badge/docker-7860-blue?logo=docker)](./Dockerfile)
[![ModelScope](https://img.shields.io/badge/ModelScope-Studio-purple)](https://www.modelscope.ai/studios)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Worker-orange?logo=cloudflare)](./workers/bridge-template.js)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**[🇬🇧 English](./README.md) · [🇮🇷 فارسی](./README.fa.md)**

</div>

---

## 🧭 How it works

```
┌──────────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│  Any OpenAI      │      │  Cloudflare       │      │  ModelScope Studio  │
│  chat client     │─────▶│  Worker (stable)  │─────▶│  OmniRoute (Docker) │
│  1 Base URL      │      │  fixes framing +  │      │  aggregates YOUR    │
│  1 API key       │      │  gateway auth     │      │  provider keys with │
└──────────────────┘      └───────────────────┘      │  auto-fallback      │
                                                     └─────────────────────┘
```

> **Why the Worker?** The ModelScope gateway consumes the `Authorization` header for its own
> token, and the prebuilt image sends `X-Frame-Options: DENY` (no dashboard inside the Studio
> iframe). The Worker adds the gateway headers **and** rewrites the framing headers — clients
> only ever see **one Base URL + one key**.

## ✨ What this fork changes vs upstream

| # | Area | Change |
|---|------|--------|
| 1 | 🐳 Image | Uses the **official prebuilt image** (`diegosouzapw/omniroute:3.8.50`, pinned) — building from source needs >8 GB and fails on the free Studio builder |
| 2 | 🐳 Port | `PORT=7860`, `HOSTNAME=0.0.0.0`, `EXPOSE 7860` (ModelScope Docker requirement; upstream uses `20128`) |
| 3 | 💾 Persistence | `DATA_DIR=/mnt/workspace/omniroute-data` (Studio's only persistent path) |
| 4 | 🔑 Auth compat | App key also accepted via unconditional `x-omniroute-key` (`src/sse/services/auth.ts`; `x-goog-api-key` already works) — documented in `Dockerfile.source-build.bak` |
| 5 | 💓 Keep-alive | `keep-alive.sh`: proven-pattern watcher — random 30 min–15 h sleeps, local log-like activity, occasional localhost hit via node, heartbeat file |
| 6 | 📡 Monitoring | `/api/keepalive-status` route (reads the heartbeat file) — documented in `Dockerfile.source-build.bak` |
| 7 | 🌉 Stable URL | `workers/bridge-template.js`: Cloudflare Worker template (no secrets inside) |

> Notes 4 & 6 live in the **source-build track** (`Dockerfile.source-build.bak`): they apply when
> building from source on a bigger machine. The deployed Studio image is prebuilt + items 1–3, 5.

## 🛠️ Setup — step by step (browser only, no terminal)

### Step 1 — Create the Studio
`modelscope.ai` → **Studios** → **Create** → type **Docker**, free hardware. Push this repo
(`master`) and **Deploy** (pulls ~1 GB, a few minutes).

### Step 2 — Studio Secrets (Studio page → Secrets — never commit these!)
| Key | Value |
|-----|-------|
| `JWT_SECRET` | long random string |
| `INITIAL_PASSWORD` | your dashboard password (**only applied on first boot** — see below) |
| `REQUIRE_API_KEY` | `false` |
| `API_KEY_SECRET` | any random string |

> The password is hashed into the persistent DB on **first boot only**. Changing the secret later
> does **not** change the stored password — log in with the first one, then change it inside the
> dashboard (Profile/Settings), or wipe `/mnt/workspace/omniroute-data` + redeploy.

### Step 3 — Open the dashboard (tunnel or Worker, not the `ms.fun` host)
The prebuilt image sends `X-Frame-Options: DENY`, so the Studio iframe stays blank — this is
upstream hardening, not a bug. Dashboard → **Tunnel** → **Enable** (once), then use the tunnel
URL, or put the Worker in front (Step 5) which also rewrites the framing headers.

### Step 4 — Create an OmniRoute API key
Dashboard → **API Keys** → New Key (`sk-...`). Rotate after testing.

### Step 5 — Stable URL via your own Cloudflare Worker (recommended)
1. `dash.cloudflare.com` → Workers & Pages → Create Worker → paste
   [`workers/bridge-template.js`](./workers/bridge-template.js) → Deploy.
2. Settings → Variables and Secrets: plaintext `TUNNEL_URL` = current tunnel host;
   secret `MS_TOKEN` = ModelScope token (fallback only — never in code).
3. Clients use (stable forever): Base URL `https://<worker>.<subdomain>.workers.dev/v1`,
   API Key `<omniroute-key>`. When the tunnel host changes, only update `TUNNEL_URL`.
4. Quick tunnels die on every redeploy — re-enable in the dashboard (or API) and refresh the Worker.

### Step 6 — Add your provider keys
Dashboard → Providers → add each key. OmniRoute auto-switches on rate limits: many limited
keys in, one unlimited-feeling endpoint out.

## 🔒 Security notes
- No real tokens/passwords in this repo (only placeholders). Real values live in Studio Secrets
  and Worker Secrets — safe even though the Studio is public.
- `tests/` and `docs/` are excluded from this repo (upstream originals contain sample keys that
  trip push protection); full docs live upstream. The OAuth client IDs in `open-sse/` are
  upstream's own public app credentials.
- Keeping a free Studio awake with low-frequency human-like pings may violate platform ToS —
  your responsibility.

## 📁 Key files
- `Dockerfile` — ModelScope wrapper (prebuilt + port/persistence/keep-alive)
- `Dockerfile.source-build.bak` — full source-build variant with auth + status-endpoint patches
- `keep-alive.sh` — proven-pattern keep-alive · `workers/bridge-template.js` — stable-URL Worker
- `README.fa.md` — راهنمای فارسی · `README_UPSTREAM.md` — original readme
