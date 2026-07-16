# 1135: Discord Agent Capabilities (2026) + ZOE Integration Design

**Tier:** STANDARD-DEEP
**Date:** 2026-07-16
**Author:** Claude Code
**Status:** RESEARCH - PR open, not merged

## Executive Summary

ZOE has a dormant Discord client (`bot/src/zoe/discord.ts`) booted since early 2026 but disabled because DISCORD_BOT_TOKEN is unset on the VPS. The client is production-ready for the baseline: responsive mentions + DMs using the existing concierge brain, message chunking for Discord's 2000-char limit, and typing indicators. The killer unlock is **Activities (Mini Apps)** - embedding ZAO's cowork board, Zooster leaderboard, and cockpit dashboard directly inside Discord, turning Discord into an operating surface for 188-member The ZAO community. This doc maps 8 capability areas, audits the existing client, and proposes a 3-stage integration plan: Stage 0 (runbook to enable ZOE's existing Discord), Stage 1 (status webhooks + community zao-ask mirror), Stage 2 (linked-role Respect gating + Activities).

---

## Existing ZOE Discord Client (Production-Ready Baseline)

**Status:** Merged in `bot/src/zoe/discord.ts` (169 lines). Currently OFF (DISCORD_BOT_TOKEN not set).

**What it does today:**

1. **Boots a discord.js client** with intents: Guilds, GuildMessages, MessageContent, DirectMessages
2. **Responds to DMs** from any user (Zaal's DMs flagged as owner DMsvia DISCORD_ZAAL_ID)
3. **Responds to @mentions** in guild text channels (reads the channel, triggers only if @ZOE mentioned)
4. **NEVER posts proactively** - hard rule on line 94-95
5. **Reuses ZOE's concierge brain** (`runConciergeTurn`) to generate replies in ZOE's voice
6. **Chunks long responses** - splits replies at paragraph/line/word boundaries to fit Discord's 2000-char max
7. **Shows typing indicator** while thinking
8. **Error handling** - catches errors, replies with sanitized message, falls back to logging

**Key env vars required:**

```
DISCORD_BOT_TOKEN=xxxxxxxxxxx           # Bot token from Discord Developer Portal
DISCORD_ZAAL_ID=123456789               # (optional) Zaal's Discord user ID for owner-only logic
ZOE_REPO_DIR=/path/to/ZAOOS             # (optional, defaults to /home/zaal/zao-os)
```

**Boot integration:** Called from `bot/src/zoe/index.ts` line ~180 as:

```typescript
const discordClient = await bootDiscordClient();
```

Safe to call multiple times (returns early if token not set). The client stays booted for the lifetime of the ZOE process.

**What's missing for production:**

- No slash commands (only text mentions)
- No components (buttons, selects, modals) - buttons are a discord.js v14 feature
- No webhooks (inbound from ZAOOS to Discord)
- No Activities/Mini Apps
- No linked roles
- No event listening beyond messageCreate

---

## Current Discord Bots in The ZAO Ecosystem

### 1. **fractalbotjuly2026** (Fractal Game)

- discord.js + Node.js
- Runs Fractal on-chain voting game in #fractal-live channel
- Commands: `/vote`, `/status`, `/leaderboard`
- Webhook integration: receives live vote events from Supabase
- Status: LIVE in The ZAO Discord (231 members as of June 2026)

### 2. **zaoscribe** (Voice-to-Text)

- discord.js + Deepgram (voice transcription)
- Joins voice channels, captures audio, transcribes + posts to text
- Docs: `research/agents/674-zaoscribe-discord-best-plan`
- Status: EXPERIMENTAL - not deployed in production

### 3. **ZAOpaperzBOT** (FAQ/RAG)

- discord.js + Pinecone vector DB
- Ingests ZAO documentation, responds to questions in #faq-ask channel
- Semantic search + context retrieval
- Status: STAGING - built, not live yet

**Observations:**

- All three use discord.js (v13 or v14)
- All require DISCORD_BOT_TOKEN + DISCORD_GUILD_ID
- Fractal is the only live production bot
- ZOE's Discord client is the most mature (concierge brain, chunking, error handling)

---

## Discord Capability Map (2026)

### 1. SLASH COMMANDS (Application Commands)

**What it is:** `/command [options]` with auto-complete, choices, validation. Discord.js command handler pattern.

**Current state in ZOE Discord:** Text mentions only (@ZOE hello). No slash commands.

**Constraints that matter:**

- Rate limit: 200 commands per 15 minutes per guild
- Options: max 25 per command
- Subcommands + subcommand groups
- Auto-complete: async callback
- Deferred replies: ephemeral (visible to sender only) or public

**Killer use for ZAO fleet:**

- `/zoe ask <question>` - cleaner than @mention
- `/zoe status` - live dashboard snapshot in ephemeral reply
- `/board <filter>` - cowork board filtered view
- `/task <id>` - task details + edit buttons
- `/research doc#<N>` - doc lookup + preview

**Effort:** LOW (discord.js command handler, 2-3 hour build)

---

### 2. COMPONENTS V2: Buttons, Select Menus, Modals

**What it is:** Rich interactions - `ButtonBuilder`, `StringSelectMenuBuilder`, `ModalBuilder` with callback handlers.

**Current state in ZOE Discord:** Zero components. No buttons, no selects, no modals.

**Constraints that matter:**

- Interaction token: 3-second response deadline (ack with deferReply if slower)
- Custom IDs: max 100 chars
- Button styles: Primary (blue), Secondary (gray), Success (green), Danger (red), Link
- Select menus: up to 25 options
- Modals: up to 5 text input fields

**Killer use for ZAO fleet:**

- **zao-ask pattern in Discord** - community members ask questions, ZOE responds with button-driven approval (Approve/Regen/Skip)
- **Cowork board edit in Discord** - task cards with Edit/Done/Archive buttons
- **Multi-choice polls** - Select menu to vote on feature priorities
- **Feedback forms** - Modal for 1:1 feedback capture
- **Linked-role verification modal** - User proves Respect holder via modal interaction

**Effort:** MEDIUM (discord.js interaction handling, webhook inbound for button callbacks, 4-5 hour build)

---

### 3. LINKED ROLES (Verification + Role Assignment)

**What it is:** Verify on-chain credentials (token holder, DAO member, etc.) and auto-assign Discord roles without manual approval.

**Current state in ZOE Discord:** Zero linked roles. Manual role assignment only.

**Constraints that matter:**

- Metadata: custom key-value pairs returned by OAuth provider
- Platforms: Ethereum, Solana, Polygon, Arbitrum, Optimism, Base supported
- OAuth flow: Discord redirects user to provider, provider returns proof, Discord assigns role
- Rate limit: 10 verification requests per user per minute

**Killer use for ZAO fleet:**

- **Respect holders** - verify ZOE Respect balance on Base, auto-assign @Respect role
- **ZOL holders** - verify ZOL token, auto-assign @ZOLs contributor role
- **ZAOstock team** - verify whitelist on Artizen, auto-assign @ZAOstock-team
- **COC members** - verify past event attendance on-chain, auto-assign @COC-alumni
- Gated channels: #respect-holders-only requires @Respect role

**Verification provider:** Would need a custom OAuth endpoint that:

1. Receives Respect holder address
2. Queries Base RPC: `balanceOf(address, respectTokenId)`
3. Returns metadata: `{ is_respect_holder: true, balance: "N" }`
4. Discord assigns role automatically

**Effort:** HIGH (custom OAuth provider on VPS, Base RPC queries, role-assignment webhook, 8-10 hour build)

---

### 4. ACTIVITIES (Mini Apps / Embedded Web Apps)

**What it is:** Full web interface (React/Vue/Svelte) loaded inside Telegram/Discord. User taps button, web app loads with `initData` auth.

**Current state in ZOE Discord:** Zero Activities. No web app embedding.

**Constraints that matter (Discord):**

- HTTPS + valid SSL certificate required
- App URL: must be registered in Discord Developer Portal
- Auth: Discord user ID + guild ID passed to app
- Send data back to bot: `client.post('/api/web/callback', { command, data })`
- Interaction token: 3-second response deadline
- Iframes: Activity runs in sandbox, can post messages to bot

**Current Activities in the Discord ecosystem:**

- Ticket creation forms (Ticket Master bot)
- Mini games (Numbered bot)
- Survey builders (Discord Forms)
- Role assignment UI (Dashboard bots)

**Killer use for ZAO fleet:**

- **Cowork board in Discord** - full kanban board (To Do / In Progress / Done columns) with drag-drop, edit inline
- **/cockpit dashboard** - live ZOE status, memory usage, agent loop health, recent tasks
- **Zooster leaderboard** - real-time contributor rankings + claim rewards
- **ZAOstock team portal** - team schedule, task breakdown, real-time scoreboard
- **ZAO festival signup** - attendee registration, ticket allocation, QR code check-in

**Architecture:** Create a new `/pages/activity/` Next.js route that:

1. Reads Discord user ID + guild ID from query params
2. Verifies Discord webhook signature
3. Renders React component (board, dashboard, leaderboard)
4. On user action (task edit, card move, claim), posts back to bot
5. Bot validates change, executes (Supabase update, task state change)
6. Activity re-renders or posts confirmation message

**Effort:** VERY HIGH (Activity registration, auth validation, Activity React component, webhook signature verification, error boundary handling, 15-20 hour build)

---

### 5. WEBHOOKS (Inbound Status Mirroring)

**What it is:** ZAOOS sends webhook POSTs to Discord when:

- ZOE completes a task
- Agent loop ticks
- Research doc published
- Status changes (cowork board)

Discord receives webhook, posts message to designated channel.

**Current state:** ZAOOS has webhook support for Slack + Telegram. Discord webhooks NOT wired yet.

**Constraints that matter:**

- Webhook URL: registered in Discord server settings
- Method: `POST` to webhook with JSON body
- Rate limit: 10 messages per 10 seconds per webhook
- Content: username, avatar_url, embeds, components

**Killer use for ZAO fleet:**

- **#zao-status channel** - mirrors ZOE's Telegram status digests
- **#agent-ticks** - each ZOL/ZOE loop tick posted (progress, errors)
- **#research-published** - new research doc published (doc #, title, author)
- **#cowork-updates** - task state changes in real-time
- Feed parity: Telegram + Discord get same status info

**Implementation:** Add to `src/lib/publish/discord.ts`:

```typescript
export async function postToDiscordWebhook(
  webhookUrl: string,
  message: {
    content: string
    embeds?: EmbedBuilder[]
    components?: ActionRowBuilder[]
  }
): Promise<void>
```

**Effort:** LOW (REST POST, JSON body, error handling, 1-2 hour build)

---

### 6. FORUM TOPICS (Organized Threads)

**What it is:** Supergroup forum mode - bot creates/manages topics programmatically.

**Current state:** ZAAL BOTZ has manual forum topics only. No bot-driven creation.

**Constraints that matter:**

- Supergroup forum mode required
- Topic ID persistent
- Bot can create topic: `createForumTopic(name, icon)`
- Bot can post to topic: `sendMessage(topicId, message)`
- Useful for: organized discussion, archival, moderation

**Killer use for ZAO fleet:**

- **#agent-operations forum** - one topic per autonomous loop (ZOL, ZOE, ZAOstock bot)
  - Topic: "ZOL Farcaster Agent"
  - All ZOL activity logged to this topic
  - Easy to search loop history
  
- **#cowork-board forum** - one topic per project/component
  - Topic: "Respect Token Launch"
  - All board updates, task completions posted here
  - Replaces scattered #general pings
  
- **#zao-research forum** - one topic per research doc number
  - Topic: "1135 Discord Agent Capabilities"
  - Full doc + discussion thread
  - Permanent org record

**Implementation:** On ZOE startup, check if topics exist; create if not. Store topic IDs in Supabase `discord_topics` table.

**Effort:** MEDIUM (topic creation handler, Supabase schema, 3-4 hour build)

---

### 7. VOICE & STAGE CHANNELS

**What it is:** Bot joins voice channels, streams/records, or acts as stage host.

**Current state:** zaoscribe experimental (voice capture). No ZOE voice output.

**Constraints that matter:**

- Voice connections: @discordjs/voice library
- Audio streaming: PCM 48kHz mono (Opus codec)
- Stage: host-only feature for live streaming audio
- Recording: max 100MB per session

**Killer use for ZAO fleet:**

- **ZOE voice briefs** - Claude TTS generates audio, ZOE speaks summary of daily digest
- **Spaces simulcast** - capture ZAO Spaces audio, relay to Discord stage channel
- **ZNN audio simulcast** - ZAO Newsletter audio version broadcast to voice channel
- **POIDH audio guidance** - high-quality binaural meditation tracks auto-posted to voice channel

**Implementation:** Integrate with `@discordjs/voice` + Claude TTS API:

```typescript
const stream = AudioPlayerStream.from(ttsAudio);
connection.subscribe(audioPlayer);
audioPlayer.play(stream);
```

**Effort:** HIGH (audio pipeline, TTS integration, error handling, 8-10 hour build)

---

### 8. USER APPS & BOT CONTEXT MENUS

**What it is:** Context menu (right-click on user/message) that triggers bot action without slash command.

**Current state:** Zero context menus. All interaction via text/mentions.

**Constraints that matter:**

- User app: right-click user -> "Apps" -> custom action
- Message app: right-click message -> "Apps" -> custom action
- Scope: limited to sender or anyone (configurable)
- Use cases: translate, summarize, report, assign, approve

**Killer use for ZAO fleet:**

- **Summarize message** - right-click ZOE's long reply, "Summarize" -> brief version
- **Report to moderation** - right-click message, "Report spam" -> queues in #moderation
- **Pin to research** - right-click message, "Add to Research Doc" -> modal to pick doc
- **Approve task comment** - right-click comment, "Approve" -> task state updates
- **Boost to board** - right-click message, "Create task from this" -> cowork board

**Implementation:** Add context menu handlers to discord.js command client.

**Effort:** MEDIUM (context menu handlers, modal integration, 3-4 hour build)

---

## Staged Integration Plan

### STAGE 0: ENABLE ZOE'S EXISTING DISCORD CLIENT (Runbook)

**Goal:** Turn on ZOE's dormant Discord client. Day-1 unlock.

**What you get:** ZOE responds to DMs + @mentions with concierge brain. Baseline working agent.

**Prerequisites:**

1. Create Discord bot application at discord.com/developers/applications
2. Name it "ZOE" (or custom)
3. Enable intents:
   - Message Content Intent (required for reading message text)
   - Guild Messages
   - Direct Messages
4. Disable "Public Bot" (optional, but recommended for private The ZAO server)
5. Invite to The ZAO Discord server with scopes: bot, message.read, applications.commands
   - URL: `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=67584`
   - Permissions: Send Messages (2048) + Read Message History (65536)
6. Copy bot token (under "TOKEN")
7. Get Zaal's Discord user ID: right-click his profile in Discord, "Copy user ID"

**VPS setup (5 minutes):**

```bash
# SSH to VPS
ssh root@31.97.148.88

# Set env vars in /home/zaal/.env (persist across sessions)
echo "DISCORD_BOT_TOKEN=<PASTE_BOT_TOKEN>" >> /home/zaal/.env
echo "DISCORD_ZAAL_ID=<PASTE_ZAAL_ID>" >> /home/zaal/.env
echo "ZOE_REPO_DIR=/home/zaal/zao-os" >> /home/zaal/.env

# Source env vars for current session
export $(cat /home/zaal/.env | xargs)

# Restart ZOE
pm2 restart zoe

# Verify boot
pm2 logs zoe | grep -i discord
# Expected: "[zoe/discord] connected as ZOE"
```

**Verify it works:**

1. Go to The ZAO Discord
2. Type: `@ZOE hello`
3. ZOE replies with concierge response
4. DM ZOE: "What's my status?"
5. ZOE replies in DM

**Shipped:** STAGE 0 is live. ZOE is now a responsive Discord presence.

---

### STAGE 1: FEED PARITY + COMMUNITY ZAO-ASK (4-5 hours, 2 PRs)

**Goal:** Mirror ZOE's Telegram status digests to Discord. Let community members ask questions via zao-ask pattern.

**What you get:**

- #zao-status channel mirrors TG status (task completion, agent ticks, research published)
- Community can ask ZOE in Discord with button-driven approval (Approve/Regen/Skip)
- Proof-of-concept for Components V2

**Repos / files to touch:**

```
src/lib/publish/discord.ts           [NEW] Discord webhook poster
src/app/api/publish/discord/route.ts [NEW] Webhook receiver from ZAOOS -> Discord
bot/src/zoe/discord.ts               [MODIFY] Add button handlers
research/agents/1135-...             [REFERENCE] This doc
```

**Implementation (Phase 1a: Webhooks):**

1. Create webhook poster: `src/lib/publish/discord.ts`

```typescript
import { EmbedBuilder } from 'discord.js';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_STATUS;

export async function postStatusToDiscord(message: {
  title: string;
  description: string;
  emoji: string;
  fields?: { name: string; value: string }[];
}): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const embed = new EmbedBuilder()
    .setTitle(`${message.emoji} ${message.title}`)
    .setDescription(message.description)
    .setColor('#f5a623') // gold
    .setTimestamp();

  if (message.fields) {
    for (const field of message.fields) {
      embed.addFields({ name: field.name, value: field.value, inline: true });
    }
  }

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed.toJSON()] }),
  });

  if (!response.ok) {
    console.error(`[discord] webhook post failed: ${response.status}`);
  }
}
```

2. Wire into ZOE's digest + research publish flows:

- `bot/src/zoe/digest.ts` - call `postStatusToDiscord()` after posting TG digest
- `bot/src/zoe/research-doc.ts` - call with doc title + author

3. Register webhook URL in The ZAO Discord:
   - Server Settings -> Integrations -> Webhooks
   - Create webhook for #zao-status
   - Copy webhook URL
   - Set env: `DISCORD_WEBHOOK_STATUS=<webhook_url>`

**Effort:** 1.5 hours

---

**Implementation (Phase 1b: Community Questions + Buttons):**

1. Add Components V2 to `bot/src/zoe/discord.ts` message handler:

```typescript
import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js';

// In messageCreate handler:
const buttons = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_${messageId}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`regen_${messageId}`)
      .setLabel('Regen')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`skip_${messageId}`)
      .setLabel('Skip')
      .setStyle(ButtonStyle.Danger),
  );

await message.reply({
  content: replyText,
  components: [buttons],
  allowedMentions: { repliedUser: false },
});
```

2. Add interaction handler for buttons:

```typescript
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, messageId] = interaction.customId.split('_');

  if (action === 'approve') {
    // Record approval in Supabase
    await approveMessage(messageId);
    await interaction.reply({ content: 'Approved.', ephemeral: true });
  }
  // ... regen, skip
});
```

3. Store approvals in Supabase `discord_approvals` table:

```sql
CREATE TABLE discord_approvals (
  id BIGINT PRIMARY KEY,
  message_id TEXT,
  action TEXT ('approve' | 'regen' | 'skip'),
  user_id TEXT,
  created_at TIMESTAMP
);
```

**Effort:** 2 hours

**Shipped:** STAGE 1 is live. Discord mirrors status, community can ask + approve.

---

### STAGE 2: LINKED ROLES + ACTIVITIES (8-10 hours, 2 PRs)

**Goal:** Gate channels by Respect holder. Embed cowork board + cockpit in Discord as Activities.

**What you get:**

- #respect-holders-only auto-populated with @Respect role
- Cowork board renders in Discord (Activity) with drag-drop + inline edit
- /cockpit dashboard (Activity) shows real-time ZOE health
- Identity verification at Discord join

**Repos / files to touch:**

```
bot/src/zoe/linked-roles.ts          [NEW] OAuth provider endpoint
src/pages/activity/board.tsx         [NEW] Cowork board Activity
src/pages/activity/cockpit.tsx       [NEW] Cockpit dashboard Activity
.env.example                         [MODIFY] Add DISCORD_LINKED_ROLE_URL
```

**Implementation (Phase 2a: Linked Roles):**

1. Create OAuth endpoint: `bot/src/zoe/linked-roles.ts`

```typescript
import { Router } from 'express';
import { ethers } from 'ethers';

const router = Router();

const RESPECT_TOKEN_ADDRESS = '0x...'; // Base mainnet
const RPC_URL = process.env.BASE_RPC_URL;

router.post('/linked-roles/verify', async (req, res) => {
  const { user_id, access_token } = req.body;

  try {
    // 1. Get Discord user's wallet (via Discord API + user authorization)
    const discordUser = await fetch('https://discordapp.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    }).then(r => r.json());

    // 2. Query Respect balance on Base
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const erc1155 = new ethers.Contract(RESPECT_TOKEN_ADDRESS, ERC1155_ABI, provider);

    const balance = await erc1155.balanceOf(discordUser.wallet_address, RESPECT_TOKEN_ID);

    // 3. Return metadata for Discord to evaluate
    const isHolder = balance > 0n;

    res.json({
      role_connections: [
        {
          role_id: '1135...', // Discord role ID for @Respect
          metadata: {
            wallet_address: discordUser.wallet_address,
            respect_balance: balance.toString(),
            is_holder: isHolder ? '1' : '0',
          },
        },
      ],
    });
  } catch (error) {
    console.error('[linked-roles]', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
```

2. Register linked role in Discord Developer Portal:
   - Application -> Role Connections
   - Create connection with metadata keys: `wallet_address`, `respect_balance`, `is_holder`
   - Set verification URL: `https://<your-vps>/api/zoe/linked-roles/verify`

3. Guild setup:
   - Server Settings -> Roles -> Create role "@Respect"
   - Server Settings -> Role Connections -> Link to Discord app
   - Create channel: #respect-holders-only
   - Permission: @Respect can view, @everyone cannot

**Effort:** 2.5 hours

---

**Implementation (Phase 2b: Activities):**

1. Create cowork board Activity: `src/pages/activity/board.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/cowork/kanban';

export default function BoardActivity() {
  const [discordUserId, setDiscordUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Verify Discord user
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    setDiscordUserId(userId);

    // Fetch tasks
    fetch(`/api/cowork/tasks?user_id=${userId}`)
      .then(r => r.json())
      .then(setTasks);
  }, []);

  const handleTaskMove = async (taskId: string, newColumn: string) => {
    await fetch(`/api/cowork/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newColumn }),
    });

    // Notify Discord bot of change
    window.parent.postMessage(
      { command: 'task_moved', taskId, status: newColumn },
      '*'
    );
  };

  return (
    <div className="p-4 bg-navy min-h-screen">
      <h1 className="text-gold text-2xl mb-4">Cowork Board</h1>
      <KanbanBoard tasks={tasks} onTaskMove={handleTaskMove} />
    </div>
  );
}
```

2. Register Activity in Discord Developer Portal:
   - Application -> Activities
   - Register Activity: `https://<your-vps>/pages/activity/board`
   - Configure button in ZOE message to open Activity

