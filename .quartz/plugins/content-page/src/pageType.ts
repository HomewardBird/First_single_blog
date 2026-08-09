import type { PageMatcher, QuartzPageTypePlugin } from "@quartz-community/types";
import ContentBody from "./components/ContentBody";

export interface ContentPageOptions {}

const contentMatcher: PageMatcher = ({ slug }) => {
  if (slug.endsWith("/index")) return false;
  if (slug.startsWith("tags/")) return false;
  return true;
};

export const ContentPage: QuartzPageTypePlugin<ContentPageOptions> = () => ({
  name: "ContentPage",
  priority: 0,
  match: contentMatcher,
  layout: "content",
  body: ContentBody,
});
