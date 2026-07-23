import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzTransformerPlugin } from '@quartz-community/types';

interface GfmOptions {
    enableSmartyPants: boolean;
    linkHeadings: boolean;
}
declare const GitHubFlavoredMarkdown: QuartzTransformerPlugin<Partial<GfmOptions>>;

export { type GfmOptions, GitHubFlavoredMarkdown };
