# scripts/zao-crm-sync

One-shot Python scripts that sync from external sources into the ZAO CRM AGENTIC Airtable base. Promoted from `/tmp` after first prod run on 2026-05-25.

## Why

Doc 737 defined the Airtable CRM schema (contacts / activity / opportunities). Doc 739 documented the native Anthropic connectors (Gmail / GCal / GDrive) that fetch source data. These scripts are the glue: read what the connectors return, redact PII per `.claude/rules/pii-hygiene.md`, write rows to Airtable via REST.

Same shape as the cowork tracker's cross-source writers (PR test plans / meeting actions / inbox action-items) - each writer uses a distinct `source` value so the Airtable view can be filtered by origin.

## Env

All scripts source `~/.zao/zao.env` for `AIRTABLE_CRM_TOKEN` + `AIRTABLE_CRM_BASE_ID` per doc 737 setup.

## Scripts

| Script | What | First prod run |
|--------|------|----------------|
| `gmail-week-import.py` | Curated list of recent Gmail threads -> contacts + activity rows. Filters noise (Vercel / GitHub / newsletters), enriches existing contacts with newly-discovered email addresses. | 2026-05-25 (10 activity + 6 new contacts + 3 enriched) |
| `jordan-workshop-fixture.py` | One-shot fixture: Jordan Oram (yerbearzerker) June 1 6am EST workshop activity + opportunity. Reference example of the manual-import shape. | 2026-05-25 |
| `airtable-to-supabase.py` | **One-time migration** of every contact + activity from the Airtable base into the native Supabase CRM (`crm_contacts` / `crm_interactions`, doc 772). Dry-run by default; `--apply` to write. Stamps `legacy_airtable_id` for re-runnable idempotency. | (pending) |

## Migrating Airtable -> Supabase (doc 772)

`airtable-to-supabase.py` moves the Airtable CRM into the native Supabase tables. It needs BOTH cred sets in env — the Airtable token (`~/.zao/zao.env`) and the Supabase service-role key (the bot's `.env`):

```bash
source ~/.zao/zao.env && set -a && . ~/zao-os/bot/.env && set +a
python3 scripts/zao-crm-sync/airtable-to-supabase.py            # dry run — writes nothing
python3 scripts/zao-crm-sync/airtable-to-supabase.py --apply    # migrate for real
```

- **Safe by default**: no `--apply` = prints a summary only.
- **Idempotent**: `--apply` clears prior migrated rows (`legacy_airtable_id IS NOT NULL`, cascading their interactions) then re-inserts. Manually-added contacts (NULL legacy id) are untouched. A re-run resets migrated rows, so publish/edit migrated contacts *after* the final run.
- **Private by default**: migrated contacts land `is_public=false`; nothing hits `/network` until you publish it in `/crm`.

## Adding a new sync source

1. Copy `gmail-week-import.py` as template.
2. Replace the source-fetch step with your data source (GCal events, GDrive docs, GitHub PRs, etc).
3. Define which fields per `contacts` and `activity` table the source maps to.
4. Pick a unique `source` value (`gmail-mcp` / `gcal-mcp` / `github-mcp` / `manual` / etc per doc 737 schema).
5. Always set `raw_source` to a `~/.zao/private/<service>-<window>.json` path per PR #666 perimeter - raw stays off-repo.
6. Run with `source ~/.zao/zao.env && export AIRTABLE_CRM_TOKEN AIRTABLE_CRM_BASE_ID && python3 scripts/zao-crm-sync/<name>.py`.

## Idempotency

These scripts do NOT auto-dedupe activity rows. They're run once per import window. To re-run safely either delete prior rows in Airtable UI first OR add a `legacy_id` filter at the top.

Contacts ARE dedup-aware via an `EXISTING` dict at the top of each script. Update that dict when adding a new contact.

## PII

Third-party emails + names go directly into Airtable. Workspace is private to Zaal + invited team. PII redaction kicks in when data LEAVES Airtable (research docs / Bonfire / Telegram blocks) per `.claude/rules/pii-hygiene.md`.

NEVER paste raw email contents into chat without explicit permission. NEVER commit raw email JSON to git - the `~/.zao/private/` perimeter (PR #666) handles this.

## Related

- Doc 737: ZAO CRM AGENTIC Airtable schema (canonical)
- Doc 739: native Anthropic connectors (Gmail / GCal / GDrive) - source-fetch layer
- `~/bin/zao-tracker`: writes to the OTHER store (Supabase cowork tracker for tasks/Kanban). Airtable = relationships, Supabase = throughput.
- `.claude/rules/pii-hygiene.md`: redaction rules for data leaving Airtable
- `~/.zao/private/`: off-repo raw dump location (chmod 600, gitignored)
