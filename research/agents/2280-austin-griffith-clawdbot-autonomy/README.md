---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 473, 2258, 2271, 2275
original-query: "/zao-research Austin Griffith and clawdbot. Who he is and what he ships, what clawdbot IS in his hands, how it is architected, what it automates end to end, and specifically what he lets it do UNATTENDED versus what he gates. Then the ZAO lens: what we could adopt, what we ALREADY have, and where his model is more autonomous than ours and why he can afford that."
tier: STANDARD
---

# 2280 - Austin Griffith's clawdbot: the gate list, and the two things it tells us about our own bill

> **Goal:** Extract Austin Griffith's actual unattended-versus-gated boundary, and say where ZAO could widen without buying his blast radius.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **VERIFY our `-p` usage against the bill before anything else.** | `clawd-harness`'s README states that as of 2026-06-15, `-p`/headless draws from a **separate metered Agent SDK credit pool at full API rates**, while the interactive TUI stays on the Max subscription. **ZAO uses `-p`** at `bot/src/hermes/claude-cli.ts:122`, called from at least 8 ZOE modules. If his claim holds, that is a second bill nobody has measured |
| 2 | **ADOPT the auth-once-then-drive pattern.** | `clawd-scheduler` launches Chrome with a profile the human **logged into once, manually**, then drives it headless. The human does authentication; the agent does work. That is exactly the shape of our stalled `reddit.env` |
| 3 | **ADOPT the disposable-instance split.** | `agent-sandbox` keeps orchestration in git and puts every agent instance in a **gitignored** `agents/` dir because instances are "stateful, secret-bearing, and disposable". Structural secret hygiene, not a scan |
| 4 | **DO NOT assume his code is reusable. 55 of 100 of his repos have NO license.** | All-rights-reserved by default. Including `fifth-builder`, which `.claude/rules/secret-hygiene.md` was copied from |
| 5 | **DO NOT copy his money-path autonomy. Copy his money-path GATES.** | Before a Base mainnet deploy he ran **three independent audits**, capped the contract's own parameters, and used `Ownable2Step`. His autonomy is bought with bounded blast radius, not with supervision |
| 6 | **We do not have a gap in fix-PR tooling.** | `bot/src/hermes/` already holds `coder.ts`, `critic.ts`, `claude-cli.ts`, `codex-cli.ts`, `claude-health.ts`. Checked before claiming |

## Identity, verified rather than assumed

The brief asked whether ATG is Austin T Griffith. Close, but the useful answer is different:

| Account | What it is |
|---|---|
| `austintgriffith` | **Austin Griffith, the human.** Bio "builder on Ethereum", `austingriffith.com`, 2,681 followers, account created **2012-10-25**, 208 public repos |
| `clawdbotatg` | **Not a person.** Self-describes as *"AI agent with a wallet, building onchain apps and improving the tools to build them."* Company `@BuidlGuidl`, location Fort Collins CO, created **2026-01-27**, **313 public repos**, 127 followers |

So `clawdbotatg` is an **agent account operating in his orbit** - BuidlGuidl is his org, Fort Collins is where he is based, and "atg" tracks his initials. The account itself claims to be the agent, not the man.

**313 public repos in under seven months from an agent account is the autonomy signal**, and it is the single most concrete thing in this research. Four were pushed on the day this was written.

### What he actually ships, confirmed

Not recited - fetched:

| Project | Reality |
|---|---|
| Scaffold-ETH 2 | `scaffold-eth/scaffold-eth-2`, **2,041 stars, 1,360 forks, MIT**, pushed 2026-07-29. Owned by the **org**, not his personal account |
| SpeedRunEthereum | ships as `scaffold-eth/se-2-challenges`, 207 stars, *"SpeedRunEthereum challenges (Powered by Scaffold-ETH 2)"* |
| BuidlGuidl | org since **2018-08-13**, 130 public repos |

The org-not-personal detail matters for how we cite him.

## The gate list - the part Zaal actually asked for

Read out of the repos rather than inferred.

### Unattended

- **Repo creation and iteration at volume.** 313 repos, several pushed daily. Doc 473 recorded the same pattern in April as public `leftclaw-service-job-39 … job-66` repos, one per job - each an artifact of an autonomous ship.
- **Browser pipelines on a pre-authenticated profile.** `clawd-scheduler` walks: resolve guest handle -> find/create their live room -> kick off AI research -> download pfp -> generate and publish the episode card -> write the room link back to the calendar -> schedule the YouTube broadcast.
- **Research, content, scheduling.** `clawd-research`, `clawd-scribe`, `clawd-video-chat`, all currently active.

### Gated

