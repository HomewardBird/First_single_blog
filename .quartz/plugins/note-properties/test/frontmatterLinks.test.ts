import { describe, it, expect } from "vitest";
import { VFile } from "vfile";
import { NoteProperties } from "../src/transformer";
import type { BuildCtx } from "@quartz-community/types";

function runWithFrontmatter(frontmatter: string): string[] {
  const plugin = NoteProperties({});
  const ctx = { allSlugs: [] } as unknown as BuildCtx;
  const plugins = plugin.markdownPlugins!(ctx);
  const transformerFactory = plugins[1] as () => (tree: unknown, file: VFile) => void;
  const transformer = transformerFactory();

  const markdown = `---\n${frontmatter}\n---\ncontent`;
  const file = new VFile({
    value: new TextEncoder().encode(markdown),
    path: "note.md",
  });
  file.data = {};
  transformer(null, file);

  return (file.data.frontmatterLinks as string[] | undefined) ?? [];
}

describe("frontmatterLinks extraction", () => {
  it("slugifies wikilinks with spaces", () => {
    const links = runWithFrontmatter('related: "[[My Note]]"');
    expect(links).toEqual(["my-note"]);
  });

  it("never leaves spaces or %20 in the extracted wikilink", () => {
    const links = runWithFrontmatter('related: "[[My Note]]"');
    for (const link of links) {
      expect(link).not.toContain(" ");
      expect(link).not.toContain("%20");
    }
  });

  it("preserves and slugifies anchors on wikilinks", () => {
    const links = runWithFrontmatter('related: "[[My Note#Some Section]]"');
    expect(links).toEqual(["my-note#some-section"]);
  });

  it("slugifies nested-path wikilinks per segment", () => {
    const links = runWithFrontmatter('related: "[[Folder Name/My Note]]"');
    expect(links).toEqual(["folder-name/my-note"]);
  });

  it("strips the .md extension on wikilinks that include it", () => {
    const links = runWithFrontmatter('related: "[[My Note.md]]"');
    expect(links).toEqual(["my-note"]);
  });

  it("extracts wikilinks from array values", () => {
    const links = runWithFrontmatter(
      "related:\n" + '  - "[[First Note]]"\n' + '  - "[[Second Note]]"',
    );
    expect(links).toEqual(["first-note", "second-note"]);
  });

  it("leaves markdown-link targets untouched (user-provided hrefs)", () => {
    const links = runWithFrontmatter('link: "[label](./some/path)"');
    expect(links).toEqual(["./some/path"]);
  });

  it("drops the alias portion and only stores the target", () => {
    const links = runWithFrontmatter('related: "[[My Note|Display Text]]"');
    expect(links).toEqual(["my-note"]);
  });

  it("does not set frontmatterLinks when frontmatter has no links", () => {
    const links = runWithFrontmatter('title: "Plain Title"');
    expect(links).toEqual([]);
  });
});
