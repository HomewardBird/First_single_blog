import type { FontSpecification } from "../types";
import type { FontRole } from "../defaults";
import { DEFAULT_WEIGHTS, DEFAULT_ITALIC } from "../defaults";

interface GoogleFontEntry {
  family: string;
  id: string;
  weights: number[];
  styles: string[];
  subsets: string[];
}

type FontMetadata = Record<string, GoogleFontEntry>;

let metadataCache: FontMetadata | null | false = null;

function loadMetadata(): FontMetadata | undefined {
  if (metadataCache === false) return undefined;
  if (metadataCache) return metadataCache;

  try {
    // `require` is injected by tsup's banner via createRequire(import.meta.url).
    // Using it directly avoids a duplicate createRequire import in the bundle.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { APIv1 } = require("google-font-metadata") as { APIv1: FontMetadata };
    metadataCache = APIv1;
    return metadataCache;
  } catch {
    metadataCache = false;
    return undefined;
  }
}

function fontToId(family: string): string {
  return family.toLowerCase().replace(/\s+/g, "-");
}

export interface ValidationWarning {
  font: string;
  role: string;
  message: string;
}

export function validateFontSpec(
  role: string,
  spec: FontSpecification,
  fontRole: FontRole,
): ValidationWarning[] {
  const metadata = loadMetadata();
  if (!metadata) return [];

  const warnings: ValidationWarning[] = [];
  const name = typeof spec === "string" ? spec : spec.name;
  const id = fontToId(name);
  const entry = metadata[id];

  if (!entry) {
    warnings.push({
      font: name,
      role,
      message: `"${name}" is not a recognized Google Font. It will be requested but may fail to load.`,
    });
    return warnings;
  }

  const weights =
    typeof spec === "object" && spec.weights ? spec.weights : DEFAULT_WEIGHTS[fontRole];
  const italic =
    typeof spec === "object" && spec.includeItalic !== undefined
      ? spec.includeItalic
      : DEFAULT_ITALIC[fontRole];

  for (const weight of weights) {
    if (!entry.weights.includes(weight)) {
      warnings.push({
        font: name,
        role,
        message: `"${name}" does not support weight ${weight}. Available weights: ${entry.weights.join(", ")}.`,
      });
    }
  }

  if (italic && !entry.styles.includes("italic")) {
    warnings.push({
      font: name,
      role,
      message: `"${name}" does not support italic style. Available styles: ${entry.styles.join(", ")}.`,
    });
  }

  return warnings;
}
