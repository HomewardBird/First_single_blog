import test, { describe } from "node:test"
import assert from "node:assert"
import { JSDOM } from "jsdom"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const customJs = readFileSync(path.join(__dirname, "..", "static", "custom.js"), "utf8")

const HTML = `<!DOCTYPE html><html><body>
<div id="top-bar"><div class="top-bar-inner">
  <button id="nav-toggle-btn" class="tb-action-btn"></button>
  <span class="top-bar-title">test</span>
  <div class="top-bar-right">
    <button id="tb-search-btn"></button>
    <button id="tb-theme-btn"></button>
    <button id="hamburger-btn" class="hamburger-btn" aria-expanded="false" aria-controls="hamburger-menu">
      <span class="hamburger-line"></span><span class="hamburger-line"></span><span class="hamburger-line"></span>
    </button>
  </div>
</div></div>
<div class="left sidebar"><div class="explorer collapsed" aria-expanded="false">
  <button type="button" class="explorer-toggle mobile-explorer"><svg class="lucide-menu"></svg></button>
  <button type="button" class="title-button explorer-toggle desktop-explorer"><h2>目录</h2></button>
  <div class="explorer-content" aria-expanded="false"><ul class="explorer-ul"><li><a href="#">item</a></li></ul></div>
</div></div>
<div id="quartz-body"><article>content</article><span id="random-quote"></span></div>
</body></html>`

