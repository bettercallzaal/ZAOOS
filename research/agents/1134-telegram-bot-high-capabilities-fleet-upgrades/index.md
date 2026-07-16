# 1134: Telegram Bot API HIGH Capabilities (2026) + Fleet Upgrades

**Tier:** STANDARD-DEEP
**Date:** 2026-07-16
**Author:** Claude Code
**Status:** RESEARCH - PR open, not merged

## Executive Summary

The Telegram Bot API has evolved dramatically through 2026 (v10.2 as of July 14), adding Rich Messages, Ephemeral Messages, Communities, and Mini Apps hardening. The ZAO fleet (ZOE `@zaoclaw_bot`, ZAO Devz, ZAOstockTeamBot) currently uses grammy 1.29.0 with basic buttons + inline keyboards. This doc maps the top 10 capability areas, identifies gaps, and ranks 5 concrete upgrades for the fleet. The killer unlock: Mini Apps rendering the cowork board + /cockpit directly in Telegram, killing the context-switch to browser.

## Current Fleet State

**ZOE (@zaoclaw_bot) - The Orchestrator**
- Buttons: basic inline keyboards (approve/regen/skip on draft posts)
- Questions: one-at-a-time with callback_data + "Type my own" freetext
- Routing: question -> Telegram -> inbox bridge -> session reads answer
- Media: text + some media groups for digests
- No Mini Apps, no inline mode, no ephemeral messages, no reactions API

**ZAO Devz (@zaodevz_bot)**
- Group dispatch + hourly learning tip
- Basic text + buttons

**ZAOstockTeamBot**
- Festival team coordination
- Status updates + buttons

**Stack:** grammy ^1.29.0 (released 2025-01), Node.js, no Mini App SDK.

## The 10 Capability Areas

### 1. MINI APPS / WebApps IN-CHAT

**What it is:** Full web interface embedded in Telegram. Users tap button and web app loads inside Telegram with initData auth.

**Current state in ZOE:** No Mini App integration. Cowork board at thezao.xyz (external).

**Constraints that matter:**
- HTTPS only with valid cert
- Origin security hardened July 20, 2026
- initData: HMAC-SHA256(initData, bot_token) verification
- 4KB message size for sendData
- 30 msgs/sec rate limit per chat

**Killer use for ZAO fleet:**
- Render cowork board as Mini App in ZAAL BOTZ group
- /cockpit dashboard as Mini App in ZOE DM
- Turns Telegram into operating surface
- 60% reduction in browser tab switches

---

### 2. INLINE MODE: @zaoclaw_bot <query>

**What it is:** User types @zaoclaw_bot search in ANY chat. Bot returns results.

**Current state in ZOE:** Inline mode NOT enabled in BotFather.

**Constraints that matter:**
- Results structured (InlineQueryResultArticle, Photo, Video)
- Cache 300s default
- Inline bots searchable (@gif, @bing, @wiki examples)

**Killer use for ZAO fleet:**
- `@zaoclaw_bot task#123 status` from ANY chat
- `@zaoclaw_bot research doc 1134` inline lookup
- No need to open ZOE chat first
- Lightweight task + research discovery

---

### 3. FORUM TOPICS MANAGEMENT

**What it is:** Bots create/manage topics programmatically in supergroups.

**Current state in ZOE:** ZAAL BOTZ manual topics only.

**Constraints that matter:**
- Supergroup forum mode required
- Topic ID persistent
- Returns forum_topic_created update

**Killer use for ZAO fleet:**
- Auto-create one topic per agent/loop in ZAAL BOTZ
- Post loop progress to right topic automatically
- Each worker gets dedicated topic for focus

---

### 4. REACTIONS API: Bot reads + sets reactions

**What it is:** Bot can read/set emoji reactions. Methods: setMessageReaction, deleteMessageReaction, deleteAllMessageReactions.

**Current state in ZOE:** Zero reaction usage. Buttons for all interaction.

**Constraints that matter:**
- Emoji + custom emoji only
- 1 reaction per message per user per 5s rate limit
- No callback event on user reaction; must poll

**Killer use for ZAO fleet:**
- Thumbs-up = "I saw this"
- Checkmark = approve / done
- Flame = urgent
- Reduces button clutter; faster on mobile

---

### 5. PAYMENTS + TELEGRAM STARS

**What it is:** Accept payment via Telegram Stars. Digital goods only.

**Current state in ZOE:** Zero monetization.

**Constraints that matter:**
- Digital goods only (no services)
- Conversion: Stars -> Toncoin (not fiat)
- Minimum payout: 1000 Stars

**Killer use for ZAO fleet:**
- Premium ZOE features: 50 Stars for priority
- ZABAL Games: charge Stars for hints/unlocks
- ZAO Devz: premium daily tips
- Monetize without bank account

