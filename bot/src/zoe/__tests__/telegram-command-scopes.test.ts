// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BUTTON_BAR,
  GROUP_COMMANDS,
  PRIVATE_COMMANDS,
  ZOE_COMMANDS,
  isBarLabel,
} from "../button-bar";

describe("telegram command scopes and button bar", () => {
  it("defines essential operator commands in PRIVATE_COMMANDS", () => {
    const cmdNames = PRIVATE_COMMANDS.map((c) => c.command);
    expect(cmdNames).toContain("cockpit");
    expect(cmdNames).toContain("needsme");
    expect(cmdNames).toContain("grill");
    expect(cmdNames).toContain("board");
    expect(cmdNames).toContain("working");
    expect(cmdNames).toContain("pulse");
    expect(cmdNames).toContain("companion");
    expect(cmdNames).toContain("help");
  });

  it("defines assistant commands in GROUP_COMMANDS", () => {
    const cmdNames = GROUP_COMMANDS.map((c) => c.command);
    expect(cmdNames).toContain("ask");
    expect(cmdNames).toContain("help");
    expect(cmdNames).toContain("zg");
  });

  it("aliases ZOE_COMMANDS to PRIVATE_COMMANDS for backward compatibility", () => {
    expect(ZOE_COMMANDS).toEqual(PRIVATE_COMMANDS);
  });

  it("validates bar labels for persistent reply keyboard", () => {
    expect(isBarLabel("Needs Me")).toBe(true);
    expect(isBarLabel("Agenda")).toBe(true);
    expect(isBarLabel("Invalid")).toBe(false);
    expect(BUTTON_BAR).toBeDefined();
  });
});
