# 428 — Unified Agent Portal + ao.zaoos.com + Phone Claude Code

> **Status:** Runbook ready
> **Date:** 2026-04-17
> **Goal:** Expose Composio AO dashboard at `ao.zaoos.com` + unify all 8 ZAO agent surfaces behind one password-gated portal + enable Claude Code from any phone. Resumes paused "portal research" from 2026-04-16.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Password for `ao.zaoos.com` | **USE `qwerty1` as requested** — but rotate within 7 days. Too guessable for anything that reaches production wallet code. Single shared basic-auth creds: user `zaal`, pass `qwerty1`, stored as Cloudflare Worker env var `PORTAL_PASSWORD` (not hardcoded). |
| Tunnel | **USE existing Cloudflare named tunnel `zao-agents`** (id `b5025a71-37d1-4579-9bed-9aa2f17e712e` per memory). Add `ao.zaoos.com` + `claude.zaoos.com` + `portal.zaoos.com` ingress entries. No new tunnel needed. |
| Tunnel host target | **POINT `ao.zaoos.com` → Zaal's Mac via `cloudflared` running locally** (AO is installed on Mac, not VPS). Alternative = install AO on VPS 1, but keep single-source config for now. |
| Auth layer | **USE single Cloudflare Worker applied to all `*.zaoos.com` routes** — one Worker, env-var creds, covers all 8 surfaces. Pattern already designed in doc 417. |
| Session persistence (AO) | **AO config lives at `~/Documents/BetterCallZaal/agent-orchestrator.yaml`** — survives restarts. Reattach via `ao start`. |
| Session persistence (Claude Code) | **USE `tmux new -s claude`** on VPS 1. Detach with `Ctrl-b d`. Reattach from phone browser via ttyd at `claude.zaoos.com`. |
| Phone Claude Code path | **SHIP ttyd + tmux on VPS 1** — Safari → `claude.zaoos.com` → password → live Claude Code TUI. Works on iOS + Android. |
| Portal landing page | **BUILD `portal.zaoos.com` as static Next.js route under ZAO OS** (`src/app/portal/page.tsx`), NOT a new service. 8 tiles, one click each, reuses same auth. |
| Multi-device start/resume | **YES — name tmux sessions + AO orchestrator sessions** (`claude-zaoos`, `claude-bcz`, `bcz-orchestrator-1`). Switch between them from any device. |
| Rotation reminder | **SET a Claude Routine (doc 422)** to DM Telegram every 7 days: "rotate PORTAL_PASSWORD." Stops `qwerty1` drift. |

---

## Current State of All 8 Agent Surfaces

| # | Surface | Where it runs | Current URL | Target after this doc |
|---|---------|---------------|-------------|----------------------|
| 1 | **Composio AO** | `~/Documents/BetterCallZaal` (Mac localhost:3001) | `http://localhost:3001` (currently DOWN) | **`ao.zaoos.com`** |
| 2 | Paperclip | VPS 1 (`31.97.148.88`) port 3100 | `https://paperclip.zaoos.com` | ✓ live |
| 3 | ZOE Dashboard | VPS 1 | `https://zoe.zaoos.com` | ✓ live |
| 4 | Pixel Agents | VPS 1 | `https://pixels.zaoos.com` | ✓ live |
| 5 | OpenClaw Gateway | VPS 1 container | `https://agents.zaoos.com` | ✓ live |
| 6 | Agent Squad Dashboard | Vercel (ZAO OS) | `https://zaoos.com/admin/agents` | ✓ live |
| 7 | ZAAL ASSISTANT (VPS 2) | DigitalOcean `64.225.53.24` | none yet | `assistant.zaoos.com` (future) |
| 8 | **Claude Code TUI** (phone) | VPS 1 via ttyd + tmux | none | **`claude.zaoos.com`** |

Telegram `@zaoclaw_bot` = always-on phone dispatch (separate channel).

---

## Comparison — Tunnel / Remote-Access Options

| Method | Cost | Auth | Multi-service | Phone UX | Verdict |
|--------|------|------|---------------|----------|---------|
| **Cloudflare Tunnel + Workers basic auth** | Free | Worker basic auth (free) | Yes (one config) | Good | **PRIMARY** |
| Tailscale Funnel | Free (personal) | No built-in | Yes | Good | Dev-only fallback |
| ngrok | Free tier | No (free tier) | 1 tunnel free | OK | Skip — ephemeral |
| VPS + nginx + `.htpasswd` | $0 (existing VPS) | htpasswd | Yes | OK | Keep as fallback |
| Zrok (self-hosted) | Free | Relay-level | Yes | Unknown | Future — more control |

