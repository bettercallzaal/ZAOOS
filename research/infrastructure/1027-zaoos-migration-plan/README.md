---
topic: infrastructure
type: plan
status: design-approved
last-validated: 2026-07-10
superseded-by:
related-docs: 1025, 1021, 998, 836, 601
original-query: "staged migration plan for the ZAOOS estate split (doc 1025)"
tier: DEEP
---

# 1027 - ZAOOS Staged Migration Plan: Three-Stage Cutover with Keep-Live Constraint

> **Goal:** Execute the approved doc 1025 estate split in three staged phases that keep the Vercel app and VPS bot running through the entire migration, with reversible rollback at each stage. This plan is NOT execution - it is the roadmap and checklist for the highest-risk migration in ZAOOS history.

## Executive summary

Doc 1025 approved splitting ZAOOS from a monorepo-lab into four homes. This plan migrates them stage-by-stage (framework-out, app-out, then narrow) while the live Vercel app (`zaoos.com` Farcaster client) and VPS bot (`@zaoclaw_bot` on Telegram) stay running. Each stage deploys the new home, verifies it boots, then cuts over, then removes the old. Secret-scanning every extraction prevents leaking private config (tokens, ICM boxes, chat-ids, allowlists) to public repos.

| Stage | What moves | New home | Live constraint | Risk |
|-------|-----------|----------|-----------------|------|
| 1 | Bot engine (bot/src/zoe, hermes coder/critic/PR pipeline) | hermes-orchestrator (public) + zaoos-workspace (private) | VPS bot keeps running on the split boundary | High - engine/instance split must not break at poll time; secret extraction is critical |
| 2 | Farcaster app (src/, all 302 API routes + 295 components) | New app repo (TBD name, match visibility) | Vercel app stays live; parallel deploy on new repo | Medium - Vercel redeploy, DNS flip, old routes fallback-404 only AFTER new is live |
| 3 | Narrow ZAOOS to docs-only | Remove all migrated code from ZAOOS | Both live services now point to their own repos | Low - just pruning; rollback is re-adding docs if something breaks |

## Key decisions (from doc 1025, confirmed for this plan)

