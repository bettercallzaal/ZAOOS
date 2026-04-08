# ZOE Dashboard v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add build awareness, task chains, file access, and code ship flow to zoe.zaoos.com so it becomes the daily driver command center.

**Architecture:** New `build_events` Supabase table + `chain_id` column on `agent_events`. ZOE's auto-pull cron logs git/PR state. Dashboard reads from Supabase. Complex queries route through `/api/chat` to real ZOE. BUILDER follows a structured ship protocol.

**Tech Stack:** Vite + React (existing `/tmp/zoe-dashboard/`), Supabase REST API, Node.js server (`server.js`), OpenClaw agents on VPS

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260407_build_events.sql` | Create | build_events table + chain_id column |
| `/tmp/zoe-dashboard/src/lib/config.ts` | Modify | Add BuildEvent interface |
| `/tmp/zoe-dashboard/src/lib/api.ts` | Modify | Add fetchBuildEvents(), detectChain() |
| `/tmp/zoe-dashboard/src/components/BuildStatus.tsx` | Create | Hub card for commits, PRs, deploys |
| `/tmp/zoe-dashboard/src/components/ChatView.tsx` | Modify | Add chain detection, file access keywords, build keywords |
| `/tmp/zoe-dashboard/src/components/SmartSuggestions.tsx` | Modify | Add build-related suggestions |
| `/tmp/zoe-dashboard/src/App.tsx` | Modify | Add BuildStatus to HubView |

---

### Task 1: Supabase Migration — build_events + chain_id

**Files:**
- Create: `supabase/migrations/20260407_build_events.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Build events for ZOE dashboard code ship flow
CREATE TABLE IF NOT EXISTS build_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    text NOT NULL,
  title         text,
  url           text,
  branch        text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_build_events_type ON build_events(event_type);
CREATE INDEX idx_build_events_created ON build_events(created_at DESC);

ALTER TABLE build_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read build events" ON build_events FOR SELECT USING (true);
CREATE POLICY "Service role can insert" ON build_events FOR INSERT WITH CHECK (true);

-- Add chain_id to agent_events for task chains
ALTER TABLE agent_events ADD COLUMN IF NOT EXISTS chain_id uuid;
CREATE INDEX idx_agent_events_chain ON agent_events(chain_id) WHERE chain_id IS NOT NULL;
```

- [ ] **Step 2: Run the migration in Supabase dashboard**

Paste the SQL into Supabase SQL Editor and run. Verify:
```sql
SELECT count(*) FROM build_events;
-- Expected: 0 rows, no error
SELECT column_name FROM information_schema.columns WHERE table_name = 'agent_events' AND column_name = 'chain_id';
-- Expected: 1 row
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260407_build_events.sql
git commit -m "feat: build_events table + chain_id column for dashboard v2"
```

---

### Task 2: Config + API Updates

**Files:**
- Modify: `/tmp/zoe-dashboard/src/lib/config.ts`
- Modify: `/tmp/zoe-dashboard/src/lib/api.ts`

- [ ] **Step 1: Add BuildEvent interface to config.ts**

Add after the `Contact` interface:

```typescript
export interface BuildEvent {
  id: string;
  event_type: string;
  title: string | null;
  url: string | null;
  branch: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
```

- [ ] **Step 2: Add build API functions to api.ts**

Add after the `chatZoe` function:

```typescript
export async function fetchBuildEvents(limit = 10): Promise<BuildEvent[]> {
  return querySupabase<BuildEvent>('build_events', `order=created_at.desc&limit=${limit}`);
}

export function detectChain(text: string): string[] | null {
  const chainWords = /\s+then\s+|\s+after that\s+|\s+once done\s+|\s+when finished\s+|\s+next\s+/i;
  if (!chainWords.test(text)) return null;
  return text.split(chainWords).map(s => s.trim()).filter(Boolean);
}

export function guessAgent(task: string): string {
  const lower = task.toLowerCase();
  if (['research', 'find out', 'look up', 'investigate', 'scan', 'pulse'].some(k => lower.includes(k))) return 'scout';
  if (['draft', 'post', 'write', 'cast', 'content'].some(k => lower.includes(k))) return 'caster';
  if (['fix', 'build', 'code', 'implement', 'create branch', 'pr'].some(k => lower.includes(k))) return 'builder';
  if (['balance', 'transfer', 'register', 'on-chain', 'wallet'].some(k => lower.includes(k))) return 'wallet';
  if (['contact', 'add', 'who do i know', 'rolodex', 'outreach'].some(k => lower.includes(k))) return 'rolo';
  if (['test', 'check', 'verify', 'health'].some(k => lower.includes(k))) return 'zoey';
  return 'main';
}
```

Also add the import for `BuildEvent` at the top of api.ts:

```typescript
import type { AgentEvent, Contact, BuildEvent } from './config';
```

- [ ] **Step 3: Verify build**

```bash
cd /tmp/zoe-dashboard && npm run build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /tmp/zoe-dashboard && git add -A && git commit -m "feat: BuildEvent type + chain detection + agent guessing"
```

---

### Task 3: BuildStatus Component

**Files:**
- Create: `/tmp/zoe-dashboard/src/components/BuildStatus.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { AGENTS } from '../lib/config';
import type { BuildEvent } from '../lib/config';
import { timeAgo, dispatchAgent } from '../lib/api';

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  commit: { icon: '📝', color: '#34D399' },
  branch_created: { icon: '🌿', color: '#60A5FA' },
  pr_opened: { icon: '🔀', color: '#A78BFA' },
  pr_merged: { icon: '✅', color: '#34D399' },
  deploy_success: { icon: '🚀', color: '#34D399' },
  deploy_failed: { icon: '❌', color: '#F87171' },
  build_started: { icon: '🔄', color: '#FBBF24' },
};

