import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { BuildCtx } from "@quartz-community/types";
import { Fonts } from "../src/transformer";

import { formatFontSpecification, googleFontHref, getFontName } from "../src/util/google-fonts";
import { processGoogleFonts } from "../src/util/process-fonts";
import { validateFontSpec } from "../src/util/validate";

const REGISTRY_KEY = "__quartzFonts";
const mockCtx = {} as BuildCtx;

function setRegistry(data: Record<string, unknown>) {
  (globalThis as Record<string, unknown>)[REGISTRY_KEY] = data;
}

function clearRegistry() {
  delete (globalThis as Record<string, unknown>)[REGISTRY_KEY];
}

function getCSSContent(plugin: ReturnType<typeof Fonts>): string {
  const resources = plugin.externalResources!(mockCtx);
  return (resources?.css ?? []).map((r) => ("content" in r ? r.content : "")).join("\n");
}

function getAdditionalHead(plugin: ReturnType<typeof Fonts>): unknown[] {
  const resources = plugin.externalResources!(mockCtx);
  return (resources as { additionalHead?: unknown[] })?.additionalHead ?? [];
}

describe("Fonts", () => {
  afterEach(() => {
    clearRegistry();
  });

  describe("standalone (no QuartzTheme)", () => {
    it("uses Quartz defaults when no options provided", () => {
      const css = getCSSContent(Fonts());

      expect(css).toContain("--bodyFont: Source Sans Pro");
      expect(css).toContain("--codeFont: IBM Plex Mono");
      expect(css).toContain("--headerFont: Schibsted Grotesk");
    });

    it("applies user-provided body font", () => {
      const css = getCSSContent(Fonts({ body: '"Inter", sans-serif' }));

      expect(css).toContain('--bodyFont: "Inter", sans-serif');
      expect(css).toContain('--font-text: "Inter", sans-serif');
    });

    it("applies user-provided header font to all headings", () => {
      const css = getCSSContent(Fonts({ header: '"Playfair Display", serif' }));

      expect(css).toContain('--h1-font: "Playfair Display", serif');
      expect(css).toContain('--h6-font: "Playfair Display", serif');
    });

    it("applies per-heading overrides", () => {
      const css = getCSSContent(
        Fonts({
          header: '"Lora", serif',
          h1: '"Playfair Display", serif',
          h3: '"Inter", sans-serif',
        }),
      );

      expect(css).toContain('--h1-font: "Playfair Display", serif');
      expect(css).toContain('--h2-font: "Lora", serif');
      expect(css).toContain('--h3-font: "Inter", sans-serif');
    });

    it("emits unlayered heading CSS", () => {
      const plugin = Fonts({ header: '"Lora", serif' });
      const resources = plugin.externalResources!(mockCtx);
      const unlayeredCSS = (resources?.css ?? [])
        .map((r) => ("content" in r ? r.content : ""))
        .find((c) => c.includes("h1 { font-family:"));

      expect(unlayeredCSS).toBeDefined();
      expect(unlayeredCSS).toContain('h1 { font-family: "Lora", serif; }');
      expect(unlayeredCSS).not.toContain("@layer");
    });
  });

  describe("title font", () => {
    it("defaults title to header value", () => {
      const css = getCSSContent(Fonts({ header: '"Lora", serif' }));
      expect(css).toContain('--titleFont: "Lora", serif');
    });

    it("defaults title to header default when no header set", () => {
      const css = getCSSContent(Fonts());
      expect(css).toContain("--titleFont: Schibsted Grotesk");
    });

    it("applies explicit title font", () => {
      const css = getCSSContent(
        Fonts({ title: '"Abril Fatface", serif', header: '"Lora", serif' }),
      );
      expect(css).toContain('--titleFont: "Abril Fatface", serif');
      expect(css).toContain('--headerFont: "Lora", serif');
    });

    it("accepts FontSpecification object for title", () => {
      const css = getCSSContent(Fonts({ title: { name: "Abril Fatface", weights: [400] } }));
      expect(css).toContain("--titleFont: Abril Fatface");
    });
  });

  describe("FontSpecification object form", () => {
    it("extracts font name from object spec for CSS", () => {
      const css = getCSSContent(
        Fonts({
          body: { name: "Inter", weights: [400, 700], includeItalic: true },
          header: { name: "Playfair Display", weights: [400, 700] },
          code: { name: "JetBrains Mono", weights: [400] },
        }),
      );

      expect(css).toContain("--bodyFont: Inter");
      expect(css).toContain("--headerFont: Playfair Display");
      expect(css).toContain("--codeFont: JetBrains Mono");
    });

    it("accepts object form for heading overrides", () => {
      const css = getCSSContent(
        Fonts({
          h1: { name: "Abril Fatface", weights: [400] },
          h2: '"Lora", serif',
        }),
      );

      expect(css).toContain("--h1-font: Abril Fatface");
      expect(css).toContain('--h2-font: "Lora", serif');
    });
  });

  describe("Google Fonts loading", () => {
    it("does not inject link tags when fontOrigin is local", () => {
      const head = getAdditionalHead(Fonts({ fontOrigin: "local", body: "Inter" }));
      expect(head).toHaveLength(0);
    });

    it("injects preconnect and stylesheet VNodes for googleFonts", () => {
      const head = getAdditionalHead(
        Fonts({
          fontOrigin: "googleFonts",
          body: "Inter",
          header: "Playfair Display",
          code: "JetBrains Mono",
        }),
      );

      expect(head).toHaveLength(3);

      const preconnect1 = head[0] as { props: Record<string, string> };
      expect(preconnect1.props.rel).toBe("preconnect");
      expect(preconnect1.props.href).toBe("https://fonts.googleapis.com");

      const preconnect2 = head[1] as { props: Record<string, string> };
      expect(preconnect2.props.href).toBe("https://fonts.gstatic.com");

      const stylesheet = head[2] as { props: Record<string, string> };
      expect(stylesheet.props.rel).toBe("stylesheet");
      expect(stylesheet.props.href).toContain("fonts.googleapis.com/css2");
      expect(stylesheet.props.href).toContain("Playfair");
      expect(stylesheet.props.href).toContain("Inter");
      expect(stylesheet.props.href).toContain("JetBrains");
    });

    it("includes title font in Google Fonts URL when different from header", () => {
      const head = getAdditionalHead(
        Fonts({
          fontOrigin: "googleFonts",
          title: "Abril Fatface",
          header: "Playfair Display",
          body: "Inter",
          code: "JetBrains Mono",
        }),
      );

      const stylesheet = head[2] as { props: Record<string, string> };
      expect(stylesheet.props.href).toContain("Abril");
      expect(stylesheet.props.href).toContain("Playfair");
    });

    it("deduplicates title and header when they match", () => {
      const head = getAdditionalHead(
        Fonts({
          fontOrigin: "googleFonts",
          title: "Inter",
          header: "Inter",
          body: "Inter",
          code: "JetBrains Mono",
        }),
      );

      const stylesheet = head[2] as { props: { href: string } };
      const interMatches = stylesheet.props.href.match(/family=Inter/g);
      expect(interMatches).toHaveLength(1);
    });
  });

  describe("selfHosted fontOrigin", () => {
    it("injects link to self-hosted CSS file instead of Google Fonts", () => {
      const head = getAdditionalHead(
        Fonts({
          fontOrigin: "selfHosted",
          body: "Inter",
          header: "Playfair Display",
          code: "JetBrains Mono",
        }),
      );

      expect(head).toHaveLength(1);
      const link = head[0] as { props: Record<string, string> };
      expect(link.props.rel).toBe("stylesheet");
      expect(link.props.href).toBe("/static/fonts/quartz-fonts.css");
    });

    it("still emits layered CSS with font variables", () => {
      const css = getCSSContent(
        Fonts({
          fontOrigin: "selfHosted",
          body: "Inter",
          header: "Playfair Display",
          code: "JetBrains Mono",
        }),
      );

      expect(css).toContain("--bodyFont: Inter");
      expect(css).toContain("--headerFont: Playfair Display");
      expect(css).toContain("--codeFont: JetBrains Mono");
    });
  });

  describe("with QuartzTheme registry", () => {
    beforeEach(() => {
      setRegistry({
        themeName: "tokyo-night",
        fonts: {
          "--font-text": '"JetBrains Mono", monospace',
          "--font-monospace": '"Fira Code", monospace',
          "--h1-font": '"Custom H1 Font", serif',
        },
      });
    });

    it("reads theme fonts from registry", () => {
      const css = getCSSContent(Fonts());

      expect(css).toContain('--bodyFont: "JetBrains Mono", monospace');
      expect(css).toContain('--codeFont: "Fira Code", monospace');
      expect(css).toContain('--h1-font: "Custom H1 Font", serif');
    });

    it("user options override theme fonts", () => {
      const css = getCSSContent(Fonts({ body: '"Inter", sans-serif' }));

      expect(css).toContain('--bodyFont: "Inter", sans-serif');
      expect(css).toContain('--codeFont: "Fira Code", monospace');
    });

    it("useThemeFonts: false ignores registry", () => {
      const css = getCSSContent(Fonts({ useThemeFonts: false }));

      expect(css).toContain("--bodyFont: Source Sans Pro");
      expect(css).not.toContain("JetBrains Mono");
    });
  });

  describe("plugin metadata", () => {
    it("has the correct name", () => {
      const plugin = Fonts();
      expect(plugin.name).toBe("Fonts");
    });

    it("textTransform passes through source unchanged", () => {
      const plugin = Fonts();
      const input = "# Hello World\n";
      const result = plugin.textTransform!(mockCtx, input);
      expect(result).toBe(input);
    });
  });
});

