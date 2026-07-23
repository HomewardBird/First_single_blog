(function () {
// ====================================================================
//  Constants & Keys
// ====================================================================
var FONT_SIZE_KEY  = "fontSize"
var BG_KEY         = "bgColor"
var FONT_COLOR_KEY = "fontColor"
var LOCK_KEY       = "bgLocked"

// ====================================================================
//  Reading progress save / restore
// ====================================================================
function getSlug() {
  return window.location.pathname.replace(/^\/|\/$/g, "") || "index"
}

document.addEventListener("nav", function () {
  if (!document.getElementById("hamburger-menu")) rebuildUI()
  else { closeHamburger() }
  var tbT = document.querySelector("#top-bar .top-bar-title")
  if (tbT) tbT.textContent = document.title || "\u5F52\u9E1F\u7684\u9986\u85CF\u65E5\u5FD7"
  restoreLock()
  var prev = sessionStorage.getItem('__prevPage')
  var cur = getSlug()
  if (localStorage.getItem(LOCK_KEY) !== "true") {
    var bg = localStorage.getItem(BG_KEY) || "default"
    if (cur === "index" && bg !== "default") setBg("default")
    else if (cur !== "index" && bg === "default" && (prev === "index" || !prev)) setBg(isDark() ? "dark" : "cream")
  }
  // SPA reconstructs <body>, 重写当前背景的内联样式
  setBg(localStorage.getItem(BG_KEY) || "default")
  sessionStorage.setItem('__prevPage', cur)
})

// ====================================================================
//  Toast
// ====================================================================
function showToast(text, link, dur) {
  dur = dur || 5000
  var old = document.querySelector(".toast-notification"); if (old) old.remove()
  var t = document.createElement("div"); t.className = "toast-notification"
  var s = "position:fixed;bottom:6rem;left:50%;transform:translateX(-50%);z-index:10050;" +
    "background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.3);" +
    "border-radius:14px;padding:0.85rem 1.5rem;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,0.12);" +
    "display:flex;align-items:center;gap:0.8rem;font-size:0.92rem;color:var(--dark);" +
    "opacity:0;transition:opacity 0.4s ease, transform 0.4s ease;transform:translateX(-50%) translateY(16px);cursor:default;"
  t.style.cssText = s
  var inner = link ? '<a href="'+link+'" style="color:var(--secondary);font-weight:600;text-decoration:none;flex:1">'+text+'</a>' : '<span style="flex:1">'+text+'</span>'
  t.innerHTML = inner + '<button class="toast-close" style="background:none;border:none;font-size:1.2rem;cursor:pointer;opacity:0.5;padding:0;line-height:1">&times;</button>'
  t.querySelector(".toast-close").onclick = function () { t.remove() }
  document.body.appendChild(t)
  requestAnimationFrame(function () { t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)" })
  setTimeout(function () { t.style.opacity = "0"; t.style.transform = "translateX(-50%) translateY(16px)"; setTimeout(function () { if (t.parentNode) t.remove() }, 400) }, dur)
}

// ====================================================================
//  Font Size
// ====================================================================
function setFontSize(sz) {
  var sizes = { small:"14px", medium:"16px", large:"19px" }
  document.documentElement.style.fontSize = sizes[sz] || "16px"
  localStorage.setItem(FONT_SIZE_KEY, sz)
  document.querySelectorAll(".hb-font-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.sz === sz) })
}
function restoreFontSize() { var s = localStorage.getItem(FONT_SIZE_KEY); if (s) setFontSize(s) }

// ====================================================================
//  Background Colour (solid colour override)
// ====================================================================
// ====================================================================
//  Theme detection
// ====================================================================
function isDark() {
  return document.documentElement.getAttribute("data-theme") === "dark" ||
         document.documentElement.getAttribute("saved-theme") === "dark"
}
function currentBgOpts() {
  return isDark()
    ? [{ id:"default", label:"\u89C6\u9891" }, { id:"dark", label:"\u6DF1\u7070" }, { id:"black", label:"\u7EAF\u9ED1" }]
    : [{ id:"default", label:"\u89C6\u9891" }, { id:"white", label:"\u7EAF\u767D" }, { id:"cream", label:"\u7C73\u767D" }, { id:"gray", label:"\u6D45\u7070" }, { id:"blue", label:"\u96FE\u84DD" }]
}
function setBg(id) {
  localStorage.setItem(BG_KEY, id)
  document.body.dataset.bgColor = id
  var ov = document.getElementById("bg-overlay"); if (!ov) return
  var colors = {
    default:null, white:"rgba(250,248,248,0.95)", cream:"rgba(252,244,230,0.95)",
    gray:"rgba(200,200,200,0.95)", dark:"rgba(30,30,32,0.95)", black:"rgba(10,10,10,0.98)", blue:"rgba(210,225,240,0.95)",
  }
  var c = colors[id]
  if (c) {
    document.querySelectorAll("#bg-video-light, #bg-video-dark, #bg-image-light, #bg-image-dark").forEach(function (v) { v.style.opacity = "0" })
    ov.style.background = c; ov.style.backdropFilter = "none"; ov.style.webkitBackdropFilter = "none"
  } else {
    // SPA 重建了 <body>，新 video 元素只有 data-src 没有 src
    document.querySelectorAll('#bg-video-light, #bg-video-dark').forEach(function(v) {
      if (!v.src || v.src === window.location.href) {
        var s = v.getAttribute('data-src')
        if (s) { v.src = s; v.load(); }
      }
    })
    var dark = isDark()
    var lv = document.getElementById("bg-video-light"), dv = document.getElementById("bg-video-dark")
    var li = document.getElementById("bg-image-light"), di = document.getElementById("bg-image-dark")
    if (lv) lv.style.opacity = dark ? "0" : "1"; if (dv) dv.style.opacity = dark ? "1" : "0"
    if (li) li.style.opacity = dark ? "0" : "1"; if (di) di.style.opacity = dark ? "1" : "0"
    ov.style.background = ""; ov.style.backdropFilter = ""; ov.style.webkitBackdropFilter = ""
  }
  document.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.bg === id) })
}
function restoreBg() { var s = localStorage.getItem(BG_KEY); if (s) setBg(s) }

// ====================================================================
//  Font Colour mode (data-font-* / data-bg-*)
// ====================================================================
var fontColorOpts = [
  { id:"auto",   label:"\u81EA\u52A8" },
  { id:"dark",   label:"\u6DF1\u8272" },
  { id:"light",  label:"\u6D45\u8272" },
  { id:"gray",   label:"\u7070\u8272" },
  { id:"sepia",  label:"\u590D\u53E4" },
  { id:"blue",   label:"\u84DD\u8C03" },
]

function setFontColor(id) {
  // Clear all font-colour / bg data-*
  var body = document.body
  body.removeAttribute("data-font-dark")
  body.removeAttribute("data-font-light")
  body.removeAttribute("data-font-gray")
  body.removeAttribute("data-font-sepia")
  body.removeAttribute("data-font-blue")
  body.removeAttribute("data-bg-light")
  body.removeAttribute("data-bg-dark")

  if (id === "auto") {
    // Determine based on current theme
    var dark = isDark()
    body.setAttribute("data-bg-" + (dark ? "dark" : "light"), "true")
  } else {
    body.setAttribute("data-font-" + id, "true")
  }
  localStorage.setItem(FONT_COLOR_KEY, id)
  document.querySelectorAll(".hb-fc-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.fc === id) })
}

function restoreFontColor() {
  var s = localStorage.getItem(FONT_COLOR_KEY)
  if (s && s !== "reading") setFontColor(s)
  else setFontColor("auto")
}

// ====================================================================
//  Lock (prevent accidental bg / font changes)
// ====================================================================
function toggleLock() {
  var locked = localStorage.getItem(LOCK_KEY) === "true"
  locked = !locked
  localStorage.setItem(LOCK_KEY, locked ? "true" : "false")
  document.querySelectorAll(".hb-lock-btn").forEach(function (b) { b.classList.toggle("locked", locked) })
}

function restoreLock() {
  var locked = localStorage.getItem(LOCK_KEY) === "true"
  document.querySelectorAll(".hb-lock-btn").forEach(function (b) { b.classList.toggle("locked", locked) })
}



// ====================================================================
//  Top bar + hamburger menu
// ====================================================================
function rebuildUI() {
  var bar = document.getElementById("top-bar")
  if (!bar) {
    bar = document.createElement("div"); bar.id = "top-bar"
    var inner = document.createElement("div"); inner.className = "top-bar-inner"
    var t = document.createElement("span"); t.className = "top-bar-title"
    t.textContent = document.title || "\u5F52\u9E1F\u7684\u9986\u85CF\u65E5\u5FD7"
    var wrap = document.createElement("div"); wrap.style.cssText = "position:relative;display:flex;align-items:center"
    var btn = document.createElement("button"); btn.className = "hamburger-btn"; btn.setAttribute("aria-label", "\u83DC\u5355")
    btn.innerHTML = '<span class="hamburger-line"></span><span class="hamburger-line"></span><span class="hamburger-line"></span>'
    btn.onclick = function (e) { e.stopPropagation(); toggleHamburger() }
    wrap.appendChild(btn)
    inner.appendChild(t); inner.appendChild(wrap); bar.appendChild(inner)
    document.body.prepend(bar)
  }
  var tbt = bar.querySelector(".top-bar-title")
  if (tbt) tbt.textContent = document.title || "\u5F52\u9E1F\u7684\u9986\u85CF\u65E5\u5FD7"
  var hb = bar.querySelector(".hamburger-btn")
  if (hb && !hb._hc) { hb._hc = true; hb.onclick = function(e) { e.stopPropagation(); toggleHamburger() } }

  if (!document.getElementById("hamburger-menu")) {
    var menu = document.createElement("div"); menu.id = "hamburger-menu"
    menu.innerHTML = buildMenuHTML()
    menu.addEventListener("click", function (e) { e.stopPropagation() })
    document.body.appendChild(menu)
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("open") && !menu.contains(e.target) && !bar.contains(e.target)) closeHamburger()
    })
  }
  attachHandlers()
  if (window.__music) {
    var st = window.__music.getState()
    var pb = document.querySelector('.hb-music-play')
    if (pb) pb.textContent = st.playing ? '\u23F8' : '\u25B6'
    var tn = document.querySelector('.hb-music-track')
    if (tn) tn.textContent = st.track || '\u672A\u64AD\u653E'
  }
}

