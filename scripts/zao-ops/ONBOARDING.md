# Welcome to the ZAO operator toolkit

This is a guide for new ZAO team members (you, Iman, anyone else) to use the phone-first operator tools. You will be up and running in 5 minutes.

## What this is and why

The ZAO team works in parallel. Work fans out across many terminals, laptops, and processes. Your job as an operator or team lead is to stay the conductor - capture ideas, see priorities, make calls, and keep workers moving.

This toolkit does three things:

- **Capture**: drop ideas and questions into a Telegram topic via your phone (no typing, just voice).
- **Cockpit**: read your daily brief in one place (what's first, what needs you, PRs waiting, fresh ideas, anything stale).
- **Decide**: when a worker needs your call, they fire a button-question into Telegram. You tap an answer. It routes back. They ship.

The loop: you stay on your phone and in Telegram. Workers stay in their terminals. Everything fans back in through one queue.

## The concept in plain terms

Imagine this:

1. A worker is grinding on a feature. They hit a fork: "Should we ship this now or wait for the audit?"
2. They call `zao-ask` with that question + two options.
3. You get a button in Telegram. You tap "Audit first."
4. The worker reads that answer in their terminal and ships the audit.
5. Meantime, you never left Telegram. No back-and-forth DMs, no Slack threads, no guessing what the hold-up is.

The second brain: your cockpit brief (run once a day) shows you everything at a glance.
- **Do first**: the 3-5 highest-priority tasks.
- **Needs you**: open questions waiting for your answer.
- **PRs**: code waiting for review.
- **Ideas**: anything captured in the Ideas topic (via voice or Telegram).
- **Stale**: anything not touched in 2+ weeks.

All in one terminal command or one tap on the web app.

## Setup - you only do this once

### 1. Get a Telegram bot token (5 minutes)

- If the team already has a ZOE bot, use that token. Ask Zaal or check Slack.
- If you're setting up a new bot (e.g., for your team): open Telegram, search for @BotFather, say `/newbot`, follow the prompts. BotFather gives you a token. Keep it safe - it is a secret.

### 2. Add your bot to your Telegram group (1 minute)

- Your bot must be an admin of a forum-enabled Telegram group (one with Topics/Threads on).
- Invite your bot to the group. Make it an admin. Done.

### 3. Create your tg.env config (2 minutes)

On your Mac, open a terminal:

```bash
mkdir -p ~/.zao/private
touch ~/.zao/private/tg.env
chmod 600 ~/.zao/private/tg.env
```

Open `~/.zao/private/tg.env` in your editor and add two lines:

```
ZOE_BOT_TOKEN=123456:your-bot-token-here
ZAAL_BOTZ_GROUP_ID=-1001234567890
```

Replace the token with your real bot token from BotFather. For the group ID:

- Go to Telegram and find your group.
- Type `/chatid` in the group. Your bot will reply with a number like `-100123456789`. That is the group ID. Copy it.

(The `-100` prefix is Telegram's thing. Use the whole number.)

Save. Never commit this file - it contains your bot token.

### 4. Get the group and topic IDs for Siri voice capture (optional, but recommended)

You have two capture methods: Telegram DMs or phone voice via Siri. If you want Siri:

- Run `/chatid` in your group. That is your **group ID** (already in tg.env).
- Find the Ideas topic in your group. Tap it. Look at the URL or run this command in your terminal to find its ID:

```bash
# Check if topics.json exists on the VPS (where ZOE runs)
ssh zaal@31.97.148.88 'cat ~/.zao/zoe/topics.json' | grep -i ideas
```

Look for the line with `"Ideas"` and grab the thread ID (a number). You will need this for the Siri shortcut.

### 5. Put the scripts on your PATH (1 minute)

Clone or navigate to the ZAOOS repo. Then:

```bash
ln -s /path/to/ZAOOS/scripts/zao-ops/zao-* ~/bin/
```

(If `~/bin/` does not exist, create it: `mkdir -p ~/bin/` and add it to your PATH in your shell profile: `export PATH="$HOME/bin:$PATH"`.)

Test:

```bash
zao-cockpit
```

If it works, you see your cockpit brief. If not, check that your `tg.env` is set and the VPS host is reachable.

### 6. Set up Siri voice capture on your phone (optional, 3 minutes)

On your iPhone:

- Open the Shortcuts app.
- Tap `+` to create a new shortcut. Name it `ZAO Capture`.
- Add an action: **Dictate Text** (this captures your voice).
- Add a second action: **Get Contents of URL**. Set it to:
  - URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
  - Method: POST
  - Request Body: Form
  - Fields:
    - `chat_id` = your group ID
    - `message_thread_id` = your Ideas topic ID
    - `text` = the Dictated Text variable (tap the field and pick it from the variable menu)
- (Optional) Add **Show Notification** with text "Captured" for confirmation.
- Save. In the shortcut's settings, turn on "Use with Siri."

Now say "Hey Siri, ZAO Capture" anytime. Speak your idea. It posts to your Ideas topic instantly.

## Daily use - what you actually do

### Morning - read the cockpit

```bash
zao-cockpit
```

This prints your brief in your terminal. Or go to the web app and check the `/board` page (if you are using the cowork app).

You will see:
- Do first (top priorities)
- Needs you (questions waiting for your answer)
- PRs (code to review)
- Ideas (captures from the Ideas topic)
- Stale (anything not touched recently)

Spend 2 minutes reading it.

### During the day - capture and answer

- **Capture**: idea pops in your head? Say "Hey Siri, ZAO Capture" or send a Telegram DM to your bot saying the idea. It lands in the Ideas topic.
- **Answer**: working in Telegram? When a question pops up with buttons, tap your answer. The worker sees it in their terminal and ships.

### Anytime - sweep the cockpit into Telegram

If you want your whole team to see the cockpit:

```bash
zao-sweep
```

This posts the brief into your Telegram group as one message. Everyone sees the priorities, ideas, and open questions. Your team reads one digest instead of asking you for status.

Cron this once a day (e.g., 6am) on the VPS to auto-post the morning sweep. Ask Zaal for help setting that up.

## Three things you will do day one

1. Run `zao-cockpit` and read your brief.
2. Say "Hey Siri, ZAO Capture" (or send a Telegram DM to your bot) with an idea. Watch it land in the Ideas topic.
3. Answer a button-question that is waiting in your Telegram group. Watch the answer log and know that a worker saw it.

Done. You are now in the loop.

## Quick reference - what each tool does

| Tool | What it does | When to use |
|------|---|---|
| `zao-cockpit` | Print your daily brief (do-first, needs-you, PRs, ideas, stale) in the terminal | Every morning, or anytime you want to sync on status |
| `zao-sweep` | Post that same brief into Telegram General so your team sees one digest | Once daily (usually 6am) or before a team meeting |
| `zao-ask` | Fire a button-question from any terminal into Telegram so you can decide without leaving Telegram | When a worker (or agent loop) hits a fork and needs your call |
| Siri "ZAO Capture" | Dictate an idea into your phone; it posts to the Ideas topic instantly | Anytime inspiration hits: gym, car, lunch, random 3am thought |
| Telegram DM to bot | Text a quick thought or question to your bot; it lands in Ideas | When you are already in Telegram and don't want to switch to Siri |
| `/board` on the cowork app | Web view of your cockpit brief | If you prefer clicking on the web instead of running `zao-cockpit` in terminal |
| `zao-api-audit` | Map every API key (Alchemy, Neynar, Supabase, etc.) to which files in your codebase use it | When you want to understand which features are burning which API credits |
| `zao-usage-proxy` | Check how many PRs merged and commits landed today (a rough proxy for token burn) and warn in Telegram if it is over a threshold | Daily check to see if you had a heavy build day (not real usage telemetry, just a smoke alarm) |

## Troubleshooting

**`zao-cockpit` returns nothing or times out:**
- Check that `~/.zao/private/tg.env` exists and has the right token and group ID.
- Check that the VPS host (`31.97.148.88` by default) is reachable: `ssh zaal@31.97.148.88 'echo ok'`.
- If the VPS is down, Zaal will know. Try again later.

**Siri shortcut is not posting:**
- Confirm your bot token is correct in the shortcut (copy from tg.env).
- Confirm your group ID and Ideas topic ID are right. Run `/chatid` in the group again.
- Check that your bot is an admin of the group.
- If it still fails, open the shortcut's detail screen and check the "Get Contents of URL" step - the Telegram API might have returned an error.

**Button-questions are not showing in Telegram:**
- Confirm your group ID in tg.env is correct.
- Confirm your bot is an admin of the group.
- Try running `zao-ask test "Is this working?" "Yes" "No"` from the terminal to test.

**Ideas are not showing in the cockpit:**
- Confirm ideas are actually being posted to the Ideas topic (check Telegram).
- Run `zao-cockpit` and look at the Ideas section. If empty, the topic might not be wired up in the tracker.
- Ask Zaal to check the cowork tracker config.

## What next

Once you are comfortable:
- Run `zao-sweep` every morning to keep the team in sync.
- Use `zao-ask` from your own scripts and terminals when you need a decision.
- Teach other team members this same guide.

See also:
- `scripts/zao-ops/README.md` - full technical reference.
- `research/identity/606-zaal-second-brain-system/` - the philosophy behind the capture-process-resurface-output loop.
- `SIRI-CAPTURE.md` - detailed Siri shortcut recipe (more options for power users).
