import crypto from "node:crypto";
import type { PluggableList, Plugin } from "unified";
import type { Root as HastRoot, Element, ElementContent } from "hast";
import type { VFile } from "vfile";
import { toHtml } from "hast-util-to-html";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { EncryptedPagesOptions } from "./types";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const defaultOptions: EncryptedPagesOptions = {
  iterations: 600_000,
  passwordField: "password",
  unlistWhenEncrypted: false,
};

export function encryptAesGcm(plaintext: string, password: string, iterations: number): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  const key = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha256");

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([salt, iv, authTag, encrypted]);
  return result.toString("base64");
}

export function decrypt(encryptedBase64: string, password: string, iterations: number): string {
  const buffer = Buffer.from(encryptedBase64, "base64");

  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
  );
  const ciphertext = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha256");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
}

const rehypeEncryptedPages = (options: EncryptedPagesOptions): Plugin<[], HastRoot> => {
  return () => (tree: HastRoot, file: VFile) => {
    const frontmatter = (file.data?.frontmatter ?? {}) as Record<string, unknown>;
    const password = frontmatter[options.passwordField];

    if (typeof password !== "string" || password.length === 0) {
      return;
    }

    const html = toHtml(tree, { allowDangerousHtml: true });

    const encryptedData = encryptAesGcm(html, password, options.iterations);

    const encryptedContainer: Element = {
      type: "element",
      tagName: "div",
      properties: {
        className: ["encrypted-page", "popover-hint"],
        "data-encrypted": encryptedData,
        "data-iterations": String(options.iterations),
      },
      children: [],
    };

    tree.children = [encryptedContainer as ElementContent];

    const data = file.data as Record<string, unknown>;
    data.encrypted = true;
    data.text = "";
    data.description = "";

    const frontmatterUnlisted = frontmatter.unlisted;
    if (typeof frontmatterUnlisted === "boolean") {
      data.unlisted = frontmatterUnlisted;
    } else if (options.unlistWhenEncrypted) {
      data.unlisted = true;
    }

    if (frontmatter.stealth === true) {
      data.stealth = true;
      data.unlisted = true;
    }
  };
};

export const EncryptedPages: QuartzTransformerPlugin<Partial<EncryptedPagesOptions>> = (
  userOptions?: Partial<EncryptedPagesOptions>,
) => {
  const options = { ...defaultOptions, ...userOptions };
  return {
    name: "EncryptedPages",
    htmlPlugins(): PluggableList {
      return [rehypeEncryptedPages(options)];
    },
  };
};
