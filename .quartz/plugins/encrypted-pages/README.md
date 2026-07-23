# @quartz-community/encrypted-pages

Password-protected encrypted pages for Quartz v5.

## How it works

Build-time encryption with AES-256-GCM, client-side decryption via the Web Crypto API, PBKDF2-SHA256 key derivation.

Two plugins work together:

- **`EncryptedPages`** (transformer) — encrypts the rendered HTML of any page whose frontmatter contains a password.
- **`EncryptedContentIndex`** (emitter) — emits a sibling shadow content index that client-side decryption uses to dynamically reveal unlisted encrypted pages in graph, explorer, and search after a successful unlock.

## Installation

```bash
npx quartz plugin add github:quartz-community/encrypted-pages
```

## Usage

Add a `password` field to the frontmatter of any page you want to encrypt. Optionally add `unlisted: true` to hide the page from every build-time listing surface; the page will be revealed dynamically to graph/explorer/search on successful client-side decryption.

```yaml
---
title: My Secret Page
password: mysecretpassword
unlisted: true
---
```

## Configuration

This plugin ships both a transformer (`EncryptedPages`) and an emitter (`EncryptedContentIndex`) in a single package. Quartz v5 instantiates both automatically from one config entry — you do not need to register them separately.

### quartz.config.yaml

```yaml
- source: github:quartz-community/encrypted-pages
  enabled: true
  options:
    iterations: 600000
    passwordField: password
    unlistWhenEncrypted: true
```

**Plugin ordering matters.** `EncryptedPages` replaces the entire HAST tree of an encrypted page with an opaque ciphertext container, so any transformer that must see the real HTML — in particular `CrawlLinks`, which populates `file.data.links` for the shadow content index — must run **before** `EncryptedPages`. Use the `order` field in your config to ensure `CrawlLinks` has a lower order value than `EncryptedPages`.

### Component

Add the `EncryptedPage` component to your body layout in `quartz.layout.ts`.

## Options

All options below are set at the single plugin-entry level and are shared between the transformer and the emitter. Quartz passes the same merged options object to both factories automatically.

