# Doc 341: Music Theory for AI Music Generation Prompts

**Date:** 2026-04-11
**Category:** Music / AI Production
**Status:** Complete
**Purpose:** Practical music theory reference for writing better prompts in Suno, ElevenLabs Music API, and ACE-Step

---

## TL;DR

You do not need a music degree to write great AI music prompts. But knowing ~20% of music theory gives you ~80% more control over output. This doc covers exactly which theory concepts each platform understands and gives you copy-paste prompt fragments organized by mood.

---

## Part 1: Keys and Modes - The Single Biggest Lever

### Major vs Minor Keys

The key you specify is the single most impactful theory term you can add to a prompt. All three platforms (Suno, ElevenLabs, ACE-Step) reliably respond to key specifications.

| Key Type | Sound | When to Use | Prompt Fragment |
|----------|-------|-------------|-----------------|
| C Major | Bright, pure, simple | Happy pop, children's music, uplifting | `in C major` |
| G Major | Warm, open | Folk, country, acoustic singer-songwriter | `in G major` |
| D Major | Triumphant, bright | Rock anthems, celebration | `in D major` |
| A Minor | Melancholic, dark | Sad ballads, cinematic tension | `in A minor` |
| E Minor | Brooding, intense | Rock, metal, dramatic | `in E minor` |
| B-flat Major | Rich, warm | Jazz, R&B, soul | `in Bb major` |
| F Minor | Dark, heavy | Film scores, dramatic orchestral | `in F minor` |
| D Minor | Serious, somber | Classical drama, baroque | `in D minor` |

### The 7 Modes - Mood Modifiers

Modes are scales built on different degrees of the major scale. Each has a distinct emotional color. AI platforms respond best to mood descriptors rather than mode names directly, but knowing modes helps you describe what you want.

| Mode | Character | Defining Interval | Best For | Prompt Strategy |
|------|-----------|-------------------|----------|-----------------|
| **Ionian** (Major) | Bright, happy, resolved | Natural | Pop, country, anthems | `bright, uplifting, major key` |
| **Dorian** | Minor but hopeful, cool | Raised 6th | Jazz, funk, lo-fi, neo-soul | `cool, jazzy minor, hopeful melancholy` |
| **Phrygian** | Dark, exotic, dramatic | Flat 2nd | Flamenco, metal, Middle Eastern | `exotic, dark, Spanish-influenced, dramatic` |
| **Lydian** | Dreamy, floating, wonder | Sharp 4th | Film scores, ambient, prog | `dreamy, floating, ethereal, wonderous` |
| **Mixolydian** | Bluesy, relaxed, groovy | Flat 7th | Blues, rock, funk, jam band | `bluesy, laid-back, groovy, rock swagger` |
| **Aeolian** (Natural Minor) | Sad, somber, dark | Natural minor | Ballads, emo, gothic | `dark, sad, somber, melancholic` |
| **Locrian** | Unstable, tense, dissonant | Flat 2nd + flat 5th | Horror, experimental | `unsettling, unstable, dissonant` |

**Practical tip:** Suno and ElevenLabs respond better to the mood words than mode names. ACE-Step 1.5 with thinking mode enabled will infer the appropriate mode from your description. Write `cool jazz with a hopeful minor feel` (Dorian) rather than `Dorian mode`.

---

## Part 2: BPM Ranges by Genre

All three platforms respond to exact BPM numbers. ACE-Step has a dedicated BPM parameter (do not put BPM in the caption - use the metadata field). Suno and ElevenLabs accept BPM in the text prompt.

### Complete BPM Reference

