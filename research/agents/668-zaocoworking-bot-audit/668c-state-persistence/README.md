---
title: "ZAOcoworkingBot State & Persistence Audit"
topic: agents
type: audit
tier: STANDARD
status: SHIPPED
parent_doc: 668
related_docs:
  - 662
  - 650
  - 661
created_at: "2026-05-18"
---

# ZAOcoworkingBot State & Persistence Audit

Systematic audit of ZAOcoworkingBot's state management, file I/O, concurrency safeguards, and recovery patterns across 7 subsystems. VPS live state (`~/.zaocoworking/`) snapshot captured 2026-05-18T12:01Z.

## Executive Summary

Bot runs on a single Telegram connection (no queue/horizontal scaling risk) but exhibits **3 critical issues** in file persistence:

1. **Version marker migration is NOT idempotent** (memory.ts line 73-126): Concurrent restarts during CloudFlare failover could create duplicate backups + corrupt persona.md. Suggested fix adds a guard file.
2. **Pending suggestion file lacks mutual exclusion** (extraction.ts line 65-82): Two users hitting bot simultaneously write to single `~/.zaocoworking/pending-suggestion.json`. Current workaround (5-min TTL) masks collision risk.
3. **Backup files accumulate unbounded** (VPS state): 3 backup files on disk now; after 50 version bumps = 50 files. No cleanup policy.

All other subsystems (SHA-dance retry, transcript ring buffer, user prefs, roster cache) are **well-designed**.

---

## Findings

### P0: Version Marker Migration Not Idempotent

**Subsystem:** `memory.ts`  
**Severity:** P0 - Data corruption risk  
**Lines affected:** 106-126 (seedOrUpdate function)

**Issue:**
- `seedOrUpdate()` reads file, checks version marker, backs up if mismatch, writes new version.
- **No atomic guard** - two concurrent calls (e.g., bot restart during systemd respawn + manual `npm run dev`) both read the same old version, both decide to back up, both attempt fs.writeFile.
- First wins, second overwrites its backup with the same content, but the race exposes a window where persona.md could be half-written.

**Evidence (VPS state):**
```
persona.md.user-bak.1779105692       (timestamp 1779105692)
persona.md.bak.v2.11-1779105554      (timestamp 1779105554 - earlier)
human.md.user-bak.1779105692         (same timestamp as persona.md.user-bak)
```
Two backup files with different naming schemes suggest inconsistent rollback logic. The `.bak.v2.11-` file predates the `.user-bak.` files, indicating manual intervention or a version transition bug.

**Severity Justification:**
- Iman reported (doc 662) that prompt changes deployed in v2.11 didn't reach existing installs.
- Fix was backported via v2.12 seedOrUpdate, but concurrent bot processes could create partial writes.
- Risk: bot asks Claude to emit json-suggest, Claude sees stale persona rules, emits hallucination (e.g., "I'll update once you grant write access").

**Mitigation (current):**
- Bot typically runs as systemd user unit (single process).
- Manual restarts are rare.
- TTL on pending suggestions (5 min) + user interaction loop mitigates prompt-drift hallucinations in practice.

**Fix:**
Create a version-update sentinel file at boot:
```typescript
const MIGRATION_LOCK = join(COWORK_PATHS.home, '.version-migration.lock');

async function seedOrUpdate(...) {
  const lockPath = MIGRATION_LOCK;
  try {
    // Use fs.open(O_EXCL) atomic create for lock file
    const fd = await fs.open(lockPath, 'wx');
    await fd.close();
  } catch (e: any) {
    // Lock already held by another process
    if (e.code === 'EEXIST') return;
    throw e;
  }
  try {
    // ... existing seedOrUpdate logic ...
  } finally {
    await fs.unlink(lockPath).catch(() => {});
  }
}
```

---

### P1: Pending Suggestion File - Race Condition on Concurrent Users

**Subsystem:** `extraction.ts`  
**Severity:** P1 - State collision (mitigated by UX flow)  
**Lines affected:** 65-87 (savePending, loadPending, clearPending)

**Issue:**
- Single global file at `~/.zaocoworking/pending-suggestion.json` stores one pending suggestion.
- If two team members hit the bot simultaneously (same Telegram group):
  - User A's message triggers LLM, returns suggestion_A.
  - User B's message triggers LLM, returns suggestion_B.
  - Both `maybeStartSuggestionFlow()` call `savePending()`.
  - Whichever write completes last owns the pending state.
  - User A confirms → executes User B's suggestion (wrong user, wrong action).

**Current safeguard:**
- 5-min TTL (PENDING_TTL_MS line 21): if User B's turn arrives 6 minutes later, pending expires and is ignored.
- **But within 5 minutes of simultaneous messages**, collision occurs.

