---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-12
superseded-by:
related-docs: "2655, 2649, 2204"
original-query: "Zaal's answer 'a' to the merge policy question, per a ruling by Zaal on 2026-10-12: a single research doc whose one table of tiers replaces the conflicting merge texts, plus proposals for rulesets, a self-hosted runner and a stack rule. Proposals only, no settings changed. (reconstructed)"
tier: STANDARD
---

# 2663 - Merge policy: one tier table

> **Goal:** One table that says who merges what, and on what evidence, so a lane does not have to choose between five older texts that disagree. Every row names the ruling it rests on. Where Zaal's words do not settle a row, it is marked OPEN for him and not decided here.

**This doc changes no setting.** No ruleset, branch protection, workflow, runner, billing or permission was touched to write it. Under "Proposals and remaining steps", items (b) and (c) are for Zaal to accept or refuse; item (a), the runner, is already ruled and that section lists what is left to do. Everything under "Measured" was read on 2026-10-12 with the command named beside it.

**Zaal said this policy is for now only.** Per his ruling of 2026-10-09 (18:51 EDT): if a lane judges something good to go, it is, he will correct things when they go wrong, and the arrangement is temporary. The table is the current state, to be revisited when he says.

## Key Decisions

| # | Decision | Basis |
|---|---|---|
| 1 | Three tiers. Tier 1 docs and research merge by the docs workflow. Tier 2 reversible code merges through the merge lane on a CLEAN verdict at the exact head plus green CI. Tier 3 waits for Zaal. | Zaal's rulings of 2026-10-09 (16:43 EDT, and its narrowing later that day), summarised below. The tier wording is the seat's draft, from the seat's build brief to this lane on 2026-10-12 (a session message, not a ruling). |
| 2 | "CI never ran" is not green and is not a failed test. A head in that state does not meet tier 2. It goes to Zaal's hand until CI can run. | Seat records of 2026-10-09 and 2026-10-10, and Zaal's hand-merges of 2026-10-10. The merge tool names the state as of zaal-dotfiles PR 516 (open, not merged). |
| 3 | Seven older texts are superseded, narrowed or left standing, each described below with its date. None is edited by this PR. | Section "Older texts". |
| 4 | Five points could not be reconciled from his words and are OPEN. Until he answers, each takes the stricter reading, which is the one that waits for him. | Section "OPEN for Zaal". |
| 5 | Rulesets and the stack rule are PROPOSALS. The self-hosted runner is NOT a proposal: it is ruled, host included (per a ruling by Zaal recorded 2026-10-11), and this doc only lists what remains to do. | Per Zaal's ruling of 2026-10-12, rulesets, the runner and the stack rule go in as proposals for him; that ruling came a day after the host ruling and does not withdraw it. |

## The rulings, summarised

These are Zaal's rulings as recorded in a private decision log, read on 2026-10-12. They are summarised here, not quoted, because this repository is public.

**Per a ruling by Zaal on 2026-10-09 (16:43 EDT):** reviewing code should not need him. Before a merge he wants two facts, how many reviews ran and whether the change can be undone, and if both are good the change goes ahead. The exceptions he keeps are database changes and changes to live sites used by over five people, where he looks at the effect on users rather than the code.

How that ruling was applied: a reviewed, reversible change merges without him. He looks only at the effect on users, never the code, for two kinds of change: databases and schemas, and production sites with over five users. Any PR that does reach him says how many reviews ran, whether it can be reverted, and, for those two kinds, what users would see.

**Per a ruling by Zaal later on 2026-10-09:** the production-site gate is dropped, so databases and schemas are now the single kind of change whose user impact he reviews. All other changes merge once reviewed.

**Per a ruling by Zaal on 2026-10-09 (18:51 EDT):** no site needs him to review its impact; agents merge everything after review and he only sees what changed; and the arrangement is for now only.

**Per a ruling by Zaal on 2026-10-12:** write one research doc holding a single table of tiers, and a PR to the merge tool so it tells a check that never started (the billing block, zero steps) apart from a genuine failure while still refusing both. Rulesets, the runner and a rule for stacked PRs are to come to him as proposals.

