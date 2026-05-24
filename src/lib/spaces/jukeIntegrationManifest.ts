/**
 * Canonical declaration of ZAO's Juke integration. Single source of truth
 * for the public surfaces:
 *
 * - /juke-status (HTML for humans + Nicky's eyes)
 * - /api/juke/status (JSON for agents)
 * - /juke-integration.md (markdown for LLMs — llms.txt-style)
 *
 * Update this file when ZAO ships a new feature or closes an ask. The three
 * surfaces stay in sync automatically.
 */

export interface ShippedFeature {
  id: string;
  title: string;
  description: string;
  shippedAt: string;
  pr?: string;
  files: string[];
  reference?: string;
}

export interface OpenAsk {
  id: string;
  title: string;
  reason: string;
  blocks: string;
  priority: 'p0' | 'p1' | 'p2';
}

export interface IntegrationContact {
  zao_dev: string;
  general: string;
  partnership: string;
}

export interface IntegrationManifest {
  version: string;
  generated_at: string;
  about: {
    name: string;
    pitch: string;
    farcaster: string;
    site: string;
    juke_path_a_route: string;
    juke_path_b_route: string;
    public_status_route: string;
  };
  shipped: ShippedFeature[];
  open_asks: OpenAsk[];
  conventions: string[];
  contact: IntegrationContact;
}

const SHIPPED: ShippedFeature[] = [
  {
    id: 'path-a-iframe',
    title: 'Path A — keyless iframe at /live/{spaceId}',
    description:
      'Public route that embeds juke.audio/embed/{id} with ZAO chrome. No API keys, anonymous listen by default, SIWF inside the iframe for participation.',
    shippedAt: '2026-05-20',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/598',
    files: [
      'src/lib/spaces/juke.ts',
      'src/components/spaces/JukeEmbed.tsx',
      'src/app/live/[spaceId]/page.tsx',
    ],
    reference: 'juke.audio/llms.txt — Fastest Integration: Hosted Iframe',
  },
  {
    id: 'path-b-developer-create',
    title: 'Path B — server-side space creation via POST /v1/developer/spaces',
    description:
      'Key-only auth (X-Juke-Api-Key), room owner derived from app.owner_fid. Admin-or-password gated route at /api/juke/space; /live/create web form. Persists juke_spaces row on success.',
    shippedAt: '2026-05-22',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/630',
    files: [
      'src/lib/spaces/juke-api.ts',
      'src/app/api/juke/space/route.ts',
      'src/app/live/create/page.tsx',
      'scripts/test-juke-space.ts',
    ],
    reference: 'juke.audio/llms.txt — Custom Server Integration: Developer Keys',
  },
  {
    id: 'webhook-consumer',
    title: 'Inbound webhook consumer at /api/juke/webhooks',
    description:
      'HMAC-SHA256 verifier for X-Juke-Signature: t={ts},v1={hex} over `{ts}.{body}`. 5-minute replay window. Idempotent via signature_hash unique constraint. Handlers cover room.started, room.finished, participant.joined, participant.left, recording.ready.',
    shippedAt: '2026-05-23',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/640',
    files: [
      'src/app/api/juke/webhooks/route.ts',
      'src/lib/spaces/jukeWebhookVerify.ts',
      'src/lib/spaces/jukeWebhookHandlers.ts',
      'src/lib/spaces/jukeSpacesDb.ts',
      'scripts/juke-spaces-migration.sql',
      'scripts/register-juke-webhook.ts',
    ],
    reference: 'Juke 2026-05-23 PR — outbound developer webhooks',
  },
  {
    id: 'audio-off-second-screen',
    title: '?audio=off second-screen mode',
    description:
      'jukeEmbedUrl(spaceId, { audioOff: true }) returns the embed with audio disabled. UI offers a "Mute (second screen)" toggle on /live/{id}. Solves the laptop-alongside-iOS-app double-broadcast case.',
    shippedAt: '2026-05-23',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/640',
    files: ['src/lib/spaces/juke.ts', 'src/components/spaces/JukeEmbed.tsx'],
    reference: 'Juke 2026-05-23 PR — embed audio=off (item #6)',
  },
  {
    id: 'og-image',
    title: 'OG image per space',
    description:
      'generateMetadata pulls juke.audio/space/{id}/opengraph-image for Open Graph + Twitter card meta tags. Cast/X shares of /live/{id} render the Juke-branded card without ZAO having to render its own.',
    shippedAt: '2026-05-23',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/640',
    files: ['src/app/live/[spaceId]/page.tsx', 'src/lib/spaces/juke.ts'],
    reference: 'Juke 2026-05-23 PR — item #10',
  },
  {
    id: 'ios-deeplink',
    title: '"Open in Juke app" CTA',
    description:
      'jukeAppDeeplinkUrl(spaceId) returns juke.audio/space/{id}?open=app. Button on /live/{id} routes desktop visitors into the iOS app via universal link.',
    shippedAt: '2026-05-23',
    files: ['src/lib/spaces/juke.ts', 'src/app/live/[spaceId]/page.tsx'],
    reference: 'Juke 2026-05-23 PR — item #8',
  },
  {
    id: 'recording-shelf',
    title: 'Public /live/recordings shelf',
    description:
      'Lists ended Juke spaces with recording_url, most-recent first. Server-fetched from juke_spaces. Each card shows the Juke OG image + a "Listen to recording" CTA. Populated by the recording.ready webhook.',
    shippedAt: '2026-05-23',
    files: ['src/app/live/recordings/page.tsx', 'src/lib/spaces/jukeSpacesDb.ts'],
  },
  {
    id: 'recap-cast',
    title: 'Auto-cast on recording.ready',
    description:
      'After persisting recording_url, the webhook handler posts a recap cast to /zao via the @thezao official account, embedding the Juke /live/{id} URL so the Juke OG image renders in the cast preview. Silently no-ops when the @thezao signer env is missing.',
    shippedAt: '2026-05-23',
    files: ['src/lib/spaces/jukeWebhookHandlers.ts', 'src/lib/publish/auto-cast.ts'],
  },
];

