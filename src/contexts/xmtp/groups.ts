'use client';

import { useCallback } from 'react';
import type { Dm, Group } from '@xmtp/browser-sdk';
import type { XMTPPeerProfile } from '@/lib/xmtp/client';
import type { XMTPSharedRefs, XMTPSharedState, AnyClient, ZaoMember } from '@/contexts/xmtp/types';

/**
 * Hook for group chat functionality: create, leave, get members.
 */
export function useGroups(
  refs: XMTPSharedRefs,
  state: XMTPSharedState,
  getFirstClient: () => AnyClient | null,
  findClientForConversation: (convId: string) => Promise<{ client: AnyClient; address: string } | null>,
  loadAllConversations: () => Promise<void>,
  removeConversation: (id: string) => void,
) {
  const { showActionError, zaoMembers } = state;

  /**
   * Create a new group conversation.
   */
  const createGroup = useCallback(async (name: string, members: { address: `0x${string}`; profile?: XMTPPeerProfile }[]) => {
    const client = getFirstClient();
    if (!client) return null;

    try {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const identifiers = members.map((m) => ({
        identifierKind: IdentifierKind.Ethereum,
        identifier: m.address,
      }));
      const conv = await client.conversations.createGroupWithIdentifiers(identifiers, {
        groupName: name,
        groupDescription: `ZAO group: ${name}`,
      });

      const profiledMembers = members.filter((m) => m.profile);
      if (profiledMembers.length > 0) {
        try {
          const group = conv as Group;
          const xmtpMembers = await group.members();
          const { saveMemberProfile } = await import('@/lib/xmtp/client');
          for (const xm of xmtpMembers) {
            const addresses = (xm.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
            const matched = profiledMembers.find((pm) =>
              addresses.includes(pm.address.toLowerCase())
            );
            if (matched?.profile && xm.inboxId) {
              saveMemberProfile(xm.inboxId, matched.profile);
            }
          }
        } catch { /* non-critical */ }
      }

      await loadAllConversations();
      return conv.id;
    } catch (err) {
      console.error('[XMTP] Failed to create group:', err);
      showActionError('Failed to create group. Some members may not have XMTP enabled.');
      return null;
    }
  }, [getFirstClient, loadAllConversations, showActionError]);

  /**
   * Leave a group conversation on the XMTP network and remove from UI.
   */
  const leaveGroup = useCallback(async (id: string) => {
    const result = await findClientForConversation(id);
    if (!result) {
      showActionError('Could not find this conversation.');
      return;
    }
    try {
      await result.client.conversations.sync();
      const convos = await result.client.conversations.list();
      const conv = convos.find((c) => c.id === id);
      if (conv && result.client.inboxId) {
        const group = conv as Group;
        await group.removeMembers([result.client.inboxId]);
      }
    } catch (err) {
      console.error('[XMTP] Failed to leave group on network:', err);
      // Still remove locally even if network leave fails
    }
    // Remove from local state
    removeConversation(id);
  }, [findClientForConversation, removeConversation, showActionError]);

  /**
   * Get the member list for a group conversation.
   * Reads cached profiles from localStorage; falls back to truncated inbox IDs.
   */
  const getGroupMembers = useCallback(async (conversationId: string) => {
    const result = await findClientForConversation(conversationId);
    if (!result) return [];

    try {
      await result.client.conversations.sync();
      const convos = await result.client.conversations.list();
      const dms = await result.client.conversations.listDms();
      const dmIds = new Set(dms.map((d: Dm) => d.id));
      const conv = convos.find((c) => c.id === conversationId);
      if (!conv || dmIds.has(conv.id)) return [];

      const group = conv as Group;
      const xmtpMembers = await group.members();
      const { getMemberProfiles } = await import('@/lib/xmtp/client');
      const profiles = getMemberProfiles();

      return xmtpMembers.map((m) => {
        const profile = profiles[m.inboxId];
        if (profile) {
          return {
            inboxId: m.inboxId,
            displayName: profile.displayName,
            pfpUrl: profile.pfpUrl || '',
            username: profile.username,
          };
        }
        // Fallback: cross-reference accountIdentifiers with zaoMembers
        const addresses = (m.accountIdentifiers ?? []).map((id: { identifier: string }) => id.identifier.toLowerCase());
        const matched = zaoMembers.find((zm: ZaoMember) =>
          zm.addresses.some((a) => addresses.includes(a.toLowerCase()))
        );
        if (matched) {
          return {
            inboxId: m.inboxId,
            displayName: matched.displayName,
            pfpUrl: matched.pfpUrl ?? '',
            username: matched.username ?? matched.displayName,
          };
        }
        return {
          inboxId: m.inboxId,
          displayName: m.inboxId.slice(0, 8),
          pfpUrl: '',
          username: undefined,
        };
      });
    } catch (err) {
      console.error('[XMTP] Failed to get group members:', err);
      return [];
    }
  }, [findClientForConversation, zaoMembers]);

  return {
    createGroup,
    leaveGroup,
    getGroupMembers,
  };
}
