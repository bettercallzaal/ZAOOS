# Doc 289 — ZOE Dashboard: Chat-Based Command Center UX Patterns

**Date:** 2026-04-06
**Status:** Research Complete
**Tags:** ZOE, dashboard, chat UX, command center, mobile-first, agents, quick actions
**Related:** Doc 288 (Agent Squad Monitoring Dashboards)

---

## Purpose

Actionable UX patterns for zoe.zaoos.com — a mobile-first personal dashboard where Zaal chats with ZOE (the AI orchestrator) who manages 8 agents. This doc covers: command palette patterns, chat quick actions, mobile gestures, contextual suggestions, and multi-agent routing UI. Every pattern includes what to build.

---

## Part 1 — Command Palette Patterns (What to Steal)

### Raycast

- **Single hotkey activation** — Cmd+K opens everything. On mobile: a persistent floating action button (FAB) or pull-down gesture.
- **Favorites with hotkeys** — Cmd+1 through Cmd+9 for your most-used commands. ZOE equivalent: pin your top 9 actions as numbered quick-action chips.
- **AI mode toggle** — Hit Tab to switch from "search" to "ask AI." ZOE equivalent: the input always goes to ZOE, but a mode toggle could switch between "chat" (conversational) and "command" (slash commands that execute immediately).
- **Extensions as first-class** — Every action is a plugin. ZOE equivalent: each agent (ZOEY, WALLET, etc.) registers its own actions into the command palette.

### Superhuman

- **Cmd+K is the single source of truth** — every action lives here, including ones that don't have UI buttons. ZOE equivalent: `/` slash commands should be the exhaustive action list, with the chip bar showing only the top 6-8.
- **Shortcut learning** — when you use Cmd+K to find "archive," it shows you the shortcut (E) so you learn it. ZOE equivalent: when a user types a common request, ZOE could respond with "Done. Tip: you can also say `/status` for this."
- **Swipe gestures on mobile** — swipe right = archive, swipe left = snooze, L-gesture = open command. ZOE equivalent: swipe gestures on message bubbles for quick reactions (pin, forward to agent, mark as task).
- **Triage bar** — a persistent bar of the most common actions (archive, snooze, reply). ZOE equivalent: a persistent action bar above the chat input.

### Linear

- **Scoped search with prefixes** — `@` for people, `#` for projects, `:` for line numbers. ZOE equivalent: `@zoey` routes to ZOEY, `@wallet` routes to WALLET, `#contacts` searches contacts, `#events` searches events.
- **Contextual palette** — the palette shows different actions depending on what's selected. ZOE equivalent: quick action chips change based on the last message (see Part 5).

### Arc Max

- **Ask on Page** — query the current context. ZOE equivalent: when viewing an agent's output, a "Ask about this" action that scopes ZOE to that context.
- **Inline AI writing** — AI lives in the text field, not a separate panel. ZOE equivalent: the chat IS the interface. No separate dashboards or panels — everything flows through conversation.

### Notion AI

- **Multiple access points** — slash command, highlight text, sparkle icon, block menu. ZOE equivalent: provide 3 ways to trigger the same action: (1) type it, (2) tap a chip, (3) long-press a message for contextual actions.
- **Slash commands as first-class** — `/ai` triggers AI, other slashes trigger blocks. ZOE equivalent: `/` opens the command palette inline, showing all available slash commands grouped by agent.

---

## Part 2 — Personal AI Chat Interface Patterns

### Khoj (Most Relevant Competitor)

- **Persistent personal AI** — integrates with notes, docs, external knowledge. Not just Q&A but a "second brain."
- **Scheduled automations** — "Summarize Hacker News top 5 every morning at 8am" delivered to email. ZOE already does this with HEARTBEAT. Surface automation status in the chat: "Your 3 active automations ran today. 1 needs attention."
- **Mini chat (Khoj Mini)** — a quick-pull desktop module for fast answers. ZOE mobile equivalent: a notification-shade widget or lock-screen widget for quick ZOE queries.
- **Custom agents** — user-created agents with custom persona + knowledge + tools. ZOE equivalent: the 8 agents are pre-configured but users should see which agent is handling their request.

### AnythingLLM

