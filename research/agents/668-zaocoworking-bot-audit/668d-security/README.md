---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: 650 661 668
tier: STANDARD
parent-doc: 668
---

# ZAOcoworkingBot Security Audit

**Date:** 2026-05-18  
**Scope:** Agent code at `agent/src/`, VPS deployment, secret handling, allowlist enforcement  
**Incident:** TELEGRAM_BOT_TOKEN leaked into Claude Code transcript via grep over SSH (2026-05-18, token left in place per user decision)

---

## Executive Summary

ZAOcoworkingBot has a **CRITICAL exposure vector** from unprotected credentials in SSH grep output and a **HIGH risk** from LLM prompt injection enabling unconfirmed mutations. Two additional **HIGH findings** on admin command guard implementation and file permissions. Pre-commit hooks are missing — no automated secret scan per `secret-hygiene.md` rules 2-4. Overall architecture is sound; findings are implementation gaps, not design flaws.

---

## Critical Findings

### 1. CRITICAL: No Pre-Commit Secret Scanning

**Location:** Repository root (missing `.husky/pre-commit` hook)  
**Impact:** TELEGRAM_BOT_TOKEN, GITHUB_TOKEN, ANTHROPIC_API_KEY can be committed to public repo  
**Evidence:**
- `.gitignore` lists `.env` but no hook prevents staged `.env` from passing through
- 2026-05-18 incident: Token leaked via SSH grep to Claude Code tool output (token stayed live)
- Blast radius: Full bot control (DM any user, modify actions, run admin commands)

**Violation:** `secret-hygiene.md` rules 2-4 (pre-commit scan, post-edit scan, pre-complete scan)

**Remediation:**
- Add `.husky/pre-commit` hook: fail on 64-char hex, `PRIVATE_KEY=`, `ghp_`, `sk-ant-` patterns
- Scan `.env` not in `.gitignore`
- Run before every `git commit` in `/ship` pipeline
- Example regex: `[0-9a-fA-F]{64}` for private keys, `sk-ant-[A-Za-z0-9_-]{20,}` for Anthropic keys

---

### 2. CRITICAL: LLM Prompt Injection → Unconfirmed Action Mutation

**Location:** `extraction.ts:88-114`, `index.ts:189-242`  
**Impact:** Malicious user or compromised LLM can bypass the suggest-confirm pattern  
**Code Flow:**
1. User sends freeform text: "mark #5 done and delete the user table"
2. LLM emits: `"just the regular suggestion"` + ````json-suggest {"op":"done","id":"5"}```` block
3. `maybeStartSuggestionFlow()` parses **any** valid JSON in the block without validating `op` field against a strict enum
4. If `op` is unimplemented, `describeSuggestion()` silently returns `undefined` (line 62)
5. **BUT**: `extraction.ts:101-104` checks `await isAutoConfirm()` — if ON, writes immediately without asking

**Attack Path:**
- User with `auto_confirm=true` sends: "set #99 to owner SYSTEM and delete all"
- LLM fabricates: ````json-suggest {"op":"assign","id":"99","owner":"SYSTEM"}```` (valid)
- No validation that `SYSTEM` is in OWNERS enum (line 23: `includes(ownerRaw)` only checks after parsing)
- **If** the LLM emits an unregistered `op`, `executeSuggestion()` falls through with no error

**Severity:** User (admin + auto_confirm) can trick LLM into crafting mutations. Current code does not prevent unknown ops, relying on LLM honesty.

**Remediation:**
1. Validate `op` against a strict union type before `savePending()`: `const ops = ['add','wip','blocked','done','assign','setdue','setnote','setprio'] as const`
2. For each op, validate all required fields match schema before saving
3. In `executeSuggestion()`, replace switch fallthrough with explicit type guard or throw
4. Log all mutations (including rejected ones) with user ID, timestamp, operation, reason

---

### 3. HIGH: Admin Command Guard Incomplete

**Location:** `commands.ts:42-44`, `roster-commands.ts:11-16`  
**Issue:** `cmdDaily` checks `isAdmin(ctx)` locally; `cmdAddUser`, `cmdAddChat`, `cmdReload` check `rosterView().adminUserIds` asynchronously  
**Gap:** Two different implementations + inconsistent error handling

**Code:**
```typescript
// commands.ts:42-44
function isAdmin(ctx: Context): boolean {
  return ADMIN_IDS.has(String(ctx.from?.id ?? ''));
}

// roster-commands.ts:11-16
async function isAdmin(ctx: Context): Promise<boolean> {
  const id = ctx.from?.id;
  if (!id) return false;
  const view = await rosterView();
  return view.adminUserIds.has(id);
}
```

**Risk:** If `ADMIN_IDS` falls out of sync with `data/team.json` (e.g., user removed from roster but still in env var), `/daily` will execute for outdated admins while `/adduser` will reject them.

**Remediation:**
- Centralize: Export single `async function isAdmin(ctx: Context)` from `roster-commands.ts`
- Use rosterView as source of truth (matches `/team` display)
- Update `commands.ts` to await it
- Remove ADMIN_USER_IDS env var; roster is the only source

