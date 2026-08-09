#!/usr/bin/env node
// 注册 .scss/.css 存根 loader，避免 tsx 加载样式导入时崩溃
import "./scss-stub-hook.mjs"
import fs from "fs"
import path from "path"
import YAML from "yaml"
import { installPlugins, parsePluginSource } from "./gitLoader.js"

/**
 * 直接从 quartz.config.yaml 读取插件源列表。
 * 不 import 整个 config —— 那会拖入组件/布局/样式加载链（tsx 下 .scss 等无法解析）。
 */
function readConfigPluginSources(): string[] {
  for (const name of ["quartz.config.yaml", "quartz.config.default.yaml"]) {
    const configPath = path.join(process.cwd(), name)
    if (!fs.existsSync(configPath)) continue
    try {
      const cfg = YAML.parse(fs.readFileSync(configPath, "utf8"))
      const sources = (cfg.plugins ?? [])
        .map((entry: { source?: string }) => entry.source)
        .filter((s: unknown): s is string => typeof s === "string")
      if (sources.length > 0) return sources
    } catch (err) {
      console.error(`Failed to parse ${name}:`, err)
    }
  }
  return []
}

async function main() {
  const externalPlugins = readConfigPluginSources()

  if (externalPlugins.length === 0) {
    console.log("No external plugins to install.")
    return
  }

  console.log(`Installing ${externalPlugins.length} plugin(s) from Git...`)

  const specs = externalPlugins.map((source: string) => parsePluginSource(source))
  const installed = await installPlugins(specs, { verbose: true })

  if (installed.size === externalPlugins.length) {
    console.log("✓ All plugins installed successfully")
  } else {
    console.error(`✗ Only ${installed.size}/${externalPlugins.length} plugins installed`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Failed to install plugins:", err)
  process.exit(1)
})
