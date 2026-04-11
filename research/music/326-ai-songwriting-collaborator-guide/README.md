# 326 - AI Songwriting Collaborator Guide: Writing "The Summer of 26"

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Complete guide to writing original lyrics for a summer festival anthem using AI collaboration - covers structure, rhyme, hooks, melody, crowd elements, and platform-specific formatting
> **Related:** Doc 319 (AI Music Platforms), Doc 320 (Anatomy of Viral Summer Songs), Doc 320 (ElevenLabs Music API)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **AI role** | USE AI as brainstorming partner and variation generator, NOT as the songwriter. You write the core ideas, AI expands/refines/suggests alternatives |
| **Song structure** | USE ABABCB (verse/chorus/verse/chorus/bridge/chorus) - the dominant modern pop/anthem structure. Hook within first 12 seconds |
| **Rhyme scheme - verses** | USE ABAB or AABB for sung verses, multisyllabic internal rhyme for rap verses |
| **Rhyme scheme - chorus** | USE AABB (couplets) for maximum singability and memorability |
| **Hook type** | USE melodic hook with rise-then-fall contour + one unusual interval leap. Repeat 3-4x minimum |
| **Syllable density** | USE 8-12 syllables/line for sung parts, 11-16 syllables/bar for rap verses at 118 BPM |
| **Bridge strategy** | USE key change or borrowed chord (bIII, bVII) + shift from "we" to "I" perspective + highest melodic moment |
| **Crowd elements** | USE call-and-response in chorus, a chant section, and "oh-oh-oh" singalong hook |
| **AI workflow** | USE Claude for lyric drafting/variations, Suno for audio generation with [Section] tags, ElevenLabs composition plans for precise control |
| **Authenticity** | ALWAYS feed AI your own lines first, use AI to expand/rhyme/restructure. Never accept generic AI output wholesale |

---

## Part 1: Using AI as a Songwriting Collaborator

### The Right Mindset

AI is not the songwriter. AI is the world's most patient co-writer who never gets tired and can generate 50 variations in a minute. Your job is:

1. **Bring the vision** - the emotional truth, the specific details, the story
2. **Prompt with specificity** - generic prompts produce generic lyrics
3. **Curate ruthlessly** - take the 10% that's gold, discard the 90% that's competent but generic
4. **Inject your voice** - rewrite AI suggestions in YOUR words, YOUR slang, YOUR humor

### Best Prompting Techniques for Claude/ChatGPT

#### Technique 1: Seed with Your Own Lines

Instead of: "Write lyrics about a music festival in Maine"

Do this:
```
I'm writing a summer anthem called "The Summer of 26" about a music festival 
called ZAO Stock happening October 3 in Ellsworth, Maine. Here are some raw 
lines I've started with:

"Counting down the days till October"
"Everybody's flying in"
"First time we meet face to face"

Help me develop these into a full verse. Keep the conversational tone. 
The vibe is: anticipation + invitation + community pride. 
Style reference: somewhere between "Empire State of Mind" (Jay-Z) and 
"San Francisco" (Scott McKenzie) but for a small-town indie fest.
```

#### Technique 2: Brand Voice Training

Feed the AI your previous lyrics, social posts, or writing samples:
```
Here are 5 things I've written before that capture my voice:
[paste examples]

Now write in THIS voice, not generic "songwriting AI" voice. 
My style tends to be: [specific, conversational, uses humor, references 
real places and people, avoids cliches like "beneath the stars"]
```

#### Technique 3: Constraint-Based Generation

```
Write 4 variations of a chorus for "The Summer of 26" with these constraints:
- Exactly 4 lines
- AABB rhyme scheme
- Must include the phrase "Summer of 26"
- Must include a reference to Maine or Ellsworth
- Each line 6-10 syllables (singable, not dense)
- Mood: euphoric anticipation
- Must work as a crowd singalong at a festival
```

#### Technique 4: Role Assignment

```
You are a Grammy-winning songwriter who specializes in festival anthems 
and place-based songs. You've written songs like "Empire State of Mind" 
and "San Francisco." 

I need you to help me write a hook for a song about a music festival 
in Maine. The hook needs to:
- Be hummable after one listen
- Work as a crowd chant
- Contain a place reference
- Be under 8 words
```

#### Technique 5: Iterative Refinement

```
Here's my current chorus:
[paste chorus]

What I like: [specific things]
What's not working: [specific issues]
The feel I'm going for: [reference song/artist]

Give me 3 alternative versions that keep what I like but fix what's not working.
```

### Claude vs ChatGPT for Songwriting

| Aspect | Claude | ChatGPT |
|--------|--------|---------|
| **Emotional depth** | Stronger - better at nuanced, layered lyrics | Good but tends toward surface-level emotion |
| **Following constraints** | Excellent - respects syllable counts, rhyme schemes precisely | Good but sometimes drifts from constraints |
| **Avoiding cliches** | Better - more willing to suggest unexpected imagery | More prone to "beneath the stars" type cliches |
| **Rhyme quality** | Strong - finds creative near-rhymes and slant rhymes | Strong - larger rhyme vocabulary |
| **Iterative collaboration** | Excellent - remembers context, builds on feedback | Good but context can drift in long sessions |
| **Music theory knowledge** | Good conceptual understanding | Good, especially with plugins |
| **Best for** | Lyric writing, emotional storytelling, structural advice | Quick generation, many variations, rhyme finding |

**Recommendation:** Use Claude for the core lyric writing and structural decisions. Use ChatGPT for rapid-fire rhyme brainstorming and generating many variations quickly. Use both and pick the best from each.

---

## Part 2: Song Structure Formulas

### The ABABCB Structure (Recommended for "Summer of 26")

