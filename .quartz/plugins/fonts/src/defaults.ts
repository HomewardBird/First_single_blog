export const OBSIDIAN_SANS_STACK =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';

export const OBSIDIAN_MONO_STACK =
  'ui-monospace, SFMono-Regular, "Cascadia Mono", "Roboto Mono", "DejaVu Sans Mono", "Liberation Mono", Menlo, Monaco, "Consolas", "Source Code Pro", monospace';

export type FontRole = "title" | "header" | "body" | "code";

export const DEFAULT_WEIGHTS: Record<FontRole, number[]> = {
  title: [400, 700],
  header: [400, 700],
  body: [400, 600],
  code: [400, 600],
};

export const DEFAULT_ITALIC: Record<FontRole, boolean> = {
  title: false,
  header: false,
  body: true,
  code: false,
};
