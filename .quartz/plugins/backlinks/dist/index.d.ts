import { QuartzComponent } from '@quartz-community/types';
export { QuartzComponent, QuartzComponentProps, StringResource } from '@quartz-community/types';

interface BacklinksOptions {
    hideWhenEmpty: boolean;
}
declare const _default: (opts?: Partial<BacklinksOptions>) => QuartzComponent;

export { _default as Backlinks, type BacklinksOptions };
