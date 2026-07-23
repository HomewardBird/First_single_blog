import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzTransformerPlugin } from '@quartz-community/types';
import { TransformOptions } from '@quartz-community/utils';

interface CrawlLinksOptions {
    /** How to resolve Markdown paths */
    markdownLinkResolution: TransformOptions["strategy"];
    /** Strips folders from a link so that it looks nice */
    prettyLinks: boolean;
    openLinksInNewTab: boolean;
    lazyLoad: boolean;
    externalLinkIcon: boolean;
    /**
     * When `true`, internal links whose resolved slug is not present in
     * `ctx.allSlugs` gain a `broken` CSS class (alongside `internal`) so
     * broken links can be styled distinctly. Applies to both wikilinks
     * (after they've been converted to `<a>` elements by
     * ObsidianFlavoredMarkdown) and markdown links, since both are
     * indistinguishable `<a>` nodes at this phase of the pipeline.
     */
    disableBrokenWikilinks: boolean;
}
declare const CrawlLinks: QuartzTransformerPlugin<Partial<CrawlLinksOptions>>;

export { CrawlLinks, type CrawlLinksOptions };
