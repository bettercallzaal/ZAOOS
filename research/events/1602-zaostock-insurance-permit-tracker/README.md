# 1602 — ZAOstock 2026: Insurance & Permit Tracker

**Type:** OPERATIONS-CHECKLIST  
**Topic:** Events  
**Status:** ACTIVE — Zaal owns procurement; ZOE tracks deadlines and sends reminders. All items must be resolved by Sep 15 (two weeks before the show). Venue confirmation (Aug 1) unlocks which specific permits apply.

---

## Overview

ZAOstock (Oct 3, Ellsworth ME) requires three categories of preparation beyond the line of show (doc 1597):

1. **Event insurance** — general liability for the venue + riders
2. **Permits** — Maine state + local municipality requirements
3. **Charity compliance** — documentation for the on-chain charity battle SOL payout

None of these are gated on ZAO's blockchain stack. They are standard IRL event requirements that must be procured through conventional channels. ZOE can draft documents and track deadlines but **Zaal must sign and submit all insurance applications and permit forms** — DECISION NEEDED for each approval below.

---

## Track 1: Event Insurance

### What to Get

| Policy Type | Why Needed | Minimum Coverage |
|---|---|---|
| General Liability | Bodily injury / property damage during the event | $1M per occurrence / $2M aggregate |
| Event Cancellation | Protects deposits if ZAOstock must cancel | $5,000–$15,000 limit (match total deposits) |
| Vendor Liability Rider | Required if caterers/vendors set up at venue | $1M — most venues require |

**Liquor liability:** Only needed if ZAO is the seller/server of alcohol. If the venue handles bar operations independently, their policy covers it — confirm with venue manager Aug 1.

### Procurement Options

| Provider | Notes | Typical Quote Turnaround |
|---|---|---|
| K&K Insurance (kandkinsurance.com) | Specializes in event/entertainment policies; online quote in minutes | Same day |
| Markel Event Insurance | One-day event policies starting ~$125; certs issued instantly | Same day |
| Front Row Insurance | Music-event specialists; used by indie shows and DIY venues | 1-2 business days |

**Recommended:** K&K or Markel for speed; Front Row if the venue requires music-specific coverage language.

### Insurance Procurement Timeline

| Date | Action | Owner |
|---|---|---|
| Aug 1 | Venue confirmed → check venue insurance requirements (ask for their COI and minimum policy requirements) | Zaal |
| Aug 8 | ⚠️ DECISION NEEDED: Select insurer, get quote | Zaal |
| Aug 15 | Purchase general liability + cancellation policy | Zaal |
| Aug 22 | Send Certificate of Insurance (COI) to venue manager | Zaal / ZOE emails PDF |
| Sep 15 | Confirm venue has accepted COI → all clear | Zaal |

---

## Track 2: Permits (Maine)

### Special Amusement Permit (Maine Title 28-A §1054)

Required for any public event with live entertainment **and** alcohol on the same premises in Maine, regardless of whether ZAO or the venue is selling alcohol.

| Field | Value |
|---|---|
| Issuing authority | Local municipality (Ellsworth City Clerk) |
| Application form | City of Ellsworth permit office — call to confirm current form |
| Processing time | ~30 days |
| Fee | Typically $25–$100 |
| Required with application | Proof of venue lease, event description, security plan |

**Target: Submit by Sep 1 (30-day processing for Oct 3 event)**

> If the venue already holds a Class A or Class B liquor license covering special amusement, they may have the permit — confirm with venue Aug 1 before applying.

### Noise/Sound Permit

| Field | Value |
|---|---|
| Applicable if | Outdoor PA or sound levels above municipal ordinance threshold |
| Issuing authority | City of Ellsworth — code enforcement |
| Timing | Apply 2 weeks before event (submit by Sep 19) |
| Required info | Anticipated decibel levels, PA equipment specs, end time |

**ZAO action:** Ask the venue whether they handle sound permits for events — most licensed venues absorb this. If ZAO is responsible: call Ellsworth code enforcement after venue confirmation (Aug 1).

### Maine Charitable Solicitation Registration

Maine requires organizations soliciting charitable donations at public events to be registered with the Maine Department of Professional and Financial Regulation (DPFR), **unless exempt** (religious organizations, organizations raising < $10,000/year with no paid fundraiser).

ZAO's charity battle setup:
- The SOL payout goes **directly on-chain from the WaveWarZ contract to the charity's wallet** — this is not a traditional solicitation
- No cash changes hands at the event for the charity
- The charity is **pre-selected via ZOR holder vote** (doc 1575), not solicited from attendees

**Risk assessment:** Low. The on-chain payout mechanism is not a door-to-door or on-site cash solicitation. However, if the charity is announced from stage with verbal encouragement to "participate in the battle," Maine may consider this solicitation.

