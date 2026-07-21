// communication-envelope.ts - the Mouth's frozen contract.
//
// The Mouth is the swarm's governed communications organ (Brandon / DreamNet,
// 2026-07-19). The organ after the Heart: "the Heart makes the swarm persist,
// the Mouth gives it relationships, community presence and an external voice."
//
// THE POINT OF THIS FILE: every channel gets the SAME governance even though the
// final message format differs per channel. One envelope, one approval ladder,
// one receipt. The failure mode this prevents is a pile of channel integrations
// each with its own credentials and its own idea of what it may say.
//
// This module is deliberately PURE - types, tables and decision functions, no
// I/O, no adapters, no network. Channel adapters are built on top of it and must
// never bypass it. Locking this first is the same move that worked for the
// Heart's lifecycle enum: freeze the contract, then let implementation land
// against something stable.
//
// Hard boundaries (the Mouth does NOT own these):
//   - business strategy decisions
//   - authorizing spend
//   - making commitments
//   - exposing private memory
//
// See .codex-briefs/mouth-v1-build.md for the full build brief.

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

export type Channel =
  | "telegram"
  | "discord"
  | "clawdchat"
  | "farcaster"
  | "gmail"
  | "resend"
  | "mailchimp"
  | "sms"
  | "whatsapp";

/**
 * What each channel is FOR. Encoded so an agent cannot quietly repurpose a
 * channel (e.g. turning Gmail into the bulk automation engine, which is
 * explicitly not its job - Mailchimp owns campaigns, Resend owns operational
 * agent mail, Gmail stays the inbox humans actually read).
 */
export const CHANNEL_ROLES: Record<Channel, string> = {
  telegram: "Zaal's private command, approvals and important alerts",
  discord: "Community operations, public discussion, support and events",
  clawdchat: "Agent networking, A2A discovery, learning and public agent reputation",
  farcaster: "Public web3 identity, distribution and community engagement",
  gmail: "Human mailbox, relationship correspondence and reviewable drafts",
  resend: "Automated operational and transactional agent email",
  mailchimp: "Newsletters, campaigns, audience lists and marketing sequences",
  sms: "Urgent external notification via Twilio, consent-gated",
  whatsapp: "Urgent external notification via Twilio, consent-gated",
};

/** Channels that reach people outside the org - stricter defaults apply. */
export const EXTERNAL_CHANNELS: ReadonlySet<Channel> = new Set<Channel>([
  "discord",
  "clawdchat",
  "farcaster",
  "gmail",
  "resend",
  "mailchimp",
  "sms",
  "whatsapp",
]);

/** Channels that cost money per message and can wake someone up. */
export const TELEPHONY_CHANNELS: ReadonlySet<Channel> = new Set<Channel>(["sms", "whatsapp"]);

// ---------------------------------------------------------------------------
// Audience + sensitivity
// ---------------------------------------------------------------------------

export type AudienceType =
  | "owner"
  | "team"
  | "community"
  | "partner"
  | "customer"
  | "public"
  | "agent";

export type Sensitivity = "public" | "internal" | "confidential";

/**
 * Approval ladder. `automatic` may send unattended; `review` needs a human or
 * a delegated reviewer; `explicit-owner` needs Zaal specifically.
 */
export type ApprovalClass = "automatic" | "review" | "explicit-owner";

// ---------------------------------------------------------------------------
// The envelope
// ---------------------------------------------------------------------------

export interface CommunicationEnvelope {
  communicationId: string;
  /** Links this message back to the Heart's run/assignment that produced it. */
  assignmentId?: string;
  agentId: string;
  agentInstanceId: string;

  channel: Channel;
  audienceType: AudienceType;

  recipientRefs: string[];
  threadRef?: string;

  purpose: string;
  sensitivity: Sensitivity;
  approvalClass: ApprovalClass;

  messageDigest: string;
  /** Prevents a retry from double-sending. Required on every send. */
  idempotencyKey: string;
  relationshipContextRefs: string[];
  sourceRefs: string[];
}

// ---------------------------------------------------------------------------
// Approval classification
// ---------------------------------------------------------------------------

/**
 * Signals that push a message up the approval ladder. These are the things that
 * make speech consequential, so they are inputs to the decision rather than
 * something a drafting agent gets to assert about itself.
 */
export interface SpeechSignals {
  /** Message speaks personally AS Zaal (not as an agent on his behalf). */
  speaksAsOwner?: boolean;
  /** Contains a financial promise, price, payment or funding claim. */
  financialClaim?: boolean;
  /** Contains a legal, governance or press statement. */
  legalOrGovernance?: boolean;
  /** Makes a commitment or promise on behalf of the org. */
  makesCommitment?: boolean;
  /** Bulk send to a list rather than a person/thread. */
  bulkCampaign?: boolean;
  /** First contact - no established relationship with this recipient. */
  coldOutreach?: boolean;
  /** Party to a sensitive dispute or conflict escalation. */
  sensitiveDispute?: boolean;
  /** Rendered from a template previously approved for this audience. */
  previouslyApprovedTemplate?: boolean;
  /** Pure acknowledgment/status/help-doc content, no new claims. */
  routineAcknowledgment?: boolean;
}

