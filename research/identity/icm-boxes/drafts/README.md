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
