---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-17
related-docs: 533, 537, 558, 562, 610, 655
tier: STANDARD
---

# 659 - ZOE Posts v2: Voice Fix + Persistent Confirm Flow

> **Goal:** Address two real failures of post slate v1 caught in the first 24h: (a) drafts are off-voice + miss every existing ZAO writing rule, (b) drafts fire-and-forget so bad ones still hit Zaal's phone with no way to reject. Both fixes ship in PR #538.

## Recommendations First

| # | Action | Severity | Why |
|---|---|---|---|
| 1 | **Replace `SHARED_VOICE` prompt in `drafters.ts` with the full /socials skill rules + Doc 610 anti-patterns + 3-5 few-shot examples per category** | **CRITICAL** | v1 drafts are generic LLM-speak. The /socials skill has 11 voice rules + Doc 610 has 8 anti-patterns + 6 do-rules that ZOE never saw. Single-file fix unlocks the whole post slate. |
| 2 | **Replace fire-and-forget with persistent inline-keyboard confirm flow: `[POST]` `[REGEN]` `[SKIP]`** | **HIGH** | Per Zaal feedback: "i want it to keep sending the same post until i approve it." Pending state at `~/.zao/zoe/posts/pending/<id>.json`. Scheduler skips new fires while one is pending. Re-DM at 30-min intervals max 3 times. Tap a button → callback handler updates state. |
| 3 | **Add `(skip)` fast-fail for build/ecosystem categories when source data is empty** | MEDIUM | v1 generated weak drafts even when no commits / no ecosystem signal because the drafter prompt didn't insist on real material. New prompt forces `(skip)` when source block is truly empty. |
| 4 | **Default category model: `sonnet` not `haiku`** | MEDIUM | Haiku could not internalize 19 voice rules + few-shot examples without losing the actual content. Sonnet handles the prompt budget. Cost = ~$0.003-$0.01 per draft = ~$0.07/day max at 7 pings. Cheap. |
| 5 | **Hold v3 (auto-post via Firefly API) until v2 has been used 1 week** | LOW | Per `feedback_ship_and_use_not_meta`. Confirm flow + good voice = enough to test. Auto-post adds blast radius. |

## What was wrong with v1 (2026-05-17 evening test)

Zaal received 4 drafts. Quoted verbatim:

> **build**: "I shipped ZOE's post-draft feature. She pings with random social ideas, tap to copy. #533"

Violations: `#533` reads as hashtag (rule: no hashtags). "Pings with random social ideas" = vibes not contribution. Missing `ZM` daily greeting (rule: every post begins with ZM).

> **ecosystem**: "Post-slate v1 shipped: ZOE now auto-drafts social posts. Agency-model research + zao-transcribe landed. The multi-agent coordination layer for The ZAO is coming together."

