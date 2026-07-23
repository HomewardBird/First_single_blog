import type { FontSpecification } from "../types";
import type { FontRole } from "../defaults";
import { DEFAULT_WEIGHTS, DEFAULT_ITALIC } from "../defaults";

function normalizeFontSpec(spec: FontSpecification): {
  name: string;
  weights?: number[];
  includeItalic?: boolean;
} {
  return typeof spec === "string" ? { name: spec } : spec;
}

export function getFontName(spec: FontSpecification): string {
  return typeof spec === "string" ? spec : spec.name;
}

export function formatFontSpecification(role: FontRole, spec: FontSpecification): string {
  const { name, weights, includeItalic } = normalizeFontSpec(spec);

  const resolvedWeights = weights ?? DEFAULT_WEIGHTS[role];
  const italic = includeItalic ?? DEFAULT_ITALIC[role];

  const features: string[] = [];
  if (italic) {
    features.push("ital");
  }

  if (resolvedWeights.length > 1) {
    const weightSpec = italic
      ? resolvedWeights
          .flatMap((w) => [`0,${w}`, `1,${w}`])
          .sort()
          .join(";")
      : resolvedWeights.join(";");

    features.push(`wght@${weightSpec}`);
  }

  if (features.length > 0) {
    return `${name}:${features.join(",")}`;
  }

  return name;
}

interface MergedFontEntry {
  name: string;
  weights: Set<number>;
  italic: boolean;
}

function mergeInto(
  map: Map<string, MergedFontEntry>,
  role: FontRole,
  spec: FontSpecification,
): void {
  const { name, weights, includeItalic } = normalizeFontSpec(spec);
  const resolvedWeights = weights ?? DEFAULT_WEIGHTS[role];
  const italic = includeItalic ?? DEFAULT_ITALIC[role];

  const existing = map.get(name);
  if (existing) {
    for (const w of resolvedWeights) existing.weights.add(w);
    if (italic) existing.italic = true;
  } else {
    map.set(name, { name, weights: new Set(resolvedWeights), italic });
  }
}

function formatMergedEntry(entry: MergedFontEntry): string {
  const sortedWeights = [...entry.weights].sort((a, b) => a - b);
  const features: string[] = [];

  if (entry.italic) {
    features.push("ital");
  }

  if (sortedWeights.length > 1) {
    const weightSpec = entry.italic
      ? sortedWeights
          .flatMap((w) => [`0,${w}`, `1,${w}`])
          .sort()
          .join(";")
      : sortedWeights.join(";");
    features.push(`wght@${weightSpec}`);
  }

  if (features.length > 0) {
    return `${entry.name}:${features.join(",")}`;
  }
  return entry.name;
}

export function googleFontHref(fonts: {
  title?: FontSpecification;
  header: FontSpecification;
  body: FontSpecification;
  code: FontSpecification;
}): string {
  const merged = new Map<string, MergedFontEntry>();

  mergeInto(merged, "header", fonts.header);
  mergeInto(merged, "body", fonts.body);
  mergeInto(merged, "code", fonts.code);

  if (fonts.title) {
    mergeInto(merged, "title", fonts.title);
  }

  const families = [...merged.values()].map(formatMergedEntry);
  const params = families.map((f) => `family=${encodeURIComponent(f)}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
