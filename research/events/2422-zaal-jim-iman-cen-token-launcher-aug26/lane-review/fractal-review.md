# Lane review - fractal

Advisory. Most of this meeting is token-launcher work and is not this lane's.
Four things where the fractal repo holds context the recording could not.

## 1. Corrections

**Hypersnap is not an open question for ZAO - it was resolved and the position
is published.** Action 7 sends Jim a Hypersnap video as new information. It is
new to Jim, but ZAO already has a decision, now public in `ROADMAP.md` (commit
`fecda82`): **L4 is built as an application on the Farcaster network, with no
node required at that level**, and node ownership is deferred to L7. Anyone
reading this recap later should not treat the video as reopening that.

The internal reasoning behind it was deliberately kept out of the public
roadmap - it includes an assessment of a named third party's repository, and
publishing that in our own roadmap was a needless swipe at a partner. If Jim
takes the video as a prompt to propose ZAO self-hosting, the short version is:
build at app level now, and if ZAO ever self-hosts, the stack choice is not
automatic. Whoever briefs him should get that from the vault note, not from me.

**No correction to offer on the token-launcher decisions.** Nothing in this
repo bears on the CEN launcher, SongChain, or the Artizen round, and I am not
going to manufacture one. Items 1-6 and actions 1-6, 8, 10 are outside this
lane.

## 2. Missing context

**Iman is one of three people named to ZAO's facilitator bench, and has still
not been asked.** `respect/FACILITATION-RUNBOOK.md` names Ohnahji B, Iman and
Jose, and states four times, including in its header, that **nobody on the
bench has been contacted, asked, or has agreed to anything**. Zaal reconfirmed
on 2026-08-26 that the names stay public on that basis.

This matters for a reader in three weeks. A recap showing Zaal and Iman
collaborating closely on a token launch could easily be read as the bench
having been approached. **It has not been, as of this meeting.** That language
is load-bearing - it is what makes naming an unasked bench defensible - and
`scripts/verify-claims.mjs` now asserts it so an edit cannot trim it quietly.

**Iman has no wallet in ZAO's member registry.** He does not appear anywhere in
`data/members.json` - not among the 144 named members, and not among the 169
addresses that have ever held Respect. This is a gap in ZAO's data or a role
outside the Monday game; it is **not** evidence about him.

It is operationally relevant here for one reason: he is about to have a token
with a wallet attached, while ZAO's own registry cannot resolve him. Open call
2 in the facilitation runbook is exactly this question, and it is a five-minute
fix that is currently a first-night blocker for facilitation. If anyone is
already collecting an address from him for the token launch, that is the cheap
moment to also get it registered.

**Respect is not the kind of token being discussed here, and the recap should
not let them blur.** Actions 3 and 4 concern launching tradeable tokens and a
factory that would let ZAO community members launch their own. ZAO's Respect
is soulbound at the contract level - all transfers revert, and across 518
transfers on the OG ledger there have been zero peer-to-peer transfers
(whitepaper ch04). Nothing in a community-token launcher touches Respect, and
Respect becoming transferable would collapse the governance model. Worth one
sentence in the recap so a later reader does not connect them.

## 3. Actions I own

**None.** Every action on the list is token-launcher, ops, or social work.
Action 7 touches subject matter this lane owns, but the action itself is Zaal
sending Jim a video, which is not this lane's work to do.

The nearest thing to a fractal action in this meeting is not on the list and I
am not adding it: registering Iman's wallet is open call 2 in the facilitation
runbook already, and it predates this meeting.

## 4. Actions that should not exist

**None I can verify.** I do not have the tracker from here, so I cannot check
for duplicate open cards, and I am not going to guess at duplicates I cannot
see.

One flag rather than a deletion: **action 9, bringing Thy Revolution into the
CEN DAO conversation, involves a person who was on the call but inaudible on
all three tracks.** Whatever is recorded about his position should be sourced
to Jim's prior DM or to a follow-up with him directly, not to this recording,
which contains nothing from him.