Violations: "is coming together" = ZABAL anti-pattern (vague abstraction). "The multi-agent coordination layer" = "the X" brand-coded singular (Doc 610 anti-pattern #3). No specific number, no named person, no concrete artifact.

> **ecosystem**: "shipped 3 research on agency model, plural events, monetary substrate. zao foundation work."

Violations: drops voice mid-sentence ("zao foundation work" is a fragment, but the genre is unclear - is this a tweet or a memo?). Too thin - no context, no link, no number.

> **event**: "Lunch stream 11:30am ET. Come hang."

Violations: **"11:30am ET" is a work-day time reference** (rule from /socials: "NEVER reference work-day times"). Zaal has a day job at Jackson Labs - publishing his lunch-stream time confirms he's building during work hours. Direct rule break that v1 had no guardrail for.

## Voice rules to bake into v2

Combined from the **/socials skill** (~/.claude/skills/socials/skill.md) + **Doc 610 ZABAL voice toolkit** + **Doc 558 Anbeeld writing rules**.

### Universal rules (apply to every category)

1. **Lead with `ZM`** as the opener for build/ecosystem/personal posts (skip for event-promo when it would read awkward).
2. **No hashtags.** Even PR numbers like `#533` reformatted as `PR 533`.
3. **No emojis. No em dashes. Hyphens only.**
4. **Lowercase casual** when it fits the rhythm. "shipped post slate" beats "Shipped Post Slate".
5. **Never reference work-day times.** No "this morning", "today at 10am", "lunch stream at 11:30". Use timeless framing: "had a lunch stream" or just drop the time.
6. **Contribution over celebration.** Name the artifact, the number, the person. Not the vibe.
7. **Lead with the verb when possible.** "Shipped X" beats "X is now live."
8. **No aphoristic closes.** Closing line is a concrete fact or next step, not a koan.
9. **No "the machine", "the work", "the system", "the multi-agent coordination layer"** as brand-coded singulars. Name the thing.
10. **No "is coming together", "small pieces clicking into place", "the rhythm is set"** as transitions.
11. **One specific number, name, or place per post minimum.**
12. **Hard cap 280 chars** (single FC+X cross-post via Firefly).
13. **Brand spellings exact**: WaveWarZ, COC Concertz, The ZAO, BetterCallZaal, ZABAL, SANG, ZOE, ZOLs, FISHBOWLZ, Hurric4n3ike, candytoybox, Huöttöja, Joseph Goats.
14. **If source data is empty or generic, output `(skip)` only.** Better to send nothing than fluff.

### Category-specific rules

| Category | Lead with | Source signal | Anti-rule |
|---|---|---|---|
| **build** | Shipped artifact name + PR# (no hashtag) | git log + open PRs (last 24h) | Don't list 3 commits; pick the 1 that ships a thing users see |
| **ecosystem** | Named ZAO member or project move | repo activity (proxy) + Farcaster v2 | Don't generalize to "ecosystem momentum"; name the specific person/project |
| **event** | Named event + venue/link, no time | `~/.zao/zoe/events/{today,tomorrow}.txt` | Drop times; "come hang" without the work-hour timestamp |
| **personal** | Zaal's actual phrasing from voice memo | `~/.zao/zoe/voice-memos/<date>.md` | If no voice memo today, `(skip)` - do not synthesize personal posts from persona alone |

## Few-shot examples (bake into prompt)

Use 2-3 good examples per category. The model copies tone from examples better than from rules alone.

### build examples

```
ZM. shipped /voicememo + /vm telegram commands. one-liner thoughts now feed ZOE's personal post drafter. PR 533.

ZM. dropped paperclipai from VPS - the service had crash-looped 107k times. one less fire.

ZM. zoe post slate v2 ships persistent confirm: every draft sits until you tap POST or SKIP. no more fire-and-forget noise.
```

### ecosystem examples

```
ZM. cassie validated 4/28 - the ZAOstock infrastructure is the product, the festival is proof. building the rest in public.

ZM. iman owns cowork-zaodevz now - one tracker for ZAO + WaveWarZ + COC Concertz + BCZ Strategies. 4 brands, one audit log.

ZM. jadyn violet UVR producer brief locked. iman builds the song next.
```

### event examples

```
ZM. ZAOstock Oct 3 in Ellsworth - franklin st parklet. sign up at zaostock.com.

ZM. monday cobuilds at meet.baserooms.io/zaal - open jam, anyone can drop in.

ZM. POIDH bounty 1151 closes friday - WTM audition format, $25 USDC.
```

### personal examples

```
ZM. realized this morning that the ZAO is not the music, the music is the proof of the ZAO. the org is the artifact.

ZM. iman watching me build imanagent on a video call was the best dev-handoff i've ever done.

ZM. JANGOUU FOREVER. been thinking about how every project i build now traces back to him.
```

## Confirm flow v2 design

**Pending draft = the only fire-able state.** Scheduler never sends a new draft while one is pending. Persistence at `~/.zao/zoe/posts/pending.json` (single-pending model - if Zaal taps SKIP on draft A, draft B becomes the next eligible).

### State machine

```
[scheduled] --tick due--> [drafted] --send + buttons--> [pending]
                                                            |
        +------- REGEN tap ---------- regen + send -------- +
        |
        +------- POST tap -----------> [approved] (log + done)
        |
        +------- SKIP tap -----------> [skipped] (log + done)
        |
        +------- 30 min no tap ------> [resent] (max 3 resends)
        |
        +------- 4 hours no tap -----> [expired] (auto-skip)
```

### Inline keyboard markup (grammy)

```typescript
import { InlineKeyboard } from 'grammy';

const kb = new InlineKeyboard()
  .text('POST', `post-approve:${id}`)
  .text('REGEN', `post-regen:${id}`)
  .text('SKIP', `post-skip:${id}`);

await bot.api.sendMessage(zaalTgId, text, { reply_markup: kb });
```

Callback handler in `bot/src/zoe/index.ts`:

```typescript
bot.callbackQuery(/^post-(approve|regen|skip):(.+)$/, async (ctx) => {
  if (!isFromZaal(ctx)) return ctx.answerCallbackQuery();
  const [, action, id] = ctx.match;
  await handlePostCallback({ action, id, ctx });
  await ctx.answerCallbackQuery(`${action} noted`);
});
```

### Persistence shape

`~/.zao/zoe/posts/pending.json`:
```json
{
  "id": "2026-05-17T19:50-build",
  "category": "build",
  "text": "ZM. shipped post slate v2...",
  "createdAt": "2026-05-17T23:50:00.000Z",
  "lastSentAt": "2026-05-17T23:50:00.000Z",
  "messageId": 12345,
  "resendCount": 0,
  "state": "pending"
}
```

### Sources rules

- **Single in-flight draft only.** If pending exists, scheduler tick logs `skip-blocked-on-pending` and returns.
- **REGEN replaces, doesn't queue.** Same id, new text, same message-edit if grammy supports it (otherwise new message + ignore the old one).
- **Max 3 resends.** After 3rd resend, auto-state = `expired`.
- **4-hour absolute TTL** regardless of resend count.

## Sources

- `~/.claude/skills/socials/skill.md` (voice rules verbatim)
- `~/.claude/skills/humanizer/SKILL.md` (Wikipedia AI-writing toolkit)
- [Doc 558 - Anbeeld writing.md AI-prose toolkit](../558-anbeeld-writing-md/)
- [Doc 610 - Newsletter prose toolkit + ZABAL voice tightening](../610-newsletter-prose-toolkit-zabal-voice/) - the 8 anti-patterns + 6 do-rules
- [Doc 562 - humanizer skill + last30days](../562-reddit-x-scraping-meta-eval-last30days/)
- [grammY inline keyboards docs](https://grammy.dev/plugins/keyboard)
- [grammY callback query reference](https://grammy.dev/ref/types/callbackquery)
- [Twitter Strategy for Indie Hackers 2026 - teract.ai](https://www.teract.ai/resources/twitter-strategy-indie-hackers-2026)
- v1 drafts that hit Zaal's phone 2026-05-17 evening (cited in "What was wrong" section)

## Also See

- [Doc 533 PR](../533) - post slate v1 ship
- [Doc 537 PR](../537) - tap-copy UX + 1-ping-per-tick fixes
- [Doc 655](../655-post-merge-execution-playbook/) - week-1 execution playbook (this is part 2)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Replace `SHARED_VOICE` in `bot/src/zoe/posts/drafters.ts` with v2 rules + few-shot examples | Claude (this PR) | Code | Now |
| Default category model = `sonnet` | Claude (this PR) | Code | Now |
| Add inline keyboard to fireOneDraft + pending.json persistence | Claude (this PR) | Code | Now |
| Register callback handler in `bot/src/zoe/index.ts` | Claude (this PR) | Code | Now |
| Scheduler: skip new fires if pending exists | Claude (this PR) | Code | Now |
| Resend pending at 30-min interval max 3 times | Claude (this PR) | Code | Now |
| Zaal deploys via auto-sync + tests 3-5 drafts | @Zaal | Test | After merge |
| Friction check: are drafts approval-rate > 30%? | @Zaal | 1 week of pending.json + log.jsonl review | 2026-05-24 |
| If approval > 50% → consider v3 (Firefly API auto-post) | @Zaal | Decision | 2026-05-24 |
| If approval < 20% → grill on voice + add more few-shot examples | Claude + Zaal | grill session | 2026-05-24 |
