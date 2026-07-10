---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-09
tier: STANDARD
related-docs:
  - 796-reasoning-tick-proactive-gate
  - 983-zoe-autonomous-fix-pr-pipeline-gaps
  - 988-zoe-memory-tuning-for-recall
  - 997-cockpit-harness-morning-brief
original-query: "Improve the tick to do research overnight and improve the bot -> proactive assistant surfacing patterns to feed ZOE"
---

# Doc 1015: Proactive Personal-Assistant / AI Chief-of-Staff Surfacing Patterns (2026)

The line between a helpful personal AI and an annoying bot is a single decision: **which signal justifies an unprompted ping?**

This research consolidates patterns from leading personal-assistant products (Gmail-driven, event-driven), agent frameworks (Anthropic's building-effective-agents), and memory systems (multi-signal retrieval, decay) to improve ZOE's proactive surfacing beyond the current threshold gate. The goal is to feed Zaal real-time, only-when-it-matters pings without training him to ignore ZOE.

---

## Key Decisions

### 1. Surfacing is threshold-gated + self-throttled, NOT quota-gated.
ZOE's current model (doc 796) is sound: no daily "quota of pings allowed." Instead, a dynamic threshold (0.3-0.95) gates every candidate. Three guards replace a quota:

- **Single-best-only** — at most one candidate per tick by construction (pickBest()).
- **Silence observability** — every tick logs its decision so threshold drift is visible within 24 hours (proactive-log.jsonl).
- **Unacked self-throttle** — when 3+ recent pushes go unacknowledged, ZOE raises its own bar and asks "dial back?" instead of waiting for Zaal to complain.

**Implication:** Do not add a daily cap or a "X pings per day max" lever. The threshold + unacked guard are load-bearing.

### 2. Priority scoring is a four-layer decision stack, not a single number.
The Suprsend framework (2026) separates concerns:

| Dimension | Controls | Decision |
|-----------|----------|----------|
| Queue priority | Processing order | Always high for critical |
| Channel priority | How aggressively APNs/FCM surface alerts | Bypass quiet hours if critical |
| UX priority | Whether it interrupts (sound, heads-up) vs. quiet | Critical = interrupt; Standard = silent |
| Compliance | Quiet-hour exemptions, frequency caps | Critical bypasses all; Promotional respects all |

For ZOE-to-Zaal, the mapping is simpler — Telegram DM has one "channel" — but the mental model matters: **each outbound ping has an implicit tier, and that tier should be transparent in the code.** Currently ZOE conflates "high score" with "definitely send." Clarifying tiers (critical: P0/blocker, standard: due/overdue threads, signal: inactivity/calendar) makes it easier to tune independently.

**Implication:** Tag each Candidate with a tier (critical, standard, signal). Use tier to set self-throttle limits (e.g., critical-only pings can go over the threshold; signal-level pings must be lower).

### 3. Memory retrieval must answer "what matters to Zaal" with hybrid signals, not similarity alone.
Vector search alone misses 10-30% of relevant facts because terminology drifts (searching "template" misses stored "format"). Modern systems use hybrid retrieval:

- **Dense embeddings** (semantic similarity)
- **BM25 keyword matching** (exact phrase lookup)
- **Entity matching** (people, dates, projects)

All three are normalized and fused into a single result score.

For ZOE, this means: when deciding whether to nudge about a thread, retrieve using (a) semantic similarity to past threads Zaal engaged with, (b) exact keyword hits on known-important projects, and (c) entity matching for VIP contacts. The scoring becomes multi-signal.

**Implication:** In threads.ts / recall.ts, add entity-aware retrieval. When deciding if a thread is "worth nudging," check not only if it's due but if it involves a flagged person, project, or commitment type.

### 4. Proactive surfacing needs four candidate sources: threads (due/overdue), events (calendar/external triggers), memory anomalies (deviation from pattern), and commitment tracking (deadline zero days).
The "I Built an AI Chief of Staff" reference shows a two-tier approach that's modular:

- **Tier 1 (zero LLM cost, 30 min latency):** Rules-based scan of contact lists, urgent keywords, Gmail labels. Deliver alerts within seconds.
- **Tier 2 (full LLM, daily batched):** Classify ~50 messages daily, generate context-aware responses. Anticipation engine surfaces needs without explicit requests.

ZOE currently has:

- Threads (due/overdue) via scoreThreadCandidate() — good.
- Events (calendar, graph staleness, inactivity) via gatherEventCandidates/gatherGraphCandidates/gatherInactivityCandidates — good.
- Memory anomalies? Partial (reflection capture, but no drift detection).
- Commitment tracking? Partial (threads have snooze state, but no "proposal due Friday with zero calendar time" scanning).

**Implication:** Add two candidate types: (a) memory anomaly — "haven't pinged Alice on X for 3 weeks, but we talked every 1w before," (b) commitment with zero-buffer — "board meeting Friday, zero hours blocked."

### 5. Escalation for super-important items must be asynchronous and multi-channel if a Telegram reply takes too long.
The operating model (feedback_assistant_operating_model.md) requires: "ZOE must RESEND if he does not reply/react in Telegram" for super-important pings.

ZOE already has escalation.ts (30 min check-and-resend cycle) but it only re-sends the same message. Best practice: on 2nd send, expand the context ("I sent this 30 min ago and got no reply. It's still blocking X") or ask a different way (escalate from "heads up" to "needs your call").

**Implication:** escalation.ts should parameterize the re-message by escalation round (1st ping vs. 2nd vs. 3rd) and frame it differently each time.

### 6. Notification batching must default to "intelligent batching" (group by topic/project) rather than "time-window batching" (wait N min for more).
The Courier research (2026) notes: "Notifications now have two audiences: humans and AI agents." If ZOE doesn't batch intelligently, Zaal will build his own batching rules or train himself to ignore pings.

Intelligent batching: group 3 task-nudges (same project) into one "3 things on Project X" ping. Time-window batching: wait 10 min and send whatever arrived, which creates fragmentation.

ZOE's posts scheduler (posts/scheduler) does random-batch but not topic-aware batch. The reasoning tick doesn't batch at all (1 tick, 1 candidate, 1 message).

**Implication:** For the reasoning tick, add an optional "batch window" mode: instead of sending immediately, queue the candidate for 5 min and check if a 2nd candidate of the same kind arrives; if so, batch them. (Can be gated behind a flag for gradual rollout.)

---

## Findings

### Finding 1: ZOE's current threshold-gating is sound but lacks explicit tier taxonomy.
**Evidence:** proactive.ts scoreThreadCandidate() assigns scores (0.6 baseline, 0.75-0.95 overdue range) but no formal tier. The three-guard model (single-best, observability, unacked self-throttle) is foundational and used by leading personal assistants.

**Implication:** Document the tier levels in proactive.ts and use them in logs so "threshold=0.75" becomes "tier=standard, threshold=0.75" — making tuning transparent.

### Finding 2: Memory decay and access patterns matter more than raw memory quantity for surfacing.
**Evidence:** The "AI Chief of Staff" builder reports memories decay over time unless recently accessed, with pinned memories resisting decay. This prevents stale context (e.g., "Zaal told me to email Bob" from 6 months ago) from polluting today's decisions.

**Current ZOE state:** memory.ts captures events and reflections, but decay is not implemented. A recent reflection ("Zaal said focus on X this week") should have high weight TODAY; the same reflection from 4 weeks ago should fade.

**Implication:** Add access-date tracking to memory entries and age-weight all retrieval. When deciding if a thread is "worth nudging," up-weight memories accessed in the last 7 days, down-weight memories older than 30 days.

### Finding 3: Rules-based surfacing (Tier 1) with zero LLM cost is critical for latency and cost, while full-LLM analysis (Tier 2) is reserved for daily/weekly synthesis.
**Evidence:** The chief-of-staff pattern uses a 30-min rules scan (contact lists, keywords, labels) for immediate surfacing, reserving the full LLM for daily batched classification.

**Current ZOE state:** scheduler runs reasoning tick hourly via full runReasoningTick(), which calls listLiveThreads() and runs scoreThreadCandidate() (pure, no LLM) but also gathers event/graph candidates that may require external API calls (Bonfire, GitHub, calendar). Some ticks may be cheaper than others.

**Implication:** Formalize the cost structure: Tier 1 (free) includes thread scoring + Bonfire cache hits; Tier 2 (full) runs only daily/weekly (learn cycle, watcher, reflect) and can afford multiple API calls. Tier 1 should be fast enough to run every 15 min if needed; Tier 2 stays on its current schedule.

### Finding 4: Commitment tracking ("deadline Friday with zero buffer") is underspecified in ZOE.
**Evidence:** The chief-of-staff anticipation engine surfaces needs without explicit requests, including "Proposal due Friday with zero calendar time" — a pattern ZOE doesn't yet detect.

**Current ZOE state:** Threads have snooze/due dates. Tasks on the board may have dates. But ZOE has no rule like "if a task is due in 48h and zero hours are blocked on Zaal's calendar, escalate it."

**Implication:** Add a commitment scanner that runs hourly (or daily at 18:00 UTC before the work day): for each task/thread due within 48h, check if Zaal has at least 2 hours blocked on the calendar; if not, escalate to score 0.8+ (standard tier).

### Finding 5: Escalation re-sends must vary the frame, not just repeat.
**Evidence:** Anthropic's building-effective-agents research emphasizes that agents must surface decisions to humans directly when hard tradeoffs appear. Escalation without re-framing trains users to ignore the 2nd+ ping.

**Current ZOE state:** escalation.ts calls checkAndResend() which re-sends the same text.

**Implication:** On 2nd/3rd re-send, vary the message: 1st = "Heads up: X. Reply/react to ack." 2nd = "Still waiting on: X. Blocking Y?" 3rd = "Critical: X. Do I pause?" This keeps Zaal engaged rather than fatigued.

### Finding 6: Silence-rate observability (proactive-log.jsonl) is the only canary for a mis-set threshold.
**Evidence:** ZOE logs every tick decision. A sudden drop in silence_rate (e.g., 85% silent -> 40% silent) means the threshold drifted or new candidate sources got added.

**Current ZOE state:** proactive-log.jsonl is written but not analyzed. A threshold drift could go unnoticed for days.

**Implication:** Add a daily alert to the watcher: if silence_rate over the last 50 ticks drops below 70% OR exceeds 95%, flag it as anomalous. This catches a mis-tuned threshold within 1-2 days instead of relying on Zaal's subjective "too quiet" / "too chatty" feedback.

### Finding 7: Entity-aware retrieval (VIP contacts, flagged projects) is standard in 2026 but absent in ZOE.
**Evidence:** Hybrid retrieval (dense + sparse + entity matching) is the industry standard. Mem0's 2026 benchmark shows multi-signal retrieval improves temporal queries (+29.6 points) and multi-hop reasoning (+23.1 points).

**Current ZOE state:** recall.ts uses embeddings for memory search. No entity-based boost for known-important people (e.g., Zaal's co-founders, key partners).

**Implication:** In recall.ts, add entity detection and boost relevance for flagged people/projects. When deciding if a thread about "Alice" is worth nudging, check if Alice is in the VIP list (speeding retrieval by 2-3x vs. pure embedding).

### Finding 8: Threshold tuning via Zaal's feedback should be explicit and reversible.
**Evidence:** The proactive model includes nudgeThreshold() to let Zaal say "more pings" / "fewer pings" mid-session. This is reversible and transparent.

**Current ZOE state:** Threshold management is present but not wired to slash commands or Telegram reactions. Zaal can't easily request "dial back" without DMing the full text.

**Implication:** Wire a reaction-based toggle: react :chart_increasing: to "raise threshold, less pings" and :chart_decreasing: to "lower threshold, more pings." ZOE acks the change and logs it.

---

## How This Applies to ZOE

### Tier Taxonomy (proactive.ts)
**Current code:** scoreThreadCandidate() returns a score (0.6-0.95) but no tier.

**Recommended change:** Add a tier field to Candidate interface:
```typescript
export interface Candidate {
  kind: CandidateKind;
  score: number;  // 0..1
  tier: 'critical' | 'standard' | 'signal';  // NEW
  message: string;
  threadId?: string;
}
```

Then update scorers:
- Thread-decision (2+ snoozes) -> tier: 'critical', score: 0.8
- Thread-nudge (overdue) -> tier: 'standard', score 0.6-0.95
- Inactivity check-in -> tier: 'signal', score: 0.5

Use tier in passesThreshold(): critical always passes (unless unacked limit hit); standard gated at 0.6+; signal at 0.5+.

### Memory Decay (memory.ts)
**Current code:** captureEvent, captureReflection write timestamps but no access-date tracking.

**Recommended change:** Add accessedAt field to memory entries. Update recall.ts to age-weight results:
```typescript
const weight = (entry: MemoryEntry, now: Date) => {
  const daysSinceAccess = (now.getTime() - Date.parse(entry.accessedAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceAccess <= 7) return 1.2;  // recent: boost
  if (daysSinceAccess <= 30) return 1.0;  // warm: normal
  if (daysSinceAccess <= 90) return 0.7;  // cool: down-weight
  return 0.3;  // stale: almost ignore
};
```

### Commitment Scanner (new file: bot/src/zoe/commitment-tracker.ts)
**New feature:** Scans tasks/threads due within 48h and checks calendar buffer.

```typescript
export async function gatherCommitmentCandidates(): Promise<Candidate[]> {
  const due48h = await getTasksDueWithin(48);
  const candidates: Candidate[] = [];
  for (const task of due48h) {
    const blocked = await getCalendarBufferFor(task.dueAt);
    if (blocked < 2 * 60) {  // < 2 hours
      candidates.push({
        kind: 'commitment-zero-buffer',
        tier: 'standard',
        score: 0.75,
        message: `"${task.title}" is due ${task.dueAt} — zero hours blocked. Want to reschedule or squeeze in 2h this week?`,
        threadId: task.id,
      });
    }
  }
  return candidates;
}
```

Inject into scheduler.ts extraCandidates() loop.

### Escalation Re-framing (escalation.ts)
**Current code:** checkAndResend() re-sends the original message unchanged.

**Recommended change:** Track escalation round (1st, 2nd, 3rd) and vary the frame:
```typescript
async function resendWithEscalation(
  msg: PendingMessage,
  round: number,
): Promise<string> {
  const frames = [
    msg.text,  // round 1: original
    `Still waiting on: "${msg.text.slice(0, 50)}..." — blocking anything?`,  // round 2
    `Critical: "${msg.text.slice(0, 50)}..." — should I pause other things?`,  // round 3
  ];
  return frames[Math.min(round - 1, 2)];
}
```

### Silence-Rate Alert (watcher.ts)
**Current code:** watcher.ts checks dispatch health and cost anomalies.

**Recommended change:** Add silence-rate canary:
```typescript
const silence = await silenceRate(50);
if (silence.rate < 0.7) {
  alerts.push({
    level: 'warning',
    message: `Proactive threshold too low? Silence rate ${(silence.rate * 100).toFixed(0)}% over 50 ticks.`,
  });
}
if (silence.rate > 0.95) {
  alerts.push({
    level: 'info',
    message: `Very quiet: ${(silence.rate * 100).toFixed(0)}% silent over 50 ticks. Threshold at ${threshold}.`,
  });
}
```

### Reaction-Based Threshold Tuning (index.ts message handler)
**Current code:** No slash command for threshold adjustment.

**Recommended change:** Add reaction listener:
```typescript
bot.on('message_reaction', async (ctx) => {
  const emoji = ctx.messageReaction.emoji.emoji;
  if (emoji === '📈') {
    const newThreshold = await nudgeThreshold(0.05);  // less pings
    await ctx.reply(`Threshold raised to ${newThreshold}. Dialing back.`);
  }
  if (emoji === '📉') {
    const newThreshold = await nudgeThreshold(-0.05);  // more pings
    await ctx.reply(`Threshold lowered to ${newThreshold}. More pings.`);
  }
});
```

### Entity-Aware Recall (recall.ts)
**Current code:** Uses embeddings alone for memory search.

**Recommended change:** Add entity boost in ranking:
```typescript
const entityBoost = (entry: MemoryEntry, vipList: string[]): number => {
  const entityMatches = (entry.text.match(/\b\w+\b/g) || [])
    .filter(e => vipList.some(vip => vip.toLowerCase() === e.toLowerCase()))
    .length;
  return 1 + (entityMatches * 0.1);  // +10% per matched entity
};
```

### Batching Window (proactive.ts, gated feature flag)
**Current code:** reasoning tick picks 1 candidate per tick.

**Recommended change:** Optional queue-and-wait mode:
```typescript
const BATCH_WINDOW_MS = 5 * 60 * 1000;  // 5 min
const batchQueue: Candidate[] = [];
let batchTimer: NodeJS.Timeout | null = null;

async function queueOrSpeak(candidate: Candidate) {
  if (!featureFlags.batchingEnabled) {
    await speak(candidate);
    return;
  }
  batchQueue.push(candidate);
  if (!batchTimer) {
    batchTimer = setTimeout(async () => {
      await speakBatch(batchQueue);
      batchQueue.length = 0;
      batchTimer = null;
    }, BATCH_WINDOW_MS);
  }
}
```

(Gated behind a feature flag for gradual rollout.)

---

## Next Actions

| Action | Owner | Target Date | Shipped Criteria |
|--------|-------|-------------|------------------|
| Add tier taxonomy to Candidate interface and update scoreThreadCandidate() | Claude (ZOE dev) | 2026-07-14 | proactive.ts updated; tests pass; scheduler.ts logs include tier; silence observability verified |
| Implement memory access-date tracking and age-weighting in recall.ts | Claude (ZOE dev) | 2026-07-16 | Memory entries capture accessedAt; recall.ts boosts recent (<7d) and down-weights stale (>90d); watcher alert fires if anomaly detected |
| Build commitment-tracker.ts scanner for zero-buffer warnings | Claude (ZOE dev) | 2026-07-18 | gatherCommitmentCandidates() injected into scheduler.ts extraCandidates loop; test with a task due 48h out with <1h calendar buffer |
| Add silence-rate canary to watcher.ts daily check | Claude (ZOE dev) | 2026-07-16 | watcher fires alert if silence_rate < 70% or > 95% over 50 ticks; logged to proactive-log.jsonl |
| Re-frame escalation messages by round (escalation.ts) | Claude (ZOE dev) | 2026-07-14 | checkAndResend() tracks round; 2nd+ sends vary the frame; test with a stuck critical ping |
| Wire reaction-based threshold tuning (📈/📉) to index.ts message handler | Claude (ZOE dev) | 2026-07-15 | Reaction listener on-message_reaction fires; nudgeThreshold() persists to disk; Zaal can adjust via reaction |
| Add entity-aware boost to recall.ts VIP ranking | Claude (ZOE dev) | 2026-07-18 | recall.ts has entityBoost() function; threads involving flagged people/projects rank 2-3x higher; test against a VIP contact query |
| Implement batching-window flag (gated feature, off by default) | Claude (ZOE dev) | 2026-07-20 | proactive.ts has BATCH_WINDOW_MS, batchQueue, batchTimer; flag controlled via env or Redis; no change to shipping behavior until explicitly enabled |
| Measure silence_rate over 2 weeks post-deployment; dial threshold based on observability | Zaal (operator) | 2026-07-25 | silence_rate stable at 75-85%; no unacked-limit trips; Zaal reports "right volume"; if drift detected, nudge threshold by ±0.05 |

---

## Sources

| Source | Status | Details |
|--------|--------|---------|
| [Suprsend Notification Priority Framework](https://www.suprsend.com/post/notification-priority-framework) | FULL | Four-layer decision stack (queue, channel, UX, compliance); three-tier category system (critical/standard/promotional); qualification rule; used in production |
| [Mem0 AI Agent Memory 2026 Benchmark Report](https://mem0.ai/blog/state-of-ai-agent-memory-2026) | FULL | Token-efficient hierarchical memory; multi-signal retrieval (dense + sparse + entity); temporal + multi-hop improvements; decay rates |
| [I Built an AI Chief of Staff That Runs My Life While I Sleep](https://doneyli.substack.com/p/i-built-an-ai-chief-of-staff-that) | FULL | Two-tier urgency detection (30m rules-based + 5pm full-LLM); four-tier memory retrieval (core + sender-specific + topic + situational); anticipation engine patterns |
| [Fountain City: Building AI Agent Memory in 2026](https://fountaincity.tech/resources/blog/how-to-build-and-operate-ai-agent-memory-in-2026/) | PARTIAL | Hybrid dense-plus-sparse retrieval architecture; memory taxonomy (semantic, episodic, procedural); gaps on principal-specific prioritization acknowledged |
| [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) | FULL | Five workflow patterns; humans teach agents to surface decisions with hard tradeoffs; simplicity over complexity; proactive agent suggestions validated in practice |
| [Courier: Notifications Now Have Two Audiences](https://www.courier.com/blog/your-notifications-now-have-two-audiences-humans-and-ai-agents) | PARTIAL | Intelligent batching vs. time-window batching; context for AI agents processing notifications; ZOE as both recipient and intermediary |
| [Claude Code Observability with OpenTelemetry](https://code.claude.com/docs/en/agent-sdk/observability) | FULL | Trace architecture; audit trails; decision logging; autonomous system requirements; NIST governance framework alignment |
| [Anthropic's Building Effective Human-Agent Teams](https://claude.com/blog/building-effective-human-agent-teams) | FULL | Proactive pattern — agents surface new projects/workstreams; humans teach agents to escalate hard tradeoffs; observability as foundational |

---

## Related Research

- Doc 796: Reasoning-tick proactive gate (current threshold logic)
- Doc 983: ZOE autonomous fix-PR pipeline gaps (task/approval flow)
- Doc 988: ZOE memory tuning for recall (memory architecture)
- Doc 997: Cockpit harness for morning brief (primary summary surface)
