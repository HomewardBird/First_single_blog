# @quartz-community/description

Generates page descriptions from content for use in meta tags and RSS feeds.

## Installation

```bash
npx quartz plugin add github:quartz-community/description
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/description
    enabled: true
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.Description({
  descriptionLength: 150,
});
```

## Configuration

| Option                 | Type      | Default | Description                                           |
| ---------------------- | --------- | ------- | ----------------------------------------------------- |
| `descriptionLength`    | `number`  | `150`   | The length of the description to generate.            |
| `maxDescriptionLength` | `number`  | `300`   | The maximum length of the description.                |
| `replaceExternalLinks` | `boolean` | `true`  | Whether to replace external links in the description. |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/Description) for more information.

## License

MIT
