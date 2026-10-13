---
topic: cross-platform
type: decision
status: research-complete
last-validated: 2026-10-13
related-docs: 2244, 1089, 2135, 897
original-query: "i think thats worth it we need the ZAO and the zaal and ZAO festivals all brands and its worth the setup time to make a ZAO postiz instance (Zaal, 2026-10-13, relayed by the orchestrator seat). Deliver: what self-hosting needs, the licence, what each platform needs from a self-hosted instance split EASY vs REVIEW-NEEDED, a phased plan on the existing VPS, and a brand-by-channel matrix."
tier: DISPATCH
---

# 2667 - A ZAO Postiz instance: self-hosting for all brands

> **Goal:** Zaal ruled on 2026-10-13 to self-host Postiz for The ZAO, Zaal / BetterCallZaal and ZAO Festivals, with WaveWarZ, COC Concertz and ZABAL later. Say what that takes, what each platform will and will not let a self-hosted instance do, and give a phased plan that keeps posts going out the whole time.

How this was researched: three sub-agents ran real fetches on 2026-10-13 (GitHub through `gh api`, docs.postiz.com, each platform's own developer pages, community issues). The lane read their reports and read the canonical compose file itself. Nothing was installed, no server was touched and no account was created. Every source is marked FULL, PARTIAL or FAILED at the end, as the sub-agents reported it.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **BUILD the instance, but as a hybrid. Hosted Postiz stays paid and in use.** Self-host carries the channels that need no platform review; hosted keeps LinkedIn, YouTube and TikTok until each one works self-hosted. | Hosted Postiz posts through developer apps that Postiz already got approved. A self-hosted instance starts with none. On day one it can post publicly to Telegram, Discord, Bluesky, Mastodon, Nostr, Farcaster and (paid per post) X. It cannot post publicly to TikTok, Facebook or Instagram, and stock LinkedIn connect fails. |
| 2 | **Know the alternative before the setup time is spent: hosted Pro is $49 a month for 30 channels** (Team $39 for 10). That also gives "all brands in one place" with no server, no patching and every platform working. | [Doc 2244](../2244-posting-platform-decision/) read postiz.com/pricing on 2026-10-07. What self-hosting adds over that: links kept in X posts, no channel cap, our own data, and brands split into separate organisations. What it costs: the list in decision 5. Zaal has ruled; this row is here so the ruling is made with the number in view. |
| 3 | **Plan for TikTok to stay on hosted Postiz for good.** | TikTok's own audit rules list as "Not acceptable": "A utility tool to help upload contents to the account(s) you or your team manages." That is exactly a ZAO instance. Without the audit every post is forced to private (SELF_ONLY), from at most 5 users a day, and the accounts must be set private. |
| 4 | **Treat Facebook and Instagram as a business-verification project, not a setup step.** | A Meta app in Development mode can post for people who hold a role on the app, with no review. Meta: such data "can only be seen by role users". Public posts need App Review and Business Verification (a screen recording per permission, a privacy policy URL, Meta able to log in and test). Meta says a decision comes "within a week" of a complete submission. |
| 5 | **Do not put the instance on the open internet. Put it behind an access gate, pin the version, and assign one named person to update it.** | 19 published security advisories, 18 of 19 published in 2026 (by publish date, gh api, as of 2026-10-13), several critical and exploitable without logging in (file read via `/uploads` leading to takeover, fixed in v2.22.1; an unauthenticated endpoint that minted top-tier orgs, fixed in v2.24.0). Five of the last eight releases carry security fixes. The project supports only the latest release. |
| 6 | **Run it unmodified.** If a patch is ever needed (the LinkedIn scope fix is the likely one), publish our fork and link it from the instance. | The LICENSE file is AGPL-3.0. Section 13 applies "if you modify the Program": every user who logs in over the network must be offered the modified source. Unmodified, there is nothing to publish. |
| 7 | **One organisation per brand, not one organisation with "customers".** Test on day one that a second organisation can be created. | Postiz "customers" are a filter over channels inside one organisation, not a wall. Anyone in the organisation can post to every channel in it. Separate organisations keep IMan's ZAO Festivals access apart from Zaal's personal accounts. How a second organisation is created with sign-up disabled was not found in the docs. |

## What a self-hosted instance needs

Source: the canonical `docker-compose.yaml` in `gitroomhq/postiz-docker-compose` (last commit dd4969e5, 2026-07-30), read by the lane, plus the docs' system requirements page.

| Piece | Image | Notes |
|---|---|---|
| Postiz app (frontend, backend, orchestrator in one container) | `ghcr.io/gitroomhq/postiz-app:latest` | Stock file maps host `4007` to container `5000` on every interface. Change to `127.0.0.1:4007:5000`. Pin a version tag; latest release is v2.25.1 (2026-10-11, a security release). One self-hoster measured the image at 5.24 GB (issue 950) |
| App database | `postgres:17-alpine` | Named volume `postgres-volume`. Holds channel tokens, posts, users |
| Queue and cache | `redis:7.2` | Named volume |
| Temporal (scheduler; required since v2.12.0) | `temporalio/auto-setup:1.28.1` | Bound to 127.0.0.1:7233 |
| Temporal's database | `postgres:16` | Second Postgres. Password is the literal `temporal` in the stock file |
| Temporal's search | `elasticsearch:7.17.27` | Java heap capped at 256 MB in the stock file |
| Temporal admin tools, Temporal UI | `temporalio/admin-tools`, `temporalio/ui:2.34.0` | Optional. UI bound to 127.0.0.1:8080 |
| Spotlight (debug) | `ghcr.io/getsentry/spotlight` | Only starts under the `debug` profile. Leave off |

Hardware, from docs.postiz.com: floor 2 vCPU, 2 GB RAM, 20 GB disk; recommended 4 vCPU, 8 GB, 50 GB. "The official Docker Compose has been tested on a 2 GB / 2 vCPU Ubuntu VM running everything on one host ... once you have multiple users, scheduled workflows, or external Postgres/Redis on the same host, plan for 4 GB or more."

The VPS, as measured on 2026-10-07 for doc 2244 (`ssh vps free -h`; not re-measured for this doc, the lane does not ssh): 7.8 GiB RAM with 6.2 GiB available, 2 cores, 46 GB disk free. It also runs the ZOE bot and the message bus. Community measurements put the stack at roughly 1.8 GB before the two databases and Redis (one blog, 4 GB LXC), and one open issue (1570) reports the app at about 27 percent CPU and Temporal at about 31 percent while idle with 8 channels. It fits in memory. Two cores is the supported floor, and the idle CPU on a box that also runs ZOE is the thing to watch in the first week.

Environment, six required values validated on boot: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NEXT_PUBLIC_BACKEND_URL` (the frontend URL plus `/api`), `BACKEND_INTERNAL_URL` (`http://localhost:3000`). Also set: `MAIN_URL`, `TEMPORAL_ADDRESS`, `IS_GENERAL: 'true'`, `RUN_CRON: 'true'` (already in the canonical file), `DISABLE_REGISTRATION`, `STORAGE_PROVIDER` (`local` or `cloudflare` for R2).

Three settings where the wrong value is silent:

- **`NOT_SECURED`**: never set it. The code tests `!process.env.NOT_SECURED`, so any value, including the text `false`, turns secure cookies off.
- **`STRIP_LINKS_FROM_X_POSTS`**: leave it unset to keep links in X posts. Same truthiness rule: `false` would turn stripping on. One part of the path (`posts.service.ts`) was not read, so send one test post with a link before relying on it.
- **`STRIPE_PUBLISHABLE_KEY`**: leave empty. Setting it turns on billing and plan limits. Without it "an install without a Stripe key has no plan gating at all and behaves as the top tier".

HTTPS and a real hostname are required: "Postiz sets secure cookies, so it expects HTTPS in production", and every platform's login returns to `https://<host>/integrations/social/<provider>`. Use one hostname for everything; a frontend and backend on different parent domains fail with "Invalid state". The login cookie is set on the parent domain, so hosts under shared suffixes (ngrok, `*.ts.net`, DuckDNS) cannot log in (issue 1143, open).

## The licence

Read from the LICENSE file, not the API field: "GNU AFFERO GENERAL PUBLIC LICENSE / Version 3, 19 November 2007". No `ee/` directory and no second licence file in the tree (1,312 paths). README: "We do not 'gate' features or limit the license."

Section 13, the sentence that matters: "if you modify the Program, your modified version must prominently offer all users interacting with it remotely through a computer network ... an opportunity to receive the Corresponding Source of your version by providing access to the Corresponding Source from a network server at no charge".

- Unmodified, for our team: no source-offer duty arises from section 13.
- Modified, with IMan and outside collaborators logging in: they are remote users, so the modified source must be offered to them. A public fork and a footer link covers it.
- Contributors sign a CLA, so upstream can relicense future versions. Nothing fetched says a change is planned.
- Sections 0 to 12 were not read in full. This is a reading of the text, not legal advice.

## Each platform, for a self-hosted instance

A self-hosted Postiz needs its own developer app or credential on every platform. "Public on day one" means a post goes out to everyone with no review passed.

### EASY: no review

| Platform | What the instance needs | Cost | Public on day one | Who clicks |
|---|---|---|---|---|
| Telegram | A bot from @BotFather: `TELEGRAM_BOT_NAME`, `TELEGRAM_TOKEN`. "Use one bot token per Postiz deployment." Bot added as admin to each group or channel | Free | Yes | Zaal: BotFather, then add the bot to each channel |
| Discord | A developer application with an icon: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN_ID`. The person connecting needs Manage Server. Discord verification is only "required for your app to scale past 100 servers" | Free | Yes | Zaal: developer portal, then authorise per server |
| Bluesky | Nothing on the server. Each account enters its handle and an app password in Postiz | Free | Yes | Each account owner |
| Mastodon | One app per Mastodon server, registered with a single curl: `MASTODON_URL`, `MASTODON_CLIENT_ID`, `MASTODON_CLIENT_SECRET` | Free | Yes | Whoever deploys |
| Nostr | Nothing on the server. The user enters a private key in Postiz | Free | Yes | Each key owner |
| Farcaster | Neynar: `NEYNAR_CLIENT_ID`, `NEYNAR_SECRET_KEY`, **and**, per the current code, `NEYNAR_APP_FID` and `NEYNAR_APP_MNEMONIC`: a Farcaster account that represents the app, and the recovery phrase of its custody wallet, stored in the server's env. The docs page does not mention the last two | Neynar Free plan (10M credits a month) "Includes ... all Read & Write APIs". Starter $9 and Growth $49 "are no longer offered to new customers" since June 2026; next tier is Scale at $249 | Yes | Zaal: Neynar app, **and create a new, empty Farcaster account for the app**. Never put a personal or brand account's recovery phrase on the server. Each user then approves a signer in the Farcaster app |
| X | A developer app at console.x.com, type Native App, Read and Write: `X_API_KEY`, `X_API_SECRET`. No review step is documented | **Pay per post: $0.015 a post, $0.20 a post that contains a URL** (X changelog, effective 2026-04-20). 30 link posts a month is $6; 100 is $20. Credits bought up front; if the balance hits zero posts fail (Postiz issue 2231 shows the UI saying "Added successfully" on a 402) | Yes | Zaal: console.x.com, card and a spending limit, then each X account authorises |
| Lens | **No Postiz provider exists.** Feature request 1024 was closed by the stale bot | - | No | Stays on Firefly |

X is in this table because it needs no review, but it is the one easy platform with a meter. Zaal's X, Farcaster, Lens and Bluesky posts go through Firefly today, at no cost; moving X into the instance buys scheduling and links in the body at $0.20 a link post.

### REVIEW-NEEDED

| Platform | Without any review | What full function needs | Cost | Time | What Zaal must submit himself |
|---|---|---|---|---|---|
| LinkedIn | **Stock Postiz fails to connect even a personal profile.** Its docs: "The organization scopes are required for the regular LinkedIn provider too". Those scopes come from LinkedIn's Advertising API or Community Management API. Self-hosters report the failure (issues 1580, 1582, open) and patch the provider. A patched provider with only "Share on LinkedIn" could post to a personal profile, re-authorised about every 60 days (no refresh token without Marketing platform approval) | Advertising API or Community Management API, Development tier. LinkedIn checks: "Verified business email address", "Verified organization", "Verified organization website and domain address", and verification by a super admin of the company Page. "Personal email addresses won't pass the vetting process." If rejected: "You won't be able to re-apply for Development tier access with your existing app." | No fee found | Not published. Survey due within 21 days of being triggered, then an unstated wait. Plan for weeks | App creation, link to the company Page, Page super-admin verification, the access form with a business-domain email and legal-entity details |
| YouTube | Works in "Testing" status with each channel's Google account added as a test user (cap 100). But "Authorizations by a test user will expire seven days from the time of consent", refresh token included, so **every channel is reconnected weekly**. Whether uploads are public is contradicted in Google's own docs: the 28 July 2020 revision says uploads from unverified projects "will be restricted to private viewing mode"; the current `videos.insert` page says they "are not restricted to private viewing mode". One test upload settles it | OAuth app verification (to leave Testing and end the 7-day expiry), and the YouTube API compliance audit if uploads come out private. The audit form wants "significant independent value to the YT ecosystem" | No fee found | Testing is same-day. Verification and audit times not published | Google Cloud project, consent screen, test users, then the verification and audit forms. Postiz also requests a `youtubepartner` scope it never uses, which complicates verification (issue 2168) |
| TikTok | **Private only.** "Unaudited API Clients can only post contents in SELF_ONLY viewership", "up to 5 users to post in a 24 hour window", and "All user accounts using the API client to post must be set to private at the time of posting." | App review and the Direct Post audit: a full public website (not a landing page), terms and privacy pages, domain verification, demo videos recorded in the sandbox. TikTok's rules name a tool for accounts "you or your team manages" as "Not acceptable", and "Apps must not be for private or personal use." Postiz's own composer has failed the audit's UX rules until patched (issue 1563) | No fee found | Vendor estimates 2 to 6 weeks, unconfirmed; first attempts are often rejected | Everything, and it is likely to be refused for a ZAO-only tool |
| Facebook Pages | Posts go out, but Meta says data from a Development-mode app "can only be seen by role users". Postiz's doc says the same: "posts made via the API will display for yourself but will not be visible for other users." Fine for a test, no use for promotion | Advanced Access: App Review plus Business Verification. Per permission: one successful API call in the last 30 days, a written use, and a screen recording ("Any requested permission or feature missing a screen recording will not be approved"). Also a privacy policy URL, a 1024 by 1024 icon, and "If we are unable to access your app to test it, your entire submission will be rejected." Then switch to Live. Switching to Live before approval can break it even for role holders | No fee found | Meta: "you should receive a decision within a week". Business Verification time not found | Meta business portfolio, the app, business documents, the recordings, the submission |
| Instagram | Same app as Facebook, or the standalone Instagram login. Each account must be a professional account and be added as an "Instagram Tester" and accept the invite, or connect fails (issue 1122). Meta has no Instagram-specific sentence on Development-mode visibility; the general rule above is the only one found | Same as Facebook. Open issue 1578 (2026-06-03, still active 2026-07-29) reports the Facebook-login route failing with "Invalid Scopes: instagram_basic" on new installs | No fee found | Same | Same, plus making each Instagram account professional |
| Threads | Works for "Threads Testers" with no review, per Meta and Postiz ("You should not have any extra requirements to publish and maintain access") | App Review only if people without a role on the app must connect | No fee found | Minutes | The app, then each Threads user accepts a tester invite |

Reddit, Pinterest and Slack were checked only briefly: Pinterest needs app approval; Reddit mentions review for commercial use; Slack needs none for its own workspace.

**What this adds up to.** For the three brands Zaal named, a self-hosted instance alone covers Telegram, Discord, Farcaster, Bluesky, Threads and (metered) X without asking anyone's permission. LinkedIn, YouTube, TikTok, Facebook and Instagram, which are the ones Zaal connected to hosted Postiz this week, are exactly the ones a self-hosted instance cannot fully do on day one.

## Options compared

| | A. Hosted only, bigger plan | B. Self-host everything now | C. Hybrid (recommended, and how to carry out Zaal's ruling) |
|---|---|---|---|
| Monthly cost | $39 (10 channels) or $49 (30 channels) | $0 licence; X at $0.015 or $0.20 a post; the VPS is already paid | Current hosted plan stays, plus X per post if X moves in |
| Platforms that post publicly on day one | All | Telegram, Discord, Bluesky, Mastodon, Nostr, Farcaster, Threads, X | All: easy ones self-hosted, the rest on hosted |
| Links in X posts | Stripped, by design (issue 1939 closed "not planned") | Kept | Kept on self-hosted |
| Brands kept apart | Customers inside one workspace | Separate organisations | Separate organisations on self-hosted |
| Who patches it | Postiz | ZAO, about twice a month on recent form | ZAO for the instance |
| Review work | None | LinkedIn, Google, TikTok, Meta, each ours to pass | One platform at a time, only where it is worth it |
| Biggest risk | Channel cap, X links | TikTok, Facebook and Instagram dark for weeks or for good | Two tools to look at until Phase 2 finishes |

## The phased plan

Rule for the whole plan: **a channel leaves hosted Postiz only after the same channel has published a real post from the self-hosted instance.** Nothing is cancelled first.

### Phase 0: decisions and names (Zaal, about 20 minutes)

1. Hostname. `postiz.thezao.com` is the natural one. The VPS already serves `bus.zaoos.com` through a Cloudflare tunnel, so `postiz.zaoos.com` works with the tunnel that exists; `postiz.thezao.com` needs thezao.com's DNS to be on the same Cloudflare account as that tunnel. DNS is Zaal's.
2. Who has logins. Proposed: Zaal as Super Admin of every organisation; IMan as Admin of ZAO Festivals only. Everyone else by invite, with a named reason.
3. Who updates it. One name. The instance needs a version bump roughly every two weeks, sooner on a security release.
4. An empty Farcaster account for the app (see the Farcaster row). Skip Farcaster in Phase 1 if this is not wanted yet.

### Phase 1: instance up, easy channels, three brands

Zaal runs these on the VPS, or runs them with the lane reading along. The lane does not ssh. Lines marked CHECK print something to read before going on.

```bash
# 1. Room on the box. CHECK: about 3 GB RAM available and 15 GB disk free.
free -h && df -h / && docker --version && docker compose version
ss -ltnp | grep -E ':(4007|7233|8080)\b' || echo "ports free"   # CHECK: prints "ports free"

# 2. Fetch the canonical compose repo.
sudo mkdir -p /opt/postiz && sudo chown "$USER" /opt/postiz && cd /opt/postiz
git clone https://github.com/gitroomhq/postiz-docker-compose.git . && git log -1 --format='%h %cd'

# 3. Secrets, generated on the box and never typed anywhere else.
umask 077
printf 'JWT=%s\nPG=%s\n' "$(openssl rand -hex 48)" "$(openssl rand -hex 24)" > /opt/postiz/.secrets
```

4. Edit `docker-compose.yaml` (one editor session, these lines only):

| Find | Change to |
|---|---|
| `image: ghcr.io/gitroomhq/postiz-app:latest` | `image: ghcr.io/gitroomhq/postiz-app:v2.25.1` (or the newest tag on the releases page that day) |
| `- "4007:5000"` | `- "127.0.0.1:4007:5000"` |
| `MAIN_URL`, `FRONTEND_URL` | `'https://<hostname>'` |
| `NEXT_PUBLIC_BACKEND_URL` | `'https://<hostname>/api'` |
| `JWT_SECRET` | the JWT value from `.secrets` |
| `postiz-password` (3 places: `DATABASE_URL`, and `POSTGRES_PASSWORD` under `postiz-postgres`) | the PG value from `.secrets` |
| `DISABLE_REGISTRATION: 'false'` | leave as is for now; step 7 changes it |
| every provider key | leave empty until that platform's step |

Do not add `NOT_SECURED`, `STRIP_LINKS_FROM_X_POSTS` or any Stripe key. Do not commit this file anywhere: it now holds secrets. If port 8080 is taken on the box, delete the `temporal-ui` service.

```bash
# 5. Start. First pull is several GB; first boot takes a few minutes.
cd /opt/postiz && docker compose up -d
docker compose ps        # CHECK: postiz, postiz-postgres, postiz-redis, temporal all "healthy"
curl -sI http://127.0.0.1:4007 | head -1     # CHECK: an HTTP status below 500
docker stats --no-stream # CHECK: note RAM and CPU per container; tell the lane the numbers
```

6. Hostname through the existing tunnel. In the Cloudflare dashboard (Zero Trust, Networks, Tunnels, the VPS tunnel, Public Hostname, Add): hostname as chosen, service `http://localhost:4007`. If the tunnel is configured by file on the box instead, add the same hostname and service as an ingress rule above the catch-all and restart cloudflared. Then add an access rule in front of the hostname (Zero Trust, Access, Applications, self-hosted, the hostname, allow only the named emails, one-time code by email). This is the gate from decision 5. Cloudflare's own limits and prices for Access were not fetched for this doc; check the plan page before relying on "free".

7. First user, then lock the door.

```bash
# In a browser, through the gate: https://<hostname>  -> register Zaal's account. This is the Super Admin.
# Then on the box:
cd /opt/postiz && sed -i "s/DISABLE_REGISTRATION: 'false'/DISABLE_REGISTRATION: 'true'/" docker-compose.yaml
docker compose up -d postiz
# CHECK in a private window: https://<hostname>/auth/register sends you to login.
```

8. Organisations. Try to create the second and third organisation (The ZAO, ZAO Festivals) from the first account. **This is the untested step**: the docs say a user can belong to several organisations but do not say how a second one is created with sign-up disabled. If it cannot be done, report it; the fallback is one organisation with three "customers" and IMan's access handled by agreement, not by the tool.

9. Easy channels, one at a time, each proven with one real post before the next: Telegram (new bot for this instance, not the token hosted Postiz uses), Discord, Bluesky, then Farcaster if Phase 0 item 4 is done, then X if Zaal wants the meter. After each key is added to the compose file: `docker compose up -d postiz`.

10. Backups, before the first real post.

```bash
sudo mkdir -p /var/backups/postiz && sudo chown "$USER" /var/backups/postiz
cat > /opt/postiz/backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
d=/var/backups/postiz; t=$(date +%F-%H%M)
docker exec postiz-postgres pg_dump -U postiz-user postiz-db-local | gzip > "$d/postiz-db-$t.sql.gz"
docker exec temporal-postgresql pg_dumpall -U temporal | gzip > "$d/temporal-db-$t.sql.gz"
docker run --rm -v postiz_postiz-uploads:/u:ro -v "$d":/b alpine tar czf "/b/uploads-$t.tgz" -C /u .
find "$d" -type f -mtime +14 -delete
ls -lh "$d" | tail -4
EOF
chmod +x /opt/postiz/backup.sh && /opt/postiz/backup.sh     # CHECK: three files, none 0 bytes
docker volume ls | grep uploads                              # CHECK: the volume name matches the one in backup.sh
( crontab -l 2>/dev/null; echo '17 4 * * * /opt/postiz/backup.sh >> /var/log/postiz-backup.log 2>&1' ) | crontab -
```

The docs have no backup page; what to back up is inferred from the compose file. The dumps sit on the same box, so copy them off it weekly (the edited compose file and `.secrets` too, to a password manager, never a repo). A restore has not been rehearsed until someone restores one.

11. Updates. Watch `gh release list --repo gitroomhq/postiz-app --limit 3` weekly. To update: run `backup.sh`, change the pinned tag, `docker compose pull postiz && docker compose up -d postiz`, read `docker compose logs --tail 50 postiz`, send one test post. The image pushes its database schema on every start (`prisma db push`), so going back a version is not safe without the dump.

Phase 1 is done when: three brands each have at least one channel that has published a real post from the instance, a backup file exists off the box, and the gate refuses an email that is not on the list.

### Phase 2: the reviews, one platform at a time

Order by value over effort. Hosted keeps each channel until the row's "done when" is true.

| Order | Platform | First action | Done when | If it fails |
|---|---|---|---|---|
| 1 | YouTube | Google Cloud project, Testing status, one test upload per brand channel | A test upload is public, and the 7-day reconnect is either accepted or OAuth verification has passed | Stays on hosted |
| 2 | LinkedIn | New LinkedIn app tied to The ZAO company Page; apply for Community Management API Development tier with an @thezao.com address | A Page post and a personal post publish from the instance | Stays on hosted. A patched personal-only provider is possible but makes us a fork (decision 6) |
| 3 | Facebook and Instagram | Meta business portfolio and Business Verification first; that is the long pole | A post from the instance is visible in a logged-out browser | Stays on Meta Business Suite or whatever Zaal settles on for those two |
| 4 | TikTok | None. Revisit only if TikTok changes the "team manages" rule | - | Stays on hosted |

### Phase 3: more brands

WaveWarZ, COC Concertz, ZABAL: one organisation each, easy channels first, same rule. WaveWarZ's X account already posts through hosted Postiz for IMan's desk; it moves last.

## Brand-by-channel matrix

Sources: [doc 2135](../2135-zaal-media-channels-inventory/) (2026-07-29), the zao-media repo's `docs/media-universe.md` (2026-09-29 sweep), IMan's Postiz research on ZAODEVZ/iman-desk (2026-10-10), and Zaal's Postiz screen as relayed on 2026-10-13. "?" means no source says. Nothing here was re-checked against the live platforms for this doc.

| Channel | Zaal / BetterCallZaal | The ZAO | ZAO Festivals | Tier |
|---|---|---|---|---|
| X | @bettercallzaal (Firefly today) | @thezaodao | @ZAOFestivals (hosted Postiz since 30 Sep) | Easy, metered |
| Farcaster | @zaal (Firefly today) | @thezao, /zao channel | ? | Easy |
| Bluesky | Zaal says he posts there through Firefly; handle not recorded | not claimed as of 29 Sep | not claimed | Easy |
| Telegram | "bettercallzaal" (hosted Postiz, 13 Oct) | ZAO groups exist; which one takes announcements is undecided | ? | Easy |
| Discord | connected in hosted Postiz, 13 Oct; which server not recorded | The ZAO Discord (discord.thezao.com) | same server | Easy |
| Threads | ? | ? | ? | Easy for testers |
| LinkedIn | Zaal Panthaki, personal (hosted Postiz, 13 Oct) | company Page: not confirmed to exist | ZAO Festivals page | Review |
| YouTube | @bettercallzaal | @thezaodao | @zaofestivals | Review, or weekly reconnect |
| TikTok | one account connected in hosted Postiz, 13 Oct; handle not recorded | ? | ? | Stays hosted |
| Instagram | @BetterCallZaal | ? | @zaofestivals | Review |
| Facebook | personal profile (no API posting to profiles) | ? | ZAO Festivals Page; page-admin step open (iman-desk 13) | Review |
| Lens | Zaal says he posts there through Firefly | not claimed as of 29 Sep | - | No provider |

**What Zaal must create, whatever else is decided:**

- A new Telegram bot for the instance.
- A Discord developer application.
- A Neynar app and an empty Farcaster account for it (if Farcaster moves in).
- An X developer app with a card and a spending limit (if X moves in).
- For Phase 2: a Google Cloud project; a LinkedIn app, and a ZAO company Page if there is none; a Meta business portfolio with verification.
- Accounts that do not exist yet and are his call: Bluesky and Threads handles for The ZAO and ZAO Festivals.

Not in this matrix: WaveWarZ, COC Concertz, ZABAL. Their accounts are listed in doc 2135 and `docs/media-universe.md` and are a Phase 3 job.

## What is not known

- Whether a second organisation can be created on a locked instance (Phase 1 step 8 tests it).
- Whether a new YouTube API project's uploads are public (Google's pages disagree; Phase 2 row 1 tests it).
- Whether `posts.service.ts` strips X links regardless of the env var (one test post).
- Whether Postiz has two-factor login. No code or docs hit was found; that is not proof it is absent. The access gate covers it either way.
- Whether Instagram posts from a Development-mode Meta app are publicly visible. Only the general Meta rule was found.
- How long LinkedIn, Google, TikTok and Meta business reviews take. None of them publish a number, apart from Meta's "within a week" for App Review itself.
- No Reddit source was read: every route to Reddit was blocked on 2026-10-13. Community evidence here is GitHub issues, Hacker News and two blogs.
- The VPS numbers are six days old and were not re-measured.
- Nothing in this doc has been run.

