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
          // 懒加载：只有页面真正包含 .katex 元素时才注入 KaTeX 的 CSS / 复制脚本，
          // 无公式页面不再白白请求这两份资源。
          return {
            js: [
              {
                loadTime: "afterDOMReady",
                contentType: "inline",
                script: `(function () {
  var KATEX_CSS = "/static/katex/katex.min.css"
  var KATEX_JS = "/static/katex/copy-tex.min.js"
  var loaded = false
  function ensureKatex() {
    if (loaded) return
    if (!document.querySelector(".katex")) return
    loaded = true
    if (!document.querySelector('link[href="' + KATEX_CSS + '"]')) {
      var link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = KATEX_CSS
      document.head.appendChild(link)
    }
    if (!document.querySelector('script[src="' + KATEX_JS + '"]')) {
      var script = document.createElement("script")
      script.src = KATEX_JS
      script.async = true
      document.head.appendChild(script)
    }
  }
  document.addEventListener("DOMContentLoaded", ensureKatex)
  document.addEventListener("nav", ensureKatex)
  ensureKatex()
})()`,
              },
            ],
          };
      }
    },
  };
};
