import sharp from "sharp"
import { statSync, readFileSync, writeFileSync, renameSync } from "fs"

const dirs = ["quartz/static/", "public/static/"]
const files = ["light.webp", "dark.webp", "light_bg.webp", "dark_bg.webp"]
for (const dir of dirs) {
  for (const f of files) {
    const p = dir + f
    const before = statSync(p).size
    const meta = await sharp(p).metadata()
    let img = sharp(readFileSync(p)).resize({
      width: Math.min(meta.width, 1920),
      withoutEnlargement: true,
    })
    const out = f.endsWith(".webp")
      ? await img.webp({ quality: 72 }).toBuffer()
      : await img.jpeg({ quality: 72, mozjpeg: true }).toBuffer()
    writeFileSync(p + ".tmp", out)
    renameSync(p + ".tmp", p)
    console.log(
      `${p}: ${(before / 1024).toFixed(0)}KB -> ${(statSync(p).size / 1024).toFixed(0)}KB`,
    )
  }
}
