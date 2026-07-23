export type {
  BuildCtx,
  ChangeEvent,
  CSSResource,
  JSResource,
  ProcessedContent,
  QuartzEmitterPlugin,
  QuartzEmitterPluginInstance,
  QuartzFilterPlugin,
  QuartzFilterPluginInstance,
  QuartzPluginData,
  QuartzTransformerPlugin,
  QuartzTransformerPluginInstance,
  StaticResources,
  PageMatcher,
  PageGenerator,
  VirtualPage,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
} from "@quartz-community/types";

export interface EncryptedPagesOptions {
  /**
   * PBKDF2 iteration count for key derivation.
   * Higher = slower brute-force attacks, but also slower page unlock.
   *
   * @default 600_000
   */
  iterations: number;

  /**
   * Frontmatter field name that holds the page password.
   *
   * @default "password"
   */
  passwordField: string;

  /**
   * When `true`, encrypted pages are marked `file.data.unlisted = true`,
   * hiding them from every build-time listing surface that respects the
   * `unlisted` convention (contentIndex, RSS, sitemap, backlinks,
   * recent-notes, folder-page, tag-page, graph, explorer, search).
   *
   * The page HTML is still emitted, so the page remains accessible by
   * its direct URL. After successful client-side decryption, the page is
   * dynamically added back to client-side discovery surfaces (graph,
   * explorer, search) via the shadow content index emitted by
   * {@link EncryptedContentIndex}.
   *
   * Per-page frontmatter `unlisted: true | false` overrides this option.
   *
   * NOTE: When `true`, the `EncryptedContentIndex` emitter MUST also be
   * registered in your Quartz configuration. Without it, unlisted encrypted
   * pages cannot be dynamically revealed after decryption and will remain
   * invisible to graph/explorer/search for the entire session. The
   * transformer emits a console warning at build time if it detects the
   * emitter is missing.
   *
   * @default false
   */
  unlistWhenEncrypted: boolean;
}

export interface EncryptedContentIndexOptions {
  /**
   * Output path for the shadow content index, relative to the Quartz output
   * directory. The file is a JSON document wrapping a flat array of opaque
   * encrypted blobs; see the README for the format.
   *
   * @default "static/encryptedContentIndex.json"
   */
  outputPath: string;

  /**
   * Frontmatter field name that holds the page password. Must match the
   * `passwordField` used by the companion {@link EncryptedPages} transformer.
   * When both plugins are loaded from the same package entry in
   * quartz.config.yaml, Quartz passes the same merged options to both,
   * so this field is automatically kept in sync.
   *
   * @default "password"
   */
  passwordField: string;
}
