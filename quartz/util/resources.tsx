import { randomUUID } from "crypto"
import { JSX } from "preact/jsx-runtime"
import { QuartzPluginData } from "../plugins/vfile"

// Localize CDN resources so community plugins stay untouched.
// KaTeX assets are vendored into /static/katex/.
const KATEX_CSS_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
const KATEX_JS_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.js"

export function localizeResource(url: string): string {
  if (url === KATEX_CSS_URL) return "/static/katex/katex.min.css"
  if (url === KATEX_JS_URL) return "/static/katex/copy-tex.min.js"
  return url
}

export type JSResource = {
  loadTime: "beforeDOMReady" | "afterDOMReady"
  moduleType?: "module"
  spaPreserve?: boolean
} & (
  | {
      src: string
      contentType: "external"
    }
  | {
      script: string
      contentType: "inline"
    }
)

export type CSSResource = {
  content: string
  inline?: boolean
  spaPreserve?: boolean
}

export function JSResourceToScriptElement(resource: JSResource, preserve?: boolean): JSX.Element {
  const scriptType = resource.moduleType ?? "application/javascript"
  const spaPreserve = preserve ?? resource.spaPreserve

  if (resource.contentType === "external") {
    return (
      <script key={resource.src} src={resource.src} type={scriptType} data-persist={spaPreserve} />
    )
  } else {
    const content = resource.script
    return (
      <script
        key={randomUUID()}
        type={scriptType}
        data-persist={spaPreserve}
        dangerouslySetInnerHTML={{ __html: content }}
      ></script>
    )
  }
}

export function CSSResourceToStyleElement(resource: CSSResource, preserve?: boolean): JSX.Element {
  const spaPreserve = preserve ?? resource.spaPreserve
  if (resource.inline ?? false) {
    return <style dangerouslySetInnerHTML={{ __html: resource.content }} />
  } else {
    return (
      <link
        key={resource.content}
        href={resource.content}
        rel="stylesheet"
        type="text/css"
        data-persist={spaPreserve}
      />
    )
  }
}

export interface StaticResources {
  css: CSSResource[]
  js: JSResource[]
  additionalHead: (JSX.Element | ((pageData: QuartzPluginData) => JSX.Element))[]
}

export type StringResource = string | string[] | undefined

export function normalizeResource(resource: StringResource): string[] {
  if (!resource) return []
  if (Array.isArray(resource)) return resource
  return [resource]
}

export function concatenateResources(...resources: StringResource[]): StringResource {
  return resources
    .filter((resource): resource is string | string[] => resource !== undefined)
    .flat()
}