## Also See

- [Doc 2244](../2244-posting-platform-decision/) - the posting platform decision, re-validated 2026-10-07: hosted Postiz state, prices, the X link stripping issue, and the earlier recommendation to stay hosted for a month.
- [Doc 1089](../../infrastructure/1089-postiz-social-api-clip-engine/) - Postiz API, MCP and the clip engine; its "use SaaS, do not self-host" call is narrowed by this doc to the review-gated platforms.
- [Doc 2135](../2135-zaal-media-channels-inventory/) - the channel inventory behind the matrix.
- [Doc 897](../../community/897-zao-social-posting-playbook/) - the posting playbook; the rule that X links go in the first reply.
- Vault: `notes/postiz-setup-checklist-2026-10-13.md` (the posting stack as of 13 Oct), `handoffs/zaal-social-media.md` (the lane brief), ZAODEVZ/iman-desk issue 72 (IMan's Postiz desk item).
- Code: `src/lib/autocliper/postiz-api.ts` returns a `stub-` id as if a post were scheduled when `POSTIZ_API_KEY` is unset (doc 2244). When the instance is live, its base URL and key go here, and that stub should fail loudly instead.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rule on decision 2 with the $49 hosted Pro figure in view; done when the answer is in the vault decisions file | @Zaal | Decision | 2026-10-15 |
| Phase 0: pick the hostname, name the updater, decide who has logins; done when the three answers are in the vault decisions file | @Zaal | Decision | 2026-10-16 |
| Phase 1 steps 1 to 7: instance up behind the gate on the VPS; done when `https://<hostname>` asks for the email code and then shows the Postiz login | @Zaal, with the Zaal social media lane reading along | Deploy | 2026-10-20 |
| Phase 1 step 8: test creating a second organisation; done when the result is written into this doc's "not known" list | @Zaal | Test | 2026-10-20 |
| Phase 1 steps 9 to 10: Telegram, Discord and Bluesky each publish one real post per brand, and one backup file is copied off the box | @Zaal | Deploy | 2026-10-24 |
| Phase 2 row 1: YouTube test upload from a new Google Cloud project; done when the upload's visibility is recorded here | @Zaal | Test | 2026-10-31 |
| Decide whether to start Meta Business Verification; done when the answer is in the vault decisions file | @Zaal | Decision | 2026-10-31 |
| Make `src/lib/autocliper/postiz-api.ts` fail when no key is set instead of returning a `stub-` id; done when a PR is merged | @Zaal | PR | 2026-11-07 |
| Re-validate this doc: release list, advisories, X prices; done when `last-validated` is updated | Zaal social media lane | Doc | 2026-11-12 |

## Sources

Marks are as reported by the sub-agent that fetched each source on 2026-10-13, except the compose file, which the lane read itself. PARTIAL and FAILED sources were escalated where a second route existed (raw `.md` docs pages instead of the JS site, `gh api` on the docs repo, a browser user agent for Meta pages, Exa for Discord). Where none existed, the claim is in "What is not known".

Liveness, checked by the lane on 2026-10-13 with curl: 47 of the 56 real URLs below returned 200. The seven developers.facebook.com pages return 400 to a bare curl and 200 with browser headers (two re-probed that way; the app-modes page showed the quoted "can only be seen by role users" line). One github.com blob URL returned 429 (rate limit) and was read through `gh api` instead.

Postiz, from GitHub and its docs:

- [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) - `gh api`: 37,137 stars, last push 2026-10-13, default branch `main`. `[FULL]`
- [LICENSE](https://github.com/gitroomhq/postiz-app/blob/main/LICENSE) - `gh api .../contents/LICENSE`. `[PARTIAL - header and sections 13 and 14 read; sections 0 to 12 not read]`
- [Releases](https://github.com/gitroomhq/postiz-app/releases) - `gh release list` and `gh release view` for 8 tags. `[PARTIAL - bodies capped at 60 lines]`
- [Security advisories](https://github.com/gitroomhq/postiz-app/security/advisories) - `gh api .../security-advisories --paginate`, 19 returned. `[PARTIAL - summary fields; one advisory body read in part]`
- [gitroomhq/postiz-docker-compose docker-compose.yaml](https://github.com/gitroomhq/postiz-docker-compose/blob/main/docker-compose.yaml) - `gh api`, read by the lane, commit dd4969e5. `[FULL]`
- [.env.example](https://github.com/gitroomhq/postiz-app/blob/main/.env.example) - `gh api`. `[FULL]`
- Provider code: `x.provider.ts`, `facebook.provider.ts`, `instagram.provider.ts`, `instagram.standalone.provider.ts`, `threads.provider.ts`, `farcaster.provider.ts`, `youtube.provider.ts`, and `auth.controller.ts` under [the repo](https://github.com/gitroomhq/postiz-app/tree/main/libraries/nestjs-libraries/src/integrations/social) - `gh api`, grepped for scopes and env reads. `[PARTIAL - not read end to end]`
- [System requirements](https://docs.postiz.com/self-host/installation/system-requirements) - WebFetch and the docs repo. `[FULL]`
- [Configuration reference](https://docs.postiz.com/self-host/configuration/reference) - docs repo mdx via `gh api`. `[FULL]`
- [Provider docs](https://docs.postiz.com/self-host/providers/overview): x-twitter, linkedin, linkedin-page, youtube, tiktok, facebook, instagram, threads, telegram, discord, farcaster, bluesky, mastodon - curl of the `.md` pages. `[FULL]`
- [Team settings](https://docs.postiz.com/general/settings/team), [customers](https://docs.postiz.com/general/channels/customers), [concepts](https://docs.postiz.com/general/concepts), [MCP setup](https://docs.postiz.com/mcp/setup) - docs repo. `[FULL]`
- Issues [1939](https://github.com/gitroomhq/postiz-app/issues/1939) (X link stripping) `[FULL]`; [1570](https://github.com/gitroomhq/postiz-app/issues/1570), [2026](https://github.com/gitroomhq/postiz-app/issues/2026), [1143](https://github.com/gitroomhq/postiz-app/issues/1143), [950](https://github.com/gitroomhq/postiz-app/issues/950), [2081](https://github.com/gitroomhq/postiz-app/issues/2081) `[PARTIAL - body and first comments]`; [1580](https://github.com/gitroomhq/postiz-app/issues/1580), [1582](https://github.com/gitroomhq/postiz-app/issues/1582), [1563](https://github.com/gitroomhq/postiz-app/issues/1563), [2168](https://github.com/gitroomhq/postiz-app/issues/2168), [2231](https://github.com/gitroomhq/postiz-app/issues/2231), [1122](https://github.com/gitroomhq/postiz-app/issues/1122), [1578](https://github.com/gitroomhq/postiz-app/issues/1578), [621](https://github.com/gitroomhq/postiz-app/issues/621), [1024](https://github.com/gitroomhq/postiz-app/issues/1024) `[FULL or PARTIAL as read by the sub-agents]`.

Platforms' own pages:

- [X API pricing](https://docs.x.com/x-api/getting-started/pricing) and [changelog](https://docs.x.com/changelog) - curl of the `.md` pages. `[FULL]` pricing, `[PARTIAL - two entries]` changelog.
- [X rate limits](https://docs.x.com/x-api/fundamentals/rate-limits). `[PARTIAL - Posts and Media rows]`
- X's pricing announcement on devcommunity.x.com. `[FAILED - 403 on WebFetch, not available on Exa]`. X's stated reason for the link price was not read.
- [LinkedIn Community Management overview](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview), [increasing access](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access), [programmatic refresh tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens). `[FULL]`
- [YouTube quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits) `[FULL]`; [revision history](https://developers.google.com/youtube/v3/revision_history) and [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) `[PARTIAL - the cited lines]`; [Manage App Audience](https://support.google.com/cloud/answer/15549945) `[FULL for the publishing-status sections]`; [Videos locked as private](https://support.google.com/youtube/answer/7300965) `[PARTIAL]`.
- [TikTok content sharing guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines), [app review guidelines](https://developers.tiktok.com/doc/app-review-guidelines), [sandbox](https://developers.tiktok.com/doc/add-a-sandbox). `[FULL]`
- [Meta app modes](https://developers.facebook.com/docs/development/build-and-test/app-modes), [app roles](https://developers.facebook.com/docs/development/build-and-test/app-roles), [access levels](https://developers.facebook.com/docs/graph-api/overview/access-levels), [app review](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review), [business verification](https://developers.facebook.com/docs/development/release/business-verification), [Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing), [Threads get started](https://developers.facebook.com/docs/threads/get-started) - curl with a browser user agent. `[FULL]`
- Meta's data-deletion callback page. `[FAILED - "Page Not Found"]`. Whether App Review requires a data deletion URL was not confirmed.
- [Neynar rate limits and plans](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis). `[FULL]`. Neynar's pricing page itself: `[FAILED - JS shell]`; credit cost per cast was not read.
- Discord app verification and privileged intents (support-dev.discord.com) - Exa fetch after a Cloudflare challenge on WebFetch. `[FULL]`

Community:

- Hacker News, via the Algolia API: [Show HN, 2024-08-30](https://news.ycombinator.com/item?id=41402138) and [a 2025-07-15 comment on the developer-app burden](https://news.ycombinator.com/item?id=44571304). `[FULL]`
- [vdaluz.com, "Deploying Postiz: Temporal race condition"](https://vdaluz.com/blog/deploying-postiz-temporal-race-condition), 2026-02-23. `[FULL - as summarised by WebFetch]`
- [dev.to, self-hosting Postiz with Tailscale](https://dev.to/aryaniyaps/how-i-self-hosted-postiz-with-tailscale-and-the-env-vars-the-docs-dont-tell-you-about-4i8g). `[PARTIAL - WebFetch summary; two of its claims conflict with the code and are not used]`
- Reddit r/selfhosted. `[FAILED - search JSON blocked, zao-fetch-reddit.sh has no credentials, old.reddit.com unfetchable, two web searches returned no Reddit URLs]`

ZAO's own:

- [Doc 2244](../2244-posting-platform-decision/), read from origin/main on 2026-10-13: hosted prices and the VPS measurement of 2026-10-07. `[FULL for the re-validated section]`
- `docs/media-universe.md` in bettercallzaal/zao-media and IMan's `drafts/2026-10-10-postiz-research.md` in ZAODEVZ/iman-desk. `[FULL]`
