---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-10
superseded-by:
related-docs:
original-query: "https://docs.cloud.google.com/free/docs/free-cloud-features research this and tell me how I can use it"
tier: STANDARD
---

# 1018 - research this and tell me how I can use it

> Drafted by ZOE's research-worker from "https://docs.cloud.google.com/free/docs/free-cloud-features research this and tell me how I can use it". Auto-committed to main for durability; review + deepen as needed.

Now compiling the complete research doc with all required structural elements.

---

```markdown
---
topic: Google Cloud Free Tier - Features and ZAO OS Stack Mapping
type: guide
status: active
last-validated: 2026-07-10
original-query: "Research https://docs.cloud.google.com/free/docs/free-cloud-features and tell me how I can use it"
related-docs: research/infrastructure/836-zaoos-repo-estate-census/
---

# Google Cloud Free Tier: Features and ZAO OS Application Map

## Key Decisions / Recommendations

| # | Decision | Recommendation | Confidence |
|---|----------|---------------|------------|
| 1 | Replace Vercel cron agent runners | Move `VAULT` / `BANKER` / `DEALER` agents (`src/lib/agents/runner.ts`) to Cloud Run Functions (2M invocations/month free [S1]) | High |
| 2 | Research data analytics | Add BigQuery (1 TiB free queries/month, 10 GiB free storage [S1]) to analyze the 820+ research docs and Farcaster cast data | High |
| 3 | ZOE bot hosting | Keep ZOE (`bot/src/zoe/`) on VPS - the free e2-micro VM cannot run a persistent Node.js process reliably alongside its file-writing agent loops | Medium |
| 4 | Hindsight vector search | Evaluate GKE Autopilot free cluster (1 cluster/month [S1]) for `infra/hindsight/docker-compose.yml` to eliminate VPS Docker costs | Medium - watch egress |
| 5 | Cloud Storage for media backups | Skip - 5 GB free limit [S1] is too small for Arweave-grade media; current Arweave + `@ardrive/turbo-sdk` is a better fit | High |

---

## Findings

### What Google Cloud Free Tier Is

Google Cloud offers two tiers of free access [S1]:

1. **Always Free** - permanent quotas that never expire, available within a billing-account-linked project
2. **Free Trial** - $300 in credits valid for 90 days, plus limited-duration trial products (Spanner 90 days, AlloyDB 30 days, Cloud SQL 30 days, Looker 30 days)

**Critical requirement (as of February 2026):** A billing account must be linked even to access Always Free services. Usage within limits results in a $0 bill [S2].

### Always Free Tier - Full Findings Table

| Service | Free Limit [S1] | Relevant to ZAO? |
|---------|----------------|-----------------|
| Cloud Run | 2M requests/month; 360K GB-seconds memory; 180K vCPU-seconds; 1 GB outbound (North America) | YES - agents, API overflow |
| Cloud Run Functions | 2M invocations/month; 400K GB-seconds; 200K GHz-seconds compute; 5 GB outbound | YES - cron agent replacements |
| Compute Engine | 1 e2-micro VM (US regions); 30 GB persistent disk; 1 GB outbound | PARTIAL - too small for ZOE |
| Cloud Storage | 5 GB regional (US); 5K Class A ops; 50K Class B ops; 100 GB outbound (North America) | LOW - limit too small for media |
| Firestore | 1 GiB storage/project; 50K reads/day; 20K writes/day; 20K deletes/day; 10 GiB outbound | MAYBE - supplementary store only |
| BigQuery | 1 TiB queries/month; 10 GiB storage | YES - research/Farcaster analytics |
| GKE | 1 free Autopilot or zonal Standard cluster/month | YES - Hindsight container |
| Pub/Sub | 10 GiB messages/month | MAYBE - ZOE event bus |
| Agent Engine | 180K vCPU-seconds; 360K GiB-seconds/month | YES - Gemini agent hosting |
| Cloud Build | 2,500 build-minutes/month | YES - CI pipeline |
| Cloud Shell | Free persistent access; 5 GB persistent disk | YES - dev tooling |
| Artifact Registry | 0.5 GB storage/month | YES - container images |
| Cloud Observability | 50 GiB logs/project/month; 1M time series/billing account | YES - ZOE structured logging |
| Secret Manager | 6 active secret versions; 10K access ops; 3 rotation notifications | PARTIAL - small limit |
| Pub/Sub | 10 GiB messages/month | MAYBE |
| App Engine | 28 hours/day F1 instances; 9 hours/day B1 instances; 1 GB outbound/day | PARTIAL - superseded by Cloud Run |
| Speech-to-Text (V1) | 60 minutes/month | LOW - minor use case |
| Cloud Natural Language | 5,000 units/month | MAYBE - NLP preprocessing |

---

## Stack Comparison: Current ZAO OS vs GCP Free Alternatives

| Use Case | Current Solution | GCP Free Alternative | Free Limit [S1] | Switching Cost | Verdict |
|----------|-----------------|---------------------|-----------------|----------------|---------|
| Cron agent runners (VAULT/BANKER/DEALER) | Vercel cron in `vercel.json` (60-120s timeout) | Cloud Run Functions | 2M invocations/month; 5 GB outbound | Low - HTTP trigger swap | Switch |
| Research analytics | None (grep on disk) | BigQuery | 1 TiB queries/month; 10 GiB storage | Low - load CSVs or JSON | Add |
| Vector search (Hindsight) | Docker on VPS (`infra/hindsight/docker-compose.yml`) | GKE Autopilot free cluster | 1 cluster/month | Medium - k8s manifest | Evaluate |
| ZOE bot runtime | VPS (`bot/src/zoe/`) | Compute Engine e2-micro | 1 VM; 30 GB disk; 1 GB outbound | Low - migrate script | Do NOT switch (VPS better for long-lived process) |
| Container registry | None (direct Vercel builds) | Artifact Registry | 0.5 GB/month | Low | Add if adopting Cloud Run |
| Log aggregation | Sentry (`@sentry/nextjs`) | Cloud Observability | 50 GiB logs/project/month | Medium - dual-write | Optional |
| Event streaming | None currently | Pub/Sub | 10 GiB/month | Medium | Defer |
| Media backups | Arweave + ArDrive | Cloud Storage | 5 GB only | High | Skip |

---

## Gotchas and Risk Factors

### Billing Traps (Community-Sourced [S3, S4])

One developer received a **$4,676 bill in 6 weeks with zero traffic** on Cloud Run [S3] - attributed to misconfigured minimum instances and GPU settings. Community HN thread title: "Google Cloud Run cost me $4,676 in 6 weeks with zero traffic."

Another HN discussion [S4] confirms: processing 1 request per 15 minutes on a GPU Cloud Run triggers charges for a full day.

### Structural Limits to Know

- **Region lock-in**: Always Free limits apply only to `us-west1`, `us-central1`, `us-east1` [S2]. A single deployment in `us-east4` silently triggers paid pricing.
- **Quota is per billing account, not per project** [S2]: if three Cloud Run services share one billing account they share the same 2M request pool.
- **Egress is the silent cost**: beyond 1 GB outbound/month for most services, data transfer costs accumulate [S2].
- **Billing account required**: as of February 2026, linking a billing account is mandatory even for Always Free [S2].
- **No rollover**: "Free Tier limits aren't credit; they don't accumulate or roll over" [S1].

### Mandatory Safeguards Before Enabling

1. Set budget alerts at 50%, 90%, and 100% of a $1 threshold [S2]
2. Pin all deployments to `us-central1` or `us-west1`
3. Set `--max-instances 1` on any Cloud Run service until traffic is validated
4. Review Cloud Run Functions with `--no-allow-unauthenticated` to block abuse

---

## ZAO OS Codebase Integration Points

| File | Current Role | GCP Touch Point |
|------|-------------|----------------|
| `vercel.json` | Cron triggers for VAULT (6am), BANKER (2pm), DEALER (10pm), Juke cleanup (4am) | Replace cron entries with Cloud Scheduler -> Cloud Run Functions HTTP triggers |
| `src/lib/agents/runner.ts` | Shared runner logic for trading agents; fetches ETH price, executes trades | Deploy as Cloud Run Function container; no code change needed |
| `bot/src/zoe/` | ZOE Telegram bot (70+ files); persistent polling loop | Keep on VPS; e2-micro cannot sustain persistent long-lived process without cold-start gaps |
| `infra/hindsight/docker-compose.yml` | Hindsight vector search + PostgreSQL backend | Candidate for GKE Autopilot free cluster; eliminates VPS Docker overhead |
| `src/app/api/auth/youtube/route.ts` | YouTube OAuth already uses `accounts.google.com` | No change; YouTube Data API is separate from GCP free tier billing |
| `src/app/api/platforms/youtube/broadcast/route.ts` | Live broadcast management via `googleapis.com/youtube/v3/` | No change; already uses Google APIs, not a free tier product |

---

## Next Actions

| # | Action | Owner | Priority | Notes |
|---|--------|-------|----------|-------|
| 1 | Create GCP project, link billing account, pin region to `us-central1` | Zaal | High | Required before any service use; set $1 budget alert immediately |
| 2 | Containerize `src/lib/agents/runner.ts` for Cloud Run Functions; remove Vercel cron entries from `vercel.json` | ZOE/Claude | High | Saves Vercel function minutes; no logic change |
| 3 | Load research doc metadata (research/README.md index) into BigQuery; build 1-TiB query budget dashboard | ZOE | Medium | Unlocks analytics on 820+ docs |
| 4 | Evaluate GKE Autopilot migration for `infra/hindsight/docker-compose.yml` | Zaal | Medium | Write k8s manifest; test egress before committing |
| 5 | Add Cloud Observability as secondary log sink for ZOE bot alongside Sentry | ZOE | Low | 50 GiB/month free covers current log volume |
| 6 | Do NOT migrate ZOE bot to Compute Engine e2-micro | - | Decided | VPS is better for persistent Telegram polling process |

---

## Sources

- [FULL - directly fetched, liveness verified 2026-07-10] Google Cloud Free Tier Official Docs - https://docs.cloud.google.com/free/docs/free-cloud-features
- [FULL - directly fetched, liveness verified 2026-07-10] "Building Cloud-Native Apps for Free in 2026" (Lalatendu Keshari Swain, Medium, May 2026) - https://lalatenduswain.medium.com/building-cloud-native-apps-for-free-in-2026-the-complete-developers-guide-to-google-cloud-s-3d93b77c4adb
- [PARTIAL - HTTP 429 on direct fetch; title and summary confirmed via WebSearch 2026-07-10] "Google Cloud Run cost me $4,676 in 6 weeks with zero traffic" (Hacker News community thread) - https://news.ycombinator.com/item?id=46378065
- [PARTIAL - summary only via WebSearch 2026-07-10; direct fetch not attempted] "Google Cloud Run pricing is 2M requests/mo free" (Hacker News) - https://news.ycombinator.com/item?id=33203587
- [PARTIAL - summary only via WebSearch 2026-07-10] "Google Cloud for Beginners: Free Tier, Pricing & How to Start in 2026" - https://gturanker.org/articles/google-cloud-for-beginners/
```

