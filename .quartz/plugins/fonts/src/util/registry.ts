import type { QuartzFontRegistry } from "../types";

const REGISTRY_KEY = "__quartzFonts";

export function readFontRegistry(): QuartzFontRegistry | undefined {
  const registry = (globalThis as Record<string, unknown>)[REGISTRY_KEY];
  if (registry && typeof registry === "object" && "themeName" in registry && "fonts" in registry) {
    return registry as QuartzFontRegistry;
  }
  return undefined;
}

export function isQuartzThemeEnabled(): boolean {
  return REGISTRY_KEY in (globalThis as Record<string, unknown>);
}
