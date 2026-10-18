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
