---
topic: farcaster
type: profile
status: research-complete
last-validated: 2026-10-07
superseded-by:
related-docs: "farcaster/2631-kazani-351-github-account, agents/2431-ali-tiknazoglu-github-watch-glue-first"
original-query: "https://github.com/0xterricola /zao-research"
tier: STANDARD
---

# 2632 - github.com/0xterricola: who it is, what it has built, and what touches The ZAO

> **Goal:** Zaal asked for research on this GitHub account and gave no purpose. This doc reports what is there as of 2026-10-07 and does not guess why he asked. It is the second of two accounts he sent the same day; the first is [doc 2631](../2631-kazani-351-github-account/).

## Summary

1. terricola is one builder working on hardware wallets, signing devices and self-custody, with some Farcaster and Optimism work behind it.
2. You already follow an account with this exact handle on X, and it follows you back (your own X export of 2026-09-06). The GitHub profile does not link to X, so "same person" is likely, not proven.
3. 24 public repos: 12 forks, 12 original. The original work has 8 stars in total, 7 of them on one signing-device project.
4. Three things touch your world: a Farcaster web client with outside wallets added (MIT), a fork and a star of the POIDH app, and stars on caveman and ponytail, two tools your estate already runs.
5. No link was found between this account and kazani-351: no shared organisation, no follow in either direction on GitHub.

## Who the account says it is

| Field | Value | Source |
|---|---|---|
| Name / login | terricola / `0xterricola` | `gh api users/0xterricola` |
| Bio | one character, a circle symbol, and nothing else | same |
| Location, company, site, X field | all empty | same |
| Account created | 2022-01-04 | same |
| Followers / following | 11 / 29 | same |
| Organisations | none public | `gh api users/0xterricola/orgs` |

The profile README says: "I like building things around systems, hardware, cryptography, and decentralized infrastructure." Its "Current work" list: "OpenPGP and hardware-backed identity/signing", "Keycard Shell integrations and QR signing protocols", "self-custodial wallets and wallet SDKs", "Logos ecosystem tooling, nodes, and observability".

It states its principles as "Censorship resistance", "Open source and free software", "Privacy", "Security", "Self-custody and user sovereignty", "influenced by the Ethereum Foundation's CROPS framework".

It also publishes account-wide policies in `0xterricola/.github`, including an AI disclosure: "I use AI-assisted development extensively for implementation, debugging, research, testing, documentation, and review support. AI output is treated as input that still needs verification rather than as an independent security review or audit."

### Other identities, checked in both directions

| Identity | GitHub points to it? | It points back? | Verdict |
|---|---|---|---|
| X `@0xterricola` | No. The X field is empty and no README read here links to X | Not checked: X was not fetched | Same handle string. LIKELY the same person, NOT proven |
| Farcaster | No link in any README read | A lookup of the usernames `terricola` and `0xterricola` returned no account (the same lookup found `kazani` an hour earlier, so it works) | UNKNOWN. The account builds Farcaster software, so a Farcaster account under another name is plausible |
| A personal site | None listed | - | None found |

No real name is published where I read, and none is guessed here.

## What it has built

24 public repos: 12 forks, 12 original (API, 2026-10-07).

**2026, hardware and self-custody (the current work)**

| Repo | What it is | Stars | Last push | Licence |
|---|---|---|---|---|
| `keycard-openpgp` | "Experimental trusted signing architecture: OpenPGP first, with Keycard Shell as the intended portable interface." A separate trusted device shows the human what is being authorised before a secure element signs | 7 | 2026-10-06 | MIT (LICENSE file read) |
| `logos-observer` | "Local-first, read-only sidecar for exposing sanitized Logos node and Basecamp Chat data to trusted clients with QR pairing, pinned TLS 1.3, scoped HMAC authentication, and replay protection." | 0 | 2026-10-07 | none stated |
| `field-wallet` | C++ wallet project with a long README (not read in full) | 0 | 2026-09-29 | none stated |
| `.github` | Security policy, security and privacy principles, AI-assisted development disclosure | 1 | 2026-10-06 | none stated |
| `keycard-shell` (fork of keycard-tech/keycard-shell, 82 stars) | "Modular, fully open hardware wallet". 0 commits ahead of upstream on the default branch | 0 | 2026-10-05 | MIT (API field) |
| `node-remote` (fork) | Watch and control a Logos node from a phone over Tor. 0 ahead of upstream | 0 | 2026-08-27 | unclear |