What those words do NOT say, stated so the table is not read as his. Each of these is in the table as a PROPOSAL or as someone else's wording:
- The 2026-10-09 rulings say "reviewed" and "reversible". They do not say "green CI". The CI requirement in tier 2 is the seat's wording. The nearest recorded support is the seat's own note of the standing ruling on the morning of 2026-10-09, which lists a CLEAN evaluator verdict or verified review, green CI and a pinned head. Those are the seat's words about his "reviewed and verified", not his. See OPEN 4.
- The 16:43 ruling names two gates (database and schema; production sites with more than 5 users) and the later one narrows them to one, database and schema. Money, public copy and dotfiles settings are in tier 3 on other, older rulings, each cited in the table.
- The definition of "reversible" in tier 2 is mine. He used the word and did not define it.
- "Not the author, not the seat by hand" in tier 2 is mine, drawn from Zaal's ruling of 2026-09-27 that the reviewer is not the author or proposer and that the merge goes through the tool.
- "A CLEAN verdict is still required first" in tier 3 is mine. His words for that tier are about what he reviews, not about what comes before it.
- "Docs in a repo without that workflow go through the merge lane on a CLEAN verdict" in tier 1 is mine, built on the seat's overnight stance of 2026-10-09, which is not a ruling of his.
- "Local test output in the PR body, labelled as local" in the last row is mine.

## The tier table

| Tier | What is in it | Who merges | What must be true first | Basis |
|---|---|---|---|---|
| 1. Docs and research | A PR made only of `research/**` and `docs/**` in ZAOOS. | On ZAOOS the `docs-automerge.yml` workflow arms squash auto-merge and no lane merges it. Docs in a repo without that workflow go through the merge lane on a CLEAN verdict. | The repo's required checks pass (measured: Lint & Typecheck, Test, Bot Tests). The doc-number collision guard passes. No added line concludes about a licence or reuse permission. No `hold` label. | The workflow's own header (first written 2026-07-03, commit 856c3425e). The seat's overnight stance of 2026-10-09: docs and research PRs are pinned to the merge lane. |
| 2. Reversible code | Everything that is not tier 1 and not tier 3. Reversible means a `git revert` of the merge commit restores the earlier behaviour, with nothing sent, spent, published or migrated in between. | The merge lane, with `zao-merge OWNER/REPO N --head <sha>`. Not the author, not the seat by hand. | A CLEAN verdict at that exact head from a reviewer who is neither the author nor the proposer. Green CI on that head: finished, not pending, not skipped, not "never ran". Every other gate in the merge tool. The PR states how many reviews ran and that it is reversible. | Zaal's rulings of 2026-10-09 above. Per his ruling that morning (09:40 EDT): a change merges without him once it has been reviewed and verified. |
| 3. Waits for Zaal | (a) Database and schema changes. He reviews the impact, not the code. | Zaal | The PR states the review count, reversibility and the user impact. A CLEAN verdict is still required first. | Per Zaal's later ruling of 2026-10-09: databases and schemas are the one remaining kind of change whose impact he reviews. |
| 3. Waits for Zaal | (b) Money: spend, anything on-chain, keys. | Zaal | Same as above. | Not in the 2026-10-09 rulings. Rests on Zaal's ruling of 2026-09-27 that outbound, money, public posts, on-chain and identity stay his tap, and on the one-way-door rule in the global agent instructions (2026-09-28). |
| 3. Waits for Zaal | (c) Public copy: words on a public page, brand copy, posts. | Zaal | Same as above. | OPEN 1. Per his ruling of 2026-10-09 (11:30 EDT), public page and brand copy stayed with him for twelve ZAOstock PRs. His 18:51 ruling the same day says no site needs his impact review. Held in tier 3 until he says which stands. |
| 3. Waits for Zaal | (d) Dotfiles settings, hooks and permissions. | Zaal | He applies or commits them himself. | Per Zaal's ruling of 2026-10-09 (12:18 EDT): he adds permission rules himself, agents never self-grant, and committing `.claude/settings.json` stays his. |
| Not a tier | A head where CI never ran (the runner was never started), or a repo with no CI at all. | Zaal, by hand, after a CLEAN verdict. | Local test output in the PR body, labelled as local. | Per the seat's record of 2026-10-10, merges on the three private repos are held until billing is fixed or the self-hosted runner is up. On 2026-10-10 Zaal hand-merged nine such PRs from his phone. See OPEN 4. |

