# 417 - Agent Tools Remote Access: Making Everything Reachable from zaoos.com

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Make all agent dashboards (AO, ZOE, Paperclip, Pixels) accessible from any computer via zaoos.com subdomains with simple password auth

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Tunnel method** | USE Cloudflare Tunnel (free, unlimited bandwidth, built-in HTTPS/DDoS). Run `cloudflared` on VPS, map subdomains to local services |
| **Auth** | USE Cloudflare Workers with HTTP Basic Auth for dev dashboards. Free, no Cloudflare Access payment needed. Simple password gate |
| **VPS as hub** | USE existing VPS (31.97.148.88) to run all agent dashboards centrally. Already runs OpenClaw. Add nginx reverse proxy for routing |
| **Tailscale Funnel** | SKIP for public access. Already use Tailscale for SSH but Funnel has no built-in auth. Good for dev only |
| **Vercel proxy** | SKIP. Next.js rewrites can't reliably proxy full dashboards. Header loss, redirect issues |
| **ngrok/bore/localtunnel** | SKIP. No auth, ephemeral URLs, not production-grade |
| **Zrok** | INVESTIGATE later. Self-hosted zero-trust tunneling. More control than Cloudflare but harder setup |

---

## Current Agent Infrastructure

| Tool | URL | Where It Runs | Status |
|------|-----|--------------|--------|
| ZOE Dashboard | zoe.zaoos.com | VPS (31.97.148.88) | Live |
| Pixel Agents | pixels.zaoos.com | VPS | Live |
| Paperclip | paperclip.zaoos.com | VPS | Live |
| Agent Squad Dashboard | zaoos.com/admin/agents | Vercel (Next.js) | Live |
| AO Dashboard | localhost:3001 | Local Mac | NEW - needs remote access |
| ZOE Telegram | @zoe_zao_bot | Telegram | Live |
| OpenClaw | VPS port 3000 | VPS | Running |

## Comparison: Remote Access Methods

| Method | Cost | Auth | Multiple Services | Uptime | ZAO Fit |
|--------|------|------|-------------------|--------|---------|
| **Cloudflare Tunnel** | Free | Workers basic auth (free) | Yes (one config) | 99.9% (Cloudflare edge) | **BEST** |
| **VPS + nginx** | $0 (existing VPS) | .htpasswd | Yes (vhosts) | VPS uptime | **GOOD** |
| **Tailscale Funnel** | Included | None built-in | Yes | Tailscale uptime | Dev only |
| **Vercel rewrites** | Free | Middleware | Partial | Vercel uptime | SKIP |
| **ngrok** | Free (limited) | None on free | 1 per free plan | Ephemeral | SKIP |
| **Zrok** | Free (self-host) | Relay-level | Yes | Self-managed | Future |

## Architecture: Unified Agent Access

```
zaoos.com (Vercel)
├── /admin/agents     → Agent Squad Dashboard (7 agents, monitoring)
├── /admin/nexus      → Nexus Links Manager (CRUD for all tools)
└── /portal           → Portal Hub (categorized doors to everything)

ao.zaoos.com (Cloudflare Tunnel → VPS or local)
└── Composio AO Dashboard (parallel agent orchestration)

zoe.zaoos.com (Cloudflare Tunnel → VPS)
└── ZOE Chat Dashboard + Pixel Office

pixels.zaoos.com (Cloudflare Tunnel → VPS)
└── Pixel Agent Office

paperclip.zaoos.com (Cloudflare Tunnel → VPS)
└── Paperclip Agent Dashboard

ZOE Telegram: @zoe_zao_bot (always accessible)
```

## Setup: Cloudflare Tunnel on VPS

