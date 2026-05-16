---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-16
related-docs: 657, 657a
tier: STANDARD
parent-doc: 657
---

# 657b — Context Engine

> **Goal:** Track Context Engine as the "Polis math + Web3 rails + AI question generation" alternative. Use as second-stage tool if Polis is too bare-bones for a given event.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use Context Engine for Maine Plural Event | OPTIONAL upgrade from Polis | Same low-friction passkey login + can auto-generate questions from a recorded session. Worth trialing for one event to compare against Polis. |
| Use Context Engine to gate a private ZAO discussion (paid mint or admin-mint group token) | YES, this is the unique angle | Built on Ethereum / Web3 rails. Group can be token-gated, time-limited mint, or password. Closer to The ZAO's gated Farcaster model than vanilla Polis. |

## What It Is

Built by **Charles Thompson** (San Francisco). Charlie joined the May 12 call from his apartment at 5am SF time to demo it personally. Not strictly a fork of Polis but **uses the same clustering math** (Polis is OSS, the math is reusable).

## What's Different From Polis

1. **One-step passkey login** — face ID / fingerprint / device biometric, not email. Lower friction than Polis (which is anonymous) actually because passkey means returning users skip even the agree button setup.
2. **AI question generation** — click the microphone button, talk through your event, app records the session, then "generate questions" produces seed statements automatically from the audio. (Transcription via OpenAI as of May 2026 — noted as a privacy caveat by Charlie; plan to support local models soon.)
3. **Multiple question types beyond agree/disagree/pass** — multi-choice questions, rating questions.
4. **Web3 rails under the hood** — groups are token-defined (mint-time-limited, admin-burnable, etc.). Users don't see crypto; the wallet/token is plumbing.
5. **AI-generated cluster summaries** — after voting, the AI writes a human-readable description of each cluster (similar to Agora Citizen, but as a result of the math, not the conversation itself).
6. **Political compass-style result views** — for events with enough data, can render the result space as a 2D map.

## Live Demo Behavior (from call)

Charlie walked through:
- Creating a group: name, description, image, reference info, token-mint limits, admin/owner burn rules.
- Sharing a link with a group password.
- Participants click link → passkey login → straight into voting.
- Real demo data shown was an "AI debate" group split between Accelerate / DEAC / Pause AI.
- Results: questions where there's consensus (left side of chart), questions where there's debate (right side). Click any question to see which cluster drives the divide.

## Plural Event 4 Specifically

Charlie said the link for this round of Plural Events would be at **`PE4`** group. He'd pre-seed it with statements so participants could start voting immediately. Each city's event can have its own sub-group or share PE4 — TBD by host.

## ZAO Integration Path

- **For The ZAO Farcaster gated community:** could token-gate a Context Engine group to ZAO membership token (similar gate as the rest of the app at `community.config.ts`). Charlie's group-password / token-mint model is natively compatible.
- **For ZAOstock Oct 3 post-event reflection:** generate a group for "Ellsworth Plural Event 2026" with admin-mint by Zaal, share password, capture community voice with AI-summarized clusters.

## Privacy Caveat

OpenAI does the transcription as of May 2026. Charlie indicated this could change to local models. For ZAO use: fine for public-facing community input, NOT fine for any conversation involving member PII or governance signal-collection that shouldn't leak to a third party.

## Cost

Free during pilot. Charlie is in early stages, vibe-coding new UIs. No documented pricing yet.

## Strengths

- Passkey UX is the lowest-friction login on any of the five tools.
- AI seed-statement generation removes the most awkward Polis bootstrap step.
- Web3 group definition fits ZAO's existing token-gating mental model.
- Active builder (Charlie) — high responsiveness to feedback in 2026.

## Limitations

- Newest of the five tools — least battle-tested at scale.
- OpenAI dependency (today).
- Smaller community than Polis or Agora.
- "Built on Ethereum rails" = small but real risk of fee / latency issues on certain L1 or L2 configurations; check which chain before committing.

## Sources

- [RadicalxChange tweet announcing PE4 Context Engine](https://x.com/RadxChange/status/1995554770770120726)
- [RadicalxChange](https://www.radicalxchange.org/)
- Charles Thompson at MORSE/UML (different "Charles Thompson" but worth disambiguating in future): [morseatuml.us/faculty/charles-thompson/](https://morseatuml.us/faculty/charles-thompson/) — NOT the Context Engine builder
- Meeting transcript (Fathom recording 670891723), Charlie's live demo segment from ~29:30 onwards

**Disambiguation:** "Charles Thompson, Context Engine builder, San Francisco" is distinct from the UMass Lowell faculty Charles Thompson. The SF builder has not surfaced in public search results separately from Context Engine + RxC tweets — request his direct contact when Zaal follows up via the Hubs Network Telegram.
