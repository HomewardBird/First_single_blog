import { describe, expect, it } from "vitest";
import type { ProcessedContent } from "@quartz-community/types";
import { TagPage } from "../src/pageType";

function makeProcessedContent(
  slug: string,
  opts: { tags?: string[]; unlisted?: boolean } = {},
): ProcessedContent {
  const data: Record<string, unknown> = {
    slug,
    relativePath: `${slug}.md`,
    frontmatter: { title: slug, tags: opts.tags ?? [] },
  };
  if (opts.unlisted) data.unlisted = true;
  const vfile = { data } as unknown as ProcessedContent[1];
  return [{ type: "root", children: [] }, vfile];
}

function generate(
  plugin: ReturnType<typeof TagPage>,
  content: ProcessedContent[],
): { slug: string; title: string }[] {
  const generateFn = plugin.generate;
  if (!generateFn) throw new Error("TagPage.generate is undefined");
  const pages = generateFn({
    content,
    cfg: { locale: "en-US" } as never,
    ctx: {} as never,
  });
  return pages.map((p) => ({ slug: String(p.slug), title: p.title }));
}

describe("TagPage pageType generate", () => {
  it("discovers tags from listed pages", () => {
    const plugin = TagPage();
    const virtualPages = generate(plugin, [
      makeProcessedContent("notes/a", { tags: ["public", "alpha"] }),
      makeProcessedContent("notes/b", { tags: ["public"] }),
    ]);
    const slugs = virtualPages.map((p) => p.slug);
    expect(slugs).toContain("tags/public");
    expect(slugs).toContain("tags/alpha");
    expect(slugs).toContain("tags/index");
  });

  it("does NOT discover tags from unlisted pages", () => {
    const plugin = TagPage();
    const virtualPages = generate(plugin, [
      makeProcessedContent("notes/public", { tags: ["visible"] }),
      makeProcessedContent("notes/secret", { tags: ["hidden"], unlisted: true }),
    ]);
    const slugs = virtualPages.map((p) => p.slug);
    expect(slugs).toContain("tags/visible");
    expect(slugs).not.toContain("tags/hidden");
  });

  it("discovers tag only for listed pages even when the unlisted page shares a tag", () => {
    const plugin = TagPage();
    const virtualPages = generate(plugin, [
      makeProcessedContent("notes/a", { tags: ["shared"] }),
      makeProcessedContent("notes/b", { tags: ["shared"], unlisted: true }),
    ]);
    const slugs = virtualPages.map((p) => p.slug);
    expect(slugs).toContain("tags/shared");
  });

  it("ignores a tag that only exists on unlisted pages", () => {
    const plugin = TagPage();
    const virtualPages = generate(plugin, [
      makeProcessedContent("notes/public", { tags: ["listed"] }),
      makeProcessedContent("notes/secret", { tags: ["secret-only"], unlisted: true }),
    ]);
    const slugs = virtualPages.map((p) => p.slug);
    expect(slugs).toContain("tags/listed");
    expect(slugs).not.toContain("tags/secret-only");
  });
});