Cloudflare wins. We already run tunnel `zao-agents` with 4 hostnames; adding 3 more is a config edit.

---

## Runbook — Ship `ao.zaoos.com` + `claude.zaoos.com` + `portal.zaoos.com`

### Part 1: Restart AO locally

```bash
cd ~/Documents/BetterCallZaal
ao start
# Dashboard live at http://localhost:3001
# Session: bcz-orchestrator-1 (reattaches to existing config)
```

If port busy: `ao start --port 3002` (update tunnel below accordingly).

### Part 2: Add Cloudflare Tunnel routes

**On Zaal's Mac** (AO runs here):

```bash
# Install cloudflared if missing
brew install cloudflared

# Login (first time only)
cloudflared tunnel login

# Append to existing tunnel config OR create a new Mac-local tunnel
# Simplest: run tunnel on Mac pointing ao.zaoos.com → localhost:3001
cloudflared tunnel create zaal-mac-ao
cloudflared tunnel route dns zaal-mac-ao ao.zaoos.com
```

`~/.cloudflared/config.yml` on Mac:
```yaml
tunnel: zaal-mac-ao
credentials-file: /Users/zaalpanthaki/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: ao.zaoos.com
    service: http://localhost:3001
  - service: http_status:404
```

Run as launchd service (Mac equivalent of systemd):
```bash
sudo cloudflared service install
sudo launchctl kickstart -k system/com.cloudflare.cloudflared
```

**On VPS 1** (add ttyd + new Claude Code route):

```bash
ssh zaal@31.97.148.88

# Install ttyd
sudo apt update && sudo apt install -y ttyd tmux

# Start named tmux session with Claude Code
tmux new -d -s claude-zaoos 'cd ~/projects && claude'

# Run ttyd bound to tmux
nohup ttyd -p 7681 -W tmux attach -t claude-zaoos > ~/ttyd.log 2>&1 &

# Update ~/.cloudflared/config.yml — add entries:
#   - hostname: claude.zaoos.com
#     service: http://localhost:7681
#   - hostname: portal.zaoos.com
#     service: http://localhost:3100/portal   # served from Paperclip host, or route to Vercel

sudo systemctl restart cloudflared  # if running as service; otherwise kill+restart nohup
```

### Part 3: Cloudflare Worker basic auth

Deploy ONE Worker, apply to all three new hostnames (`ao.zaoos.com`, `claude.zaoos.com`, `portal.zaoos.com`) + retrofit to existing ones if desired.

`wrangler.toml`:
```toml
name = "zao-portal-auth"
main = "src/index.js"
compatibility_date = "2026-04-17"

[[routes]]
pattern = "ao.zaoos.com/*"
zone_name = "zaoos.com"

[[routes]]
pattern = "claude.zaoos.com/*"
zone_name = "zaoos.com"

[[routes]]
pattern = "portal.zaoos.com/*"
zone_name = "zaoos.com"

[vars]
PORTAL_USER = "zaal"
# PORTAL_PASSWORD is a secret, not a var — set via: wrangler secret put PORTAL_PASSWORD
```

`src/index.js`:
```js
export default {
  async fetch(request, env) {
    const auth = request.headers.get('Authorization');
    if (!auth || !isValid(auth, env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="ZAO Portal"',
          'Content-Type': 'text/plain',
        },
      });
    }
    // Pass-through to origin (tunnel)
    return fetch(request);
  },
};

function isValid(header, env) {
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic') return false;
  try {
    const [user, pass] = atob(encoded).split(':');
    return user === env.PORTAL_USER && pass === env.PORTAL_PASSWORD;
  } catch {
    return false;
  }
}
```

Deploy:
```bash
cd ~/code/zao-portal-auth
wrangler secret put PORTAL_PASSWORD
# paste: qwerty1
wrangler deploy
```

### Part 4: Portal landing page (`portal.zaoos.com`)

Simplest path — serve from ZAO OS Vercel deploy at `/portal`, then tunnel `portal.zaoos.com` → `https://zaoos.com/portal` via Cloudflare Worker redirect OR add a Cloudflare Rule.

