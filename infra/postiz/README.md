# Postiz, self-hosted on the ZAO VPS

Phase 1 of [doc 2667](../../research/cross-platform/2667-postiz-self-host-all-brands/): our own Postiz for Telegram, Discord, Bluesky and Farcaster, so the two hosted Postiz plans (about 58 USD a month) can be cancelled. LinkedIn and X already go out through the Paragraph app.

**Status, 2026-10-29: config and runbook only. Nothing is deployed.** Every command below marked ZAAL is his to run; the lane wrote them and ran none of them.

## Rules this setup keeps (doc 2667 decision 5)

| Rule | Where it is enforced |
|---|---|
| Not on the open internet | Every port in `docker-compose.yml` is bound to `127.0.0.1`. The only way in is the Cloudflare tunnel, and the hostname sits behind a Cloudflare Access gate (step 6) |
| `DISABLE_REGISTRATION` on | Hard-coded `'true'` in the compose file. Postiz v2.25.3 still lets the first account register while there are zero organisations (`apps/backend/src/services/auth/auth.service.ts`, `canRegister`), then refuses everyone else |
| `NOT_SECURED`, `STRIPE_PUBLISHABLE_KEY` unset | Not present in the compose file at all, and the compose file reads only named variables from `.env`, so adding them to `.env` does nothing. Do not add them to the compose file: Postiz tests them for truthiness, so even `false` turns secure cookies off or billing on |
| `STRIP_LINKS_FROM_X_POSTS` unset | Same: absent from the compose file |
| `POSTIZ_GENERIC_OAUTH` unset | Absent. `canRegister` lets the generic OAuth provider register even when registration is disabled |
| One organisation per brand | Step 8 |
| Pinned version | `ghcr.io/gitroomhq/postiz-app:v2.25.3` (latest release, 2026-10-24, a security release). Never `:latest` |
| A named updater | **Zaal, by default**, until he names someone else. See "Updates" |

## Why the config lives here

`infra/` in ZAOOS is where the VPS's Docker services are already kept: `infra/n8n/` is the same shape (compose file in git, secrets in a host-only `.env`, localhost-bound port) and is deployed by copying the folder to `~/n8n/` on the box. The VPS has no ZAOOS clone (`ls -d ~/ZAOOS*` on the VPS found none, 2026-10-29), so this follows n8n: copy `infra/postiz/` to `~/postiz/`, keep `.env` there only. Doc 2667's `/opt/postiz` needs sudo; `~/postiz` does not and matches what is already on the box.

## Fit check (measured 2026-10-29 17:07 UTC, read-only over `ssh vps`)

| Measure | Value |
|---|---|
| RAM | 7.8 GiB total, 6.4 GiB available, swap 410 MiB of 4 GiB used |
| CPU | 2 cores; load average 0.05 / 0.07 / 0.07; second `top -b -n 2 -d 2` sample 74 percent idle |
| Disk | 46 GB free of 96 GB |
| Docker | Engine 29.4.1, Compose v5.1.3; one container running (`zao-n8n`, 127.0.0.1:5678) |
| Ports 4007, 7233, 8080, 5432, 6379 | free |
| Running services | zoe-bot, zao-bus, zao-devz-stack, zaostock-bot, cowork-agent, farscout, cloudflared |

Postiz's own floor is 2 vCPU / 2 GB; the stack is roughly 1.8 GB before its two databases and Redis (doc 2667). **Memory fits with room. CPU is the thing to watch**: two cores is the supported floor, and one report has the app and Temporal near 27 and 31 percent CPU idle with 8 channels (issue 1570). First pull is several GB (the app image alone was measured at 5.24 GB, issue 950); 46 GB free covers it. Step 5 records `docker stats` so the real number replaces the estimate.

## Gates (Zaal's, nothing here does them)

1. The hostname and its DNS record. Default: **`postiz.zaoos.com`** - the VPS tunnel already serves `bus.zaoos.com`, so no new zone is needed.
2. Every secret. He enters them on the box (step 3 and the channel steps); none is ever pasted into a chat.
3. The first `docker compose up` on the VPS, and the cloudflared restart in step 6 (it briefly drops `bus.zaoos.com`).
4. Cancelling either hosted plan: only after the self-hosted instance has posted for a week (see "Cutover").

## Runbook

Lines marked CHECK print something to read before going on.

### 1. Copy the folder to the VPS (from the Mac, in a ZAOOS checkout at main)

```bash
ssh vps 'mkdir -p ~/postiz && test -z "$(ls -A ~/postiz)" && echo "empty, ok"'   # CHECK: "empty, ok"
scp -r infra/postiz/docker-compose.yml infra/postiz/dynamicconfig infra/postiz/backup.sh vps:~/postiz/
ssh vps 'ls -la ~/postiz ~/postiz/dynamicconfig'
```

### 2. Room on the box (ZAAL, on the VPS)

```bash
free -h && df -h / && uptime                                   # CHECK: >= 3 GiB available, >= 15 GB free
ss -ltn | grep -E ':(4007|7233|8080)\b' || echo "ports free"   # CHECK: "ports free"
```

