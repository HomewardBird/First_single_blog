# @quartz-community/github-flavored-markdown

Adds GitHub Flavored Markdown support including tables, strikethrough, task lists, and autolinked headings.

## Installation

```bash
npx quartz plugin add github:quartz-community/github-flavored-markdown
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/github-flavored-markdown
    enabled: true
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.GitHubFlavoredMarkdown({
  enableSmartyPants: true,
  linkHeadings: true,
});
```

## Configuration

| Option              | Type      | Default | Description                    |
| ------------------- | --------- | ------- | ------------------------------ |
| `enableSmartyPants` | `boolean` | `true`  | Whether to enable SmartyPants. |
| `linkHeadings`      | `boolean` | `true`  | Whether to link headings.      |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/GitHubFlavoredMarkdown) for more information.

## License

MIT
