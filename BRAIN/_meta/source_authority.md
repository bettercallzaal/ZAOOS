# Source Authority — 4 Tiers

> Per doc 462 ([Hyperspell company-brain pattern](../../research/agents/462-hyperspell-company-brain-context-graph/)).
> When two sources disagree on a fact, the source in the **higher tier wins**. Always. Log the conflict + resolution to [conflicts.md](./conflicts.md).

## Tier 1 — TRUTH (immutable or RLS-enforced)

These cannot be wrong without a chain or signed-doc problem. Trust them absolutely.

- **Signed contracts** (PDF in repo + counterparty signature)
- **On-chain state** (Base txs for ZABAL token, staking, bounty board)
- **Supabase tables with strict RLS** (`agent_events`, `audit_log`, `profiles` after auth)
- **Farcaster FIDs** (immutable identity primitive)

## Tier 2 — ARCHITECTURAL TRUTH (committed by Zaal, deliberate)

Considered decisions. Mutable by intent, not by accident. Never overruled by chat.

- `docs/adr/*.md` — Architecture Decision Records
- `.claude/memory.md` — project memory
- `community.config.ts` — branding, channels, contracts, admin FIDs
- `src/lib/agents/config.ts` — agent state config

## Tier 3 — INTENT (committed by Zaal but mutable)

Working state. Updated frequently. Treated as current unless contradicted by Tier 1 or 2.

- `research/**/*.md` — 240+ docs
- `ZOE workspace SOUL.md / AGENTS.md / TASKS.md` (when synced to git per doc 460 Gap 2)
- Auto-memory `~/.claude/projects/.../memory/` (when synced per doc 460 Gap 1)
- Existing `BRAIN/` files

## Tier 4 — SIGNAL (raw, unconfirmed)

Sensor data. Useful for "what's changed" detection. Never authoritative on its own.

- Telegram threads
- Email
- Slack (if added later)
- Casts on Farcaster
- Meeting transcripts
- Web articles

## Conflict Resolution Rules

1. **Higher tier always wins.** Tier 4 NEVER overrules Tier 1.
2. **Within the same tier, more recent wins** — by file `Date:` header or git commit timestamp.
3. **For Tier 3 (research docs), check the supersede chain.** Doc says "Supersedes: doc X" → that doc is authoritative within the lineage.
4. **When unsure, write the conflict to `conflicts.md` and keep BOTH sources visible in the entity file.** Better to surface the conflict than pick wrong.
5. **Never invent a source.** If the synthesis Routine can't find evidence, mark the field `unknown` + `last_confirmed_at: null`.
