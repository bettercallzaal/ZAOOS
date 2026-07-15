---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-07-14
related-docs: 991, 1088, 780, 719, 89
tier: STANDARD
---

# 1092 - Zaal x Adrian (Empire Builder): zaalcaster deep dive, tokenless empire deploy/attach endpoints, Sign In With Farcaster

> **Goal:** Lock in action items + decisions from a 2026-07-14 Restream studio call with Zaal and Adrian (DiviFlyy, Empire Builder cofounder) covering zaalcaster's Empire Builder integration (live-demoed on screen), Clanker fee-split mechanics, the tokenless-empire deploy/attach API surface, and a next Space with Jordan + the Farcaster team.

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | **Clanker fee splits are flexible after launch, not locked at deploy time** - Clanker gives the token creator admin rights over the fee recipients, so Zaal can launch as a single 100% recipient and reshape the split later without needing a pre-built 0xSplits contract on day one (though a splits contract can also be immutable or mutable, creator's choice). | Adrian | DONE (info) |
| 2 | **Zaal's token-distribution plan**: carve out a portion for an AI agent and a portion for a community fund, in addition to his own share. Exact percentages not fixed on the call. | Zaal | WIP |
| 3 | **Zaal already has a working Empire API key** (from Adrian) that is sufficient to create a tokenless empire himself - no further access grant needed for that step. | Adrian | DONE (info) |
| 4 | **Adrian will send Zaal a private endpoint that attaches a Clanker token to an existing tokenless empire directly**, bypassing Empire Builder's own UI flow (which normally requires launching the token through their interface first). This is the endpoint zaalcaster's own "create empire" feature (deferred earlier this session pending this exact meeting) can build against. | Adrian | TODO |
| 5 | **Do not attach a tokenless empire to a personal Farcaster profile unless that's final** - Adrian's explicit warning: a profile-attached empire is permanent (can't create a second one for that profile later, it's bound to the feed forever). A "fresh"/custom empire (not tied to a profile) keeps optionality. | Adrian | DONE (info) |
| 6 | **Empire Builder is building a channel-scoped version of the tokenless-empire flow** (today's flow is profile-scoped) - not live yet. | Adrian | WIP (their roadmap) |
| 7 | zaalcaster switches from a password gate to **Sign In With Farcaster**, giving other Farcaster users read-only access to the safe surface - dictated live on this call, already shipped this session as PR #90. | Zaal | DONE |

## Thread 1 - Clanker fee splits + token distribution

### The Idea

Zaal wants to route a token's fee stream to more than just himself - specifically an AI agent budget and a community fund, on top of his own cut - and asked whether that requires a pre-committed splits contract at launch.

### Why It Matters

This is the exact mechanism zaalcaster's eventual token launch (doc 988) and the broader "coinz" crowdfunding product (doc 1088) will need: multi-recipient fee flows that can evolve as the project (agent, community fund, etc.) matures.

### Decisions Pending

Exact split percentages are not locked. Zaal floated needing "at least three to five wallets," Adrian confirmed Clanker requires you to decide the recipient count at launch but the *recipients themselves* (who gets what share) can be changed afterward via admin rights - so headcount is the one thing to lock early, not the allocation.

### Next Step

No explicit owner/date - informational, feeds into the token-config decisions in doc 988 when Zaal locks that plan.

## Thread 2 - Tokenless empire: create + attach endpoints

### The Idea

Zaal asked, given a tokenless empire already exists, whether a Clanker token can be created separately and then attached to it, versus having to launch the token through Empire Builder's own interface. Adrian confirmed both are possible: the normal path is launching through their UI (which auto-attaches), but for a special case Adrian can (and offered to) hand Zaal a private API endpoint that attaches any token to a tokenless empire directly, usable with Zaal's existing API key.

### Why It Matters

This directly answers the open question from earlier in this session: zaalcaster's PR #89 (Empire Builder read integration) deliberately stayed read-only because the public docs (582/583/361) document zero write endpoints. This call confirms Zaal already has partner-level write access - a `deploy tokenless empire` endpoint (per the existing `project_adrian_empire_builder` memory, no wallet/private key needed) and now, per this call, an `attach-token-to-tokenless-empire` endpoint Adrian is sending over. Both were previously assumed to require negotiation; they're already available or in-flight.

### Decisions Pending

The attach-token endpoint itself hasn't been sent yet (Adrian: "I can just give you that endpoint"). Also unresolved from the call: Adrian mentioned Zaal was sent a "trusted" key the first time and an "untrusted" one the second time, and they may need to reroll the keys - not urgent ("I don't think I'm gonna rush on it"), but worth confirming before building anything that depends on key validity.

### Next Step

Adrian to send the private attach-token endpoint to Zaal. No date given.

## Thread 3 - Live demo: zaalcaster's Grow tab / Empire card

### The Idea

Zaal screen-shared zaalcaster's Grow tab live, showing the "ZABAL empire - rank 6.28 - 597 treasury" card (the exact feature shipped in PR #89 earlier this session) and his top-fans leaderboard. Adrian explained the displayed "rank" is Empire Builder's own internal figure - to get true global rank, call the top-empires endpoint and find your position in that list, since the rank number alone doesn't carry that context.

### Why It Matters

Confirms PR #89's read integration is pulling real, correct data end-to-end, live, in front of Empire Builder's own cofounder - the best possible verification short of Zaal's own review.

### Decisions Pending

None - this was demo/feedback, not a decision point.

### Next Step

Zaal: "I'm going to test that at some point" - no firm date.

## Action Items

| # | Action | Owner | Category | Due |
|---|--------|-------|----------|-----|
| 1 | Send Zaal the private endpoint to attach a Clanker token to a tokenless empire | Adrian | Empire Builder | TBD |
| 2 | Consider rerolling Zaal's Empire API keys (trusted vs untrusted key mixup) | Adrian | Empire Builder | TBD (not urgent) |
| 3 | Recap this call and share it with Jordan + the group chat ("give Jordan the 411") | Zaal | ZAO Devz | TBD |
| 4 | Message the Farcaster/Rish account to find a time for a group Space (Zaal, Jordan, Farcaster team) on Empire Builder x Clanker integrations | Zaal | ZAO Devz | TBD |
| 5 | Test the live Empire Builder integration in zaalcaster (PR #89) end-to-end himself | Zaal | ZAO Devz | TBD |
| 6 | Create the ZABAL GAMEZ tokenless empire "very soon" | Zaal | ZAO Devz | TBD - see Verify below, may already be done |
| 7 | Give Empire Builder feedback: onboarding is still their biggest problem ("people land on it and don't know what to do") - suggested an "LLMs button" / clearer how-it-works surface | Zaal -> Adrian | Empire Builder | no date set |

## Key Quotes

> "There's a lot of ways to put like... you can make the split contract immutable, you can make it mutable so the creator can change the recipients... Clanker allows you admin rights over the recipient so you can change the recipients." - Adrian

> "Endpoints there would be, I can give you an endpoint... a private endpoint that allows you to attach a token to a... tokenless empire... anything you want... I can just give you that endpoint and then you can use it too with your API key." - Adrian

> "You're good to create the tokenless empire with your current key... but you do need an API key for it." - Adrian

> "If you make this your profile... then you won't be able to make another one for your profile in the future, it'll be attached specifically to your feed... once you create that it's done forever... maybe you want to save that for a different time." - Adrian

> "Can you change from a password to a sign in with Farcaster so that other Farcaster [users] can read only the stuff that is okay for them to read only." - Zaal (dictated live to the Claude Code terminal mid-call)

> "People land on it and they don't know what to do... it's still probably our biggest problem." - Adrian, on Empire Builder's onboarding

## Verify / Low-confidence

- **Action 6 (create ZABAL GAMEZ empire "very soon")** - Zaal talks about this as upcoming, but a live API check earlier in this same session confirmed a tokenless empire named "ZABAL GAMEZ" already exists (owner wallet `0x7234...9af`, created 2026-06-01, with a live `/zabal` farcaster-channel leaderboard). Possible explanations: he means formally launching/promoting it rather than technically creating it, he's referring to a distinct second empire, or he simply didn't have the June one top of mind live on the call. Confirm with Zaal before treating this as a pending action.
- **Space scheduling (~6pm EST, ~1hr, Zaal + Jordan + Farcaster team + possibly Rish)** - discussed casually, no calendar invite locked. Confidence: medium.
- **FIP intention** ("I need to write on this FIP, I think, is what I need to do," re: channels going protocol-level and FIDs for droids) - stated as a soft intention, not a committed action. Not added to the Action Items table above; surfacing here in case Zaal wants it tracked.

## Research Seeds

- Empire Builder's partner-only write surface (deploy tokenless empire, attach-token-to-tokenless-empire) now has two live data points beyond the public docs (582/583/361) - worth a dedicated research doc once the attach-token endpoint actually arrives, so zaalcaster's deferred "create empire, live on the page" feature has a grounded spec to build against.
- Clanker's admin-changeable fee-recipient model (vs a locked splits contract) - relevant to doc 988's token-config decisions.

## Memory Updates

- `project_adrian_empire_builder.md` - should be updated with: the attach-token-to-tokenless-empire private endpoint (offered, not yet sent), the profile-vs-fresh-empire permanence warning, and the confirmation that Zaal's current API key is sufficient for empire creation. Not written yet - proposing in Phase 3, pending Zaal's OK.

## Also See

- [Doc 991](../../farcaster/991-empire-builder-tokenless-empire-airdrop/) - Triple-A framework (Assemble/Affirm/Ascend), original tokenless-first thesis from Empire Builder's Jordan Oram.
- [Doc 1088](../../business/1088-zaalcaster-empire-builder-coinz-crowdfunding/) - the crowdfunding build plan this call's endpoint details unblock.
- [Doc 780](../780-adrian-empire-builder-zabal-workshop-may26/) - Adrian's prior Empire Builder workshop with Zaal.
- [Doc 719](../719-jordan-empire-builder-zabal-games-may15/) - Jordan Oram's original Empire Builder x ZABAL Games meeting.
- zaalcaster PR #89 (Empire Builder read integration) - live-demoed and verified working on this call.
- zaalcaster PR #90 (Sign In With Farcaster) - the password-to-SIWF request Zaal dictated live on this call.

## Distribution Log

- research doc + transcript: written, this PR
- Meetings index: 1 row added
- Action tracker: 7 items appended (unified Supabase `tasks`, legacy_source `meeting:zaal-x-adrian-empire-builder-zaalcaster--2026-07-14`)
- Bonfire: 6 episodes posted (1 summary, 3 decisions, 2 actions)
- Airtable CRM: 2 contacts (1 new - Adrian) + 1 activity row (`reca4ZF4xzRBnfoJ6`)
- Telegram block: skipped (opt-in, not requested)
- Memory writes: 1 - `project_adrian_empire_builder.md` updated
- Calendar: not checked (no matching event search requested)

## Transcript

Full transcript: [transcript.md](transcript.md)
