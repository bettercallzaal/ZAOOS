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
