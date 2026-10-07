---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2543, 2545"
original-query: "https://x.com/av1dlive/status/2102831499661934836 /zao-research this too and Jev as a whole"
tier: STANDARD
---

# 2546 - TypeSafe's Jev, and the tweet its own documentation refutes

> **Goal:** Decide whether Jev belongs in the ZAO stack, and settle what the
> circulating "make Opus 5.5 5x faster" prompt actually does.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Run the prompt from the tweet | **NO** | It instructs an agent to integrate a nine-day-old vendor into a live harness, autonomously, using existing credentials. That is a decision, not a prompt. |
| Believe the tweet's premise | **NO. The vendor's own docs refute it.** | TypeSafe publishes a page saying Jev "is not a drop-in replacement for the LLM behind Claude Code". It cannot make Opus 5.5 faster because it does not do what Opus does. |
| Wire Jev into anything ZAO runs today | **NO** | Nine days old, early access, hosted-only, data leaves the estate, and the company itself will not claim its pricing is sustainable. |
| Keep Jev as a candidate for one specific job | **YES** | Structured yes/no classification is the exact shape it is built for, and at $0.042/MTok input with free output it is **2.4x cheaper than the cheapest model in our own routing table**. |

## The tweet, and what the prompt actually says

The post (@av1dlive, 2026-09-23, 219 likes, 20 replies, 28,257 views) reads:

> opus 5.5 feels f\*\*king slow
>
> send this prompt to make it run 5x faster....

The attached image is a terminal screenshot of a `/goal` prompt. Its opening line:

> Make this harness measurably faster by integrating Jev at suitable decision
> points. Carry the work through discovery, implementation, verification, and
> benchmarking.

It then names seven places to replace a model turn with a Jev call - chunk
selection before the model reads, compaction retention, tool selection, ambiguous
tool-call properties, recovery actions, task routing - and instructs:

> Read the current official TypeSafe documentation at https://docs.typesafe.ai
> and follow its documented API and SDK contracts. Use direct TypeSafe access with
> existing approved credentials. Never use OpenRouter or expose secrets.

and

> Work autonomously through reversible local changes.

**So Opus 5.5 is not made faster. Work is moved off it onto a different vendor's
model.** That may be a sound architecture - it is close to the routing logic in
our own model table - but the headline describes a performance tweak and the body
is a vendor integration.

## The refutation is published by TypeSafe itself

`docs.typesafe.ai/introduction/coding-agents` exists, and it opens by addressing
exactly the person the tweet creates:

> If you found TypeSafe while looking for a model to plug into your coding agent,
> start here. **Jev is not a drop-in replacement for the LLM behind Claude Code,
> Cursor, opencode, Copilot, Muse Spark, Grok Bot, or similar tools.** Instead,
> you can use your coding agent as usual to write code that uses Jev to make
> decisions.

> Jev is not a chat or code-completion LLM. Jev is a System One model. It does not
> generate text, write code, or hold a conversation.

Fetched with `curl` and an HTML strip, HTTP 200, 288,799 bytes raw, 4,101 chars of
text. The phrase sits at character 871.

**A vendor does not write that page unless enough people arrive with that
misconception to be worth heading off.** The tweet manufactures the exact
misunderstanding the documentation was written to prevent.

## What Jev actually is

From `docs.typesafe.ai/introduction`, quoted:

> Jev is TypeSafe's flagship model and the first System One model. Send state and
> typed questions; get structured answers your code can use directly.

From `docs.typesafe.ai/concepts/system-one`:

> System One models are a class of AI models built to make fast, structured
> decisions that software can use directly. A System One model evaluates a state
> and returns typed answers and probabilities.

You send a state (a string, JSON object or array) plus typed questions - Choice,
Score, or Noul - and get typed values with probability distributions and a
confidence score. No text generation, no parsing. Trained with a method they call
Reinforcement Learning for Calibrated Decisions.

## The numbers

| | Figure | Source |
|---|---|---|
| Model | `jev-1.13.0` | docs/models |
| Input price | **$42 per billion tokens, or $0.042 / MTok** | docs/models, restated on the homepage |
| Output price | **Free.** "Output tokens are free" | docs/models |
| Rate limits | 250,000 tokens/sec, 1,200 requests/min | docs/models |
| Context | 64k per request; 32k for `state` plus the longest question | docs/models |
| Latency | "70ms-500ms" end to end | launch blog, 2026-09-15 |
| Launched | 2026-09-15, "after two years in stealth", early access | launch blog |

**Against our own routing table** (`agents/2543` sibling work, prices verified
2026-09-23 from vendor docs):

    Jev                  $0.042 / MTok input, output free
    GPT-6 Luna           $0.10  / MTok input   -> Jev is 2.4x cheaper
    Gemini 3.1 Flash-Lite $0.25 / MTok input   -> Jev is 6.0x cheaper

    A 2,500-token classification: Jev $0.000105, GPT-6 Luna $0.000260

That is a real difference on the one workload where it applies.

**Its marketing multipliers are not that comparison and should not be quoted as
if they were.** The homepage claims "193.6x Faster, 444.6x Cheaper" and the launch
post claims "40x-200x faster". Those compare a structured-decision call against a
frontier LLM doing the same job - a job the frontier model is wildly overqualified
for. The honest number for a decision ZAO would actually make is the 2.4x above.

Note also that two TypeSafe pages disagree with each other on the same cookbook:
`docs/primitives` says batching 13 questions is "11.5x cheaper and 9.6x faster",
while the `llms.txt` summary says "12.2x cheaper and 10.0x faster". Small, but it
is their own documentation contradicting itself on a headline multiplier.