Overnight is a separate constraint on tier 2, not a tier: the seat's overnight stance of 2026-10-09 holds code pins until morning and sends only docs to the merge lane overnight. See OPEN 5.

## Older texts

Public texts were read on origin/main of their repo on 2026-10-12, and private texts are described, not quoted. Dates are the date written in the text, or the commit date where the text carries none. Nothing here is edited by this PR.

| Text | Date | What it says | Status under this table |
|---|---|---|---|
| A private standing note on the workflow contract, point 4 | 2026-07-15 | Docs and research PRs auto-merge; code waits for Zaal. | SUPERSEDED for code by the 2026-10-09 rulings. Its docs half is tier 1. A later paragraph of the same note (2026-07-16) already allowed merging any verified-green PR in any repo, which contradicted point 4. |
| ZAOOS `.github/workflows/docs-automerge.yml`, header comment | 2026-07-03 (commit 856c3425e) | "All other PRs (runtime code, config, CI changes) wait for Zaal." | SUPERSEDED in meaning by the 2026-10-09 rulings: they wait for a verdict and the merge lane, and only tier 3 waits for him. The workflow's behaviour is unchanged and correct. The comment is stale. Changing it is a CI file edit, so it is a proposal, not part of this PR. |
| Zaal's ruling on merging on review approval, outside ZAOstock | 2026-09-27, amended 2026-09-28 | A lane may merge on an approved review without a separate look from Zaal, outside ZAOstock only. ZAOstock keeps the deep review: a reviewer subagent plus preview screenshots. | NARROWED. Since his 18:51 ruling of 2026-10-09 the fast path covers every repo. Its unchanged parts still stand and are in tier 2: pinned head, reviewer is not author or proposer, merge through the tool. The ZAOstock deep review is OPEN 2. Its money line is the basis of tier 3 (b). |
| A private standing note on who owns the merge bar | 2026-07-21 | The assistant owns the technical bar. Hard-gated: outbound posts and messages, spend, on-chain, secrets and keys, production database migrations, settings changes. | STANDS. Consistent with tiers 2 and 3. |
| A private standing note restating the 2026-10-09 rulings | 2026-10-09 | A restatement of the three rulings of that day. | STANDS. This table is the longer form of it. |
| ZAOOS `.claude/rules/agent-loops.md` rule 35 | undated in the text | "Overnight/unsupervised loops are PR-only ... NOT merges". | CONFLICTS with the seat's overnight stance of 2026-10-09, which sends docs to the merge lane overnight. OPEN 5. |
| A standing note of the seat's on ZAOstock reviews (machine-local, not in a repo) | 2026-09-27 | Every ZAOstock PR, and any PR Zaal did not write, gets an independent reviewer plus screenshots of the preview. | OPEN 2. |

Not found, and where I looked: I searched the three texts named in the brief, the shared agent operating rules, ZAOOS CLAUDE.md and `.claude/rules/`, and the private memory notes by the word "merge". I did not search the server, Telegram history, or the other memory notes that mention merging beyond the three read in full above (the search listed more than 50; I did not count them exactly). A sixth conflicting text may exist there.

## OPEN for Zaal

Each takes the stricter reading until he answers. One line each, recommendation first.

1. **Public copy.** Recommend: it stays his. His 11:30 ruling on 2026-10-09 said so; his 18:51 ruling that day says no site needs his impact review. I cannot tell whether "impact review" was meant to cover the words on a public page.
2. **ZAOstock deep review.** Recommend: keep the screenshots for anything that renders, drop the "his look" part. Per his ruling of 2026-09-27, ZAOstock and any merge he did not write must get a thorough review. The festival that ruling was written for was 3 Oct. His 2026-10-09 rulings postdate it and name no exception. The merge tool still prints "a ZAOstock merge still needs the reviewer's screenshots".
3. **Tests and new scripts in tier 1.** Recommend: leave as is. The workflow also auto-merges PRs made only of test files or newly added `scripts/**` tools. The draft tier says "docs and research" only. Nothing in his words covers this either way.
4. **Is green CI required, and what about repos that have none?** Recommend: yes, required, and no-CI repos stay his hand. The 2026-10-09 rulings do not mention CI. With it required, every code PR on zaal-dotfiles, zao-vault and wavewarz-protocol is his hand as of 2026-10-12, because CI there cannot run (measured below). His nine hand merges on 2026-10-10 in one sitting were that pattern, which is the kind of queue the rulings were meant to end. I did not count how many such PRs open per day. The runner proposal is the way out.
5. **Overnight.** Recommend: the seat's overnight stance as written (docs yes, code held till morning). Rule 35 says no merges at all overnight.

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

