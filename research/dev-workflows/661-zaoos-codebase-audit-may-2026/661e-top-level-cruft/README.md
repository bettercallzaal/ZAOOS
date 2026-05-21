---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: 661
tier: STANDARD
parent-doc: 661
---

# 661e - Top-Level Repo Cruft Audit

## Top-Level Inventory

| Dir/File | Size | Last commit | Gitignored? | Verdict | Action |
|---|---|---|---|---|---|
| **agents/** | 10 files, 496 lines | 2026-05-06 | NO | KEEP | None - agent SOUL/PERSONA/TOOLS specs. Move from root to `src/lib/agents/_specs/` for co-location with runtime agents. See agents/ rationale below. |
| **android/** | 14 dirs, 396K .git | 2026-04-16 | Partial (.gradle, build) | KEEP | None - active Capacitor native shell per package.json `cap:ios/android` scripts. Last commit shows dock/shell UI work. |
| **ios/** | Shared .git w/android | 2026-04-16 | NO | KEEP | None - paired Capacitor native shell, no separate .git, synced via `cap sync` in build pipeline. |
| **apps/zabal-snap** | 9 files, Vercel deploy | 2026-04-16 | NO | KEEP (for now) | Consider graduating to own repo end-Q2 2026 if it becomes user-facing. Currently a Turborepo workspace. |
| **autoresearch-test-coverage/** | 1 TSV file | 2026-04-02 | NO | DELETE | Artifact from `/autoresearch` skill run. Commit message shows it rode along on unrelated batch. Remove via PR (not blocking). |
| **BRAIN/** | 7 files, 496 lines | 2026-04-20 | NO | KEEP | Canonical synthesized company context per doc 460/462. Active: hand-curated, nightly routine planned. Core to agent stack. |
| **build-log/** | 4 markdown docs, 183 lines | 2026-03-12 | NO | MOVE TO docs/ops/build-log/ | Historical build milestone tracker. Should live in `docs/` per monorepo layout. No active use post-MVP. |
| **csv import/** (name has space!) | 5 CSV files, 89KB | 2026-03-22 | NO | RENAME + MOVE | Bad dirname. Rename to `data/csv-import/` and consolidate with `data/` folder (merge both into one `data/` hierarchy). |
| **data/** | 3 CSVs, 53KB | 2026-03-30 | NO | MERGE | Fractal + Respect ledger imports. Merge into renamed `data/csv-import/`. Single canonical data/ folder post-merge. |
| **duodo-snap** | 12 dirs, 396K .git | 2026-04-11 | YES (.gitignore) | DELETE | Full git repo cloned into ZAOOS. Research snapshot for doc 319. Archived, not part of active workflow. Remove (not a submodule). |
| **nouns-snap** | 12 dirs, 304K .git | 2026-04-11 | YES (.gitignore) | DELETE | Full git repo cloned into ZAOOS. Research snapshot pairing. Archived. Remove (not a submodule). |
| **evals/** | 6 files, tests | 2026-04-20 | NO | KEEP | Eval fixtures for VAULT/BANKER/DEALER agents. Separate from Vitest unit tests per architecture. Active. |
| **graphify-out/** | 5 files + HTML viz | 2026-04-09 | YES | GITIGNORE (already is) | Output from `/graphify` skill runs (knowledge graphs). Already gitignored. Safe to leave; cleaned on next run. |
| **infra/portal** | 11 dirs, 352 MB | 2026-04-21 | NO | KEEP | Production VPS 1 config: Caddyfile, Cloudflare tunnel, spawn-server, auth, cron jobs. Critical infra. |
| **infra/hindsight/** | Docker compose, 1 file | 2026-03-28 | NO | EVALUATE | Hindsight memory system (doc 307 era). Check if hindsight-mcp-server in `mcp/` is still in use. If not, delete both. If yes, keep both. |
| **mcp/hindsight-mcp-server** | 1 TS file | 2026-03-29 | NO | EVALUATE | Local MCP server skeleton. Depends on status of infra/hindsight. Delete if hindsight is deprecated per doc 601. Keep if active. |
| **content/** | 5 files + bonfire-ingest subdir | 2026-05-17 | NO | KEEP | Transcripts, raw content for RAG/socials. BCZ YapZ graduated 2026-05-06. bonfire-ingest folder being actively used. |
| **contracts/** | Solidity staking/bounty | 2026-04-13 | NO | KEEP | Smart contracts per CLAUDE.md. Keep alongside `scripts/` for deployment. |
| **docs/** | 31 dirs, research layout | 2026-05-03 | NO | KEEP | Architecture decision records (ADRs), design docs. Canonical. Merge build-log/ files here. |
| **research/** | 540+ docs | Ongoing | NO | KEEP | Institutional memory. Sacred. Never delete or move. |
| **src/**, **public/**, **scripts/** | Active source | Ongoing | NO | KEEP | Canonical application code, assets, migrations. Core to monorepo. |

## P0 Actions (delete/gitignore now)

- **Delete `duodo-snap/` and `nouns-snap/`:** These are full git repos cloned into ZAOOS for research snapshots. Already gitignored but still committed. They bloat `.git` history (700K combined). Remove via PR. Research docs stay in `research/` as institutional memory.
- **Delete `autoresearch-test-coverage/results.tsv`:** Artifact from April 2 `/autoresearch` run. Rode in on unrelated commit. Remove via PR.

## P1 Actions (move/rename)

- **Rename `csv import/` to `data/csv-imports/`:** Bad directory name (space character). Merge contents with `data/` folder into single unified hierarchy: `data/` with subdirs: `csv-imports/` (Respect, Fractal, Wallet ledgers), `.gitkeep` for schema docs.
- **Move `build-log/` to `docs/ops/build-log/`:** Historical milestone tracker (MVP, scaffold, planning). No active use. Belongs in `docs/` alongside ops runbooks.

## P2 Actions (consider graduating)

- **apps/zabal-snap:** Currently a Turborepo workspace with 9 files. If this becomes user-facing (public dashboard, API gateway), graduate to own repo with own VPS + Vercel deploy config. For now, keep as shared workspace. Reevaluate end-Q2 2026.
- **Hindsight (infra/hindsight + mcp/hindsight-mcp-server):** Status unclear. Check doc 601 (agent-stack-cleanup). If deprecated (likely per doc 601 decommissioned list), delete both. If still active, keep both. Requires Zaal confirmation.

## Rationale: Why Some Dirs Stay

**agents/** (10 specs files): Distinct from `src/lib/agents/` (15 runtime files). This folder holds SOUL/PERSONA/HEARTBEAT/TOOLS metadata for agent archetypes (CEO, Researcher, Security Auditor, Founding Engineer). They're agent definitions, not runtime code. Should be co-located with runtime: move to `src/lib/agents/_specs/` so agent loader has one canonical path. Not deletion, just better organization.

**BRAIN/**: Intentional synthesis layer (doc 460/462). One-file-per-entity canonical truths for ZAO people, projects, decisions. Nightly routine planned. Core to agent knowledge architecture. Absolutely keep.

**evals/**: Eval fixtures for autonomous trading agents (VAULT/BANKER/DEALER) and concierge (ZOE). Separate from Vitest unit tests. Uses ECC `eval-harness` skill. Active.

**infra/portal**: Version-controlled config for production VPS 1 (31.97.148.88). Caddyfile, Cloudflare tunnel, spawn-server, auth, cron. Critical operational code. Absolutely keep.

**content/**: Transcript + raw-content ingest point for RAG, socials, newsletter. BCZ YapZ graduated 2026-05-06 with own repo; archives stay here as research memory. bonfire-ingest folder actively being used. Keep.

## Sources

- Package.json: `cap:ios/android` scripts confirm Capacitor native shells are active build targets.
- Git log: duodo-snap/nouns-snap last touched 2026-04-11 (archived research snapshot, doc 319).
- .gitignore: `graphify-out/`, `duodo-snap/`, `nouns-snap/` already ignored.
- CLAUDE.md: `infra/portal` listed as Cloudflare tunnels + portal infrastructure.
- doc 460/462: BRAIN architecture + synthesis pipeline.
- doc 601: Agent stack cleanup (decommissioned: openclaw, Composio AO, ZOE v2, 10-bot fleet). Need to verify hindsight status.
