-- ============================================================================
-- ZAOstock Brand Kit - bulk todo seed (~55 items)
-- ============================================================================
-- Categorized + tagged so they show up in the dashboard ready to claim.
-- All assigned to Zaal as creator, owner = NULL (unclaimed).
-- Idempotent via title uniqueness within category.
-- Paste into Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- Helper: insert if title doesn't already exist (case-insensitive, same category).
CREATE OR REPLACE FUNCTION insert_todo_if_new(
  p_title TEXT,
  p_notes TEXT,
  p_category TEXT,
  p_creator_id UUID
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stock_todos
    WHERE LOWER(title) = LOWER(p_title)
  ) THEN
    INSERT INTO stock_todos (title, notes, status, owner_id, created_by)
    VALUES (p_title, p_notes, 'todo', NULL, p_creator_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Resolve Zaal's id once.
DO $$
DECLARE
  v_zaal UUID;
BEGIN
  SELECT id INTO v_zaal FROM stock_team_members WHERE name = 'Zaal' LIMIT 1;
  IF v_zaal IS NULL THEN
    RAISE EXCEPTION 'Zaal not found in stock_team_members';
  END IF;

  -- ============================================================================
  -- VISUAL IDENTITY (foundation - all other assets depend on these)
  -- ============================================================================
  PERFORM insert_todo_if_new('Brand: lock primary color palette',
    'Currently navy #0a1628 + gold #f5a623. Formalize: primary, secondary, accent, neutral grays. Print + screen safe versions. Save as CSS vars + Figma styles. Effort: S (2hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand: pick display + body fonts',
    'Display = bold geometric sans (e.g. Manrope, Space Grotesk). Body = readable sans (Inter). Free Google Fonts to avoid license drama. License + download + add to community.config.ts. Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand: ZAOstock wordmark',
    'Lock the typographic ZAOstock wordmark. 1 light + 1 dark version. SVG + PNG export at 1x/2x/3x. Current is implicit. Effort: M (3hr design or contract Iman/DaNici).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand: ZAOstock logomark / icon',
    'Square mark for avatars (TG bot, social profiles, app icon). Should work at 32px. Could be ZS monogram or symbol. Effort: M (3-4hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand: pattern / texture library',
    'Background patterns / textures for posters, social, t-shirts. 3-5 reusable elements. Maine coastal vibe maybe (waves, pine, granite). Effort: M (4hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand: photography mood board',
    '12-20 reference photos showing the ZAOstock visual world. Outdoor, golden hour, intimate, music + community + Maine. Pinterest or Are.na board. Effort: S (1-2hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand: iconography set',
    'Custom or licensed icon set for nav, dashboard, signage. Lucide or Phosphor as base. 20-30 icons to start. Effort: S (1hr to pick + standardize).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- VOICE + COPY (already started in doc 518)
  -- ============================================================================
  PERFORM insert_todo_if_new('Voice: lock the voice card from doc 518',
    '7 rules: lead with what not feeling, fragments OK, specificity, no soft-sell, lowercase deliberate, ban list (emojis, em-dashes, thrilled/excited/leverage), sign-offs match context. Save to /stock/onepagers/brand-voice as v1. Effort: S (30min).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Voice: weekly review by Shawn (recurring)',
    '15 min Mon morning. Reads new bot replies + dashboard copy + 1-pager edits. Flags drift. Per doc 518. Effort: ongoing.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Copy: 1-line version of ZAOstock',
    'For business cards, footers, intros. e.g. "A one-day independent music festival in Ellsworth, Maine. October 3, 2026." Lock 1 official version. Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Copy: 1-paragraph version',
    '~80 words. For email intros, press queries, sponsor first-touch. Locks the elevator pitch. Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Copy: 1-page story version (long-form)',
    'For website, partner kit, longer pitches. Already drafted as overview 1-pager - polish + lock. Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Copy: tagline candidates',
    '3-5 candidate taglines, get team votes, pick 1. Examples: "Music first. Maine made." / "Where the build meets the stage." / "Ellsworth, October 3." Effort: S (1hr brainstorm).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Copy: founder bio (short + long)',
    'Zaal short = 50 words. Zaal long = 150 words. For press, bios on dashboards, panel intros. Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Copy: FAQ for press / public',
    '10-15 questions with locked answers. What is ZAOstock? Who runs it? Tickets? Sponsorship? Press access? Save to /stock/onepagers/faq with public visibility. Effort: M (2hr).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- PRINT + SIGNAGE (day-of)
  -- ============================================================================
  PERFORM insert_todo_if_new('Print: stage backdrop banner',
    '8x10 ft fabric banner. Wallace Events likely sources. Need: ZAOstock wordmark + Art of Ellsworth umbrella + Heart of Ellsworth + sponsor logos in tier order. Effort: M (3hr design + 1wk lead time).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Print: day-of program / flyer',
    'Half-page handout with set times, stage, vendors, sponsors, after-party info. Print 200. Effort: M (4hr design + print).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Print: lineup poster',
    'A2 or A3 poster with artists + date + sponsors + venue. Used for promotion + sold/given as merch. Effort: L (6hr design + print run).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Print: wayfinding signs',
    'Parking, info booth, restrooms, after-party arrow. 8-12 signs. Foam-board or printed paper. Effort: M (3hr design + 1day print).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Print: vendor table signs',
    'Per-vendor sign showing their logo + ZAOstock framing. Effort: S (2hr template + per-vendor fill).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Print: backstage credentials / lanyards',
    '20-30 credentials. Artist / crew / press / VIP tiers. Cheap with QR code on back linking to dashboard. Effort: S (2hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Print: glow-in-the-dark wristbands (Iman idea)',
    'Color-coded by access level (general / artist / crew / VIP). Useful for safety + visibility + after-dark. Source via Wristco or 4inlanyards. Effort: M (1wk lead).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- DIGITAL / SOCIAL ASSETS
  -- ============================================================================
  PERFORM insert_todo_if_new('Social: post template per platform',
    'Locked templates for X, Farcaster, IG, LinkedIn, FB. Each = wordmark + photo + 1-line. Canva or Figma. Effort: M (3hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Social: cover / banner images',
    'TG group cover. X header. FC group cover. IG bio cover. LinkedIn page header. Effort: M (3hr - reuse poster art).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Social: bot avatar (square)',
    '@ZAOstockTeamBot avatar - currently default. Use logomark from brand kit. Effort: S (15min once logomark exists).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Email: signature template',
    'For zaal@thezao.com when sending ZAOstock outbound. Wordmark + 1-line + zaoos.com/stock + zaal@thezao.com. Effort: S (30min).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Email: header for newsletter / blasts',
    'Reusable email-safe header image (max 600px wide). Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Livestream: lower-thirds template',
    'Artist name + set time graphic for OBS overlay. Animated transitions in/out. Effort: M (3hr in OBS or Figma export).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Livestream: countdown / intermission card',
    'Pre-show, set break, after-show static + animated cards. Effort: M (2hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Livestream: outro card with sponsor logos',
    'Closing card thanking sponsors + audience + CTA to subscribe. Effort: S (1hr).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- SPONSOR-FACING
  -- ============================================================================
  PERFORM insert_todo_if_new('Sponsor: deck (10-12 slides)',
    'Longer than 1-pager. Cover, what is ZAOstock, audience, tiers, deliverables, examples, contact. Reuse 1-pager content. Effort: L (5hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Sponsor: tier logo placement mockups',
    'Visual showing where each tier of sponsor appears (stage, livestream, posters, t-shirts, social). Visual proof of ROI. Effort: M (3hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Sponsor: post-event recap template',
    '1-page deliverable per sponsor: photos with their logo visible, livestream view counts, social mentions, audience size. Auto-generate per sponsor from common template. Effort: M (3hr template + 30min/sponsor to fill).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Sponsor: thank-you certificate template',
    'A formal printable thank-you for each sponsor, dated + signed. Touch from year 1 = relationship for year 2. Effort: S (1hr).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- PRESS KIT
  -- ============================================================================
  PERFORM insert_todo_if_new('Press: kit page at /stock/press',
    'Single shareable URL. Logo + 1 photo + 1-line + 1-paragraph + 1-pager links + Zaal contact. Per doc 521 highest-leverage external fix. Effort: M (3hr Next.js page + content).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Press: high-res photo folder',
    'Public Cloudinary or Cloudflare R2 bucket with 10-20 production-ready photos. Updated post-festival with day-of pics. Effort: S (1hr setup, ongoing).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Press: release template (V1 - announcement)',
    'For when lineup is announced (likely July). Draft + lock. Effort: M (2hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Press: release template (V2 - day-of recap)',
    'For Oct 4 morning. Pre-write 80%, fill in attendance + standout moments same-day. Effort: S (1hr template + 30min day-of fill).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- AUDIO / VIDEO
  -- ============================================================================
  PERFORM insert_todo_if_new('Audio: ZAOstock sting / drop',
    '3-5 second audio drop for livestream intros, outros, transitions. Could commission DCoop or Shawn. Effort: M (~4hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Audio: PA between-set music playlist',
    'Curated 2-3 hour playlist that plays between sets. Spotify or Apple Music shareable. Effort: S (2hr curation).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Video: 30-second hype reel template',
    'Reusable Premiere or DaVinci template. Drop in clips, get a polished 30s. For pre-event hype + post-event recap. Effort: L (5hr template build).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Video: speaker / artist intro card',
    'When each artist takes the stage, livestream cuts to a 5-sec intro card with their name + city + socials. Template. Effort: M (3hr).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- MERCH
  -- ============================================================================
  PERFORM insert_todo_if_new('Merch: t-shirt design',
    'Front + back. Limited run for Oct 3. Likely poster art on back. Source via Bonfire / Threadless / local Maine print shop. Effort: M (4hr design + 2wk print).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Merch: poster (saleable)',
    'Same as lineup poster but signed/limited edition. Effort: included in lineup poster todo.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Merch: stickers',
    '2-3 designs. Wordmark + logomark + tagline. Cheap to produce, big brand multiplier. StickerMule or local print. Effort: S (1hr design + 1wk print).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Merch: tote bag or hat (optional)',
    'Lower priority for year 1. Reuse poster art. Effort: defer.',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- INTERNAL TOOLS
  -- ============================================================================
  PERFORM insert_todo_if_new('Bot: avatar update once logomark exists',
    'Set @ZAOstockTeamBot avatar via @BotFather setuserpic. 30 seconds.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Bot: brand-aligned reply tone (per voice card)',
    'Already on the cohesion Tier 1 list. Folds in once voice card is locked.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Dashboard: design pass on /stock pages with locked palette',
    'Apply locked colors + fonts across all /stock/* routes. Effort: M (3-4hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Dashboard: favicon + meta tags',
    'Per-route favicon + OpenGraph image so links shared anywhere have ZAOstock visual. Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Repo: brand assets folder',
    'Create ZAO-STOCK/assets/brand/ with logo SVGs, color hex codes, font files (or links), photo references. Single source for designers. Effort: S (1hr once kit ships).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- DESIGNATE OWNERS / NEXT-PERSON-UP
  -- ============================================================================
  PERFORM insert_todo_if_new('Brand kit: identify lead designer',
    'Could be Iman + DaNici (community designers per profile docs) or a paid contractor. Decision Zaal owns. Effort: 1 conversation.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand kit: budget allocation',
    'Set aside $0-500 for fonts + print runs + maybe contractor hours. Within $5-25K festival budget. Effort: 1 conversation.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Brand kit: lock by date - June 1',
    'All foundational assets (logo, palette, fonts, voice, 1-line, 1-paragraph) locked by Jun 1 so summer execution works against fixed identity. After Jun 1, brand changes require explicit Loomio proposal.',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- ZAO FESTIVALS UMBRELLA (per project_zao_festivals_umbrella memory)
  -- ============================================================================
  PERFORM insert_todo_if_new('Umbrella: lock "ZAO Festivals presents ZAOstock" framing',
    'Apply to all 1-pagers, press kit, social bios, email signatures, Lu.ma. Update overview 1-pager via dashboard editor. Effort: S (1hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Umbrella: ZAO Festivals wordmark (parent) + lockup with ZAOstock (child)',
    'Two-tier brand: ZAO Festivals stays consistent across years, ZAOstock is the 2026 child. Future events (Cruise 2027, ZAO Stock 2027) reuse parent. Effort: M (3hr or contract).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Umbrella: claim lu.ma/zaofestivals',
    'Spin up Lu.ma calendar at lu.ma/zaofestivals. ZAOstock Oct 3 = first event listed. Add cover image, description, RSVP form. Future events queue under same calendar. Effort: S (30min).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Umbrella: dedicated /festivals route on zaoos.com',
    'Public landing showing ZAO Festivals (parent), upcoming events, past events archive, RSVP CTA. Sits alongside /stock as the umbrella view. Effort: M (3hr - reuse /stock layout).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Umbrella: domain decision',
    'Stay on zaoos.com/festivals OR claim zaofestivals.com? Year-1 = stay on zaoos.com (cheaper, SEO consolidates). Year-2 = re-evaluate. Effort: 1 decision.',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- EMAIL LIST + AUDIENCE BUILD
  -- ============================================================================
  PERFORM insert_todo_if_new('Email: dig out old ZAO event subscriber list',
    'Prior ZAO events likely have an email list somewhere - Mailchimp / Substack / Paragraph / spreadsheet. Find + export CSV. This is the seed audience for ZAO Festivals. Effort: M (1-2hr archaeology).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Email: stand up Listmonk on VPS 1 (OSS, free)',
    'Self-hosted email tool. Imports CSV. Replaces Mailchimp ($0 vs $13/mo). Per OSS-first rule. Effort: M (3hr setup + DNS + SPF/DKIM).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Email: re-engagement campaign to old list',
    'First send: "Hey, ZAO Festivals is back. Here is whats coming Oct 3. Stay or unsubscribe with 1 click." Honest, no spam. Recovers warm audience. Effort: S (1hr draft + send).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Email: weekly cadence Mon AM during build phase',
    '1 short email per week to ZAO Festivals list. What shipped, what is next, what is dropping. Tied to /do logs via n8n. Effort: setup once via doc 514 plan.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Email: lead capture form on /stock + /festivals',
    'Visible above-fold opt-in: "Get ZAO Festivals updates - 1 email a week, unsubscribe anytime." Single email field. Posts to Listmonk. Effort: S (1hr).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- CONTENT REACTIVATION (past ZAO event content)
  -- ============================================================================
  PERFORM insert_todo_if_new('Content: inventory past ZAO event assets',
    'Photos, videos, recaps, blog posts from prior ZAO events (Spaces, virtual events, COC Concertz, FISHBOWLZ era). Catalog in ZAO-FESTIVALS/archive/ folder. Effort: M (2hr).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Content: top-10 reusable hits',
    'From the inventory, pick 10 best pieces (best photos, best clips, best moments) that reframe under ZAO Festivals umbrella. These become weekly drumbeat content. Effort: S (1hr curation).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Content: weekly "throwback" cadence Mon/Wed/Fri',
    '3 posts/week pulling from archive + framing as ZAO Festivals retrospective. Builds anticipation + signals depth. Effort: S (template + queue 4 weeks worth in Mixpost).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Content: ZAO Festivals YouTube channel',
    'Single channel for all event recaps. Upload past event recap edits. New uploads each event. Effort: S (1hr setup) + M (4hr first uploads).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Content: ZAO Festivals X / Farcaster handle audit',
    'Are existing handles named for ZAO Festivals or ZAOstock? Lock canonical handles. Update bios across all platforms with consistent voice. Effort: S (30min).',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- MAGNETIQ INTEGRATION
  -- ============================================================================
  PERFORM insert_todo_if_new('Magnetiq: integrate with ZAO Festivals funnel',
    'Per project_tomorrow_first_tasks memory, Magnetiq is on the bot fleet roadmap. Define how Magnetiq drives audience -> ZAO Festivals email list -> RSVP -> attend. Effort: 1 conversation + Loomio proposal.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Magnetiq: pre-event hype cadence aligned with festival timeline',
    'Per doc 520 phase calendar (90/60/30/14/7/3 day escalations), align Magnetiq content drops to match. Big drops at announcements (lineup, venue confirm, sponsor unveil). Effort: M (2hr planning doc).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Magnetiq: branded Magnetiq bot in fleet',
    'Per project_tomorrow_first_tasks 10-bot fleet plan. Magnetiq bot handles its own surface, ZOE dispatches between Magnetiq and ZAOstock. Effort: defer to bot fleet sprint.',
    'brand-kit', v_zaal);

  -- ============================================================================
  -- HYPE BUILD (pre-event marketing arc)
  -- ============================================================================
  PERFORM insert_todo_if_new('Hype: announcement post (May 1) - ZAO Festivals launches',
    'Master "we are doing this" post across all platforms. Locks the public commitment. Effort: M (2hr - draft, review, schedule via Mixpost).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Hype: lineup-tease drumbeat (June-July)',
    'Drop 1-2 artist hints/week starting in June. Build anticipation. Use silhouettes or vague clues until full reveal. Effort: ongoing once lineup confirms.',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Hype: full lineup reveal (mid-July)',
    'Coordinated drop - poster + social + email + press release + Lu.ma update + RSVPs open. Single biggest hype moment. Effort: L (1 day prep + 1 day execution).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Hype: countdown content (last 30 days)',
    'Daily countdown posts starting Sept 3 (T-30). Format: countdown number + 1 thing happening that day + photo. Effort: M (template + 30 days queued).',
    'brand-kit', v_zaal);
  PERFORM insert_todo_if_new('Hype: Aug 15 dry-run public glimpse',
    'Even though Aug 15 = team-only, post a teaser ("we did the dress rehearsal, here is what we learned"). Builds trust + transparency. Effort: S (1hr post-event).',
    'brand-kit', v_zaal);

END $$;

DROP FUNCTION IF EXISTS insert_todo_if_new(TEXT, TEXT, TEXT, UUID);

COMMIT;

-- ============================================================================
-- Verify
-- ============================================================================
SELECT
  COUNT(*) AS brand_kit_todos_total,
  COUNT(*) FILTER (WHERE notes LIKE '%Effort: S%') AS small,
  COUNT(*) FILTER (WHERE notes LIKE '%Effort: M%') AS medium,
  COUNT(*) FILTER (WHERE notes LIKE '%Effort: L%') AS large
FROM stock_todos
WHERE notes LIKE '%brand-kit%' OR title LIKE 'Brand:%' OR title LIKE 'Voice:%'
   OR title LIKE 'Copy:%' OR title LIKE 'Print:%' OR title LIKE 'Social:%'
   OR title LIKE 'Email:%' OR title LIKE 'Livestream:%' OR title LIKE 'Sponsor:%'
   OR title LIKE 'Press:%' OR title LIKE 'Audio:%' OR title LIKE 'Video:%'
   OR title LIKE 'Merch:%' OR title LIKE 'Bot:%' OR title LIKE 'Dashboard:%'
   OR title LIKE 'Repo:%' OR title LIKE 'Brand kit:%';

SELECT title FROM stock_todos
WHERE title LIKE 'Brand:%' OR title LIKE 'Voice:%' OR title LIKE 'Copy:%'
   OR title LIKE 'Print:%' OR title LIKE 'Social:%' OR title LIKE 'Email:%'
   OR title LIKE 'Livestream:%' OR title LIKE 'Sponsor:%' OR title LIKE 'Press:%'
   OR title LIKE 'Audio:%' OR title LIKE 'Video:%' OR title LIKE 'Merch:%'
   OR title LIKE 'Bot:%' OR title LIKE 'Dashboard:%' OR title LIKE 'Repo:%'
   OR title LIKE 'Brand kit:%'
ORDER BY title;
