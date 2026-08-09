import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { i18n } from "../i18n";
import style from "./styles/search.scss";
// @ts-expect-error - inline script imported as string by esbuild loader
import script from "./scripts/search.inline.ts";

export type SearchField = "title" | "content" | "tags";

export interface SearchOptions {
  enablePreview: boolean;
  fieldPriority: SearchField[];
}

const defaultOptions: SearchOptions = {
  enablePreview: true,
  fieldPriority: ["title", "content", "tags"],
};

export default ((userOpts?: Partial<SearchOptions>) => {
  const Search: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const opts = { ...defaultOptions, ...userOpts };
    const locale = cfg.locale ?? "en-US";
    const searchPlaceholder = i18n(locale).components.search.searchBarPlaceholder;

    return (
      <div class={classNames(displayClass, "search")}>
        <button
          class="search-button"
          aria-label={i18n(locale).components.search.title}
          aria-expanded="false"
        >
          <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.7">
            <title>Search</title>
            <g class="search-path" fill="none">
              <path stroke-linecap="square" d="M18.5 18.3l-5.4-5.4" />
              <circle cx="8" cy="8" r="7" />
            </g>
          </svg>
          <p>{i18n(locale).components.search.title}</p>
        </button>
        <div class="search-container">
          <div class="search-space">
            <input
              autocomplete="off"
              class="search-bar"
              name="search"
              type="text"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
            />
            <div
              class="search-layout"
              data-preview={opts.enablePreview}
              data-field-priority={JSON.stringify(opts.fieldPriority)}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  Search.afterDOMLoaded = script;
  Search.css = style;

  return Search;
}) satisfies QuartzComponentConstructor;
