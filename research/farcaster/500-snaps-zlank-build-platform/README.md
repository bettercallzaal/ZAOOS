---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-04-24
related-docs: 487, 491, 492, 497, 498
tier: STANDARD
---

# 500 - Farcaster Snaps + Zlank Pivot to Build-a-Snap Platform

> **Goal:** Map Snap protocol state, identify the no-code-builder gap, and scope Zlank v1 as "super easy build-a-Snap platform" with agents added in v1.5.

## TL;DR

Snaps = Farcaster's new lightweight server-driven UI primitive. JSON-based, sits between Frames v1 (image+buttons, slow) and Mini Apps v2 (full web app, complex). Server returns JSON pages, Farcaster client renders 16 standard UI components in feed. SDK mature at `@farcaster/snap` v1.15.1 + `@farcaster/snap-hono` v1.4.8. Zaal already has 2 working Snap projects locally (`duodo-snap`, `nouns-snap`), Hono+Vercel stack.

The gap: **no no-code Snap builder exists** as of Apr 2026. nocodeframes.com targets Frames v1 only. Snap builders must know TypeScript + Hono + JFS verification + Vercel deploy. Zlank v1 = lower that bar to drag-drop + templates. v1.5 = add autonomous agents on top.

## Key Decisions

| Decision | Answer |
|---|---|
| Pivot Zlank v1 from "agent SDK" to "build-a-Snap platform"? | YES. Lower barrier, concrete deliverable, ZAO use cases fit, working reference impls already exist. |
| Snap-only v1, or include Mini Apps too? | Snap-only v1. Mini Apps v2 upgrade path. |
| Code-first or no-code | BOTH. CLI + templates for devs (zlank create my-snap --template poll). YAML + drag-drop for non-coders. |
| Hosted runtime or Vercel-only | Vercel-default v1, hosted runtime v1.5 (BCZ Strategies managed service). |
| Agent integration timing | v1.5 - autonomous Snaps that POST themselves on cron, react to onchain events. NOT v1. |
| ZAO Supabase access built-in? | YES - first-party adapter so ZAO snaps don't write boilerplate for member/token/cipher reads. |
| Reference repos | duodo-snap + nouns-snap as the two starter templates Zlank ships. |

## What Snaps Are

Server-driven UI rendered by the Farcaster client in feed. Stateless POST per interaction, JSON Snap Page response. 16 standard UI components (Text, Heading, Image, Video, List, Table, Box, Spacer, Divider, Input, Slider, Select, Checkbox, RadioButton, DatePicker, plus Buttons). Themed by Farcaster client (no custom hex), responds in <5s or client errors.

| Aspect | Frames v1 | Snaps | Mini Apps v2 |
|---|---|---|---|
| Render | Image + meta tags | JSON server response, client renders | Full web browser tab |
| State | Stateless image url | Stateless POST per interaction | Persistent React app |
| Server | Returns image + button defs | Returns JSON page + components | Static or dynamic web app |
| UX | In-feed image card | In-feed compact preview, expand on tap | Opens full-screen tab |
| Speed | Slow (image gen) | Fast (JSON) | Slowest (full app load) |
| Auth | FID query param + sig | JFS verified server-side | Quick Auth JWT |
| TS SDK | frames.js / Frog | @farcaster/snap, @farcaster/snap-hono | @farcaster/miniapp-sdk |
| Tx flow | Button action=tx returns calldata | Same | Wagmi + browser wallet |

## SDK Surface

| Package | Purpose | Version |
|---|---|---|
| `@farcaster/snap` | Schemas, JFS verification, types, 16 UI components | v1.15.1 |
| `@farcaster/snap-hono` | Hono middleware (SnapHandler, verifyFrame) | v1.4.8 |
| `@farcaster/snap-emulator` | Local testing without real Hub | latest |

Pattern Zaal uses today (duodo + nouns):
```typescript
import { SnapHandler } from '@farcaster/snap-hono'
import { Hono } from 'hono'
const app = new Hono()
app.post('/snap', SnapHandler(async (req) => {
  const { fid, buttonIndex, inputText } = req.frameData
  return { pages: [{ id: 'p1', buttons: [...] }], route: 'p1' }
}))
app.get('/.well-known/farcaster.json', (c) => c.json({ accountAssociation, frame }))
```