## What would make this a bad idea for ZAO today

1. **It is nine days old.** Launched 2026-09-15, early access, waitlist-gated.
2. **Hosted only.** No self-hosting, no open weights, no on-prem path in any doc
   reached. Every route goes through `api.typesafe.ai/v1/systemone`.
3. **Your data goes to their servers.** The `state` you send is whatever you put
   in it - a support message, tool output, code. The legal page offers "zero data
   retention (ZDR) for enterprise customers", **which implies data IS retained by
   default for everyone else**, and no retention period is stated. They do say Jev
   is not trained on customer requests.
4. **The company will not claim its own pricing is sustainable.** From the launch
   post, verbatim: *"We can't prove it isn't subsidized; we'll need the long-term
   to prove the sustainability of our pricing."* Building a cost model on
   $0.042/MTok means building on a number its seller declines to stand behind.
5. **Funding is undisclosed.** "Backed by top-tier investors", no round, no
   amount, no names.

The team is not the weak point: Diogo Almeida (CEO) is described as having
co-invented RLHF and InstructGPT, previously Google Brain; Sasha Sheng (COO)
ex-Meta/FAIR; Erik Gafni (CTO) a repeat founder. San Francisco, in-person.

## Where it would actually fit

**Workload 3 of the estate routing table: quick yes/no classification.** The gates
this vault already runs - does this inbound message carry a third-party email
address, is this branch name safe, does this item need Zaal - are precisely
"evaluate a state, return a typed answer with a confidence score".

We currently do those with regexes, which is free and auditable, or would do them
with GPT-6 Luna at $0.00026 a query. Jev is the first thing measured that is
built for the shape rather than adapted to it.

**But the regexes are not the bottleneck and never were.** Nothing in this estate
is waiting on classification cost. Adopting Jev today would trade an auditable
local check for a hosted call to a nine-day-old vendor, to save a fraction of a
cent on something that is not slow.

## What was NOT established

- **Whether TypeSafe has raised outside funding, and how much.** This is the
  subagent's own nominated gap and it is the right one: it bears directly on
  whether $42/Btok survives contact with a real cost base.
- **Whether there is a free tier.** No free-credit language anywhere reachable.
  `typesafe.ai/pricing` returns **HTTP 404**; `console.typesafe.ai/pricing` returns
  200 but is a client-rendered login wall with no pricing in the static HTML.
- **Default data retention period** for non-enterprise accounts. ZDR is named as
  an enterprise feature; what happens otherwise is not stated.
- **Anything about quality.** Nothing was called. No accuracy claim here has been
  tested, and the calibration claim is the whole product.
- **Community reception.** No Reddit, HN or GitHub Discussions source consulted,
  so **Hard Requirement 7 is not met**. The product is nine days old; recorded as a
  gap rather than padded.

## Also See

- [agents/2543-orca-antigravity-bridge](../2543-orca-antigravity-bridge/) - the model routing table these prices are compared against
- [agents/2545-pi-desktop-agent-workspace](../2545-pi-desktop-agent-workspace/) - same week, same question shape: a new agent tool assessed against what ZAO already runs

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Do NOT run the tweet's prompt against any ZAO harness (recorded as a decision so nobody re-litigates it from the tweet alone) | @Zaal | Decision | 2026-09-24 |
| Re-check whether TypeSafe has published funding or a pricing page - both were absent today and both change the verdict | @Zaal | Measurement | 2026-10-24 |
| If Jev is ever trialled, do it on ONE vault gate with the regex kept live in parallel, and compare both for a week before switching | @Zaal | Build | 2026-11-15 |

## Sources

- [x.com/av1dlive/status/2102831499661934836](https://x.com/av1dlive/status/2102831499661934836) - [FULL, method: `~/bin/zao-fetch-x.sh`, tier 0 fxtwitter; text, counts and media URL retrieved]
- The prompt image, `pbs.twimg.com/media/HS7CE8haAAASJlw.jpg` - [FULL, method: `curl` to disk, 357,344 bytes, 1060x1484, read visually. Every quote from the prompt is transcribed from that image.]
- [docs.typesafe.ai/introduction/coding-agents](https://docs.typesafe.ai/introduction/coding-agents) - [FULL, method: `curl` + Python HTML strip, HTTP 200, 288,799 bytes raw, 4,101 chars text. **Independently re-fetched by this lane** after the subagent reported it.]
- [docs.typesafe.ai/introduction](https://docs.typesafe.ai/introduction) - [FULL, method: `curl` + HTML strip, HTTP 200]
- `docs.typesafe.ai/concepts/system-one`, `/models`, `/primitives`, `/api`, `/sdk`, `/agent-skill`, `/legal` - [FULL, method: subagent, `curl` + HTML strip via the `llms.txt` page index. **Not independently re-fetched by this lane** except where noted.]
- [typesafe.ai](https://typesafe.ai/), `/team`, `/manifesto`, `/blog/introducing-system-one-models-and-jev` - [FULL, method: subagent, `curl` + HTML strip]
- `typesafe.ai/pricing` - [**FAILED**, HTTP 404. Tried `console.typesafe.ai/pricing`: HTTP 200 but a client-rendered login wall with no pricing in static HTML. Not escalated to Playwright because it is behind auth and no ZAO account exists.]
- `typesafe.ai/about`, `typesafe.ai/company` - [FAILED, HTTP 404 both. Substituted `/team` and `/manifesto`.]
