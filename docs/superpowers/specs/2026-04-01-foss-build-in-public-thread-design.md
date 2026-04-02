# FOSS Build-in-Public Farcaster Thread — Design Spec

**Date:** April 1, 2026
**Type:** Content piece — Farcaster thread (10 casts)
**Author:** Zaal

---

## Overview

A 10-cast Farcaster thread showcasing ZAO OS as a FOSS project built in public. The thread targets three audiences simultaneously: ZAO community members, crypto/Farcaster builders, and AI power users. The core angle is **context as infrastructure** — "My AI has read 243 research docs about my project. Have you?" — grounded in the ethos that open source code + AI means anyone can grab a feature and build on it.

## Tone

Confident builder. Not a flex — an invitation. Humble about the demo state, honest about what works and what doesn't yet. "Here's what's possible when you treat AI as infrastructure, not a chatbot."

## Thread

### Cast 1 — Hook
> I've been building a social platform for the ZAO community in public the last 2+ weeks. Every line of code is free and open source software (FOSS). Here's why that matters more than the features.

### Cast 2 — What It Is
> ZAO OS is a gated Farcaster client for the ZAO community. Live audio rooms, a music player with crossfade, governance voting, messaging, a full social graph. Built with Next.js, Supabase, and Claude Code. All on GitHub.

### Cast 3 — FOSS Ethos
> Everything is FOSS because anyone should be able to grab a piece and build on it. The music player, social graph, live audio rooms, governance system — all organized by feature in the repo. Point your AI at any folder and start building. This is a demo — I'm making features work first then building from there. If you're an open source dev interested in contributing, definitely reach out.

### Cast 4 — FOSS + AI
> This is the part people miss. FOSS + AI means you don't need to understand my whole codebase. Point Claude at a folder, say "explain this and help me adapt it for my project." The code becomes a starting point, not a dependency.

### Cast 5 — Cross-Posting
> Write a post, publish to Farcaster, Bluesky, Discord, and Telegram at once. Content gets normalized for each platform — character limits, image handling, link previews. The ZAO's X account cross-posts too. Threads, Hive, and Lens are scaffolded for when the APIs open up. The whole engine is in src/lib/publish.

### Cast 6 — Social Graph
> I wanted advanced social analytics for myself so I built them into the community. Follower stats, leaderboards, who's online, activity feed, member spotlight, member map. My first attempt at a mini app was an unfollower churn tracker that only partially worked — that was the inspiration for building the whole social suite.

### Cast 7 — Spaces
> Spaces with backstage mode, RTMP broadcasting to Twitch and Kick, screen sharing, embedded Twitch player and chat, emoji reactions. One person built this because the code is open and AI can read all of it.

### Cast 8 — Shipping Velocity
> 85+ PRs in 2+ weeks. A music player that crossfades between multiple providers. On-chain governance with Respect-weighted voting. 243 research docs documenting every decision. An AI agent running on a VPS. All FOSS. All forkable.

### Cast 9 — Research Library
> Every decision is documented. 243 research docs in the repo — which audio SDK, how Farcaster signers work, what governance models exist. That's not just for me. That's for anyone building something similar who doesn't want to start from zero.

### Cast 10 — Invitation
> This is a working demo — features first, polish later. Right now you need a Farcaster account to sign in and only ZAO members are on the allowlist. Want to try it? DM me. Want to build on it? Fork it. Open source devs who want to contribute — definitely reach out. github.com/bettercallzaal/ZAOOS

## Distribution

- **Primary:** Farcaster /zao channel
- **Cross-post:** X (tag @sharbel as a response to his "20 Claude features" thread — this is the "what happens when you actually use them" answer)
- **Cross-post:** Bluesky, Discord, Telegram via ZAO OS cross-posting

## Voice Narration Workflow (Companion Piece)

Alongside the content, Zaal is adopting a voice narration habit inspired by Hilary Gridley's "Yapper's API" (Doc 241):

- **When:** Anytime — between calls, walking, end of day, during build sessions
- **How:** Open Claude on phone, voice mode, narrate what happened
- **What to narrate:** Community conversations, decisions, blockers, ideas
- **Where it goes:** Claude memory, feeds into /standup and future /reflect skill
- **No structure needed:** Works with how Zaal already operates — all free time goes into building

## Research Context

- Doc 241 — HowiAI: Gridley's AI Habit Workflows
- Doc 242 — Claude 20 Underused Features: ZAO Power User Audit
- Doc 243 — Claude Intermediate Guide (@aiedge_)
