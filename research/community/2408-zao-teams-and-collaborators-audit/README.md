---
topic: community
type: audit
status: research-complete
last-validated: 2026-08-24
superseded-by:
related-docs: "2407, 2101, 866, 947"
original-query: "can u do an audit and a /zao-research on any other teams or adding more info to the teams u have"
tier: STANDARD
---

# 2408 - Every team Zaal is on, and why the estate could not tell us

> **Goal:** Zaal listed five teams, said "I'm prob missing some", and was right.
> This is the sweep that found the rest, and the structural reason they were
> invisible.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Teams have no home in the estate. Give them one.** `zao-vault/projects/TEAMS.md` is now it. | Nothing anywhere recorded who is on what. Not memory, not the board, not the ICM boxes. The information existed only in Zaal's head and in scattered per-person notes. |
| 2 | **Repo descriptions are the best documentation ZAO has, and nothing reads them.** | The only real description of Zoostr anywhere in the estate is its GitHub repo description. Two teams were invisible to a memory-and-vault search and obvious from `gh repo list`. |
| 3 | **The count went 5 to 16.** Five from Zaal, six more he added when prompted, five found by sweeping. | The sweep is the part that generalises - asking him produced six; looking produced five more he did not think to name. |
| 4 | **"Sam" and "Candy" are the same person - do NOT report Sam as an unlisted cofounder.** | `people/Sam.md`: *"Also CandyToyBox - and sometimes just Candy. Confirmed by Zaal introducing her on 2026-04-29."* This audit nearly shipped that as a finding. |
| 5 | **CEF is ambiguous and must not be resolved by guessing.** | Zaal describes CEF as a foundation-token build with James McGee. The only CEF in the estate is a board card, *"Pay P2P $100 of lyonsden for the 45-min clip edit (CEF)"*, filed under DISTRIBUTION. Either the acronym is reused, or that payment came out of the fund. Unresolved. |

## Method, and what it covered

Sweep run 2026-08-24. Ground truth first, because it is the cheapest thing to
check and the most certain (`confirm-before-claiming-absence.md`).

| Source | Scale | What it yielded |
|---|---|---|
| GitHub, all orgs Zaal belongs to | **4 orgs**, 144 repos in `bettercallzaal` alone | Build Africa DAO, Nouns DAO Africa, WalkerEnterprise, and the real Zoostr description |
| Cowork tracker (`tasks`) | 387 open cards | the `owner_label` field - **8 distinct human owners** |
| Memory | ~200 `project_*` files | roles, the ZAO/ZABAL taxonomy, per-person history |
| Vault `people/` | 25 notes | Sam=Candy, Cassie's role, Hurricane, Iman |
| Vault `projects/brand-priorities.md` | 1 file, locked 2026-08-18 | Aziz as Baraza virtual lead |
| ICM boxes | 23 registered | brand surfaces, no team data at all |

**The board's `owner_label` was the highest-yield field and nobody had looked at
it as a roster.** Eight distinct owners: Zaal, Iman, Jose, thyrev, samantha,
Aziz, Dank Phart, and "Open".

## The roster: 16

### Founded or co-owned (6)

| Team | Zaal is | Who else |
|---|---|---|
| The ZAO | cofounder | Candy (= Sam = CandyToyBox); the community |
| ZAO Festivals / ZAOstock | founder, **only employee** | everyone else volunteers |
| ZABAL Gamez | the only one running it | participants, teachers, mentors |
| ZABAL | the founder-led track | collab with **Empire Builder** - Jordan Oram front-of-house, Adrian API |
| ZAO Artizen | owns and runs it | Jose, Civil Monkey, Candy |
| ZAO Devz | founded it | **Iman** runs it (vault: "intern -> operator") |

### Built with a partner (2)

| Team | Zaal is | Who else |
|---|---|---|
| Zoostr | co-builder | **Cashlessman / Boostr**. ZABAL x Boostr; a Sparkz launch, marketed by ZOL |
| CEF | co-builder | **James McGee** (Meme for Trees) |

### On someone else's team (5)

| Team | Zaal is | Who else |
|---|---|---|
| WaveWarZ | ecosystem lead | Hurric4n3ike founder + lead dev; Candy promo and media |
| COC Concertz | teammate, **50/50 JV** | Thy Revolution founder; COC core team |
| Let's Talk About Web 3 | with Ohnahji | Ohnahji |
| Ohnahji University streams | supporting | Ohnahji |
| Build Africa DAO / Baraza | partner | **Aziz** (virtual lead), **Miss Lulu** |

