import { describe, it, expect } from "vitest";
import { Fragment } from "preact";
import Comments from "../src/components/Comments";
import type { QuartzComponent, QuartzComponentProps } from "@quartz-community/types";

type CommentsOptions = Parameters<typeof Comments>[0];

const baseOpts: CommentsOptions = {
  provider: "giscus",
  options: {
    repo: "test/repo",
    repoId: "test-id",
    category: "Announcements",
    categoryId: "test-cat-id",
  },
};

function buildProps(
  overrides: Partial<QuartzComponentProps> & {
    frontmatter?: Record<string, unknown>;
    cfg?: Record<string, unknown>;
  } = {},
): QuartzComponentProps {
  const { frontmatter, cfg, ...rest } = overrides;
  return {
    ctx: {},
    externalResources: { css: [], js: [], additionalHead: [] },
    fileData: { frontmatter: frontmatter ?? {} } as QuartzComponentProps["fileData"],
    cfg: (cfg ?? {}) as QuartzComponentProps["cfg"],
    children: [],
    tree: null,
    allFiles: [],
    ...rest,
  };
}

function renderComments(
  opts: CommentsOptions,
  props: QuartzComponentProps,
): ReturnType<QuartzComponent> {
  const Component = Comments(opts);
  return Component(props);
}

function isFragmentOrEmpty(vnode: unknown): boolean {
  if (vnode == null || vnode === false) return true;
  if (typeof vnode !== "object") return false;
  const v = vnode as { type?: unknown };
  return v.type === Fragment;
}

function getDivProps(vnode: unknown): Record<string, unknown> | null {
  if (typeof vnode !== "object" || vnode == null) return null;
  const v = vnode as { type?: unknown; props?: Record<string, unknown> };
  if (v.type !== "div") return null;
  return v.props ?? null;
}

describe("Comments Plugin", () => {
  it("should export Comments component", () => {
    expect(Comments).toBeDefined();
  });

  it("should create a component with options", () => {
    const component = Comments(baseOpts);
    expect(component).toBeDefined();
    expect(typeof component).toBe("function");
  });
});

describe("Comments: frontmatter.comments override", () => {
  it("renders the giscus div when frontmatter.comments is undefined", () => {
    const result = renderComments(baseOpts, buildProps({ frontmatter: {} }));
    const props = getDivProps(result);
    expect(props).not.toBeNull();
    expect(props?.["data-repo"]).toBe("test/repo");
  });

  it("renders the giscus div when frontmatter.comments is true", () => {
    const result = renderComments(baseOpts, buildProps({ frontmatter: { comments: true } }));
    expect(getDivProps(result)).not.toBeNull();
  });

  it("renders the giscus div when frontmatter.comments is the string 'true'", () => {
    const result = renderComments(baseOpts, buildProps({ frontmatter: { comments: "true" } }));
    expect(getDivProps(result)).not.toBeNull();
  });

  it("suppresses comments when frontmatter.comments is false", () => {
    const result = renderComments(baseOpts, buildProps({ frontmatter: { comments: false } }));
    expect(isFragmentOrEmpty(result)).toBe(true);
    expect(getDivProps(result)).toBeNull();
  });

  it("suppresses comments when frontmatter.comments is the string 'false'", () => {
    const result = renderComments(baseOpts, buildProps({ frontmatter: { comments: "false" } }));
    expect(isFragmentOrEmpty(result)).toBe(true);
    expect(getDivProps(result)).toBeNull();
  });

  it("renders the giscus div when frontmatter.comments is the number 0", () => {
    // 0 is falsy but not a documented disable value; it must not suppress comments.
    const result = renderComments(baseOpts, buildProps({ frontmatter: { comments: 0 } }));
    expect(getDivProps(result)).not.toBeNull();
  });

  it("renders the giscus div when frontmatter.comments is the empty string", () => {
    // Empty string is falsy but not a documented disable value; it must not suppress comments.
    const result = renderComments(baseOpts, buildProps({ frontmatter: { comments: "" } }));
    expect(getDivProps(result)).not.toBeNull();
  });

  it("renders the giscus div when frontmatter.comments is null", () => {
    // null is falsy but not a documented disable value; it must not suppress comments.
    const result = renderComments(baseOpts, buildProps({ frontmatter: { comments: null } }));
    expect(getDivProps(result)).not.toBeNull();
  });
});

describe("Comments: data attribute wiring", () => {
  it("propagates required giscus options", () => {
    const result = renderComments(baseOpts, buildProps());
    const props = getDivProps(result);
    expect(props).not.toBeNull();
    expect(props?.["data-repo"]).toBe("test/repo");
    expect(props?.["data-repo-id"]).toBe("test-id");
    expect(props?.["data-category"]).toBe("Announcements");
    expect(props?.["data-category-id"]).toBe("test-cat-id");
  });

  it("applies default values when optional options are omitted", () => {
    const result = renderComments(baseOpts, buildProps());
    const props = getDivProps(result);
    expect(props?.["data-mapping"]).toBe("url");
    expect(props?.["data-strict"]).toBe("1");
    expect(props?.["data-reactions-enabled"]).toBe("1");
    expect(props?.["data-input-position"]).toBe("bottom");
    expect(props?.["data-light-theme"]).toBe("light");
    expect(props?.["data-dark-theme"]).toBe("dark");
    expect(props?.["data-lang"]).toBe("en");
  });

  it("respects user-provided optional values", () => {
    const opts: CommentsOptions = {
      provider: "giscus",
      options: {
        ...baseOpts.options,
        mapping: "pathname",
        strict: false,
        reactionsEnabled: false,
        inputPosition: "top",
        lightTheme: "catppuccin_latte",
        darkTheme: "catppuccin_mocha",
        lang: "nl",
      },
    };
    const result = renderComments(opts, buildProps());
    const props = getDivProps(result);
    expect(props?.["data-mapping"]).toBe("pathname");
    expect(props?.["data-strict"]).toBe("0");
    expect(props?.["data-reactions-enabled"]).toBe("0");
    expect(props?.["data-input-position"]).toBe("top");
    expect(props?.["data-light-theme"]).toBe("catppuccin_latte");
    expect(props?.["data-dark-theme"]).toBe("catppuccin_mocha");
    expect(props?.["data-lang"]).toBe("nl");
  });

  it("uses cfg.baseUrl to build the default themeUrl", () => {
    const result = renderComments(baseOpts, buildProps({ cfg: { baseUrl: "example.test" } }));
    const props = getDivProps(result);
    expect(props?.["data-theme-url"]).toBe("https://example.test/static/giscus");
  });

  it("falls back when cfg.baseUrl is missing", () => {
    const result = renderComments(baseOpts, buildProps({ cfg: {} }));
    const props = getDivProps(result);
    expect(props?.["data-theme-url"]).toBe("https://example.com/static/giscus");
  });

  it("honours an explicit themeUrl override", () => {
    const opts: CommentsOptions = {
      provider: "giscus",
      options: { ...baseOpts.options, themeUrl: "https://cdn.test/theme" },
    };
    const result = renderComments(opts, buildProps({ cfg: { baseUrl: "example.test" } }));
    const props = getDivProps(result);
    expect(props?.["data-theme-url"]).toBe("https://cdn.test/theme");
  });
});