function buildMenuHTML() {
  // Font size
  var fHtml = [{sz:"small",l:"A\u207B"},{sz:"medium",l:"A"},{sz:"large",l:"A\u207A"}]
    .map(function (b) { return '<button class="hb-font-btn" data-sz="'+b.sz+'">'+b.l+'</button>' }).join("")

  // Background (theme-aware)
  var bHtml = currentBgOpts().map(function (o) { return '<button class="hb-bg-btn" data-bg="'+o.id+'">'+o.label+'</button>' }).join("")

  // Font colour
  var fcHtml = fontColorOpts.map(function (o) { return '<button class="hb-fc-btn" data-fc="'+o.id+'">'+o.label+'</button>' }).join("")

  return [
    '<div class="hb-section"><div class="hb-title">\uD83D\uDD24 \u5916\u89C2</div>',
    '<div class="hb-sub">\u5B57\u4F53\u5927\u5C0F</div><div class="hb-row">', fHtml, '</div>',
    '<div class="hb-sub">\u80CC\u666F\u989C\u8272</div><div class="hb-row hb-bg-row">', bHtml, '</div>',
    '<div class="hb-sub">\u6587\u5B57\u989C\u8272</div><div class="hb-row">', fcHtml, '</div>',
    '<div class="hb-inline-row">',
      '<button class="hb-lock-btn" title="\u9501\u5B9A\u80CC\u666F\u4E0D\u53D8">\uD83D\uDD12 \u9501\u5B9A</button>',
    '</div></div>',
    '<div class="hb-section"><div class="hb-title">\uD83C\uDFB5 \u97F3\u4E50</div>',
    '<div class="hb-music-row">',
      '<button class="hb-music-btn hb-music-prev" title="\u4E0A\u4E00\u9996">\u23EE</button>',
      '<button class="hb-music-btn hb-music-play" title="\u64AD\u653E/\u6682\u505C">\u25B6</button>',
      '<button class="hb-music-btn hb-music-next" title="\u4E0B\u4E00\u9996">\u23ED</button>',
    '</div>',
    '<div class="hb-music-track">\u672A\u64AD\u653E</div>',
    '</div>',
  ].join("")
}

