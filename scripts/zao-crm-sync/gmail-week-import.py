#!/usr/bin/env python3
"""
Import recent Gmail signal into ZAO CRM AGENTIC Airtable.

Reads a hand-curated list of threads from the 2026-05-25 sweep + filters
out noise (Vercel / GitHub / Bonfires / Read AI / newsletters), creates
NEW contacts for fresh humans, enriches existing contacts with email
addresses, writes one activity row per real conversation.

Per pii-hygiene rules: Airtable workspace is private to Zaal, so emails
are stored there in full. Any synthesis that leaves Airtable (research
doc, Bonfire body, Telegram block) must redact non-allowlisted emails.
"""
import json, os, urllib.request, urllib.error

TOKEN = os.environ["AIRTABLE_CRM_TOKEN"]
BASE_ID = os.environ["AIRTABLE_CRM_BASE_ID"]
CONTACTS_TABLE = "tbld4piB9auXPXYEn"
ACTIVITY_TABLE = "tblHGmWeoH0ijetPH"

# Existing contact IDs from prior backfills
EXISTING = {
    "vlad": "rec9TSXvZPU0CvEMa",
    "shriyash soni": "recMafiEvDIbCP2em",
    "tyler stambaugh": "recVpdurlWTpnCPVd",
    "arthur l (neynar)": "recfQtMjceuCbSPaf",
    "kmac.eth": "recgpmrjDcU1aDcdn",
    "jordan oram": "recAIj34Rv4s1SpSO",
    "cannonjones": "rec8A9bgrWonmgJWm",
    "iman afrikah": "recznKNHfUs5kTJXb",
    "zaal panthaki": "recQYQ3mawligl4fn",
}


def api(method, path, body=None):
    url = f"https://api.airtable.com/v0/{BASE_ID}{path}"
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# ============================================================
# NEW contacts to create (from 2026-05-25 Gmail sweep)
# ============================================================
NEW_CONTACTS = [
    {
        "name": "Eduard Muntean",
        "role": "Builder / collaborator (TBD)",
        "org": "(unknown)",
        "zao_connection": ["inbound-builder"],
        "email_primary": "editaie.muntean@gmail.com",
        "met_via": "Sent ZABAL Games meeting invites 2026-05-25 (1:30pm + 2:30pm EDT slots)",
        "first_contact_date": "2026-05-25",
        "last_touch_date": "2026-05-25",
        "consent_for_graph": False,
        "notes": "Sent 2 separate 'zabal' Google Meet invites within minutes 2026-05-25 - scheduling negotiation in progress. Role/relationship TBD - first surface via calendar invite. Probably an early ZABAL Games signup or someone wanting to chat about ZABAL.",
        "research_docs": "",
    },
    {
        "name": "Adrian (cryptorabble)",
        "role": "Crypto builder (likely)",
        "org": "(unknown)",
        "zao_connection": ["inbound-builder", "cold-intro"],
        "email_primary": "cryptorabble@gmail.com",
        "met_via": "Calendly bookings May 25 7pm + May 31 8pm EDT - 30 min meetings",
        "first_contact_date": "2026-05-23",
        "last_touch_date": "2026-05-25",
        "consent_for_graph": False,
        "notes": "Last-name unknown ('Adrian'). Cryptorabble handle suggests crypto/web3 background. Two booked Calendly slots in a week = recurring or rebooked meeting. Verify role on first call.",
        "research_docs": "",
    },
    {
        "name": "Bailey (Cal.com)",
        "role": "Co-founder, Cal.com",
        "org": "Cal.com",
        "zao_connection": ["partner-org"],
        "email_primary": "bailey@cal.com",
        "met_via": "Reached out 2026-05-24 after Zaal signed up - 'what made you sign up today?'",
        "first_contact_date": "2026-05-24",
        "last_touch_date": "2026-05-25",
        "consent_for_graph": False,
        "notes": "One of Cal.com co-founders. Personal outreach to new signups. Zaal: 'Looking for an opensource cal inviter.' Bailey followed up with hosted + self-host docs. Relevant: ZABAL Games workshop slot booker at cal.com/bettercallzaal/zabal-games-workshop-slot per CLAUDE.md.",
        "research_docs": "",
    },
    {
        "name": "Adam Miller (MIDAO)",
        "role": "MIDAO (likely SongJam team)",
        "org": "MIDAO / SongJam",
        "zao_connection": ["partner-org", "inbound-builder"],
        "email_primary": "adam.miller@midao.org",
        "met_via": "BCZ YapZ booking - declined May 29, accepted June 12 6-7pm EDT",
        "first_contact_date": "2026-05-22",
        "last_touch_date": "2026-05-22",
        "consent_for_graph": False,
        "notes": "Likely the 'Adam' from SongJam mentioned across docs (doc 654 #4 - SongJam leaderboard migration owner). MIDAO.org = governance-tooling DAO. Coming on BCZ YapZ podcast June 12. Verify SongJam connection on call.",
        "research_docs": "654",
    },
    {
        "name": "Martha Abbott (Rotary)",
        "role": "Bar Harbor/MDI Rotary Club - membership",
        "org": "Rotary Club Bar Harbor/MDI",
        "zao_connection": ["community-member"],
        "email_primary": "marthaabbott@roadrunner.com",
        "met_via": "Dean Read referral - Rotary membership application 2026-05-22",
        "first_contact_date": "2026-05-22",
        "last_touch_date": "2026-05-22",
        "consent_for_graph": False,
        "notes": "Sent Rotary membership application after Dean Read flagged Zaal as interested. Bar Harbor/MDI Rotary = local Ellsworth-area civic org. Civic surface for ZAOstock October Ellsworth event ecosystem.",
        "research_docs": "",
    },
    {
        "name": "Chesnee Barney (Heart of Ellsworth)",
        "role": "Promotions Committee, Heart of Ellsworth",
        "org": "Heart of Ellsworth",
        "zao_connection": ["partner-org", "community-member"],
        "email_primary": "chesnee@heartofellsworth.org",
        "met_via": "Heart of Ellsworth Promotions Committee meeting Tuesday 5/26 5:30pm",
        "first_contact_date": "2026-05-22",
        "last_touch_date": "2026-05-22",
        "consent_for_graph": False,
        "notes": "Heart of Ellsworth = local Ellsworth nonprofit / promotions group. Monthly Promotions Committee meeting (Tuesdays 5:30pm at 16 State Street). Civic surface for ZAOstock October Ellsworth event - get on this monthly cycle.",
        "research_docs": "",
    },
]

