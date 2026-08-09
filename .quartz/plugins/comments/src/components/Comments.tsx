import type { QuartzComponent, QuartzComponentProps } from "@quartz-community/types";
import { classNames } from "../util/lang";
// @ts-expect-error - inline script imported as string by esbuild loader
import script from "./scripts/comments.inline";

type RequiredOptsConstructor<Options> = (opts: Options) => QuartzComponent;

export type CommentsOptions = {
  provider: "giscus";
  options: {
    repo: `${string}/${string}`;
    repoId: string;
    category: string;
    categoryId: string;
    themeUrl?: string;
    lightTheme?: string;
    darkTheme?: string;
    mapping?: "url" | "title" | "og:title" | "specific" | "number" | "pathname";
    strict?: boolean;
    reactionsEnabled?: boolean;
    inputPosition?: "top" | "bottom";
    lang?: string;
  };
};

function boolToStringBool(b: boolean): string {
  return b ? "1" : "0";
}

export default ((opts: CommentsOptions) => {
  const Comments: QuartzComponent = ({ displayClass, fileData, cfg }: QuartzComponentProps) => {
    const commentsOverride = fileData.frontmatter?.comments;
    if (commentsOverride === false || commentsOverride === "false") {
      return <></>;
    }

    return (
      <div
        class={classNames(displayClass, "giscus")}
        data-repo={opts.options.repo}
        data-repo-id={opts.options.repoId}
        data-category={opts.options.category}
        data-category-id={opts.options.categoryId}
        data-mapping={opts.options.mapping ?? "url"}
        data-strict={boolToStringBool(opts.options.strict ?? true)}
        data-reactions-enabled={boolToStringBool(opts.options.reactionsEnabled ?? true)}
        data-input-position={opts.options.inputPosition ?? "bottom"}
        data-light-theme={opts.options.lightTheme ?? "light"}
        data-dark-theme={opts.options.darkTheme ?? "dark"}
        data-theme-url={
          opts.options.themeUrl ?? `https://${cfg.baseUrl ?? "example.com"}/static/giscus`
        }
        data-lang={opts.options.lang ?? "en"}
      ></div>
    );
  };

  Comments.afterDOMLoaded = script;

  return Comments;
}) satisfies RequiredOptsConstructor<CommentsOptions>;
