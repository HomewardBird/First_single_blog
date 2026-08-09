import path from 'path';
import fs from 'fs/promises';

// src/emitter.ts

// node_modules/@quartz-community/types/dist/index.js
function joinSegments(...segments) {
  return segments.filter((segment) => segment.length > 0).join("/").replace(/\/+/g, "/");
}

// src/emitter.ts
var write = async (ctx, slug, ext, content) => {
  const pathToPage = joinSegments(ctx.argv.output, slug + ext);
  const dir = path.dirname(pathToPage);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pathToPage, content);
  return pathToPage;
};
function extractDomainFromBaseUrl(baseUrl) {
  const url = new URL(`https://${baseUrl}`);
  return url.hostname;
}
var CNAME = () => ({
  name: "CNAME",
  async emit(ctx) {
    const baseUrl = ctx.cfg.configuration.baseUrl;
    if (!baseUrl) {
      console.warn("CNAME emitter requires `baseUrl` to be set in your configuration");
      return [];
    }
    const content = extractDomainFromBaseUrl(baseUrl);
    if (!content) {
      return [];
    }
    const filePath = await write(ctx, "CNAME", "", content);
    return [filePath];
  },
  async *partialEmit() {
  }
});

export { CNAME };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map