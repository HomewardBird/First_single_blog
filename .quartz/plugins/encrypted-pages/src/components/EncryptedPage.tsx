import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import style from "./styles/encrypted.scss";
// @ts-expect-error - inline script import handled by Quartz bundler
import script from "./scripts/encrypted.inline.ts";

export interface EncryptedPageComponentOptions {
  /** CSS class name for the component wrapper. */
  className?: string;
}

export default ((opts?: EncryptedPageComponentOptions) => {
  const { className = "encrypted-page-wrapper" } = opts ?? {};

  const Component: QuartzComponent = (_props: QuartzComponentProps) => {
    // The actual encrypted container is injected by the transformer's rehype plugin.
    // This component only provides CSS and the client-side decryption script.
    // It renders an empty wrapper that the encrypted content appears inside.
    return <div class={className} />;
  };

  Component.css = style;
  Component.afterDOMLoaded = script;

  return Component;
}) satisfies QuartzComponentConstructor;