| Action | Timeline |
|---|---|
| Confirm selected charity's registration status in Maine | Jul 25 (day charity vote result is announced) |
| If charity is not Maine-registered: route SOL payout through a Maine-registered fiscal sponsor (e.g., Fractured Atlas, once FA application submitted Jul 22) | Aug 1 |
| Document on-chain payout as charitable donation: save tx hash, amount, charity wallet address | Oct 3 (event day) |

---

## Track 3: Charity Battle Documentation

ZAOstock's charity battle produces an on-chain SOL payout. This documentation package protects ZAO if the charity, a donor, or a regulator requests proof.

### Documents to Prepare

| Document | Contents | Prepared By |
|---|---|---|
| Charity Payout Confirmation | TX hash, SOL amount, charity name + wallet address, event date | ZOE (auto-generates Oct 3) |
| Battle Record | WaveWarZ battle ID, performers, vote result, payout trigger time | ZOE (from wavewarz.info API) |
| Charity Selection Record | ZOR holder vote result screenshot, Snapshot/Telegram vote totals, Jul 24-25 dates | Zaal (save Jul 25) |
| Event Insurance COI | Covers liability for the event in which the charity battle occurred | Zaal (from insurer) |

**ZOE Oct 3 automation:** After the charity battle payout fires, ZOE posts the TX hash to @wavewarz, Farcaster /wavewarz, and Telegram (per doc 1597 Step 10). The same TX hash and SOL amount become the evidence record — save the ZOE post URL as the citation.

### ZAOOS Citation Block (after Oct 3)

```
ZAOstock 2026 — Oct 3, Ellsworth ME
Charity battle: 100% of SOL wagered routed on-chain to [charity name]
TX hash: [fill Oct 3]
SOL amount: [fill Oct 3]
ZOR holder governance vote selected charity: Jul 24-25, 2026
```

---

## Master Tracker

| Item | Category | Deadline | Owner | Status |
|---|---|---|---|---|
| Confirm venue insurance requirements | Insurance | Aug 1 | Zaal | 🔲 |
| Select insurer + get quote | Insurance | Aug 8 | Zaal | 🔲 |
| Purchase GL + cancellation policy | Insurance | Aug 15 | Zaal | 🔲 |
| Send COI to venue | Insurance | Aug 22 | Zaal | 🔲 |
| Confirm venue has accepted COI | Insurance | Sep 15 | Zaal | 🔲 |
| Confirm venue holds Special Amusement Permit | Permits | Aug 1 | Zaal | 🔲 |
| If needed: apply for Special Amusement Permit | Permits | Sep 1 | Zaal | 🔲 |
| Confirm venue handles sound permit | Permits | Aug 1 | Zaal | 🔲 |
| If needed: submit noise/sound permit | Permits | Sep 19 | Zaal | 🔲 |
| Confirm charity Maine registration status | Charity | Jul 25 | Zaal | 🔲 |
| If not registered: arrange fiscal sponsor | Charity | Aug 1 | Zaal | 🔲 |
| Save charity vote result screenshot | Charity | Jul 25 | Zaal | 🔲 |
| ZOE: auto-post TX hash + save citation | Charity | Oct 3 | ZOE | 🔲 |

---

## ZOE Reminder Cadence

| Date | ZOE Telegram Reminder |
|---|---|
| Aug 1 (AM) | "ZAOstock: venue confirmed today — check their insurance requirements + permit status. Checklist: doc 1602." |
| Aug 7 | "ZAOstock insurance: select provider and get quote by tomorrow (Aug 8). K&K or Markel recommended. Doc 1602." |
| Aug 14 | "ZAOstock insurance: purchase policy today (Aug 15 deadline). Send COI to venue by Aug 22. Doc 1602." |
| Aug 22 | "ZAOstock: send COI to venue today. Also: Special Amusement Permit — submit by Sep 1 if venue doesn't have it. Doc 1602." |
| Sep 1 | "ZAOstock: Special Amusement Permit deadline today (if applicable). Doc 1602." |
| Sep 15 | "ZAOstock: confirm venue accepted COI. Insurance track must be closed by today. Doc 1602." |
| Sep 19 | "ZAOstock: noise/sound permit deadline today (if applicable). Doc 1602." |
| Oct 2 | "ZAOstock eve: all permits confirmed? Insurance COI accepted? Charity payout route confirmed? Doc 1602 master tracker." |

---

## Related Docs

- 1597 — ZAOstock Line of Show Master Template (running order + charity battle 10-step protocol)
- 1585 — ZAOstock Attendee Pre-Event Welcome Pack (Eventbrite + message sequences)
- 1575 — ZOR Africa Battle Week Vote (charity selection vote Jul 24-25)
- 1562 — ZAOstock Sponsor Activation Playbook (Magnetiq, Empire, Coinflow, Juke, Neynar)
- 1594 — ZOE Jul 21-25 Critical Week Checklist (includes Fractured Atlas FA application Jul 22 — potential fiscal sponsor)
