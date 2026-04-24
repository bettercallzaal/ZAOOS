# ZAOstock Team Bot (v1)

Telegram bot for the ZAOstock crew. Runs on VPS, talks to the `/stock/team` dashboard via Supabase.

## What v1 does

- `/start` — first-time link: asks for your 4-letter dashboard login code, stores `telegram_id` on `stock_team_members`
- `/help` — command list
- `/status` — festival snapshot (sponsors, artists, volunteers, overdue follow-ups, overdue milestones)
- `/mytodos` — your open todos from `stock_todos`
- `/mycontributions` — your last 7 days from `stock_activity_log`
- `/gemba <text>` — quick standup log, saved as activity log entry
- `/idea <text>` — drop a suggestion into `stock_suggestions`
- `/note <text>` — append a line to the next upcoming meeting's notes

Every write is logged to `stock_activity_log` with `action='bot_write'` so you can see everything in the dashboard Activity tab.

## What v1 does NOT do (yet)

- Natural-language free-form ("I called Bangor, they committed $5K" → parse → contact log)
- Voice notes → Whisper → parse
- Collaborative builder mode (teammate DMs an idea for a page change → Claude Code opens a PR)
- Push notifications (daily gemba prompt, morning digest)

Those are v1.1 / v1.2. See `research/events/492-zaostock-sixsigma-ops-and-telegram-bot/` for the full spec.

## Deploy (VPS at 31.97.148.88)

1. SSH in: `ssh zaal@31.97.148.88`
2. Clone/sync the `bot/` folder to `~/zaostock-bot/`
3. `cd ~/zaostock-bot && npm install`
4. Fill `.env` (copy from `.env.example`, paste TELEGRAM_BOT_TOKEN from @BotFather)
5. Run `scripts/install-bot-service.sh` (creates a user systemd unit)
6. `systemctl --user start zaostock-bot`
7. Verify: `systemctl --user status zaostock-bot` and `journalctl --user -u zaostock-bot -f`

## Prerequisites (DB)

Run `scripts/stock-team-bot-migration.sql` in Supabase SQL Editor once. Adds:
- `stock_team_members.telegram_id BIGINT UNIQUE`

## Two testers for week 1

Zaal + Iman. After 48 hrs of no bugs, onboard Candy + DCoop.
