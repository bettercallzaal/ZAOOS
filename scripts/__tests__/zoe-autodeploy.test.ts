import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

describe("zoe-autodeploy log filter", () => {
  const scriptPath = path.resolve(__dirname, "../zoe-autodeploy.sh");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  it("contains the clean shutdown filter before crash matching in the source", () => {
    expect(scriptContent).toContain(
      "grep -v 'shutting down cleanly' | grep -qiE 'TransformError|Error \\[|crash'"
    );
  });

  const checkLogLine = (line: string, filterShutdown = true): boolean => {
    // Simulates the bash pipeline: echo "$line" | [grep -v "shutting down cleanly"] | grep -qiE "TransformError|Error \[|crash"
    const cmd = filterShutdown
      ? `echo ${JSON.stringify(line)} | grep -v "shutting down cleanly" | grep -qiE "TransformError|Error \\[|crash"`
      : `echo ${JSON.stringify(line)} | grep -qiE "TransformError|Error \\[|crash"`;
    try {
      execSync(cmd, { shell: "/bin/bash", stdio: ["pipe", "pipe", "ignore"] });
      return true; // Matched error/crash (triggers rollback)
    } catch {
      return false; // Did not match error/crash (deploy proceeds)
    }
  };

  it("does not treat graceful SIGTERM crash-guard shutdown as a crash", () => {
    const cleanShutdownLog = "[zoe/crash-guard] SIGTERM received - shutting down cleanly";
    const triggersRollback = checkLogLine(cleanShutdownLog, true);
    expect(triggersRollback).toBe(false);
  });

  it("still catches real errors and crashes", () => {
    expect(checkLogLine("TransformError: Could not resolve module", true)).toBe(true);
    expect(checkLogLine("Error [ERR_MODULE_NOT_FOUND]: Cannot find package", true)).toBe(true);
    expect(checkLogLine("Fatal error: crash at boot", true)).toBe(true);
  });

  it("proves red control: legacy filter without shutdown exclusion triggers false rollback", () => {
    const cleanShutdownLog = "[zoe/crash-guard] SIGTERM received - shutting down cleanly";
    // Legacy pipeline without grep -v "shutting down cleanly"
    const legacyTriggersRollback = checkLogLine(cleanShutdownLog, false);
    // Proves legacy pipeline failed by misclassifying clean shutdown as a crash
    expect(legacyTriggersRollback).toBe(true);
  });
});
