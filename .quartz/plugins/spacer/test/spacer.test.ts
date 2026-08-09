import { describe, it, expect } from "vitest";

describe("Spacer", () => {
  it("exports a component constructor", async () => {
    const mod = await import("../src/components/Spacer");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("returns a component with CSS", async () => {
    const mod = await import("../src/components/Spacer");
    const component = mod.default();
    expect(component).toBeDefined();
    expect(typeof component).toBe("function");
    expect(component.css).toContain(".spacer");
    expect(component.css).toContain("flex");
  });
});
