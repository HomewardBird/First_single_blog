declare module "@quartz-community/utils/path" {
  export function simplifySlug(fp: string): string;
  export function resolveRelative(current: string, target: string): string;
}

export { simplifySlug, resolveRelative } from "@quartz-community/utils/path";
