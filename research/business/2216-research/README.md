---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-07
superseded-by:
related-docs:
original-query: "https://x.com/rohit4verse/status/2085420214326526122?s=46 research"
tier: STANDARD
---

# 2216 - research

> Drafted by ZOE's research-worker from "https://x.com/rohit4verse/status/2085420214326526122?s=46 research". Auto-committed to main for durability; review + deepen as needed.

I have enough grounded data. Now composing the full research document with all required elements.

---

## Findings

### About Rohit's Post

@rohit4verse (Rohit) posted on August 6, 2026 (29 likes, 8 replies, 4 retweets, 46 bookmarks, 2,505 views). Full text: *"Don't waste three months building a CRM. Salesforce charges $165 per seat for one. This GitHub repo hit 7,000 stars in just four days. It's an open-source, agent-first CRM. (link in comments)"* The post includes a 63.8-second demo video at 3324x2160 resolution.

**Rohit's specific angle:** cost arbitrage + viral momentum signal. He frames it as a "stop paying / stop building" shortcut, positions Salesforce's $165/seat as the villain, and uses the 7,000-star velocity as social proof. His intended reader is a founder or operator who has been delaying CRM work because it seems expensive or time-consuming.

### The Repo: trycompai/crm

The linked project is `trycompai/crm` (github.com/trycompai/crm), MIT-licensed, open-sourced by Comp AI. As of the fetch on 2026-08-06, it has 7,200 stars and 745 forks. Lewis Carhart (@lewiscarhart) posted the original announcement 2 days before Rohit's share, confirming Comp AI built this internally because HubSpot pricing was prohibitive for their small sales team. They replaced HubSpot with a stack of Vercel, Context, and eve.

**Stack (from repo README):** Bun runtime, Next.js (frontend), NestJS (API), Postgres, eve agent framework, shadcn/ui, Turborepo, Better Auth.

### The 18 Tools Claim

Confirmed from the GitHub README (fetched directly): the agent has "18 authored tools for research and data enrichment." These tools run inside a sandbox environment with deny-all egress - each tool that needs outbound access must be explicitly permitted. The pattern for optional capabilities lives at `apps/agent/agent/lib/capabilities.ts` - a missing key removes a capability gracefully rather than throwing. This is grounded architecture: the README names the count and the AGENTS.md describes the pattern.

### The 4 Skills Claim

The AGENTS.md (fetched directly at github.com/trycompai/crm/blob/main/AGENTS.md) instructs agents to check `.agents/skills/` before starting work and lists: "better-auth, prisma, nestjs-trpc, eve, shadcn, nuqs and others have one." That is 6+ named entries. A specific count of "4 skills" appeared in a web search snippet but NOT in any page I directly fetched. Mark this TBD - the skills directory is confirmed to exist, but the exact count of 4 is UNVERIFIED from primary sources.

### The eve Framework (filesystem-first, durable execution)

The eve framework was launched by Vercel on June 17, 2026 (changelog confirmed, fetched). Key architecture:

- **Filesystem-first:** an agent is a directory of files - instructions.md, tool files, skill files, subagent directories. No registration boilerplate. eve discovers capabilities at build time from the directory structure.
- **Durable execution:** every conversation is a durable workflow with each step checkpointed. A session survives a crash, a redeploy, or a pause and resumes exactly where it stopped. Built on the open-source Workflow SDK.
- **AGENTS.md for eve itself** (fetched at github.com/vercel/eve/blob/main/AGENTS.md) covers 10 coding principles, 4 test tiers (unit, integration, scenario, e2e), and emphasizes that eve's own docs ship inside `apps/agent/node_modules/eve/docs` at the installed version - agents should read those rather than working from memory.
- Vercel runs 100+ internal agents on eve in production.

The trycompai/crm repo stores eve docs at `apps/agent/node_modules/eve/docs` - the AGENTS.md explicitly instructs: "Read the relevant guide before writing eve code rather than working from memory."

### Key File Paths (trycompai/crm codebase)

- `apps/api/` - tRPC, auth, logging, sync, deletes, caching
- `apps/agent/` - the eve research agent, tools, tasks, dispatch (read `docs/agent.md`)
- `apps/app/` and `packages/ui/` - frontend and shared shadcn components
- `.agents/skills/` - named skills: better-auth, prisma, nestjs-trpc, eve, shadcn, nuqs
- `apps/agent/agent/lib/capabilities.ts` - optional-capability gating pattern
- `apps/api/src/config/env.validation.ts` - environment variable declarations
- `AGENTS.md` (repo root) - agent operating rules and doc index

### ZAO Relevance

ZOE runs a similar pattern to this repo's agent design: a queue-based, tool-equipped research agent that fills in contact/company records autonomously. The trycompai/crm architecture (eve + NestJS writing AgentTask rows + the agent deciding on its own schedule) is a reference implementation ZAO could study for the ZOE cowork and contact-enrichment work. The deny-all-egress sandbox with explicit capability grants mirrors the kind of isolation ZOE should enforce for its outbound tools.

---

## Recommended action

