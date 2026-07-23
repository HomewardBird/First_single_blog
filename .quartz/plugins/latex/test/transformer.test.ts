import { describe, expect, it } from "vitest";
import { Latex } from "../src/transformer";
import { createCtx } from "./helpers";

describe("Latex", () => {
  it("returns remarkMath as markdown plugin", () => {
    const ctx = createCtx();
    const transformer = Latex();
    const plugins = transformer.markdownPlugins?.(ctx) ?? [];
    expect(plugins).toHaveLength(1);
  });

  it("defaults to katex render engine", () => {
    const ctx = createCtx();
    const transformer = Latex();
    const plugins = transformer.htmlPlugins?.(ctx) ?? [];
    expect(plugins).toHaveLength(1);
  });

  it("uses mathjax when configured", () => {
    const ctx = createCtx();
    const transformer = Latex({ renderEngine: "mathjax" });
    const plugins = transformer.htmlPlugins?.(ctx) ?? [];
    expect(plugins).toHaveLength(1);
  });

  it("provides katex external resources", () => {
    const ctx = createCtx();
    const transformer = Latex({ renderEngine: "katex" });
    const resources = transformer.externalResources?.(ctx);
    expect(resources?.css).toHaveLength(1);
    expect(resources?.js).toHaveLength(1);
  });

  it("has name Latex", () => {
    const transformer = Latex();
    expect(transformer.name).toBe("Latex");
  });
});
