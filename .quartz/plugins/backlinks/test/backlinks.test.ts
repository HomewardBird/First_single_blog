import { describe, it, expect } from "vitest";
import { simplifySlug, resolveRelative } from "../src/util/path";
import { selectBacklinkSources } from "../src/components/Backlinks";
import type { BacklinkCandidate } from "../src/components/Backlinks";

describe("path utilities", () => {
  it("simplifySlug removes index suffix", () => {
    const result = simplifySlug("folder/index");
    expect(result).toBe("folder/");
  });

  it("simplifySlug handles root index", () => {
    const result = simplifySlug("index");
    expect(result).toBe("/");
  });

  it("resolveRelative creates relative paths", () => {
    const result = resolveRelative("a/b/c", "a/b/d");
    expect(result).toContain("..");
  });
});

describe("selectBacklinkSources", () => {
  const pages: BacklinkCandidate[] = [
    { slug: "a", links: ["target"], frontmatter: { title: "A" } },
    { slug: "b", links: ["other"], frontmatter: { title: "B" } },
    { slug: "c", links: ["target"], frontmatter: { title: "C" }, unlisted: true },
    { slug: "d", links: ["target"], frontmatter: { title: "D" } },
    { slug: "e", frontmatter: { title: "E no links" } },
  ];

  it("returns only pages whose links include the current slug", () => {
    const result = selectBacklinkSources(pages, "target");
    const slugs = result.map((f) => f.slug);
    expect(slugs).toContain("a");
    expect(slugs).toContain("d");
    expect(slugs).not.toContain("b");
    expect(slugs).not.toContain("e");
  });

  it("excludes unlisted pages from backlink sources", () => {
    const result = selectBacklinkSources(pages, "target");
    const slugs = result.map((f) => f.slug);
    expect(slugs).not.toContain("c");
  });

  it("treats explicit unlisted: false the same as undefined", () => {
    const inputs: BacklinkCandidate[] = [
      { slug: "listed", links: ["target"], unlisted: false },
      { slug: "unlisted", links: ["target"], unlisted: true },
    ];
    const result = selectBacklinkSources(inputs, "target");
    expect(result.map((f) => f.slug)).toEqual(["listed"]);
  });
});
