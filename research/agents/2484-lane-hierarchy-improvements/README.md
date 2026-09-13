---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-13
superseded-by:
related-docs: "2456, 2367, 2371, 2444, 2423, 2221, 2368"
original-query: "all that and tell me what improvements we can do to our system"
tier: STANDARD
---

# 2484 - The lane hierarchy Zaal just set, and the nine improvements one day of measurement says to make

> **Goal:** Take the lane hierarchy Zaal defined on 2026-09-13 and the failures measured across the estate that same day, and name what to change. Every finding is a command run on this Mac today, not recalled.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **Stop expecting a GitHub approval. No lane can ever give one.** `gh pr review --approve` returns `Can not approve your own pull request` for every lane, because all of them push as Zaal's account. Measured today on `ZAODEVZ/zabalgames#734`. Zaal has just made zorca first reviewer of every lane, so **every review in the estate will be a comment and every PR will report `reviewDecision: ""` forever.** Any gate built on that field waits on something that cannot arrive. Either adopt a comment convention as the review record, or create one machine account whose only job is to approve. | `gh pr review 734 --approve` -> GraphQL error; `gh pr view 223 --json reviewDecision` -> `""` | A |
| 2 | **165 scripts, 31 test suites, zero CI. Run the tests that already exist before writing more.** `~/zaal-dotfiles/.github/workflows` does not exist. `zao-selftest` invokes exactly **one** of the 31 (`zao-gaming-test`) and its line 1395 explicitly filters out every path ending `-test`. So 30 suites are written, committed and never executed by anything. That is why #223 could only offer "no CI on this path" as evidence. | `ls .github/workflows` -> NONE; `ls bin/*-test \| wc -l` -> 31; `ls bin \| wc -l` -> 165; `bin/zao-selftest:1395` | A |
| 3 | **Four scheduled jobs touch their heartbeat with `;`, so the beat fires whether the job passed, failed or crashed - and one of the four is the selftest itself.** `com.zao.fetch-healthcheck`, `com.zao.notify-drain`, `com.zao.morning`, and the `45 * * * *` crontab line for `zao-selftest`. A heartbeat that cannot disagree with the job it reports on is not a heartbeat. Change `;` to `&&`, and on failure write a line somewhere a person reads - otherwise it only goes quiet in a new way. | `grep "; */usr/bin/touch" ~/Library/LaunchAgents/*.plist`; `crontab -l` | A |
| 4 | **Exactly one of 165 scripts checks free disk, and it was written today.** The estate ran to **234Mi free of 460Gi**, tool calls began failing `ENOSPC` across lanes, eleven lanes read as unreachable at once, and nothing anywhere reported a disk problem - it was found by a tool call failing mid-command. Add a disk beat with a threshold, not a page. | `grep -rlE "df -k\|df -h" bin` -> `bin/zorca-bundle` only | A |
| 5 | **Guards that watch one direction cannot see the failure that arrives from the other.** The nightly backup grew **149M -> 1.8G over six nights** and every run reported healthy, because its only guard asked whether the repo *count* had *fallen*. Bytes doubling nightly sat inside its tolerance. Audit every guard for the direction it does not watch. | `~/.zao/backups/20*` sizes; `bin/zorca-bundle` pre-#223 | A |
| 6 | **Empty is not zero, and it cost two hours today alone.** `gh search code` returned **0 hits for all four** mentor-roster phrases on a public repo; a control search for the plain word "mentor" also returned 0. Code search is simply blind on that repo. Separately, `git rev-list --count --branches` returned 1 where `--all` returned 2, hiding unbacked work on detached worktree heads. **Every tool that can return nothing needs a control that proves it looked.** | `gh search code "mentor" --repo ZAODEVZ/zabalgames` -> 0; `git rev-list` counts on `ZAO OS V1` (1758 / 1762) | A |
| 7 | **`~/bin` is a symlink into a repo that lanes edit, so an unmerged branch is live on every lane at once.** For three hours today the whole Mac ran a `zorca-bundle` that existed only on `zj/bundle-dedupe-worktrees`. Reverting the tree would have put the *broken* version back in front of the 02:00 job, so there was no safe direction until the PR merged. Lanes that edit `bin/` should work in a worktree, or `bin/` should be installed as copies rather than symlinked live. | `ls -l ~/bin` -> symlink to `zaal-dotfiles/bin`; `diff -q ~/bin/zorca-bundle zaal-dotfiles/bin/zorca-bundle` -> SAME | A |
| 8 | **The orchestrator seat is recorded two ways and today's instruction makes a third.** `~/.zao/orchestrators.json` names `zorca-audit-seat`, then records `succeeded_by: zj (dotfiles lane), 2026-09-09` with `zorca-lock owner=zj`. Zaal on 2026-09-13 put orchestration with the vault lane. A registry that carries its own supersession in prose is not a registry. One field, one holder, written by the lane that holds the lock. | `~/.zao/orchestrators.json`; Zaal 2026-09-13 | B |
| 9 | **The disk was being eaten by a guard, and the bug was a comment.** `bin/zao-guard` keeps `KEEP = 48` hourly snapshots of the guarded paths, commented *"small files, cheap"*. True when written; one snapshot now measures **80M**, so 48 of them is **3.8G by design** - the largest consumer on the machine. The prune was working perfectly the whole time. **A retention constant expressed as a count cannot know what it costs.** Budget artifact shelves by bytes and print the total every run. Fixed in dotfiles #224. | `bin/zao-guard:61`; `~/.zao/private` = 3.8G; one tarball 80M at 11:27 | A |
| 10 | **Keep the relay rule exactly as it is. It was tested twice today and held both times.** Zorca relayed Zaal's approval to delete caches; this lane refused and waited for Zaal directly. Zorca's own `rm` had been denied by its gate, and doing it for them would have been permission laundering. Zorca then agreed the refusal was right. The estate's weakest-looking rule is its strongest. | `AGENTS.md` rule 8; two cross-session exchanges, 2026-09-13 | A |

