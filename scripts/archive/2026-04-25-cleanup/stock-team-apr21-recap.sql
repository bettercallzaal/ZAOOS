-- ============================================================================
-- ZAOstock Apr 21 Meeting Recap + Action Item Todos
-- ============================================================================
-- Writes the post-meeting note (final version) into stock_meeting_notes.
-- Seeds Zaal's top action items as todos in stock_todos.
-- Adds Tyler Stambaugh as an advisory participant (already a member; this
-- re-scopes him as bringing Magnetic into the team).
-- ============================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- Apr 21 Meeting Note: final post-meeting version
-- -----------------------------------------------------------------------

UPDATE stock_meeting_notes
SET
  title = 'ZAOstock Team Meeting - April 21 - Recap',
  attendees = ARRAY['Zaal','DCoop','Shawn','Tyler Stambaugh'],
  notes = E'**Attended:** Zaal, DCoop, Shawn, Tyler Stambaugh (30 min on Discord)\n**Broadcast to:** All 15 teammates (this recap)\n\n---\n\n## Summary\n\nFour of us, focused and fast. Walked through every public page built this week. Locked the team post format. Tyler pulled up with a big Magnetic integration vision for pre-event, day-of, and post-event campaigns. Three of you already have bios in: DCoop, Shawn, Candy. Next step is brand logos + the team promo post.\n\n---\n\n## Immediate wins\n\n- DCoop, Shawn, Candy - bios are IN. Logos are next.\n- Tyler joining the crew as advisory + Magnetic integration lead.\n- Every public page is live: /stock, /stock/program, /stock/cypher, /stock/sponsor/deck, /stock/apply, /stock/llms.txt.\n- ZAOCHELLA Miami (Dec 2024) Cipher being finished + released to promote ZAOstock.\n\n---\n\n## Decisions locked\n\n- **Contributor path = 3 steps, 1 point per step.** Complete all 3 = volunteer eligible for Oct 3.\n  1. Submit your bio\n  2. Share your brand logo URL\n  3. Get your ZAO Festivals team post up (see below)\n- **Team promo post flow:** we curate a post on the @ZAOfestivals account introducing you. The team approves the post before it goes up. Then you + @ZAO + all accounts recast it.\n- **Artist lockin deadline:** 1 month before the event. If not locked, spot goes. Keep internal for now + propose a full timeline.\n- **Discord + Google Meet hybrid starts next week.** This was the last Discord-only meeting.\n- **Tyler Stambaugh officially on the team** as Advisory, bringing Magnetic integration.\n\n---\n\n## Proposed (pending finance team review)\n\n- **Sponsor finders program:** 10% finders fee + 10% organizational fee = 20% to the team member who brings AND stewards a sponsor. Finance team to review + finalize.\n\n---\n\n## Brainstormed (not yet locked, flagging for exploration)\n\n- **Brand packs instead of mega-cipher:** groups of 3 artists per track, genre-flexible, people can be on multiple teams. DaNici has created some brand assets already, lots of flexibility.\n- **Road to ZAOstock** weekly Magnetic drip portal.\n- **Day-of scavenger hunt** via Magnetic. Collect 5+ = post-event merch drop.\n- **Cross-event magnet** with other Maine Craft Weekend events.\n- **Weekly quote-cast recap chain** per contributor intro.\n\n---\n\n## Separately shipping\n\n- **ZAO Web3 music label** (separate from ZAOstock) will help distribute the ZAOCHELLA Miami Cipher + other ZAO artist songs. Artists keep all rights. Cross-promote.\n\n---\n\n## Contributor Path status\n\n| Teammate | Bio | Logo | Team post | Eligible |\n|----------|-----|------|-----------|----------|\n| DCoop | done | next | next | |\n| Shawn | done | next | next | |\n| Candy | done | next | next | |\n| Everyone else | TBD | TBD | TBD | |\n\n---\n\n## Who did not attend\n\nBroadcast going out to: Candy, FailOften, Hurric4n3Ike, Swarthy Hatter, DaNici, AttaBotty, Ohnahji B, DFresh, Craig G, Maceo, Jango. All codes + login link + path coming via DM.\n\n---\n\n## Next meeting\n\nTuesday April 28, 10:00am EST. Hybrid: Discord + Google Meet at the same time. Zaal in both. Join from anywhere.',
  action_items = E'## Zaal (top priorities this week)\n\n- Randomize all 15 login codes and DM each teammate theirs\n- Build suggestion box on /stock for public ideas\n- Set up Ville July 25 magnet as first ZAO Festivals collectible\n- Create attendance magnet for both last week + this week meeting attendees (Sean, Tyler, DCoop get it this week; last week retro)\n- Set up Google Meet integration for next Tuesday\'s hybrid meeting\n- Curate @ZAOfestivals team intro posts for DCoop, Shawn, Candy (team approves before publish)\n- Spec Road to ZAOstock Magnetic portal with Tyler (proposal)\n- Draft internal artist timeline proposal: when artists lock in for Oct 3\n- 1:1 followups with each meeting attendee\n\n## DCoop (Music 2nd)\n\n- Ville July 25 in DC - push to 100 signups via Partyful\n- Contribute to brand-pack cipher format brainstorm with Zaal\n- Approve his @ZAOfestivals intro post before it goes live\n- Keep artist outreach moving (templates at scripts/artist-outreach-templates.md)\n\n## Shawn (Design + Music)\n\n- Step 2: share brand logo URL on profile\n- Step 3: team post will be curated on @ZAOfestivals, approve before publish, recast from all accounts\n- Music subcommittee input on brand packs\n- Keep Web3 music label momentum\n\n## Candy (Ops 2nd)\n\n- Step 2: share brand logo URL\n- Step 3: approve + recast her @ZAOfestivals intro post\n- Review ops permit / venue coordination\n\n## Tyler Stambaugh (Advisory + Magnetic)\n\n- Welcome to the crew\n- Spec Road to ZAOstock Magnetic portal (proposal + timeline)\n- Scope day-of scavenger hunt mechanics\n- Ville July 25 magnet template + QR generator flow\n- Finance team review the proposed sponsor finders 10+10 split\n\n## Everyone else (FailOften, Hurric4n3Ike, Swarthy, DaNici, AttaBotty, Ohnahji, DFresh, Craig, Maceo, Jango)\n\n- Complete the 3-step contributor path this week\n- Bio -> Logo -> Team post\n- Use your 4-letter code at zaoos.com/stock/team\n\n## Team decisions to finalize before next meeting\n\n- Sponsor finders split (finance team)\n- Cypher format (music subcommittee)\n- Artist lockin timeline proposal (Zaal drafts, team reviews)'
