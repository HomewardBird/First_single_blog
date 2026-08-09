import { describe, expect, it } from "vitest";
import { EncryptedPages, decrypt } from "../src/transformer";
import { createCtx } from "./helpers";
import type { Root as HastRoot, Element } from "hast";
import { VFile } from "vfile";

function createHastTree(text: string): HastRoot {
  return {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "article",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "p",
            properties: {},
            children: [{ type: "text", value: text }],
          },
        ],
      },
    ],
  };
}

async function runTransformer(
  tree: HastRoot,
  vfile: VFile,
  options: Parameters<typeof EncryptedPages>[0] = {},
) {
  const ctx = createCtx();
  const transformer = EncryptedPages(options);
  const plugins = transformer.htmlPlugins?.(ctx) ?? [];

  for (const pluginEntry of plugins) {
    const pluginFn = Array.isArray(pluginEntry) ? pluginEntry[0] : pluginEntry;
    const attacher = pluginFn as () => (tree: HastRoot, file: VFile) => void;
    const transform = attacher();
    await transform(tree, vfile);
  }

  return { tree, vfile };
}

describe("EncryptedPages transformer", () => {
  it("skips pages without a password in frontmatter", async () => {
    const tree = createHastTree("Hello world");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Public Page" } };

    await runTransformer(tree, vfile);

    const article = tree.children[0] as Element;
    expect(article.tagName).toBe("article");
    expect((vfile.data as Record<string, unknown>).encrypted).toBeUndefined();
    expect((vfile.data as Record<string, unknown>).unlisted).toBeUndefined();
  });

  it("encrypts pages with a password in frontmatter", async () => {
    const tree = createHastTree("Secret content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Secret Page", password: "test123" } };

    await runTransformer(tree, vfile);

    const container = tree.children[0] as Element;
    expect(container.tagName).toBe("div");
    expect((container.properties?.className as string[]) ?? []).toContain("encrypted-page");

    expect(typeof container.properties?.["data-encrypted"]).toBe("string");
    expect(container.properties?.["data-iterations"]).toBe("600000");

    expect((vfile.data as Record<string, unknown>).encrypted).toBe(true);
    expect((vfile.data as Record<string, unknown>).text).toBe("");
    expect((vfile.data as Record<string, unknown>).description).toBe("");
  });

  it("can decrypt what it encrypted (roundtrip)", async () => {
    const tree = createHastTree("Roundtrip test content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "mypassword" } };

    await runTransformer(tree, vfile);

    const container = tree.children[0] as Element;
    const encryptedData = container.properties?.["data-encrypted"] as string;
    expect(encryptedData).toBeTruthy();

    const decrypted = decrypt(encryptedData, "mypassword", 600_000);
    expect(decrypted).toContain("Roundtrip test content");
  });

  it("fails to decrypt with wrong password", async () => {
    const tree = createHastTree("Protected content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "correct" } };

    await runTransformer(tree, vfile);

    const container = tree.children[0] as Element;
    const encryptedData = container.properties?.["data-encrypted"] as string;

    expect(() => decrypt(encryptedData, "wrong", 600_000)).toThrow();
  });

  it("respects custom password field name", async () => {
    const tree = createHastTree("Custom field content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", secret: "pw123" } };

    await runTransformer(tree, vfile, { passwordField: "secret" });

    const container = tree.children[0] as Element;
    expect((container.properties?.className as string[]) ?? []).toContain("encrypted-page");
    expect((vfile.data as Record<string, unknown>).encrypted).toBe(true);
  });

  it("respects custom iteration count", async () => {
    const tree = createHastTree("Custom iterations");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw" } };

    await runTransformer(tree, vfile, { iterations: 1000 });

    const container = tree.children[0] as Element;
    expect(container.properties?.["data-iterations"]).toBe("1000");

    const encryptedData = container.properties?.["data-encrypted"] as string;
    const decrypted = decrypt(encryptedData, "pw", 1000);
    expect(decrypted).toContain("Custom iterations");
  });

  it("ignores empty password string", async () => {
    const tree = createHastTree("Not encrypted");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "" } };

    await runTransformer(tree, vfile);

    const article = tree.children[0] as Element;
    expect(article.tagName).toBe("article");
    expect((vfile.data as Record<string, unknown>).encrypted).toBeUndefined();
  });

  it("ignores non-string password values", async () => {
    const tree = createHastTree("Not encrypted");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: 12345 } };

    await runTransformer(tree, vfile);

    const article = tree.children[0] as Element;
    expect(article.tagName).toBe("article");
    expect((vfile.data as Record<string, unknown>).encrypted).toBeUndefined();
  });

  it("does not mark encrypted pages as unlisted by default", async () => {
    const tree = createHastTree("Hidden content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw" } };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).encrypted).toBe(true);
    expect((vfile.data as Record<string, unknown>).unlisted).toBeUndefined();
  });

  it("marks encrypted pages as unlisted when unlistWhenEncrypted is true", async () => {
    const tree = createHastTree("Hidden content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw" } };

    await runTransformer(tree, vfile, { unlistWhenEncrypted: true });

    expect((vfile.data as Record<string, unknown>).encrypted).toBe(true);
    expect((vfile.data as Record<string, unknown>).unlisted).toBe(true);
  });

  it("does not mark non-encrypted pages as unlisted even when unlistWhenEncrypted is true", async () => {
    const tree = createHastTree("Public content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Public Page" } };

    await runTransformer(tree, vfile, { unlistWhenEncrypted: true });

    expect((vfile.data as Record<string, unknown>).encrypted).toBeUndefined();
    expect((vfile.data as Record<string, unknown>).unlisted).toBeUndefined();
  });

  it("respects frontmatter unlisted: true override without unlistWhenEncrypted", async () => {
    const tree = createHastTree("Secret");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw", unlisted: true } };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).unlisted).toBe(true);
  });

  it("respects frontmatter unlisted: false override when unlistWhenEncrypted is true", async () => {
    const tree = createHastTree("Secret");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw", unlisted: false } };

    await runTransformer(tree, vfile, { unlistWhenEncrypted: true });

    expect((vfile.data as Record<string, unknown>).encrypted).toBe(true);
    expect((vfile.data as Record<string, unknown>).unlisted).toBe(false);
  });

  it("marks encrypted pages as stealth when frontmatter.stealth is true", async () => {
    const tree = createHastTree("Stealth content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw", stealth: true } };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).encrypted).toBe(true);
    expect((vfile.data as Record<string, unknown>).stealth).toBe(true);
  });

  it("stealth implies unlisted, even when frontmatter.unlisted is absent", async () => {
    const tree = createHastTree("Stealth content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw", stealth: true } };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).unlisted).toBe(true);
  });

  it("stealth overrides explicit frontmatter.unlisted: false", async () => {
    const tree = createHastTree("Stealth content");
    const vfile = new VFile("");
    vfile.data = {
      frontmatter: { title: "Test", password: "pw", stealth: true, unlisted: false },
    };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).stealth).toBe(true);
    expect((vfile.data as Record<string, unknown>).unlisted).toBe(true);
  });

  it("does not mark non-encrypted pages as stealth even when frontmatter.stealth is true", async () => {
    const tree = createHastTree("Public content");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Public Page", stealth: true } };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).encrypted).toBeUndefined();
    expect((vfile.data as Record<string, unknown>).stealth).toBeUndefined();
    expect((vfile.data as Record<string, unknown>).unlisted).toBeUndefined();
  });

  it("ignores non-boolean stealth values (string)", async () => {
    const tree = createHastTree("Secret");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw", stealth: "true" } };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).encrypted).toBe(true);
    expect((vfile.data as Record<string, unknown>).stealth).toBeUndefined();
  });

  it("does not mark encrypted pages as stealth when stealth is false", async () => {
    const tree = createHastTree("Secret");
    const vfile = new VFile("");
    vfile.data = { frontmatter: { title: "Test", password: "pw", stealth: false, unlisted: true } };

    await runTransformer(tree, vfile);

    expect((vfile.data as Record<string, unknown>).stealth).toBeUndefined();
    expect((vfile.data as Record<string, unknown>).unlisted).toBe(true);
  });
});