### Found by the sweep, not previously listed as teams (3)

| Team | Zaal is | Who else |
|---|---|---|
| **ZAO Fractal** | runs the governance | a standing weekly roster - see below |
| **Sparkz** | founder | James McGee advising tokenomics; Zoostr is its first capsule |
| **BCZ Strategies** | his own consulting entity | client work, incl. Riverside Group |

## ZAO Fractal has a standing roster and it was never written down

The longest-running team in the estate. **90+ weeks of fractal calls since about
August 2024**, Mondays 6pm EST, running the Respect Game as ZAO's primary
governance mechanism.

A single board card names the room, because points are awarded manually:

> "Award 10 fractal points each: **Zaal, Candy, Dank Phart, Jose, Ohnahji,
> Paper, Metamu**" - camera-on participants at the fractal meeting.

**Tadas** deployed `zao.frapps.xyz/submitBreakout`, live 20+ weeks.

That is an eight-person recurring team with two years of history, and the only
record of who is in it is an award card. It had no entry in `people/`, no project
memory naming the roster, and no ICM box.

## People doing real work with no team recorded against them

Each of these came out of a different source and none appears in any roster:

- **Aziz** - virtual lead on the Baraza partnership, which feeds ZAOstock
  virtual directly. Joins the weekly Monday calls. There is an open card to give
  him and Miss Lulu a Baraza partner button on the cowork board, and another to
  connect him with Iman.
- **Dank Phart** - fractal regular. Owns two board cards: relay Zaal's interest
  in provenance and art to Greg, and send the Metal Label material. Has **no
  `team_members` slug**, so the board cannot properly assign to them.
- **Cassie** - communications and strategic translation. Her offer, in her own
  words, is reviewing grant and partner application answers before submission:
  *"How do I make it make sense to the others."* Deliberately framed as a
  tap-in, not ongoing involvement.
- **Miss Lulu** - named once, on the Baraza partner-button card. Nothing else
  anywhere.
- **Paper**, **Metamu** - fractal regulars, no notes.
- **Tadas** - built and deployed the fractal submission app.

## Why they were invisible

Three distinct failures, worth separating:

1. **No teams surface existed.** The board tracks TASKS and has an owner field;
   memory tracks FACTS about people one at a time; ICM boxes describe BRANDS.
   None of them answers "who is on this". The estate had every fact and no view.
2. **The newest work has the thinnest record.** Zoostr appears exactly once in
   memory and the vault - as a todo, *"Send the Zoostr idea to Yerb and
   cashlessman"*. The James McGee CEF build has **zero** records. A thing Zaal
   is actively building is the thing least likely to be written down.
3. **Repo descriptions were never treated as a source.** They are written at
   creation, when intent is clearest, and they carry partner names:
   > `zoostr` - *"Zoostr - ZABAL x Boostr creator-token launch: live boost
   > leaderboard + 50% fees to leaderboard by points. A Sparkz launch, built +
   > marketed by ZOL."*

   That one line names the partner, the mechanism, the parent project and the
   marketing channel. No memory file says any of it.

## Corrections this audit makes

- **Sam is not a missing cofounder.** Sam = CandyToyBox = Candy. `people/Sam.md`
  also carries an explicit warning that a *separate* `[[Candy]]` in the vault may
  be a different person - a ZAOstock volunteer - and must not be merged until
  confirmed. Two people, one nickname, still unresolved.
- **ZABAL is not ZABAL Gamez**, and the distinction is already canon (memory
  `project_zao_vs_zabal_projects`, 2026-05-07). ZAO Projects are incubated with
  community cofounders; ZABAL Projects are Zaal's solo track and convert by a
  formal proposal. **Empire Builder has done the validation - two crypto
  conference talks - and the proposal is still unwritten.**
- **Doc 2407's estate claim needs no change**, but this audit adds the reason:
  the estate's characteristic failure is knowledge that stops at one consumer,
  and team membership stopped at zero.

## Open questions

