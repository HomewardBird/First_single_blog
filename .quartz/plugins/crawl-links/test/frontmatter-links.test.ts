import { describe, it, expect } from "vitest";
import type { Root } from "hast";
import { VFile } from "vfile";
import type { BuildCtx } from "@quartz-community/types";
import type { FullSlug } from "@quartz-community/utils";
import { CrawlLinks } from "../src/transformer";

function emptyTree(): Root {
  return { type: "root", children: [] };
}

function getLinks(
  frontmatterLinks: string[],
  fileSlug: string,
  allSlugs: string[],
  strategy: "shortest" | "absolute" | "relative" = "shortest",
): string[] {
  const plugin = CrawlLinks({ markdownLinkResolution: strategy });
  const ctx = { allSlugs } as unknown as BuildCtx;
  const plugins = plugin.htmlPlugins!(ctx);
  const transformer = (plugins[0] as () => (tree: Root, file: VFile) => void)();

  const file = new VFile();
  file.data.slug = fileSlug as FullSlug;
  file.data.frontmatterLinks = frontmatterLinks;

  transformer(emptyTree(), file);
  return (file.data.links as string[]) ?? [];
}

describe("frontmatterLinks merge into file.data.links", () => {
  it("adds frontmatter wikilink targets to file.data.links", () => {
    const links = getLinks(["purplegrape"], "with-hyphen/orangejuice", [
      "with-hyphen/orangejuice",
      "with-hyphen/purplegrape",
    ]);
    expect(links).toContain("with-hyphen/purplegrape");
  });

  it("resolves cross-folder frontmatter links", () => {
    const links = getLinks(["duckdecide"], "with-hyphen/orangejuice", [
      "with-hyphen/orangejuice",
      "a/duckdecide",
    ]);
    expect(links).toContain("a/duckdecide");
  });

  it("merges with body links from the HTML AST", () => {
    const plugin = CrawlLinks({ markdownLinkResolution: "shortest" });
    const allSlugs = ["a/source", "a/body-target", "b/fm-target"];
    const ctx = { allSlugs } as unknown as BuildCtx;
    const plugins = plugin.htmlPlugins!(ctx);
    const transformer = (plugins[0] as () => (tree: Root, file: VFile) => void)();

    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "a",
          properties: { href: "body-target" },
          children: [{ type: "text", value: "body-target" }],
        },
      ],
    };

    const file = new VFile();
    file.data.slug = "a/source" as FullSlug;
    file.data.frontmatterLinks = ["fm-target"];

    transformer(tree, file);
    const links = file.data.links as string[];
    expect(links).toContain("a/body-target");
    expect(links).toContain("b/fm-target");
  });

  it("strips anchors from frontmatter link targets", () => {
    const links = getLinks(["purplegrape#section"], "with-hyphen/orangejuice", [
      "with-hyphen/orangejuice",
      "with-hyphen/purplegrape",
    ]);
    expect(links).toContain("with-hyphen/purplegrape");
    expect(links.some((l) => l.includes("#"))).toBe(false);
  });

  it("does not duplicate slugs already found in the body", () => {
    const plugin = CrawlLinks({ markdownLinkResolution: "shortest" });
    const allSlugs = ["a/source", "a/target"];
    const ctx = { allSlugs } as unknown as BuildCtx;
    const plugins = plugin.htmlPlugins!(ctx);
    const transformer = (plugins[0] as () => (tree: Root, file: VFile) => void)();

    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "a",
          properties: { href: "target" },
          children: [{ type: "text", value: "target" }],
        },
      ],
    };

    const file = new VFile();
    file.data.slug = "a/source" as FullSlug;
    file.data.frontmatterLinks = ["target"];

    transformer(tree, file);
    const links = file.data.links as string[];
    expect(links.filter((l) => l === "a/target")).toHaveLength(1);
  });

  it("produces no extra links when frontmatterLinks is empty", () => {
    const links = getLinks([], "a/source", ["a/source", "a/target"]);
    expect(links).toEqual([]);
  });

  it("produces no extra links when frontmatterLinks is absent", () => {
    const plugin = CrawlLinks({ markdownLinkResolution: "shortest" });
    const ctx = { allSlugs: ["a/source"] } as unknown as BuildCtx;
    const plugins = plugin.htmlPlugins!(ctx);
    const transformer = (plugins[0] as () => (tree: Root, file: VFile) => void)();

    const file = new VFile();
    file.data.slug = "a/source" as FullSlug;

    transformer(emptyTree(), file);
    expect(file.data.links).toEqual([]);
  });
});
