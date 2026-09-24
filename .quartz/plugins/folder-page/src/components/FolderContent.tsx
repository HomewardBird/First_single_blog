import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
  SortFn,
} from "@quartz-community/types";
import { PageList, byDateAndAlphabeticalFolderFirst } from "./PageList";
import { htmlToJsx } from "@quartz-community/utils/jsx";
import { resolveRelative } from "../util/path";
import type { ComponentChildren } from "preact";
import type { Root } from "hast";
import { i18n } from "../i18n";
import {
  computeChainNav,
  pagesFromTrie,
  paginationCss,
  type PageEntry,
  type TrieNode,
} from "./FolderPagination";
import style from "./styles/listPage.scss";

interface FolderContentOptions {
  showFolderCount: boolean;
  showSubfolders: boolean;
  pagination?: boolean;
  sort?: SortFn;
}

const defaultOptions: FolderContentOptions = {
  showFolderCount: true,
  showSubfolders: true,
  pagination: false,
};

function concatenateResources(
  ...resources: (string | string[] | undefined)[]
): string | string[] | undefined {
  const result = resources.filter((r): r is string | string[] => r !== undefined).flat();
  return result.length === 0 ? undefined : result;
}

export function pagesFromAllFiles(
  allFiles: unknown[],
  folderSlug: string,
  showSubfolders: boolean,
): PageEntry[] {
  const folderPrefix = folderSlug.endsWith("/index")
    ? folderSlug.slice(0, -"index".length)
    : folderSlug.endsWith("/")
      ? folderSlug
      : folderSlug + "/";

  const directChildren: PageEntry[] = [];
  const subfolderFiles = new Map<string, PageEntry[]>();

  for (const file of allFiles as PageEntry[]) {
    if (file.unlisted === true) continue;
    const fileSlug = file.slug;
    if (!fileSlug || !fileSlug.startsWith(folderPrefix)) continue;

    const relativePath = fileSlug.slice(folderPrefix.length);
    if (!relativePath || relativePath === "index") continue;

    const segments = relativePath.split("/");

    if (segments.length === 1) {
      directChildren.push(file);
    } else if (showSubfolders) {
      const subfolderName = segments[0]!;
      if (!subfolderFiles.has(subfolderName)) {
        subfolderFiles.set(subfolderName, []);
      }
      subfolderFiles.get(subfolderName)!.push(file);
    }
  }

  for (const [subfolderName, files] of subfolderFiles) {
    const indexFile = files.find((f) => f.slug === `${folderPrefix}${subfolderName}/index`);
    if (indexFile) continue;

    directChildren.push({
      slug: `${folderPrefix}${subfolderName}/index` as FullSlug,
      dates: mostRecentDatesFromEntries(files),
      frontmatter: { title: subfolderName, tags: [] },
    });
  }

  return directChildren;
}

function mostRecentDatesFromChildren(children: TrieNode[]): PageEntry["dates"] {
  let maybeDates: PageEntry["dates"] | undefined;
  for (const child of children) {
    const childDates = (child.data as { dates?: PageEntry["dates"] } | null)?.dates;
    if (childDates) {
      if (!maybeDates) {
        maybeDates = { ...childDates };
      } else {
        if (childDates.created > maybeDates.created) maybeDates.created = childDates.created;
        if (childDates.modified > maybeDates.modified) maybeDates.modified = childDates.modified;
        if (childDates.published > maybeDates.published)
          maybeDates.published = childDates.published;
      }
    }
  }
  return maybeDates ?? { created: new Date(), modified: new Date(), published: new Date() };
}

function mostRecentDatesFromEntries(entries: PageEntry[]): PageEntry["dates"] {
  let maybeDates: PageEntry["dates"] | undefined;
  for (const entry of entries) {
    if (entry.dates) {
      if (!maybeDates) {
        maybeDates = { ...entry.dates };
      } else {
        if (entry.dates.created > maybeDates.created) maybeDates.created = entry.dates.created;
        if (entry.dates.modified > maybeDates.modified) maybeDates.modified = entry.dates.modified;
        if (entry.dates.published > maybeDates.published)
          maybeDates.published = entry.dates.published;
      }
    }
  }
  return maybeDates ?? { created: new Date(), modified: new Date(), published: new Date() };
}

