# @quartz-community/backlinks

Displays a list of pages that link back to the current page.

## Installation

```bash
npx quartz plugin add github:quartz-community/backlinks
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/backlinks
    enabled: true
    layout:
      position: right
      priority: 30
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.Backlinks({
  hideWhenEmpty: true,
});
```

## Configuration

| Option          | Type      | Default | Description                                                                        |
| --------------- | --------- | ------- | ---------------------------------------------------------------------------------- |
| `hideWhenEmpty` | `boolean` | `true`  | Whether to hide the backlinks section when no pages link back to the current page. |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/features/backlinks) for more information.

## License

MIT
