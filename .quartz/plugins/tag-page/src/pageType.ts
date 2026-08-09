import type {
  QuartzPageTypePlugin,
  PageMatcher,
  FullSlug,
  VirtualPage,
} from "@quartz-community/types";
import TagContentComponent from "./components/TagContent";
import { i18n } from "./i18n";
import { getAllSegmentPrefixes, joinSegments } from "./util/path";
import type { SortFn } from "./components/PageList";

export interface TagPageOptions {
  sort?: SortFn;
  numPages?: number;
  /** Show "Tag: " prefix before tag name in generated titles. Default: false */
  prefixTags?: boolean;
}

const tagMatcher: PageMatcher = ({ slug }) => {
  return slug.startsWith("tags/") || slug === "tags";
};

export const TagPage: QuartzPageTypePlugin<TagPageOptions> = (opts) => ({
  name: "TagPage",
  priority: 10,
  match: tagMatcher,
  generate({ content, cfg }) {
    const allFiles = content
      .map((c) => c[1].data)
      .filter((d) => (d as { unlisted?: unknown } | undefined)?.unlisted !== true);
    const locale = (cfg as { locale?: string } | undefined)?.locale ?? "en-US";

    const tags: Set<string> = new Set(
      (allFiles as { frontmatter?: { tags?: string[] } }[])
        .flatMap((data) => data.frontmatter?.tags ?? [])
        .flatMap(getAllSegmentPrefixes),
    );

    tags.add("index");

    const existingTagSlugs = new Set<string>();
    for (const [, file] of content) {
      const slug = (file.data as { slug?: string } | undefined)?.slug;
      if (slug && slug.startsWith("tags/")) {
        existingTagSlugs.add(slug);
      }
    }

    const virtualPages: VirtualPage[] = [];
    for (const tag of tags) {
      const slug = joinSegments("tags", tag) as unknown as FullSlug;
      if (existingTagSlugs.has(slug as string)) continue;

      const title =
        tag === "index"
          ? i18n(locale).pages.tagContent.tagIndex
          : opts?.prefixTags
            ? `${i18n(locale).pages.tagContent.tag}: ${tag}`
            : tag;

      virtualPages.push({
        slug,
        title,
        data: {},
      });
    }

    return virtualPages;
  },
  layout: "tag",
  body: TagContentComponent,
});
