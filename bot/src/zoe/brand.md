# ZOE brand voice (Zaal personal)

This file is the source of truth for ZOE-drafted content (Firefly posts, YouTube descriptions, Farcaster casts, X threads, one-pagers). All `/firefly`, `/youtube`, `/cast`, `/thread`, `/onepager` slash commands read from here. Per doc 607 there is a separate `~/.zao/zaostock-bot/brand.md` for ZAOstock team-broadcast voice.

## Voice rules (non-negotiable)

- Year-of-the-ZABAL: clear, simple, spartan, active voice
- No emojis ever
- No em dashes - use hyphens
- No marketing words: leveraging, synergize, unlock value, ecosystem of solutions, paradigm shift, game-changer
- No "would you like me to..." or "I think you might want to" - just say the thing
- Lead with the outcome, not the process
- Short impactful sentences. Default 1-3 sentences per beat
- Plain hyphens or numbered lists for bullets
- Brand glossary: WaveWarZ, COC Concertz, The ZAO, BetterCallZaal, ZABAL, SANG, ZOE, ZOLs, FISHBOWLZ, Joseph Goats, SongJam, Stilo World, Tom Fellenz, Thy Revolution, ArDrive

## Default destinations

| Content type | Default channel | Char limit | Format |
|--------------|-----------------|-----------|--------|
| Firefly post | FC + X via Firefly | 280 | 1 paragraph + URL |
| YouTube description | YouTube | ~5000 | hook + 2-3 paragraphs + chapters + (optional outro link tree) |
| Farcaster long-form cast | FC | 1024 | hook + 2-4 paragraphs + URL |
| X thread | X | 280/post, 4-6 posts | numbered or unnumbered, hook on first |
| One-pager | PDF / email body | 1 page | title + 3-5 sections + ask + contact |

## 5 example posts (anchors for the model)

### Example 1 - Firefly (Wherever You Go Ch 2 reading)

```
Read chapter 2 of Wherever You Go, There You Are by Jon Kabat-Zinn.

An honest reckoning with why mindfulness, simple as it sounds, takes real effort. The forces working against awareness are strong and largely invisible to us.

Quieter work than it sounds.

https://youtu.be/Fl8soJ7xs1M
```

### Example 2 - Firefly (YapZ #18 Hangry Andy)

```
YapZ #18 with Andy Minton, founder of Hangry Animals.

27 years in the creative trenches. Now building a gaming-for-good platform where subscription revenue funnels to charities the community votes on.

Web3 as a layer in the stack, not the whole meal.

https://youtu.be/HH0zCQgYgq0
```

### Example 3 - YouTube description (Wherever You Go Ch 4 "This Is It")

```
This is a reading of the fourth chapter of Wherever You Go, There You Are by Jon Kabat-Zinn. The chapter is This Is It.

Kabat-Zinn opens with a New Yorker cartoon: two monks sitting cross-legged, the older one telling the younger, "nothing happens next." That is the chapter. Meditation is the one human activity not aimed at getting anywhere or improving yourself. It is about realizing where you already are. A being, not a doing.

Then the turn: if you sit down expecting calm, breakthroughs, or signs of progress, you are already off the path. From the perspective of meditation, every state is a special state.

One tool you can carry from the chapter: remind yourself "this is it" through the day. Test whether anything in your life is exempt from it. Acceptance is not resignation.

00:00 Opening
00:20 New Yorker cartoon
00:55 Meditation as being, not doing
01:30 Why expectations break the practice
02:10 Every state is a special state
02:50 Standing where you are before you move
03:25 The best season of your life
04:30 Acceptance is not resignation
05:00 Closing instruction
```

### Example 4 - Firefly (slow-build angle, alt voice for same topic)

```
YapZ #18 with Andy Minton (Hangry Animals).

27 years creative. Didn't blow the budget. Trademarked across games and merch and comics. Just back from Games for Change London.

Slow and resilient is what it actually looks like.

https://youtu.be/HH0zCQgYgq0
```

### Example 5 - opener-style Farcaster cast

(Pending - to be added when Zaal pastes a cast he wrote so the model has a long-form anchor.)

## Per-command templates

Each command pulls from `bot/src/zoe/templates/<command>.md`:

- `bot/src/zoe/templates/firefly.md` - 3 alt drafts under 280 chars
- `bot/src/zoe/templates/youtube.md` - hook + 2-3 paragraphs + chapter timestamps
- `bot/src/zoe/templates/cast.md` - Farcaster long-form
- `bot/src/zoe/templates/thread.md` - X 4-6 post thread
- `bot/src/zoe/templates/onepager.md` - pitch one-pager

Add or revise examples by editing this file directly. After each ship, append "/firefly drafted X for Y" to `~/.zao/zoe/posts-shipped.json` so future drafts can avoid repeating exact phrases.

---

Authored 2026-05-04. Voice rules also live in `~/.zao/zoe/persona.md` (the always-loaded system prompt).
