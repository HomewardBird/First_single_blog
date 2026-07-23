import { FullSlug, QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzTransformerPlugin } from '@quartz-community/types';
import { NotePropertiesOptions } from './types.js';
export { NotePropertiesComponent, NotePropertiesComponentOptions } from './components/index.js';

declare const NoteProperties: QuartzTransformerPlugin<Partial<NotePropertiesOptions>>;
declare module "vfile" {
    interface DataMap {
        aliases: FullSlug[];
        frontmatterLinks: string[];
        noteProperties: {
            properties: Record<string, unknown>;
            hideView: boolean;
            showProperties?: boolean;
            collapseProperties?: boolean;
            resolvedLinks?: Record<string, string>;
        };
    }
}

export { NoteProperties, NotePropertiesOptions };
