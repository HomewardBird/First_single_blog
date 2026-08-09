import { SortFn, QuartzComponent } from '@quartz-community/types';

interface TagContentOptions {
    sort?: SortFn;
    numPages: number;
}
declare const _default: (opts?: Partial<TagContentOptions>) => QuartzComponent;

export { _default as _ };
