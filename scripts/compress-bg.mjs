import sharp from "sharp"
import { statSync, readFileSync, writeFileSync, renameSync } from "fs"

const dirs = ["quartz/static/", "public/static/"]
const files = ["light.jpg", "dark.jpg", "light_bg.jpg", "dark_bg.jpg"]
for (const dir of dirs) {
  for (const f of files) {
    const p = dir + f
    const before = statSync(p).size
    const meta = await sharp(p).metadata()
    const out = await sharp(readFileSync(p))
      .resize({ width: Math.min(meta.width, 1920), withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer()
    writeFileSync(p + ".tmp", out)
    renameSync(p + ".tmp", p)
    console.log(`${p}: ${(before / 1024).toFixed(0)}KB -> ${(statSync(p).size / 1024).toFixed(0)}KB`)
  }
}
