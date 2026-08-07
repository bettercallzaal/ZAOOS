---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-07
superseded-by:
related-docs: "606, 2036, 2245, 2246"
original-query: "https://x.com/nazik2053/status/2082370975132225737?s=46 let's also /zao-research this too"
tier: STANDARD
---

# 2247 - The CONTRA layer: a vault that argues back

> **Goal:** Decide whether to build the contrarian-loop pattern on top of `~/zao-vault`,
> and if so, in what order - given the vault is four days old.

## The idea, in one line

Every second brain ships a **DO layer** - extract, link, surface, dedupe. Almost none
ship a **CONTRA layer**: steelman the counterargument, surface contradictions between
your own notes, and let past-you argue with present-you on a schedule.

The framing that makes it click, from the source:

> "Your notes aren't neutral. They hold several versions of you, each with different
> conclusions. The you from 2023 thought X. The you from six months ago thought the
> opposite. Both are still in there. Neither is talking to the other, because you were
> the only one ever holding the conversation."

And the closing claim, which is the actual thesis:

> "Your best advisor isn't Claude. It's you from eight months ago, still writing in your
> vault, waiting for something to translate what you wrote into a language present-you
> will actually listen to."

## The decision, up front

**Adopt the pattern. Do NOT schedule it yet.** Build the metadata layer now; the
argument layer has nothing to argue with.

This is not caution for its own sake - it is the article's own instruction, and our own
measurement agrees with it. Both are stated below.

## Why "not yet" is the grounded answer

The vault was measured today, 2026-08-07:

| | |
|---|---|
| Markdown notes | **4** |
| `decisions/` before today | 0 (3 written today) |
| `notes/`, `people/`, `projects/` | **0 each** |
| Vault age | started 2026-08-06 |

The author's own sequencing, quoted:

> "Build Loop 1 first. Let the vault fill with claim and assumption metadata for **at
> least three weeks** - the loop needs material to argue against."
>
> "Then Pass 4 (ghost self). This one needs about **three months of history** to feel
> real. Ghost self on a young vault is just guessing."
>
> "Don't schedule everything on day one. **A loop running against three notes will
> hallucinate connections and train you to ignore the output.** Prove each pass by hand,
> then automate."

That last sentence is the same failure we hit twice today, in a different costume. The
surface-map detector flagged 35 routes as `public`, of which the four highest-risk were
all correctly guarded - and a flag that fires 35 times gets ignored on the one that
matters. Then fixing the leaks left three permanently-flagged routes, so we added
`@public-reviewed` specifically so the count could reach zero. **A CONTRA loop over four
notes would manufacture contradictions, and we would learn to skip its output inside a
week.** Same lesson, third time today.

## The two layers, and what ZAO already has

| Pass | What it does | ZAO status |
|---|---|---|
| **DO**: extract, link, surface, dedupe | finds what fits together | **have it** - Bonfire recall, `recall.ts`, 1,275 research docs, the surface map |
| **CONTRA 1**: steelman the counterargument | strongest case against a decision | **not built** |
| **CONTRA 2**: contradiction detection | two of your notes that collide | **not built** |
| **CONTRA 3**: cross-domain analogy | concept from an unrelated field | **not built** |
| **CONTRA 4**: ghost self | past-you debating present-you | **not built**, and needs ~3 months |

The honest read: ZAO's DO layer is unusually strong and its CONTRA layer is empty. That
asymmetry is exactly what the article is about - and it is why the pattern is worth
adopting rather than dismissing as second-brain content.

The one piece we DO have that most people do not: **`agent-loops.md`, `code-restraint.md`,
`anti-fabrication.md` and the rest of `.claude/rules/` are a written record of prior
conclusions.** A contradiction pass over the RULES against a proposed change is a real
CONTRA pass, available today, over a corpus with actual history - unlike the vault.

## The assumption field is the real mechanic

The part worth stealing regardless of scheduling:

> "The assumption field is the unlock. Without it, contradictions look like
> disagreements. With it, they look like arguments about premises. Two notes that seem to
> clash usually rest on different assumptions - make the assumption explicit and the
> argument becomes tractable."

This is cheap and it is the thing that makes everything downstream possible. A decision
note that records **what it assumed** can be checked later against whether the assumption
held. A decision note that records only the conclusion cannot.

