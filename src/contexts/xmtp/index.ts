// Barrel export — re-exports everything from the split XMTP context modules.

export type { XMTPContextValue, ZaoMember } from '@/contexts/xmtp/types';
export { useXMTPContext, useXMTPContextSafe, XMTPProvider } from '@/contexts/xmtp/XMTPProvider';