function attachHandlers() {
  document.querySelectorAll(".hb-font-btn").forEach(function (b) { b.addEventListener("click", function () { setFontSize(this.dataset.sz) }) })
  document.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.addEventListener("click", function () { setBg(this.dataset.bg) }) })
  document.querySelectorAll(".hb-fc-btn").forEach(function (b) { b.addEventListener("click", function () { setFontColor(this.dataset.fc) }) })
  document.querySelectorAll(".hb-lock-btn").forEach(function (b) { b.addEventListener("click", toggleLock) })
  var mp = document.querySelector('.hb-music-play'); if (mp && !mp._hm) { mp._hm = true; mp.addEventListener('click', function() { if (window.__music) window.__music.toggle(); }); }
  var mn = document.querySelector('.hb-music-next'); if (mn && !mn._hn) { mn._hn = true; mn.addEventListener('click', function() { if (window.__music) window.__music.next(); }); }
  var mpv = document.querySelector('.hb-music-prev'); if (mpv && !mpv._hp) { mpv._hp = true; mpv.addEventListener('click', function() { if (window.__music) window.__music.prev(); }); }
}

// ====================================================================
//  Hamburger helpers
// ====================================================================
function toggleHamburger() {
  var m = document.getElementById("hamburger-menu"); if (!m) return
  m.classList.toggle("open")
  if (m.classList.contains("open")) {
    refreshBgButtons()
  }
}
function refreshBgButtons() {
  var opts = currentBgOpts()
  var row = document.querySelector(".hb-bg-row")
  if (!row) return
  row.innerHTML = opts.map(function (o) { return '<button class="hb-bg-btn" data-bg="'+o.id+'">'+o.label+'</button>' }).join("")
  // Re-attach handlers
  row.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.addEventListener("click", function () { setBg(this.dataset.bg) }) })
  // Restore active state
  var saved = localStorage.getItem(BG_KEY)
  if (saved) row.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.bg === saved) })
}
function closeHamburger() { var m = document.getElementById("hamburger-menu"); if (m) m.classList.remove("open") }

