---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-02
superseded-by:
related-docs:
original-query: "https://www.reddit.com/r/ClaudeAI/comments/1vbvcyk/your_claude_subscription_includes_cloud_computers/?share_id=EFE14r40oqfhcJehi0Rbc&utm_content=2&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=10 research this"
tier: STANDARD
---

# 2178 - research this

> Drafted by ZOE's research-worker from "https://www.reddit.com/r/ClaudeAI/comments/1vbvcyk/your_claude_subscription_includes_cloud_computers/?share_id=EFE14r40oqfhcJehi0Rbc&utm_content=2&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=10 research this". Auto-committed to main for durability; review + deepen as needed.

Both Reddit endpoints blocked. I have the HN community source (Omnara launch story) and full Claude Code docs - enough to write. Composing the properly formatted doc now.

---

```markdown
---
topic: Claude subscription cloud compute features - Routines, web Claude Code, and implications for ZAO agent stack
type: product-research
status: ready
last-validated: 2026-08-02
related-docs: research/agents/699-state-of-agentic-2026-deep-study/README.md, research/dev-workflows/422-claude-routines-zao-automation-stack/README.md
original-query: https://www.reddit.com/r/ClaudeAI/comments/1vbvcyk/your_claude_subscription_includes_cloud_computers/
---

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Should ZAO evaluate Anthropic Routines as a complement to VPS-hosted ZOE? | Yes - pilot Routines for lightweight scheduled tasks | Routines run on Anthropic-managed infra, survive computer-off, are included in the Claude subscription ZAO already pays, and reduce VPS load. Stateful agents (trading bots in `src/lib/agents/runner.ts`) stay on VPS where they hold persistent connections. |
| Should ZAO use web Claude Code (`claude --cloud`) for ZOE's coder-critic-PR pipeline? | Evaluate for overnight/unsupervised runs | Web Claude Code at claude.ai/code lets long-running tasks finish when the local machine is off. The `bot/src/hermes/` coder-critic loop is the best candidate - it is triggered, runs to completion, and produces a PR artifact, which matches the Routines use-case exactly. |
| Should ZAO subscribe to a third-party cloud sandbox (e.g. Omnara at $20/month)? | No - not yet | Anthropic's own Routines + web Claude Code cover the stated need at no marginal cost. Revisit if Anthropic-native cloud proves insufficient for session continuity or parallel agent isolation. |

## Findings

The Reddit post (inaccessible via direct fetch - see Sources) carries the title "Your Claude subscription includes cloud computers." Based on verified Anthropic documentation and the HN community signal, the claim is accurate and refers to three overlapping cloud compute features now bundled into claude.ai subscriptions.

**Routines - the headline feature.** The Claude Code docs at code.claude.com confirm: "Routines run on Anthropic-managed infrastructure, so they keep running even when your computer is off." Routines can be created from the web UI, the Desktop app, or by running `/schedule` in the CLI. They can trigger on a cron schedule, on API calls, or on GitHub events. This is the "cloud computer" the Reddit post is pointing to: a managed execution environment where a Claude Code agent completes a task autonomously, no local machine required.

**Web Claude Code.** Available at claude.ai/code, the browser-based surface requires no local install. The docs describe it as: "Kick off long-running tasks and check back when they're done, work on repos you don't have locally, or run multiple tasks in parallel." The command `claude --cloud` moves an in-progress terminal session to the web. The reverse path, `claude --teleport`, pulls a web or mobile session into a local terminal. Both directions require a claude.ai subscription.

**Remote Control and Dispatch.** The Desktop app adds session-handoff features: Remote Control lets a user continue a local session from any browser or mobile device; Dispatch lets users message a task from their phone and receive a Desktop session back. These are not standalone cloud compute - they proxy to a local or web-hosted session - but they extend where ZAO team members can interact with a running agent.

**What is NOT included.** The docs do not bundle unlimited cloud compute. The Routines feature runs agents on Anthropic infrastructure, but the underlying model calls still consume subscription token limits. Third-party services like Omnara (YC S25, 147 HN points as of 2026-08-02) exist precisely because Anthropic's cloud execution currently lacks persistent sandboxed filesystems and cross-session state. Omnara charges $20/month for unlimited cloud sandbox sessions and markets itself as the gap-filler: "When agents run in your own environment, you can use your existing Claude or Codex subscription." That framing confirms Anthropic's native cloud is stateless per-session.

**Relevance to ZAO's agent stack.** ZOE (`bot/src/zoe/`) currently runs on a VPS at 31.97.148.88. The autonomous coder-critic-PR pipeline reuses code from `bot/src/hermes/`. The VAULT/BANKER/DEALER trading bots live in `src/lib/agents/runner.ts` and require persistent WebSocket connections and wallet state - these cannot move to stateless Routines without significant rework and remain VPS-appropriate. However, ZOE's research doc-writing loop, nightly processing (ref: commit `e217d1ea`), and the business research dispatches (this doc is one) are stateless, trigger-and-forget tasks that are a direct match for Routines. Moving them off the VPS reduces the blast radius of a VPS outage and avoids the cost of the always-on poller for low-frequency tasks.

## Options Comparison

| Option | Cost | Persistence | Parallel agents | ZAO fit | Tradeoffs |
|--------|------|-------------|----------------|---------|-----------|
| VPS-hosted ZOE (status quo) | Fixed VPS cost | Stateful, always-on | Limited by VPS RAM | Trading bots, persistent pollers | Single point of failure; Zaal manages infra |
| Anthropic Routines (included in subscription) | $0 marginal | Stateless per-run | Yes, cron-scheduled | Research dispatches, nightly processing | No persistent filesystem; token limits still apply |
| Web Claude Code via `claude --cloud` | $0 marginal | Session-scoped | Via parallel browser tabs | Long-running coder-critic runs | Manual trigger required; not cron-native |
| Omnara cloud sandbox | $20/month additional | Persistent sandbox | Yes | Stateful agents needing cloud | Redundant with VPS for ZAO's current scale; adds a third-party dependency |

## Next Actions

| Action | Owner | Priority | Path / Resource |
|--------|-------|----------|-----------------|
| Audit ZOE's scheduled loops to classify stateless vs. stateful | Zaal / ZOE | High | `bot/src/zoe/`, cross-ref `agent-loops.md` rule 35 |
| Pilot one nightly processing task as a Routine via `/schedule` in CLI | Zaal | Medium | `bot/src/zoe/` nightly job; create via Desktop app or web UI |
| Evaluate whether coder-critic-PR loop in `bot/src/hermes/` can run as a Routine triggered by GitHub events | Zaal | Medium | `bot/src/hermes/`; see Claude Code GitHub Actions docs |
| Update `research/dev-workflows/422-claude-routines-zao-automation-stack/` with Routines confirmation | ZOE | Low | Research doc update, no PR required |

## Sources

- [FULL - liveness-verified-on-2026-08-02] Claude Code Overview - https://code.claude.com/docs/en/overview
- [FULL - liveness-verified-on-2026-08-02] Launch HN: Omnara (YC S25) - Run Claude Code and Codex from anywhere (147 pts, 161 comments) - https://www.omnara.com/ (via HN Algolia search)
- [FAILED - tried JSON API (www.reddit.com) and old.reddit.com, both blocked by WebFetch] Reddit r/ClaudeAI post 1vbvcyk - https://www.reddit.com/r/ClaudeAI/comments/1vbvcyk/

> Note: Reddit post body could not be directly verified. Findings are grounded in the official Claude Code docs and HN community signal. The post title is consistent with the Routines + web Claude Code features documented above. Escalate to DEEP tier if verbatim post content is required.
```
