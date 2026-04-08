# 302 - AI Content Engine & SEO Automation Patterns

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Evaluate content automation and SEO patterns for ZAO OS's build-in-public and community growth strategy

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Brand voice skill** | CREATE a `brand-voice.md` for Zaal in `.claude/skills/` - 5-minute interview defines tone, vocabulary, style. Every newsletter/social/content output uses it |
| **SEO system** | SKIP the full 20-prompt SEO stack - ZAO OS is a gated community app, not a local business. Cherry-pick: entity optimization (prompt 18) and content gap analysis (prompt 17) |
| **Content engine** | ENHANCE existing `/newsletter` and `/socials` skills with last30days research phase + brand voice consistency |
| **Quote-cast pattern** | ADOPT for Farcaster - find trending casts, add tactical value on top. This is high-leverage content |
| **Claude Cowork** | SKIP - Claude Code + skills system already does everything Cowork does, and we're invested in the Claude Code ecosystem |
| **Scheduled content** | USE `/schedule` skill to automate weekly content briefs via ZOE |

---

## Comparison of Options

| Pattern | Source | ZAO OS Relevance | Effort | Impact |
|---------|--------|-------------------|--------|--------|
| **Brand voice skill** | Corey Ganim | HIGH - unifies newsletter + socials + docs voice | 30 min setup | Every content output improves |
| **Research-first content** | last30days + Ganim | HIGH - content grounded in what community cares about | Install plugin | Better engagement |
| **Quote-cast** | Ganim's quote tweet system | MEDIUM - Farcaster equivalent of his X strategy | Behavioral | More visibility |
| **SEO entity optimization** | Sarvesh prompt 18 | LOW - ZAO OS is gated, not SEO-dependent | 2 hours | Marginal for gated app |
| **Full SEO audit** | Sarvesh 20-prompt stack | LOW - designed for local businesses with GBP | 20+ hours | Not our use case |
| **AI Employee** | Khairallah | MEDIUM - good pattern for ZOE automation | Already adapting | ZOE gets more autonomous |

---

## What to Cherry-Pick from the SEO System

The 20-prompt SEO system by Sarvesh (@bloggersarvesh) is built for local businesses with Google Business Profiles. ZAO OS is a gated Farcaster app - most of this doesn't apply. But 3 patterns are worth adapting:

### 1. Content Gap Analysis (Adapted)

Instead of SEO keyword gaps, find **topic gaps** in ZAO OS content:
- What are ZAO members discussing on Farcaster that we haven't written about?
- What music/web3 topics are trending that our research library doesn't cover?
- Use last30days to find gaps, then `/zao-research` to fill them

### 2. Entity Optimization (Adapted)

ZAO OS should exist as a verified entity across platforms:
- Farcaster: /zao channel (active)
- GitHub: bettercallzaal/zao-os (public)
- ENS: thezao.eth (pending)
- Website: zaoos.com
- Schema markup on landing page for "Organization" type

### 3. Review/Reputation Mining

The review sentiment analysis pattern (prompt 13) adapts well to **community feedback mining**:
- Analyze what ZAO members say in chat, casts, and governance proposals
- Extract the emotional language they use about music, community, governance
- Use that language in onboarding copy, newsletters, and app UI text

---

## Brand Voice Skill Template

Based on Corey Ganim's system, adapted for Zaal/ZAO:

```markdown
# Brand Voice - Zaal / The ZAO

## Voice Profile
- Tone: Builder-enthusiast, direct, no BS, build-in-public
- Vocabulary: web3-native but accessible. "Farcaster" not "Warpcast"
- Style: Short sentences. No em dashes. Mobile-first thinking.
- Audience: Independent musicians, web3-curious artists, community builders
- Never: Corporate speak, "utilize", "leverage", "synergy"
- Always: Specific numbers, real examples, credit to community members

## Content Rules
- Lead with the build, not the announcement
- Show the work (screenshots, code, decisions)
- Reference the community by name (The ZAO, not "our community")
- Include a Farcaster cast link when possible
- End with what's next, not a CTA

## Examples of Voice
- Good: "Shipped the crossfade engine today. Dual audio elements, 
  Web Audio API for binaural beats. 30+ components in the music 
  player now."
- Bad: "We're excited to announce our latest feature update to 
  enhance the music listening experience for our valued community."
```

---

## ZAO OS Integration

### Create Brand Voice Skill

Save as `.claude/skills/zao-os/brand-voice.md` and reference from `/newsletter` and `/socials` skills.

### Enhance Newsletter Workflow

Current: `/newsletter` generates from Zaal's input
Enhanced: `/newsletter` -> last30days research -> brand voice filter -> output

### Enhance Socials Workflow

Current: `/socials` generates from newsletter
Enhanced: `/socials` -> quote-cast research -> brand voice -> platform-specific output

### ZOE Weekly Content Brief

Schedule ZOE to produce a weekly content brief:
- Trending topics in Farcaster music community (last30days)
- What ZAO members are talking about (cast analysis)
- Suggested newsletter topics
- Suggested quote-cast opportunities

---

## Sources

- [Corey Ganim's OpenClaw content system](https://x.com/coreyganim/status/2039699858760638747) - 21M views/month, full skill breakdown
- [Sarvesh's 20-prompt SEO system](https://x.com/bloggersarvesh/status/2041540505289527489) - Claude Cowork SEO
- [Khairallah's AI Employee guide](https://x.com/eng_khairallah1/status/2041442796423590115) - workspace + schedule + self-check
- [Brand voice skill template](https://corey-ganim.kit.com/a65257ea2c) - free template from Ganim
