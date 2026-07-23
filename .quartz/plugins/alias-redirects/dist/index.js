import path from 'path';
import fs from 'fs/promises';

// src/emitter.ts

// node_modules/@quartz-community/types/dist/index.js
function joinSegments(...segments) {
  return segments.filter((segment) => segment.length > 0).join("/").replace(/\/+/g, "/");
}
"function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Math.random().toString(8);

// node_modules/@quartz-community/utils/dist/index.js
function isRelativeURL(s2) {
  const validStart = /^\.{1,2}/.test(s2);
  const validEnding = !endsWith(s2, "index");
  return validStart && validEnding && ![".md", ".html"].includes(getFileExtension(s2) ?? "");
}
function simplifySlug(fp) {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return res.length === 0 ? "/" : res;
}
function joinSegments2(...args) {
  if (args.length === 0) {
    return "";
  }
  let joined = args.filter((segment) => segment !== "" && segment !== "/").map((segment) => stripSlashes(segment)).join("/");
  const first = args[0];
  const last = args[args.length - 1];
  if (first?.startsWith("/")) {
    joined = "/" + joined;
  }
  if (last?.endsWith("/")) {
    joined = joined + "/";
  }
  return joined;
}
function endsWith(s2, suffix) {
  return s2 === suffix || s2.endsWith("/" + suffix);
}
function trimSuffix(s2, suffix) {
  if (endsWith(s2, suffix)) {
    s2 = s2.slice(0, -suffix.length);
  }
  return s2;
}
function stripSlashes(s2, onlyStripPrefix) {
  if (s2.startsWith("/")) {
    s2 = s2.substring(1);
  }
  if (!onlyStripPrefix && s2.endsWith("/")) {
    s2 = s2.slice(0, -1);
  }
  return s2;
}
function getFileExtension(s2) {
  return s2.match(/\.[A-Za-z0-9]+$/)?.[0];
}
function pathToRoot(slug2) {
  let rootPath = slug2.split("/").filter((x2) => x2 !== "").slice(0, -1).map((_2) => "..").join("/");
  if (rootPath.length === 0) {
    rootPath = ".";
  }
  return rootPath;
}
function resolveRelative(current, target) {
  const res = joinSegments2(pathToRoot(current), simplifySlug(target));
  return res;
}

// src/emitter.ts
var defaultOptions = {
  enableCaseRedirects: true
};
var write = async (ctx, slug2, ext, content) => {
  const pathToPage = joinSegments(ctx.argv.output, slug2 + ext);
  const dir = path.dirname(pathToPage);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pathToPage, content);
  return pathToPage;
};
function redirectHtml(title, redirectUrl) {
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
function slugifyPathPreserveCase(s2) {
  return s2.split("/").map(
    (segment) => segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/\?/g, "").replace(/#/g, "")
  ).join("/").replace(/\/$/, "");
}
function slugifyFilePathPreserveCase(fp) {
  fp = stripSlashes(fp);
  const ext = getFileExtension(fp);
  const withoutFileExt = fp.replace(new RegExp((ext ?? "") + "$"), "");
  const finalExt = [".md", ".html", void 0].includes(ext) ? "" : ext ?? "";
  let slug2 = slugifyPathPreserveCase(withoutFileExt);
  if (endsWith(slug2, "_index")) {
    slug2 = slug2.replace(/_index$/, "index");
  }
  const segments = slug2.split("/");
  if (segments.length >= 2 && segments[segments.length - 1] === segments[segments.length - 2]) {
    segments[segments.length - 1] = "index";
    slug2 = segments.join("/");
  }
  return slug2 + finalExt;
}
var _fsCaseSensitive;
async function isFsCaseSensitive(outputDir) {
  if (_fsCaseSensitive !== void 0) return _fsCaseSensitive;
  try {
    const probeDir = path.join(outputDir, ".quartz-case-probe");
    await fs.mkdir(probeDir, { recursive: true });
    const probeLower = path.join(probeDir, "a");
    const probeUpper = path.join(probeDir, "A");
    await fs.writeFile(probeLower, "");
    try {
      await fs.access(probeUpper);
      const statLower = await fs.stat(probeLower);
      const statUpper = await fs.stat(probeUpper);
      _fsCaseSensitive = statLower.ino !== statUpper.ino;
    } catch {
      _fsCaseSensitive = true;
    }
    await fs.rm(probeDir, { recursive: true, force: true });
  } catch {
    _fsCaseSensitive = true;
  }
  return _fsCaseSensitive;
}
function _resetFsDetectionCache() {
  _fsCaseSensitive = void 0;
}
async function* processAliases(ctx, file, emittedPaths) {
  const ogSlug = simplifySlug(file.data.slug);
  for (const aliasTarget of file.data.aliases ?? []) {
    const aliasTargetSlug = isRelativeURL(aliasTarget) ? path.normalize(path.join(ogSlug, "..", aliasTarget)) : aliasTarget;
    emittedPaths.add(aliasTargetSlug);
    const redirUrl = resolveRelative(aliasTargetSlug, ogSlug);
    yield write(ctx, aliasTargetSlug, ".html", redirectHtml(ogSlug, redirUrl));
  }
}
async function* processCaseRedirects(ctx, file, emittedPaths) {
  const data = file.data;
  const relativePath = data.relativePath;
  const slug2 = data.slug;
  if (!relativePath || !slug2) return;
  const caseSensitive = await isFsCaseSensitive(ctx.argv.output);
  if (!caseSensitive) return;
  const casePreservedSlug = slugifyFilePathPreserveCase(relativePath);
  if (casePreservedSlug === slug2) return;
  const simplifiedSlug = simplifySlug(slug2);
  const simplifiedCasePreserved = casePreservedSlug.replace(/\/index$/, "/");
  if (emittedPaths.has(casePreservedSlug) || emittedPaths.has(simplifiedCasePreserved)) return;
  emittedPaths.add(casePreservedSlug);
  const redirUrl = resolveRelative(casePreservedSlug, simplifiedSlug);
  yield write(ctx, casePreservedSlug, ".html", redirectHtml(simplifiedSlug, redirUrl));
}
var AliasRedirects = (opts) => {
  const options = { ...defaultOptions, ...opts };
  return {
    name: "AliasRedirects",
    async *emit(ctx, content) {
      const emittedPaths = /* @__PURE__ */ new Set();
      for (const [_tree, file] of content) {
        yield* processAliases(ctx, file, emittedPaths);
        if (options.enableCaseRedirects) {
          yield* processCaseRedirects(ctx, file, emittedPaths);
        }
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      const emittedPaths = /* @__PURE__ */ new Set();
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue;
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield* processAliases(ctx, changeEvent.file, emittedPaths);
          if (options.enableCaseRedirects) {
            yield* processCaseRedirects(ctx, changeEvent.file, emittedPaths);
          }
        }
      }
    }
  };
};

export { AliasRedirects, _resetFsDetectionCache };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map