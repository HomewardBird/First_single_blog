# @quartz-community/crawl-links

Processes and resolves internal and external links, tracks outgoing links, and optionally adds external link icons.

## Installation

```bash
npx quartz plugin add github:quartz-community/crawl-links
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/crawl-links
    enabled: true
    options:
      markdownLinkResolution: shortest
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.CrawlLinks({
  markdownLinkResolution: "shortest",
});
```

## Configuration

| Option                   | Type                                     | Default      | Description                                                                                                                            |
| ------------------------ | ---------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `markdownLinkResolution` | `"absolute" \| "relative" \| "shortest"` | `"absolute"` | How to resolve internal links.                                                                                                         |
| `prettyLinks`            | `boolean`                                | `true`       | Whether to use pretty links.                                                                                                           |
| `openLinksInNewTab`      | `boolean`                                | `false`      | Whether to open links in a new tab.                                                                                                    |
| `lazyLoad`               | `boolean`                                | `false`      | Whether to lazy load links.                                                                                                            |
| `externalLinkIcon`       | `boolean`                                | `true`       | Whether to add an external link icon.                                                                                                  |
| `disableBrokenWikilinks` | `boolean`                                | `false`      | When `true`, internal links whose resolved slug is not in `ctx.allSlugs` gain a `broken` CSS class (alongside `internal`) for styling. |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/CrawlLinks) for more information.

## License

MIT