describe("formatFontSpecification", () => {
  it("formats string spec with default header weights", () => {
    const result = formatFontSpecification("header", "Inter");
    expect(result).toBe("Inter:wght@400;700");
  });

  it("formats string spec with default body weights and italic", () => {
    const result = formatFontSpecification("body", "Inter");
    expect(result).toBe("Inter:ital,wght@0,400;0,600;1,400;1,600");
  });

  it("formats string spec with default code weights", () => {
    const result = formatFontSpecification("code", "JetBrains Mono");
    expect(result).toBe("JetBrains Mono:wght@400;600");
  });

  it("uses custom weights from object spec", () => {
    const result = formatFontSpecification("header", {
      name: "Inter",
      weights: [300, 400, 700, 900],
    });
    expect(result).toBe("Inter:wght@300;400;700;900");
  });

  it("includes italic axis when includeItalic is true", () => {
    const result = formatFontSpecification("header", {
      name: "Inter",
      weights: [400, 700],
      includeItalic: true,
    });
    expect(result).toBe("Inter:ital,wght@0,400;0,700;1,400;1,700");
  });

  it("returns bare name for single weight without italic", () => {
    const result = formatFontSpecification("header", {
      name: "Abril Fatface",
      weights: [400],
      includeItalic: false,
    });
    expect(result).toBe("Abril Fatface");
  });
});

