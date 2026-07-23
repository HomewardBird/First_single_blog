import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { Root as HastRoot, Element } from "hast";
import { VFile } from "vfile";
import { EncryptedContentIndex, SHADOW_INDEX_VERSION } from "../src/emitter";
import type { ShadowIndexFile, ShadowContentIndexEntry } from "../src/emitter";
import { decrypt } from "../src/transformer";
import { createCtx } from "./helpers";
import type { ProcessedContent } from "@quartz-community/types";

function makeEncryptedContent(
  slug: string,
  password: string,
  opts: {
    unlisted?: boolean;
    stealth?: boolean;
    title?: string;
    tags?: string[];
    links?: string[];
    iterations?: number;
  } = {},
): ProcessedContent {
  const tree: HastRoot = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "div",
        properties: {
          className: ["encrypted-page", "popover-hint"],
          "data-encrypted": "opaque-ciphertext",
          "data-iterations": String(opts.iterations ?? 600_000),
        },
        children: [],
      } as Element,
    ],
  };

  const vfile = new VFile("");
  const data: Record<string, unknown> = {
    slug,
    relativePath: `${slug}.md`,
    encrypted: true,
    unlisted: opts.unlisted ?? true,
    text: "",
    description: "",
    links: opts.links ?? [],
    frontmatter: {
      title: opts.title ?? slug,
      password,
      tags: opts.tags ?? [],
    },
  };
  if (opts.stealth) data.stealth = true;
  vfile.data = data;

  return [tree, vfile];
}

function makeNonEncryptedContent(slug: string): ProcessedContent {
  const tree: HastRoot = { type: "root", children: [] };
  const vfile = new VFile("");
  vfile.data = {
    slug,
    relativePath: `${slug}.md`,
    text: "public content",
    frontmatter: { title: slug },
  } as Record<string, unknown>;
  return [tree, vfile];
}

describe("EncryptedContentIndex emitter", () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "encpages-emitter-test-"));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  async function runEmitter(content: ProcessedContent[]): Promise<ShadowIndexFile> {
    const ctx = createCtx({ argv: { output: outputDir } });
    const emitter = EncryptedContentIndex();
    const paths = await emitter.emit(ctx, content, { css: [], js: [], additionalHead: [] });
    expect(Array.isArray(paths)).toBe(true);
    const outputs = paths as string[];
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toMatch(/encryptedContentIndex\.json$/);
    const raw = await fs.readFile(outputs[0]!, "utf8");
    return JSON.parse(raw) as ShadowIndexFile;
  }

  it("emits a versioned JSON file with a flat entries array", async () => {
    const content = [makeEncryptedContent("secret/page-a", "pw1")];
    const shadow = await runEmitter(content);

    expect(shadow.version).toBe(SHADOW_INDEX_VERSION);
    expect(Array.isArray(shadow.entries)).toBe(true);
    expect(shadow.entries).toHaveLength(1);
    expect(typeof shadow.entries[0]!.ciphertext).toBe("string");
    expect(shadow.entries[0]!.iterations).toBe(600_000);
  });

  it("each entry roundtrips to the original content index entry", async () => {
    const content = [
      makeEncryptedContent("secret/page-a", "pw1", {
        title: "Page A",
        tags: ["secret", "alpha"],
        links: ["other/page"],
      }),
    ];
    const shadow = await runEmitter(content);

    const blob = shadow.entries[0]!;
    const plaintext = decrypt(blob.ciphertext, "pw1", blob.iterations);
    const decoded = JSON.parse(plaintext) as ShadowContentIndexEntry;

    expect(decoded.slug).toBe("secret/page-a");
    expect(decoded.entry.slug).toBe("secret/page-a");
    expect(decoded.entry.title).toBe("Page A");
    expect(decoded.entry.tags).toEqual(["secret", "alpha"]);
    expect(decoded.entry.links).toEqual(["other/page"]);
    expect(decoded.entry.content).toBe("");
    expect(decoded.entry.description).toBe("");
  });

  it("skips non-encrypted pages", async () => {
    const content = [
      makeNonEncryptedContent("public/page"),
      makeEncryptedContent("secret/page-a", "pw1"),
    ];
    const shadow = await runEmitter(content);

    expect(shadow.entries).toHaveLength(1);
  });

  it("skips encrypted pages that are NOT unlisted", async () => {
    const content = [makeEncryptedContent("secret/page-a", "pw1", { unlisted: false })];
    const shadow = await runEmitter(content);

    expect(shadow.entries).toHaveLength(0);
  });

  it("skips pages with missing passwords", async () => {
    const [tree, vfile] = makeEncryptedContent("secret/a", "pw1");
    delete (vfile.data as Record<string, unknown>).frontmatter;
    const shadow = await runEmitter([[tree, vfile]]);

    expect(shadow.entries).toHaveLength(0);
  });

  it("encrypts with per-page iteration count from the tree", async () => {
    const content = [makeEncryptedContent("secret/page-a", "pw1", { iterations: 1000 })];
    const shadow = await runEmitter(content);

    expect(shadow.entries[0]!.iterations).toBe(1000);
    const plaintext = decrypt(shadow.entries[0]!.ciphertext, "pw1", 1000);
    const decoded = JSON.parse(plaintext) as ShadowContentIndexEntry;
    expect(decoded.slug).toBe("secret/page-a");
  });

  it("produces independent ciphertexts for multiple pages with the same password", async () => {
    const content = [
      makeEncryptedContent("secret/a", "samepw", { title: "A" }),
      makeEncryptedContent("secret/b", "samepw", { title: "B" }),
    ];
    const shadow = await runEmitter(content);

    expect(shadow.entries).toHaveLength(2);
    expect(shadow.entries[0]!.ciphertext).not.toBe(shadow.entries[1]!.ciphertext);

    const decodedA = JSON.parse(
      decrypt(shadow.entries[0]!.ciphertext, "samepw", 600_000),
    ) as ShadowContentIndexEntry;
    const decodedB = JSON.parse(
      decrypt(shadow.entries[1]!.ciphertext, "samepw", 600_000),
    ) as ShadowContentIndexEntry;

    const titles = new Set([decodedA.entry.title, decodedB.entry.title]);
    expect(titles).toEqual(new Set(["A", "B"]));
  });

  it("emits a valid empty shadow index when no encrypted+unlisted pages exist", async () => {
    const content = [makeNonEncryptedContent("public/page")];
    const shadow = await runEmitter(content);

    expect(shadow.version).toBe(SHADOW_INDEX_VERSION);
    expect(shadow.entries).toEqual([]);
  });

  it("skips stealth pages from the shadow index", async () => {
    const content = [makeEncryptedContent("secret/stealth", "pw1", { stealth: true })];
    const shadow = await runEmitter(content);

    expect(shadow.entries).toHaveLength(0);
  });

  it("includes non-stealth pages alongside stealth pages (only stealth is skipped)", async () => {
    const content = [
      makeEncryptedContent("secret/revealable", "pw1"),
      makeEncryptedContent("secret/stealth", "pw1", { stealth: true }),
      makeEncryptedContent("secret/also-revealable", "pw1"),
    ];
    const shadow = await runEmitter(content);

    expect(shadow.entries).toHaveLength(2);

    const decoded = shadow.entries.map(
      (e) => JSON.parse(decrypt(e.ciphertext, "pw1", e.iterations)) as ShadowContentIndexEntry,
    );
    const slugs = new Set(decoded.map((d) => d.slug));
    expect(slugs).toEqual(new Set(["secret/revealable", "secret/also-revealable"]));
    expect(slugs.has("secret/stealth")).toBe(false);
  });
});
