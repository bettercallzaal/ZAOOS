/**
 * Songjam live audio space integration.
 *
 * Songjam hosts the $ZABAL community's live audio room at songjam.space/zabal.
 * Rather than rebuild it (ZAO already has its own 100ms/Stream rooms), we embed
 * it as a branded "type" of room you can open — the same pattern as the Juke
 * embed (/live/[spaceId]). See research/_archive/119-songjam-audio-spaces-embed/
 * and research/dev-workflows/815-songjam-site-fork-audit/.
 *
 * The `www.songjam.space` origin is already allowlisted for iframe embedding
 * (CSP frame-src) and mic/camera (Permissions-Policy) in src/middleware.ts —
 * no middleware change is needed.
 */

// Use the `www` origin so it matches the Permissions-Policy mic/camera
// allowlist exactly (Permissions-Policy origin matching is exact).
export const SONGJAM_SPACE_URL = 'https://www.songjam.space/zabal';

export const SONGJAM_SPACE_LABEL = 'ZABAL Live';

export const SONGJAM_SPACE_DESCRIPTION =
  'Live audio space for the $ZABAL community, hosted on Songjam.';

// iframe attributes required for Songjam's 100ms audio room to function inside
// the embed (mic for speaking, autoplay for incoming audio). Mirrors the Juke
// embed + the recommendation in research doc 119.
export const SONGJAM_IFRAME_ALLOW =
  'clipboard-write; microphone; camera; autoplay; fullscreen';

export const SONGJAM_IFRAME_SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation allow-modals';
