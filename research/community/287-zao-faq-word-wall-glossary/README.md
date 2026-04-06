# 287 — ZAO FAQ + Word Wall: Community-Driven Web3 Glossary

> **Status:** Research complete
> **Date:** 2026-04-05
> **Goal:** Design a ZAO FAQ page and "Word Wall" — an Urban Dictionary-style community glossary for web3/crypto/music terms with Respect-weighted upvote/downvote, building on existing library infrastructure

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Build on existing library** | USE the existing `research_entries` + `research_entry_votes` Supabase tables and `src/app/api/library/vote/route.ts` — the upvote/downvote infrastructure is already built and working |
| **FAQ page** | UPGRADE `src/components/chat/FaqPanel.tsx` from a hardcoded sidebar panel (11 static Q&As) to a dedicated `/faq` page with editable, community-contributed entries |
| **Word Wall architecture** | BUILD as a new tab on the existing `/library` page — reuse `EntryCard`, `EntryFeed`, `SubmitForm` components with a `type: 'glossary'` filter |
| **Respect-weighted voting** | ADD Respect-weighted scoring — multiply vote weight by voter's Respect balance using `src/lib/music/curationWeight.ts` pattern. A vote from someone with 100 Respect counts more than a vote from someone with 5 |
| **Data model** | ADD a `type` column to `research_entries` table: `'link'` (existing), `'glossary'` (Word Wall), `'faq'` (FAQ). No new tables needed |
| **Third-party tools** | SKIP Canny ($79/mo), Frill ($25/mo), Roadmapr — ZAO already has the voting infrastructure. Building in-house costs 4-6 hours and fits the community's ethos |
| **Seed data** | SEED 50-100 terms from existing web3 glossaries (Ledger Academy, Blocknative, Consensys) + ZAO-specific terms (Respect, OREC, fractal, ZOR, ZOUNZ, frapps) |
| **peth's Roadmapr pattern** | ADAPT the token-weighted voting concept — peth described "upvote or downvote with tokens, putting skin in the game." ZAO's version: Respect-weighted votes, not token-locked votes |

---

## What Already Exists in ZAO OS

### Static FAQ (hardcoded, chat-only)

`src/components/chat/FaqPanel.tsx` — 11 hardcoded Q&A pairs in a slide-out panel, accessible only from the chat page. Not searchable, not editable, not community-driven.

### Library System (full voting infrastructure)

| Component | File | What It Does |
|-----------|------|-------------|
| Entry submission | `src/components/library/SubmitForm.tsx` | URL + topic + note form, auto-OG-extraction |
| Entry display | `src/components/library/EntryCard.tsx` | Card with upvote/downvote buttons, comment count, AI summary |
| Entry feed | `src/components/library/EntryFeed.tsx` | Paginated feed with search, tag filter, sort by newest/upvoted |
| Vote API | `src/app/api/library/vote/route.ts` | Toggle up/down votes, denormalized counts |
| Entries API | `src/app/api/library/entries/route.ts` | GET with search, tag, sort, pagination (max 100) |
| Comments | `src/components/library/EntryComments.tsx` | Threaded comments per entry |
| Deep research | `src/components/library/DeepResearch.tsx` | AI research tool tab |
| Page | `src/app/(auth)/library/page.tsx` | Two tabs: Submissions + Research |
| DB tables | `research_entries`, `research_entry_votes` | Entries with upvote/downvote counts + votes per user |

**The voting system already handles:** toggle votes, vote switching (up<->down), denormalized counts, user-specific vote state, search, tag filtering, and sorting by most upvoted. This is 80% of what the Word Wall needs.

### Respect-Weighted Curation

`src/lib/music/curationWeight.ts` — Already implements the formula for weighting actions by Respect. The pattern: `weight = baseWeight * (1 + log2(respect + 1))`.

---

## Comparison: Build vs Buy vs Adapt

| Approach | Cost | Effort | Fits ZAO | Community Owned |
|----------|------|--------|----------|-----------------|
| **Extend existing library** (recommended) | $0 | 4-6 hrs | Yes — same Supabase, same auth, same Respect weighting | Yes — fully in codebase |
| **Canny** (SaaS) | $79/mo ($948/yr) | 1 hr setup | No — no Respect weighting, no Farcaster auth, generic UI | No — vendor locked |
| **Frill** (SaaS) | $25/mo ($300/yr) | 1 hr setup | No — same issues as Canny | No — vendor locked |
| **Saidit** (open source, Next.js + Supabase) | $0 | 8-12 hrs to fork + customize | Partial — right stack but Reddit-style, not glossary | Yes if forked |
| **Custom from scratch** | $0 | 12-16 hrs | Overkill — library system already exists | Yes |

