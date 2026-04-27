-- ============================================================================
-- ZAOstock Tuesday Apr 28 Meeting Agenda
-- ============================================================================
-- Continues the standing 10am Tuesday cadence. First hybrid meeting (Discord +
-- Google Meet). Format mirrors Apr 21 (v3): brief context, live touchpoints,
-- circle round-robin, decisions. Same day, Zaal meets Roddy at City Hall 5pm
-- so this meeting also collects team input for that conversation.
--
-- Idempotent. Safe to re-run. Uses delete-then-insert because
-- stock_meeting_notes has no unique constraint on meeting_date.
-- ============================================================================

BEGIN;

DELETE FROM stock_meeting_notes
WHERE meeting_date = '2026-04-28'
  AND title LIKE 'ZAOstock Team Meeting%';

INSERT INTO stock_meeting_notes (meeting_date, title, notes)
VALUES (
  '2026-04-28',
  'ZAOstock Team Meeting - April 28, 10:00am EST',
  E'# Agenda - Tuesday April 28, 10:00am EST\n\n**Time:** Tuesday April 28, 10:00am EST (60 min max, target 50)\n**Format:** Discord + Google Meet hybrid - join from wherever\n**Same day later:** Zaal meets Roddy (Parks/Rec) at Ellsworth City Hall, 5:00pm. Bring asks for that meeting to this call.\n\n**Core principle (Tricky Buddha Space):** Music first, Community second, Technology third.\n\n---\n\n## Pre-reads (5 min before the call)\n\n- **NEW Overview onepager** - the brand + festival in one page: zaoos.com/stock/onepagers/overview\n- **Dashboard** - log in with your 4-letter code, drop a bio + photo: zaoos.com/stock/team\n- **Team bot live** - DM @ZAOstockTeamBot, hit /help. Linked from this group too.\n- **Circles** - 8 circles defined: zaoos.com/stock/onepagers/circle-checklists\n\n## Cadence note\n\nLast Discord-only meeting was April 21. This is the first **hybrid** week. Zaal runs both Discord + Meet at the same time. Pick whichever feels easier - voice quality is fine on both.\n\n---\n\n## 10:00-10:10 (10 min) - Where we are\n\n- 158 days to Oct 3\n- Roddy meeting locked: today 5pm at City Hall\n- New overview onepager is live (replaces the multi-onepager confusion)\n- Bot shipped: /circles + /join + /link fuzzy match working\n- 14 teammates pre-linked, 3 fully linked, 6 still no-handle-on-file\n- 5 new teammates added (Stilo, Eve, Bacon, Eduard, Thy Revolution)\n- Geek renamed to GeekMyth\n\n## 10:10-10:35 (25 min) - Circle round-robin\n\n2-3 min per circle. Each circle lead gives:\n- 1 thing moved this week\n- 1 thing blocked or stuck\n- 1 ask for the team\n\nOrder:\n1. **Music** (DCoop / Shawn) - artist pipeline status, sound plan, Cypher prep\n2. **Ops** (Zaal + crew) - venue, power, tents, vendors, permits\n3. **Partners** (Zaal) - sponsors (committed $ + pipeline), Wallace Events, local biz\n4. **Finance** (Tyler advisory) - budget snapshot, fiscal sponsor flow\n5. **Marketing** - socials, newsletter, local press, signage\n6. **Media** - photo / video / docs pipeline\n7. **Merch** - T-shirts, posters, day-of merch\n8. **Host** - artist hospitality, volunteer coordination\n\nIf a circle has no lead yet: name it on the call so we can fill it.\n\n## 10:35-10:45 (10 min) - Roddy meeting prep\n\nZaal sees Roddy at City Hall 5:00pm today. He owns Parks/Rec. We want him as our advocate inside the city.\n\n**Bring asks:**\n- Anything you want me to surface with him?\n- The city is running ~10 Thursday-night concerts at the same venue June-Sept - we want in. What\'s the path?\n- Permits, electrical, security, trash, public-safety contacts\n- Year 1 = relationship. We are NOT asking for money. We ARE asking for his voice in the room.\n\n**What I will NOT do:**\n- Lock dates beyond Oct 3 + this 4/28 meeting\n- Promise anything about scale or attendance\n- Ask him to put us on his books\n\n## 10:45-10:55 (10 min) - Open asks + blockers\n\n- Anyone blocked on a teammate? Name it now.\n- Anyone need a hand from another circle? Name it now.\n- Sponsor pipeline - who do we know that we haven\'t pinged?\n\n## 10:55-11:00 (5 min) - Wrap + commitments\n\nEach person commits to **1 thing through May 5** (1 week from today). Drop it in chat after the call so we have a written record.\n\nNext call: **Tuesday May 5, 10:00am EST** - same hybrid format.\n\n---\n\n## Contributor path (everyone, ongoing)\n\nEach step = 1 ZAOfestivals Point, paid post-event.\n\n- Step 1: Submit your bio (zaoos.com/stock/team)\n- Step 2: Square profile photo on the team page\n- Step 3: Join at least 1 circle (/join <slug> in the bot)\n- Step 4 (coming): TBD reveal next week\n\n## After the meeting (action items live in chat + dashboard)\n\n- Each circle lead drops their commitment in #zaostock-team in TG\n- Zaal posts the Roddy meeting recap in TG by 8pm Tuesday\n- Action items show up on the dashboard at zaoos.com/stock/team -> Notes tab'
);

COMMIT;
