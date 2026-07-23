import { QuartzTransformerPlugin, QuartzEmitterPlugin } from '@quartz-community/types';
export { PageGenerator, PageMatcher, QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzEmitterPlugin, QuartzFilterPlugin, QuartzPageTypePlugin, QuartzPageTypePluginInstance, QuartzTransformerPlugin, StringResource, VirtualPage } from '@quartz-community/types';
import { EncryptedPagesOptions, EncryptedContentIndexOptions } from './types.js';
export { EncryptedPage, EncryptedPageComponentOptions } from './components/index.js';

declare function encryptAesGcm(plaintext: string, password: string, iterations: number): string;
declare function decrypt(encryptedBase64: string, password: string, iterations: number): string;
declare const EncryptedPages: QuartzTransformerPlugin<Partial<EncryptedPagesOptions>>;

declare const SHADOW_INDEX_VERSION: 1;
interface ShadowIndexBlob {
    ciphertext: string;
    iterations: number;
}
interface ShadowIndexFile {
    version: typeof SHADOW_INDEX_VERSION;
    entries: ShadowIndexBlob[];
}
interface ShadowContentIndexEntry {
    slug: string;
    entry: {
        slug: string;
        filePath: string;
        title: string;
        links: string[];
        tags: string[];
        content: string;
        description: string;
    };
}
declare const EncryptedContentIndex: QuartzEmitterPlugin<Partial<EncryptedContentIndexOptions>>;

export { EncryptedContentIndex, EncryptedContentIndexOptions, EncryptedPages, EncryptedPagesOptions, SHADOW_INDEX_VERSION, type ShadowContentIndexEntry, type ShadowIndexBlob, type ShadowIndexFile, decrypt, encryptAesGcm };
