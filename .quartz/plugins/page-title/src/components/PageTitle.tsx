import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { pathToRoot } from "../util/path";
import { i18n } from "../i18n";

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const locale = cfg?.locale ?? "en-US";
  const title = cfg?.pageTitle ?? i18n(locale).propertyDefaults.title;
  const baseDir = pathToRoot(fileData.slug as string);
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir}>{title}</a>
    </h2>
  );
};

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}
`;

export default (() => PageTitle) satisfies QuartzComponentConstructor;
