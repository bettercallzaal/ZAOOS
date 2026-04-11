# Doc 334: AI Music Prompt Engineering Masterclass

> Research date: 2026-04-11
> Status: Complete
> Related: Doc 320 (ElevenLabs Music API), Doc 321 (Suno Platform), Doc 324 (ACE-Step Deep Dive)

## TL;DR

This is the definitive reference for writing prompts that produce professional-quality AI music across Suno v5.5, ElevenLabs Music API, ACE-Step 1.5, and Udio v4. Compiled from analysis of 1,000+ community-tested prompts, r/SunoAI power user workflows, practitioner guides, and cross-platform experimentation. Covers the 5-part prompt formula, 300+ tested style tags, genre-specific templates for 9 genres, BPM reference tables, instrument specification, vocal control, negative prompting, structural metatags, prompt iteration strategy, cross-platform translation, and using Claude/ChatGPT as a prompt optimizer.

---

## Part 1: The Universal Prompt Formula

Every AI music platform responds to the same five dimensions. The order and syntax vary, but the concepts are universal.

### The 5-Part Formula

```
[Genre + Subgenre], [Mood + Energy], [Vocal Style + Character], [Key Instruments + Production], [Tempo/BPM]
```

Each part steers a different dimension of output:

| Part | Weight | What It Controls |
|------|--------|-----------------|
| Genre + Subgenre | 60-70% | Harmonic language, arrangement patterns, rhythm feel |
| Mood + Energy | 15-20% | Key center, dynamics, texture brightness/darkness |
| Vocal Style | 5-10% | Singer gender, delivery, tone color |
| Instruments | 5-10% | Specific timbres layered on top of genre defaults |
| Tempo/BPM | 3-5% | Speed, groove density, rhythmic feel |

**Critical insight from 1,000+ prompt analysis:** Genre determines 60-70% of your output. If you get the genre wrong, no amount of mood/instrument tags will fix it. Always start with the most specific genre label possible.

### The 7-Element Extended Formula (Power Users)

```
[Genre] + [Tempo] + [Mood] + [Instruments] + [Vocal Style] + [Era] + [Production Reference]
```

Example: `synth-pop, 118 BPM, upbeat and nostalgic, analog synth pads, Moog bass, gated reverb drums, polished female vocals, 1985 aesthetic, bright radio-ready mix`

### Optimal Tag Count

| Count | Result |
|-------|--------|
| 1-3 tags | Too vague, generic output |
| 4-7 tags | Sweet spot for most platforms |
| 8-12 tags | Advanced users, still effective |
| 12-15 tags | Diminishing returns, signals start conflicting |
| 15+ tags | Tags average into mush, generic compromise |

**Suno sweet spot:** 5-8 tags in style prompt (200 char limit in v4, 1000 in v4.5+)
**ElevenLabs sweet spot:** 5-10 positive_global_styles + 3-5 negative_global_styles
**ACE-Step sweet spot:** 3-7 comma-separated tags
**Udio sweet spot:** 4-8 descriptors in natural language

---

## Part 2: Genre-Specific Prompt Templates

### Hip-Hop

**Boom Bap (90s East Coast)**
- Suno: `boom bap, old school hip-hop, jazz samples, storytelling flow, 1990s New York, dusty drum break, deep sub-bass, vinyl crackle, 90 BPM`
- ElevenLabs: `positive: ["hip-hop", "boom bap", "gritty", "raw", "dusty drum break", "deep sub-bass", "vinyl crackle", "minor key piano stabs"] / negative: ["electronic", "synth", "modern", "auto-tune"]`
- ACE-Step: `hip-hop, boom bap, nostalgic, warm, vinyl crackle, jazz piano, 90 BPM`

**Trap**
- Suno: `trap, dark and aggressive, melodic rap delivery, heavy 808 sub-bass, hi-hat rolls, atmospheric pads, distorted vocal effects, modern hip-hop production, 140 BPM`
- ElevenLabs: `positive: ["trap", "dark", "aggressive", "heavy 808 sub-bass", "hi-hat rolls", "atmospheric pads", "140 BPM"] / negative: ["acoustic", "jazz", "folk", "slow"]`
- ACE-Step: `trap, dark, aggressive, 808 drums, hi-hat rolls, atmospheric, 140 BPM`

**Lo-Fi Hip-Hop**
- Suno: `lo-fi hip-hop, chill and nostalgic, pitched-down vocal sample, Rhodes piano, tape-saturated drums, vinyl crackle, warm analog bass, lo-fi tape hiss, 75 BPM`
- ElevenLabs: `positive: ["lo-fi hip hop", "nostalgic", "warm", "piano", "vinyl crackle", "mellow drums"] / negative: ["crisp", "modern", "polished", "loud"]`
- ACE-Step: `lo-fi hip hop, nostalgic, warm, piano, vinyl crackle, mellow drums, 85 BPM`

**West Coast G-Funk**
- Suno: `west coast G-funk, smooth synths, laid-back groove, 1990s LA, funky, talk box, male vocals, polished, 98 BPM`

**Drill**
- Suno: `UK drill, dark, aggressive, sliding 808 bass, sharp hi-hats, minor key piano, menacing atmosphere, 140 BPM`

### Pop

**Modern Pop**
- Suno: `2020s pop, catchy hooks, female vocals, bright synths, danceable, summer vibes, polished radio-ready mix, 118 BPM`
- ElevenLabs: `positive: ["pop", "catchy", "upbeat", "bright synths", "female vocals", "radio-ready", "120 BPM"] / negative: ["dark", "aggressive", "distorted"]`

**Dark Pop**
- Suno: `dark pop, moody atmosphere, breathy female vocals, minimal production, introspective, sub-bass, sparse electronic, 70 BPM`

**Synth-Pop / 80s**
- Suno: `synth-pop, 80s-inspired, upbeat and nostalgic, polished female vocals, analog synth pads, gated reverb drums, Moog bass, shimmering arpeggios, bright radio-ready mix, 118 BPM`
- ElevenLabs: `positive: ["synth-pop", "80s-inspired", "nostalgic", "analog synth pads", "gated reverb drums", "Moog bass", "shimmering arpeggios"] / negative: ["acoustic", "modern production", "lo-fi"]`

**Power Pop**
- Suno: `power pop, anthemic chorus, layered vocals, driving guitars, stadium energy, major key, 125 BPM`

### Electronic / EDM

**Deep House**
- Suno: `deep house, groovy and hypnotic, filtered vocal chops, warm bass synth, crisp hi-hats, shuffled beat, Rhodes stabs, spacious reverb, 122 BPM`
- ElevenLabs: `positive: ["electronic", "deep house", "groovy", "hypnotic", "warm bass synth", "crisp hi-hats", "122 BPM"] / negative: ["acoustic", "slow", "minimalist", "ambient"]`
- ACE-Step: `house, deep house, groovy, warm bass synth, crisp hi-hats, Rhodes, 122 BPM`

**Synthwave**
- Suno: `synthwave, 1980s retrofuturism, analog synths, neon aesthetic, driving arpeggios, warm pad, punchy drums, 110 BPM`
- ElevenLabs: `positive: ["electronic", "fast-paced", "driving synth arpeggios", "punchy drums", "distorted bass", "high adrenaline"] / negative: ["acoustic", "slow", "minimalist", "ambient", "lo-fi"]`

**Techno**
- Suno: `techno, dark and industrial, pounding kick drums, minimal, Berlin club, relentless, hypnotic, modular synth, 135 BPM`

**Trance**
- Suno: `trance, euphoric, building energy, soaring synths, uplifting breakdown, 138 BPM`

