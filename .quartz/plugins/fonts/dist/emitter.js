import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

createRequire(import.meta.url);

// src/defaults.ts
var DEFAULT_WEIGHTS = {
  title: [400, 700],
  header: [400, 700],
  body: [400, 600],
  code: [400, 600]
};
var DEFAULT_ITALIC = {
  title: false,
  header: false,
  body: true,
  code: false
};

// src/util/google-fonts.ts
function normalizeFontSpec(spec) {
  return typeof spec === "string" ? { name: spec } : spec;
}
function mergeInto(map, role, spec) {
  const { name, weights, includeItalic } = normalizeFontSpec(spec);
  const resolvedWeights = weights ?? DEFAULT_WEIGHTS[role];
  const italic = includeItalic ?? DEFAULT_ITALIC[role];
  const existing = map.get(name);
  if (existing) {
    for (const w of resolvedWeights) existing.weights.add(w);
    if (italic) existing.italic = true;
  } else {
    map.set(name, { name, weights: new Set(resolvedWeights), italic });
  }
}
function formatMergedEntry(entry) {
  const sortedWeights = [...entry.weights].sort((a, b) => a - b);
  const features = [];
  if (entry.italic) {
    features.push("ital");
  }
  if (sortedWeights.length > 1) {
    const weightSpec = entry.italic ? sortedWeights.flatMap((w) => [`0,${w}`, `1,${w}`]).sort().join(";") : sortedWeights.join(";");
    features.push(`wght@${weightSpec}`);
  }
  if (features.length > 0) {
    return `${entry.name}:${features.join(",")}`;
  }
  return entry.name;
}
function googleFontHref(fonts) {
  const merged = /* @__PURE__ */ new Map();
  mergeInto(merged, "header", fonts.header);
  mergeInto(merged, "body", fonts.body);
  mergeInto(merged, "code", fonts.code);
  if (fonts.title) {
    mergeInto(merged, "title", fonts.title);
  }
  const families = [...merged.values()].map(formatMergedEntry);
  const params = families.map((f) => `family=${encodeURIComponent(f)}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

// src/util/process-fonts.ts
var fontMimeMap = {
  truetype: "ttf",
  woff: "woff",
  woff2: "woff2",
  opentype: "otf"
};
var fontUrlPattern = /url\((https:\/\/fonts.gstatic.com\/.+(?:\/|(?:kit=))(.+?)[.&].+?)\)\sformat\('(\w+?)'\);/g;
function processGoogleFonts(stylesheet, baseUrl) {
  const fontFiles = [];
  const processedStylesheet = stylesheet.replace(
    fontUrlPattern,
    (match, url, filename, format) => {
      const extension = fontMimeMap[format] ?? format;
      const rewrittenUrl = `https://${baseUrl}/static/fonts/${filename}.${extension}`;
      fontFiles.push({ url, filename, extension });
      return match.replace(url, rewrittenUrl);
    }
  );
  return { processedStylesheet, fontFiles };
}

// src/emitter.ts
var QUARTZ_DEFAULT_HEADER = "Schibsted Grotesk";
var QUARTZ_DEFAULT_BODY = "Source Sans Pro";
var QUARTZ_DEFAULT_CODE = "IBM Plex Mono";
var defaultOptions = {
  useThemeFonts: true,
  fontOrigin: "googleFonts"
};
var FontsEmitter = (userOptions) => {
  const options = { ...defaultOptions, ...userOptions };
  return {
    name: "FontsEmitter",
    async *emit(ctx, _content, _resources) {
      if (options.fontOrigin !== "selfHosted") {
        return;
      }
      const baseUrl = ctx.cfg.configuration.baseUrl;
      if (!baseUrl) {
        throw new Error("[FontsEmitter] baseUrl is required for selfHosted fonts.");
      }
      const headerSpec = options.header ?? QUARTZ_DEFAULT_HEADER;
      const bodySpec = options.body ?? QUARTZ_DEFAULT_BODY;
      const codeSpec = options.code ?? QUARTZ_DEFAULT_CODE;
      const href = googleFontHref({
        title: options.title,
        header: headerSpec,
        body: bodySpec,
        code: codeSpec
      });
      const cssResponse = await fetch(href);
      if (!cssResponse.ok) {
        throw new Error(
          `[FontsEmitter] Failed to fetch Google Fonts CSS: ${cssResponse.status} ${cssResponse.statusText}`
        );
      }
      const cssText = await cssResponse.text();
      const { processedStylesheet, fontFiles } = processGoogleFonts(cssText, baseUrl);
      const fontsDir = path.join(ctx.argv.output, "static", "fonts");
      await fs.promises.mkdir(fontsDir, { recursive: true });
      for (const fontFile of fontFiles) {
        const fontResponse = await fetch(fontFile.url);
        if (!fontResponse.ok) {
          throw new Error(
            `[FontsEmitter] Failed to fetch font file: ${fontFile.url} (${fontResponse.status} ${fontResponse.statusText})`
          );
        }
        const buf = await fontResponse.arrayBuffer();
        const filePath = path.join(fontsDir, `${fontFile.filename}.${fontFile.extension}`);
        await fs.promises.writeFile(filePath, Buffer.from(buf));
        yield filePath;
      }
      const cssPath = path.join(fontsDir, "quartz-fonts.css");
      await fs.promises.writeFile(cssPath, processedStylesheet);
      yield cssPath;
    }
  };
};

export { FontsEmitter };
//# sourceMappingURL=emitter.js.map
//# sourceMappingURL=emitter.js.map