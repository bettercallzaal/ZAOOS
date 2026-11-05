# ZAO Card Builder v1 - Build Plan

**Date:** 2026-10-20
**Spec:** research doc 2690, "ZAO Card Builder: an Artist-Facing Card and NFT Creator" (PR #4044), which follows doc 2689 (PR #4042)
**Route:** ZAOOS `/cards/create`
**Status:** plan only. No code, no dependency added. Phase B waits on Zaal approving the editor library (question 5 below).

## Decisions this plan rests on

| Question (doc 2690) | Answer | Who |
|---|---|---|
| 1. Full artist editor? | A: yes, build v1 as listed | seat auto-proceeded 2026-10-20, Zaal can override |
| 4. Background removal? | No. AI stays out of public visuals | seat auto-proceeded 2026-10-20 |
| 6. Where do drafts live? | In the artist's browser only. No table, no migration | seat auto-proceeded 2026-10-20 |
| 5. `konva` + `react-konva`? | OPEN, new dependency = ask-first | Zaal |
| 2. Frame designer, ZAO-PALOOZA source files? | OPEN | Zaal |
| 3. ZAO CARDS chain, ERC-721 or 1155, admin wallet, metadata storage? | OPEN | Zaal |

One more auto-proceeded choice, made by this plan and reversible:

- **v1 has no sign-in.** The ZAOOS sign-in is gated on the member allowlist: `src/app/api/auth/verify/route.ts` calls `checkAllowlist(fid)` at line 131 before it creates a session, and the `(auth)` route group redirects to `/` when there is no session (`src/app/(auth)/layout.tsx`). A ZAO-PALOOZA artist who is not a member could not get in. Because v1 saves nothing on the server, it does not need a session. When the page is opened as a Farcaster mini app, the artist's FID is prefilled from `useMiniApp()` (`src/hooks/useMiniApp.ts`, `userFid`), unverified and editable. A verified sign-in for non-members comes with the v2 review queue, and that change touches auth, so it gets a security review.

## Hard rules every task keeps

1. **No AI-made visuals.** Code lays out and exports. It never generates art. ZAO frames are files made by people (question 2); v1 code draws only plain shapes: a border, a corner radius, a fill.
2. **The artist approves their own card.** Export of the submit bundle is locked until the artist ticks the approval box.
3. **Credits are mandatory and visible.** Artist, photographer and frame designer, with "Unknown" written out. No export without the credit line on the card.
4. **Nothing minted, sold, priced or posted.** The builder never holds a key, never sends a transaction, never uploads. The rarity badge is a label only.
5. **Original frames only.** No frame copied from another card game (doc 2690, Card Conjurer).

## Where it lives

`src/app/cards/create/` sits OUTSIDE the `(auth)` group, so non-members can open it. A grep on 2026-10-20 for `card-builder`, `card builder` and `cards/create` in `src/` found nothing, and `src/app/cards`, `src/components/cards` and `src/lib/cards` did not exist, so everything below is new. No API route is added in v1.

## Phase A - pure logic, no new dependency (can start now)

Each file gets a co-located Vitest test in `src/lib/cards/__tests__/` covering success and error paths (`tests.md`).

| File | What it does |
|---|---|
| `src/lib/cards/types.ts` | `CardDraft`, `CardLayer` (a union of image, text and stat block), `CardCredits`, `CardFrame`, `ExportKind` |
| `src/lib/cards/schema.ts` | Zod schemas for the draft and the credits. A draft read back from browser storage is untrusted input and goes through `safeParse` |
| `src/lib/cards/credits.ts` | `validateCredits()` (artist required; photographer and designer default to "Unknown") and `creditLine()` for the text drawn on the card |
| `src/lib/cards/metadata.ts` | `buildCardMetadata(draft)`: EIP-721 `name`, `description`, `image`, plus OpenSea `attributes`, `external_url` and `background_color` (six hex characters, no `#`). Attributes follow doc 2690's table: Festival year as `number`, Card made as `date` in Unix seconds, the rest as strings |
| `src/lib/cards/export-sizes.ts` | Pixel sizes and a fit-and-pad function. Card PNG at 2.5:3.5 (750x1050). Share PNG at 3:2 (1200x800). NFT image at 4:5 (1080x1350), with the card scaled to fit and padded, never cropped: 750x1050 scales by 1350/1050 to about 964x1350, centred |
| `src/lib/cards/drafts.ts` | Save and load one draft in `localStorage` under `zao-cards-draft:v1`. Every read and write is in try/catch. A failed save says so on screen, never silently |
| `src/lib/cards/history.ts` | Undo and redo as a bounded snapshot stack, pure functions |
| `src/lib/cards/frames.ts` | Frame registry. v1 ships "Blank" plus colourways (ZAO navy `#0a1628` with gold `#f5a623` as the default). Designer-made frames load from `public/cards/frames/<id>/` (an image plus a slot list) once question 2 is answered |
| `src/lib/cards/fonts.ts` | The curated font list. Each entry records where its licence file was read; only fonts whose licence has been checked go in (doc 2690: google/fonts says "always read the license for every font"). It starts with Inter, which the app already loads (`src/app/layout.tsx`) |

Phase A done when: `npm run typecheck` has 0 errors, `npx vitest run src/lib/cards` passes, `npx biome check src/lib/cards` is clean, and the full suite passes (`pre-merge-security-and-suite.md`).

## Phase B - the editor (waits on question 5)

If Zaal approves `konva` + `react-konva` (both MIT, doc 2690), Phase B uses them. If he declines, Phase B falls back to the native Canvas 2D path recommended in doc 2689, with the same file list and fewer features (no transformer handles, so crop is zoom-and-drag only). Crop uses the Konva transformer plus a clip on the art window, so `react-easy-crop` is not added.

| File | What it does |
|---|---|
| `src/app/cards/create/page.tsx` | Server shell with page metadata. Loads the editor with `next/dynamic` and `{ ssr: false }` (`components.md`) |
| `src/components/cards/CardEditor.tsx` | The stage, its layers and the transformer; owns draft state and history |
| `src/components/cards/FramePicker.tsx` | Frame and colourway choice, or a blank card |
| `src/components/cards/ImageUpload.tsx` | PNG, JPG or WebP only, with a size cap, read in the browser. Nothing is uploaded |
| `src/components/cards/LayerPanel.tsx` | Add, order, hide and delete layers |
| `src/components/cards/TextControls.tsx` | Font, size, colour, alignment, outline, shadow |
| `src/components/cards/StatBlockForm.tsx` | The ZAO stat block: festival, year, genre, city, ZAO moment |
| `src/components/cards/StylePanel.tsx` | Border, corner radius, background colour or gradient, the rarity label |
| `src/components/cards/CreditsForm.tsx` | The three credits. Export stays disabled until `validateCredits` passes |
| `src/components/cards/ExportPanel.tsx` | Downloads card PNG, share PNG, NFT PNG and metadata JSON. The bundle unlocks only after the approval tick |

Mobile first, dark theme, Tailwind only, `@/` imports, no `dangerouslySetInnerHTML`. Component tests use `@testing-library/react` and mock the canvas layer with `vi.mock`, since jsdom has no canvas.

Phase B done when: Phase A's checks still pass, the component tests pass, the full suite passes, and a manual run on a phone-width viewport makes a card from upload to the four downloads, with screenshots in the PR.

## Phase C - submit in v1

There is no server in v1, so "submit" is the artist's own act: they tick "I approve this card and its credits" and download the bundle (three PNGs plus the metadata JSON), then send it to The ZAO themselves. The builder does not send it, post it or upload it. The ZAO wallet decides whether a card is minted into ZAO CARDS (question 3), outside the builder.

## Not in v1

A server drafts table (question 6 says browser only), the review queue and verified sign-in, the WaveWarZ stat block, the foil effect, the card back, the song snippet, image filters, print bleed, background removal (no), and minting (never in the builder).

## Review gates before any phase merges

- A fresh-context evaluator verdict on the exact head (`zao-evaluate`). The author does not grade its own PR.
- A security read of the upload path and the storage read (`pre-merge-security-and-suite.md`); there is no API route to review in v1.
- The PR names the new dependency and its licence in the body if Phase B uses Konva (`credit-attribution.md`).