**Drum & Bass**
- Suno: `drum and bass, liquid DnB, smooth, atmospheric, fast breakbeats, deep rolling bass, female vocal sample, 174 BPM`

**Ambient**
- Suno: `ambient, ethereal and spacious, no vocals, evolving synth pads, granular textures, soft piano, field recordings, reverb-drenched, slow builds, 65 BPM`
- ElevenLabs: `positive: ["ambient", "ethereal", "peaceful", "meditative", "slowly evolving pad textures", "distant bell tones"] / negative: ["rhythm", "percussion", "vocals", "aggressive"]`

**Phonk**
- Suno: `phonk, dark and aggressive, Memphis rap influence, pitched-down vocal samples, cowbell, heavy 808, distorted bass, tape-saturated drums, lo-fi crunch, 130 BPM`

### Lo-Fi

- Suno: `lo-fi, bedroom pop, hazy vocals, warped synths, intimate production, dreamy, cassette warmth, 80 BPM`
- Suno (study): `lo-fi, chillhop, jazzy samples, relaxed groove, tape hiss, coffee shop vibe, instrumental, no vocals, 85 BPM`
- Suno (rainy): `lo-fi, ambient rain, soft beats, melancholic, cozy atmosphere, piano, warm pads, 70 BPM`

### Rock

**Classic Rock**
- Suno: `classic rock, 1970s arena sound, powerful guitar riffs, raspy male vocals, epic solos, driving bass, explosive drums, 128 BPM`

**Indie Rock**
- Suno: `indie rock, jangly guitars, understated vocals, 2000s revival, garage recording, dreamy, reverb-heavy, 130 BPM`
- ACE-Step: `indie rock, dreamy, reverb-heavy guitars, driving drums, melancholic, 130 BPM`

**Alternative Rock**
- Suno: `alternative rock, raw and emotional, raspy male vocals, distorted guitar wall, driving bass, explosive drums, quiet verse to loud chorus dynamic, 135 BPM`

**Grunge**
- Suno: `grunge, 1990s Seattle, distorted guitars, raw angst, lo-fi production, heavy, 120 BPM`

**Post-Punk**
- Suno: `post-punk, angular guitar, driving bass, cold wave, dark atmosphere, baritone vocals, 130 BPM`

### Jazz

**Bebop**
- Suno: `bebop, fast tempo, saxophone lead, walking bass, improvisational, 1950s New York, 180 BPM`

**Smooth Jazz**
- Suno: `smooth jazz, mellow saxophone, electric piano, relaxed groove, late night, warm, 95 BPM`

**Bossa Nova**
- Suno: `bossa nova, Brazilian rhythm, nylon guitar, warm bass, intimate atmosphere, 1960s elegance, 130 BPM`

**Jazz Fusion**
- Suno: `jazz fusion, complex rhythms, electric guitar, synth pads, groovy bass, sophisticated harmony, 110 BPM`
- ElevenLabs: `positive: ["jazz", "electronic elements", "smooth", "late night", "saxophone", "synth pads"] / negative: ["aggressive", "distorted", "lo-fi"]`

### R&B / Soul

**Modern R&B**
- Suno: `modern R&B, smooth production, male falsetto, minimalist beats, sensual, warm, 78 BPM`

**Neo-Soul**
- Suno: `neo-soul, smooth and intimate, silky female vocals with runs, Rhodes electric piano, warm sub bass, brushed drums, layered harmonies, warm analog production, 78 BPM`
- ElevenLabs: `positive: ["R&B", "neo soul", "smooth", "intimate", "Rhodes electric piano", "warm sub bass", "brushed drums"] / negative: ["electronic", "aggressive", "distorted"]`

**90s R&B**
- Suno: `90s R&B, new jack swing, layered harmonies, groovy, nostalgic, drum machine, synth bass, 100 BPM`

### Country

**Modern Country**
- Suno: `modern country, male vocals, acoustic guitar, polished production, storytelling, steel guitar, 110 BPM`

**Outlaw Country**
- Suno: `outlaw country, gritty, raw male vocals, rebellious, 1970s influence, acoustic guitar, harmonica, 105 BPM`

**Bluegrass**
- Suno: `bluegrass, acoustic instruments, fast picking, harmonized vocals, Appalachian, banjo, fiddle, mandolin, 140 BPM`

**Country + Electronic Fusion**
- Suno: `country electronica, modern twang, female vocals with slight drawl, acoustic guitar over electronic beat, synth pad underneath, four-on-the-floor kick, polished but organic, 115 BPM`

### Latin

**Reggaeton**
- Suno: `reggaeton, high-energy, Latin club feel, rhythmic male vocals, dembow beat, punchy 808, tropical synths, percussive shakers, polished urban production, 95 BPM`

**Salsa**
- Suno: `salsa, upbeat, brass section, congas, timbales, piano montuno, energetic male vocals, tropical, 180 BPM`

**Latin Pop**
- Suno: `Latin pop, bilingual, catchy melody, modern production, acoustic guitar, warm percussion, romantic, 100 BPM`

**Bossa Nova** (see Jazz section above)

---

## Part 3: BPM Reference Table

Always specify BPM. It is the single easiest way to improve prompt consistency.

| Genre | Typical Range | Sweet Spot | Notes |
|-------|--------------|------------|-------|
| Ambient / Drone | 50-70 | 60 | Or omit BPM entirely |
| Lo-Fi / Chill | 60-85 | 72 | Slower = more atmospheric |
| Ballad | 60-80 | 70 | Emotional, spacious |
| R&B / Soul | 65-85 | 78 | Groove-focused |
| Bossa Nova | 70-90 | 80 | Relaxed swing |
| Hip-Hop (classic) | 80-100 | 88-92 | Boom bap range |
| Reggaeton | 88-100 | 95 | Dembow pattern |
| Reggae / Dub | 60-90 | 75 | Half-time feel |
| Indie Folk | 85-110 | 95 | Fingerpicking comfort zone |
| Country | 90-130 | 110 | Varies by subgenre |
| Pop | 100-130 | 118 | Radio standard |
| Rock | 110-140 | 128 | Driving feel |
| Funk | 100-130 | 110 | Groove pocket |
| Disco | 110-135 | 120 | Four-on-the-floor |
| House | 118-130 | 124 | Deep house lower, tech house higher |
| Techno | 125-150 | 135 | Berlin style |
| Trance | 130-145 | 138 | Progressive trance lower |
| Trap | 130-170 | 140 | Half-time feel over fast hats |
| Phonk | 120-140 | 130 | Memphis influence |
| Drum & Bass | 160-180 | 174 | Liquid DnB at 170 |
| Punk | 150-200 | 170 | Hardcore faster |
| Bebop Jazz | 160-300 | 180 | Fast and virtuosic |

---

## Part 4: Instrument Specification

Generic terms produce generic sounds. Specific instruments produce specific sounds.

### The Specificity Rule

| Bad | Good | Great |
|-----|------|-------|
| guitar | acoustic guitar | fingerpicked nylon string guitar |
| piano | electric piano | Rhodes Mark II electric piano |
| drums | live drums | brushed jazz drums on warm kit |
| synth | analog synth | Moog bass with warm filter sweep |
| bass | bass guitar | fretless bass with chorus effect |

### Instrument Keywords by Category

**Piano/Keys:**
- grand piano, upright piano, honky-tonk piano
- Rhodes electric piano, Wurlitzer, clavinet
- organ, Hammond B3 organ
- synth pads, analog polysynth, warm pad
- harpsichord, celesta, music box

**Guitar:**
- acoustic guitar, nylon string, steel string
- fingerpicked guitar, strummed acoustic
- clean electric guitar, jangly Telecaster
- overdrive crunch, distorted guitar wall
- slide guitar, pedal steel guitar
- 12-string guitar

