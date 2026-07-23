import { describe, it, expect } from "vitest";
import { slugifyWikilinkTarget } from "../src/util/path";

describe("slugifyWikilinkTarget", () => {
  it("converts spaces in the path to hyphens", () => {
    expect(slugifyWikilinkTarget("My Note")).toBe("my-note");
  });

  it("lowercases case in the path (Obsidian-parity case-insensitive matching)", () => {
    expect(slugifyWikilinkTarget("CamelCase")).toBe("camelcase");
  });

  it("strips the trailing .md extension", () => {
    expect(slugifyWikilinkTarget("My Note.md")).toBe("my-note");
  });

  it("slugifies a nested path per segment", () => {
    expect(slugifyWikilinkTarget("Folder Name/My Note")).toBe("folder-name/my-note");
  });

  it("preserves and slugifies the anchor after '#'", () => {
    expect(slugifyWikilinkTarget("My Note#Some Section")).toBe("my-note#some-section");
  });

  it("returns the slugified anchor alone when path is empty", () => {
    expect(slugifyWikilinkTarget("#Just An Anchor")).toBe("#just-an-anchor");
  });

  it("handles targets with no spaces unchanged", () => {
    expect(slugifyWikilinkTarget("already-slugged")).toBe("already-slugged");
  });

  it("replaces '&' with '-and-'", () => {
    expect(slugifyWikilinkTarget("Foo&Bar")).toBe("foo-and-bar");
  });

  it("never produces '%20' for a target that contains a space", () => {
    const result = slugifyWikilinkTarget("My Note");
    expect(result).not.toContain("%20");
    expect(result).not.toContain(" ");
  });
});
