// Ported from ZAOOS src/contexts/XMTPContext.tsx (bettercallzaal/ZAOOS, MIT) on 2026-10-17. Code unchanged; comment em dashes became hyphens.
/**
 * Backwards-compatible re-export.
 *
 * The XMTP context has been split into focused modules under src/contexts/xmtp/.
 * This file re-exports everything so existing imports continue to work.
 */

export type { XMTPContextValue, ZaoMember } from '@/contexts/xmtp';
export { useXMTPContext, useXMTPContextSafe, XMTPProvider } from '@/contexts/xmtp';
