# @quartz-community/syntax-highlighting

Adds syntax highlighting to code blocks using rehype-pretty-code, with an optional clipboard copy button.

## Installation

```bash
npx quartz plugin add github:quartz-community/syntax-highlighting
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/syntax-highlighting
    enabled: true
    options:
      theme:
        light: github-light
        dark: github-dark
      keepBackground: false
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.SyntaxHighlighting({
  theme: { light: "github-light", dark: "github-dark" },
  keepBackground: false,
});
```

## Configuration

| Option                | Type                                    | Default                                          | Description                                                                                                                            |
| --------------------- | --------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`               | `{ light: CodeTheme, dark: CodeTheme }` | `{ light: "github-light", dark: "github-dark" }` | The theme to use for syntax highlighting.                                                                                              |
| `keepBackground`      | `boolean`                               | `false`                                          | Whether to keep the background color of the code block.                                                                                |
| `clipboard`           | `boolean`                               | `true`                                           | Whether to add a clipboard copy button to code blocks.                                                                                 |
| `tokenClassification` | `boolean`                               | `true`                                           | Adds `data-token-type` attributes (keyword, string, comment, etc.) to token spans. Enables theme-aware code styling via CSS selectors. |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/SyntaxHighlighting) for more information.

## License

MIT