**Evidence (VPS state):**
```
No pending-suggestion.json file found (expected - 5-min expiry).
```
No active collision on capture date, but the risk window exists.

**Severity Justification:**
- Team is only 4 members (low concurrent traffic).
- Typical usage is serial: user asks → bot replies → user confirms → cleared. Next user's turn follows.
- Risk is low in practice but **violates safety invariants** (per CLAUDE.md security rules: atomic writes, session isolation).

**Mitigation (current):**
- Small team, serial usage pattern.
- Confirmation flow catches most mistakes (user would see wrong suggestion before confirming).

**Fix (Option A - Scoped Pending State):**
```typescript
interface PendingSuggestion {
  chat_id: number;
  from_user_id: number;  // SCOPED to user + chat
  // ... rest ...
}

// Use composite key instead of single file:
const pendingPath = (chatId: number, userId: number) =>
  join(COWORK_PATHS.home, `pending-${chatId}-${userId}.json`);

export async function savePending(p: PendingSuggestion): Promise<void> {
  const path = pendingPath(p.chat_id, p.from_user_id);
  await fs.writeFile(path, JSON.stringify(p, null, 2), 'utf8');
}
```
This isolates each (chat, user) pair to its own file, eliminating global collision.

---

### P1: Backup File Accumulation - No Cleanup Policy

**Subsystem:** `memory.ts`  
**Severity:** P1 - Disk fill risk (over months)  
**Lines affected:** 121-125 (backup file naming)

**Issue:**
- Every time `seedOrUpdate()` detects a version change, it backs up the old file:
  ```typescript
  const backupPath = `${path}.user-bak.${ts}`;
  ```
- **No deletion of old backups.**
- After 50 version bumps, 50 backup files accumulate.

**Current state (VPS):**
```
persona.md.user-bak.1779105692
persona.md.bak.v2.11-1779105554
human.md.user-bak.1779105692
(3 files total)
```
Directory size still small (116K), but pattern will grow.

**Mitigation (current):**
- Version bumps are infrequent (v2.11 → v2.12 was ~first real update).
- Bot runs for ~7 days at a time before restart.
- Over 1 year, expect ~52 version bumps → ~100 backup files.

**Fix:**
```typescript
async function seedOrUpdate(path: string, version: string, content: string): Promise<void> {
  // ... existing logic to detect mismatch and back up ...
  
  if (currentVersion !== version) {
    const ts = Math.floor(Date.now() / 1000);
    const backupPath = `${path}.user-bak.${ts}`;
    await fs.writeFile(backupPath, existing, 'utf8');
    
    // Keep only the 3 most recent backups
    const backups = await fs.readdir(dirname(path));
    const thisFileBackups = backups
      .filter(f => f.startsWith(basename(path) + '.user-bak.'))
      .sort()
      .reverse()
      .slice(3);  // drop all but top 3
    for (const old of thisFileBackups) {
      await fs.unlink(join(dirname(path), old)).catch(() => {});
    }
  }
}
```

---

### P2: Actions SHA Dance - Backoff Math Correct, But No Observability

**Subsystem:** `actions-store.ts`  
**Severity:** P2 - Operational blind spot  
**Lines affected:** 75-96 (mutateActions loop)

**Design Quality:** GOOD
- Exponential backoff: 100ms, 200ms, 400ms (capped at 400ms for 3 attempts).
- Properly handles GitHub 409 Conflict (concurrent write detected).
- Fetches fresh data on each retry, so merged data is latest.

**Gap:**
- No instrumentation. If a mutation fails after 3 attempts, bot logs:
  ```
  actions mutation failed after 3 attempts: some error
  ```
- But bot doesn't report **which action failed** or **why conflict persisted**.
- Iman cannot debug "my /done #12 command silently failed" without logs.

