---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-06
superseded-by:
related-docs: "agents/2586-orchestrator-seat-outside-view, agents/2473-orchestrator-capability-audit, agents/2175-sovereign-agent-deliverables-architect-report, agents/601-agent-stack-cleanup-decision, agents/2622-dreamnet-hardening-phase0-ground-truth-and-verification"
original-query: "i really want to hand off some more of my manual takss to agents and a swarm with dreamnet and more and integrate it more inot my life (Zaal, 2026-10-06, vault 9ce90b3e, board card 10256)"
tier: STANDARD
---

# 2623 - Zaal's manual tasks, 2026-10-06: what an agent could take, what stops it, and the ruling that releases it

> **Goal:** Take the fourteen things Zaal did by hand on 2026-10-06 and, for each one, name who or what could take it over, what stops that today, the smallest ruling or setup that would release it, and what must stay his. This is the doc that `CLAUDE.md` requires before any new bot, daemon or loop is built. It builds nothing.

**Source of the task list:** the orchestrator seat's list of Zaal's manual tasks for 2026-10-06, sent to this lane. Where the vault records the same task, that record is cited. Zaal's direction is in vault `decisions/grill-2026-10-06-icm.md:59-61`, which logs it "as a direction, not a build order and not a change to any gate".

---

## 1. Executive summary

Of the fourteen tasks, **five can be largely handed off with a small ruling and a small script**:
- grill triage
- email drafting
- camera-card copying
- payout preparation
- the merge check on fork PRs

**Six can be made one-tap but must stay his**, because they move money, sign on-chain, publish, or need his hands on a key or a login: payments, the poidh bounty, the newsletter publish, the daily drip, key entry and rotation, and connector logins.

**Three have no working tooling yet**: Apps Script runs, the memory watchdog, and the classifier-blocked push, whose defer queue is an unwired prototype. Connector-expiry detection is also missing, though the login itself stays his.

The pattern underneath matches what DreamNet calls a dreamloop: a behaviour unit with explicit allowed and blocked actions, a promotion path, and receipts. `bettercallzaal/zol` already runs 72 of them. "A swarm with DreamNet" should mean writing each released task as one of those manifests, with money, on-chain and publish in `blocked_actions`. It should not mean a new bot.

## 2. Why this matters

Every hand-done task is a context switch for the one person the whole estate waits on. `lane-autonomy.md` was written because "9 of 9 active local lanes were WAITING on Zaal". Most of today's list is not judgement. It is copying, pasting, plugging in and clicking. That is the work `code-over-inference.md` says should become a script once, and that `agent-loops.md` rule 8 already allows agents to do, as long as outbound, on-chain and spend stay with him.

## 3. Before vs after

**Before:** fourteen manual tasks, each done fresh, with about 50 grill questions answered one by one, mixing gated decisions with reversible ones.

**After the five releases in section 7:**
- The grill shows him only gated questions.
- Thank-yous wait in Gmail Drafts.
- Card files copy themselves when the drive mounts.
- Payouts arrive as a ready-to-send packet.
- Fork-PR merges come with the red check already explained.

His remaining manual work is the work that is genuinely his: send, sign, publish, log in.

---

## 4. The map

Columns: **Could take it** (an existing lane, ZOE, a script per `code-over-inference.md`, or a dreamloop-style swarm role) / **What stops it today** / **Smallest release** / **Stays his**.