| Genre | BPM Range | Sweet Spot | Notes |
|-------|-----------|------------|-------|
| **Lo-fi / Chillhop** | 70-90 | 80 | Relaxed, mellow, sampled feel |
| **Reggae / Dub** | 60-90 | 75 | Syncopated, laid-back |
| **Hip-Hop (Classic)** | 85-100 | 90 | Boom-bap, head-nod tempo |
| **Trap** | 60-75 (half-time) | 140 (double-time) | Slow feel but fast hi-hats |
| **R&B / Neo-Soul** | 65-85 | 75 | Smooth, groove-oriented |
| **Pop** | 100-130 | 120 | Radio-friendly, danceable |
| **Rock** | 110-140 | 120 | Driving guitars, energetic |
| **Punk** | 150-180 | 165 | Fast, aggressive, raw |
| **Funk** | 100-130 | 110 | Groove-heavy, syncopated |
| **Jazz (Ballad)** | 60-80 | 70 | Slow, expressive, rubato |
| **Jazz (Swing)** | 110-160 | 140 | Medium to up-tempo swing |
| **Jazz (Bebop)** | 160-220 | 180 | Fast, virtuosic |
| **House (Deep)** | 118-125 | 122 | Steady four-on-the-floor |
| **House (Tech)** | 122-130 | 126 | Harder, more percussive |
| **Techno** | 125-140 | 130 | Mechanical, hypnotic |
| **Trance** | 128-150 | 138 | Uplifting, euphoric |
| **Psytrance** | 140-150 | 145 | Trippy, relentless |
| **Dubstep** | 135-145 | 140 | Half-time feel, heavy bass |
| **Drum & Bass / Jungle** | 160-180 | 174 | Fast breakbeats |
| **Hardcore / Gabber** | 160-200+ | 180 | Aggressive, pounding |
| **Country** | 100-130 | 115 | Storytelling pace |
| **Bossa Nova** | 110-140 | 120 | Relaxed Brazilian feel |
| **Afrobeat** | 100-130 | 115 | Polyrhythmic, groovy |
| **Classical (Adagio)** | 55-75 | 65 | Slow, contemplative |
| **Classical (Allegro)** | 120-160 | 140 | Fast, lively |
| **Metal** | 100-180 | 140 | Varies wildly by sub-genre |

**Platform note:** ACE-Step warns that extreme values (below 60 or above 180) have less training data and produce unstable results. Stick to 60-180 for reliability.

### Italian Tempo Terms (Also Work in Prompts)

These classical terms are understood by all three platforms:

| Term | BPM | Feel |
|------|-----|------|
| Grave | 25-45 | Very slow, solemn |
| Largo | 40-60 | Broad, slow |
| Adagio | 55-75 | Slow, expressive |
| Andante | 73-77 | Walking pace |
| Moderato | 86-97 | Moderate |
| Allegretto | 98-109 | Moderately fast |
| Allegro | 109-132 | Fast, lively |
| Vivace | 132-140 | Very fast, vivid |
| Presto | 168-200 | Extremely fast |

---

## Part 3: Time Signatures

### What Each Platform Supports

- **ACE-Step 1.5:** Dedicated `timesignature` metadata field. Full support.
- **ElevenLabs:** Understands time signature in text prompts (e.g., `in 6/8 time`).
- **Suno:** Responds to time signature descriptions but less reliably than BPM/key.

### When to Use Each

| Time Signature | Feel | Use For | Prompt Fragment |
|---------------|------|---------|-----------------|
| **4/4** | Straight, driving, universal | 95% of pop, rock, hip-hop, EDM | Default - often no need to specify |
| **3/4** | Waltz, flowing, elegant | Waltzes, some ballads, folk, country | `3/4 time, waltz feel` |
| **6/8** | Swaying, compound, rolling | Irish folk, slow rock ballads, gospel | `6/8 time, swaying compound feel` |
| **2/4** | Marching, polka | Marches, polkas, some Latin | `2/4 march time` |
| **5/4** | Asymmetric, off-kilter | Progressive rock, jazz, film scores | `5/4 time, asymmetric groove` |
| **7/8** | Irregular, driving oddness | Prog, Balkan folk, math rock | `7/8 time, irregular meter` |
| **12/8** | Slow blues shuffle | Blues, doo-wop, gospel | `12/8 slow blues shuffle` |

**3/4 vs 6/8 - the key difference:** 3/4 has three beats per bar (ONE-two-three). 6/8 has two beats per bar, each divided into three (ONE-two-three-FOUR-five-six). 3/4 waltzes. 6/8 sways.

**Practical tip:** If you want something that just sounds "different" without getting too weird, try `6/8 time` - it adds a natural swaying quality that stands out from the 4/4 default.

---

## Part 4: Chord Progressions in Prompts

### Do AI Tools Understand Roman Numerals?

**Short answer:** Not directly as "I-V-vi-IV" in most cases. But they absolutely understand the emotional result when you describe it.

**ACE-Step 1.5** with thinking mode enabled can infer chord progressions from style descriptions. The others respond to genre-based descriptions that imply specific progressions.

### The Progressions You Need to Know