- **Workspace-based** — different workspaces for different document collections. ZOE equivalent: conversation threads per domain (music, governance, contacts, agents).
- **Slash commands for text injection** — `/` injects pre-written prompts. ZOE equivalent: `/morning` injects the morning briefing prompt, `/standup` injects the standup format.
- **Thumbs up/down feedback** — on every response. ZOE should have this — it trains the system and gives Zaal a fast way to signal quality.
- **Voice input/output** — TTS built in. ZOE should support voice, especially on mobile.

### Msty

- **Flowchat visualization** — conversations rendered as flowcharts showing branching. ZOE equivalent: when a request fans out to multiple agents, show a mini flow diagram of which agents were invoked.
- **Parallel Multiverse Chats** — compare responses from different models side by side. ZOE equivalent: when ZOE routes to multiple agents, show their responses in parallel cards before synthesizing.
- **Switch models mid-chat** — zero lock-in. ZOE equivalent: switch which agent handles the thread with `@agent-name`.

### Open Interpreter

- **Code execution in chat** — run Python/JS directly from conversation. ZOE equivalent: agent task outputs (deploy results, API responses, cron logs) rendered inline as rich cards, not just text.

### assistant-ui (React Library — Build With This)

- **Ready-made components:** Thread, Composer, ActionBar, BranchPicker, AttachmentUI, SuggestedActions.
- **Slash commands** built in.
- **@-mentions** for tools in the composer — maps perfectly to `@agent-name` routing.
- **Message actions:** copy, edit, reload, speak, feedback (thumbs).
- **Generative UI** — tool outputs render as custom React components, not just text. This is critical for ZOE: agent status cards, contact cards, event cards should all be custom components.
- **React Native support** — same components work on mobile.

**Verdict: assistant-ui is the strongest candidate for ZOE's chat component library.**

---

## Part 3 — Mobile Chat UX Patterns (What to Steal)

### WhatsApp Quick Reply Buttons

- Up to 3 quick reply buttons below a message. When tapped, the button text is sent as a message.
- **Higher response rates** than free-text — WhatsApp confirmed this in testing.
- ZOE equivalent: after ZOE asks a clarifying question, show 2-3 tap-to-reply chips: "Yes, do it" / "Show me options" / "Cancel"

### Telegram Inline Buttons

- **Inline buttons below messages** — actions in context with the message (not floating above keyboard).
- **Keyboard overlay buttons** — a custom keyboard replaces the system keyboard for structured input.
- ZOE equivalent: after an agent report, inline buttons: "Approve" / "Edit" / "Forward to [agent]" / "Schedule follow-up"

### iMessage Patterns

- **Tapback reactions** — long-press any message for quick reactions (thumbs up, heart, etc.).
- **App drawer above keyboard** — a horizontal scrollable strip of app icons (camera, photos, stickers, etc.).
- ZOE equivalent: the app drawer becomes the **agent drawer** — horizontal strip of agent avatars above the keyboard. Tap to route next message to that agent.

### Material Design Chips (Google)

Four chip types map to ZOE actions:
1. **Assist chips** — "Get directions," "Call" — contextual next actions. ZOE: "Check agents" / "Morning brief"
2. **Filter chips** — narrow results. ZOE: "Show only ZOEY tasks" / "This week only"
3. **Input chips** — represent entered info (like tags). ZOE: selected contacts, events, agents as removable chips in the composer.
4. **Suggestion chips** — predicted next actions. ZOE: ML-driven suggestions based on time of day, recent conversation, and agent status.

### Mobile Input Patterns

- **Multiline expansion** — input grows vertically as you type. Essential.
- **Relevant keyboard** — show voice button prominently, URL keyboard for links, number pad for amounts.
- **Persistent action bar** — camera, voice, attachments always visible next to the input. ZOE: microphone, slash command trigger, agent selector always visible.

---

## Part 4 — The ZOE Quick Action Bar (What to Build)

Based on all patterns analyzed, here is the specific quick action bar design for ZOE:

### Layout: Above the Chat Input

```
┌─────────────────────────────────────┐
│  [message bubbles...]               │
│                                     │
├─────────────────────────────────────┤
│ ◀ 🟢ZOE  👩ZOEY  💰WALLET  ⚡QUICK ▶│  ← Agent strip (scroll)
├─────────────────────────────────────┤
│ [Status] [Tasks] [Contacts] [Events]│  ← Context chips (change)
├─────────────────────────────────────┤
│ [/] [🎤] Type a message...   [Send] │  ← Input bar
└─────────────────────────────────────┘
```

