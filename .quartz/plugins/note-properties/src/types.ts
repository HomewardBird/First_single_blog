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
  FullSlug,
  FilePath,
} from "@quartz-community/types";

export interface NotePropertiesOptions {
  /** Include all frontmatter properties in the display. When false, only `includedProperties` are shown. */
  includeAll: boolean;
  /** Properties to include when `includeAll` is false. Ignored when `includeAll` is true. */
  includedProperties: string[];
  /** Properties to exclude from display. Applied after inclusion logic. */
  excludedProperties: string[];
  /** Hide the visual properties panel while still processing frontmatter and resolving links. */
  hidePropertiesView: boolean;
  /** Frontmatter delimiters. Defaults to "---". */
  delimiters: string | [string, string];
  /** Frontmatter language. Defaults to "yaml". */
  language: "yaml" | "toml";
}
