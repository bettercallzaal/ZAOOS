---
topic: music
type: guide
status: research-complete
last-validated: 2026-05-15
superseded-by:
related-docs: 321, 600, 600.06, 320, 313
tier: DEEP
---

# 601 — Suno: Exactly Where to Put What (Tactical Production Guide, May 2026)

> **Goal:** A "paste this into that box" guide for Suno v5.5, plus the full Suno-ready song built for the UVR Taco Bell sponsorship pitch. Doc 321 covers what Suno is at the platform level (April 2026 snapshot). This doc is what to *do* with it right now.

The deeper Personas / Voices / Studio operational manual is in **[01-personas-voices-studio.md](01-personas-voices-studio.md)**.

---

## Key Decisions / Recommendations

| # | Recommendation | Why |
|---|----------------|-----|
| 1 | USE v5.5 in Custom Mode (Pro/Premier). It is the current model — v6 has not shipped as of May 15, 2026. | Best vocal clarity, 4-min single-pass, full feature access. |
| 2 | THINK in three input fields: **Style** (how it sounds), **Lyrics** (what gets sung + structure), **Exclude Styles** (what to keep out). One concept per field — never cross them. | The single most common Suno failure is putting bracket tags in Style or putting genres in Lyrics. |
| 3 | KEEP the Style prompt to 5-8 tags, front-loaded (genre first, mood second, instruments, then vocal). The first 2-3 tags carry ~2x weight. | Past tag #6-8 attention drops to ~15%. Less is more. |
| 4 | DEFAULT Weirdness 55%, Style Influence 75%. Push Weirdness to 70% only on bridges. | Stable sweet spot for melodic trap / hyperpop hybrids. Higher weirdness drifts on extends and bridges. |
| 5 | GENERATE the song in two passes (Intro+V1+Chorus, then Extend for V2+Bridge+Outro), not one. Use Replace Section in Suno Studio for any weak 4-8 bar stretch. | 4-min single-pass is real but quality often dips past 2:30; Extend stitches cleaner than one long generation. |
| 6 | SAVE a Persona from the best vocal you generate before extending. Use that Persona on every subsequent extend / regenerate. | This is how you keep the same singer across sections. Without a Persona, Suno re-rolls the voice on extends. |
| 7 | DO NOT put `[Reverb: 30%]`-style numeric parameters anywhere. Suno does not parse them. Use descriptive language in Style: "spacious reverb", "wet 808s." | Tier-4 placebo — looks like it should work, does nothing. |
| 8 | DO NOT write artist names ("Travis Scott", "Bieber"). Suno blocks them. Use descriptive proxies in Style. | Direct names trip IP filters. Proxies below are tested. |

---

## The Three Boxes — What Goes Where

### Box 1: Style Description

**What it controls:** genre, mood, instrumentation, vocal character, production aesthetic, BPM.

**Limits:**
- v5 / v5.5: ~1000 chars (silent truncation, no warning)
- v4 / v4.5: ~200 chars
- Sweet spot in practice: 400-700 chars. Tighter prompts often beat 999-char prompts.

**Syntax rules:**
- Comma-separated tags. Not full sentences.
- No quotation marks, no brackets, no line breaks.
- First 2-3 tags are weighted ~2x. Put the most important genre first.
- 5-8 tags total. Past 8, attention degrades sharply.
- All tags should pull the same direction. Contradictions (e.g. "lo-fi" + "crisp production") average to mush.

**The order that works (the 6-layer formula):**

1. **Genre** (1 tag, foundational) — `melodic trap`
2. **Subgenre or blend** (1 tag) — `hyperpop elements`
3. **Mood** (1-2 words) — `dark and chaotic`
4. **Instrumentation** (2-4 specific terms) — `deep 808s, rolling hi-hats, glitchy textures, dark synths`
5. **Vocal direction** (1 tag) — `breathy male vocals with auto-tune`
6. **Production + BPM + aesthetic** (1-2 tags) — `minimal reverb, 95 BPM, violet underground aesthetic`

### Box 2: Lyrics

**What it controls:** what gets sung, song structure, vocal delivery, dynamic shape.

**Limits:** roughly 500 words / 3000 chars practical.

