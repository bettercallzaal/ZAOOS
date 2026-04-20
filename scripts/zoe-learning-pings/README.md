# ZOE Learning Pings

Random tip from the ZAO OS research library + ADRs, sent every 30 minutes during waking hours via ZOE's Telegram bot. Helps Zaal stay current on what's in the brain trust without manual searching.

**Spec source:** doc 459 follow-up + 2026-04-20 EOD wrap-up.

## Source Docs

The script picks randomly from:

- `research/dev-workflows/*/README.md`
- `research/agents/*/README.md`
- `research/infrastructure/*/README.md`
- `research/community/*/README.md`
- `research/governance/*/README.md`
- `research/farcaster/*/README.md`
- `research/identity/*/README.md`
- `docs/adr/*.md`

Edit `DOC_GLOBS` in `random_tip.py` to widen/narrow the pool.

## Tip Extraction

Sends doc to Claude Haiku 4.5 via the Anthropic API. Prompt asks for ONE actionable tip in Zaal's second person, max 240 chars, with `SKIP` allowed when no tip exists. Cost is approx $0.0001 per ping (Haiku-tier).

## Anti-Repeat

State file at `~/.cache/zoe-learning-pings/sent.json` tracks the last 7 days of sent doc paths. Picks exclude recently-sent docs unless the pool is exhausted.

## Quiet Hours

Default: skip pings between 9pm-9am host time. Override via `QUIET_HOURS_START` / `QUIET_HOURS_END` env vars.

Set the host timezone to America/New_York if not already:

```bash
sudo timedatectl set-timezone America/New_York
```

## Local Dry Run (Mac)

Test from this repo without needing the VPS or Telegram:

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
ANTHROPIC_API_KEY=<your-key> \
ZAO_OS_REPO="$(pwd)" \
python3 scripts/zoe-learning-pings/random_tip.py
```

Without `TELEGRAM_BOT_TOKEN` set, the tip prints to stdout instead of sending. That's the verification mode.

## Deploy to VPS 1 (Hostinger ZOE host)

Run via the `/vps` skill in a Claude session, or manually:

```bash
# 1. SSH to VPS 1
ssh root@31.97.148.88

# 2. Clone or update ZAO OS repo
mkdir -p /opt/zao-os && cd /opt/zao-os
if [ -d .git ]; then git pull; else git clone https://github.com/bettercallzaal/ZAOOS.git .; fi

# 3. Install Python script (idempotent)
mkdir -p /opt/zoe/bin /var/cache/zoe-learning-pings
cp /opt/zao-os/scripts/zoe-learning-pings/random_tip.py /opt/zoe/bin/random_tip.py
chmod +x /opt/zoe/bin/random_tip.py

# 4. Create env file (only once - protect with chmod 600)
cat > /opt/zoe/zoe-learning-pings.env <<'EOF'
ANTHROPIC_API_KEY=<paste-key>
TELEGRAM_BOT_TOKEN=<paste-zoe-bot-token>
TELEGRAM_CHAT_ID=<paste-zaal-chat-id>
ZAO_OS_REPO=/opt/zao-os
ZOE_PINGS_STATE=/var/cache/zoe-learning-pings/sent.json
QUIET_HOURS_START=21
QUIET_HOURS_END=9
EOF
chmod 600 /opt/zoe/zoe-learning-pings.env

# 5. Wrapper script that loads env then runs Python
cat > /opt/zoe/bin/zoe-learning-pings.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
set -a
source /opt/zoe/zoe-learning-pings.env
set +a
cd /opt/zao-os && git pull --quiet
exec python3 /opt/zoe/bin/random_tip.py
EOF
chmod +x /opt/zoe/bin/zoe-learning-pings.sh

# 6. Test once before scheduling
/opt/zoe/bin/zoe-learning-pings.sh

# 7. Add to crontab (every 30 min, all hours - script self-gates quiet hours)
(crontab -l 2>/dev/null; echo "*/30 * * * * /opt/zoe/bin/zoe-learning-pings.sh >> /var/log/zoe-learning-pings.log 2>&1") | crontab -

# 8. Verify
crontab -l | grep zoe-learning-pings
tail -f /var/log/zoe-learning-pings.log
```

## Cost

- Claude Haiku 4.5: ~$0.0001 per ping
- 24 pings/day (12 hours active * 2/hour) = ~$0.0024/day = ~$0.07/month
- Telegram bot: free
- VPS overhead: negligible (cron + small Python process)

## Disable

```bash
crontab -l | grep -v zoe-learning-pings | crontab -
```

State + script remain on disk; just removes the schedule. Re-add the cron line to resume.

## Future Extensions

- **Sync auto-memory to VPS** so instinct store + project memos enter the pool. Today the pool is repo-only; auto-memory is Mac-local.
- **Open from Telegram** — add inline button on each tip that opens the source doc on the laptop (deep-link to `cursor://` or `code://` URI).
- **Topic weighting** — boost docs from areas Zaal is currently working in (detect via recent git activity).
- **Streak tracking** — every doc has a "last sent" timestamp; build a "X docs in your library you haven't seen in 30 days" report.
- **Move from cron to Claude Routines** (doc 422) — gets cloud execution + UI dashboard for free.
