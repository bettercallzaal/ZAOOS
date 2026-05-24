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
  {
    id: 'public-status-surfaces',
    title: 'Public build-status surfaces for the Juke team',
    description:
      'Three mirrors of this manifest: /juke-status (HTML dashboard with live stats + architecture diagram), /api/juke/status (JSON, CORS open, X-ZAO-Juke-Status: v1 header), /juke-integration.md (llms.txt-style markdown). Single source of truth in jukeIntegrationManifest.ts.',
    shippedAt: '2026-05-23',
    files: [
      'src/lib/spaces/jukeIntegrationManifest.ts',
      'src/app/juke-status/page.tsx',
      'src/app/api/juke/status/route.ts',
      'src/app/juke-integration.md/route.ts',
    ],
  },
  {
    id: 'live-public-discovery',
    title: 'Public /live index of ZAO Juke spaces',
    description:
      'Anyone can browse Live / Scheduled / Recent ZAO Juke spaces without auth. Each card routes to /live/{id} (keyless iframe). Includes a paste-link form for non-ZAO spaces.',
    shippedAt: '2026-05-23',
    files: ['src/app/live/page.tsx', 'src/app/live/JukeLinkOpener.tsx'],
  },
  {
    id: 'schedule-space-ui',
    title: 'Schedule-a-space UI on /live/create',
    description:
      'Operator form to pre-create Juke spaces with a real scheduled_at - threads through to Juke. Optional announceCast toggle. Pre-fills "1h from now, rounded up to the next half hour".',
    shippedAt: '2026-05-23',
    files: ['src/app/live/create/page.tsx', 'src/app/api/juke/space/route.ts'],
    reference: 'Juke 2026-05-23 PR — scheduled spaces (item #5)',
  },
  {
    id: 'juke-go-live-provider',
    title: 'Juke as 3rd audio provider in the Go-Live modal',
    description:
      'HostRoomModal on /spaces now exposes Juke alongside Stream.io + 100ms. When picked, the modal collapses (mode/theme/gate/multistream hidden), POSTs /api/juke/space, redirects to /live/{spaceId}.',
    shippedAt: '2026-05-23',
    files: [
      'src/lib/spaces/roomsDb.ts',
      'src/components/spaces/HostRoomModal.tsx',
      'src/app/spaces/page.tsx',
    ],
  },
  {
    id: 'spaces-unified-feed',
    title: 'Unified /spaces Live tab - Juke spaces alongside Stream/100ms',
    description:
      'Browser-side juke_spaces query in parallel with the rooms query, realtime subscription on both tables, JukeLiveSection rendered above ZAO stages when active rows exist. Cards route to /live/{id} with a purple Juke accent.',
    shippedAt: '2026-05-23',
    files: ['src/app/spaces/page.tsx'],
  },
  {
    id: 'recurring-schedule-script',
    title: 'Recurring weekly Juke schedule script',
    description:
      "scripts/schedule-zao-recurring.ts pre-creates Juke spaces for ZAO's weekly events (fractal call, ZAOstock standups). Idempotent (dedupes against juke_spaces.scheduled_at +/- 30min). Safe to wire into a weekly cron.",
    shippedAt: '2026-05-23',
    files: ['scripts/schedule-zao-recurring.ts', 'scripts/zao-recurring-events.json'],
  },
  {
    id: 'admin-register-webhook',
    title: 'Admin route to register the Juke webhook server-side',
    description:
      'POST /api/juke/admin/register-webhook calls Juke /v1/developer/webhooks from a Vercel context that already has JUKE_API_KEY loaded. Juke generates the HMAC secret server-side and returns it in the response; the admin caller copies it into the JUKE_WEBHOOK_SECRET env var (Production + Preview + Development) and redeploys. Admin-only.',
    shippedAt: '2026-05-24',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/666',
    files: ['src/app/api/juke/admin/register-webhook/route.ts'],
  },
  {
    id: 'juke-status-richer',
    title: 'Richer /juke-status: recent webhooks + recent spaces + code examples',
    description:
      "Three new sections on the public dashboard. (1) Recent webhooks - last 15 events with type / space_id / age / processed-vs-failed pill. (2) Recent spaces - last 10 juke_spaces rows with status pill + time marker + participant count + recording link. (3) Code examples - 4 reference snippets matching production (create-space, embed, webhook verify, subscribe). Plus OG + Twitter card meta on the page itself, and recent_spaces + recent_events arrays added to /api/juke/status and /juke-integration.md.",
    shippedAt: '2026-05-24',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/668',
    files: [
      'src/lib/spaces/jukeSpacesDb.ts',
      'src/app/juke-status/page.tsx',
      'src/app/api/juke/status/route.ts',
      'src/app/juke-integration.md/route.ts',
    ],
  },
  {
    id: 'register-webhook-fix',
    title: 'Register-webhook fix: Juke generates the HMAC secret, not us',
    description:
      "Initial admin route POSTed { url, events, secret } and Juke returned 422 extra_forbidden on the secret field - Juke generates the secret server-side and returns it in the response. Route now POSTs { url, events } only, captures juke.secret from the response, returns it with an action_required instructing the admin to copy it into Vercel's JUKE_WEBHOOK_SECRET env. Server logs the registration with the secret redacted.",
    shippedAt: '2026-05-24',
    pr: 'https://github.com/bettercallzaal/ZAOOS/pull/669',
    files: ['src/app/api/juke/admin/register-webhook/route.ts'],
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
    id: 'partner-sso-bridge',
    title: 'Parent-frame SSO so authed users on partner sites do not re-sign',
    reason:
      "ZAO uses Sign In With Neynar (SIWN) - managed signer registered by ZAO's app FID. Juke uses SIWF (fresh EIP-4361 SIWE in the moment by user's custody). Different primitives, so a direct hand-off does not exist - a ZAO user already signed in at zaoos.com still has to do a second SIWF dance inside the Juke iframe to participate. Anonymous listen is fine (one-tap autoplay bypass). Three options in ascending lift: (1) Parent-frame Quick Auth via postMessage - ZAO posts {fid, signed-proof} into the iframe, Juke mints its JWT without showing the QR. Likely closest to your miniapp Quick Auth code path. (2) Trusted-partner pre-mint endpoint - ZAO server POSTs {fid, signed-proof} to Juke, gets back a short-lived JWT, passes as ?token=... on iframe src. Cleanest SSO. (3) Quick Auth via miniapp shell already works when ZAO is loaded INSIDE the FC client. Any of these closes the double-sign-in.",
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

/**
 * ASCII architecture diagram shared by /juke-status (HTML) and
 * /juke-integration.md (markdown). One source so the two surfaces never drift.
 */
export const INTEGRATION_ARCHITECTURE_ASCII = String.raw`
  USER (web browser)
    |
    |  (1) loads /live/{spaceId} on zaoos.com - SSR
    v
  ZAO OS (Next.js, Vercel)
    |
    | reads juke_spaces row              (2) renders <iframe
    | (RLS public-read)                       src="juke.audio/embed/{id}">
    v                                       |
  Supabase                                  v
    |                                     Juke (juke.audio, hosted by nickysap)
    |                                       |
    |                                       |  LiveKit transport (audio + presence)
    |                                       v
    |                                     OTHER LISTENERS
    |                                       |
    |  (3) outbound webhooks                |
    |   X-Juke-Signature: t=,v1=            |
    |<--------------------------------------+
    |
    | POST /api/juke/webhooks
    v
  ZAO OS webhook receiver
    |  HMAC-verify, idempotency on signature_hash
    |  dispatch by event:
    |    room.started      -> juke_spaces.status='active'
    |    room.finished     -> juke_spaces.status='ended'
    |    participant.*     -> juke_spaces.participant_count
    |    recording.ready   -> juke_spaces.recording_url
    |                        + autoCastToZao recap to /zao channel
    v
  Supabase juke_spaces + juke_webhook_events

  CREATE PATH (host):
    USER -> /spaces (Go Live) OR /live/create
         -> POST /api/juke/space
         -> POST api.juke.audio/v1/developer/spaces
            X-Juke-Api-Key only (room owner = app.owner_fid)
         -> juke_spaces.insert
         -> redirect to /live/{spaceId}

  AGENT READ PATH (Nicky's agent):
    AGENT -> GET zaoos.com/api/juke/status (JSON)
          OR GET zaoos.com/juke-integration.md (markdown, llms.txt-style)
    same shape as juke.audio/llms.txt, refreshed on every shipped feature
`;

export function getJukeIntegrationManifest(): IntegrationManifest {
  return {
    version: '1.1',
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

  lines.push('## Architecture');
  lines.push('```');
  lines.push(INTEGRATION_ARCHITECTURE_ASCII.trim());
  lines.push('```');
  lines.push('');
  lines.push(
    'ZAO holds two persisted tables: `juke_spaces` (one row per Juke-minted space, RLS public-read) and `juke_webhook_events` (audit + idempotency, service-role only). Every other public surface is a read against those two tables or against juke.audio directly.',
  );
  lines.push('');

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
