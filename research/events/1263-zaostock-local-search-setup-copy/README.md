---
topic: events/zaostock
type: copy
status: ready-to-paste
created: 2026-07-17
board-task: e70cf996
related-docs: 986, 1073, 1107
deadline: 2026-08-01
owner: Iman
---

# 1263 -- ZAOstock Local Search: Setup Copy (Google Business Profile + Eventbrite + Listings)

> **How to use:** This doc contains exact copy for Iman to paste into each platform. Creating these accounts is Zaal/Iman-gated (outbound account actions). No custom branding needed -- use the copy below as-is. Deadline: Aug 1.
>
> **Event facts (verified):** ZAOstock | Oct 3, 2026, 12PM-6PM | 125 Franklin St (Franklin Street Parklet), Ellsworth ME 04605 | Free entry | Heart of Ellsworth Art of Ellsworth weekend. After-party: Black Moon Public House.

---

## 1. Google Business Profile (GBP)

**Why this matters:** A single GBP listing puts ZAOstock on Google Maps and in local-pack search results for "festivals Maine October 2026," "events Ellsworth Maine," and "things to do Ellsworth." Highest ROI local-search action of the four.

**Go to:** business.google.com -- Add a business

**Field-by-field copy:**

| Field | Value |
|-------|-------|
| Business name | ZAOstock 2026 |
| Category | Music festival (primary) |
| Address | 125 Franklin St, Ellsworth, ME 04605 |
| Phone | [to confirm: Zaal's or event phone] |
| Website | [to confirm: thezao.com/zaostock or specific event page] |
| Opening hours | Saturday Oct 3, 2026: 12:00 PM - 6:00 PM |
| Business description (750 chars max) | See below |

**GBP Description (paste verbatim, 680 chars):**

```
ZAOstock is a free outdoor music festival in downtown Ellsworth, Maine. October 3, 2026, 12PM-6PM at the Franklin Street Parklet (125 Franklin St).

Presented by The ZAO and Heart of Ellsworth during Maine Craft Weekend / Art of Ellsworth weekend.

Live music, community vendors, and an after-party at Black Moon Public House.

ZAOstock celebrates independent artists and the Ellsworth creative community. Free entry, all ages welcome.

Contact: thezao.com | @zaofestivals
```

**Photos to upload:**
- ZAOstock logo / flyer (once designed)
- Franklin Street Parklet (exterior)
- ZAO or past event photos (COC Concertz, ZAOville)

**Post creation:** Google sends a verification postcard to 125 Franklin St. Contact Heart of Ellsworth / City of Ellsworth Parks dept (Roddy Ehrlenbach) to ask if they can receive the postcard, or use a Google verification alternative (phone/video).

---

## 2. Eventbrite Listing

**Why this matters:** Eventbrite entries are indexed by Google Events, feeds Bandsintown/Songkick automatically (via import), and gives attendees a calendar-add link. "ZAOstock Eventbrite" searches currently return zero results.

**Go to:** eventbrite.com/organizer/overview -- Create an event

**Field-by-field copy:**

| Field | Value |
|-------|-------|
| Event name | ZAOstock 2026 |
| Event type | Music festival |
| Category | Music > Festival |
| Date | Saturday, October 3, 2026 |
| Start time | 12:00 PM EDT |
| End time | 6:00 PM EDT (after-party continues at Black Moon Public House) |
| Location / venue | Franklin Street Parklet, 125 Franklin St, Ellsworth, ME 04605 |
| Ticket type | Free (add "RSVP" ticket, $0, unlimited capacity -- gives headcount data) |
| Organizer name | The ZAO / ZAO Festivals |

**Event Description (paste into Eventbrite description field):**

```
ZAOstock is a free outdoor music festival in downtown Ellsworth, Maine -- October 3, 2026, 12PM-6PM.

WHERE: Franklin Street Parklet, 125 Franklin St, Ellsworth ME 04605 (between Elizabeth's Fine Goods and Black Moon Public House)

WHEN: Saturday October 3, 2026, 12:00 PM - 6:00 PM. After-party at Black Moon Public House to follow.

WHO: ZAOstock is presented by The ZAO and Heart of Ellsworth during Maine Craft Weekend. We celebrate independent artists, builders, and the Ellsworth creative community.

COST: Free entry, all ages.

LINEUP: [to confirm: add artists as confirmed]

ZAOstock is part of The ZAO's annual festival series. Follow @zaofestivals on Farcaster and X for updates.

Questions? Visit thezao.com or DM @bettercallzaal.
```

---

## 3. Visit Maine Event Calendar

**Why this matters:** Visit Maine (visitmaine.com) is the state tourism board's official calendar. Appearing on it signals "real event" to the local press, gives a backlink from a high-authority domain, and feeds the Maine arts/culture search results Google surfaces for tourists.

**Go to:** visitmaine.com -- Submit an event (or Maine tourism event submission form)

**Copy for form fields:**

| Field | Value |
|-------|-------|
| Event name | ZAOstock 2026 Music Festival |
| Start date | October 3, 2026 |
| End date | October 3, 2026 |
| Start time | 12:00 PM |
| End time | 6:00 PM |
| Venue name | Franklin Street Parklet |
| Address | 125 Franklin St, Ellsworth, ME 04605 |
| County | Hancock County |
| Category | Music, Arts & Culture, Festival |
| Admission | Free |
| Organizer / contact | The ZAO / thezao.com / [Zaal contact] |
| Short description (150 chars) | Free outdoor music festival, Oct 3, 12-6PM, Franklin Street Parklet, Ellsworth ME. |
| Long description | [Use the Eventbrite description above] |
| Website | thezao.com/zaostock [to confirm] |
| Image | ZAOstock flyer / logo |

---

## 4. Bandsintown

**Why this matters:** Bandsintown syncs with Spotify artist profiles and sends "event near you" notifications to fans who follow the artist. Any ZAO-affiliated artist's fans who use Bandsintown will get notified when ZAOstock is added.

**Go to:** artists.bandsintown.com -- Add show

**If a Bandsintown artist page does not yet exist for The ZAO / WaveWarZ:** Create one first at artists.bandsintown.com, then add ZAOstock as a show.

**Show details:**

| Field | Value |
|-------|-------|
| Artist | The ZAO (or per-artist pages for WaveWarZ-affiliated artists) |
| Venue | Franklin Street Parklet |
| City | Ellsworth, ME |
| Country | United States |
| Date | October 3, 2026 |
| Ticket link | [Eventbrite URL once created] |
| Free show | Yes |

---

## 5. Songkick

**Why this matters:** Songkick is Bandsintown's main competitor. Same fan-notification mechanic, slightly different artist audience.

**Go to:** tourbox.songkick.com -- Add a show

**Same show details as Bandsintown above.**

---

## 6. Schema.org Event Markup (for the ZAOstock web page)

**Why this matters:** Google uses JSON-LD structured data to power Rich Results (event carousels, Knowledge Panels, Google Maps integration). Adding this to the ZAOstock page head means Google shows ZAOstock with a rich snippet (date, location, ticket link) whenever someone searches for it.

**Add to `<head>` of the ZAOstock event page:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MusicFestival",
  "name": "ZAOstock 2026",
  "description": "Free outdoor music festival in downtown Ellsworth, Maine. Presented by The ZAO and Heart of Ellsworth during Maine Craft Weekend.",
  "url": "https://thezao.com/zaostock",
  "startDate": "2026-10-03T12:00:00-04:00",
  "endDate": "2026-10-03T18:00:00-04:00",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "Franklin Street Parklet",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "125 Franklin St",
      "addressLocality": "Ellsworth",
      "addressRegion": "ME",
      "postalCode": "04605",
      "addressCountry": "US"
    }
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "[EVENTBRITE URL]"
  },
  "organizer": {
    "@type": "Organization",
    "name": "The ZAO",
    "url": "https://thezao.com"
  },
  "image": "[FLYER IMAGE URL]"
}
</script>
```

**Validate:** After adding, check at search.google.com/test/rich-results -- paste the page URL. Should show green "Valid" for Event.

---

## Action Checklist (for Iman, by Aug 1)

| # | Action | Platform | Status |
|---|--------|----------|--------|
| 1 | Create GBP listing with description above | Google Business Profile | [ ] |
| 2 | Request verification postcard (or alt verification) | GBP | [ ] |
| 3 | Create Eventbrite listing with RSVP ticket | Eventbrite | [ ] |
| 4 | Submit to Visit Maine event calendar | visitmaine.com | [ ] |
| 5 | Add show to Bandsintown | Bandsintown | [ ] |
| 6 | Add show to Songkick | Songkick | [ ] |
| 7 | Add JSON-LD Event markup to ZAOstock page | Web (PR) | [ ] |
| 8 | Confirm flyer/logo image is ready (needed for GBP + Eventbrite) | Design | [to confirm: image available?] |

---

## What to Do If the ZAOstock URL Does Not Exist Yet

If `thezao.com/zaostock` or similar event page is not live, create it before submitting to platforms (you need a URL to link to). Minimum page content:
- Event name + date + time + location
- One-paragraph description
- Eventbrite RSVP link (once created)
- @zaofestivals social links
- Schema.org JSON-LD markup (above)

---

## Related Docs

- [Doc 986](../986-ellsworth-local-intel-zaostock/) -- Ellsworth local intel: venue, Heart of Ellsworth, bank sponsors, Oct 1 concert series overlap
- [Doc 1073](../1073-zaostock-oct3-readiness/) -- Full readiness plan with permit + funding critical path
- [Doc 1107](../../identity/1107-seo-social-profiles/) -- SEO/GEO strategy; ZAOstock local search is finding #5