| Name | Numbers | Nashville | Sound | Famous Examples | Prompt Strategy |
|------|---------|-----------|-------|-----------------|-----------------|
| **Pop Canon** | I-V-vi-IV | 1-5-6m-4 | Uplifting, anthemic | "Let It Be," "Someone Like You" | `uplifting pop progression, anthemic` |
| **50s Doo-Wop** | I-vi-IV-V | 1-6m-4-5 | Nostalgic, sweet | "Stand By Me," "Earth Angel" | `classic 50s progression, nostalgic` |
| **Sad Pop** | vi-IV-I-V | 6m-4-1-5 | Emotional, bittersweet | "Numb," "Love the Way You Lie" | `emotional, bittersweet progression` |
| **Blues/Rock** | I-IV-V | 1-4-5 | Simple, powerful, driving | "La Bamba," "Twist and Shout" | `simple three-chord rock progression` |
| **Jazz Standard** | ii-V-I | 2m-5-1 | Sophisticated, smooth | "Take the A Train" | `jazz ii-V-I, sophisticated harmony` |
| **Minor Blues** | i-iv-v | 1m-4m-5m | Dark, gritty | "Hit the Road Jack" | `minor blues progression, gritty` |
| **Andalusian Cadence** | i-VII-VI-V | 1m-b7-b6-5 | Spanish, dramatic | "Hit the Road Jack" (variant) | `descending minor, Spanish feel` |
| **Axis of Awesome** | I-V-vi-IV | 1-5-6m-4 | Literally hundreds of hits | Four Chords (comedy) | `four chord pop song` |
| **Neo-Soul** | ii-V-I (extended) | 2m-5-1 | Warm, complex | D'Angelo, Erykah Badu | `neo-soul, extended jazz chords, 9ths and 11ths` |

### What Actually Works in Prompts

Instead of specifying chord numbers, describe the harmonic feeling:

- **Want I-V-vi-IV?** Write: `uplifting major key progression with an emotional dip before resolving`
- **Want ii-V-I?** Write: `smooth jazz harmony, tension and resolution`
- **Want i-VII-VI-V?** Write: `descending minor progression, Spanish or flamenco influenced`
- **Want 12-bar blues?** Write: `12-bar blues form` (this one actually works literally on all platforms)

---

## Part 5: Song Structure - Bar Counts

### Standard Section Lengths

| Section | Typical Bars | Common Variants | Purpose |
|---------|-------------|-----------------|---------|
| **Intro** | 4-8 | 2, 16 (dance music) | Set the mood, establish key/tempo |
| **Verse** | 8-16 | 12 (blues) | Tell the story, lower energy than chorus |
| **Pre-Chorus** | 4 | 2, 8 | Build tension, transition to chorus |
| **Chorus** | 8 | 16 (extended) | The hook, highest energy, most memorable |
| **Bridge** | 8 | 4 | Contrast, new perspective, "Middle 8" |
| **Breakdown** | 8 | 4, 16 | Strip back, build anticipation |
| **Outro** | 4-8 | Fade out, cold end | Wind down or hard stop |
| **Drop** (EDM) | 8-16 | 32 | Peak energy after buildup |

### Common Song Forms

| Form | Structure | Total Bars | Genre |
|------|-----------|------------|-------|
| **Pop Standard** | Intro-V-PC-C-V-PC-C-B-C-Outro | ~80 | Pop, rock |
| **AABA (32-bar)** | A(8)-A(8)-B(8)-A(8) | 32 | Jazz standards, old pop |
| **Verse-Chorus** | V-C-V-C-B-C | ~64 | Rock, country |
| **12-Bar Blues** | I(4)-IV(2)-I(2)-V(1)-IV(1)-I(2) | 12 per cycle | Blues |
| **EDM Build-Drop** | Intro-Build-Drop-Break-Build-Drop-Outro | ~128 | House, trance |

### Using Structure Tags in Prompts

All three platforms support structure markers in lyrics:

```
[Intro]
[Verse 1]
Lyrics here...
[Pre-Chorus]
Lyrics here...
[Chorus]
Lyrics here...
[Bridge]
Lyrics here...
```

**ACE-Step bonus:** You can add descriptors to tags: `[Chorus - anthemic]`, `[Verse - whispered]`, `[Bridge - building intensity]`.

---

## Part 6: Rhythm Patterns

### Core Rhythm Feels

| Feel | Description | Genres | Prompt Fragment |
|------|-------------|--------|-----------------|
| **Straight** | Even subdivisions, 1:1 ratio | Pop, rock, EDM, metal | Default - no need to specify |
| **Swing** | Uneven subdivisions, ~2:1 ratio | Jazz, blues, old-school hip-hop | `swing feel, swung eighths` |
| **Shuffle** | Triplet-based, rigid swing | Blues, boogie, some rock | `shuffle rhythm, triplet feel` |
| **Syncopated** | Accents on weak beats/offbeats | Funk, reggae, Latin, hip-hop | `syncopated groove, offbeat accents` |
| **Four-on-the-floor** | Kick on every beat | House, disco, techno | `four-on-the-floor kick pattern` |
| **Half-time** | Snare on beat 3 instead of 2&4 | Trap, dubstep, some rock | `half-time feel, spacious groove` |
| **Double-time** | Feel twice as fast as written tempo | Punk, drill, breakbeats | `double-time feel, rapid energy` |