**Farcaster and POIDH**

| Repo | What it is | Stars | Last push | Licence |
|---|---|---|---|---|
| `farcaster-wallet-client` (fork of `farcasterxyz/client`, 111 stars) | "A fork of the Farcaster client snapshot that adds a non-custodial wallet experience to the web client." WalletConnect for EVM and Solana, EIP-6963 wallet discovery, send, same-chain swaps, wallet support for miniapps. Last commit 2026-09-06, "feat(web): add unified MetaMask connections (#12)" | 3 | 2026-09-06 | MIT (LICENSE file read, copyright 0xterricola) |
| `poidh-app` (fork of picsoritdidnthappen/poidh-app, 38 stars) | Forked 2026-09-12. 0 commits ahead, 302 behind on `prod`: a copy with no changes of its own | 0 | 2026-09-12 | MIT (API field) |
| `tipn-button-test` | A Farcaster Mini App from the Neynar quickstart template | 0 | 2026-06-12 | MIT (API field) |
| `dry-powder-warpcast-frame` | "Warpcast Frame that uses Zapper API to give user their dry powder amount" | 0 | 2025-02-13 | none stated |

**2025:** Optimism study repos (`op-stack-fault-proofs`, forks of `optimism`, `op-geth`, `specs`, `cannon`), `learning-go`, `terraform-playground`.

Recent public activity (30 events): pushes to `keycard-openpgp`, `logos-observer`, `keycard-shell` and the profile from 2026-09-30 to 2026-10-07. Stars in the same days on `JuliusBrussee/caveman`, `DietrichGebert/ponytail`, `vpavlin/logos-skills` and `davidrusu/tipscan`.

## What connects to The ZAO's world

