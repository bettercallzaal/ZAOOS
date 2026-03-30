'use client';

import { useCallback } from 'react';
import type { XMTPPeerProfile } from '@/lib/xmtp/client';
import type { Dm, Group } from '@xmtp/browser-sdk';
import type { XMTPSharedRefs, XMTPSharedState, ZaoMember, AnyClient } from '@/contexts/xmtp/types';

/**
 * Hook for ZAO member discovery, DM creation, and inbox resolution.
 */
export function useMembers(
  refs: XMTPSharedRefs,
  state: XMTPSharedState,
  loadAllConversations: () => Promise<void>,
  selectConversation: (id: string | null) => void,
) {
  const {
    walletsRef, messagingPrefsRef, zaoMembersRef,
  } = refs;
  const {
    setZaoMembers, setLoadingMembers, showActionError,
  } = state;

  /**
   * Get the first connected XMTP client.
   */
  const getFirstClient = useCallback((): AnyClient | null => {
    const first = walletsRef.current.values().next();
    return first.done ? null : first.value.client;
  }, [walletsRef]);

  /**
   * Check which Farcaster follows + ZAO members are reachable via XMTP
   */
  const checkZaoMembers = useCallback(async () => {
    const client = walletsRef.current.values().next();
    if (client.done) return;
    const xmtpClient = client.value.client;

    setLoadingMembers(true);
    try {
      const membersRes = await fetch('/api/members');
      const zaoData = membersRes.ok ? await membersRes.json() : { members: [], currentFid: 0 };
      const currentFid = zaoData.currentFid;

      interface MergedMember {
        fid: number | null;
        username: string | null;
        displayName: string;
        pfpUrl: string | null;
        addresses: string[];
        storedXmtpAddress?: string | null;
        lastLoginAt?: string | null;
      }

      const merged: MergedMember[] = (zaoData.members || [])
        .filter((m: { fid: number | null }) => m.fid !== currentFid)
        .map((m: MergedMember) => ({ ...m }));

      // Build address-to-member index and batch canMessage checks
      const allAddresses: string[] = [];
      const addrToMemberIdx = new Map<string, number>();
      for (let i = 0; i < merged.length; i++) {
        for (const addr of merged[i].addresses) {
          const normalized = addr.toLowerCase();
          if (!addrToMemberIdx.has(normalized)) {
            allAddresses.push(normalized);
            addrToMemberIdx.set(normalized, i);
          }
        }
      }

      const reachableSet = new Set<number>();
      const reachableAddr = new Map<number, string>();
      if (allAddresses.length > 0) {
        try {
          const { IdentifierKind } = await import('@xmtp/browser-sdk');
          const BATCH_SIZE = 100;
          for (let i = 0; i < allAddresses.length; i += BATCH_SIZE) {
            const batch = allAddresses.slice(i, i + BATCH_SIZE);
            const identifiers = batch.map((addr) => ({
              identifierKind: IdentifierKind.Ethereum,
              identifier: addr,
            }));
            const results = await xmtpClient.canMessage(identifiers);
            for (const [addr, canMsg] of results.entries()) {
              if (canMsg) {
                const idx = addrToMemberIdx.get(addr.toLowerCase());
                if (idx !== undefined && !reachableSet.has(idx)) {
                  reachableSet.add(idx);
                  reachableAddr.set(idx, addr.toLowerCase());
                }
              }
            }
          }
        } catch (err) {
          console.error('[XMTP] canMessage check failed:', err);
        }
      }

      const mapped: ZaoMember[] = merged
        .map((m: MergedMember, idx: number) => ({
          fid: m.fid,
          username: m.username,
          displayName: m.displayName,
          pfpUrl: m.pfpUrl,
          addresses: m.addresses,
          reachable: reachableSet.has(idx),
          xmtpAddress: reachableAddr.get(idx) || m.storedXmtpAddress || m.addresses[0] || null,
          lastLoginAt: m.lastLoginAt || null,
        }))
        .sort((a: ZaoMember, b: ZaoMember) => {
          if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
          return a.displayName.localeCompare(b.displayName);
        });

      setZaoMembers(mapped);
      zaoMembersRef.current = mapped;
      setLoadingMembers(false);

      const reachable = mapped.filter((m: ZaoMember) => m.reachable);
      console.debug(`[XMTP] ${reachable.length} reachable peers found`);

      // Resolve XMTP inbox IDs BEFORE starting streams (prevents "Unknown sender")
      const reachableMembersForInbox = mapped.filter((m: ZaoMember) => m.reachable && m.addresses.length > 0);
      if (reachableMembersForInbox.length > 0) {
        try {
          const { IdentifierKind } = await import('@xmtp/browser-sdk');
          const { saveMemberProfile } = await import('@/lib/xmtp/client');
          const PARALLEL = 10;
          for (let i = 0; i < reachableMembersForInbox.length; i += PARALLEL) {
            const batch = reachableMembersForInbox.slice(i, i + PARALLEL);
            await Promise.allSettled(batch.map(async (m) => {
              const inboxId = await xmtpClient.fetchInboxIdByIdentifier({
                identifierKind: IdentifierKind.Ethereum,
                identifier: m.xmtpAddress || m.addresses[0] || '',
              });
              if (inboxId) {
                saveMemberProfile(inboxId, {
                  fid: m.fid ?? 0,
                  username: m.username ?? m.displayName,
                  displayName: m.displayName,
                  pfpUrl: m.pfpUrl ?? '',
                });
              }
            }));
          }
          console.debug(`[XMTP] Resolved inbox IDs for ${reachableMembersForInbox.length} reachable peers`);
        } catch (err) {
          console.error('[XMTP] Inbox ID resolution failed:', err);
        }
      }

      await loadAllConversations();

      // Auto-create ZAO General for reachable ZAO members (if user has autoJoinGroup enabled)
      const reachableMembers = mapped.filter((m: ZaoMember) => m.reachable && m.addresses.length > 0);
      if (reachableMembers.length > 0 && messagingPrefsRef.current.autoJoinGroup) {
        const ZAO_GROUP_KEY = 'zaoos-xmtp-zao-general';
        let groupExists = false;
        for (const [, wc] of walletsRef.current.entries()) {
          const allConvos = await wc.client.conversations.list();
          for (const c of allConvos) {
            if ((c as Group).name === 'ZAO General') {
              groupExists = true;
              localStorage.setItem(ZAO_GROUP_KEY, c.id);
              break;
            }
          }
          if (groupExists) break;
        }

        if (!groupExists) {
          try {
            const { IdentifierKind } = await import('@xmtp/browser-sdk');
            const identifiers = reachableMembers.filter((m: ZaoMember) => m.addresses.length > 0).map((m: ZaoMember) => ({
              identifierKind: IdentifierKind.Ethereum,
              identifier: m.xmtpAddress || m.addresses[0],
            }));
            const conv = await xmtpClient.conversations.createGroupWithIdentifiers(identifiers, {
              groupName: 'ZAO General',
              groupDescription: 'General chat for all ZAO members',
            });
            localStorage.setItem(ZAO_GROUP_KEY, conv.id);
            await loadAllConversations();
          } catch (err) {
            console.error('[XMTP] Failed to create ZAO General group:', err);
          }
        }
      }
    } catch (err) {
      console.error('[XMTP] Failed to check ZAO members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [walletsRef, messagingPrefsRef, zaoMembersRef, setZaoMembers, setLoadingMembers, loadAllConversations]);

  /**
   * Create or find existing DM. Uses getDmByInboxId to avoid duplicates.
   */
  const createDm = useCallback(async (peerAddress: `0x${string}`, peerProfile?: XMTPPeerProfile) => {
    const client = getFirstClient();
    if (!client) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');

      const inboxId = await client.fetchInboxIdByIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });
      if (inboxId) {
        const existing = await client.conversations.getDmByInboxId(inboxId);
        if (existing) {
          if (peerProfile) {
            const { savePeerProfile, saveMemberProfile } = await import('@/lib/xmtp/client');
            savePeerProfile(existing.id, peerProfile);
            saveMemberProfile(inboxId, peerProfile);
          }
          await loadAllConversations();
          return existing.id;
        }
      }

      const conv = await client.conversations.createDmWithIdentifier({
        identifierKind: IdentifierKind.Ethereum,
        identifier: peerAddress,
      });

      if (peerProfile) {
        const { savePeerProfile, saveMemberProfile } = await import('@/lib/xmtp/client');
        savePeerProfile(conv.id, peerProfile);
        try {
          const peerInboxId = await (conv as Dm).peerInboxId();
          if (peerInboxId) saveMemberProfile(peerInboxId, peerProfile);
        } catch { /* non-critical */ }
      }

      await loadAllConversations();
      return conv.id;
    } catch (err) {
      console.error('[XMTP] Failed to create DM:', err);
      showActionError('Failed to start conversation. The recipient may not have XMTP enabled.');
      return null;
    }
  }, [getFirstClient, loadAllConversations, showActionError]);

  /**
   * Start a DM with a ZAO member (convenience wrapper).
   */
  const startDmWithMember = useCallback(async (member: ZaoMember) => {
    if (member.addresses.length === 0) return;
    // Use the address that passed canMessage, fall back to first address
    const addr = (member.xmtpAddress || member.addresses[0]) as `0x${string}`;
    const profile: XMTPPeerProfile = {
      fid: member.fid ?? 0,
      username: member.username ?? member.displayName,
      displayName: member.displayName,
      pfpUrl: member.pfpUrl ?? '',
    };
    const convId = await createDm(addr, profile);
    if (convId) selectConversation(convId);
  }, [createDm, selectConversation]);

  return {
    getFirstClient,
    checkZaoMembers,
    createDm,
    startDmWithMember,
  };
}
