# @quartz-community/note-properties

Parses frontmatter properties and renders them as a visible properties view on the page, similar to Obsidian's properties panel.

## Installation

```bash
npx quartz plugin add github:quartz-community/note-properties
```

## Usage

This plugin serves as both a **transformer** (parsing frontmatter) and a **component** (displaying the properties view).

```yaml title="quartz.config.yaml"
plugins:
  # Transformer (parses frontmatter)
  - source: github:quartz-community/note-properties
    enabled: true
    options:
      includeAll: false
      includedProperties:
        - description
        - tags
        - aliases
      excludedProperties: []
      hidePropertiesView: false
      delimiters: "---"
      language: yaml

  # Component (displays properties in the page layout)
  - source: github:quartz-community/note-properties
    enabled: true
    layout:
      position: beforeBody
      priority: 15
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.NoteProperties({
  includeAll: false,
  includedProperties: ["description", "tags", "aliases"],
  excludedProperties: [],
  hidePropertiesView: false,
  delimiters: "---",
  language: "yaml",
});
```

## Configuration

| Option               | Type       | Default                              | Description                                               |
| -------------------- | ---------- | ------------------------------------ | --------------------------------------------------------- |
| `includeAll`         | `boolean`  | `false`                              | Whether to include all frontmatter properties.            |
| `includedProperties` | `string[]` | `["description", "tags", "aliases"]` | Properties to include when `includeAll` is `false`.       |
| `excludedProperties` | `string[]` | `[]`                                 | Properties to exclude when `includeAll` is `true`.        |
| `hidePropertiesView` | `boolean`  | `false`                              | Whether to hide the rendered properties view on the page. |
| `delimiters`         | `string`   | `"---"`                              | The frontmatter delimiter style.                          |
| `language`           | `string`   | `"yaml"`                             | The frontmatter language (`"yaml"` or `"toml"`).          |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/Frontmatter) for more information.

## License

MIT
