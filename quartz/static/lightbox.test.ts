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
<div id="quartz-body"><div class="center"><article class="popover-hint">
  <div class="markdown-preview-view markdown-rendered">
    <p><img id="img1" src="../../images/主板.jpg#pic_center" alt="主板"/></p>
    <p><img id="img2" src="../../images/CPU.jpg" alt="CPU"/></p>
    <p><a href="https://example.com"><img id="imgLink" src="../../images/GPU.jpg" alt="link"/></a></p>
  </div>
</article></div><span id="random-quote"></span></div>
</body></html>`

function setup() {
  const dom = new JSDOM(HTML, {
    url: "http://localhost/随笔/01.html",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  })
  const { window } = dom
  const { document } = window
  window.Element.prototype.checkVisibility = function () {
    return true
  }
  window.fetch = () => Promise.reject(new Error("no fetch in jsdom"))
  // jsdom 无 PointerEvent，用 MouseEvent 派生一个最小实现
  class PointerEventPolyfill extends window.MouseEvent {
    pointerId: number
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerId = init.pointerId ?? 0
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof window.PointerEvent
  window.eval(customJs)
  document.dispatchEvent(new window.Event("DOMContentLoaded") as UIEvent)
  return { window, document }
}

describe("lightbox", () => {
  test("点击正文图片打开灯箱", () => {
    const { window, document } = setup()
    const img = document.getElementById("img1")!
    img.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }))
    const lb = document.getElementById("lightbox")
    assert.ok(lb, "灯箱已创建")
    assert.ok(lb!.classList.contains("open"), "灯箱处于打开状态")
    const lbImg = document.getElementById("lightbox-img")! as HTMLImageElement
    assert.ok(
      decodeURIComponent(lbImg.src).startsWith("http://localhost/images/主板.jpg"),
      "灯箱图片 URL 正确（去掉 #pic_center）：" + decodeURIComponent(lbImg.src),
    )
    const count = document.getElementById("lightbox-count")!
    assert.strictEqual(count.textContent, "1 / 2", "同文图片分组计数正确（链接内图片不计入）")
    assert.strictEqual(
      lbImg.style.transform,
      "translate(0px,0px) translate(-50%,-50%) rotate(0deg) scale(1)",
      "图片居中（tx/ty 相对中心，不叠加 stage 偏移）：" + lbImg.style.transform,
    )
  })

  test("放大后拖拽平移", () => {
    const { window, document } = setup()
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    const stage = document.getElementById("lightbox-stage")!
    const img = document.getElementById("lightbox-img")!
    // jsdom 无布局，stub 关键尺寸，再触发 load 让灯箱重新计算适配比例
    Object.defineProperty(stage, "clientWidth", { value: 800 })
    Object.defineProperty(stage, "clientHeight", { value: 600 })
    Object.defineProperty(img, "naturalWidth", { value: 1000 })
    Object.defineProperty(img, "naturalHeight", { value: 800 })
    img.dispatchEvent(new window.Event("load"))
    // 模拟放大后拖拽
    ;(document.querySelector('#lightbox [data-act="zoomin"]') as HTMLElement).click()
    ;(document.querySelector('#lightbox [data-act="zoomin"]') as HTMLElement).click()
    assert.ok(
      parseFloat(img.style.transform.split("scale(")[1]) > 0.9,
      "已放大：" + img.style.transform,
    )
    stage.dispatchEvent(
      new window.PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }),
    )
    stage.dispatchEvent(
      new window.PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 160,
        clientY: 130,
        bubbles: true,
      }),
    )
    assert.ok(
      img.style.transform.includes("translate(60px,30px)"),
      "拖拽后平移生效：" + img.style.transform,
    )
    stage.dispatchEvent(
      new window.PointerEvent("pointerup", {
        pointerId: 1,
        clientX: 160,
        clientY: 130,
        bubbles: true,
      }),
    )
  })

  test("Esc 关闭灯箱", () => {
    const { window, document } = setup()
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    const lb = document.getElementById("lightbox")
    assert.ok(lb && !lb.classList.contains("open"), "Esc 后灯箱关闭")
  })

  test("加载中显示 spinner，加载完成隐藏", () => {
    const { window, document } = setup()
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    const loader = document.getElementById("lightbox-loader")!
    assert.ok(loader.classList.contains("show"), "换图后 spinner 显示")
    const lbImg = document.getElementById("lightbox-img")! as HTMLImageElement
    Object.defineProperty(lbImg, "naturalWidth", { value: 800 })
    lbImg.dispatchEvent(new window.Event("load"))
    assert.ok(!loader.classList.contains("show"), "加载完成后 spinner 隐藏")
  })

  test("加载失败：spinner 隐藏 + toast 提示", () => {
    const { window, document } = setup()
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    const loader = document.getElementById("lightbox-loader")!
    assert.ok(loader.classList.contains("show"), "spinner 显示")
    const lbImg = document.getElementById("lightbox-img")! as HTMLImageElement
    lbImg.dispatchEvent(new window.Event("error"))
    assert.ok(!loader.classList.contains("show"), "spinner 隐藏")
    const toast = document.querySelector(".toast-notification")
    assert.ok(toast, "出现失败提示 toast")
    assert.ok(toast!.textContent!.includes("图片加载失败"), "提示内容正确")
  })

  test("加载失败后再次打开会重试", () => {
    const { window, document } = setup()
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    const lbImg = document.getElementById("lightbox-img")! as HTMLImageElement
    lbImg.dispatchEvent(new window.Event("error"))
    assert.ok(lbImg.hasAttribute("data-lb-error"), "失败已标记")
    // 关闭后再次打开同一张图
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    const loader = document.getElementById("lightbox-loader")!
    assert.ok(loader.classList.contains("show"), "重试时 spinner 显示")
    assert.ok(!lbImg.hasAttribute("data-lb-error"), "已重新加载（标记清除由 load 完成）")
  })

  test("点击链接内图片不打开灯箱", () => {
    const { window, document } = setup()
    document
      .getElementById("imgLink")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }))
    assert.ok(!document.getElementById("lightbox"), "链接内图片不触发灯箱")
  })

  test("SPA nav 后关闭灯箱", () => {
    const { window, document } = setup()
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    assert.ok(document.getElementById("lightbox")!.classList.contains("open"))
    document.dispatchEvent(new window.UIEvent("nav"))
    assert.ok(!document.getElementById("lightbox")!.classList.contains("open"), "nav 后灯箱关闭")
  })

  test("next 按钮切换图片", () => {
    const { window, document } = setup()
    document
      .getElementById("img1")!
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    const nx = document.querySelector('#lightbox [data-act="next"]') as HTMLElement
    nx.click()
    const lbImg = document.getElementById("lightbox-img")! as HTMLImageElement
    assert.ok(lbImg.src.includes("CPU.jpg"), "切到下一张：" + lbImg.src)
    assert.strictEqual(document.getElementById("lightbox-count")!.textContent, "2 / 2")
  })
})
