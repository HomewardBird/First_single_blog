# @quartz-community/breadcrumbs

Displays breadcrumb navigation showing the page's position in the folder hierarchy.

## Installation

```bash
npx quartz plugin add github:quartz-community/breadcrumbs
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/breadcrumbs
    enabled: true
    layout:
      position: beforeBody
      priority: 5
      condition: not-index
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.Breadcrumbs({
  spacerSymbol: "❯",
  rootName: "Home",
  resolveFrontmatterTitle: true,
  showCurrentPage: true,
});
```

## Configuration

| Option                    | Type      | Default  | Description                                                     |
| ------------------------- | --------- | -------- | --------------------------------------------------------------- |
| `spacerSymbol`            | `string`  | `"❯"`    | The symbol used to separate breadcrumb items.                   |
| `rootName`                | `string`  | `"Home"` | The name of the root item in the breadcrumbs.                   |
| `resolveFrontmatterTitle` | `boolean` | `true`   | Whether to use the title from frontmatter for breadcrumb items. |
| `showCurrentPage`         | `boolean` | `true`   | Whether to show the current page in the breadcrumbs.            |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/features/breadcrumbs) for more information.

## License

MIT
