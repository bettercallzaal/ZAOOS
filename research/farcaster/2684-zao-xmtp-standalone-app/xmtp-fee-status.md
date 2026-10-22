# XMTP messaging fees - status check (2026-10-18)

Question: does the ZAO XMTP app need a funded payer wallet to send messages today?

**Answer: UNKNOWN as of 2026-10-18.** XMTP's own sources say paid messaging begins at a mainnet cutover, but the newest of them was last edited on 2026-04-08 and none of them says the cutover has happened. Doc 074's March claim is neither confirmed nor refuted.

## What was read

| Source | Method | Last edited | What it says |
|---|---|---|---|
| `xmtp/docs-xmtp-org` `docs/pages/fund-agents-apps/get-started.md` | `gh api` contents, raw markdown | 2025-12-05 (last commit to that file) | "Mainnet of the decentralized XMTP Network is expected to launch in early 2026." "With Mainnet launch ... apps and agents will begin paying fees to send messages on Mainnet." Its milestone table marks Browser SDK mainnet compatibility, mainnet payer-wallet funding and "All message traffic routed through Mainnet" as not done (red). |
| `xmtp/docs-xmtp-org` `docs/pages/fund-agents-apps/update-sdk.md` | `gh api` contents, raw markdown | not checked | Minimum supported version with Gateway Service support: "Browser SDK v6.0.0". |
| `xmtp/docs-xmtp-org` repo | `gh api` commits | 2026-04-08 (latest commit, any file) | The docs repo has not changed since this date. |
| improve.xmtp.org topic 2039, "Decentralization Milestones" | Discourse JSON (`/t/.../2039.json`) | created 2025-12-19, edited 2026-01-22 | Mainnet launch is a hard cutover. After a 60-day migration clock "all XMTP apps need to be migrated to a mainnet compatible XMTP SDK and connected to a funded gateway." The launch stage lists "Nodes begin receiving USDC messaging fees". |
| improve.xmtp.org announcements category | Discourse JSON (`/c/announcements/l/latest.json`) | newest topic 2026-01-28 ("Privacy policy") | No announcement of a mainnet launch in the category listing. |
| docs.xmtp.org rendered pages (`/fund-agents-apps/fund-your-app`, `/chat-apps/intro/faq`) | `curl` + tag strip | - | FAILED: 16 bytes of text each (client-rendered). Read through the GitHub source instead. |

Not searched: XMTP's blog after January 2026, its X or Farcaster accounts, and the `xmtp/xmtpd` repo. Any of these could show a launch the sources above do not.

## What it means for `apps/zao-xmtp/`

- **If mainnet has launched:** sending needs a payer wallet funded with USDC (Payer Registry on Base plus gas on the XMTP App Chain), and the docs mark a Gateway Service as "required for chat apps only", which a browser app is. That is a spend decision and stays Zaal's.
- **SDK version:** the app pins `@xmtp/browser-sdk` 7.0.0, which is above the documented 6.0.0 minimum. Whether 7.0.0 is configured for mainnet without extra gateway setup is UNVERIFIED.
- **Cheapest way to settle it:** connect the deployed app to the production network and send one message between two Respect holders. That needs the domain and Supabase project, which are gated.

## Sources

- https://github.com/xmtp/docs-xmtp-org/blob/main/docs/pages/fund-agents-apps/get-started.md - FULL (raw markdown via `gh api`)
- https://github.com/xmtp/docs-xmtp-org/blob/main/docs/pages/fund-agents-apps/update-sdk.md - PARTIAL (grep of raw markdown via `gh api`)
- https://improve.xmtp.org/t/decentralization-milestones/2039 - FULL (Discourse JSON)
- https://improve.xmtp.org/c/announcements - PARTIAL (topic titles and dates only, Discourse JSON)
- https://docs.xmtp.org/fund-agents-apps/fund-your-app - FAILED (client-rendered)


## Update 2026-10-21: XMTP now documents a backend you run, and Cassie's claim against XMTP

Re-checked on 2026-10-21 (overnight lane run, QUICK) after the B and Z Build stream. There Zaal relayed Cassie (Quilibrium) on why her team's work beats XMTP for DMs: "XMTP is currently subsidized, but it's not free actually. So users would have to pay per message and that's just like not a long-term viable option" [0:17:16-0:17:37, mlx-whisper transcript of https://www.youtube.com/watch?v=uEIT4rvgsNo; Whisper wrote her name as "gas"].

**What changed since 2026-10-18:**