| # | Task | Could take it | What stops it today (evidence) | Smallest release | Stays his |
|---|---|---|---|---|---|
| 1 | Pay three acts | finance lane prepares; script records | No payout tooling: the only money code is guard lists that block automation (`~/zaal-dotfiles/bin/zao-defer-approval:52` never defers "pay", "payment", "transfer", "invoice", "refund"). Money is gated (`.claude/rules/lane-autonomy.md:15`) | Finance lane builds a **payout packet** per act: payee, amount, invoice, method, and a ledger row to mark paid. He presses send | the transfer itself |
| 2 | Plug in ZUSB, copy camera-card files | a script on mount | No ingest exists: the one file watcher, `com.zao.zaostock-file-watch`, watches four `~/Documents/zaostock` paths and has no `/Volumes` path or `StartOnMount` (plist lines 44-48). `scripts/media/` holds only `mp3-to-mp4.sh` | A mount-triggered copy script: copy DCIM to a dated folder, checksum, report. It **never wipes the card**, because deletion is his (`no-rm-rf.md`). This doc is the required precondition for that launchd job | plugging in the drive; clearing the card |
| 3 | Run a Google Apps Script, paste two links | a lane with a connected browser, or `clasp` | No `clasp` (`which clasp`: not found; no `~/.clasprc.json`). The only Apps Script path is a paste-and-deploy instruction (`~/zaal-dotfiles/bin/gdoc:89-91`). Which script and which two links: UNVERIFIED | Decide the transport: install `clasp` (a new dependency, so ask first) or keep the Chrome-extension route connected for that lane | first-time OAuth consent |
| 4 | Emails: Eric Marichal, Timo, 19 thank-yous, Danny | any lane, via the Gmail connector's drafts | Nothing writes drafts in batch. Today the Marichal email was staged as a clipboard page for him to send (vault `handoffs/status/grill.md:682`). `cold-outreach` says "NEVER auto-send" (`~/.claude/skills/cold-outreach/SKILL.md:140`). Sending is outbound and gated (`lane-autonomy.md:16`) | Ruling: **agents may write Gmail drafts, never send.** A draft is reversible and not outbound. The 19 thank-yous become 19 drafts in his Drafts folder | pressing send |
| 5 | Daily drip via Firefly | ZOE drafts (exists); a posting role later | ZOE already drafts and picks one a day; "He copy-pastes the keepers into Firefly" (`bot/src/zoe/posts/README.md:3`). ZOE's [Post] button queues the cast for **@zolbot**, ZOL's account, not his (`bot/src/zoe/index.ts:1052-1070`, "queued for @zolbot"). Firefly also reaches X, which nothing here posts to | None this round. A one-tap post needs a signer on the right account, and that is a public-post ruling | the post |
| 6 | Cast a poidh bounty on-chain | the poidhz lane prepares | Checks run before and after the cast (`~/Documents/zpoidh/scripts/precast-check.py:3`, `verify-cast-text.py:2`), but no script signs or sends the transaction (grep for `writeContract\|sendTransaction\|PRIVATE_KEY` in `zpoidh/scripts`: none) | Already near the floor: the lane hands him a checked bounty and he signs | signing (on-chain) |
| 7 | Merge fork PRs with a red Vercel gate | the review lane via `zao-merge` | `zao-merge` reads Vercel statuses and lets the merger vouch for a red one (`--known-red-ok`, `~/zaal-dotfiles/bin/zao-merge:50`; `--head-red-ok`, `:339`). Nothing recognises the fork case, where Vercel does not deploy the PR, so the check is red by construction (grep for `fork\|isCrossRepository` in `zao-merge`: none). Code merges are his under the workflow contract | Teach `zao-merge` to label the fork case ("Vercel did not deploy a fork PR; this red is not a build failure"), so his merge is one informed tap. A PR to dotfiles | the merge on code |
| 8 | Approve a classifier-blocked push | a defer queue | `zao-defer-approval` would turn a block into a queued tap, but it is "NOT WIRED IN. This is a prototype; enabling it is a change to Zaal's" settings (`~/zaal-dotfiles/bin/zao-defer-approval:2-4`). It never defers merge or force-push (`:52-54`) | His ruling on wiring it. It is a settings change, so his alone | the ruling; force-push stays banned |
| 9 | Enter API keys via /secret | nobody, by design | "Never accept a secret pasted into the conversation" (`~/.claude/skills/setting-secrets/SKILL.md:16`). The value comes from dashboards only he is logged into | None needed: the skill already makes it one paste (`zao-env save`) | entering the value |
| 10 | Revoke an X app; regenerate a Twitch token | a guided session (`zao-rotate`) | Rotation is irreversible and gated (`lane-autonomy.md:17`). `zao-rotate` exists but exits at line 4 because its brief, `~/zao-vault/handoffs/security-rotation.md`, does not exist (`ls`: no such file). Twitch user tokens already self-refresh (`src/lib/twitch/client.ts:33-37`); app credentials do not | Write the missing rotation brief so `zao-rotate` walks him through it in one session | the clicks in the provider dashboards |
| 11 | Load and publish the Paragraph newsletter | the newsletter skill (exists) | Mode C loads the draft through the Paragraph MCP and can send a test email; "the MCP never publishes; Zaal publishes" (`~/.claude/skills/newsletter/SKILL.md:208, :293`) | Already at the floor: the lane loads it, and he reads and presses publish | publish |
| 12 | Answer ~50 grill questions | the grill lane, applying `lane-autonomy.md` | The rule already says non-gated questions auto-proceed with a log line (`lane-autonomy.md:22-28`), but nothing applies it to the queue before he sees it (`zao-grill-queue-drain` runs at :52 each hour and only moves items) | The grill lane **sorts each incoming item gated or not** against `lane-autonomy.md:14-20`. Non-gated items take the recommended option and are logged as "auto-proceeded: <choice>, override anytime". He sees only the gated ones. "When in doubt, it is gated" (`:32`) | every gated item |
| 13 | Re-sign the Drive connector | a check script, for detection only | Nothing detects an expired connector (grep for `reauth\|invalid_grant\|token expired` across bin, skills and the repo: no relevant hits). The Mail connector expiry blocked several lanes before anyone noticed (vault `TODAY.md:191`) | A cron that probes each connector and puts "expired" on his morning card, so he re-signs once, early | the browser login |
| 14 | Force-quit an app at 20 GB | a watch script, alert only | Swap is read into the morning report (`zao-morning:91-95`), but nothing watches per-process memory (grep for `memory_pressure\|vm_stat\|rss\|force.?quit`: no watchdog). None of the 14 LaunchAgents is a memory monitor | An alert-only script: name the process and its size when one passes a threshold. **No automatic kill**, since a kill can lose unsaved work | the force-quit |