### Layer 1: Agent Strip (Persistent, Scrollable)

A horizontal scrollable row of agent avatars with status indicators:
- **ZOE** (green dot = active) — orchestrator, default route
- **ZOEY** (green dot) — content + social agent
- **WALLET** (green dot) — financial agent
- Other agents with status: idle (grey), working (pulse animation), error (red), sleeping (zzz)

Tap an agent to route your next message to them specifically. Long-press for agent details (last active, current task, recent output).

### Layer 2: Context Chips (Dynamic, Changes Based on State)

**Default state (morning):**
`[Morning Brief] [Agent Status] [Today's Tasks] [Check Calendar]`

**Default state (evening):**
`[Day Summary] [Tomorrow's Plan] [Agent Logs] [Wind Down]`

**After asking about contacts:**
`[Add Contact] [Search Contacts] [Send Message] [View Recent]`

**After asking about events:**
`[Create Event] [This Week] [Invite People] [Set Reminder]`

**After agent error:**
`[Retry] [Show Logs] [Switch Agent] [Escalate to ZOE]`

**After receiving a task list:**
`[Mark Done] [Delegate] [Reschedule] [Add Note]`

### Layer 3: Input Bar (Always Visible)

- **`/` button** — opens slash command palette (full-screen overlay on mobile)
- **Microphone** — voice input (hold to talk, release to send)
- **Text field** — auto-expands, supports `@agent` mentions and `#topic` tags
- **Send button** — changes to Stop when ZOE is generating

---

## Part 5 — Contextual Actions on Messages (What to Build)

### On ZOE's Messages (Long-Press / Swipe)

| Action | Gesture | What it does |
|--------|---------|--------------|
| Copy | Long-press → tap | Copy text to clipboard |
| Pin | Swipe right | Pin to a "Pinned" section at top of chat |
| Forward | Swipe right (further) | Send to a specific agent or thread |
| React | Long-press → tapback | Thumbs up/down (feeds quality signal) |
| Branch | Long-press → "Ask more" | Start a sub-thread on this message |
| Task | Long-press → "Make task" | Convert into a tracked task |
| Share | Long-press → share | Share via system share sheet |

### On Agent Status Cards (Inline Actions)

When an agent reports status, the card has inline buttons:
```
┌──────────────────────────────────┐
│ 🟢 ZOEY completed: Posted to FC  │
│ "New track drop from @zaalmusic" │
│                                  │
│ [View Post] [Edit] [Boost] [Undo]│
└──────────────────────────────────┘
```

### On Error Messages (Inline Recovery)

```
┌──────────────────────────────────┐
│ 🔴 WALLET failed: Gas too high   │
│ Estimated: 0.008 ETH ($22)       │
│                                  │
│ [Retry When Cheap] [Force] [Skip]│
└──────────────────────────────────┘
```

---

## Part 6 — Slash Command System (What to Build)

### Command Structure

All commands start with `/` and are grouped by domain:

```
/status              — Full squad status
/status zoey         — Single agent status
/morning             — Morning briefing
/tasks               — Today's task list
/tasks add [text]    — Create task
/contacts [name]     — Search contacts
/contacts add        — Start add-contact flow
/events              — This week's events
/events create       — Start event creation flow
/agents              — Agent fleet overview
/agents restart [x]  — Restart an agent
/cost                — Token cost summary
/logs [agent]        — Recent agent logs
/schedule [text]     — Create automation
/send [agent] [msg]  — Direct message to agent
/help                — Show all commands
```

### Command Palette UI (When `/` is Typed)

Full-screen overlay on mobile:
- Search bar at top (fuzzy matching)
- Grouped by category: Quick, Agents, Contacts, Events, Tasks, System
- Recent commands section at top
- Each command shows: icon, name, description, keyboard shortcut (desktop)
- Tap to execute, or continue typing to pass arguments

---

## Part 7 — The Split: "Ask a Question" vs "Do an Action"

This is the core UX tension in every AI command center. Here's how the best tools solve it, and what ZOE should do:

### Pattern: Intent Detection with Confirmation