# ============================================================
# Existing contacts - email enrichment
# ============================================================
ENRICH = [
    {"id": "rec9TSXvZPU0CvEMa", "fields": {"email_primary": "vlad@singularity.diy", "notes": "Full legal name confirmed via 2026-05-22 GCal invite: Vladislav Hramtsov. Singularity.diy email. " + "Eden Fractal lineage. Built Respect Game on Base. Doc 738."}},
    {"id": "recVpdurlWTpnCPVd", "fields": {"email_primary": "tyler@magnetiq.xyz"}},
    {"id": "recMafiEvDIbCP2em", "fields": {"email_primary": "sonishriyash@gmail.com"}},
]

# ============================================================
# Activity rows (1 per real thread)
# ============================================================
ACTIVITIES = [
    {
        "title": "Steve Peer - Crown Vics Rockumentary filming schedule (4 emails Apr 23-25)",
        "date": "2026-05-23T15:45:00.000Z",
        "type": "email-received",
        "contact_name": None,  # Steve Peer - need to check if exists or create
        "contact_email": "430bayside@gmail.com",
        "contact_create": {  # if not in EXISTING, create
            "name": "Steve Peer",
            "role": "Ellsworth musician / videographer (Crown Vics)",
            "org": "Self / 430 Bayside (Ellsworth house concerts)",
            "zao_connection": ["ZAOstock-team", "community-member"],
            "email_primary": "430bayside@gmail.com",
            "met_via": "Ellsworth music scene; 2026-04 ZAOstock co-curator per project_steve_peer memory",
            "first_contact_date": "2026-04-15",
            "last_touch_date": "2026-05-25",
            "consent_for_graph": True,
            "notes": "Ellsworth drummer since 1989 per project_steve_peer memory. ZAO Stock co-curator. 430 Bayside house concerts. Filming the Lo Fi Sci Fi Rockumentary for Crown Vics: 3 locations (bar / his house / Grange hall across street). Beginning/middle/ambiguous ending story. Meeting Wed 6pm at his house.",
            "research_docs": "",
            "memory_slug": "project_steve_peer",
        },
        "direction": "mutual",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZAOstock", "WaveWarZ"],
        "summary": "Crown Vics Rockumentary filming. Meeting Wed 6pm at Steve's house, then Grange hall across the street, then a bar to wrap. Beginning/middle/ambiguous-ending narrative. Steve sent the photo+video Rockumentary file (.zip) + complete file follow-up. 4-email thread May 23-25.",
        "bonfire_episode_id": "",
    },
    {
        "title": "Bailey (Cal.com cofounder) - opensource cal inviter conversation",
        "date": "2026-05-24T22:00:00.000Z",
        "type": "email-received",
        "contact_email": "bailey@cal.com",
        "direction": "mutual",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZABAL-Games", "ops"],
        "summary": "Bailey (Cal.com cofounder) reached out after Zaal signed up. Zaal: 'Looking for an opensource cal inviter.' Bailey replied with hosted (cal.com/signup free tier) + self-host options. Relevant to ZABAL Games workshop slot booker at cal.com/bettercallzaal/zabal-games-workshop-slot.",
        "bonfire_episode_id": "",
    },
    {
        "title": "Adam Miller (MIDAO / likely SongJam) - BCZ YapZ podcast June 12",
        "date": "2026-06-12T22:00:00.000Z",
        "type": "gcal-event",
        "contact_email": "adam.miller@midao.org",
        "direction": "mutual",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZAO-Music", "ops"],
        "summary": "Adam Miller booked BCZ YapZ podcast slot June 12 6-7pm EDT (after declining May 29). Streams to stream2.thezao.com. Likely the SongJam Adam mentioned in doc 654 (SongJam leaderboard migration owner). Confirm SongJam role on call.",
        "bonfire_episode_id": "",
    },
    {
        "title": "Eduard Muntean - ZABAL meeting scheduling (3 calendar invites)",
        "date": "2026-05-25T16:25:00.000Z",
        "type": "gcal-event",
        "contact_email": "editaie.muntean@gmail.com",
        "direction": "inbound",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZABAL-Games"],
        "summary": "Eduard Muntean sent 2 'zabal' Google Meet invites within minutes 2026-05-25 (1:30pm slot then 2:30pm slot). Scheduling negotiation. First contact. Relationship + role unknown - likely a ZABAL Games signup or inbound chat request. Verify on first call.",
        "bonfire_episode_id": "",
    },
    {
        "title": "Adrian (cryptorabble) - 30min meetings May 25 + May 31",
        "date": "2026-05-25T23:00:00.000Z",
        "type": "gcal-event",
        "contact_email": "cryptorabble@gmail.com",
        "direction": "mutual",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ops"],
        "summary": "Adrian (cryptorabble@gmail.com) - Calendly booked May 25 7pm + May 31 8pm EDT. Last name unknown. Crypto/web3 background inferred from handle. Recurring or rebooked.",
        "bonfire_episode_id": "",
    },
    {
        "title": "Vlad (Singularity) - 2026-05-24 Restream call invite confirmation",
        "date": "2026-05-22T16:20:00.000Z",
        "type": "gcal-event",
        "contact_name": "Vlad",  # use existing rec9TSXvZPU0CvEMa
        "direction": "inbound",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["Fractal"],
        "summary": "Vlad (Vladislav Hramtsov, singularity.diy) sent GCal invite 2026-05-22 for the May 24 10am Restream call. Confirmed full legal name. This was the call captured as doc 738 meeting recap.",
        "bonfire_episode_id": "meeting:2026-05-24:vlad-singularity-fractal:summary",
    },
    {
        "title": "Tyler (Magnetiq) - 2026-05-22 4pm meeting accepted",
        "date": "2026-05-22T20:00:00.000Z",
        "type": "gcal-event",
        "contact_name": "Tyler Stambaugh",
        "direction": "mutual",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZABAL-Games", "ZAOstock"],
        "summary": "Tyler accepted 2026-05-22 4-5pm meeting. Magnetiq.xyz email confirmed (rebrand from 'Magnetic' per CLAUDE.md glossary update). Doc 714 was the recap of this meeting series.",
        "bonfire_episode_id": "",
    },
    {
        "title": "Shriyash (Apna Coding) - 2026-05-22 9:30am meeting accepted",
        "date": "2026-05-22T13:30:00.000Z",
        "type": "gcal-event",
        "contact_name": "Shriyash Soni",
        "direction": "mutual",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZABAL-Games"],
        "summary": "Shriyash accepted 2026-05-22 9:30-10:30am meeting. sonishriyash@gmail.com confirmed. Predecessor to the 2026-05-23 intro call (doc 736).",
        "bonfire_episode_id": "",
    },
    {
        "title": "Chesnee Barney (Heart of Ellsworth) - Promotions Committee 5/26",
        "date": "2026-05-26T21:30:00.000Z",
        "type": "gcal-event",
        "contact_email": "chesnee@heartofellsworth.org",
        "direction": "inbound",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZAOstock"],
        "summary": "Heart of Ellsworth monthly Promotions Committee meeting Tuesday 5/26 5:30pm at 16 State Street. 7 attendees from Ellsworth orgs (city, library, bank, French American). Civic surface for ZAOstock October Ellsworth event - get embedded in this monthly cycle.",
        "bonfire_episode_id": "",
    },
    {
        "title": "Martha Abbott (Rotary) - membership application via Dean Read referral",
        "date": "2026-05-22T19:10:00.000Z",
        "type": "email-received",
        "contact_email": "marthaabbott@roadrunner.com",
        "direction": "inbound",
        "source": "gmail-mcp",
        "raw_source": "~/.zao/private/gmail-2026-05-11-to-25.json",
        "zao_relevance": ["ZAOstock", "ops"],
        "summary": "Dean Read flagged Zaal as interested in Bar Harbor/MDI Rotary. Martha sent membership application. Civic surface for ZAOstock + Ellsworth ecosystem networking.",
        "bonfire_episode_id": "",
    },
]


