# ZAO OS Music Player — Stage 2 Test Checklist

Generated after Stage 1 build passes. Work through each item systematically. Fix failures before moving on.

---

## Core Player

### SoundCloud
- [ ] SoundCloud URL detected in cast embed (`soundcloud.com` pattern)
- [ ] SoundCloud metadata fetched (title, artist, artwork via oEmbed)
- [ ] SoundCloud Widget API script loads (check Network tab for `w.soundcloud.com/player/api.js`)
- [ ] SoundCloud plays via Widget API (audio audible)
- [ ] SoundCloud `PLAY` event fires → GlobalPlayer appears
- [ ] SoundCloud `PLAY_PROGRESS` event fires → Scrubber bar advances
- [ ] SoundCloud seek works (drag Scrubber → audio jumps)
- [ ] SoundCloud `FINISH` event fires → GlobalPlayer hides

### YouTube
- [ ] YouTube URL detected (`youtube.com/watch`, `youtu.be/`)
- [ ] YouTube metadata fetched (title, author, thumbnail via oEmbed)
- [ ] YouTube IFrame API loads (`iframe_api` script)
- [ ] YouTube plays via IFrame API (audio audible)
- [ ] YouTube progress polling works (Scrubber advances every 500ms)
- [ ] YouTube seek works
- [ ] YouTube `ENDED` state → GlobalPlayer hides

### Spotify
- [ ] Spotify URL detected (`spotify.com/track`)
- [ ] Spotify metadata fetched (title, artist, artwork via oEmbed)
- [ ] Spotify IFrame API loads (`open.spotify.com/embed/iframe-api/v1`)
- [ ] Spotify plays via IFrame API controller
- [ ] Spotify `playback_update` events → progress/duration update
- [ ] Spotify seek works (`controller.seek`)

### Sound.xyz
- [ ] Sound.xyz URL detected (`sound.xyz` pattern)
- [ ] Sound.xyz GraphQL metadata fetched (title, artist, artwork, `normalizedAudioUrl`)
- [ ] Sound.xyz plays via HTMLAudio (uses `streamUrl`)
- [ ] Sound.xyz progress advances
- [ ] Sound.xyz seek works

### Direct audio
- [ ] `.mp3` / `.wav` URL detected (extension pattern)
- [ ] Direct audio plays via HTMLAudio
- [ ] Duration parsed correctly from `durationchange` event
- [ ] Progress advances, seek works

---

## API Route (`/api/music/metadata`)

- [ ] `?url=` missing → 400 response
- [ ] Non-music URL → 400 response
- [ ] SoundCloud oEmbed returns correct fields
- [ ] YouTube oEmbed returns correct fields
- [ ] Spotify oEmbed returns correct fields
- [ ] Sound.xyz GraphQL returns correct fields including `streamUrl`
- [ ] oEmbed timeout / failure → 404 response (graceful)
- [ ] Response includes `Cache-Control: public, max-age=3600`

---

## GlobalPlayer

- [ ] Appears when track starts loading/playing
- [ ] Hidden when no track loaded (`player.metadata === null`)
- [ ] Artwork loads via `next/image` (check for broken image)
- [ ] Track name + artist display correctly
- [ ] Play/pause button toggles correctly (pause → paused, resume → playing)
- [ ] Scrubber waveform bars render (60 bars, gold fill left to right)
- [ ] Scrubber drag-to-seek works
- [ ] Elapsed time left, total time right, both update correctly
- [ ] GlobalPlayer persists when scrolling messages (stays at bottom)
- [ ] GlobalPlayer persists when ThreadDrawer opens

---

## MusicEmbed card (per-cast)

- [ ] Replaces OG card for music URLs (no duplicate OG card shown)
- [ ] Loading skeleton shown while fetching metadata (~200ms pulse)
- [ ] If metadata fetch fails (404/500) → returns null (no blank card)
- [ ] Artwork loads correctly (48px image)
- [ ] Track name + artist shown correctly
- [ ] Platform label shown in gray-600 (e.g. "soundcloud")
- [ ] Currently playing cast shows gold left border (`border-l-[#f5a623]`)
- [ ] Artwork pulses while playing
- [ ] Play button shows loading spinner while `isLoading`
- [ ] Play/pause button reflects global player state correctly
- [ ] Tap-to-play works on mobile (no double-tap needed)

---

## Mobile

- [ ] GlobalPlayer visible on iPhone (not hidden behind home indicator)
- [ ] `safeAreaInsets.bottom` applied correctly inside Farcaster miniapp
- [ ] Without miniapp context, `paddingBottom` is 0 (no extra space)
- [ ] Scrubber drag works with finger (touch events)
- [ ] MusicEmbed card tap-to-play works (no double-tap needed)
- [ ] GlobalPlayer two-row layout renders correctly on small screens
- [ ] Desktop single-row layout renders on screens ≥ 640px

---

## Edge cases

- [ ] Cast with 2 music embeds — only first one shows MusicEmbed, second renders OG card
- [ ] Cast with 1 music + 1 image embed — MusicEmbed renders, image renders below
- [ ] Non-music cast — no MusicEmbed card, OG card renders as before
- [ ] Channel switch while playing — audio stops, GlobalPlayer hides
- [ ] Metadata API returns 404 for unsupported URL — graceful (no broken card)
- [ ] SC Widget API fails to load (network error) — no JS crash, audio silently unavailable
- [ ] YT IFrame API fails to load — no JS crash
- [ ] Playing SC then clicking a YT track — SC audio stops, YT starts
- [ ] Playing YT then clicking SC — YT audio stops, SC starts
- [ ] `ipfs://` URL detected as `audio` type and routed to HTMLAudioProvider

---

## Build & deployment

- [ ] `npx next build` passes with zero errors after all fixes
- [ ] No new `console.error` or `console.warn` in production build output
- [ ] Deployed to Vercel at zaoos.com — music works in production (CORS, oEmbed endpoints reachable from server)

---

## Notes for fixes

- If SC Widget doesn't fire PLAY event: check iframe `allow="autoplay"` attribute
- If YT API not ready: ensure `window.onYouTubeIframeAPIReady` is assigned before script loads
- If Spotify API fails: Spotify IFrame API requires the embed URL to be for a public track
- If Sound.xyz GraphQL fails: check API schema hasn't changed; fall back to OG metadata from page HTML
- If `safeAreaInsets` undefined: verify `@farcaster/miniapp-sdk` version supports `.client.safeAreaInsets`
