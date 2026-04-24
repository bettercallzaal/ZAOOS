# 11 — Contributor Onboarding, Skill Extraction & Task Matching

> **Status:** Research iteration 11 - ready to ship
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Days out:** 163
> **Scope:** AI-assisted new contributor intake, social skill extraction, role recommendation, first-week guidance, buddy matching, knowledge base Q&A, and access provisioning

---

## Pareto 80/20

**Top pattern:** New applicant fills bio form → Claude extracts skills from Farcaster/X/LinkedIn profiles → suggests best scope (ops/music/design) + ranked starter tasks → auto-drafts intro post. One async flow replaces 30 min Zaal intake call.

**One integration to wire:** Supabase `stock_applicant` form + Claude API for skill extraction + Neynar/X APIs for profile crawl + Farcaster SDK for auto-post.

---

## Current State

- 17 active contributors; growth target: +8-10 by Aug 31
- `/stock/apply` form exists (basic name/email/bio)
- No skill extraction, role matching, or onboarding checklists yet
- No buddy assignment or access auto-provisioning
- Knowledge base (320+ research docs) not surfaced in onboarding
- No drop-off tracking (who completes first 3 tasks vs abandons)

**Files to extend:**
- `src/app/stock/apply/page.tsx` — enhanced form + real-time profile fetch
- `src/app/api/stock/applicants/[id]/enrich` — POST route for skill extraction + suggestion
- `src/app/api/stock/applicants/[id]/onboarding-checklist` — personalized first-week tasks
- `src/app/api/stock/team/buddy-match` — pair with existing teammate
- `src/components/stock/BioEditor.tsx` — auto-intro post draft (partially done per doc 476)

---

## 1. Bio Intake + Profile Skill Extraction

### Why It Matters

Zaal manually reviews 10 applicants × 20 min = 3+ hours. LLM can crawl Farcaster/X/LinkedIn profiles in 2 sec, extract: music production skills, design background, operations experience, social media reach, network size.

**Example:**
- Bio: "I work in tech. Love music. Based in Maine."
- X profile crawl: tweets about Docker, event production, band management
- Farcaster profile: 200 followers, active in Ellsworth community, no music posts
- **Suggestion:** `[ops]` (tech + event background), `[music]` second choice
- **Reasoning:** "Tech ops, community presence. Could own sponsors or runofshow."

### Implementation

**Tech stack:**
- Supabase form intake (`stock_applicants` table)
- Neynar API for Farcaster profile crawl
- X API (or jsDelivr for public tweets) for social feed
- Claude API for skill extraction + scope matching
- Store extracted skills in `stock_applicants.extracted_skills` (JSON)

**Prompt template (skill extraction):**
```
Extract professional + community skills from applicant profile.

Name: {name}
Bio (provided): {bio}
Farcaster profile (@{username}):
- Followers: {count}
- Recent posts (5): {posts}
- Network: {communities mentioned}

X profile (@{username}):
- Followers: {count}
- Recent tweets (10): {tweets}
- Topics: {inferred topics}

LinkedIn (if available):
- Headline: {headline}
- Experience: {list}
- Skills: {list}

Extract JSON:
{
  "hard_skills": ["skill1", "skill2"],
  "soft_skills": ["leadership", "communication"],
  "music_experience": "description or null",
  "ops_experience": "description or null",
  "design_experience": "description or null",
  "network_size": "estimated number",
  "follower_reach": {farcaster: number, x: number},
  "community_alignment": "description",
  "confidence": 0-1
}
```

**Scope-matching prompt (second call):**
```
Given extracted skills + festival needs, suggest best scope fit.

Skills: {extracted_skills JSON}
Festival needs (Oct 3):
- ops: sponsor outreach, volunteer coordination, budget, logistics
- music: artist discovery, rider intake, stage coordination, setlist planning
- design: visual brand, merch, signage, social content templates

Suggest:
{
  "primary_scope": "ops" | "music" | "design",
  "secondary_scope": "ops" | "music" | "design" | null,
  "confidence": 0-1,
  "reasoning": "one sentence",
  "flag": "beginner" | "experienced" | "specialist"
}
```

**API endpoint (new):**
```
POST /api/stock/applicants/[id]/enrich
{ bio: string, farcaster_handle?: string, x_handle?: string, linkedin_url?: string }
=> {
  extracted_skills: {...},
  scope_match: { primary, secondary, confidence, reasoning },
  first_contact_template: "string"
}
```

