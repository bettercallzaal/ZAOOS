---
name: site-pass
description: DRAFT (doc 2639, not yet installed as a skill). One pass over a ZAO website so it reads as made by people and meets a measured quality floor. The agent does content, data, structure, code and QA; the look comes from the designer (Ryan leads all ZAO design, rulings 53 and 54). Use for "make this site better", "build the page from Ryan's spec", "does this look AI-made", or before shipping any public page.
---

# site-pass

Built from ZAOOS doc 2639. The generic-tells list is quoted from Anthropic's `frontend-design` skill (Apache-2.0). The copy rules come from the humanizer rules (MIT, Siqi Chen). The screenshot-and-grader loop follows Anthropic's harness article (Prithvi Rajasekaran). The audit method follows ZAOOS doc 2637 Finding 8.

## The line

**On a ZAO public surface the agent never originates visual design.** That covers palette, typeface, imagery, illustration, poster, share card, layout mood and motion style. Ryan leads all design (zao-vault `decisions/grill-2026-10-07-seat-morning.md`, items 53 and 54).

The agent's work is everything else:
- content
- data
- semantic structure
- accessibility
- performance
- code
- QA

When the build needs a visual decision nobody has made, that is a question for the designer, not a choice.

## 0. Name the owner

Write one line into the PR body or lane report: `site-pass: look owned by <name>, spec at <path or link>`.

If no spec exists, the pass covers steps 1, 2, 5 and 8 only, and the visual layer stays as it is.

## 1. Subject

Write three sentences for the owner to confirm: what the subject is, who the page is for, and the page's one job.

## 2. Real content

Gather the actual copy, live data, links, lore and photos into one file in the repo before any layout work.

**Never invent:**
- stats
- testimonials
- logos
- quotes
- photos

If something is missing, show the honest empty state: one plain sentence plus one action, like fleetfoxes.com's "There are no upcoming events" (doc 2637 Finding 7).

**Copy rules:**
- Write for the visitor, not about the system.
- Name buttons by what happens ("Post a bounty", not "Submit"), and keep the same word through the flow.
- Use sentence case.
- No sales language.
- No forced groups of three.
- No "not X but Y".
- No emojis.
- No dashes used as decoration.
- Errors say what happened and how to fix it, and never apologise.
- Read the copy against `~/.claude/skills/zaal-voice/humanizer/RULES.md`.

## 3. Spec intake

Copy the designer's tokens verbatim into CSS custom properties: colours, type families, scale, spacing and radii. Add a comment naming the source file and date. Change nothing.

Fonts: self-host only what the spec names, put the licence file (OFL for most) beside the font files, and use `font-display: swap`.

## 4. Gap list

List every visual decision the build needs that the spec does not cover, for example:
- a hover state
- a second heading level
- the error colour
- the empty-state treatment
- a dark mode

Send the list to the owner as questions.

Until an answer arrives, render the gap in the most neutral way the existing tokens allow and mark it `/* GAP: awaiting <owner> */` in the CSS. Never fill a gap with a fresh colour, font or effect.

## 5. Build

- Semantic HTML first: `header`, `nav`, `main`, `section` with headings in order, `footer`, real `button` and `a` elements, `alt` text that says what the image shows.
- Progressive enhancement: the page reads and works with JavaScript off, and scripts only add to it.
- The smallest change that renders. Follow repo conventions; existing components outrank new ones (`code-restraint.md`).

## 6. Screenshot loop

Render at 390x844 and 1280x900 and read the images. Keep every iteration as `shots/<n>-<width>.png` in the scratchpad. A middle iteration is sometimes the best.

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --window-size=390,844 --virtual-time-budget=8000 --screenshot="$OUT/1-390.png" "$URL"
"$CHROME" --headless=new --hide-scrollbars --window-size=1280,900 --virtual-time-budget=8000 --screenshot="$OUT/1-1280.png" "$URL"
```

Alternatives are gstack `browse` (`~/.claude/skills/gstack/browse/dist/browse`) or the Playwright CLI. Serve a static site with `python3 -m http.server`, and a Next app with `npm run dev`.

## 7. Grade with a fresh agent (never your own work)

Spawn an agent with no edit tools. Give it the screenshots, the spec, the gap list and the subject sentences. Use this prompt:

> Grade this page. Every criterion starts at FAIL and flips only with evidence you can point at in a screenshot or the source. If you cannot verify something, write UNVERIFIED. Do not praise.
> 1. Spec fidelity: list every place the build differs from the designer's spec - colour, type, spacing, layout, imagery.
> 2. Defaults that came from a framework or an agent, not the spec. Check: Inter or Roboto; Tailwind indigo or purple gradients; cream #F4F1EA with a terracotta near #D97757; near-black with one acid accent; identical rounded cards with one soft shadow; an all-caps eyebrow over every heading; "A · B · C" meta strings; an arrow on every button; 01/02/03 on content that is not a sequence; one accented word in a headline; fade-and-slide-up on every section. For each, say whether the spec asked for it.
> 3. Content: anything invented, placeholder, or missing an honest empty state.
> 4. Function: can a first-time visitor tell what this is and do the page's one job without guessing?

- Items 1 and 3 are the agent's to fix.
- Item 2 findings that the spec did not ask for go to the owner, who keeps or changes them.
- Loop steps 5 to 7 until 1 and 3 are clean, or for 5 rounds, whichever comes first.

## 8. Floor checks

```bash
npx lighthouse@12.8.2 "$URL" --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless=new" --output=json --output-path="$OUT/lh.json" --quiet
```

**WCAG 2.2 AA, checked one by one (W3C TR/WCAG22):**
- 1.4.3: text contrast 4.5:1.
- 1.4.11: UI component contrast 3:1.
- 1.4.4: usable at 200 percent zoom.
- 1.4.10: reflow at 320 CSS px with no sideways scroll.
- 2.4.7: focus visible.
- 2.4.11: focus not hidden by sticky headers or banners.
- 2.5.8: targets at least 24x24 CSS px.

**Also:**
- `prefers-reduced-motion` is respected.
- The page works with no JavaScript.
- CLS is 0.
- Font licences are present.

**Who fixes what:**
- A contrast failure inside the designer's palette goes to the designer as a finding. The agent does not recolour.
- Markup and code failures are the agent's.

**Say what a local run cannot prove** (compression, cache headers, the 404 page, other platforms' font fallback) and mark each one UNKNOWN until it is checked live.

## 9. Owner look

Put in the PR:
- the 390px and 1280px screenshots of the chosen iteration
- the grader's list
- the gap list with its answers
- the Lighthouse table

The owner looks once on a phone before merge.

## Never

- Never originate a colour, typeface, image, illustration, poster or share card for a public ZAO surface.
- Never generate images, AI or otherwise, for one (memory `feedback_no_ai_in_public_design`).
- Never grade your own iteration.
- Never ship invented content as real.
- Never touch Vercel; deploy changes are Zaal's.