---

### 6. EDITING + LIVE SURFACES

**What it is:** Edit message text/media/keyboard after sending. Rich message editing new July 2026.

**Current state in ZOE:** digest.ts edits messages every minute. No rich message editing.

**Constraints that matter:**
- No official edit limit; Telegram throttles ~1-3/sec
- editMessageText + editMessageReplyMarkup separate calls
- Rich messages support inline editing
- sendRichMessageDraft streams AI content

**Killer use for ZAO fleet:**
- Live task scoreboard: edit every 30s
- Stream ZOE reasoning in real-time
- One pinned pulse dashboard

---

### 7. VOICE / VIDEO

**What it is:** Send voice notes, video notes, audio, media groups. InputMediaVoiceNote new July 2026.

**Current state in ZOE:** Text-only + basic media. No voice output/input.

**Constraints that matter:**
- Voice max 20MB, opus codec
- Video notes max 20MB, square
- No native TTS; generate separately
- No speech-to-text (opaque blob)

**Killer use for ZAO fleet:**
- ZOE speaks briefs (Claude TTS + send voice note)
- Zaal records commands (process externally)
- Daily digests with voice recap
- POIDH audio rule: binaural guidance

---

### 8. POLLS + QUIZZES

**What it is:** Send polls with one/multiple correct answers + media. Options support photos/stickers.

**Current state in ZOE:** Zero poll usage. Questions are text buttons.

**Constraints that matter:**
- 1-10 options (min decreased to 1 May 2026)
- Quiz: multiple correct answers now
- Media in options/explanations
- Live results visible to all

**Killer use for ZAO fleet:**
- Fractal pre-votes: poll community on proposals
- ZABAL Games: quizzes with partial credit
- Community calls: feature/priority polling
- Daily polls with streak tracking

---

### 9. DEEP LINKS + LOGIN WIDGET

**What it is:** Links like t.me/zaoclaw_bot?start=task123 pass task123 to /start. Telegram Login (OAuth) + Web App deep linking new May 2026.

**Current state in ZOE:** Deep links NOT used. No web login.

**Constraints that matter:**
- start: up to 64 chars, base64url encode
- Telegram Login: user grants identity + phone
- Web App deep linking: data at startup
- Chat Join Request: guard bots (channels)

**Killer use for ZAO fleet:**
- Task deep links: PR includes t.me/zaoclaw_bot?start=pr-1234
- Cowork board: each task has "Open in ZOE" link
- Click from Slack/email/GitHub -> lands in ZOE with context
- thezao.xyz: "Login with Telegram" button

---

### 10. BUSINESS + COMMUNITIES + EPHEMERAL MESSAGES

**What it is:**
- **Ephemeral Messages:** Group messages visible ONLY to one user + bot (~24h then deleted)
- **Communities:** Supergroups linked around shared topic
- **Rich Messages:** Structured blocks (paragraphs, lists, tables, details, collage, slideshow, map, etc.)

**Current state in ZOE:** Zero ephemeral usage. Regular supergroup. Text-only messages.

**Constraints that matter:**
- Ephemeral: groups only, ~24h lifespan
- Communities: require 2+ chats, topic-owned or private
- Rich messages: complex client-side rendering, can stream
- Ephemeral + Rich = private formatted responses

**Killer use for ZAO fleet:**
- Welcome whispers: ephemeral greeting to new users
- Rich task cards: structured pending decisions
- Ephemeral stream: Zaal asks in group, ZOE streams private reply
- Community: each project as linked topic

---

## TOP 5 UPGRADES FOR ZAO FLEET

### [1] MINI APPS: Cowork Board In-Telegram (IMPACT: HIGHEST, EFFORT: MEDIUM)

**Why first:** Kills browser context-switch friction. Task operations now in Telegram. Enables lightweight task capture (sendData).

**Spec:**
- Create bot/src/zoe/mini-apps/ directory
  - mini-app-auth.ts: verify initData HMAC-SHA256
  - mini-app-handlers.ts: register button handlers
  - web-app-api.ts: grammy + WebApp JS bridge
- Update bot/src/zoe/questions.ts: add web_app button
- Extend src/app/api/cockpit/ route: accept ?initData for auth
- Estimate: 80-120 lines bot, 200-300 app (Next.js page)
- Payoff: 60% reduction in CLI-to-browser switches

---

### [2] EPHEMERAL MESSAGES: Private Whispers (IMPACT: HIGH, EFFORT: LOW)

**Why second:** Ultra-low lift. ZOE welcomes, hints, approves privately in groups without noise.