---

## Feature Design: Word Wall

### Concept

An **Urban Dictionary for web3** — but community-owned by ZAO members. Anyone can submit a term + definition. The community upvotes/downvotes definitions. Respect-weighted voting means senior contributors' votes carry more weight. Top definitions surface first.

### User Flow

1. **Browse:** `/library?tab=glossary` — alphabetical or trending view of terms
2. **Search:** Type to filter terms (reuse existing search)
3. **Submit:** Click "Add Term" — form: `term` (required), `definition` (required), `tags` (optional, e.g., "DeFi", "Farcaster", "Music")
4. **Vote:** Upvote/downvote definitions (existing voting UI)
5. **Multiple definitions:** Same term can have multiple definitions (like Urban Dictionary) — best-voted rises to top
6. **Example usage:** Optional field for "use it in a sentence"

### Data Model Change

Add a `type` column to `research_entries`:

```sql
ALTER TABLE research_entries
ADD COLUMN type TEXT NOT NULL DEFAULT 'link'
CHECK (type IN ('link', 'glossary', 'faq'));

-- For glossary entries, 'topic' = the term, 'note' = the definition
-- 'ai_summary' can auto-generate a concise definition from the user's note
-- 'tags' already supports categorization
```

No new tables. The existing `research_entries` schema already has: `topic` (term name), `note` (definition text), `tags` (categories), `upvote_count`, `downvote_count`, `ai_summary`, `fid` (author).

### Respect-Weighted Voting

Modify `src/app/api/library/vote/route.ts` to weight votes:

```typescript
// Fetch voter's Respect balance
const { data: member } = await supabaseAdmin
  .from('members')
  .select('respect_total')
  .eq('fid', fid)
  .single();

const respectWeight = 1 + Math.log2((member?.respect_total || 0) + 1);

// Store weighted vote
await supabaseAdmin
  .from('research_entry_votes')
  .insert({ entry_id, fid, vote_type, weight: respectWeight });

// Update weighted score (not just count)
const { data: votes } = await supabaseAdmin
  .from('research_entry_votes')
  .select('vote_type, weight')
  .eq('entry_id', entry_id);

const weightedScore = votes.reduce((sum, v) =>
  sum + (v.vote_type === 'up' ? v.weight : -v.weight), 0);
```

---

## Feature Design: Upgraded FAQ

### Current State

`src/components/chat/FaqPanel.tsx` — 11 hardcoded items, only accessible from chat sidebar. Not a page, not searchable, not editable.

### Upgraded Design

1. **New route:** `/faq` — standalone page (outside `(auth)` group for SEO)
2. **Admin-curated:** FAQ entries managed by admins (not community-submitted like Word Wall)
3. **Categories:** General, Music Player, Governance, Spaces, Wallet/Auth, XMTP
4. **Search:** Filter FAQ items by keyword
5. **JSON-LD:** Add `FAQPage` schema.org structured data (ties into Doc 286 SEO recommendations)
6. **Link from chat:** Keep the FAQ button in chat but link to `/faq` page instead of opening the panel

### FAQ Schema (JSON-LD)

```typescript
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};
```

This makes ZAO's FAQ appear in Google's FAQ rich results and AI search engine citations.

---

## peth's Vibecoding Journey — Relevance to ZAO

From the NextMeta Substack article (April 4, 2026):

| peth's App | What It Does | ZAO Parallel |
|------------|-------------|--------------|
| **Roadmapr** | Token-weighted upvote/downvote for feature prioritization | Word Wall uses Respect-weighted voting — same concept, different token |
| **AI: The Game** | RPG with LLM gamemaster, missions, skill trees | SKIP — entertainment, not governance |
| **PumpIt** | Workout tracker with staked USDC goals | The staking pattern is interesting for future "stake Respect on predictions" (WaveWarZ) |
| **MetaOS** | Personal OS with kanban, terminals, AI advisors, 24 cron jobs, 35+ AI skills | ZAO OS is already this for a community — validates the "OS" concept |

**Key takeaway from peth:** A non-technical person built 4 apps in 3 months with zero hand-written code using Claude. This validates ZAO's build-in-public approach and the "vibecoding" era. The Roadmapr pattern (token-weighted votes on community priorities) maps directly to what Word Wall does with Respect.

**peth's "100 days of shipping" challenge** is content gold for ZAO's build-in-public narrative. The article proves the thesis: community members don't need to be developers to contribute features.

---

## Implementation Plan

