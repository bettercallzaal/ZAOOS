---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-06-27
superseded-by:
related-docs: 913
original-query: "can i build one of these (channelz-style clients) into a custom email server for my domains"
tier: STANDARD
---

# 915 - Email layer for ZAO domains (build a client, not a mail server)

> **Goal:** Decide how to do email on ZAO domains (thezao.com, bettercallzaal.com, wavewarz.com) - so an agent-built client (channelz pattern) can receive, send, and automate mail. Verdict: programmable email layer over managed services. Do NOT self-host SMTP/IMAP.

## Recommendations (decisions first)
| # | Decision | Call |
|---|----------|------|
| 1 | Self-host a raw mail server (Postfix/Dovecot)? | **No.** Deliverability + IP-reputation + security + maintenance make it a 2026 trap. |
| 2 | Receive (incoming mail on your domains) | **Cloudflare Email Routing** - free, catch-all per domain, routes to an Email Worker (webhook) or forwards. |
| 3 | Send (outbound from your domains) | **Resend** - best DX for Next.js/React, TS SDK, handles SPF/DKIM/DMARC. (Cloudflare Email Routing CANNOT send.) |
| 4 | App/agent layer | A Next.js client (the channelz pattern) = inbox UI + ZOE read/draft/send automation. |
| 5 | Already have | ZOE's **AgentMail** (`zoe-zao@agentmail.to`) - a programmable-inbox service; keep for agent inboxes, or fold into the owned stack. |

## The stack
- **Receive:** Cloudflare Email Routing (free). One rule per pattern -> a Worker or a verified forward address. Email Workers run on the Workers CPU/memory limits (Free plan can hit `EXCEEDED_CPU` on heavy handlers; Paid lifts it). **It does not send/reply from your domain** - receive + route only.
- **Send:** Resend - 3,000 emails/mo free, $20/mo for 50k; cleanest API + React Email templates; ideal at ZAO's <100k/mo scale. (SES is ~$0.10/1k = cheapest, but sandbox + IP warmup + manual bounce/suppression handling = hours of setup, only worth it >500k/mo. Postmark = best deliverability, $15/mo, pricier at scale - use only if a missed transactional email = lost money.)
- **App:** Next.js (channelz-style) - server routes proxy Resend (key server-side) + receive the Cloudflare Worker webhook; UI is the inbox + ZOE automation surface.

## Why not Cloudflare alone
Cloudflare Email Routing is receive/forward only - no send. Cloudflare's newer "Email Service" (send, private beta, daily quotas) could later replace Resend, but Resend is GA + best-DX now.

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide: own the stack (Cloudflare+Resend+app) vs lean on AgentMail | @Zaal | Decision | Before build |
| Set Cloudflare Email Routing on one domain (e.g. bettercallzaal.com) -> Worker | @Zaal | Setup | When pursued |
| Resend account + verify a domain (SPF/DKIM) | @Zaal | Setup | When pursued |
| Scaffold the email client (agent build, channelz flow) | @ZOE/agent | Build | On go |

## Also See
- [Doc 913](../../events/913-wide-cause-coins-wavewarz-zao-space/) - same session
- [[project_channelz]] - the client build pattern this reuses

## Sources
- [FULL] [Cloudflare Email Routing limits](https://developers.cloudflare.com/email-routing/limits/) + [Email Workers](https://developers.cloudflare.com/email-routing/email-workers/) - receive/forward only, no send from domain
- [FULL] [Cloudflare Email Service (send, private beta)](https://blog.cloudflare.com/email-service/)
- [FULL] [Resend vs SES vs Postmark 2026](https://www.buildmvpfast.com/blog/resend-vs-ses-vs-postmark-transactional-email-deliverability-saas-2026) - pricing + DX + deliverability
- [PARTIAL] [Email API pricing comparison June 2026](https://www.buildmvpfast.com/api-costs/email)
