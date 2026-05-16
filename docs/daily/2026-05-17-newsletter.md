# ZAO Daily — May 17, 2026

---

Saturday was a research day, and the lab kept moving.

Two deep docs landed: a full Suno v5.5 production guide built around the UVR Taco Bell sponsorship pitch, and a ground-up design for the imanagent — Iman's first Telegram bot on his own VPS. The Suno guide is the kind of thing I wish I had six months ago: exact field-by-field protocol, the three-box mental model (Style / Lyrics / Exclude — one concept each, never cross them), default settings that actually hold up across sessions. The UVR Taco Bell song is built and ready. The pitch package just needs to be assembled.

The imanagent design is bigger than it looks. Iman owns it operationally — his box, his bot, his deploy. The universal action tracker spans every ZAO-adjacent brand: COC Concertz, WaveWarZ, Magnetiq, ZAOstock, BCZ Strategies, ZAO Devz, cowork. One place, one audit log, GitHub Contents API as the backend for v1 (same pattern the web app uses — swaps to Supabase in Phase 2 without changing bot logic). This week we also shipped SIDEQUESTZ, the zao-transcribe script, a ZOE forward-nudge system, conversation archive, and a Farcaster vibe-coding challenge design. The week was a research sprint, and a lot of those docs will unblock real builds next week.

---

### MINDFUL MOMENT

The Suno guide has a line I keep coming back to: "One concept per field — never cross them." The most common failure is putting bracket tags in Style or genre labels in Lyrics — inputs that look like they should work, do nothing, or actively blur the output. The imanagent design has the same principle underneath it: v1 is slash commands only, no Claude CLI. Iman learns the bot pipeline without the complexity of an LLM subprocess. You don't teach by giving someone the full system. You give them the three boxes, clearly labeled, and let them fill them in order.

This week's research sprint is the same move. Six DEEP-tier docs in seven days isn't documentation — it's clearing the runway. Suno is now a repeatable production tool, not a black box. The cowork tracker has a spec Iman can actually build from. The agent canon (docs 644, 645) locked the five surfaces so nothing proliferates without a doc + approval. The pattern: make each domain one concept per field, clearly labeled, before you extend it.

Tomorrow: build mode.

---

*ZAO Daily is the build-in-public log of The ZAO — 188 members on Base, making things together.*
