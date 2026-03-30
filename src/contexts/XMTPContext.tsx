/**
 * Backwards-compatible re-export.
 *
 * The XMTP context has been split into focused modules under src/contexts/xmtp/.
 * This file re-exports everything so existing imports continue to work.
 */
export { XMTPProvider, useXMTPContext, useXMTPContextSafe } from '@/contexts/xmtp';
export type { ZaoMember, XMTPContextValue } from '@/contexts/xmtp';
