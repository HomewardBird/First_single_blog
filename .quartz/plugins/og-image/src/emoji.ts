type EmojiMap = {
  codePointToName: Record<string, string>;
  nameToBase64: Record<string, string>;
};

let emojimap: EmojiMap | undefined = undefined;
export async function loadEmoji(code: string) {
  if (!emojimap) {
    const path = await import("node:path");
    const fs = await import("node:fs/promises");
    const mapPath = path.join("quartz", "util", "emojimap.json");
    const data = JSON.parse(await fs.readFile(mapPath, "utf-8"));
    emojimap = data;
  }

  const name = emojimap!.codePointToName[`${code.toUpperCase()}`];
  if (!name) throw new Error(`codepoint ${code} not found in map`);

  const b64 = emojimap!.nameToBase64[name];
  if (!b64) throw new Error(`name ${name} not found in map`);

  return b64;
}