**Workflow:**
1. Applicant fills form: name, bio, Farcaster/X handle (optional)
2. Form submitted → triggers `POST /enrich`
3. Async: crawl Farcaster/X for profiles, extract skills, run scope matcher
4. Result stored in `stock_applicants.extracted_skills` + `stock_applicants.suggested_scope`
5. Dashboard shows Zaal: "[Applicant Name] suggests [SCOPE] based on [tech skills, 200 FC followers]"
6. Zaal clicks approve → triggers onboarding flow

**Database schema:**
```sql
ALTER TABLE stock_applicants ADD COLUMN (
  farcaster_handle TEXT,
  x_handle TEXT,
  linkedin_url TEXT,
  extracted_skills JSONB,
  suggested_scope TEXT,
  suggested_scope_confidence DECIMAL(3,2),
  primary_scope_match TEXT,
  secondary_scope_match TEXT,
  scope_approved_at TIMESTAMP,
  scope_approved_by TEXT
);
```

**Cost:** Neynar free tier (10k calls/mo). X API ~$5/mo for project access. Claude batch = $0.001 per applicant. 10 applicants = $0.01.

**Pareto win:** Cuts intake from 3+ hours to 15 min (review extracted skills + click approve).

---

## 2. Role-Match Scoring (Skill → Starter Task Ranking)

### Why It Matters

25+ tasks available (doc 270, 428). Which 3 should a new ops-lead start with? LLM can rank tasks by skill alignment, complexity, time, and impact.

**Example:**
- New contributor: tech-ops person, 18 months event experience
- Available ops tasks: sponsor intake (lead), volunteer scheduling (2nd), budget tracking (member)
- **Ranked matches:**
  1. **[HIGH MATCH]** Sponsor intake (tech + sales angle, lead role fits)
  2. **[MEDIUM]** Budget tracking (detail-oriented but might bore tech person)
  3. **[LOW]** Volunteer scheduling (not using core skills)

### Implementation

**Tech stack:**
- Supabase `stock_tasks` table (all 25 festival tasks)
- Claude API for skill-task matching + ranking
- Store matches in `stock_applicant_task_matches` (junction table)

**Task schema (already exists per doc 270):**
```sql
-- Assume stock_tasks has:
id, name, scope, role_needed, skills_needed, time_estimate, impact_score, owner_id
```

**Prompt template (task matching):**
```
Given a new contributor + their skills, rank available tasks by fit.

Contributor: {name}
Skills: {extracted_skills_json}
Scope: {scope}
Flag: {beginner | experienced | specialist}

Available tasks for this scope:
{tasks: [{ name, role_needed, skills_needed[], time_estimate_hours, impact_score, current_owner }]}

Rank (best to worst) based on:
1. Skill alignment (do they have 80%+ of skills needed?)
2. Role fit (are they lead, 2nd, or member?)
3. Time fit (can they do this in 5-10 hours before Sep 1?)
4. Impact (festival-critical vs nice-to-have)
5. Learning (does task teach valuable ZAO skill?)

Output JSON array (top 5):
[
  {
    "task_name": "string",
    "match_score": 0-100,
    "reasoning": "one sentence",
    "time_estimate": "X hours",
    "skill_gap": ["skill_needed"],
    "buddy_note": "who to pair with for training"
  }
]
```

**API endpoint (new):**
```
POST /api/stock/applicants/[id]/task-matches
{ applicant_id: "uuid", scope: "ops" | "music" | "design" }
=> { top_tasks: [...], onboarding_checklist: [...] }
```

**Workflow:**
1. Scope approved (step 1 complete)
2. Trigger `POST /task-matches`
3. Claude ranks available tasks for that scope
4. Top 3 automatically added to `stock_applicant_onboarding_checklists`
5. Email sent to applicant: "Your first 3 tasks: [1] [2] [3]. Estimated time: 10-15 hours over 4 weeks."
6. Dashboard shows Zaal the ranking + matches

