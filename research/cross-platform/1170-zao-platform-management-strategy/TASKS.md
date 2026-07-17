# Board Tasks: ZAO Clipping Accounts + Tooling Integrations

Source: Doc 1170 — ZAO Platform Management Strategy  
Status: Copy-paste into task board. Zaal-gated items marked ⚠️ ZAAL CREATES.

---

## Clipping Accounts (⚠️ All require Zaal to create)

### TASK: Create @zaoclipz on X
- Handle: @zaoclipz
- Display name: ZAO Clipz
- Bio: Best moments from WaveWarZ battles, ZABAL Games, and ZAO streams. Main: @bettercallzaal
- After creating: Connect to Postiz dashboard → Channels → Add X account
- Key needed: X OAuth 1.0a (4 keys: API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_SECRET)
- Test: POST one test clip via Postiz → verify it appears on @zaoclipz within 2 min
- Done when: @zaoclipz exists + Postiz can post to it

### TASK: Create @zaoclipz on Instagram
- Handle: @zaoclipz
- Display name: ZAO Clipz
- Bio: WaveWarZ highlights + ZABAL Gamez clips. Battles every week. → @bettercallzaal
- After creating: Connect via Meta Developer → Instagram Graph API → paste token into Postiz
- Key needed: Instagram Graph API access token (long-lived, 60-day refresh)
- Test: POST one Reel via Postiz → verify within 2 min
- Done when: @zaoclipz IG exists + Postiz can post Reels to it

### TASK: Create @zaoclipz on TikTok
- Handle: @zaoclipz
- Display name: ZAO Clipz
- Bio: Music battle clips. WaveWarZ. ZABAL. Building music on-chain. @bettercallzaal
- After creating: Connect via TikTok Developer → OAuth token → paste into Postiz
- Key needed: TikTok OAuth token
- Note: Check Postiz TikTok content restrictions before auto-posting clips
- Test: POST one test clip via Postiz → verify within 2 min
- Done when: @zaoclipz TikTok exists + Postiz can post to it

### TASK: Create ZNN YouTube channel (@zaonewsnetwork)
- Channel name: ZNN — ZAO News Network
- Handle: @zaonewsnetwork
- Description: 24/7 ZAO ecosystem content. WaveWarZ battles, ZABAL Games sessions, build-in-public. Main: @bettercallzaal
- After creating: Connect via Google API OAuth (YouTube Data API v3) → paste into Postiz
- Key needed: Google OAuth client credentials (client_id + client_secret + refresh_token)
- Note: Full 24/7 architecture in doc 1128 — this task is just account creation + Postiz wiring
- Done when: Channel exists + Postiz can upload Shorts to it

---

## Tooling Integrations

### TASK: Wire Postiz API to zaalclip clip engine
- What: On successful clip export from zaalclip, auto-POST to Postiz → all connected clip accounts
- Where: zaalclip clip pipeline (Livepeer webhook or post-clip callback)
- Env var: POSTIZ_API_KEY (already in zaalclip according to directive)
- Implementation: POST to https://api.postiz.com/public/v1/posts with clip URL + platform channel IDs
- Test: Generate one WaveWarZ test clip → confirm Postiz distributes to X + IG + TikTok within 2 min
- Done when: End-to-end auto-clip-to-all-platforms works with 3 test clips

### TASK: Fix X @bettercallzaal display name (5-min fix, high SEO impact)
- Current: "+Zaal (on farcaster)"
- Change to: "Zaal | BetterCallZaal"
- How: X Settings → Your Account → Account Information → Name
- Why: Current name gives zero SEO value in SERPs; Perplexity + Claude answer searches with the display name
- Done when: X profile shows "Zaal | BetterCallZaal"

### TASK: Fix YouTube @bettercallzaal channel SEO
- Update channel description: "BetterCallZaal — personal brand portfolio, consulting, and Farcaster mini-app distribution. Building in public across web3 music, social platforms, and creator tools."
- Add tags: bettercallzaal, zaal, farcaster, web3, music, consulting, builder
- Add About section with the description above
- Upload at least 1 video within 30 days to signal active channel
- Done when: Description + tags updated; channel indexed in YouTube brand search

### TASK: Test Postiz API end-to-end (pre-requisite for all clip account wiring)
- Run: `curl -X POST https://api.postiz.com/public/v1/posts -H "Authorization: $POSTIZ_API_KEY" -H "Content-Type: application/json" -d '{"content": "test","platforms": [{"id": "<channel_id>"}],"scheduledAt": "NOW"}'`
- Verify: Post appears on target platform within 2 min
- Log: Success → post ID + platform; never log API key
- Done when: Test POST succeeds to at least 1 connected platform

### TASK: Connect Restream to clip accounts for live session clipping
- Add @zaoclipz accounts (X, YouTube, TikTok) as Restream destinations
- Enable "Clip to social" in Restream after each WaveWarZ or ZABAL session
- Done when: Restream dashboard shows all clip accounts as active destinations

### TASK: Verify/Create Facebook - The ZAO Page
- Confirm The ZAO Facebook page exists and Zaal has admin access
- If exists: Connect to Postiz → add as distribution target for COC Concertz events
- If not: Create page (Name: "The ZAO", category: Music/Arts, link to thezao.com)
- Done when: Facebook page verified + status noted in doc 1170 gaps table

---

## Pending (blocked on Flow Stage clarification)

### TASK: Research Flow Stage API (doc 1169) — BLOCKED
- Status: DECISION NEEDED sent to Zaal via zao-status
- Blocked on: Zaal confirming which product "flow stage" refers to (flowstage.io? Discord community? Cal's TikTok tool?)
- When unblocked: Write full API research doc at research/cross-platform/1169-flowstage-api/
