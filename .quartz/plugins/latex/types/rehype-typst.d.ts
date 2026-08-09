declare module "@myriaddreamin/rehype-typst" {
  import type { Plugin } from "unified";

  const rehypeTypst: Plugin<[Record<string, unknown>?], unknown>;
  export default rehypeTypst;
}
