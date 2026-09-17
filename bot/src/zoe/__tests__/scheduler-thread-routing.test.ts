// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(__dirname, "..", "scheduler.ts"), "utf8");

describe("scheduler thread routing", () => {
  it("routes error-remediation to Coding thread with message_thread_id", () => {
    expect(SRC).toContain("resolveForumThread(ZAAL_BOTZ_CODING_THREAD, \"Coding\")");
    expect(SRC).toContain("opts.bot.api.sendMessage(gid, text, thread ? { message_thread_id: thread } : undefined)");
  });

  it("routes repo-improver scout to Coding/Research thread with chunkOpts", () => {
    expect(SRC).toContain("resolveForumThread(ZAAL_BOTZ_CODING_THREAD, \"Coding\", \"Research\")");
    expect(SRC).toContain("chunkOpts = thread ? { baseOpts: { message_thread_id: thread } } : undefined");
  });

  it("routes handoffs surfacer to Handoffs topic", () => {
    expect(SRC).toContain("resolveForumThread(ZAAL_BOTZ_HANDOFFS_THREAD, \"Handoffs\")");
  });

  it("routes ZAOstock approvals to The ZAO / Claude Code topic when not dedicated group", () => {
    expect(SRC).toContain("resolveForumThread(ZAAL_BOTZ_ZAOSTOCK_THREAD, \"The ZAO\", \"Claude Code\")");
  });

  it("routes daily stale captures / nudges to Claude Code topic", () => {
    expect(SRC).toContain("resolveForumThread(ZAAL_BOTZ_QUESTIONS_THREAD, \"Claude Code\")");
  });
});
