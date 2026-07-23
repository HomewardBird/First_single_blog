import { h } from "preact";
import type { QuartzTransformerPlugin, CSSResource } from "@quartz-community/types";
import type { FontSpecification, FontsOptions } from "./types";
import { OBSIDIAN_SANS_STACK, OBSIDIAN_MONO_STACK } from "./defaults";
import { readFontRegistry, isQuartzThemeEnabled } from "./util/registry";
import { googleFontHref } from "./util/google-fonts";
import { validateFontSpec } from "./util/validate";

const QUARTZ_DEFAULT_HEADER = "Schibsted Grotesk";
const QUARTZ_DEFAULT_BODY = "Source Sans Pro";
const QUARTZ_DEFAULT_CODE = "IBM Plex Mono";

const defaultOptions: FontsOptions = {
  useThemeFonts: true,
  fontOrigin: "googleFonts",
};

function toFontFamily(spec: FontSpecification): string {
  if (typeof spec === "string") return spec;
  return spec.name;
}

interface ResolvedFonts {
  title: string;
  body: string;
  header: string;
  code: string;
  interface: string;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
}

function resolveFonts(options: FontsOptions): ResolvedFonts {
  const registry = options.useThemeFonts !== false ? readFontRegistry() : undefined;

  if (options.useThemeFonts !== false && !registry) {
    if (isQuartzThemeEnabled()) {
      console.warn(
        "[Fonts] QuartzTheme is enabled but its font registry is empty. " +
          "Ensure QuartzTheme runs before Fonts (lower defaultOrder number). " +
          "Falling back to Obsidian defaults.",
      );
    }
  }

  const themeFonts = registry?.fonts ?? {};

  const resolve = (
    spec: FontSpecification | undefined,
    ...fallbacks: (string | undefined)[]
  ): string => {
    if (spec !== undefined) return toFontFamily(spec);
    for (const fb of fallbacks) {
      if (fb !== undefined) return fb;
    }
    return OBSIDIAN_SANS_STACK;
  };

  const body = resolve(
    options.body,
    themeFonts["--font-text"],
    QUARTZ_DEFAULT_BODY,
    OBSIDIAN_SANS_STACK,
  );
  const header = resolve(
    options.header,
    themeFonts["--font-text"],
    QUARTZ_DEFAULT_HEADER,
    OBSIDIAN_SANS_STACK,
  );
  const code = resolve(
    options.code,
    themeFonts["--font-monospace"],
    QUARTZ_DEFAULT_CODE,
    OBSIDIAN_MONO_STACK,
  );
  const interfaceFont = resolve(
    options.interface,
    themeFonts["--font-interface"],
    OBSIDIAN_SANS_STACK,
  );
  const title = resolve(options.title, undefined, header);

  const resolveHeading = (level: 1 | 2 | 3 | 4 | 5 | 6): string => {
    const levelKey = `h${level}` as keyof FontsOptions;
    const themeVarKey = `--h${level}-font`;
    const userSpec = options[levelKey] as FontSpecification | undefined;

    if (userSpec !== undefined) return toFontFamily(userSpec);
    if (themeFonts[themeVarKey]) return themeFonts[themeVarKey];
    if (options.header !== undefined) return toFontFamily(options.header);
    if (themeFonts["--font-text"]) return themeFonts["--font-text"];
    return header;
  };

  return {
    title,
    body,
    header,
    code,
    interface: interfaceFont,
    h1: resolveHeading(1),
    h2: resolveHeading(2),
    h3: resolveHeading(3),
    h4: resolveHeading(4),
    h5: resolveHeading(5),
    h6: resolveHeading(6),
  };
}

function runValidation(options: FontsOptions): void {
  const specs: Array<{
    role: string;
    spec: FontSpecification;
    fontRole: "title" | "header" | "body" | "code";
  }> = [];

  if (options.title) specs.push({ role: "title", spec: options.title, fontRole: "title" });
  if (options.header) specs.push({ role: "header", spec: options.header, fontRole: "header" });
  if (options.body) specs.push({ role: "body", spec: options.body, fontRole: "body" });
  if (options.code) specs.push({ role: "code", spec: options.code, fontRole: "code" });

  const headingLevels = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
  for (const level of headingLevels) {
    const spec = options[level];
    if (spec) specs.push({ role: level, spec, fontRole: "header" });
  }

  for (const { role, spec, fontRole } of specs) {
    const warnings = validateFontSpec(role, spec, fontRole);
    for (const w of warnings) {
      console.warn(`[Fonts] ${w.role}: ${w.message}`);
    }
  }
}

function buildLayeredCSS(fonts: ResolvedFonts): string {
  return [
    "@layer quartz-fonts {",
    "  :root {",
    `    --titleFont: ${fonts.title};`,
    `    --bodyFont: ${fonts.body};`,
    `    --headerFont: ${fonts.header};`,
    `    --codeFont: ${fonts.code};`,
    `    --font-text: ${fonts.body};`,
    `    --font-interface: ${fonts.interface};`,
    `    --font-monospace: ${fonts.code};`,
    `    --h1-font: ${fonts.h1};`,
    `    --h2-font: ${fonts.h2};`,
    `    --h3-font: ${fonts.h3};`,
    `    --h4-font: ${fonts.h4};`,
    `    --h5-font: ${fonts.h5};`,
    `    --h6-font: ${fonts.h6};`,
    "  }",
    "}",
  ].join("\n");
}

function buildUnlayeredCSS(fonts: ResolvedFonts): string {
  return [
    `h1 { font-family: ${fonts.h1}; }`,
    `h2 { font-family: ${fonts.h2}; }`,
    `h3 { font-family: ${fonts.h3}; }`,
    `h4 { font-family: ${fonts.h4}; }`,
    `h5 { font-family: ${fonts.h5}; }`,
    `h6 { font-family: ${fonts.h6}; }`,
  ].join("\n");
}

function buildGoogleFontsHead(options: FontsOptions): unknown[] {
  const headerSpec = options.header ?? QUARTZ_DEFAULT_HEADER;
  const bodySpec = options.body ?? QUARTZ_DEFAULT_BODY;
  const codeSpec = options.code ?? QUARTZ_DEFAULT_CODE;

  const href = googleFontHref({
    title: options.title,
    header: headerSpec,
    body: bodySpec,
    code: codeSpec,
  });

  return [
    h("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }),
    h("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }),
    h("link", { rel: "stylesheet", href }),
  ];
}

export const Fonts: QuartzTransformerPlugin<Partial<FontsOptions>> = (
  userOptions?: Partial<FontsOptions>,
) => {
  const options: FontsOptions = { ...defaultOptions, ...userOptions };

  if (options.fontOrigin === "googleFonts") {
    runValidation(options);
  }

  return {
    name: "Fonts",
    textTransform(_ctx, src) {
      return src;
    },
    externalResources(_ctx) {
      const fonts = resolveFonts(options);

      const css: CSSResource[] = [
        { content: buildLayeredCSS(fonts), inline: true },
        { content: buildUnlayeredCSS(fonts), inline: true },
      ];

      let additionalHead: unknown[] = [];
      if (options.fontOrigin === "googleFonts") {
        additionalHead = buildGoogleFontsHead(options);
      } else if (options.fontOrigin === "selfHosted") {
        additionalHead = [h("link", { rel: "stylesheet", href: "/static/fonts/quartz-fonts.css" })];
      }

      return { css, js: [], additionalHead };
    },
  };
};
