import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { VFile } from "vfile";
import type { Root } from "hast";
import type { BuildCtx, FilePath, FullSlug, ProcessedContent } from "@quartz-community/types";
import { AliasRedirects, _resetFsDetectionCache } from "../src/index.js";

function makeBuildCtx(outputDir: string): BuildCtx {
  return {
    buildId: "test-build",
    argv: {
      directory: "content",
      verbose: false,
      output: outputDir,
      serve: false,
      watch: false,
      port: 8080,
      wsPort: 3001,
    },
    cfg: {
      configuration: {},
      plugins: { transformers: [], filters: [], emitters: [], pageTypes: [] },
    },
    allSlugs: [],
    allFiles: [],
    incremental: false,
  } as unknown as BuildCtx;
}

function makeFile(opts: { slug: string; relativePath: string; aliases?: string[] }): VFile {
  const file = new VFile("");
  file.data.slug = opts.slug as FullSlug;
  (file.data as Record<string, unknown>).relativePath = opts.relativePath as FilePath;
  if (opts.aliases) {
    (file.data as Record<string, unknown>).aliases = opts.aliases;
  }
  return file;
}

function makeContent(file: VFile): ProcessedContent {
  const tree: Root = { type: "root", children: [] };
  return [tree, file];
}

async function collectEmitted(
  gen: AsyncGenerator<FilePath> | Promise<FilePath[]>,
): Promise<FilePath[]> {
  if (Symbol.asyncIterator in (gen as object)) {
    const results: FilePath[] = [];
    for await (const fp of gen as AsyncGenerator<FilePath>) {
      results.push(fp);
    }
    return results;
  }
  return gen as Promise<FilePath[]>;
}

describe("AliasRedirects", () => {
  let tmpDir: string;
  let ctx: BuildCtx;

  beforeEach(async () => {
    _resetFsDetectionCache();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "alias-redirects-test-"));
    ctx = makeBuildCtx(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("frontmatter alias redirects", () => {
    it("generates redirect pages for frontmatter aliases", async () => {
      const file = makeFile({
        slug: "notes/my-note",
        relativePath: "notes/my-note.md",
        aliases: ["old-url"],
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(1);
      const html = await fs.readFile(emitted[0]!, "utf-8");
      expect(html).toContain('<meta http-equiv="refresh"');
      expect(html).toContain('<link rel="canonical"');
      expect(html).toContain('<meta name="robots" content="noindex">');
    });

    it("generates multiple redirect pages for multiple aliases", async () => {
      const file = makeFile({
        slug: "notes/my-note",
        relativePath: "notes/my-note.md",
        aliases: ["old-url-1", "old-url-2"],
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(2);
    });

    it("generates no redirect pages when no aliases exist", async () => {
      const file = makeFile({
        slug: "notes/my-note",
        relativePath: "notes/my-note.md",
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(0);
    });
  });

  describe("case redirects", () => {
    it("generates a redirect when relativePath has uppercase characters", async () => {
      const file = makeFile({
        slug: "diary/2026-01-01",
        relativePath: "Diary/2026-01-01.md",
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(1);
      const writtenPath = emitted[0]!;
      expect(writtenPath).toContain("Diary/2026-01-01.html");

      const html = await fs.readFile(writtenPath, "utf-8");
      expect(html).toContain('<meta http-equiv="refresh"');
      expect(html).toContain('<link rel="canonical"');
      expect(html).toContain('<meta name="robots" content="noindex">');
    });

    it("does not generate a redirect when path is already lowercase", async () => {
      const file = makeFile({
        slug: "diary/2026-01-01",
        relativePath: "diary/2026-01-01.md",
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(0);
    });

    it("does not generate a redirect when enableCaseRedirects is false", async () => {
      const file = makeFile({
        slug: "diary/2026-01-01",
        relativePath: "Diary/2026-01-01.md",
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects({ enableCaseRedirects: false });
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(0);
    });

    it("handles uppercase in multiple path segments", async () => {
      const file = makeFile({
        slug: "my-folder/my-note",
        relativePath: "My Folder/My Note.md",
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(1);
      const writtenPath = emitted[0]!;
      expect(writtenPath).toContain("My-Folder/My-Note.html");
    });

    it("does not duplicate when alias already covers the case-preserved path", async () => {
      const file = makeFile({
        slug: "diary/note",
        relativePath: "Diary/Note.md",
        aliases: ["Diary/Note"],
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(1);
    });

    it("generates both alias and case redirect when they target different paths", async () => {
      const file = makeFile({
        slug: "diary/note",
        relativePath: "Diary/Note.md",
        aliases: ["old-diary-note"],
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(2);
    });

    it("handles special characters in path alongside case changes", async () => {
      const file = makeFile({
        slug: "notes/q-and-a",
        relativePath: "Notes/Q&A.md",
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      expect(emitted).toHaveLength(1);
      const writtenPath = emitted[0]!;
      expect(writtenPath).toContain("Notes/Q-and-A.html");
    });
  });

  describe("redirect HTML content", () => {
    it("contains all required SEO elements", async () => {
      const file = makeFile({
        slug: "diary/note",
        relativePath: "Diary/Note.md",
      });
      const content = [makeContent(file)];
      const plugin = AliasRedirects();
      const emitted = await collectEmitted(plugin.emit(ctx, content, {} as never));

      const html = await fs.readFile(emitted[0]!, "utf-8");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<html lang="en-us">');
      expect(html).toContain('<link rel="canonical"');
      expect(html).toContain('<meta name="robots" content="noindex">');
      expect(html).toContain('<meta charset="utf-8">');
      expect(html).toContain('content="0; url=');
    });
  });

  describe("partialEmit", () => {
    it("generates case redirects for added files", async () => {
      const file = makeFile({
        slug: "diary/note",
        relativePath: "Diary/Note.md",
      });
      const plugin = AliasRedirects();
      const changeEvents = [{ type: "add" as const, path: "Diary/Note.md" as FilePath, file }];
      const emitted = await collectEmitted(
        plugin.partialEmit!(ctx, [], {} as never, changeEvents) as AsyncGenerator<FilePath>,
      );

      expect(emitted).toHaveLength(1);
    });

    it("generates case redirects for changed files", async () => {
      const file = makeFile({
        slug: "diary/note",
        relativePath: "Diary/Note.md",
      });
      const plugin = AliasRedirects();
      const changeEvents = [{ type: "change" as const, path: "Diary/Note.md" as FilePath, file }];
      const emitted = await collectEmitted(
        plugin.partialEmit!(ctx, [], {} as never, changeEvents) as AsyncGenerator<FilePath>,
      );

      expect(emitted).toHaveLength(1);
    });

    it("does not generate redirects for deleted files", async () => {
      const plugin = AliasRedirects();
      const changeEvents = [
        { type: "delete" as const, path: "Diary/Note.md" as FilePath, file: undefined },
      ];
      const emitted = await collectEmitted(
        plugin.partialEmit!(ctx, [], {} as never, changeEvents) as AsyncGenerator<FilePath>,
      );

      expect(emitted).toHaveLength(0);
    });
  });
});
