# XMTP Messaging Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three XMTP messaging issues: broken DM initiation from messageable list, missing group member visibility/leave, and show last-login timestamps for members.

**Architecture:** Three independent fixes touching the XMTP context, sidebar UI, members API, and auth routes. Each fix is self-contained and can be committed separately.

**Tech Stack:** React 19, XMTP browser-sdk, Supabase, Next.js App Router

---

## Chunk 1: Fix DM Initiation from Messageable List

The `startDmWithMember` function in XMTPContext works correctly in isolation, but the sidebar click handler doesn't switch the view from Farcaster channels to the XMTP conversation after creating the DM. The issue: `startDmWithMember` calls `createDm` → `selectConversation`, but the ChatRoom component doesn't know to switch its view mode away from the active Farcaster channel.

### Task 1: Fix DM initiation — wire up view switch after starting DM

**Files:**
- Modify: `src/components/chat/ChatRoom.tsx:261` (wrap `startDmWithMember` to also close sidebar)
- Modify: `src/components/chat/Sidebar.tsx:355` (ensure click closes sidebar on mobile)

- [ ] **Step 1: Update ChatRoom to wrap startDmWithMember with sidebar close**

In `src/components/chat/ChatRoom.tsx`, replace the direct pass-through of `xmtp.startDmWithMember` with a handler that also closes the sidebar (like `handleConversationSelect` does):

```typescript
// Add near line 134, after handleConversationSelect
const handleStartDmWithMember = useCallback(async (member: ZaoMember) => {
  await xmtp.startDmWithMember(member);
  setSidebarOpen(false);
}, [xmtp]);
```

Then update the Sidebar prop at line 261:
```typescript
onStartDmWithMember={handleStartDmWithMember}
```

Do the same for the second Sidebar instance (mobile, around line 604):
```typescript
onStartDmWithMember={handleStartDmWithMember}
```

- [ ] **Step 2: Verify DM initiation works**

Run: `npm run build`
Expected: Build succeeds. Manual test: click a messageable member → DM opens, sidebar closes on mobile.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatRoom.tsx
git commit -m "Fix DM initiation: close sidebar after starting DM from messageable list"
```

---

## Chunk 2: Group Member Visibility and Hide/Leave

Currently groups show in the conversation list but there's no way to see who's in a group or to hide/leave it from the sidebar. The ConversationList (messages page) has a remove button, but the sidebar conversation list does not.

### Task 2: Add member count badge to group conversations in sidebar

**Files:**
- Modify: `src/components/chat/Sidebar.tsx:270-275` (add member count next to group name)

- [ ] **Step 1: Show member count on group conversations in sidebar**

In `src/components/chat/Sidebar.tsx`, in the conversation list rendering (around line 281-285), add the member count after the group name:

```tsx
<p className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium'}`}>
  {conv.peerDisplayName || conv.name}
  {conv.type === 'group' && conv.memberCount && (
    <span className="ml-1.5 text-[10px] text-gray-500 font-normal">
      {conv.memberCount} members
    </span>
  )}
</p>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/Sidebar.tsx
git commit -m "Show member count on group conversations in sidebar"
```

### Task 3: Add group info drawer with member list

**Files:**
- Create: `src/components/messages/GroupInfoDrawer.tsx`
- Modify: `src/components/chat/ChatRoom.tsx` (add state + render for drawer)
- Modify: `src/components/chat/Sidebar.tsx` (add info button on group conversations)

- [ ] **Step 1: Create GroupInfoDrawer component**

Create `src/components/messages/GroupInfoDrawer.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { XMTPConversation } from '@/types/xmtp';

interface GroupMember {
  inboxId: string;
  displayName: string;
  pfpUrl: string;
  username?: string;
}

interface GroupInfoDrawerProps {
  conversation: XMTPConversation;
  members: GroupMember[];
  loading: boolean;
  onClose: () => void;
  onRemove: () => void;
}