**Drums/Percussion:**
- 808 drums, 808 sub-bass kick
- TR-808, TR-909
- drum machine, programmed drums
- live drums, punchy live kit
- brushed drums, brush kit
- gated reverb drums (80s)
- breakbeat, chopped breaks
- hi-hat rolls, snare rolls
- congas, bongos, timbales
- shaker, tambourine, cowbell
- tabla, djembe

**Synths:**
- analog synth, vintage analog
- Moog bass, Minimoog
- synth pads, warm pads
- arpeggiator, arpeggiated synth
- lead synth, saw lead
- modular synth
- vocoder

**Bass:**
- sub-bass, deep sub
- 808 bass (pitched sub)
- electric bass, fingerstyle bass
- fretless bass, upright bass
- slap bass, funk bass
- synth bass, acid bass (303)
- fuzz bass, distorted bass

**Strings:**
- strings, orchestral strings
- soft strings, lush strings
- pizzicato strings
- violin, viola, cello
- string quartet

**Brass/Woodwinds:**
- trumpet, muted trumpet
- saxophone, tenor sax, alto sax
- trombone, French horn
- brass section, brass stabs
- flute, clarinet, oboe

### Instrument Tags That Work Best (from 1000+ prompt analysis)

| Tag | Reliability | Notes |
|-----|------------|-------|
| 808 bass | Highest | Most reliable instrument tag tested |
| acoustic guitar | High | Consistent across folk/indie |
| Rhodes piano | High | Distinctive electric piano tone |
| distorted guitar | High | Reliable overdrive/distortion |
| analog synth | High | Warm synthesis vs generic "synth" |
| strings | High | Reliable orchestral layer |
| brushed drums | Medium-High | Jazz context needed |
| saxophone | Medium | Better with genre context |
| harmonica | Medium | Works in folk/blues |
| harpsichord | Low | Niche, inconsistent |

---

## Part 5: Vocal Style Control

### The Three-Layer Vocal System

For best results, specify three dimensions:

1. **Character** (who is singing): raspy female, smooth baritone, young male tenor, deep female alto, child-like, androgynous
2. **Delivery** (how they sing): breathy, powerful belt, whispered, spoken word, drawl, falsetto, aggressive, conversational, melodic rap
3. **Effects** (how it sounds in the mix): reverb-drenched, dry and close-mic, doubled harmonies, lo-fi filtered, auto-tuned, distant, intimate

### Complete Vocal Delivery Tags

**Volume/Intensity:**
`[Whispered]` `[Soft]` `[Gentle]` `[Quiet]` `[Spoken]` `[Spoken Word]` `[Powerful]` `[Belted]` `[Shouted]` `[Screamed]` `[Growled]` `[Intense]`

**Vocal Style:**
`[Falsetto]` `[Head Voice]` `[Chest Voice]` `[Breathy]` `[Raspy]` `[Smooth]` `[Soulful]` `[Operatic]` `[Nasal]` `[Airy]`

**Techniques:**
`[Harmonies]` `[Ad-libs]` `[Vocal Run]` `[Melisma]` `[Vibrato]` `[Staccato]` `[Legato]` `[Call and Response]` `[Chant]` `[Choir]`

**Rap/Hip-Hop Specific:**
`[Rapped]` `[Fast Rap]` `[Slow Flow]` `[Melodic Rap]` `[Trap Flow]` `[Boom Bap Flow]` `[Mumble Rap]` `[Double Time]`

### Vocal Tag Reliability (Suno v5.5)

| Tag | Reliability | Notes |
|-----|------------|-------|
| male/female vocals | High | Gender selection is reliable |
| raspy vocals | High | Clear audible character effect |
| breathy vocals | High | Consistent, creates intimacy |
| powerful belt | High | Increases vocal energy and range |
| operatic | Medium-High | Surprisingly effective for drama |
| whispered vocals | Medium | Works but reduces track energy |
| falsetto | Low | Often ignored by the model |

### Platform-Specific Vocal Control

**Suno:** Use metatags in lyrics field: `[Whispered]`, `[Belted]`, `[Falsetto]`. Combine with style prompt: "raspy male vocals, breathy delivery"

**ElevenLabs:** Use `positive_local_styles` per section:
```json
{
  "section_name": "Verse 1",
  "positive_local_styles": ["male vocals", "raw", "breathy"],
  "lines": ["Walking down the empty street..."]
}
```
For duets, use separate sections with different vocal styles. ElevenLabs is the only platform where you can reliably switch vocal character between sections.

**ACE-Step:** Specify in tags field. Use UPPERCASE in lyrics for emphasis, (parentheses) for backing vocals. Performance modifiers: `[Chorus - anthemic]`, `[Verse - whispered]`, `[Bridge - soaring]`

**Udio:** Natural language in prompt: "dreamy female vocals, close-mic whispered delivery with lush reverb"

### Removing Vocals Entirely

| Platform | Method |
|----------|--------|
| Suno | "instrumental only" in style + "no vocals, no singing" |
| ElevenLabs | `force_instrumental: true` (prompt mode) or `"instrumental only"` in styles |
| ACE-Step | `[instrumental]` or `[inst]` as sole lyrics content |
| Udio | "instrumental, no vocals, no voice" in prompt |

---

## Part 6: Mood and Emotion Keywords

### High-Reliability Mood Tags (work across all platforms)

**Positive Energy:**
uplifting, hopeful, warm, euphoric, joyful, playful, triumphant, celebratory, empowering, carefree

**Negative Energy:**
melancholic, brooding, dark, haunting, somber, mournful, lonely, bitter, anguished

**Neutral/Atmospheric:**
ethereal, atmospheric, cinematic, intimate, mysterious, reflective, contemplative, nostalgic, dreamy, surreal

**High Intensity:**
aggressive, intense, driving, relentless, chaotic, explosive, fierce, frenetic, anthemic

**Low Intensity:**
peaceful, meditative, tranquil, serene, floating, delicate, gentle, sparse, minimal

### Mood Tags Ranked by Impact (from prompt analysis)

| Tag | Impact Level | What It Changes |
|-----|-------------|----------------|
| dark | Very High | Shifts key, tempo, and timbre simultaneously |
| melancholic | Very High | Reliable sadness across all genres |
| euphoric | High | Major key, energetic, festival energy |
| aggressive | High | Increases distortion and vocal intensity |
| dreamy | High | Adds reverb, softens transients |
| nostalgic | High | Warm tones, wistful melodies |
| haunting | High | Eerie textures, sparse arrangements |
| cinematic | High | Universal modifier, elevates production quality |
| intimate | Medium | Close-mic feel, reduced dynamics |
| playful | Medium | Lighter arrangements, major key tendency |

### The "Cinematic" Modifier

"Cinematic" is the single most versatile modifier across all AI music platforms. It consistently:
- Elevates perceived production quality
- Adds dynamic range (quiet to loud)
- Introduces orchestral elements
- Creates a sense of narrative arc
- Works with ANY genre: "cinematic trap", "cinematic folk", "cinematic lo-fi"

---

## Part 7: Negative Prompting

### Why Negative Prompts Matter

Negative prompts are more impactful than adding more positive descriptors. Explicitly excluding what you do not want produces cleaner results than piling on positive styles.

### Syntax by Platform

**Suno v5.5:** Include in the style prompt field. Syntax: `no [element]`, `without [element]`, `exclude [element]`. "No" is most reliable and character-efficient.

**ElevenLabs:** Dedicated `negative_global_styles` and `negative_local_styles` arrays. Most structured negative prompt system of any platform.

**ACE-Step:** No dedicated negative prompt syntax. Use positive tags exclusively and be specific about what you want.

