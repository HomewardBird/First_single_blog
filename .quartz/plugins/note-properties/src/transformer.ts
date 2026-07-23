import matter from "gray-matter";
import remarkFrontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import toml from "toml";
import type {
  QuartzTransformerPlugin,
  BuildCtx,
  QuartzPluginData,
  FullSlug,
  FilePath,
} from "@quartz-community/types";
import { slugTag, slugifyFilePath, getFileExtension, transformLink } from "@quartz-community/utils";
import type { TransformOptions } from "@quartz-community/utils";
import { slugifyWikilinkTarget } from "./util/path";
import type { NotePropertiesOptions } from "./types";

const defaultOptions: NotePropertiesOptions = {
  includeAll: false,
  includedProperties: ["description", "tags", "aliases"],
  excludedProperties: [],
  hidePropertiesView: false,
  delimiters: "---",
  language: "yaml",
};

function coalesceAliases(data: Record<string, unknown>, aliases: string[]): unknown | undefined {
  for (const alias of aliases) {
    if (data[alias] !== undefined && data[alias] !== null) return data[alias];
  }
}

function coerceToArray(input: unknown): string[] | undefined {
  if (input === undefined || input === null) return undefined;

  if (!Array.isArray(input)) {
    return String(input)
      .split(",")
      .map((s: string) => s.trim());
  }

  return input
    .filter((v: unknown) => typeof v === "string" || typeof v === "number")
    .map((v: string | number) => v.toString());
}

function getAliasSlugs(aliases: string[]): FullSlug[] {
  return aliases.map((alias) => {
    const isMd = getFileExtension(alias) === ".md";
    const mockFp = isMd ? alias : alias + ".md";
    return slugifyFilePath(mockFp as FilePath);
  });
}

const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MDLINK_PATTERN = /\[(?:[^\]]*)\]\(([^)]+)\)/g;

function extractLinksFromValue(value: unknown): string[] {
  if (typeof value === "string") {
    const links: string[] = [];
    let match: RegExpExecArray | null;

    WIKILINK_PATTERN.lastIndex = 0;
    while ((match = WIKILINK_PATTERN.exec(value)) !== null) {
      links.push(slugifyWikilinkTarget(match[1]!));
    }

    MDLINK_PATTERN.lastIndex = 0;
    while ((match = MDLINK_PATTERN.exec(value)) !== null) {
      links.push(match[1]!);
    }

    return links;
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractLinksFromValue(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap((v) => extractLinksFromValue(v));
  }

  return [];
}

function collectLinkTargetsFromValue(value: unknown): Set<string> {
  const targets = new Set<string>();
  if (typeof value === "string") {
    let match: RegExpExecArray | null;
    WIKILINK_PATTERN.lastIndex = 0;
    while ((match = WIKILINK_PATTERN.exec(value)) !== null) {
      targets.add(slugifyWikilinkTarget(match[1]!));
    }
    MDLINK_PATTERN.lastIndex = 0;
    while ((match = MDLINK_PATTERN.exec(value)) !== null) {
      targets.add(match[1]!);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      for (const t of collectLinkTargetsFromValue(item)) targets.add(t);
    }
  } else if (value !== null && typeof value === "object") {
    for (const v of Object.values(value)) {
      for (const t of collectLinkTargetsFromValue(v)) targets.add(t);
    }
  }
  return targets;
}

/** Quartz-internal frontmatter keys that should never appear in the properties table. */
const QUARTZ_INTERNAL_KEYS = new Set([
  "quartz-properties",
  "quartzProperties",
  "quartz-properties-collapse",
  "quartzPropertiesCollapse",
]);

function coerceToBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return undefined;
}
function getVisibleProperties(
  data: Record<string, unknown>,
  opts: NotePropertiesOptions,
): Record<string, unknown> {
  const excluded = new Set(opts.excludedProperties);
  // Always exclude Quartz-internal keys from the visible properties table
  for (const key of QUARTZ_INTERNAL_KEYS) {
    excluded.add(key);
  }
  if (opts.includeAll) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!excluded.has(key)) {
        result[key] = value;
      }
    }
    return result;
  }

  const result: Record<string, unknown> = {};
  for (const key of opts.includedProperties) {
    if (!excluded.has(key) && data[key] !== undefined) {
      result[key] = data[key];
    }
  }
  return result;
}

