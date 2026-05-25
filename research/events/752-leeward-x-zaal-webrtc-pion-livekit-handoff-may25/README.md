---
topic: events
type: decision
status: research-complete
last-validated: 2026-05-25
related-docs: 735, 741, 741a, 741b, 741c, 741d, 695, 722f
original-query: "/meeting /Users/zaalpanthaki/Movies/meetings/Leeward x zaal - 2026_05_25 14_26 EDT - Recording.mp4"
tier: STANDARD
---

# 752 - Leeward (Lee Edward Bound) x Zaal: WebRTC + Pion + LiveKit handoff (May 25 2026)

> **Goal:** Capture the second Leeward x Zaal call. Leeward is a Pion-era OG (Stream Huddle, 2020-21, knew Sean DuBois personally from the Pion Slack). He confirmed doc 741's LiveKit pick from primary-source experience, walked Zaal through the SFU vs MPU tradeoff, and re-affirmed the nurdism/neko composite-stream pattern that doc 735 already specs. Sets up the post-2026-06-02 build window.

## Meeting

| Field | Value |
|---|---|
| Date | 2026-05-25 |
| Time | 14:26 EDT |
| Duration | ~22 min |
| Platform | Video call (recorded mp4) |
| Attendees | Zaal, Leeward (Lee Edward Bound) |
| Recording | `/Users/zaalpanthaki/Movies/meetings/Leeward x zaal - 2026_05_25 14_26 EDT - Recording.mp4` |
| Transcript | [transcript.md](transcript.md) |

## Why this call matters

This is the **second** Leeward call (first = doc 735, 2026-05-23). Doc 735 captured the composite-streaming spec at the level of "what to build" (HTML chatroom + nurdism/neko + RTMP forward). This call drops a level deeper: **what library + protocol + tradeoffs you actually use**, and gives a credibility anchor for the LiveKit pick in [doc 741](../../infrastructure/741-pion-livekit-webrtc-stack/) that just shipped the same day.

