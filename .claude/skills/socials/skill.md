---
name: socials
description: Generate platform-specific social posts from a published Year of the ZABAL newsletter. Covers X, Farcaster, Telegram, Discord, and optionally TikTok/YouTube. Use when asked to "write socials", "social posts", "distribute the newsletter", or after publishing a /newsletter post.
---

# Social Content Generator

Transform a published Year of the ZABAL newsletter into platform-specific posts that feel native, authentic, and aligned with BetterCallZaal's voice - grounded, rhythmic, and culturally aware.

## Prerequisites

Before running this skill, you need:
1. **The published newsletter URL** from Paragraph (e.g. `paragraph.com/@thezao/year-of-the-zabal-day-97`)
2. **The newsletter content** - either from the current conversation or fetch the URL

If the user hasn't provided the URL yet, ask for it.

## Voice Rules

- Every post begins with **"ZM"** (ZAO Morning) - this is the daily greeting across the ZAO ecosystem
- No emojis
- No hashtags
- Lowercase casual when it fits - match the newsletter voice. "march ZOLs are in" not "March ZOLs Are In"
- Grounded, rhythmic, culturally aware
- Each platform should sound distinct - not duplicated
- Use the emotional essence of the newsletter - not a summary
- Short days get short socials. Don't pad a 50-word newsletter into a 200-word tweet thread

## Platform Specs

Generate posts for ALL of these platforms in order:

### 1. X (Twitter) - Main Post
- Max 280 characters (URLs count as 23 chars after t.co wrapping, so you have ~257 chars for text + link)
- Punchy, scroll-stopping rhythm
- Short sentences or fragments that make people pause or reflect
- Append newsletter link at the end
- If people are mentioned in the newsletter (ZOLs, collaborators), tag them if their X handle is known

### 2. X (Twitter) - Group Chat
- Conversational and insider tone - like texting the crew
- Assume readers already know ZAO, WaveWarZ, Songjam, and ongoing events
- Can be longer than main tweet - group chats aren't character-limited
- No link needed unless it fits naturally
- Reference inside jokes, shared context, recent events

### 3. Farcaster - /zao Channel
- Thoughtful, community-rooted
- Speak to builders, artists, and the Web3 creative flow
- This is the home channel - can be the most detailed Farcaster post
- Append newsletter link

### 4. Farcaster - /zao Group Chat
- Insider tone - like the X group chat but for the Farcaster crew
- Everyone here is deep in the ZAO ecosystem already
- Conversational, no explanation needed
- Can reference fractals, Songjam, WaveWarZ, ZOE without context
- Append newsletter link

<!-- NOTE: Farcaster Other Communities is paused for now but the channel list is preserved here for future use:
  ZAO ecosystem: /songjam, /music, /base, /nouns
  General: /build, /thecreators, /mindfulness, /philosophy, /farcaster, /founders
  When re-enabled: suggest 3-5 channels per post with custom 1-2 sentence posts native to each community's vibe -->

### 5. Telegram Group Chat
- Direct and friendly, like a note to the crew
- One or two sentences max
- Append newsletter link

### 6. Discord Group Chat
- Casual community tone
- Can reference events, collabs, shared energy, or ask a question
- Slightly longer than Telegram - Discord is for discussion
- Append newsletter link

### 7. LinkedIn
- Professional but still authentic - not corporate
- Start with "ZM" like every other platform
- Frame the day's content through a builder/founder/community lens
- LinkedIn audience doesn't know ZAO - give 1 line of context on first mention
- Longer than X, shorter than Farcaster /zao - aim for 3-5 sentences
- End with the newsletter link on its own line
- No "I'm humbled" or "thrilled to share" - just say what happened

### 8. Facebook
- Start with "ZM"
- Warm, personal, community tone - Facebook is where family and IRL friends see this
- Less crypto/Web3 jargon than other platforms - translate for normies
- Can be slightly longer and more conversational
- Append newsletter link
- Good place to reference IRL events (ZAO Stock, Bar Harbor meetups, Red Sox)

### 9. Video Platforms (Only if newsletter has a video element)

Skip this section entirely if no video is involved.

**TikTok:**
- Caption starts with "ZM"
- Title: Catchy, emotionally clear
- Tags: 5-10 comma-separated keywords (no #)

**YouTube:**
- Description starts with "ZM"
- Title: Descriptive and emotionally clear
- Tags: 5-10 comma-separated keywords (no #)

## Output Format

Generate an HTML page at `tmp/socials-day-[N].html` with all posts organized by platform, each in a copyable block. Also output all posts in the chat as plain text.

The HTML should have:
- Each platform as a labeled section with clear visual separation
- Click-to-copy on each post block
- Character count shown for X posts
- Light background per block, clean sans-serif font
- The newsletter link pre-filled in every post that needs it

Open the HTML in the browser automatically.

## Workflow

1. Get the published newsletter URL from the user
2. Read/fetch the newsletter content if not already in conversation
3. Extract the emotional essence and key themes
4. Generate all platform posts
5. Write HTML to `tmp/socials-day-[N].html`
6. Open in browser
7. Output plain text in chat for quick review

## Scaling Posts to Newsletter Length

| Newsletter Type | X Main | X GC | FC /zao | FC /zao GC | Telegram | Discord | LinkedIn | Facebook |
|----------------|--------|------|---------|-----------|----------|---------|----------|----------|
| Quick (50-80w) | 1 sent + link | 1-2 sent | 2-3 sent | 1-2 sent | 1 sent | 1-2 sent | 2-3 sent | 2-3 sent |
| Standard (100-250w) | 1-2 sent + link | 2-3 sent | 3-5 sent | 2-3 sent | 1-2 sent | 2-3 sent | 3-5 sent | 3-5 sent |
| Announcement (200-400w) | 2 sent + link | 3-5 sent | Full | 3-5 sent | 2 sent | 3-5 sent | 4-6 sent | 4-6 sent |

Don't make a 50-word newsletter day sound like a major announcement across socials.

## Anti-patterns

- Don't summarize the newsletter. Capture the feeling.
- Don't duplicate the same post across platforms. Each should feel native to that platform.
- Don't use em dashes. Hyphens only.
- Don't use emojis or hashtags.
- Don't add CTAs like "check it out" or "link in bio". Let the link sit naturally at the end.
- Don't over-explain. The audience on each platform has different context levels - write to that.
- Don't over-capitalize. Match the lowercase casual voice.
- Don't pad short days into long posts. Match the energy.
- Don't forget ZM. Every social post starts with it, even if the newsletter itself skipped it for an announcement opening.
