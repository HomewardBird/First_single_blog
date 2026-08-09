import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzEmitterPlugin, QuartzTransformerPlugin } from '@quartz-community/types';
import { FontsOptions } from './types.js';
export { FontFileEntry, FontSpecification, GoogleFontFile, ProcessedFontResult, QuartzFontRegistry } from './types.js';
export { FontsEmitter } from './emitter.js';

declare const Fonts: QuartzTransformerPlugin<Partial<FontsOptions>>;

export { Fonts, FontsOptions };
