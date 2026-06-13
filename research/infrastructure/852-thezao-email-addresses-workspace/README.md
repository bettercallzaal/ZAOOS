---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-06-13
superseded-by:
related-docs: 650, 804
original-query: "What can we do with @thezao.com email addresses on Google Workspace - aliases, groups, catch-all routing, send-as, distribution lists - and what is possible without paying beyond the current plan. Practical guide for The ZAO: how to give brands/projects/roles their own @thezao.com addresses (submissions@, volunteer@, hello@, zaofestivals@, etc.) feeding into one mailbox, free."
tier: STANDARD
---

# 852 — @thezao.com Email Addresses: What You Can Do for Free on Workspace

> **Goal:** Give every ZAO brand, project, and role its own `@thezao.com` address - submissions@, volunteer@, hello@, zaofestivals@, etc. - all landing where you already read mail, paying nothing beyond the seat you already have.

## Key Decisions (do this)

| # | Decision | Why | Cost |
|---|----------|-----|------|
| 1 | **Use Google Workspace email aliases** for role/brand addresses on your one mailbox | Up to **30 aliases per user**, all land in the same inbox you already check | $0 extra |
| 2 | **Use "Send mail as"** in Gmail so replies go out FROM the alias | A reply to a submissions@ email should come from submissions@, not your personal address | $0 |
| 3 | **Use Google Groups** for any address that should reach MORE than one person or outlive one person (team@, festivals@) | Groups are free, unlimited, and need **no per-user license** | $0 |
| 4 | **Set a catch-all** (Admin default routing) so any typo / unknown `@thezao.com` still lands in your main mailbox | Nothing gets bounced/lost | $0 |
| 5 | **Do NOT use Cloudflare Email Routing on thezao.com** | It needs the domain's MX records, which Google Workspace already owns - the two cannot coexist on one domain | n/a |
| 6 | If The ZAO gets nonprofit/entity status, **apply to Google for Nonprofits** for free Workspace | Removes the per-seat cost entirely | $0 (if approved) |

Bottom line for the budget question: **aliases + Groups add zero dollars** on top of the seat you already pay for. You can hand out as many `@thezao.com` addresses as you need (30 aliases on your user + unlimited Groups) without paying more.

## Findings

### 1. Aliases - up to 30 per user, free, all plans
A Workspace user can have up to **30 alternate addresses (aliases)** at no extra cost, on any plan. Mail to any alias drops into that user's one inbox. Add them in Admin console -> Directory -> Users -> (your user) -> "Add alternate emails (email alias)."

Use aliases for **role addresses that one person handles**: `submissions@`, `volunteer@`, `hello@`, `zaofestivals@`, `press@`, `bookings@`. All feed your single mailbox; you filter/label by the to: address.

Limit to know: an alias is for **one** user. If an address needs to reach multiple people, use a Group (below), not an alias.

### 2. Send mail as - reply from the alias
Gmail -> Settings -> Accounts -> "Send mail as" lets you send/reply FROM any alias. So a booking inquiry to `bookings@thezao.com` gets answered from `bookings@thezao.com`, keeping the brand consistent and your personal address private. Within Workspace you do not need a separate SMTP/password for an alias on the same account.

### 3. Google Groups - free distribution lists + shared inboxes, no per-seat cost
Google Groups is **included in Workspace at no additional license cost** - a Group is not a billed user. Create as many as you want. Two modes:
- **Distribution list**: mail to `team@thezao.com` fans out to every member. Good for "reach the whole ZAOstock crew."
- **Collaborative Inbox**: members claim/assign incoming threads (a shared support queue). Requires turning on **"Groups for Business"** in Admin console first.

Use Groups for addresses that should **outlive any one person** or **reach several people**: `team@`, `festivals@`, `coc@` (if a partnership address is ever wanted), `support@`.

Alias vs Group rule of thumb:
- One person reads it, want it in your inbox -> **alias**.
- Multiple people, or it should survive a handoff -> **Group**.

### 4. Catch-all - never lose a misdirected email
In Admin console you can set a **default routing rule** so any message to an unrecognized `@thezao.com` address (e.g. `bookings@` you never created, or a typo like `ifno@`) routes to your main mailbox instead of bouncing. Optional but cheap insurance.