JFS verification skipped in dev via `SKIP_JFS_VERIFICATION=true`. Required in prod (verify against Farcaster Hub).

## Builder DX Gap (Where Zlank Wins)

From Linda Xie's Jan 2026 builder feedback survey + GitHub issue scan:

1. **No no-code builder.** nocodeframes.com is Frames v1 only. Zero drag-drop Snap tools.
2. **Template scarcity.** Builders bootstrap from 1-2 GitHub examples. No `snap create --template poll` CLI.
3. **State management is DIY.** Stateless POST means external DB (Supabase/Redis) for any multi-step flow.
4. **JFS testing friction.** SKIP_JFS_VERIFICATION works locally but real signing only kicks in on staging. No emulator UI for non-coders.
5. **Manifest signing manual.** Account association requires EIP-712 sign + manifest hosting + signature paste. Easy to mess up.
6. **Deploy ergonomics.** Each snap = independent Hono+Vercel project. No managed Snap hosting (unlike warpcast.com/miniapps for Mini Apps).
7. **Discovery zero.** No central Snap directory. Share is by cast-paste only.

## Zlank v1 - Build-a-Snap Platform MVP

### Surface 1 - CLI (devs)
```
zlank create my-snap --template [poll|game|mint|info|voting|tipjar]
zlank dev    # local emulator + hot reload + JFS bypass
zlank deploy # build + sign manifest + push Vercel (or hosted runtime in v1.5)
```

### Surface 2 - Web builder (non-coders, zlank.online)
- Pick template, edit fields in form UI
- Live preview (Snap rendered in mock Farcaster feed)
- Wire actions to ZAO data (Supabase queries, member/token reads) without code
- Click Deploy, snap goes live with auto-signed manifest
- Share button copies cast-ready URL

### Surface 3 - Component library (Zlank-flavored, ZAO-native)
```typescript
import { PollSnap, ArtistInfoSnap, TokenClaimSnap, GovernanceVoteSnap, CipherPreviewSnap } from '@zlank/snaps'

PollSnap.create({ question: 'Vote next ZAO single', options: ['Alice', 'Bob'], onSubmit: handler })
ArtistInfoSnap.create({ fid: 19640, showZabalHolders: true, showLatestCipher: true })
TokenClaimSnap.create({ token: 'ZABAL', amount: 100, eligibility: 'fractal-attendee' })
```

### Surface 4 - Snap Gallery (zlank.online/gallery)
- Public directory of Zlank-built snaps
- Filter by category (music / community / governance / coin / game)
- One-click fork + customize for own brand
- Solves the discovery zero problem

### Surface 5 - Analytics
- Per-snap DAU, button click rates, error rates, top dropoff page
- Snap dashboard at zlank.online/builder/[id]

## Zlank v1.5 - Add Agents

Once v1 ships and ZAO whitelist users are running snaps:

- **Cron Snaps** - snap server runs on cron, posts itself to feed daily/weekly (e.g. weekly leaderboard)
- **Event-driven Snaps** - snap reacts to onchain events (token mint, swap, governance proposal) and broadcasts a snap into feed
- **Agent-authored Snaps** - LLM agent decides when to drop a Snap. "Agent for ZAO music brand watches new releases, autoposts ArtistInfoSnap when DistroKid confirms publication."
- **Multi-step agent flows** - agent triggers a snap with a question, collects votes, then fires the on-chain action (distribute, mint, swap)

This is where the original Zlank vision (Clanker + Empire Builder + Farcaster graph) folds back in: agents call Zlank SDK to launch coins / run distributions / cast updates, and they ship snaps as the user-facing UI for those actions.

## Zlank v2 - Mini Apps + Multi-Chain + Frames Creation + XMTP DMs

Per doc 498 + v2 wishlist research (parked):
- Mini Apps as upgrade path for Snaps that outgrow the lightweight UI
- Multi-chain (Base + Solana + Arbitrum)
- XMTP DMs (non-custodial first)
- Governance proposals (Snapshot off-chain v1, Tally on-chain v2)

## Reference Implementations

Zaal's existing local Snap projects (already running, both Hono + Vercel + @farcaster/snap):

| Project | Path | Stack | Use case |
|---|---|---|---|
| duodo-snap | /Users/zaalpanthaki/Documents/ZAO OS V1/duodo-snap | Hono + @farcaster/snap-hono + @noble/curves | TBD (read README) |
| nouns-snap | /Users/zaalpanthaki/Documents/ZAO OS V1/nouns-snap | Same | Nouns DAO related |