// ====================================================================
//  Init
// ====================================================================
function init() {
  rebuildUI()
  restoreFontSize()
  restoreBg()
  restoreFontColor()
  restoreLock()

  var slug = getSlug()
  if (slug !== "index" && localStorage.getItem(LOCK_KEY) !== "true") {
    if (localStorage.getItem(BG_KEY) === "default" || !localStorage.getItem(BG_KEY))
      setBg(isDark() ? "dark" : "cream")
  }
  try { sessionStorage.setItem('__prevPage', slug) } catch(e) {}

  if (window.__music && window.__music.onChange) {
    window.__music.onChange(function(st) {
      var pb = document.querySelector('.hb-music-play')
      if (pb) pb.textContent = st.playing ? '\u23F8' : '\u25B6'
      var tn = document.querySelector('.hb-music-track')
      if (tn) tn.textContent = st.track || '\u672A\u64AD\u653E'
    })
  }
}

// ====================================================================
//  Prev / Next chapter
// ====================================================================
var _ci = null
function loadCI() {
  if (_ci) return Promise.resolve(_ci)
  return fetch("/static/contentIndex.json").then(function (r) { return r.json() }).then(function (d) {
    _ci = d.content || d; return _ci
  }).catch(function () { return null })
}

function insertPrevNext() {
  var slug = getSlug(); if (!slug || slug === "index") return
  var parts = slug.split("/"); if (parts.length < 2) return
  var parent = parts.slice(0, -1).join("/")

  loadCI().then(function (data) {
    if (!data) return
    var siblings = Object.keys(data).filter(function (k) {
      var p = k.split("/"); p.pop()
      return p.join("/") === parent && k !== slug && k !== parent + "/index"
    })
    if (!siblings.length) return

    siblings.sort(function (a, b) {
      return (a.split("/").pop()).localeCompare(b.split("/").pop(), undefined, { numeric: true, sensitivity: "base" })
    })

    var idx = siblings.findIndex(function (s) { return s.localeCompare(slug, undefined, { numeric: true, sensitivity: "base" }) > 0 })
    if (idx === -1) idx = siblings.length
    var prev = idx > 0 ? siblings[idx - 1] : null
    var next = idx < siblings.length ? siblings[idx] : null

    var el = document.getElementById("chapter-nav")
    if (!el) {
      el = document.createElement("div"); el.id = "chapter-nav"
      var ins = document.querySelector(".center > hr") || document.querySelector(".center")
      if (ins) ins.parentNode.insertBefore(el, ins.nextSibling)
    }

    var p = prev ? '<a href="/'+prev+'" class="cn-prev">← '+(data[prev]?.title || prev.split("/").pop())+'</a>' : ""
    var n = next ? '<a href="/'+next+'" class="cn-next">'+(data[next]?.title || next.split("/").pop())+' →</a>' : ""
    el.innerHTML = p + '<span class="cn-spacer"></span>' + n

    if (!document.getElementById("cn-styles")) {
      var st = document.createElement("style"); st.id = "cn-styles"
      st.textContent = "#chapter-nav{display:flex;align-items:center;justify-content:space-between;margin:1.2rem 0 0.8rem;padding:0 0.5rem;gap:1rem}" +
        ".cn-prev,.cn-next{color:var(--secondary);text-decoration:none;font-weight:600;font-size:0.88rem;transition:opacity 0.2s;max-width:45%;word-break:break-word}" +
        ".cn-prev:hover,.cn-next:hover{opacity:0.65}.cn-next{text-align:right}.cn-spacer{flex:1}"
      document.head.appendChild(st)
    }
  })
}

