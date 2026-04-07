# ZOE Dashboard — zoe.zaoos.com Design Spec

> **Date:** 2026-04-06
> **Status:** Approved
> **Goal:** Personal chat-based command center at zoe.zaoos.com — talk to ZOE, see agent status, manage contacts, dispatch tasks

## Architecture

Single-page React app (Vite) served from OpenClaw container on port 5071. Cloudflare tunnel routes zoe.zaoos.com. Simple password auth (cookie-based). Supabase for data, OpenClaw gateway for agent dispatch.

## Layout

Desktop: chat left (60%), context panel right (40%). Mobile: chat full-width, context panel as bottom sheet tabs.

## Features

### Chat Interface
- Single input: free text → ZOE interprets, `/command` → direct action, `@agent` → route to agent
- Smart keyword routing: "status"/"what happened" → Supabase query, "dispatch"/"have X do" → OpenClaw spawn
- Rich response cards (agent status, contacts, events) with inline action buttons
- Quick reply chips below AI responses

### Agent Strip (above input)
- Horizontal scrollable row of 8 agent avatars with status dots
- Tap to route next message to that agent

### Context Chips (dynamic)
- 4 visible chips that change based on time/state
- Morning: Daily Brief, Ecosystem Pulse, Add Contact, What's Pending
- Default: Status, Dispatch, Rolodex, Research

### Slash Commands
- /status — squad overview
- /dispatch <agent> <task>
- /add <name> — quick rolodex add
- /brief — morning brief
- /events — today's events
- /find <query> — search contacts

### Context Panel (desktop) / Bottom Tabs (mobile)
- Feed: agent events from Supabase
- Agents: 8 cards with status
- Rolodex: contact search + add
- Updates based on chat context

### Auth
- Simple password gate, stored in cookie
- Password set via ZOE_DASHBOARD_PASSWORD env var
