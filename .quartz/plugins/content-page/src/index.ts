export { ContentPage } from "./pageType";
export { default as ContentBody } from "./components/ContentBody";
export type { ContentPageOptions } from "./pageType";
export type { ContentBodyOptions } from "./components/ContentBody";

// Re-export shared types from @quartz-community/types
export type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
  PageMatcher,
} from "@quartz-community/types";
