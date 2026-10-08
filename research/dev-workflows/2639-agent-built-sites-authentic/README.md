---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: "2637, 2624, 2081"
original-query: "Zaal, relayed by the poidhz lane on 2026-10-08, verbatim: 'researhc how to build websites with agents and it to be authentic and mroe in ndepth than any oneshot prompt site etc'. The same day the north-creek lane relayed a second ask: a front-end skill that implements a human designer's spec. Scope set by Zaal's rulings 53 and 54 (zao-vault decisions/grill-2026-10-07-seat-morning.md): AI for code is fine; public visual design is not AI-made; Brian leads all design."
tier: STANDARD
---

# 2639 - Agent-built websites that read as made by people: what agents do, what the designer does, and a site pass any lane can run

> **Goal:** Say how agents should build ZAO websites so the result is deeper than a one-shot prompt site, within Zaal's 2026-10-08 ruling that AI does code and does not make public visual design. Name the tells that make a site read as generic, the workflow that gets past a one-shot prompt, and the tools on this Mac for each step. Give lanes one checklist, `site-pass.md` in this folder. Test cases: poidhz.com (bettercallzaal/poidhz, `web/` is Next 16 + Tailwind v4) and northcreek.art (bettercallzaal/north-creek, static `site/`).

## Executive summary

**The split.** The agent does what a one-shot prompt site skips:
- real content
- real data
- semantic structure
- accessibility
- performance
- QA

The look comes from a person. Brian leads all ZAO design (ruling 53). On a ZAO public surface an agent never picks a palette, a typeface, imagery or a poster. It implements the designer's spec, and it turns every visual question the spec leaves open into a question for the designer.

**Why both halves matter.**
- A one-shot site is generic in two ways: an invented look, and invented or missing content. Anthropic's name for the first is "distributional convergence" (Sources 2): unguided, the model samples the middle of its training data. Taking the look from a human designer removes it at the root.
- The second, content, is where agents add real depth. Their output is gathered lore, live data, honest empty states and copy written for the visitor.

**Two mechanisms carry over from Anthropic's own frontend work (Sources 1):**
- A screenshot loop.
- A separate grader, because an agent grading its own design is measured to be lenient.

At ZAO the grader checks two things: fidelity to the designer's spec, and the quality floor.

| Recommendation | Owner |
|---|---|
| Use `site-pass.md` for any ZAO site change; mode is always spec-led on a public surface | every site lane |
| Keep the official `frontend-design` plugin OFF. Its job is choosing a look, which ruling 53 gives to Brian. Its catalogue of generic tells is reused here as a QA lens | nobody needs to act; it is already off |
| Promote `site-pass.md` to `~/.claude/skills/site-pass/` after one run each on poidhz and North Creek | skills lane, zaal-dotfiles PR |

## Key Decisions

1. **On a ZAO public surface the design source is a person: Brian, of North Creek.** Item 53 recorded the name as "Ryan"; Zaal corrected it to Brian on 2026-10-08 (vault item 61). Every mention in this doc was corrected then.
   - Allowed: an agent writes HTML, CSS, components, content structure and data wiring.
   - Not allowed: it originates colour, type, imagery, layout mood, posters or share cards (rulings 53, 54; memory `feedback_no_ai_in_public_design`).
2. **"The spec is silent" is a question, not a choice.** Whenever the build needs a visual decision the designer did not make, the agent lists it and asks. Gap-filling is how a generic default enters a spec-led site without anyone choosing it.
3. **The generic-tells catalogue becomes QA, not taste.** It is used to spot defaults that came from a framework or an agent rather than from the designer, such as Tailwind's demo indigo, Inter, stock card kits or scattered entrance motion. Each finding goes to the designer to keep or change.
4. **The grader is never the builder.** Anthropic: agents grading their own work "confidently prais[e] the work, even when, to a human observer, the quality is obviously mediocre" (Sources 1).
5. **`site-pass.md` stays a draft here** until it has run once on each test case.

## Findings

### 1. What makes an agent-built site read as generic

From four sources, all read raw on 2026-10-08:
- Anthropic's harness article (Sources 1)
- Anthropic's frontend skills blog (Sources 2)
- the official `frontend-design` SKILL.md (Sources 3)
- the humanizer rules (Sources 5)

**Visual tells.** Under ruling 53 these are things to catch and flag, never things for an agent to swap for its own choices.
- **The named default:** "Inter fonts, purple gradients on white backgrounds, and minimal animations" (Sources 2).
- **Why purple:** a blog post (Sources 4) traces it to Tailwind UI's demo default, `bg-indigo-500`. It also reports an August 2025 apology about this from Adam Wathan. The apology itself was not fetched, so treat it as secondhand. Tailwind v4 is the stack on poidhz, so a stray `indigo-*` class is worth a grep.
- **Five newer clusters**, named by the official skill as "defaults rather than choices" (Sources 3):
  1. Cream near #F4F1EA with a serif display and a terracotta accent near #D97757.
  2. Near-black with one acid-green or vermilion accent.
  3. A broadsheet layout with hairline rules and zero radius.
  4. The "SaaS-card kit": identical rounded cards, one radius everywhere, the same rgba(0,0,0,.1) shadow, gradient washes.
  5. Template chrome: an all-caps tracked eyebrow over every heading, "A · B · C" meta strings, monospace for small labels, an arrow on every button.