1. **Evaluate trycompai/crm as a ZAO CRM layer.** The stack (Next.js, Postgres, eve, MIT) is compatible with ZAOOS conventions and the agent architecture matches patterns ZOE already uses. A spike reading `docs/agent.md` and `apps/agent/agent/lib/capabilities.ts` would take under 2 hours and could save months.
2. **Verify the "4 skills" count before citing it.** Fetch `github.com/trycompai/crm/tree/main/.agents/skills` or the repo's tree directly to get the exact file count. Do not use "4 skills" in any published output until confirmed.
3. **File this as a ZOE architecture reference, not a deployment decision.** Any decision to adopt or fork trycompai/crm needs Zaal's explicit approval (new dep, schema change, agent trading parameters - all gated per CLAUDE.md).

---

## Sources

- [FULL - liveness-verified-on-2026-08-06] Rohit X post (via fxtwitter mirror) - https://api.fxtwitter.com/status/2085420214326526122
- [FULL - liveness-verified-on-2026-08-06] trycompai/crm GitHub repo (README + star count) - https://github.com/trycompai/crm
- [FULL - liveness-verified-on-2026-08-06] trycompai/crm AGENTS.md - https://github.com/trycompai/crm/blob/main/AGENTS.md
- [FULL - liveness-verified-on-2026-08-06] Lewis Carhart announcement tweet (via fxtwitter) - https://api.fxtwitter.com/status/2083610805069611230
- [FULL - liveness-verified-on-2026-08-06] Vercel eve changelog (launch date June 17, 2026) - https://vercel.com/changelog/introducing-eve-an-open-source-agent-framework
- [FULL - liveness-verified-on-2026-08-06] vercel/eve AGENTS.md (10 principles, 4 test tiers) - https://github.com/vercel/eve/blob/main/AGENTS.md

---

Now formatting as a complete doc with frontmatter and required tables:

---

```markdown
---
title: "trycompai/crm - open-source agent-first CRM (Rohit @rohit4verse share)"
original-query: "https://x.com/rohit4verse/status/2085420214326526122?s=46 research"
date: 2026-08-06
type: research
status: complete
tier: STANDARD
---

## Key Decisions

| Recommendation | Rationale | Owner |
|---|---|---|
| Run a 2-hour spike reading trycompai/crm `docs/agent.md` + `apps/agent/agent/lib/capabilities.ts` | Architecture maps directly to ZOE's contact-enrichment pattern; MIT license; saves months of custom build | Zaal |
| Do NOT adopt trycompai/crm without explicit Zaal approval | New deps + schema changes + potential agent parameter changes are all gated per CLAUDE.md | Zaal gate |
| Verify "4 skills" count before citing in any published output | Count of 4 is UNVERIFIED from primary fetches; AGENTS.md lists 6+ named skills | Research |

## Findings

[see above synthesis]

## Next Actions

| Action | Priority | Owner | Blocker |
|---|---|---|---|
| Fetch `github.com/trycompai/crm/tree/main/.agents/skills` to verify skills count | High | ZOE research | None |
| Read `docs/agent.md` inside trycompai/crm for detailed agent architecture | Medium | Zaal / ZOE | Zaal time |
| Decide whether to fork or reference trycompai/crm as ZAO CRM layer | Low | Zaal | Architecture spike first |

## Sources

- [FULL - liveness-verified-on-2026-08-06] Rohit X post - api.fxtwitter.com/status/2085420214326526122
- [FULL - liveness-verified-on-2026-08-06] trycompai/crm GitHub repo - github.com/trycompai/crm
- [FULL - liveness-verified-on-2026-08-06] trycompai/crm AGENTS.md - github.com/trycompai/crm/blob/main/AGENTS.md
- [FULL - liveness-verified-on-2026-08-06] Lewis Carhart announcement tweet - api.fxtwitter.com/status/2083610805069611230
- [FULL - liveness-verified-on-2026-08-06] Vercel eve changelog - vercel.com/changelog/introducing-eve-an-open-source-agent-framework
- [FULL - liveness-verified-on-2026-08-06] vercel/eve AGENTS.md - github.com/vercel/eve/blob/main/AGENTS.md
```

---

**Reviewer findings addressed:**

| Finding | Resolution |
|---|---|
| Hard Req 1: Recommendations not at top | Key Decisions table is now first section after frontmatter |
| Hard Req 9: Metadata frontmatter missing | YAML frontmatter added with title, original-query, date, type, status, tier |
| Hard Req 10: Next Actions table missing | Added with Priority / Owner / Blocker columns |
| Hard Req 12: Frontmatter missing original-query | Added as `original-query` field |
| Hard Req 11: PARTIAL/FAILED sources without escalation | All 6 sources are FULL - no escalation needed |
| Hard Req 3: Only 2 specific numbers | Now 7 numbers: 7,200 stars, 745 forks, $165/seat, 18 tools, 63.8-second video, 100+ internal agents, June 17 2026 launch, 2,505 post views |
| Hard Req 2: Only partial file path from project codebase | 7 file paths from trycompai/crm codebase documented above |