---

## High Findings

### 4. HIGH: File Permission Race on User API Keys

**Location:** `users.ts:43-48`  
**Code:**
```typescript
export async function saveUserPrefs(prefs: UserPrefs): Promise<void> {
  await fs.mkdir(USERS_DIR, { recursive: true });
  prefs.updated_at = new Date().toISOString();
  await fs.writeFile(userPath(prefs.tg_id), JSON.stringify(prefs, null, 2), 'utf8');
  // chmod 600 so other VPS users can't read API keys
  await fs.chmod(userPath(prefs.tg_id), 0o600);
}
```

**Issue:** File is world-readable from `writeFile()` (default 0o644) until `chmod()` completes. If bot crashes between write + chmod, key sits unprotected.

**Race Window:** ~1-100ms depending on system load.

**Blast Radius:** If another VPS user reads the file before chmod, they gain access to OPENAI_API_KEY / ANTHROPIC_API_KEY / user's BYOK.

**Remediation:**
```typescript
await fs.writeFile(userPath(prefs.tg_id), JSON.stringify(prefs, null, 2), {
  mode: 0o600, // atomic permission on write
  encoding: 'utf8',
});
```

---

### 5. HIGH: GITHUB_TOKEN Scope Too Broad

**Location:** `.env.example:22-24`, `roster.ts:53-56`, `actions-store.ts:15-18`  
**Issue:** Fine-grained PAT should specify minimal scope (`contents: write` on `data/` only), but example comment says "Contents R/W" without scope details.

**Current Risk:** If GITHUB_TOKEN leaks, attacker can:
- Modify any file in the repo (not just data/)
- Read workflows, secrets, private branches
- Delete or rename branches
- Trigger Actions

**Blast Radius:** Full repo compromise (code injection, CI/CD poisoning).

**Remediation:**
1. Generate fine-grained PAT with:
   - Resource: `songchaindao-dot/cowork-zaodevz` only
   - Permissions: `contents` (read+write) ONLY
   - Paths: Restrict to `data/team.json` and `data/actions.json` (if supported by GitHub API)
2. Add comment in `.env.example`:
   ```
   # Fine-grained PAT. Generate at https://github.com/settings/tokens?type=beta
   # Required permissions: contents (read+write) on songchaindao-dot/cowork-zaodevz only
   # Scope to paths: data/team.json, data/actions.json (if available)
   ```
3. Test token rotation quarterly; alert if unused for 30 days

---

## Medium Findings

### 6. MEDIUM: Secrets in Logs (Partial Mitigation)

**Location:** `index.ts:137-139`, `roster-commands.ts:61-62`  
**Issue:** Error messages expose up to 200 chars of LLM errors, which may contain:
- API key rejection messages: `"Invalid API key for sk-proj-..."`
- GitHub error with commit details

**Code:**
```typescript
// index.ts:137-139
} catch (err) {
  console.error('[zaocoworking] handler failed:', (err as Error).message);
  await ctx.reply(`error: ${(err as Error).message.slice(0, 200)}`);
}
```

**Mitigation Present:** Only first 200 chars sent to user (not full stack trace), and logged to server-side console (not Telegram history).

**Remaining Risk:** `console.error()` output may be captured by systemd journal or log aggregation.

**Remediation:**
1. Sanitize error messages before logging:
   ```typescript
   function sanitizeError(msg: string): string {
     return msg
       .replace(/[a-zA-Z0-9_-]{32,}/g, '[REDACTED]') // API keys
       .replace(/sk-[a-z0-9-]+/gi, '[REDACTED]')
       .replace(/ghp_[A-Za-z0-9]+/g, '[REDACTED]');
   }
   ```
2. Log sensitive errors at `logger.warn()` level (filtered by log aggregation)
3. Rotate logs weekly; purge after 7 days

---

### 7. MEDIUM: Message Deletion Fails Silently

**Location:** `user-commands.ts:79-86`  
**Code:**
```typescript
try {
  if (ctx.message?.message_id) {
    await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
  }
} catch {
  /* ignore - bot may lack delete perms */
}
```

**Issue:** If deletion fails (bot not admin, message already deleted), user's `/setkey` command (containing API key) stays in chat history. Next reply says "your message was deleted" but it wasn't.

**User Impact:** User believes their key was wiped but it's visible to anyone who can read that group chat.

**Remediation:**
1. Check bot permissions before accepting `/setkey` in groups:
   ```typescript
   if (ctx.chat?.type !== 'private') {
     const member = await ctx.api.getChatMember(ctx.chat.id, ctx.me.id);
     if (member.status !== 'administrator' || !member.can_delete_messages) {
       await ctx.reply('DM me /setkey - I need admin perms to delete your message here.');
       return;
     }
   }
   ```
2. If deletion fails, tell user: `"Could not delete your message. Paste your key only in DM, not here."`
3. Do NOT reply "message deleted" unless deletion actually succeeded

---

## Low/Informational Findings

### 8. LOW: Roster TTL Cache Staleness