### Genre-Specific Rhythm Terminology

**Trap/Hip-Hop:**
- `rapid hi-hat rolls` - 32nd-note hi-hat patterns
- `triplet hi-hats` - the signature trap rhythm
- `808 bass slides` - pitched bass with glides between notes
- `sparse kick pattern` - kicks that leave space for the 808
- `hi-hat stutters` - rhythmic interruptions in the hi-hat pattern

**Latin:**
- `clave rhythm` - the foundational 3-2 or 2-3 pattern
- `tresillo` - the three-note rhythmic cell behind most Latin music
- `bossa nova rhythm` - syncopated guitar pattern

**Funk:**
- `chicken scratch guitar` - muted strumming on offbeats
- `slap bass groove` - percussive bass technique
- `tight pocket` - locked-in, groove-heavy rhythm section

---

## Part 7: Instrument Ranges and Voicings

### Instrument Descriptors That Work in Prompts

Rather than specifying exact ranges (AI tools do not understand "play in the third octave"), use these qualitative descriptors:

| Instrument | Useful Descriptors | Example Prompt Fragment |
|------------|-------------------|------------------------|
| **Piano** | warm Rhodes, bright acoustic, honky-tonk, jazzy keys | `warm Rhodes piano chords` |
| **Guitar** | clean electric, overdriven, fingerpicked acoustic, nylon | `fingerpicked nylon guitar, intimate` |
| **Bass** | deep sub bass, punchy, walking bass, slap bass, 808 | `deep 808 sub bass, sustained decay` |
| **Strings** | lush, intimate, chamber, full orchestral, pizzicato | `lush string section, cinematic swells` |
| **Synth** | analog, bright arps, warm pads, detuned, saw wave | `warm analog synth pads, detuned` |
| **Drums** | tight, roomy, live, programmed, electronic, brushes | `live drums with brushes, jazz kit` |
| **Brass** | muted trumpet, full brass section, solo sax, warm horn | `muted trumpet, smoky jazz club` |
| **Voice** | breathy, belted, falsetto, raspy, whispered, raw | `breathy female vocals, intimate` |

### Tuning and Texture Specifications

ElevenLabs specifically responds to:
- Alternate tunings: `DADGAD tuning` (works)
- Performance texture: `finger slides and fret noise for authenticity`
- Isolation: `solo electric guitar` (prefix "solo" for isolated instrument)
- A cappella: `a cappella vocals` for unaccompanied singing
- Multi-voice: `two singers harmonizing in C`

---

## Part 8: Dynamics Terminology

### Do Classical Dynamics Terms Work?

**Partially.** ElevenLabs and ACE-Step respond to dynamics-related descriptors. Suno responds better to emotional/energy descriptors than Italian dynamics terms.

| Term | Meaning | Does It Work? | Better Prompt Alternative |
|------|---------|---------------|---------------------------|
| Pianissimo (pp) | Very soft | Sometimes | `very soft, whispered, delicate` |
| Piano (p) | Soft | Sometimes | `soft, gentle, quiet` |
| Mezzo-piano (mp) | Moderately soft | Rarely | `moderate, understated` |
| Mezzo-forte (mf) | Moderately loud | Rarely | `moderate energy` |
| Forte (f) | Loud | Sometimes | `loud, powerful, bold` |
| Fortissimo (ff) | Very loud | Sometimes | `very loud, explosive, massive` |
| **Crescendo** | Gradually louder | **Yes - all platforms** | `building, swelling, crescendo` |
| **Decrescendo** | Gradually softer | **Yes - most platforms** | `fading, dying down, decrescendo` |
| Sforzando (sfz) | Sudden accent | Rarely | `sudden accent, punchy hit` |
| Staccato | Short, detached | Sometimes | `short, choppy, staccato notes` |
| Legato | Smooth, connected | Sometimes | `smooth, flowing, connected` |

**Key finding:** "Crescendo," "building," and "swelling" are the most reliably understood dynamics terms across all platforms. Use these freely.

### Dynamics in Section Tags (ACE-Step)

```
[Verse - soft, intimate]
[Pre-Chorus - building, swelling]
[Chorus - explosive, powerful]
[Bridge - stripped back, quiet]
[Final Chorus - massive, anthemic]
```

---

## Part 9: Production Terminology That Works

### Tested and Confirmed Working Terms

