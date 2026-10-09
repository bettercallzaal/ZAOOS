# Documentation lives in the repo, not in an artifact

An artifact's lifetime is tied to an account, and the account changed 2026-09-01 (one cited audit artifact is already unreachable). Measurement: `research/dev-workflows/2649-rules-history/archive/documentation-in-repo.md`.

**Anything a future session, a teammate, or Zaal will need to read again is written into a git repo. An artifact is a VIEW, never the copy of record.**

- Research, audits, decisions, specs, state -> `research/NNNN-slug/` in ZAOOS, or the relevant repo's docs.
- Lane state, briefs, people, the why behind a decision -> `~/zao-vault/`, committed and pushed.
- Task state -> the cowork board.
- An artifact is for a thing a human will LOOK at once. Publish it if it helps, then make sure the content exists in a repo and cite the repo path, not only the URL.
- **Never let an artifact id be the only address of a deliverable.** If an artifact is cited, cite its full UUID alongside a repo path; an 8-character prefix is not an address.

Guards: artifacts are not banned. Do not delete existing artifact URLs (deletion is Zaal's); mirror an artifact's content into the vault or library when it is next touched. Do not mirror content that has no home in a repo just to satisfy this rule.