| Step | Task | Effort | Files |
|------|------|--------|-------|
| 1 | Add `type` column to `research_entries` | 15 min | SQL migration |
| 2 | Add `weight` column to `research_entry_votes` | 15 min | SQL migration |
| 3 | Update `src/app/api/library/entries/route.ts` — filter by type | 30 min | Existing file |
| 4 | Update `src/app/api/library/vote/route.ts` — Respect-weighted scoring | 1 hr | Existing file |
| 5 | Add Word Wall tab to `/library` page | 1 hr | `src/app/(auth)/library/page.tsx` |
| 6 | Create glossary submission form (term + definition) | 1 hr | New component or extend `SubmitForm.tsx` |
| 7 | Create `/faq` page with categories + search | 1.5 hrs | New route `src/app/faq/page.tsx` |
| 8 | Add `FAQPage` JSON-LD to `/faq` | 15 min | Same file |
| 9 | Seed 50-100 web3/music terms | 1 hr | Script or manual |
| 10 | Update chat FAQ button to link to `/faq` | 15 min | `src/components/chat/FaqPanel.tsx` |
| **Total** | | **~6.5 hrs** | |

---

## ZAO-Specific Seed Terms (Sample)

| Term | Category | Definition |
|------|----------|------------|
| Respect | ZAO | Non-transferable reputation token earned through peer evaluation in fractal sessions |
| OREC | Governance | Optimistic Respect-based Executive Contract — passes proposals unless vetoed by 1/3 of participating Respect |
| Fractal | Governance | A weekly session where breakout groups rank contributions using Fibonacci scoring |
| ZOR | Token | ZAO Respect1155 token on Optimism — ERC-1155 combining fungible Respect + individual NTT awards |
| ZOUNZ | DAO | ZAO's Nouns Builder NFT collection on Base — 1 NFT = 1 governance vote |
| Frapps | Infrastructure | Configured ORDAO instances for fractal communities, hosted at frapps.xyz |
| Cast | Farcaster | A post on Farcaster — equivalent to a tweet. Can be text, images, or embeds |
| FID | Farcaster | Farcaster ID — unique numeric identifier for each Farcaster account |
| Signer | Farcaster | A delegated key that allows an app to post on behalf of a user without their private key |
| XMTP | Messaging | Extensible Message Transport Protocol — end-to-end encrypted messaging for wallets |
| Crossfade | Music | Seamless transition between two tracks using dual audio elements |
| Binaural Beats | Music | Auditory illusion created by playing slightly different frequencies in each ear |
| SIWF | Auth | Sign In With Farcaster — authentication method using Farcaster account |
| Veto Period | Governance | OREC stage where only NO votes are accepted — prevents rushed proposals |
| Breakout Room | Governance | Small group (3-6 people) in a fractal session that ranks contributions |

---

## Reference Implementations

| Project | Stack | License | Key Pattern |
|---------|-------|---------|-------------|
| **msalah2024/saidit** | Next.js + Supabase | MIT | Reddit-style voting, communities, nested comments — closest to ZAO's stack |
| **fish-inu/urbandict** | Node.js | Unlicensed | Urban Dictionary clone — term + definition + voting model |
| **Unofficial UD API** | Express.js | Open source | REST API for term lookup — pattern for `/api/glossary/[term]` |
| **ZAO OS Library** | Next.js + Supabase | Internal | Already built — `EntryCard` + `EntryFeed` + vote API |

### Pattern from saidit (MIT, Next.js + Supabase)

Saidit implements upvote/downvote with Supabase RLS and denormalized counts — the same pattern ZAO's library already uses. Key difference: saidit uses Reddit's `score = up - down` ranking; Word Wall should use `weightedScore = sum(voteWeight * respectWeight)`.

---

## Sources

- [peth — "I Did It Again" (NextMeta Substack, Apr 4 2026)](https://metagame.substack.com/p/i-did-it-again) — 4 apps in 3 months, Roadmapr token-voting concept
- [Ledger Academy Crypto Glossary](https://www.ledger.com/academy/glossary) — comprehensive A-Z of crypto terms
- [Blocknative Web3 Glossary](https://www.blocknative.com/glossary) — DeFi, crypto, and web3 definitions
- [Consensys Blockchain Glossary](https://consensys.io/knowledge-base/a-blockchain-glossary-for-beginners) — beginner-friendly crypto glossary
- [Unofficial Urban Dictionary API](https://unofficialurbandictionaryapi.com/) — REST API pattern for term lookup
- [msalah2024/saidit](https://github.com/msalah2024/saidit) — MIT, Next.js + Supabase Reddit alternative with voting
- [Frill Feature Voting](https://frill.co/blog/posts/feature-voting) — 10 feature voting tools compared
- [Moralis Web3 Dictionary](https://developers.moralis.com/web3-dictionary/) — developer-focused web3 terms