| Category | Terms That Work | Example Fragment |
|----------|----------------|------------------|
| **Space/Reverb** | reverb-heavy, dry, cavernous, intimate, roomy, cathedral reverb | `reverb-heavy vocals, cavernous space` |
| **Echo/Delay** | echo, delay, slapback delay, dub delay | `dub delay on vocals, spacious` |
| **Distortion** | distorted, overdriven, fuzz, crunchy, saturated, clipped | `saturated, warm analog distortion` |
| **Compression** | punchy, squashed, compressed, sidechain, pumping | `sidechained pads, pumping bass` |
| **Lo-Fi** | lo-fi, vinyl crackle, tape hiss, warped, degraded, dusty | `lo-fi with vinyl crackle and tape warmth` |
| **Hi-Fi** | polished, pristine, crystal clear, studio quality, crisp | `polished, crystal clear production` |
| **Warmth** | warm, analog, tube, tape-saturated | `warm analog production, tape-saturated` |
| **Coldness** | sterile, digital, clinical, precise | `sterile, precise digital production` |
| **Width** | wide stereo, mono, panned, spatial, immersive | `wide stereo mix, spatial depth` |
| **Grit** | gritty, raw, rough, unpolished, garage | `raw, garage-style production` |

### Production Eras as Shortcuts

Instead of listing effects, reference an era:

| Era Descriptor | What It Implies | Prompt Fragment |
|---------------|-----------------|-----------------|
| `60s Motown` | Warm, compressed, mono-ish, reverb plates | `60s Motown production, warm and tight` |
| `70s analog` | Tape warmth, wide stereo, natural | `70s analog recording, warm tape` |
| `80s production` | Gated reverb, synth-heavy, bright | `80s production, gated drums, bright synths` |
| `90s grunge` | Raw, distorted, lo-fi, garage | `90s grunge production, raw and dirty` |
| `2000s pop` | Loud, compressed, auto-tuned, polished | `2000s pop production, polished and bright` |
| `modern trap` | 808-heavy, sparse, dark, distorted | `modern trap production, heavy 808s` |
| `bedroom pop` | Lo-fi, intimate, imperfect, warm | `bedroom-produced, intimate and imperfect` |

### Exclusion Terms

Tell the AI what NOT to include:
- `no four-on-the-floor kick`
- `no reverb tails`
- `no autotune`
- `instrumental only`
- `no drums`
- `no guitar`

---

## Part 10: Harmonic Concepts - Tension and Resolution

### Terms That Guide Harmony

| Concept | Description | Prompt Fragment |
|---------|-------------|-----------------|
| **Consonance** | Stable, resolved, pleasant | `consonant, resolved, warm harmonies` |
| **Dissonance** | Tense, unresolved, clashing | `dissonant, tense, unresolved harmonies` |
| **Tension-release** | Build then resolve | `harmonic tension building to resolution` |
| **Suspension** | Held note creating tension | `suspended chords, unresolved feel` |
| **Chromaticism** | Notes outside the key | `chromatic movement, unexpected notes` |
| **Pedal tone** | Sustained bass note | `drone bass, pedal tone underneath` |
| **Modal mixture** | Borrowing chords from parallel key | `bittersweet, major-minor shifts` |
| **Tritone** | The "devil's interval" | `dark, tritone tension, unsettling` |

### Extended Chords for Color

| Chord Type | Sound | Genre Context | Prompt Fragment |
|------------|-------|---------------|-----------------|
| 7th chords | Jazzy, unresolved | Jazz, R&B, neo-soul | `seventh chords, jazzy voicings` |
| 9th chords | Open, colorful | Neo-soul, gospel, jazz | `extended chords, 9ths, lush harmony` |
| sus2/sus4 | Ambiguous, floating | Ambient, post-rock, indie | `suspended chords, floating, ambiguous` |
| add9 | Bright, open | Pop, indie, worship | `bright open chords, add9 voicings` |
| dim/aug | Tense, unstable | Jazz, film scores, classical | `diminished passing chords, tension` |

---

## Part 11: Melodic Contour

### Shapes and Their Emotions

| Contour | Description | Emotional Effect | Prompt Fragment |
|---------|-------------|-----------------|-----------------|
| **Ascending** | Melody moves upward | Uplift, hope, building excitement | `rising melody, building, uplifting` |
| **Descending** | Melody moves downward | Resolution, sadness, winding down | `descending melody, resolving, melancholic` |
| **Arch** | Up then down | Completeness, journey, arrival | `arching melody, rises and falls` |
| **Inverted arch** | Down then up | Searching, uncertainty to resolve | `melody dips then lifts` |
| **Stationary** | Stays on same pitch | Tension, monotony, chant-like | `monotone, chant-like, repetitive melody` |
| **Wave/undulating** | Up and down repeatedly | Flow, organic, breathing | `flowing, undulating melody` |

