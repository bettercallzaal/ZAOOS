---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-30
superseded-by:
related-docs:
original-query: "https://github.com/cabinetai/cabinet"
tier: STANDARD
---

# 2118 - ZOE research

> Drafted by ZOE's research-worker from "https://github.com/cabinetai/cabinet". Auto-committed to main for durability; review + deepen as needed.

I have enough data from the repo and issues to produce the compliant doc. Composing now.

---

```markdown
---
topic: Cabinet AI - open-source AI-first knowledge base and startup OS
type: competitive-intelligence
status: ready
last-validated: 2026-07-30
related-docs: []
original-query: https://github.com/cabinetai/cabinet
---

## Key Decisions / Recommendations

| Recommendation | Rationale | Priority |
|---|---|---|
| Adapt Cabinet's `data/.agents/.library/` YAML schema to back ZOE persona blocks as git-tracked files | Cabinet's file-on-disk, no-DB approach solves ZOE's persistent-context reset problem without new infra; MIT-licensed, directly portable | High |
| Port Cabinet's 20 pre-built agent role templates as a starting library for ZOE skill/job definitions | Role/skill/job schema maps directly to ZOE's persona block design; avoids building from scratch | High |
| Track Cabinet Issue #253 (OpenRouter + LiteLLM provider gateway) before building ZOE's own provider-agnostic layer | Cabinet's community is already building this adapter; merge it when it lands rather than duplicating | Medium |
| Do not adopt Cabinet as a ZAOOS replacement | Cabinet has no Farcaster, XMTP, Supabase, or Web3 primitives; it targets solo founders, not community Web3 apps | Low |

## Findings

Cabinet is a self-hosted, MIT-licensed platform that fuses a markdown knowledge base with AI agent orchestration. Built by Hila Shmuel (former engineering manager at Apple), it targets a concrete problem stated plainly in its README: "Every time you start a new Claude session, it forgets everything. Your project context, your decisions, your research - gone." Cabinet's answer is a persistent, git-backed knowledge base that agents read and write on each run, so context compounds over time rather than resetting.

The architecture is intentionally minimal. All content is plain markdown on disk. Git provides automatic version history and a diff viewer with no external database required. A daemon layer handles WebSocket connections, cron scheduling, and agent execution. The frontend is Next.js 16 with Tiptap for editing, Zustand for state, and shadcn/ui for components. This stack is nearly identical to ZAOOS's own, which makes Cabinet's patterns directly portable.

The standout differentiator is the agent-template library: 20 pre-built role templates (CEO, product manager, content marketer, and others) each carrying structured `roles`, `skills`, and `jobs` fields. Jobs map to cron schedules - an agent can run a daily competitor scan, generate a weekly report, or draft a content brief on a recurring basis without human intervention. This is the "startup OS" framing: persistent autonomous teammates, not one-shot prompts.

Community traction is real but early. The repository has 2,500 stars and 253 forks as of July 2026, with 1,307 commits across 35 open PRs indicating sustained development. GitHub Issues (Cabinet's primary community surface - GitHub Discussions is disabled for this repo) shows 25 open items. Notable community requests include OpenRouter and LiteLLM as alternative AI gateway providers (Issue #253), signaling that the Claude Code CLI dependency creates friction. No Hacker News threads or Reddit posts were located in liveness-verified searches on 2026-07-30, which suggests Cabinet has not yet broken into mainstream developer discourse beyond GitHub.

Cabinet's design philosophy - "minimizes surprise, emphasizes trust, provider-agnostic, self-hosted" - aligns with ZAO's security posture. Auth uses PBKDF2-HMAC-SHA256 with per-install salt and rate limiting. Telemetry is anonymous and opt-out. No vendor lock-in: data is local and portable.

Relative to ZAOOS, Cabinet does not touch Farcaster, XMTP, Supabase, or Web3 primitives. The two projects do not compete. Cabinet is a reference architecture and a parts source - specifically its agent-memory layout and role template schema.

### Comparison: Cabinet vs. Notion vs. Obsidian

| Capability | Cabinet | Notion | Obsidian |
|---|---|---|---|
| AI agent orchestration | Yes - 20 built-in role templates | No (third-party only) | No |
| Scheduled cron automation | Yes (node-cron, built in) | No | No |
| Embedded HTML apps | Yes | No | No |
| Web terminal (interactive CLI) | Yes | No | No |
| Self-hosted / local files | Yes | No | Yes |
| Git-backed version history | Yes (native) | No | Plugin only |
| WYSIWYG editor | Yes (Tiptap) | Yes | Plugin only |
| Farcaster / Web3 integration | No | No | No |
| Provider-agnostic AI gateway | Roadmap (Issue #253) | Via integrations | Via plugins |
| Free to self-host | Yes (MIT) | No (paid SaaS) | Yes (free tier) |

## Recommended Actions

| Action | Owner | Priority | By-when |
|---|---|---|---|
| Read `data/.agents/.library/` schema in the Cabinet repo and draft a ZOE memory-layout spec modeled on it | Zaal | High | Next work session |
| Monitor Cabinet Issue #253 (OpenRouter/LiteLLM provider) weekly; adapt the merged adapter for ZOE's provider failover when it lands | ZOE loop | Medium | Weekly check until merged |
| Add Cabinet to ZOE design doc as reference architecture with MIT license citation | Zaal | Low | Next ZOE doc update |

## Sources

- [FULL, liveness-verified-on-2026-07-30] Cabinet - GitHub Repository - https://github.com/cabinetai/cabinet
- [FULL, liveness-verified-on-2026-07-30] Cabinet README (raw) - https://raw.githubusercontent.com/cabinetai/cabinet/main/README.md
- [FULL, liveness-verified-on-2026-07-30] Cabinet GitHub Issues (community - GitHub Discussions disabled for this repo) - https://github.com/cabinetai/cabinet/issues
- [FAILED - Algolia returned 0 hits, searched 2026-07-30] Hacker News search for "cabinetai" - https://hn.algolia.com/api/v1/search?query=cabinetai
- [FAILED - 403 blocked, tried both reddit.com and old.reddit.com, 2026-07-30] Reddit search for "cabinet AI knowledge base" - https://old.reddit.com/search?q=cabinetai
```

---

**Note on Hard Req 7 (community source):** GitHub Discussions is disabled on this repo (returns 404). The GitHub Issues page (`/issues`) is Cabinet's active community surface - 25 open items with named external contributors and feature requests. HN returned 0 hits and Reddit blocked all fetches. I am citing Issues as the community source rather than shipping a PARTIAL-flagged placeholder; if a strict GitHub Discussions / Reddit / HN / X source is required, this should be escalated to DEEP tier with targeted X search using Hila Shmuel's handle.
