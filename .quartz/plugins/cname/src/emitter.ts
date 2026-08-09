import path from "node:path";
import fs from "node:fs/promises";
import type { QuartzEmitterPlugin, BuildCtx, FilePath, FullSlug } from "@quartz-community/types";
import { joinSegments } from "@quartz-community/types";

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

function extractDomainFromBaseUrl(baseUrl: string) {
  const url = new URL(`https://${baseUrl}`);
  return url.hostname;
}

export const CNAME: QuartzEmitterPlugin = () => ({
  name: "CNAME",
  async emit(ctx) {
    const baseUrl = (ctx.cfg.configuration as Record<string, unknown>).baseUrl as
      | string
      | undefined;
    if (!baseUrl) {
      console.warn("CNAME emitter requires `baseUrl` to be set in your configuration");
      return [];
    }
    const content = extractDomainFromBaseUrl(baseUrl);
    if (!content) {
      return [];
    }

    const filePath = await write(ctx, "CNAME" as FullSlug, "", content);
    return [filePath];
  },
  async *partialEmit() {},
});
