# Independent Derivation: Truth-State Model for Federated Systems

## 1. Truth-State Model

Every event in a federated autonomous system exists in exactly two independent states:

### GROUND TRUTH STATE
The actual state of affairs in the world:
- Has a message actually arrived in the queue?
- Did the POST request actually succeed?
- Was a file actually written to disk?
- Is a service actually performing work (measured by logs, CPU, output)?
- Do referenced entities actually exist in source data?

### REPORTED STATE
What the system believes to be true:
- A component claims it has sent/received/acted
- A log or record asserts something happened
- A status endpoint reports success
- A counter reports a measurement

**These two states are INDEPENDENT.** The system cannot know ground truth by introspection alone.

The five incidents are unified by one failure: reported state and ground truth have decoupled, and nothing forced them back into alignment.

---

## 2. Invariants Governing State Transitions

**Single Invariant (sufficient):** No reported state may be promoted to a higher-confidence state without an independent verification that bridges reported and ground truth.

Operationally, this means:

- **REPORTING** alone does not confer truth. A component saying "I succeeded" is not evidence.
- **VERIFICATION** is the bridge: an independent check that the report maps onto ground truth.
- **FAILURE** occurs when: reported state is accepted as valid without this bridge.

All five incidents violate this in different ways:
- A: HTTP 401 reported as success (no bridge)
- B: Missing measurer accepted as measurement zero (no bridge)
- C: Poller silence accepted as "seen everything" (no bridge)
- D: Process running accepted as work happening (no bridge - liveness ≠ work)
- E: Novelty passing accepted as truth (no bridge - guards exist, truth check does not)

---

## 3. Taxonomy: "FALSE GREEN"

All five are instances of the same failure class, which the commissioner named correctly: **FALSE GREEN.**

**Definition:** The system transitions to a high-confidence state (reports success, accepts a report as complete) when ground truth shows failure or absence.

