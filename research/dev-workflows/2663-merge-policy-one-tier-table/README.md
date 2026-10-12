---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-12
superseded-by:
related-docs: "2655, 2649, 2204"
original-query: "Zaal's answer 'a' to the merge policy question, vault decisions grill-2026-10-09-seat-morning item 182 (2026-10-12): one numbered research doc with a single tier table replacing the conflicting merge texts, plus proposals for rulesets, a self-hosted runner and a stack rule. Proposals only, no settings changed."
tier: STANDARD
---

# 2663 - Merge policy: one tier table

> **Goal:** One table that says who merges what, and on what evidence, so a lane does not have to choose between five older texts that disagree. Every row names the ruling it rests on. Where Zaal's words do not settle a row, it is marked OPEN for him and not decided here.

**This doc changes no setting.** No ruleset, branch protection, workflow, runner, billing or permission was touched to write it. Under "Proposals and remaining steps", items (b) and (c) are for Zaal to accept or refuse; item (a), the runner, is already ruled and that section lists what is left to do. Everything under "Measured" was read on 2026-10-12 with the command named beside it.

**Zaal said this policy is "only for now".** Item 34a, verbatim: "if u think its good to go it is and when things go wrong i will correect adn we need to really keep that in mind this is only for now too". The table is the current state, to be revisited when he says.

## Key Decisions

| # | Decision | Basis |
|---|---|---|
| 1 | Three tiers. Tier 1 docs and research merge by the docs workflow. Tier 2 reversible code merges through the merge lane on a CLEAN verdict at the exact head plus green CI. Tier 3 waits for Zaal. | Items 28 and 34, quoted below. The tier wording is the seat's draft, from the seat's build brief to this lane on 2026-10-12 (a session message, not a ruling and not in item 182). |
| 2 | "CI never ran" is not green and is not a failed test. A head in that state does not meet tier 2. It goes to Zaal's hand until CI can run. | Items 26b, 26c and 110 of the same file. The merge tool names the state as of zaal-dotfiles PR 516 (open, not merged). |
| 3 | Seven older texts are superseded, narrowed or left standing, each named below with path and date. None is edited by this PR. | Section "Older texts". |
| 4 | Five points could not be reconciled from his words and are OPEN. Until he answers, each takes the stricter reading, which is the one that waits for him. | Section "OPEN for Zaal". |
| 5 | Rulesets and the stack rule are PROPOSALS. The self-hosted runner is NOT a proposal: it is ruled, host included (item 179 point 8), and this doc only lists what remains to do. | Item 182: "Rulesets, runner and stack rule go in as proposals for him." Item 182 was written a day after item 179 point 8 and does not withdraw it. |

## The rulings, quoted

Source for all of these: `zao-vault` file `decisions/grill-2026-10-09-seat-morning.md`, read on origin/main on 2026-10-12.

**Item 28** (2026-10-09 16:43 EDT), his words as recorded there, verbatim: "ask me what cant be merges by claude code or an agent of some kind i dont understnad why me the human who understands simple concpests of code and orcestartion are expected to be in the loop for reviewing code i need to know how many reivews were ran that it is reversable and if it is rock it out, most things are but like data base changes or things that will affect production sites with more than 5 users are things i wanna reveiw the impact not hte code does that make sense".

The file's own reading of it: "Ruling: agents merge anything reviewed and reversible. Zaal reviews IMPACT (not code) only for database/schema changes and changes to production sites with more than 5 users. Every PR surfaced to him states the review count, reversibility, and for those two classes the user impact."

**Item 34**, as recorded: "Item 145 follow-up, \"None of those\": A. Ruling: no site needs his impact review now; the only impact gate is database and schema changes. Everything else merges on review (item 28 narrowed)."

**Item 34a** (2026-10-09 18:51 EDT), his words, verbatim: "A (rec) No site needs you to review its impact. Agents merge everything after review, and you only see what changed. if u think its good to go it is and when things go wrong i will correect adn we need to really keep that in mind this is only for now too".

**Item 182** (2026-10-12 12:54 EDT), as recorded: "Asked what to open first; Zaal answered \"a\": one numbered research doc with a single tier table, plus a zao-merge PR that names \"CI never ran\" (billing, zero steps) apart from a real red, still refusing. Rulesets, runner and stack rule go in as proposals for him."

