---
topic: dev-workflows
type: reference
status: research-complete
last-validated: 2026-04-27
related-docs: 528
tier: STANDARD
---

# 537 - Shann's Superpowers Planning Framework for Project Execution

> **TL;DR:** Shann Holmberg (@shannholmberg, founder of Espressio AI) posted that Claude's superpowers skill is the simplest way to level up project planning - 5-minute setup, works for code or non-code projects, handles both planning + execution mapping.

## The Post

Source: https://x.com/shannholmberg/status/2047722364415459463

**Author:** Shann Holmberg (handle: @shannholmberg)
- Founder/CEO Espressio AI (AI marketing + growth)
- Founder Lunar Strategy
- Covers AI marketing & growth frameworks on X

**Post content (Apr 24, 2026):**
- "superpowers is still the simplest way to level up any project you're running in Claude"
- "setup takes under 5 minutes. gets you to plan and map projects properly (code or non-code)"
- Includes a GPT image breakdown (2) of the article referenced, recommending users "save it and send it to your agent"
- Quote/reference to related article (X article URL obfuscated in Jina output but linked from Apr 30 prior post)

## Why This Matters for ZAO

1. **Multi-agent planning validation** - Shann's signal that superpowers (brainstorming/writing-plans skills) work for distributed teams aligns with ZAO's current Hermes pair (Coder + Critic) + future fleet architecture. Our agents already use superpowers for PR generation (doc 523).

2. **Project mapping for non-developers** - ZAO has mixed teams (musicians, artists, ops). Shann's emphasis on "code or non-code" suggests superpowers works for music release planning, festival ops, community workflows - not just coding.

3. **Framework credibility** - Shann is a growth marketing founder with public credibility; if superpowers is getting air time in the AI tooling / productivity space, ZAO's internal adoption + agent fleet strategy is aligned with emergent best practices.

4. **5-minute onboarding** - Low friction for new team members. Worth documenting as part of ZAO's agent + team orchestration playbook (doc 527).

## Connections

| Item | Relevance |
|------|-----------|
| Doc 528 (pi.dev multi-provider agent) | pi.dev also has context/project planning primitives (AGENTS.md + SYSTEM.md); compare to superpowers' approach |
| Doc 527 (multi-bot telegram coordination) | Supervisor + specialist pattern maps to superpowers' "plan once, map to sub-agents" |
| Doc 523 (Hermes spec) | Hermes Coder already uses superpowers for architecture + test strategy in PR desc |
| Hermes runner.ts | Agent planning step -> superpowers -> coder execution -> critic review |
| ZAO festival ops planning | non-code use case: festival scheduling, artist lineup, sponsor comms |

## Suggested Next Actions

1. **Add superpowers to team onboarding** - When new Hermes agents join fleet, prompt with superpowers to plan their domain first
2. **Document superpowers patterns in Hermes** - Collect common prompts (e.g., "Plan a music release workflow", "Map a Telegram bot feature") as templates
3. **Compare vs pi.dev's AGENTS.md** - Superpowers is interactive + browser-based; pi uses local files. Decide which fits ZAO's async-agent + VPS model better
4. **Test on non-tech domain** - Use superpowers to plan ZAO Stock 2026 ops (artist curation, vendor logistics, ticketing, promotion timeline)

## Source

- Post URL: https://x.com/shannholmberg/status/2047722364415459463?s=51
- Author profile: https://x.com/shannholmberg
- Shann's orgs: Espressio AI (AI marketing), Lunar Strategy
- Date: Apr 24, 2026
- Engagement: 25 replies, 132 retweets, 803 likes, 1.1K bookmarks at time of fetch
