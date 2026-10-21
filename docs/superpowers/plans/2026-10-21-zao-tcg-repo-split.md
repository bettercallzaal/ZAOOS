# ZAO TCG repo split - plan

Written 2026-10-21 by the cards lane. Zaal ruled that ZAO TCG gets its own repo now (relayed by the seat on 2026-10-21, option B). The seat's defaults, which hold unless Zaal overrides: the repo is `bettercallzaal/zao-tcg`, and it is PRIVATE for now. Making it public later is one click; going back is not. This replaces the "stays in ZAOOS for v1" line in doc 2691 section 11 for the cards and TCG code only.

## 1. What moves

Everything below is on ZAOOS main at 759a44137. It came in through 4 squash commits: #4049 (fd9f24d75), #4047 (5c13b4e49), #4070 (863a125b9) and #4071 (759a44137).

| Path | Files |
|---|---|
| `src/app/tcg/` | `page.tsx`, `TcgDropClient.tsx` |
| `src/app/cards/create/` | `page.tsx` |
| `src/components/cards/` | `CardBuilderLoader.tsx`, `CardCanvas.tsx`, `CardEditor.tsx`, `CardPanels.tsx`, `exportCard.ts`, `layerFactory.ts`, 3 tests |
| `src/lib/cards/` | `credits`, `drafts`, `export-sizes`, `fonts`, `frames`, `history`, `metadata`, `readiness`, `schema`, plus 8 tests |
| `src/lib/tcg/` | `drop.ts`, 1 test |
| `scripts/` | `cards-buyer-snapshot.ts`, `lib/wavez-buyers.ts`, `__tests__/wavez-buyers.test.ts` |

That is 34 files (the count `git filter-repo` kept).

## 2. What it imports from ZAOOS, and what happens to each

I took the list from a `git grep` of every `from '...'` in the 34 files at origin/main 759a44137. These are the only imports from outside the moved set:

| Import | Used for | Standalone answer |
|---|---|---|
| `@/lib/respect/onchainBalances` (`readMemberBalances`, 55 lines) and the `BalanceCallResult` type from `@/lib/respect/voteWeight` | Reading Respect results on /tcg, where a failed read shows "Could not read" | **Copy** both into `src/lib/respect/`, with a comment naming the ZAOOS file and commit they came from |
| `@/../community.config` (`respect.ogContract`, `zorContract`, `zorTokenId`) | The Respect contract addresses on Optimism | **Copy** these 3 values into `src/config.ts` |
| `@/hooks/useMiniApp` (219 lines) | Prefilling the artist's FID in the editor when it runs inside the Farcaster mini app | **Drop the prefill in v1.** The artist types the FID instead. Auto-proceeded; override anytime. It comes back with `@farcaster/miniapp-sdk` if the repo becomes a mini app |
| App shell: `src/app/providers.tsx` and `RainbowKitWrapper.tsx` (wagmi, RainbowKit, react-query), the `--font-inter` variable from the root layout, and the Tailwind v4 setup | The /tcg connect button, and fonts in the editor | **Write a small new shell**: Optimism-only wagmi config, `next/font` Inter exposed as `--font-inter`, and Tailwind v4 |

Login and data: none of the 34 files uses a session, iron-session, Supabase, Neynar or a ZAOOS API route. Sign-in on /tcg checks a wallet signature in the browser only. So the split needs no login or database, and nothing calls back into ZAOOS.

The later buyer dashboard will need private data: buyer emails and wallets. When it is built, it gets its own Supabase project with row-level security behind Zaal's login, not calls to ZAOOS. Creating that project is Zaal's (new DB), and it is not part of this move.

## 3. How it moves (history kept)

This is the same method `bettercallzaal/zaoostest` used: a private repo, with the history filtered out of ZAOOS and then a scaffold commit.

1. Make a fresh `git clone` of ZAOOS into the scratchpad, never the shared clone.
2. Run `git filter-repo --path` once for each path in section 1. This keeps the 4 commits that touched those paths, and their authors.
3. Add one scaffold commit:
   - `package.json`, with versions taken from the ZAOOS lockfile:
     - next 16, react and react-dom 19.2.3;
     - wagmi, viem, @rainbow-me/rainbowkit, @tanstack/react-query, zod;
     - konva 10.9.0 and react-konva 19.2.7 (still approved);
     - dev: vitest, jsdom, @testing-library/react, typescript, biome and tailwind v4. tsx is not added; the buyer snapshot keeps running through `npx tsx`.
   - `tsconfig` with the `@/` alias, `next.config`, `vitest.config`, `biome.json`;
   - the new shell from section 2, the copied Respect helper and config, `README` with credits, `LICENSE` (MIT, as zaoostest), and `.env.example`.
4. Copy-port the Respect helper as a separate commit, so it stays reviewable.
5. Create `bettercallzaal/zao-tcg` as a private repo and push `main`.
6. Before anything else touches the repo, check it: install, typecheck, the full vitest run (the 13 moved test files, 105 tests, pass on ZAOOS 759a44137 today and must pass there too), and biome. No local production build: those are not run on this Mac, so Vercel's first build is the build check. Then open a PR there for evaluator-e2.

## Status, 2026-10-21

Done: `bettercallzaal/zao-tcg` was created private, and its `main` is at 4b47d46, a cut built by `git filter-repo` from ZAOOS 759a44137. On top of the 4 kept commits it adds 2 commits: the Respect port, then the scaffold with a home page built around card 001 by Cannon Jones. Checks there: 14 test files and 108 tests pass, the typecheck shows 0 errors, and biome is clean. Vercel and the ZAOOS removal are still Zaal's.

## 4. What is Zaal's

- The Vercel project and domain for zao-tcg. Lanes never touch Vercel. It needs one new env var, `NEXT_PUBLIC_WC_PROJECT_ID` (the name ZAOOS reads), which is the same value ZAOOS uses, and Zaal sets it in Vercel.
- **Removing the code from ZAOOS is a Zaal paste, the same as wave 1.** It happens only after zao-tcg is serving. ZAOOS then keeps redirects from `/tcg` and `/cards/create` to the new domain. The cards lane prepares that PR and Zaal merges it.
- When the repo becomes public.

## 5. Carried follow-ups

These move with the code and get fixed in zao-tcg, not in ZAOOS:

- `exportBundle()` re-checks `canExportBundle`.
- A client test pins the "Could not read" rule.
- The buyer snapshot calls `songExists()` first.
- `buildCardMetadata` limits `imageUri` to ipfs:, ar: and https:.
- The /tcg perk text says the Telegram invite is to the ZAO Devz channel (TCG brainstorm topic), per Zaal on 2026-10-21.

## 6. Coordination

- Lane (3) zaoos is told before the repo is created, so nothing else in ZAOOS starts depending on `src/lib/cards` or `src/lib/tcg`.
- The zaoos-split lane's doc 2691 gets a one-line note that cards and TCG have graduated.