| Tool | How It Works |
|------|-------------|
| **Superhuman** | Command palette = actions. Chat = questions. Separate modes. |
| **Raycast** | Tab toggles between search (find things) and AI (ask things). |
| **Notion** | `/` = structured commands. Free text = AI conversation. |
| **Arc** | Command bar = navigation. "Ask" = conversational. |
| **Linear** | Cmd+K = actions only. No chat mode. |

### ZOE's Approach: Unified Input, Smart Routing

ZOE should use a **single input** that handles both, with these rules:

1. **Starts with `/`** → Execute command immediately (action mode)
2. **Starts with `@agent`** → Route to specific agent (directed mode)
3. **Everything else** → ZOE interprets intent (conversational mode)
4. **Confirmation for destructive actions** → "I'll restart ZOEY. Confirm?" with [Yes] [No] chips

The key insight from Superhuman: **always show the shortcut after the conversational version.** When someone types "what are my agents doing?" ZOE responds with the status AND says "Tip: `/status` does this instantly."

---

## Part 8 — Rich Message Types (Cards to Build)

### Agent Status Card

```
┌─ Agent Status ─────────────────────┐
│ 🟢 ZOE    orchestrator   idle      │
│ 🟢 ZOEY   content        posting   │
│ 💤 WALLET  financial     sleeping  │
│ 🔴 CASTER  social        error     │
│                                    │
│ [Details] [Restart CASTER] [Logs]  │
└────────────────────────────────────┘
```

### Contact Card

```
┌─ Contact ──────────────────────────┐
│ 👤 Steve Peer                      │
│ Ellsworth drummer, ZAO Stock       │
│ Last contact: 3 days ago           │
│                                    │
│ [Message] [Call] [Add Note] [View] │
└────────────────────────────────────┘
```

### Event Card

```
┌─ Event ────────────────────────────┐
│ 📅 ZAO Stock                       │
│ Oct 3 2026, Franklin St Parklet    │
│ Budget: $5-25K | Status: Planning  │
│                                    │
│ [Edit] [Invite] [Tasks] [Share]    │
└────────────────────────────────────┘
```

### Task Card

```
┌─ Task ─────────────────────────────┐
│ ☐ Pitch Steve Peer for ZAO Stock   │
│ Due: Apr 15 | Agent: ZOEY          │
│ Priority: High                     │
│                                    │
│ [Done] [Snooze] [Delegate] [Edit]  │
└────────────────────────────────────┘
```

### Morning Brief Card

```
┌─ Morning Brief ────────────────────┐
│ Good morning, Zaal.               │
│                                    │
│ 🟢 7/8 agents active               │
│ 📋 3 tasks due today               │
│ 📅 1 event this week               │
│ 💰 $4.22 spent on agents yesterday │
│ 📨 2 messages need response        │
│                                    │
│ [Show Tasks] [Agent Detail] [Costs]│
└────────────────────────────────────┘
```

---

## Part 9 — Mobile Layout Specification

### Screen Structure

```
┌─────────────────────────────────┐
│ ← ZOE                    ⚙️ 🔔  │  ← Header: back, title, settings, notifications
├─────────────────────────────────┤
│                                 │
│  [pinned messages if any]       │
│                                 │
│  [conversation messages]        │
│  [scrollable, newest at bottom] │
│                                 │
│  [agent status cards]           │
│  [task cards]                   │
│  [contact cards]                │
│                                 │
├─────────────────────────────────┤
│ ◀ 🟢ZOE 👩ZOEY 💰WAL ⚡QCK ▶   │  ← Agent strip
├─────────────────────────────────┤
│ [Chip1] [Chip2] [Chip3] [Chip4] │  ← Context chips
├─────────────────────────────────┤
│ [/] [🎤] Message ZOE...  [Send] │  ← Input
└─────────────────────────────────┘
```

### Key Mobile Behaviors

1. **Keyboard open** — agent strip and context chips collapse to save space. Only input bar remains.
2. **Scroll up** — loads older messages. Header becomes translucent with blur.
3. **Pull down from top** — refresh agent status.
4. **Swipe from left edge** — back to conversation list (if multi-thread).
5. **Tap agent avatar** — routes next message. Double-tap opens agent detail sheet (bottom drawer).
6. **Long-press message** — contextual action menu (pin, forward, task, react).
7. **Haptic feedback** — subtle vibration on send, on agent response arrival, on error.