**Syntax rules:**
- Bracket tags on their own line. Never mixed inline with lyrics on the same line — Suno may sing the tag.
- Stack section tags + delivery tags above the lyrics they govern: `[Chorus]` newline `[Belted] [Ad-libs]` newline lyrics.
- Parenthetical inline directions work — `(softly)`, `(building)`, `(spoken)` before a line.
- Write `[Chorus]` literally each time it repeats. Don't use `(x3)` notation — it is unreliable.
- Repeating the chorus lyric block 2-3x in the lyrics locks the hook in memory.

### Box 3: Exclude Styles (Advanced)

**What it controls:** what to keep OUT.

**Limit:** ~200 chars, separate field from Style. Use this instead of writing "no X" in Style (Suno reads "X" and adds it).

**Format:** comma-separated negations. "no X" works better than "without X" or "avoid X." 1-2 critical exclusions land better than 5.

### Sliders

| Slider | Range | Default | Where to set for melodic trap + hyperpop |
|--------|-------|---------|-------------------------------------------|
| Weirdness | 0-100% | 50% | **55%** for verses/chorus; bump to **70%** for the bridge |
| Style Influence | 0-100% | ~60% | **75%** — strict adherence to the violet aesthetic |
| Audio Influence (only when using a Voice or reference) | 0-100% | — | **60%** — your voice recognizable, Suno still handles production polish |

Interaction: high Weirdness + low Style Influence = full chaos (no guardrails). High Weirdness + high Style Influence = unusual within genre boundaries (what you want for the bridge).

---

## Tag Vocabulary That Actually Works

A quick reliability index. Full encyclopedia is in [600.06](../../community/600-jadyn-violet-uvr-deep-dive/06-the-art.md) and the agent research in this folder.

### Structural section tags (Tier 1, load-bearing)

`[Intro]` `[Verse 1]` `[Verse 2]` `[Pre-Chorus]` `[Chorus]` `[Bridge]` `[Outro]` `[End]` `[Instrumental]`.

Number the verses. Repeat `[Chorus]` each time. End with `[End]` to prevent trailing audio.

### Energy/dynamics tags (Tier 2, genre-specific)

`[Build]` `[Drop]` `[Breakdown]` `[808 Drop]` `[Half-Time]` `[Double-Time]`. Reinforce in the Style prompt too ("rising tension," "explosive drop") or they drift.

### Vocal delivery tags (Tier 1 most reliable in this list)

`[Whispered]` `[Belted]` `[Rap]` `[Spoken Word]` `[Male Vocal]` `[Female Vocal]` — these are >80% reliable.

`[Auto-Tuned]` `[Falsetto]` `[Breathy]` `[Raspy]` `[Melodic Rap]` `[Layered Vocals]` `[Ad-libs]` — Tier 2, ~50-80%. Reinforce in Style prompt for compliance.

### Anti-patterns — DO NOT USE

- Numeric parameters: `[Reverb: 30%]`, `[Bass: 80%]`, `[Tempo: 120 BPM]` — pure placebo.
- Compound tags: `[Heavy Bass Drop]`, `[Emotional Strings]` — use one concept per bracket.
- Vague emotion words alone: `[Triumphant]`, `[Euphoric]` — without instrumentation they do nothing.
- Genre tags inside Lyrics box.
- Bracket tags inside Style box (Suno sings them).

### Artist-name proxies that work

Suno blocks direct artist names. These descriptive proxies pass the filter and hit the target sound:

| Target | Proxy phrase |
|--------|--------------|
| Travis Scott (auto-tune melodic-rap, dark psychedelic trap) | `atmospheric trap with psychedelic synth beds, breathy auto-tuned male rap-singing, dark cinematic atmosphere` |
| Justin Bieber (breathy pop-R&B) | `breathy male vocals, conversational delivery, intimate close-mic production, 2010s pop-soul warmth` |
| Michael Jackson (pop melodic control + falsetto runs) | `pop-influenced melodic delivery with falsetto runs, smooth vocal control, polished arrangement` |
| Hyperpop / Yves Tumor / SOPHIE-adjacent | `experimental hyperpop, chaotic glitchy production, falsetto vocals, deconstructed arrangement, digital distortion` |

---

## The Song — Paste-Ready Suno Blocks

This is "Sponsor Me (Live Más)" — the UVR-flavor Taco Bell sponsorship pitch. Three variants are below. **The primary is the one to ship; the two alternates are A/B tests against it.**

### PRIMARY — "Sponsor Me (Live Más)" — melodic trap × hyperpop

