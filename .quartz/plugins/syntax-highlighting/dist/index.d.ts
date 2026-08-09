import { Theme as Theme$1 } from 'rehype-pretty-code';
import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzTransformerPlugin } from '@quartz-community/types';
import { ShikiTransformer } from 'shiki';

interface Theme extends Record<string, Theme$1> {
    light: Theme$1;
    dark: Theme$1;
}
interface SyntaxHighlightingOptions {
    theme?: Theme;
    keepBackground?: boolean;
    clipboard?: boolean;
    tokenClassification?: boolean;
}
declare const SyntaxHighlighting: QuartzTransformerPlugin<Partial<SyntaxHighlightingOptions>>;

/**
 * Shiki transformer that adds `data-token-type` attributes to token spans
 * based on TextMate scope classification.
 *
 * Automatically enables `includeExplanation: "scopeName"` via the `preprocess`
 * hook so that scope data is available regardless of how the host plugin
 * (e.g. rehype-pretty-code) invokes shiki.
 *
 * This is purely additive — inline styles are preserved as-is. Downstream
 * consumers (e.g. Quartz Themes) can target `span[data-token-type="keyword"]`
 * to override colors with theme-specific values.
 */
declare function tokenClassifierTransformer(): ShikiTransformer;

export { SyntaxHighlighting, type SyntaxHighlightingOptions, tokenClassifierTransformer };
