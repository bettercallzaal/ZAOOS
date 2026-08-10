---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-10
related-docs: "2258, 331, 329, 324"
original-query: "let's research comfy UI and see how we can use that to improve our workflow"
tier: STANDARD
---

# 2259 - ComfyUI as the asset lane: moving repetitive image work off the dollar-a-turn meter

> **Goal:** Decide whether ComfyUI belongs in the ZAO workflow, and if so for what. The answer turns out to depend on doc 2258's finding rather than on image quality.

## Start here: we already researched this, for a different question

ComfyUI appears in **five existing ZAO docs** - 313, 324, 328, 329, 331 - always as a *music-production* component: album art via FLUX.1-schnell, music video via Wan 2.x on Apple Silicon with MPS, the ComfyUI-MLX extension for faster loading. Doc 331 records the realistic figure: **a 5-second 720p clip takes 3-8 minutes on an M2 Max with 64GB**, 16GB minimum and 32GB+ recommended.

None of that answers the workflow question, so this doc extends rather than repeats.

## What the tool actually is (verified, raw fetch 2026-08-10)

126,066 stars, 14,883 forks, **GPL-3.0**, last push 2026-08-10 - actively developed the day this was written. From the README verbatim:

- *"A visual node graph for building and reusing image, video, audio, 3D, and text workflows without code."*
- *"Reusable subgraphs, workflow templates, App Mode, and a local API for integrating workflows into applications."*
- *"It integrates seamlessly into production pipelines with our API endpoints."*
- *"Save and load workflows as JSON, or recover complete workflows and seeds from supported generated media."*
- *"Efficient local execution with asynchronous queueing, partial graph re-execution, smart VRAM and RAM management."*
- *"Runs fully offline: core does not download anything unless you request it. Use `--disable-api-nodes` to disable the optional paid Comfy API nodes and force all built-in functionality to stay offline."*

## The reason to care, and it is not image quality

Doc 2258 measured that **agent work costs turns x ~$1.01**, flat. That reframes every repetitive asset task in the ZAO calendar:

| Task | Through a Claude lane | Through ComfyUI |
|---|---|---|
| 32 recording thumbnails | ~32 turns, ~$32, and Claude cannot render an image anyway | one turn to queue a batch |
| Daily ZABAL standings cards, 3 tracks x 7 days | 21 turns of prompting a paid image API | one workflow, 21 seeds |
| 6 finisher/champion collectibles | per-image spend, per-image approval | one graph, six inputs |
| ZAOstock poster crops per platform | manual, every time | one graph, N output nodes |

**ComfyUI moves repetitive asset generation off the metered path entirely.** It runs locally, offline, with no per-image charge - electricity instead of tokens. That is the workflow improvement, and it is the same argument as doc 2258 rather than a new one.

Three properties make it agent-compatible in a way a chat-based image tool is not:

1. **A workflow is JSON.** It lives in the repo, gets reviewed in a PR, and diffs like code. A prompt typed into a web UI is a click-path nobody can review or reproduce.
2. **Seeds are recoverable from the output.** Regenerating last week's card with one word changed is exact, not approximate - which is what "the standings drop daily and change daily" actually needs.
3. **Partial graph re-execution.** Change the text layer and only the text layer re-renders. Cheap iteration is what makes a daily cadence survivable.

## Where it should NOT go

- **Not on the MacBook Air.** Doc 331's own numbers rule it out: 32GB+ recommended, and minutes per clip on an M2 *Max*. Running this on the Air would make the daily cadence slower than doing it by hand.
- **Not for one-off images.** The setup cost only pays back on repetition. A single announcement graphic is not worth a graph.
- **Not for anything with an unclear licence downstream.** GPL-3.0 covers the *software*; generated output is not a derivative work of the code, but any ZAO tool that *bundles or links* ComfyUI inherits copyleft obligations. Calling its HTTP API from a separate process does not. If we ever ship something on top of it, that distinction is the one to get right, and `credit-attribution.md` requires naming it either way.

## The gating question, unresolved

**Where does it run?** The candidates are the always-on Windows desktop, the VPS, and the Pi. Diffusion wants a GPU with real VRAM; the VPS and Pi have neither, and the Air is ruled out above. **The desktop's GPU is unknown to this session** - that single fact decides whether this is a same-week build or a hardware conversation. UNVERIFIED, and it should be checked before any work is scheduled.

## What I could not verify

The exact HTTP endpoint paths for queueing a job. The README documents *that* a local API exists and that workflows export as JSON, but this session's web-search budget was exhausted (200/200) and the endpoint reference was not fetched. **Do not write client code against remembered endpoint names** - fetch `docs.comfy.org` first. This is the same trap as assuming a tool's flags: plausible and usually right, wrong exactly when it matters.

## Recommendation

Adopt it as an **asset lane**, gated on the GPU question, and prove it on the narrowest real task rather than a platform build: **the daily ZABAL standings card**, which is live this week and is three images a day for seven days. If that survives a week of daily use, the recording thumbnails and the collectibles follow. If it does not, we have lost one workflow file.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Report the Windows desktop's GPU and VRAM - decides everything below | @Zaal | Answer | 2026-08-12 |
| Fetch the ComfyUI API endpoint reference and record the real paths | @Zaal | Doc | 2026-08-14 |
| Build ONE workflow JSON for the ZABAL standings card, in the zabalgames repo | @Zaal | PR | 2026-08-17 |
| Decide after a week of daily use whether thumbnails and collectibles follow | @Zaal | Decision | 2026-08-24 |

## Sources

- `https://raw.githubusercontent.com/comfyanonymous/ComfyUI/master/README.md` - FULL, raw fetch 2026-08-10 (27,720 bytes). Every quoted capability above is verbatim from it.
- `gh api repos/comfyanonymous/ComfyUI` - FULL, 2026-08-10. Stars, forks, licence, last push.
- Prior ZAO docs 313, 324, 328, 329, 331 - the Apple Silicon performance figures and the music-production framing this doc extends.
- Doc 2258 - the turns x $1.01 measurement that makes the case.

**Credit:** ComfyUI by comfyanonymous and the Comfy Org community, GPL-3.0 (`credit-attribution.md`).
