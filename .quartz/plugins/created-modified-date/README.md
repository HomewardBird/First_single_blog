# @quartz-community/created-modified-date

Extracts created and modified dates from frontmatter, git history, or filesystem metadata.

## Installation

```bash
npx quartz plugin add github:quartz-community/created-modified-date
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/created-modified-date
    enabled: true
    options:
      priority:
        - frontmatter
        - git
        - filesystem
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.CreatedModifiedDate({
  priority: ["frontmatter", "git", "filesystem"],
});
```

## Configuration

| Option     | Type                                         | Default                                | Description                                                   |
| ---------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| `priority` | `("frontmatter" \| "git" \| "filesystem")[]` | `["frontmatter", "git", "filesystem"]` | The order of sources to check for created and modified dates. |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/CreatedModifiedDate) for more information.

## License

MIT
