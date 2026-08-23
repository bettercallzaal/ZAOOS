---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: "2366, 2282, 2349, 2212"
original-query: "Brandon: give this whole thing to ZOL, I want its independent derivation before I contaminate it with our architecture - three FALSE GREEN failures, derive the truth lifecycle"
tier: STANDARD
---

# 2367 - FALSE GREEN: the evidence base, and why this must not go to ZOL

> **Goal:** Brandon sent a 13-part architectural brief asking for ZOL's
> *independent* derivation of a truth-state model from three FALSE GREEN
> incidents. Before anyone derives anything: verify the three incidents against
> source, and answer whether ZOL is the right derivator. Both answers change the
> task.

**This doc deliberately does NOT contain the 13-part derivation.** Producing it
here would violate the one constraint Brandon put on it. See "Why this cannot be
answered by this session" below.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **DO NOT route this to ZOL.** | ZOL is a Farcaster *posting persona* - `zol-daily.js` drafts casts, `zol-reply.js` drafts graph-aware mention replies. Cast-length output, persona-tuned, on OpenRouter cheap models. It has no architecture-reasoning capability and no repo access. Feeding it a 13-part systems brief produces a cast, not a derivation. |
| 2 | **This session cannot supply the "independent derivation" either.** | Brandon's constraint is *"before I contaminate it with our architecture."* This session has spent the day inside ZAO's architecture - Heart, receipts, the organism model, `.claude/rules`. It is the single most contaminated available source. Any model it produces would be ZAO's model wearing a derivation's clothes. |
| 3 | **Brandon's incident 3 does not match the record - resolve before deriving.** | He states Jim's response "sat unread for six days" with a poller re-fetching "144 times." The recorded instance (`first-handler-wins.md`) is **six HOURS**, ~6 re-sends, on 2026-08-08. A 24x discrepancy. Either he means an unrecorded newer incident, or the premise is inflated. **Do not build a model on an unverified magnitude.** |
| 4 | **A FOURTH false-green exists that Brandon does not have, and it is live right now.** | `farscout` heartbeats `up` while at 0.0% CPU with zero output for 30 days (measured 2026-08-22, PR #3241). Process liveness standing in for work. |
| 5 | **The mechanism for incident 1 is one line, still in production, and I found it.** | `~/fleet-heartbeat/heartbeat.sh:30` - `curl -s -o /dev/null` with no `-f` and no status check. Three of Brandon's layers collapse into that single line. This is the most valuable artifact in this doc and it is VERIFIED, not theorised. |
| 6 | **His core distinction is correct and is empirically supported by our own source.** | Transport ack != application ack != proof of effect. Every incident below is one of those boundaries being silently crossed. The premise survives; two of its details do not. |

## VERIFIED - read from source or measured today

### V1. Incident 1's mechanism, still live: `heartbeat.sh:30`

Read on the VPS 2026-08-22:

```bash
curl -s -o /dev/null --max-time 8 -X POST "$BOARD/api/v1/bots/heartbeat" \
```

`-s -o /dev/null`, **no `-f`, no `-w '%{http_code}'`, no status branch.** curl
exits 0 on a 401 exactly as on a 200. So the chain is:

| Layer | What it actually proves | What it is read as |
|---|---|---|
| curl exit 0 | the process ran | "the POST worked" |
| systemd `Finished` | the script exited 0 | "the heartbeat succeeded" |
| a row in `bot_heartbeats` | *something* wrote a row | "the bot is healthy" |

`project_vps_consolidation` (memory) independently records the precondition:
*"REMAINING manual step: paste `~/fleet-bot-tokens-seed.sql` ... Until then
heartbeats 401."* So there was a documented window where every POST 401'd and
every layer above still read green. **This is Brandon's incident 1, and the
defect is one missing `-f`.**

`journalctl` confirms the green: `fleet-heartbeat.service` logs
`Starting`/`Finished` every 60s, and `Finished` is emitted regardless of HTTP
status.

### V2. Incident 2 confirmed - but the mechanism is different from the other two

`vanishing-dependencies.md`: `zao-vault-log` *"had also been writing 'nothing
merged' for four days while **158 PRs merged**."*

**The distinction matters for the model.** This was not a transport/effect
confusion. The script had **vanished** (never git-tracked). The cron was dead.
Nothing wrote anything - and **an absent measurement was read as a measurement
of zero.** That is a different failure class from V1: not "green stood in for
red," but "silence stood in for data."

Any truth-state model that only covers message lifecycles will miss this
entirely, because there was no message. This is the strongest argument in this
doc that Brandon's proposed `SENT → DELIVERED → ...` chain is **necessary but
not sufficient** - it is message-shaped, and V2 is observer-shaped.

### V3. Incident 3 - real, but six HOURS, not six days

`first-handler-wins.md`: *"`bus-poll.py` re-sent a 2000-word message every hour
for six hours because it polls `status=new` and deliberately never marks read -
nothing owned the 'I already told you this' state."*

Brandon's diagnosis of the *mechanism* is exactly right and his phrasing is
sharper than ours: nothing advanced the state. But the magnitude in his brief
(six days, 144 fetches) is 24x the recorded instance. Searched
`.claude/rules/`, `research/` for a Jim-specific six-day unread incident and
**did not find one** - which is an absence claim from a bounded search, so it is
"not found," not "does not exist." **Ask Brandon which incident he means.**

### V4. NEW - a fourth false green, live, that Brandon does not have

Measured on the VPS 2026-08-22 (shipped as PR #3241):

| Signal | farscout |
|---|---|
| systemd | `active (running)` |
| uptime | 35 days |
| CPU | **0.0%** |
| journald entries | none |
| files written / 30d | **zero** |
| `bot_heartbeats` | **`up`**, fresh within the minute |

And it was formally retired by decision two months earlier (doc 882,
2026-06-20). So: a process that should not exist, doing nothing, reporting
healthy, for 30+ days. **Liveness standing in for work** - a third distinct
class, separate from V1 (transport standing in for effect) and V2 (silence
standing in for data).

### V5. A fifth, adjacent, found while checking whether ZOL could take this task

ZOL's `daily.log` on the Pi currently contains drafts naming **"Pixel Drift",
"Aetherstream", "AlgoRhythms", "Echoes of the Arcade", "Circuits Collide"** -
artists and tracks attributed to real ZAO events (COC Concertz #3, "ZAOstock
'27"). Grep of `research/` and `src/`: **zero hits for all five**, while a
control (Cannon Jones, a real mentor) hits immediately.

**Scope honesty:** those specific drafts are logged `DRAFTED (not posted)`, and
a sample of actual `POSTED:` lines shows real people (Tom Fellenz, Cannon Jones,
Clejan, Aporkalypse). **No fabricated cast is confirmed to have posted.** But
the guards in the code path are `tooSimilar()` (word-overlap) and a
recent-casts dedupe - **similarity guards, not truth guards.** A fabrication
that happens to be novel enough passes them. Recorded as a live risk on a
public auto-posting account, not as a confirmed incident.

This is a false green of the *content* layer: the output passed every gate the
system has (green) while being false.

## INFERRED - reasoning from the verified set, not measured

**The three incidents are not one problem. They are three, and collapsing them
loses the most dangerous one.** Brandon's instruction is to "treat these as ONE
systems problem." The verified mechanisms resist that:

| Class | What silently stands in for what | Incident |
|---|---|---|
| **Transport-for-effect** | exit 0 / 200 stands in for "the intended change happened" | V1 |
| **Silence-for-data** | an absent observer's quiet stands in for a measured zero | V2 |
| **Liveness-for-work** | a process existing stands in for it doing something | V4 |
| **State-never-advances** | repeated observation stands in for progress | V3 |
| **Passed-guards-for-true** | surviving the checks stands in for being correct | V5 |

A single lifecycle chain (`SENT → DELIVERED → ... → EFFECT`) models V1 and V3
well. It does not naturally express V2 (no event was ever emitted) or V5 (the
event was fine; the *content* was false). **The unifying property is not a
lifecycle - it is that in every case a CHEAPER-TO-OBTAIN signal was accepted as
proof of a MORE-EXPENSIVE-TO-OBTAIN fact.** That framing covers all five and is
strictly more general than the state chain.

This is the same finding as `state-claims.md` ("the proxy always wins on effort,
and it is wrong exactly when the answer matters") - which means ZAO derived the
general law before Brandon's incidents, and the incidents are instances of it.
Worth telling him: **we already have the theory; what we lack is enforcement.**

**On the proposed invariant** - *"nothing may be promoted to a higher truth
state without evidence proving the transition"* - it is sound but under-specified
in one way that V2 exposes: it governs *promotion*, and V2 involved **no
transition at all**. An invariant about transitions cannot catch a system that
stopped emitting. That needs a liveness-of-the-observer clause, i.e. the thing
`vanishing-dependencies.md` rule 4 already says: absence must be reported
loudly, never inferred from silence.

## PROPOSED - not built, not verified, offered for the derivation

- The smallest useful enforcement is probably **not** a new organism-level
  monitor but a **rule that every health signal must name what it measured**,
  plus a `-f`-equivalent audit across every `curl` in the estate. V1 was one
  flag. Cheap, and it would have prevented the largest incident.
- A Truth/Attention Monitor is **plausibly warranted but not yet justified by
  this evidence** - three of five incidents were caught by a human noticing, and
  two by an audit that already exists (doc 2282's write-not-liveness test).
  Extending that existing test to systemd (done today) caught V4. **Prefer
  extending the existing audit over building a new organ** until an incident
  appears that the extended audit provably cannot catch.
- The reverse-prompt reflex is the most interesting part of Brandon's brief and
  the least evidenced. Note that the single question he wants the system to ask
  - *"if the poller fetched the same message 144 times, why has state never
  advanced?"* - is answerable by a **counter with a threshold**, not by a
  reasoning engine. Before building cognition, check how many of his example
  questions reduce to a counter, a timestamp diff, or a set difference. **Doc
  2366 (shipped today) is the anti-noise half of this and should be read first**
  - it measured 429 messages with 0 actionable, which is what happens when a
  system generates signal without an information-value gate.

## Why this cannot be answered by this session

Brandon's constraint is explicit: an *independent* derivation, uncontaminated by
our architecture. This session has spent the day inside that architecture. It
also already holds strong priors (the five-class taxonomy above) that would
anchor any "derivation" it produced.

**Recommended routing instead** (Zaal's call):

1. **A fresh agent with no ZAO context**, given only Brandon's brief and the
   four verified incidents stripped of our vocabulary - no "organism," no
   "bloodstream," no `.claude/rules` names. That is what "independent" requires.
2. Then a **second pass** that compares its derivation against ZAO's existing
   answer (`state-claims.md`, `silent-failure-guard.md`, doc 2366). Convergence
   is evidence; divergence is the interesting part.
3. **Not ZOL**, for the reasons in Decision 1.

## Adversarial note on the premise

Brandon asked to be told if the premise is wrong. Two corrections, one addition:

- **Incident 3's magnitude is 24x off** the only record we have (V3).
- **"Treat these as ONE systems problem" is the weakest instruction in the
  brief.** The verified mechanisms are genuinely different classes; the honest
  unification is at a higher level (cheap-proxy-for-expensive-fact), and forcing
  a single lifecycle model onto them would design out V2 and V5.
- **He is missing two incidents** (V4, V5), both live, one on a public account.


## THE INDEPENDENT DERIVATION IS IN - and it converges with measurement

Commissioned and returned 2026-08-22. Verbatim at
[`INDEPENDENT-DERIVATION.md`](./INDEPENDENT-DERIVATION.md); the exact prompt it
received at [`DERIVATION-BRIEF.md`](./DERIVATION-BRIEF.md).

**Independence is verified, not asserted.** It ran in a neutral directory with
no `CLAUDE.md` and no `.claude/rules` resolving from it (checked by walking the
parent chain before dispatch). The brief was scrubbed to zero occurrences of
ZAO/ZOE/ZOL/organism/bloodstream/Brandon/Zaal/rule-names, and its 325-line
output contains **zero** of those terms coming back. It made 2 tool calls (read
the brief, write the derivation) - correct for a closed reasoning task, and
worth stating because two earlier subagents this session fabricated output while
making zero real calls.

### Its headline finding, and why it is credible

> **"All five diagnostic questions reduce to arithmetic, not reasoning."**

| Incident | Its derived check | Type |
|---|---|---|
| A | `compare(http_status, 200)` | equality |
| B | `exists(measurement_file)` | existence |
| C | `count(queue where new AND id not in delivered)` | set difference |
| D | `compare(recent_logs + cpu + files_written, >0)` | comparison |
| E | `forall(entities, exists_in_corpus)` | existence |

**Three of those five are checks this session actually ran today, and each one
caught its incident:** the missing `-f` at `heartbeat.sh:30` (A), the
logs+cpu+files test that caught farscout (D), and the corpus grep that caught
ZOL's five fabricated entities (E). An uncontaminated agent derived from
evidence alone the same checks a contaminated one had already validated by
execution. That convergence is the strongest evidence in this doc that the model
is right.

### Where it AGREES with this doc (derived separately)

- Transport stays simple; verification belongs in business logic.
- The nine-stage lifecycle is too long and "creates false checkpoints."
- Do not build automatic question-generation or question-pattern promotion.

### Where it DISAGREES with this doc - the useful part

- **This doc argued against a new monitor** (prefer extending the existing
  write-not-liveness audit). **It argues a narrow monitor IS warranted** - but
  defines it as "five arithmetic operations: two equality comparisons, two
  existence checks, one set difference," explicitly *not* a reasoning engine.
  The disagreement is smaller than it looks and resolves in its favour: five
  cheap assertions on a timer is closer to a cron than an organ, which is what
  doc 2368's null hypothesis proposed anyway.
- **On Brandon's "treat these as ONE problem":** this doc said no. It says
  **"conceptually ONE, operationally SEVERAL"** - one principle (verify every
  report), five different verification strategies. That is a better answer than
  either of ours and is adopted here.

### Its verdict on the reverse-prompt reflex

Against. Not because questioning is bad, but because the specific questions
Brandon wants generated are arithmetic, so a reasoning layer would be paying
LLM cost for what a comparison operator already answers - and because
"questions that fire frequently are usually high-precision failures or
low-precision false alarms," so promoting patterns by firing-frequency selects
for noise. **Doc 2366 measured that exact failure independently: 429 messages,
0 actionable.**

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ask Brandon which Jim incident he means - six days/144 fetches does not match our record of six hours | @Zaal | Question | 2026-08-23 |
| Decide the derivator: fresh uncontaminated agent (recommended) vs something else. NOT ZOL | @Zaal | Decision | 2026-08-23 |
| Add a truth guard to ZOL's draft path - current guards check similarity, not whether the artist exists | @Zaal (Claude) | Fix | 2026-08-26 |
| Audit every `curl` in the estate for missing `-f`/status checks - V1 was one flag | @Zaal (Claude) | Audit | 2026-08-27 |

## Sources

- [FULL - read on the VPS 2026-08-22] `~/fleet-heartbeat/heartbeat.sh` line 30 (the unchecked curl), `journalctl --user -u fleet-heartbeat.service`, `systemctl --user is-active fleet-heartbeat.timer`.
- [FULL - measured on the VPS 2026-08-22] farscout: `systemctl` state, MainPID CPU/uptime via `ps`, `journalctl` (empty), `find -newermt` (zero files/30d), `bot_heartbeats` row via Supabase MCP.
- [FULL - read on the Pi 2026-08-22] `~/zol/daily.log` (fabricated-artist drafts + real POSTED lines), `~/zol/farcaster-agent/` script layout.
- [FULL - read on disk] `.claude/rules/first-handler-wins.md` (the six-hour bus-poll instance), `.claude/rules/vanishing-dependencies.md` (158 PRs / four days), `.claude/rules/state-claims.md` (the cheap-proxy law), memory `project_vps_consolidation` (the "until then heartbeats 401" precondition), memory `project_zol_farcaster_agent` (ZOL's actual capability).
- [FULL - grep of research/ and src/] zero hits for the five drafted artist/track names; control hit for Cannon Jones.
- [NOT FOUND - bounded search of `.claude/rules/` and `research/`] no record of a six-day Jim unread incident. Absence from a bounded search, not proof of non-existence.