### Desktop Enhancements

- Sidebar with conversation threads list
- Cmd+K command palette overlay
- Keyboard shortcuts for all actions
- Agent strip becomes a persistent sidebar panel
- Split view: chat left, agent details/cards right

---

## Part 10 — Implementation Recommendations

### Build Order (Priority)

1. **Chat input with `/` command support** — the core interaction
2. **Agent strip** — visual agent routing
3. **Context chips** — dynamic quick actions
4. **Rich message cards** — agent status, tasks, contacts, events
5. **Slash command palette** — full-screen overlay
6. **Message actions** — long-press, swipe, reactions
7. **Voice input** — microphone button
8. **Automations UI** — scheduled task management
9. **Desktop enhancements** — Cmd+K, sidebar, split view

### Tech Stack Recommendation

| Layer | Tool | Why |
|-------|------|-----|
| Chat components | **assistant-ui** | React + React Native, slash commands, @mentions, generative UI, message actions built in |
| Styling | Tailwind CSS v4 | Already in ZAO OS |
| State | React Query + Context | Already in ZAO OS |
| Real-time | WebSocket or SSE | Agent status updates, message streaming |
| Mobile | React Native (Expo) or PWA | assistant-ui supports both |
| Command palette | cmdk (pacocoursey) | The standard Cmd+K library, works with assistant-ui |
| Rich cards | Custom components | Register via assistant-ui's generative UI system |

### Key Patterns to Implement First

1. **Unified input with smart routing** — single text field, `/` for commands, `@` for agents, free text for conversation
2. **Dynamic context chips** — time-of-day defaults + conversation-aware suggestions
3. **Agent status indicators** — real-time dots showing agent state
4. **Inline action buttons on cards** — every rich card has contextual actions
5. **Confirmation for destructive actions** — chip-based confirm/cancel

---

## Sources

- [Superhuman: How to Build a Remarkable Command Palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
- [Maggie Appleton: Command K Bars](https://maggieappleton.com/command-bar)
- [Destiner: Designing a Command Palette](https://destiner.io/blog/post/designing-a-command-palette/)
- [UX Patterns: AI Chat Interface Pattern](https://uxpatterns.dev/patterns/ai-intelligence/ai-chat)
- [GroovyWeb: UI/UX Design Trends for AI-First Apps 2026](https://www.groovyweb.co/blog/ui-ux-design-trends-ai-apps-2026)
- [assistant-ui React Library](https://www.assistant-ui.com/)
- [CopilotKit Agentic Chat UI](https://docs.copilotkit.ai/agentic-chat-ui)
- [Khoj AI Features](https://docs.khoj.dev/category/features/)
- [AnythingLLM Chat UI](https://docs.useanything.com/chat-ui)
- [Msty AI](https://msty.ai/)
- [Material Design 3: Chips](https://m3.material.io/components/chips/guidelines)
- [CometChat: Chat App Design Best Practices](https://www.cometchat.com/blog/chat-app-design-best-practices)
- [Raycast AI](https://www.raycast.com/core-features/ai)
- [Arc Max](https://arc.net/max)
- [Notion Slash Commands](https://www.notion.com/help/guides/using-slash-commands)
- [Linear Shortcuts](https://shortcuts.design/tools/toolspage-linear/)
- [Vercel Chatbot: SuggestedActions Component](https://github.com/vercel/chatbot/blob/main/components/chat/suggested-actions.tsx)
- [WhatsApp Interactive Buttons](https://www.infobip.com/blog/how-to-use-whatsapp-interactive-buttons)
- [Superhuman Swipes & Triage Bar](https://help.superhuman.com/hc/en-us/articles/38458431506067)
- [AWS Multi-Agent Orchestrator UI](https://deepwiki.com/aws-solutions-library-samples/guidance-for-multi-agent-orchestration-agent-squad-on-aws/5-frontend-(react-astro-ui))
- [The Orchestrator Pattern](https://dev.to/akshaygupta1996/the-orchestrator-pattern-routing-conversations-to-specialized-ai-agents-33h8)
- [Medium: Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)
- [Mobbin: Command Palette UI Design](https://mobbin.com/glossary/command-palette)
