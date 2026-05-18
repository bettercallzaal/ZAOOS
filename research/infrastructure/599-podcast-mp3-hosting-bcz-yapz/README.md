---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-05-12
related-docs: 092, 093
tier: STANDARD
---

# 599 - Podcast MP3 Hosting for BCZ YapZ

> **Goal:** Pick the host for ~30 MB MP3 podcast files that the Apple Podcasts and Spotify ingest crawlers will accept. Budget under $20/yr, ~20 eps growing weekly. S3-compatible API preferred (drop-in boto3). Decentralized preferred (matches The ZAO ethos) but compatibility wins.

## Verdict

**USE Cloudflare R2.** Free tier covers BCZ YapZ at current and 10x scale, zero egress fees so Apple/Spotify ingest crawlers cannot cost money, native public bucket with HTTP range request support out of the box. One-line endpoint swap in the existing `scripts/rip-and-upload.py` (boto3).

**2nd choice: Storj DCS.** Decentralized, S3-compatible, byte-range supported - the right ethos match. Deprioritized because the signup verification flow is currently flaky (Zaal blocked at email-verify step 2026-05-12), and the linkshare URL prefix is uglier than R2's `pub-<hash>.r2.dev`. Revisit if Storj signup unblocks and decentralization weighting increases.

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Primary host | Cloudflare R2 | $0/month at current scale, zero egress, no signup blockers, S3 API |
| Fallback | Storj DCS | Decentralized + S3-compatible, matches ZAO ethos when ready |
| Avoid | Backblaze B2 | Egress fees kick in at 3x stored monthly. Apple ingest can blow past this for a popular pod |
| Avoid | Filebase | $5/month minimum even for one file - more than R2 will ever charge BCZ |
| Avoid for now | ArDrive / Turbo | Not S3-compatible, requires script rewrite. Reserve for ZAO music NFTs and permanent artifacts, not weekly podcast eps |

## Comparison

| Option | API | Public URLs | Range Requests | Free Tier Math (20 eps, 30 MB each, ~10k listens/mo) | Apple/Spotify Compat | Decentralized |
|--------|-----|-------------|----------------|-------------------|--------------------|-----------|
| **Cloudflare R2** | S3 | `pub-<hash>.r2.dev/<key>` or custom domain | Native | 600 MB / 10 GB free + 0 egress = $0/mo | Validated by Selfhost Podcasting plugin + microfeed | No |
| **Storj DCS** | S3 (gateway.storjshare.io) | `link.storjshare.io/raw/<grant>/<bucket>/<key>` | Native (HEAD + byte-range per Storj docs) | 600 MB / 25 GB free = $0/mo | Documented in Storj DCS S3 compatibility page | Yes (80-shard erasure coding) |
| Filebase | S3 | `<bucket>.s3.filebase.com/<key>` | Native | $5/mo min (Starter plan) | Works (S3, public buckets) | Yes (Filecoin/Sia backend) |
| Backblaze B2 | S3 | Friendly URLs via Bandwidth Alliance + CDN | Native | 10 GB free + 1 GB/day egress free, then $0.01/GB | Works | No |
| ArDrive / Turbo | Custom SDK (not S3) | `arweave.net/<txid>` | Native | One-time $0.50-1 per upload, $0 ongoing | Works (permanent CDN) | Yes (Arweave) |

## Apple/Spotify Ingest Gotchas

Apple Podcasts Connect and Spotify for Podcasters crawlers stream-read the enclosure URL using HTTP HEAD followed by partial-content GETs (Range requests). Hosts must:

1. Return `200 OK` (or `301`/`302` to a stable URL) on HEAD with `Content-Length` and `Content-Type: audio/mpeg`
2. Support `Range: bytes=` requests with `206 Partial Content`
3. Not require auth, cookies, or User-Agent gating