**This is already ruled, including where it runs. What is left is doing it.** Four rulings, in order:
- Per a ruling by Zaal on 2026-10-10: a self-hosted runner, plus fewer runs.
- Per a ruling by Zaal on 2026-10-10: no spend on Actions. The Actions budget stays at zero and every private repo is to use a self-hosted runner instead.
- Per a ruling by Zaal on 2026-10-10: he asked about a different machine as the runner host; the seat owns the steps.
- Per a ruling by Zaal recorded 2026-10-11: it names the host, notes that nothing is registered yet and that registration needs a token from repo settings, which is his tap, and it answers the open runner question. **This is the current ruling.** Its standing: it was relayed to the seat by another lane, not typed in the seat's pane.

The first version of this doc cited only the first two rulings and treated the host as an open choice. That was wrong: my search for later rulings used the words merge, tier and auto-merge, not runner. Which host was named is not repeated here, because this repo is public.

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

Runner host: ruled on 2026-10-11, and not named in this public repo. The host-specific detail is kept out of this repository.

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
- The shared agent operating rules (private): retarget a stacked PR's base to main before merging the one underneath it.
- ZAOOS doc 2655 (2026-10-10): after the base is squashed, "re-create each dependent PR as a fresh branch off main and close the old one as superseded".
- A standing note of the seat's (2026-10-10, machine-local): no stacks; wait for the base to merge, then rebase.

Proposal, the seat's draft from its build brief to this lane on 2026-10-12, which I think is right: **the lower PR merges first. The upper PR is then retargeted to main, and a verdict on it only counts once CI has run on its head against main.** Reasons: a verdict given while the upper PR targeted the lower branch graded a different diff; and after a squash of the base the upper PR's diff against main changes, so both the verdict and the CI result from before are about something else. This keeps rule 7's "base must be main" and changes its ordering (rule 7 retargets before merging the lower one). The cost is known and rule 7 says so itself: when the lower PR lands as a squash, the upper one usually conflicts against main (ZAOOS #3864 did). Where it does, doc 2655's re-create is the fallback, and the fresh PR needs its own verdict. Authors avoid the whole thing by not stacking, which is the memory's rule and stays the default.

## What is not in this doc

- No change to any workflow, rule file, memory file or decision file. The "Older texts" table says which are stale; editing them is separate work, and the two that live in CI or settings are his.
- No count of how many PRs each tier would have caught last week. I did not measure it.
- Review quality (what makes a verdict CLEAN) is doc 2204 and 2214's subject.

## Sources

- Zaal's rulings of 2026-09-27, 2026-10-09 (09:40, 11:30, 12:18, 16:43 and 18:51 EDT), 2026-10-10 (four) and 2026-10-12, and one recorded 2026-10-11, all from a private decision log read on 2026-10-12. Summarised above, not quoted, because this repository is public.
- The shared agent operating rules and the private standing notes named above (described, not quoted).
- ZAOOS `.github/workflows/docs-automerge.yml`, `.claude/rules/agent-loops.md` rules 35 and 38, research docs 2655 and 2661 (origin/main at 1d028fd13).
- zaal-dotfiles PR 516.
- GitHub docs source, https://github.com/github/docs at commit dbd054791b6d: [secure-use.md](https://github.com/github/docs/blob/main/content/actions/reference/security/secure-use.md), [self-hosted-runners.md](https://github.com/github/docs/blob/main/content/actions/concepts/runners/self-hosted-runners.md), [add-runners.md](https://github.com/github/docs/blob/main/content/actions/how-tos/manage-runners/self-hosted-runners/add-runners.md), [github-actions.md billing](https://github.com/github/docs/blob/main/content/billing/concepts/product-billing/github-actions.md). Fetch status: FULL for all four (HTTP 200, raw). Quotes have the docs' template variables written out as the product names they render to.
- GitHub REST API via `gh api`, 2026-10-12: repos, rulesets, branch protection, collaborators, actions/runners, actions/runs, check-runs.
