import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzTransformerPlugin } from '@quartz-community/types';

interface CreatedModifiedDateOptions {
    priority: ("frontmatter" | "git" | "filesystem")[];
    defaultDateType: "created" | "modified" | "published";
}
declare const CreatedModifiedDate: QuartzTransformerPlugin<Partial<CreatedModifiedDateOptions>>;

export { CreatedModifiedDate, type CreatedModifiedDateOptions };
