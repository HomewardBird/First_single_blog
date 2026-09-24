import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
  QuartzPluginData,
} from "@quartz-community/types";
import type { Element, Root, RootContent, Text } from "hast";
import { i18n } from "../i18n";
import { resolveRelative } from "../util/path";

export interface TrieNode {
  isFolder: boolean;
  children: TrieNode[];
  data: unknown;
  slug: string;
  displayName: string;
  findNode(path: string[]): TrieNode | undefined;
}

export type PageEntry = QuartzPluginData & Record<string, unknown>;

interface NavEntry {
  slug: FullSlug;
  title: string;
}

export function pagesFromTrie(folder: TrieNode, showSubfolders: boolean): PageEntry[] {
  return folder.children
    .map((node) => {
      const nodeData = node.data as PageEntry | null;
      if (nodeData) {
        if (nodeData.unlisted === true) return undefined;
        return nodeData;
      }

      if (node.isFolder && showSubfolders) {
        return {
          slug: node.slug as FullSlug,
          dates: mostRecentDatesFromChildren(node.children),
          frontmatter: { title: node.displayName, tags: [] },
        };
      }
      return undefined;
    })
    .filter((page): page is PageEntry => page !== undefined);
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

function toNavEntry(page: PageEntry): NavEntry {
  return {
    slug: page.slug as FullSlug,
    title: ((page.frontmatter?.title as string | undefined) ?? page.slug ?? "") as string,
  };
}

function sortNodes(locale: string): (a: TrieNode, b: TrieNode) => number {
  return (a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, locale);
  };
}

/**
 * Build a per-column reading chain: the top-level folder index, then its
 * children depth-first (subfolder index followed by its articles), so the
 * last article of one chapter links to the next chapter's index page.
 * Columns are independent: pages outside any top-level folder (homepage,
 * standalone root pages, tag pages) get no navigation.
 */
export function computeChainNav(
  trie: TrieNode,
  slug: string,
  locale: string,
): { prev?: NavEntry; next?: NavEntry } {
  const segments = slug.split("/");
  const top = segments[0];
  if (!top || top === "index" || top === "tags") return {};

  const topFolder = trie.findNode([top, "index"]);
  if (!topFolder || !topFolder.isFolder) return {};

  const chain: NavEntry[] = [];
  const visit = (node: TrieNode) => {
    chain.push({ slug: node.slug as FullSlug, title: node.displayName });
    const children = node.children
      .filter((child) => {
        const data = child.data as PageEntry | null;
        return !(data && data.unlisted === true);
      })
      .sort(sortNodes(locale));
    for (const child of children) {
      if (child.isFolder) {
        visit(child);
      } else {
        chain.push(toNavEntry(child.data as PageEntry));
      }
    }
  };
  visit(topFolder);

  const pos = chain.findIndex((entry) => entry.slug === (slug as unknown as string));
  if (pos === -1) return {};

  return { prev: pos > 0 ? chain[pos - 1] : undefined, next: chain[pos + 1] };
}

function el(
  tagName: string,
  properties: Element["properties"],
  children: (Element | Text)[],
): Element {
  return { type: "element", tagName, properties, children };
}

function textNode(value: string): Text {
  return { type: "text", value };
}

export function buildPaginationHast(
  slug: string,
  locale: string,
  nav: { prev?: NavEntry; next?: NavEntry },
): Element {
  const t = i18n(locale).pages.folderContent;

  const item = (entry: NavEntry, isPrev: boolean): Element =>
    el(
      "a",
      {
        className: ["pagination-item", isPrev ? "pagination-prev" : "pagination-next", "internal"],
        href: resolveRelative(slug as unknown as FullSlug, entry.slug),
      },
      [
        el("span", { className: ["pagination-label"] }, [
          textNode(isPrev ? `← ${t.previousPage}` : `${t.nextPage} →`),
        ]),
        el("span", { className: ["pagination-title"] }, [textNode(entry.title)]),
      ],
    );

  const items: (Element | Text)[] = [];
  if (nav.prev) items.push(item(nav.prev, true));
  if (nav.next) items.push(item(nav.next, false));
  return el("nav", { className: ["page-pagination"] }, items);
}

/**
 * Inject the previous/next navigation into the page's HAST tree, right before
 * the footnotes section (or at the end of the article when there is none), so
 * readers see the navigation as soon as they finish the article content.
 * Folder index pages are skipped — their body component renders the nav itself.
 */
export function injectPagination(root: Root, slug: string, trie: TrieNode, locale: string): void {
  if (slug.endsWith("/index")) return;

  const nav = computeChainNav(trie, slug, locale);
  if (!nav.prev && !nav.next) return;

  const navElement = buildPaginationHast(slug, locale, nav);

  let footnotes: Element | undefined;
  const visit = (node: RootContent): void => {
    if (footnotes) return;
    if (node.type === "element") {
      const cls = node.properties?.className;
      const classList = Array.isArray(cls) ? cls : typeof cls === "string" ? cls.split(/\s+/) : [];
      if (classList.includes("footnotes")) {
        footnotes = node;
        return;
      }
      for (const child of node.children ?? []) visit(child);
    }
  };
  for (const child of root.children) visit(child);

  if (footnotes) {
    const idx = root.children.findIndex((c) => c === footnotes);
    if (idx !== -1) {
      root.children.splice(idx, 0, navElement);
      return;
    }
  }
  root.children.push(navElement);
}

export const paginationCss = `
.page-pagination {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
}

.page-pagination .pagination-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 45%;
}

.page-pagination .pagination-next {
  margin-left: auto;
  text-align: right;
}

.page-pagination .pagination-label {
  font-size: 0.85em;
  opacity: 0.7;
}

.page-pagination .pagination-title {
  font-weight: 600;
}
`;

export default ((opts?: Record<string, unknown>) => {
  const FolderPagination: QuartzComponent = (props: QuartzComponentProps) => {
    const { cfg, fileData } = props;
    const ctx = props.ctx as { trie?: TrieNode } | undefined;
    const trie = ctx?.trie;
    const slug = (fileData as { slug?: string } | undefined)?.slug;

    if (!trie || !slug) return null;

    const locale = (cfg as { locale?: string } | undefined)?.locale ?? "en-US";
    const { prev, next } = computeChainNav(trie, slug, locale);
    if (!prev && !next) return null;

    const t = i18n(locale).pages.folderContent;

    return (
      <nav class="page-pagination">
        {prev && (
          <a
            class="pagination-item pagination-prev internal"
            href={resolveRelative(slug as unknown as FullSlug, prev.slug)}
          >
            <span class="pagination-label">← {t.previousPage}</span>
            <span class="pagination-title">{prev.title}</span>
          </a>
        )}
        {next && (
          <a
            class="pagination-item pagination-next internal"
            href={resolveRelative(slug as unknown as FullSlug, next.slug)}
          >
            <span class="pagination-label">{t.nextPage} →</span>
            <span class="pagination-title">{next.title}</span>
          </a>
        )}
      </nav>
    );
  };

  FolderPagination.css = paginationCss;
  return FolderPagination;
}) satisfies QuartzComponentConstructor;