**Database schema:**
```sql
CREATE TABLE stock_applicant_task_matches (
  id UUID PRIMARY KEY,
  applicant_id UUID REFERENCES stock_applicants(id),
  task_id UUID REFERENCES stock_tasks(id),
  match_score INT,
  skill_gap TEXT[],
  suggested_buddy_id UUID,
  assigned_at TIMESTAMP
);

CREATE TABLE stock_applicant_onboarding_checklists (
  id UUID PRIMARY KEY,
  applicant_id UUID,
  task_id UUID,
  rank INT (1, 2, 3),
  status TEXT ('pending', 'in-progress', 'completed'),
  due_date DATE,
  completed_at TIMESTAMP
);
```

**Cost:** Claude batch = $0.001 per matching session.

**Pareto win:** New person knows exactly what to do. No "Where do I start?" paralysis.

---

## 3. "Your First Week" Personalized Checklist

### Why It Matters

New contributors report: "I know I'm on [scope], but what's the actual workflow?" Async checklist (5 items, one per day) reduces context-setting meetings from 1 hour to 15 min.

**Example checklist (for ops-lead):**
- Day 1: Review doc 270 (ZAOstock Planning), join Discord #ops-lead channel
- Day 2: Meet buddy (Candy) — 20 min intro, get Dashboard access
- Day 3: Complete sponsor intake task #1 (research 5 companies, doc in Supabase)
- Day 4: Post intro to Farcaster (auto-drafted for you)
- Day 5: Attend team standup (Thu 7pm EST), ask 1 question

### Implementation

**Tech stack:**
- Claude API for checklist generation
- Paragraph email for daily delivery
- Supabase for tracking completion

**Prompt template (checklist generation):**
```
Generate a 5-day onboarding checklist for a new {scope} {role_flag}.

Applicant: {name}
Scope: {ops | music | design}
Role flag: {beginner | experienced | specialist}
Starter tasks: {top_3_tasks_from_step_2}
Team members in scope: {names}
Research docs (docs 270, 428, etc.): {doc_list}

Checklist should:
1. Mix async self-learning (docs, Supabase exploration) + social (meet buddy, post intro)
2. Progress from context → hands-on → team integration
3. Each day ~1-2 hours max
4. Include specific deliverables (task #1 researched, intro post drafted)
5. End with team engagement (standup, Farcaster post)

Output:
{
  "day": 1-5,
  "title": "string",
  "tasks": [{ description, time_estimate, resource_link | null, deliverable | null }],
  "success_metric": "how to know you nailed it"
}
```

**API endpoint (new):**
```
POST /api/stock/applicants/[id]/first-week
{ applicant_id: "uuid" }
=> { checklist: [...], email_sequence_schedule }
```

**Workflow:**
1. Checklist generated after task-match ranking
2. Stored in `stock_applicant_first_week_checklists`
3. Email queued: Day 1 (immediately), Day 2 (48h later), etc.
4. Each email contains: today's task + yesterday's completed checklist items (tracking)
5. Dashboard shows completion rate: "[Sarah] 5/5 complete. Great first week!"
6. Friday: Buddy (Candy) reviews checklist + confirms ready for real work

**Database schema:**
```sql
CREATE TABLE stock_applicant_first_week_checklists (
  id UUID PRIMARY KEY,
  applicant_id UUID,
  day INT (1-5),
  title TEXT,
  tasks JSONB,
  success_metric TEXT,
  completed_at TIMESTAMP,
  completion_note TEXT
);
```

**Cost:** Paragraph free (unlimited email). Claude = $0.001 per checklist.

**Pareto win:** New person moves from "confused" to "productive" in 5 days instead of 3 weeks.

---

## 4. Buddy Matching (Skill + Scope Pairing)

### Why It Matters

Pairing new ops-lead Sarah (tech background, marketing skills) with Candy (experienced ops 2nd, people-focused) unlocks faster context transfer than random assignment.

### Implementation

**Tech stack:**
- Claude API for similarity scoring
- Supabase existing team + applicant profiles
- Preference weighting: skill overlap, timezone/availability, communication style

**Prompt template (buddy matching):**
```
Match a new contributor with an existing team member for mentorship.

New contributor:
- Name: {name}
- Scope: {scope}
- Skills: {extracted_skills}
- Flag: {beginner | experienced | specialist}
- Timezone: {timezone}
- Communication style: {inferred from bio/posts}

Existing team members (same scope):
{team_list: [{ name, scope, role, skills[], timezone, communication_style, availability_hours }]}

Recommend top 2 buddy matches based on:
1. **Skill complementarity:** Buddy has 80%+ of skills, or can teach gap
2. **Role fit:** Buddy is lead/2nd (experienced enough to mentor)
3. **Timezone/Availability:** Can do 30 min/week sync
4. **Communication style:** Async vs sync, detail-oriented vs big-picture
5. **Personality fit:** Inferred from social presence (tone, humor, engagement style)

Output:
[
  {
    "buddy_name": "string",
    "match_score": 0-100,
    "skill_overlap": "description",
    "time_commitment": "X hours/week",
    "communication_plan": "async Telegram + weekly Thu coffee call"
  }
]
```