**Udio:** No documented negative syntax. Achieve clarity through specific positive descriptors and production quality tags.

### What to Exclude (Suno Negative Prompt Library)

**Vocal Removal:**
- `no vocals, instrumental only`
- `no singing, no voice`
- `no backing vocals, no harmonies`
- `no vocal samples, no chants`
- `no humming, no wordless vocals`

**Instrument Exclusion:**
- `no 808s, no drum machines` (for acoustic feel)
- `no electric guitar, no distortion` (for clean/acoustic)
- `no synthesizers, no synth pads` (for organic/live feel)
- `no piano` (when not wanted)
- `no brass, no horns` (for leaner arrangements)

**Production Style:**
- `no autotune, no pitch correction`
- `no reverb, dry mix`
- `no lo-fi effects, no vinyl crackle`
- `no heavy compression`
- `no distortion, clean`

**Genre Blocking:**
- `no EDM, no drops, no buildup`
- `no hip-hop, no trap, no rap`
- `no metal, no screaming, no heavy`
- `no jazz, no swing`
- `no country, no twang`

**Mood Control:**
- `no sad, no melancholic` (for upbeat tracks)
- `no aggressive, no intense` (for calm tracks)
- `no cheesy, no corny` (for sophisticated output)
- `no dark, no ominous` (for bright output)

### ElevenLabs Negative Styles (Best Practice Examples)

```json
// For a clean electronic track
"negative_global_styles": ["acoustic", "slow", "minimalist", "ambient", "lo-fi"]

// For an organic folk track
"negative_global_styles": ["electronic", "synth", "drum machine", "auto-tune", "processed"]

// For a dark, moody track
"negative_global_styles": ["upbeat", "happy", "bright", "major key", "cheerful"]
```

### The "No Drums" Problem

AI models focus on keywords, not negations. When you say "no drums," the model pays attention to the concept "drums" and sometimes generates percussion anyway. Workarounds:

1. **Be hyper-specific:** "no percussion, no drums, no beats, no rhythm section"
2. **Positive reinforcement:** "ambient pads only, drone, no rhythmic elements"
3. **Genre steering:** Use genres that naturally lack drums: "ambient, drone, soundscape"
4. **Regenerate:** Results vary between generations. Try 3-5 times.
5. **Structural tags:** Place `[Instrumental Break]` or `[Ambient]` in lyrics

### Character Limit Priorities

With limited characters (200 in Suno style), prioritize your 2-3 most important exclusions. Do not waste space on unlikely elements.

---

## Part 8: Song Structure Control

### Structure Metatags (Go in Lyrics Field, Not Style Prompt)

**Core Structure Tags:**
`[Intro]` `[Verse]` `[Verse 1]` `[Verse 2]` `[Pre-Chorus]` `[Chorus]` `[Post-Chorus]` `[Bridge]` `[Outro]` `[End]`

**Instrumental Sections:**
`[Instrumental]` `[Instrumental Break]` `[Break]` `[Interlude]` `[Solo]` `[Guitar Solo]` `[Drop]` `[Build]` `[Breakdown]`

**Dynamic Modifiers:**
`[Fade In]` `[Fade Out]` `[Swell]` `[Crescendo]` `[Decrescendo]`

**Shorter Elements:**
`[Hook]` `[Refrain]` `[Ad-lib]`

### Structure Tags with Performance Modifiers (ACE-Step + Suno)

Combine structure with delivery for finer control:
- `[Chorus - anthemic]` - big, singalong energy
- `[Verse - whispered]` - intimate, quiet delivery
- `[Bridge - soaring]` - building, epic feel
- `[Verse - spoken word]` - rap/spoken delivery
- `[Chorus - harmonized]` - layered vocal harmonies
- `[Verse - stripped back]` - minimal instrumentation

### Inline Vocal Cues (Suno, in parentheses within lyrics)

Place directly in lyrics for section-specific delivery changes:
- `(whispered)` - switch to whisper
- `(belted)` - switch to powerful delivery
- `(spoken word)` - switch to speech
- `(harmonized)` - add harmony layers
- `(ad-lib)` - spontaneous vocal additions
- `(falsetto)` - switch to falsetto
- `(building intensity)` - gradually increase energy
- `(stripped back)` - reduce instrumentation
- `(key change)` - modulate up
- `(half-time feel)` - halve the rhythmic density

### ACE-Step Lyrics Notation

- **UPPERCASE** words = shouted/emphasized
- **(parentheses)** = background vocals or echoes
- `[instrumental]` or `[inst]` as sole content = fully instrumental

### Lyrics-to-Duration Ratio (ACE-Step)

- 2-3 words per second is the sweet spot
- ~90-140 words for a 47-second track
- Keep lines to 6-10 syllables for natural vocal fitting
- Add `[Instrumental]` sections for breathing room

### ElevenLabs Section Control

ElevenLabs has the most precise structure control via its composition plan API:

```json
{
  "sections": [
    {
      "section_name": "Intro",
      "duration_ms": 15000,
      "positive_local_styles": ["atmospheric", "building"],
      "lines": []
    },
    {
      "section_name": "Verse 1",
      "duration_ms": 30000,
      "positive_local_styles": ["male vocals", "intimate", "breathy"],
      "lines": ["Walking down the empty street...", "..."]
    },
    {
      "section_name": "Chorus",
      "duration_ms": 25000,
      "positive_local_styles": ["powerful", "anthemic", "harmonized"],
      "lines": ["We are the music makers...", "..."]
    }
  ]
}
```

Each section can have: its own duration (3-120 seconds), local positive/negative styles, up to 30 lines of lyrics. Maximum 30 sections, total up to 10 minutes.

---

## Part 9: Reference Artist Styles

### Does "In the Style of" Work?

**Suno:** Direct artist names may get flagged. Genre-inspired prompts work: "in the style of 90s grunge" is fine; "in the style of Kurt Cobain" may trigger content policy.

**ElevenLabs:** Copyrighted band/artist names return `bad_composition_plan` error with an alternative `prompt_suggestion`.

**ACE-Step:** No content restrictions (Apache 2.0 / local model). You can use any reference.

**Udio:** Generally permissive but results vary. Focus on describing the sound rather than naming artists.

### The Deconstruction Method (Legal and More Effective)

Instead of naming artists, reverse-engineer their sonic DNA into prompt-compatible descriptions:

1. Identify their signature BPM range
2. Describe vocal character (conversational vs melodic, intimate vs powerful)
3. Map production palette (specific instruments and mix aesthetic)
4. Capture dominant mood (dark/vulnerable/triumphant)
5. Note era-specific production characteristics

### Artist Deconstruction Examples

**Drake:**
`atmospheric trap, moody R&B, melodic male vocals, conversational rap delivery, vulnerable tone, 808 bass, reverb-heavy pads, minimal piano, 78 BPM`

**Billie Eilish:**
`dark pop, minimalist, breathy whispered female vocals, ASMR-like intimate delivery, sub-bass, sparse electronic production, 70 BPM`

**The Weeknd:**
`dark synth-pop, 80s-influenced R&B, smooth falsetto male vocals, retro synths, cinematic atmosphere, driving rhythm, 108 BPM`

**Kendrick Lamar:**
`conscious hip-hop, jazz-influenced, complex rhythmic flow, aggressive to introspective delivery, live instrumentation, 95 BPM`

**Taylor Swift (pop era):**
`synth-pop, stadium anthem, bright female vocals, catchy hooks, layered production, major key, uplifting, 130 BPM`

**Frank Ocean:**
`experimental R&B, atmospheric, introspective male vocals, warm pads, minimalist production, dreamy, 80 BPM`

