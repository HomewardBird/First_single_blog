import type { ProcessedFontResult, GoogleFontFile } from "../types";

const fontMimeMap: Record<string, string> = {
  truetype: "ttf",
  woff: "woff",
  woff2: "woff2",
  opentype: "otf",
};

const fontUrlPattern =
  /url\((https:\/\/fonts.gstatic.com\/.+(?:\/|(?:kit=))(.+?)[.&].+?)\)\sformat\('(\w+?)'\);/g;

export function processGoogleFonts(stylesheet: string, baseUrl: string): ProcessedFontResult {
  const fontFiles: GoogleFontFile[] = [];

  const processedStylesheet = stylesheet.replace(
    fontUrlPattern,
    (match, url: string, filename: string, format: string) => {
      const extension = fontMimeMap[format] ?? format;
      const rewrittenUrl = `https://${baseUrl}/static/fonts/${filename}.${extension}`;
      fontFiles.push({ url, filename, extension });
      return match.replace(url, rewrittenUrl);
    },
  );

  return { processedStylesheet, fontFiles };
}
