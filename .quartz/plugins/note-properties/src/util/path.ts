import {
  simplifySlug as utilSimplifySlug,
  joinSegments,
  slugifyFilePath,
  splitAnchor,
} from "@quartz-community/utils";
import type { FilePath } from "@quartz-community/types";

export function simplifySlug(fp: string): string {
  return utilSimplifySlug(fp);
}

export function resolveRelative(current: string, target: string): string {
  const simplified = simplifySlug(target);
  const rootPath = pathToRoot(current);
  return joinSegments(rootPath, simplified);
}

/**
 * Convert a wikilink target like `"My Note#Section"` into the canonical slug
 * form `"My-Note#section"` so links rendered from frontmatter match the slugs
 * CrawlLinks produces for body links. Keeps the anchor after `#` intact.
 */
export function slugifyWikilinkTarget(target: string): string {
  const [rawPath, anchor] = splitAnchor(target);
  if (!rawPath) return anchor;
  const pathWithExt = rawPath.endsWith(".md") ? rawPath : `${rawPath}.md`;
  const slug = slugifyFilePath(pathWithExt as FilePath);
  return slug + anchor;
}

function pathToRoot(slug: string): string {
  let rootPath = slug
    .split("/")
    .filter((x) => x !== "")
    .slice(0, -1)
    .map((_) => "..")
    .join("/");

  if (rootPath.length === 0) {
    rootPath = ".";
  }

  return rootPath;
}