The hub-doc-741 cluster (shipped via PR #688 + #693) was synthesized from public sources - HN, Medium postmortems, GitHub READMEs, vendor comparisons. Leeward's call is the **primary-source corroboration**: someone who was in the Pion Slack while Sean DuBois was building it, who shipped Pion + WebRTC code in production in 2020-2021, who independently lands on the same recommendation a desk-research pass landed on. That alignment is the difference between "I think LiveKit" and "the people who lived through Pion's birth think LiveKit."

## Key decisions

| # | Decision | Owner | Confidence |
|---|----------|-------|------------|
| 1 | LiveKit is the path for ZAO's composite-stream + multistream build. SFU only (not MPU). Self-host or LiveKit Cloud both viable. | Both | high |
| 2 | Avoid RTMP for video where possible. Proprietary codecs, undocumented handshake. RTMP only at the edge to push out to Twitch / Kick / X. | Zaal | high |
| 3 | MVP composite-stream pattern stays as doc 735 specs: LiveKit chatroom + nurdism/neko (headless Chrome in Docker) as the recording / RTMP-forward "third participant" that composites the feed and pushes to Twitch. | Both | high |
| 4 | Collab window holds: Zaal kicks off composite-streaming build week-of 2026-06-02 (post-Leeward PTO from Croatia). | Both | high |

## Actions

| # | Title | Owner | Due | Category | Confidence |
|---|-------|-------|-----|----------|------------|
| 1 | Find + send Zaal the other open-source streaming project Leeward saw a while back (still recalling) | Leeward | open | Other | medium |
| 2 | DM Leeward links of any ZAO posts that Leeward should amplify - and amplify back | Zaal | open | Social | high |
| 3 | Look at Leeward's `noir` repo (Pion-based chatroom + Redis-stream off-gate) as architectural reference only. Leeward's verbatim: "don't use it, it's really old, it's really bad." Reference pattern, not code. | Zaal | 2026-06-02 | Site / Tech | high |
| 4 | Install + test `nurdism/neko` (headless Chrome in Docker, RTMP forward) - already named in doc 735, this call confirms relevance + Leeward called it "nico" in the transcript (mistranscription) | Zaal | 2026-06-02 | Site / Tech | high |
| 5 | Reach out to Leeward post-2026-06-02 when starting composite-stream build - he offered direct help | Zaal | 2026-06-02 | Ops | high |
| 6 | Watch for Leeward's upcoming Cabal launch (multiplayer agentic chat-harness framework) - potential cross-pollination with ZOE / Hermes voice work (docs 741b / 741d) | Zaal | open | Other | high |
| 7 | Prototype: Discord bot for 24/7 ZAO musician radio - pull a specific artist's playlist on demand. Leeward: "yeah, you pop that on a docker, pop in whatever playlist you need." | Zaal | open | WaveWarZ Zambia | medium |

## Quotes

- **Leeward:** "There's a back-end golang library that is extremely good - it's called Pion. WebRTC is the video tech that you want to be working with - it's what powers restream and everything... we're on WebRTC right now."
- **Leeward:** "What we can use today instead is LiveKit. Those guys were in the Slack room with me talking with the developer of Pion - figuring out how to build theirs while I was figuring out how to build mine."
- **Leeward:** "You really want to lean into an SFU and not an MPU because the SFU is just a stream-forwarding unit. You really want to avoid the computation of transcoding."
- **Leeward:** "The nico [nurdism/neko] project from a guy called Nerdism - one lone crazy guy in Japan. He built this - it's for watching Netflix with your friends - but what it does is it's a Chrome browser in a Docker container with recording and RTMP forwarding."
- **Zaal:** "My goal ultimately is to bring all these things together for the average builder to be able to pick and choose what things they need... give them the full customizability and full stack as much as we can and offer for free."
- **Leeward:** "I'm launching - it's called Cabal - a multiplayer agentic framework. It's basically a chat harness."
- **Leeward:** "I've been working at W2 for longer than I ever have in my life - and like two weeks before I left, they shut the company down, just overnight."

## Cross-doc synthesis

This call closes a loop:

- [Doc 735](../735-leewardbound-composite-streaming/) gave the COMPOSITE-STREAM pattern (HTML chatroom + nurdism/neko + RTMP forward) and the post-vacation collab window. This call confirms it.
- [Doc 741](../../infrastructure/741-pion-livekit-webrtc-stack/) gave the WEBRTC-STACK pick from desk research (LiveKit-on-Pion). This call gives the primary-source endorsement.
- [Doc 741b](../../infrastructure/741b-livekit-agents-production/) gave the LiveKit Agents production playbook for ZOE voice. Leeward's Cabal launch (action 6) is the cross-pollination angle - watch for it.
- [Doc 741d](../../infrastructure/741d-zoe-voice-agent-blueprint/) gave the ZOE voice blueprint. Independent of this call, but Cabal could inform v2.

## Web3 streaming platform sidebar (Zaal's reviewed)

Zaal mentioned trying these custom-RTMP web3 streaming platforms - all give a stream key URL + key, none support pulling chat back via API:

- Zora
- Retake
- Dead Nacho (Zaal: "they just went blank out of nowhere")
- Pine Tree

This narrows the search: any future ZAO multistream output target needs either OAuth + chat-pull API (Restream pattern) or a custom relay layer.

## Memory updates

Three writes follow this doc:

1. **`project_leewardbound`** - CREATE (no existing memory; doc 735 exists but no memory line). Lee Edward Bound = Leeward = Lee. Pion-era OG, built `noir` 2020-21, ex-W2 (shut down overnight 2 weeks before his Croatia PTO), currently launching Cabal.
2. **`project_cabal_leeward`** - CREATE. Cabal = Leeward's new multiplayer agentic chat-harness framework. Cross-pollination candidate for ZOE / Hermes voice work.
3. **`project_741_livekit_endorsed`** - CREATE. Doc 741's LiveKit pick (PR #688 + #693) has primary-source endorsement from Leeward (Pion Slack OG). De-risks the pick.

## Also see

- [Doc 735](../735-leewardbound-composite-streaming/) - first Leeward call, composite-stream spec
- [Doc 741](../../infrastructure/741-pion-livekit-webrtc-stack/) - hub Pion + LiveKit research
- [Doc 741a](../../infrastructure/741a-pion-ecosystem-internals/) - Pion ecosystem deep dive (Sean DuBois context Leeward referenced)
- [Doc 741b](../../infrastructure/741b-livekit-agents-production/) - LiveKit Agents production playbook
- [Doc 741d](../../infrastructure/741d-zoe-voice-agent-blueprint/) - ZOE voice-agent blueprint (Cabal cross-pollination candidate)
- [Doc 695](../../) - ZAO + Juke ecosystem map (Juke spaces are part of the multistream goal Zaal described)
- [Doc 722f](../../dev-workflows/722-zao-claude-code-3-month-synthesis/722f-people-network/) - ZAO people network (Onaji referenced in this call already lives here)
