# @quartz-community/alias-redirects

Generates HTML redirect pages for frontmatter aliases and case-preserving URLs, so old URLs redirect to the canonical page.

## Installation

```bash
npx quartz plugin add github:quartz-community/alias-redirects
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/alias-redirects
    enabled: true
```

## Configuration

| Option                | Type      | Default | Description                                                                                             |
| --------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `enableCaseRedirects` | `boolean` | `true`  | Automatically generate redirect pages for URLs that changed casing due to v5's lowercase normalization. |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/AliasRedirects) for more information.

## License

MIT
