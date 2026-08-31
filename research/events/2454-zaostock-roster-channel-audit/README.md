# ZAOstock roster and contact-channel audit

**Date:** 2026-08-31, 33 days out from the festival on 3 October
**Method:** measured, not remembered - SQL against the cowork `contacts` table,
the vault's `people/` directory, `src/content/site.ts`, and the Ellsworth Area
Chamber's own website fetched live
**Scope:** every person involved in ZAOstock in any way, and specifically **how
each one is actually reached**

> **Contact details are deliberately NOT in this document.** ZAOOS is a public
> repo. Addresses, phone numbers and handles live in the vault at
> `~/zao-vault/projects/zaostock-roster-and-channels-2026-08-31.md`. This doc
> carries the structure - who exists, what channel TYPE reaches them, what is
> open against each - so the roster is searchable without publishing a contact
> book. Per `.claude/rules/pii-hygiene.md`.
>
> Names already public on the site or in the programme are used freely here.
> Where a line is unflattering about a specific person - a performer dropped, a
> contact flagged with no recorded purpose - the name is held back and lives in
> the vault copy instead. That asymmetry is deliberate, not an oversight.

## The headline: the most-owed person on the event is not in the system

**Steve Peer has zero rows in the contacts database.** Searched by name: nothing.

He owns the venue, the logistics, the sound, the indoor half of the day, the PA
decision gated on 11 September, the $20 performer gift certificates, the
porta-potty warning that is still unpriced, and the unconfirmed 20:00-22:00
hip-hop group that would otherwise leave the last two hours of the festival with
no act. He also performs twice, with The Crown Vics.

Six open questions point at him. The performer headcount owed to him is the only
Black Moon item with a hard deadline, due **end of this week**. And he is absent
from the system that is supposed to record who owes what to whom.

There is a `Steve Trader` row - status `new`, priority medium, tagged `ellsworth`
and `zaostock`, captured in the 2026-08-16 OneNote sweep - which may be a
mis-captured Steve Peer. **Unverified. It should not be merged on an agent's
guess.**

## The structural problem

There is no single place where "how do I reach this person" lives.

| Source | Records a channel? | Measured |
|---|---|---|
| Cowork CRM `contacts` | Barely | **30 of 1,211** rows carry an email (2.5%); **38** carry a phone (3.1%) |
| `~/zao-vault/people/` | Almost never | 50 files, nearly none record a handle |
| `src/content/site.ts` PARTNERS | Owner name only | 9 partners, a `poc`, no channel |

So "how do I reach X" is reconstructed from memory on each attempt. That is the
mechanism behind all three of the failures below - none of them were bad luck.

### Three failures with the same root cause

1. **A dead address stayed the default.** The address held for Candy hard-bounced
   in May. She is reachable on Telegram, Discord and in person. Nothing recorded
   the working channel, so the dead one kept getting reached for.
2. **A name was wrong in the first word of a cold email.** The CRM spells the
   Chamber's Director of Operations "Kaitlen". The Chamber's own site spells it
   **Katelin** - verified by fetching their contact and staff pages today. The
   CRM row is both misspelled and carries no address at all.
3. **A contact may no longer exist.** The Chamber's Member Services contact
   appears on neither the Chamber's contact page nor its staff page. He may have
   left. The CRM *does* hold an address and phone for him, so an earlier claim
   that we had no way to reach him was itself wrong - the risk is not a missing
   address but a stale one.

The third correction cuts both ways and is worth stating plainly: the sponsorship
ask was aimed at Member Services specifically, and the email that would have gone
to him went to two colleagues instead.

## Measured CRM state

| Metric | Value |
|---|---|
| Total contacts | **1,211** |
| Flagged high priority | **11** |
| Of those 11, still at status `new` | **11 - every one** |
| Rows with any follow-up date | **2 of 1,211** |
| Status split | active 1,036 / lead 125 / new 50 |

