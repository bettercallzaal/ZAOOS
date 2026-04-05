# UI Reference — CG / Commonwealth

> Source: [app.cg](https://app.cg) | [github.com/hicommonwealth/commonwealth](https://github.com/hicommonwealth/commonwealth)
> **Date:** 2026-01-25

## What CG Is

All-in-one web3 community platform replacing Discord + Discourse + Snapshot. Open source. Has discussions, governance, and **Discord-style chat channels**.

---

## UI Patterns to Borrow

### Two-Tier Sidebar
```
┌──────┬────────────┬──────────────────────────┐
│ Icon │ #general   │                          │
│ list │ #music     │   Message area           │
│      │ #dev       │                          │
│ ZAO  │ #announce  │   - avatar | name | time │
│ logo │            │     message text         │
│      │            │                          │
│      │            │   - avatar | name | time │
│ User │            │     message text         │
│ avtr │            ├──────────────────────────┤
│      │            │ [Type a message...]  [>] │
└──────┴────────────┴──────────────────────────┘
```

- **Far-left rail:** App icon, user avatar at bottom (like Discord server list)
- **Channel sidebar:** List of channels/rooms within the community
- **Main content:** Scrollable message feed + input bar at bottom

### For ZAO OS MVP (Single Room)

Simplified since we only have one channel:

```
┌──────────┬──────────────────────────────────┐
│          │                                  │
│  ZAO     │   Messages from /zao channel     │
│  Logo    │                                  │
│          │   [avatar] username    2:30 PM   │
│  #zao    │   yo check this track out        │
│  (active)│                                  │
│          │   [avatar] username    2:31 PM   │
│          │   fire 🔥                         │
│          │                                  │
│          │                                  │
│          │                                  │
│          │                                  │
│  ──────  │                                  │
│  [avatar]├──────────────────────────────────┤
│  @user   │ Message #zao...           [Send] │
└──────────┴──────────────────────────────────┘
```

---

## CG Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript |
| Styling | SCSS / CSS Modules |
| Backend | Node.js, Express |
| Database | PostgreSQL + Sequelize |
| Real-time | WebSockets |
| Auth | Wallet-based (MetaMask, etc.) |
| Monorepo | Yarn workspaces |

---

## Key Repo Paths (for reference)

```
github.com/hicommonwealth/commonwealth
├── packages/commonwealth/client/scripts/views/
│   ├── components/chat/         # Chat UI components
│   ├── components/sidebar/      # Sidebar navigation
│   └── pages/                   # Page layouts
├── packages/commonwealth/server/ # Express API
└── packages/commonwealth/shared/ # Shared types
```

---

## What We're Taking for ZAO OS

| CG Pattern | ZAO OS Adaptation |
|------------|-------------------|
| Two-tier sidebar | Simplified: logo + single channel + user avatar |
| Chat message list | Scrollable, newest at bottom, auto-scroll on new messages |
| Message component | Avatar + username + timestamp + text |
| Input bar | Fixed bottom, text input + send button |
| Dark theme | Navy `#0a1628` bg, gold `#f5a623` accents |
| Auth | SIWF instead of wallet connect (but same pattern) |

---

## Design Tokens for ZAO OS (Draft)

```css
:root {
  /* Background */
  --bg-primary: #0a1628;       /* Main background */
  --bg-secondary: #0f1f3d;    /* Sidebar background */
  --bg-tertiary: #162a50;     /* Hover states, cards */
  --bg-input: #1a2f54;        /* Input fields */

  /* Accent */
  --accent-primary: #f5a623;   /* Gold - buttons, links, active states */
  --accent-hover: #ffd700;     /* Bright gold - hover */
  --accent-muted: #c4841d;    /* Muted gold - less emphasis */

  /* Text */
  --text-primary: #ffffff;     /* Main text */
  --text-secondary: #8b9dc3;  /* Timestamps, metadata */
  --text-muted: #4a5f8a;      /* Placeholder text */

  /* Borders */
  --border: #1e3a5f;          /* Subtle borders */
  --border-active: #f5a623;   /* Active/focused borders */

  /* Status */
  --success: #2ecc71;
  --error: #e74c3c;
}
```

---

## Key Takeaways

- CG/Commonwealth is a solid reference for Discord-style web3 community UI
- Our MVP is simpler — one room, not multi-community
- Dark navy + gold theme will differentiate from CG's lighter design
- The sidebar + message list + input bar pattern is proven and familiar
- We DON'T need their complexity (governance, proposals, multi-chain) — just chat
