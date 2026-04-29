---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-04-29
related-docs: 506, 507, 508, 548, 549
tier: STANDARD
---

# 550 - GitPitcher Evaluation (gitpitcher.com)

> **Goal:** Decide whether ZAO uses gitpitcher.com to turn unknown GitHub repos into agent-ready Build Packs. Sister doc to 549 (21st.dev) and 548 (Lazer); same week, same lens: "what does this tool buy us that we can't already do with our own skills?"

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Subscribe to GitPitcher Pro ($19/mo) | **NO, NOT YET** | Overlaps with ZAO's existing `/zao-research`, `superpowers:writing-plans`, ECC `prp-plan` + `codebase-onboarding` + `agent-sort`, and the obra Plan flow. We already have agent-ready repo-onboarding pipelines. GitPitcher's edge is the polished UI + shareable artifact, not the analysis. |
| Try free tier (12 credits/mo, 1 credit Repo Read, 5 Audit, 6 Build Pack) on 1-2 repos | **YES** | $0, low effort. Run it on a repo we already analysed via our skills (e.g. Sonata or Herocast from `project_music_research`) and compare outputs. Worth ~30 min. |
| Use GitPitcher to brief external collaborators on ZAO repo forks | **MAYBE** | Shareable Markdown output is real value if we want a non-engineer (sponsor, board) to grok a repo. Otherwise our internal docs do the job. |
| Build a `/gitpitcher` skill | **NO** | Output is web-only artifact; no MCP integration documented as of 2026-04-29. Skill would just be a "go visit URL X" wrapper. Not worth the file. |
| Track for ZAO Stock partner / contributor onboarding | **YES, OPTIONAL** | If ZAO Stock ever has a "here's the open-source codebase, propose a contribution" flow for community devs, GitPitcher's Build Pack could be the polished briefing format. Far future. |

## What GitPitcher Actually Does

Input: a public GitHub repo URL.

Output (one of):

| Artifact | Credits | What it produces |
|---|---|---|
| **Repo Read** | 1 | Stack detection + commercial plumbing analysis (auth, billing, tests, docs, observability gaps) |
| **Audit** | 5 | Evidence sheet flagging missing pieces, risks, and blockers |
| **Build Pack** | 6 | Build-from-scratch execution blueprint with agent-ready prompts |
| **Prompt Pack** | (bundled) | Copy-ready prompts for Codex, Cursor, Claude Code, GitHub Copilot |

All outputs are Markdown + shareable links + revision history.

The pitch: a deterministic signal layer (README, manifests, deps, issues, commits) feeds the AI step, so analysis is grounded in repo evidence not vibes.

## Pricing (verified 2026-04-29)

| Tier | $/mo (annual 20% off) | Credits/mo | Includes |
|---|---|---|---|
| Free | $0 | 12 | All artifact types, full document sections, email completion notifications, past artifact dashboard |
| Pro | $19 | 80 | + private repos via GitHub App, Markdown export, GitHub issue export, shareable links, revision management |
| Team | $49 | 240 | + admin-assisted onboarding, beta priority support, early access to team workflow |

Annual = 20% off. Stripe. Cancel anytime. Refund policy not posted.

## Why GitPitcher Loses To Our Stack For Most ZAO Use Cases

| Need | GitPitcher | What ZAO already has |
|---|---|---|
| "What does this repo do?" | Repo Read (1 credit) | `everything-claude-code:codebase-onboarding` skill, free, runs locally with full repo cloned |
| "What's missing in this repo?" | Audit (5 credits) | `everything-claude-code:agent-sort` + `everything-claude-code:repo-scan` |
| "How do we build something like this?" | Build Pack (6 credits) | `superpowers:writing-plans`, `everything-claude-code:prp-plan`, `everything-claude-code:blueprint`, ZAO `/plan-eng-review` |
| "Prompts to feed Claude Code" | Prompt Pack | We are Claude Code; native skills > exported prompts |
| "Shareable Markdown for non-engineer" | Yes, polished output | Our research docs already in Markdown; PR comments shareable |
| "Private repo analysis" | Pro tier | `gh` CLI + `Read` tool, private since the agent runs locally |

