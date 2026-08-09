import { SatoriOptions } from 'satori';
import { QuartzEmitterPlugin, ThemeKey, GlobalConfiguration, FullSlug } from '@quartz-community/types';
export { QuartzEmitterPlugin } from '@quartz-community/types';
import { JSX } from 'preact';

type Frontmatter = {
    title?: string;
    description?: string;
    socialDescription?: string;
    socialImage?: string;
    tags?: string[];
} & Record<string, unknown>;
/**
 * Page data passed to user-provided `imageStructure` callbacks.
 *
 * This is deliberately narrower than `@quartz-community/types`'
 * `QuartzPluginData`: it documents exactly which fields the og-image
 * emitter promises to populate before invoking `imageStructure`. The
 * extra `text?` field is synthesised by this plugin from the page's
 * rendered content prior to the callback.
 *
 * Do NOT replace this with `QuartzPluginData`: doing so would advertise
 * fields (e.g. `htmlAst`) that this emitter does not pass through.
 */
type SocialImageFileData = {
    slug?: FullSlug;
    frontmatter?: Frontmatter;
    description?: string;
    text?: string;
    filePath?: string;
    dates?: Record<string, Date>;
};
type SocialImageOptions = {
    colorScheme: ThemeKey;
    height: number;
    width: number;
    excludeRoot: boolean;
    defaultTitle?: string;
    defaultDescription?: string;
    readingTimeText?: (minutes: number) => string;
    imageStructure: (options: ImageOptions & {
        userOpts: UserOpts;
        iconBase64?: string;
    }) => JSX.Element;
};
type UserOpts = Omit<SocialImageOptions, "imageStructure">;
type ImageOptions = {
    title: string;
    description: string;
    fonts: SatoriOptions["fonts"];
    cfg: GlobalConfiguration;
    fileData: SocialImageFileData;
};
declare const CustomOgImagesEmitterName = "CustomOgImages";
declare const CustomOgImages: QuartzEmitterPlugin<Partial<SocialImageOptions>>;

export { CustomOgImages, CustomOgImagesEmitterName, type ImageOptions, type SocialImageFileData, type SocialImageOptions, type UserOpts };
