# @quartz-community/unlisted-pages

Zero-config transformer that bridges `frontmatter.unlisted` to `file.data.unlisted` so any page can opt out of discovery surfaces while remaining accessible by direct URL.

## What it does

Quartz v5 plugins that respect the `file.data.unlisted` convention — `content-index`, `search`, `backlinks`, `recent-notes`, `folder-page`, and `tag-page` — will hide a page from their output when `file.data.unlisted === true`. But nothing in the core pipeline copies `frontmatter.unlisted` onto `file.data.unlisted`, so a user writing:

```yaml
---
title: My Draft
unlisted: true
---
```

gets no effect. This plugin fixes that. It is a trivially small rehype plugin that does one thing: if `frontmatter.unlisted` is a boolean, copy it to `file.data.unlisted`.

## Installation

```bash
npx quartz plugin add github:quartz-community/unlisted-pages
```

## Usage

Add an `unlisted` field to any page's frontmatter:

```yaml
---
title: My Draft
unlisted: true
---
```

When registered, this plugin marks the page as unlisted. Every Quartz v5 plugin that respects the convention will then hide it:

- **Absent from** `contentIndex.json`, `sitemap.xml`, the RSS feed, backlinks, recent notes, folder listings, tag listings, graph, explorer, and search.
- **Still emitted** as HTML, so the page remains accessible by direct URL.

## Configuration

Zero options. Just enable it.

```yaml title="quartz.config.yaml"
- source: github:quartz-community/unlisted-pages
  enabled: true
```

## Interaction with `@quartz-community/encrypted-pages`

The `encrypted-pages` plugin also sets `file.data.unlisted` when `unlistWhenEncrypted: true` or when per-page frontmatter specifies `unlisted: true`. The two plugins compose cleanly:

- If you install only `unlisted-pages`: any page with `unlisted: true` in frontmatter is hidden from listing surfaces. Encryption is independent.
- If you install only `encrypted-pages`: `unlisted: true` only works on pages that are ALSO encrypted (have a password). Non-encrypted pages with `unlisted: true` are silently ignored.
- If you install both: `unlisted: true` works for every page, encrypted or not. This is the recommended setup for sites that use encrypted pages.

## How `unlisted` works across consumer plugins

| Plugin          | Behavior when `file.data.unlisted === true`                                |
| --------------- | -------------------------------------------------------------------------- |
| `content-index` | Page absent from `contentIndex.json`, `sitemap.xml`, and the RSS feed.     |
| `search`        | Page absent from search results (derived from `contentIndex.json`).        |
| `graph`         | Page absent from graph nodes and edges (derived from `contentIndex.json`). |
| `explorer`      | Page absent from the sidebar file tree (derived from `contentIndex.json`). |
| `backlinks`     | Page never appears as a backlink source on other pages.                    |
| `recent-notes`  | Page absent from the recent notes list.                                    |
| `folder-page`   | Page absent from folder listings and folder discovery.                     |
| `tag-page`      | Page absent from tag listings and tag discovery.                           |

In every case, the page's HTML is still emitted and accessible by direct URL.

## API

- Category: Transformer
- Function name: `UnlistedPages()`
- Source: [`quartz-community/unlisted-pages`](https://github.com/quartz-community/unlisted-pages)
- Install: `npx quartz plugin add github:quartz-community/unlisted-pages`

## License

MIT