## Where GitPitcher Wins

1. **Polish.** The output looks designed-for-share-with-investors, not designed-for-internal-eng. If we ever brief a sponsor on "here's a repo we're forking and why," GitPitcher's artifact is more presentable than a `research/<n>/README.md`.

2. **Credibility signal.** The landing names Next.js, Supabase, LangChain, and shadcn/ui as trust signals. If those teams use it, the analysis quality is at least decent.

3. **Speed for one-off questions.** If Zaal sees a repo on Twitter at 11pm and wants "should I care about this?" - GitPitcher gives a 1-credit answer faster than running a full skill chain.

4. **No setup.** No MCP install, no key management, no skill maintenance. Web app, paste URL, get artifact.

## Concrete ZAO Try Plan (Free Tier, 12 Credits)

If we test it, run on these 4 repos to compare outputs:

| Repo | What we already know (from existing memory/docs) | Test |
|---|---|---|
| Sonata (MIT music player, `project_music_research`) | Reference player for ZAO Music Phase 2 | Repo Read (1 credit) - does GitPitcher catch the licensing + stack we already mapped? |
| Herocast (AGPL Farcaster client, `project_music_research`) | License risk for fork | Audit (5 credits) - does it flag AGPL implication? |
| `21st-dev/1code` (5,494 stars, Doc 549d) | "Orchestration layer for coding agents" | Build Pack (6 credits) - does it summarise it well enough we don't need a separate research session? |

Total: 12 credits, fits free tier exactly. After the test, decide: useful enough to subscribe, or stick with our skill stack?

## Risks + Caveats

- **Beta product.** Public beta per Product Hunt + landing. Pricing or feature scope can shift.
- **No GitHub link found** for an open-source version - it's a hosted SaaS, full lock-in.
- **Output quality unknown** until we run the test above.
- **Private repo support requires Pro + GitHub App grant** - extra trust burden if we point it at any ZAO private repo.
- **Pricing conflict noted.** Initial fetch reported "Audit 2, Build 3"; pricing page detail says "Audit 5, Build 6". Trust the pricing page (more recent / more specific).

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Sign up for GitPitcher free tier | Zaal | One-shot | Optional, this week |
| Run the 4-repo test plan above (Sonata, Herocast, 1code) | Zaal | Spike | Optional, this week |
| If outputs beat our `codebase-onboarding` + `prp-plan` skills, document specific wins in this doc | Zaal | Update doc | Conditional |
| If outputs are at-parity or worse, mark this doc `status: research-complete` and skip subscription | Zaal | n/a | n/a |
| Reconsider for ZAO Stock contributor onboarding flow if/when that exists | n/a | Tracked | 2026 Q3+ |

## Also See

- [Doc 548 - Lazer Mini Apps CLI](../../farcaster/548-lazer-miniapps-cli-evaluation/) - sister scaffold-tier eval
- [Doc 549 - 21st.dev hub](../549-21st-dev-component-platform/) - sister component-tier eval
- [Doc 506 - TRAE AI skip](../506-trae-ai-solo-bytedance-coding-agent/) - canon ECC + obra/superpowers stack
- [Doc 508 - Creator infra brief](../508-creator-infra-mini-apps-token-burn-signals-apr25/) - 2026 trend frame

## Sources

- [GitPitcher landing](https://gitpitcher.com/) - product description + integrations list
- [GitPitcher pricing](https://gitpitcher.com/pricing) - Free/Pro/Team tiers verified
- [Product Hunt - GitPitcher](https://www.producthunt.com/products/git-pitcher) - public beta status

## Staleness Notes

Pricing details verified at `/pricing` 2026-04-29. Beta status means features can shift. Re-validate at 2026-05-29 if interest renews.
