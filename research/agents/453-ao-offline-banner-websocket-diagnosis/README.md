# AO Offline Banner - WebSocket Diagnosis

Doc: 453 | Date: 2026-04-20 | Status: Research complete

## Summary

The persistent "Offline - tap to retry" banner in the AO dashboard at https://ao.zaoos.com is caused by a missing WebSocket route in the Caddy reverse proxy configuration. The browser cannot establish a connection to the terminal multiplexer WebSocket endpoint.

## Root Cause

The AO frontend uses a multiplexed WebSocket client embedded in the Next.js app (at `~/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-web`). The client attempts to connect to the backend WebSocket server using this logic:

1. Check `NEXT_PUBLIC_TERMINAL_WS_PATH` env var (not set)
2. If port is standard (80/443), connect to `wss://hostname/ao-terminal-mux`
3. If port is non-standard, connect to `ws://hostname:14801/mux`

Since the browser accesses AO via `ao.zaoos.com` (HTTPS via Cloudflare Tunnel on port 443), it tries path 2: `wss://ao.zaoos.com/ao-terminal-mux`.

## WebSocket Infrastructure

Two WebSocket servers are running:

1. **Mux Server** (port 14801):
   - Node.js process: `pid=2513904`
   - Listens on `:14801`
   - Serves multiplexed terminal WebSocket connections
   - Uses `WebSocketServer` in "noServer" mode (doesn't handle upgrades directly)
   - Path: `/mux`

2. **Next.js App** (port 3000):
   - Serves frontend + static assets
   - No WebSocket path exposed (`/ao-terminal-mux` returns 404)

## Cloudflare + Caddy Routing

- `ao.zaoos.com` -> Cloudflare Tunnel -> `localhost:3002` (Caddy)
- Caddy `:3002` vhost (from `/home/zaal/caddy/Caddyfile`):
  - `@aoAssets` matcher: `/_next/*`, `/api/*`, `/sessions/*`, `/ws`, `/socket.io/*`, `/__next__/*`
  - Proxies to `localhost:3000` (Next.js)
  - Static files from `/home/zaal/caddy/ao/`

## The Missing Route

The Caddy config has:

```caddy
:3002 {
  import protected
  @aoAssets path /_next/* /api/* /sessions/* /ws /socket.io/* /__next/*
  reverse_proxy @aoAssets localhost:3000
  
  handle_path /app/* {
    reverse_proxy localhost:3000
  }
  handle_path /app {
    reverse_proxy localhost:3000
  }
  handle {
    root * /home/zaal/caddy/ao
    try_files {path} /index.html
    file_server
  }
}
```

Missing: `/ao-terminal-mux` is not in the `@aoAssets` matcher. When the browser requests `GET /ao-terminal-mux` (attempting the WebSocket upgrade), Caddy treats it as a static file request and serves `index.html` instead, blocking the WebSocket handshake.

## Proposed Fix

Add `/ao-terminal-mux*` to the `@aoAssets` matcher and proxy to port 14801:

```caddy
:3002 {
  import protected
  
  # WebSocket multiplexer for terminal connections
  @aoWebsocket path /ao-terminal-mux /ao-terminal-mux/*
  reverse_proxy @aoWebsocket localhost:14801
  
  # Existing AO assets
  @aoAssets path /_next/* /api/* /sessions/* /ws /socket.io/* /__next__/*
  reverse_proxy @aoAssets localhost:3000

  handle_path /app/* {
    reverse_proxy localhost:3000
  }
  handle_path /app {
    reverse_proxy localhost:3000
  }
  handle {
    root * /home/zaal/caddy/ao
    try_files {path} /index.html
    file_server
  }
}
```

## Why This Works

1. WebSocket upgrade requests to `/ao-terminal-mux` are caught by `@aoWebsocket` matcher
2. Caddy proxies them to `localhost:14801` (the direct terminal mux server)
3. The backend WebSocket server at port 14801 handles the `upgrade` event and establishes the multiplexed connection
4. Browser-side MuxProvider receives the "connected" state and stops showing the offline banner

## WebSocket Headers

Caddy automatically adds the required WebSocket upgrade headers when reverse-proxying:
- `Connection: upgrade`
- `Upgrade: websocket`

No additional Caddy directives needed (handled transparently).

## Testing

After applying the fix:

```bash
# Check the route is matched
curl -I http://localhost:3002/ao-terminal-mux

# Monitor Caddy logs (if verbose mode enabled)
journalctl -u caddy -f

# Browser: open https://ao.zaoos.com and check dev tools Network tab
# Look for WebSocket connection to wss://ao.zaoos.com/ao-terminal-mux
# Should show "101 Switching Protocols" (successful upgrade)
```

## Files Involved

- `/home/zaal/caddy/Caddyfile` - reverse proxy config (needs edit)
- Next.js app: `localhost:3000` - frontend + asset serving
- Terminal mux: `localhost:14801` - WebSocket multiplexer
- Cloudflare Tunnel config: `~/.cloudflared/config.yml` - already routes `ao.zaoos.com -> :3002`

## Status

Research complete. Ready for implementation (Caddy restart required).