| Read | Result |
|---|---|
| `docs.xmtp.org/...` | 301 to `xmtp.org`, whose `llms.txt` now reads "Build secure messaging with XMTP and a backend you run" and points to `self-hosted-docs.xmtp.to` |
| The developer guide (`xmtp.org/llms-full.txt`, 657,506 bytes) | "Use **8.0.0-rc1** for Browser, Node, Android, iOS, and Agent clients. Use `ghcr.io/xmtp/backend:8.0.0-rc1` for the backend." "The published Browser 7 and Node 6 packages use an earlier backend API." "An older network SDK cannot use this backend." The backend "is one binary" and "All durable state lives in PostgreSQL". As words, "mainnet", "decentral" and "cost" appear 0 times in the guide. "MAINNET" appears once, inside an Ethereum RPC variable name (`XMTP_RPC_MAINNET`) |
| npm `@xmtp/browser-sdk` | `latest` 7.1.0. `prerelease` 8.0.0-rc4 (2026-10-20); rc2 2026-10-14, rc3 2026-10-19; nightlies daily |
| `xmtp/libxmtp` branch `self-hosted` | last commit 2026-10-21 23:36 UTC |
| improve.xmtp.org announcements | newest topic still 2026-01-28 ("Privacy policy"). No announcement of the self-hosted move or of a mainnet cutover |
| `xmtp/docs-xmtp-org` | last commit still 2026-04-08 |
| `xmtp/xmtpd` | last release v1.3.0 (2026-03-30), last push 2026-10-02 |
| Production endpoints | `grpc.production.xmtp.network` answers HTTP 415 to a plain request (a gRPC server that is up). `api.production.xmtp.network` answers 200 |

**What XMTP's own sources say on price, against Cassie's claim:**

- XMTP's blog, 2026-01-06, Shane Mac: "On XMTP Mainnet, every message is a transaction." "It costs about $5 per 100k messages." That is **$0.00005 a message**.
- The fee is paid by the **app** through a funded payer wallet, not by each user. That is the 2026-10-18 reading above, from the decentralization milestones post. So "users would have to pay per message" is wrong in detail: the app pays, and may pass the cost on.
- **Doc 074 is out by a factor of 20.** It says "~$0.001/message". XMTP's own figure is about $0.00005. Correcting 074 is a Next Action, not done here.
- "Currently subsidized": no XMTP source read here says the subsidy has ended, or when it will. Still **UNKNOWN**.

**Cassie's alternative.** The stream does not name the repo she sent. Quilibrium's messenger is Quorum: `QuilibriumNetwork/quorum-desktop` ("The world's first fully private and decentralized group messenger", AGPL-3.0, 35 stars), `quorum-mobile` (GPL-3.0, 48 stars, last push 2026-10-21) and `quorum-shared` (E2E encryption in `src/crypto/`, **no LICENSE file**, so all rights reserved). Licences were read from the LICENSE files. Nothing read here states what Quorum costs per message. "Free" is **UNVERIFIED**.

**What it means for the ZAO XMTP app** (`bettercallzaal/zao-xmtp`, MIT, pins `@xmtp/browser-sdk` 7.0.0):

1. **Stay on 7.x for now.** It is still `latest` and still talks to the production network. The 8.x line targets a self-run backend and is a release candidate.
2. **A self-run backend changes the cost question.** With a backend you run, the cost is your own PostgreSQL and hosting, not a per-message network fee. Whether 8.x can also talk to the production network was not found in the guide. **UNVERIFIED.**
3. **Do not cite Cassie's comparison as fact** until a Quorum cost source is read.

**Added sources (2026-10-21):**

- https://xmtp.org/llms.txt and https://xmtp.org/llms-full.txt - FULL (curl, raw text)
- https://blog.xmtp.org/xmtp-network-metrics-jan-6th-2026/ - FULL (WebFetch, quotes above)
- https://improve.xmtp.org/c/announcements/7/l/latest.json - FULL (Discourse JSON, topic list)
- npm registry `@xmtp/browser-sdk` - FULL (`npm view` dist-tags and times)
- GitHub API: `xmtp/libxmtp` branch `self-hosted`, `xmtp/docs-xmtp-org` commits, `xmtp/xmtpd` releases; `QuilibriumNetwork/quorum-desktop`, `quorum-mobile`, `quorum-shared` READMEs and LICENSE files; `bettercallzaal/zao-xmtp` LICENSE and package.json - FULL
- https://xmtp.org/fund-agents-apps/calculate-fees - FAILED (a "Moved" notice pointing to the backend page)
- B and Z Build transcript, window 0:16:40 to 0:19:30 - FULL

**Next Actions (2026-10-21):**

| Action | Owner | Type | By When |
|---|---|---|---|
| Correct doc 074's "~$0.001/message" to XMTP's "$5 per 100k messages" (2026-01-06), with the source. Shipped when the PR merges | bandzbuilds lane | PR | 2026-10-28 |
| Decide whether the ZAO XMTP app stays on 7.x with the production network or plans for an 8.x self-run backend. Shipped when the answer is in this file | Zaal | Decision | 2026-11-04 |
| If Quorum is a candidate for ZAO DMs, read its cost model and licence fit (AGPL desktop, unlicensed shared package) first. Shipped when a QUICK doc exists | bandzbuilds lane | Research | 2026-11-11 |

**What this means for The ZAO:** XMTP messages are cheap ($5 per 100,000 per XMTP), and the app pays, not each member. XMTP is moving toward a backend we could run ourselves, so the "pay per message" worry may not apply to us at all. Quorum's "free" is a claim nobody has sourced yet.
