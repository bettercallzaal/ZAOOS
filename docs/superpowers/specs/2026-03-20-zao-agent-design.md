# ZAO Community AI Agent — Design Spec

> **Date:** March 20, 2026
> **Status:** Approved — ready for implementation planning
> **Repo:** `zao-agent` (separate from ZAO OS)
> **Framework:** ElizaOS v1.7.2
> **Deploy:** Railway ($14-44/mo)
> **References:** Docs 24, 26, 83, 84, 85

---

## What We're Building

A Farcaster-native AI agent called **"The ZAO Guide"** that lives in the /zao channel and XMTP DMs. It's a warm, knowledgeable community manager that answers questions, welcomes new members, recommends music, explains governance/Respect, and posts proactive updates.

**First music-focused AI agent on Farcaster.** No competitor exists.

---

## Architecture

```
┌──────────────────────────────────────────┐
│            zao-agent repo                 │
│          (ElizaOS v1.7.2)                 │
│                                           │
│  Character: zao-guide.character.json      │
│  Plugins: farcaster, xmtp, supabase      │
│  LLM: Claude API (Anthropic)             │
│                                           │
│  ┌─────────┐ ┌────────┐ ┌────────────┐  │
│  │Farcaster│ │ XMTP   │ │ Supabase   │  │
│  │Plugin   │ │Plugin  │ │ Adapter    │  │
│  └────┬────┘ └───┬────┘ └─────┬──────┘  │
│       │          │             │         │
│       Railway ($5-15/mo)                 │
└───────┼──────────┼─────────────┼─────────┘
        │          │             │
   Neynar API   XMTP Net   ZAO Supabase
   ($9/mo)      (free)     (shared DB)
```

**Separate repo.** Shares ZAO OS's Supabase database. Tracked as a Paperclip project.

---

## Personality: "The ZAO Guide"

- Warm, helpful community manager — not a corporate assistant
- Gets genuinely excited about music
- Speaks plainly, uses casual tone appropriate for Farcaster
- References specific ZAO features and research docs by name
- Says "Farcaster" not "Warpcast"
- Explains Respect, governance, and the fractal in accessible terms
- Proactively welcomes new members
- Build-in-public energy — shares what's being worked on

---

## Response Triggers

| Trigger | Channel | Action |
|---------|---------|--------|
| `@zaoguide` mention | Farcaster | Always respond (threaded reply) |
| Question keywords | /zao channel | Respond if matches FAQ/knowledge |
| New member detected | XMTP | Welcome DM with onboarding info |
| Weekly schedule (Mon) | /zao channel | Post community highlights |
| Weekly schedule (Fri) | /zao channel | Post music digest |
| New proposal created | /zao channel | Announce + explain |
| Respect distribution | /zao channel | Post leaderboard update |

---

## Knowledge (150+ facts, 3 tiers)

### Tier 1: Core (~30 facts)
- What is ZAO (mission, community, independent artists)
- How to join (allowlist, wallet connect, Farcaster auth)
- What is Respect (Fibonacci scoring, weekly fractal, no decay, no tiers)
- How governance works (proposals, Respect-weighted voting, OREC)
- What channels exist (/zao, /zabal, /cocconcertz)
- Key people and roles
- How to submit music, create proposals, use features

### Tier 2: Ecosystem (~50 facts)
- Partner platforms: MAGNETIQ (Proof of Meet), SongJam (leaderboard), Empire Builder (token rewards), Incented (campaigns), Clanker ($ZABAL)
- $ZABAL token (Base chain, launched via Clanker Jan 1 2026)
- Multi-chain: Optimism (governance), Base (rewards), Solana (WaveWarZ)
- ZAO Stock 2026 (Maine event)
- Sub-DAOs: WaveWarZ, ZAO Festivals

### Tier 3: Technical (~70+ facts)
- ZAO OS features: chat, XMTP DMs, music player (6 platforms), governance page, Respect leaderboard, admin panel, ecosystem page, community issues
- What's built vs planned (Hats Protocol, AI agent, cross-platform)
- Tech stack: Next.js 16, React 19, Supabase, Neynar, XMTP, Wagmi/Viem
- Research library (88+ docs)
- How to fork ZAO OS (community.config.ts)
- Paperclip AI company (CEO Main, Founding Engineer)

