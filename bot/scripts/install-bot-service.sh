#!/usr/bin/env bash
# Install zaostock-bot as a user systemd unit on VPS.
# Run from ~/zaostock-bot after npm install + .env filled.

set -euo pipefail

BOT_DIR="$HOME/zaostock-bot"
UNIT_DIR="$HOME/.config/systemd/user"
UNIT_FILE="$UNIT_DIR/zaostock-bot.service"

if [ ! -f "$BOT_DIR/.env" ]; then
  echo "ERROR: $BOT_DIR/.env missing. Copy .env.example and fill it."
  exit 1
fi

if [ ! -d "$BOT_DIR/node_modules" ]; then
  echo "ERROR: Run 'npm install' in $BOT_DIR first."
  exit 1
fi

mkdir -p "$UNIT_DIR"
cp "$BOT_DIR/systemd/zaostock-bot.service" "$UNIT_FILE"

systemctl --user daemon-reload
systemctl --user enable zaostock-bot
systemctl --user restart zaostock-bot
sleep 2
systemctl --user status zaostock-bot --no-pager | head -20

echo ""
echo "Follow logs with: journalctl --user -u zaostock-bot -f"
echo "Enable on boot (requires sudo): sudo loginctl enable-linger $USER"
