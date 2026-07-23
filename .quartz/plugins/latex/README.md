# @quartz-community/latex

Renders LaTeX math equations using KaTeX, MathJax, or Typst rendering engines.

## Installation

```bash
npx quartz plugin add github:quartz-community/latex
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/latex
    enabled: true
    options:
      renderEngine: katex
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.Latex({
  renderEngine: "katex",
});
```

## Configuration

| Option           | Type                               | Default     | Description                            |
| ---------------- | ---------------------------------- | ----------- | -------------------------------------- |
| `renderEngine`   | `"katex" \| "mathjax" \| "typst"`  | `"katex"`   | The rendering engine to use for LaTeX. |
| `customMacros`   | `Record<string, string \| Args[]>` | `{}`        | Custom LaTeX macros.                   |
| `katexOptions`   | `KatexOptions`                     | `undefined` | Options for the KaTeX engine.          |
| `mathJaxOptions` | `MathjaxOptions`                   | `undefined` | Options for the MathJax engine.        |
| `typstOptions`   | `TypstOptions`                     | `undefined` | Options for the Typst engine.          |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/Latex) for more information.

## License

MIT