**Structure tells** (Sources 3):
- A hero built as a big number, a small label, stats and a gradient accent.
- 01 / 02 / 03 markers on content that is not a sequence.
- Fade-and-slide-up on every section and hover motion on every card, which the skill says "read as AI-generated".
- One accented word in a headline.

Structure is shared ground. The order of content, which items form a sequence, and what the page's one job is are content decisions the agent can propose. The visual treatment of them is the designer's.

**Copy tells** (Sources 5; Sources 3 "More on writing in design"). This is the agent's own work, so these are the agent's to fix:
- Sales language and inflated importance.
- Forced groups of three.
- "Not X but Y" constructions.
- Lists with bold mini-headings.
- Title Case headings.
- Emojis.
- Vague sources.
- "Submit" in place of what the button does.
- Errors that apologise.
- Copy about the system instead of for the visitor.

**The meta-tell is missing real content.** Placeholder copy, invented stats and stock icons make even a designer's layout read as a template. The official skill: copy "can make a design feel as templated as the design itself". This is the agent's biggest lever and it is entirely inside the ruling.

### 2. The workflow that beats a one-shot prompt

**Anthropic's measured route (Sources 1):**
- A generator agent builds.
- An evaluator agent uses Playwright and "would navigate the page on its own, screenshotting and carefully studying the implementation before producing its assessment".
- They ran "5 to 15 iterations per generation", and full runs took up to four hours.

**Two lessons transfer:**
- **The wording of grading criteria steers the result.** "Museum quality" pushed one look. So the ZAO grader's criteria are spec fidelity and the floor, not taste words.
- **Keep every iteration.** "I regularly saw cases where I preferred a middle iteration over the last one."

**The ZAO steps:**

| Step | Who | What |
|---|---|---|
| 0. Owner | agent writes it down | Name the person who owns the look (Brian for North Creek and, per ruling 53, all ZAO design) |
| 1. Subject | agent proposes, owner confirms | One sentence each: subject, audience, the page's one job (Sources 3) |
| 2. Real content | agent | Actual copy, live data, lore, links and honest empty states, gathered into the repo before layout work. For poidhz: live bounties and the poidh lore from Zaal's Space with Kenny |
| 3. Spec intake | agent reads, owner supplies | Copy the designer's tokens into CSS custom properties verbatim, with the source named |
| 4. Gap list | agent lists, owner decides | Every visual decision the build needs that the spec does not cover, sent as questions. Default for an unanswered gap: the most neutral rendering of the content, flagged as temporary |
| 5. Build | agent | Semantic HTML, the smallest change that renders, repo conventions |
| 6. Screenshot loop | agent | 390px and 1280px headless renders, read and fixed, each iteration kept |
| 7. Grade | fresh agent | Spec fidelity, generic-tells QA, function, default-FAIL (`loop-evals.md`) |
| 8. Floor | agent measures | WCAG 2.2 AA, Lighthouse, no-JS render, font licences |
| 9. Look | owner | The designer looks once on a phone before merge |

### 3. The quality floor, verified against the spec

From the W3C WCAG 2.2 Recommendation, read raw on 2026-10-08 (Sources 6), all Level AA:

| Criterion | Requirement |
|---|---|
| 1.4.3 Contrast (Minimum) | Text at 4.5:1 or more; large text has a lower bar |
| 1.4.11 Non-text Contrast | UI components and states at 3:1 |
| 1.4.4 Resize Text | 200 percent without loss |
| 1.4.10 Reflow | No two-way scroll at 320 CSS pixels |
| 2.4.7 Focus Visible | The focus indicator can be seen |
| 2.4.11 Focus Not Obscured (Minimum) | New in 2.2. A focused component is not entirely hidden by author content |
| 2.5.8 Target Size (Minimum) | New in 2.2. At least 24 by 24 CSS pixels, with a spacing exception |

A contrast failure in a designer's palette is a finding for the designer, not a colour the agent changes on its own.

Doc 2637 Finding 8 is the worked example on a static site:
- `npx lighthouse@12.8.2`, mobile, headless Chrome, against `python3 -m http.server`.
- 100 on all four categories, CLS 0, 22 KiB on `/` at north-creek PR #9 head aa96d7e.
- It names what a local server cannot prove (compression, cache headers, the 404 page) and what a Mac cannot prove (the Android font fallback), and records each as UNKNOWN.