**API endpoint (new):**
```
POST /api/stock/team/buddy-match
{ applicant_id: "uuid" }
=> { top_match: {name, match_score, plan}, fallback_match }
```

**Workflow:**
1. After scope approval + checklist generation, trigger buddy match
2. Claude ranks existing team by fit
3. Suggest top match to applicant + buddy: "Hi Sarah, your buddy is Candy. [Schedule call]"
4. Email to buddy: "Hi Candy, onboarding Sarah (tech-ops). First call: [DATE]. Here's her profile."
5. First-week checklist Day 2 task: "Meet your buddy — 20 min call. Discuss [your first task, ZAOstock workflow, any questions]"
6. Buddy gets +10 points (reward system, doc 10) for mentoring

**Database schema:**
```sql
CREATE TABLE stock_applicant_buddy_matches (
  id UUID PRIMARY KEY,
  applicant_id UUID,
  buddy_id UUID REFERENCES stock_team(id),
  match_score INT,
  paired_at TIMESTAMP,
  first_call_scheduled TIMESTAMP,
  communication_plan TEXT
);
```

**Cost:** Claude = $0.001 per matching.

**Pareto win:** Speeds knowledge transfer from 4 weeks to 1 week.

---

## 5. Auto-Generated Intro Post (Farcaster + Email)

### Why It Matters

New contributor feels legit + seen when they're introduced to 2,000-person `@ZAOfestivals` channel. Draft post from bio reduces friction: "just post this."

**Example post:**
> "Excited to announce Sarah is joining our ops team for ZAOstock. She's spent 18 months producing events, knows sponsor workflows inside-out, and is based in Maine. Welcome aboard! [LINK to profile]"

### Implementation

**Tech stack:**
- Claude API for post writing (already partially done per doc 476)
- Farcaster SDK for posting
- Optional: Runway Gen-3 for simple avatar/badge image

**Prompt template (intro post generation):**
```
Write a warm Farcaster cast introducing a new ZAOstock contributor.

Applicant: {name}
Scope: {ops | music | design}
Role: {lead | 2nd | member}
Background: {extracted from bio + social profile}
Unique angle: {one skill or story that stands out}

Cast (max 280 chars, Farcaster friendly):
1. Open with energy ("We're thrilled to announce...")
2. Name + scope (what are they owning?)
3. One specific strength (why they matter)
4. One personal detail (Maine connection, music passion, etc.)
5. CTA: "Welcome aboard!" + link to their intro email or bio

Post should feel warm + hype, not corporate. Use tone from @ZAOfestivals past posts.
```

**API endpoint (new):**
```
POST /api/stock/applicants/[id]/intro-post
{ applicant_id: "uuid", include_image: boolean }
=> { post_draft, image_prompt, posting_instructions }
```

**Workflow:**
1. After buddy match, trigger intro post generation
2. Claude drafts post, Zaal reviews in dashboard (1 min)
3. Zaal clicks [Approve & Post] → Farcaster post goes live to `@ZAOfestivals`
4. Parallel: intro email sent to applicant with screenshot + "Welcome to the team!"
5. Applicant encouraged to screenshot + recast (social proof)

**Database schema:**
```sql
CREATE TABLE stock_applicant_intro_posts (
  id UUID PRIMARY KEY,
  applicant_id UUID,
  post_draft TEXT,
  post_hash TEXT,
  posted_at TIMESTAMP,
  reactions_count INT,
  recasts_count INT
);
```

**Cost:** Claude $0.001. Optional Runway image $0.05.

**Pareto win:** New person feels welcomed + visible. Existing team sees growth.

---

## 6. Nudge Escalation (Bio Empty → Telegram Alert)

### Why It Matters

Of 10 applicants, 2-3 abandon after bio form incomplete. If no bio after 48h, ZOE (via Telegram) pings: "Hey, just checking — got stuck on the form?"

