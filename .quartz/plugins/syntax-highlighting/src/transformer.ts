import rehypePrettyCode from "rehype-pretty-code";
import type { Options as CodeOptions, Theme as CodeTheme } from "rehype-pretty-code";
import type { QuartzTransformerPlugin, JSResource, CSSResource } from "@quartz-community/types";
import { tokenClassifierTransformer } from "./token-classifier";
// @ts-expect-error - inline script import handled by Quartz bundler
import clipboardScript from "./scripts/clipboard.inline";
import clipboardStyle from "./styles/clipboard.scss";

interface Theme extends Record<string, CodeTheme> {
  light: CodeTheme;
  dark: CodeTheme;
}

export interface SyntaxHighlightingOptions {
  theme?: Theme;
  keepBackground?: boolean;
  clipboard?: boolean;
  tokenClassification?: boolean;
}

const defaultOptions: SyntaxHighlightingOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  clipboard: true,
  tokenClassification: true,
};

export const SyntaxHighlighting: QuartzTransformerPlugin<Partial<SyntaxHighlightingOptions>> = (
  userOpts,
) => {
  const opts = { ...defaultOptions, ...userOpts };
  const { clipboard, tokenClassification, ...codeOpts } = opts;

  const rehypeOpts: CodeOptions = { ...(codeOpts as CodeOptions) };

  if (tokenClassification) {
    rehypeOpts.transformers = [...(rehypeOpts.transformers ?? []), tokenClassifierTransformer()];
  }

  return {
    name: "SyntaxHighlighting",
    htmlPlugins() {
      return [[rehypePrettyCode, rehypeOpts]];
    },
    externalResources() {
      const js: JSResource[] = [];
      const css: CSSResource[] = [];

      if (clipboard) {
        js.push({
          script: clipboardScript,
          loadTime: "afterDOMReady",
          contentType: "inline",
        });

        css.push({
          content: clipboardStyle,
          inline: true,
        });
      }

      return { js, css };
    },
  };
};
