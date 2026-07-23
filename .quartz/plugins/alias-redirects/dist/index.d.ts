import { QuartzEmitterPlugin } from '@quartz-community/types';
export { QuartzEmitterPlugin } from '@quartz-community/types';

interface Options {
    /**
     * When enabled, automatically generates redirect pages for the original
     * (case-preserving) URL of any file whose path changed due to v5's
     * lowercase slug normalization. This ensures previously indexed URLs
     * (e.g. `/Diary/My-Note`) redirect to the new canonical lowercase URL
     * (e.g. `/diary/my-note`) with proper SEO signals.
     *
     * Has no effect on case-insensitive filesystems (macOS, Windows) where
     * the server already resolves either casing to the same file.
     *
     * @default true
     */
    enableCaseRedirects: boolean;
}
/** Reset filesystem detection cache (used in tests). */
declare function _resetFsDetectionCache(): void;
declare const AliasRedirects: QuartzEmitterPlugin<Partial<Options>>;

export { AliasRedirects, _resetFsDetectionCache };
