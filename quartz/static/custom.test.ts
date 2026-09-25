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
<div id="quartz-body"><input class="search-bar" /><article>content</article><span id="random-quote"></span></div>
</body></html>`

function setup(url = "http://localhost/") {
  const dom = new JSDOM(HTML, {
    url,
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

  test("右侧菜单：顶部关闭按钮可直接关闭", () => {
    const t = setup()
    t.click("#hamburger-btn")
    assert.ok(t.isMenuOpen(), "面板打开")
    const closeBtn = t.document.querySelector("#hamburger-close-btn")
    assert.ok(closeBtn, "存在关闭按钮")
    t.click("#hamburger-close-btn")
    assert.ok(!t.isMenuOpen(), "点击关闭按钮后关闭")
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

describe("季节粒子", () => {
  test("默认按访客时间渲染当前季节粒子层", () => {
    const t = setup()
    const layer = t.document.getElementById("season-particles")
    assert.ok(layer, "粒子层已创建")
    const season = layer!.getAttribute("data-season")
    assert.ok(["spring", "summer", "autumn", "winter"].includes(season ?? ""), "季节取值合法")
    assert.ok(layer!.querySelectorAll(".sp").length > 0, "包含粒子")
    assert.ok(layer!.querySelector(".sp-in"), "粒子有内层造型节点")
  })

  test("夏季渲染流萤而非雪花", () => {
    const t = setup("http://localhost/?season=summer")
    const layer = t.document.getElementById("season-particles")!
    assert.ok(layer.querySelectorAll(".sp-firefly, .sp-firefly-dim").length > 0, "夏季为流萤")
    assert.strictEqual(layer.querySelectorAll(".sp-snow, .sp-snow-soft").length, 0, "夏季无雪花")
  })

  test("四季各有独立运动类型", () => {
    const cases: [string, string][] = [
      ["spring", "sp-m-petal"],
      ["summer", "sp-m-firefly"],
      ["autumn", "sp-m-leaf"],
      ["winter", "sp-m-snow"],
    ]
    for (const [season, cls] of cases) {
      const t = setup(`http://localhost/?season=${season}`)
      const layer = t.document.getElementById("season-particles")!
      assert.ok(layer.querySelector(`.${cls}`), `${season} 使用 ${cls}`)
      assert.ok(layer.querySelector(`.${cls} .sp-in`), `${cls} 有内层运动节点`)
    }
  })

  test("粒子带统一风向变量（全局同向）", () => {
    const t = setup("http://localhost/?season=autumn")
    const layer = t.document.getElementById("season-particles")!
    const winds = Array.from(layer.querySelectorAll(".sp")).map((el) => {
      const m = /--wind:(-?[\d.]+)vw/.exec(el.getAttribute("style") || "")
      return m ? parseFloat(m[1]) : NaN
    })
    assert.ok(winds.length > 0, "存在粒子")
    assert.ok(
      winds.every((w) => !Number.isNaN(w)),
      "每个粒子都有 --wind",
    )
    const sign = Math.sign(winds[0])
    assert.ok(
      winds.every((w) => Math.sign(w) === sign),
      "所有粒子风向一致",
    )
  })

  test("设置面板开关可关闭并持久化", () => {
    const t = setup()
    const toggle = () => t.document.querySelector("[data-season-toggle]")!
    assert.strictEqual(toggle().getAttribute("aria-checked"), "true", "默认开启")
    t.click("[data-season-toggle]")
    assert.strictEqual(t.window.localStorage.getItem("seasonParticles"), "0")
    assert.strictEqual(toggle().getAttribute("aria-checked"), "false", "开关已关")
    assert.strictEqual(t.document.getElementById("season-particles"), null, "粒子层移除")
    t.click("[data-season-toggle]")
    assert.strictEqual(t.window.localStorage.getItem("seasonParticles"), "1")
    assert.strictEqual(toggle().getAttribute("aria-checked"), "true", "开关已开")
    assert.ok(t.document.getElementById("season-particles"), "粒子层恢复")
  })

  test("仅首页默认开启，子页面默认关闭", () => {
    const home = setup()
    assert.ok(home.document.getElementById("season-particles"), "首页默认开启")
    const sub = setup("http://localhost/posts/hello")
    assert.strictEqual(sub.document.getElementById("season-particles"), null, "子页面默认关闭")
    sub.click("[data-season-toggle]")
    assert.strictEqual(
      sub.window.localStorage.getItem("seasonParticlesSub"),
      "1",
      "子页面偏好单独存储",
    )
    assert.strictEqual(sub.window.localStorage.getItem("seasonParticles"), null, "不污染首页偏好")
    assert.ok(sub.document.getElementById("season-particles"), "手动开启后生效")
    // 同一实例内 SPA 导航后仍保持开启
    const bodyHtml = HTML.match(/<body>[\s\S]*<\/body>/)![0].replace(/<\/?body>/g, "")
    sub.document.body.innerHTML = bodyHtml
    sub.document.dispatchEvent(new sub.window.UIEvent("nav"))
    assert.ok(sub.document.getElementById("season-particles"), "导航后保持开启")
  })

  test("首页偏好不外溢到子页面（旧版全局键同理）", () => {
    const t = setup()
    t.window.localStorage.setItem("seasonParticles", "1") // 旧版遗留的全局键
    t.window.history.pushState({}, "", "/posts/hello")
    const bodyHtml = HTML.match(/<body>[\s\S]*<\/body>/)![0].replace(/<\/?body>/g, "")
    t.document.body.innerHTML = bodyHtml
    t.document.dispatchEvent(new t.window.UIEvent("nav"))
    assert.strictEqual(t.document.getElementById("season-particles"), null, "子页面仍默认关闭")
  })

  test("从首页 SPA 进入子页面自动关闭", () => {
    const t = setup()
    assert.ok(t.document.getElementById("season-particles"), "首页已开启")
    t.window.history.pushState({}, "", "/posts/hello")
    const bodyHtml = HTML.match(/<body>[\s\S]*<\/body>/)![0].replace(/<\/?body>/g, "")
    t.document.body.innerHTML = bodyHtml
    t.document.dispatchEvent(new t.window.UIEvent("nav"))
    assert.strictEqual(t.document.getElementById("season-particles"), null, "子页面自动关闭")
  })

  test("SPA 导航后粒子层重建", () => {
    const t = setup()
    const bodyHtml = HTML.match(/<body>[\s\S]*<\/body>/)![0].replace(/<\/?body>/g, "")
    t.document.body.innerHTML = bodyHtml
    t.document.dispatchEvent(new t.window.UIEvent("nav"))
    assert.ok(t.document.getElementById("season-particles"), "导航后粒子层重建")
    assert.strictEqual(
      t.document.querySelector("[data-season-toggle]")!.getAttribute("aria-checked"),
      "true",
      "导航后开关状态同步",
    )
  })
})