document.addEventListener("nav", function () { setTimeout(insertPrevNext, 120) })
document.addEventListener("DOMContentLoaded", function () { setTimeout(insertPrevNext, 250) })

// ====================================================================
//  Watch theme changes → refresh bg buttons
// ====================================================================
var themeObserver = new MutationObserver(function () {
  refreshBgButtons()
  var bg = localStorage.getItem(BG_KEY)
  if (bg && bg !== "default") {
    var opts = currentBgOpts().filter(function(o) { return o.id !== "default" })
    if (opts.length) setBg(opts[0].id)
  } else {
    document.querySelectorAll('#bg-video-light, #bg-video-dark').forEach(function(v) {
      if (!v.src || v.src === window.location.href) {
        var s = v.getAttribute('data-src')
        if (s) { v.src = s; v.load(); }
      }
    })
    var dark = isDark()
    var lv = document.getElementById("bg-video-light"), dv = document.getElementById("bg-video-dark")
    var li = document.getElementById("bg-image-light"), di = document.getElementById("bg-image-dark")
    if (lv) lv.style.opacity = dark ? "0" : "1"; if (dv) dv.style.opacity = dark ? "1" : "0"
    if (li) li.style.opacity = dark ? "0" : "1"; if (di) di.style.opacity = dark ? "1" : "0"
  }
  var fc = localStorage.getItem(FONT_COLOR_KEY)
  if (fc === "auto" || !fc) setFontColor("auto")
})
function startObserver() {
  var el = document.documentElement
  themeObserver.observe(el, { attributes: true, attributeFilter: ["data-theme", "saved-theme"] })
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); startObserver() })
else { init(); startObserver() }
})();
