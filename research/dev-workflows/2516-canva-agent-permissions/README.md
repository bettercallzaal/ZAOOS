---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: "2515, 2517, 2433, 2412, 2411, 2473"
original-query: "can u go /zao-research and deep resaerhc about suing canva with agents"
tier: DISPATCH
---

# 2516 - Driving Canva with agents: what the permission model actually allows, and why our own library read as self-contradictory

> **Goal:** Establish, from measurement rather than from a brief, what an agent can and cannot do against a Canva design; explain why doc 2412 called Canva an empty auth stub and doc 2433 called it full four days later; and decide how ZAO should produce recurring card series like the ZAOstock countdown.

This is the hub of a DISPATCH run. Two sub-docs carry the detail:

- [2515 - Canva Connect API authorization](../../security/2515-canva-connect-api-authz/) - scopes, the OAuth flow, MCP-only surface, rate limits
- [2517 - Driving Canva with AI agents: what people actually report](../2517-canva-mcp-agent-reports/) - community sentiment, failure modes, what people moved to

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **A connector claim must name the ACCOUNT, not just the cwd.** Doc 2433's rule - "any 'Notion is connected' claim must say from where" - is correct and insufficient. Extend it: every connector inventory states which authenticated identity produced it. | Three measurements of "Canva" in this library disagree, and none is wrong. Doc 2412 (2026-08-24): auth stub, nothing reachable. Doc 2433 (2026-08-28): 16 brand kits, 50+ designs. This lane (2026-09-20, info@thezao.com): **2 designs, 0 brand kits, 0 brand templates**. They are three different auth identities, not a contradiction. Nobody had named the axis, so the library looked self-inconsistent. |
| 2 | **ZAO's Canva brand assets are on a personal Gmail account inside a team named after someone else. Raise ownership with Zaal; move nothing.** | Zaal's own Share panel, read 2026-09-20: design `DAG9Qtzie0M` owner is **zaalp99@gmail.com**, team **"Samantha aka Candy on Canva"**. The `ZAO STOCK` brand kit (`kAHTOce5OAk`) and every other ZAO kit measured in 2433 live there. `info@thezao.com` - the account ZAO's Gmail, Drive and Canva connectors authenticate as - holds none of it. Same shape as the Gmail draft split measured the same day. |
| 3 | **Edit access is required for an agent to edit OR export, and the invite must be ACCEPTED. Pending is not access.** | Canva's own help service, verbatim: "**Edit access** is required for integrations or apps to make changes or export designs" and "If you are invited to a design, **you need to accept the invite** for the access to take effect." Measured here: with the Share row reading **Can edit** but status **Pending invitation**, an editing transaction still returns `permission_denied`. A grant that has not been accepted looks identical to a grant that has, from the granter's side. |
| 4 | **The Autofill API - Canva's own supported route for generating a card series - is Canva Enterprise only, and it does not inherit.** Doc 2433 recommends Canva as the ZAOstock production surface; half that recommendation is written against a tier we do not hold. | `canva.dev` create-design-autofill-job, verbatim: "your integration must act on behalf of a user who is a member of a Canva Enterprise organization." The autofill guide adds that the developer's Enterprise subscription "doesn't extend to the integration users" - both sides must be Enterprise independently. Brand-template *dataset reads* need only Pro; it is generation that is gated. |
| 5 | **For the 14-card ZAOstock countdown, USE Bulk Create (Canva's own UI, Pro tier, no API) - not fourteen agent-driven edits.** | `canva.com/help/bulk-create/`: available on Pro/Teams/Business/Enterprise/Education/Nonprofits, desktop only, up to **300 rows**. Fourteen cards is one spreadsheet and one dialog, on a tier already held, with no API, no OAuth, no Enterprise, and no dependence on the invite being accepted. It is click-driven so no agent can trigger it - that is a real limit, and for a once-a-year countdown it does not matter. |
| 6 | **For recurring, automatable card series, RENDER FROM THE DESIGN KIT rather than driving Canva.** The number is already in our code. | `getDaysUntilZaostock()` at `bot/src/zoe/companion.ts:62` already computes the countdown from `ZAOSTOCK_TARGET_DATE = "2026-10-03T00:00:00-04:00"`. `ZAODEVZ/ZAOstock:src/content/design-kit.ts` already holds every token and font the cards use. We are hand-editing a design fourteen times to display an integer our own code computes from data we already own. |
| 7 | **Branch from `origin/main` in a fresh worktree. NEVER branch from the ZAOOS main checkout.** | Measured today, twice, by this lane's own subagents. See section 5 - this is the most generally applicable finding in the doc and it is not about Canva. |

## 1. What was measured, and on which account

Everything below was run on **2026-09-20** from a Claude session authenticated as **info@thezao.com**, against design `DAG9Qtzie0M`.

| Call | Result |
|---|---|
| `read-design` (metadata, page_metadata, thumbnails) via the full share URL | **WORKS** |
| `read-design` with `open_transaction: true` | `Could not open an editing transaction: Not allowed to edit this design DAG9Qtzie0M`, code `permission_denied` |
| `read-design` `design_content` | same error - content requires a transaction |
| `copy-design` (bare id) | `Error copying design: Not allowed to access design with id 'DAG9Qtzie0M'` |
| `copy-design` (share URL) | `'design_id' must match pattern '^[a-zA-Z0-9_-]{1,50}$'` - URLs rejected by schema |
| `get-export-formats` | `Not allowed to access design with id DAG9Qtzie0M (Request ID: a3e233f8c8a4e5b8-IAD)` |
| `list-brand-kits` | `{"items":[]}` |
| `search-brand-templates` | `{"items":[]}` |
| `search-designs` | 2 designs: `ZAOstock pitch deck` (`DAHUiaPvKBk`, 31 pages), `ZABAL GAMEZ thumbnails` (`DAHLSLrptJ4`, 28 pages) |

**The empty results were controlled.** `search-designs` returned two real designs from the same account in the same session, so the connector is authenticated and does return content when a surface is populated. The empty brand-kit and brand-template lists are a property of this account, not a dead instrument. A scope gap (`brandkit:read`) is not excluded - the tool documents a `Missing scopes` error it did not emit here, so absence of that error is suggestive, not proof.

**The pattern.** Every call that accepts the share URL works, because the URL carries a collaboration `accessToken`. Every call that takes a bare 11-character design id - `copy-design`, `export-design`, `get-export-formats` - has no token to carry and falls back to the account's standing access, which is none. Editing is refused even with the token, because editing checks the ACL rather than the link.

## 2. Why our library disagreed with itself

Three docs, three answers, all honest:

| Doc | Date | Verdict on Canva | Identity |
|---|---|---|---|
| [2412](../../infrastructure/2412-dead-mcp-servers-vault-board-integration/) | 2026-08-24 | "not connected at all", auth stub only, "nothing reachable" | unnamed |
| [2433](../2433-mcp-connectors-together/) | 2026-08-28 | "connected, full" - 16 brand kits, 50+ designs, 4 zao folders | unnamed |
| This doc | 2026-09-20 | 2 designs, 0 kits, 0 templates, edit denied | **info@thezao.com** |

Doc 2433 already caught half of this and wrote the rule: "**Connector visibility is per-cwd and per-session**, which means any 'Notion is connected' claim must say from where." Today adds the other half. The same connector, from the same machine, on the same day, shows a different Canva depending on which Claude account the session authenticates as. A cwd does not determine that; an account does.

The cost of not naming the axis: 2412 and 2433 read as a flat contradiction, and a reader has no way to tell which to trust.

## 3. The permission model, in one paragraph

Canva manages "designs, assets, and permissions on a per-user basis" (Canva MCP docs, quoted in 2515). Read scopes (`design:meta:read`, `design:content:read`) are satisfied by view-level access, which a share link grants. Edit and export are ACL checks against the authenticated user, and both require **edit** permission on that specific design. Ownership is not required - a guest with edit access is enough - but the grant must be accepted first. Editing transactions and `copy-design` exist **only in the MCP surface**; doc 2515 enumerated all 111 `/docs/connect/*` and 18 `/docs/mcp/*` URLs in Canva's sitemap and found no REST equivalent. So the MCP server is not a thin wrapper over the public Connect API; it is a larger surface.

**One contradiction, left unresolved and flagged.** Doc 2515 found a Canva Help Center page stating that a "can edit" **link** excludes "make a copy" and "download/publish" for a non-team guest. Canva's help service, asked directly in this lane about a **named guest invite** at "can edit", answered that download, export and duplicate are all included and "are not separate permissions." These are two different sharing mechanisms and the sources may both be right. Our case is a named invite, so export is expected to work once accepted - **but this is a prediction, not a measurement.** It rests on one help-service answer and has not been tested, because the invite is still pending. If export fails after acceptance, this paragraph is where to look first.

## 4. How to produce a card series - the real options

The job: 14 near-identical PNGs where one numeral changes, and the last card reads TODAY.

| Approach | Tier needed | Agent-triggerable | Who edits the design later | Verdict |
|---|---|---|---|---|
| **Canva Autofill API** | **Enterprise**, both sides | Yes | A designer, in Canva's UI - best of all options | **BLOCKED.** Right tool, wrong tier |
| **Canva Bulk Create** | Pro (held) | **No** - desktop UI only | A designer, in Canva | **USE THIS for the Oct 3 countdown.** One CSV, one dialog |
| **Agent duplicate-and-edit** | Pro + accepted edit grant | Yes | A designer, in Canva | Works, but 14 round trips and the master ends up mutated. What the original brief specified |
| **SVG master + token substitution + resvg** | none | Yes | A designer, in Illustrator or Inkscape | **Best if this becomes recurring.** No server, no OAuth, sub-second for all 14 |
| **HTML/CSS + Playwright screenshot** | none | Yes | A developer only | Runner-up; better if layout logic gets complex |
| **Satori + resvg** | none | Yes | A developer only | Vercel's OG stack. Note: Satori converts text to paths, which is a real gotcha for numeral-swap cards |
| **Remotion stills** | none | Yes | A developer only | Only worth it if we also want animated countdown video |

Export throughput was never the constraint: 20 create-jobs/min, 75 per design per 5 min, 500 per user per 24h. **Download URLs expire after 24 hours**, so exported cards must be pulled down and stored, never linked.

## 5. The parked-checkout hazard (applies to every lane, not just Canva)

This lane's two subagents each cut a branch from `~/Documents/ZAO OS V1`, the ZAOOS main checkout. That checkout was parked on another lane's branch (`ws/research-2513-orca-ade-capabilities`), so both subagent branches inherited that lane's doc and index row. Both resulting PRs came out `mergeable=false, state=dirty`. The second subagent also left the main checkout parked on its own branch, moving it out from under whatever lane had it.

**The rule: branch from `origin/main` in a fresh worktree. Never from whatever the main checkout is sitting on.** This lane's own doc-2516 worktree did that and had no conflict.

**The repair, for the next person who hits it:** merge `origin/main` into the branch. A merge, not a rebase - nothing is rewritten, no force-push, and other lanes' work is preserved. Both PRs went to `mergeable=true` after one merge each. Doc 2513's content was verified byte-identical (**11976 bytes**) across `origin/main`, its own branch and both contaminated branches, so nothing was clobbered.

**And an instrument warning that cost this lane ten minutes.** `gh api repos/.../pulls/N/files` reports its diff against the **merge base**, not current main. On a stale branch it will show another lane's file as `+116/-0` and read exactly like contamination. `git diff origin/main <branch> -- <path>` on the same file was empty. This lane reported "PR touches a file it should not" and had to retract it. A files listing against a stale merge base is an instrument that reports contamination where there is none.

Separately: `wc -l` reported **0 lines** for a file that is 11976 bytes, because that file contains no newline characters. Exit code was 0 and the path was correct. `wc -c` and `git ls-tree -l` gave the true answer. A zero from `wc -l` is not "file absent" - per `.claude/rules/state-claims.md`, feed the filter something it must find before believing it.

## 6. The palette provenance failure

The brief that started this work carried six hex codes and three font families under the sentence "measured off the existing design, do not invent colours." None of them were measured off that design. All nine values are verbatim from `ZAODEVZ/ZAOstock:src/content/design-kit.ts` (public, pushed 2026-09-20T15:55:26Z, 8707 bytes), read directly from the file in this lane:

| Brief | Token | Role, in the file's own words |
|---|---|---|
| #F2E6CC | `paper-100` | "Cream. The page ground." |
| #1B130B | `night` | "The footer and the moose's ground." |
| #2E2015 | `ink-950` | "Ink. Text." |
| #C1662C | `red-500` | "Fireside." |
| #DFA23C | `gold-400` | "Sun." |
| #8F3E1E | `red-700` | "Ember." |

Fonts match too: Oswald headings, Rubik body, Space Mono labels. The Canva design those colours were supposedly sampled from is deep purple-navy with red type and carries none of them.

The failure shape is **a real measurement from surface A cited as if taken on surface B** - logged by the originating seat in `~/zao-vault/MISTAKES.md` as `borrowed-a-measurement-from-another-artifact`. It was caught because the executing lane refused to recolour to a palette it could not see in the file. **A brief is not evidence.** The useful generalisation: when a brief says "measured", it must say measured *where*, in the same sentence - the same discipline this doc's decision 1 applies to connector claims.

## Also See

- [2515 - Canva Connect API authorization](../../security/2515-canva-connect-api-authz/) - sub-doc, scopes and MCP-only surface
- [2517 - What people actually report](../2517-canva-mcp-agent-reports/) - sub-doc, community failure modes
- [2433 - The connector set, used together](../2433-mcp-connectors-together/) - needs the Enterprise correction written into it
- [2412 - Do not wire the dead MCP servers into the vault](../../infrastructure/2412-dead-mcp-servers-vault-board-integration/) - the "auth stub" reading
- [2411 - We have thirty tools and use six](../2411-tool-usage-audit-measured/)
- [2473 - The orchestrator's own capability audit](../../agents/2473-orchestrator-capability-audit/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Accept the Canva invite on `DAG9Qtzie0M` from a session signed in as info@thezao.com, so the Can-edit grant takes effect | @Zaal | Canva UI | 2026-09-21 |
| Produce the 14 countdown cards via Bulk Create from a 14-row CSV, rather than 14 agent edits | @Zaal | Canva UI | 2026-09-23 |
| Decide who owns ZAO's Canva assets - they sit on zaalp99@gmail.com inside the team "Samantha aka Candy on Canva". Move nothing until decided | @Zaal | Decision | 2026-09-27 |
| Write the Enterprise-gate correction INTO doc 2433's Canva rows, so a reader who finds 2433 first is not misled | @Zaal | PR | 2026-09-24 |
| Add "branch from origin/main in a fresh worktree, never from the main checkout" to `.claude/rules/agent-loops.md` | @Zaal | PR | 2026-09-24 |
| Resolve DAY 263 (page 1) vs DAY 103 (page 2) in `ZABAL Daily Designs` - same layout, one is stale | @Zaal | Canva UI | 2026-09-27 |
| Test whether a named guest with accepted edit access can actually export, closing the open contradiction in section 3 | @Zaal | Measurement | 2026-09-23 |

## Sources

Measured in this lane, 2026-09-20, account info@thezao.com:

- Canva MCP `read-design` / `copy-design` / `get-export-formats` / `list-brand-kits` / `search-brand-templates` / `search-designs` against `DAG9Qtzie0M` [FULL, method: direct tool calls, errors quoted verbatim above]
- Canva help service (`help` tool), two questions on integration permissions and guest export rights [FULL, method: direct tool call, answers quoted verbatim]
- Zaal's Canva Share panel for `DAG9Qtzie0M`, screenshot [FULL, method: user-supplied image - owner, team name and "Pending invitation" read directly off it]
- Gmail `search_threads` / `get_thread`, Canva invite email, thread `1a0bfa7bdf7e0dd0`, 2026-09-20T16:30:35Z [FULL, method: direct tool call]
- `ZAODEVZ/ZAOstock:src/content/design-kit.ts` [FULL, method: `gh api .../contents/... | base64 -d`, not a summary]
- `bot/src/zoe/companion.ts` lines 1-66 [FULL, method: grep against the doc-2516 worktree]
- `gh api repos/bettercallzaal/ZAOOS/pulls/3592`, `/3593` and their `/files` [FULL, method: `gh api`]
- `git ls-tree -l`, `git diff`, `git merge-base` across `origin/main` and three branches [FULL, method: git in an isolated worktree]
- `zao-research-index "canva"`, `gh search code --owner=bettercallzaal --owner=ZAODEVZ` [FULL]

Primary Canva documentation, fetched by the two sub-agents and recorded in full in the sub-docs:

- `canva.dev/docs/connect/api-reference/autofills/create-design-autofill-job/` [FULL, method: curl + HTML strip]
- `canva.dev/docs/connect/autofill-guide/` [FULL, method: curl + HTML strip]
- `canva.dev/docs/connect/api-reference/brand-templates/get-brand-template-dataset/` [FULL, method: curl + HTML strip]
- `canva.dev/docs/connect/api-reference/exports/create-design-export-job/` [FULL, method: curl + HTML strip]
- `canva.dev/docs/connect/api-reference/exports/get-design-export-job/` [FULL, method: curl + HTML strip]
- `canva.dev/docs/connect/api-reference/assets/create-asset-upload-job/` [FULL, method: curl + HTML strip]
- `canva.dev/docs/connect/api-requests-responses/` [FULL, method: curl + HTML strip]
- Canva sitemap.xml, all 111 `/docs/connect/*` and 18 `/docs/mcp/*` URLs enumerated [FULL, method: curl]
- `canva.com/help/data-autofill/` [FULL, method: exa web_fetch after curl hit a Cloudflare 403]
- `canva.com/help/bulk-create/` [PARTIAL - truncated at the fetcher's character cap; the plan-gating sentence was captured. method: exa web_fetch]
- `canva.dev/docs/connect/rate-limits/` [FAILED - HTTP 404; the page does not exist, limits are stated per-endpoint. Ladder exhausted: curl, then exa]
- `canva.com/pricing/` [FAILED - curl HTTP 403 Cloudflare, exa returned a JS shell. Tier gating established from canva.dev instead, which is authoritative for API access anyway]
- BusinessWire, Canva MCP press release, 2025-06-26 [FULL, method: curl + HTML strip]
- The Verge, Claude support live 2025-07-14 [FULL, method: curl + HTML strip]
- Reddit threads on Canva MCP reliability [FULL, method: `~/bin/zao-fetch-reddit.sh`, Arctic Shift]
- `anthropics/claude-code` issue 33124, `start-editing-transaction` hangs [FULL, method: `gh api`] - a distinct failure mode from `permission_denied`, recorded so the two are not conflated

**Known gap, stated rather than filled:** no source was found that reports this exact `permission_denied`-on-transaction failure with a pending invite. The diagnosis here rests on Canva's help service plus this lane's own measurement, not on a third party reproducing it.
