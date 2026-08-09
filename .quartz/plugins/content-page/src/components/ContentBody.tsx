import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import { htmlToJsx } from "@quartz-community/utils/jsx";
import type { Node } from "hast";

export interface ContentBodyOptions {}

type FrontmatterWithClasses = {
  cssclasses?: string[];
};

export default (() => {
  const ContentBody: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
    const content = htmlToJsx(tree as Node);

    const frontmatter = fileData?.frontmatter as FrontmatterWithClasses | undefined;
    const classes = frontmatter?.cssclasses ?? [];
    const classString = ["popover-hint", ...classes].join(" ");

    return (
      <article class={classString}>
        <div class="markdown-preview-view markdown-rendered">{content}</div>
      </article>
    );
  };

  return ContentBody;
}) satisfies QuartzComponentConstructor;
