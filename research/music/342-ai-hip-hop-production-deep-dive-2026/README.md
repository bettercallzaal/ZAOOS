# Doc 342: AI Hip-Hop Production Deep Dive - Complete Guide for Rappers (2026)

**Created:** 2026-04-11
**Category:** Music / Hip-Hop / AI Production
**Use Case:** A rapper/musician making hip-hop and rap music using AI generation (Suno, ElevenLabs, ACE-Step) with their own voice clone
**Related:** Doc 313 (AI Music Production Workflows), Doc 321 (Suno Deep Dive), Doc 322 (Kits.AI Voice Conversion), Doc 323 (Mixing & Mastering), Doc 324 (ACE-Step Deep Dive), Doc 334 (Prompt Engineering Masterclass)

---

## Table of Contents

1. [808 Bass in AI-Generated Beats](#1-808-bass-in-ai-generated-beats)
2. [Trap Production Elements](#2-trap-production-elements)
3. [Subgenre Prompting Strategies](#3-subgenre-prompting-strategies)
4. [Sample-Based Hip-Hop with AI](#4-sample-based-hip-hop-with-ai)
5. [Modern Artist-Style Production](#5-modern-artist-style-production)
6. [Rap Vocal Processing Chain](#6-rap-vocal-processing-chain)
7. [Auto-Tune and Pitch Correction for AI Vocals](#7-auto-tune-and-pitch-correction-for-ai-vocals)
8. [Beat Structure for Hip-Hop](#8-beat-structure-for-hip-hop)
9. [Recording Rap Vocals Over AI Beats](#9-recording-rap-vocals-over-ai-beats)
10. [Flow Patterns and Syllable Density](#10-flow-patterns-and-syllable-density)
11. [Ad-Libs in AI Hip-Hop](#11-ad-libs-in-ai-hip-hop)
12. [Producer Tags with AI](#12-producer-tags-with-ai)
13. [Mixing Hip-Hop](#13-mixing-hip-hop)
14. [Reference Tracks as AI Templates](#14-reference-tracks-as-ai-templates)
15. [Hip-Hop Community Attitude Toward AI](#15-hip-hop-community-attitude-toward-ai)
16. [Successful AI Hip-Hop Examples](#16-successful-ai-hip-hop-examples)
17. [Complete Workflow: From Idea to Release](#17-complete-workflow-from-idea-to-release)

---

## 1. 808 Bass in AI-Generated Beats

### What Makes an 808

The 808 (from the Roland TR-808 drum machine) is the foundation of modern hip-hop. It is a tuned bass drum that sustains like a bass note - not a kick drum, not a sub bass synth. AI platforms handle 808s with varying quality.

### Platform Comparison

| Platform | 808 Quality | Notes |
|----------|------------|-------|
| **Suno v5.5** | 8/10 | Understands "808" as a tag. Produces recognizable 808 patterns with slides and sustain. Best results when paired with specific subgenre tags. |
| **ElevenLabs Music** | 6/10 | Competent but less varied. Better at clean sub bass than characterful 808 distortion. |
| **ACE-Step v1.5 XL** | 7/10 | Can be fine-tuned with LoRA for specific 808 styles. Raw output decent but benefits from post-processing. |
| **Soundverse** | 7/10 | Solid for type-beat generation. Good 808 patterns at trap tempos. |

### How to Prompt for 808s

**Basic 808 prompt tags:**
- `heavy 808` - standard deep 808 bass
- `808 slides` - pitch-bending 808 glides (Travis Scott style)
- `distorted 808` - clipped/saturated 808 (harder sound)
- `808 sub bass` - clean, deep sub-frequency 808
- `booming 808` - emphasized attack with long sustain

**Suno prompt examples for 808-heavy beats:**

```
Trap, 140 BPM, heavy 808, 808 slides, dark atmosphere, punchy drums,
sharp hi-hat rolls, aggressive male rap, modern Atlanta production
```

```
Phonk, 130 BPM, distorted 808, Memphis rap influence, cowbell,
dark piano melody, lo-fi crunch, aggressive delivery
```

**Critical tip:** Choose either `heavy 808` OR `sub bass` - do not stack both, or you get low-end mud. The 808 IS your bass instrument in trap.

### Post-Processing 808s from AI

AI-generated 808s often need help in a DAW:
1. **Saturation** - Add harmonic content so 808s translate on phone speakers (OTT, Decapitator, free: IVGI)
2. **Sidechain compression** - Duck the 808 slightly under the kick for punch clarity
3. **High-pass at 25-30 Hz** - Remove inaudible sub rumble that eats headroom
4. **Tuning check** - Verify the 808 is in key with the track (use a tuner plugin)
5. **Mono below 100 Hz** - Keep low end centered for club/car systems

---

## 2. Trap Production Elements

### Core Elements of Trap

| Element | Description | AI Prompt Tags |
|---------|-------------|----------------|
| **Hi-hat rolls** | Rapid 16th/32nd note patterns, often with velocity variation | `hi-hat rolls`, `rolling hi-hats`, `fast hi-hats` |
| **Snare/clap** | Hard-hitting, often layered snare + clap on beats 2 and 4 | `hard snare`, `rattling snare`, `trap clap` |
| **808 bass** | Tuned, sustained, often with pitch slides | `heavy 808`, `808 slides`, `deep bass` |
| **Ambient pads** | Dark atmospheric synths creating mood | `atmospheric pads`, `dark synths`, `ambient texture` |
| **Piano/keys** | Minor key melodies, often sparse | `dark piano`, `minor key melody`, `sparse keys` |
| **Ad-libs** | Vocal exclamations throughout | `vocal ad-libs`, `hype vocals` |

### Trap Subvariants and Their Prompts

**Hard Trap / Atlanta Trap:**
```
Modern trap, punchy drums, heavy 808, hard bars, anthem hook, clean mix,
140 BPM, aggressive male rap, Atlanta-style production
```

**Melodic Trap (Juice WRLD / Lil Uzi style):**
```
Melodic trap, airy keys, heavy 808, melodic rap, hook repeat, clean mix,
emotional delivery, auto-tuned vocals, 145 BPM, spacious reverb
```

**Dark Trap:**
```
Dark trap, trap drums, heavy 808, aggressive delivery, chant hook, gritty,
sinister synths, minor key, 138 BPM, haunting atmosphere
```

**Trap Soul (Bryson Tiller style):**
```
Trap soul, smooth chords, trap drums, sub bass, emotional hook, clean mix,
R&B-influenced, warm pads, 130 BPM, intimate vocals
```

**Festival Trap / Hype:**
```
Festival trap, huge drums, heavy 808, chant hook, cinematic energy,
clean mix, arena-ready, 150 BPM, massive drops
```

### The Prompt Formula for Trap

**Substyle + Drum Identity + Bass Role + Vocal Intent + Production Finish**

If you skip the drum identity or bass role, Suno flattens the output into generic hip-hop. Be explicit about the 808 and hi-hat behavior.

---

## 3. Subgenre Prompting Strategies

### Boom Bap

Tempo: 80-100 BPM (sweet spot: 88-92 BPM)

**Signature elements:** Chopped samples, vinyl crackle, swing rhythm, punchy kicks, sharp snares, jazz/soul samples, storytelling lyrics.

**Prompt examples:**

```
Boom bap, 90 BPM, gritty and authentic, chopped soul sample, punchy drums,
vinyl texture, storytelling male rap, 1990s New York influenced
```

```
Jazz rap, boom bap, live jazz instrumentation, upright bass walking line,
brushed drums, saxophone solo, melodic rap delivery, vintage vinyl feel,
warm analog, 90 BPM
```

```
Golden age hip hop, 92 BPM, dusty samples, hard-hitting drums, lo-fi warmth,
conscious rap, East Coast production, vinyl crackle, boom bap swing
```

**Key insight:** Boom bap prompts need `swing` or `groove` tags - without them, AI generates rigid quantized drums that kill the feel. Add `vinyl texture` or `lo-fi warmth` for authentic character.

### Drill

Tempo: 140-145 BPM

**UK Drill:**
```
UK drill, 140 BPM, sliding 808 bass, syncopated snare patterns, dark piano melody,
aggressive flow, London production, ominous atmosphere
```

**Chicago Drill:**
```
Chicago drill, 140 BPM, heavy 808, aggressive drums, dark trap production,
raw delivery, menacing atmosphere, minimal melody
```

**Brooklyn Drill:**
```
Brooklyn drill, 142 BPM, sliding 808, afrobeats influence, sample chops,
melodic drill, aggressive yet melodic vocal delivery
```

### Melodic Rap / Emo Rap

Tempo: 130-160 BPM (half-time feel makes it feel slower)

```
Melodic rap, atmospheric synth pads, auto-tune vocals, emotional sung hook,
spacious airy mix, 145 BPM, vulnerable delivery, guitar arpeggios,
ambient production
```

```
Emo rap, guitar-driven, 808 bass, emotional male vocals, reverb-heavy,
melancholic melody, 140 BPM, lo-fi texture, introspective lyrics
```

### Phonk

Tempo: 125-140 BPM

```
Phonk, dark and aggressive, Memphis rap influence, pitched-down vocal samples,
cowbell, heavy 808, distorted bass, tape-saturated drums, lo-fi crunch, 130 BPM
```

### Lo-Fi Hip-Hop

Tempo: 60-85 BPM (sweet spot: 72 BPM)

```
Lo-fi hip-hop, chill and nostalgic, pitched-down vocal sample, Rhodes piano,
tape-saturated drums, vinyl crackle, warm analog bass, lo-fi tape hiss, 75 BPM
```

### Cloud Rap

Tempo: 60-80 BPM

```
Cloud rap, ethereal synth pads, reverb-drenched vocals, slow tempo, spacious mix,
ambient production, dreamy atmosphere, soft 808, 70 BPM
```

### G-Funk

Tempo: 90-105 BPM

```
G-funk, West Coast hip hop, smooth synth leads, talk box, funky bass line,
laid-back groove, 98 BPM, head-nod rhythm, sunny California feel
```

### BPM Quick Reference

| Subgenre | BPM Range | Sweet Spot |
|----------|-----------|------------|
| Lo-Fi Hip-Hop | 60-85 | 72 |
| Cloud Rap | 60-80 | 68 |
| Boom Bap | 80-100 | 88-92 |
| G-Funk | 90-105 | 98 |
| Hip-Hop (general) | 80-100 | 88 |
| Trap Soul | 125-135 | 130 |
| Phonk | 125-140 | 130 |
| Trap | 130-170 | 140 |
| Drill | 138-145 | 140 |
| Melodic Trap | 140-160 | 145 |

---

## 4. Sample-Based Hip-Hop with AI

### Can AI Generate "Chopped Soul" Beats?

**Short answer: Yes, with caveats.** AI can approximate the sound of chopped soul samples (Kanye's *College Dropout* / *Late Registration* era), but it generates original material that sounds like chopped samples rather than actually sampling existing records.

**Prompt for Kanye-style chipmunk soul:**
```
Boom bap, chipmunk soul, sped-up vocal sample, chopped soul, warm piano,
vintage strings, punchy drums, gospel influence, soulful, 88 BPM,
mid-2000s hip hop production
```

**Prompt for J Dilla-style chopped samples:**
```
Neo-soul hip hop, chopped samples, off-kilter drums, detuned synths,
wonky groove, vintage warmth, jazzy chords, vinyl texture, 82 BPM,
Detroit production, experimental beat
```

**Prompt for RZA/Wu-Tang style:**
```
East Coast hip hop, kung fu movie samples, dark piano, gritty drums,
lo-fi production, raw atmosphere, 90 BPM, boom bap, basement recording feel
```

**Prompt for Madlib-style abstract beats:**
```
Abstract hip hop, chopped jazz samples, lo-fi drums, experimental arrangement,
psychedelic textures, vinyl crackle, 85 BPM, left-field production,
deep crate dig feel
```

### Limitations

- AI cannot replicate the exact cultural resonance of a recognizable soul/R&B sample flip
- The "surprise" of hearing a familiar song chopped and flipped is impossible with AI-generated material
- AI tends to make chopped elements too clean - real sample chops have imperfections that add character
- **Workaround:** Generate the soul/jazz element with AI, then manually chop and rearrange it in a DAW to add human unpredictability

### The Hybrid Approach

1. Use Suno to generate a soulful vocal passage or jazz piano loop (no drums)
2. Export stems
3. Import into GarageBand/Logic Pro
4. Manually chop, pitch-shift, and rearrange the AI-generated "sample"
5. Layer your own drum pattern underneath
6. This gives you the sample-based aesthetic with full ownership

---

## 5. Modern Artist-Style Production

### How to Prompt for Specific Artist Sounds

Never name artists directly in prompts (may trigger filters, and the model works better with descriptive elements). Instead, deconstruct their signature sound.

### Drake-Style (OVO Sound)

**Elements:** Atmospheric pads, moody R&B undertones, conversational rap delivery, minimal piano, reverb-heavy mix, emotional vulnerability.

```
Atmospheric trap, moody R&B, melodic male vocals, conversational rap delivery,
vulnerable tone, 808 bass, reverb-heavy pads, minimal piano, polished modern mix,
78 BPM, ambient night-drive feel
```

### Future-Style

**Elements:** Dark atmosphere, heavy auto-tune, distorted 808s, simple repetitive hooks, ominous synths.

```
Dark trap, heavy auto-tune, distorted 808 bass, ominous synth pads,
repetitive hook, aggressive yet melodic, 140 BPM, spaceship production,
futuristic atmosphere, Atlanta influence
```

### Travis Scott-Style

**Elements:** Psychedelic production, heavy reverb, 808 slides, ambient textures, vocal layering, festival energy.

```
Psychedelic trap, heavy reverb, 808 slides, ambient synth layers,
spacious production, vocal effects, festival energy, cinematic build,
145 BPM, immersive atmosphere, echo-drenched vocals
```

### Kendrick Lamar-Style

**Elements:** Jazz influence, complex arrangements, live instrumentation feel, conscious lyrics, dynamic delivery shifts.

```
Conscious hip hop, jazz-influenced, live instrument feel, complex drum patterns,
dynamic vocal delivery, storytelling, 85 BPM, West Coast production,
saxophone accents, layered arrangement
```

### Metro Boomin-Style Production

**Elements:** Cinematic intros, hard-hitting 808s, orchestral elements, dramatic builds.

```
Cinematic trap, orchestral strings, dramatic build, heavy 808,
epic atmosphere, hard-hitting drums, movie soundtrack feel, 140 BPM,
dark and powerful, producer tag intro
```

### 21 Savage / UK-Influenced Trap

**Elements:** Minimal production, heavy 808, cold atmosphere, monotone delivery.

```
Minimal trap, cold atmosphere, heavy 808, sparse production, hard snare,
monotone delivery, UK drill influence, 140 BPM, stripped-back, menacing
```

---

## 6. Rap Vocal Processing Chain

### The Standard Rap Vocal Chain (Signal Flow Order)

```
Mic -> Preamp -> HPF (80-100 Hz) -> Subtractive EQ -> Compressor ->
De-Esser -> Additive EQ -> Saturation -> Send: Reverb + Delay
```

### Step-by-Step Processing

**1. High-Pass Filter (HPF)**
- Cut everything below 80-100 Hz
- Removes room rumble, mic handling noise, plosive energy
- Essential for keeping the low end clean for 808s

**2. Subtractive EQ (Cut Problem Frequencies)**

| Frequency | Action | Why |
|-----------|--------|-----|
| 80-100 Hz | High-pass | Remove rumble |
| 100-150 Hz | Cut 2-3 dB | Reduce proximity effect / boominess |
| 250-500 Hz | Cut 2-4 dB | Remove muddiness |
| 5-8 kHz | Surgical narrow cut if sibilant | De-harsh before de-esser |

**3. Compression**
- **Ratio:** 4:1 (standard) to 8:1 (aggressive, 1176-style)
- **Threshold:** -18 to -24 dB
- **Attack:** 10-30 ms (fast enough to catch transients but not kill punch)
- **Release:** 60-120 ms
- **Gain reduction:** 3-6 dB on average
- Consider serial compression: gentle compressor (2:1) -> aggressive compressor (6:1) for transparent control

**4. De-Esser**
- Target 5-8 kHz range
- Threshold: just enough to tame sharp S and T sounds
- Don't overdo it - over-de-essing makes vocals sound lispy
- Free plugin: Lisp (Sleepy-Time DSP)

**5. Additive EQ (Boost Desired Characteristics)**

| Frequency | Action | Result |
|-----------|--------|--------|
| 2-4 kHz | Boost 2-6 dB | Presence and clarity (the "money range" for rap) |
| 10+ kHz | Subtle shelf boost | Air and detail |
| 800 Hz - 1 kHz | Slight boost | Warmth and body |

**6. Saturation**
- Adds harmonic richness and perceived loudness
- Tape saturation for warmth, tube for aggression
- Free: IVGI, FerricTDS
- Subtle is key - 10-20% wet

**7. Reverb (Send/Bus)**
- Short plate reverb (0.5-1.2s decay) for most rap
- Pre-delay: 20-40 ms to keep vocals upfront
- Wet/dry: 10-20% - rap vocals should be dry and present
- Exception: hooks/choruses can use more reverb for size

**8. Delay (Send/Bus)**
- 1/4 note or 1/8 note delay synced to BPM
- Feedback: 2-3 repeats (subtle)
- High-cut the delay return at 3-5 kHz to keep delays behind the vocal
- Throw delays: automate delay send for specific words/phrases

### Parallel Processing

- **Parallel compression:** Blend a heavily compressed copy (10:1, fast attack) with the dry vocal for density without squashing
- **Parallel saturation:** Heavy distortion on a parallel bus, blended in at 5-10% for aggression

---

## 7. Auto-Tune and Pitch Correction for AI Vocals

### Why You Need This

When using voice clone tools (ElevenLabs, Kits.ai) to convert your recorded vocals, the conversion process can introduce pitch artifacts. Auto-tune cleans these up while also adding the stylistic T-Pain/Future/Travis Scott effect if desired.

### Two Modes of Pitch Correction

**1. Transparent Correction (Natural Sound)**
- Retune speed: 30-50 ms (slower = more natural)
- Humanize: 20-40 cents
- Purpose: Fix pitch wobbles from AI conversion without audible effect
- Used by: Most rappers who don't want an obvious auto-tune sound

**2. Hard Tune (The "Auto-Tune Effect")**
- Retune speed: 0-10 ms (instant snap)
- Humanize: 0-5 cents
- Purpose: The robotic, melodic sound of T-Pain, Future, Travis Scott
- Set the key correctly or it will sound wrong
- Used by: Melodic trap, emo rap, any sung-rap style

### Recommended Settings by Style

| Style | Retune Speed | Humanize | Key Setting |
|-------|-------------|----------|-------------|
| Boom Bap (natural) | 40-50 ms | 30-40 cents | Chromatic |
| Standard Rap | 20-30 ms | 15-25 cents | Song key |
| Melodic Rap | 10-20 ms | 5-12 cents | Song key |
| Hard Auto-Tune | 0-5 ms | 0-5 cents | Song key |
| Travis Scott style | 0-3 ms | 0 cents | Song key + formant shift |

### Tools (2026)

| Tool | Price | Notes |
|------|-------|-------|
| **Antares Auto-Tune 2026** | $99-399 | Industry standard. Real-time, low latency, redesigned engine. |
| **Waves Tune Real-Time** | $29 (sale) | Budget option, works well for hard tune effect. |
| **MAutoPitch** (Melda) | Free | Free auto-tune plugin. Good for transparent correction. |
| **GSnap** | Free | Open-source pitch correction. Basic but functional. |
| **Graillon 2** (Auburn Sounds) | Free tier | Free pitch correction + formant shifting. |
| **SoundTools.io** | Free (web) | Browser-based auto-tune for quick tests. |

### Voice Clone + Auto-Tune Workflow

1. Record your rap vocals dry (no effects, no reverb)
2. Run through Kits.ai or ElevenLabs Voice Changer to apply your clone
3. Import converted vocal into DAW
4. Apply auto-tune as first insert (before EQ/compression)
5. Set the correct key and scale of your beat
6. Adjust retune speed for desired effect (natural vs. hard tune)
7. Continue with rest of vocal chain

### Critical: Key Detection

If you do not set the correct musical key, auto-tune will snap notes to wrong pitches. Use:
- **Key-BPM-Finder** (vocalremover.org) - upload your AI beat, get key + BPM
- **Mixed In Key** - professional key detection software
- **Suno metadata** - if generated in Suno, the key is sometimes in the generation metadata

---

## 8. Beat Structure for Hip-Hop

### Standard Hip-Hop Song Structure

```
Intro (4-8 bars)
  |
Hook/Chorus (8 bars)
  |
Verse 1 (16 bars)
  |
Hook/Chorus (8 bars)
  |
Verse 2 (16 bars)
  |
Hook/Chorus (8 bars)
  |
Bridge (4-8 bars)
  |
Hook/Chorus (8 bars)
  |
Outro (4-8 bars)
```

**Total: ~80-96 bars = ~3:00-3:30 at 90 BPM**

### Understanding Bars

- 1 bar = 4 beats in 4/4 time
- 1 bar at 90 BPM = ~2.67 seconds
- 1 bar at 140 BPM = ~1.71 seconds
- 16 bars at 90 BPM = ~43 seconds
- 16 bars at 140 BPM = ~27 seconds

### Section Breakdown

**Intro (4-8 bars)**
- Sets the mood before vocals enter
- Often just the beat with a filter sweep, ambient intro, or producer tag
- Can include a vocal snippet or ad-lib

**Hook/Chorus (8 bars)**
- The catchiest, most memorable part
- Repeats 3-4 times throughout the song
- In modern rap, often placed BEFORE the first verse
- Should be singable/chantable

**Verse (12-16 bars)**
- The meat of the song - where the rapper delivers bars
- Modern trend: verses getting shorter (12 bars instead of 16)
- Some artists do 8-bar verses (especially in melodic trap)
- Each verse should have a different melodic approach

**Bridge (4-8 bars)**
- Optional but adds variety
- Changes the melody, rhythm, or energy
- Often used before the final chorus for dramatic effect

**Outro (4-8 bars)**
- Signals the end
- Can be a fade-out, a final hook repetition, or an ambient tail

### Common Variations by Subgenre

**Trap/Modern Rap (streaming-optimized):**
```
Hook -> Verse 1 -> Hook -> Verse 2 -> Hook -> Outro
(No intro - hooks first to catch listeners in the first 15 seconds)
```

**Boom Bap (traditional):**
```
Intro (8 bars) -> Verse 1 (16 bars) -> Hook (8 bars) ->
Verse 2 (16 bars) -> Hook (8 bars) -> Verse 3 (16 bars) ->
Hook (8 bars) -> Outro
```

**Melodic Rap / Emo Rap:**
```
Intro -> Chorus -> Verse 1 -> Chorus -> Verse 2 ->
Bridge -> Chorus -> Outro
```

### Suno Structure Tags

When prompting in Suno, use these section markers in your lyrics:

```
[Intro]
(instrumental intro, 4 bars)

[Hook]
This is the catchy hook that repeats
Every time you hear the beat

[Verse 1]
Sixteen bars of rap here
Each line roughly 4-8 words
Keep the rhythm consistent
Match the syllable count loosely

[Hook]
Same hook repeats

[Verse 2]
Different energy, different story
Build on the first verse theme

[Bridge]
(change of mood)
Something different here

[Hook]
Final hook repetition

[Outro]
(fade out, ambient)
```

---

## 9. Recording Rap Vocals Over AI Beats

### Equipment Needed (Budget to Pro)

| Tier | Mic | Interface | Total |
|------|-----|-----------|-------|
| Budget | Audio-Technica AT2020 ($99) | Focusrite Scarlett Solo ($120) | ~$220 |
| Mid | Rode NT1-A ($229) | Focusrite Scarlett 2i2 ($170) | ~$400 |
| Pro | Neumann TLM 103 ($1,100) | Universal Audio Volt 276 ($299) | ~$1,400 |
| Free | iPhone/MacBook mic | None | $0 (seriously, for demos) |

**Other essentials:**
- Pop filter ($10-20) - prevents plosive P and B sounds
- Reflection filter or closet/blankets - reduces room reverb
- Closed-back headphones ($50-150) - prevents beat bleed into mic

### Recording Workflow

**Step 1: Prepare the beat**
- Import AI-generated beat into DAW (GarageBand or Logic Pro)
- Set project BPM to match the beat exactly
- Create a vocal track with input monitoring

**Step 2: Learn the beat**
- Listen to the beat 10-20 times before recording
- Map out where your verses, hooks, and ad-libs go
- Practice your flow over the beat until it feels natural
- Identify the "pockets" - where the beat breathes and where you can land emphasis

**Step 3: Record the main vocal (lead)**
- Record the full song in one pass first (reference take)
- Then punch in section by section for cleaner takes
- **Punch-in technique:** Set loop markers around 4-8 bar sections, record multiple takes of each section, comp (composite) the best parts together
- Leave 1 beat of silence before your vocal entry for clean edits

**Step 4: Record doubles**
- Record the entire vocal again from start to finish (the "double")
- Pan the double slightly left or right (15-30%), or keep centered and mix quietly (-6 to -10 dB under the lead)
- Some rappers double only the hook, not verses
- Slight timing and pitch differences between takes create natural thickness

**Step 5: Record ad-libs (see Section 11)**

**Step 6: Vocal comping**
- Listen to all takes and select the best performance of each section
- Use the comp tool to stitch together the ideal vocal from multiple takes
- Pay attention to breath placement - breaths should sound natural, not chopped

### Punch-In Best Practices

- **Don't punch in mid-word** - always start at the beginning of a bar or phrase
- **Match energy** - when punching in to replace a section, match the intensity of the surrounding bars
- **Overlap recordings** - record 2 bars before the section you need and 2 bars after, then crossfade
- **Keep all takes** - never delete alternate takes, you may need them in mixing

### Timing Tips

- If the AI beat has slight timing drift (common), use the beat's groove as your metronome, not a click track
- Record to the beat, not to a grid - AI beats may not be perfectly quantized, and that is fine
- If you are consistently early or late, adjust the headphone mix (more beat, less vocal) or practice the section more

---

## 10. Flow Patterns and Syllable Density

### What Is Flow?

Flow is the rhythmic pattern of syllables over a beat. It encompasses:
- **Cadence:** The rhythm and pattern of stressed/unstressed syllables
- **Rhyme scheme:** Where rhymes land in the bar
- **Syllable density:** How many syllables per beat
- **Pocket:** How the flow sits relative to the beat (on-beat, behind, ahead)

### Syllable Density at Common BPMs

| BPM | Style | Syllables/Second (Normal Flow) | Syllables/Second (Double-Time) |
|-----|-------|-------------------------------|-------------------------------|
| 70 | Cloud Rap | 2-3 | 5-6 |
| 85 | Boom Bap | 3-4 | 6-8 |
| 90 | Classic Hip-Hop | 3.5-4.5 | 7-9 |
| 130 | Trap (half-time) | 3-4 (feels like 65 BPM) | 6-8 |
| 140 | Trap/Drill | 3-4 (half-time feel) | 7-8 |
| 160 | Fast Trap | 3-5 | 8-10 |

### Core Flow Patterns

**1. Straight Flow (On-Beat)**
- Syllables land squarely on each beat subdivision
- Clean, rhythmic, beginner-friendly
- Example artists: early Eminem, Rakim

**2. Triplet Flow (Migos Flow)**
- Groups of 3 syllables in rolling patterns
- Dominant in modern trap
- At 60-75 BPM: produces 6-7.5 syllables per second
- Example: "Bad and Boujee" cadence

**3. Double-Time**
- Doubles the syllable count while the beat stays the same
- Creates an intense, rapid-fire effect
- Example artists: Eminem, Tech N9ne, Busta Rhymes
- Works at any BPM but most effective at 80-100 BPM

**4. Half-Time**
- Half the syllables, twice the space
- Creates a laid-back, deliberate feel
- Common in trap: the beat is 140 BPM but the rapper flows at 70 BPM
- Example artists: 21 Savage, Pop Smoke

**5. Syncopated / Off-Beat**
- Syllables land between beats, creating tension
- Requires strong rhythmic instinct
- Example artists: Kendrick Lamar, Andre 3000

**6. Melodic Flow**
- Blends singing and rapping
- Pitch variation as important as rhythm
- Example artists: Juice WRLD, Lil Uzi Vert, Post Malone

### Flow Switching

The most engaging verses switch flow patterns mid-verse:
- Start slow and deliberate (half-time) for 4 bars
- Switch to double-time for 2 bars (surprise energy)
- Return to normal flow for the remaining bars
- Contrast makes each section more impactful

### Matching Flow to BPM

- **60-80 BPM:** Room for complex, wordy flows. Double-time feels fast. Good for storytelling.
- **80-100 BPM:** The classic sweet spot. All flow patterns work. Most versatile range.
- **130-145 BPM (trap):** Half-time feel is standard. Full-speed flow at this BPM is extremely fast and hard to execute. Let the hi-hats carry the energy while you ride the half-time pocket.
- **145+ BPM:** Almost always half-time. Full-speed flow at this tempo is essentially speed rap.

---

## 11. Ad-Libs in AI Hip-Hop

### What Are Ad-Libs?

Ad-libs are vocal exclamations, sounds, and phrases layered on top of the main vocal. They add energy, personality, and fill sonic space. Every major rapper has signature ad-libs.

### Famous Ad-Libs by Artist

| Artist | Signature Ad-Libs |
|--------|------------------|
| Travis Scott | "It's lit!", "Straight up!", "La flame!" |
| Future | "Hndrxx!", "Freebandz!" |
| Migos (Quavo) | "Mama!", "Skrrt!" |
| Migos (Offset) | "Woo!", "Brrr!" |
| Drake | "Yeah yeah!", "Woi!" |
| 21 Savage | "On God!", "Straight up!" |
| Lil Uzi Vert | "Yeah!", "Ooh!" |
| Pusha T | "Yeugh!" |
| Young Thug | "Skrrt!", hissing sounds |

### Recording Ad-Libs

**Method 1: Record separately (recommended)**
1. Play back the mixed main vocal + beat
2. Record ad-libs on a new track while listening
3. React naturally to your own bars - shout responses, echo key words, add energy
4. Record 2-3 passes of ad-libs, then comp the best ones

**Method 2: Record simultaneously**
- Some rappers record ad-libs during the main vocal take
- Requires discipline to separate lead vocal moments from ad-lib moments
- Can feel more natural but harder to mix

### Types of Ad-Libs

**1. Hype ad-libs** - Energy boosters between bars
- "Yeah!", "Let's go!", "Woo!", "Gang!"
- Placed in gaps between lines or at the end of bars

**2. Echo ad-libs** - Repeating the last word/phrase of a bar
- Rapper says "...money" - ad-lib whispers "money" right after
- Creates a call-and-response effect

**3. Response ad-libs** - Reacting to your own bars
- After a hard punchline: "Sheesh!", "Damn!", "Facts!"
- After a flex bar: "You know!", "Talk to 'em!"

**4. Sound effect ad-libs** - Percussive vocal sounds
- "Skrrt!" (car tires), "Brr!" (cold/guns), "Bow!" (impact)
- These work as rhythmic elements, not just vocal decoration

**5. Producer/signature ad-libs** - Your personal tag
- Develop 1-2 signature sounds that are uniquely yours
- Repeat them consistently across songs for brand recognition

### Mixing Ad-Libs

- Pan ad-libs 30-50% left and right (wider than doubles)
- Roll off low end aggressively (high-pass at 200 Hz)
- Add more reverb than the lead vocal (pushes them back in the mix)
- Drop volume 6-10 dB below the lead vocal
- Add subtle delay (1/8 note) for extra space
- EQ: boost 3-5 kHz for presence, cut 500 Hz for clarity

### AI-Generated Ad-Libs

In Suno, you can prompt for ad-libs in the lyrics section:

```
[Verse 1]
Rolling through the city in the whip (skrrt!)
Money on my mind, never slip (yeah!)
Stack it up and watch the paper flip (let's go!)
```

The parenthetical cues tell Suno to generate vocal exclamations at those points. Results vary - sometimes the AI interprets them as spoken lyrics rather than ad-libs. For best results, record ad-libs yourself over the AI beat.

---

## 12. Producer Tags with AI

### What Is a Producer Tag?

A producer tag is a 2-5 second audio signature placed at the beginning of a beat (or looped throughout) that brands your production. Examples: Metro Boomin's "If Young Metro don't trust you...", DJ Mustard's "Mustard on the beat, ho!", Mike Will Made-It's "Ear Drummers!".

### Creating Your Producer Tag

**Option 1: ElevenLabs Text-to-Speech**
1. Write your tag phrase (keep it short: 3-8 words)
2. Generate with a distinctive voice from ElevenLabs voice library
3. Add effects in your DAW: reverb, delay, pitch shift, distortion
4. Export as a WAV file

**Option 2: AI Producer Tag Generators**
- **BasedLabs Producer Tag Maker** (basedlabs.ai/tools/producer-tag-maker) - Free
- **A1.art Producer Tag Generator** - Free, multiple voice styles
- Enter your name/phrase, select voice style, download

**Option 3: Voice Clone Your Tag**
1. Record yourself saying your tag phrase
2. Run through ElevenLabs or Kits.ai to apply effects/character
3. Process in DAW with reverb, delay, pitch effects
4. This creates a tag that sounds like you but enhanced

**Option 4: Record it raw**
- Just record yourself saying your tag phrase
- Add effects: heavy reverb + high-pass filter + saturation = instant producer tag sound
- Many iconic tags are just the producer's voice with minimal processing

### Tag Design Tips

- **Keep it short** - 2-4 seconds maximum
- **Make it rhythmic** - the tag should fit naturally at the start of any beat
- **Be consistent** - use the same tag across all your beats
- **Consider a melodic tag** - a short synth or piano phrase can also work (think Pi'erre Bourne's "Yo, Pi'erre, you wanna come out here?")
- **Layer it** - main tag + a subtle background element (vinyl scratch, reverse cymbal, sub hit)

### Placement in AI Beats

In Suno, you cannot insert your own audio tag. Instead:
1. Generate the beat without a tag
2. Export the beat
3. Import into DAW
4. Place your tag WAV at the beginning
5. Export the final beat with tag

---

## 13. Mixing Hip-Hop

### The Hip-Hop Mix Hierarchy

In hip-hop, the mix priority is:
1. **Vocals** - must be crystal clear and upfront
2. **808/Bass** - foundation of the track
3. **Kick** - punches through the 808
4. **Snare/Clap** - the backbeat
5. **Hi-hats** - rhythmic texture
6. **Melodic elements** - pads, keys, samples
7. **Effects** - risers, impacts, transitions

### Low-End Management (The Hardest Part)

**The 808 + Kick Relationship:**
- Sidechain the 808 to the kick (3-6 dB ducking, fast release)
- OR high-pass the 808 at the kick's fundamental (e.g., kick at 50 Hz, 808 starts at 55 Hz)
- OR layer: let the kick handle the transient (50-100 Hz) and the 808 handle the sustain (30-60 Hz)
- **Never let both fight for the same frequency space**

**Bass EQ Moves:**
- High-pass everything except 808/kick/bass at 100-150 Hz
- Low-cut the vocal at 80-100 Hz
- Mono everything below 100 Hz (use a stereo imaging plugin)
- Add subtle saturation to the 808 so it translates on small speakers (harmonics at 100-200 Hz make the bass "heard" even without a subwoofer)

### Vocal Presence in Dense Beats

**The Vocal Pocket:**
- Cut 2-4 kHz from the instrumental where the vocal presence lives
- This creates a "pocket" for the voice without turning the beat down
- Use a dynamic EQ on the instrumental that ducks 2-5 kHz only when vocals are present
- Alternatively: sidechain a multiband compressor on the beat, keyed to the vocal, compressing only the 1-5 kHz range

**Vocal Width:**
- Lead vocal: dead center, mono
- Doubles: 15-30% L/R
- Ad-libs: 40-60% L/R
- Background vocals: 70-100% L/R
- This creates a natural stereo vocal image with the lead dominant

### Stereo Width

- **Narrow/mono:** Kick, 808, bass, lead vocal, snare center
- **Slightly wide:** Hi-hats (10-20% L/R), doubles
- **Wide:** Pads, ambient elements, ad-libs (40-70%)
- **Extra wide:** Reverb returns, delay returns, ear candy

**Haas effect for width:** Duplicate a mono element, delay one side by 10-30 ms, pan L/R. Creates width without losing mono compatibility. Use sparingly.

### Reference Mixing

- Always A/B your mix against professional reference tracks
- Use a plugin like REFERENCE (Mastering The Mix) or just import a reference MP3 into your DAW
- Match the bass level, vocal presence, and stereo width of the reference
- Do not try to match the loudness - that is mastering, not mixing

### Hip-Hop Mixing Checklist

- [ ] Vocals clear and upfront in the 2-5 kHz range
- [ ] 808 punchy and in-key, not muddy
- [ ] Kick punches through the 808 (sidechain or frequency separation)
- [ ] Snare/clap hits hard on 2 and 4
- [ ] Hi-hats sit on top of the mix without being harsh
- [ ] Low end is mono below 100 Hz
- [ ] No frequency masking between vocal and instrumental
- [ ] Ad-libs panned and lower than lead vocal
- [ ] Reverb/delay on sends, not inserts
- [ ] Mix translates on phone speakers, headphones, and monitors

---

## 14. Reference Tracks as AI Templates

### How to Use Hit Songs as AI Generation Templates

The goal is to analyze a reference track's production elements and translate them into AI prompts.

### The Deconstruction Method

**Step 1: Identify the elements**
For any reference track, note:
- BPM (use tap tempo or Key-BPM-Finder)
- Key (use Key-BPM-Finder or Mixed In Key)
- Drum pattern style (boom bap swing? trap hi-hats? drill patterns?)
- Bass type (808? synth bass? live bass?)
- Melodic instruments (piano? guitar? synth pads? strings?)
- Vocal style (aggressive? melodic? conversational? auto-tuned?)
- Mix character (lo-fi? polished? spacious? dense?)
- Mood (dark? triumphant? melancholic? energetic?)

**Step 2: Translate to prompt language**

Example: Deconstructing "Sicko Mode" by Travis Scott

| Element | Analysis | Prompt Translation |
|---------|----------|-------------------|
| BPM | Multiple (155 -> 75 -> 125) | `beat switch, multiple tempos` |
| Drums | Trap with beat switches | `trap drums, dynamic arrangement` |
| Bass | Heavy 808 with slides | `heavy 808, 808 slides` |
| Melody | Dark synths, ambient | `dark synth pads, ambient texture` |
| Vocals | Auto-tuned, layered, ad-libs | `auto-tuned vocals, vocal layers` |
| Mix | Spacious, reverb-heavy | `spacious production, reverb-heavy` |
| Mood | Dark, psychedelic, intense | `psychedelic trap, dark atmosphere` |

**Resulting prompt:**
```
Psychedelic trap, dark synth pads, ambient texture, heavy 808, 808 slides,
trap drums, auto-tuned vocals, spacious production, reverb-heavy,
dark atmosphere, intense energy, 140 BPM
```

**Step 3: Iterate**
- Generate 5-10 versions
- Keep the ones closest to your reference feel
- Use Suno's inpainting to refine specific sections
- Extract stems and rearrange in your DAW

### Quick Reference Prompt Templates

**"HUMBLE." by Kendrick Lamar:**
```
Minimal trap, piano riff, hard 808, aggressive rap, punchy drums,
in-your-face delivery, 150 BPM, sparse production, raw energy
```

**"Mask Off" by Future:**
```
Flute melody, trap drums, heavy 808, auto-tuned vocals, dark atmosphere,
repetitive hook, 150 BPM, Atlanta trap, hypnotic groove
```

**"Money Trees" by Kendrick Lamar:**
```
West Coast hip hop, beach boys sample feel, dreamy atmosphere,
laid-back drums, melodic hook, storytelling rap, 72 BPM,
sunny yet contemplative
```

**"XO Tour Llif3" by Lil Uzi Vert:**
```
Emo trap, dark synth lead, heavy 808, auto-tuned melodic vocals,
emotional delivery, 155 BPM, melancholic atmosphere, catchy hook
```

---

## 15. Hip-Hop Community Attitude Toward AI (2026)

### The Current Landscape

The hip-hop community's relationship with AI in 2026 is complex and divided:

**Pro-AI Voices:**
- Timbaland and Young Guru have publicly discussed AI as a tool for hip-hop, not a replacement
- 53% of urban and rap artists already use AI tools in their creative workflows (Goldmedia/GEMA study)
- A growing market exists for Suno-generated beats among indie artists - 10,000+ indie artists drop tracks weekly who need affordable beats
- Some producers sell AI-generated beats to indie rappers as a viable side income
- The "AI-assisted" model (human creativity + AI tools) is gaining acceptance

**Anti-AI Voices:**
- Many producers and beat-makers see AI as "laundering artistic labor into push-button AI slop"
- Reddit communities (r/makinghiphop, r/trapproduction) are largely hostile to fully AI-generated music
- Non-usage of AI is increasingly framed as a sign of artistic integrity
- Concerns about market flooding and algorithmic competition against human creators
- The "100 AI songs in 100 days" Suno experiment was roasted on Reddit as "scum"

**The Consensus View:**
- "Grudging acceptance of the inevitable" describes the majority position
- AI as a *tool* (beat sketching, mixing assistance, vocal processing) = accepted
- AI as a *replacement* (fully generated songs passed off as human-made) = rejected
- The line: "People don't care if it's AI, they care if it's good enough to use" - but hip-hop fans actually do care about authenticity more than most genres
- Hip-hop is seen as "less vulnerable" to AI because the genre centers the human performer in ways hard to replicate

### What This Means for You

**Do:**
- Use AI to generate beat ideas and instrumentals
- Process/enhance your real vocals with AI tools
- Be transparent about AI use if asked
- Add significant human creative input on top of AI foundations
- Develop your own voice, flow, and lyrical identity - this is what cannot be replicated

**Don't:**
- Claim fully AI-generated music as "produced by" you without disclosure
- Flood platforms with 100% AI content
- Use AI voice clones of other artists without permission
- Rely on AI for lyrics if you want credibility as a rapper - write your own bars

---

## 16. Successful AI Hip-Hop Examples

### Notable Examples

**"BBL Drizzy" (2024)**
- AI-generated beat by Metro Boomin to mock Drake
- Went genuinely viral in hip-hop culture
- Drake later rapped over the beat during a beat switch on "U My Everything" with Sexyy Red
- Succeeded because it was funny, culturally relevant, and tied to an existing beef

**AI Soul Remixes (2024-2026)**
- Soul/R&B remakes of classic hip-hop songs flooded social media
- AI versions of 50 Cent, Lil Wayne, DMX, and others received millions of views
- Rolling Stone covered the trend as "gentrifying hip-hop" - mixed reception
- Succeeded as novelty/nostalgia but not as standalone art

**"Heart on My Sleeve" (2023)**
- AI-generated Drake x The Weeknd song
- 600,000+ Spotify streams before takedown
- Proved AI could fool casual listeners but was rejected by the industry and core fans

### Why Most AI Hip-Hop Fails with Real Fans

- **Lack of lived experience:** Rap is autobiographical. AI has no life to rap about.
- **No persona:** Hip-hop is built on personality and character. AI artists like "Xania Monet" and "TaTa Taktumi" are novelties, not artists.
- **Missing cultural context:** AI does not understand the references, slang evolution, and community dynamics that make hip-hop resonate.
- **No stakes:** The best rap comes from real emotion - hunger, pain, ambition, love. AI simulates these but fans can feel the difference.

### The Viable Path: AI-Assisted, Human-Centered

The successful model is not "AI makes the music" but "AI helps the musician make better music faster":
- AI generates the beat -> human selects, arranges, and customizes it
- AI processes the voice -> human performs, writes, and delivers the lyrics
- AI assists mixing -> human makes creative decisions
- The human identity, story, and performance are the product. AI is the tool.

---

## 17. Complete Workflow: From Idea to Release

### Phase 1: Beat Creation

1. **Choose your subgenre** - Pick from Section 3's prompt templates
2. **Write your prompt** - Use the 5-part formula: subgenre + mood + vocal style + instruments + BPM
3. **Generate 10-20 variations** in Suno
4. **Select top 3 beats** that match your vision
5. **Export stems** (Suno Pro: 12-stem separation)
6. **Import into DAW** (GarageBand to start, Logic Pro when ready)

### Phase 2: Song Writing

1. **Map the structure** - Use Section 8's templates
2. **Write your hook first** - The catchiest part determines the song's DNA
3. **Write verses** - 12-16 bars each, matching the beat's energy
4. **Plan ad-libs** - Note where energy boosters go
5. **Practice flow** - Rap over the beat 10-20 times before recording

### Phase 3: Recording

1. **Set up recording** - Mic, interface, pop filter, treated room
2. **Record reference take** - Full song, imperfect, just for structure
3. **Punch in main vocals** - Section by section, multiple takes
4. **Record doubles** - Full second performance of hooks (and verses if desired)
5. **Record ad-libs** - React to your own bars on a separate track

### Phase 4: Voice Processing

1. **Run vocals through voice clone** (Kits.ai or ElevenLabs Voice Changer)
2. **Apply auto-tune/pitch correction** - Set correct key
3. **Process through vocal chain** (Section 6)
4. **Mix vocals with beat** (Section 13)

### Phase 5: Mixing & Mastering

1. **Balance levels** - Vocals on top, 808 underneath, everything else supporting
2. **EQ carving** - Create frequency pockets for each element
3. **Compression** - Control dynamics on vocals and bus
4. **Spatial effects** - Reverb, delay, stereo imaging
5. **Master** - Target -14 LUFS, -1.0 dBTP for streaming
6. **Reference check** - Compare against professional tracks

### Phase 6: Release

1. **Distribution** - DistroKid ($22/year), TuneCore, or Amuse (free tier)
2. **Metadata** - Correct BPM, key, genre tags, ISRC codes
3. **Credits** - Be transparent about AI tool usage in credits
4. **Promotion** - Pre-save campaigns, social media snippets, music video

---

## Sources

- [Suno AI Trap Prompt Guide - Jack Righteous](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-ai-trap-prompt-guide)
- [Complete Suno Prompt Guide 2026 - HookGenius](https://hookgenius.app/learn/suno-prompt-guide-2026/)
- [AI Hip-Hop and Rap Cheat Sheet 530 Styles - SunoPrompt](https://sunoprompt.com/music-style-genre/hip-hop-rap-music-genre)
- [5 Suno AI Prompts for Hip-Hop Beats - Medium](https://medium.com/@sohilmalek6666/5-suno-ai-prompts-to-drop-your-own-fire-hip-hop-beats-598ac32681ee)
- [How AI Is Changing Beat Production in 2026 - STVRBOY](https://stvrboymusic.com/how-ai-is-changing-beat-production-in-2026/)
- [AI Voice Production Techniques for Trap and Hip-Hop - Sonarworks](https://www.sonarworks.com/blog/learn/ai-voice-production-techniques-for-trap-and-hip-hop-beats)
- [Auto-Tune Online 2026 - BeatsToRapOn](https://beatstorapon.com/blog/auto-tune-online-2026-ai-pitch-correction/)
- [Hip-Hop & Rap Song Structure 2026 - Luke Mounthill](https://lukemounthillbeats.com/music-production/hip-hop-rap-song-structure/)
- [How to Mix Rap Vocals Like a Pro 2026 - Soundverse](https://www.soundverse.ai/blog/article/how-to-mix-rap-vocals-like-a-pro-1245)
- [ACE-Step Rap LoRA - GitHub](https://github.com/ace-step/ACE-Step/blob/main/ZH_RAP_LORA.md)
- [ACE-Step v1.5 LoRA Training Tutorial - GitHub](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/LoRA_Training_Tutorial.md)
- [Kits AI - ElevenLabs for AI Music](https://www.kits.ai/blog/elevenlabs)
- [Best AI Vocal Tools 2026 - Sonarworks](https://www.sonarworks.com/blog/learn/best-ai-vocal-tools-2025)
- [How AI Soul Remixes Are Gentrifying Hip-Hop - Rolling Stone](https://www.rollingstone.com/music/music-features/ai-soul-remixes-gentrifying-hip-hop-1235452758/)
- [Hip-Hop Artists Leading the AI Discussion - MSNBC](https://www.ms.now/the-reidout/reidout-blog/hip-hop-timbaland-ai-young-guru-rcna85875)
- [Reddit Roasts Creator Who Used Suno for 100 AI Songs - EDM.com](https://edm.com/news/reddit-roasts-suno-artist-who-released-100-ai-songs-100-days/)
- [Suno AI Reddit Review 2026 - AI Tool Discovery](https://www.aitooldiscovery.com/guides/suno-ai-reddit)
- [Selling Suno Beats to Indie Rappers - Medium](https://medium.com/@kvxxpb/stop-chasing-streams-i-made-500-selling-suno-beats-to-indie-rappers-906eac8fe0c6)
- [AI & Music Tech in 2026 - Sound On Sound](https://www.soundonsound.com/music-business/ai-music-tech-2026)
- [Producer Tag Generators 2026 - A1.art](https://a1.art/blog/best-producer-tag-generators-free.html)
- [Rap Song Structure Complete Guide - eMastered](https://emastered.com/blog/rap-song-structure)
- [How to Improve Rap Flow - Luke Mounthill](https://lukemounthillbeats.com/music-production/how-to-improve-rap-flow/)
- [Triplet Flow in Recent Hip-Hop - McGill University](https://escholarship.mcgill.ca/downloads/r207tt637)
- [MCFlow: A Digital Corpus of Rap Transcriptions - Empirical Musicology Review](https://emusicology.org/index.php/EMR/article/view/4961/4496)
