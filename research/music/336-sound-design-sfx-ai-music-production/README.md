# Doc 336: Sound Design & SFX for AI-Generated Music Production (2026)

**Created:** 2026-04-11
**Category:** Music / Production
**Status:** Complete
**Purpose:** Deep reference for musicians making AI-generated songs who need intros, transitions, risers, drops, ambient textures, and effects to sound polished and professional.

---

## Table of Contents

1. [AI SFX Generators - Comparison](#1-ai-sfx-generators---comparison)
2. [ElevenLabs Sound Effects API - Deep Dive](#2-elevenlabs-sound-effects-api---deep-dive)
3. [Free SFX Libraries](#3-free-sfx-libraries)
4. [Risers, Drops & Transitions](#4-risers-drops--transitions)
5. [Ambient Textures & Pads](#5-ambient-textures--pads)
6. [Foley & Environmental Sounds](#6-foley--environmental-sounds)
7. [Layering SFX with AI Instrumentals in a DAW](#7-layering-sfx-with-ai-instrumentals-in-a-daw)
8. [Vocal Effects - Free Tools](#8-vocal-effects---free-tools)
9. [Genre-Specific Sound Design](#9-genre-specific-sound-design)
10. [Creating Signature Sounds & Audio Branding](#10-creating-signature-sounds--audio-branding)
11. [Free VST Synths for Sound Design](#11-free-vst-synths-for-sound-design)
12. [Sample Manipulation Techniques](#12-sample-manipulation-techniques)
13. [Web Audio API for Real-Time Effects](#13-web-audio-api-for-real-time-effects)
14. [Practical Workflow - Start to Finish](#14-practical-workflow---start-to-finish)

---

## 1. AI SFX Generators - Comparison

### Tier 1: Commercial Leaders

| Tool | Best For | Max Duration | Quality | Pricing | Rating |
|------|----------|-------------|---------|---------|--------|
| **ElevenLabs** | Hyper-realistic foley, cinematic SFX | 30s | 48 kHz WAV | $5-$330/mo | 4.8/5 |
| **Stable Audio 3.0** | Long ambient soundscapes, background beds | 180s | High | Free/$12/mo+ | 4.5/5 |
| **Mubert** | Adaptive, streaming, real-time | Variable | High | $10/mo+ | 4.6/5 |
| **Voicemod AI** | Real-time sound triggers, streaming | Short clips | Good | Free/$3/mo+ | 4.7/5 |
| **SoundVerse** | Multi-platform, DNA technology | Variable | Good | $8/mo+ | 4.3/5 |

### Tier 2: Open Source / Free

| Tool | Best For | Limitations | Quality |
|------|----------|-------------|---------|
| **AudioCraft (Meta)** | Developers, custom fine-tuning | CLI only, 32 kHz output | Good |
| **AudioGen (Meta)** | Environmental/foley sounds | Research-grade, no GUI | Decent |
| **Bark (Suno)** | Speech + SFX hybrid | Unpredictable lengths | Variable |

### Key Takeaways

- **ElevenLabs** is the strongest all-rounder for prompt-based SFX - layered, spatial audio that feels three-dimensional rather than flat
- **Stable Audio 3.0** wins for long-form ambient (180s max vs ElevenLabs' 30s cap)
- **AudioCraft** is the best free option but requires Python coding and produces lower-resolution output (32 kHz vs 48 kHz)
- All ElevenLabs-generated sounds are royalty-free for commercial use

---

## 2. ElevenLabs Sound Effects API - Deep Dive

### API Parameters

| Parameter | Details |
|-----------|---------|
| **Duration** | 0.1 to 30 seconds per generation |
| **Looping** | Seamless repetition mode for ambient/atmospheric sounds |
| **Prompt Influence** | High = literal interpretation, Low = creative variations |
| **Output Formats** | MP3 (all), WAV at 48 kHz (non-looping only) |
| **Sample Rate** | 48 kHz (professional quality) |

### Pricing Breakdown

| Plan | Monthly | SFX Generations Included | Overage per Generation |
|------|---------|-------------------------|----------------------|
| Free | $0 | Limited | N/A |
| Starter | $5 | Limited | N/A |
| Creator | $11 | 500 | ~$0.06 |
| Pro | $99 | 2,500 | ~$0.04 |
| Scale | $330 | 10,000 | ~$0.03 |
| Business | $1,320 | 55,000 | ~$0.02 |

Credit cost: **40 credits per second** when duration is specified, **20 credits per second** otherwise.

### Best Prompt Patterns for Music Production SFX

```
# Risers
"Cinematic tension riser building over 8 seconds with white noise sweep and sub bass"
"Electronic riser with filtered saw wave ascending two octaves over 4 seconds"

# Drops/Impacts
"Heavy bass drop impact with sub-frequency boom and reverb tail, 3 seconds"
"Cinematic boom impact with debris and glass shattering, 2 seconds"

# Ambient Textures
"Warm analog pad with gentle movement and tape saturation, looping"
"Dark atmospheric drone with metallic overtones, looping"

# Transitions
"Reverse cymbal crash building to peak over 4 seconds"
"Tape stop effect slowing down over 2 seconds"

# Foley
"Coffee shop ambient noise with quiet conversation and espresso machine"
"Rain on window with distant thunder, looping"
```

### Limitations

- 30-second maximum per generation
- Musical production beyond drum loops/stems should use dedicated Music API
- WAV output only available for non-looping effects
- Credits reset monthly (unused roll over for 2 months)

---

## 3. Free SFX Libraries

### Major Libraries

| Library | Size | Best For | License |
|---------|------|----------|---------|
| **[Freesound.org](https://freesound.org)** | 500,000+ sounds | Field recordings, abstract textures, experimental | Creative Commons (varies per sound) |
| **[BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/)** | 16,000+ recordings | Professional-grade foley, nature, environments | Personal/educational use, RemArc license |
| **[NASA Sound Library](https://www.nasa.gov/audio-and-ringtones/)** | Hundreds | Space sounds, mission audio, sci-fi textures | Public domain |
| **[Zapsplat](https://www.zapsplat.com/)** | 150,000+ | General SFX, foley, ambience | Free with attribution, paid for no-attribution |
| **[Free To Use Sounds](https://freetousesounds.bandcamp.com/)** | Large | City, nature, foley, world recordings | Royalty-free |
| **[Cymatics Free Packs](https://cymatics.fm/)** | Curated packs | EDM, hip-hop production elements | Royalty-free |
| **[Sample Focus](https://samplefocus.com/)** | Community-driven | One-shots, loops, foley, textures | Royalty-free |
| **[99 Sounds](https://99sounds.org/)** | Curated | World environments, textures, impacts | Royalty-free |

### Splice (Subscription)

- Not free but extremely cost-effective at $7.99/mo for 100 credits
- Individual sample downloads (not bulk packs)
- Massive catalog of production-ready risers, drops, transitions, one-shots
- Credit rollover means you can stockpile samples

### Pro Tips for Free Libraries

- Freesound requires attribution for most sounds - check each file's license
- BBC sounds are broadcast-quality but may have usage restrictions for commercial release
- Layer multiple free sources together to create unique textures
- NASA sounds are great for sci-fi/electronic intros (rocket launches, radio transmissions, satellite signals)

---

## 4. Risers, Drops & Transitions

### What Each Element Does

| Element | Purpose | Typical Duration |
|---------|---------|-----------------|
| **Riser** | Builds tension before a transition, ascending pitch/energy | 2-8 bars |
| **Drop** | Punctuates new section with rhythm/bass restatement | 1-2 beats |
| **Sweep** | Filtered noise moving through frequency spectrum | 1-4 bars |
| **Reverse Cymbal** | Classic transition element building to downbeat | 1-2 bars |
| **Impact/Hit** | Marks the exact moment of section change | Instant |
| **Tape Stop** | Decelerating pitch effect signaling end of section | 1-2 beats |
| **Snare Roll** | Accelerating rhythm building to climax | 2-4 bars |

### Three Core DIY Techniques

#### 1. Siren Risers (Oscillator Method)
- Start with a sine or saw oscillator
- Automate pitch from low to high over your transition window
- Layer a second oscillator an octave above for brightness
- Add filter automation (low-pass opening upward) for extra sweep
- Apply reverb that increases as the riser peaks

#### 2. Delay/Reverb Washes
- Automate reverb from wet to dry while simultaneously increasing delay feedback
- Creates a "stuttering delay that comes into focus as the clouds of reverb subside"
- Great for vocal transitions and atmospheric section changes
- Works especially well on the last note/word before a new section

#### 3. Filtered White Noise
- Start with a white noise sample or oscillator
- Apply a steep low-pass filter, automate cutoff upward for riser effect
- Keep a static high-pass to prevent overwhelming sub frequencies
- Layer with the underlying track's reverb for cohesion
- This is the most common riser technique in EDM/electronic music

### Where to Find Pre-Made Transitions

- **Splice** - Search "riser," "drop," "sweep," "impact" - thousands of options
- **Cymatics** - Free transition packs specifically for EDM/hip-hop
- **ElevenLabs** - Generate custom ones with text prompts (see Section 2)
- **Baby Audio Transit** - Plugin that creates pro transitions with one knob (multi-parameter automation)
- **Free sample packs** - Search "free transition sample pack 2026" for curated sets

### Reverse Cymbal Technique

1. Take any cymbal crash sample
2. Reverse it in your DAW (most DAWs have a "reverse" function)
3. Place it so the crescendo hits exactly on the downbeat of the new section
4. Add reverb with a long tail for extra drama
5. Optionally pitch-shift down for darker transitions or up for brighter ones

---

## 5. Ambient Textures & Pads

### AI-Generated vs. Sample Packs

| Aspect | AI-Generated | Sample Packs |
|--------|-------------|--------------|
| **Uniqueness** | Every generation is unique | Shared with other producers |
| **Speed** | 10 seconds to generate | Browse, audition, download |
| **Control** | Prompt-based, somewhat unpredictable | Exact sound, what you hear is what you get |
| **Length** | Up to 180s (Stable Audio) | Usually 4-16 bars |
| **Cost** | Per-generation credits | One-time or subscription |
| **Quality** | Improving rapidly, sometimes artifacts | Professionally recorded/designed |
| **Recommendation** | Great for unique beds and drones | Better for precise, production-ready pads |

### 2026 Trend: Organic Texture Over Digital Perfection

After years of AI-dominated production, there's a strong movement back toward sonic imperfection - vinyl noise, tape hiss, analog warmth. The best AI-generated music in 2026 deliberately incorporates these organic elements. Categories:

- **Organic textures:** Field recordings, analog tape noise, vinyl crackle, rain, wind
- **Synthetic textures:** Evolving synth pads, granular drones, algorithmic generative patches
- **Hybrid:** AI-generated beds with organic samples layered on top

### Best Free Tools for Ambient Pads

| Plugin/Tool | Type | Platform | Notes |
|-------------|------|----------|-------|
| **Vital (Free)** | Wavetable synth | Win/Mac/Linux | Incredible for evolving pads with its modulation matrix |
| **Surge XT** | Hybrid synth | Win/Mac/Linux | Built-in effects chain, great for dark ambient |
| **TAL-NoiseMaker** | Analog-style synth | Win/Mac | Simple, warm pads with chorus/reverb |
| **Atmoscapia** | AI ambient generator | Web | Generates ethereal pads in-browser |
| **Sonura** | AI ambient generator | Web | Genre-specific ambient generation |

### Creating Ambient Beds for AI Song Intros

1. Generate or find a pad/drone that matches your song's key
2. Pitch it if needed (most pads are tonal)
3. Apply heavy reverb (80%+ wet) and slow attack
4. Layer with a foley element (rain, vinyl crackle, crowd murmur)
5. Automate volume to fade in over 4-8 bars
6. Use a low-pass filter opening slowly to reveal the full frequency range
7. Crossfade into the main instrumental as it enters

---

## 6. Foley & Environmental Sounds

### Common Foley for Song Production

| Category | Sounds | Use Case |
|----------|--------|----------|
| **Urban** | Traffic, subway, footsteps, sirens, construction | Hip-hop intros, gritty atmosphere |
| **Nature** | Rain, thunder, birds, wind, ocean, forest | Chill/lo-fi, ambient intros |
| **Crowd** | Applause, chatter, festival noise, cheering | Live performance feel, concert intros |
| **Domestic** | Clock ticking, phone ringing, door closing, TV static | Storytelling, concept tracks |
| **Vinyl/Retro** | Record crackle, tape hiss, radio tuning, dial tone | Lo-fi, nostalgic vibes |
| **Mechanical** | Typewriter, camera shutter, car engine, factory | Industrial, experimental |

### Best Sources for Free Foley

- **Cymatics "LIFE" pack** - Diverse field recordings from cityscapes to serene environments
- **99 Sounds "World Sounds"** - Environmental recordings from around the globe
- **Freesound.org** - Search by category, massive community uploads
- **Free To Use Sounds** - Professionally recorded worldwide locations
- **BBC Sound Effects** - Broadcast-quality, decades of production recordings

### Layering Foley into Songs

- Place foley elements on their own track in the DAW
- High-pass filter at 80-150 Hz to prevent muddying the low end
- Apply light compression to even out dynamics
- Use volume automation to duck under vocals and primary instruments
- Pan foley elements for stereo width (e.g., rain slightly left, traffic slightly right)
- Keep foley subtle - it should enhance atmosphere without drawing attention

---

## 7. Layering SFX with AI Instrumentals in a DAW

### Step-by-Step Workflow

#### Step 1: Import & Organize
- Import AI-generated instrumental (full mix or stems if available)
- Create separate tracks for: SFX, Foley, Risers/Transitions, Ambient Bed, Vocal FX
- Color-code tracks by category for visual clarity

#### Step 2: Stem Separation (If Needed)
- Use stem separation tools (LALAL.AI, Demucs, LANDR Layers) to split AI instrumentals into drums, bass, melody, vocals
- This gives you more control over where SFX sit in the mix

#### Step 3: Frequency Stacking
- Map which frequency ranges each element occupies
- SFX should fill gaps, not compete: if the instrumental is bass-heavy, add high-frequency textures
- Use EQ to carve space: cut conflicting frequencies from SFX to let the instrumental breathe

#### Step 4: Transition Points
- Identify every section change (intro to verse, verse to chorus, chorus to bridge, etc.)
- Place risers 2-4 bars before each transition
- Place impacts/drops on the downbeat of each new section
- Use sweeps and reverse cymbals to smooth jarring transitions

#### Step 5: Ambient Layering
- Add a subtle ambient bed underneath the entire track (very low volume, -18 to -24 dB)
- This creates cohesion and "glues" AI-generated elements together
- Foley elements (vinyl crackle, room tone) work great here

#### Step 6: Automation
- Automate SFX volume throughout the song
- Automate filter cutoffs for dynamic movement
- Automate reverb sends to create depth changes between sections
- Use sidechain compression to duck SFX under vocals and primary instruments

#### Step 7: Bus Processing
- Route all SFX to a single bus/group channel
- Apply light compression and EQ to the bus for consistency
- This ensures all your added elements feel like part of one cohesive mix

### Common Mistakes

- **Too many SFX** - Less is more. A few well-placed transitions beat constant ear candy
- **Frequency clashing** - Always EQ SFX to avoid masking the instrumental
- **Volume too high** - SFX should enhance, not dominate. If you notice them consciously, they're too loud
- **Timing misalignment** - Snap impacts to the grid. Risers should peak exactly on the downbeat
- **Inconsistent reverb** - Use the same reverb settings across SFX for spatial cohesion

---

## 8. Vocal Effects - Free Tools

### Auto-Tune / Pitch Correction

| Tool | Type | Platform | Key Feature |
|------|------|----------|-------------|
| **Graillon 3 Free** | VST | Win/Mac | Best free auto-tune, includes formant shifting |
| **MAutoPitch** | VST | Win/Mac | Simple pitch correction + stereo expansion |
| **GSnap** | VST | Win | Classic free auto-tune, scale-locked correction |
| **Voloco** | Mobile app | iOS/Android | Real-time vocal processing for quick recordings |
| **Timbrica** | Web app | Browser | Real-time pitch/formant shifting, 33 presets |

### Vocoder / Voice Transformation

| Tool | Type | Platform | Key Feature |
|------|------|----------|-------------|
| **TAL-Vocoder** | VST | Win/Mac | Classic 80s vocoder with 11 bands + built-in synth |
| **Erzatz** | VST | Win | Vocoder/pitch-shifter hybrid, 32 bands |
| **Voxengo Voxformer** | VST | Win/Mac | Channel strip optimized for vocals |

### Pitch Shifting / Formant Shifting

| Tool | Type | Platform | Key Feature |
|------|------|----------|-------------|
| **Pitchmunk** | VST | Win/Mac | Free pitch shifter with formant control |
| **Kilohearts Pitch Shifter** | VST | Win/Mac | Clean pitch shifting with snap-to-scale |
| **MFreqShifter** | VST | Win/Mac | Frequency shifting for metallic/robotic effects |

### Creative Vocal Processing Chain

```
1. Pitch Correction (Graillon 3) - subtle or hard-tuned depending on style
2. Formant Shift (Graillon 3 or Pitchmunk) - shift up for youthful, down for deep
3. Doubler/Chorus (TAL-Chorus-LX, free) - thicken the vocal
4. Distortion/Saturation (Camelcrusher, free) - add grit and warmth
5. Delay (Voxengo Tempo Delay, free) - rhythmic echoes
6. Reverb (OrilRiver, free) - space and depth
```

---

## 9. Genre-Specific Sound Design

### Hip-Hop

#### 808 Processing Chain
1. **Source:** Start with a clean 808 sample - mono, centered around 45-60 Hz
2. **Synthesis alternative:** Sine wave oscillator at root note + second oscillator one octave up, detuned -7 cents
3. **Saturation:** Light tube/tape saturation to add harmonics above the fundamental (makes 808s audible on small speakers)
4. **EQ:** Keep or boost high-end frequencies, do NOT cut the top or boost the low excessively
5. **Compression:** Light compression with slow attack (lets the transient through) and medium release
6. **Envelope automation:** Shorter decay in verses (400ms decay, 300ms release), longer in choruses (700ms decay, 500ms release)

#### Vinyl Crackle
- Layer a vinyl noise sample at very low volume (-20 to -30 dB) across the entire track
- High-pass at 200 Hz so it doesn't muddy the low end
- This instantly adds warmth and nostalgic lo-fi character
- Free vinyl crackle samples: iZotope Vinyl plugin (free), Freesound.org

#### Hip-Hop Signature Elements
- Vinyl scratches on transitions
- Gunshot/cannon impacts on drops (classic trap)
- Vocal chops pitched up/down as melodic elements
- Cash register, car sounds, phone rings as thematic foley
- Reverse bass hits before downbeats

### Electronic / EDM

#### Synth Design Basics
- **Supersaw:** Multiple detuned saw waves (5-7 voices) for massive leads and chords
- **Reese bass:** Two detuned saw waves with chorus for thick, moving bass
- **Pluck:** Short decay envelope on a filtered saw/square wave
- **Lead:** Single saw/square with moderate filter, portamento for glide

#### Electronic Transition Elements
- White noise risers (most common transition in EDM)
- Snare rolls with increasing velocity and density
- Filter sweeps on the main synth (automate low-pass cutoff)
- Pitch-bend on lead elements approaching a drop
- Sidechain pump increasing before the drop
- Silence/breakdown for 1-4 beats before impact

#### Signature Electronic SFX
- Laser zaps (short, pitched oscillator bursts)
- Glitch effects (buffer repeat, stutter, bitcrushing)
- Vocal chop stutters
- Metallic ping/resonance hits
- Sub drop (sine wave with pitch envelope dropping from mid to sub)

---

## 10. Creating Signature Sounds & Audio Branding

### Sound DNA Concept (2026)

Sound DNA technology identifies and extends the distinctive sonic characteristics of an artist through audio pattern recognition and machine learning. It functions as an encoded creative identity - a sonic fingerprint.

Key statistics: brands with strong audio identities enjoy **8x higher recall** and a **+76% boost in brand power**.

### Building Your Signature Sound - Practical Steps

#### 1. Identify Your Sonic Palette
- Choose 3-5 core timbres that define your sound (e.g., warm pads, crispy hi-hats, deep 808s)
- Pick a characteristic reverb/delay setting you apply consistently
- Decide on a frequency character: bright and airy vs dark and heavy

#### 2. Create Recurring Elements
- Design a signature riser or transition you use in every track
- Develop a tag/audio logo (2-3 second sound that identifies you)
- Use consistent vocal processing (your auto-tune settings, formant choices)
- Pick a go-to synth patch family and evolve it rather than starting from scratch

#### 3. Process Consistently
- Build a channel strip preset for your main elements
- Use the same reverb impulse response across tracks for spatial consistency
- Develop a mastering chain that gives your tracks a unified loudness/color

#### 4. Leverage AI for Consistency
- Use Sound DNA tools (like Soundverse DNA) to encode your style
- Train AI models on your catalog to maintain sound identity at scale
- Use AI SFX generators with consistent prompt patterns

### Examples of Artist Signature Sounds

- **Metro Boomin:** Dark pads, specific 808 processing, tag "Metro Boomin want some more"
- **Skrillex:** Aggressive bass design, specific distortion character, growl bass
- **Tame Impala:** Heavily processed drums (phaser + compression), psychedelic reverb, tape wobble
- **Billie Eilish/Finneas:** ASMR-close vocals, sparse bass, intimate room tone

---

## 11. Free VST Synths for Sound Design

### The Big Three (Must-Have)

#### Vital (Free Tier)
- **Type:** Wavetable synthesizer
- **Strengths:** Visual modulation matrix, spectral warping, 3 oscillators + sampler
- **Best for:** Pads, leads, bass, sound design - nearly unlimited
- **Free tier:** 75 presets, 25 wavetables (full feature set)
- **Why it matters:** Competes directly with Serum at $0

#### Surge XT
- **Type:** Hybrid (subtractive + FM + wavetable)
- **Strengths:** Thousands of presets, built-in effects, open-source with constant updates
- **Best for:** Sound design, evolving textures, FM sounds, aggressive basses
- **Why it matters:** Most powerful free synth overall, no limitations

#### Dexed
- **Type:** FM synthesis (Yamaha DX7 emulation)
- **Strengths:** Loads original DX7 patches, precise FM engine
- **Best for:** Electric pianos, bells, metallic tones, evolving pads, retro sounds
- **Why it matters:** FM synthesis creates sounds impossible with other methods

### Supporting Cast

| Plugin | Type | Best For |
|--------|------|----------|
| **TAL-NoiseMaker** | Analog subtractive | Warm pads, simple leads |
| **Odin 2** | Semi-modular | Experimental sound design |
| **Helm** | Polyphonic subtractive | Classic synth sounds |
| **ZynAddSubFX** | Additive/subtractive/pad | Complex evolving pads |
| **OB-Xd** | Oberheim OB-X emulation | Vintage analog sounds |

### Sound Design Starting Points

```
# Riser in Vital:
- Saw wavetable, 1 oscillator
- Automate pitch from -24 to 0 semitones over 4 bars
- Open low-pass filter simultaneously
- Add reverb, increase wet amount as pitch rises

# Pad in Surge XT:
- Two saw oscillators slightly detuned
- Low-pass filter with slow LFO modulation
- Long attack (500ms), infinite sustain, long release (2000ms)
- Chorus + reverb effects

# Bell/Impact in Dexed:
- Start from INIT patch
- Operator 1 as carrier, Operator 2 as modulator at ratio 3:1
- Short decay envelope on modulator for bell strike
- Add slight detune for shimmer
```

---

## 12. Sample Manipulation Techniques

### Core Techniques

#### Chopping
- Slice a sample into smaller pieces, rearrange for new melodies/rhythms
- Use transient detection for automatic slicing at drum hits
- Manual slicing at musical intervals (quarter notes, eighth notes) for melodic samples
- Classic hip-hop technique: chop a soul/funk sample, replay pieces in new order

#### Time Stretching
- Change tempo without affecting pitch
- **Warp modes:** Beats (for drums), Tones (for melodic), Texture (for ambient/pads), Complex (for full mixes)
- Extreme stretching creates granular textures - stretching a 1-second sound to 30 seconds produces evolving ambient drones
- Historical significance in jungle, drum 'n' bass, UK garage

#### Pitch Shifting
- Change pitch without affecting tempo
- Pitch up for energy/brightness, down for darkness/weight
- Independent formant control prevents chipmunk/demon effects
- Creative use: pitch a vocal sample to create a melodic hook

#### Granular Synthesis
- Deconstructs audio into tiny "grains" (1-50ms)
- Parameters: grain size, density, playback position, pitch, envelope
- Creates rich evolving textures from any source material
- Turn a 2-second vocal clip into a 2-minute ambient pad

### Creative Techniques

| Technique | Description | Result |
|-----------|-------------|--------|
| **Reverse** | Play sample backwards | Ethereal pre-transitions, tension |
| **Half-speed** | Slow to 50% with pitch drop | Dark, heavy, slowed-and-reverbed aesthetic |
| **Double-speed** | Speed to 200% with pitch up | Chipmunk vocals, hyperactive energy |
| **Bitcrushing** | Reduce bit depth | Lo-fi, retro game aesthetic |
| **Convolution** | Apply impulse response of one sound to another | Hybrid textures (e.g., guitar through a cave) |
| **Paulstretch** | Extreme time-stretch algorithm | Turn anything into an ambient pad |
| **Stutter/Glitch** | Rapid repeat of tiny slices | Glitch-hop, IDM, electronic fills |

---

## 13. Web Audio API for Real-Time Effects

### Relevance to ZAO OS

ZAO OS already uses Web Audio API for binaural beats (`src/components/music/BinauralBeats.tsx`). The same API can power real-time SFX in the player.

### Core Nodes for SFX

```javascript
// Audio context
const ctx = new AudioContext();

// Gain (volume control)
const gain = ctx.createGain();

// Biquad Filter (EQ, sweeps)
const filter = ctx.createBiquadFilter();
filter.type = 'lowpass'; // highpass, bandpass, notch, etc.
filter.frequency.value = 1000;

// Delay
const delay = ctx.createDelay(5.0);
delay.delayTime.value = 0.3;

// Convolver (reverb via impulse response)
const reverb = ctx.createConvolver();

// Oscillator (tones, risers, sub bass)
const osc = ctx.createOscillator();
osc.type = 'sine'; // square, sawtooth, triangle
osc.frequency.value = 440;

// Wave Shaper (distortion/saturation)
const distortion = ctx.createWaveShaper();

// Stereo Panner
const panner = ctx.createStereoPanner();
panner.pan.value = -0.5; // left

// Compressor
const compressor = ctx.createDynamicsCompressor();
```

### Possible ZAO OS Integrations

- **Transition effects between songs:** Crossfade with filter sweep using BiquadFilter
- **Ambient mode:** Low-pass filtered reverb over playback for chill listening
- **Live room effects:** Real-time EQ and reverb for Spaces audio
- **Reactive visualizations:** AnalyserNode for frequency data driving UI animations
- **DJ effects:** Filter sweeps, echo out, brake/tape stop on song changes

### Example: Riser Effect in Browser

```javascript
function playRiser(ctx, duration = 4) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + duration);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + duration);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + duration * 0.8);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}
```

---

## 14. Practical Workflow - Start to Finish

### For a Musician Making AI Songs with Professional Polish

#### Phase 1: Generate the Core
1. Generate instrumental with Suno/Udio/ACE-Step (see Docs 324, 328, 329)
2. Generate vocals or record your own
3. Export stems if possible (or use stem separation)

#### Phase 2: Sound Design Layer
4. Create or find an ambient bed matching your song's key and mood
5. Design or source 2-3 transition elements (riser, impact, sweep)
6. Find foley elements for the intro (choose from Section 6 categories)
7. Create a signature tag/audio logo if you don't have one

#### Phase 3: Assembly in DAW
8. Import all elements into your DAW (free: Audacity, LMMS, Cakewalk, GarageBand)
9. Arrange: intro foley (4-8 bars) -> ambient bed fade-in -> instrumental enters
10. Place risers before each chorus/drop
11. Place impacts on downbeats of new sections
12. Add subtle vinyl crackle or room tone throughout (very low volume)
13. Layer transition sweeps between verse and chorus

#### Phase 4: Polish
14. EQ each SFX element to avoid frequency clashes
15. Bus all SFX together, apply light compression
16. Automate volumes throughout - SFX should breathe with the song
17. Apply vocal effects chain (Section 8)
18. A/B compare with and without SFX - the difference should be subtle but noticeable

#### Phase 5: Export
19. Export master at 44.1 kHz / 16-bit WAV for distribution
20. Export stems separately for future remixes

### Essential Free Toolkit

| Need | Tool | Cost |
|------|------|------|
| DAW | GarageBand (Mac) / Cakewalk (Win) / LMMS (all) | Free |
| Synth - Wavetable | Vital | Free |
| Synth - Hybrid | Surge XT | Free |
| Synth - FM | Dexed | Free |
| Auto-tune | Graillon 3 Free | Free |
| Vocoder | TAL-Vocoder | Free |
| Reverb | OrilRiver | Free |
| Delay | Voxengo Tempo Delay | Free |
| Distortion | Camelcrusher | Free |
| Vinyl Effect | iZotope Vinyl | Free |
| SFX Samples | Freesound.org + Cymatics free packs | Free |
| AI SFX | ElevenLabs (limited free) / Stable Audio | Free tier |
| Stem Separation | Demucs (open source) | Free |

---

## Sources

### AI SFX Generators
- [ElevenLabs Sound Effects API Docs](https://elevenlabs.io/docs/overview/capabilities/sound-effects)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs Pricing Breakdown - Flexprice](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- [Top 10 AI SFX Generators - DevOpsSchool](https://www.devopsschool.com/blog/top-10-ai-sound-effects-generators-tools-in-2025-features-pros-cons-comparison/)
- [Best AI SFX Generators 2026 - AI Magicx](https://www.aimagicx.com/blog/ai-sound-effects-generation-foley-guide-2026)
- [Best AI SFX Generators - Curious Refuge](https://curiousrefuge.com/blog/best-ai-sound-effects-generator-for-2026)

### Free Sound Libraries
- [Freesound.org](https://freesound.org)
- [Production Expert Free SFX Database](https://www.production-expert.com/production-expert-1/free-sound-effects-2026-with-searchable-database)
- [Free Sound Libraries - ReaLinks](https://www.realinks.net/links/best-free-sounds-effects-and-musical-samples/)
- [Free Foley Sample Packs - Cymatics](https://cymatics.fm/blogs/production/free-foley-sound-effects)

### Sound Design Techniques
- [Risers, Drops, SFX - Baby Audio](https://babyaud.io/blog/drops-risers-sfx)
- [808 Sound Design Techniques](https://unison.audio/808-sound-design/)
- [808 Bass - EDMProd](https://www.edmprod.com/808s/)
- [808 Bass Tutorials - Ableton](https://www.ableton.com/en/blog/808-bass-tutorials-creation-mix/)
- [Enriching Sounds with Textures - Liveschool](https://blog.liveschool.net/making-digital-sound-analog-layering-noise-textures-vinyl-crackle/)
- [Point Blank - Designing Risers](https://www.pointblankmusicschool.com/blog/designing-unique-risers-and-fx-for-transitions-to-level-up-your-tracks/)

### Ambient & Textures
- [Top 20 Ambient Pads Plugins 2026 - Integraudio](https://integraudio.com/20-best-plugins-for-pads/)
- [Ambient Techno Textures - Samplesound](https://www.samplesoundmusic.com/blogs/news/ambient-techno-crafting-textures-and-pads-for-immersive-soundscapes)
- [Organic vs Digital Texture - Soundverse](https://www.soundverse.ai/blog/article/organic-texture-vs-digital-perfection-in-music-0803)
- [Best Free Sample Packs 2026](https://blog.samplefocus.com/blog/the-best-free-sample-packs-2026-edition/)

### Vocal Effects
- [Free Auto-Tune Tools 2026 - Musicful](https://www.musicful.ai/music-generate/free-autotune/)
- [Free Pitch Shifter VSTs - MIDINation](https://midination.com/vst/free-vst-plugins/free-pitch-shifter-vst-plugins/)
- [Free Vocal Tuning Plugins - Sage Audio](https://www.sageaudio.com/articles/top-5-free-vocal-tuning-and-formant-plugins)

### Free VST Synths
- [Free Synth VSTs - Bedroom Producers Blog](https://bedroomproducersblog.com/free-vst-plugins/synthesizer/)
- [Best Free Synth VSTs 2026 - Audio Plugin List](https://audiopluginlist.com/best-free-synth-vst/)
- [Surge XT](https://surge-synthesizer.github.io/)
- [Best Free VST Plugins 2026 - Uniphonic](https://uniphonic.com/what-are-the-best-free-vst-plugins-for-sound-design/)

### Sample Manipulation
- [How to Chop Samples - Hit Producer Stash](https://www.hitproducerstash.com/blog/how-to-chop-samples)
- [Sample Flipping - LANDR](https://blog.landr.com/sample-flipping/)
- [Advanced Sample Stretching - Lucid Samples](https://www.lucidsamples.com/blog/advanced-sample-stretching-techniques-music-production-unlock-unique-sounds)

### Audio Branding
- [Sound DNA Technology 2026 - Soundverse](https://www.soundverse.ai/blog/article/sound-dna-technology-maintaining-signature-sound-2312)
- [Audio Branding Trends 2026 - Bigeye](https://www.bigeyeagency.com/insights/audio-branding-trends-2026)
- [AI Music for Personal Branding - Soundverse](https://www.soundverse.ai/blog/article/ai-music-for-personal-branding-and-identity-0208)

### Web Audio API
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Tutorial - Toptal](https://www.toptal.com/web/web-audio-api-tutorial)
- [Audio Delay in Browser - Dev.to](https://dev.to/hexshift/how-to-create-an-audio-delay-effect-in-the-browser-using-web-audio-api-7jl)