What those words do NOT say, stated so the table is not read as his. Each of these is in the table as a PROPOSAL or as someone else's wording:
- Item 28 says "reviewed" and "reversable". It does not say "green CI". The CI requirement in tier 2 is the seat's wording. The nearest recorded support is item 5, where the seat's own record of the standing ruling reads "(seat evaluator CLEAN or its own verified review, CI green, head pinned)". Those are the seat's words about his "reviewed and verified", not his. See OPEN 4.
- Item 28 names two gates (database and schema; production sites with more than 5 users) and item 34 narrows them to one, database and schema. Money, public copy and dotfiles settings are in tier 3 on other, older rulings, each cited in the table.
- The definition of "reversible" in tier 2 is mine. He used the word and did not define it.
- "Not the author, not the seat by hand" in tier 2 is mine, drawn from the 2026-09-27 decision file's rule that the reviewer is not the author or proposer and that the merge goes through the tool.
- "A CLEAN verdict is still required first" in tier 3 is mine. His words for that tier are about what he reviews, not about what comes before it.
- "Docs in a repo without that workflow go through the merge lane on a CLEAN verdict" in tier 1 is mine, built on item 44, which is the seat's overnight stance and not a ruling of his.
- "Local test output in the PR body, labelled as local" in the last row is mine.

## The tier table

| Tier | What is in it | Who merges | What must be true first | Basis |
|---|---|---|---|---|
| 1. Docs and research | A PR made only of `research/**` and `docs/**` in ZAOOS. | On ZAOOS the `docs-automerge.yml` workflow arms squash auto-merge and no lane merges it. Docs in a repo without that workflow go through the merge lane on a CLEAN verdict. | The repo's required checks pass (measured: Lint & Typecheck, Test, Bot Tests). The doc-number collision guard passes. No added line concludes about a licence or reuse permission. No `hold` label. | The workflow's own header (first written 2026-07-03, commit 856c3425e). Item 44: the seat "pins docs/research/vault/memory PRs to the merge lane for merge". |
| 2. Reversible code | Everything that is not tier 1 and not tier 3. Reversible means a `git revert` of the merge commit restores the earlier behaviour, with nothing sent, spent, published or migrated in between. | The merge lane, with `zao-merge OWNER/REPO N --head <sha>`. Not the author, not the seat by hand. | A CLEAN verdict at that exact head from a reviewer who is neither the author nor the proposer. Green CI on that head: finished, not pending, not skipped, not "never ran". Every other gate in the merge tool. The PR states how many reviews ran and that it is reversible. | Items 28, 34, 34a. Item 5, verbatim: "a it merges i dont need to be in the loop for merges if the dotfiles believe its correct and its been reviewed and verified". |
| 3. Waits for Zaal | (a) Database and schema changes. He reviews the impact, not the code. | Zaal | The PR states the review count, reversibility and the user impact. A CLEAN verdict is still required first. | Item 34: "the only impact gate is database and schema changes". |
| 3. Waits for Zaal | (b) Money: spend, anything on-chain, keys. | Zaal | Same as above. | Not in items 28 or 34. Rests on `zao-vault` `decisions/zj-merges-on-review-approval-non-zaostock.md` (2026-09-27): "Outbound, money, public posts, on-chain and identity stay Zaal's tap", and on the one-way-door rule in the global CLAUDE.md (2026-09-28). |
| 3. Waits for Zaal | (c) Public copy: words on a public page, brand copy, posts. | Zaal | Same as above. | OPEN 1. Item 9 (2026-10-09 11:30 EDT) kept "public page or brand copy still to him" for twelve ZAOstock PRs. Item 34a, seven hours later, says "No site needs you to review its impact". Held in tier 3 until he says which stands. |
| 3. Waits for Zaal | (d) Dotfiles settings, hooks and permissions. | Zaal | He applies or commits them himself. | Item 14: "He adds them himself via /permissions (agents never self-grant). Committing .claude/settings.json stays his." |
| Not a tier | A head where CI never ran (the runner was never started), or a repo with no CI at all. | Zaal, by hand, after a CLEAN verdict. | Local test output in the PR body, labelled as local. | Item 26c: merges on the three private repos "are HELD until Zaal fixes billing or the self-hosted runner is up". Item 110: he hand-merged nine such PRs from his phone. See OPEN 4. |

Overnight is a separate constraint on tier 2, not a tier: item 44 has the seat hold code pins until morning and send only docs to the merge lane overnight. See OPEN 5.

## Older texts