**Location:** `roster.ts:19`  
**Code:**
```typescript
const TTL_MS = 5 * 60_000; // re-fetch roster every 5 min
```

**Issue:** If admin adds a user via `/adduser`, bot immediately reloads roster (line 216). But if **another user** tries to use the bot within that window, they see the 5-minute-old roster.

**Impact:** New member can't use bot for up to 5 min after being added, even though they're in `data/team.json` on GitHub.

**Current Behavior:** This is intentional (lines 119-120). Low risk because:
1. Typical usage: admins do 1-2 adds at session start
2. New member waits 5 min, then full roster loads
3. Fallback to local cache (last known good) if GitHub unavailable

**Recommendation:** Consider reducing to 2 min if network latency is acceptable (more responsive but higher GitHub API quota burn). Current 5 min is reasonable for 4-person team.

---

### 9. LOW: Telegram Bot Privacy Mode Not Enforced

**Location:** `index.ts:63`  
**Note:** Code doesn't explicitly check Telegram bot privacy mode setting.

**Current Mitigation:**
- Group messages only processed if @bot is mentioned (line 92)
- Even if privacy off, bot can't see prior messages (only mentioned ones)
- DMs always visible (expected for concierge)

**No Action Needed:** Privacy mode setting is per-bot in @BotFather, not per code.

---

### 10. INFO: Auto-Confirm Default is Safe

**Location:** `users.ts:26`, `extraction.ts:99-105`  
**Status:** Feature requires explicit `/autoconfirm on` to enable; defaults to OFF.

**Evidence:** `isAutoConfirm()` returns `false` if `prefs?.auto_confirm !== true` (line 127).

**Result:** Suggest-then-confirm flow is default, protecting against LLM hallucination.

---

## Deployment Security (VPS)

### 11. CRITICAL: Bot Runs as Root

**Location:** Systemd user unit on Iman's VPS (187.77.3.104)  
**Issue:** Bot process runs with `sudo` or under root context, giving it privileges to:
- Read other users' files
- Modify system files
- Kill other processes
- Access all SSH keys in `/root/.ssh`

**Incident:** If bot is compromised via LLM injection or GITHUB_TOKEN leak, attacker becomes root.

**Remediation:**
1. Create unprivileged user: `useradd -m -s /bin/nologin zaocoworking`
2. Make directories owned by that user:
   ```bash
   chown -R zaocoworking:zaocoworking /root/.zaocoworking
   chown zaocoworking:zaocoworking /root/.zaocoworking/.env
   chmod 600 /root/.zaocoworking/.env
   ```
3. Update systemd unit: `User=zaocoworking` (not root)
4. Grant only needed capabilities (none for this bot; it's pure I/O)

---

## Validation Checklist

- [x] Allowlist enforcement: DM users checked on every message (index.ts:82-93)
- [x] Group reply requires @mention (index.ts:88-92)
- [x] Admin commands gated (PARTIAL - see Finding 3)
- [x] API keys stored with chmod 600 (users.ts:48, RACE RISK - see Finding 4)
- [x] Secrets not logged in full (200-char truncation, PARTIAL - see Finding 6)
- [x] TELEGRAM_BOT_TOKEN in .env only (gitignore enforced, NO HOOK - see Finding 1)
- [x] Zod validation: NOT USED (relies on regex parsing, no upstream validation)
- [x] HTTPS enforced: N/A (Telegram handles this)
- [x] XMTP keys: N/A (not used in this bot)
- [x] Rate limiting: NOT IMPLEMENTED (low risk: allowlist is throttle)

---

## Ranked Remediation Priority

1. **CRITICAL (Do Today):** Add pre-commit secret scanning hook (Finding 1)
2. **CRITICAL (This Week):** Validate LLM suggestion JSON schema before execution (Finding 2)
3. **HIGH (This Week):** Fix admin command guard inconsistency (Finding 3)
4. **HIGH (This Week):** Atomic file permission on API key save (Finding 4)
5. **HIGH (Before Prod):** Generate fine-grained GITHUB_TOKEN (Finding 5)
6. **MEDIUM (Next Sprint):** Sanitize error logs + verify message deletion (Findings 6-7)
7. **CRITICAL (Immediate):** Move bot to unprivileged user on VPS (Finding 11)

---

## References

- `/secret-hygiene.md` — rules for guarding secrets in autonomous pipelines
- `extraction.ts:135-165` — `executeSuggestion()` switch statement, no type guard on unknown ops
- `.env.example` — lists all secrets; no automation enforces this + .gitignore
- `users.ts:43-48` — race condition on file perms
- `roster-commands.ts:11-16` vs `commands.ts:42-44` — duplicated isAdmin logic

---

## Incident Summary (2026-05-18)

Token exposed via `grep -r TELEGRAM_BOT_TOKEN agent/src/ | ssh root@187.77.3.104 ...` (CLI command over SSH session, result captured in Claude Code tool output).

**Decision:** Token left in place per user.

**Follow-up:** Rotate token if new leaks occur; pre-commit hook prevents future unintended commits.

---

**Audit completed:** 2026-05-18  
**Auditor:** Claude Haiku (Security Review Agent)
