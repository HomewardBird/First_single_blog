import { describe, it, expect } from "vitest";
import { VFile } from "vfile";
import { NoteProperties } from "../src/transformer";
import type { BuildCtx } from "@quartz-community/types";

const runWithTag = (tag: string): string[] => {
  const plugin = NoteProperties({});
  const ctx = { allSlugs: [] } as unknown as BuildCtx;
  const plugins = plugin.markdownPlugins!(ctx);
  const transformerFactory = plugins[1] as () => (tree: unknown, file: VFile) => void;
  const transformer = transformerFactory();

  const escapedTag = tag.replace(/"/g, '\\"');
  const markdown = `---\ntags:\n  - "${escapedTag}"\n---\ncontent`;
  const file = new VFile({
    value: new TextEncoder().encode(markdown),
    path: "note.md",
  });

  file.data = {};
  transformer(null, file);

  return (file.data.frontmatter as { tags: string[] }).tags;
};

describe("slugTag", () => {
  it("preserves emoji in tags", () => {
    expect(runWithTag("0🌲")).toEqual(["0🌲"]);
  });

  it("converts spaces to hyphens", () => {
    expect(runWithTag("my tag")).toEqual(["my-tag"]);
  });

  it("replaces '&' with '-and-' and strips '?' and '#'", () => {
    expect(runWithTag("tag?#&")).toEqual(["tag-and-"]);
  });

  it("keeps nested tag separators", () => {
    expect(runWithTag("parent/child")).toEqual(["parent/child"]);
  });

  it("lowercases tags (Obsidian-parity case-insensitive tag matching)", () => {
    expect(runWithTag("MyTag")).toEqual(["mytag"]);
  });

  it("preserves multiple emojis", () => {
    expect(runWithTag("🎵music🎵")).toEqual(["🎵music🎵"]);
  });
});