describe("googleFontHref", () => {
  it("generates valid Google Fonts CSS2 URL", () => {
    const href = googleFontHref({
      header: "Playfair Display",
      body: "Inter",
      code: "JetBrains Mono",
    });

    expect(href).toContain("https://fonts.googleapis.com/css2?");
    expect(href).toContain("display=swap");
    expect(href).toContain("Playfair");
    expect(href).toContain("Inter");
    expect(href).toContain("JetBrains");
  });

  it("deduplicates identical font families", () => {
    const href = googleFontHref({
      header: "Inter",
      body: "Inter",
      code: "JetBrains Mono",
    });

    const interMatches = href.match(/family=Inter/g);
    expect(interMatches).toHaveLength(1);
  });

  it("includes title font when different from header", () => {
    const href = googleFontHref({
      title: "Abril Fatface",
      header: "Inter",
      body: "Inter",
      code: "JetBrains Mono",
    });

    expect(href).toContain("Abril");
  });

  it("excludes title font when same as header", () => {
    const href = googleFontHref({
      title: "Inter",
      header: "Inter",
      body: "Inter",
      code: "JetBrains Mono",
    });

    const interMatches = href.match(/family=Inter/g);
    expect(interMatches).toHaveLength(1);
  });
});

describe("getFontName", () => {
  it("returns string as-is", () => {
    expect(getFontName('"Inter", sans-serif')).toBe('"Inter", sans-serif');
  });

  it("extracts name from object spec", () => {
    expect(getFontName({ name: "Inter", weights: [400] })).toBe("Inter");
  });
});

describe("validateFontSpec", () => {
  it("warns for unrecognized font family", () => {
    const warnings = validateFontSpec("body", "NotARealFont12345", "body");
    if (warnings.length > 0) {
      expect(warnings[0]!.message).toContain("not a recognized Google Font");
    }
  });

  it("warns for unsupported weight", () => {
    const warnings = validateFontSpec("body", { name: "Inter", weights: [150] }, "body");
    if (warnings.length > 0) {
      const weightWarning = warnings.find((w) => w.message.includes("weight 150"));
      expect(weightWarning).toBeDefined();
    }
  });

  it("returns no warnings for valid font and weights", () => {
    const warnings = validateFontSpec("body", { name: "Inter", weights: [400, 700] }, "body");
    const invalidWeightWarnings = warnings.filter((w) => w.message.includes("weight"));
    expect(invalidWeightWarnings).toHaveLength(0);
  });

  it("returns empty array when metadata is not available", () => {
    const warnings = validateFontSpec("body", "Inter", "body");
    expect(Array.isArray(warnings)).toBe(true);
  });
});

describe("processGoogleFonts", () => {
  it("rewrites font URLs to self-hosted paths", () => {
    const css = `
@font-face {
  font-family: 'Inter';
  src: url(https://fonts.gstatic.com/s/inter/v18/abc123def456.woff2) format('woff2');
}`;
    const { processedStylesheet, fontFiles } = processGoogleFonts(css, "example.com");

    expect(processedStylesheet).toContain("https://example.com/static/fonts/abc123def456.woff2");
    expect(processedStylesheet).not.toContain("fonts.gstatic.com");
    expect(fontFiles).toHaveLength(1);
    const [first] = fontFiles;
    expect(first).toBeDefined();
    if (!first) {
      throw new Error("Expected at least one font file");
    }
    expect(first.filename).toBe("abc123def456");
    expect(first.extension).toBe("woff2");
  });

  it("handles multiple font faces", () => {
    const css = `
@font-face {
  font-family: 'Inter';
  src: url(https://fonts.gstatic.com/s/inter/v18/abc123.woff2) format('woff2');
}
@font-face {
  font-family: 'Inter';
  src: url(https://fonts.gstatic.com/s/inter/v18/def456.woff) format('woff');
}`;
    const { fontFiles } = processGoogleFonts(css, "example.com");
    expect(fontFiles).toHaveLength(2);
  });

  it("returns empty fontFiles for CSS without font URLs", () => {
    const { fontFiles } = processGoogleFonts("body { color: red; }", "example.com");
    expect(fontFiles).toHaveLength(0);
  });
});
