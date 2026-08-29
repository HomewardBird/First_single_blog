/* 生成壁纸 Blur-up 占位缩略图（48px 宽，约 2KB/张），输出到 quartz/static/blur/
 * 使用：node scripts/gen-blur-thumbs.mjs
 */
import { mkdirSync, statSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"

const SRC = "quartz/static"
const OUT = join(SRC, "blur")
const FILES = ["light_bg.jpg", "dark_bg.jpg", "light.jpg", "dark.jpg"]
const WIDTH = 48

mkdirSync(OUT, { recursive: true })
for (const f of FILES) {
  const src = join(SRC, f)
  const dest = join(OUT, f)
  await sharp(src)
    .resize({ width: WIDTH })
    .jpeg({ quality: 55, chromaSubsampling: "4:2:0" })
    .toFile(dest)
  const kb = (statSync(dest).size / 1024).toFixed(1)
  const srcKb = (statSync(src).size / 1024).toFixed(0)
  console.log(`${f.padEnd(16)} ${srcKb}K -> ${kb}KB`)
}
console.log("done")
