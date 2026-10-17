/**
 * In ZAOOS this is a flag, default OFF. In ZAO XMTP, connecting with the
 * app-generated burner key for the signed-in FID IS the day-one path, so it is
 * always on. Kept as a function so the ported MessagesRoom stays unchanged.
 */
export function xmtpAutoConnectEnabled(): boolean {
  return true;
}
