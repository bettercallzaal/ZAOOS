# Session Boundaries - one thread, one named session

Sessions fail from context conflict (superseded state held beside current state), not length. The 2026-08-09 evidence: `research/dev-workflows/2649-rules-history/archive/session-boundaries.md`.

**A new thread gets a new session. The handoff is the artifact, never the conversation.**

- **One thread per session.** A different product, repo, or problem is a new session.
- **Name it, always,** after the thread, not the tool (`zabal-finale`, `bonfire-retry`). The status line shows `unnamed` in amber when there is none.
- **The artifact carries the state:** a PR, a research doc, a board task, a vault handoff.
- **Remote Control on** (`remoteControlAtStartup: true`) so a named session is reachable from Zaal's phone.

**Start fresh when ANY is true** (do not wait for compaction): 1. the subject changed; 2. a fact you held got reversed (land the correction, then start fresh); 3. you just shipped; 4. you are re-reading something already read or re-proposing something already rejected; 5. compaction fired (a late alarm).

Not "compact more often", and not a ban on long sessions on ONE thread. Carry load-bearing context in the artifact so the next session reads it fresh.