export interface ApprovalDecision {
  approvalClass: ApprovalClass;
  /** Every reason that applied - useful in the receipt and for debugging. */
  reasons: string[];
}

/**
 * Decide how much human sign-off a message needs.
 *
 * Escalation is one-way: any explicit-owner trigger wins over any automatic
 * one. The defaults are deliberately conservative - anything reaching outside
 * the org lands at `review` unless it is a routine ack or a pre-approved
 * template, because the expensive failure here is an agent saying something
 * public that cannot be unsaid.
 */
export function classifyApproval(input: {
  audienceType: AudienceType;
  channel: Channel;
  sensitivity: Sensitivity;
  signals?: SpeechSignals;
}): ApprovalDecision {
  const s = input.signals ?? {};
  const reasons: string[] = [];

  // --- explicit owner: things only Zaal may authorize -----------------------
  if (s.speaksAsOwner) {
    reasons.push("speaks personally as the owner");
  }
  if (s.financialClaim) {
    reasons.push("contains a financial promise or claim");
  }
  if (s.legalOrGovernance) {
    reasons.push("contains a legal, governance or press statement");
  }
  if (s.sensitiveDispute) {
    reasons.push("involves a sensitive dispute");
  }
  if (s.bulkCampaign) {
    reasons.push("bulk campaign send");
  }
  if (TELEPHONY_CHANNELS.has(input.channel) && s.coldOutreach) {
    reasons.push("SMS/WhatsApp outside an established relationship");
  }
  if (reasons.length > 0) {
    return { approvalClass: "explicit-owner", reasons };
  }

  // --- automatic: narrow, and never for confidential content ----------------
  const harmless =
    (s.routineAcknowledgment || s.previouslyApprovedTemplate) &&
    !s.makesCommitment &&
    !s.coldOutreach &&
    input.sensitivity !== "confidential";

  if (harmless) {
    // Owner/team/agent traffic can flow unattended; anything public still gets
    // eyes even when the content looks routine.
    if (input.audienceType === "owner" || input.audienceType === "team" || input.audienceType === "agent") {
      return {
        approvalClass: "automatic",
        reasons: [s.previouslyApprovedTemplate ? "previously approved template" : "routine acknowledgment"],
      };
    }
  }

  // --- everything else is reviewable ---------------------------------------
  const why: string[] = [];
  if (s.makesCommitment) why.push("makes a commitment");
  if (s.coldOutreach) why.push("cold outreach");
  if (input.audienceType === "public") why.push("public audience");
  if (input.audienceType === "partner") why.push("partner audience");
  if (EXTERNAL_CHANNELS.has(input.channel)) why.push(`external channel (${input.channel})`);
  if (input.sensitivity === "confidential") why.push("confidential content");
  if (why.length === 0) why.push("default: consequential speech requires review");

  return { approvalClass: "review", reasons: why };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Structural validation of an envelope before it may be handed to an adapter.
 * Adapters must refuse anything that fails this - it is the choke point that
 * makes "one governed voice" true rather than aspirational.
 */
export function validateEnvelope(e: Partial<CommunicationEnvelope>): string[] {
  const errors: string[] = [];
  const required: (keyof CommunicationEnvelope)[] = [
    "communicationId",
    "agentId",
    "agentInstanceId",
    "channel",
    "audienceType",
    "purpose",
    "sensitivity",
    "approvalClass",
    "messageDigest",
    "idempotencyKey",
  ];
  for (const k of required) {
    if (!e[k]) errors.push(`missing ${k}`);
  }
  if (!e.recipientRefs || e.recipientRefs.length === 0) {
    errors.push("recipientRefs must not be empty");
  }
  // Confidential content must never be addressed to a public audience - this is
  // the public/private boundary check in structural form.
  if (e.sensitivity === "confidential" && e.audienceType === "public") {
    errors.push("confidential content cannot target a public audience");
  }
  return errors;
}

/**
 * Deterministic idempotency key: the same logical message retried produces the
 * same key, so a retry after a timeout cannot double-send. Callers should pass
 * a stable digest of the rendered body.
 */
export function makeIdempotencyKey(parts: {
  agentId: string;
  channel: Channel;
  recipientRefs: string[];
  messageDigest: string;
  threadRef?: string;
}): string {
  return [
    parts.agentId,
    parts.channel,
    [...parts.recipientRefs].sort().join(","),
    parts.threadRef ?? "-",
    parts.messageDigest,
  ].join("|");
}