This is the dominant structure in modern pop, rock, and hip-hop anthems:

```
[Intro]           - 4-8 bars, instrumental hook or ambient scene-setting
[Verse 1] (A)     - 8-16 bars, sets the scene, introduces the story
[Pre-Chorus]      - 4 bars, builds tension toward the chorus
[Chorus] (B)      - 8 bars, the hook, the singalong, the title
[Verse 2] (A)     - 8-16 bars, deepens the story, new details
[Pre-Chorus]      - 4 bars, same or variation
[Chorus] (B)      - 8 bars, same chorus (familiarity = singability)
[Bridge] (C)      - 8 bars, emotional peak, musical contrast, key change
[Final Chorus] (B)- 8-16 bars, often doubled or with ad-libs/crowd chant
[Outro]           - 4-8 bars, fade or final hook statement
```

**Total duration at 118 BPM:** ~3:15 (perfect for streaming + TikTok clip)

### Why ABABCB Works for Festival Anthems

1. **Two verses** = enough story without dragging
2. **Three choruses** = the hook gets stuck by repetition
3. **The bridge** = the "moment" (Taylor Swift's bridge scream in "Cruel Summer", the key change in "Livin' on a Prayer")
4. **Pre-chorus** = builds anticipation, crowd knows the chorus is coming

### Alternative Structures

| Structure | Formula | Best For | Example |
|-----------|---------|----------|---------|
| **ABABCB** | V-C-V-C-B-C | Festival anthems, pop hits | "Cruel Summer", "About Damn Time" |
| **AABA** | V-V-Bridge-V | Classic standards, storytelling | "Yesterday", "Over the Rainbow" |
| **ABAB** | V-C-V-C | Short, punchy songs, punk | "Blitzkrieg Bop", "Seven Nation Army" |
| **ABABCBB** | V-C-V-C-B-C-C | Epic anthems, double final chorus | "Bohemian Rhapsody" (loosely) |
| **Hook-first** | C-V-C-V-C-B-C | TikTok-optimized, immediate hook | Many 2024-2026 viral hits |

### Recommended Structure for "The Summer of 26"

```
[Intro]        - 8 bars: festival sounds fading in, synth pad, four-on-the-floor kick
[Chorus]       - 8 bars: HOOK FIRST (TikTok optimization, immediate earworm)
[Verse 1]      - 16 bars: scene-setting, "everybody's flying in", anticipation
[Pre-Chorus]   - 4 bars: tension build, "can you feel it?"
[Chorus]       - 8 bars: full chorus with singalong
[Verse 2]      - 16 bars: deeper story, specific people/places, community details
[Pre-Chorus]   - 4 bars: variation
[Chorus]       - 8 bars: chorus
[Bridge]       - 8 bars: EMOTIONAL PEAK - key change, perspective shift, "scream" moment
[Final Chorus] - 16 bars: doubled chorus with crowd chant/call-and-response
[Outro]        - 8 bars: instrumental hook fading, festival sounds
```

---

## Part 3: Rhyme Scheme Patterns

### For Sung Verses (Melodic Parts)

| Scheme | Pattern | Effect | Example |
|--------|---------|--------|---------|
| **ABAB** | Line 1 rhymes with 3, line 2 rhymes with 4 | Forward momentum, classic feel | Most pop verses |
| **AABB** | Couplets (1-2 rhyme, 3-4 rhyme) | Simple, satisfying, easy to follow | Chorus-friendly |
| **ABCB** | Only lines 2 and 4 rhyme | Relaxed, conversational, folk-influenced | Story-driven verses |
| **XAXA** | Lines 1 and 3 don't rhyme, 2 and 4 do | Open, airy, modern pop | Singer-songwriter |

**For "Summer of 26" sung sections:** AABB for the chorus (maximum singability) and ABAB for the verses (drives forward motion).

### For Rap Verses

| Scheme | Pattern | Effect | Difficulty |
|--------|---------|--------|------------|
| **End rhyme couplets** | AA BB CC DD | Foundation, old school, accessible | Beginner |
| **Alternate end rhyme** | ABAB | More sophisticated flow | Intermediate |
| **Internal rhyme** | Rhymes within bars, not just at ends | Complex, showcases skill | Advanced |
| **Multisyllabic** | 2-3 syllable rhyme clusters | Impressive, Eminem-style | Advanced |
| **Chain rhyme** | End of line 1 rhymes with middle of line 2 | Flowing, connected feel | Advanced |

**For "Summer of 26" rap sections:** Couplets (AABB) with internal rhymes. Accessible enough for crowd engagement but skilled enough to impress.

### Rhyme Density Guidelines

| Style | Rhyme Density | Example |
|-------|--------------|---------|
| **Casual/melodic rap** | 0.25-0.30 (1 rhyme per 3-4 words) | Drake, Post Malone |
| **Standard rap** | 0.30-0.40 (1 rhyme per 2.5-3 words) | Kendrick, Cole |
| **Technical rap** | 0.40-0.60 (nearly every other word rhymes) | Eminem, MF DOOM |
| **Sung chorus** | 0.15-0.25 (rhymes at line ends only) | Most pop choruses |

**For "Summer of 26":** Aim for 0.25-0.35 density in rap verses (accessible, not showing off) and 0.20 in sung chorus (clean, memorable).

---

## Part 4: How to Write a Hook That Sticks

### The Science (APA/Durham University Research)

Kelly Jakubowski's research at Durham University identified three melodic features of earworms:

1. **Faster tempo** than average pop songs (earworms tend to be uptempo)
2. **Generic overall melodic contour** - rise then fall pattern (like nursery rhymes)
3. **Unusual intervals within that contour** - unexpected leaps that surprise the brain

### The Conventions-vs-Originality Paradox

The more conventional your melody's interval patterns and rhythms, the easier it is to remember long-term. But you need ONE unusual element to make it distinctive. The formula is: **95% familiar + 5% surprising.**

Examples:
- "Smoke on the Water" - simple riff with one uncommon interval leap
- "Bad Romance" - nursery rhyme contour (Rah rah ah ah ah) with unexpected pitch drops
- "Can't Get You Out of My Head" - simple repetitive melody with one syncopation twist
- "Seven Nation Army" - entire hook is 7 notes, dead simple, but the rhythm is unusual

### The Hook Formula for "Summer of 26"

| Element | Guideline | Application |
|---------|-----------|-------------|
| **Length** | 4-8 words max | "The Summer of Twenty-Six" (6 syllables) or "Come to Maine this summer" |
| **Melodic shape** | Rise on "Summer", peak on "Twen-", fall on "-ty-Six" | Classic rise-then-fall |
| **Unusual element** | One unexpected interval leap | Leap UP on "Maine" or "Summer" |
| **Rhythm** | Syncopation on one word | Anticipate the downbeat on "Summer" |
| **Repetition** | 3-4x per song minimum | Chorus repeats it, outro chants it |
| **Singability** | All open vowels on held notes | "Oooh" sounds, "ay" in "Maine" |

### Types of Hooks

| Type | Description | Example | Use In Song |
|------|-------------|---------|-------------|
| **Melodic hook** | The tune itself | "Can't Get You Out of My Head" melody | Chorus melody |
| **Lyrical hook** | A phrase that sticks | "Hot Girl Summer" | Title/chorus |
| **Rhythmic hook** | A beat pattern | "We Will Rock You" stomp-stomp-clap | Intro/outro |
| **Instrumental hook** | A riff or lick | "Seven Nation Army" guitar riff | Intro, between sections |
| **Production hook** | A sound effect or texture | The whistle in "Moves Like Jagger" | Throughout |

**For "Summer of 26":** Layer ALL five hook types. Melodic hook in chorus melody. Lyrical hook = "The Summer of 26." Rhythmic hook = hand-clap pattern. Instrumental hook = synth riff in intro. Production hook = crowd noise/festival ambience.

---

## Part 5: The Earworm Formula - Deep Dive

### Specific Melodic Patterns That Get Stuck

| Pattern | Description | Why It Works | Example |
|---------|-------------|-------------|---------|
| **Stepwise motion + leap** | Move by steps (C-D-E) then leap (E to A) | Predictable then surprising | "Moves Like Jagger" verse |
| **Descending sequence** | Same melody fragment, each time lower | Creates satisfying resolution | "Yesterday" (Beatles) |
| **Ascending sequence** | Same fragment, each time higher | Builds excitement/anticipation | "Livin' on a Prayer" pre-chorus |
| **Pentatonic melody** | Using only 5 notes (no half steps) | Universally appealing across cultures | "My Girl" (Temptations) |
| **Call and response** | Phrase A answered by Phrase B | Brain wants to "complete" the pattern | "Lean On Me" |
| **Rhythmic repetition** | Same rhythm, different notes | Rhythm sticks even when melody varies | "We Will Rock You" |

### Intervals That Create Earworms

| Interval | Distance | Effect | Example |
|----------|----------|--------|---------|
| **Perfect 4th** (up) | C to F | Strong, anthem-like, "Here Comes the Bride" | "Amazing Grace" opening |
| **Perfect 5th** (up) | C to G | Open, heroic, powerful | "Star Wars" theme |
| **Minor 3rd** (down) | E to C | Familiar, nursery rhyme, comforting | "Ring Around the Rosie" |
| **Major 6th** (up) | C to A | Yearning, emotional, reaching | "My Bonnie Lies Over the Ocean" |
| **Octave leap** | C to C (up) | Dramatic, attention-grabbing | "Somewhere Over the Rainbow" |

**For "Summer of 26":** Build the hook melody around stepwise motion (scale movement) with ONE perfect 4th or 5th leap on the key word. The word "Summer" or "Maine" should land on that leap.

### Rhythmic Patterns That Stick

| Pattern | Description | Effect |
|---------|-------------|--------|
| **Syncopation** | Accent on the "and" of the beat | Creates groove, head-nodding |
| **Dotted rhythm** | Long-short-long-short | Bouncy, energetic, danceable |
| **Anticipation** | Starting a phrase just before the beat | Creates urgency and forward motion |
| **Rest then attack** | Silence followed by strong note | Dramatic, attention-grabbing |

---

## Part 6: Syllable Density - Rap vs Singing

### Words Per Line Guidelines

| Style | Syllables Per Line | Words Per Line (approx) | At 118 BPM |
|-------|-------------------|------------------------|------------|
| **Sung chorus** | 6-10 | 4-7 | Comfortable, singable |
| **Sung verse** | 8-12 | 5-8 | Room for melody |
| **Melodic rap** | 10-14 | 7-10 | Drake/Post Malone zone |
| **Standard rap** | 12-16 | 8-12 | Kendrick/Cole zone |
| **Fast rap** | 16-24 | 12-18 | Eminem/Tech N9ne zone |
| **Double-time** | 24-32 | 18-24 | Show-off territory |

### The 118 BPM Sweet Spot

At 118 BPM (the recommended tempo for "Summer of 26"):

- **Rap verses:** 11-14 syllables per bar is the sweet spot. This gives enough room for wordplay without sounding rushed. At 118 BPM, you have moderate space - not as relaxed as 90 BPM boom-bap, not as tight as 140+ BPM drill.
- **Sung chorus:** 6-10 syllables per line. Open vowels on sustained notes. Leave space for the melody to breathe.
- **Pre-chorus:** 8-12 syllables per line. Building energy but not yet at full density.

### The Breath Rule

At any tempo, take a breath every 1-2 bars. This means:
- At 118 BPM: ~2 seconds per bar, so breathe every 2-4 seconds
- Design line breaks at natural breath points
- Don't sacrifice clarity for syllable count

### Practical Example for "Summer of 26"

**Sung chorus (8 syllables/line):**
```
The Sum-mer of Twen-ty-Six    (7 syllables)
Ev-ry-bo-dy's com-ing quick   (8 syllables)  
From the chan-nel to the stage  (8 syllables)
Turn-ing o-ver a new page      (8 syllables)
```

**Rap verse (12-14 syllables/line):**
```
Flew in from Jack-son-ville, drove up from K-C          (12 syllables)
On-line for years but now you're gon-na see me          (13 syllables)
Ells-worth Maine, Frank-lin Street, the park-let's a-live (13 syllables)
Oc-to-ber third, twen-ty-six, feel the e-ner-gy ar-rive (15 syllables)
```

---

## Part 7: Call-and-Response & Crowd Participation

### Structures That Work Live

| Structure | How It Works | Example | Energy Level |
|-----------|-------------|---------|-------------|
| **Echo** | Artist sings line, crowd repeats exactly | "Is This Love" (Bob Marley) | Medium |
| **Completion** | Artist starts phrase, crowd finishes | "Sweet Caroline" - "BAH BAH BAH" | High |
| **Answer** | Artist asks question, crowd answers | "When I say ZAO, you say STOCK!" | Very high |
| **Chant** | Everyone sings together, no leader needed | "We Will Rock You" stomp-stomp-clap | Maximum |
| **Ad-lib response** | Artist ad-libs, crowd fills gaps | "Yeah!" "Uh!" "Let's go!" | High |

### Designing for "Summer of 26" Live Performance

**Chorus call-and-response:**
```
Artist: "The Summer of--"
Crowd:  "TWENTY SIX!"
Artist: "Everybody's--"
Crowd:  "COMING QUICK!"
```

**Chant section (bridge or outro):**
```
All:    "ZAO! STOCK! ZAO! STOCK!" (4x, with hand claps)
```

**Ad-lib framework:**
```
Verse:  [Line] ... "yeah!"
        [Line] ... "uh!"
        [Line] ... "let's go!"
        [Line] ... "come on!"
```

### The "Oh-Oh-Oh" Principle

The most singable crowd parts use non-lexical vocables - sounds that aren't words:
- "Oh-oh-oh" (The Lumineers - "Ho Hey")
- "Na na na" (Journey - "Don't Stop Believin'")  
- "Hey!" (Outkast - "Hey Ya!")
- "Whoa-oh-oh" (The Killers - "Mr. Brightside")

**For "Summer of 26":** Add an "oh-oh-oh-oh" section before the final chorus. Simple melody, everyone can join regardless of whether they know the lyrics.

---

## Part 8: Writing Lyrics for AI Music Platforms

### Suno v5 Tags and Format

Suno uses section tags in the lyrics field. Keep style descriptions in the style prompt, NOT in lyrics.

```
[Style prompt field:]
summer anthem, uplifting indie pop, electronic, 118 BPM, G major, warm synths, 
four-on-the-floor kick, male vocals, festival energy, hand claps

[Lyrics field:]
[Intro]
(instrumental)

[Chorus]
The Summer of Twenty-Six
Everybody's coming quick
From the channel to the stage
Turning over a new page

[Verse 1]
Counting down the days till October falls
Planes are landing, road trips, midnight calls
First time meeting face to face
Online friends in a real-life place

[Pre-Chorus]
Can you feel it building? (yeah!)
Can you feel it rising? (oh!)

[Chorus]
The Summer of Twenty-Six
Everybody's coming quick
From the channel to the stage
Turning over a new page

[Bridge]
(key change, emotional peak)
I remember when we started
Just a channel, just a dream
Now we're standing here together
And it's bigger than it seemed

[Chorus]
The Summer of Twenty-Six
(crowd: TWENTY SIX!)
Everybody's coming quick
(crowd: COMING QUICK!)
From the channel to the stage
Turning over a new page

[Outro]
(oh-oh-oh-oh) (x4, fading)
```

### Key Suno Rules
- 1-2 genre tags, 2-3 instrument tags, 1-2 mood tags in style prompt
- Section tags: `[Verse]`, `[Chorus]`, `[Bridge]`, `[Pre-Chorus]`, `[Outro]`, `[Intro]`
- Keep lines short - 6-10 syllables for singable parts
- Parenthetical directions like `(whispered)`, `(yeah!)`, `(instrumental)` can work but aren't guaranteed
- Style prompt limit: 1,000 characters on v5 (front-load important tags)
- NO sound cues, asterisks, or style descriptions inside lyrics

### ElevenLabs Composition Plan Format

ElevenLabs uses structured JSON with per-section style control:

```json
{
  "composition_plan": {
    "positive_global_styles": [
      "indie pop", "electronic", "uplifting", "festival energy",
      "118 BPM", "G major", "warm synths", "hand claps"
    ],
    "negative_global_styles": [
      "slow", "sad", "acoustic only", "minimalist", "lo-fi"
    ],
    "sections": [
      {
        "section_name": "Chorus (Hook First)",
        "duration_ms": 20000,
        "positive_local_styles": ["male vocals", "confident", "anthemic", "full band"],
        "lines": [
          "The Summer of Twenty-Six",
          "Everybody's coming quick",
          "From the channel to the stage",
          "Turning over a new page"
        ]
      },
      {
        "section_name": "Verse 1",
        "duration_ms": 30000,
        "positive_local_styles": ["male vocals", "conversational", "rhythmic spoken", "building"],
        "lines": [
          "Counting down the days till October falls",
          "Planes are landing, road trips, midnight calls",
          "First time meeting face to face",
          "Online friends in a real-life place"
        ]
      },
      {
        "section_name": "Bridge",
        "duration_ms": 20000,
        "positive_local_styles": ["emotional", "building", "key change", "wide intervals"],
        "lines": [
          "I remember when we started",
          "Just a channel, just a dream",
          "Now we're standing here together",
          "And it's bigger than it seemed"
        ]
      }
    ]
  }
}
```

### ACE-Step (ZAO OS Built-in)

Use the existing UI at `src/components/music/AiMusicGenerator.tsx`:
- Paste lyrics with section labels
- Select genre pills: pop, electronic, indie
- Set duration: 120 seconds for a verse+chorus demo
- The model interprets structure from the lyrics + genre context

---

## Part 9: What Makes Festival Songs Different

### Festival Anthem DNA

| Element | Regular Pop Song | Festival Anthem |
|---------|-----------------|-----------------|
| **Perspective** | "I" or "you" | "We" and "us" |
| **Lyrics** | Personal story | Universal/communal experience |
| **Hook** | Catchy | Catchy AND singable by 1000 people |
| **Production** | Varies | BIG - wide stereo, sub bass, stadium reverb |
| **Bridge** | Musical contrast | THE MOMENT (scream, drop, key change) |
| **Tempo** | Any | 100-130 BPM (danceable without being exhausting) |
| **Duration** | Any | 3:00-4:00 (long enough to build, short enough to not drag) |
| **Outro** | Quick fade | Extended - crowd chant, instrumental jam, communal moment |
| **Ad-libs** | Optional | Essential - "yeah!", "let's go!", audience cues |

### The Five Requirements of a Festival Song

1. **Singable by people who've heard it twice.** Simple melody, open vowels, short phrases.
2. **Works without knowing the words.** "Oh-oh-oh" sections, clap patterns, chants.
3. **Builds to a moment.** The bridge or drop that makes the crowd explode.
4. **Universal theme wrapped in specific details.** "We" language + place-specific imagery.
5. **Has a visual/physical component.** Hand claps, jumps, arm waves, phone flashlights.

### Writing the "We" Perspective

Kara Johnstad's anthem formula: shift from "I" to "WE" to make the listener feel part of something bigger.

- Bad: "I went to a festival in Maine" (personal diary)
- Better: "We came from everywhere to Maine" (inclusive)
- Best: "From Jacksonville to KC, we all came" (specific + inclusive)

The trick: use specific individual details ("flew in from Jacksonville") to paint a picture, but frame it in communal language ("we're all here now").

---

## Part 10: Ad-libs, Chants, and Crowd Participation Elements

### Ad-lib Placement Guide

| Position | Type | Example | Purpose |
|----------|------|---------|---------|
| **End of line** | Response | "...coming to Maine (yeah!)" | Punctuation, energy |
| **Between verses** | Hype | "Let's GO!" / "Come ON!" | Transition energy |
| **During chorus** | Echo | Main line + "(crowd repeats)" | Engagement |
| **Bridge buildup** | Escalating | "Louder! LOUDER! LOUDER!" | Energy peak |
| **Outro** | Chant | "ZAO! STOCK!" (repeating) | Communal close |

### Chant Design Principles

1. **2-4 syllables max** per chant unit ("ZAO STOCK" = 2 words, 2 beats)
2. **Rhythmic simplicity** - quarter notes or eighth notes, no syncopation
3. **Open vowels** - "oh", "ah", "ay" carry better than closed consonants
4. **Call-and-response works better than unison** for learning the chant
5. **Repeat 4-8 times** minimum for the crowd to lock in

### Phonetic Sounds in Lyrics (AI-Compatible)

These non-word sounds are accepted by Suno and ElevenLabs in lyrics:
- `(ooh)`, `(yeah)`, `(hey)`, `(oh)`, `(huh)`, `(woo)`
- `(na na na)`, `(la la la)`, `(da da da)`
- `(hmm)`, `(ah)`, `(uh)`
- Avoid: `(clap)`, `(stomp)`, `(crowd noise)` - these are style cues, not singable content

---

## Part 11: How to Write a Bridge That Elevates

### The Berklee Approach

From Berklee Online's songwriting program:

1. **Summarize what the music has done so far** - if you can't describe your verse/chorus musically, you can't create meaningful contrast
2. **Contrast is everything** - the bridge should sound different from everything before it
3. **Answer the question: "What is the moral of the story?"** - the bridge is where you zoom out and say the Big Thing

### Bridge Elevation Techniques

| Technique | How | Effect | Example |
|-----------|-----|--------|---------|
| **Key change** | Move up a half step or whole step | Instant emotional lift | "Livin' on a Prayer" (E to F) |
| **Borrowed chord** | Use bIII, bVII, or II major from parallel key | Surprises the ear, adds drama | "Cruel Summer" bridge |
| **Register shift** | Melody moves to highest point in song | Peak emotional intensity | "Cruel Summer" bridge scream |
| **Perspective shift** | Switch from "we" to "I" or present to past | Emotional vulnerability | Adds personal touch to communal song |
| **Rhythmic change** | Half-time feel or double-time | Physical feel changes | Breaks the groove, creates contrast |
| **Strip down** | Remove instruments, just voice + one instrument | Intimacy before explosion | Sets up the final chorus explosion |
| **Build up** | Add layers progressively over 8 bars | Crescendo into final chorus | Classic EDM/pop anthem technique |

### "Summer of 26" Bridge Design

The bridge should be the MOMENT - the part people film on their phones:

```
[Bridge - key change up, stripped back to piano/synth + voice, building]

I remember when we started              (past tense - perspective shift)
Just a channel, just a dream            (vulnerable, honest)
188 deep and growing                    (insider detail = emotional)
(drums start building back in)
Now we're standing here together         (present tense return)
And it's BIGGER than it seemed          (HIGHEST NOTE, held, crowd screams)
(full band crashes back in)

[Crowd] OH-OH-OH-OH! (4x into final chorus)
```

---

## Part 12: Songs About Specific Places That Became Anthems

### Case Studies

| Song | Place | Why It Became an Anthem | Lesson for "Summer of 26" |
|------|-------|------------------------|---------------------------|
| "Empire State of Mind" (Jay-Z) | New York City | Specific NYC details (Tribeca, Broadway, BK) made it universal through specificity | Name real Ellsworth locations: Franklin St, the parklet |
| "San Francisco" (Scott McKenzie) | San Francisco | Captured the ENERGY of a movement, not just the place | Capture the ZAO movement energy, not just Maine geography |
| "Straight Outta Compton" (N.W.A.) | Compton, CA | Confrontational pride in a place others looked down on | Small-town pride - Maine isn't LA, and that's the point |
| "Cleveland Rocks" (Ian Hunter) | Cleveland | Simple, repeated declaration became an actual civic anthem | Repetition of "Maine" or "Ellsworth" as declaration |
| "Welcome to Miami" (Will Smith) | Miami | Invitation + celebration + specific imagery | "Come to Maine" as invitation |
| "California Gurls" (Katy Perry) | California | Fun, aspirational, made people WANT to be there | Make people want to come to ZAO Stock |
| "Viva Las Vegas" (Elvis) | Las Vegas | Energy and excitement of arriving at the destination | Capture the excitement of arriving in Ellsworth |
| "Baltimore" (Prince) | Baltimore | Written in response to a specific moment - urgency | ZAO Stock as a specific moment in time |

### The Pattern: Specificity Creates Universality

Every great place-based anthem follows this paradox: the MORE specific the details, the MORE universal the song feels. "I left my heart in San Francisco" hits harder than "I left my heart in a beautiful city" because specificity creates vivid imagery that listeners can transplant onto their OWN special places.

**For "Summer of 26":** Don't be afraid to name:
- Franklin Street Parklet
- Ellsworth, Maine
- Specific ZAO member names or handles
- Local Maine details (lobster, ocean, craft, small-town charm)
- "188 deep" (community size)
- "From the channel" (Farcaster reference)

---

## Part 13: A/B Testing Lyrics with AI

### The Multi-Variation Workflow

```
Step 1: Write your core concept (3-5 bullet points of what the song is about)
Step 2: Generate 5 chorus variations with Claude
Step 3: Generate 5 more with ChatGPT
Step 4: Pick top 3 from the 10
Step 5: Ask Claude to create 3 hybrid versions combining best elements
Step 6: Share top 3 with community for feedback
Step 7: Generate each finalist on Suno/ElevenLabs to hear them sung
Step 8: Community votes on the audio versions (not just lyrics on paper)
```

### What to A/B Test

| Element | How to Test | What to Measure |
|---------|-------------|-----------------|
| **Hook phrasing** | 3-5 variations of the chorus title line | Which one people can remember after one listen |
| **Verse density** | Sparse (6 syl/line) vs dense (14 syl/line) | Which feels right at 118 BPM |
| **Rhyme scheme** | AABB vs ABAB vs ABCB in verse | Which flows most naturally |
| **Bridge moment** | Key change vs rhythmic change vs strip-down | Which gets the biggest reaction |
| **Crowd element** | Echo vs completion vs chant | Which works best live (test at ZAO Spaces) |
| **Ad-lib placement** | End-of-line vs between-section | Which adds energy without cluttering |

### Using ZAO OS for Testing

1. Generate versions on multiple platforms (Suno, ElevenLabs, ACE-Step)
2. Upload all to ZAO OS via SongSubmit with "Summer of 26 - Test" tag
3. Use the respect-weighted curation system (`src/lib/music/curationWeight.ts`) to let the community vote
4. Run listening sessions in Spaces (live audio rooms) for real-time feedback
5. Iterate based on community data

---

## Part 14: Maintaining Authentic Voice with AI

### The Core Problem

AI lyrics default to "competent but generic." They sound like lyrics. They don't sound like YOU. The difference:

| AI Default | Authentic Version |
|-----------|-------------------|
| "Dancing beneath the stars tonight" | "Dancing drunk in the parking lot at 2 AM" |
| "We came from far and wide" | "Flew in from Jacksonville, drove up from KC" |
| "This is where we belong" | "188 deep in a Farcaster channel" |
| "The music fills the air" | "Steve's been doing this 37 years in basements" |
| "Together we are strong" | "From the channel to the stage, we actually showed up" |

### The Specificity Filter

After every AI-generated line, ask: "Could any song say this, or is this specifically about ZAO Stock in Ellsworth, Maine, in October 2026?"

If any song could say it, rewrite it with:
- A real name
- A real place
- A real detail
- A real inside joke
- A real emotion only YOUR community would feel

### The Voice Injection Process

1. **Write 5-10 lines yourself first** - raw, unpolished, YOUR words
2. **Feed them to AI** with the instruction: "Expand on these in the SAME voice"
3. **Delete anything that doesn't sound like you** talking to a friend
4. **Add back specifics** - names, places, numbers, insider references
5. **Read it aloud** - if it sounds like a Hallmark card, rewrite it
6. **The Drunk Test** - would you shout this at a festival after a few drinks? If yes, it passes

### What AI Does Well vs What You Must Do

| AI Does Well | You Must Do |
|-------------|-------------|
| Rhyme suggestions | Decide which rhymes feel authentic |
| Syllable counting | Decide what to say |
| Structure advice | Bring the emotional truth |
| 50 variations in a minute | Pick the ONE that's real |
| Fixing meter/rhythm | Inject specific details |
| Suggesting metaphors | Choose metaphors from YOUR experience |

---

## Part 15: BPM-Lyric Relationship

### How Tempo Affects Everything

| BPM Range | Mood | Word Choice | Delivery | Best For |
|-----------|------|-------------|----------|----------|
| **60-80** | Introspective, emotional | Long words, complex metaphors, storytelling | Slow, deliberate, room to breathe | Ballads, R&B, lo-fi |
| **80-100** | Laid-back, groovy | Medium density, conversational | Relaxed flow, casual delivery | Hip-hop boom bap, funk |
| **100-120** | Uplifting, energetic | Short punchy words mixed with longer phrases | Confident, building energy | **Summer anthems**, pop, house |
| **120-140** | High energy, danceable | Short words, tight phrasing, percussive consonants | Quick, rhythmic, articulate | EDM drops, fast rap, dance pop |
| **140-160** | Intense, aggressive | Monosyllabic, percussive, staccato | Machine-gun delivery or half-time sing | Drum & bass, drill, punk |
| **160+** | Frantic, extreme | Single syllables, breathless | Double-time or half-time over fast beats | Speedcore, extreme metal |

### At 118 BPM (Recommended for "Summer of 26")

This tempo is in the "Goldilocks zone" for a summer anthem:

- **Fast enough** to feel energetic and danceable
- **Slow enough** for sung melodies to breathe
- **Room for both rap and singing** in the same song
- **Natural walking/light dancing tempo** - matches human movement
- **Matches viral TikTok average** (117 BPM)

#### Word Choice at 118 BPM

- **Favor:** 1-3 syllable words for sung parts ("come", "Maine", "summer", "alive")
- **Avoid:** 4+ syllable words in the hook ("unprecedented", "exhilarating")
- **Exception:** A long word can work if it's THE word of the song ("Twen-ty-Six" = 3 syllables, perfect)
- **Consonants:** Plosives (b, d, k, p, t) add rhythmic punch. Use them on beat accents.
- **Vowels:** Open vowels (ah, oh, ee, ay) sustain well on held notes. Use them on the hook's peak note.

#### Delivery Style at 118 BPM

- **Verses:** Can be rapped (12-14 syllables/bar) or sung (8-10 syllables/line)
- **Chorus:** Sung, open, wide intervals, room for crowd
- **Pre-chorus:** Build from spoken/rap energy toward sung chorus
- **Bridge:** Sung, emotional, possibly slowed (half-time feel for 4 bars)
- **Outro:** Chant tempo - quarter notes at 118 BPM = perfect clap speed

---

## Action Items

- [ ] Write 10-20 raw lines of personal material before opening any AI tool
- [ ] Use Claude to expand those raw lines into full verses (Technique 1: Seed with Your Own Lines)
- [ ] Generate 5 chorus variations with Claude, 5 with ChatGPT, pick top 3
- [ ] Build the ABABCB structure with hook-first opening (see Part 2)
- [ ] Design the bridge "moment" - key change + perspective shift + highest note
- [ ] Add call-and-response elements to the final chorus
- [ ] Add "oh-oh-oh" non-lexical section before final chorus
- [ ] Format lyrics with Suno [Section] tags (see Part 8)
- [ ] Build ElevenLabs composition plan JSON (see Part 8)
- [ ] Generate versions on Suno, ElevenLabs, and ACE-Step (per Doc 319)
- [ ] Upload all versions to ZAO OS for community voting
- [ ] Test crowd elements in a Spaces listening session
- [ ] Apply the Specificity Filter to every line (Part 14)
- [ ] Apply the Drunk Test to the final lyrics (Part 14)

## Sources

### AI Songwriting Collaboration
- [Dr. James Frankel: Move Over ChatGPT, Here Comes Claude](https://www.musictechhelper.com/blog/move-over-chatgpt-here-comes-claude)
- [Alex Couch: Atomic Songwriter GPT](https://medium.com/alex-couch-s-portfolio/i-made-a-gpt-called-atomic-songwriter-0da62aecd657)
- [Fitria Widyani: Beats and Bytes - Pain into Music with Claude and Suno](https://fitriadyaa.medium.com/beats-and-bytes-turning-pain-into-music-with-ai-claude-and-suno-9fea64014bbf)
- [6 Claude Prompts for Music](https://promptadvance.club/claude-prompts/art/music)
- [StockMusicGPT: Generating Lyrics with AI Chatbots](https://stockmusicgpt.com/blog/generating-song-lyrics-with-ai-chatbots)
- [AI Brainstorming for Songwriting 2026](https://www.davidlapadat.com/post/ai-brainstorming-for-songwriting-in-2026-unlock-endless-ideas-and-themes-with-ethical-ai-tools-for)
- [Soundverse: How to Use AI to Write a Song 2026](https://www.soundverse.ai/blog/article/how-to-use-ai-to-write-a-song-0807)
- [The Data Scientist: Writing Song Lyrics with AI Step-by-Step](https://thedatascientist.com/writing-song-lyrics-with-ai-a-step-by-step-guide-for-modern-songwriters/)

### Song Structure
- [Songwriting.net: Common Song Structures](https://www.songwriting.net/blog/bid/207339/Songwriting-Tip-Understanding-the-Most-Common-Song-Structures)
- [Omari MC: Complete Guide to Song Form & Structure](https://www.omarimc.com/a-complete-guide-to-song-form-structure-examples-aaba-aaa-abab-abac/)
- [MasterClass: Learn Common Song Structures 2026](https://www.masterclass.com/articles/songwriting-101-learn-common-song-structures)
- [ProducerHive: Analyzing Common Song Structures](https://producerhive.com/songwriting/analyzing-common-song-structures/)
- [Unison Audio: Song Structure 101](https://unison.audio/song-structure/)

### Rhyme Schemes
- [eMastered: 14 Rap Rhyme Schemes Every Rapper Should Know](https://emastered.com/blog/rap-rhyme-schemes)
- [Stangrtheman: Flow Rhyme Scheme Patterns - Hidden Mathematics Behind Rap](https://stangrtheman.com/rap-flow-rhyme-schemes/)
- [ASCAP: 15 Rhyme Schemes for Songwriters](https://www.ascap.com/help/career-development/15-rhyme-schemes-jordan-reynolds)
- [Songwriting Authority: Rhyme Schemes - Types and When to Use Them](https://songwritingauthority.com/rhyme-schemes-in-songwriting)
- [Rapify AI: Understanding Rhyme Schemes in Hip-Hop](https://rapifyai.net/blog/understanding-rhyme-schemes.html)

### Hooks and Earworms
- [LANDR: Earworm - How to Write Hooks That Get Stuck in Your Head](https://blog.landr.com/earworm-hooks/)
- [uDiscover Music: How to Write a Catchy Song - Anatomy of an Earworm](https://www.udiscovermusic.com/in-depth-features/how-to-write-an-earworm/)
- [Audiosocket: Anatomy of an Earworm - Psychology Behind the Hook](https://blog.audiosocket.com/music-industry-for-artists/earworm-psychology/)
- [APA: Dissecting an Earworm - Melodic Features and Song Popularity (Jakubowski)](https://www.apa.org/pubs/journals/releases/aca-aca0000090.pdf)
- [ANR Factory: Anatomy of an Earworm](https://www.anrfactory.com/the-anatomy-of-an-earworm-how-to-create-an-unforgettable-hit/)
- [TopTuneTales: Science of Catchy Hooks in Music](https://toptunetales.com/catchy-hooks-music-science/)
- [Green Hills Guitar Studio: How to Write Musical Hooks](https://greenhillsguitarstudio.com/how-to-write-musical-hooks-for-your-songs/)

### Call-and-Response & Crowd Participation
- [MasterClass: What Is Call and Response in Music 2026](https://www.masterclass.com/articles/what-is-call-and-response-in-music)
- [eMastered: What is Call and Response in Music](https://emastered.com/blog/call-and-response-in-music)
- [Disc Makers: Call and Response in Music](https://blog.discmakers.com/2023/12/call-and-response-in-music/)
- [Kara Johnstad: How to Create a Successful Anthem Using WE POWER](https://karajohnstad.com/how-to-create-a-successful-anthem-using-we-power-2/)
- [Essential Secrets of Songwriting: Five Musical Ideas to Make a Song an Anthem](https://www.secretsofsongwriting.com/2021/09/07/five-musical-ideas-to-make-a-song-an-anthem/)

### Song Structure for Suno/AI Platforms
- [Jack Righteous: Suno AI Meta Tags Guide](https://jackrighteous.com/en-us/pages/suno-ai-meta-tags-guide)
- [MusicSmith: Suno AI Prompt Guide 2026](https://musicsmith.ai/blog/ai-music-generation-prompts-best-practices)
- [HookGenius: Complete Suno Prompt Guide 2026](https://hookgenius.app/learn/suno-prompt-guide-2026/)
- [Musci.io: Suno Tags List Complete Guide 2026](https://musci.io/blog/suno-tags)
- [Suno: Best Ways to Create Music with AI 2026](https://suno.com/hub/create-music-with-ai)

### Bridge Writing
- [Berklee Online: Writing Bridges for Your Songs](https://online.berklee.edu/takenote/writing-bridges-for-your-songs-can-be-much-easier/)
- [MasterClass: What Is a Bridge in Music 2026](https://www.masterclass.com/articles/music-101-what-is-a-bridge-in-music)

### Place-Based Anthems
- [Amex Essentials: 30 Incredible Songs Inspired by Places](https://www.amexessentials.com/top-songs-inspired-by-places/)
- [NME: 30 Years of Festival Anthems](https://www.nme.com/photos/30-years-of-festival-anthems-the-massive-songs-which-defined-every-summer-1413188)
- [Beyond the Grooves: Festival Anthems](https://www.beyond-the-grooves.co.uk/blog/festival-anthems)

### BPM and Delivery
- [Luke Mounthill Beats: How to Choose Beat Tempo & Key - Rapper's Guide 2026](https://lukemounthillbeats.com/music-production/how-to-choose-beat-tempo-and-key/)
- [JBZ Beats: How BPM Affects Energy and Flow](https://jbzbeats.com/how-bpm-affects-energy-and-flow-of-rap-track/)
- [Beats to Rap On: BPM Explained for Rap Flow](https://beatstorapon.com/blog/bpm-explained-how-to-choose-the-right-tempo-for-your-rap-flow/)
- [Firebeats: BPM Guide for Different Rap Styles](https://firebeats.shop/blog/bpm-guide-for-different-rap-styles-producers-reference/)
- [Rap Authority: 16 Bars in Rap - Ultimate Guide](https://rapauthority.com/16-bars-in-rap/)

### Existing ZAO Research (Cross-References)
- Doc 319: AI Music Creation Platforms - Multi-Output Song Production
- Doc 320: Anatomy of a Viral Summer Song
- Doc 320: ElevenLabs Music API Deep Dive
- Doc 261: AI Agent Music Pipeline