Every path was read on origin/main of its repo on 2026-10-12. Dates are the date written in the text, or the commit date where the text carries none. Nothing here is edited by this PR.

| Text | Date | What it says | Status under this table |
|---|---|---|---|
| zaal-dotfiles `claude/memory/zaoos/feedback_workflow_contract_v2.md`, point 4 | 2026-07-15 | "AI auto-merges docs/research PRs; Zaal reviews CODE only ... Anything touching code waits for Zaal." | SUPERSEDED by item 28 for code. Its docs half is tier 1. The same file's later paragraph (2026-07-16, "Merge any verified-green PR, all repos") already contradicted point 4. |
| ZAOOS `.github/workflows/docs-automerge.yml`, header comment | 2026-07-03 (commit 856c3425e) | "All other PRs (runtime code, config, CI changes) wait for Zaal." | SUPERSEDED in meaning by item 28: they wait for a verdict and the merge lane, and only tier 3 waits for him. The workflow's behaviour is unchanged and correct. The comment is stale. Changing it is a CI file edit, so it is a proposal, not part of this PR. |
| zao-vault `decisions/zj-merges-on-review-approval-non-zaostock.md` | 2026-09-27, amended 2026-09-28 | zj may merge on a zaoos-review APPROVED "without a separate look from Zaal", non-ZAOstock only. ZAOstock "keeps the deep review: a reviewer subagent plus preview screenshots". | NARROWED. Since item 34a (2026-10-09) the fast path is every repo. Its unchanged parts still stand and are in tier 2: pinned head, reviewer is not author or proposer, merge through the tool. The ZAOstock deep review is OPEN 2. Its money line is the basis of tier 3 (b). |
| zaal-dotfiles `claude/memory/zaoos/feedback_own_the_pr_merge_bar.md` | 2026-07-21 | The assistant owns the technical bar. Hard-gated: "outbound (posts/DMs), spend, on-chain, secrets/keys, prod DB migrations, settings changes". | STANDS. Consistent with tiers 2 and 3. |
| zaal-dotfiles `claude/memory/zaoos/feedback_merge_policy_item28.md` | 2026-10-09 | A restatement of items 28, 34 and 34a. | STANDS. This table is the longer form of it. |
| ZAOOS `.claude/rules/agent-loops.md` rule 35 | undated in the text | "Overnight/unsupervised loops are PR-only ... NOT merges". | CONFLICTS with item 44, which sends docs to the merge lane overnight. OPEN 5. |
| Seat memory `feedback_deep_review_zaostock_merges` (this Mac's auto-memory, not in a repo) | 2026-09-27 | Every ZAOstock PR, and any PR Zaal did not write, gets an independent reviewer plus screenshots of the preview. | OPEN 2. |

Not found, and where I looked: I searched the three files named in the brief, `zao-vault` AGENTS.md, ZAOOS CLAUDE.md and `.claude/rules/`, and the dotfiles memory directory by the word "merge". I did not search the server, Telegram history, or the other dotfiles memory files that mention merging beyond the three read in full above (the search listed more than 50; I did not count them exactly). A sixth conflicting text may exist there.

## OPEN for Zaal

Each takes the stricter reading until he answers. One line each, recommendation first.

1. **Public copy.** Recommend: it stays his. Item 9 said so at 11:30; item 34a at 18:51 says no site needs his impact review. I cannot tell whether "impact review" was meant to cover the words on a public page.
2. **ZAOstock deep review.** Recommend: keep the screenshots for anything that renders, drop the "his look" part. His 27 Sep words: "make sure on zaostock or any non zaal merge is very well reviewed". The festival that ruling was written for was 3 Oct. Item 34a postdates it and names no exception. The merge tool still prints "a ZAOstock merge still needs the reviewer's screenshots".
3. **Tests and new scripts in tier 1.** Recommend: leave as is. The workflow also auto-merges PRs made only of test files or newly added `scripts/**` tools. The draft tier says "docs and research" only. Nothing in his words covers this either way.
4. **Is green CI required, and what about repos that have none?** Recommend: yes, required, and no-CI repos stay his hand. Item 28 does not mention CI. With it required, every code PR on zaal-dotfiles, zao-vault and wavewarz-protocol is his hand as of 2026-10-12, because CI there cannot run (measured below). Item 110 was nine hand merges in one sitting on that pattern, which is the kind of queue item 28 was meant to end. I did not count how many such PRs open per day. The runner proposal is the way out.
5. **Overnight.** Recommend: item 44 as written (docs yes, code held till morning). Rule 35 says no merges at all overnight.

Not asked, but he should know: tier 1 merges with no verdict. On 2026-10-10 (11:26:15Z, the UTC date) the docs workflow merged ZAOOS #3873 before the evaluator ran (doc 2655, incident 6), and doc 2661 records that its first version "merged before it was graded". The `hold` label (ZAOOS #3916, 2026-10-11) is the tool for a doc that should wait. This PR carries it.

## Measured on 2026-10-12

All by `gh api` as the `bettercallzaal` account, between 17:03Z and 17:05Z.

| Repo | Visibility | Protection on main | Rulesets | CI on 2026-10-12 |
|---|---|---|---|---|
| bettercallzaal/ZAOOS | public | Classic protection: three required checks (Lint & Typecheck, Test, Bot Tests), 0 required approvals, admins included, not strict | One, "Block Saftey 1", enforcement disabled, targets no branch | Runs |
| ZAODEVZ/ZAOstock | public | None (404) | Two, "main" and "main2", both enforcement disabled, both target no branch (`conditions.ref_name.include` is empty), rules are deletion and non_fast_forward only, no required checks | Runs. Checks on the last merged PR head (#465): lint; fact-dedup; typecheck, tests, build; e2e (playwright); mobile overflow; security & database review gate; plus Vercel |
| bettercallzaal/wwtracker | public | None (404 "Branch not protected") | Zero | Runs. Checks: types, tests, data; upstream stats API contract |
| bettercallzaal/zaal-dotfiles | private | 403 | 403 | Never starts. Latest three runs conclude failure; the job has 0 steps and runner_id 0 |
| bettercallzaal/zao-vault | private | 403 | 403 | Never starts, same shape |
| bettercallzaal/wavewarz-protocol | private | 403 | 403 | Queued with no runner. See below |

The 403 body on all three private repos, for both the protection and the rulesets endpoint, verbatim: "Upgrade to GitHub Pro or make this repository public to enable this feature."

Both owners are user accounts, not organizations (`gh api users/ZAODEVZ` returns type User; the same for bettercallzaal).

**wavewarz-protocol already points at a runner that does not exist.** PR #68 there, which moved its checks to a self-hosted runner, merged 2026-10-10T21:06:08Z, and `checks.yml` now says `runs-on: self-hosted` in two jobs. `gh api repos/bettercallzaal/wavewarz-protocol/actions/runners` returns total_count 0. Of the last 30 workflow runs, 23 are cancelled and 7 are queued; none succeeded after 2026-10-08. The newest (38275451589) has two jobs, both status queued, 0 steps, no annotation. So on that repo, as read on 2026-10-12, CI is not red and not green: it is waiting for a machine nobody registered. One useful side reading: those jobs were created and queued without the billing annotation, which is what the other two repos get. That suggests the billing block applies to GitHub-hosted jobs and not to self-hosted ones. It is one observation, not a test: no self-hosted job has started on this account since the block, so I have not seen one run.

zaal-dotfiles and zao-vault have the runner switch written but not merged: zaal-dotfiles #492 and zao-vault #122 are both OPEN and both still drafts.

## Proposals and remaining steps

None of these is done. Each needs his hand in GitHub settings or on the machine. (a) is a ruling with steps remaining; (b) and (c) are proposals.

### (a) Self-hosted runner for the three private repos: ruled, not yet done

**This is already ruled, including where it runs. What is left is doing it.** Four items of the same decisions file, in order:
- Item 46 (2026-10-10): "a plus b works", A being a self-hosted runner.
- Item 69 (2026-10-10): "I Dont wanna spend money on actions", then "a". The Actions budget stays at zero and the self-hosted runner is the path for every private repo.
- Item 70 (2026-10-10): he asked about a different machine as the runner host; the seat owns the steps, with a recipe in the vault.
- Item 179, point 8 (recorded 2026-10-11): names the host and says "Nothing is registered; registration needs a token from repo settings and is his tap. This answers the open runner question from items 69 and 70". **This is the current ruling.** Its standing, as the file itself states: it was relayed to the seat by another lane, not typed in the seat's pane.

The first version of this doc cited only items 46 and 69 and treated the host as an open choice. That was wrong: my search for later rulings used the words merge, tier and auto-merge, not runner. Which host item 179 names is not repeated here, because this repo is public; it is in the decisions file and in the private vault note named below.

So the rest of this section is not a case for the runner. It is what the GitHub docs say about the step that remains. What follows is what the GitHub docs say about doing it, read from the docs source at github/docs main (commit dbd054791b6d, fetched raw 2026-10-12T17:03Z), not from a summary.

**Cost.** `content/billing/concepts/product-billing/github-actions.md`: "GitHub Actions usage is **free** for **self-hosted runners** and for **public repositories** that use standard GitHub-hosted runners." `content/actions/concepts/runners/self-hosted-runners.md`: self-hosted runners "Are free to use with GitHub Actions, but you are responsible for the cost of maintaining your runner machines." Not checked: the GitHub changelog for any announced future charge on self-hosted minutes. The docs at that commit name none.

**It is three registrations, not one.** `content/actions/how-tos/manage-runners/self-hosted-runners/add-runners.md`: "You can add a self-hosted runner to a repository, an organization, or an enterprise", and the concepts page: "Repository-level runners are dedicated to a single repository, while organization-level runners can process jobs for multiple repositories in an organization." bettercallzaal is a user account, so there is no organization level. One machine can host three runner processes, one per repo. "One runner for three repos" is not available without moving the repos into an organization.

**Security, quoted from** `content/actions/reference/security/secure-use.md`, section "Hardening for self-hosted runners":
- "Self-hosted runners for GitHub do not have guarantees around running in ephemeral clean virtual machines, and can be persistently compromised by untrusted code in a workflow."
- "be cautious when using self-hosted runners on private or internal repositories, as anyone who can fork the repository and open a pull request (generally those with read access to the repository) are able to compromise the self-hosted runner environment, including gaining access to secrets and the `GITHUB_TOKEN` which, depending on its settings, can grant write access to the repository."
- "What sensitive information resides on the machine configured as a self-hosted runner? For example, private SSH keys, API access tokens, among others."
- "there is no way to guarantee that a self-hosted runner only runs one job. Some jobs will use secrets as command-line arguments which can be seen by another job running on the same runner".
- Just-in-time runners "perform at most one job before being automatically removed".

**What that means here.** Collaborator counts (measured, `gh api repos/.../collaborators`, 2026-10-12): zaal-dotfiles 2, zao-vault 1, wavewarz-protocol 2, the owner included in each. All three have 0 forks. So the outside-contributor risk is two accounts. The larger exposure is our own: every lane pushes as the same GitHub user, all three workflows run on `pull_request`, and on a pull request from a branch in the same repo the run uses that branch's version of the workflow file (GitHub's behaviour as I understand it; not one of the lines quoted above). So any agent branch runs its code on the runner machine before any review. That makes the docs' question the one to answer for the ruled host before a runner is registered on it: "What sensitive information resides on the machine configured as a self-hosted runner?"

Runner host: ruled in item 179 point 8, and not named in this public repo. The host-specific detail, and what the docs' question means for that particular machine, is in the private vault note `notes/runner-host-detail-2026-10-12.md` (zao-vault PR 141, open and not merged as of 2026-10-12).

**What remains under that ruling, in this order.** None of it reopens the choice of host; the first step is about how the runner is set up on it:
1. A dedicated OS user with no sudo, whose home is the only thing it can write, and which cannot read any other service's env files or any SSH key on that machine. Verify by trying to read them as that user before registering anything.
2. Never on a public repo. The docs line is "self-hosted runners should almost never be used for public repositories". ZAOOS, ZAOstock and wwtracker stay on GitHub-hosted runners, which are free for public repos.
3. Register on one repo first and watch one job start and finish. That is also the test of whether the billing block lets self-hosted jobs run, which is unverified above.
4. Then wavewarz-protocol, which is already waiting for it, then the other two by merging #492 and #122.

The alternative the 403 names is GitHub Pro on the account, which unlocks protection and rulesets on private repos. It is a paid plan, so it is his decision and I make no recommendation on spend. Whether it would change the CI block is not something I checked; the 403 text speaks only of protection and rulesets.

### (b) Rulesets on ZAOstock and wwtracker

**ZAOstock.** Turning the two existing rulesets on would protect nothing: both have an empty branch target, so they apply to no branch, and their only rules are deletion and non_fast_forward. Proposal: edit "main" so it targets the default branch, keep deletion and non_fast_forward, add required status checks naming the six Actions checks listed in the table above (the API returns six from the github-actions app on #465's head, plus two Vercel rows that are not Actions checks), then set enforcement to active. Delete or leave "main2"; it is a duplicate. Do NOT add a required approving review: every lane acts as the same GitHub user, and GitHub does not let a PR author approve their own PR, so that rule would stop the merge lane. I have not tested that last point on this repo; it is GitHub's documented behaviour as I know it, not a measurement.

Fork PRs are the catch. Doc 2655 records fork PRs #378 and #432 sitting in action_required until a maintainer approves the workflow run. With required checks on, an unapproved fork PR cannot merge, which is the wanted behaviour, but the approval tap stays his.

**wwtracker.** It has no ruleset and no protection. Proposal: one ruleset on the default branch with deletion, non_fast_forward and one required check, "types, tests, data". Not "upstream stats API contract": it was skipped on the head I read, and whether a skipped required check blocks a merge is something I did not test.

**Why this matters for the tier table.** On 2026-10-12 the merge tool on main reads the wwtracker head 00f13ed6 as clean while the "checks" workflow run on it (37930312536) concluded failure with zero jobs, a workflow file that would not start. A PR search for that sha returns #434, merged. A required check would have blocked it on GitHub's side regardless of what any tool read. zaal-dotfiles PR 516 closes the tool's half.

### (c) The stack rule

Three texts disagree on what to do with a PR stacked on another:
- `zao-vault` AGENTS.md rule 7: "Retarget a stacked PR's base to main before merging the one underneath it."
- ZAOOS doc 2655 (2026-10-10): after the base is squashed, "re-create each dependent PR as a fresh branch off main and close the old one as superseded".
- Seat memory `feedback_prs_must_be_merge_ready` (2026-10-10): "no stacks; wait for the base to merge, then rebase".

Proposal, the seat's draft from its build brief to this lane on 2026-10-12, which I think is right: **the lower PR merges first. The upper PR is then retargeted to main, and a verdict on it only counts once CI has run on its head against main.** Reasons: a verdict given while the upper PR targeted the lower branch graded a different diff; and after a squash of the base the upper PR's diff against main changes, so both the verdict and the CI result from before are about something else. This keeps rule 7's "base must be main" and changes its ordering (rule 7 retargets before merging the lower one). The cost is known and rule 7 says so itself: when the lower PR lands as a squash, the upper one usually conflicts against main (ZAOOS #3864 did). Where it does, doc 2655's re-create is the fallback, and the fresh PR needs its own verdict. Authors avoid the whole thing by not stacking, which is the memory's rule and stays the default.

## What is not in this doc

- No change to any workflow, rule file, memory file or decision file. The "Older texts" table says which are stale; editing them is separate work, and the two that live in CI or settings are his.
- No count of how many PRs each tier would have caught last week. I did not measure it.
- Review quality (what makes a verdict CLEAN) is doc 2204 and 2214's subject.

## Sources

- zao-vault `decisions/grill-2026-10-09-seat-morning.md`, items 5, 9, 14, 26b, 26c, 28, 34, 34a, 44, 46, 69, 70, 110, 179 point 8, 182 (private repo; read on origin/main 2026-10-12).
- zao-vault `decisions/zj-merges-on-review-approval-non-zaostock.md` and `AGENTS.md` rule 7 (same).
- ZAOOS `.github/workflows/docs-automerge.yml`, `.claude/rules/agent-loops.md` rules 35 and 38, research docs 2655 and 2661 (origin/main at 1d028fd13).
- zaal-dotfiles `claude/memory/zaoos/` files named above (origin/main at 9120986), and PR 516.
- GitHub docs source, https://github.com/github/docs at commit dbd054791b6d: [secure-use.md](https://github.com/github/docs/blob/main/content/actions/reference/security/secure-use.md), [self-hosted-runners.md](https://github.com/github/docs/blob/main/content/actions/concepts/runners/self-hosted-runners.md), [add-runners.md](https://github.com/github/docs/blob/main/content/actions/how-tos/manage-runners/self-hosted-runners/add-runners.md), [github-actions.md billing](https://github.com/github/docs/blob/main/content/billing/concepts/product-billing/github-actions.md). Fetch status: FULL for all four (HTTP 200, raw). Quotes have the docs' template variables written out as the product names they render to.
- GitHub REST API via `gh api`, 2026-10-12: repos, rulesets, branch protection, collaborators, actions/runners, actions/runs, check-runs.