---

## The hierarchy, as Zaal set it

Typed 2026-09-13, verbatim, because a structural grant should not be paraphrased:

> "dotfile is what i talk to mainly and does most of my owrk, manage it, zaovault manaages all the terminals and all the agentic infrastructure as the orcestratror and telsl zorca how to build with the other temrinals it shouldnt built it should jsut manage and note things to obsidian and move information around zorca is the first reviewier of any lane and zaovault can review but never code and then everthtrign else is under zorca"

| Lane | Role | May code? |
|---|---|---|
| **dotfiles** | Zaal's main surface, does most of the work | yes |
| **zao-vault** | orchestrator: manages all terminals and the agentic infrastructure, tells zorca how to build with the other terminals, notes to Obsidian, moves information | **never** - may review |
| **zorca** | first reviewer of any lane | per vault's direction |
| everything else | under zorca | yes |

**This is a clean separation and it lands on the one thing doc 2456 got right and could not fix:** its Decision 2 said the orchestrator's context problem "is not solved by handoff or compaction, it is solved by never holding the messy work", and that `orc` hit 81% "because it did lane work itself". A seat that is forbidden from coding cannot do lane work. The rule Zaal typed is the fix that doc recommended, arriving from the other direction.

**Two structural consequences nobody has designed for yet.** First, decision 1 above: a first reviewer who cannot record an approval. Second, the vault lane is currently at **82% context** while being handed the busiest role in the estate - the seat most needs the thing it has least.

## What one day measured

Every row is a command run on 2026-09-13.

| What | Measurement |
|---|---|
| Free disk at worst | **234Mi of 460Gi**, tool calls failing `ENOSPC` across lanes |
| Nightly backup growth | 149M (09-07) -> 1.8G (09-13), six nights |
| Of which duplicate | **4133M of 5.8G**, 26 of 89 checkouts |
| Worst single repo | `zaostock`, the same 103 commits bundled **19 times** |
| Proof it was duplicate | `--git-common-dir` identical; both report 892 objects, 193.84 MiB pack |
| Scripts in dotfiles `bin/` | 165 |
| Test suites among them | 31 |
| Executed by anything | **1** |
| CI workflows | **0** |
| Scheduled jobs | 13 launchd + crontab |
| Touching a beat | 3 launchd + 1 cron |
| Touching it unconditionally | **all 4** |
| Scripts checking free disk | **1 of 165**, added today |
| Largest disk consumer, cause | `zao-guard` snapshot shelf: `KEEP=48` x ~80M = **3.8G by design** |
| Was its prune broken? | **No.** It removes tarball and manifest together and always has |
| Stale blocker found in wavewarz-protocol | `BUILD-SPLIT.md` step 6 read "Blocked. IDL is private" for **4 days** after it landed |
| PRD sections blocked on engineering | ~0. **19 of 27 wait on two decisions** |

## The single defect, stated once

Nine of the findings above are the same defect wearing different clothes: **a check that cannot disagree with the thing it is checking.**

- A backup guard that only asks whether the count fell cannot see bytes rising.
- A heartbeat touched with `;` cannot report the job that crashed.
- A verification query inside the transaction it verifies can only see its own uncommitted state - and in `cowork-rls-hardening.sql` its failure mode is to *roll back the change it was checking*.
- A search tool that returns 0 because it is blind reads exactly like a clean repo.
- A test suite nobody runs is green by default.
- A retention constant that counts files cannot see the files growing, and its comment still reads "cheap".

Doc 2367 named this FALSE GREEN and doc 2371 measured a fleet "alive and producing nothing". **Neither doc's mechanism was applied to the tools written since.** The improvement is not another guard; it is a rule that every new check ships with a control that proves it can fail. Every fix today carried one: #223's 46 assertions include 19 that go red against the pre-fix script, and case 8's runner was split specifically so the suite could not go red for reasons unrelated to the code.

## Where outside practice agrees, and where it does not reach us

The strongest external thread is that reviewing is the skill that scales, not generating. The most-discussed HN piece on it (192 points, 197 comments) argues that if you are good at code review you will be good at using AI agents, and its top dissent is worth more than its thesis: `AirMax98` and `shakna` both push back that line-level review is not bikeshedding, because names and signatures *are* the API. **That maps directly onto Zaal's new hierarchy** - a first reviewer that only reads architecture will pass exactly the class of defect this estate produces, which is a plausible-sounding line in a guard.