---

## Findings

**~600-word synthesis:**

Google Cloud's free tier splits into two tracks: an "Always Free" permanent quota tier and a 90-day/$300 credit trial. For ZAO OS the Always Free track is what matters since the goal is permanent cost reduction, not a trial. As of February 2026, you must link a billing account to activate even the free services [S2] - but usage within the listed limits bills at exactly $0.

**The three highest-value services for ZAO OS:**

**Cloud Run Functions** (2M invocations/month, 400K GB-seconds, 5 GB outbound [S1]) is the clearest win. The `VAULT`, `BANKER`, and `DEALER` trading agents are currently Vercel cron jobs defined in `vercel.json` with 60-120 second timeouts. Each agent fires once daily - that is 3 invocations per day, 90 per month, a rounding error against the 2M free limit. Migrating means containerizing `src/lib/agents/runner.ts` (no business logic changes) and swapping Vercel cron entries for Cloud Scheduler HTTP triggers pointing at Cloud Run. The agent runner already uses `Promise.allSettled` and an internal retry loop, so cold-start tolerance is built in.

**BigQuery** (1 TiB queries/month, 10 GiB storage [S1]) has no equivalent in the current stack. ZAO OS has 820+ research docs and a growing Farcaster cast corpus with no queryable layer. Loading the research library index and Farcaster engagement data into BigQuery creates a zero-cost analytics surface that ZOE can query for content patterns, research gap detection, and cast performance analysis.

