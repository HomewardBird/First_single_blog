import { QuartzPageTypePlugin, SortFn } from '@quartz-community/types';

interface TagPageOptions {
    sort?: SortFn;
    numPages?: number;
    /** Show "Tag: " prefix before tag name in generated titles. Default: false */
    prefixTags?: boolean;
}
declare const TagPage: QuartzPageTypePlugin<TagPageOptions>;

export { TagPage as T, type TagPageOptions as a };
