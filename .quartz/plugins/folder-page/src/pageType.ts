import type {
  QuartzPageTypePlugin,
  QuartzComponentConstructor,
  PageMatcher,
  FullSlug,
  VirtualPage,
} from "@quartz-community/types";
import FolderContentComponent from "./components/FolderContent";
import { i18n } from "./i18n";
import { joinSegments } from "./util/path";
import type { SortFn } from "./components/PageList";
import path from "path";

export interface FolderPageOptions {
  showFolderCount?: boolean;
  showSubfolders?: boolean;
  sort?: SortFn;
  /** Show "Folder: " prefix before folder name in generated titles. Default: false */
  prefixFolders?: boolean;
}

const folderMatcher: PageMatcher = ({ slug }) => {
  return slug.endsWith("/index");
};

function getFolders(slug: string): string[] {
  let folderName = path.dirname(slug ?? "");
  const parentFolderNames = [folderName];
  while (folderName !== ".") {
    folderName = path.dirname(folderName ?? "");
    parentFolderNames.push(folderName);
  }
  return parentFolderNames;
}

export const FolderPage: QuartzPageTypePlugin<FolderPageOptions> = (opts) => {
  const body: QuartzComponentConstructor = () => FolderContentComponent(opts);

  return {
    name: "FolderPage",
    priority: 10,
    match: folderMatcher,
    generate({ content, cfg }) {
      const allFiles = content
        .map((c) => c[1].data)
        .filter((d) => (d as { unlisted?: unknown } | undefined)?.unlisted !== true);
      const locale = (cfg as { locale?: string } | undefined)?.locale ?? "en-US";

      const folders = new Set<string>();
      const folderDisplayNames = new Map<string, string>();
      for (const file of allFiles) {
        const slug = (file as { slug?: string } | undefined)?.slug;
        if (!slug) continue;
        const fileFolders = getFolders(slug).filter((f) => f !== "." && f !== "tags");
        for (const f of fileFolders) {
          folders.add(f);
        }

        const relativePath = (file as { relativePath?: string } | undefined)?.relativePath;
        if (relativePath) {
          const slugParts = path
            .dirname(slug)
            .split("/")
            .filter((s) => s !== ".");
          const pathParts = path
            .dirname(relativePath)
            .split("/")
            .filter((s) => s !== ".");
          for (let i = 0; i < slugParts.length && i < pathParts.length; i++) {
            const slugPart = slugParts[i];
            const pathPart = pathParts[i];
            if (slugPart && pathPart && !folderDisplayNames.has(slugPart)) {
              folderDisplayNames.set(slugPart, pathPart);
            }
          }
        }
      }

      const foldersWithIndex = new Set<string>();
      for (const [, file] of content) {
        const data = file.data as { slug?: string; unlisted?: unknown } | undefined;
        if (data?.unlisted === true) continue;
        const slug = data?.slug;
        if (slug && slug.endsWith("/index")) {
          const folder = slug.slice(0, -"/index".length);
          foldersWithIndex.add(folder);
        }
      }

      // For existing index files without a meaningful title, use the folder display name
      for (const [, file] of content) {
        const slug = (file.data as { slug?: string } | undefined)?.slug;
        if (!slug || !slug.endsWith("/index")) continue;

        const frontmatter = (file.data as { frontmatter?: { title?: string } }).frontmatter;
        if (!frontmatter || (frontmatter.title && frontmatter.title !== "index")) continue;

        const folder = slug.slice(0, -"/index".length);
        const slugSegment = folder.split("/").pop() ?? folder;
        const folderName = folderDisplayNames.get(slugSegment) ?? slugSegment;
        frontmatter.title = opts?.prefixFolders
          ? `${i18n(locale).pages.folderContent.folder}: ${folderName}`
          : folderName;
      }

      const virtualPages: VirtualPage[] = [];
      for (const folder of folders) {
        if (foldersWithIndex.has(folder)) continue;

        const slug = joinSegments(folder, "index") as unknown as FullSlug;
        const slugSegment = folder.split("/").pop() ?? folder;
        const folderName = folderDisplayNames.get(slugSegment) ?? slugSegment;
        const title = opts?.prefixFolders
          ? `${i18n(locale).pages.folderContent.folder}: ${folderName}`
          : folderName;

        virtualPages.push({
          slug,
          title,
          data: {},
        });
      }

      return virtualPages;
    },
    layout: "folder",
    body,
  };
};
