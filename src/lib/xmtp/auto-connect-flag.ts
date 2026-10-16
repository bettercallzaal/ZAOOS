/**
 * XMTP auto-connect for DMs: on /messages, connect with the ZAO-generated
 * XMTP-only burner key for the session FID instead of requiring a wagmi wallet
 * signature. DEFAULT OFF: on only when NEXT_PUBLIC_XMTP_AUTO_CONNECT is exactly
 * `true`. NEXT_PUBLIC_ so the client reads it at build time.
 */
export function xmtpAutoConnectEnabled(): boolean {
  return process.env.NEXT_PUBLIC_XMTP_AUTO_CONNECT === 'true';
}
