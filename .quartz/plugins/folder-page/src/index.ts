export { FolderPage } from "./pageType";
export { default as FolderContent } from "./components/FolderContent";
export type { FolderPageOptions } from "./pageType";

// Re-export shared types from @quartz-community/types
export type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
  PageMatcher,
  PageGenerator,
  VirtualPage,
} from "@quartz-community/types";
