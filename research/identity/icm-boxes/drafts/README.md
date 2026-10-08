# ICM Box Content Drafts (NOT published)

Drafts for ICM boxes that are currently EMPTY on useicm.com. Each `*.draft.llm.txt`
is generated from confirmed ZAO facts (memory + research + public docs) for Zaal to
review, edit, and publish via the `/icm` skill. **Publishing to a live box is gated
to Zaal** (public content); these repo drafts are safe artifacts, not published.

- `coc-concertz.draft.llm.txt` - needs Thy Revolution sign-off too (partnership framing).
- `poidh.draft.llm.txt` - confirm box scope (ZAO's-use-of-POIDH vs the platform) + the canonical URL.
- `zaostock.draft.llm.txt` - **no longer a create. The live box was populated some time
  before 2026-08-13** (curl returns 200 with content), so doc 2161's "#1 gap" is closed
  and this draft is now a proposed REPLACEMENT, rewritten against the official site.

**Before assuming a box is empty, curl it.** The local registry
(`~/.zao/private/icm-registry.json`) still lists `zaostock` as `"content": ""` while
the live box has 854 bytes - the same registry-drift bug doc 2161 flagged for Fractal.
The registry is a stale mirror; `https://useicm.com/api/objects/<id>/llm.txt` is the
source of truth, and reading it is unauthenticated.

Written in the overnight build loop 2026-07-30. Source lines are in each draft.

## Added 2026-08-20 (card 7f0af85c, one approval pass - doc 2241 actions)

- `zabalgamez.draft.llm.txt` - proposed REPLACEMENT for the live box (live 2139c,
  unchanged since the 8/7 snapshot, verified by fresh fetch 2026-08-20). Three
  changes vs live: (1) August arc updated to reality - six finalists announced
  2026-08-17, finals week Aug 24-30, no finalist names (kit still unmerged in
  zabalgamez PR #624); (2) ALL Magnetiq references removed (entry + Find it) per
  the retirement; (3) submissions URL restored from the repo copy. OPEN QUESTION
  for Zaal in the approval sheet: what replaces Magnetiq for signup/collectibles?
- **Magnetiq retirement** (doc 2241 item 4): no draft needed - the action is
  deleting/archiving live box icm_ObVlvn960SvOLc-W-IV3wQ (817c, byte-identical to
  `live-snapshots/magnetiq.llm.txt`, which stays as the permanent archive). Needs
  Zaal's owner key. The zabalgamez draft above already drops its Magnetiq lines,
  so no live box references Magnetiq after both actions.
- The three new-box drafts (`../zoe.draft.llm.txt`, `../zai.draft.llm.txt`,
  `../zol.draft.llm.txt`) verified still repo-only (registry = 23 live boxes,
  none of the three present) and fact-checked 2026-08-20; publish-ready as
  written. Approval sheet: zao-vault notes/icm-approval-sheet.md.

## Added 2026-10-08 (Zaal's ruling "A for icm", seat pane 11:0x ET)

The repo copy in `research/identity/icm-boxes/` is now the MASTER for every box: a
lane drafts each corrected box as a ZAOOS PR, Zaal approves the text, then it is
PUT to useicm.com and re-fetched and byte-compared. Order is worst first.

- `zaostock.draft.llm.txt` is SUPERSEDED by `../zaostock.llm.txt`. The live box
  (3718 bytes, fetched 2026-10-08, archived at `../live-snapshots/zaostock.llm.txt`)
  carried this draft's "Reviewer notes - decisions for Zaal" section in public and
  still described the festival as upcoming. The master rewrites it as a past event
  from zaostock.com as fetched 2026-10-08 (home: "ZAOstock 2026 is a wrap"; the
  lineup API and /artists: seven acts in running order). No dollar figures, no
  internal operations, no reviewer notes. The act that did not play is not named.
- `zabalgamez.draft.llm.txt` is SUPERSEDED by `../zabalgamez.llm.txt`, which is now
  the MASTER (repo copy wins; live is published FROM it after Zaal approves the
  text). The live box (2139 bytes, fetched 2026-10-08, archived at
  `../live-snapshots/zabalgamez.llm.txt`) still carried two retired names (lines
  11, 16 and 24 of the live text; glossary rows in ~/.claude/CLAUDE.md), the
  pre-finals August language, and "Games" in the title and body. The master
  writes Season 1 as complete from zabalgamez.com as fetched 2026-10-08 (home and
  /finals: six finalists, three battles, champions n3m, ghostmintops and
  uniquebeing404; 31 workshops, 31 projects, 15 people). No prize figures: the
  site shows two different USDC totals (home 450, finals 500), left for the site
  owner. /enter now redirects to /leaderboard, so the entry line names no path.