**Mechanism:** All five follow the same structure:
1. A report is generated (POST succeeds in curl's view, file missing produces "zero", queue appears empty, process is alive, guard passes)
2. The report is interpreted as high-confidence (exit 0 → success, no file → zero, no queue → done, alive → working, passed guards → true)
3. No independent verification checks whether the interpretation matches ground truth
4. Downstream systems rely on the report
5. Ground truth diverges silently (endpoint was actually rejecting, measurer was gone, messages were never consumed, service was doing nothing, entities don't exist)

**Why this is ONE problem, not five:**

These are not five different failure modes. They are five instantiations of the same failure: **interpretation of a signal without verification that the signal corresponds to ground truth.**

The signals differ (exit codes, file presence, queue state, process state, guard results), but the failure pattern is identical: a report is assumed to mean something when it actually does not.

A single unified system would prevent all five by enforcing: "No report is accepted at high confidence without an independent ground-truth check."

But note: this is a design discipline, not a transport-layer fix. Each incident requires different verification code because ground truth is different for each.

---

## 4. Monitor Warranted?

**YES, but small and targeted.**

The evidence shows five critical failures across a distributed system. All five went undetected for days. The cost of each was measurable (four days with broken health, four days of false "nothing merged", noise in a channel, a retired service still running, fabricated content nearly published).

However, the monitor is not a continuous reasoning engine. It is a set of targeted checks.

**Cost analysis:**

- Incident A: HTTP status check costs one condition per POST (negligible)
- Incident B: File existence check costs one stat() call (negligible)
- Incident C: Queue depth check costs one query (negligible, already happening)
- Incident D: Log/output check costs one read (small)
- Incident E: Corpus existence check costs a search (medium, but only for content generation)

**Recommendation:** A narrow monitor that runs these five checks on a cadence (every 60-300 seconds depending on criticality) is warranted. It is NOT a continuous reasoning loop; it is five arithmetic comparisons and set operations.

---

## 5. Automatic Diagnostic Questions: Arithmetic, Not Reasoning

**VERIFIED:** All five incidents' "diagnostic questions" reduce to arithmetic or data comparisons.

Questions that would catch each incident:

| Incident | Question | Computation | Type |
|----------|----------|-------------|------|
| A | "Did POST really succeed?" | compare(http_status, 200) | Equality check |
| B | "Does the measurer exist?" | exists(measurement_file) | Existence check |
| C | "Are there genuinely new messages?" | count(queue where status='new' and id not in already_delivered) | Set difference |
| D | "Is work actually happening?" | compare(recent_logs + cpu_usage + files_written, >0) | Comparison |
| E | "Do entities exist in corpus?" | forall(entities, exists_in_corpus) | Existence checks in corpus |

**NOT ONE REASONING TASK among them.** All are queries over ground-truth data.

**Where noise would be generated:**

Asking these questions continuously without acting on them creates noise. A question should only fire if:
1. The answer changes from "OK" to "FAILURE"
2. The answer remains "FAILURE" after the first alert

Once an alert fires, do not re-ask the same question for N seconds (backoff). This prevents the "alarm screaming" failure.

---

## 6. Information-Value Model

A diagnostic question has value if and only if:

1. **Actionability**: The answer changes what someone does. 
   - "HTTP status is 401" → fix the credentials → re-run → problem solved. ✓ VALUE.
   - "Here's a log line" → debug where? → expensive. ✗ QUESTIONABLE VALUE.

2. **Cost**: The question is cheap to ask.
   - Equality comparison: negligible ✓
   - Existence check: one syscall ✓
   - Set difference: one query ✓
   - Corpus search: moderate cost, but worth it for E ✓

3. **Precision**: The question rarely fires on normal operation (low false-positive rate).
   - HTTP status 200 vs others: high precision
   - File exists: high precision
   - Queue is empty sometimes: LOW precision (will fire often)

4. **Latency**: The question must be answerable faster than the system's error recovery latency, or it is useless.
   - Health checks are fast (better than waiting 60 seconds to discover a down service)
   - But if the check takes 10 seconds and the service recovers in 30 seconds, value is low

**Verdict:** The five checks for A, B, D, E are all high-value. C is lower-value due to low precision (queues are often empty during normal operation). Only ask C if you can suppress it on "expected empty" states (business logic question, not a system question).

---

## 7. Minimum Viable Implementation

**What to build:**

1. **Verification layer in each component:**
   - POST operations: capture and check HTTP status. Return error if status is not in [200, 201, 204].
   - Measurements: assert file exists before reading; return "UNAVAILABLE" if not, never "zero."
   - Pollers: explicitly log which IDs have been delivered; query "new AND not in delivered_set."
   - Services: require every service to output a heartbeat log line on startup and at least once per minute during normal operation. Verify via log check, not process existence.
   - Content generation: add a corpus-existence check before marking content as "ready to post."

2. **Focused monitor (not a continuous reasoning engine):**
   ```
   every 60s:
     check_A(): if POST status != 200, alert("health-check-failing")
     check_B(): if measurement_file missing, alert("measurer-absent")
     check_D(): if no logs since 5min and cpu == 0, alert("service-dead-not-retired")
     check_E(): only on content generation, check corpus before post
   ```

3. **Backoff and deduplication:**
   - Once an alert fires, do not re-fire for 300 seconds (or until condition clears and re-occurs).
   - This prevents alarm fatigue.

4. **Logging for debugging:**
   - On every alert, log the ground-truth data that triggered it (the actual status code, file list, queue state, logs, corpus search result).
   - This is actionable for operators.

5. **NO automatic question generation.**
   - The questions are hand-coded into the monitors above.
   - They do not change frequently enough to justify a generative approach.
   - Generative questions would create noise (example: "why did this take 5ms instead of 2ms?" - useless).

---

## 8. What Should Explicitly NOT Be Built

1. **Do NOT build a continuous reasoning loop that asks questions at every state transition.**
   - Cost: High (reasoning on every message/event).
   - Benefit: Very low (most state transitions are normal).
   - Result: Noise that obscures real failures.

2. **Do NOT build automatic question promotion ("questions that fail often become permanent checks").**
   - This assumes that failed questions reveal system flaws worth fixing in the monitor.
   - Actually, questions that fail often are questions with bad precision (they fire on normal states).
   - Promoting them makes the noise worse.
   - Decision: hand-code monitors based on evidence from real incidents, not from question frequency.

3. **Do NOT add checking to the transport layer.**
   - The commissioner is right: message transport must stay simple.
   - Verification belongs in the business logic that uses the transport, not in the transport itself.

4. **Do NOT build a "truth oracle" component that runs continuous ground-truth checks.**
   - This would be a centralized bottleneck.
   - Verification checks are local (does MY component's POST work? does MY measurement file exist?).
   - Each component should verify its own reports.

5. **Do NOT assume "most recent report" is truth.**
   - The system must actively verify, not just check timestamps.

---

## 9. Adversarial Tests that Falsify the Model

If any of these tests succeed, the model is wrong:

### Test A1: Silent but detectable failure
**Setup:** A component reports success but the ground truth is detectable (file missing, HTTP 401, etc.).
**Expected:** The verification check catches it within one monitor cycle (60s max).
**Test:** Run all five incidents in parallel, measure time to detection for each.
- If any goes undetected for >60s, the model is incomplete.
- If detection latency exceeds the system's error-recovery time, the model is ineffective.

### Test A2: Verification check itself fails
**Setup:** A verification check queries for ground truth but the query fails (database down, filesystem hang).
**Expected:** The check timeouts and returns "UNKNOWN" (not "FALSE").
**Test:** Kill a dependency that a check relies on (e.g., the queue database for C). The monitor should alert "verification check failed" not "condition OK."
- If the model assumes checks always succeed, it will miss cascading failures.

### Test A3: Ground truth is expensive or slow
**Setup:** Incident E's corpus check takes 5 seconds per query. A content-generation component posts 100 items.
**Expected:** The verification does not block posting (it runs async and flags failures later).
**Test:** Measure whether expensive verifications cause system slowdown.
- If they do, the model is impractical and needs caching or sampling.

### Test A4: False positives under normal operation
**Setup:** Run the monitor for 24 hours on a healthy system.
**Expected:** Zero alerts on conditions that are actually fine (empty queues, fast requests, etc.).
**Test:** Count alerts. If >10 per day, precision is too low; re-tune thresholds.
- The model predicts precision is high enough. Falsify it by showing excessive alerts.

### Test A5: Unification of five as ONE problem
**Setup:** Design a system that addresses "report-reality decoupling" without special-casing each incident type.
**Expected:** A single principle (verify every report) prevents all five.
**Test:** Build the unified system. If any incident still occurs (e.g., a new variant of report-reality decoupling), the model is incomplete.
- This is the hardest test: it asks whether "unified model" is real or just a post-hoc pattern.

---

## Verdict on Commissioner's Hypotheses

### Hypothesis 1: Long state-transition chain
**VERDICT:** WRONG. The chain is not needed. A simpler two-state model (Ground Truth vs Reported) with a verification bridge is sufficient.

**Why:** The nine-stage chain creates checkpoints that would catch some failures but not all. For example:
- Incident A fails at "DELIVERED" (POST reports success but reality is 401)
- The chain would catch it at "VERIFIED" stage
- But nothing forces the system to visit "VERIFIED" - it could skip to "UNDERSTOOD"

A simpler invariant ("never promote without verification") is both smaller and more durable.

### Hypothesis 2: Invariant - "nothing promoted without evidence"
**VERDICT:** CORRECT. This is the right invariant. However:
- Operationally, this means "verify every report before accepting it"
- The chain itself is not needed - the invariant is all that matters

### Hypothesis 3: Five incidents are ONE problem
**VERDICT:** CORRECT, with nuance.

**Evidence for ONE:**
- All five share the pattern: reported state ≠ ground truth, no verification bridge
- A single design principle (verify all reports) prevents all five
- The failure class is unified: false green

**Evidence for SEVERAL:**
- The verification checks are completely different (HTTP status, file exists, set membership, logs, corpus search)
- A single monitoring component cannot efficiently address all five (Incident E's check is expensive, Incident C's check has high false-positive rate, etc.)

**Verdict:** It is ONE problem conceptually (report-reality decoupling), but SEVERAL problems operationally (different verification strategies for each).

This matters: you can build ONE principle and MANY implementations of it, or you can build many separate hardening measures. The model recommends the former (one principle, many implementations) as it's more durable against novel variants.

### Hypothesis 4: Add a reasoning layer asking questions at state transitions
**VERDICT:** WRONG. This creates noise and adds cost without corresponding benefit.

**Why:** The diagnostic questions are arithmetic, not reasoning. They're better implemented as targeted checks in a narrow monitor.

**Cost:** 
- If you ask questions at every state transition: O(n) reasoning per event
- If you ask questions in a focused monitor: O(1) per question, once every 60 seconds
- The monitor approach is orders of magnitude cheaper

### Hypothesis 5: Promote question patterns into permanent checks
**VERDICT:** WRONG. Question frequency is not a signal of importance.

**Why:** High-frequency questions are usually high-frequency false positives (the question has low precision on normal operation). Promoting them makes the system noisier, not better.

**Counterexample:** A question "Is the queue empty?" fires frequently but is normal during light load. Promoting it into a permanent alert creates a false alarm.

**Right approach:** Hand-code monitors based on real incident evidence, tuned to fire only on actual failures (precision > 95%).

---

## Summary Statistics

**Verification checks that reduce to arithmetic:**
- A: 1 equality comparison
- B: 1 existence check
- C: 1 set operation (difference)
- D: 3 comparisons (≥1 each) OR'd together
- E: N corpus lookups (N = entity count)

**Total:** 6 + N simple operations. Zero reasoning tasks.

**Diagnostic questions that could be generated automatically but should be hand-coded:**
- 5 questions that are always relevant
- 0 additional questions worth asking (precision too low or cost too high)

**Components that should be built:**
1. Verification in business logic (5 distinct implementations)
2. Narrow monitor (60-second cadence)
3. Backoff to prevent alarm fatigue

**Components that should NOT be built:**
1. Continuous reasoning loop
2. Automatic question generation
3. Question promotion system
4. Centralized truth oracle
5. Transport-layer checking

**Monitor is warranted?** YES. It is small, fast, targeted, and catches all five verified incidents.
