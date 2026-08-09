export { ContentBody, ContentBodyOptions } from './components/index.js';
import { QuartzPageTypePlugin } from '@quartz-community/types';
export { PageMatcher, QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzPageTypePlugin, QuartzPageTypePluginInstance } from '@quartz-community/types';

interface ContentPageOptions {
}
declare const ContentPage: QuartzPageTypePlugin<ContentPageOptions>;

export { ContentPage, type ContentPageOptions };