export default ((opts?: Partial<FolderContentOptions>) => {
  const options: FolderContentOptions = { ...defaultOptions, ...opts };

  const FolderContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props;
    const ctx = props.ctx as { trie?: TrieNode } | undefined;
    const slug = (fileData as { slug?: string } | undefined)?.slug;

    if (!slug) return null;

    const trie = ctx?.trie;
    let allPagesInFolder: PageEntry[];

    if (trie) {
      const folder = trie.findNode(slug.split("/"));
      if (!folder) return null;
      allPagesInFolder = pagesFromTrie(folder, options.showSubfolders);
    } else {
      allPagesInFolder = pagesFromAllFiles(allFiles ?? [], slug, options.showSubfolders);
    }

    const cssClasses =
      ((fileData as { frontmatter?: { cssclasses?: string[] } } | undefined)?.frontmatter
        ?.cssclasses as string[] | undefined) ?? [];
    const classes = cssClasses.join(" ");
    const listProps = {
      ...props,
      sort: options.sort,
      allFiles: allPagesInFolder,
    };

    const hastRoot = tree as Root;
    const content =
      hastRoot.children.length === 0
        ? (fileData as { description?: unknown } | undefined)?.description
        : htmlToJsx(hastRoot);

    const pageListContent = PageList(listProps) as unknown as ComponentChildren;

    const sorter = options.sort ?? byDateAndAlphabeticalFolderFirst(cfg);
    const locale = (cfg as { locale?: string } | undefined)?.locale ?? "en-US";
    const toNav = (page: PageEntry): { slug: FullSlug; title: string } => ({
      slug: page.slug as FullSlug,
      title: String((page.frontmatter?.title as string | undefined) ?? page.slug ?? ""),
    });
    let prevPage: { slug: FullSlug; title: string } | undefined;
    let nextPage: { slug: FullSlug; title: string } | undefined;
    if (trie) {
      const nav = computeChainNav(trie, slug, locale);
      prevPage = nav.prev;
      nextPage = nav.next;
    } else {
      const sortedPages = [...allPagesInFolder].sort(sorter);
      const currentIndex = sortedPages.findIndex((p) => p.slug === (slug as unknown as string));
      const fallbackPrev = currentIndex > 0 ? sortedPages[currentIndex - 1] : undefined;
      const fallbackNext = currentIndex >= 0 ? sortedPages[currentIndex + 1] : sortedPages[0];
      prevPage = fallbackPrev ? toNav(fallbackPrev) : undefined;
      nextPage = fallbackNext ? toNav(fallbackNext) : undefined;
    }

    const t = i18n(locale).pages.folderContent;

    return (
      <div class="popover-hint">
        <article class={classes}>
          <div class="markdown-preview-view markdown-rendered">{content}</div>
        </article>
        {options.pagination ? (
          (prevPage || nextPage) && (
            <nav class="page-pagination">
              {prevPage && (
                <a
                  class="pagination-item pagination-prev internal"
                  href={resolveRelative(slug as unknown as FullSlug, prevPage.slug)}
                >
                  <span class="pagination-label">← {t.previousPage}</span>
                  <span class="pagination-title">{prevPage.title}</span>
                </a>
              )}
              {nextPage && (
                <a
                  class="pagination-item pagination-next internal"
                  href={resolveRelative(slug as unknown as FullSlug, nextPage.slug)}
                >
                  <span class="pagination-label">{t.nextPage} →</span>
                  <span class="pagination-title">{nextPage.title}</span>
                </a>
              )}
            </nav>
          )
        ) : (
          <div class="page-listing">
            {options.showFolderCount && (
              <p>
                {t.itemsUnderFolder({
                  count: allPagesInFolder.length,
                })}
              </p>
            )}
            <div>{pageListContent}</div>
          </div>
        )}
      </div>
    );
  };

  FolderContent.css = concatenateResources(style, PageList.css, paginationCss);
  return FolderContent;
}) satisfies QuartzComponentConstructor;