export function BuildStatus({ events }: { events: BuildEvent[] }) {
  if (events.length === 0) return null;

  const latestCommit = events.find(e => e.event_type === 'commit');
  const openPRs = events.filter(e => e.event_type === 'pr_opened');
  const activeBranch = events.find(e => e.event_type === 'branch_created' && !events.some(m => m.event_type === 'pr_merged' && m.branch === e.branch));
  const latestDeploy = events.find(e => e.event_type === 'deploy_success' || e.event_type === 'deploy_failed');

  const handleApprove = (branch: string) => {
    dispatchAgent('builder', `Create a PR for branch ${branch} to main, then merge it. Log to Supabase build_events.`);
  };

  const handleReject = (branch: string) => {
    dispatchAgent('builder', `Delete branch ${branch} and abandon the work. git push origin --delete ${branch}. Log to Supabase build_events.`);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>Build Status</div>
      <div style={{ background: '#1a2a4a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', padding: 14 }}>

        {latestCommit && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: activeBranch || openPRs.length ? 10 : 0 }}>
            <span>📝</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#d1d5db' }}>
                <strong>main</strong> — {latestCommit.title}
              </div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                {timeAgo(latestCommit.created_at)}
                {latestCommit.metadata.additions !== undefined && (
                  <span> · <span style={{ color: '#34D399' }}>+{String(latestCommit.metadata.additions)}</span> <span style={{ color: '#F87171' }}>-{String(latestCommit.metadata.deletions)}</span></span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeBranch && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, marginTop: 2 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>🌿</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#60A5FA' }}>{activeBranch.branch}</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>
                  {activeBranch.title} · {timeAgo(activeBranch.created_at)}
                </div>
              </div>
            </div>
            {latestDeploy && latestDeploy.event_type === 'deploy_success' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {latestDeploy.metadata.preview_url && (
                  <a href={String(latestDeploy.metadata.preview_url)} target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 11,
                    background: 'rgba(96,165,250,0.1)', color: '#60A5FA', borderRadius: 6, textDecoration: 'none',
                    border: '1px solid rgba(96,165,250,0.2)',
                  }}>Preview</a>
                )}
                <button onClick={() => handleApprove(activeBranch.branch!)} style={{
                  flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 'bold',
                  background: '#34D399', color: '#0a1628', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>Approve</button>
                <button onClick={() => handleReject(activeBranch.branch!)} style={{
                  flex: 1, padding: '6px 0', fontSize: 11,
                  background: 'rgba(248,113,113,0.1)', color: '#F87171', borderRadius: 6, border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', fontFamily: 'inherit',
                }}>Reject</button>
              </div>
            )}
            {latestDeploy && latestDeploy.event_type === 'deploy_failed' && (
              <div style={{ marginTop: 6, fontSize: 10, color: '#F87171', background: 'rgba(248,113,113,0.1)', padding: '4px 8px', borderRadius: 4 }}>
                ❌ Build failed
              </div>
            )}
          </div>
        )}

        {openPRs.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, marginTop: 2 }}>
            {openPRs.map(pr => (
              <div key={pr.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span>🔀</span>
                <a href={pr.url || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#A78BFA', textDecoration: 'none', flex: 1 }}>
                  PR #{String(pr.metadata.pr_number || '?')} — {pr.title}
                </a>
              </div>
            ))}
          </div>
        )}

        {events.length === 0 && (
          <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', padding: 8 }}>No build activity yet</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /tmp/zoe-dashboard && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd /tmp/zoe-dashboard && git add -A && git commit -m "feat: BuildStatus component — commits, PRs, deploys, approve/reject"
```

---

### Task 4: Wire BuildStatus into Hub + Add Build Suggestions

**Files:**
- Modify: `/tmp/zoe-dashboard/src/App.tsx`
- Modify: `/tmp/zoe-dashboard/src/components/SmartSuggestions.tsx`

- [ ] **Step 1: Add BuildStatus to HubView in App.tsx**

Add import at top:
```typescript
import { BuildStatus } from './components/BuildStatus';
```

Add state for build events in App component:
```typescript
const [buildEvents, setBuildEvents] = useState<BuildEvent[]>([]);
```

Add to loadEvents callback:
```typescript
const buildData = await fetchBuildEvents(10);
setBuildEvents(buildData);
```

Add imports for `fetchBuildEvents` and `BuildEvent`:
```typescript
import { fetchAllEvents, fetchBuildEvents } from './lib/api';
import type { AgentEvent, BuildEvent } from './lib/config';
```

Pass buildEvents to HubView:
```typescript
{tab === 'hub' && <HubView events={events} buildEvents={buildEvents} onNavigate={handleNavigate} onTapAgent={handleTapAgent} onChat={(msg) => { setChatMessage(msg); setTab('chat'); }} />}
```

Update HubView props and add BuildStatus after MorningBrief:
```typescript
function HubView({ events, buildEvents, onNavigate, onTapAgent, onChat }: { events: AgentEvent[]; buildEvents: BuildEvent[]; onNavigate: (tab: string) => void; onTapAgent: (id: string) => void; onChat?: (msg: string) => void }) {
  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SmartSuggestions events={events} buildEvents={buildEvents} onNavigate={onNavigate} onChat={onChat} />
      <MorningBrief events={events} />
      <BuildStatus events={buildEvents} />
      <AgentGrid events={events} onTapAgent={onTapAgent} />
      ...
```

- [ ] **Step 2: Add build suggestions to SmartSuggestions.tsx**

Update the function signature to accept buildEvents:
```typescript
export function SmartSuggestions({ events, buildEvents, onNavigate, onChat }: { events: AgentEvent[]; buildEvents?: BuildEvent[]; onNavigate: (tab: string) => void; onChat?: (msg: string) => void }) {
```

Pass buildEvents to buildSuggestions:
```typescript
const suggestions = buildSuggestions(events, onNavigate, onChat, buildEvents);
```

Update buildSuggestions signature and add build suggestions before the time-based ones:
```typescript
function buildSuggestions(events: AgentEvent[], onNavigate: (tab: string) => void, onChat?: (msg: string) => void, buildEvents?: BuildEvent[]): Suggestion[] {
```

Add after the approval/blocked checks:
```typescript
  // Build events — PR ready for review
  if (buildEvents) {
    const deploySuccess = buildEvents.find(e => e.event_type === 'deploy_success');
    const activeBranch = buildEvents.find(e => e.event_type === 'branch_created');
    if (deploySuccess && activeBranch) {
      suggestions.push({
        emoji: '🚀',
        label: 'Preview ready — review?',
        sublabel: activeBranch.branch || 'feature branch',
        action: () => onNavigate('hub'),
        urgent: true,
        agentColor: '#34D399',
      });
    }

    const deployFailed = buildEvents.find(e => e.event_type === 'deploy_failed');
    if (deployFailed) {
      suggestions.push({
        emoji: '❌',
        label: 'Build failed',
        sublabel: deployFailed.branch || 'check logs',
        action: () => onNavigate('feed'),
        urgent: true,
        agentColor: '#F87171',
      });
    }
  }
```

Add BuildEvent import:
```typescript
import type { BuildEvent } from '../lib/config';
```

- [ ] **Step 3: Verify build**

```bash
cd /tmp/zoe-dashboard && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd /tmp/zoe-dashboard && git add -A && git commit -m "feat: BuildStatus in Hub + build-aware smart suggestions"
```

---

### Task 5: Chat — Task Chains + File Access + Build Keywords

**Files:**
- Modify: `/tmp/zoe-dashboard/src/components/ChatView.tsx`

- [ ] **Step 1: Add chain detection imports**

Add to imports at top of ChatView.tsx:
```typescript
import { detectChain, guessAgent, dispatchAgent } from '../lib/api';
```

- [ ] **Step 2: Add chain handling before the dispatch section**

Add this block before the existing `if (lower.includes('dispatch')` block:

```typescript
  // Task chains — "research X then draft about it"
  const chain = detectChain(text);
  if (chain && chain.length >= 2) {
    const chainId = crypto.randomUUID();
    const firstTask = chain[0];
    const firstAgent = guessAgent(firstTask);
    const agent = AGENTS.find(a => a.id === firstAgent);

    await dispatchAgent(firstAgent, `${firstTask}. CHAIN TASK (chain_id: ${chainId}, step 1 of ${chain.length}). When done, log to Supabase with chain_id. Next step: "${chain[1]}"`);

    const steps = chain.map((step, i) => `${i + 1}. ${AGENTS.find(a => a.id === guessAgent(step))?.emoji || '🦞'} ${step}`).join('\n');
    return { id, role: 'zoe', text: `Chain started (${chain.length} steps):\n\n${steps}\n\nStep 1 dispatched to **${agent?.name}**. I'll auto-start the next step when it finishes.`, timestamp: new Date(), chips: ['Check status'] };
  }
```

- [ ] **Step 3: Add file access keywords**

Add this block after the "needs attention" section and before the "find" section:

```typescript
  // File access — "show me scout results", "read the timeline"
  if (['show me', 'read the', 'read ', 'what did'].some(k => lower.startsWith(k)) && ['results', 'findings', 'file', 'timeline', 'budget', 'vendors', 'outreach'].some(k => lower.includes(k))) {
    const response = await chatZoe(text, 'main');
    return { id, role: 'zoe', text: response, timestamp: new Date(), chips: ['Status', 'Events'] };
  }
```

- [ ] **Step 4: Add build keywords**

Add this block after the file access section:

```typescript
  // Build commands — "fix X", "build X", "ship X"
  if (['fix ', 'build ', 'ship ', 'implement ', 'create '].some(k => lower.startsWith(k)) && !lower.includes('contact')) {
    const task = text;
    await dispatchAgent('builder', `Code task: ${task}. Follow ship protocol: 1) git checkout main && git pull. 2) Create ws/ branch. 3) Implement. 4) Commit + push. 5) Log branch_created to Supabase build_events. 6) Run gh pr checks. 7) Log deploy result. 8) Wait for approval.`);
    return { id, role: 'zoe', text: `🔨 Dispatched to **BUILDER**: "${task}"\n\nBUILDER will create a branch, implement, push, and check the build. Watch the Build Status card for progress.`, timestamp: new Date(), chips: ['Check status', 'View feed'] };
  }
```

- [ ] **Step 5: Verify build**

```bash
cd /tmp/zoe-dashboard && npm run build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
cd /tmp/zoe-dashboard && git add -A && git commit -m "feat: task chains, file access, build commands in ChatView"
```

---

### Task 6: Update VALID_AGENTS in Server

**Files:**
- Modify: `/tmp/zoe-server-v2.js`

- [ ] **Step 1: Add stock and festivals to agent whitelist**

Update the VALID_AGENTS set:
```javascript
const VALID_AGENTS = new Set(['main', 'zoey', 'builder', 'scout', 'wallet', 'fishbowlz', 'caster', 'rolo', 'stock', 'festivals']);
```

- [ ] **Step 2: Commit**

Save and prepare for deploy.

---

### Task 7: Build, Deploy, Test

- [ ] **Step 1: Build the dashboard**

```bash
cd /tmp/zoe-dashboard && npm run build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 2: Deploy to VPS**

```bash
cd /tmp/zoe-dashboard && tar czf /tmp/zoe-dist-v11.tar.gz dist/
scp /tmp/zoe-dist-v11.tar.gz /tmp/zoe-server-v2.js zaal@31.97.148.88:/tmp/
ssh zaal@31.97.148.88 'docker cp /tmp/zoe-dist-v11.tar.gz openclaw-openclaw-gateway-1:/home/node/openclaw-workspace/zoe-dashboard/ && docker cp /tmp/zoe-server-v2.js openclaw-openclaw-gateway-1:/home/node/openclaw-workspace/zoe-dashboard/server.js && docker exec openclaw-openclaw-gateway-1 bash -c "cd /home/node/openclaw-workspace/zoe-dashboard && rm -rf dist && tar xzf zoe-dist-v11.tar.gz && rm zoe-dist-v11.tar.gz"'
```

Restart server:
```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 bash -c "pkill -f \"node /home/node/openclaw-workspace/zoe-dashboard/server.js\" 2>/dev/null; true"'
sleep 2
ssh zaal@31.97.148.88 'docker exec -d openclaw-openclaw-gateway-1 node /home/node/openclaw-workspace/zoe-dashboard/server.js'
```

- [ ] **Step 3: Verify deployment**

```bash
curl -s -o /dev/null -w "%{http_code}" https://zoe.zaoos.com/
```

Expected: 200

- [ ] **Step 4: Run backend tests**

```bash
# Test dispatch with new agents
curl -s -X POST https://zoe.zaoos.com/api/dispatch -H "Content-Type: application/json" -d '{"agent":"stock","message":"test"}'
# Expected: {"status":"dispatched","agent":"stock"}

curl -s -X POST https://zoe.zaoos.com/api/dispatch -H "Content-Type: application/json" -d '{"agent":"festivals","message":"test"}'
# Expected: {"status":"dispatched","agent":"festivals"}

# Test build_events query
curl -s "https://efsxtoxvigqowjhgcbiz.supabase.co/rest/v1/build_events?limit=1" -H "apikey: ANON_KEY" -H "Authorization: Bearer ANON_KEY"
# Expected: [] (empty array, no error)
```

- [ ] **Step 5: Manual smoke test**

- [ ] Open zoe.zaoos.com → Hub shows Build Status card (empty until first build event)
- [ ] Type "fix the login button" → BUILDER dispatched with ship protocol
- [ ] Type "research farcaster then draft a post about it" → chain detected, step 1 dispatched
- [ ] Type "show me scout results" → routes to ZOE, returns file contents
- [ ] Type "help" → includes build commands in help text
- [ ] Smart suggestions show build-related items when deploy events exist
