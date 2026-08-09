import { describe, expect, it } from "vitest";
import type { JSX } from "preact";
import type { FullSlug, GlobalConfiguration } from "@quartz-community/types";
import {
  defaultImage,
  type ImageOptions,
  type SocialImageFileData,
  type SocialImageOptions,
  type UserOpts,
} from "../src/emitter";
import type { Theme } from "../src/theme";

function makeTheme(): Theme {
  const palette = {
    light: "#fff",
    lightgray: "#eee",
    gray: "#888",
    darkgray: "#444",
    dark: "#111",
    secondary: "#284b63",
    tertiary: "#84a59d",
    highlight: "rgba(143,159,169,0.15)",
    textHighlight: "#fff23688",
  };
  return {
    cdnCaching: true,
    fontOrigin: "googleFonts",
    typography: {
      header: "Schibsted Grotesk",
      body: "Source Sans Pro",
      code: "IBM Plex Mono",
    },
    colors: {
      lightMode: palette,
      darkMode: palette,
    },
  };
}

function makeCfg(): GlobalConfiguration {
  return {
    locale: "en-US",
    baseUrl: "example.test",
    theme: makeTheme() as unknown as GlobalConfiguration["theme"],
  };
}

function makeUserOpts(): UserOpts {
  return {
    colorScheme: "lightMode",
    width: 1200,
    height: 630,
    excludeRoot: false,
  };
}

function makeImageOptions(overrides: Partial<ImageOptions> = {}): ImageOptions {
  return {
    title: "My Page",
    description: "My Description",
    fonts: [],
    cfg: makeCfg(),
    fileData: {
      slug: "notes/example" as FullSlug,
      frontmatter: { title: "My Page", tags: ["tag-a"] },
      description: "My Description",
      text: "Some rendered body text",
      filePath: "content/notes/example.md",
      dates: { created: new Date("2024-01-01"), modified: new Date("2024-02-01") },
    },
    ...overrides,
  };
}

describe("SocialImageFileData contract", () => {
  it("allows the documented fields via object-literal assignment", () => {
    const sample: SocialImageFileData = {
      slug: "notes/a" as FullSlug,
      frontmatter: {
        title: "t",
        description: "d",
        socialDescription: "sd",
        socialImage: "/cover.png",
        tags: ["x", "y"],
      },
      description: "d",
      text: "body",
      filePath: "content/notes/a.md",
      dates: {
        created: new Date("2024-01-01"),
        modified: new Date("2024-02-01"),
        published: new Date("2024-03-01"),
      },
    };
    expect(sample.slug).toBe("notes/a");
    expect(sample.frontmatter?.tags).toEqual(["x", "y"]);
    expect(sample.text).toBe("body");
  });

  it("allows every documented field to be omitted", () => {
    const empty: SocialImageFileData = {};
    expect(empty).toEqual({});
  });

  it("accepts arbitrary extra keys on frontmatter via Record<string, unknown>", () => {
    const sample: SocialImageFileData = {
      frontmatter: {
        title: "t",
        draft: true,
        custom: { nested: 1 },
      },
    };
    expect((sample.frontmatter as { draft?: unknown }).draft).toBe(true);
  });
});

describe("user-provided imageStructure contract", () => {
  it("receives a SocialImageFileData fileData", () => {
    let captured: SocialImageFileData | undefined;
    const userImageStructure: SocialImageOptions["imageStructure"] = ({ fileData }) => {
      captured = fileData;
      return null as unknown as JSX.Element;
    };

    userImageStructure({
      ...makeImageOptions(),
      userOpts: makeUserOpts(),
      iconBase64: undefined,
    });

    expect(captured?.slug).toBe("notes/example");
    expect(captured?.frontmatter?.tags).toEqual(["tag-a"]);
    expect(captured?.text).toBe("Some rendered body text");
  });
});

describe("defaultImage", () => {
  it("returns a preact VNode when given a populated SocialImageFileData", () => {
    const result = defaultImage({
      ...makeImageOptions(),
      userOpts: makeUserOpts(),
      iconBase64: undefined,
    });

    const vnode = result as unknown as { type?: unknown; props?: unknown };
    expect(vnode).toBeDefined();
    expect(vnode.type).toBeDefined();
    expect(vnode.props).toBeDefined();
  });

  it("tolerates minimal SocialImageFileData (no text, no dates, empty frontmatter)", () => {
    const result = defaultImage({
      ...makeImageOptions({
        fileData: {
          slug: "notes/minimal" as FullSlug,
          frontmatter: {},
        },
      }),
      userOpts: makeUserOpts(),
      iconBase64: undefined,
    });
    expect(result).toBeDefined();
  });

  it("uses the readingTimeText override when provided", () => {
    const userOpts: UserOpts = {
      ...makeUserOpts(),
      readingTimeText: (minutes) => `${minutes} minutes read override`,
    };
    const result = defaultImage({
      ...makeImageOptions(),
      userOpts,
      iconBase64: undefined,
    });
    expect(result).toBeDefined();
  });
});