### Interval Jumps

| Jump Size | Sound | Prompt Fragment |
|-----------|-------|-----------------|
| Steps (2nds) | Smooth, singable, pop | `smooth stepwise melody, singable` |
| Small leaps (3rds) | Warm, folk-like | `gentle melodic leaps` |
| Large leaps (5ths, octaves) | Dramatic, anthemic | `dramatic melodic leaps, wide intervals` |
| Chromatic steps | Sneaky, jazzy, tense | `chromatic melody, jazz-influenced` |

---

## Part 12: The Nashville Number System

### Is It Useful for AI Prompting?

**Not directly** - no AI music platform accepts Nashville numbers as input. But the Nashville Number System is invaluable for *thinking* about music before you prompt.

### How It Works

Replace chord letters with numbers based on scale degree:

| Degree | In Key of C | In Key of G | In Key of D |
|--------|-------------|-------------|-------------|
| 1 | C | G | D |
| 2m | Dm | Am | Em |
| 3m | Em | Bm | F#m |
| 4 | F | C | G |
| 5 | G | D | A |
| 6m | Am | Em | Bm |
| 7dim | Bdim | F#dim | C#dim |

### Why It Matters for Prompters

When you think in numbers instead of letters, you can:

1. **Describe progressions without specifying a key** - "I want a 1-5-6m-4" works in any key
2. **Communicate with other musicians** about what the AI made
3. **Transpose instantly** - if the AI generates in the wrong key, you know the structure stays the same
4. **Recognize patterns** - once you hear that most pop is 1-5-6m-4, you can ask for variations

### Translation Table for Prompts

| You Think (Nashville) | You Write (Prompt) |
|-----------------------|-------------------|
| 1-5-6m-4 | `uplifting pop chord progression` |
| 1-4-5 | `classic three-chord rock` |
| 6m-4-1-5 | `emotional, starts minor, bittersweet` |
| 2m-5-1 | `jazz harmony, smooth tension and resolution` |
| 1-6m-4-5 | `nostalgic, retro pop progression` |
| 1-b7-4-1 | `bluesy, rock swagger, Mixolydian` |

---

## Part 13: Genre-Specific Theory Cheat Sheets

### Hip-Hop / Trap

| Element | Theory | Prompt Terms |
|---------|--------|-------------|
| Tempo | 60-75 BPM half-time (felt as 130-150) | `140 BPM, half-time feel` |
| Hi-hats | Triplet rolls, 32nd-note stutters | `rapid triplet hi-hats, hi-hat rolls and stutters` |
| Bass | 808 sub-bass, pitched, sustained decay | `deep 808 bass, sustained, sub-heavy` |
| Keys | Minor keys dominate (Am, Cm, Em) | `dark minor key` |
| Harmony | Simple - often 2-4 chord loops | `minimal dark chord loop` |
| Drums | Sparse kick, hard snare/clap | `sparse, punchy trap drums` |
| Melody | Pentatonic, often minor pentatonic | `dark pentatonic melody, atmospheric` |

### Pop

| Element | Theory | Prompt Terms |
|---------|--------|-------------|
| Tempo | 100-130 BPM | `120 BPM, radio-ready` |
| Progression | I-V-vi-IV dominates | `four-chord pop progression` |
| Keys | C, G, D major; Am, Em for sad pop | `bright major key` or `emotional minor` |
| Structure | Verse-PreChorus-Chorus, hook-driven | Standard - no need to specify |
| Vocals | Center stage, catchy melody | `catchy vocal melody, hook-driven` |
| Production | Polished, compressed, bright | `polished pop production` |

### Jazz

| Element | Theory | Prompt Terms |
|---------|--------|-------------|
| Tempo | 60-200+ BPM (varies by style) | Specify: `medium swing 140 BPM` |
| Progression | ii-V-I is foundational | `jazz harmony, ii-V-I, sophisticated chords` |
| Chords | 7ths, 9ths, 11ths, 13ths standard | `extended jazz chords, rich voicings` |
| Rhythm | Swing feel essential | `swing feel, swung eighths` |
| Keys | Bb, Eb, F common (horn-friendly) | `in Bb, jazz standard feel` |
| Improv | Solo sections | `jazz solo section, improvised feel` |
| Modes | Dorian over minor, Mixolydian over dom7 | `cool jazz, modal harmony` |

### Rock