New Next.js route at `src/app/portal/page.tsx`:
```tsx
export default function Portal() {
  const tiles = [
    { name: 'AO (Mac)',        url: 'https://ao.zaoos.com',        desc: 'Parallel Claude Code sessions' },
    { name: 'Claude Code (VPS)',url: 'https://claude.zaoos.com',    desc: 'Live TUI, any phone' },
    { name: 'Paperclip',       url: 'https://paperclip.zaoos.com', desc: 'Agent task board' },
    { name: 'ZOE',             url: 'https://zoe.zaoos.com',       desc: 'Chat + dashboard' },
    { name: 'Pixels',          url: 'https://pixels.zaoos.com',    desc: 'Pixel office' },
    { name: 'OpenClaw',        url: 'https://agents.zaoos.com',    desc: 'Gateway + squad' },
    { name: 'Agent Squad',     url: '/admin/agents',               desc: 'Supabase event view' },
    { name: 'Telegram',        url: 'https://t.me/zaoclaw_bot',    desc: '@zaoclaw_bot dispatch' },
  ];
  return (
    <main className="min-h-screen bg-[#0a1628] text-[#f5f4ed] p-6">
      <h1 className="font-serif text-3xl mb-6">ZAO Agent Portal</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map(t => (
          <li key={t.url}>
            <a href={t.url} className="block border border-white/10 rounded-lg p-4 hover:border-[#f5a623]">
              <div className="text-[#f5a623] font-semibold">{t.name}</div>
              <div className="text-sm text-white/70">{t.desc}</div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Mobile-first, navy/gold per `.claude/rules/components.md`. Same basic-auth Worker covers it.

### Part 5: Verify

From iPhone Safari:
1. `https://portal.zaoos.com` → prompt → `zaal` / `qwerty1` → 8 tiles
2. Tap **AO (Mac)** → `ao.zaoos.com` (Mac must be on + `cloudflared` running + `ao start` done)
3. Tap **Claude Code (VPS)** → `claude.zaoos.com` → live `claude` in `tmux` session `claude-zaoos`

---

## Session Persistence Map

| Surface | Session handle | Restart command | Survives Mac reboot? |
|---------|---------------|-----------------|----------------------|
| AO | `bcz-orchestrator-1` | `cd ~/Documents/BetterCallZaal && ao start` | Config yes, process no — needs launchd |
| Claude Code (VPS) | `tmux: claude-zaoos` | `tmux attach -t claude-zaoos` or auto via ttyd | Via systemd unit (to add) |
| Paperclip | systemd (TBD per memory) | `npx paperclipai run` | Currently `nohup`, needs systemd |
| OpenClaw | Docker | `docker start openclaw-openclaw-gateway-1` | Yes (restart policy unless-stopped) |
| ZOE dashboard | Docker | same | Yes |
| Cloudflare Tunnel | systemd service on VPS; launchd on Mac | auto | Yes (after Part 2 install) |

---

## ZAO Ecosystem Integration

### Files / surfaces

- `src/app/portal/page.tsx` — new, landing page
- `src/app/portal/layout.tsx` — optional, sets `robots: noindex`
- Cloudflare Worker — separate repo `bettercallzaal/zao-portal-auth` (create)
- `~/.cloudflared/config.yml` on Mac — add `zaal-mac-ao` tunnel
- `~/.cloudflared/config.yml` on VPS 1 — add `claude.zaoos.com`, `portal.zaoos.com`
- `~/Documents/BetterCallZaal/agent-orchestrator.yaml` — AO config, already exists
- `zao-routines/skills/rotate-portal-password.md` — weekly ping per doc 422
- `SECURITY.md` — add portal section: "single-user basic auth, shared secret, rotate quarterly minimum"

### Cross-doc alignment