| Area | Connection | Strength |
|---|---|---|
| X | `0xterricola` is row 103 of Zaal's X following export of 2026-09-06 with `follows_back = yes`, and is on his X keep-list with the reason "followed in the last 90 days" | Strong, IF the X account is this person |
| Farcaster client | A working fork of Farcaster's own client snapshot with outside wallets. ZAO's own Farcaster client is graduating to `bettercallzaal/zao-social`, which today holds only a LICENSE (measured for doc 2244's re-validation). ZAOOS doc 2431 is the one research doc that already cites `farcasterxyz/client` | Strong: the same upstream ZAO would build on |
| POIDH | Forked and starred the POIDH app. POIDH is a live ZAO program (the poidhz lane, round nine) | Interest shown; no code of their own in the fork |
| Agent tooling | Starred caveman and ponytail in the last two days. The estate runs caveman mode and its `code-restraint.md` rule is adapted from ponytail | Same tools, independently |
| AI disclosure | A published, account-wide statement of how AI is used and what it does not replace. ZAO has an AI policy draft in the vault (`notes/ai-policy-v1-draft-2026-09-16.md`) | A worked example of the same document |
| Base / Optimism | OP Stack study notes and forks from 2025 | Background, not current |
| Solana | Wallet support for Solana inside the Farcaster client fork | Present |
| Music | Nothing found | None |

## Does ZAO already mention the handle

| Where searched | How | Result |
|---|---|---|
| ZAOOS origin/main, whole tree | `git grep -l -i terricola` | 0 files. Control: a known handle returns 36 files under `research/` |
| zao-vault origin/main, whole tree | `git grep -l -i terricola` | 6 files: today's decision record, and five X exports and keep-lists under `projects/` (`x-following-head-2026-09-05.csv`, `x-following-head-2026-09-06.csv`, `x-keeplist.csv`, `x-keeplist.txt`, `x-recent-follows.txt`) |
| Agent memory directory | `grep -rli terricola` | 0 files |

So the vault knew the handle before today, as an X account Zaal follows and that follows him back. No note says who the person is or how they met.

Not searched: Zaal's X DMs, Farcaster follows and DMs, email, Telegram, and the Farcaster CRM rows in Supabase.

## Are the two accounts he sent today connected?

No evidence that they are.

| Check | Result |
|---|---|
| Shared GitHub organisation | Neither account has a public organisation |
| `0xterricola` follows `kazani-351` on GitHub | No (API 404) |
| `kazani-351` follows `0xterricola` on GitHub | No (API 404) |
| A shared repo, or one forking the other | None in either repo list |
| Starred repos in common | Not compared in full. `0xterricola`'s 27 stars include none of Kazani's repos |

What they share is a setting: both build around Farcaster and both star agent tooling. Whether they follow each other on Farcaster or X was not checked.

## Three things Zaal could do, ranked

| # | Action | Why | Reversible? |
|---|---|---|---|
| 1 | **Have a lane read `farcaster-wallet-client` next to `farcasterxyz/client` and report what it would take to start `zao-social` from one of them.** Both MIT | ZAO's Farcaster client has a repo and no code. Here is Farcaster's own client snapshot, and one person's fork that already added outside wallets, miniapp wallet support and swaps | Yes: a report only, nothing cloned into ZAO repos |
| 2 | **Have a lane compare the AI-assisted development disclosure with ZAO's AI policy draft.** | The draft has been in the vault since 2026-09-16. This is a short, plain example of the same thing, already published | Yes: a comparison note |
| 3 | **Tell the poidhz lane that this account forked and starred the POIDH app on 2026-09-12.** | One line of context for a live program. The fork has no changes of its own, so there is nothing to review | Yes: a note |

Not on the list on purpose: reaching out. He already follows the X account and it follows back; whether to say anything is his call and his words.

## UNKNOWN

- Why Zaal asked for this account.
- Whether the X account `@0xterricola` he follows is the same person as this GitHub account. Same handle; no link in either direction was verified.
- Whether this person has a Farcaster account, and under what name.
- A real name, location or employer. None is published where I read.
- How Zaal and this person came to follow each other.
- Whether `farcaster-wallet-client` builds and runs. Its README and last commit were read; the code was not run.
- What `field-wallet`, `flymog` and `superinu` are beyond their names (one long README not read in full, two with no README).

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Say what this account is for, or pick one of the three options | Zaal | Decision | when he wants |
| If option 1: one lane reads both client repos and reports, crediting Farcaster and 0xterricola | a lane the seat names | Report | after his word |

## Sources

All fetched 2026-10-07. Quotes come from raw text.

1. `gh api users/0xterricola` (profile JSON) [FULL]
2. `gh api users/0xterricola/repos?per_page=100&sort=pushed` (24 repos) [FULL]
3. `gh api users/0xterricola/orgs`, `/events/public` (30 events), `/starred` (27 repos) [FULL]
4. READMEs of `0xterricola/0xterricola`, `.github` and `farcaster-wallet-client`, raw through the contents API [FULL]; `keycard-openpgp` and `tipn-button-test` [PARTIAL: first 14 to 16 lines]; `logos-observer` and `field-wallet` fetched, descriptions used, bodies not read [PARTIAL]
5. `.github/AI-ASSISTED-DEVELOPMENT.md`, raw [PARTIAL: first 30 lines]
6. LICENSE files of `farcaster-wallet-client` and `keycard-openpgp`, raw: both MIT [FULL]. Other licences are the API's classifier field and are marked so
7. Fork parents and divergence: `gh api repos/<fork>` and the compare API for `keycard-shell`, `node-remote`, `poidh-app` [FULL]. For `farcaster-wallet-client` the compare API reports "No common ancestor", so its distance from upstream is not measured
8. `gh api repos/farcasterxyz/client`: 111 stars, "Snapshot of the Farcaster client monorepo (mobile + web), without the Farcaster Wallet implementation" [FULL]
9. `gh api users/<a>/following/<b>` in both directions between the two accounts: 404 both ways [FULL]
10. Farcaster username lookup through the haatz API for `terricola` and `0xterricola`: no account returned [FULL as a negative; the same endpoint returned `kazani` for doc 2631]
11. zao-vault origin/main `projects/x-following-head-2026-09-06.csv` and `projects/x-keeplist.csv`, read with `git show` [FULL]

Not fetched: the X profile, any cast, the code of any repo, and the full text of the security and privacy policy files.

Credit: everything described here is the work of 0xterricola on GitHub. `farcaster-wallet-client` builds on Farcaster's `farcasterxyz/client`; `keycard-shell` is keycard-tech's; the POIDH app is picsoritdidnthappen's.