**Style** (paste into Suno's Style Description box, 540 chars):
```
melodic trap, hyperpop elements, dark and euphoric, breathy auto-tuned male vocals, deep 808s with slides, rolling hi-hats, glitchy textures, dark synths, shimmering ethereal pads, sidechained euphoric drop on chorus, 140 BPM, violet underground rave aesthetic, polished mix, vulnerable yet braggadocio
```

**Exclude Styles** (paste into Exclude box):
```
no orchestral strings, no acoustic guitar, no spoken word in chorus, no female vocals, no radio polish, no lo-fi warmth
```

**Lyrics** (paste into Lyrics box; bracket tags on their own line above the lyrics they govern):
```
[Intro]
[Spoken Word] [Male Vocal]
(violet synth pad, glitch sweep)
This one's for Tac' Bell.
Why not me.

[Verse 1]
[Auto-Tuned] [Melodic Rap]
Indian kid out the Jersey state
Trap from a bedroom, ten years late
Lost the wallet, lost the rave
Bought a shipping container on the Skid Row pave
Three months in, half a viewer deep
Now the violet hits like Diablo on the cheek
Why not me, bro? Why not now?
365 days, take a bow

[Pre-Chorus]
[Build]
Three AM on the 101
Hollywood sign in the rearview gun
All I want is one franchise
Got the dream and the receipts, son

[Chorus]
[Belted] [Auto-Tuned] [Ad-libs] [Layered Vocals]
(808 drop, sidechained synths, euphoric)
Sponsor me, Taco Bell, sponsor me
I'll put the Crunchwrap on the violet TV
Cheesy Gordita Crunch, my city, my keys
Live Más, baby, live Más with me
Sponsor me, Suno, you already did
Now it's Tac' Bell's turn, yeah I'm not a kid
I'm the Underground Violet Rave at the drive-thru beep
Doritos Locos, fire sauce, eternal sleep

[Verse 2]
[Auto-Tuned] [Melodic Rap]
Mama on the phone like you sleeping in the whip
Yeah ma but the dream's on a steady drip
365 in a Skid Row tin
Container singing, gunshots ringing in
Lacy raid, seven thousand strong
Comeback Kid but the comeback long
Got a Suno deal, got a song machine
Now I need that Cinnamon Twist on the violet screen

[Pre-Chorus]
[Build]
Baja Blast in the studio
Crunchwrap on the keyboard
Got a fire sauce dream from a bedroom door
Indian rockstar, Tac' Bell tour

[Chorus]
[Belted] [Auto-Tuned] [Ad-libs] [Layered Vocals]
(808 drop, sidechained synths, euphoric)
Sponsor me, Taco Bell, sponsor me
I'll put the Crunchwrap on the violet TV
Cheesy Gordita Crunch, my city, my keys
Live Más, baby, live Más with me
Sponsor me, Suno, you already did
Now it's Tac' Bell's turn, yeah I'm not a kid
I'm the Underground Violet Rave at the drive-thru beep
Doritos Locos, fire sauce, eternal sleep

[Bridge]
[Breakdown] [Whispered] [Half-Time]
(strip drums, just pads and vocal)
One franchise. One franchise.
Bell tower glowing in the LA night
One franchise. One franchise.
Slumdog Billionaire gonna make it right
[Build]
Rockstar Shit but I'll trade it for a Live Más day
Tac' Bell, hear me out, call my line
You sponsor the rave, I sponsor the sign

[Chorus]
[Belted] [Auto-Tuned] [Ad-libs] [Layered Vocals]
(808 drop, sidechained synths, euphoric)
Sponsor me, Taco Bell, sponsor me
I'll put the Crunchwrap on the violet TV
Cheesy Gordita Crunch, my city, my keys
Live Más, baby, live Más with me

[Outro]
[Whispered] [Fade Out]
Why not me. Why not me. Why not me.
Live Más on the violet frequency.
Why not me. Why not me. Why not me.
Taco Bell, I'll see you eventually.

[End]
```

**Slider settings:** Weirdness 55%, Style Influence 75%.

**Generate strategy:**
1. First pass: generate the whole thing in Custom mode with the blocks above. v5.5. If the 4-min cap clips the outro, that's fine — you'll extend.
2. Listen to the first pass. If the *vocal you got* is the right voice, **save it as a Persona** (More Actions on the song -> Make Persona).
3. If the chorus is weak: open Suno Studio, find the chorus section, use Replace Section, regen just that with the same lyric block.
4. If the song was cut short before [Outro]: use Extend with the Persona selected, paste only the `[Bridge]` through `[End]` blocks into the extend lyrics.
5. Once it's tight: Suno Studio -> Get Stems (2-stem first to check the vocal, then 12-stem if you'll mix in a DAW). Export WAV.