| # | Question | Why it matters |
|---|---|---|
| 1 | **ZABAL Gamez or ZABAL Games?** Zaal wrote "Gamez" twice on 2026-08-24; the ICM box is `zabalgamez`; memory records *"canonical name is ZABAL Games... Confirmed by Zaal 2026-05-20."* | It is on a shareable page right now, spelled Gamez |
| 2 | **Which Jose?** Records hold **Jose Acabrera** (joseacabrerav, regen musician) and **Joseph Goats** (rebranded from Jose, per the brand glossary). | Naming the wrong person on a public roster |
| 3 | **What does CEF stand for**, and is the DISTRIBUTION clip-edit card the same CEF? | Two different things may share an acronym |
| 4 | **Riverside: employer or client?** Memory says full-time software role from June 2026; the repo `riverside-group-demo` describes a landscape design firm's website "Built by BetterCallZaal". | Possibly both; changes how it is described |
| 5 | **WalkerEnterprise** - Zaal is an org member. Active August 2026, Kalshi prediction contracts and poker CFR tooling. Nothing anywhere says what the relationship is. | An unexplained org membership |
| 6 | **Nouns DAO Africa** - Zaal is a member; last repo activity September 2025. | Dormant or quiet |
| 7 | **Miss Lulu, Paper, Metamu** - real collaborators, one mention each. | Cannot be credited or contacted from the record |

## Also See

- [Doc 2407](../../dev-workflows/2407-orca-tmux-lane-integration/) - the estate-visibility sibling: surfaces blind to each other because each enumerates only what it owns. **Unmerged as of 2026-08-24** (branch `ws/research-2407-orca-tmux-lane-integration`)
- [Doc 2101](../../events/2101-fractal-sparkz-tokenomics-james-festival3/) - the fractal call where James McGee turned into a Sparkz tokenomics session
- [Doc 866](../../events/866-thyrev-zaal-coc-framing-laptop/) - the Thy Rev call that confirmed COC Concertz as a 50/50 JV
- [Doc 947](../../events/947-marie-zaal-zao-fund-intake/) - the ZAO Fund intake call that introduced Civil Monkey

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Answer open questions 1 and 2; done when the shared roster page carries the settled spelling and the right Jose | @Zaal | Decision | 2026-08-26 |
| Give Dank Phart a `team_members` slug so the board can assign to them; done when their two cards have a non-null owner | @Zaal (Claude) | PR | 2026-08-27 |
| Write `people/` notes for Aziz, Dank Phart, Miss Lulu, Paper, Metamu; done when five notes exist | @Zaal (Claude) | Vault PR | 2026-08-29 |
| Add a fractal roster to `projects/TEAMS.md` rather than leaving it in an award card; done when the eight names are in the file | @Zaal (Claude) | Vault PR | 2026-08-26 |
| Write the Empire Builder adoption proposal that converts ZABAL to a ZAO Project - outstanding since May 2026 | @Zaal | Doc | 2026-09-15 |
| Answer questions 4, 5, 6 (Riverside, WalkerEnterprise, Nouns DAO Africa) | @Zaal | Decision | 2026-08-31 |

## Sources

All FULL, all measured on 2026-08-24 on this machine. This audit is of ZAO's own
estate, so the sources are internal by construction; the external-community
requirement does not apply and no external claim is made.

- [FULL - `gh api user/orgs`, `gh repo list` x4] 4 orgs: `bettercallzaal` (144 repos), `ZAO-DEVZ`, `Nouns-Dao-Africa`, `Build-Africa-DAO`, plus `WalkerEnterprise`. Repo descriptions quoted verbatim.
- [FULL - `mcp__supabase-cowork__execute_sql` against the cowork tracker] 387 open cards; `owner_label` distribution; the Dank Phart, Aziz, Baraza, Zoostr, CEF and fractal-award cards quoted from their `title` and `notes`.
- [FULL - read from disk] `zao-vault/people/Sam.md`, `people/Cassie.md`, `projects/brand-priorities.md` (locked 2026-08-18).
- [FULL - read from disk] memory `project_zao_vs_zabal_projects` (2026-05-07), `project_fractal_process`, `project_james_meme_for_trees` (doc 2101), `project_coc_concertz_framing`, `project_wavewarz_canonical`, `project_hurric4n3ike`, `project_candytoybox_samantha`, `project_adrian_empire_builder`, `project_empire_builder_zabal_integration`, `project_jose_acabrera`, `project_marie_civilmonkey_berlin`, `project_zao_fund_artizen`.
- [FULL - `~/.zao/private/icm-registry.json`] 23 ICM boxes, name list only. Carries no team data, which is itself a finding.
- **Zaal, direct, 2026-08-24:** the five original teams, the ZABAL / ZABAL Gamez split, Zoostr as the Cashlessman collab, the CEF mechanism, Let's Talk About Web 3 and the university streams with Ohnahji, ZAO Devz under Iman, ZAO Artizen with Jose / Civil Monkey / Candy. Quoted as given.
- Credit: the collaborators named throughout are credited by the public identity each works under. Nothing here carries a private contact detail.
