import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "../src/index";

describe("Breadcrumbs", () => {
  it("is exported as a function", () => {
    expect(typeof Breadcrumbs).toBe("function");
  });

  it("returns a component with css property", () => {
    const component = Breadcrumbs();
    expect(typeof component).toBe("function");
    expect(typeof component.css).toBe("string");
  });
});