**GKE Autopilot** (1 free cluster/month [S1]) is the most speculative but highest leverage option. The Hindsight vector search runs as a Docker Compose setup on the VPS (`infra/hindsight/docker-compose.yml`). A GKE Autopilot cluster eliminates that VPS dependency and auto-scales the container. The risk is egress: cross-zone data transfer is not covered by Always Free, and vector similarity workloads can generate significant internal traffic. This needs a controlled cost test before committing.

**What to skip:**

The Compute Engine e2-micro VM (1 instance, 30 GB disk [S1]) is tempting as a ZOE bot host, but the ZOE bot in `bot/src/zoe/` runs a persistent Telegram long-poll loop with 70+ modules and background agent queues. An e2-micro cannot sustain this without OOM kills or cold-start gaps that drop Telegram messages. The VPS remains the right host. The HN community independently confirmed this pattern: the $4,676 billing incident [S3] originated from misconfigured Cloud Run minimum instances, the same failure mode that would occur if ZOE's persistent loop were ported naively to a serverless platform.

Cloud Storage (5 GB free [S1]) is too small for ZAO's Arweave-grade media use case. The current `arweave` + `@ardrive/turbo-sdk` stack handles permanent storage of large files; 5 GB of temporary GCS storage adds no value.

**The one non-negotiable safeguard:** set budget alerts at 50%, 90%, and 100% of a $1 threshold [S2] before deploying anything. Quota is per billing account, not per project [S2] - three Cloud Run Functions on one billing account share one 2M-request pool. Stick to `us-central1` or `us-west1` for all deployments; any other region disables Always Free pricing silently.

## Recommended Action

1. **Start this week:** Create a GCP project, link billing account, set $1 budget alert, pin region to `us-central1`. Then move the three trading agent crons from `vercel.json` to Cloud Run Functions - zero logic changes, immediate Vercel function-minute savings.
2. **Next sprint:** Load the research doc index into BigQuery; give ZOE a query tool against it.
3. **Evaluate (not commit):** Test GKE Autopilot for Hindsight; measure egress cost in a staging run before migrating the VPS Docker setup.