### Implementation

**Tech stack:**
- Supabase scheduled jobs (or cron via Vercel)
- ZOE Telegram agent (already live on VPS per project memory)
- Escalation rules: 48h → reminder, 96h → escalate to Zaal

**Prompt template (friendly nudge):**
```
Write a friendly Telegram nudge for an incomplete application.

Applicant: {name}
Days since form start: {days}
Missing field: {bio | farcaster_handle | ...}
Scope (if known): {scope | "TBD"}

Nudge (conversational, not corporate):
1. Acknowledge: "Hi [name], got the form start"
2. Clarify: "Just need a quick bio (3-5 sentences) about your background"
3. Example: "Like: 'I make beats and run events in Maine' or 'Tech ops, 10 years experience'"
4. Help: "Any questions, I'm here"
5. CTA: "Finish here: [LINK to form]"

Tone: like ZOE is a friend checking in.
```

**Workflow:**
1. Daily 9am: cron job checks `stock_applicants` table for incomplete bios + >48h since creation
2. For each: generate nudge prompt, send via ZOE Telegram
3. If >96h still incomplete: escalate to Zaal Telegram: "Sarah hasn't finished bio in 4 days. Manual follow-up?"
4. If complete within 48h of nudge: log success, no further action
5. Monthly: report "completion rate post-nudge" (e.g., 7/10 completed after nudge)

**Database schema:**
```sql
CREATE TABLE stock_applicant_nudges (
  id UUID PRIMARY KEY,
  applicant_id UUID,
  nudge_type TEXT ('48h-incomplete', '96h-escalate'),
  sent_via TEXT ('telegram-zoe', 'telegram-zaal'),
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  completion_status TEXT
);
```

**Cost:** Free (existing ZOE agent).

**Pareto win:** Recover 2-3 applicants per recruitment cycle.

---

## 7. Onboarding Analytics (Drop-off Tracking)

### Why It Matters

Seeing "Sarah completed all 5 first-week tasks" vs "Marcus abandoned on Day 2" informs: what works? where do we lose people?

**Sample metrics:**
- **Completion rate:** 80% reach Day 5 (strong)
- **Drop-off point:** Day 2 (buddy call scheduling)
- **Completion time:** avg 8 days (slower than target 5)
- **Success flag:** completed_all_5_tasks ∩ first_starter_task_done

### Implementation

**Tech stack:**
- Supabase activity tracking (each checklist completion logged)
- Claude API for weekly summary + anomaly detection
- Dashboard report for Zaal

**Prompt template (drop-off analysis):**
```
Analyze onboarding completion data for {month}.

Data:
{csv: name, day1_complete, day2_complete, ..., days_to_completion, final_status}

Summary:
1. **Overall completion rate:** X%
2. **Average time to completion:** Y days
3. **Critical drop-off:** Day Z (X% drop-off here)
4. **People at risk:** [names who abandoned after Day X]
5. **Top performers:** [names who completed in <4 days]
6. **Recommendation:** "Common blocker on Day 2 is buddy scheduling. Use Calendly link."

Output JSON + 200-word summary.
```

**API endpoint (new):**
```
POST /api/stock/analytics/onboarding-weekly
=> { completion_rate, drop_off_analysis, recommendations, at_risk_people }
```

**Workflow:**
1. Weekly (Friday 5pm): cron runs `onboarding_analytics()`
2. Generates summary: completion rate, drop-off points, at-risk people
3. If at-risk detected (abandoned on Day X): Zaal gets alert, can intervene
4. Monthly: broader trend report (Nov cohort vs Dec cohort)
5. By Sep 1: adjust checklist based on what worked

**Database schema:**
```sql
CREATE TABLE stock_onboarding_analytics (
  id UUID PRIMARY KEY,
  period_start DATE,
  period_end DATE,
  total_started INT,
  total_completed INT,
  completion_rate DECIMAL(3,2),
  avg_days_to_completion INT,
  drop_off_day INT,
  drop_off_percentage INT,
  at_risk_people TEXT[],
  insights TEXT,
  created_at TIMESTAMP
);
```

**Cost:** Claude = $0.001 per weekly report.

**Pareto win:** Identifies drop-off early. Adjust checklist before 5 people abandon.

---

## 8. Knowledge Base Q&A (Research Library Surfacing)

### Why It Matters

