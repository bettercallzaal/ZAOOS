# ZAOstock SQL Archive

Historical migrations. Kept for traceability. Not needed for new setups.

For current state: run `../stock-schema.sql` (idempotent, one paste).

## Timeline

| Date | File | What it did |
|------|------|------------|
| Apr 14 | stock-team-setup.sql | Initial 3 tables + 14 team member seed + 20 todos |
| Apr 15 | stock-team-sponsors.sql | stock_sponsors + 18 lead seeds |
| Apr 15 | stock-team-artists-timeline.sql | stock_artists + stock_timeline + 9 artist + 49 milestone seeds |
| Apr 15 | stock-team-wave3.sql | stock_volunteers + stock_budget_entries + stock_meeting_notes + 15 budget entries |
| Apr 16 | stock-team-meeting-prep.sql | 12 prep milestones + Tuesday meeting note stub |
| Apr 17 | stock-team-distribution-prep.sql | Additional Sat-Mon prep milestones |
| Apr 17 | stock-team-bios.sql | bio / links / photo_url added to stock_team_members |
| Apr 17 | stock-team-run-of-show.sql | day_of_start_time + day_of_duration_min on stock_artists |
| Apr 18 | stock-team-tuesday-agenda-v2.sql | Tuesday v2 agenda |
| Apr 18 | stock-team-tuesday-agenda-v3.sql | Tuesday v3 agenda |
| Apr 18 | stock-team-tuesday-recover.sql | Tuesday note re-seed |
| Apr 18 | stock-team-cypher-signup.sql | cypher_interested + cypher_role |
| Apr 21 | stock-team-artist-claim.sql | bio / photo_url / logo_url / social_post_url / claim_token / points_earned / volunteer_eligible + backfill |
| Apr 21 | stock-team-suggestions.sql | stock_suggestions table |

## What stays at scripts/ root

- `stock-schema.sql` - canonical, idempotent, one paste for full schema
- `stock-team-apr21-recap.sql` - latest meeting + 10 Zaal todos + Tyler role bump
- `set-stock-team-random-codes.ts` - password code generator
- `set-stock-team-4letter-codes.ts` - legacy name-based generator
- `seed-stock-team.ts` - initial seed script
