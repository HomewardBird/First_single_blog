import type { QuartzFilterPlugin } from "@quartz-community/types";

export const RemoveDrafts: QuartzFilterPlugin<object> = () => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, [_tree, vfile]) {
    const frontmatter = vfile.data?.frontmatter as Record<string, unknown> | undefined;
    const draftFlag: boolean = frontmatter?.draft === true || frontmatter?.draft === "true";
    return !draftFlag;
  },
});