**Radiohead:**
`art rock, experimental, atmospheric, haunting male vocals, electronic textures, complex arrangements, melancholic, 120 BPM`

**Daft Punk:**
`French house, filter disco, vocoder vocals, funky guitar, four-on-the-floor, retro-futuristic, 120 BPM`

### Legal Implications (2026)

- Cloning a specific artist's voice without permission is flagged across all major platforms
- Describing sonic characteristics (production style, BPM, instruments) is legal and more effective
- AI-generated music cannot be registered for US copyright without substantial human creative contribution
- DDEX AI Disclosure Standard requires flagging AI content on streaming platforms
- Warner Music has settled with Suno; UMG/Sony litigation continues

---

## Part 10: Prompt Iteration Strategy

### The Professional Workflow

1. **Start broad (Generation 1-2):** Genre + mood + BPM only. Listen to what the model gives you.
2. **Add specificity (Generation 3-4):** Layer in instruments, vocal style, production tags based on what you heard.
3. **Refine (Generation 5-6):** Add negative prompts to remove unwanted elements. Tweak the details.
4. **Polish (Generation 7+):** Use section replacement (Suno), inpainting (ElevenLabs), or repainting (ACE-Step) to fix individual sections.

### Key Principles

- **Change one variable at a time.** If you change genre AND mood AND instruments simultaneously, you cannot learn what caused the improvement.
- **Generate short first.** Create 15-30 second clips to test prompts before committing to full tracks. Saves credits and time.
- **Generate 2-4 versions per prompt.** Picking the best from a batch is faster than perfecting one generation.
- **Keep a prompt journal.** Track what worked, what failed, and why. Build a personal vocabulary over time.
- **Use the SFT/high-quality model for final renders.** Use turbo/fast models for iteration. (ACE-Step: turbo 8 steps for exploration, SFT 50+ steps for keepers.)

### The Layered Development Method

| Layer | Focus | Example Addition |
|-------|-------|-----------------|
| 1 | Core genre + mood | `indie rock, melancholic` |
| 2 | Instrumentation + structure | `+ jangly guitar, driving drums` |
| 3 | Production + texture | `+ lo-fi, reverb-heavy, tape warmth` |
| 4 | Vocal direction | `+ breathy male vocals, intimate` |
| 5 | Tempo + key | `+ 128 BPM, E minor` |
| 6 | Negative exclusions | `+ no synths, no electronic elements` |

### Platform-Specific Iteration Features

**Suno:**
- **Replace Section (Inpainting):** Select any section, regenerate just that part. Keep the rest intact.
- **Alternates (Repainting):** Generate 2-4 alternate versions of a specific verse/chorus/bridge.
- **Extend:** Continue from a momentum point (not an ending). 62% of extensions drift from original prompt -- re-specify style when extending.
- **Save prompt presets** in Library for quick access.
- **Suno Personas:** Lock in vocal timbre for consistent voice across projects.

**ElevenLabs:**
- **Plan endpoint** (`/v1/music/plan`): Auto-generate a composition plan from a prompt. Free, no credits. Edit plan before generating.
- **Seed parameter:** Same seed + same plan = similar (not identical) output. Useful for A/B testing single changes.
- **Inpainting** (enterprise): Regenerate specific sections without affecting the rest.
- **Source composition plan:** Generate a plan, tweak it, use it as base for next plan.

**ACE-Step:**
- **Repaint mode:** Regenerate specific 10-second windows rather than entire songs.
- **LoRA scale slider:** 0-100%. Start at 50% and adjust. >80% creates artifacts. 30-60% sounds most natural.
- **Turbo vs SFT toggle:** 8-step turbo for ideas, 50+ step SFT for keepers.
- **Batch generation:** Generate 2-4 versions simultaneously (local, no cost).

**Udio:**
- **Crop and Extend:** Isolate successful sections, modify prompts for different parts (verse prompt vs chorus prompt).
- **Music to Prompt:** Upload a reference track, extract style tags, BPM, instrumentation for replication.

---

## Part 11: Advanced Techniques

### Time Signature

Most AI music platforms default to 4/4. Specifying unusual time signatures has mixed results:

| Platform | 3/4 Waltz | 6/8 | 5/4 | 7/8 | Odd Meters |
|----------|-----------|-----|-----|-----|------------|
| Suno | Works | Sometimes | Struggles | Fails | Defaults to 4/4 |
| ElevenLabs | Works | Works | Mixed | Mixed | Limited |
| ACE-Step | Works | Works | Varies | Varies | Improving |
| Udio | Works | Works | Mixed | Limited | Limited |

**Best approach for odd meters:** Use genre contexts that imply the time signature ("jazz waltz" for 3/4, "progressive rock" for 5/4 or 7/8) rather than specifying the number directly.

### Key Signature

Specifying key improves harmonic consistency, especially for multi-section compositions:
- `A minor` - natural minor, sad/dark
- `C major` - bright, simple, uplifting
- `E minor` - rock/folk standard, melancholic
- `D major` - warm, golden, country/folk
- `F# minor` - dramatic, emotional

ElevenLabs handles key specification most reliably. Include in styles: "A minor, 90 BPM, soulful and raw"

### Dynamics Control

Use temporal descriptors to guide dramatic structure:
- `building` - gradually increase intensity
- `swelling` - crescendo effect
- `crescendo to fortissimo` - quiet to very loud
- `quiet verse to loud chorus` - dynamic contrast
- `stripped back to full band` - arrangement dynamics
- `building anticipation` - tension before release

### Production Style Tags (Massively Underused)

Production tags are the most powerful yet most neglected category. Most community prompts lack them entirely.

| Tag | Effect |
|-----|--------|
| lo-fi | Warmth, noise, softened highs |
| polished production | Radio-ready clarity and punch |
| reverb-drenched | Dramatic spatial effect |
| tape saturation | Warm harmonic distortion |
| vinyl crackle | Audible analog texture |
| bedroom recording | Intimate, imperfect, close |
| stadium reverb | Huge, epic, wide |
| compressed and loud | Modern loudness war aesthetic |
| analog warmth | Tube-like saturation |
| crisp digital clarity | Clean, modern, precise |
| wide stereo image | Spacious, immersive |
| dry mix | Close, intimate, no effects |
| Phil Spector wall of sound | Dense, layered, epic |
| recorded in a basement studio | Raw, authentic, lo-fi |

### Era + Genre Combinations

Cross-era hybrids produce distinctive results that cannot be achieved with genre alone:
- `70s funk, modern production` - vintage groove, contemporary clarity
- `90s grunge, lo-fi bedroom recording` - raw angst, intimate setting
- `1985 synth-pop, 2026 production techniques` - retro melody, modern sound
- `1960s psychedelic, electronic beats` - vintage textures, modern rhythm
- `50s doo-wop, trap drums` - unexpected but distinctive fusion

### Micro-Genres and Obscure Styles

Suno knows 6,300+ genres. Using micro-genres puts you in less crowded sonic territory:

