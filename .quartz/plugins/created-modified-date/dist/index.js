import fs from 'fs';
import { Repository } from '@napi-rs/simple-git';
import path from 'path';
import { styleText } from 'util';

// src/transformer.ts
var defaultOptions = {
  priority: ["frontmatter", "git", "filesystem"],
  defaultDateType: "modified"
};
var iso8601DateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
function coerceDate(fp, d) {
  if (typeof d === "string" && iso8601DateOnlyRegex.test(d)) {
    d = `${d}T00:00:00`;
  }
  const dt = d === void 0 ? /* @__PURE__ */ new Date() : d === null ? /* @__PURE__ */ new Date(0) : new Date(d);
  const invalidDate = isNaN(dt.getTime()) || dt.getTime() === 0;
  if (invalidDate && d !== void 0) {
    console.log(
      styleText(
        "yellow",
        `
Warning: found invalid date "${d}" in \`${fp}\`. Supported formats: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format`
      )
    );
  }
  return invalidDate ? /* @__PURE__ */ new Date() : dt;
}
var CreatedModifiedDate = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "CreatedModifiedDate",
    markdownPlugins(ctx) {
      return [
        () => {
          let repo = void 0;
          let repositoryWorkdir;
          if (opts.priority.includes("git")) {
            try {
              repo = Repository.discover(ctx.argv.directory);
              repositoryWorkdir = repo.workdir() ?? ctx.argv.directory;
            } catch (e) {
              console.log(
                styleText(
                  "yellow",
                  `
Warning: couldn't find git repository for ${ctx.argv.directory}`
                )
              );
            }
          }
          return async (_tree, file) => {
            let created = void 0;
            let modified = void 0;
            let published = void 0;
            const data = file.data;
            const fp = data.relativePath;
            const fullFp = data.filePath;
            for (const source of opts.priority) {
              if (source === "filesystem") {
                const st = await fs.promises.stat(fullFp);
                created ||= st.birthtimeMs;
                modified ||= st.mtimeMs;
              } else if (source === "frontmatter" && data.frontmatter) {
                created ||= data.frontmatter.created;
                modified ||= data.frontmatter.modified;
                published ||= data.frontmatter.published;
              } else if (source === "git" && repo) {
                try {
                  const relativePath = path.relative(repositoryWorkdir, fullFp);
                  modified ||= await repo.getFileLatestModifiedDateAsync(relativePath);
                } catch {
                  console.log(
                    styleText(
                      "yellow",
                      `
Warning: ${data.filePath} isn't yet tracked by git, dates will be inaccurate`
                    )
                  );
                }
              }
            }
            data.dates = {
              created: coerceDate(fp, created),
              modified: coerceDate(fp, modified),
              published: coerceDate(fp, published)
            };
            data.defaultDateType = opts.defaultDateType;
          };
        }
      ];
    }
  };
};

export { CreatedModifiedDate };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map