Where the literature does not reach us: nothing published addresses a fleet where **every agent authenticates as the same human**, which is what makes decision 1 unsolvable by convention alone. That is a ZAO-specific constraint created by using one GitHub account, and it has to be fixed with an account, not a process.

## Also See

- [agents/2456-orchestrator-practice](../2456-orchestrator-practice/) - the DEEP orchestrator audit this builds on; its Decision 2 is what Zaal's hierarchy implements
- [agents/2367-false-green-truth-lifecycle](../2367-false-green-truth-lifecycle/) - the evidence base for the defect named above
- [infrastructure/2371-fleet-output-audit](../../infrastructure/2371-fleet-output-audit/) - the fleet producing nothing
- [agents/2423-vault-as-transport-inter-terminal-context](../2423-vault-as-transport-inter-terminal-context/) - the vault is memory, not a message bus, which constrains the new orchestrator role
- [agents/2368-zeye-verification-agent](../2368-zeye-verification-agent/) - a verification agent, proposed and not built

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide: machine account for approvals, or a written comment convention that counts as the review record. Shipped when `AGENTS.md` states which, and one PR merges under it | @Zaal | Decision | 2026-09-15 |
| Add `.github/workflows/tests.yml` to zaal-dotfiles running all 31 `bin/*-test` suites. Shipped when a PR shows a green check run | @Zaal (zj lane executes) | PR | 2026-09-17 |
| Change `;` to `&&` before the beat touch in the 3 launchd plists and the selftest crontab line, and write a failure line to a read surface. Shipped when a forced failure leaves the beat stale | @Zaal (zj lane executes) | PR | 2026-09-17 |
| Add a disk beat with a threshold to `zao-selftest`. Shipped when it reports RED under a simulated low-disk value | @Zaal (zj lane executes) | PR | 2026-09-16 |
| Merge dotfiles #224 (guard byte budget) and prune the existing 3.8G shelf by hand. Shipped when `~/.zao/private/guard-snapshots` is under 500M | @Zaal | PR + manual | 2026-09-14 |
| Audit every remaining retention constant in `bin/` for count-vs-bytes. Shipped when each is either byte-budgeted or has a comment stating measured current cost | @Zaal (zj lane executes) | PR | 2026-09-20 |
| Record the 2026-09-13 hierarchy as a decision file and resolve the `orchestrators.json` seat conflict, including what happens to `zorca-lock`. Shipped when the registry names one holder | @Zaal (vault lane executes) | Decision file | 2026-09-14 |
| Hand off or compact the vault lane before it takes the orchestrator seat - it is at 82% | @Zaal (vault lane executes) | Handoff | 2026-09-14 |
| Fix `cowork-rls-hardening.sql` by moving the verification read outside the transaction, then re-grant. The existing grant covers the script as it stands, which rolls itself back | @Zaal | Decision + PR | 2026-09-20 |
| Find what `app_votes` drives, then fix structurally - `USING(true)` on UPDATE lets any anon caller update any row | @Zaal | Investigation | 2026-09-20 |
| Decide where the interactive trading widget lives. Unblocks 18 PRD sections | @Zaal | Decision | 2026-09-20 |

## Sources

- [FULL, curl + Algolia API] [If you are good at code review, you will be good at using AI agents](https://news.ycombinator.com/item?id=45310529) - 192 points, 197 comments, 2025-09-20. Comment tree walked via `hn.algolia.com/api/v1/items/45310529`; dissent from `AirMax98` and `shakna` quoted above.
- [FULL, curl + Algolia API] [HN story search, "AI code review agent", points>100](https://hn.algolia.com/api/v1/search?query=AI+code+review+agent&tags=story) - surfaced the above plus [Sashiko, agentic AI review of the Linux kernel](https://news.ycombinator.com/item?id=47427647) (111 pts) and [Stage - putting humans back in control of code review](https://news.ycombinator.com/item?id=47796818) (130 pts, 111 comments).
- [FULL, local] `agents/2456-orchestrator-practice/README.md` - read in full; Decisions 1, 2, 3, 7 and 9 cited.
- [FULL, local, measured today] `~/zaal-dotfiles/bin/zorca-bundle`, `bin/zorca-bundle-test`, `bin/zao-selftest`, `~/Library/LaunchAgents/*.plist`, `crontab -l`, `~/.zao/backups/`, `~/.zao/orchestrators.json`. Every number in "What one day measured" comes from a command in the 2026-09-13 zj transcript.
- [FULL, gh API] `gh pr review 734 --approve` error text; `gh pr view 223 --json reviewDecision`; `gh api repos/ZAODEVZ/ZAOartizen/contents/<path>?ref=main` for the 12-path after-read.
- [FAILED - tried `gh search code` with four phrases and a control term, all returned 0 on a public repo] GitHub code search on `ZAODEVZ/zabalgames`. Recorded as a source failure rather than a finding, because it read like a clean result. Replaced with `git grep` against the branch.