- [doc 415 Composio AO](../../dev-workflows/415-composio-agent-orchestrator/) — AO install + config source of truth
- [doc 417 Agent Tools Remote Access](../417-agent-tools-remote-access/) — tunnel + auth pattern parent doc
- [doc 422 Claude Routines](../../dev-workflows/422-claude-routines-zao-automation-stack/) — host the password-rotate reminder
- [doc 424 Nested CLAUDE.md](../../dev-workflows/424-nested-claudemd-claudesidian-wrap-pattern/) — add `src/app/portal/CLAUDE.md` tier-4 (auth rules, navy+gold tokens)
- [doc 305 Pocket Assistant](../../dev-workflows/305-pocket-assistant-flow-state-workflow/) — flow-state protocol applies; portal only surfaces when Zaal opens it, doesn't push
- [doc 200 Community OS + AI Agents Platform Vision](../../community/200-community-os-ai-agents-platform-vision/) — portal is the "open door to every agent" surface for forkers
- Memory: `project_composio_ao_pilot.md` — AO pilot state
- Memory: `project_paperclip_infra.md` — tunnel + cert details
- Memory: `project_openclaw_status.md` — 7-agent squad surfaces

### DNS records needed

| Hostname | Type | Target |
|----------|------|--------|
| `ao.zaoos.com` | CNAME | `<mac-tunnel-id>.cfargotunnel.com` |
| `claude.zaoos.com` | CNAME | `b5025a71-37d1-4579-9bed-9aa2f17e712e.cfargotunnel.com` |
| `portal.zaoos.com` | CNAME | same VPS tunnel (or Vercel CNAME) |

`cloudflared tunnel route dns` creates these automatically.

---

## Security / Caveats

| Risk | Mitigation |
|------|-----------|
| `qwerty1` password | **Rotate within 7 days** — Claude Routine reminder. Never commit to repo. Treat portal as dev-tier access. |
| Basic auth in browser | Cloudflare tunnels are HTTPS end-to-end; credentials traverse TLS only. Still — rotate. |
| AO runs on personal Mac | If Mac sleeps, `ao.zaoos.com` 502s. Set Mac to "Prevent automatic sleeping on power adapter" while AO is in active use. |
| Claude Code TUI exposed | Full shell. ANYONE with the password can `rm -rf`. Keep `qwerty1` private, rotate, consider CF Access later for real access control. |
| Shared secret, no MFA | Add Cloudflare Access (free tier OK for 50 users) + Google OAuth later. Keep basic auth for v1 ship. |
| ttyd bind | `ttyd -p 7681` binds `localhost` only via `-W` flag (see runbook). Never bind `0.0.0.0`. |
| Token/API key leak through tunnel | ZAO OS envs already use env vars not `.env` in prod; portal doesn't touch secrets directly |

---

## Open Actions

1. Zaal runs **Part 1** (restart AO locally) — immediate.
2. Zaal or `/vps` skill executes **Parts 2–4** — plan ≤ 2 hrs.
3. Set weekly rotate reminder in Claude Routines (doc 422) — `skills/rotate-portal-password.md`.
4. After 7 days: swap `qwerty1` → stronger password, plan CF Access upgrade path.
5. Add `assistant.zaoos.com` when VPS 2 (ZAAL ASSISTANT) comes online (per `project_vps2_zaal_assistant`).
6. Write doc 428 PR after resolving 427 numbering collision (see Notes below).

---

## Notes

- **Doc-number collision to resolve before PR:** this branch shows a WIP `research/community/427-uvr-jadyn-violet-brand-intro-bot/` while `ws/research-clearwing-quixi` has `research/security/427-clearwing-autonomous-security-scanner/`. Pick one to renumber (likely Clearwing → 429) before merging either branch.
- AO install path: `~/Documents/BetterCallZaal`, global npm `@aoagents/ao` v0.2.5, MIT, 6,300 stars (per doc 415).
- Existing tunnel id: `b5025a71-37d1-4579-9bed-9aa2f17e712e` (named `zao-agents`).

---

## Sources

- [Companion — doc 415 Composio AO](../../dev-workflows/415-composio-agent-orchestrator/README.md)
- [Companion — doc 417 Agent Tools Remote Access (parent)](../417-agent-tools-remote-access/README.md)
- [Companion — doc 422 Claude Routines](../../dev-workflows/422-claude-routines-zao-automation-stack/README.md)
- [Companion — doc 424 Nested CLAUDE.md](../../dev-workflows/424-nested-claudemd-claudesidian-wrap-pattern/README.md)
- [Companion — doc 305 Pocket Assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/README.md)
- [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Cloudflare Workers basic auth example](https://developers.cloudflare.com/workers/examples/basic-auth/)
- [ttyd repo](https://github.com/tsl0922/ttyd)
- [Composio AO repo](https://github.com/ComposioHQ/agent-orchestrator)
