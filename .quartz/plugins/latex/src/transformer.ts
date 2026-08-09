import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMathjax from "rehype-mathjax/svg";
import rehypeTypst from "@myriaddreamin/rehype-typst";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { KatexOptions } from "katex";

interface MathjaxTexOptions {
  macros?: Record<string, string | unknown[]>;
  [key: string]: unknown;
}

interface MathjaxOptions {
  tex?: MathjaxTexOptions;
  [key: string]: unknown;
}

interface TypstOptions {
  [key: string]: unknown;
}

export type Args = boolean | number | string | null;

interface MacroType {
  [key: string]: string | Args[];
}

export interface LatexOptions {
  renderEngine: "katex" | "mathjax" | "typst";
  customMacros: MacroType;
  katexOptions: Omit<KatexOptions, "macros" | "output">;
  mathJaxOptions: Omit<MathjaxOptions, "macros">;
  typstOptions: TypstOptions;
}

export const Latex: QuartzTransformerPlugin<Partial<LatexOptions>> = (opts) => {
  const engine = opts?.renderEngine ?? "katex";
  const macros = opts?.customMacros ?? {};
  return {
    name: "Latex",
    markdownPlugins() {
      return [remarkMath];
    },
    htmlPlugins() {
      switch (engine) {
        case "katex": {
          return [[rehypeKatex, { output: "html", macros, ...(opts?.katexOptions ?? {}) }]];
        }
        case "typst": {
          return [[rehypeTypst, opts?.typstOptions ?? {}]];
        }
        default:
        case "mathjax": {
          return [
            [
              rehypeMathjax,
              {
                ...(opts?.mathJaxOptions ?? {}),
                tex: {
                  ...(opts?.mathJaxOptions?.tex ?? {}),
                  macros,
                },
              },
            ],
          ];
        }
      }
    },
    externalResources() {
      switch (engine) {
        case "katex":
          return {
            css: [{ content: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" }],
            js: [
              {
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.js",
                loadTime: "afterDOMReady",
                contentType: "external",
              },
            ],
          };
      }
    },
  };
};