Applicant asks: "How does artist roster get decided?" Instead of Zaal answering (10 min), ZOE searches 320+ research docs + Supabase activity, returns answer in 20 seconds.

### Implementation

**Tech stack:**
- RAG (Retrieval-Augmented Generation) on research library + Supabase
- Claude API for answer synthesis
- Postgres `pgvector` for semantic search (doc 428 mentions this in db setup)
- Fallback: escalate to Zaal if low confidence

**Integration points:**
- Dashboard sidebar: "Questions? Ask our knowledge bot"
- First-week checklist: "Need context? Try the bot first"
- Buddy meeting: "I'll ask our knowledge bot, then Candy can add color"

**Prompt template (RAG answer):**
```
Given a question from a new contributor, find answer in knowledge base.

Question: {question}
Context: {applicant's scope, role, flag}

Search research library (320+ docs) + Supabase data:
- Decision logs (stock_decisions)
- Previous applicant Q&A
- Team profiles (stock_team)

Answer format:
{
  "answer": "2-3 sentence response with specific details",
  "source_docs": ["doc_id"],
  "confidence": 0-1,
  "escalate_to_buddy": boolean (if confidence <0.7)
}

If confidence <0.7, suggest: "Great question. Your buddy [Candy] can add more color on this."
```

**API endpoint (new):**
```
POST /api/stock/kb/answer-question
{ question: string, applicant_id: "uuid" }
=> { answer, sources, escalate_to_buddy }
```

**Workflow:**
1. New contributor asks question in Dashboard chatbox
2. Trigger `POST /kb/answer-question`
3. RAG search on research library + recent Supabase activity
4. Claude synthesizes answer, returns with sources
5. If high confidence (>0.85): post answer directly
6. If lower confidence (<0.7): "Check with your buddy [Candy]" + escalate to buddy Telegram
7. All Q&A logged in `stock_kb_questions` for reuse

**Database schema:**
```sql
CREATE TABLE stock_kb_questions (
  id UUID PRIMARY KEY,
  applicant_id UUID,
  question TEXT,
  answer_generated TEXT,
  source_docs TEXT[],
  confidence DECIMAL(3,2),
  escalated_to BOOLEAN,
  asker_found_helpful BOOLEAN,
  created_at TIMESTAMP
);
```

**Cost:** Claude API + pgvector search = ~$0.01 per question.

**Pareto win:** Reduces buddy interruptions by 30%. Self-serve answers for common questions.

---

## 9. Permission + Access Auto-Setup (Discord, Telegram, Dashboard)

### Why It Matters

