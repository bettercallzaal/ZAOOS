#!/usr/bin/env bash
# zao-bus deploy - idempotent, run ON the VPS as the operator (Zaal-gated step).
# Creates env with minted tokens if absent, installs the unit, starts, health-checks.
set -euo pipefail
ENV=/root/.zao/bus.env
mkdir -p /root/.zao /root/zao-bus
if [ ! -f "$ENV" ]; then
  umask 077
  cat > "$ENV" <<EOT
BUS_PORT=3099
BUS_DATA_DIR=/root/zao-bus
BUS_ADMIN_TOKEN=$(openssl rand -hex 32)
BUS_GUEST_TOKEN=$(openssl rand -hex 32)
BUS_GUEST_AGENT=zoe
BUS_GUEST_TOKEN_CANDY=$(openssl rand -hex 32)
EOT
  echo "minted new tokens into $ENV (chmod 600) - hand the CANDY token to Candy out-of-band"
fi
cp /root/ZAOOS/infra/bus/deploy/zao-bus.service /etc/systemd/system/zao-bus.service
systemctl daemon-reload
systemctl enable --now zao-bus
sleep 1
curl -fsS http://localhost:3099/bus/health || { echo "HEALTH CHECK FAILED - aborting"; systemctl status zao-bus --no-pager | tail -5; exit 1; }
echo
echo "bus healthy on :3099. Expose it by adding to infra/portal/cloudflared/config.yml:"
echo "  - hostname: bus.zaoos.com"
echo "    service: http://localhost:3099"
echo "then restart cloudflared and add the DNS route: cloudflared tunnel route dns <tunnel> bus.zaoos.com"
