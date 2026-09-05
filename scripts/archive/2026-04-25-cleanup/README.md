# scripts/ cleanup snapshot 2026-04-25

Bulk archive so Zaal could find the active migration. ~50 files total relocated here.
Pull anything back with: `git mv scripts/archive/2026-04-25-cleanup/<file> scripts/<file>`

## Categories

- Stock-* applied migrations: stock-audit-log, stock-bot-group/public-mode/v15, stock-circles-v1, stock-onepagers, stock-schema, stock-team-* + their TS code-seeders
- ZAO OS infra: generate-wallet, generate-ens-operator, register-* (caster-fid, neynar-webhook), configure-stream-grants, publish-bluesky-feed, backfill-youtube-video-ids, read-hats-tree
- Apo / OpenClaw: apo-optimize, openclaw-setup-github, openclaw-update-soul
- Seeds + DDL: seed-agent-config, seed-nexus-links, seed-research-docs, seed-voice-channels, seed-stock-team, create-user-app-config, add-room-slug-unique, v1-agent-migration
- Sync helpers: sync-fishbowlz, sync-issue-to-paperclip(.js + .ts), sync-youtube-urls(.ts + .gaps.log), set-youtube-url, import-community-csv, import-fractal-history
- Templates: artist-outreach-templates, sponsor-outreach-templates, team-lead-monday-report-messages, team-post-self-draft-guide, social-posts-apr18-build-in-public, fishbowlz-standalone-files
- Misc: brain-to-digest, clawdown-client, minimax-chat, score-research-docs, score-zao-research-skill, test-elevenlabs, test-lens-grove

## Restored 2026-09-03 - eight files that were still wired

The bulk archive moved files by category, not by whether anything still pointed at
them. Eight did, and every reference kept naming `scripts/<file>`, so each of these
commands failed with "Cannot find module" for the four months since:

| Restored file | Still referenced by |
|---|---|
| `generate-wallet.ts` | `.env.example:30`, `FORK.md:143,203`, `SECURITY.md`, `CLAUDE.md:75`, `AGENTS.md:84`, `src/app/api/auth/signer/route.ts:12` |
| `generate-ens-operator.ts` | `src/lib/env.ts:92`, `src/lib/ens/subnames.ts:138` (inside a thrown error) |
| `import-fractal-history.ts` | `package.json` (`import:fractals`), `README.md:412` |
| `brain-to-digest.js` | `package.json` (`brain:digest`), `BRAIN/README.md`, `BRAIN/_meta/DIGEST.md` |
| `configure-stream-grants.ts` | `README.md:521` |
| `import-community-csv.ts` | `FORK.md:265` |
| `register-neynar-webhook.ts` | `FORK.md:255` |
| `seed-voice-channels.ts` | `FORK.md:260` |

Restoring rather than repointing is deliberate: it makes every existing reference
true with no edits to live code or docs, and `brain-to-digest.js` resolves
`path.resolve(__dirname, '..')` as the repo root only from `scripts/`.

The category lines above are left as written - they are the record of what the
2026-04-25 sweep moved, not an index of what is here now.

## Re-run safety notes

- `set-stock-team-random-codes.ts` re-randomizes ALL 4-letter codes - DO NOT run after codes are sent (per `feedback_no_regenerate_codes` memory)
- `seed-*` scripts are idempotent in most cases but assume virgin state
- Migration .sql files are idempotent (CREATE TABLE IF NOT EXISTS)

## Active in scripts/ (top-level after this cleanup)

- `stock-missing-tables-migration.sql` - Zaal needs to paste this in Supabase
- `safe-git-push/` - active pre-push hook directory
- folders: `apo-prompts/`, `archive/`, `old/`, `stock-archive/`, `zoe-learning-pings/`
