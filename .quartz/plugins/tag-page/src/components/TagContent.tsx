import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
  QuartzPluginData,
  SortFn,
} from "@quartz-community/types";
import { PageList } from "./PageList";
import { htmlToJsx } from "@quartz-community/utils/jsx";
import type { ComponentChildren } from "preact";
import type { Root } from "hast";
import { i18n } from "../i18n";
import { getAllSegmentPrefixes, resolveRelative, simplifySlug } from "../util/path";
import type { FullSlug } from "../util/path";
import style from "./styles/listPage.scss";

interface TagContentOptions {
  sort?: SortFn;
  numPages: number;
}

const defaultOptions: TagContentOptions = {
  numPages: 10,
};

function concatenateResources(
  ...resources: (string | string[] | undefined)[]
): string | string[] | undefined {
  const result = resources.filter((r): r is string | string[] => r !== undefined).flat();
  return result.length === 0 ? undefined : result;
}

type PageFileData = QuartzPluginData & Record<string, unknown>;

function isListed(file: PageFileData): boolean {
  return file.unlisted !== true;
}

export default ((opts?: Partial<TagContentOptions>) => {
  const options: TagContentOptions = { ...defaultOptions, ...opts };

  const TagContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props;
    const fd = fileData as PageFileData;
    const slug = fd.slug;
    const locale = (cfg as { locale?: string } | undefined)?.locale ?? "en-US";

    if (!(slug?.startsWith("tags/") || slug === "tags")) {
      throw new Error(`Component "TagContent" tried to render a non-tag page: ${slug}`);
    }

    const tag = simplifySlug(slug.slice("tags/".length) as FullSlug);
    const allPagesWithTag = (t: string) =>
      (allFiles as PageFileData[])
        .filter(isListed)
        .filter((file) =>
          (file.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes).includes(t),
        );

    const hastRoot = tree as Root;
    const content = hastRoot.children.length === 0 ? fd.description : htmlToJsx(hastRoot);

    const cssClasses = fd.frontmatter?.cssclasses ?? [];
    const classes = cssClasses.join(" ");

    if (tag === "/") {
      const tags = [
        ...new Set(
          (allFiles as PageFileData[])
            .filter(isListed)
            .flatMap((data) => data.frontmatter?.tags ?? [])
            .flatMap(getAllSegmentPrefixes),
        ),
      ].sort((a, b) => a.localeCompare(b));

      const tagItemMap: Map<string, PageFileData[]> = new Map();
      for (const t of tags) {
        tagItemMap.set(t, allPagesWithTag(t));
      }

      return (
        <div class="popover-hint">
          <article class={classes}>
            <div class="markdown-preview-view markdown-rendered">
              <p>{content}</p>
            </div>
          </article>
          <p>{i18n(locale).pages.tagContent.totalTags({ count: tags.length })}</p>
          <div>
            {tags.map((t) => {
              const pages = tagItemMap.get(t)!;
              const listProps = {
                ...props,
                allFiles: pages,
              };
              const pageListContent = PageList({
                ...listProps,
                limit: options.numPages,
                sort: options?.sort,
              }) as unknown as ComponentChildren;

              const contentPage = (allFiles as PageFileData[]).find(
                (file) => file.slug === `tags/${t}`,
              );

              // Virtual pages have htmlAst pre-rendered by the dispatcher (contains the full
              // PageList), so only use htmlAst from real user-authored tag pages (have filePath).
              const root = contentPage?.filePath ? contentPage?.htmlAst : undefined;
              const tagDesc =
                !root || root.children.length === 0 ? contentPage?.description : htmlToJsx(root);

              const tagListingPage = `/tags/${t}` as FullSlug;
              const href = resolveRelative(slug as FullSlug, tagListingPage);

              return (
                <div>
                  <h2>
                    <a class="internal tag-link" href={href}>
                      {t}
                    </a>
                  </h2>
                  {tagDesc && <p>{tagDesc}</p>}
                  <div class="page-listing">
                    <p>
                      {i18n(locale).pages.tagContent.itemsUnderTag({ count: pages.length })}
                      {pages.length > options.numPages && (
                        <>
                          {" "}
                          <span>
                            {i18n(locale).pages.tagContent.showingFirst({
                              count: options.numPages,
                            })}
                          </span>
                        </>
                      )}
                    </p>
                    {pageListContent}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      const pages = allPagesWithTag(tag);
      const listProps = {
        ...props,
        allFiles: pages,
      };
      const pageListContent = PageList({
        ...listProps,
        sort: options?.sort,
      }) as unknown as ComponentChildren;

      return (
        <div class="popover-hint">
          <article class={classes}>
            <div class="markdown-preview-view markdown-rendered">{content}</div>
          </article>
          <div class="page-listing">
            <p>{i18n(locale).pages.tagContent.itemsUnderTag({ count: pages.length })}</p>
            <div>{pageListContent}</div>
          </div>
        </div>
      );
    }
  };

  TagContent.css = concatenateResources(style, PageList.css);
  return TagContent;
}) satisfies QuartzComponentConstructor;