const OPEN_ASKS: OpenAsk[] = [
  {
    id: 'agents',
    title: 'Agent join surface — when can ZOE sit in a Juke room?',
    reason:
      "We're passing allow_agents:true on create, but llms.txt + the 2026-05-23 PR still flag agents as a future surface. We want ZOE (Claude Opus) sitting silently in the weekly fractal + ZAOstock standups taking notes and posting a recap cast after room.finished. Even read-only/observer would unblock half the value.",
    blocks: 'ZOE-in-Juke (concierge note-taker + recap-cast generator)',
    priority: 'p0',
  },
  {
    id: 'participant-fids',
    title: 'Participant FID list',
    reason:
      'participant.joined/left webhooks give us a count but not the identities. We want to show "3 ZAO members are here" on /live and @-mention attendees in the recap cast. Either a GET /v1/rooms/{id}/participants endpoint, or include fid on the participant.* webhook payload.',
    blocks: '"Who from ZAO is here" badge + recap @-mentions',
    priority: 'p1',
  },
  {
    id: 'desktop-mic',
    title: 'Desktop browser mic publish confirmation',
    reason:
      'When a desktop SIWF user is promoted, does the web SDK actually grant mic-publish, or does it fail silently? We do not want a "Speak" CTA on desktop that breaks under load. A "yes works" / "iOS-only for now" answer is enough to set the UI right.',
    blocks: 'Honest desktop "Speak from this browser" CTA on /live/{id}',
    priority: 'p1',
  },
  {
    id: 'partner-sso-bridge',
    title: 'Parent-frame SSO so authed users on partner sites do not re-sign',
    reason:
      "ZAO uses Sign In With Neynar (SIWN) - a managed signer registered by ZAO's app FID. Juke uses SIWF (fresh EIP-4361 SIWE in the moment by user's custody). Different primitives, so a direct hand-off does not exist - a ZAO user already signed in at zaoos.com still has to do a second SIWF dance inside the Juke iframe to react/raise hand/speak. Anonymous listen is fine (one-tap autoplay bypass). Three options for an SSO bridge, in ascending lift on your side: (1) Parent-frame Quick Auth via postMessage - ZAO posts {fid, signed-proof} into the iframe, Juke mints its JWT without showing the QR. You already have the miniapp Quick Auth code path; this is essentially 'trust the parent frame like a miniapp host'. (2) Trusted-partner pre-mint endpoint - ZAO server POSTs {fid, signed-proof} to a Juke endpoint, gets back a short-lived Juke JWT, passes it as ?token=... on the iframe src. Juke trusts ZAO because we hold a developer key + a registered allowed_origin. Cleanest SSO. (3) Quick Auth via the Farcaster miniapp shell already exists but only works when ZAO is loaded INSIDE the FC client, not on zaoos.com directly. Any of these closes the double-sign-in.",
    blocks: 'Friction-free participate (react / raise hand / speak) inside ZAO OS embeds',
    priority: 'p1',
  },
  {
    id: 'oss-spec',
    title: 'Open-source SPEC.md / codebase drop',
    reason:
      'You offered to open the codebase + SPEC.md "if there was demand." ZAO is the demand. 13 files of integration code against your llms.txt + a full HMAC webhook handler. Happy to be the first community reference implementation.',
    blocks: 'Deeper integration patterns + co-marketing as reference impl',
    priority: 'p2',
  },
];

