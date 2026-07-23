import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin, QuartzPageTypePluginInstance } from "../types"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"
import { Argv, BuildCtx } from "../../util/ctx"
import { QuartzConfig } from "../../cfg"

function getPageTypeExtensions(ctx: BuildCtx): Set<string> {
  const extensions = new Set<string>()
  const pageTypes = (ctx.cfg.plugins.pageTypes ?? []) as unknown as QuartzPageTypePluginInstance[]
  for (const pt of pageTypes) {
    if (pt.fileExtensions) {
      for (const ext of pt.fileExtensions) {
        extensions.add(ext)
      }
    }
  }
  return extensions
}

const ROOT_ROOT_FILES = [
  "dark_bg.mp4", "light_bg.mp4",
  "static/dark_bg.mp4", "static/light_bg.mp4",
  "quotes.json",
  "static/05 Coffee Cats.m4a",
  "static/1-28 希望的明⽇.m4a",
  "static/2-06 玉磬漻漻.m4a",
  "static/2-16 风清月白.m4a",
  "static/26 Welcome School.m4a",
  "static/ornave-lofi-moon-light-553399.mp3",
  "static/monume-lofi-chill-chill-509496.mp3",
  "static/mao690276--527415.mp3",
  "static/lofidreams-cozy-lofi-background-music-for-study-457198.mp3",
  "static/apalonbeats-lofi-lofi-music-lofi-chill-2-560425.mp3",
]

const filesToCopy = async (argv: Argv, cfg: QuartzConfig, excludeExtensions: Set<string>) => {
  const excludePatterns = ["**/*.md", ...cfg.configuration.ignorePatterns]
  for (const ext of excludeExtensions) {
    excludePatterns.push(`**/*${ext}`)
  }
  return await glob("**", argv.directory, excludePatterns)
}

const copyFile = async (argv: Argv, fp: FilePath) => {
  const src = joinSegments(argv.directory, fp) as FilePath

  const name = slugifyFilePath(fp)
  const dest = joinSegments(argv.output, name) as FilePath

  const dir = path.dirname(dest) as FilePath
  await fs.promises.mkdir(dir, { recursive: true })

  await fs.promises.copyFile(src, dest)
  return dest
}

const copyRootFile = async (argv: Argv, rootFile: string) => {
  const src = path.join(process.cwd(), rootFile)
  const dest = joinSegments(argv.output, rootFile) as FilePath

  const dir = path.dirname(dest) as FilePath
  await fs.promises.mkdir(dir, { recursive: true })

  await fs.promises.copyFile(src, dest)
  return dest
}

export const Assets: QuartzEmitterPlugin = () => {
  return {
    name: "Assets",
    async *emit(ctx) {
      const excludeExtensions = getPageTypeExtensions(ctx)
      const fps = await filesToCopy(ctx.argv, ctx.cfg, excludeExtensions)
      for (const fp of fps) {
        yield copyFile(ctx.argv, fp)
      }

      for (const rootFile of ROOT_ROOT_FILES) {
        const rootPath = path.join(process.cwd(), rootFile)
        if (fs.existsSync(rootPath)) {
          yield copyRootFile(ctx.argv, rootFile)
        }
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      const excludeExtensions = getPageTypeExtensions(ctx)
      for (const changeEvent of changeEvents) {
        const ext = path.extname(changeEvent.path)
        if (ext === ".md" || excludeExtensions.has(ext)) continue

        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield copyFile(ctx.argv, changeEvent.path)
        } else if (changeEvent.type === "delete") {
          const name = slugifyFilePath(changeEvent.path)
          const dest = joinSegments(ctx.argv.output, name) as FilePath
          await fs.promises.unlink(dest)
        }
      }
    },
  }
}
