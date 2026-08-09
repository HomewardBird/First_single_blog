// tsx/Node ESM loader 钩子：将 .scss/.css 导入存根为空模块，
// 使 install-plugins 等 tsx 脚本能加载依赖样式的模块（样式值仅构建期有意义）。
// 本文件同时是 loader（导出 resolve/load）和副作用注册模块（import 即生效）。
import { register } from "node:module"

const stub = `
export default {}
`

export function resolve(specifier, context, next) {
  if (specifier.endsWith(".scss") || specifier.endsWith(".css")) {
    return next(specifier, {
      ...context,
      importAttributes: { ...context.importAttributes, type: undefined },
    })
  }
  return next(specifier, context)
}

export function load(url, context, next) {
  if (url.endsWith(".scss") || url.endsWith(".css")) {
    return { format: "module", source: stub, shortCircuit: true }
  }
  return next(url, context)
}

register(new URL("./scss-stub-hook.mjs", import.meta.url))