**Flagged risks:**
- **Cloudflare R2: NO known issues.** The Cloudflare community thread "Apple Podcast is not pulling through my latest episodes" turns out to be about Cloudflare CDN proxy mode in front of a non-R2 podcast host (Buzzsprout style), not R2 itself. R2 origins serve cleanly.
- **Storj DCS: NO known issues for podcast use case.** Storj rate-limits at <100 RPS on certain endpoints, but that's per-account and only matters if you serve a huge audience from one access grant. Plenty of headroom for BCZ at current scale.
- **Filebase: NO known issues**, but $5/mo floor makes it worse than R2 at our volume.
- **ArDrive: works, but the gateway URL (`arweave.net`) is not under Zaal's control.** Apple's RSS validator accepts it, but if Zaal ever wants to swap CDNs, the URLs are immutable. Use only for permanence-required artifacts.

## Migration Path: If Storj Signup Unblocks Later

Switching from R2 to Storj is one env-var change:

```bash
# Was (R2):
export STORJ_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
# Switch to Storj:
export STORJ_ENDPOINT="https://gateway.storjshare.io"
# Update STORJ_PUBLIC_PREFIX, re-run rip:audio --all --force.
```

Frontmatter `audio_url` gets re-patched; commit + Vercel rebuild; Apple/Spotify re-fetch the feed and pick up new URLs. No code changes.

## R2 Setup Steps (Replacement for scripts/PODCAST-SETUP.md)

1. Cloudflare account at https://dash.cloudflare.com (already have one if you use Cloudflare for any DNS - Zaal does).
2. **R2 > Create bucket** named `bcz-yapz-audio`. Region: Auto.
3. **Settings > Public access > Allow Access** (the `pub-<hash>.r2.dev` subdomain).
4. **R2 > Manage API tokens > Create API token**. Permissions: Object Read + Write on `bcz-yapz-audio`. Save Access Key ID, Secret Access Key, **and the S3 endpoint URL** (visible after token creation, format `https://<accountid>.r2.cloudflarestorage.com`).
5. Set env:
   ```bash
   export STORJ_ACCESS_KEY="<r2 access key id>"
   export STORJ_SECRET_KEY="<r2 secret>"
   export STORJ_BUCKET="bcz-yapz-audio"
   export STORJ_PUBLIC_PREFIX="https://pub-<bucket-hash>.r2.dev"
   export STORJ_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
   ```
6. Run rip script as documented. (Env var names can stay as `STORJ_*` since boto3 just sees them as S3 credentials; if naming bothers, rename in a follow-up PR.)

## Also See

- [Doc 092](../092-public-apis-2026-update/) - other ZAO ecosystem public infrastructure
- [Doc 093](../093-missing-infrastructure-gaps/) - prior infrastructure audit

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Switch BCZ YapZ podcast pipeline from Storj to R2 | @Zaal | Code (bcz-yapz repo) | Today |
| Update scripts/PODCAST-SETUP.md in bcz-yapz with R2 steps | @Claude | PR (bcz-yapz) | Today |
| Optionally rename env vars from STORJ_* to AUDIO_HOST_* | @Zaal | PR (bcz-yapz) | Follow-up |
| Revisit Storj when signup is unblocked | @Zaal | Decision review | If R2 ever introduces egress fees |

## Sources

- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) - $0.015/GB-mo, 10 GB free, zero egress
- [Cloudflare R2 Overview](https://developers.cloudflare.com/r2/) - product docs
- [microfeed self-hosted podcast CMS on R2](https://github.com/microfeed/microfeed) - working podcast hosted on R2
- [Selfhost Podcasting WordPress plugin (R2 integration)](https://wordpress.org/plugins/selfhost-podcasting/) - "fully formatted RSS feed that meets the technical specifications of Apple Podcasts and Spotify"
- [Storj S3 Gateway docs](https://storj.dev/dcs/api/s3/s3-compatible-gateway) - byte-range and HEAD support confirmed
- [Storj S3 Compatibility](https://storj.dev/dcs/api/s3/s3-compatibility) - per-operation compatibility matrix
- [Storj forum: rate limit at <100 RPS](https://forum.storj.io/t/rate-limiting-under-100-rps-http-403-errors/19591) - flagged but not blocking for BCZ scale
- [Filebase FAQ on public buckets](https://docs.filebase.com/getting-started/faq) - confirms S3 URL format
- [Filebase pricing context (The New Stack)](https://thenewstack.io/filebases-s3-compatible-api-aims-to-ease-decentralized-storage/) - $5/mo Starter tier floor