| Option                | Type      | Default                               | Used by              | Description                                                                                                                                                                                                                                                                                                      |
| --------------------- | --------- | ------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iterations`          | `number`  | `600000`                              | transformer          | PBKDF2 iteration count for key derivation. Higher is more secure but slower to unlock.                                                                                                                                                                                                                           |
| `passwordField`       | `string`  | `"password"`                          | transformer, emitter | Frontmatter field name that holds the page password.                                                                                                                                                                                                                                                             |
| `unlistWhenEncrypted` | `boolean` | `false`                               | transformer          | When `true`, encrypted pages are marked `file.data.unlisted = true`, hiding them from every build-time listing surface that respects the `unlisted` convention (contentIndex, RSS, sitemap, backlinks, recent-notes, folder-page, tag-page, graph, explorer, search). Per-page `frontmatter.unlisted` overrides. |
| `outputPath`          | `string`  | `"static/encryptedContentIndex.json"` | emitter              | Output path for the shadow content index, relative to Quartz's output directory.                                                                                                                                                                                                                                 |

### `EncryptedPage` (component)

| Option      | Type     | Default                    | Description                          |
| ----------- | -------- | -------------------------- | ------------------------------------ |
| `className` | `string` | `"encrypted-page-wrapper"` | CSS class for the component wrapper. |

### Frontmatter fields

| Field      | Type      | Description                                                                                                                                                                                                                                                                                               |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `password` | `string`  | Enables encryption for this page. The field name is configurable via `passwordField`.                                                                                                                                                                                                                     |
| `unlisted` | `boolean` | Overrides `unlistWhenEncrypted`. `true` forces the page unlisted; `false` forces it listed even when `unlistWhenEncrypted` is also set.                                                                                                                                                                   |
| `stealth`  | `boolean` | When `true` and the page is encrypted, suppresses the page's entry in the shadow content index. The page stays hidden from every listing surface **even after successful client-side decryption**. Implies `unlisted: true` (overrides any explicit `unlisted: false`). No effect on non-encrypted pages. |

## How `unlisted` works

When an encrypted page is marked `unlisted: true`:

- The page HTML is still emitted at its normal URL.
- It is **absent** from `contentIndex.json`, RSS, sitemap, and every server-side listing that respects the `unlisted` convention (backlinks, recent-notes, folder-page, tag-page, and bases views from `@quartz-community/bases-page`).
- Its metadata (slug, title, links, tags) is encrypted with the page's own password and emitted to `static/encryptedContentIndex.json` in an opaque, flat JSON array. No slugs or titles leak to anonymous visitors.
- On any page load, if the user has cached passwords in sessionStorage from a previous successful decryption, the client script fetches the shadow index, decrypts entries matching those passwords, and patches the in-memory content index in place. A `content-index-updated` event is dispatched so graph, explorer, and search reinitialize with the unlocked entries.
- Server-side rendered listings (backlinks, recent-notes, folder-page, tag-page, **bases views**) remain statically hidden even after client-side decryption. This is a deliberate trade-off: those surfaces are HTML baked at build time and cannot be patched client-side. Graph, explorer, and search all re-hydrate from the patched in-memory content index and show newly-unlocked pages for the rest of the session — base views do not, because they were fully materialized at build time.

## How `stealth` works

When an encrypted page is marked `stealth: true`, it behaves like an unlisted page with one critical difference: its entry is **never** emitted to the shadow content index. As a result:

- The page HTML is still emitted at its normal URL and accessible to anyone who knows it.
- The page is absent from `contentIndex.json`, RSS, sitemap, graph, explorer, search, backlinks, recent notes, folder listings, and tag listings — same as any `unlisted` page.
- Unlike `unlisted`, **successful client-side decryption does not reveal the page in graph, explorer, or search**. There is no shadow-index entry to decrypt, so the in-memory content index is never patched for this page.
- The password cache still works: a user who unlocks a stealth page once will not have to re-enter the password on subsequent visits within the same session. Only discovery surfaces are affected.

Use `stealth: true` when you want a "secret door" page: accessible only to users who already know the exact URL, invisible to everyone else permanently, even to users who have successfully decrypted other encrypted pages on the same site.

```yaml
---
title: Deep Secret
password: hunter2
stealth: true
---
```

Setting `stealth: true` is equivalent to `unlisted: true` on a page that does not also have a `password` field — the flag has no effect on non-encrypted pages, because stealth only controls the shadow-index emission, and non-encrypted pages do not have shadow-index entries in the first place.

## Security

- AES-256-GCM with 16-byte salt, 12-byte IV, 16-byte auth tag.
- PBKDF2-SHA256 with 600,000 default iterations.
- Plaintext leakage prevention: `file.data.text` and `file.data.description` are cleared by the transformer.
- The shadow content index entries are individually encrypted with the same password as the page they describe. An attacker downloading `encryptedContentIndex.json` learns only the number of unlisted encrypted pages and the PBKDF2 iteration count. No slugs, titles, or link relationships are exposed.
- Passwords are cached in `sessionStorage`, which clears when the browser session ends.
- This is client-side encryption for a static site. A determined attacker with access to the ciphertext can run an offline brute-force. Use strong passwords.

## Password caching

Successful passwords are cached in `sessionStorage` so subsequent encrypted pages with the same password auto-unlock. Successfully decrypted shadow entries are also cached for the session to avoid re-running PBKDF2 on every navigation.

## Render events

After a page is decrypted, a `render` `CustomEvent` is dispatched. After the shadow content index is patched, a `content-index-updated` `CustomEvent` is dispatched with a `detail.slugs` array of newly-added slugs. Graph, explorer, and search re-initialize on these events.

## License

MIT
