import type { QuartzComponent, QuartzComponentProps } from "@quartz-community/types";
import { classNames } from "../util/lang";
import { i18n } from "../i18n";
import style from "./styles/backlinks.scss";
import { resolveRelative, simplifySlug } from "../util/path";
import OverflowListFactory from "./OverflowList";

export interface BacklinksOptions {
  hideWhenEmpty: boolean;
}

type QuartzComponentConstructor<Options extends object | undefined = undefined> = (
  opts: Options,
) => QuartzComponent;

const defaultOptions: BacklinksOptions = {
  hideWhenEmpty: true,
};

export interface BacklinkCandidate {
  unlisted?: boolean;
  links?: string[];
  slug?: string;
  frontmatter?: { title?: string };
}

export function selectBacklinkSources<T extends BacklinkCandidate>(
  allFiles: T[],
  currentSlug: string,
): T[] {
  return allFiles.filter((file) => file.unlisted !== true && file.links?.includes(currentSlug));
}

export default ((opts?: Partial<BacklinksOptions>) => {
  const options: BacklinksOptions = { ...defaultOptions, ...opts };
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory();

  const Backlinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps & { displayClass?: string }) => {
    const slug = simplifySlug(fileData.slug as string);
    const locale = cfg.locale ?? "en-US";
    const backlinkFiles = selectBacklinkSources(allFiles as BacklinkCandidate[], slug);
    if (options.hideWhenEmpty && backlinkFiles.length === 0) {
      return null;
    }
    return (
      <div class={classNames(displayClass, "backlinks")}>
        <h3>{i18n(locale).components.backlinks.title}</h3>
        <OverflowList>
          {backlinkFiles.length > 0 ? (
            backlinkFiles.map((f) => (
              <li>
                <a href={resolveRelative(fileData.slug as string, f.slug!)} class="internal">
                  {f.frontmatter?.title}
                </a>
              </li>
            ))
          ) : (
            <li>{i18n(locale).components.backlinks.noBacklinksFound}</li>
          )}
        </OverflowList>
      </div>
    );
  };

  Backlinks.css = style;
  Backlinks.afterDOMLoaded = overflowListAfterDOMLoaded;

  return Backlinks;
}) satisfies QuartzComponentConstructor;