| Element | Theory | Prompt Terms |
|---------|--------|-------------|
| Tempo | 110-140 BPM | `driving rock tempo, 130 BPM` |
| Progression | I-IV-V, I-bVII-IV (power chords) | `power chord progression, driving` |
| Keys | E, A, D, G (guitar-friendly) | `in E, guitar-driven` |
| Rhythm | Straight eighths, driving | `straight rock beat, driving` |
| Guitar | Distorted, power chords, riffs | `heavy distorted guitar riffs` |
| Drums | Strong kick-snare pattern, crashes | `hard-hitting rock drums` |

### Electronic / EDM

| Element | Theory | Prompt Terms |
|---------|--------|-------------|
| Tempo | 120-150 BPM (varies by sub-genre) | Specify exact: `128 BPM` |
| Rhythm | Four-on-the-floor kick | `four-on-the-floor, steady kick` |
| Bass | Sidechain compression, sub bass | `sidechained bass, pumping` |
| Build | 16-32 bar builds to drop | `building to a massive drop` |
| Keys | Minor keys dominate | `dark minor key, atmospheric` |
| Synths | Saw leads, supersaw, arps | `bright saw synth leads, supersaw stacks` |
| FX | Risers, sweeps, impacts | `tension risers, sweep effects` |

---

## Part 14: How Much Theory Do You Actually Need?

### The 80/20 of Music Theory for AI Prompting

**Must Know (covers 80% of use cases):**

1. **Key** - major = happy, minor = sad. Specify it every time.
2. **BPM** - know the range for your genre. Specify it every time.
3. **Genre name** - the single most efficient prompt term. "Lo-fi hip-hop" implies tempo, rhythm, instruments, production, and harmonic style all at once.
4. **Mood words** - melancholic, triumphant, ethereal, aggressive, intimate. These steer everything.
5. **Basic structure tags** - [Verse], [Chorus], [Bridge]. Use them in lyrics.

**Good to Know (gets you to 95%):**

6. **Rhythm feel** - straight vs swing vs shuffle. Specify when it matters.
7. **Production era/style** - "80s production" or "lo-fi bedroom" implies a whole sonic world.
8. **Instrument descriptors** - "warm Rhodes" vs just "piano" gives much more control.
9. **Dynamics words** - "building," "crescendo," "stripped back," "explosive."
10. **Basic progressions** - knowing that pop = I-V-vi-IV helps you describe what you want.

**Nice to Know (the final 5%, diminishing returns):**

11. Modes and their characteristics
12. Extended chord types (9ths, 11ths)
13. Nashville Number System
14. Time signatures beyond 4/4
15. Melodic contour terminology
16. Specific rhythm pattern names (clave, tresillo)

### Overkill for AI Prompting (Skip These)

- Counterpoint rules
- Voice leading principles
- Harmonic analysis (Roman numeral analysis of existing pieces)
- Serial/twelve-tone theory
- Advanced orchestration (instrument ranges, transpositions)
- Figured bass
- Schenkerian analysis

These are valuable for human musicians and composers but AI models do not parse this level of theoretical specificity.

---

## Part 15: Quick Reference Cards

### "I Want This Mood" Prompt Builder

**HAPPY / UPLIFTING**
```
bright, uplifting, major key, in G major, 120 BPM, four-chord pop progression,
warm acoustic guitar, catchy vocal melody, polished production
```

**SAD / MELANCHOLIC**
```
melancholic, minor key, in A minor, 75 BPM, descending chord progression,
soft piano, breathy vocals, intimate, reverb-heavy, stripped back
```

**DARK / INTENSE**
```
dark, aggressive, in E minor, 140 BPM, heavy distorted guitars, pounding drums,
dissonant, tense, building intensity, raw production
```

**DREAMY / ETHEREAL**
```
ethereal, floating, dreamy, in D major, 95 BPM, warm synth pads, reverb-heavy,
ambient, shimmering, suspended chords, gentle
```

**CHILL / LO-FI**
```
lo-fi, chill, relaxed, in C minor, 80 BPM, warm Rhodes piano, vinyl crackle,
tape hiss, jazzy chords, mellow, bedroom-produced
```

**EPIC / CINEMATIC**
```
cinematic, epic, orchestral, in D minor, 100 BPM, full strings, timpani,
brass swells, building crescendo, massive, triumphant
```

**GROOVY / FUNKY**
```
funky, groovy, in E, 110 BPM, slap bass, wah-wah guitar, tight drums,
syncopated groove, offbeat rhythms, warm analog production
```

**NOSTALGIC / RETRO**
```
nostalgic, retro, warm, 100 BPM, vintage production, analog warmth,
classic chord progression, soft reverb, dreamy
```