export const NoteProperties: QuartzTransformerPlugin<Partial<NotePropertiesOptions>> = (
  userOpts,
) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "NoteProperties",
    markdownPlugins(_ctx: BuildCtx) {
      const { allSlugs } = _ctx;
      return [
        [remarkFrontmatter, ["yaml", "toml"]],
        () => {
          return (_, file) => {
            const fileData = Buffer.from(file.value as Uint8Array);
            const { data } = matter(fileData, {
              delimiters: opts.delimiters,
              language: opts.language,
              engines: {
                yaml: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) as object,
                toml: (s) => toml.parse(s) as object,
              },
            });

            if (data.title != null && data.title.toString() !== "") {
              data.title = data.title.toString();
            } else {
              data.title = file.stem ?? "Untitled";
            }

            const tags = coerceToArray(coalesceAliases(data, ["tags", "tag"]));
            if (tags) data.tags = [...new Set(tags.map((tag: string) => slugTag(tag)))];

            const aliases = coerceToArray(coalesceAliases(data, ["aliases", "alias"]));
            if (aliases) {
              data.aliases = aliases;
              file.data.aliases = getAliasSlugs(aliases);
              allSlugs.push(...file.data.aliases);
            }

            if (data.permalink != null && data.permalink.toString() !== "") {
              data.permalink = data.permalink.toString() as FullSlug;
              const fileAliases = (file.data.aliases as FullSlug[]) ?? [];
              fileAliases.push(data.permalink);
              file.data.aliases = fileAliases;
              allSlugs.push(data.permalink);
            }

            const cssclasses = coerceToArray(coalesceAliases(data, ["cssclasses", "cssclass"]));
            if (cssclasses) data.cssclasses = cssclasses;

            const socialImage = coalesceAliases(data, ["socialImage", "image", "cover"]);

            const created = coalesceAliases(data, ["created", "date"]);
            if (created) data.created = created;

            const modified = coalesceAliases(data, [
              "modified",
              "lastmod",
              "updated",
              "last-modified",
            ]);
            if (modified) data.modified = modified;
            data.modified ||= created;

            const published = coalesceAliases(data, ["published", "publishDate", "date"]);
            if (published) data.published = published;

            if (socialImage) data.socialImage = socialImage;

            const uniqueSlugs = [...new Set(allSlugs)];
            allSlugs.splice(0, allSlugs.length, ...uniqueSlugs);

            const frontmatterLinks = extractLinksFromValue(data);
            if (frontmatterLinks.length > 0) {
              const existingLinks = (file.data.frontmatterLinks as string[]) ?? [];
              file.data.frontmatterLinks = [...existingLinks, ...frontmatterLinks];
            }

            // Read per-note overrides for properties view visibility and collapsed state
            const showProperties = coerceToBool(
              coalesceAliases(data, ["quartz-properties", "quartzProperties"]),
            );
            const collapseProperties = coerceToBool(
              coalesceAliases(data, ["quartz-properties-collapse", "quartzPropertiesCollapse"]),
            );
            const visibleProps = getVisibleProperties(data, opts);
            file.data.noteProperties = {
              properties: visibleProps,
              hideView: opts.hidePropertiesView,
              showProperties,
              collapseProperties,
            };

            file.data.frontmatter = data as QuartzPluginData["frontmatter"];
          };
        },
      ];
    },
    htmlPlugins(ctx: BuildCtx) {
      return [
        () => {
          return (_tree: unknown, file: { data: Record<string, unknown> }) => {
            const noteProps = file.data.noteProperties as
              | { properties: Record<string, unknown>; resolvedLinks?: Record<string, string> }
              | undefined;
            if (!noteProps) return;

            const fileSlug = file.data.slug as FullSlug;
            const transformOptions: TransformOptions = {
              strategy: "shortest",
              allSlugs: ctx.allSlugs,
            };

            const targets = new Set<string>();
            for (const value of Object.values(noteProps.properties)) {
              for (const t of collectLinkTargetsFromValue(value)) targets.add(t);
            }

            if (targets.size === 0) return;

            const resolved: Record<string, string> = {};
            for (const target of targets) {
              resolved[target] = transformLink(fileSlug, target, transformOptions);
            }
            noteProps.resolvedLinks = resolved;
          };
        },
      ];
    },
  };
};

declare module "vfile" {
  interface DataMap {
    aliases: FullSlug[];
    frontmatterLinks: string[];
    noteProperties: {
      properties: Record<string, unknown>;
      hideView: boolean;
      showProperties?: boolean;
      collapseProperties?: boolean;
      resolvedLinks?: Record<string, string>;
    };
  }
}
