# @quartz-community/search

The Search component for Quartz - full-text search with FlexSearch integration.

## Features

- 🔍 **Full-Text Search** - Search across all your content instantly
- ⚡ **Fast Indexing** - Uses FlexSearch for high-performance search
- 📱 **Mobile Responsive** - Works great on all devices
- 🎯 **Search Preview** - Optional content preview panel
- 🌐 **Multi-Language** - Supports 30+ locales
- ⌨️ **Keyboard Shortcuts** - `Ctrl/Cmd + K` to open, `Escape` to close
- 🏷️ **Tag Search** - Search by tags with special syntax

## Installation

```bash
npx quartz plugin add github:quartz-community/search
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/search
    enabled: true
    layout:
      position: left
      priority: 20
      group: toolbar
      groupOptions:
        grow: true
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.Search({
  enablePreview: true,
  placeholder: "Search for something",
  title: "Search",
});
```

## Configuration Options

```typescript
interface SearchOptions {
  /** Enable content preview panel */
  enablePreview?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Custom title for the search button */
  title?: string;
}
```

## Default Behavior

By default, the search component:

- Displays as a button with a search icon
- Opens a fullscreen search modal when clicked
- Shows up to 8 search results
- Enables content preview on desktop (can be disabled)
- Supports keyboard navigation (arrow keys, Enter, Escape)
- Uses FlexSearch from CDN for indexing

## How It Works

The Search component:

1. Loads FlexSearch library from CDN when initialized
2. Fetches content data via the `fetchData` global (resolves `contentIndex.json` with the correct base path)
3. Builds a search index from your content
4. Performs real-time search as you type
5. Shows results with optional content preview

> [!info]
> Search requires the `ContentIndex` emitter plugin to be present in your Quartz configuration.

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Open/Close search
- `Escape` - Close search
- `Arrow Up/Down` - Navigate results
- `Enter` - Open selected result

## Development

This is a first-party Quartz community plugin. It serves as both:

1. A production-ready Search component
2. A reference implementation for building Quartz community plugins

To build locally:

```bash
npm install
npm run build
```

The `prepare` script automatically builds during installation.

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/features/full-text%20search) for more information.

## License

MIT