## 5. What already runs unattended (so new work extends it, not duplicates it)

14 LaunchAgents with `zao` in the name (`ls ~/Library/LaunchAgents | grep -ci zao`) and 21 active crontab lines (non-comment, non-blank lines of `crontab -l`), read on 2026-10-06. They include `zao-tick` (every 5 minutes), `zao-grill-queue-drain` (:52 hourly), `fleet-watch.py` (kept alive), `zao-morning` and `zao-tap-digest` (07:00 and 17:00). Rows 2, 12, 13 and 14 above should hang off `zao-tick` or the morning card where they can, rather than adding new jobs.

## 6. The DreamNet / swarm framing, concretely

The swarm Zaal is reaching for already has a working shape in the estate:

- `bettercallzaal/zol` holds **72** dreamloop manifests under `loops/` (counted via `gh api .../git/trees/HEAD?recursive=1`). Each one is schema `dreamnet.dreamloop.v1` with `allowed_actions`, `blocked_actions`, `promotion_path: "rehearsed -> active_local -> live_guarded"` and `receipt_outputs` (`loops/heartbeat.manifest.json:15, :21, :38, :112`).
- ZAOOS has the capability-lease states that go with it (`src/lib/dreamnet/tenant/capability-lease.ts:15-37`), flag-gated OFF.
- Vault `decisions/zorca-is-the-dreamnet-repo.md` makes zorca the repo where dreamloops come to Orca.

So each released task in section 7 becomes one manifest:
- it is allowed to copy, draft, sort, prepare and label;
- `money`, `on-chain`, `publish`, `send`, `delete` and `settings` are in `blocked_actions`;
- it starts at `rehearsed` (dry run, with receipts);
- it is promoted to `active_local` only after Zaal reads a week of receipts.

That is "a swarm with DreamNet" built from parts that exist, with his gates written into the manifest rather than remembered.

## 7. The five highest-yield releases (sent to the grill)

Ranked by Zaal-minutes freed per unit of risk:

1. **Grill triage.** A (rec) the grill lane sorts every item against `lane-autonomy.md`, auto-proceeds the non-gated ones with a logged default, and shows him only gated items / B pilot it for one day, then review the log / C keep answering every item.
2. **Email drafts.** A (rec) agents may write Gmail drafts (never send) for thank-yous and follow-ups, and he sends from Drafts / B drafts only for thank-yous / C keep clipboard pages.
3. **Camera-card copy.** A (rec) approve a mount-triggered copy-and-checksum script that never deletes from the card / B a one-command script he runs after plugging in / C keep copying by hand.
4. **Payout packets.** A (rec) the finance lane prepares a payout packet per act (payee, amount, invoice, method, ledger row) and he only sends / B a packet without the ledger row / C keep doing payouts by hand.
5. **Fork-PR merge label.** A (rec) `zao-merge` labels a fork PR's red Vercel check as "not deployed, not broken" so his merge is one informed tap / B the review lane notes it in the PR body instead / C no change.