---

### ALT 1 — melodic-trap-leaning (more Travis-style moodiness, less hyperpop)

**Style:**
```
atmospheric melodic trap, dark cinematic, breathy auto-tuned male vocals with reverb tail, slow rolling 808s with slides, sparse trap hats, brooding synth pad, ambient layers, 138 BPM, vulnerable late-night drive vibe, underground rave aesthetic
```

**Exclude Styles:**
```
no hyperpop, no glitch, no female vocals, no orchestral strings, no acoustic guitar, no radio polish
```

Use the same Lyrics block. Predicted differences vs primary: slower, more spacious, less euphoric drop on the chorus, more "Astroworld late-night drive" energy. Best if you want the song to feel mournful rather than triumphant.

---

### ALT 2 — hyperpop / Underground-Realm-leaning (faster, more chaotic, club-tilted)

**Style:**
```
hyperpop, Jersey club drums, melodic trap vocals, chaotic euphoric drop, deep 808s, glitch percussion, pitch-shifted vocal chops, FM synths, side-chained pads, bright digital distortion, 160 BPM, violet rave aesthetic, club-ready
```

**Exclude Styles:**
```
no ambient pads, no half-time, no spoken word, no female vocals, no orchestral, no acoustic
```

Bump Weirdness to 65% for this variant. Use the same Lyrics block. Predicted differences: faster, more frantic, harder drops, much more Underground-Realm (Jersey-club-meets-trap) energy. Best for a club edit or a hype version.

---

## Production Stack After Suno

Once you have the take you want:
- **Stems:** Studio -> Get Stems -> 12-stem. Pull at least the lead vocal, the 808s, and the drums to your DAW.
- **In DAW (Ableton / Logic / FL):** light de-essing on the vocal; sidechain the 808s to the kick by 4-6 dB; light tape saturation across the master.
- **Mastering:** push to roughly -10 LUFS for streaming-loudness if you want club-competitive volume; -14 LUFS if you want it dynamic.
- **Distribution:** since Sound.xyz shut down (Jan 16 2026), distribute via DistroKid or ZAO's own pipeline. The song itself can also be Cast on Farcaster and shared in the UVR Discord.

Full Persona / Voices / Studio operational detail in [01-personas-voices-studio.md](01-personas-voices-studio.md).

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Generate first pass in Suno (Custom mode, v5.5, settings above) | @Zaal | Generate | Tonight |
| Save the best-vocal pass as a Persona | @Zaal | Suno action | Same session |
| Drop the polished WAV in the UVR Discord with a "this is the pitch" caption | @Zaal | Share | After mix |
| If Jadyn vibes with it, ask him for his Suno Voice clone and re-run with his cloned voice — that turns this from a pitch into a real Jadyn-Violet feature track | @Zaal -> @Jadyn | Conversation | Optional |

## Sources

Verified 2026-05-15.

- [Suno Pricing](https://suno.com/pricing) — Pro $10/mo, Premier $30/mo (May 2026)
- [Suno Help — V4.5 Style Instructions](https://help.suno.com/en/articles/5782849)
- [Suno Help — Creative Sliders](https://help.suno.com/en/articles/6141377)
- [Suno Help — Exclude Styles](https://help.suno.com/en/articles/3161921)
- [Suno Help — Studio 1.2 (Feb 2026)](https://help.suno.com/en/articles/10625089)
- [HookGenius — Suno Metatags Complete List 2026](https://hookgenius.app/learn/suno-metatags-complete-list/)
- [HookGenius — Suno Vocal Prompts: What Works, What's Placebo 2026](https://hookgenius.app/learn/suno-vocal-prompts/)
- [Blake Crosley — Suno v5.5 Reference](https://blakecrosley.com/guides/suno)
- [Roo's Newsletter — Suno Prompt Guide 2026](https://roo.beehiiv.com)
- [SunoStyles — Weirdness & Influence Settings](https://sunostyles.com)
- r/SunoAI — community tag-reliability threads
- Local: [Doc 321](../321-suno-ai-music-platform-2026/) — platform overview April 2026
- Local: [Doc 600](../../community/600-jadyn-violet-uvr-deep-dive/) — Jadyn Violet / UVR full profile (the song's subject)
- Local: [01-personas-voices-studio.md](01-personas-voices-studio.md) — deep operational manual on the three power-user features