### 3. Secrets and `.env` (ZAAL, on the VPS)

The three secrets are generated on the box and never shown. `.env` variable names (there is no `.env.example` file: writing one was refused by the lane's permission settings, so the names live here):

| Variable | Needed for | Value comes from |
|---|---|---|
| `POSTIZ_HOSTNAME` | boot | the hostname gate, e.g. `postiz.zaoos.com` (no `https://`) |
| `JWT_SECRET` | boot | generated below |
| `POSTIZ_DB_PASSWORD` | boot | generated below |
| `TEMPORAL_DB_PASSWORD` | boot | generated below |
| `TELEGRAM_BOT_NAME`, `TELEGRAM_TOKEN` | Telegram | @BotFather |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN_ID` | Discord | Discord developer portal |
| `NEYNAR_CLIENT_ID`, `NEYNAR_SECRET_KEY`, `NEYNAR_APP_FID`, `NEYNAR_APP_MNEMONIC` | Farcaster | Neynar dev portal + a new, empty Farcaster account |

```bash
cd ~/postiz && umask 077
{
  echo "POSTIZ_HOSTNAME=postiz.zaoos.com"          # change if the hostname gate picks another
  echo "JWT_SECRET=$(openssl rand -hex 48)"
  echo "POSTIZ_DB_PASSWORD=$(openssl rand -hex 24)"
  echo "TEMPORAL_DB_PASSWORD=$(openssl rand -hex 24)"
} > .env
chmod 600 .env && cut -d= -f1 .env                 # CHECK: four names, no values printed
docker compose config --quiet && echo "compose ok" # CHECK: "compose ok" (fails if a required name is missing)
```

Channel keys are added later the same way, one channel at a time: `cat >> ~/postiz/.env`, paste the `NAME=value` lines, Ctrl-D, then `cut -d= -f1 ~/postiz/.env` to see names only. Copy `.env` to the password manager; it is the only copy of the database passwords.

### 4. Pull (ZAAL, on the VPS)

```bash
cd ~/postiz && docker compose pull    # several GB, a few minutes
```

### 5. First start (ZAAL - this is the gated `docker compose up`)

```bash
cd ~/postiz && docker compose up -d
docker compose ps                                # CHECK: postiz, postiz-postgres, postiz-redis, temporal "healthy" (give it ~3 min)
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4007   # CHECK: a code below 500
docker stats --no-stream --format '{{.Name}} {{.CPUPerc}} {{.MemUsage}}'   # CHECK: paste these numbers to the lane
systemctl --user is-active zoe-bot zao-bus   # CHECK: both "active" (user units)
uptime                                           # CHECK: load average, compare with 0.05 before
```

If anything is unhealthy: `docker compose logs --tail 80 <service>`. Stop everything with `docker compose down` (keeps data); nothing else on the box is touched by this stack.

### 6. Hostname and the access gate (ZAAL - DNS and a cloudflared restart)

**Add the gate first, before any command below.** Until an organisation exists, Postiz lets anyone register the first account, and that account becomes Super Admin (the `canRegister` row above). So the hostname must never be reachable without the gate. In the Cloudflare dashboard: Zero Trust -> Access -> Applications -> Add -> Self-hosted, domain `postiz.zaoos.com`, one Allow policy with the named emails only, login method one-time PIN. Whether the dashboard accepts this before the DNS record exists has not been tried; if it refuses, stop here and do not run the commands below.

The tunnel is configured by file at `~/.cloudflared/config.yml` (tunnel `b5025a71-...`, one rule today: `bus.zaoos.com -> http://localhost:3099`, then the 404 catch-all).

```bash
cp ~/.cloudflared/config.yml ~/.cloudflared/config.yml.bak-$(date +%Y%m%d)-postiz
# Edit config.yml: add these two lines ABOVE "- service: http_status:404"
#   - hostname: postiz.zaoos.com
#     service: http://localhost:4007
cloudflared tunnel ingress validate                    # CHECK: "OK"
cloudflared tunnel ingress rule https://postiz.zaoos.com   # CHECK: matches the new rule
cloudflared tunnel route dns b5025a71-37d1-4579-9bed-9aa2f17e712e postiz.zaoos.com   # the DNS gate
systemctl --user restart cloudflared && sleep 5 && systemctl --user is-active cloudflared   # a user unit on this box
curl -sS -o /dev/null -w '%{http_code}\n' https://bus.zaoos.com   # CHECK: same code as before the restart
```

Then, right after the restart:

```bash
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://postiz.zaoos.com   # CHECK: 302 to *.cloudflareaccess.com, never 200
```

Any 200 means the gate is not working: run `cd ~/postiz && docker compose stop postiz` at once and fix the gate before going on.

That refused request is the proof the gate is live (`.claude/rules/silent-failure-guard.md` rule 9); paste it into the PR or lane brief.

### 7. First account (ZAAL, in a browser through the gate)

Open `https://postiz.zaoos.com`, register Zaal's account. It becomes Super Admin of the first organisation. Then in a private window, through the gate, open `/auth/register`: **CHECK it refuses** a second sign-up (registration is already disabled; the first account was allowed only because no organisation existed).

### 8. One organisation per brand

Name the first organisation **BetterCallZaal**. Then try to add **The ZAO** and **ZAO Festivals** from inside the app (organisation switcher / settings). Doc 2667 could not find how a second organisation is created with registration off; the v2.25.3 users controller has `/switch` and `/join-org` but no create route was found in a short read (not exhaustive).

If the UI cannot create one, the fallback, behind the gate only:
1. In `docker-compose.yml` on the box, set `DISABLE_REGISTRATION: 'false'`, `docker compose up -d postiz`.
2. Register one account per brand (e.g. a brand email), which creates its organisation; invite Zaal into each as admin from Settings -> Team.
3. Set it back to `'true'`, `docker compose up -d postiz`, and repeat the step 7 CHECK.

Write the result (which route worked) into doc 2667's "What is not known" list.

### 9. Channels, one at a time, each proven with one real post before the next

After each set of keys: `cd ~/postiz && docker compose up -d postiz`, then connect the channel in the right organisation and publish one real post.

| Channel | What it needs | Who clicks what |
|---|---|---|
| **Telegram** | A **new** bot just for this instance: `TELEGRAM_BOT_NAME`, `TELEGRAM_TOKEN`. Postiz polls Telegram with `getUpdates`, so the access gate does not block it, but two programs polling one token fight, so never reuse hosted Postiz's bot or ZOE's | Zaal: @BotFather -> `/newbot` -> keys into `.env`. Then adds the bot as admin to each channel or group, and connects it in each brand's organisation |
| **Discord** | A developer application with an icon: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN_ID`. OAuth redirect `https://postiz.zaoos.com/integrations/social/discord` | Zaal: discord.com/developers -> New Application -> icon, OAuth2 redirect, Bot token -> keys into `.env`. Then connects, as someone with Manage Server, per server |
| **Bluesky** | Nothing on the server | Each account owner: bsky.app -> Settings -> App passwords -> new one -> enter handle + app password in Postiz |
| **Farcaster** | `NEYNAR_CLIENT_ID`, `NEYNAR_SECRET_KEY` from a Neynar app (Free plan includes write APIs, doc 2667), plus `NEYNAR_APP_FID` and `NEYNAR_APP_MNEMONIC` for a **new, empty Farcaster account that represents the app**. Never a personal or brand account's recovery phrase on the server | Zaal: creates the empty app account, creates the Neynar app, keys into `.env`. Then each posting account (@zaal, @thezao) approves the signer in the Farcaster app. Skip until the app account exists |

**Media.** Uploads are stored locally and served from `https://postiz.zaoos.com/uploads/...`, which is behind the gate. Platforms that fetch an image by URL cannot get through it. Start with text and link posts; check one image post per channel before relying on images. Which providers upload the file versus link it was not checked per provider. If one fails, the choices are an Access bypass for the `/uploads` path or `STORAGE_PROVIDER=cloudflare` (R2); both are a separate decision.

### 10. Backups, before the first real post (ZAAL, on the VPS)

```bash
sudo mkdir -p /var/backups/postiz && sudo chown "$USER" /var/backups/postiz
chmod +x ~/postiz/backup.sh && ~/postiz/backup.sh     # CHECK: three files, none 0 bytes; it exits non-zero if one is
( crontab -l 2>/dev/null; echo '17 4 * * * $HOME/postiz/backup.sh >> $HOME/postiz/backup.log 2>&1' ) | crontab -
```

`backup.sh` writes `/var/backups/postiz/.last-ok` on success; a stamp older than two days means the job stopped. It deletes nothing: pruning old dumps is a manual step. Copy dumps off the box weekly. A restore has not been rehearsed until someone restores one.

## Updates

Updater: **Zaal** (default; change this line when he names someone). Weekly, or the day a release says "security":

```bash
gh release list --repo gitroomhq/postiz-app --limit 3
```

To update: run `~/postiz/backup.sh`, change the image tag in `~/postiz/docker-compose.yml` (and here, by PR), `docker compose pull postiz && docker compose up -d postiz`, read `docker compose logs --tail 50 postiz`, send one test post. The app pushes its schema on every start, so going back a version needs the dump.

## Cutover from hosted Postiz

A channel leaves hosted Postiz only after the same channel has published real posts from this instance. When Telegram, Discord, Bluesky and Farcaster have posted from here for a week, Zaal cancels both hosted plans. LinkedIn and X stay on the Paragraph app; YouTube, TikTok, Facebook and Instagram are doc 2667 phase 2 and are not covered by this instance.

## Credit

`docker-compose.yml` and `dynamicconfig/` are adapted from [gitroomhq/postiz-docker-compose](https://github.com/gitroomhq/postiz-docker-compose) at commit `dd4969e5` (AGPL-3.0). Postiz itself is [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) (AGPL-3.0), run unmodified.
