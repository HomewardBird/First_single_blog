import sharp from "sharp"
import { statSync, readFileSync, writeFileSync, renameSync } from "fs"

const dirs = ["quartz/static/", "public/static/"]
const files = ["light.webp", "dark.webp", "light_bg.webp", "dark_bg.webp"]
// 高斯模糊直接烘焙进图片（设计上背景要柔和，CSS 端不再叠加 filter，
// 弱机 GPU 零开销）。sigma 按宽度等比缩放，各尺寸观感一致。
const BLUR_SIGMA_AT_1920 = 4
for (const dir of dirs) {
  for (const f of files) {
    const p = dir + f
    const before = statSync(p).size
    const meta = await sharp(p).metadata()
    const w = Math.min(meta.width, 1920)
    const sigma = (BLUR_SIGMA_AT_1920 * w) / 1920
    let img = sharp(readFileSync(p))
      .resize({ width: w, withoutEnlargement: true })
      .blur(sigma)
    const out = f.endsWith(".webp")
      ? await img.webp({ quality: 72 }).toBuffer()
      : await img.jpeg({ quality: 72, mozjpeg: true }).toBuffer()
    writeFileSync(p + ".tmp", out)
    renameSync(p + ".tmp", p)
    console.log(
      `${p}: ${(before / 1024).toFixed(0)}KB -> ${(statSync(p).size / 1024).toFixed(0)}KB (blur σ=${sigma.toFixed(1)})`,
    )
  }
}
