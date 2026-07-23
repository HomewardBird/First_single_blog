export { BuildCtx, CSSResource, JSResource, QuartzTransformerPlugin, QuartzTransformerPluginInstance, StaticResources } from '@quartz-community/types';

/**
 * A font can be specified as a plain CSS font-family string
 * or as an object with Google Fonts loading control.
 */
type FontSpecification = string | {
    name: string;
    weights?: number[];
    includeItalic?: boolean;
};
interface FontsOptions {
    title?: FontSpecification;
    body?: FontSpecification;
    header?: FontSpecification;
    code?: FontSpecification;
    interface?: FontSpecification;
    h1?: FontSpecification;
    h2?: FontSpecification;
    h3?: FontSpecification;
    h4?: FontSpecification;
    h5?: FontSpecification;
    h6?: FontSpecification;
    useThemeFonts?: boolean;
    /**
     * Where to load fonts from.
     * - `"googleFonts"`: generate Google Fonts `<link>` tags.
     * - `"local"`: assume fonts are available locally (no loading).
     * - `"selfHosted"`: download Google Fonts and serve from the build output.
     * Defaults to `"local"` (no automatic font loading).
     */
    fontOrigin?: "googleFonts" | "local" | "selfHosted";
}
interface ProcessedFontResult {
    processedStylesheet: string;
    fontFiles: GoogleFontFile[];
}
interface GoogleFontFile {
    url: string;
    filename: string;
    extension: string;
}
interface QuartzFontRegistry {
    themeName: string;
    fonts: Record<string, string>;
    fontFiles?: FontFileEntry[];
    fontDir?: string;
}
interface FontFileEntry {
    family: string;
    style: string;
    weight: string;
    file: string;
    format: string;
    unicodeRange?: string | null;
}

export type { FontFileEntry, FontSpecification, FontsOptions, GoogleFontFile, ProcessedFontResult, QuartzFontRegistry };