type Quote = { text: string; source?: string; tags?: string[]; cat?: string }
type QuoteApi = {
  pickQuote: (qs: Quote[], d?: Date, r?: () => number) => Quote | null
  activeOccasions: (d: Date) => string[]
  seasonNow: (d?: Date) => string
  solarToLunar: (y: number, m: number, d: number) => {
    y: number
    m: number
    d: number
    leap: boolean
  }
}
const quoteApi = (t: ReturnType<typeof setup>) =>
  (t.window as unknown as { __quoteApi: QuoteApi }).__quoteApi
const seq = (values: number[]) => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d)

describe("引言时间加权", () => {
  test("春季只从春季句与通用句抽取", () => {
    const { pickQuote } = quoteApi(setup())
    const qs: Quote[] = [
      { text: "春", tags: ["spring"] },
      { text: "夏", tags: ["summer"] },
      { text: "秋", tags: ["autumn"] },
      { text: "冬", tags: ["winter"] },
      { text: "通用" },
    ]
    for (let i = 0; i < 40; i++) {
      const q = pickQuote(qs, day(2026, 3, 15), Math.random)
      assert.ok(q!.text === "春" || q!.text === "通用", `不应抽到 ${q!.text}`)
    }
  })

  test("平常日：当季句 65%、通用句 35%", () => {
    const { pickQuote } = quoteApi(setup())
    const qs: Quote[] = [{ text: "春", tags: ["spring"] }, { text: "通用" }]
    assert.strictEqual(pickQuote(qs, day(2026, 3, 15), seq([0.64, 0]))!.text, "春")
    assert.strictEqual(pickQuote(qs, day(2026, 3, 15), seq([0.65, 0]))!.text, "通用")
  })

  test("国庆当天：专属 80%，其余通用；假期外不生效", () => {
    const { pickQuote } = quoteApi(setup())
    const qs: Quote[] = [{ text: "国庆", tags: ["holiday:national-day"] }, { text: "通用" }]
    assert.strictEqual(pickQuote(qs, day(2026, 10, 1), seq([0.79, 0]))!.text, "国庆")
    assert.strictEqual(pickQuote(qs, day(2026, 10, 1), seq([0.8, 0]))!.text, "通用")
    assert.strictEqual(pickQuote(qs, day(2026, 10, 7), seq([0.1, 0]))!.text, "国庆")
    assert.strictEqual(pickQuote(qs, day(2026, 9, 30), seq([0.1, 0]))!.text, "通用")
    assert.strictEqual(pickQuote(qs, day(2026, 10, 8), seq([0.1, 0]))!.text, "通用")
  })

  test("节令句不串场：清明不会出春节，平常日不出节令句", () => {
    const { pickQuote } = quoteApi(setup())
    const qs: Quote[] = [
      { text: "春节", tags: ["holiday:spring-festival", "spring"] },
      { text: "清明", tags: ["term:清明", "spring"] },
      { text: "春", tags: ["spring"] },
      { text: "通用" },
    ]
    for (let i = 0; i < 60; i++) {
      const text = pickQuote(qs, day(2026, 4, 5), Math.random)!.text
      assert.ok(text === "清明" || text === "春" || text === "通用", `清明节不应出现 ${text}`)
    }
    for (let i = 0; i < 40; i++) {
      const text = pickQuote(qs, day(2026, 5, 15), Math.random)!.text
      assert.ok(text === "春" || text === "通用", `平常日不应出现 ${text}`)
    }
    for (let i = 0; i < 60; i++) {
      const text = pickQuote(qs, day(2026, 2, 17), Math.random)!.text
      assert.ok(text !== "清明", "春节不应出现清明句")
    }
  })

  test("农历节日：春节窗口、除夕、中秋", () => {
    const { activeOccasions } = quoteApi(setup())
    assert.ok(activeOccasions(day(2026, 2, 17)).includes("holiday:spring-festival"))
    assert.ok(activeOccasions(day(2026, 2, 19)).includes("holiday:spring-festival"))
    assert.ok(!activeOccasions(day(2026, 2, 20)).includes("holiday:spring-festival"))
    assert.ok(activeOccasions(day(2026, 2, 16)).includes("holiday:new-year-eve"))
    assert.ok(activeOccasions(day(2026, 9, 25)).includes("holiday:mid-autumn"))
    assert.ok(!activeOccasions(day(2026, 9, 24)).includes("holiday:mid-autumn"))
  })

  test("二十四节气：当天命中、次日不命中", () => {
    const { activeOccasions } = quoteApi(setup())
    assert.ok(activeOccasions(day(2026, 4, 5)).includes("term:清明"))
    assert.ok(!activeOccasions(day(2026, 4, 6)).includes("term:清明"))
    assert.ok(activeOccasions(day(2026, 12, 22)).includes("term:冬至"))
  })

  test("节气当天专属池为空时回退到季节加权", () => {
    const { pickQuote } = quoteApi(setup())
    const qs: Quote[] = [{ text: "春", tags: ["spring"] }, { text: "通用" }]
    assert.strictEqual(pickQuote(qs, day(2026, 4, 5), seq([0.64, 0]))!.text, "春")
    assert.strictEqual(pickQuote(qs, day(2026, 4, 5), seq([0.65, 0]))!.text, "通用")
  })

  test("本地调试：?season= 强制季节，?date= 模拟日期", () => {
    const forced = setup("http://localhost/?season=autumn")
    assert.strictEqual(quoteApi(forced).seasonNow(), "autumn")
    assert.strictEqual(
      forced.document.getElementById("season-particles")!.getAttribute("data-season"),
      "autumn",
    )

    const dated = quoteApi(setup("http://localhost/?date=2026-10-01"))
    assert.strictEqual(dated.seasonNow(), "autumn")
    const qs: Quote[] = [{ text: "国庆", tags: ["holiday:national-day"] }, { text: "通用" }]
    assert.strictEqual(dated.pickQuote(qs, undefined, seq([0.5, 0]))!.text, "国庆")
  })

  test("通用池按文哲/ACG/古典/其他比例抽取", () => {
    const { pickQuote } = quoteApi(setup())
    const qs: Quote[] = [
      { text: "文哲", cat: "lit" },
      { text: "ACG", cat: "acg" },
      { text: "古典", cat: "classic" },
      { text: "其他", cat: "misc" },
    ]
    const d = day(2026, 5, 15)
    assert.strictEqual(pickQuote(qs, d, seq([0.39, 0]))!.text, "文哲")
    assert.strictEqual(pickQuote(qs, d, seq([0.4, 0]))!.text, "ACG")
    assert.strictEqual(pickQuote(qs, d, seq([0.74, 0]))!.text, "ACG")
    assert.strictEqual(pickQuote(qs, d, seq([0.75, 0]))!.text, "古典")
    assert.strictEqual(pickQuote(qs, d, seq([0.94, 0]))!.text, "古典")
    assert.strictEqual(pickQuote(qs, d, seq([0.95, 0]))!.text, "其他")
  })
})

describe("bird 彩蛋背景幕", () => {
  test("输入 bird 出现遮罩层，点击后开始淡出", () => {
    const t = setup()
    const input = t.document.querySelector(".search-bar") as HTMLInputElement
    input.value = "bird"
    input.dispatchEvent(new t.window.Event("input", { bubbles: true }))
    const veil = t.document.getElementById("egg-veil")
    assert.ok(veil, "遮罩层已创建")
    assert.ok(veil!.classList.contains("show"), "遮罩层已显示")
    assert.ok(t.document.getElementById("egg-feathers"), "羽毛层已创建")
    t.document.dispatchEvent(new t.window.Event("pointerdown", { bubbles: true }))
    assert.ok(!veil!.classList.contains("show"), "点击后开始淡出")
    assert.ok(
      t.document.getElementById("egg-feathers")!.classList.contains("leaving"),
      "羽毛层开始退场",
    )
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