**Fix (optional, P3):**
```typescript
export async function mutateActions<T>(
  mutator: (data: ActionsFile) => Promise<...>,
  maxAttempts = 3,
  debugLabel = 'unknown',  // NEW
): Promise<T | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data, sha } = await fetchActions();
      const out = await mutator(structuredClone(data));
      if (!out) return null;
      await commitActions(out.data, sha, out.commitMessage);
      console.log(`[actions] ${debugLabel} succeeded`);
      return out.result;
    } catch (err) {
      const status = (err as any).status;
      if (status !== 409 && status !== 422) throw err;
      const backoffMs = 100 * 2 ** attempt;
      console.warn(`[actions] ${debugLabel} conflict (409) - retry in ${backoffMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw new Error(`actions mutation ${debugLabel} failed after ${maxAttempts} attempts: ...`);
}
```

---

### P2: Transcript Ring Buffer - Disk Fill Risk Over Months (Low Probability)

**Subsystem:** `transcripts.ts`  
**Severity:** P2 - Gradual degradation  
**Lines affected:** 27-64 (logMessage), 54-56 (ring buffer slice)

**Design Quality:** EXCELLENT
- Two-stage write (archive-first, then ring buffer): if stage 2 fails, archive persists.
- Ring buffer correctly trims to 20 turns max (line 54-56).
- Archive is append-only JSONL by month, so no re-write overhead.

**Scenario:**
- Private messages between Iman and Zaal run daily: ~10-20 turns/day = ~5KB/day.
- Archive grows: 5KB × 365 days = ~1.8MB/year per chat.
- Ring buffer is capped at 20 turns = ~2KB per chat (max 2 chats active) = 4KB total.
- Disk pressure: **very low risk** over 2+ years.

**Mitigation (current):** Ring buffer cap + monthly archive rotation prevent runaway growth.

**Fix (optional, P3):**
Archive rotation policy: delete `.jsonl` files older than 12 months.
```typescript
async function pruneOldArchives(scope: string, retentionMonths = 12): Promise<void> {
  const archiveDir = join(COWORK_PATHS.archive, scope);
  const files = await fs.readdir(archiveDir).catch(() => []);
  const now = new Date();
  for (const file of files) {
    const m = file.match(/(\d{4})-(\d{2})\.jsonl/);
    if (!m) continue;
    const [_, year, month] = m;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (now.getTime() - date.getTime() > retentionMonths * 30 * 24 * 60 * 60 * 1000) {
      await fs.unlink(join(archiveDir, file)).catch(() => {});
    }
  }
}
```

---

### P2: User Prefs File Permissions - Root-Only Access OK (Single-User VPS)

**Subsystem:** `users.ts`  
**Severity:** P2 - Privilege escalation risk (mitigated)  
**Lines affected:** 43-49 (saveUserPrefs + chmod 600)

**Design Quality:** GOOD for single-user VPS, but not multi-tenant.

**Current:**
- Files stored at `~/.zaocoworking/users/<tg_id>.json` with `chmod 600`.
- Root is the only user on VPS (no shared hosting).
- API keys are encrypted in transit (HTTPS), stored plaintext at rest.

**Risk:**
- If VPS is compromised at root level, attacker reads all user API keys.
- No at-rest encryption.

**Mitigation (current):**
- VPS is private (Hostinger KVM), SSH key only.
- Team uses it for bot + web app (internal only, no public facing API).
- API keys are for Anthropic/OpenAI (not financial services).

**Fix (P3, not urgent):**
```typescript
import crypto from 'node:crypto';

const ENCRYPTION_KEY = process.env.USERS_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) throw new Error('USERS_ENCRYPTION_KEY not set');