| Micro-Genre | Description | Prompt Example |
|------------|-------------|----------------|
| Witch House | Dark, occult electronic | `witch house, distorted vocals, occult atmosphere, slowed tempo, ethereal synths` |
| Breakcore | Chaotic, fast electronic | `breakcore, rapid breakbeats, distorted samples, aggressive energy` |
| Chillwave | Washed-out nostalgic synth | `chillwave, washed-out synths, nostalgic samples, laid-back beat` |
| Hyperpop | Maximalist, pitch-shifted | `hyperpop, pitch-shifted vocals, glitchy production, loud synths, chaotic` |
| Shoegaze | Wall of guitar, dreamy | `shoegaze, wall of sound, ethereal vocals, feedback textures, heavy reverb` |
| Vaporwave | Slowed 80s samples | `vaporwave, slowed samples, retro aesthetic, lo-fi, nostalgic, surreal` |
| Math Rock | Complex rhythms, technical | `math rock, complex time signatures, tapping guitar, angular rhythms` |
| City Pop | 80s Japanese pop | `city pop, 1980s Japanese pop, warm synths, smooth vocals, groovy bass` |
| Sophisti-Pop | Polished 80s pop/jazz | `sophistipop, jazzy chords, polished production, smooth male vocals, 80s` |
| Afrobeats | West African pop | `afrobeats, danceable, percussion-heavy, warm guitar, 108 BPM` |
| Amapiano | South African deep house | `amapiano, log drum, shaker, deep house, piano stabs, 112 BPM` |
| Gregorian Dubstep | Chant + electronic (experimental) | `gregorian chant, dubstep bass, ethereal choir, heavy drops` |

---

## Part 12: Common Mistakes That Produce Bad Results

### The Top 10 Prompt Failures

1. **Too vague:** "upbeat pop" produces detergent-commercial music. Add subgenre, instruments, production style.

2. **Too many conflicting genres:** "jazz hip-hop classical electronic lo-fi" produces confusion, not fusion. Pick 1 primary + 1 secondary max.

3. **Missing BPM:** "Chill lo-fi beat" could be 60 BPM or 95 BPM -- radically different feels. Always include.

4. **Contradicting moods:** "aggressive, peaceful, calm, intense" simultaneously pushes output toward bland middle ground.

5. **Vague adjectives:** "beautiful," "cool," "epic," "amazing" -- these do not convey musical information. Use specific mood/production terms.

6. **Forgetting vocal instructions:** Suno defaults to adding vocals. Always specify "instrumental" or "no vocals" explicitly if you do not want singing.

7. **Over-prompting:** 15+ tags average into generic mush. 5-8 is the sweet spot.

8. **Ignoring production tags:** Most users describe genre and mood but never describe the sonic texture of the mix. Production tags are the biggest untapped lever.

9. **Lyrics too long per section:** More than 8 lines per verse or 4 per chorus creates cramped, rushed vocal delivery.

10. **Style/lyrics emotional mismatch:** Happy lyrics with "dark, brooding, melancholic" style prompt creates incoherent output.

### Platform-Specific Gotchas

**Suno:**
- 62% of extended tracks drift from original prompt. Re-specify style when extending.
- Free tier songs are no longer downloadable (2026 change).
- Time signatures beyond 4/4 are unreliable.
- Prompt sweet spot is 15-40 words in style field.

**ElevenLabs:**
- `prompt` and `composition_plan` are mutually exclusive -- use one or the other.
- `seed` only works with `composition_plan`, not with `prompt`.
- Only 3/20 vocal tracks were usable in batch testing. Instrumentals are more reliable.
- Complex jazz and classical arrangements fall short.
- `respect_sections_durations: true` adds latency. Use `false` unless sync matters.

**ACE-Step:**
- Do NOT use the LM model for BPM/key detection -- it hallucinates. Use external tools.
- Turbo model (8 steps) is for iteration only. Use SFT (50+ steps) for final renders.
- LoRA scale >80% creates artifacts. Stay in 30-60% range.
- More than 7 tags creates incoherent output.

**Udio:**
- No documented negative prompt syntax. Use specific positive descriptors instead.
- Mix quality tags ("clean mix", "polished", "streaming-ready") matter more than in other platforms.
- Best results come from natural language, not rigid metatag notation.

---

## Part 13: Building a Personal Prompt Library

### Organization System (Power User Method)

```
prompt-library/
  by-genre/
    hip-hop/
      boom-bap.txt        # Tested prompt + notes on results
      trap.txt
      lo-fi.txt
    electronic/
      deep-house.txt
      synthwave.txt
    ...
  by-mood/
    dark-moody.txt
    uplifting-euphoric.txt
    cinematic-epic.txt
    intimate-acoustic.txt
  by-use-case/
    background-music.txt
    sync-licensing.txt
    social-media.txt
    podcast-intro.txt
  templates/
    5-part-formula.txt
    7-element-extended.txt
    negative-prompt-library.txt
  favorites/                # Your best-performing prompts with audio links
    genre-results.txt
```

### What to Record for Each Prompt

- The exact prompt text used
- Platform and model version (Suno v5.5, ElevenLabs music_v1, ACE-Step 1.5 XL SFT)
- What you liked about the output
- What you would change
- Rating (1-5)
- Tags for searchability

### Suno Built-In Features

- **Save prompt presets** in your Library for quick reuse
- **Suno Personas:** Lock in vocal timbre so you do not have to re-prompt voice identity every time
- **Custom Models** (Pro/Premier): Upload 6+ original tracks to fine-tune on your style

### The "Top-Loaded Palette" Formula

For building a reusable prompt library, use this character-efficient structure:
```
[Mood] + [Energy] + [2 Instruments] + [Vocal Identity]
```
This anchors the model's internal weights, reduces hallucinations, and reportedly cuts wasted credits by ~60%.

---

## Part 14: Using Claude/ChatGPT as a Prompt Optimizer

### The Three-Step Workflow

1. **Creative Direction (describe what you want in natural language):**
   Tell Claude/ChatGPT: "I want an upbeat indie pop song about finally leaving a toxic job. Make it hopeful, not angry. Include a bridge where the character realizes their worth."

2. **Technical Translation (convert to platform-specific format):**
   Ask: "Turn this into a Suno AI prompt with genre tags, tempo, vocal style, and production notes. Keep it under 200 characters for the style field."

3. **Generate and Iterate:**
   Generate 2-4 versions, pick the best, then refine.

### System Prompt for Claude (Suno Optimizer)

```
You are an expert AI music prompt engineer for Suno v5.5. When given a song concept, you output:

1. STYLE PROMPT (under 200 characters): Genre + subgenre, mood, vocal style, key instruments, production quality, BPM

2. LYRICS with metatags: Use [Verse], [Chorus], [Bridge], [Outro], [Intro], [Instrumental]. Include inline delivery cues like (whispered), (belted), (spoken word) where appropriate.

Rules:
- Front-load genre and mood (they carry the most weight)
- Always include BPM
- Use 5-8 style tags, no contradictions
- Keep verse lyrics to 6-8 lines, chorus to 4 lines
- Add [Instrumental] sections for variety
- Use specific instrument names (Rhodes, not "piano"; 808, not "drums")
- Include at least one production tag (lo-fi, polished, reverb-drenched, etc.)
```

### System Prompt for Claude (ElevenLabs Optimizer)

```
You are an expert AI music prompt engineer for ElevenLabs Music API. When given a song concept, output a complete composition_plan JSON with:

1. positive_global_styles (5-10 items): genre, mood, instruments, production
2. negative_global_styles (3-5 items): explicitly exclude unwanted elements
3. sections array with:
   - section_name
   - duration_ms (3000-120000)
   - positive_local_styles (section-specific style overrides)
   - negative_local_styles (section-specific exclusions)
   - lines (lyrics, max 30 per section)

Rules:
- Styles must be in English (lyrics can be any language)
- Negative styles are MORE impactful than positive -- use liberally
- Use "solo" prefix to isolate instruments
- Use "a cappella" to isolate vocals
- Include key + tempo + emotional tone for best results
- Performance directions go in styles, NOT in lyrics
- Phonetic sounds like (hmmm), (ooh), (yeah) ARE acceptable in lyrics
```

### System Prompt for Claude (ACE-Step Optimizer)

