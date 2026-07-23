import path from "node:path";
import fs from "node:fs/promises";
import type { QuartzEmitterPlugin, BuildCtx, FilePath, FullSlug } from "@quartz-community/types";
import { joinSegments } from "@quartz-community/types";
import {
  simplifySlug,
  resolveRelative,
  isRelativeURL,
  getFileExtension,
  stripSlashes,
  endsWith,
} from "@quartz-community/utils";
import type { VFile } from "vfile";

interface Options {
  /**
   * When enabled, automatically generates redirect pages for the original
   * (case-preserving) URL of any file whose path changed due to v5's
   * lowercase slug normalization. This ensures previously indexed URLs
   * (e.g. `/Diary/My-Note`) redirect to the new canonical lowercase URL
   * (e.g. `/diary/my-note`) with proper SEO signals.
   *
   * Has no effect on case-insensitive filesystems (macOS, Windows) where
   * the server already resolves either casing to the same file.
   *
   * @default true
   */
  enableCaseRedirects: boolean;
}

const defaultOptions: Options = {
  enableCaseRedirects: true,
};

const write = async (
  ctx: BuildCtx,
  slug: FullSlug,
  ext: string,
  content: string,
): Promise<FilePath> => {
  const pathToPage = joinSegments(ctx.argv.output, slug + ext) as FilePath;
  const dir = path.dirname(pathToPage);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pathToPage, content);
  return pathToPage;
};

function redirectHtml(title: string, redirectUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en-us">
<head>
<title>${title}</title>
<link rel="canonical" href="${redirectUrl}">
<meta name="robots" content="noindex">
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${redirectUrl}">
</head>
</html>
`;
}

/**
 * Replicate the slug transforms from `slugifyPath` but preserve case.
 * This matches `@quartz-community/utils` `slugifyPath()` exactly, minus
 * the `.toLowerCase()` call.
 */
function slugifyPathPreserveCase(s: string): string {
  return s
    .split("/")
    .map((segment) =>
      segment
        .replace(/\s/g, "-")
        .replace(/&/g, "-and-")
        .replace(/%/g, "-percent")
        .replace(/\?/g, "")
        .replace(/#/g, ""),
    )
    .join("/")
    .replace(/\/$/, "");
}

/**
 * Compute the slug that `slugifyFilePath` would produce, but without
 * lowercasing. Used to find the original-case path for redirect generation.
 */
function slugifyFilePathPreserveCase(fp: FilePath): string {
  fp = stripSlashes(fp) as FilePath;
  const ext = getFileExtension(fp);
  const withoutFileExt = fp.replace(new RegExp((ext ?? "") + "$"), "");
  const finalExt = [".md", ".html", undefined].includes(ext) ? "" : (ext ?? "");
  let slug = slugifyPathPreserveCase(withoutFileExt);
  if (endsWith(slug, "_index")) {
    slug = slug.replace(/_index$/, "index");
  }
  const segments = slug.split("/");
  if (segments.length >= 2 && segments[segments.length - 1] === segments[segments.length - 2]) {
    segments[segments.length - 1] = "index";
    slug = segments.join("/");
  }
  return slug + finalExt;
}

/**
 * Detect whether the filesystem is case-insensitive by attempting to
 * stat the output directory with an altered-case path. Memoized per
 * build since the filesystem doesn't change mid-build.
 */
let _fsCaseSensitive: boolean | undefined;
async function isFsCaseSensitive(outputDir: string): Promise<boolean> {
  if (_fsCaseSensitive !== undefined) return _fsCaseSensitive;

  try {
    // Create a probe file with known casing, then check if the
    // alternate casing resolves to the same inode.
    const probeDir = path.join(outputDir, ".quartz-case-probe");
    await fs.mkdir(probeDir, { recursive: true });

    const probeLower = path.join(probeDir, "a");
    const probeUpper = path.join(probeDir, "A");

    await fs.writeFile(probeLower, "");
    try {
      await fs.access(probeUpper);
      // If "A" is accessible after writing "a", the FS is case-insensitive
      // But we need to check they're the same file (not two different files)
      const statLower = await fs.stat(probeLower);
      const statUpper = await fs.stat(probeUpper);
      _fsCaseSensitive = statLower.ino !== statUpper.ino;
    } catch {
      // "A" not found → case-sensitive
      _fsCaseSensitive = true;
    }

    // Clean up probe files
    await fs.rm(probeDir, { recursive: true, force: true });
  } catch {
    // If detection fails, assume case-sensitive (safer default: generates
    // redirect files even if they might not be needed)
    _fsCaseSensitive = true;
  }

  return _fsCaseSensitive;
}

/** Reset filesystem detection cache (used in tests). */
export function _resetFsDetectionCache(): void {
  _fsCaseSensitive = undefined;
}

async function* processAliases(ctx: BuildCtx, file: VFile, emittedPaths: Set<string>) {
  const ogSlug = simplifySlug(file.data.slug! as FullSlug);

  for (const aliasTarget of ((file.data as Record<string, unknown>).aliases as string[]) ?? []) {
    const aliasTargetSlug = (
      isRelativeURL(aliasTarget)
        ? path.normalize(path.join(ogSlug, "..", aliasTarget))
        : aliasTarget
    ) as FullSlug;

    emittedPaths.add(aliasTargetSlug);
    const redirUrl = resolveRelative(aliasTargetSlug, ogSlug);
    yield write(ctx, aliasTargetSlug, ".html", redirectHtml(ogSlug, redirUrl));
  }
}

async function* processCaseRedirects(ctx: BuildCtx, file: VFile, emittedPaths: Set<string>) {
  const data = file.data as Record<string, unknown>;
  const relativePath = data.relativePath as FilePath | undefined;
  const slug = data.slug as FullSlug | undefined;
  if (!relativePath || !slug) return;

  const caseSensitive = await isFsCaseSensitive(ctx.argv.output);
  if (!caseSensitive) return;

  const casePreservedSlug = slugifyFilePathPreserveCase(relativePath);

  if (casePreservedSlug === slug) return;

  const simplifiedSlug = simplifySlug(slug);
  const simplifiedCasePreserved = casePreservedSlug.replace(/\/index$/, "/");

  if (emittedPaths.has(casePreservedSlug) || emittedPaths.has(simplifiedCasePreserved)) return;

  emittedPaths.add(casePreservedSlug);
  const redirUrl = resolveRelative(casePreservedSlug as FullSlug, simplifiedSlug);
  yield write(ctx, casePreservedSlug as FullSlug, ".html", redirectHtml(simplifiedSlug, redirUrl));
}

export const AliasRedirects: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  const options = { ...defaultOptions, ...opts };

  return {
    name: "AliasRedirects",
    async *emit(ctx, content) {
      const emittedPaths = new Set<string>();
      for (const [_tree, file] of content) {
        yield* processAliases(ctx, file, emittedPaths);
        if (options.enableCaseRedirects) {
          yield* processCaseRedirects(ctx, file, emittedPaths);
        }
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      const emittedPaths = new Set<string>();
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue;
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield* processAliases(ctx, changeEvent.file, emittedPaths);
          if (options.enableCaseRedirects) {
            yield* processCaseRedirects(ctx, changeEvent.file, emittedPaths);
          }
        }
      }
    },
  };
};
