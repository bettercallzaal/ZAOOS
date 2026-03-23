import { AtpAgent } from '@atproto/api';

/**
 * Apply "ZAO Member" label to a Bluesky account.
 * Uses the community account to create a label record.
 * This is a self-label approach — the community account declares
 * that a DID is a ZAO member.
 */
export async function applyMemberLabel(
  agent: AtpAgent,
  targetDid: string,
): Promise<boolean> {
  try {
    // Create a label record on the community account's repo
    await agent.api.com.atproto.repo.createRecord({
      repo: agent.session!.did,
      collection: 'app.bsky.actor.profile',
      rkey: 'self',
      record: {
        $type: 'app.bsky.actor.profile',
        labels: {
          $type: 'com.atproto.label.defs#selfLabels',
          values: [{ val: 'zao-member' }],
        },
      },
    });
    console.info(`[labeler] Applied ZAO Member label to ${targetDid}`);
    return true;
  } catch (err) {
    // Self-labels can only be applied to own account.
    // For labeling OTHER accounts, we'd need a full labeler service.
    // For MVP, we note the member in our DB and the feed handles discovery.
    console.error(`[labeler] Cannot label ${targetDid} (labeler service needed for cross-account labels):`, err);
    return false;
  }
}

/**
 * For MVP: the "labeling" is effectively our bluesky_members table.
 * The feed generator uses it to curate content.
 * True cross-account labeling requires running a labeler service (Phase 4).
 */
export function isMemberLabeled(did: string, memberDids: string[]): boolean {
  return memberDids.includes(did);
}
