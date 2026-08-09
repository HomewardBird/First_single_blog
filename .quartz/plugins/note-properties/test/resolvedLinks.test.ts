import { describe, it, expect } from "vitest";
import { VFile } from "vfile";
import { NoteProperties } from "../src/transformer";
import type { BuildCtx, FullSlug } from "@quartz-community/types";

function buildFile(
  frontmatter: string,
  slug: string,
  allSlugs: string[],
): { data: Record<string, unknown> } {
  const plugin = NoteProperties({ includeAll: true });
  const ctx = { allSlugs: allSlugs as FullSlug[] } as unknown as BuildCtx;

  const mdPlugins = plugin.markdownPlugins!(ctx);
  const mdTransformer = (mdPlugins[1] as () => (tree: unknown, file: VFile) => void)();

  const markdown = `---\n${frontmatter}\n---\ncontent`;
  const file = new VFile({
    value: new TextEncoder().encode(markdown),
    path: `${slug}.md`,
  });
  file.data = {};
  mdTransformer(null, file);

  file.data.slug = slug as FullSlug;

  const htmlPlugins = plugin.htmlPlugins!(ctx);
  const htmlTransformer = (htmlPlugins[0] as () => (tree: unknown, file: VFile) => void)();
  htmlTransformer(null, file);

  return file;
}

function getResolvedLinks(
  frontmatter: string,
  slug: string,
  allSlugs: string[],
): Record<string, string> {
  const file = buildFile(frontmatter, slug, allSlugs);
  const noteProps = file.data.noteProperties as { resolvedLinks?: Record<string, string> };
  return noteProps?.resolvedLinks ?? {};
}

describe("resolvedLinks (htmlPlugins)", () => {
  it("resolves a bare wikilink to its full slug via shortest match", () => {
    const resolved = getResolvedLinks('up: "[[purplegrape]]"', "with-hyphen/orangejuice", [
      "with-hyphen/orangejuice",
      "with-hyphen/purplegrape",
    ]);
    expect(resolved["purplegrape"]).toBe("../with-hyphen/purplegrape");
  });

  it("resolves a wikilink when the target is in the same folder", () => {
    const resolved = getResolvedLinks('up: "[[silverstar]]"', "nospace/goldensun", [
      "nospace/goldensun",
      "nospace/silverstar",
      "a/duckdecide",
    ]);
    expect(resolved["silverstar"]).toBe("../nospace/silverstar");
  });

  it("resolves a wikilink when source and target are in different folders", () => {
    const resolved = getResolvedLinks('related: "[[duckdecide]]"', "with-hyphen/orangejuice", [
      "with-hyphen/orangejuice",
      "with-hyphen/purplegrape",
      "a/duckdecide",
    ]);
    expect(resolved["duckdecide"]).toBe("../a/duckdecide");
  });

  it("falls back when multiple slugs share the same filename", () => {
    const resolved = getResolvedLinks('up: "[[samename]]"', "a/duckdecide", [
      "a/duckdecide",
      "a/samename",
      "nospace/samename",
    ]);
    expect(resolved["samename"]).toBeDefined();
  });

  it("resolves a wikilink that includes a folder prefix (disambiguation)", () => {
    const resolved = getResolvedLinks('up: "[[a/duckdecide]]"', "nospace/goldensun", [
      "nospace/goldensun",
      "a/duckdecide",
      "b/duckdecide",
    ]);
    expect(resolved["a/duckdecide"]).toBe("../a/duckdecide");
  });

  it("resolves wikilinks with spaces in the target name", () => {
    const resolved = getResolvedLinks('up: "[[Red Fox]]"', "with-space/yellowbee", [
      "with-space/yellowbee",
      "with-space/red-fox",
    ]);
    expect(resolved["red-fox"]).toBe("../with-space/red-fox");
  });

  it("resolves multiple wikilinks from different properties", () => {
    const resolved = getResolvedLinks(
      'up: "[[purplegrape]]"\nrelated: "[[duckdecide]]"',
      "nospace/goldensun",
      ["nospace/goldensun", "with-hyphen/purplegrape", "a/duckdecide"],
    );
    expect(resolved["purplegrape"]).toBe("../with-hyphen/purplegrape");
    expect(resolved["duckdecide"]).toBe("../a/duckdecide");
  });

  it("resolves wikilinks inside array values", () => {
    const resolved = getResolvedLinks(
      "related:\n" + '  - "[[purplegrape]]"\n' + '  - "[[duckdecide]]"',
      "nospace/goldensun",
      ["nospace/goldensun", "with-hyphen/purplegrape", "a/duckdecide"],
    );
    expect(resolved["purplegrape"]).toBe("../with-hyphen/purplegrape");
    expect(resolved["duckdecide"]).toBe("../a/duckdecide");
  });

  it("resolves markdown link targets", () => {
    const resolved = getResolvedLinks('link: "[label](./some/path)"', "nospace/goldensun", [
      "nospace/goldensun",
    ]);
    expect(resolved["./some/path"]).toBeDefined();
  });

  it("does not produce resolvedLinks when no links are present", () => {
    const file = buildFile('title: "No Links"', "a/duckdecide", [
      "a/duckdecide",
      "with-hyphen/purplegrape",
    ]);
    const noteProps = file.data.noteProperties as { resolvedLinks?: Record<string, string> };
    expect(noteProps.resolvedLinks).toBeUndefined();
  });

  it("resolves a wikilink with an anchor", () => {
    const resolved = getResolvedLinks('up: "[[purplegrape#section]]"', "with-hyphen/orangejuice", [
      "with-hyphen/orangejuice",
      "with-hyphen/purplegrape",
    ]);
    expect(resolved["purplegrape#section"]).toBe("../with-hyphen/purplegrape#section");
  });

  it("resolves a wikilink when source is at root level", () => {
    const resolved = getResolvedLinks('up: "[[purplegrape]]"', "index", [
      "index",
      "with-hyphen/purplegrape",
    ]);
    expect(resolved["purplegrape"]).toBe("./with-hyphen/purplegrape");
  });
});