```
You are an expert AI music prompt engineer for ACE-Step 1.5. When given a song concept, output:

1. TAGS (3-7 comma-separated): Primary genre, secondary influence, mood, key instruments, tempo, production style

2. LYRICS with structure tags: [Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Instrumental]. Use performance modifiers: [Chorus - anthemic], [Verse - whispered], etc.

Rules:
- Primary genre first in tags (carries most weight)
- Always include BPM
- Use UPPERCASE for shouted/emphasized words in lyrics
- Use (parentheses) for background vocals
- Keep lines to 6-10 syllables for natural fitting
- 2-3 words per second is the target density
- Add [Instrumental] sections for variety
- No negative prompt syntax -- be specific about what you want
```

### Batch Prompt Generation

Generate 10 optimized prompts for a single concept, then generate all 10 on the platform. Pick the best. This is cheaper than manual iteration and produces better results.

### Specialized GPTs and Claude Skills

- **AI Music Lyric and Prompt Generator** (ChatGPT Store): Trained specifically for Suno format
- **claude-ai-music-skills** (GitHub): Claude Code plugin for album production pipeline
- **Suno Prompt Generator** (howtopromptsuno.com): Web tool for building prompts interactively

---

## Part 15: Cross-Platform Prompt Translation

### Same Idea, Four Platforms

**Concept:** Dark, moody R&B track with male falsetto, minimal production, 78 BPM

**Suno v5.5:**
```
Style: dark R&B, moody atmosphere, male falsetto, minimal beats, synth bass, atmospheric pads, intimate production, 78 BPM
Lyrics: [Verse 1] (whispered) Walking through shadows tonight / ...
```

**ElevenLabs:**
```json
{
  "composition_plan": {
    "positive_global_styles": ["R&B", "dark", "moody", "minimal", "male falsetto", "atmospheric pads", "synth bass", "78 BPM"],
    "negative_global_styles": ["upbeat", "bright", "acoustic", "rock", "aggressive"],
    "sections": [
      {
        "section_name": "Verse 1",
        "duration_ms": 30000,
        "positive_local_styles": ["intimate", "breathy", "whispered"],
        "lines": ["Walking through shadows tonight", "..."]
      }
    ]
  }
}
```

**ACE-Step:**
```
Tags: R&B, dark, moody, minimal, male vocals, synth bass, 78 BPM
Lyrics:
[Verse 1 - whispered]
Walking through shadows tonight
...
```

**Udio:**
```
Dark moody R&B, male falsetto vocals, minimal production, atmospheric synth pads, intimate and introspective, synth bass, clean mix, 78 BPM
```

### Key Translation Differences

| Dimension | Suno | ElevenLabs | ACE-Step | Udio |
|-----------|------|-----------|---------|------|
| **Prompt location** | Style field + lyrics field | composition_plan JSON | Tags field + lyrics field | Single prompt field |
| **Negative prompts** | In style: "no X" | Dedicated arrays | Not supported | Not documented |
| **Structure control** | Metatags in lyrics | Sections with duration_ms | Structure tags in lyrics | Natural language |
| **Vocal switching** | Inline tags | Per-section styles | Performance modifiers | Per-segment prompts |
| **BPM** | In style field | In styles array | In tags field | In prompt |
| **Key signature** | In style field | In styles array | In JSON metadata | In prompt |
| **Max duration** | 8 min (with extend) | 10 min | 10 min | 10 min |
| **Negative syntax** | "no X" | Array of strings | None | None |

### Platform Selection Guide

| Use Case | Best Platform | Why |
|----------|--------------|-----|
| Songs with vocals | Suno v5.5 | Best vocal quality and diversity |
| Instrumentals | ElevenLabs | Consistently strong instrumentals |
| Background music | ElevenLabs | Best value, clean licensing |
| Electronic/synth | ElevenLabs | Strongest in this domain |
| Experimentation/iteration | ACE-Step | Free, unlimited, local |
| Voice cloning + music | Suno (Voices) | 30-second vocal cloning |
| Custom style training | ACE-Step (LoRA) | 8-20 songs = your own model |
| Section-level editing | ElevenLabs | Most precise section control |
| Odd time signatures | Udio | Better handling than Suno |
| Maximum control | ElevenLabs API | Composition plan + seed + per-section styles |
| Zero cost | ACE-Step | Apache 2.0, run locally |
| MIDI export | Suno (Premier) | Extract progressions for DAW |

---

## Part 16: Production Tags Deep Dive

Production tags are the biggest untapped lever in AI music prompting. Most users describe genre and mood but never describe the sonic texture.

### The Production Tag Spectrum

**Lo-Fi / Raw:**
`lo-fi`, `tape hiss`, `vinyl crackle`, `cassette warmth`, `tape saturation`, `bedroom recording`, `rough mix`, `raw`, `unpolished`, `demo quality`, `four-track recording`, `analog warmth`, `bit-crushed`

**Clean / Professional:**
`polished production`, `radio-ready`, `crisp`, `clean mix`, `studio quality`, `pristine`, `balanced mix`, `professional mastering`, `tight low-end`, `controlled sub-bass`, `streaming-ready`

**Spatial / Atmospheric:**
`reverb-drenched`, `spacious`, `wide stereo image`, `cathedral reverb`, `stadium reverb`, `immersive`, `ambient wash`, `room ambience`, `hall reverb`, `plate reverb`

**Dry / Intimate:**
`dry mix`, `close-mic`, `intimate`, `no effects`, `direct`, `in-your-ear`, `ASMR-like`

**Vintage / Retro:**
`vintage`, `retro`, `analog`, `tube saturation`, `warm`, `1960s recording`, `1970s console`, `1980s gated reverb`, `golden era`

**Modern / Digital:**
`modern production`, `crisp digital`, `compressed and loud`, `sidechain pumping`, `digital clarity`, `hyper-produced`

### Udio Quality Stack (Critical for That Platform)

Udio responds more to mix/production tags than any other platform. Essential stack:
- Mix clarity: `clean mix`, `polished`, `pristine`
- Stereo: `wide stereo image`, `spacious`, `immersive`
- Low-end: `tight bass`, `controlled sub-bass`, `punchy`
- Character: `warm tape saturation`, `vintage crackle`, `analog warmth`

---

## Part 17: Community Resources

### Subreddits

- **r/SunoAI** (100,000+ members) - The largest AI music community. Prompt sharing, output critique, technique discussion. Best for Suno-specific knowledge.
- **r/aimusic** - Cross-platform AI music discussion. Good for comparative analysis.
- **r/UdioMusic** - Udio-specific community.
- **r/StableAudio** - Open-source AI music discussion including ACE-Step.

### Discord Servers

- **ACE-Step Official** (12,000+ members) - discord.gg/PeWDxrkdj7 - LoRA training, prompt sharing, technical help
- **Suno Official Discord** - Prompt polls, community challenges, extension technique discussion
- **SPACEJAMZ** - "The AI-Human Hybrid Facility" - Advanced prompt engineering, treats AI tools as raw material
- **Learn Prompting** - Cross-tool prompt engineering community

### YouTube Channels (AI Music Focus)

- **AI Music Lab** - Suno tutorials, prompt breakdowns
- **Music Production with AI** - Cross-platform workflow guides
- **Prompt Engineering for Music** - Technique-focused channel

### Websites and Tools

- **hookgenius.app** - Comprehensive Suno guides, style tag research, prompt analysis
- **howtopromptsuno.com** - Prompt generator tool, genre list, metatag reference
- **usesuno.com/styles** - Copy-paste style database (2026)
- **openmusicprompt.com** - Multi-platform prompt guides and templates
- **sunometatagcreator.com** - Interactive metatag builder
- **musci.io/blog/suno-prompts** - 100+ tested prompts
- **jackrighteous.com** - A-Z Suno prompt guides, legal guides, negative prompting
- **boppy.me** - Free ACE-Step web service, no install
- **musicsmith.ai** - Cross-platform prompt guide