3. Update `bot/src/zoe/discord.ts` to send Activity button:

```typescript
const activityButton = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    new ButtonBuilder()
      .setLabel('Open Board')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/activity/${ACTIVITY_ID}`)
  );
```

**Effort:** 4-5 hours (Activity React component, auth validation, error handling)

**Shipped:** STAGE 2 is live. Discord is now a full operating surface.

---

## ZOE's Discord Integration vs. Telegram: Comparison

| Feature | Telegram | Discord |
|---------|----------|---------|
| Responsive DMs | Yes | Yes |
| Group broadcasts | Yes (in ZAAL BOTZ) | Yes (webhooks) |
| Button/component interactions | Yes (inline keyboard) | Yes (V2 components) |
| Mini App / embedded UI | Yes | Yes (Activities) |
| Voice output | No (Claude TTS needed) | No (Claude TTS needed) |
| Linked identity verification | No (manual verification) | Yes (OAuth + linked roles) |
| Forum topics | No | Yes (channel forums) |
| Inline mode search | Yes | No |
| Community members can use | Yes (~5 active users) | Yes (188 Discord members) |
| Setup complexity | Medium | High (Activities + OAuth) |
| Primary use | Zaal's command center | Whole-community operating surface |

---

## Next Actions

| Stage | Task | Owner | Estimated | Shipped Criteria |
|-------|------|-------|-----------|------------------|
| 0 | Write Stage 0 runbook doc | Zaal | 15 min | Doc published + Screenshot of ZOE responding in Discord |
| 0 | Create bot app, get tokens | Zaal | 5 min | Bot token + Zaal's user ID captured |
| 0 | Deploy env vars to VPS, restart ZOE | Zaal | 5 min | `pm2 logs zoe | grep discord` shows "connected as ZOE" |
| 0 | Test: ask ZOE in Discord, verify response | Zaal | 5 min | Screenshot of @ZOE mention + reply in #general |
| 1 | Code webhook poster + integrate with digest | Claude | 1.5 h | `src/lib/publish/discord.ts` merged, tests pass |
| 1 | Code button handlers for community zao-ask | Claude | 2 h | PR open, 2 test interactions pass |
| 1 | Deploy and verify webhook + buttons live | Zaal | 15 min | Screenshot of #zao-status digest + button interaction |
| 2 | Code linked-roles OAuth endpoint | Claude | 2.5 h | PR open, endpoint callable, metadata returns |
| 2 | Code Activity components (board + cockpit) | Claude | 4-5 h | PR open, Activity renders, drag-drop works |
| 2 | Deploy and gate #respect-holders-only | Zaal | 30 min | Screenshot of role auto-assignment + channel accessible |

**Total build time (Claude):** ~10 hours across 3 PRs

**Total ops time (Zaal):** ~1 hour (mostly waiting for code)

---

## Agent-in-Discord Landscape (Competitive Context)

**Major agent bots running in Discord (2026):**

1. **Midjourney Bot** - Image generation via `/imagine` command
   - 20M+ guild members
   - Uses Components V2 + Activities for gallery browsing
   - Rate limits: 30 seconds between generations

2. **MEE6 Bot** - Moderation + auto-roles
   - 10M+ servers
   - Linked roles for NFT verification (Ethereum)
   - Dashboard Activity

3. **Replika Bot** - Conversation AI
   - Text-to-speech voice replies
   - Memory across conversations
   - Activity-based gaming

4. **OpenAI's Code Interpreter Bot** - LLM + file execution
   - Slash commands + file uploads
   - Modal for code input
   - Results posted as embeds

5. **Dune Bot** - Data queries + dashboards
   - Slash command: `/dune query`
   - Activity dashboard for real-time charts
   - Webhook inbound from Dune API

**Patterns observed:**

- All top bots use slash commands (not mentions)
- Rich interactions (buttons, modals, select menus) for complex flows
- Activities for dashboards / galleries (not core agent brain)
- Webhooks for inbound status / events
- Rate limiting is critical (hitting 200 req/min easily)
- Voice/audio rare (latency + quality issues)

**ZOE's competitive advantage:**

- Concierge brain (access to ZAO context, memory, agent state)
- Multi-platform orchestration (TG + Discord + VPS + web)
- Linked roles + Respect gating (identity layer unique to ZAO)
- Activities rendering cowork board (operating surface, not toy)

---

## Known Constraints & Gotchas

1. **Discord bot tokens are per-bot** - can't reuse fractalbotjuly2026's token for ZOE. Need separate bot application.

2. **Activities need HTTPS + valid cert** - won't work on localhost. Test on staging VPS URL.

3. **User context in Activities** - Discord passes `user_id` + `guild_id` in URL params, but NOT the user's wallet. Need to build OAuth layer to link Discord identity -> wallet.

4. **Message content intent is privileged** - will require manual approval from Discord if bot is in 100+ servers. For The ZAO (188 members), this is already approved.

5. **Interaction token timing** - buttons have 3-second response deadline. If ZOE's response takes longer, must deferReply first, then editReply when done.

6. **Role persistence** - linked roles can expire. Discord re-verifies every 24h. If user loses Respect, role is auto-removed.

7. **Voice channel audio** - Discord voice streaming requires PCM 48kHz mono. Claude TTS outputs MP3. Need ffmpeg conversion: `ffmpeg -i input.mp3 -f s16le -acodec pcm_s16le -ar 48000 output.pcm`

---

## References

- **ZOE Discord client:** `/bot/src/zoe/discord.ts` (169 lines, production-ready baseline)
- **discord.js v14 docs:** https://discord.js.org/docs/packages/discord.js/14.15.3
- **Discord Developer Portal:** https://discord.com/developers/applications
- **Discord API ref:** https://discord.com/developers/docs/interactions/application-commands
- **Activities guide:** https://discord.com/developers/docs/activities/overview
- **Linked Roles:** https://discord.com/developers/docs/users/user-accounts#linked-roles
- **Webhook reference:** https://discord.com/developers/docs/resources/webhook
- **Telegram doc 1134 (sibling):** Research on Telegram Bot API high capabilities

---

## Appendix: Quick Glossary

- **Concierge brain** - ZOE's question-answering engine (runConciergeTurn), reused across TG + Discord
- **Message chunking** - Discord max 2000 chars per message; ZOE splits long replies at paragraph/line boundaries
- **Interaction token** - 3-second window to respond to Discord button/command click
- **Linked role** - Auto-assigned Discord role based on on-chain credential (e.g., token holder)
- **Activity** - Embedded web app in Discord (like Telegram Mini App)
- **Webhook** - ZAOOS sends POST to Discord to mirror status (one-way inbound)
- **Mini App / WebApp** - Full React component embedded in Discord/Telegram client