None of these moves money, signs anything, posts publicly or changes his settings. Every one is reversible.

## 8. Evidence classes

- **Proven** (read on 2026-10-06, cited): every "stops it" cell above that carries a path:line, the 72 zol manifests, the missing rotation brief, the unwired defer-approval prototype, and the ZOE [Post] button going to @zolbot.
- **From the seat's list, not re-measured:** that each of these fourteen tasks happened today. Vault records confirm four of them: Marichal staged, the Danny show, the Mail connector expiry, and keys entered via /secret.
- **UNVERIFIED:** which Apps Script and which two links (row 3); which repo the fork PRs were in (row 7); whether the blocked push was the Claude Code classifier or `safe-git-push.sh` (row 8).

## 9. Risks

- Auto-proceeding grill items could take a default Zaal would not have chosen. The guard is the rule's own "when in doubt, it is gated", plus the logged override.
- A copy script that ever deletes from the card loses footage. Hence copy-only, and deletion stays his.
- Gmail drafts sit in his live account. A draft to the wrong person is harmless until sent, but he must read before sending.
- More scripts mean more things that can vanish silently (`vanishing-dependencies.md`). Each one is git-tracked and fails loudly.

## 10. Explain it to a 12-year-old

Zaal spent today doing chores a helper could set up for him: copying files, writing thank-you notes, answering questions with obvious answers. The helpers can do the setting-up. Zaal still does the parts that need his signature: paying people, posting in public, signing with his keys.

## 11. Confidence

| Conclusion | Confidence | Unknown |
|---|---|---|
| The five releases free the most time at the least risk | 70% | No timing data per task exists. The ranking is judgement |
| No existing tool already does rows 2, 13 and 14 | 85% | The searches covered bin, skills, the repo, launchd and cron, but not other repos |
| The dreamloop manifest is the right swarm container | 75% | Its runtime lives in zol. Bringing it to zorca is a separate decision already logged |

## 12. Translation layer

- **Engineer:** five small scripts and one ruling, each extending something that exists.
- **Architect:** the Spine gets permission-scoped behaviour units with receipts, and the Heart's lease states finally have consumers.
- **Founder:** you keep the signature and lose the chores.
- **Investor:** a founder whose time goes to judgement, not copy-paste, is the scarce input this whole estate runs on.

---

## Sources

| Source | Method | Status |
|---|---|---|
| ZAOOS `origin/main` (rules, `bot/src/zoe`, `src/lib`) | `sed -n` / `grep -n` by this lane | FULL |
| `~/zaal-dotfiles/bin`, `~/.claude/skills`, `~/Library/LaunchAgents`, `crontab -l` | two read-only inventory subagents; load-bearing lines re-read by this lane (`zao-defer-approval:2-4`, `zao-merge:50,339`, `posts/README.md:3`, `setting-secrets/SKILL.md:16`, `lane-autonomy.md:14-20`, `precast-check.py:3`, `gdoc:89-91`, `zao-rotate:2-7`) | FULL for re-read lines, PARTIAL otherwise |
| `bettercallzaal/zol loops/` | `gh api` tree count and manifest read | FULL |
| Vault `decisions/grill-2026-10-06-icm.md`, `handoffs/status/grill.md`, `TODAY.md` | `git show origin/main:` | FULL |
| Docs `agents/2586`, `2473`, `601`, `2175`; `agent-loops.md` rule 8 | read | FULL |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rule on the five releases in section 7 | Zaal (grill) | Decision | next grill window |
| For each A taken: one PR in the owning repo, plus a `dreamnet.dreamloop.v1` manifest starting at `rehearsed` | owning lane | Build | after the ruling |
| Write `~/zao-vault/handoffs/security-rotation.md` so `zao-rotate` runs | vault lane | Edit | any time |