### GitHub Resources

- **ace-step/awesome-ace-step** - Curated list of ACE-Step projects, UIs, plugins
- **bitwize-music-studio/claude-ai-music-skills** - Claude Code music production plugin
- **AlijeeWrites/suno-ai-prompts-book-pdf-2026-guide** - 3,500+ style tags PDF

### Books and Guides

- **Suno AI Prompts Book (2026)** - 3,500+ style tags with genre-specific templates
- **AI Music and the Law in 2026** (jackrighteous.com) - Legal guide for AI music creators

---

## Part 18: Quick Reference Cheat Sheet

### The One-Minute Prompt

If you have 60 seconds, use this formula:
```
[Specific genre], [one mood word], [one instrument], [vocal or instrumental], [BPM]
```
Example: `indie rock, melancholic, jangly guitar, male vocals, 128 BPM`

### The Five-Minute Prompt

```
[Genre + subgenre], [mood + energy], [2-3 specific instruments], [vocal character + delivery + effect], [production style], [BPM], [era if relevant]
```
Example: `neo-soul, smooth and intimate, Rhodes electric piano, warm sub bass, brushed drums, silky female vocals with runs, warm analog production, 78 BPM`

### Universal Rules (All Platforms)

1. Genre first, always
2. Use subgenres, not base genres ("synth-pop" not "pop")
3. Always include BPM
4. 5-8 tags is the sweet spot
5. No contradicting moods
6. Include at least one production tag
7. Generate multiple versions and cherry-pick
8. Iterate by changing one variable at a time
9. Negative prompts > more positive prompts (when available)
10. "Cinematic" is the universal quality upgrade modifier

### Emergency Fixes

| Problem | Fix |
|---------|-----|
| Output too generic | Add subgenre + production tags |
| Unwanted vocals | "instrumental only, no vocals, no singing" |
| Wrong tempo | Always specify exact BPM |
| Muddy audio | Add "clean mix, polished, crisp" |
| Wrong mood | Negative prompt the unwanted mood + stronger positive mood |
| Instruments bleeding | Use "solo [instrument]" prefix |
| Style drift on extend | Re-specify full style when extending |
| Vocals sound robotic | Try different vocal character tags, regenerate 3-5x |
| Too much reverb | Add "dry mix, close-mic, intimate" |
| Too busy/cluttered | Add "minimal, sparse, stripped back" |

---

## Sources

### Guides and Analysis
- [The Complete Suno Prompt Guide 2026 - HookGenius](https://hookgenius.app/learn/suno-prompt-guide-2026/)
- [1,000+ Suno Prompts Analysis - HookGenius](https://hookgenius.app/learn/suno-style-tag-research/)
- [Suno Metatags Complete List - HookGenius](https://hookgenius.app/learn/suno-metatags-complete-list/)
- [Suno Negative Prompting Guide - HookGenius](https://hookgenius.app/learn/suno-negative-prompting/)
- [Suno Style Tags: 300+ Tested Tags - HookGenius](https://hookgenius.app/learn/suno-style-tags-guide/)
- [100+ AI Music Prompts Vault - Undetectr](https://undetectr.com/blog/ai-music-prompts-vault)
- [Suno Prompts: 100+ Examples - Musci.io](https://musci.io/blog/suno-prompts)
- [Suno Tags List Complete Guide - Musci.io](https://musci.io/blog/suno-tags)
- [ElevenLabs Music Prompt Guide - fal.ai](https://fal.ai/learn/biz/eleven-music-prompt-guide)
- [ElevenLabs Composition Plans Docs](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans)
- [ElevenLabs Music Best Practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices)
- [Udio AI Prompt Guide - OpenMusicPrompt](https://openmusicprompt.com/blog/udio-ai-prompt-guide)
- [ACE-Step Prompt Guide - Ambience AI](https://www.ambienceai.com/tutorials/ace-step-music-prompting-guide)
- [ACE-Step Musicians Guide - GitHub](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md)
- [AI Music Generation Prompts Best Practices - MusicSmith](https://musicsmith.ai/blog/ai-music-generation-prompts-best-practices)
- [Effective AI Music Prompts - MusicMakerApp](https://www.musicmakerapp.com/creation-lab/resources/write-effective-prompts-for-ai-music)
- [Ultimate Prompt Engineering Guide for AI Music - AI Music Street](https://aimusicstreet.com/the-ultimate-guide-to-prompt-engineering-for-ai-music-generation/)
- [Prompt Engineering for AI Music: Genre Templates - Sonygram](https://sonygram.ai/blogs/prompt-engineering-for-ai-music)

### Community and Resources
- [r/SunoAI Community](https://reddit.com/r/SunoAI)
- [Suno Prompt Generator - HowToPromptSuno](https://howtopromptsuno.com/)
- [Suno Styles Database 2026 - UseSuno](https://usesuno.com/styles)
- [Suno Genre Wheel](https://suno.com/labs/genre-wheel)
- [Every Music Genre Known - HowToPromptSuno](https://howtopromptsuno.com/every-genre-known)
- [Suno AI Prompts Book PDF 2026 - GitHub](https://github.com/AlijeeWrites/suno-ai-prompts-book-pdf-2026-guide)
- [Claude AI Music Skills - GitHub](https://github.com/bitwize-music-studio/claude-ai-music-skills)
- [ACE-Step Discord](https://discord.gg/PeWDxrkdj7)
- [Awesome ACE-Step - GitHub](https://github.com/ace-step/awesome-ace-step)

### Workflows and Tutorials
- [Suno AI + ChatGPT Workflow - Medium](https://james-palm.medium.com/suno-ai-chatgpt-the-insane-workflow-that-creates-hit-songs-in-under-10-minutes-be5bfbe80c6e)
- [7 Suno Prompt Styles That Generate Streams - Medium](https://james-palm.medium.com/7-suno-ai-prompt-styles-that-actually-generate-streams-in-2026-d9b2b2dbb4a2)
- [Complete List of Suno Prompts & Styles - Medium](https://travisnicholson.medium.com/complete-list-of-prompts-styles-for-suno-ai-music-2024-33ecee85f180)
- [Suno AI Prompts Master List - Medium](https://medium.com/write-your-world/mastering-suno-ai-prompts-list-styles-cheat-sheet-pro-workflow-guide-2026-2bc874e8b57f)
- [Best Prompts for Suno AI - Jack Righteous](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/best-prompts-for-suno-ai-2026-guide-to-better-results)
- [Suno A-Z Prompts Guide - Jack Righteous](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/bookmark-this-suno-ai-a-z-prompts-guide-a-to-c)

### Legal
- [AI Music Copyright 2026 - Jam.com](https://jam.com/resources/ai-music-copyright-2026)
- [AI Music Law 2026 - Jack Righteous](https://jackrighteous.com/en-us/blogs/creator-commerce/ai-music-law-what-creators-can-and-cannot-do-2026)
- [AI Music and Artist Ownership - Soundverse](https://www.soundverse.ai/blog/article/ai-music-and-artist-ownership-explained-0904)

### Platform Documentation
- [Suno Help Center](https://help.suno.com)
- [ElevenLabs API Reference - Compose](https://elevenlabs.io/docs/api-reference/music/compose-detailed)
- [ElevenLabs Music Capabilities](https://elevenlabs.io/docs/overview/capabilities/music)
- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5)
- [Udio Guide 2026 - AI Tools DevPro](https://aitoolsdevpro.com/ai-tools/udio-guide/)
