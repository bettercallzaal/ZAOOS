# The 3 Recurring-Access Credentials That Unblock the Assistant Permanently

**Doc number:** 1360  
**Status:** READY-TO-EXECUTE — three one-time Zaal setups, each ~5 minutes  
**Context:** From the "what can Zaal do to make the assistant most effective" conversation (2026-07-17). These 3 credentials cause repeated friction in every session because they're checked but absent, causing fallbacks or skipped steps.  
**Board task:** 3d7ca9cb  
**Related docs:** 1357 (Zuke HMS client), 822 (set-secret flow)

---

## Why These 3 Specifically

Every session the loop hits one or more of these gaps:

| Gap | Symptom | Frequency |
|-----|---------|-----------|
| No Reddit OAuth | Paste-every-Reddit-link friction; `/fetch` skill can't pull community data without UA tricks | Every research session |
| No multi-model fallback keys | Fleet has ZOE + research loops but no cheap/fast model for batch work; GROQ = free, fastest; OpenAI = widest ecosystem | Every multi-agent session |
| No Discord capture token | ZAI Discord bot can't read channels; ZAO Discord research requires manual copy-paste | Every Discord research or capture session |

Fixing all three takes ~15 minutes total. None require a paid plan to start.

---

## Setup 1: Reddit Script App (REDDIT_CLIENT_ID + REDDIT_SECRET)

**Time:** 5 minutes  
**Cost:** Free  
**What it unlocks:** `/fetch` Reddit skill works directly; research docs can pull community discussion without UA workarounds or asking Zaal to paste links.

**Steps:**
1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "create another app..." at the bottom
3. Name: `zao-loop-reader`
4. Type: **script** (not web app, not installed)
5. Redirect URI: `http://localhost` (required but unused for script apps)
6. Click "create app"
7. You'll see: `CLIENT_ID` (string under the app name) + `SECRET` (next field)
8. Run these in terminal:
   ```bash
   ~/bin/set-secret REDDIT_CLIENT_ID "<client_id_here>"
   ~/bin/set-secret REDDIT_SECRET "<secret_here>"
   ```
   This stores them in `~/.zao/private/reddit.env` via the secure set-secret flow.

**Verification:**
```bash
source ~/.zao/private/reddit.env
curl -s -A "zao-loop/1.0 (by u/<your_reddit_username>)" \
  -u "$REDDIT_CLIENT_ID:$REDDIT_SECRET" \
  --data "grant_type=client_credentials" \
  https://www.reddit.com/api/v1/access_token | python3 -m json.tool
# Should return {"access_token": "...", "token_type": "bearer", ...}
```

---

## Setup 2: Multi-Model API Keys (GROQ + OpenAI + xAI)

**Time:** 10 minutes total across 3 sign-ups  
**Cost:** Free tiers exist for all 3  
**What it unlocks:** 
- GROQ: voice-chat fast path in ZOE (already has env var, just needs the key); cheapest/fastest for batch research
- OpenAI: widest ecosystem compat for tools that only speak GPT-4
- xAI (Grok): X/Twitter research pass (Grok has live Twitter search)

### GROQ_API_KEY

1. Go to [console.groq.com](https://console.groq.com)
2. Create account / log in
3. API Keys → Create new API key
4. Copy the key
5. Run: `~/bin/set-secret GROQ_API_KEY "gsk_..."` → stores to `~/.zao/private/groq.env`

**What it enables immediately:** ZOE voice-chat (task 9e7520e2) — the handler is deployed and verified, just needs the key to be non-empty.

### OPENAI_API_KEY

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create secret key → name: `zao-loop`
3. Copy the key (starts with `sk-`)
4. Run: `~/bin/set-secret OPENAI_API_KEY "sk-..."`

**Note:** Free credits run out; add $5 to avoid 429s on the first day of actual use.

### XAI_API_KEY (optional, lower priority)

1. Go to [console.x.ai](https://console.x.ai) (requires X/Twitter account)
2. Create API key
3. Run: `~/bin/set-secret XAI_API_KEY "xai-..."`

---

## Setup 3: Discord Capture Token (DISCORD_CAPTURE_TOKEN)

**Time:** 5 minutes  
**Cost:** Free  
**What it unlocks:** ZAI Discord bot can read channels; ZAO Discord content can be captured and processed in-session instead of requiring manual paste.

**Steps:**
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click "New Application" → Name: `ZAI`
3. Go to Bot tab → Add Bot → Reset Token → copy the token
4. Enable these Privileged Gateway Intents:
   - Message Content Intent (to read messages)
   - Server Members Intent (optional, for member tracking)
5. Go to OAuth2 → URL Generator → Bot scope + Read Messages/View Channels
6. Use the generated URL to add ZAI to the ZAO Discord server
7. Run: `~/bin/set-secret DISCORD_CAPTURE_TOKEN "..."`

**Note:** The token is the bot's authentication, not a personal token. Never commit it.

---

## Order of Priority

| Priority | Credential | Friction killed | Time |
|----------|-----------|-----------------|------|
| 1st | GROQ_API_KEY | ZOE voice-chat + cheap batch model | 3 min |
| 2nd | REDDIT_CLIENT_ID/SECRET | Research Reddit without paste/UA tricks | 5 min |
| 3rd | OPENAI_API_KEY | Ecosystem compat for tools that need GPT-4 | 5 min |
| 4th | DISCORD_CAPTURE_TOKEN | ZAO Discord research without paste | 5 min |
| 5th | XAI_API_KEY | X research via Grok (low priority, Twitter API is expensive) | 5 min |

---

## The Set-Secret Flow (for reference)

All credentials should go through `~/bin/set-secret <KEY> <VALUE>` which:
1. Appends to `~/.zao/private/<lowercase-key>.env`
2. Adds the file to `.gitignore` if not already present
3. The key never appears in session history

To use in a session:
```bash
source ~/.zao/private/reddit.env  # or groq.env, openai.env, etc.
echo $REDDIT_CLIENT_ID  # verify it loaded
```

---

## After Setup

1. Restart ZOE bot (`pm2 restart zoe-bot` on VPS) to pick up GROQ_API_KEY
2. Verify ZOE voice-chat via Telegram voice message
3. Test Reddit fetch: open a research session and ask the loop to "find recent Reddit discussion about [topic]" without providing the URL
4. Close board task 3d7ca9cb when all 3 are confirmed working
