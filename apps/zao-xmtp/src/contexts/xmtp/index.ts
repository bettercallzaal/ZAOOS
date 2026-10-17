// Ported from ZAOOS src/contexts/xmtp/index.ts (bettercallzaal/ZAOOS, MIT) on 2026-10-17. Code unchanged; comment em dashes became hyphens.
// Barrel export - re-exports everything from the split XMTP context modules.

export type { XMTPContextValue, ZaoMember } from '@/contexts/xmtp/types';
export { useXMTPContext, useXMTPContextSafe, XMTPProvider } from '@/contexts/xmtp/XMTPProvider';
