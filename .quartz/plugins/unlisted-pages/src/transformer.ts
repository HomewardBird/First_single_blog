import type { PluggableList, Plugin } from "unified";
import type { Root as HastRoot } from "hast";
import type { VFile } from "vfile";
import type { QuartzTransformerPlugin } from "@quartz-community/types";

const rehypeUnlisted = (): Plugin<[], HastRoot> => {
  return () => (_tree: HastRoot, file: VFile) => {
    const frontmatter = file.data?.frontmatter as Record<string, unknown> | undefined;
    const unlisted = frontmatter?.unlisted;
    if (typeof unlisted === "boolean") {
      (file.data as Record<string, unknown>).unlisted = unlisted;
    }
  };
};

export const UnlistedPages: QuartzTransformerPlugin<undefined> = () => {
  return {
    name: "UnlistedPages",
    htmlPlugins(): PluggableList {
      return [rehypeUnlisted()];
    },
  };
};
