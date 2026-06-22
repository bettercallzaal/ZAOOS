# 884 - ZAO x Artizen mechanics working call

- **Date:** 2026-06-21
- **Duration:** ~14 min
- **Platform:** Discord / Craig (3-track per-user recording)
- **Attendees:** Zaal, Thy Revolution (`thyrevolution_eth`), polyraiders / Moses
- **Project:** ZAO Festivals / Artizen (ZAODEVZ/ZAOartizen repo)
- **Full transcript:** [transcript.md](transcript.md)

## Context

Short, exploratory working call kicking off active work on the `ZAODEVZ/ZAOartizen`
repo. Zaal was building the repo live; the three of them tried to reverse-engineer
how Artizen's ranking and funding mechanics actually work. Moses (polyraiders) joined
for ~1 minute, flagged a hospital emergency (a friend's father admitted that night),
and stayed on to listen rather than drop. The bulk of the call is Zaal and Thy
Revolution poking at the live Artizen platform - the ZAO Fund for Emerging Culture,
the PolyRaiders project, boost scores, drive multipliers - and surfacing what neither
of them fully understands yet.

This is a learning call, not a decision call. Its value is that it pins down the exact
knowledge gaps to close (see Open questions), most of which existing research doc 844
already answers.

## Decisions

| # | Decision | Owner | Confidence |
|---|----------|-------|------------|
| 1 | `ZAODEVZ/ZAOartizen` is the operating home for ZAO x Artizen work; Zaal is actively building it out | Zaal | high |
| 2 | Shared repo collaboration: Thy Revolution installs the Claude mobile app + connects, so he can query the bot on what Zaal is building and edit alongside | Both | high |
| 3 | Zaal, Thy Revolution, and Moses tap in together to learn Artizen mechanics as a group | Both | medium |

## Actions

| Title | Owner | Due | Confidence |
|-------|-------|-----|------------|
| Apply to the Artizen Fund (with Christian) - deferred today for Father's Day | ThyRev | - | high |
| Install Claude mobile app, keep Gmail connected, get repo access to collaborate | ThyRev | - | high |
| Drop the ZAOartizen repo + an Artizen primer in the loop chat | Zaal | - | high |
| Close the fuzzy mechanics: curator vs project vs creator vs fund, weekly multiplier, boost-vs-prize timing, where fund capital flows | Zaal | - | high |
| Post Artizen comment supporting PolyRaiders ("had a blast with the benefit battle yesterday, supporting the poly raiders") | Zaal | - | medium |

## Key quotes

- Thy Revolution: "the more boosts somebody gets, the higher up the ranking they get to be more visible on the platform, because it shows that they must be having a bit of support."
- Zaal: "this week was a one x but last week it was a two x and the week before it was a three x... I don't really understand 100% of how it works so I'm just trying to dive in deeper and build our artisan ecosystem."
- Zaal: "I don't know if I should be adding money to projects in my fund or to my fund or where it all goes. That's why I want to tap in more with the three of us."
- Zaal: "the goal is to now learn more about [Artizen] as a curator and then also as a fund project owner."
- Moses (polyraiders): "I have a company emergency at the hospital at the moment... I will listen and tip in where I can. I will not just get up the call."

## Live standings observed on the call

- **ZAO Fund for Emerging Culture** - ranked ~9 in Funds, ~$500-$5,650 raised this drive. First $10,000 was seeded by Artizen.
- **Moses / PolyRaiders** - ranked ~17 in Projects, ~$14,000 raised (Moses able to put ~$150k in). PolyRaiders fund showed a 6x multiplier at one point.
- **Infinite Zero Network** - number 1 project (see repo doc 760).
- Season closing soon - multiplier dropped to 1x this week (was 2x last week, 3x before).

## Open questions (the real research targets)

Most are already answered in `research/business/844-artizen-platform-deep-study`:

1. **Curator vs project vs creator vs fund as roles** - the one genuinely under-documented
   distinction. Funds curate + supply match; projects seek funding; creators have been
   funded. Needs a clean one-page articulation. (-> doc 885)
2. **The 1x/2x/3x multiplier** = weekly **Fund Drives** with escalating match (Phoenix 3x,
   Frontier 2x), not a per-fund setting. Already in 844.
3. **Boost vs prize timing** - `Boost Score = total raised x boosts received`; 10% of a fund
   = cash prize to its top project, 90% = match across curated projects; settles at end of
   week. Already in 844.
4. **Where fund capital flows** - into the fund pool (grows the match available to curated
   projects), not directly into individual projects. Needs confirmation against live behavior.

## Cross-links

- Repo: `ZAODEVZ/ZAOartizen` (graduated 2026-06-13, research provenance stays in ZAOOS)
- [[project_zartizen_repo]] - graduated repo memory
- [[project_zao_fund_artizen]] - Zaal owns the ZAO Fund for Emerging Culture (S6)
- `research/business/844-artizen-platform-deep-study` - platform mechanics deep study
- `research/business/843-zao-fund-artizen-roster-june2026` - ZAO Fund roster
- Doc 885 (this session) - Artizen roles + capital-flow research follow-up
