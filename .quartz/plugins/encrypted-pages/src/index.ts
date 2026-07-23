export { EncryptedPages, encryptAesGcm, decrypt } from "./transformer";
export { EncryptedContentIndex, SHADOW_INDEX_VERSION } from "./emitter";
export { default as EncryptedPage } from "./components/EncryptedPage";

export type { EncryptedPagesOptions, EncryptedContentIndexOptions } from "./types";

export type { ShadowIndexBlob, ShadowIndexFile, ShadowContentIndexEntry } from "./emitter";

export type { EncryptedPageComponentOptions } from "./components/EncryptedPage";

export type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  StringResource,
  QuartzTransformerPlugin,
  QuartzFilterPlugin,
  QuartzEmitterPlugin,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
  PageMatcher,
  PageGenerator,
  VirtualPage,
} from "@quartz-community/types";