### 4. Tools already on this Mac, and the gaps

Read on 2026-10-08 from `~/.claude/skills`, ZAOOS `.claude/skills`, `~/.claude/plugins` and `enabledPlugins` in `~/.claude/settings.json`.

| Tool | Where | Use under ruling 53 |
|---|---|---|
| `frontend-design` (Anthropic, Apache-2.0) | `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/` | Not enabled (`enabledPlugins` lists superpowers, oh-my-mermaid, caveman, everything-claude-code, connect-apps). Its purpose is the agent choosing a look, so leave it off. Its tells list (Finding 1) and its writing section are reused |
| `frontend-design` (everything-claude-code 1.10.0) | ECC plugin | **Enabled, and it tells the agent to pick an aesthetic.** It loads whenever "the visual direction matters". On a ZAO public site that conflicts with ruling 53. Not changed here, since plugin settings are Zaal's; flagged |
| `design`, `design-steal`, `design-consultation` | `~/.claude/skills`, ZAOOS `.claude/skills`, gstack | All three generate visual directions. Out of scope for public ZAO surfaces under ruling 53 |
| `design-review`, `plan-design-review` | gstack (MIT, Garry Tan) | Review only; usable in step 7 if the grader is told to judge against the designer's spec |
| `browse` | gstack `browse/dist/` | Built (`browse`, `find-browse` present), so the doc-2411 gap is closed. Step 6 |
| Playwright browsers | `~/Library/Caches/ms-playwright` (chromium 1208, 1243) | Step 6. The Playwright MCP timed out in this session, so use the CLI |
| `zaal-voice` humanizer | `~/.claude/skills/zaal-voice/humanizer/RULES.md` (MIT, Siqi Chen) | Step 2 copy pass |
| Lighthouse | `npx lighthouse@12.8.2` | Step 8 |

**Gaps:**
- No skill encodes "the look is a person's".
- Nothing turns spec gaps into questions.
- Nothing keeps iteration screenshots.
- The always-on ECC skill points the other way.

`site-pass.md` covers the first three. The fourth is Zaal's.

### 5. A question this raises, not answered here

The poidhz lane took poidhz's theme from poidh.xyz. Whether an agent-applied theme taken from the brand's own site counts as "AI-made design" under ruling 53 is Zaal's or Brian's to say. This doc does not rule on it; it is passed to the poidhz lane and the orchestrator.

## Also See

- [Doc 2637](../../events/2637-north-creek-site-design/) - North Creek design research; Finding 8 is the audit method reused here.
- [Doc 2081](../2081-ponytail-agent-restraint/) - code restraint.
- `.claude/rules/loop-evals.md` - default-FAIL fresh-context evaluator.
- `.claude/rules/icm-grounding.md` - the ICM box as the source for brand facts and copy.

## Next Actions

| Who | What |
|---|---|
| north-creek lane | Run `site-pass.md` on northcreek.art against Brian's spec; report the step 4 gap list |
| poidhz lane | Run steps 2, 5 to 8 on poidhz.com; get the section 5 question answered before any further visual change |
| skills lane | After both runs, fold findings into the checklist and open the zaal-dotfiles PR for `~/.claude/skills/site-pass/` |
| Zaal | One line in the seat pane, only if wanted: should the always-on ECC `frontend-design` skill be switched off for ZAO public sites? A settings change, so his |

## Sources

All fetched 2026-10-08 with curl plus an HTML strip, with the raw text saved to the session scratchpad. Quotes are from that text. WebSearch was used only to find URLs.

1. Prithvi Rajasekaran, Anthropic Engineering, "Harness design for long-running application development", https://www.anthropic.com/engineering/harness-design-long-running-apps - FULL (HTTP 200, 34,813 chars).
2. Anthropic, "Improving frontend design through Skills", https://claude.com/blog/improving-frontend-design-through-skills - FULL (HTTP 200, 20,898 chars).
3. Anthropic, `frontend-design` SKILL.md, Apache-2.0, local at `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md` - FULL (disk).
4. "Why Your AI Keeps Building the Same Purple Gradient Website", prg.sh, 26 Oct 2025, https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website - FULL (HTTP 200). Its Adam Wathan account is secondhand.
5. Humanizer rules, MIT, Siqi Chen, `~/.claude/skills/zaal-voice/humanizer/RULES.md` - FULL (disk).
6. W3C, WCAG 2.2, https://www.w3.org/TR/WCAG22/ - FULL (HTTP 200; criterion text extracted for the seven in Finding 3).
7. ZAOOS doc 2637, Findings 7 and 8 - FULL (`origin/main`).
8. zao-vault `decisions/grill-2026-10-07-seat-morning.md`, items 53 and 54 - FULL (`origin/main`, read 2026-10-08).