**AGGRESSIVE / HYPE**
```
aggressive, high-energy, in D minor, 150 BPM, distorted 808 bass,
rapid hi-hat rolls, punchy drums, dark, intense, trap
```

**PEACEFUL / AMBIENT**
```
ambient, peaceful, meditative, in C major, 70 BPM, soft piano,
gentle strings, wide reverb, spacious, minimal, calming
```

---

## Platform-Specific Tips

### Suno

- **Style prompt:** 4-7 descriptors is the sweet spot. Too many = muddy results.
- **What works best:** Genre + mood + 2-3 instrument/production terms
- **Key/BPM:** Put in the style prompt, not lyrics
- **Lyrics:** 6-10 syllables per line for natural vocal fitting
- **Avoid:** Artist names (use era descriptors instead), overly technical jargon
- **Structure:** Use [Verse], [Chorus], [Bridge] tags in lyrics

### ElevenLabs Music API

- **Concise beats verbose:** "rainy day jazz cafe" often outperforms a paragraph
- **BPM + Key:** Reliably followed. Include them.
- **Time signatures:** Understood (e.g., "in 6/8 time")
- **Vocal direction:** "solo," "a cappella," "two singers harmonizing" all work
- **Timing control:** `lyrics begin at 15 seconds`, `instrumental only after 1:45`
- **Composition plans:** Available for section-by-section control (advanced)

### ACE-Step 1.5

- **Caption vs Metadata:** NEVER put BPM, key, or time signature in the caption. Use dedicated metadata fields.
- **Caption focus:** Style, emotion, instruments, timbre, production characteristics
- **Thinking mode:** Enable it - the LM will infer BPM, key, time signature from your description
- **Lyrics:** Support 50+ languages. Use structure tags.
- **BPM range:** Stick to 60-180 for stable results
- **Descriptors on tags:** `[Chorus - anthemic]`, `[Verse - whispered]` - unique to ACE-Step

---

## Sources

### AI Music Platforms
- [Suno AI Prompt Guide - Music Theory Cheat Sheet (Solfej)](https://www.solfej.io/blog/suno-ai-prompt-guide/)
- [Complete List of Prompts & Styles for Suno AI (Travis Nicholson)](https://travisnicholson.medium.com/complete-list-of-prompts-styles-for-suno-ai-music-2024-33ecee85f180)
- [Suno AI Prompt Guide - Limits, Tips & Examples (MusicSmith)](https://musicsmith.ai/blog/ai-music-generation-prompts-best-practices)
- [Suno Prompts - 100+ Examples (Musci.io)](https://musci.io/blog/suno-prompts)
- [ElevenLabs Music Best Practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices)
- [ElevenLabs Music Prompt Guide (fal.ai)](https://fal.ai/learn/biz/eleven-music-prompt-guide)
- [ACE-Step 1.5 Musicians Guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md)
- [ACE-Step 1.5 Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- [ACE-Step 1.5 Complete 2026 Guide (DEV Community)](https://dev.to/czmilo/ace-step-15-the-complete-2026-guide-to-open-source-ai-music-generation-522e)

### Music Theory
- [BPM by Music Genre (TapTempoBPM)](https://taptempobpm.com/bpm-by-music-genre/)
- [Common Chord Progressions Explained (MakeMySongBook)](https://www.makemysongbook.com/blog/chord-progressions-explained)
- [Common Chord Progressions (Berklee Online)](https://online.berklee.edu/takenote/common-chord-progressions-and-how-to-make-them-your-own/)
- [Musical Modes Explained (MakeMySongBook)](https://www.makemysongbook.com/blog/music-modes-explained)
- [The Many Moods of Musical Modes (Musical U)](https://www.musical-u.com/learn/the-many-moods-of-musical-modes/)
- [Nashville Number System (Sweetwater)](https://www.sweetwater.com/insync/the-nashville-number-system-demystified/)
- [Song Structure (Native Instruments)](https://blog.native-instruments.com/song-structure-101/)
- [Melodic Contour (Secretsofsongwriting)](https://www.secretsofsongwriting.com/2022/06/15/what-melodic-direction-does-to-songs-emotional-energy/)
- [Syncopation in Suno AI (Jack Righteous)](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-ai-syncopated-prompt-guide)
- [Swing and Syncopation (iZotope)](https://www.izotope.com/en/learn/swing-and-syncopation-understanding-daw-groove)
- [Trap Hi-Hat Patterns (LANDR)](https://blog.landr.com/trap-hats/)
- [808 Drums Explained (Orphiq)](https://orphiq.com/resources/808-drums-explained)
