import { describe, it, expect, beforeEach } from "vitest";
import {
  createInitialRecord,
  isFatalProviderError,
  transitionOnSuccess,
  transitionOnFailure,
  checkProviderLiveness,
  getProviderHealth,
  recordProviderSuccess,
  recordProviderFailure,
  isProviderAvailableForCall,
  prioritizeProviders,
  resetProviderHealth,
  getAllProviderHealth,
  DEFAULT_CONFIG,
} from "../provider-health";

describe("provider-health state machine", () => {
  beforeEach(() => {
    resetProviderHealth();
  });

  describe("pure state transitions", () => {
    it("starts in HEALTHY with zero failures", () => {
      const rec = createInitialRecord("openrouter", 1000);
      expect(rec.state).toBe("HEALTHY");
      expect(rec.consecutiveFailures).toBe(0);
      expect(rec.consecutiveSuccesses).toBe(0);
      expect(rec.totalFailures).toBe(0);
      expect(rec.totalSuccesses).toBe(0);
    });

    it("transitions HEALTHY -> DEGRADED -> SUSPECT -> UNAVAILABLE on consecutive non-fatal errors", () => {
      const t0 = 1000;
      let rec = createInitialRecord("openrouter", t0);

      // 1st failure: DEGRADED
      rec = transitionOnFailure(rec, new Error("gateway timeout"), t0 + 10);
      expect(rec.state).toBe("DEGRADED");
      expect(rec.consecutiveFailures).toBe(1);

      // 2nd failure: SUSPECT
      rec = transitionOnFailure(rec, new Error("rate limited 429"), t0 + 20);
      expect(rec.state).toBe("SUSPECT");
      expect(rec.consecutiveFailures).toBe(2);

      // 3rd failure: UNAVAILABLE
      rec = transitionOnFailure(rec, new Error("500 internal server error"), t0 + 30);
      expect(rec.state).toBe("UNAVAILABLE");
      expect(rec.consecutiveFailures).toBe(3);
      expect(rec.currentCooldownMs).toBe(DEFAULT_CONFIG.baseCooldownMs);
    });

    it("single clean call in DEGRADED or SUSPECT immediately restores to HEALTHY", () => {
      const t0 = 1000;
      let rec = createInitialRecord("openrouter", t0);
      rec = transitionOnFailure(rec, new Error("transient glitch"), t0 + 10);
      expect(rec.state).toBe("DEGRADED");

      rec = transitionOnSuccess(rec, t0 + 20);
      expect(rec.state).toBe("HEALTHY");
      expect(rec.consecutiveFailures).toBe(0);
      expect(rec.consecutiveSuccesses).toBe(1);

      // Same for SUSPECT
      rec = transitionOnFailure(rec, new Error("fail 1"), t0 + 30);
      rec = transitionOnFailure(rec, new Error("fail 2"), t0 + 40);
      expect(rec.state).toBe("SUSPECT");

      rec = transitionOnSuccess(rec, t0 + 50);
      expect(rec.state).toBe("HEALTHY");
    });

    it("fast-trips to UNAVAILABLE immediately on fatal auth/credit exhaustion (401, 402)", () => {
      const t0 = 1000;
      let rec = createInitialRecord("openrouter", t0);

      // HTTP 402 out of credits
      rec = transitionOnFailure(rec, new Error("OpenRouter API error 402: insufficient credits"), t0 + 10);
      expect(rec.state).toBe("UNAVAILABLE");
      expect(rec.consecutiveFailures).toBe(1); // tripped on first failure

      // 401 unauthorized
      let rec2 = createInitialRecord("surplus", t0);
      rec2 = transitionOnFailure(rec2, new Error("HTTP 401: Unauthorized invalid API key"), t0 + 10);
      expect(rec2.state).toBe("UNAVAILABLE");
    });

    it("transitions UNAVAILABLE -> RECOVERING when cooldown elapses", () => {
      const t0 = 1000;
      let rec = createInitialRecord("openrouter", t0);
      rec = transitionOnFailure(rec, new Error("402 out of credits"), t0);
      expect(rec.state).toBe("UNAVAILABLE");

      // Before cooldown elapses
      const check1 = checkProviderLiveness(rec, t0 + 1000);
      expect(check1.isAvailable).toBe(false);
      expect(check1.effectiveRecord.state).toBe("UNAVAILABLE");

      // After cooldown elapses (60_000ms)
      const check2 = checkProviderLiveness(rec, t0 + 60_001);
      expect(check2.isAvailable).toBe(true);
      expect(check2.effectiveRecord.state).toBe("RECOVERING");
    });

    it("canary failure in RECOVERING trips back to UNAVAILABLE with exponential cooldown backoff", () => {
      const t0 = 1000;
      let rec = createInitialRecord("openrouter", t0);
      rec = transitionOnFailure(rec, new Error("fatal 402"), t0);
      expect(rec.currentCooldownMs).toBe(60_000);

      // Transition to RECOVERING
      rec = { ...rec, state: "RECOVERING" };

      // Canary fails
      rec = transitionOnFailure(rec, new Error("still dead"), t0 + 130_000);
      expect(rec.state).toBe("UNAVAILABLE");
      expect(rec.currentCooldownMs).toBe(120_000); // 60k * 2
    });

    it("hysteresis: requires 2 consecutive successes in RECOVERING to restore to HEALTHY", () => {
      const t0 = 1000;
      let rec = createInitialRecord("openrouter", t0);
      rec = { ...rec, state: "RECOVERING", consecutiveSuccesses: 0 };

      // 1st success: still in RECOVERING (hysteresis dampening)
      rec = transitionOnSuccess(rec, t0 + 10);
      expect(rec.state).toBe("RECOVERING");
      expect(rec.consecutiveSuccesses).toBe(1);

      // 2nd consecutive success: restores to HEALTHY!
      rec = transitionOnSuccess(rec, t0 + 20);
      expect(rec.state).toBe("HEALTHY");
      expect(rec.consecutiveSuccesses).toBe(2);
      expect(rec.currentCooldownMs).toBe(DEFAULT_CONFIG.baseCooldownMs); // reset cooldown
    });
  });

  describe("registry and router prioritization", () => {
    it("tracks provider health dynamically", () => {
      expect(isProviderAvailableForCall("openrouter")).toBe(true);

      recordProviderFailure("openrouter", new Error("402 out of credits"));
      expect(isProviderAvailableForCall("openrouter")).toBe(false);

      const health = getProviderHealth("openrouter");
      expect(health.state).toBe("UNAVAILABLE");
    });

    it("prioritizes available providers over unavailable ones", () => {
      recordProviderSuccess("openrouter");
      recordProviderFailure("grok", new Error("401 unauthorized"));

      const ladder = ["grok", "openrouter", "gpt"];
      const prioritized = prioritizeProviders(ladder);

      expect(prioritized).toEqual(["openrouter", "gpt"]);
      expect(prioritized).not.toContain("grok");
    });

    it("prevents fleet deadlock: returns all providers if every provider is UNAVAILABLE", () => {
      recordProviderFailure("openrouter", new Error("402 out of credits"));
      recordProviderFailure("surplus", new Error("401 unauthorized"));
      recordProviderFailure("grok", new Error("out of quota"));
      // Trip grok to unavailable with 3 fails
      recordProviderFailure("grok", new Error("fail 2"));
      recordProviderFailure("grok", new Error("fail 3"));

      const ladder = ["openrouter", "surplus", "grok"];
      const prioritized = prioritizeProviders(ladder);

      // Guard kicks in: returns all providers so fleet doesn't hard-deadlock
      expect(prioritized).toEqual(["openrouter", "surplus", "grok"]);
    });

    it("getAllProviderHealth returns snapshot of all registered providers", () => {
      recordProviderSuccess("openrouter");
      recordProviderFailure("ollama", new Error("connection refused"));

      const snapshot = getAllProviderHealth();
      expect(snapshot.openrouter.state).toBe("HEALTHY");
      expect(snapshot.ollama.state).toBe("DEGRADED");
    });
  });
});