1. **Authentication is human, once, manually.** `clawd-scheduler` *"launches Chrome with a profile you own (logged in once, manually)"*, with profiles gitignored because they hold live session cookies. The agent never authenticates; it inherits a session.
2. **Every write and judgment step inside an otherwise-automatic pipeline.** Its README: *"One command walks the whole pipeline, **gating every write/judgment step**."* The pipeline is one command and still gated internally - autonomy of sequencing, not of consequence.
3. **Money and on-chain, gated by audits rather than by a person watching.** `clawd-intern` deployed to Base mainnet on 2026-08-09, and its audit trail is three independent passes: One Dollar Audit job 572, then the ethskills evm-audit pipeline (0C/0H/1M, the medium tracked as issue #1), then a second multi-agent audit (0C/1H/3M/2L).
4. **The contract gates itself.** `gainCapBps 5000` caps the payout at +50%, the payout **streams linearly over 30 days**, it pays in the same token so *"a pump that collapses collapses their own payout"*, and ownership is `Ownable2Step` and explicitly *"transferable to a Safe later"*.

### The failure that produced the discipline

We already learned from this once. `.claude/rules/secret-hygiene.md` opens by naming it: copied from `clawdbotatg/fifth-builder` *"after a documented incident where an agent leaked a deployer private key into `AUDIT_REPORT.md` on a public repo."*

That incident is the origin of the stub-key-on-disk rule, the pre-commit hex-64 scan, and the pre-complete repo scan. His gates are scar tissue, and one of the scars is already ours.

## Why he can afford more autonomy than we can

Not nerve. Structure.

| | clawdbotatg | ZAO |
|---|---|---|
| Blast radius of a bad repo | A 0-star repo on an agent account nobody reads | `bettercallzaal/ZAOOS` is **public**, holds 2,000+ research docs and partner-facing material |
| Blast radius of a bad deploy | Capped by the contract's own parameters | Our irreversible surfaces are outbound to partners and sponsors |
| Who reviews | Automated audits, three of them, independent | A human merge gate (`agent-loops.md` rule 8) |
| Ownership | Sole operator, own wallet, own decisions | A community, sponsors, and a public record |

**The transferable insight: he replaced supervision with bounded consequence.** Where the ceiling is enforced by a contract parameter or a disposable directory, he lets it run. Where it is not, he gates - and his gates are tighter than ours, not looser. Three audits before a mainnet deploy is stricter than anything in `loop-evals.md`.

So the honest answer to "can we widen": **widen where we can bound the consequence in code**, not where we would simply be watching less.

## What we already have - checked, not assumed

| Capability | Ours | Status |
|---|---|---|
| Fix-PR pipeline | `bot/src/hermes/`: `coder.ts`, `critic.ts`, `claude-cli.ts`, `codex-cli.ts`, `claude-health.ts` | Exists. No gap |
| Independent read-only evaluator | `zao-evaluator` + `loop-evals.md` default-FAIL contract | Exists. His three-audit stack is the same idea run in triplicate |
| Lane fleet | doc 2275; `zao-lane`, `lane-send`, `zao-lanes` | Exists |
| Model routing by cost | doc 473 recommended forking `ss-triage-router` in April | **Unverified whether this ever landed** - not claiming either way |
| Auth-once-then-drive | - | **Genuine gap.** `reddit.env` is the live example: three docs have now asked for it |
| Disposable gitignored instance dirs | - | **Genuine gap.** We keep agent state in `~/.zao/` but not with his instances-never-reach-git structure |

## The licensing problem, stated plainly

**Of 100 repos sampled by most-recently-pushed: 55 have NO license, 44 MIT, 1 NOASSERTION.**

No license means all rights reserved. That constrains adoption hard, and it lands on work we have already taken:

- `fifth-builder` - **license: null**, 0 stars, dormant since 2026-04-17. This is the repo `secret-hygiene.md` was copied from.
- `clawd-harness` - license null
- `clawd-scheduler` - license null
- `agent-sandbox` - license null
- `clawd-intern` - **MIT**

To be fair to ourselves: `secret-hygiene.md` **does** name its source in its own header, so attribution is present. What is missing is permission. The right move is not panic - it is to ask him, which is cheap given he publishes openly and we are in the same ecosystem.

**Anything we adopt from the unlicensed repos should be re-derived from the idea, not copied from the file, until that is settled** (`credit-attribution.md`).

## The finding with a number attached to it

`clawd-harness` exists because of a billing distinction, and it explains its own architecture:

> The existing bridges drive `claude -p --output-format stream-json`. Clean, but **as of 2026-06-15 `-p`/headless usage draws from a separate metered Agent SDK credit pool at full API rates**. The **interactive TUI** (`claude` with no `-p`) keeps drawing on your Max subscription - so this runs the real interactive session and mirrors it.

**ZAO drives `-p`.** `bot/src/hermes/claude-cli.ts:122` passes `'-p'` and `--output-format json`, and `callClaudeCli` is imported by at least `reflect.ts`, `task-comment-replies.ts`, `recap.ts`, `workers.ts`, `reflexion.ts`, `concierge.ts`, `scheduler.ts` and `learn.ts`.

**This is a claim, not a verified fact, and it must be treated as one.** It is a practitioner's README, dated, and I did not find Anthropic documentation confirming the credit-pool split. But it is cheap to check against the actual bill and expensive to ignore: `agent-spend.md` measured $1,838 of consumption in 24 hours and attributed it to *turns on the Max plan*. A second, API-rate meter running under the bot would not appear in that analysis at all.

## Findings

1. **`clawdbotatg` is an agent account, not Austin's personal one** - 313 repos in under seven months is the autonomy evidence.
2. **His gate list is: auth is human-once, every write step inside a pipeline is gated, and money is gated by three independent audits plus contract-level caps.**
3. **He is more autonomous than us on artifacts and stricter than us on money.**
4. **He buys autonomy with bounded consequence, not with supervision** - which is the only part that transfers.
5. **55% of his repos are unlicensed**, including the one our secret-hygiene rule came from.
6. **We use `-p`, and he stopped using it for billing reasons** - the highest-value follow-up in this doc.
7. **We already have the fix-PR pipeline and the read-only evaluator.** The real gaps are auth-once-then-drive and disposable instance dirs.

## Also See

- [Doc 473](../473-clawdbotatg-apr21-updates-zoe-openclaw/) - the April pass on the same account, and the source of `secret-hygiene.md`
- [Doc 2258](../2258-agent-spend-turn-economics/) - the spend model this doc's `-p` finding may sit outside of
- [Doc 2271](../2271-peter-skill-graph-loop-adoption/) - the other harness studied this month, and its own gate design
- [Doc 2275](../../dev-workflows/2275-merging-terminals-topic-consolidation/) - the lane fleet referenced above

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Check the Anthropic bill for Agent SDK / API-rate charges separate from Max. Shipped when we know whether `bot/src/hermes/claude-cli.ts:122`'s `-p` is costing API rates. | @Zaal | Manual | 2026-08-16 |
| If it is: evaluate mirroring an interactive session instead of `-p`, the way `clawd-harness` does | @Zaal | Research | 2026-08-22 |
| Ask Austin whether the unlicensed repos may be reused, and under what terms. He is reachable and in-ecosystem | @Zaal | Outbound (gated) | 2026-08-20 |
| Adopt auth-once-then-drive as the standing pattern for credential-blocked work, starting with `reddit.env` | @Zaal | Config | 2026-08-16 |
| Verify whether doc 473's `ss-triage-router` recommendation ever landed in `src/lib/agents/config.ts` | @Zaal | PR | 2026-08-20 |

## Sources

- `gh api users/clawdbotatg` and `users/austintgriffith` - **[FULL]** method: GitHub REST. All identity fields, dates, repo and follower counts verbatim.
- `gh api repos/clawdbotatg/{clawd-harness,clawd-scheduler,agent-sandbox,clawd-intern,fifth-builder}` + their READMEs - **[FULL]** method: `gh api` metadata plus base64-decoded README contents. Every quoted line is from the decoded file.
- License survey - **[FULL]** method: `api.github.com/users/clawdbotatg/repos?sort=pushed&per_page=100`, licenses counted from the JSON. n=100 of 313, sampled by most-recently-pushed, so it is a sample and not the whole estate.
- `scaffold-eth/scaffold-eth-2`, `scaffold-eth/se-2-challenges`, `orgs/BuidlGuidl` - **[FULL]** method: `gh api` / search API.
- `research/agents/473-clawdbotatg-apr21-updates-zoe-openclaw/` and `.claude/rules/secret-hygiene.md` - **[FULL]** method: read from disk.
- `bot/src/hermes/claude-cli.ts` and its callers - **[FULL]** method: grep, file:line cited.
- Austin's posts, streams, and `austingriffith.com` - **[FAILED]** method: not attempted this run. The repo evidence was sufficient for the gate question and I did not want to pad with unfetched sources. His written positions are the obvious next source if this needs deepening.
- Anthropic documentation on an Agent SDK credit pool - **[FAILED]** not located. The `-p` billing claim rests on `clawd-harness`'s README alone and is flagged as unverified throughout.

## Credit

Scaffold-ETH 2 and SpeedRunEthereum are **Austin Griffith** and the **BuidlGuidl** community's, MIT. `clawd-intern` is MIT. `clawd-harness`, `clawd-scheduler`, `agent-sandbox` and `fifth-builder` carry **no license** - the patterns are credited here to `clawdbotatg`, and none of their code is copied into ZAO by this doc. `.claude/rules/secret-hygiene.md` already credits `fifth-builder` in its own header.
