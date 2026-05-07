---
topic: handoff
type: resume-pointer
status: active
last-validated: 2026-05-07
related-docs: 620, 621, 622
---

# 2026-05-07 — bonfire-corpus grill session resume

> **For the next Claude on a different machine.** Zaal switched computers mid-session. Read this file FIRST, then the docs it points at, before resuming.

## Quick context (read in order)

1. **`research/community/621-zao-context-canon-may7/README.md`** — every canonical fact Zaal locked today. Founder structure, project taxonomy (ZAO vs ZABAL), 12-month vision, branding rules, brand + legal architecture, mindmap projects, open questions.
2. **`research/agents/620-bonfire-push-everything/`** — the bonfire auto-push pipeline DISPATCH (5 sub-docs + hub). The reason for the grill session.
3. **`research/community/622-impact-networks-david-ehrlichman/README.md`** — David Ehrlichman framework, ZAO scored 2.4/5, 12-week sprint mapped. Confirmed Ehrlichman is co-founder of Hats Protocol.

## What we're doing

Building `bonfire-corpus/` (NEW folder, not yet created). Canonical 200-500 word `.md` files Zaal owns + reviews + locks, then auto-pushed to his Bonfire knowledge graph. 5 layers: identity, org, system, process, events.

Strategy = Hybrid C: Claude drafts identity + org + system layers from existing repo + memory; Zaal writes process + events. Then Zaal redlines drafts.

## Where we left off

Mid-grill. Q1-Q12 (partial) answered. Open questions for next grill (Zaal-only, can't research):

**Mindmap gap questions (still pending Zaal answer):**
1. **LTAW3** acronym + season relationship + who is Maru
2. **prizem** — separate outward orbit on mindmap, what is it
3. **Midi-ZAO-NZ** — real project? music?
4. **ZAO Cards** — NFT? playing cards? status?
5. **Student $LoanZ** — joke / real / punny ZAO Card?
6. **Mindful Moments** sub-newsletter — who is Iain, handle
7. **Eden / Bad / Fractal Hours / OP Fractal** — ZAO Fractals = ZAO-hosted; others = external/peer fractals?

**Bigger questions parked from earlier (Q12 onward):**
8. Theory of ecosystem flywheel — how do projects compound (shared community? shared infra? shared brand? shared learning? all four?)
9. Conference names + dates that featured Empire Builder + Bonfire (2 conferences)
10. Exact ZABAL → ZAO Project proposal format (existing template or invent fresh?)
11. Other ZABAL Projects beyond Empire Builder + Bonfire integration + POIDH + BCZ YapZ
12. Iman full role (WaveWarZ Africa lead AND ZAO Devz lead — distinct or overlapping?). Real name + handle.
13. attabotty real name + role specifics on ZAO Festivals + handle
14. candytoybox (Samantha) handle on X / Farcaster, last name, exact WaveWarZ role split
15. Hurric4n3ike handle on X / Farcaster, real name, ship cadence
16. Ohnahji B handle, role on Web3 Podcast
17. ZAO membership criteria + tiers (wallet? Respect? invite?)
18. ZABAL token current state: supply, distribution, treasury, sustainability model
19. Decision-making process at the ZAO collective level
20. Riverside = Riverside.fm (the recording platform) or different company?
21. Education (university, degree)
22. Personal context: family / health relevant to bio (only as Zaal wants to share)

## Memory files NOT in the repo (local to old machine)

These were created today on the old Mac at `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/`. They are NOT in the git repo. If the new machine doesn't have synced ~/.claude, the new Claude won't see them.

The good news: doc 621 + this handoff + 622 capture the FACTS from these memory files. Memory files just give Claude the "rules of behavior" — the canonical facts are in the repo docs.

New memory files written 2026-05-07 (port to new Mac if you want behavioral continuity):
- `feedback_grill_one_by_one.md` — ask one question, wait, adjust. No batch essay.
- `feedback_research_before_grill.md` — research existing material BEFORE asking biographical questions. Triggered by bartending misread.
- `project_zaal_never_bartended.md` — Zaal NEVER bartended. Old memory misread.
- `project_jangouu_forever.md` — JANGOUU FOREVER all caps, college 2018/19, semi-active May 2026, [@jangouuforever](https://x.com/jangouuforever) + [beacons.ai/jango.uu](https://beacons.ai/jango.uu).
- `project_zaal_jackson_to_riverside.md` — Jackson Labs -> Riverside (June 2026 fulltime, Cameron contact, BCZ folder has cameron/ subdir).
- `project_candytoybox_samantha.md` — candytoybox = Samantha (her/she), WaveWarZ cofounder.
- `project_hurric4n3ike.md` — Hurric4n3ike (lowercase, digits 4+3), WaveWarZ founder + lead dev.
- `project_zao_incubator_model.md` — The ZAO operates as INCUBATOR. WaveWarZ first project.
- `project_zao_12mo_vision.md` — May 2027 win = "ecosystem primitives for any digital creator." Primitive = INTERNAL only.
- `project_zao_vs_zabal_projects.md` — TAXONOMY: ZAO Projects vs ZABAL Projects. Conversion via formal proposal.
- `project_zao_brand_legal_architecture.md` — BCZ Strategies LLC = legal hub. ZABAL = umbrella. The ZAO = impact network (no legal entity yet, DUNA didn't fit). WaveWarZ -> WaveWarZ LabZ LLC TX.

To port: rsync the memory dir from old Mac to new, OR sync ~/.claude via dotfiles, OR just rely on doc 621 + 622 + this handoff (which contain all the facts). New Claude will operate slightly differently without the feedback files (e.g., might not know "grill one by one" rule), but the canon facts will be intact.

## Resume sequence on new machine

```bash
# 1. Clone or pull latest
cd ~/Documents/ZAO\ OS\ V1   # or wherever
git fetch origin --all

# 2. Check out the active branch
git checkout ws/research-621-zao-context-canon
git pull

# 3. Open Claude Code in the repo, then point Claude at:
#    - this file
#    - research/community/621-zao-context-canon-may7/README.md
#    - research/community/622-impact-networks-david-ehrlichman/README.md
#    - research/agents/620-bonfire-push-everything/README.md
```

Then say: **"resume bonfire-corpus grill from doc 621, open questions list."**

The new Claude reads the docs, picks up at the open question list above, and continues one-by-one (per `feedback_grill_one_by_one.md` if memory ported, otherwise tell it explicitly).

## PRs in flight (Zaal merges himself)

- **#482** — doc 618 (agents.md spec audit + cleanup). Merged status: open / merged check.
- **#485** — doc 620 (bonfire push-everything DISPATCH).
- **#487** — doc 621 (ZAO context canon, will include 622 + this handoff after next push).

Merge order: 482 first (foundational), then 485 (depends on 618 cross-links), then 487 (depends on both).

## What NOT to do on the new machine

- Don't restart the grill from cold. Read doc 621 first.
- Don't ask Zaal about bartending, Jackson Labs, JANGOUU FOREVER spelling, project taxonomy, founding dates, or 12-month vision. All locked in 621.
- Don't rename `agents/<role>/PERSONA.md` back to `AGENTS.md` (doc 618 settled this).
- Don't propose new bots or new agent stack changes. CLAUDE.md "Primary Surfaces" locks the 5-bot map.
- Don't push directly to main. PR + Zaal merges.