const CONVENTIONS = [
  'All Juke calls server-side. JUKE_API_KEY never leaves the server.',
  'Webhook receiver is idempotent on signature_hash + caps replay window at 5 minutes.',
  'juke_spaces is publicly readable (RLS allow-all); writes are service-role only.',
  '/live/{spaceId} is fully public — no auth required to listen.',
  'OG metadata pulls juke.audio/space/{id}/opengraph-image, so Juke renders the share card.',
  'Stage rooms (audio Clubhouse) and Video Rooms (full A+V) are ZAO concepts; both live alongside Juke.',
];

const CONTACT: IntegrationContact = {
  zao_dev: '@zaal (Farcaster) / zaal@thezao.com',
  general: 'https://www.thezao.com',
  partnership: 'See /juke-status on zaoos.com for the live build state.',
};

export function getJukeIntegrationManifest(): IntegrationManifest {
  return {
    version: '1',
    generated_at: new Date().toISOString(),
    about: {
      name: 'The ZAO',
      pitch: 'Decentralized impact network. Music as a wedge, Farcaster-native.',
      farcaster: 'https://warpcast.com/~/channel/zao',
      site: 'https://www.thezao.com',
      juke_path_a_route: '/live/{spaceId}',
      juke_path_b_route: '/api/juke/space (admin or shared password)',
      public_status_route: 'https://zaoos.com/juke-status',
    },
    shipped: SHIPPED,
    open_asks: OPEN_ASKS,
    conventions: CONVENTIONS,
    contact: CONTACT,
  };
}

/** Render the manifest as llms.txt-style markdown. Stable headings so an
 * agent can grep without parsing the JSON. */
export function renderIntegrationMarkdown(
  manifest: IntegrationManifest,
  stats?: Record<string, unknown>,
): string {
  const lines: string[] = [];
  lines.push(`# ZAO + Juke Integration`);
  lines.push('');
  lines.push(`> ${manifest.about.pitch}`);
  lines.push('');
  lines.push(`Generated: ${manifest.generated_at}`);
  lines.push(`Version: ${manifest.version}`);
  lines.push('');
  lines.push('## About');
  lines.push(`- Site: ${manifest.about.site}`);
  lines.push(`- Farcaster channel: ${manifest.about.farcaster}`);
  lines.push(`- Path A (iframe): ${manifest.about.juke_path_a_route}`);
  lines.push(`- Path B (server create): ${manifest.about.juke_path_b_route}`);
  lines.push(`- Status JSON: /api/juke/status`);
  lines.push(`- Status HTML: ${manifest.about.public_status_route}`);
  lines.push('');

  if (stats) {
    lines.push('## Live Stats');
    for (const [key, value] of Object.entries(stats)) {
      if (value === null || typeof value === 'object') continue;
      lines.push(`- ${key}: ${String(value)}`);
    }
    lines.push('');
  }

  lines.push('## Shipped');
  for (const f of manifest.shipped) {
    lines.push(`### ${f.title}`);
    lines.push(`- Shipped: ${f.shippedAt}`);
    if (f.pr) lines.push(`- PR: ${f.pr}`);
    if (f.reference) lines.push(`- Reference: ${f.reference}`);
    lines.push(`- Description: ${f.description}`);
    lines.push(`- Files:`);
    for (const file of f.files) lines.push(`  - \`${file}\``);
    lines.push('');
  }

  lines.push('## Open Asks');
  for (const a of manifest.open_asks) {
    lines.push(`### [${a.priority.toUpperCase()}] ${a.title}`);
    lines.push(`- Reason: ${a.reason}`);
    lines.push(`- Blocks: ${a.blocks}`);
    lines.push('');
  }

  lines.push('## Conventions');
  for (const c of manifest.conventions) lines.push(`- ${c}`);
  lines.push('');

  lines.push('## Contact');
  lines.push(`- ZAO dev: ${manifest.contact.zao_dev}`);
  lines.push(`- General: ${manifest.contact.general}`);
  lines.push(`- Partnership: ${manifest.contact.partnership}`);
  lines.push('');

  return lines.join('\n');
}
