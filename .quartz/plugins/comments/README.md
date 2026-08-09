# @quartz-community/comments

Adds a comment section to pages using Giscus (GitHub Discussions-based).

## Installation

```bash
npx quartz plugin add github:quartz-community/comments
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/comments
    enabled: true
    options:
      provider: giscus
      options: {}
    layout:
      position: afterBody
      priority: 10
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.Comments({
  provider: "giscus",
  options: {
    repo: "your-repo",
    repoId: "your-repo-id",
    category: "your-category",
    categoryId: "your-category-id",
  },
});
```

## Configuration

| Option                     | Type                | Default     | Description                                     |
| -------------------------- | ------------------- | ----------- | ----------------------------------------------- |
| `provider`                 | `"giscus"`          | -           | The comment provider to use.                    |
| `options.repo`             | `string`            | -           | The GitHub repository to use for comments.      |
| `options.repoId`           | `string`            | -           | The ID of the GitHub repository.                |
| `options.category`         | `string`            | -           | The GitHub Discussions category to use.         |
| `options.categoryId`       | `string`            | -           | The ID of the GitHub Discussions category.      |
| `options.themeUrl`         | `string`            | `undefined` | Custom theme URL for Giscus.                    |
| `options.lightTheme`       | `string`            | `"light"`   | The light theme for Giscus.                     |
| `options.darkTheme`        | `string`            | `"dark"`    | The dark theme for Giscus.                      |
| `options.mapping`          | `string`            | `"url"`     | The mapping between pages and discussions.      |
| `options.strict`           | `boolean`           | `true`      | Whether to use strict matching for discussions. |
| `options.reactionsEnabled` | `boolean`           | `true`      | Whether to enable reactions for comments.       |
| `options.inputPosition`    | `"top" \| "bottom"` | `"bottom"`  | The position of the comment input box.          |
| `options.lang`             | `string`            | `"en"`      | The language for Giscus.                        |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/features/comments) for more information.

## License

MIT
