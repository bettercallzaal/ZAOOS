---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-17
related-docs: "959, 994, 1182"
original-query: "Evaluate adopting the Reflect anti-sycophancy decision skill for ZAO fleet decision points"
tier: STANDARD
---

# 1213 — Reflect Anti-Sycophancy Decision Skill: Evaluation for ZAO Fleet

> **Source:** `github.com/seldonframe/reflect` (MIT, 98-line version is the reference; the 276-line version lost in blind judging)

## The Skill: 5-Step GATE→LOOK→RESHAPE→ATTACK→CARD

| Step | What it does | Key constraint |
|------|-------------|----------------|
| **GATE** | Reversibility check (Bezos door rule) — if the decision is undoable, go fast; if not, slow down | Skip LOOK/RESHAPE/ATTACK for reversible calls |
| **LOOK** | Read git history, real numbers, existing code BEFORE forming an opinion | Never form an opinion from memory alone |
| **RESHAPE** | Invent option C — a cheaper/simpler alternative the user did not name | Not just A vs. B; challenge the framing |
| **ATTACK** | Adversarially kill your own answer + spawn a second agent that gets facts but NOT your opinion | Cold-second-agent independence is the load-bearing part |
| **CARD** | Answer-first + confidence number + "THIS FLIPS IF" clause | The flip clause is the key — surfaces the falsifiable condition |

**Author's meta-finding:** the 98-line lean version beat the 276-line version in blind judging. Less scaffolding = cleaner adversarial pressure.

---

## Key Decision

| Question | Verdict | Rationale |
|----------|---------|-----------|
| **Adopt Reflect for ZAO fleet?** | YES — BORROW-PATTERNS, not import | ZAO already has critic/adversarial-verify in hermes and guardrail.yml. Reflect adds three discrete things not yet in-fleet: (1) the CARD's "THIS FLIPS IF" clause, (2) option-C RESHAPE step, (3) explicit reversibility gate before spending tokens. Don't adopt as a dependency — extract the 3 missing pieces into ZOE's brief/reflect pass and ZOL's work-router. |
| **ATTACK cold-second-agent** | IMPLEMENT — already partially in hermes | Hermes critic pattern gets the facts but not the main agent's opinion? Not fully — hermes critics currently see the main answer. Tighten: for consequential calls (task routing, deploy decisions, budget spend), spawn a second agent with context but with main agent's conclusion redacted. |
| **"THIS FLIPS IF" card** | IMPLEMENT immediately — zero cost | Add to ZOE morning brief and any agent decision output. Format: `Confidence: 7/10. THIS FLIPS IF: [the one thing that would change this answer]`. ZOE already formats decision blocks — add one field. |
| **GATE reversibility check** | IMPLEMENT as a pre-check heuristic | Before any fleet agent spends >30min or makes an outbound/gated call, GATE: "Is this reversible in <5min? If yes → proceed. If no → checkpoint or wait for Zaal." This is the directive's existing DECISION NEEDED gate, formalized. |
| **RESHAPE option-C** | IMPLEMENT for research docs and design PRs | When scoping an implementation, require one "cheaper option C" that is half the effort. Already implicit in some ZAO decisions; make it explicit for design PRs. |

---

## ZAO Fit: What Reflects Maps Onto

| Reflect Step | ZAO Equivalent | Gap |
|-------------|----------------|-----|
| GATE | Directive DECISION NEEDED gate | Not explicitly reversibility-scored — add that |
| LOOK | "Read git before forming opinion" lesson (LESSONS block) | Informal lesson, not enforced — formalize as a pre-step |
| RESHAPE | ad-hoc in some PRs | Not required — add to design PR template |
| ATTACK cold second agent | hermes critic agents | Critics see main answer; should be blinded for consequential calls |
| CARD "THIS FLIPS IF" | absent | Add to all decision outputs |

The CARD's "THIS FLIPS IF" clause is the highest-leverage missing piece. It forces falsifiability — the agent must name the one condition that would flip its answer, which surfaces hidden assumptions and makes it easy for Zaal to probe without getting sycophantic backpedaling.

---

## Implementation Plan

### Tier 1: ZOE brief + decision blocks (30-min change)

Add to ZOE's existing decision block format in `bot/src/zoe/`:

```
Confidence: [N]/10
THIS FLIPS IF: [condition]
Option C considered: [brief description or "N/A - reversible call"]
```

Applicable to: morning brief action items, cockpit assessments, task recommendations.

### Tier 2: ATTACK cold-second-agent for consequential calls (1-2 hours)

In `bot/src/hermes/` critics: for decisions tagged `consequential: true`, spawn a second critic that receives full context but has main-agent conclusion redacted. This makes the second opinion genuinely independent.

Consequential = any call that is gated (deploy/keys/outbound/spend/on-chain) or irreversible (PR merges that delete code, production env flips).

### Tier 3: GATE reversibility check in loop directive (5-min change)

Add to `coc-directive.md` STANDING SELF-IMPROVEMENT:

> Before any action > 30min or gated (deploy/keys/outbound/spend/on-chain): GATE — reversible in <5min? If yes, proceed. If no, checkpoint.

This formalizes what the DECISION NEEDED rule already implies.

---

## What NOT to Adopt

- **The full 98-line skill verbatim.** ZAO already has its own claude.md + directive patterns. Grafting another prompt layer adds noise. Extract the 3 pieces above; don't add a new import.
- **LOOK as a mandatory pre-step for every call.** LOOK is already the loop pattern (verify git, read current state). It's implicit. Only formalize for design decisions, not every commit.
- **The 276-line version.** The author's own blind judging showed the lean version wins. Lean = right.

---

## Next Actions

| Action | Owner | Effort | By When |
|--------|-------|--------|---------|
| Add "THIS FLIPS IF" + confidence to ZOE decision block format | agent | 30min | next sprint |
| Formalize GATE reversibility heuristic in loop directives | agent | 5min | next directive PR |
| Tighten hermes critics: redact main conclusion for consequential calls | agent | 1h | next bot sprint |
| Add option-C RESHAPE requirement to design PR template | agent | 15min | next ZAOOS PR template update |

---

## Also See

- [Doc 994](../994-loop-engineering-taxonomy/) — Loop engineering taxonomy; adversarial patterns in ZAO loops
- [Doc 1182](../1182-zao-agent-registry/) — ZAO agent registry; which agents have critic/adversarial roles
- Source: `github.com/seldonframe/reflect` — MIT license, reference the 98-line version

## Sources

| Source | Fetch Status | Notes |
|--------|--------------|-------|
| r/claudeskills post 2026-07-16 | VIA BOARD NOTES | Full 5-step summary + author's blind-judging finding in board task notes |
| github.com/seldonframe/reflect | NOT FETCHED | MIT license per board notes; 98-line and 276-line versions exist |
| ZAO hermes critic pattern | FULL | `bot/src/hermes/` — critics run but currently see main-agent conclusions |
| ZAO guardrail.yml | FULL | Existing adversarial-verify CI checks for code PRs |
