#!/usr/bin/env python3
"""
Add Jordan Oram (yerbearzerker, Empire Builder founder) June 1 6am EST
workshop confirmation as an activity row in ZAO CRM AGENTIC Airtable base.

Contact: recAIj34Rv4s1SpSO (Jordan Oram, from 2026-05-23 backfill).
"""
import json, os, urllib.request, urllib.error

TOKEN = os.environ["AIRTABLE_CRM_TOKEN"]
BASE_ID = os.environ["AIRTABLE_CRM_BASE_ID"]
ACTIVITY_TABLE = "tblHGmWeoH0ijetPH"
OPPS_TABLE = "tblnjqTNvYd1lyez3"
JORDAN_ID = "recAIj34Rv4s1SpSO"
ZAAL_ID = "recQYQ3mawligl4fn"


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


# Activity row: Jordan confirmed June 1 6am EST workshop
activity = {
    "title": "Jordan (Empire Builder) ZABAL Games June workshop slot - confirmed June 1 6am EST",
    "date": "2026-06-01T10:00:00.000Z",  # 6am EST = 10:00 UTC
    "type": "gcal-event",
    "contacts": [JORDAN_ID, ZAAL_ID],
    "direction": "mutual",
    "source": "manual",
    "raw_source": "research/events/654-zabal-games-empire-v3-yerbearzerker-meeting/",
    "zao_relevance": ["ZABAL-Games"],
    "summary": (
        "Jordan Oram (yerbearzerker, Empire Builder founder) confirmed to run "
        "the Empire Builder V3 workshop during ZABAL Games June prep month. "
        "Slot: June 1 2026, 6am EST (early-time slot, likely chosen to be "
        "Asia/Australia-friendly). Topic per doc 654 Decision #9: recorded "
        "Far-Hack-style session - 'here is Empire, here is how to use it, "
        "here is why.' Watchable live or after. Pairs with the ZABAL Games "
        "master context skill (doc 654 Decision #8 / doc 701 Decision #10) "
        "which ships in parallel."
    ),
    "bonfire_episode_id": "",
}

# Opportunity row: workshop slot committed
opp = {
    "title": "Empire Builder V3 ZABAL Games workshop - Jordan (June 1 2026)",
    "kind": "collab",
    "status": "committed",
    "owner": "Both",
    "counterparty_contacts": [JORDAN_ID],
    "zao_surface": ["ZABAL-Games"],
    "value_thesis": (
        "First confirmed ZABAL Games June workshop. Sets the format precedent "
        "(Far-Hack recorded sessions per doc 654 #9). Jordan is also key for "
        "the Phase-2 token-launch flow (Clanker airdrop from Empire leaderboard) "
        "so this workshop primes builders for July submissions to use Empires."
    ),
    "next_action": "Send Jordan ZABAL Games context skill + Cal.com slot booker link",
    "next_action_due": "2026-05-28",
    "created_at": "2026-05-25",
    "linked_research_doc": "654, 701, 719",
}


def main():
    print("inserting Jordan workshop activity...")
    status, resp = api("POST", f"/{ACTIVITY_TABLE}", {"records": [{"fields": activity}]})
    if status not in (200, 201):
        print(f"FAILED ({status}): {json.dumps(resp, indent=2)}")
        return
    activity_id = resp["records"][0]["id"]
    print(f"  OK -> {activity_id}")

    opp["linked_activity"] = [activity_id]
    print("\ninserting opportunity row...")
    status, resp = api("POST", f"/{OPPS_TABLE}", {"records": [{"fields": opp}]})
    if status not in (200, 201):
        print(f"FAILED ({status}): {json.dumps(resp, indent=2)}")
        return
    opp_id = resp["records"][0]["id"]
    print(f"  OK -> {opp_id}")

    print("\n" + "="*60)
    print(f"activity row:    {activity_id}")
    print(f"opportunity row: {opp_id}")
    print("="*60)


if __name__ == "__main__":
    main()
