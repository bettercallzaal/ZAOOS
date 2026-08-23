# Independent derivation task

You are deriving a systems model from scratch. You have **no prior context** on
the system these incidents came from, and that is deliberate. The person who
commissioned this wants an independent derivation specifically because he does
not want his existing architecture to anchor your answer.

**Do not ask what the existing architecture is. Do not try to guess it and match
it. Derive from the evidence.**

## The evidence

Five verified incidents from one federated multi-agent system. Every fact below
was read from source or measured directly. Where a magnitude is disputed, that
is stated.

### Incident A - a health reporter that could not report ill health

A shell script POSTs a per-service status to an HTTP endpoint every 60 seconds,
run by a system timer. The POST line is:

```bash
curl -s -o /dev/null --max-time 8 -X POST "$BOARD/api/v1/bots/heartbeat" ...
```

There is no `-f`, no capture of the HTTP status, and no branch on it. `curl`
exits 0 for a `401 Unauthorized` exactly as it does for a `200 OK`. The script
therefore exits 0 either way, and the timer logs `Finished` either way.

Separately documented: there was a period where the receiving endpoint rejected
every POST with 401, because a required credentials table had never been
created. During that window, every layer above still reported success.

Duration of the bad window: reported as approximately four days. Not
independently verified by me.

### Incident B - an absent measurer read as a measurement of zero

A scheduled job wrote a periodic summary of merged code changes. The script file
was deleted (it had never been placed under version control, so nothing restored
it). The scheduled job continued to be invoked and continued to produce a
summary reading "nothing merged."

During the four days it reported "nothing merged," **158 code changes merged.**

Note the mechanism carefully: nothing miscounted. The counter was **gone**, and
its silence was consumed downstream as a measured value of zero.

### Incident C - a poller whose state never advanced

A message poller queries for messages with `status=new` and, by design, never
marks anything read. A single long message was therefore re-fetched and
re-delivered on every poll cycle. Nothing in the system owned the fact "this has
already been surfaced."

**Disputed magnitude.** The commissioner states this ran six days and re-fetched
144 times. The only written record I could find states **six hours** and roughly
six re-sends. I could not find a record matching his figure. Treat the mechanism
as verified and the magnitude as unresolved; do not build anything that depends
on which number is right.

Downstream effect: the channel became noise, and a valid response from an
external partner sat unactioned.

### Incident D - liveness standing in for work

A long-running service reported by every available health signal as running:
process alive, service manager reporting `active (running)`, and a heartbeat row
in a database updated within the last minute.

Measured on the same day: **0.0% CPU, 35 days uptime, zero log entries ever,
zero files written in 30 days.** The service had additionally been formally
retired by a written decision two months earlier; nothing stopped it.

### Incident E - output that passed every guard while being false

A content-generating agent drafts short public posts about real events. Its
drafts named five entities (artists and works) attributed to real events. A
search of the entire source corpus found **zero occurrences of any of the five**,
while a control entity known to be real matched immediately.

The guards on that code path are a word-overlap similarity check and a
recent-output dedupe. **There is no check that the content is true.** A
fabrication that is merely novel passes every gate.

Scope honesty: those specific drafts were logged as not-posted, and sampled
actually-posted output referenced real entities. So this is a demonstrated
capability to fabricate that survived all guards, not a confirmed publication.

## Your task

Derive, from the above:

1. A truth-state model for an event in a federated autonomous-agent system.
2. The invariants governing transitions between those states.
3. A complete taxonomy of the failure class these five share (the commissioner
   calls it FALSE GREEN).
4. Whether a continuously-running monitor comparing *reported* state against
   *independently observed* state is warranted by this evidence, or whether
   something smaller suffices.
5. Where, if anywhere, a system should automatically generate diagnostic
   questions about the gap between what happened, what it believed happened, and
   what it expected to happen — and critically, **where doing so would only
   create noise.**
6. An information-value model determining which generated questions are worth
   executing.
7. The minimum viable implementation.
8. **What should explicitly NOT be built.**
9. Adversarial tests that would falsify your own model.

## Hypotheses to attack, not accept

The commissioner proposed these. He explicitly asked that you attack them and
derive something better if warranted. Do not accept them because he proposed
them.

- That the lifecycle is `SENT → DELIVERED → OBSERVED → UNDERSTOOD/CLASSIFIED →
  ROUTED → ACTED → VERIFIED → CERTIFIED → EFFECT MEASURED`.
- That the invariant is "nothing may be promoted to a higher truth state without
  evidence proving the transition."
- **That these five are ONE systems problem rather than several.** Test this
  seriously. If the mechanisms are genuinely different classes, say so and
  explain what a single model would design out.
- That the right response is to add a reasoning layer that asks questions at
  every state transition.
- That question patterns which repeatedly find failures should be promoted into
  permanent reusable diagnostic assets.

## Rules for your output

- **Separate every claim into VERIFIED / INFERRED / PROPOSED.** VERIFIED means
  it follows directly from the evidence above. You have no other verified
  evidence — you cannot inspect this system.
- **Do not invent evidence, implementation status, or compatibility.** If you
  need a fact you do not have, name it as an open question.
- **Prefer the smallest architecture that does the job.** If a proposed
  component can be replaced by a counter, a timestamp comparison, or a set
  difference, say so. Explicitly: the commissioner wants to know how many of his
  desired "questions" reduce to arithmetic rather than reasoning.
- **Do not optimize for agreeing with the commissioner.** If a premise is wrong,
  demonstrate why.
- One constraint he is firm on: the low-level message transport must stay
  simple. Reasoning belongs in a layer above it, not inside it.

Write your derivation to `DERIVATION.md` in your working directory. Be rigorous
and concise; length is not the goal, non-obviousness is.
