import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import type { QuartzEmitterPlugin, BuildCtx, FilePath, FullSlug } from "@quartz-community/types";
import { joinSegments } from "@quartz-community/types";
import type { Readable } from "node:stream";

const QUARTZ = "quartz";

const write = async (
  ctx: BuildCtx,
  slug: FullSlug,
  ext: string,
  content: string | Buffer | Readable,
): Promise<FilePath> => {
  const pathToPage = joinSegments(ctx.argv.output, slug + ext) as FilePath;
  const dir = path.dirname(pathToPage);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pathToPage, content);
  return pathToPage;
};

export const Favicon: QuartzEmitterPlugin = () => ({
  name: "Favicon",
  async *emit({ argv }) {
    const iconPath = joinSegments(QUARTZ, "static", "icon.png");
    const faviconContent = sharp(iconPath).resize(48, 48).toFormat("png");

    yield write(
      { argv } as BuildCtx,
      "favicon" as FullSlug,
      ".ico",
      faviconContent as unknown as Readable,
    );
  },
  async *partialEmit() {},
});
