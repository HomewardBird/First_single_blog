# @quartz-community/folder-page

Renders folder index pages showing a listing of all pages within that folder. Automatically generates virtual index pages for folders that don't have one.

## Installation

```bash
npx quartz plugin add github:quartz-community/folder-page
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/folder-page
    enabled: true
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.FolderPage({
  showFolderCount: true,
  showSubfolders: true,
  prefixFolders: false,
});
```

## Configuration

| Option            | Type      | Default     | Description                                                                            |
| ----------------- | --------- | ----------- | -------------------------------------------------------------------------------------- |
| `showFolderCount` | `boolean` | `undefined` | Whether to show the number of items in the folder.                                     |
| `showSubfolders`  | `boolean` | `undefined` | Whether to show subfolders in the listing.                                             |
| `sort`            | `SortFn`  | `undefined` | A function to sort the pages in the folder.                                            |
| `prefixFolders`   | `boolean` | `false`     | Whether to prefix generated folder page titles with "Folder: " (e.g. "Folder: notes"). |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/FolderPage) for more information.

## License

MIT