One correction to a figure in circulation: "all ~1,198 contacts sit at status
`new`" is **false**. Most rows are `active`. What is true is narrower and worse -
the **11 rows somebody deliberately flagged as high priority** have never moved
off `new`, and only two rows in the entire base have a follow-up date. High
priority with no next date is a wish, not a plan.

Of those 11 high-priority contacts, **only three carry any channel at all.** The
list includes the only publicly-announced act on the bill, the Black Moon
principal, and two people flagged high priority with no recorded channel and no
recorded ask.

## Duplicate rows are hiding channels we already have

The Black Moon principal exists as **two separate rows**. The one flagged high
priority has no email and no phone. The other one - not flagged, differently
named - carries both.

So "we have never had a way to contact Black Moon directly" is false. The channel
has been in the database the whole time, on the row nobody opens. At least
thirteen names in the base are duplicated this way.

## Roster coverage by group

Counts of who is recorded versus who is actually involved.

| Group | In the roster | Missing from the CRM entirely |
|---|---|---|
| Core team | 11 | Steve Peer |
| Performers | 7 acts | Michael Anderson, The Crown Vics, Acadia Rising / Sen Wilde |
| Partners | 9, all confirmed | Web3Metal, Bomb Squad |
| Ellsworth local | 13 | Parks and Rec parklet contact, both gift-card leads, the insurance broker, both Heart of Ellsworth contacts |
| ZAO side | 8 | The Artizen match holder |

Two group sizes are unknown - The Crown Vics and Acadia Rising - and those two
unknowns are what block the performer headcount owed to Black Moon this week.
The headcount is not late because nobody did it; it is a number that cannot be
assembled yet.

## Gaps in the partner list itself

Read from `src/content/site.ts`, where all nine partners are `confirmed: true`:

- **COC Concertz** carries `role: 'UNSET'` and `poc: 'UNSET'`. A confirmed
  partner that nobody owns and whose role is undefined.
- **Town of Ellsworth** and **ENTERACT** are confirmed partners with **no logo
  file** anywhere in the repo. Both are named on the flyer question.

## A stale flag worth clearing

One performer is still flagged **high priority, status `new`** in the CRM. He is
out of the festival - he never replied, which was an outcome rather than a
decision. The flag has not been cleared, so the system still presents him as an
active priority.

## An identity that must not be resolved by guessing

An artist named on the 31 August Dcoop call, alongside the only public act, was
transcribed two ways. The CRM holds **three distinct entities** whose names
collapse under a loose search - one of them an artist by that literal name from
the web3 music scene, one a Farcaster handle, one a media channel.

The evidence points away from the assumption a reader would most naturally make.
Zaal was asked and expressed no preference, so **this stays unresolved**. A wrong
identity in a roster is worse than a blank one, because the blank gets asked
about and the wrong one gets used.

## The fix worth making once

**Record the channel that works, not the address that exists.** A `channel` field
holding "Telegram", "Discord", "in person", "via Steve" would have prevented the
May bounce from repeating, and would make the 97.5% of rows with no email
honestly empty rather than silently useless.

Second: high priority should imply a next date. Eleven flagged, two dates in the
whole base.

## Open questions only Zaal can answer

1. Is the `Steve Trader` row actually Steve Peer, or a different person?
2. Which of the six people named Eric in the base is the merch print contact?
3. Who owns COC Concertz as a partner - both role and POC are UNSET?
4. Who is Matt, present on the 31 August Dcoop call and silent, with zero hits
   anywhere in the vault or research?
5. Is the insurance advisor still worth pulling in, or does the broker cover it?
6. What is the ask for the two high-priority Bar Harbor contacts who have no
   channel and no recorded purpose?
7. Who is the unnamed person sourcing sound help locally, referred to twice on
   the Dcoop call?

## Related

- Doc 2453 - the Dcoop call that surfaced the sound hire and reopened the DJ
- Doc 2452 - the 31 August standup
- Vault: `projects/zaostock-roster-and-channels-2026-08-31.md` - the same roster
  WITH channels, private