def main():
    print("=" * 60)
    print("Phase 1: enrich existing contacts (emails)")
    print("=" * 60)
    for e in ENRICH:
        status, resp = api("PATCH", f"/{CONTACTS_TABLE}/{e['id']}", {"fields": e["fields"]})
        marker = "OK" if status == 200 else f"FAIL({status})"
        print(f"  {marker}  {e['id']}  fields={list(e['fields'].keys())}")

    print()
    print("=" * 60)
    print("Phase 2: create NEW contacts")
    print("=" * 60)
    # Bulk insert up to 10 per call
    new_id_by_email = {}
    body = {"records": [{"fields": c} for c in NEW_CONTACTS]}
    status, resp = api("POST", f"/{CONTACTS_TABLE}", body)
    if status not in (200, 201):
        print(f"  FAIL({status}): {json.dumps(resp, indent=2)}")
        return
    for rec in resp["records"]:
        f = rec["fields"]
        print(f"  OK  {rec['id']}  {f.get('name'):28}  email={f.get('email_primary')}")
        new_id_by_email[f.get("email_primary", "").lower()] = rec["id"]

    # Steve Peer is in activities (contact_create) - check if exists first
    steve_email = "430bayside@gmail.com"
    if steve_email not in {c.get("email_primary","").lower() for c in NEW_CONTACTS}:
        # not yet created - create now from the first activity's contact_create
        steve_create = next((a.get("contact_create") for a in ACTIVITIES if a.get("contact_email") == steve_email), None)
        if steve_create:
            status, resp = api("POST", f"/{CONTACTS_TABLE}", {"records": [{"fields": steve_create}]})
            if status in (200, 201):
                steve_id = resp["records"][0]["id"]
                new_id_by_email[steve_email] = steve_id
                print(f"  OK  {steve_id}  {steve_create['name']:28}  email={steve_email}")

    print()
    print("=" * 60)
    print(f"Phase 3: create {len(ACTIVITIES)} activity rows")
    print("=" * 60)

    rows = []
    for a in ACTIVITIES:
        # Resolve contacts
        contact_ids = []
        # Always include Zaal
        contact_ids.append(EXISTING["zaal panthaki"])

        # Resolve by email or name
        if a.get("contact_email"):
            email = a["contact_email"].lower()
            if email in new_id_by_email:
                contact_ids.append(new_id_by_email[email])
            else:
                # Check enriched existing
                for k, v in EXISTING.items():
                    # match by lowercase name fragment - Vlad / Tyler / Shriyash
                    if k in a.get("title", "").lower():
                        contact_ids.append(v)
                        break
        elif a.get("contact_name"):
            name = a["contact_name"].lower()
            if name in EXISTING:
                contact_ids.append(EXISTING[name])

        row = {k: v for k, v in a.items() if k not in ("contact_email", "contact_name", "contact_create")}
        row["contacts"] = contact_ids
        rows.append(row)

    # Batch 10 at a time
    inserted = 0
    for i in range(0, len(rows), 10):
        batch = rows[i:i+10]
        status, resp = api("POST", f"/{ACTIVITY_TABLE}", {"records": [{"fields": r} for r in batch]})
        if status not in (200, 201):
            print(f"  FAIL batch {i//10 + 1} ({status}): {json.dumps(resp, indent=2)[:500]}")
            continue
        inserted += len(resp.get("records", []))
        for rec in resp["records"]:
            print(f"  OK  {rec['id']}  {rec['fields'].get('title', '')[:80]}")

    print()
    print(f"DONE: {inserted}/{len(rows)} activity rows + {len(NEW_CONTACTS)} new contacts + {len(ENRICH)} enriched")


if __name__ == "__main__":
    main()
