import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { resolveRelative, slugifyWikilinkTarget } from "../util/path";
import { i18n } from "../i18n";
import style from "./styles/noteProperties.scss";
// @ts-expect-error - inline script import handled by Quartz bundler
import script from "./scripts/noteProperties.inline.ts";

export interface NotePropertiesComponentOptions {
  collapsed?: boolean;
}

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MDLINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;
const URL_RE = /https?:\/\/[^\s<>]+/g;

type RenderCtx = { slug: string; resolvedLinks: Record<string, string> };

function lookupHref(ctx: RenderCtx, slugifiedTarget: string): string {
  return ctx.resolvedLinks[slugifiedTarget] ?? resolveRelative(ctx.slug, slugifiedTarget);
}

function renderTextWithLinks(text: string, ctx: RenderCtx): (preact.JSX.Element | string)[] {
  const segments: { start: number; end: number; node: preact.JSX.Element }[] = [];
  for (const match of text.matchAll(WIKILINK_RE)) {
    const target = match[1]!;
    const display = match[2] ?? target;
    const href = lookupHref(ctx, slugifyWikilinkTarget(target));
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: (
        <a href={href} class="internal internal-link note-properties-link">
          {display}
        </a>
      ),
    });
  }

  for (const match of text.matchAll(MDLINK_RE)) {
    const overlaps = segments.some(
      (s) => match.index < s.end && match.index + match[0].length > s.start,
    );
    if (overlaps) continue;
    const display = match[1]!;
    const href = match[2]!;
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const resolvedHref = isExternal ? href : lookupHref(ctx, href);
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: (
        <a
          href={resolvedHref}
          class={classNames(
            isExternal ? "external external-link" : "internal internal-link",
            "note-properties-link",
          )}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {display || href}
        </a>
      ),
    });
  }

  for (const match of text.matchAll(URL_RE)) {
    const overlaps = segments.some(
      (s) => match.index < s.end && match.index + match[0].length > s.start,
    );
    if (overlaps) continue;

    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: (
        <a
          href={match[0]}
          class="external external-link note-properties-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[0]}
        </a>
      ),
    });
  }

  if (segments.length === 0) return [text];

  segments.sort((a, b) => a.start - b.start);

  const result: (preact.JSX.Element | string)[] = [];
  let cursor = 0;
  for (const seg of segments) {
    if (seg.start > cursor) {
      result.push(text.slice(cursor, seg.start));
    }
    result.push(seg.node);
    cursor = seg.end;
  }
  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }

  return result;
}

function renderValue(value: unknown, ctx: RenderCtx): preact.JSX.Element | string {
  if (value === null || value === undefined) {
    return <span class="note-properties-empty">—</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span class={classNames("note-properties-boolean", value ? "is-true" : "is-false")}>
        <input type="checkbox" checked={value} disabled />
      </span>
    );
  }

  if (typeof value === "number") {
    return <span class="note-properties-number">{value}</span>;
  }

  if (typeof value === "string") {
    const parts = renderTextWithLinks(value, ctx);
    return <span class="note-properties-text">{parts}</span>;
  }

  if (Array.isArray(value)) {
    const items = value.map((item, idx) => {
      const rendered = renderValue(item, ctx);
      return (
        <>
          {idx > 0 && <span class="note-properties-separator">, </span>}
          {rendered}
        </>
      );
    });
    return <span class="note-properties-list">{items}</span>;
  }

  if (typeof value === "object") {
    return (
      <span class="note-properties-object">
        <code>{JSON.stringify(value)}</code>
      </span>
    );
  }

  return String(value);
}

function renderTagList(tags: string[], ctx: RenderCtx): preact.JSX.Element {
  const items = tags.map((tag, idx) => {
    const href = resolveRelative(ctx.slug, `tags/${tag}`);
    return (
      <>
        {idx > 0 && <span class="note-properties-separator">, </span>}
        <a href={href} class="internal internal-link tag-link">
          {tag}
        </a>
      </>
    );
  });
  return <span class="note-properties-tags">{items}</span>;
}

export default ((opts?: NotePropertiesComponentOptions) => {
  const { collapsed = false } = opts ?? {};

  const Component: QuartzComponent = (props: QuartzComponentProps) => {
    const noteProps = props.fileData?.noteProperties as
      | {
          properties: Record<string, unknown>;
          hideView: boolean;
          showProperties?: boolean;
          collapseProperties?: boolean;
          resolvedLinks?: Record<string, string>;
        }
      | undefined;
    if (!noteProps) return null;

    // Per-note override takes precedence over global config
    // showProperties: true = force show, false = force hide, undefined = follow hideView config
    if (noteProps.showProperties === false) return null;
    if (noteProps.showProperties !== true && noteProps.hideView) return null;

    const properties = noteProps.properties;
    const entries = Object.entries(properties);
    if (entries.length === 0) return null;

    const locale = props.cfg?.locale || "en-US";
    const i18nData = i18n(locale);
    const ctx: RenderCtx = {
      slug: (props.fileData?.slug as string) ?? "",
      resolvedLinks: noteProps.resolvedLinks ?? {},
    };

    // Per-note collapse override takes precedence over component option
    const isCollapsed = noteProps.collapseProperties ?? collapsed;
    return (
      <details
        class={classNames(props.displayClass, "note-properties", "metadata-container")}
        open={!isCollapsed}
        data-collapsed={isCollapsed}
      >
        <summary class="note-properties-header">
          <span class="note-properties-title">{i18nData.components.noteProperties.title}</span>
          <span class="note-properties-count">{entries.length}</span>
        </summary>
        <table class="note-properties-table">
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} class="note-properties-row metadata-property">
                <td class="note-properties-key metadata-property-key">{key}</td>
                <td class="note-properties-value metadata-property-value">
                  {key === "tags" && Array.isArray(value)
                    ? renderTagList(value as string[], ctx)
                    : renderValue(value, ctx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    );
  };

  Component.css = style;
  Component.afterDOMLoaded = script;

  return Component;
}) satisfies QuartzComponentConstructor;
