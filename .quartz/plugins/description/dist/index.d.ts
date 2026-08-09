import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzTransformerPlugin } from '@quartz-community/types';

interface DescriptionOptions {
    descriptionLength: number;
    maxDescriptionLength: number;
    replaceExternalLinks: boolean;
}
declare const Description: QuartzTransformerPlugin<Partial<DescriptionOptions>>;

export { Description, type DescriptionOptions };
