import { describe, it, expect } from "vitest";
import {
  classifyApproval,
  validateEnvelope,
  makeIdempotencyKey,
  CHANNEL_ROLES,
  EXTERNAL_CHANNELS,
  type Channel,
} from "../communication-envelope";

describe("classifyApproval - explicit-owner triggers", () => {
  // These are the things that can create real-world liability. Each must
  // escalate on its own, regardless of how routine everything else looks.
  const ownerCases: { name: string; signals: Record<string, boolean> }[] = [
    { name: "speaking personally as Zaal", signals: { speaksAsOwner: true } },
    { name: "financial claim", signals: { financialClaim: true } },
    { name: "legal or governance statement", signals: { legalOrGovernance: true } },
    { name: "sensitive dispute", signals: { sensitiveDispute: true } },
    { name: "bulk campaign", signals: { bulkCampaign: true } },
  ];

  it.each(ownerCases)("escalates to explicit-owner: $name", ({ signals }) => {
    const d = classifyApproval({
      audienceType: "team",
      channel: "telegram",
      sensitivity: "internal",
      // routineAcknowledgment would otherwise make this automatic
      signals: { routineAcknowledgment: true, ...signals },
    });
    expect(d.approvalClass).toBe("explicit-owner");
    expect(d.reasons.length).toBeGreaterThan(0);
  });

  it("escalates cold SMS but not cold Telegram", () => {
    expect(
      classifyApproval({
        audienceType: "customer",
        channel: "sms",
        sensitivity: "internal",
        signals: { coldOutreach: true },
      }).approvalClass,
    ).toBe("explicit-owner");

    expect(
      classifyApproval({
        audienceType: "team",
        channel: "telegram",
        sensitivity: "internal",
        signals: { coldOutreach: true },
      }).approvalClass,
    ).toBe("review");
  });
});

describe("classifyApproval - automatic is narrow", () => {
  it("allows routine acks to owner/team/agent", () => {
    for (const audienceType of ["owner", "team", "agent"] as const) {
      const d = classifyApproval({
        audienceType,
        channel: "telegram",
        sensitivity: "internal",
        signals: { routineAcknowledgment: true },
      });
      expect(d.approvalClass).toBe("automatic");
    }
  });

  it("never auto-sends to a public audience, even for routine content", () => {
    const d = classifyApproval({
      audienceType: "public",
      channel: "farcaster",
      sensitivity: "public",
      signals: { routineAcknowledgment: true },
    });
    expect(d.approvalClass).toBe("review");
    expect(d.reasons).toContain("public audience");
  });

  it("never auto-sends confidential content", () => {
    const d = classifyApproval({
      audienceType: "team",
      channel: "telegram",
      sensitivity: "confidential",
      signals: { routineAcknowledgment: true },
    });
    expect(d.approvalClass).toBe("review");
  });

  it("a commitment is never automatic", () => {
    const d = classifyApproval({
      audienceType: "team",
      channel: "telegram",
      sensitivity: "internal",
      signals: { routineAcknowledgment: true, makesCommitment: true },
    });
    expect(d.approvalClass).toBe("review");
    expect(d.reasons).toContain("makes a commitment");
  });
});

describe("validateEnvelope", () => {
  const good = {
    communicationId: "c1",
    agentId: "zol",
    agentInstanceId: "i1",
    channel: "discord" as Channel,
    audienceType: "community" as const,
    recipientRefs: ["#general"],
    purpose: "announce",
    sensitivity: "public" as const,
    approvalClass: "review" as const,
    messageDigest: "d1",
    idempotencyKey: "k1",
    relationshipContextRefs: [],
    sourceRefs: [],
  };

  it("passes a complete envelope", () => {
    expect(validateEnvelope(good)).toEqual([]);
  });

  it("rejects empty recipients", () => {
    expect(validateEnvelope({ ...good, recipientRefs: [] })).toContain(
      "recipientRefs must not be empty",
    );
  });

  it("rejects confidential content aimed at a public audience", () => {
    const errs = validateEnvelope({ ...good, sensitivity: "confidential", audienceType: "public" });
    expect(errs).toContain("confidential content cannot target a public audience");
  });

  it("reports every missing required field", () => {
    const errs = validateEnvelope({});
    expect(errs).toContain("missing communicationId");
    expect(errs).toContain("missing idempotencyKey");
  });
});

describe("makeIdempotencyKey", () => {
  it("is stable across retries", () => {
    const parts = {
      agentId: "zol",
      channel: "resend" as Channel,
      recipientRefs: ["a@x.com"],
      messageDigest: "abc",
    };
    expect(makeIdempotencyKey(parts)).toBe(makeIdempotencyKey(parts));
  });

  it("ignores recipient ordering so a reorder is not a new send", () => {
    const base = { agentId: "zol", channel: "resend" as Channel, messageDigest: "abc" };
    expect(makeIdempotencyKey({ ...base, recipientRefs: ["a@x.com", "b@x.com"] })).toBe(
      makeIdempotencyKey({ ...base, recipientRefs: ["b@x.com", "a@x.com"] }),
    );
  });

  it("differs when the body differs", () => {
    const base = { agentId: "zol", channel: "resend" as Channel, recipientRefs: ["a@x.com"] };
    expect(makeIdempotencyKey({ ...base, messageDigest: "one" })).not.toBe(
      makeIdempotencyKey({ ...base, messageDigest: "two" }),
    );
  });
});

describe("channel tables", () => {
  it("documents a role for every channel", () => {
    const channels: Channel[] = [
      "telegram", "discord", "clawdchat", "farcaster",
      "gmail", "resend", "mailchimp", "sms", "whatsapp",
    ];
    for (const c of channels) {
      expect(CHANNEL_ROLES[c], `no role documented for ${c}`).toBeTruthy();
    }
  });

  it("treats telegram as internal, not external", () => {
    // Telegram is Zaal's private command channel - if it were external, every
    // approval prompt would itself need approval.
    expect(EXTERNAL_CHANNELS.has("telegram")).toBe(false);
    expect(EXTERNAL_CHANNELS.has("farcaster")).toBe(true);
  });
});