The three decision notes written today already carry the reasoning; none names its
assumptions as a separate field. That is the concrete first change.

## Guards, which the article gets right

> "Never auto-merge the contradictions. Two notes that contradict each other aren't
> necessarily wrong. They might be about different contexts, constraints, or phases. A
> steelman is a suggestion, not a verdict. ... The moment you let it auto-resolve, it
> will merge two notes about 'quitting a bad client' that were actually about two
> different clients, and you lose the reasoning that made both right at the time."

This is `agent-loops.md` rule 8 (the human gate) arriving at the same place independently,
and it binds harder here: a CONTRA loop that edits notes could destroy the reasoning it
was built to surface. **Surfaces only. Never rewrites. Never merges.**

Two more that match existing ZAO practice:

- **Model split by job.** "You don't spend the expensive model to check a filename."
  Judgment work on the strong model, tagging and parsing on the cheap one - the ZAO
  cost ladder (`claude-usage.md`) already says this.
- **Prove it by hand first.** Run it in a single chat against real notes before it earns
  a schedule. This is `loop-evals.md`: a loop passes a rubric before it gets autonomy.

## Cost

The article's estimate, quoted rather than computed by us: Loop 1 is a handful of
cheap-model calls per note change, non-recurring; Loop 2 is four passes every six hours,
"roughly the price of one coffee" per day. **UNVERIFIED** - no pricing was checked, and
the figure depends entirely on model choice and note count. For ZAO the relevant
constraint is not dollars but the Claude weekly cap, so any scheduled pass runs on
OpenRouter, not the cap.

## Decision

1. **Add an `assumptions` field to vault decision notes now.** Cheap, useful immediately
   even with no loop, and it is the prerequisite for every CONTRA pass.
2. **Let the vault accumulate.** The auto-logger built today (`~/bin/zao-vault-log`,
   hourly) means it now fills without anyone remembering. Revisit CONTRA scheduling when
   `decisions/` has real depth, not before.
3. **Run the first CONTRA pass BY HAND, against the rules - not the vault.**
   `.claude/rules/` has 18 months of accumulated conclusions and is the one corpus with
   enough history to argue with today. If a hand-run surfaces a real collision, it earns
   a schedule.
4. **If it is ever scheduled: surfaces only.** It writes a `CONTRA.md` of collisions. It
   never edits, merges, or resolves a note. PR-only, human-gated, on OpenRouter.
5. **Do not build passes 3 and 4 yet.** Cross-domain and ghost-self are the fun ones and
   the article says plainly they need critical mass. On a four-note vault they would
   produce confident nonsense.

## Also See

- [Doc 606](../../identity/606-zaal-second-brain-system/) - the existing second-brain design
- [Doc 2245](../../infrastructure/2245-zaoos-surface-map/) - where the "a flag that always fires gets ignored" lesson came from today
- [Doc 2246](../../agents/2246-claude-code-cross-session-messaging/) - the other research from this session
- `.claude/rules/anti-fabrication.md`, `loop-evals.md`, `agent-loops.md` (rule 8)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add an `assumptions:` field to the vault's decision-note shape and backfill the three existing decision notes. Shipped when all three carry it. | @Zaal | PR | 2026-08-10 |
| Hand-run one contradiction pass over `.claude/rules/**` and report whether any real collision surfaced. Shipped when the result is written down either way - "nothing collided" is a valid, useful answer. | @Zaal | Manual | 2026-08-14 |
| Re-measure the vault and decide on scheduling CONTRA passes. Shipped when the count is recorded and a yes/no is written. | @Zaal | Decision | 2026-09-04 |

## Sources

- ["Obsidian: A Vault That Argues Back"](https://x.com/nazik2053/status/2082370975132225737), Nazar (@Nazik2053), X Article, 2026-07-29 - **FULL**. Fetched via the fxtwitter API 2026-08-07 and read in its entirety (71 content blocks); the post itself has empty tweet text because the body is an X Article, which is why a naive fetch returns nothing. 74,974 views / 79 likes at time of fetch. All quotations above are verbatim from that article.
- `~/zao-vault` file counts - **FULL**, measured directly 2026-08-07.
- `.claude/rules/` (agent-loops rule 8, loop-evals, claude-usage, anti-fabrication) - **FULL**, read from the repo.