```bash
# 1. Install cloudflared on VPS
ssh root@31.97.148.88
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 2. Login to Cloudflare
cloudflared tunnel login  # opens browser, auth with zaoos.com domain

# 3. Create tunnel
cloudflared tunnel create zao-agents

# 4. Configure routes
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: zao-agents
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: ao.zaoos.com
    service: http://localhost:3001
  - hostname: zoe.zaoos.com
    service: http://localhost:3000
  - hostname: pixels.zaoos.com
    service: http://localhost:3002
  - hostname: paperclip.zaoos.com
    service: http://localhost:8080
  - service: http_status:404
EOF

# 5. Add DNS records (Cloudflare does this automatically)
cloudflared tunnel route dns zao-agents ao.zaoos.com
cloudflared tunnel route dns zao-agents zoe.zaoos.com

# 6. Run as service
sudo cloudflared service install
sudo systemctl start cloudflared
```

## Setup: Password Auth via Cloudflare Worker

```javascript
// Deploy as Cloudflare Worker on ao.zaoos.com route
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !isValid(auth)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="ZAO Agent Dashboard"' },
    });
  }
  // Pass through to origin (Cloudflare Tunnel)
  return fetch(request);
}

function isValid(auth) {
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic') return false;
  const decoded = atob(encoded);
  const [user, pass] = decoded.split(':');
  return user === 'zaal' && pass === ZAO_DASHBOARD_PASSWORD; // env var
}
```

## Integration with Composable OS (Doc 415)

Agent dashboards become apps in the OS app manifest:

```typescript
// In src/lib/os/app-manifest.ts
{
  id: 'ao-dashboard',
  name: 'Agent Orchestrator',
  icon: '🤖',
  category: 'tools',
  type: 'full-app',
  description: 'Parallel AI agent management',
  externalUrl: 'https://ao.zaoos.com',  // Cloudflare Tunnel
  requiresAuth: true,
  requiresGate: 'allowlist',
},
{
  id: 'zoe-dashboard',
  name: 'ZOE Command Center',
  icon: '🦞',
  category: 'tools',
  type: 'full-app',
  description: 'Agent squad monitoring',
  externalUrl: 'https://zoe.zaoos.com',
  requiresAuth: true,
}
```

## User Experience: "One Place for Everything"

After setup, Zaal can access from any computer:

| What | How | Auth |
|------|-----|------|
| Agent Squad status | zaoos.com/admin/agents | ZAO OS login |
| AO (parallel agents) | ao.zaoos.com | Basic auth password |
| ZOE chat | zoe.zaoos.com | Basic auth password |
| Pixel agents | pixels.zaoos.com | Basic auth password |
| Paperclip | paperclip.zaoos.com | Basic auth password |
| ZOE commands | Telegram @zoe_zao_bot | Telegram login |
| All tools directory | zaoos.com/portal | ZAO OS login |

One password, any computer, any time.

---

## ZAO Ecosystem Integration

### Codebase Files Affected

| File | Change |
|------|--------|
| `src/lib/portal/destinations.ts` | ADD ao.zaoos.com to BUILD portal |
| `community.config.ts` | ADD agent dashboard URLs |
| VPS `~/.cloudflared/config.yml` | NEW - tunnel configuration |
| Cloudflare Workers | NEW - basic auth worker |

### Existing Infrastructure

- VPS at 31.97.148.88 already runs OpenClaw, ZOE, Pixels, Paperclip
- Cloudflare already manages zaoos.com DNS
- Tailscale already provides SSH access to VPS
- Portal system (`src/lib/portal/destinations.ts`) already categorizes tools

---

## Sources

- [Cloudflare Tunnel Setup](https://developers.cloudflare.com/tunnel/setup/)
- [Cloudflare Tunnel Expose Localhost 2026](https://dev.to/recca0120/cloudflare-tunnel-in-2026-expose-localhost-without-opening-ports-or-buying-an-ip-32l5)
- [Password Protect with Cloudflare Workers](https://www.maxivanov.io/how-to-password-protect-your-website-with-cloudflare-workers/)
- [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)
- [Doc 415: Composable OS Architecture](../415-composable-os-architecture/) - App manifest integration
- [Doc 416: Native App Distribution](../416-native-app-testflight-playstore/) - Mobile access to same tools