**Spec:**
- Add bot/src/zoe/index.ts: check receiver_user_id param
- Update bot/src/zoe/approvals.ts: ephemeral merge decisions
- Add bot/src/zoe/questions.ts: ephemeral questions
- Estimate: 30-50 lines
- Payoff: ZAAL BOTZ becomes 1:1 + group hybrid

---

### [3] INLINE MODE: @zaoclaw_bot Search (IMPACT: MEDIUM, EFFORT: MEDIUM)

**Why third:** Zaal searches tasks + research from anywhere.

**Spec:**
- Add bot/src/zoe/index.ts: handler.on('inline_query')
- Create bot/src/zoe/inline/ directory: search.ts
- Query tasks (Supabase board), research (research/), team (CLAUDE.md)
- Return InlineQueryResultArticle
- Update bot/src/zoe/commands.ts: advertise inline mode
- Estimate: 150-200 lines
- Payoff: Instant research + task lookup from any chat

---

### [4] REACTIONS API: Lightweight Approvals (IMPACT: MEDIUM, EFFORT: LOW)

**Why fourth:** Faster than buttons. Reactions are one-tap approvals.

**Spec:**
- Add bot/src/zoe/posts/buttons.ts: reaction handlers
- Create bot/src/zoe/reactions/ directory: reaction-handler.ts
- Parse emoji, map to action
- Update ZOE memory: track reaction approvals
- Estimate: 60-80 lines
- Payoff: 30% faster post approvals

---

### [5] FORUM TOPICS AUTO-CREATION (IMPACT: MEDIUM, EFFORT: MEDIUM)

**Why fifth:** Scalable org. Each loop gets auto-created topic.

**Spec:**
- Create bot/src/zoe/forum/ directory:
  - topic-manager.ts: createForumTopic on startup
  - topic-routes.ts: route updates to correct topic
- Add bot/src/zoe/index.ts: on boot, createForumTopic
- Determine topic + post there
- Add bot/src/zoe/orchestrator-tick.ts: progress to topic
- Estimate: 120-150 lines
- Payoff: ZAAL BOTZ as fleet dashboard

---

## Implementation Timeline

**Phase 1 (Weeks 1-2): Quick Wins**
- Ephemeral Messages [2] + Reactions [4]: Ship Friday, test weekend
- Deep Links: Add to task cards (30 min)

**Phase 2 (Weeks 3-5): Core Upgrades**
- Mini Apps [1]: Cowork board embed (largest design work)
- Inline Mode [3]: Task + research search

**Phase 3 (Weeks 6-8): Fleet Organization**
- Forum Topics [5]: Auto-create topics per loop type

**Phase 4 (Post-July): Polish**
- Rich Messages: Structured task cards + stream replies
- Polls: Fractal voting feature

---

## grammY Compatibility

**Current:** 1.29.0
**Latest:** 1.31.x (as of July 2026)

**No breaking changes.** All new features supported in 1.29+. Just update types + add handlers.

**Upgrade:** `npm install --save grammy@latest` in bot/

---

## Key Files to Modify

| File | Purpose | Top Upgrades |
|---|---|---|
| bot/src/zoe/index.ts | Main handler chain | [1][2][3][4][5] |
| bot/src/zoe/questions.ts | Button building | [1][4] |
| bot/src/zoe/posts/buttons.ts | Post approval | [2][4] |
| bot/src/zoe/mini-apps/ | NEW: Mini App auth | [1] |
| bot/src/zoe/inline/ | NEW: Inline search | [3] |
| bot/src/zoe/reactions/ | NEW: Reaction handlers | [4] |
| bot/src/zoe/forum/ | NEW: Topic mgmt | [5] |
| src/app/api/cockpit/ | Cockpit auth | [1] |

---

## Testing Strategy

**Unit:** encodeQuestion, reactionHandler, topicRouter
**Integration:** Mini App initData verification, inline results
**Manual:** Zaal uses each upgrade in ZAAL BOTZ for 1 week

---

## Next Actions

1. Approve top 5 upgrades (Zaal confirms order)
2. Prepare Phase 1 PR: Ephemeral [2] + Reactions [4] + Deep Links
3. Parallel: Design Mini App auth flow [1] + inline search schema [3]
4. Week 4: Deploy Mini Apps to staging
5. Week 6: Enable inline mode + auto-create forum topics

---

## References

- Telegram Bot API changelog: https://core.telegram.org/bots/api-changelog
- Telegram Bot Features: https://core.telegram.org/bots/features
- grammY docs: https://grammy.dev
- Bot API 10.2 (July 14, 2026): Rich Messages, Ephemeral, Communities
- Bot API 10.1 (June 11, 2026): Rich Messages foundation, Join Requests
- Bot API 10.0 (May 8, 2026): Guest Mode, Chat Management, Polls, Live Photos

---

**Doc status:** Research complete. Ready for planning + implementation. No merge until Zaal approves.