1. **Engine-vs-instance split (doc 1021):** The public hermes-orchestrator contains ONLY reusable code (conductor, factory, coder/critic/PR pipeline, multi-token poll bones). The private zaoos-workspace contains ONLY the ZAO fleet instance (tokens in .env, which ICM boxes per bot, ops allowlists, Telegram chat-ids, memory logs, ZAO's own brain configs). NO secrets in the public repo.

2. **Keep-live is non-negotiable:** The Vercel app and VPS bot must keep serving production throughout the move. No maintenance windows. If a stage breaks, rollback immediately without taking down the service.

3. **Verification before cutover:** Each stage must typecheck (`npm run typecheck`), build (`npm run build` + `esbuild`), and boot the new home cleanly before the old code is removed or old routes are deleted. Tests are optional; boot = required.

4. **History preservation:** The Farcaster app (src/) has 6+ years of feature history - preserve it via `git filter-repo` (splits the tree + history cleanly). The bot framework has 3+ years - preserve selectively (the 1021-approved work has distinct history markers). Research lives forever in ZAOOS; history is less critical there.

5. **Secret scan HARD GATES each extraction:** Before any public repo code is committed, run the secret-hygiene scans (64-char hex for private keys, PEM blocks, GitHub PAT, Anthropic keys, OpenAI keys, env var leaks). On ANY match, ABORT. Do NOT fix silently or commit anyway.

6. **Reversible at every stage:** Each stage has a rollback plan (re-enable old routes, revert DNS, restore old code if needed). The VPS can fall back to the old code at any point if the new home is not yet live.

## Stage 1: Bot Framework Out (Framework Split + Private Instance)

**Goal:** Extract the bot engine to hermes-orchestrator (public) and the private fleet instance to zaoos-workspace (private). The VPS bot keeps running against the split boundary (loads both repos). After this stage, ZAOOS/bot/src/zoe will be empty but remain until stage 3.

### Stage 1 - Detailed steps

#### 1.1 Prepare hermes-orchestrator to receive the engine code

Repository: `bettercallzaal/hermes-orchestrator` (existing, public)

Commands:

```bash
# Clone/fetch the target repo
cd ~/temp-migration && git clone git@github.com:bettercallzaal/hermes-orchestrator.git
cd hermes-orchestrator && git checkout -B stage1-engine-in origin/main

# Examine current structure (confirm it exists + is empty or stub)
ls -la src/ packages/
# Expected: minimal or stub structure; actual engine code should NOT exist yet

# Create the target structure for the engine (one path)
mkdir -p src/zoe-engine
mkdir -p src/conductor
mkdir -p src/factory
mkdir -p src/coder-critic-pr
# (These directories will receive code in step 1.3)
```

#### 1.2 Prepare zaoos-workspace to receive the private instance

Repository: `bettercallzaal/zaoos-workspace` (existing, private)

Commands:

```bash
# Clone/fetch the target repo
cd ~/temp-migration && git clone git@github.com:bettercallzaal/zaoos-workspace.git
cd zaoos-workspace && git checkout -B stage1-fleet-in origin/main

# Confirm structure (the private fleet instance is the heavy directory)
ls -la
# Expected: zoe/fleet/, zoe/memory/ (existing stub), or empty

# Create or confirm target paths for the ZAO fleet instance
mkdir -p zoe/fleet-config
mkdir -p zoe/memory
mkdir -p .env.example  # will stub out the secrets
# (These directories receive code + configs in step 1.3)
```

#### 1.3 Extract bot/src/zoe to hermes-orchestrator + zaoos-workspace using git filter-repo

This is the most critical step. The extraction MUST cleanly split:
- Engine code (reusable, goes public) to hermes-orchestrator/src/zoe-engine/
- Instance code (secrets + Zaal's brains, goes private) to zaoos-workspace/zoe/

The extraction uses `git filter-repo` with a map function to split the tree. Because ZAO's bot code lives in ZAOOS and will be removed, we split by COPYING the history + sanitizing.

Pre-flight checks:

```bash
# In ZAOOS repo
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# 1. Confirm the code to split exists and is all staged
ls -la bot/src/zoe/
# Should see: index.ts, dispatch.ts, decompose.ts, memory.ts, groups.ts, concierge.ts, human.md, etc.

# 2. No uncommitted changes
git status
# Must be clean (all changes committed or on a branch)

# 3. Identify the specific commits that touch bot/src/zoe (the history we'll preserve)
git log --oneline bot/src/zoe/ | head -20
# Note the commit hashes + messages (for rollback reference)
```

Extract to hermes-orchestrator (engine only, public code):

```bash
# Clone a FRESH copy of ZAOOS as a working temp repo
cd ~/temp-migration
rm -rf zaoos-filter-repo
git clone file:///Users/zaalpanthaki/Documents/ZAO\ OS\ V1 zaoos-filter-repo
cd zaoos-filter-repo

# Use filter-repo to EXTRACT bot/src/zoe AND sanitize secrets
# This creates a commit history that ONLY contains bot/ changes
# The final command will be run separately in hermes-orchestrator, pulling just the extracted history

git filter-repo \
  --path bot/src/zoe \
  --path-rename bot/src/zoe:src/zoe-engine \
  --force

# Verify the extraction
git log --oneline -- src/zoe-engine/ | head -10
# Should show only commits that touched bot/src/zoe

# Now we have a history-only tree. Push to a temporary branch for hermes-orchestrator to pull
git push -u origin HEAD:temp-stage1-extract
```

Merge the engine history into hermes-orchestrator:

```bash
cd ~/temp-migration/hermes-orchestrator

# Add the temp remote + fetch the history-only tree
git remote add zaoos-extract ../zaoos-filter-repo
git fetch zaoos-extract temp-stage1-extract

# Merge it in (using --allow-unrelated-histories because hermes-orchestrator is an existing repo)
git merge --allow-unrelated-histories zaoos-extract/temp-stage1-extract \
  -m "chore(stage1): merge bot engine history from ZAOOS extraction"

# Verify
ls -la src/zoe-engine/
git log --oneline -- src/zoe-engine/ | head -10

# Push to a branch for review
git push -u origin stage1-engine-in
```

Extract to zaoos-workspace (instance only, private code):

The instance code is MUCH smaller: just memory, ICM box IDs, allowlists, chat-ids, token env stubs. For the private repo, we do NOT use filter-repo - we manually copy the structure + sanitize. This is safer for private material.

```bash
cd ~/temp-migration/zaoos-workspace

# MANUALLY copy the instance structure from ZAOOS/bot/src/zoe/ into zaoos-workspace/zoe/fleet-config/
# We do NOT use filter-repo here because we're being extra careful with private data

# 1. Copy memory structures
cp -r "/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/memory/" zoe/memory/

# 2. Create fleet-config directory and manually copy only:
#    - human.md (Zaal's persona/knowledge, goes to zoe/brain.md)
#    - Any allowlist-*.json files
#    - ICM box configs (if they exist as .json)
mkdir -p zoe/fleet-config
cp "/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/human.md" zoe/fleet-config/brain.md

# 3. Create .env.example stub (hardcoded with STUBS, never the real tokens)
cat > .env.example << 'EOF'
# ZAO Fleet Instance - Private Config
# DO NOT commit real values. Stubs for reference only.

TELEGRAM_BOT_TOKEN_ZAOCLAW=tg_bot_stub_1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg
TELEGRAM_BOT_TOKEN_ZAODEVZ=tg_bot_stub_2345678901:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg

TELEGRAM_CHAT_ID_ADMIN=123456789
TELEGRAM_CHAT_ID_INBOX_REPORTS=987654321

ZAO_ICM_BOX_ZAOCLAW=icm_ZAOCLAW_example_id_xxx
ZAO_ICM_BOX_ZAODEVZ=icm_ZAODEVZ_example_id_yyy
EOF

# 4. Add a .gitignore to make sure .env is never committed
echo '.env' >> .gitignore
echo '.env.local' >> .gitignore

# 5. Commit this private structure
git add zoe/ .env.example .gitignore
git commit -m "chore(stage1): add ZAO fleet instance structure (brain, memory, env stubs)"

# Push to a branch
git push -u origin stage1-fleet-in
```

#### 1.4 Update ZAOOS/bot/tsconfig + package.json to import from split repos (dual-source for keep-live)

After both extractions are complete, the VPS bot needs to run from the split boundary - it imports the engine from hermes-orchestrator (a npm published package OR direct submodule) and the instance from zaoos-workspace (same). This allows ZERO downtime during stage 1.

In ZAOOS repo:

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# Option A: Add hermes-orchestrator as an npm package (recommended for long-term)
# (Assumes hermes-orchestrator publishes to npm - if not, use git submodule)

# Update package.json
npm install --save @bettercallzaal/hermes-orchestrator

# Or Option B: Use git submodule for immediate install without npm publish
git submodule add git@github.com:bettercallzaal/hermes-orchestrator.git bot/vendor/hermes-orchestrator

# Similarly for zaoos-workspace (private submodule)
git submodule add git@github.com:bettercallzaal/zaoos-workspace.git bot/vendor/zaoos-workspace

# Update bot/src/zoe/index.ts to import from the new locations
# BEFORE:
#   import { conductor } from './conductor'
#   import { memory } from './memory'
#
# AFTER:
#   import { conductor } from '../vendor/hermes-orchestrator/src/conductor'
#   import { memory } from '../vendor/zaoos-workspace/zoe/fleet-config/memory'
#
# (Exact paths depend on how hermes-orchestrator organizes its exports)

git add package.json .gitmodules bot/vendor/
git commit -m "chore(stage1): wire bot engine + instance via submodules (keep-live boundary)"
```

### Stage 1 - Verification checklist

Before declaring stage 1 complete:

```bash
# In ZAOOS repo
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# 1. Typecheck
npm run typecheck
# Must exit 0

# 2. Build bot (if there's a separate bot build)
npm run build:bot  # or equivalent
# Must succeed

# 3. Boot the bot locally (or on VPS if safe)
npm run bot:dev  # or NODE_ENV=production npm start:bot
# Must start cleanly, connect to Telegram, and be ready for messages

# 4. Secret scan the extracted repos
#    In hermes-orchestrator:
cd ~/temp-migration/hermes-orchestrator
git grep -E '[0-9a-fA-F]{64}' src/zoe-engine/
git grep -E 'BEGIN (RSA |EC |)PRIVATE KEY' src/zoe-engine/
git grep -E 'ghp_[A-Za-z0-9]{36}' src/zoe-engine/
git grep -E 'sk-ant-[A-Za-z0-9_-]{20,}' src/zoe-engine/
git grep -E 'sk-[A-Za-z0-9]{32,}' src/zoe-engine/
git grep -E 'TELEGRAM_BOT_TOKEN' src/zoe-engine/
# All must return empty (no secrets found)

#    In zaoos-workspace:
cd ~/temp-migration/zaoos-workspace
git grep -E '[0-9a-fA-F]{64}' zoe/  # should find NO private keys in committed files
# .env must be gitignored
cat .gitignore | grep -E '\.env'
# Must confirm .env is ignored

# 5. Pull the submodules and confirm they resolve
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
git submodule update --init
ls -la bot/vendor/hermes-orchestrator/ bot/vendor/zaoos-workspace/
# Both must exist and have content

# 6. Telegram bot still responds
# Send a test message to @zaoclaw_bot on Telegram
# Confirm it replies
```

### Stage 1 - Rollback

If stage 1 verification fails:

```bash
# In ZAOOS repo
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# Option 1: If submodule import fails, revert to direct import
git reset --hard HEAD~1  # Undo the submodule commit
# Restore the direct imports in bot/src/zoe/index.ts (undo the imports from vendor/)

# Option 2: If the extracted repos have secret leaks, do NOT push them
# Delete the branches in hermes-orchestrator + zaoos-workspace
cd ~/temp-migration/hermes-orchestrator
git push origin --delete stage1-engine-in

cd ~/temp-migration/zaoos-workspace
git push origin --delete stage1-fleet-in

# Re-audit the extractions, re-scan, then try again
```

## Stage 2: Farcaster App Out (Parallel Deploy, DNS Flip)

**Goal:** Move the Vercel app (src/, all 302 API routes + 295 components) to a new repo. Deploy to the new repo on Vercel. Keep the old app running. Flip DNS to the new app. Only after the new app is live, fallback old routes to 404 stubs. Keep the VPS bot running throughout.

### Stage 2 - Detailed steps

#### 2.1 Create the new app repository

OPEN DECISION: Zaal decides the new app repo name + visibility (in this plan, call it `ZAO_APP_REPO_NAME`).

```bash
# Create via GitHub CLI (or web UI)
gh repo create bettercallzaal/ZAO_APP_REPO_NAME \
  --private \
  --source=. \
  --remote=upstream \
  --push=false

# Clone it
cd ~/temp-migration
git clone git@github.com:bettercallzaal/ZAO_APP_REPO_NAME.git
cd ZAO_APP_REPO_NAME
git checkout -B stage2-app-in origin/main
```

#### 2.2 Extract src/ + related app files to the new repo using git filter-repo

This is similar to stage 1, but for the Farcaster client code.

```bash
# Clone a FRESH copy of ZAOOS as a working temp repo
cd ~/temp-migration
rm -rf zaoos-app-extract
git clone file:///Users/zaalpanthaki/Documents/ZAO\ OS\ V1 zaoos-app-extract
cd zaoos-app-extract

# Use filter-repo to EXTRACT src/ + root app files
git filter-repo \
  --path src/ \
  --path tsconfig.json \
  --path tailwind.config.ts \
  --path next.config.ts \
  --path package.json \
  --path-rename src:src \
  --force

# Verify
git log --oneline -- src/ | head -10
ls -la src/ tsconfig.json

# Push to temporary branch
git push -u origin HEAD:temp-stage2-app-extract
```

Merge into the new app repo:

```bash
cd ~/temp-migration/ZAO_APP_REPO_NAME

# Add remote + fetch
git remote add zaoos-app-extract ../zaoos-app-extract
git fetch zaoos-app-extract temp-stage2-app-extract

# Merge (with --allow-unrelated-histories)
git merge --allow-unrelated-histories zaoos-app-extract/temp-stage2-app-extract \
  -m "chore(stage2): merge Farcaster app history from ZAOOS extraction"

# Verify
ls -la src/ tsconfig.json
git log --oneline -- src/ | head -10

# Push to branch
git push -u origin stage2-app-in
```

#### 2.3 Update app dependencies + environment

In the new app repo:

```bash
cd ~/temp-migration/ZAO_APP_REPO_NAME

# Copy .env.example from ZAOOS (sanitized)
cp "/Users/zaalpanthaki/Documents/ZAO OS V1/.env.example" .

# OR create a fresh .env.example with app-only vars (remove bot + infra vars)
cat > .env.example << 'EOF'
# ZAO Farcaster Client - Environment Variables

NEYNAR_API_KEY=your_neynar_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_PUBLIC_KEY=your_supabase_public_key_here
NEXT_PUBLIC_FARCASTER_HUB_URL=https://hub.farcaster.cast

# ... app-only variables
EOF

# Install dependencies in the new repo
npm install  # May need to resolve app-specific deps; bot/infra deps are NOT included

# Typecheck to confirm
npm run typecheck
# Must exit 0
```

#### 2.4 Deploy the new app to Vercel

```bash
# Link the new repo to a NEW Vercel project (or import fresh)
vercel link --project=zao-app-new  # (pick a distinct project name, NOT zaoos.com)

# Deploy
vercel deploy --prod
# Note the deployed URL (will be different from zaoos.com initially)

# Verify the new app is live
curl -s https://zao-app-new.vercel.app/ | head -20
# Should return HTML (not 404)
```

#### 2.5 Secret scan the extracted app repo

```bash
cd ~/temp-migration/ZAO_APP_REPO_NAME

# Same secret patterns as stage 1
git grep -E '[0-9a-fA-F]{64}' src/
git grep -E 'BEGIN (RSA |EC |)PRIVATE KEY' src/
git grep -E 'ghp_[A-Za-z0-9]{36}' src/
git grep -E 'sk-ant-[A-Za-z0-9_-]{20,}' src/
git grep -E 'sk-[A-Za-z0-9]{32,}' src/
# All must be empty
```

#### 2.6 DNS flip: point zaoos.com to the new app repo

CRITICAL: Only do this AFTER the new app is live and verified.

```bash
# Update the DNS / Vercel project settings to point zaoos.com to the new Vercel project
# via the Vercel dashboard or CLI
vercel domains add zaoos.com --project=zao-app-new

# Or if using a custom domain setup:
# Update the DNS A/CNAME record for zaoos.com to point to the new Vercel deployment

# Verify DNS propagation
dig zaoos.com
# Should resolve to the new Vercel IP/CNAME after 5-15 minutes
```

### Stage 2 - Verification checklist

```bash
cd ~/temp-migration/ZAO_APP_REPO_NAME

# 1. Typecheck
npm run typecheck
# Must exit 0

# 2. Build
npm run build
# Must succeed

# 3. Test (optional but recommended)
npm run test
# Should pass (if tests exist)

# 4. Deploy to Vercel and verify
vercel deploy --prod
# Must succeed

# 5. Smoke test the new app
#    Visit https://zao-app-new.vercel.app in a browser
#    Login with Farcaster
#    Send a message
#    Confirm it works end-to-end

# 6. After DNS flip, test zaoos.com
#    Visit https://zaoos.com
#    Confirm it shows the same content as the new app
#    (may take 5-15 min for DNS to propagate)

# 7. VPS bot still runs
#    Send a test message to @zaoclaw_bot
#    Confirm it still replies
```

### Stage 2 - Rollback

If stage 2 deployment or DNS flip fails:

```bash
# Option 1: Revert DNS to the old Vercel project (zaoos.com old project)
vercel domains add zaoos.com --project=zaoos  # Old project

# Wait for DNS to propagate
dig zaoos.com  # Confirm it resolves to the old project

# Option 2: Delete the new Vercel project (if it's a total failure)
vercel remove --project=zao-app-new

# Option 3: If submodule imports in the app need fixing, debug locally
cd ~/temp-migration/ZAO_APP_REPO_NAME
npm run dev
# Visit localhost:3000, test locally, then redeploy
```

## Stage 3: Narrow ZAOOS to Docs-Only (Prune Code)

**Goal:** Remove all migrated code from ZAOOS now that both hermes-orchestrator and the new app repo are live. ZAOOS becomes a pure research library: all ~820 research docs, zero code. Both live services (Vercel app + VPS bot) now import from their own repos.

### Stage 3 - Detailed steps

#### 3.1 Update ZAOOS to remove bot/ + src/ + migrated scripts

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# Create a new branch for the pruning
git checkout -B stage3-narrow-zaoos origin/main

# Remove the bot/ directory (now replaced by hermes-orchestrator + zaoos-workspace submodules)
rm -rf bot/

# Remove the src/ directory (now in the new app repo)
rm -rf src/

# Remove app-specific scripts (those that dealt with Vercel, auth, etc.)
# Keep only research + infrastructure scripts (like SQL migrations, wallet generation)
#
# Before removing, audit scripts/ to confirm which are app-only:
# - scripts/generate-wallet.ts -> KEEP (useful infrastructure)
# - scripts/deploy-*.ts -> REMOVE (app deployment, now Vercel-only)
# - scripts/db/ -> KEEP (database migrations)
# - scripts/seed/ -> CONSIDER (if it seeds the app, remove; if it seeds research data, keep)

find scripts/ -name "*.ts" -o -name "*.sh" | while read f; do
  echo "Check: $f"
  # Manually review each; remove app-specific ones
done

# For now, move app-specific scripts to a separate directory (not deleted, for reference)
mkdir -p archive/scripts-app-old
mv scripts/deploy-*.ts archive/scripts-app-old/ 2>/dev/null || true

# Remove app-specific packages + dependencies (optional, but cleaner)
# Review package.json and remove @vercel, next, react, etc. (research-only packages remain)
# This is OPTIONAL and lower priority than removing code
```

#### 3.2 Update community.config.ts + other root configs (if app-specific)

```bash
# If community.config.ts contains app-only config (navigation, channels, admin FIDs)
# move it to the new app repo

# In the new app repo:
cp "/Users/zaalpanthaki/Documents/ZAO OS V1/community.config.ts" ./

# In ZAOOS repo:
rm community.config.ts

# Or if it contains both research + app config, split it
# (Keep research-only parts in ZAOOS; app-specific parts move to new repo)
```

#### 3.3 Update .env.example + .gitignore

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# .env.example should now have NO app-specific vars
# Keep only infrastructure + research vars (if any)
cat > .env.example << 'EOF'
# ZAOOS Research Library
# No application secrets needed for a docs-only repo

# (Optional: if any research pipelines need env vars, list them here)
EOF

# .gitignore should still block secrets
# Confirm it does NOT allow .env, .env.local, etc.
grep -E '\.env' .gitignore
# Must see .env-related entries
```

#### 3.4 Update README.md + CLAUDE.md to reflect the new structure

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# Update README.md to say "ZAOOS is a research library"
cat > README_ZAOOS_INTRO.md << 'EOF'
# ZAOOS - ZAO Research & Knowledge Library

ZAOOS is a curated collection of research documents, infrastructure analysis, and design decisions for the ZAO ecosystem. It contains no application code.

For the Farcaster client application, see [ZAO_APP_REPO_NAME](https://github.com/bettercallzaal/ZAO_APP_REPO_NAME).

For the bot framework (ZOE, Hermes, agent orchestration), see [hermes-orchestrator](https://github.com/bettercallzaal/hermes-orchestrator).

For the ZAO bot fleet configuration (private, tokens, ICM boxes), see [zaoos-workspace](https://github.com/bettercallzaal/zaoos-workspace) (private).

## Research Categories

- `research/infrastructure/` - Infrastructure, databases, deployment, streaming, admin tools
- `research/agents/` - Agent design, ZOE orchestrator, bot factory, autonomous loops
- `research/business/` - Strategy, positioning, partnerships, revenue
- `research/music/` - Music streaming, SongJam, Juke integration, POIDH
- `research/events/` - ZAOstock, festivals, WaveWarZ, Thy Revolution
- `research/governance/` - Voting, contribution, Respect token, DAOs
- `research/identity/` - ICM boxes, personas, brand, design
- `research/dev-workflows/` - Developer tools, Farcaster SDK, CI/CD

See `research/README.md` for the full index.
EOF

# Append this to the main README
cat README_ZAOOS_INTRO.md >> README.md

# Update CLAUDE.md to remove references to src/, bot/, app development
# (Focus only on research workflows, doc conventions, secret hygiene)
```

#### 3.5 Remove submodule references (clean up the split boundary)

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# If stage 1 added submodules, remove them now (they are no longer needed)
git submodule deinit bot/vendor/hermes-orchestrator
git submodule deinit bot/vendor/zaoos-workspace
rm -rf bot/vendor/ .gitmodules

git add .gitmodules bot/
git commit -m "chore(stage3): remove submodule references (apps now run from own repos)"
```

#### 3.6 Final secret scan

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# Scan the entire repo for any remaining secrets
git grep -E '[0-9a-fA-F]{64}' -- ':!archive/'
git grep -E 'BEGIN (RSA |EC |)PRIVATE KEY' -- ':!archive/'
git grep -E 'TELEGRAM_BOT_TOKEN' -- ':!archive/'
git grep -E 'NEYNAR_API_KEY' -- ':!archive/'
# All must be empty (or only in archive/ which won't be committed)
```

### Stage 3 - Verification checklist

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# 1. Confirm code is gone
ls -la src/ bot/ 2>&1
# Should return "No such file or directory"

# 2. Confirm research remains
ls -la research/
# Should see ~26 subdirectories (infrastructure, agents, business, etc.)

# 3. Typecheck (should be much faster, no app code)
npm run typecheck
# May exit with errors if app dependencies are removed, but that's OK
# The repo is no longer an app

# 4. Build (optional)
npm run build
# May fail if app deps are gone; that's expected

# 5. Git status should be clean
git status
# All changes should be staged + committed

# 6. VPS bot still runs from hermes-orchestrator + zaoos-workspace repos
#    Verify the bot is still live
curl -s https://api.telegram.org/botTOKEN/getMe
# Should return bot info (confirms bot is still running)

# 7. Vercel app still runs from the new app repo
curl -s https://zaoos.com/ | head -20
# Should return HTML (app still live)
```

### Stage 3 - Rollback

If stage 3 breaks something:

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"

# Option 1: Restore the code from Git history
git reset --hard HEAD~1  # Undo the pruning commit

# Option 2: If the bot or app breaks, they should still be running from their own repos
#          (they don't depend on ZAOOS code being present)
# Restart the bot/app from their new homes to confirm they're still working

# Option 3: Restore code on a branch for reference
git checkout -b stage3-rollback
git revert HEAD
git push origin stage3-rollback
# This creates a reversible commit that others can reference
```

## Secret-hygiene: Full scanning procedure

At the END of every stage, run this procedure to confirm NO secrets leak to any repo (especially public repos).

### Before committing ANY code to a public repo:

```bash
# In the target repo (hermes-orchestrator for stage 1, new app repo for stage 2, etc.)

# 1. Scan for 64-char hex (private keys)
git diff --cached -G '[0-9a-fA-F]{64}' --no-color | grep -oE '[0-9a-fA-F]{64}' | sort -u
# Must be empty

# 2. Scan for PEM blocks (private keys, certificates)
git diff --cached -G 'BEGIN (RSA |EC |)PRIVATE KEY' --no-color
# Must be empty

# 3. Scan for GitHub PAT
git diff --cached -G 'ghp_[A-Za-z0-9]{36}' --no-color
# Must be empty

# 4. Scan for Anthropic API key
git diff --cached -G 'sk-ant-[A-Za-z0-9_-]{20,}' --no-color
# Must be empty

# 5. Scan for OpenAI API key
git diff --cached -G 'sk-[A-Za-z0-9]{32,}' --no-color
# Must be empty

# 6. Scan for Telegram bot token (high-risk if public)
git diff --cached -G 'TELEGRAM_BOT_TOKEN' --no-color | grep -v '=.*stub'
# Must be empty (allow only stubs with "stub" in the value)

# 7. Scan for .env file
git diff --cached --name-only | grep -E '^\.env'
# Must be empty

# If ANY scan finds something, ABORT THE COMMIT
# Do NOT proceed until all scans pass
```

### After committing to origin (post-push verification):

```bash
# Scan the entire committed history for secrets

git grep -E '[0-9a-fA-F]{64}' HEAD
git grep -E 'BEGIN (RSA |EC |)PRIVATE KEY' HEAD
git grep -E 'ghp_[A-Za-z0-9]{36}' HEAD
git grep -E 'sk-ant-[A-Za-z0-9_-]{20,}' HEAD
git grep -E 'sk-[A-Za-z0-9]{32,}' HEAD

# If any match is found in HEAD:
# 1. IMMEDIATELY notify Zaal (this is a critical incident)
# 2. Force-push a commit that removes the secret (if private repo)
# 3. Rotate the credential (if public repo)
# 4. Document in a confidential incident log
# 5. Do NOT push the force-push to a public repo (that makes it worse)
```

## Keep-live: VPS bot continuity plan

The VPS bot must keep running through all three stages. Here's how:

### Stage 1 (Framework split):
- ZAOOS bot/ still exists, imports engine from hermes-orchestrator (submodule/npm)
- VPS runs the ZAOOS bot/
- No downtime; bot transitions from direct imports to split imports

### Stage 2 (App split):
- ZAOOS bot/ still exists (unchanged by app extraction)
- VPS runs the ZAOOS bot/
- App deploys separately to a new Vercel project
- No downtime for either

### Stage 3 (ZAOOS narrowed):
- ZAOOS bot/ is deleted
- VPS must switch to running the bot FROM hermes-orchestrator + zaoos-workspace repos
- **Before** deleting ZAOOS bot/, **prepare** the VPS to boot from the new homes:

```bash
# On the VPS (~/.zao-os clone)

# 1. Update ~/zao-os to use the split repos
git submodule add git@github.com:bettercallzaal/hermes-orchestrator.git bot/vendor/hermes-orchestrator
git submodule add git@github.com:bettercallzaal/zaoos-workspace.git bot/vendor/zaoos-workspace

# 2. Update bot start scripts to use the new paths
# (Exact changes depend on how the bot boots)

# 3. Test locally in a tmux session BEFORE stage 3 cuts over
npm install && npm run bot:dev
# Bot must start and respond to Telegram

# 4. Only AFTER the bot is confirmed working from the new homes, proceed with stage 3
```

## Open decisions (Zaal-gated)

These decisions must be made by Zaal before migration can proceed past the open decision:

| Decision | By When | Impact | Doc reference |
|----------|---------|--------|---|
| New app repo name + visibility | Before stage 2 starts | All app deployment + DNS steps depend on this | 1025 |
| Confirm hermes-orchestrator stays public (engine only, no ops) | Before stage 1 merges | Public code review + outside contributions depend on this | 1025, 1021 |
| Confirm zaoos-workspace stays private (ops + tokens) | Before stage 1 merges | Secret scanning + access control depend on this | 1025 |
| .env var split: which vars stay in ZAOOS (if any)? | Before stage 1 merges | Secret scanning scope depends on this | 1025 |
| VPS bot boot strategy after stage 3 (submodule vs npm vs clone?) | Before stage 3 starts | VPS continuity plan depends on this | Keep-live section above |

## Next actions

| Action | Owner | Type | By When | Done |
|--------|-------|------|---------|------|
| Review + approve this plan (or request changes) | Zaal | Decision | 2026-07-13 | No |
| Decide new app repo name + visibility | Zaal | Decision | 2026-07-13 | No |
| Confirm hermes-orchestrator structure + visibility | Zaal | Decision | 2026-07-13 | No |
| Stage 1 implementation: bot framework split (PR-only, boot-verified) | Loop/Agent | Execution | 2026-07-17 | No |
| Stage 1 verification: bot boots from split boundary on VPS | Zaal | Verify | 2026-07-17 | No |
| Stage 2 implementation: new app repo + Vercel deploy (PR-only) | Loop/Agent | Execution | 2026-07-20 | No |
| Stage 2 verification: new app live at zaoos.com (DNS propagated) | Zaal | Verify | 2026-07-21 | No |
| Stage 3 implementation: prune code from ZAOOS (PR-only) | Loop/Agent | Execution | 2026-07-24 | No |
| Stage 3 verification: research library live, bot + app still running | Zaal | Verify | 2026-07-24 | No |
| Archive old code branches + cleanup temp repos | Zaal | Cleanup | 2026-07-25 | No |

## Sources

- Doc 1025 (approved 2026-07-10): ZAOOS Estate Split - target architecture
- Doc 1021 (approved 2026-07-10): ZOE Bot Factory - engine-vs-instance split
- Doc 836: ZAOOS repo census (302 API routes, 295 components, ~820 docs)
- Doc 998: GitHub repo estate audit (129 repos)
- CLAUDE.md: Secret hygiene rules + MCP guidance
- `.claude/rules/secret-hygiene.md`: Secret scanning procedures (post-deploy verification)
- Brainstorm with Zaal, 2026-07-10: Approved the split target