WHERE meeting_date = '2026-04-21';

-- -----------------------------------------------------------------------
-- Seed Zaal's top todos from the meeting action items
-- -----------------------------------------------------------------------

WITH z AS (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1)
INSERT INTO stock_todos (title, status, owner_id, created_by, notes) VALUES
  ('Randomize all 15 login codes + DM each teammate', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Currently codes are first 4 letters of name. Security too light. Randomize to 4-char strings, send each person their code privately.'),
  ('Build suggestion box page on /stock', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Anyone can drop a name + suggestion. Shout out contributors. Prevents good ideas from vanishing in Discord scrollback.'),
  ('Create attendance magnet - this week + retroactive last week', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Via Magnetic. This week: Sean, Tyler, DCoop. Last week: retro. Available to anyone who attended either.'),
  ('Google Meet integration for next Tuesday (Apr 28)', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Last Discord-only meeting was today. Next Tuesday: hybrid Discord + Google Meet. Zaal in both. Everyone can join from anywhere.'),
  ('Curate @ZAOfestivals team intro posts (DCoop, Shawn, Candy first)', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Use their submitted bios. Design + draft a post. Send to teammate for approval. Publish on @ZAOfestivals. ZAO + personal + all accounts recast.'),
  ('Spec Road to ZAOstock Magnetic portal with Tyler', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Pre-event drip content portal. Weekly updates. Tyler owns the spec. Zaal owns the content calendar.'),
  ('Draft internal artist lockin timeline proposal', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Keep internal until reviewed with team. Policy: 1 month before event, artist locks in or spot goes. No exceptions. Propose the full timeline for all artist milestones.'),
  ('Set up Ville July 25 magnet as first ZAO Festivals collectible', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'DCoop runs Ville July 25 in DC (100 people via Partyful). First live Magnetic integration for the festival family.'),
  ('Finalize brand packs cypher format with music subcommittee', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'Shift from mega-cipher to groups of 3 per track. DaNici has brand assets. Shawn + DCoop on subcommittee.'),
  ('1:1 followups with Apr 21 attendees', 'todo', (SELECT id FROM z), (SELECT id FROM z), 'DCoop, Shawn, Tyler each get a 1:1 this week.')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------
-- Tyler Stambaugh role bump: Advisory + Magnetic
-- Keep scope as finance (his existing) but role becomes 'advisory'
-- -----------------------------------------------------------------------

UPDATE stock_team_members
SET role = 'advisory'
WHERE name = 'Tyler Stambaugh';

COMMIT;
