# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `EncryptedContentIndex` emitter that writes a versioned shadow content index (`static/encryptedContentIndex.json`) containing opaque encrypted blobs of per-page metadata (slug, title, links, tags) for pages marked `unlisted: true`. The shadow index uses a flat array format so no slugs or titles leak to anonymous visitors.
- `unlistWhenEncrypted` option on the `EncryptedPages` transformer. When `true`, encrypted pages are marked `file.data.unlisted = true`, hiding them from every build-time listing surface that respects the `unlisted` convention (contentIndex, RSS, sitemap, backlinks, recent-notes, folder-page, tag-page, graph, explorer, search) while still emitting the HTML so the page remains accessible by direct URL.
- Per-page `unlisted: true | false` frontmatter override. Explicit `unlisted: false` forces the page listed even when `unlistWhenEncrypted` is set.
- Per-page `stealth: true` frontmatter field. Stealth pages are encrypted pages that are hidden from every listing surface **permanently**, even after a successful client-side decryption — their metadata is never written to the shadow content index, so there is nothing for the client to recover. Useful for "secret door" pages that should only be accessible to users who already know the exact URL. `stealth: true` implies `unlisted: true` and overrides any explicit `unlisted: false`. No effect on non-encrypted pages.
- Client-side shadow-index unlocking: on every page load with cached passwords, the client script fetches the shadow index, decrypts entries with cached passwords, patches the resolved `fetchData` object in place, and dispatches `content-index-updated` so graph, explorer, and search re-initialize with the unlocked pages.
- `encryptAesGcm`, `decrypt`, and `SHADOW_INDEX_VERSION` exports for test and extension use.
- `ShadowIndexBlob`, `ShadowIndexFile`, and `ShadowContentIndexEntry` type exports.
- `EncryptedContentIndexOptions.passwordField` (default `"password"`) so the emitter reads the frontmatter password field from its own merged options rather than spelunking `ctx.cfg.plugins.transformers` at emit time.
- `outputPath` field in the package manifest's `defaultOptions` and `optionSchema` so users can override the shadow-index output path from `quartz.config.yaml`.

### Fixed

- **Shadow content index emitter now actually runs.** Changed `package.json` > `quartz.category` from `"transformer"` to `["transformer", "emitter"]` so Quartz v5's plugin loader instantiates both the transformer and the emitter from the single config entry. Previously, Quartz read `"transformer"` and only ever called `findFactory(module, "transformer")`, so `EncryptedContentIndex` was exported from the module but never invoked — `static/encryptedContentIndex.json` was never written. A user's single `- source: github:quartz-community/encrypted-pages` entry in `quartz.config.yaml` now correctly produces both the transformer and the emitter instances, and both factories receive the same merged options object.

### Removed

- **Breaking:** `EncryptedPageFilter`. It used Quartz's `shouldPublish` filter mechanism, which removes pages from the entire build (no HTML emitted), directly contradicting the plugin's own README. Use `unlistWhenEncrypted: true` or per-page `unlisted: true` frontmatter instead.
- **Breaking:** `visibility` option on the `EncryptedPages` transformer. It set a `file.data.encryptedVisibility` flag that nothing in the Quartz v5 ecosystem read — the option had no effect.
- **Breaking:** `EncryptedPagesOptions.visibility` type field.
- **Breaking:** `EncryptedPageFilterOptions` type export.
- The build-time warning for a missing `EncryptedContentIndex` emitter. Quartz v5's plugin loader now instantiates both the transformer and the emitter automatically from the same config entry (via the `category: ["transformer", "emitter"]` manifest), so the warning is obsolete.

### Changed

- Plugin ordering requirement: `EncryptedPages` must run after `CrawlLinks` (or any other transformer that populates `file.data.links`) in the `htmlPlugins` chain. Use the `order` field in `quartz.config.yaml` to control this. Documented in README.
- The README no longer instructs users to register the emitter separately — Quartz v5 handles that automatically from a single config entry.