### 5. Cloudflare Email Routing - free, but NOT for thezao.com while it's on Workspace
Cloudflare Email Routing gives **unlimited** custom addresses that forward to any inbox, **free on all plans**, with a catch-all. It sounds perfect - but it is **receive/forward only** (no mailbox, no native send) and, critically, it **requires control of the domain's MX records**. Google Workspace already owns thezao.com's MX. **You cannot run both on the same domain.** So Cloudflare is only the free answer for:
- a domain that is NOT on Workspace, or
- a separate/secondary domain you point at Cloudflare on purpose.

For thezao.com today, the Workspace-native tools (aliases + Groups) are the right call.

### 6. Plan + nonprofit note
Workspace Business Starter runs about **$7/user/month** in 2026 (~$84/yr per seat); aliases and Groups do not add to that. If The ZAO formalizes as a nonprofit/entity (see the Colorado A-Corp track, doc 804), it can apply to **Google for Nonprofits**, which grants Workspace free - eliminating the seat cost. Gmail also caps sending at ~2,000 messages/day on Workspace, which matters only if an address is ever used for bulk blasts (use a real ESP for newsletters, not the mailbox).

## How this maps to ZAO brands/roles

| Address | Type | Lands where |
|---------|------|-------------|
| `info@thezao.com` | primary mailbox | your inbox (already set) |
| `submissions@thezao.com` | alias | your inbox |
| `volunteer@thezao.com` | alias | your inbox |
| `zaofestivals@thezao.com` / `festivals@thezao.com` | alias (1 person) or Group (team) | inbox or group members |
| `hello@thezao.com` / `press@` / `bookings@` | alias | your inbox |
| `team@thezao.com` | Group | Zaal + Iman + crew |

All free. The zao-stock site CTAs (doc-pending PR #1) currently point at `info@thezao.com` - once you want cleaner purpose addresses, add `submissions@` + `volunteer@` as aliases and swap the CTAs; both still land in info@.

## Also See

- [Doc 650](../../agents/650-cowork-zaodevz-imanagent/) - cowork/Iman infra context
- [Doc 804](../../business/804-colorado-acorp/) - entity status (unlocks Google for Nonprofits)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `submissions@` + `volunteer@` + `hello@` as aliases on the info@ user | Zaal | Admin console | When ready |
| Turn on "Send mail as" for the aliases you'll reply from | Zaal | Gmail settings | Same session |
| Create a `team@thezao.com` Group for ZAOstock crew (Zaal + Iman) | Zaal | Admin console | Before ZAOstock ramp |
| Set a catch-all default routing rule to info@ | Zaal | Admin console | Optional |
| Swap zao-stock CTAs from info@ to submissions@/volunteer@ once aliases exist | Zaal | PR | After aliases |

## Sources

- [Add or delete an email alias - Google Workspace Help](https://knowledge.workspace.google.com/admin/users/add-or-delete-an-alternate-email-address-email-alias) `[FULL]` - 30 aliases/user, no extra cost
- [What you get with Groups for Business - Google Workspace Admin Help](https://support.google.com/a/answer/10308022) `[FULL]` - Groups included, distribution lists
- [Use a group as a Collaborative Inbox - Google Workspace](https://support.google.com/a/users/answer/167430) `[FULL]` - shared-inbox mode
- [Cloudflare Email Routing addresses + catch-all - Cloudflare docs](https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/) `[FULL]` - unlimited addresses, free, catch-all
- [Cloudflare Email Routing vs Workspace comparison - inventivehq.com](https://inventivehq.com/blog/cloudflare-email-routing-vs-aws-ses-vs-azure-communication-services-vs-google-workspace) `[FULL]` - confirms Email Routing needs MX control, is inbound/forward-only (no mailbox, no sending), free; two providers cannot manage one domain's MX simultaneously
- [Email Routing and Google Workspace - Cloudflare Community](https://community.cloudflare.com/t/email-routing-and-google-workspace/332394) `[FAILED - HTTP 403 to WebFetch; claim corroborated by the inventivehq source above]` - the MX-conflict point
- [Gmail sending limits - Google Workspace Help](https://support.google.com/a/answer/166852) `[FULL]` - ~2,000/day send cap
- [Compare pricing plans - Google Workspace](https://workspace.google.com/pricing) `[FULL]` - Business Starter ~$7/user/mo