export function GroupInfoDrawer({ conversation, members, loading, onClose, onRemove }: GroupInfoDrawerProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0d1b2a] border-l border-gray-800 flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Group Info</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Group name + description */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#f5a623]/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">{conversation.name}</p>
              {conversation.description && (
                <p className="text-xs text-gray-500 mt-0.5">{conversation.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Members {!loading && `(${members.length})`}
            </p>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-800" />
                    <div className="h-3 bg-gray-800 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {members.map((m) => (
                  <div key={m.inboxId} className="flex items-center gap-3 py-2 px-1 rounded-md">
                    {m.pfpUrl ? (
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image src={m.pfpUrl} alt={m.displayName} fill className="rounded-full object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-400 font-medium">{m.displayName[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{m.displayName}</p>
                      {m.username && <p className="text-[10px] text-gray-500">@{m.username}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leave/Hide */}
        <div className="px-4 py-4 border-t border-gray-800">
          {confirmRemove ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Remove this group from your list? You can rejoin later.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onRemove(); onClose(); }}
                  className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-red-400/80 hover:bg-red-500/10 transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Hide Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add getGroupMembers function to XMTPContext**

In `src/contexts/XMTPContext.tsx`, add a function to fetch group members (after `removeConversation`, around line 1059):

```typescript
const getGroupMembers = useCallback(async (conversationId: string) => {
  const wc = findClientForConversation(conversationId);
  if (!wc) return [];

  try {
    const { ConversationType } = await import('@xmtp/browser-sdk');
    await wc.client.conversations.sync();
    const convos = await wc.client.conversations.list();
    const conv = convos.find((c) => c.id === conversationId);
    if (!conv || conv.conversationType !== ConversationType.Group) return [];

    const group = conv as Group;
    const xmtpMembers = await group.members();
    const { loadMemberProfile } = await import('@/lib/xmtp/client');

    return xmtpMembers.map((m) => {
      const profile = loadMemberProfile(m.inboxId);
      return {
        inboxId: m.inboxId,
        displayName: profile?.displayName || m.inboxId.slice(0, 8),
        pfpUrl: profile?.pfpUrl || '',
        username: profile?.username,
      };
    });
  } catch (err) {
    console.error('[XMTP] Failed to get group members:', err);
    return [];
  }
}, [findClientForConversation]);
```

Add `getGroupMembers` to the context value object and its `useMemo` deps array.

Also add to the `XMTPContextType` interface:
```typescript
getGroupMembers: (conversationId: string) => Promise<{ inboxId: string; displayName: string; pfpUrl: string; username?: string }[]>;
```

- [ ] **Step 3: Wire up GroupInfoDrawer in ChatRoom**

In `src/components/chat/ChatRoom.tsx`:

1. Add state:
```typescript
const [groupInfoId, setGroupInfoId] = useState<string | null>(null);
const [groupMembers, setGroupMembers] = useState<{ inboxId: string; displayName: string; pfpUrl: string; username?: string }[]>([]);
const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
```

2. Add handler:
```typescript
const handleOpenGroupInfo = useCallback(async (convId: string) => {
  setGroupInfoId(convId);
  setLoadingGroupMembers(true);
  const members = await xmtp.getGroupMembers(convId);
  setGroupMembers(members);
  setLoadingGroupMembers(false);
}, [xmtp]);
```

3. Add `onGroupInfo` prop to Sidebar:
```typescript
onGroupInfo={handleOpenGroupInfo}
```

4. Render the drawer (after the Sidebar component):
```tsx
{groupInfoId && (() => {
  const conv = xmtp.conversations.find((c) => c.id === groupInfoId);
  if (!conv) return null;
  return (
    <GroupInfoDrawer
      conversation={conv}
      members={groupMembers}
      loading={loadingGroupMembers}
      onClose={() => setGroupInfoId(null)}
      onRemove={() => xmtp.removeConversation(groupInfoId)}
    />
  );
})()}
```

- [ ] **Step 4: Add info button to group conversations in Sidebar**

In `src/components/chat/Sidebar.tsx`:

1. Add `onGroupInfo?: (id: string) => void` to `SidebarProps`
2. On group conversation items (around line 254-304), add an info icon button:

```tsx
{conv.type === 'group' && onGroupInfo && (
  <button
    onClick={(e) => { e.stopPropagation(); onGroupInfo(conv.id); }}
    className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-white transition-all"
    aria-label="Group info"
  >
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  </button>
)}
```

Wrap each conversation button in a `group` div for the hover effect.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/messages/GroupInfoDrawer.tsx src/contexts/XMTPContext.tsx src/components/chat/ChatRoom.tsx src/components/chat/Sidebar.tsx
git commit -m "Add group info drawer: member list, member count, hide group"
```

---

## Chunk 3: Last Login Timestamps

The `last_login_at` column exists in the `users` table and is already updated on both Farcaster and SIWE login. It just needs to be exposed in the members API and displayed in the sidebar.

### Task 4: Expose last_login_at in members API and show in sidebar

**Files:**
- Modify: `src/app/api/members/route.ts` (join users table to get last_login_at)
- Modify: `src/contexts/XMTPContext.tsx` (add lastLoginAt to ZaoMember interface)
- Modify: `src/components/chat/Sidebar.tsx` (display last seen under member name)

- [ ] **Step 1: Add last_login_at to members API response**

In `src/app/api/members/route.ts`, after loading allowlist members (line 80-93), cross-reference with users table to get login timestamps:

```typescript
// After the existing members mapping (line 80), add:
// Fetch last_login_at from users table for all members with FIDs
const fidsForLogin = (data || []).map((m) => m.fid).filter(Boolean);
const loginMap = new Map<number, string>();
if (fidsForLogin.length > 0) {
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('fid, last_login_at')
    .in('fid', fidsForLogin)
    .not('last_login_at', 'is', null);
  for (const u of userData || []) {
    if (u.fid && u.last_login_at) loginMap.set(u.fid, u.last_login_at);
  }
}
```

Then add `lastLoginAt` to each member in the mapping:
```typescript
return {
  fid: m.fid,
  username: m.username || enriched?.username || null,
  displayName: m.display_name || enriched?.display_name || m.ign || m.real_name || (m.fid ? `FID ${m.fid}` : 'Unknown'),
  pfpUrl: m.pfp_url || enriched?.pfp_url || null,
  addresses: [ /* ... existing ... */ ],
  lastLoginAt: m.fid ? (loginMap.get(m.fid) || null) : null,
};
```

- [ ] **Step 2: Add lastLoginAt to ZaoMember interface**

In `src/contexts/XMTPContext.tsx`, update the `ZaoMember` interface (around line 16-23):

```typescript
interface ZaoMember {
  fid: number | null;
  username: string | null;
  displayName: string;
  pfpUrl: string | null;
  addresses: string[];
  reachable: boolean;
  lastLoginAt: string | null;  // ISO timestamp
}
```

Update `checkZaoMembers` mapping (around line 488-496) to include:
```typescript
lastLoginAt: m.lastLoginAt || null,
```

- [ ] **Step 3: Display last seen in sidebar member list**

In `src/components/chat/Sidebar.tsx`, add a helper function near the top:

```typescript
function lastSeen(isoDate: string | null): string {
  if (!isoDate) return '';
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 300) return 'Active now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

Then in the messageable members section (around line 370-374), replace the username line:
```tsx
<div className="flex-1 min-w-0">
  <p className="text-xs font-medium truncate">{member.displayName}</p>
  <p className="text-[10px] text-gray-500 truncate">
    {member.lastLoginAt ? lastSeen(member.lastLoginAt) : (member.username ? `@${member.username}` : '')}
  </p>
</div>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/members/route.ts src/contexts/XMTPContext.tsx src/components/chat/Sidebar.tsx
git commit -m "Show last login time for messageable members in sidebar"
```