function setup() {
  const dom = new JSDOM(HTML, {
    url: "http://localhost/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  })
  const { window } = dom
  const { document } = window
  // jsdom 无 checkVisibility；模拟移动端（mobile-explorer 可见）
  window.Element.prototype.checkVisibility = function () {
    return true
  }
  // jsdom 无 matchMedia；stub 为移动端，使交互走 custom.js 自带的
  // toggleMobileExplorer 路径（explorer 插件脚本不会在测试环境加载）
  window.matchMedia = ((query: string) => ({
    matches: query.includes("max-width: 800px"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  window.eval(customJs)
  document.dispatchEvent(new window.Event("DOMContentLoaded") as UIEvent)
  const click = (sel: string) => {
    const el = document.querySelector(sel)
    if (!el) throw new Error(`element not found: ${sel}`)
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }))
  }
  const pressEscape = () => {
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
  }
  const menu = () => document.getElementById("hamburger-menu")
  const explorer = () => document.querySelector(".explorer")
  const isExplorerOpen = () => !explorer()!.classList.contains("collapsed")
  const isMenuOpen = () => menu()!.classList.contains("open")
  return { window, document, click, pressEscape, menu, explorer, isExplorerOpen, isMenuOpen }
}

describe("topbar 交互", () => {
  test("左侧按钮：目录开关", () => {
    const t = setup()
    t.click("#nav-toggle-btn")
    assert.ok(t.isExplorerOpen(), "点击后目录展开")
    assert.ok(!t.isMenuOpen(), "设置面板未打开")
    t.click("#nav-toggle-btn")
    assert.ok(!t.isExplorerOpen(), "再点目录收起")
  })

  test("右侧按钮：设置面板开关", () => {
    const t = setup()
    t.click("#hamburger-btn")
    assert.ok(t.isMenuOpen(), "设置面板打开")
    assert.ok(!t.isExplorerOpen(), "目录不受影响")
    t.click("#hamburger-btn")
    assert.ok(!t.isMenuOpen(), "再点设置面板关闭")
  })

  test("两侧互不干扰", () => {
    const t = setup()
    t.click("#nav-toggle-btn")
    t.click("#hamburger-btn")
    assert.ok(t.isExplorerOpen(), "目录保持展开")
    assert.ok(t.isMenuOpen(), "设置面板已打开")
    t.click("#hamburger-btn")
    t.click("#nav-toggle-btn")
    assert.ok(!t.isExplorerOpen(), "目录已收起")
    assert.ok(!t.isMenuOpen(), "设置面板已关闭")
  })

  test("点击面板外关闭", () => {
    const t = setup()
    t.click("#hamburger-btn")
    assert.ok(t.isMenuOpen(), "面板打开")
    t.click("#quartz-body")
    assert.ok(!t.isMenuOpen(), "点击外部关闭")
  })

  test("SPA 导航后绑定不丢失", () => {
    const t = setup()
    const bodyHtml = HTML.match(/<body>[\s\S]*<\/body>/)![0].replace(/<\/?body>/g, "")
    for (let i = 0; i < 3; i++) {
      t.document.body.innerHTML = bodyHtml
      t.document.dispatchEvent(new t.window.UIEvent("nav"))
    }
    t.click("#nav-toggle-btn")
    assert.ok(t.isExplorerOpen(), "多次导航后目录仍可一次打开")
    t.click("#hamburger-btn")
    assert.ok(t.isMenuOpen(), "多次导航后设置面板仍可打开")
  })
})

describe("Esc 键统一关闭", () => {
  test("Esc 关闭设置面板", () => {
    const t = setup()
    t.click("#hamburger-btn")
    assert.ok(t.isMenuOpen())
    t.pressEscape()
    assert.ok(!t.isMenuOpen(), "Esc 关闭设置面板")
  })

  test("Esc 关闭目录", () => {
    const t = setup()
    t.click("#nav-toggle-btn")
    assert.ok(t.isExplorerOpen())
    t.pressEscape()
    assert.ok(!t.isExplorerOpen(), "Esc 关闭目录")
  })
})

describe("焦点管理", () => {
  test("打开设置面板时焦点移入面板，关闭后归还", () => {
    const t = setup()
    const btn = t.document.querySelector("#hamburger-btn") as HTMLElement
    btn.focus()
    t.click("#hamburger-btn")
    const active = t.document.activeElement
    assert.ok(active !== btn, "焦点移入面板")
    assert.ok(
      (active?.closest?.("#hamburger-menu") ?? false),
      "焦点在设置面板内",
    )
    t.click("#hamburger-btn")
    assert.strictEqual(t.document.activeElement, btn, "关闭后焦点归还按钮")
  })

  test("目录面板带 dialog 语义", () => {
    const t = setup()
    t.click("#nav-toggle-btn")
    const content = t.explorer()!.querySelector(".explorer-content")
    assert.strictEqual(content?.getAttribute("role"), "dialog", "role=dialog")
    assert.strictEqual(content?.getAttribute("aria-modal"), "true", "aria-modal=true")
    t.click("#nav-toggle-btn")
    assert.strictEqual(content?.getAttribute("role"), null, "收起后移除 role")
  })
})

describe("回到顶部按钮", () => {
  test("SPA 导航后重建（micromorph 会清掉 body 上的按钮）", () => {
    const t = setup()
    const btn = () => t.document.getElementById("back-to-top")
    assert.ok(btn(), "首次加载即创建按钮")
    // 模拟 SPA 导航：micromorph 用服务端新 body 替换当前 body
    const bodyHtml = HTML.match(/<body>[\s\S]*<\/body>/)![0].replace(/<\/?body>/g, "")
    for (let i = 0; i < 3; i++) {
      t.document.body.innerHTML = bodyHtml
      t.document.dispatchEvent(new t.window.UIEvent("nav"))
    }
    assert.ok(btn(), "多次导航后按钮被重建")
  })

  test("滚动超过一屏才显示，回顶后隐藏", () => {
    const t = setup()
    const btn = () => t.document.getElementById("back-to-top")!
    Object.defineProperty(t.window, "scrollY", { value: 800, configurable: true })
    t.window.dispatchEvent(new t.window.Event("scroll"))
    assert.ok(btn().classList.contains("show"), "滚动 800px 后显示")
    Object.defineProperty(t.window, "scrollY", { value: 0, configurable: true })
    t.window.dispatchEvent(new t.window.Event("scroll"))
    assert.ok(!btn().classList.contains("show"), "回到顶部后隐藏")
  })
})

describe("quotes 缓存", () => {  test("quotes 加载失败回退文案", async () => {
    const t = setup()
    // jsdom 中 fetch 不可用（或 404），应回退到欢迎文案而非抛错
    await new Promise((r) => setTimeout(r, 30))
    const el = t.document.getElementById("random-quote")
    assert.ok(el, "random-quote 元素存在")
    assert.ok(el!.textContent!.length > 0, "已渲染文案")
  })
})