These become Zlank's first 2 reference templates. Audit them, abstract common patterns, ship as `zlank create --template duodo` and `--template nouns`.

## 10 Shipped Snap Use Cases (Today, for Inspiration)

| Snap | What | Built by |
|---|---|---|
| FarPolls | In-feed voting + tally | Farcaster core |
| Flappycaster | Flappy Bird game | Community |
| Farworld | Onchain monster trading | Community |
| Zora Mint | One-click NFT mint | Zora |
| Ballot | Market-based outcome polls | Ballot team |
| Swaye | Yes/No outcome betting | Community |
| FarHero | 3D trading card game | Community |
| Clanker (post-Oct 2025) | AI meme coin launcher | Neynar + FC |
| Quizframe | Educational in-feed quizzes | Community |
| farfeed-snap | View FC feed inside a snap | Montoya |

## Open Questions for Zaal

1. **No-code depth** - ship YAML + form UI v1, or go full drag-drop visual builder (3-4 week extra build)? Form UI is faster, drag-drop reaches more non-coders.
2. **Hosted runtime in v1?** Vercel works fine, but managed runtime kills the deploy step entirely + opens BCZ Strategies revenue earlier. Worth pulling from v1.5 to v1?
3. **ZAO Supabase access** - which tables get first-party Snap reads? Members, Cipher releases, ZABAL holders, Fractal records?
4. **Discovery** - Snap Gallery on zlank.online OR push for "Snaps" channel on Farcaster + integrate? Both?
5. **Whitelist mechanism** - how does "ZAO members can make a ZAO bot" enforce? FID check on signup? ZABAL hold? Fractal attendance? Manual approval by Zaal?
6. **Pricing** - free unlimited for ZAO members, paid tier for outsiders later? Or always free + managed-service is the only revenue?
7. **Snap-to-coin pipeline** - if creator ships a coin via a Zlank Snap (token launch button -> Clanker call), does Zlank take a cut, or pure community primitive?

## Also See

- [Doc 487 - QuadWork four-agent dev team](../../agents/487-quadwork-four-agent-dev-team/) - build the Snap platform via Quad batches
- [Doc 491 - QuadWork install three-repo split](../../agents/491-quadwork-install-three-repo-split/)
- [Doc 497 - Quad workflow deep dive](../../agents/497-quad-workflow-deep-dive/) - safe-zone batches for Zlank build
- [Doc 498 - Zlank unified SDK concept](../../business/498-zlank-unified-sdk-concept/) - parent vision, now scoped down to Snaps-first

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Audit duodo-snap + nouns-snap, extract common patterns into starter template spec | Claude / Quad | Code audit | Within 3 days |
| Decide v1 surface mix: CLI / web builder / component library / gallery / analytics - pick which 3 ship first | Zaal | Decision call | Before Quad batch starts |
| Reserve zlank.online domain + set up GitHub org (zlank-labs?) | Zaal | DNS + GH | Within 7 days |
| First Quad batch: scaffold @zlank/snaps-cli + 2 templates (poll, info) | Zaal + Quad | Overnight batch | Within 14 days |
| Update project_zlank.md memory with Snap pivot | Claude | Memory update | Done in same session |
| Park doc 498 full SDK scope as v2 reference | Claude | Doc note | Done |
| When v1 ships + 2 ZAO members run snaps, DM Adrian/Orajo with working demo + 7 questions | Zaal | Farcaster DM | Post-MVP |

## Sources

- https://github.com/farcasterxyz/snap
- https://docs.farcaster.xyz/snap
- https://www.npmjs.com/package/@farcaster/snap
- https://www.npmjs.com/package/@farcaster/snap-hono
- https://dtech.vision/farcaster/miniapps/how-do-mini-apps-differ-from-frames/
- https://danromero.org/farcaster-update/
- https://github.com/neynarxyz/farcaster-examples
- https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/
- https://x.com/ljxie/status/1897176803221102786
- https://docs.base.org/cookbook/use-case-guides/transactions
- https://nocodeframes.com (Frames v1 only - the gap Zlank fills)
- duodo-snap/package.json + nouns-snap/package.json (local reference impls)