New contributor approved → should immediately have:
- Discord role assignment (e.g., `@ops-team` or `@design-team`)
- Telegram group invite (relevant channel: #ops-lead, #music-ops, #design)
- Dashboard login (Supabase auth via Farcaster)
- Read access to research docs (folder permissions)

Manual setup = 15 min per person. Automation = instant.

### Implementation

**Tech stack:**
- Discord API for role assignment
- Telegram bot for group invites
- Supabase auth + RLS for dashboard access
- Zapier or custom lambda for orchestration

**Prompt template (access checklist generation):**
```
Generate access provisioning checklist for a new {scope} contributor.

Applicant: {name}
Scope: {ops | music | design}
Role: {lead | 2nd | member}

Checklist:
1. **Discord:** Assign roles @{scope}-team (e.g., @ops-team, @design-team)
   - Also invite to #general, #zaostock, #{scope}-specific
2. **Telegram:** Add to groups (ZAOstock main, #{scope}-team)
3. **Dashboard:** Create Supabase user, grant `stock_team_{scope}` RLS policy
4. **Research docs folder:** Grant read access to `/research/events/` + relevant scope folders
5. **Farcaster:** Add to @ZAOfestivals mentions allowlist (auto-notify on mentions)
6. **Verify:** Test login, confirm all channels accessible

Output:
{
  "discord_roles": ["@ops-team", "@general"],
  "telegram_groups": ["group1_id", "group2_id"],
  "supabase_policy": "stock_team_{scope}",
  "docs_folder_permissions": ["path1", "path2"],
  "verification_steps": [...]
}
```

**API endpoint (new, requires admin auth):**
```
POST /api/stock/access/provision
{
  "applicant_id": "uuid",
  "scope": "ops" | "music" | "design"
}
=> { checklist_status, errors_if_any, manual_steps }
```

**Workflow:**
1. Zaal clicks "Approve" after scope confirmation
2. Auto-trigger `POST /api/stock/access/provision`
3. Async execution:
   - Discord: add role (Discord bot)
   - Telegram: send invite link (Telegram bot)
   - Supabase: create user + assign RLS policy
   - Email: send access summary + links
4. Manual steps (if needed): research folder permissions (handled by Candy async)
5. Send email to applicant: "You're set up! Here's your access."

**Database schema:**
```sql
CREATE TABLE stock_access_logs (
  id UUID PRIMARY KEY,
  applicant_id UUID,
  step TEXT ('discord', 'telegram', 'supabase', 'docs', 'farcaster'),
  status TEXT ('pending', 'complete', 'failed'),
  error_message TEXT,
  completed_at TIMESTAMP
);
```

**Cost:** Discord/Telegram bot free (owned by ZAO). Supabase RLS free.

**Pareto win:** New person active in community within 10 min of approval, not after 2 days of manual handoff.

---

## Integration with /stock/team Dashboard

**BioEditor component updates (partially done per doc 476):**

```tsx
// In applicant intake form:
- Real-time Farcaster/X profile fetch (show extracted skills live)
- "AI suggests [SCOPE]" pill with confidence %
- Recommended starter tasks (clickable, preview each)
- Buddy match (show photo + bio of suggested buddy)
- Auto-generated intro post (edit before posting)

// New admin buttons (Zaal only):
- [Extract Skills] — crawl profiles manually if handles not provided
- [Suggest Scope] — re-run matching if applicant provides new info
- [Approve & Provision] — auto-setup access + send welcome email
- [View First-Week Progress] — dashboard of all onboarding checklist completion
- [Knowledge Bot] — test Q&A before applicant uses

// New applicant dashboard (after approval):
- "Your first 5 days" checklist (clickable, mark complete)
- "Your buddy is [Candy]" (link to schedule call)
- "Intro post live!" (screenshot)
- "Questions? Ask our knowledge bot"
- Points tracker (tasks = points earned)
```

**Database schema additions:**
```sql
-- Applicant table additions (already listed above)
-- Task-match junction table
-- First-week checklist
-- Buddy match log
-- Intro post log
-- Nudge escalation log
-- KB questions log
-- Access provision log
-- Onboarding analytics table

-- Sample queries for dashboard:
SELECT 
  COUNT(*) as total_applicants,
  COUNT(CASE WHEN scope_approved_at IS NOT NULL THEN 1 END) as approved,
  COUNT(CASE WHEN extracted_skills IS NOT NULL THEN 1 END) as skills_extracted
FROM stock_applicants;

SELECT 
  name,
  day,
  completed_at,
  CASE WHEN completed_at IS NULL THEN 'pending' ELSE 'done' END as status
FROM stock_applicant_first_week_checklists
WHERE applicant_id = $1
ORDER BY day;
```

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Profile crawling | Neynar + X API (not LinkedIn) | Farcaster/X align with ZAO ecosystem. LinkedIn crawl is slower + less signal. |
| Scope matching | Claude (not rule-based) | LLM can infer context (e.g., "drummer + event background" = ops, not music). Rules too rigid. |
| Buddy assignment | Skill + communication style (not random) | Compatibility = faster onboarding. Random = hit-or-miss. |
| First-week format | 5-day, 1 email/day (not 5-at-once) | Drip avoids overwhelm. Daily keeps momentum. |
| Knowledge base | RAG on existing library (not rebuild) | 320+ docs already written. Reuse + index them. |
| Access setup | Async bots + RLS policies (not manual) | 10 min automation vs 15 min manual per person. Scales. |
| Nudge escalation | 48h → 96h → Zaal (not immediate) | Avoid false positives. Most finish within 48h anyway. |

---

## 170-Day Timeline

| Week | Action | Owner |
|------|--------|-------|
| Apr 23 (this week) | Applicant schema design + API endpoint list | Zaal |
| May 1 | Neynar + X API integration working | Eng |
| May 8 | Skill extraction prompt + test on 5 applicants | Eng |
| May 15 | Scope matching logic live | Eng |
| May 22 | Task matching + ranking working | Eng |
| Jun 1 | First-week checklist generation live | Eng |
| Jun 8 | Buddy matching algorithm tested | Eng |
| Jun 15 | Intro post generation + Farcaster posting working | Eng |
| Jul 1 | Nudge escalation + ZOE Telegram integration | Eng |
| Jul 15 | Knowledge base RAG + Q&A endpoint live | Eng |
| Aug 1 | Access provisioning (Discord/Telegram/Supabase) working | Eng |
| Aug 15 | Full flow tested on 3 test applicants | Zaal + Eng |
| Sep 1 | Real recruitment starts; track onboarding analytics | Zaal |
| Sep 15 | Weekly analytics reports running | Auto |
| Oct 1 | Final onboarding cohort (5-8 people) flowing through | Auto |
| Nov 1+ | Monthly analytics + checklist refinement | Candy |

---

## Open-Source Repos to Borrow

1. **Neynar SDK + Feed API Examples**
   - https://github.com/neynar-xyz/sdk-examples
   - Profile fetch, mention scraping
   - Cost: Free API (with rate limits)

2. **X API + TypeScript Client**
   - https://github.com/twitterdev/twitter-api-typescript-sdk
   - Tweet search, user timeline
   - Cost: Free tier (25k tweets/month)

3. **LangChain RAG + pgvector**
   - https://github.com/langchain-ai/langchain
   - Document embedding + semantic search
   - Cost: Free (MIT)

4. **Discord.py / Discord.js Bot Examples**
   - https://github.com/discord/discord.py
   - Role assignment, channel invites
   - Cost: Free (MIT)

5. **Telegram Bot SDK**
   - https://github.com/python-telegram-bot/python-telegram-bot
   - Group invites, message sending
   - Cost: Free (LGPLv3)

6. **Supabase RLS Examples**
   - https://github.com/supabase/supabase
   - Row-level security policies, auth
   - Cost: Free tier (up to 500MB)

7. **Claude API + Streaming**
   - https://github.com/anthropic-ai/anthropic-sdk-python
   - Batch + streaming inference
   - Cost: API pay-as-you-go

---

## Reality Check for Our Scale

- **17 people today, +8-10 by Aug 31** = onboarding 1-2 people per month (May-Aug). Build scales for 50+ if reused Year 2.
- **163 days out** = 5+ months to build. Phase 1 (skill extraction + scope matching) ships by May 15. Phase 2 (first-week + buddy + access) ships by Jul 1.
- **Small team** = manual review (Zaal clicks "approve") still needed. Claude suggestions speed to 10 min per applicant instead of 30 min.
- **Complexity risk** = RAG + profile crawling is new tech. START with static task ranking (hardcoded), add Claude matching in phase 2 if time allows.
- **Drop-off rate** = assume 20% abandon (standard for volunteer orgs). Nudge escalation could recover 3-5 per cycle.

**If we had 100+ applicants:** Justify building full RAG + automated buddy matching. At 10/month, manual Zaal review + Claude suggestions = sweet spot.

---

## Trap to Avoid

**Over-personalization in first-week checklist:** If the 5 tasks are so tailored that every person gets a different checklist, you'll spend 30 min customizing each one instead of 1 min reviewing. Bake 3 "starter task bundles" per scope (beginner, experienced, specialist), reuse them. Personalize only the buddy match + intro post (high-signal parts).

---

## Sources

1. [Neynar Feed API Documentation](https://docs.neynar.com/reference/feed-endpoints)
2. [X API User Lookup + Timeline](https://developer.twitter.com/en/docs/twitter-api)
3. [LangChain Retrieval Examples](https://python.langchain.com/docs/modules/retrieval/)
4. [Supabase RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
5. [Discord Bot Role Assignment (discord.js)](https://discordjs.guide/interactions/slash-commands.html)
6. [Volunteer Onboarding Best Practices (Idealist.org)](https://www.idealist.org/nonprofit-volunteer-engagement-strategies)
7. [Event Contributor Retention Study (GiveWP)](https://www.givewp.com/blog/volunteer-retention-statistics/)

---

## Related ZAO Research

- [270 — ZAOstock Planning](../270-zao-stock-planning/)
- [274 — ZAOstock Team Deep Profiles](../274-zao-stock-team-deep-profiles/)
- [428 — Run-of-Show Program](../428-zaostock-run-of-show-program/)
- [476 — Apr 22 Team Recap](../476-zaostock-apr22-team-recap/)
- [477 — Dashboard 170-Day Build](../477-zaostock-dashboard-notion-replacement/)