async function saveUserPrefs(prefs: UserPrefs): Promise<void> {
  await fs.mkdir(USERS_DIR, { recursive: true });
  prefs.updated_at = new Date().toISOString();
  const plaintext = JSON.stringify(prefs, null, 2);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  const encrypted = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
  await fs.writeFile(userPath(prefs.tg_id), encrypted, 'utf8');
  await fs.chmod(userPath(prefs.tg_id), 0o600);
}
```

---

### P2: Roster Cache TTL - Stale Roster on Boot (Cold Start)

**Subsystem:** `roster.ts`  
**Severity:** P2 - Reduced feature availability  
**Lines affected:** 118-140 (loadRoster with 3-tier fallback)

**Design Quality:** EXCELLENT - 3-tier fallback strategy
1. GitHub fetch (source of truth).
2. Local cache (last-known-good).
3. ENV vars (cold start without network).

**Scenario:**
- Bot boots without GitHub token or network.
- Fallback to ENV vars: uses ALLOWLIST_USER_IDS, ALLOWLIST_CHAT_IDS.
- If roster was just updated in GitHub (e.g., Iman added a new user), bot won't see them until next `/reload`.

**Evidence (VPS state):**
```
Team.json exists locally + was fetched (recent timestamp 2026-05-18T12:01Z).
Fallback logic is sound.
```

**Mitigation (current):**
- Network outages are rare on Hostinger.
- Iman runs `/reload` after roster changes.
- ENV vars are hardcoded at systemd unit startup (5 users in the current team).

**No fix needed** - design is robust.

---

### P3: Roster Write Without SHADance Guard

**Subsystem:** `roster.ts`  
**Severity:** P3 - Edge case, low probability  
**Lines affected:** 232-250 (commitRoster)

**Issue:**
- `commitRoster()` reads memCache SHA (line 235): `const sha = memCache?.sha ?? '';`
- If memCache is null (e.g., after forceful memory reset), writes to GitHub with sha=''.
- GitHub may accept sha='' for new files, but on conflict, commit succeeds but doesn't actually update (API quirk).

**Evidence (VPS state):**
```
memCache is in-memory; if bot restarts, memCache is null.
Next roster update would use sha=''.
```

**Mitigation (current):**
- Roster updates are rare (team is stable, 5 members).
- `forceReloadRoster()` is called after every addOrUpdateMember / addAllowedChat, so memCache is refreshed.

**Fix:**
```typescript
async function commitRoster(team: TeamFile, message: string): Promise<void> {
  const oc = octokit();
  if (!oc) throw new Error('GITHUB_TOKEN missing');
  let sha = memCache?.sha;
  if (!sha) {
    // memCache is stale/missing - re-fetch before commit
    const fresh = await fetchFromGithub();
    sha = fresh?.sha ?? '';
  }
  const res = await oc.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: PATH,
    branch: BRANCH,
    message,
    sha: sha || undefined,
    content: Buffer.from(JSON.stringify(team, null, 2)).toString('base64'),
  });
  // ...
}
```

---

### P3: Sentinel Files for Scheduler Idempotency (Morning Digest)

**Subsystem:** Bot scheduler (referenced in paths.ts, used by morning_digest command)  
**Severity:** P3 - UX degradation  
**Lines affected:** paths.ts line 18, no validation logic in audit scope

**Design Pattern Observed (VPS state):**
```
sentinels/morning-digest-2026-05-18.flag
```

**Issue:**
- Sentinel file prevents duplicate morning digests within a day.
- If VPS clock skews backward (NTP failure) or admin manually sets clock, bot could send digest twice.

**Mitigation (current):**
- Hostinger provides stable NTP.
- Telegram rate limiting would block duplicate sends anyway.

**No fix needed** - acceptable for internal tool.

---

## State Machine Summary

| Subsystem | Pattern | Quality | Gap | Fix |
|-----------|---------|---------|-----|-----|
| Actions (data/actions.json) | SHA-dance retry (3x, exponential backoff) | GOOD | No observability (labels) | Add debugLabel param |
| Transcripts (archive + ring buffer) | Append-first, best-effort ring buffer | EXCELLENT | No retention policy | Prune archives >12mo |
| User prefs | File per user, chmod 600 | GOOD | No encryption at rest | AES-256 wrapper |
| Roster (GitHub + local fallback) | 3-tier fallback | EXCELLENT | commitRoster uses stale SHA | Re-fetch on empty SHA |
| Memory (persona/human) | Version-marker seedOrUpdate | GOOD | Not idempotent | Add lock file guard |
| Pending suggestion | Single global file | WEAK | Collision risk on concurrent users | Scoped (chat_id, user_id) keys |
| Backups | Timestamped .user-bak files | BASIC | Unbounded accumulation | Keep only 3 most recent |
| Sentinels (morning digest) | Filename flag | ACCEPTABLE | Clock skew risk | Log event timestamp in flag |

---

## Recommended Action Order

1. **P0 - Fix version migration idempotency** (1 hour)
   - Add lock file guard to seedOrUpdate.
   - Deploy v2.13.
   - Verify no persona corruption on next bot restart.

2. **P1 - Fix pending suggestion collision** (2 hours)
   - Refactor to scoped file keys (chat_id, user_id).
   - Test with 2 concurrent /setmodel commands in different DMs.
   - Deploy v2.14.

3. **P1 - Add backup cleanup policy** (1 hour)
   - Keep only 3 most recent .user-bak.* files per path.
   - Deploy v2.15.

4. **P2 - Add observability to actions mutation** (1 hour, optional)
   - Add debugLabel to mutateActions calls.
   - Deploy v2.16.

5. **P3 - Add retention policy to transcripts** (1 hour, optional, defer 6mo)
   - Prune archives older than 12 months.

---

## VPS Disk Health (Snapshot 2026-05-18T12:01Z)

```
~/.zaocoworking/        116 KB total
  actions.json          ~17 KB (24 items, ~700B per item)
  archive/              ~8 KB (2 months of chat)
  recent/               ~9 KB (40 recent turns)
  backups               ~3 KB (3 .user-bak files)
  other (sentinels, etc) ~79 KB
```

**Trend:** Safe for 2+ years under current usage. Recommend quarterly reviews if team scales to >50 members.

---

## References

- Doc 662 (bot architecture): Sections B.1-B.7.
- Doc 650 (cowork-zaodevz design): Iman's original spec.
- Doc 661 (bot deployment): systemd unit config + VPS setup.
- CLAUDE.md: Security rules (atomic writes, session isolation).