---

## Phased Rollout (4 weeks)

### Week 1: Farcaster MVP
- Set up `zao-agent` repo with ElizaOS v1.7.2
- Create bot FID + Neynar managed signer
- Write `zao-guide.character.json` with Tier 1 knowledge (30 facts)
- Configure Farcaster plugin for /zao channel
- Deploy to Railway
- Bot responds to @mentions only
- **Deliverable:** Bot live in /zao channel answering basic questions

### Week 2: Add XMTP + Deep Knowledge
- Enable XMTP plugin (DMs + group chats)
- Expand knowledge to Tier 2 (ecosystem, 80 total facts)
- Add welcome DM flow for new members
- Connect Supabase adapter for memory persistence
- **Deliverable:** Bot does DMs + knows about partner ecosystem

### Week 3: Full Knowledge + Memory
- Expand to Tier 3 (technical, 150+ facts)
- Enable memory system (remembers past conversations per user)
- Add conversation threading (multi-turn replies)
- Tune response quality with few-shot examples
- **Deliverable:** Bot is deeply knowledgeable, remembers context

### Week 4: Proactive Posting + Music
- Enable proactive posting schedule (weekly digests, announcements)
- Add music recommendation capability (Audius, Sound.xyz lookups)
- Add governance notifications (new proposals, vote results)
- Add Respect leaderboard updates
- Tune posting frequency to avoid spam
- **Deliverable:** Fully autonomous community agent

---

## Configuration

### Environment Variables

```env
# ElizaOS Core
XAI_MODEL=claude-sonnet-4-6
ANTHROPIC_API_KEY=sk-ant-...

# Farcaster (Neynar)
FARCASTER_NEYNAR_API_KEY=...
FARCASTER_NEYNAR_SIGNER_UUID=...
FARCASTER_FID=...

# XMTP (Phase 2)
WALLET_KEY=...
XMTP_SIGNER_TYPE=EOA
XMTP_ENV=production

# Database
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Character File Structure

```json
{
  "name": "ZAO Guide",
  "bio": "The community manager for The ZAO — a decentralized music community for independent artists on Farcaster.",
  "lore": ["Founded by @bettercallzaal", "100+ active members", "Weekly fractal governance meetings"],
  "knowledge": ["... 150+ facts ..."],
  "messageExamples": [
    [
      {"user": "member", "content": {"text": "What is Respect?"}},
      {"user": "ZAO Guide", "content": {"text": "Respect is ZAO's governance token — earned through weekly fractal meetings, not bought. Fibonacci-scored (10, 16, 26, 42, 68, 110) in breakout groups of 6. No decay, accumulates permanently. Higher Respect = more governance weight. Check the leaderboard at zaoos.com/respect!"}}
    ]
  ],
  "style": {
    "all": ["Warm and welcoming", "Music-first perspective", "References ZAO features by name", "Says Farcaster not Warpcast"],
    "chat": ["Conversational", "Uses casual Farcaster tone", "Includes relevant links"],
    "post": ["Concise", "Mobile-friendly", "Includes emojis sparingly"]
  },
  "settings": {
    "model": "claude-sonnet-4-6",
    "farcaster": {
      "channels": ["/zao"],
      "replyProbability": 0.8
    }
  },
  "plugins": ["@elizaos/plugin-farcaster", "@elizaos/plugin-xmtp", "@elizaos/adapter-supabase"]
}
```

---

## Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| Neynar Starter | $9 |
| Railway hosting | $5-15 |
| Claude API (Sonnet) | $5-20 |
| **Total** | **$14-44/mo** |

---

## Success Criteria

- Bot responds to @mentions within 60 seconds
- 90%+ answer accuracy for Tier 1 questions
- No spam complaints from community members
- At least 50 unique conversations in first month
- Weekly proactive posts get engagement (likes/replies)
- New member welcome rate: 80%+ of joiners get a DM

---

## What This Is NOT

- Not a token trading bot
- Not a moderation/banning tool (Phase 4+ maybe)
- Not a replacement for human community management
- Not connected to Paperclip (separate system, separate purpose)
