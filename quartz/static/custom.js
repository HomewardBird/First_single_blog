(function () {
// ====================================================================
//  Constants & Keys
// ====================================================================
var FONT_SIZE_KEY  = "fontSize"
var BG_KEY         = "bgColor"
var FONT_COLOR_KEY = "fontColor"
var LOCK_KEY       = "bgLocked"

// Handler dedup set
var _handlerSet = new WeakSet()

// ====================================================================
//  Base path
// ====================================================================
var _bp = ''
function getBp() {
  if (!_bp) { var b = document.body; _bp = (b && b.getAttribute('data-basepath')) || '' }
  return _bp
}

// ====================================================================
//  Music Player
// ====================================================================
var _vLoaded = false;
function lazyLoadVideos() {
  if (_vLoaded) return; _vLoaded = true;
  document.querySelectorAll('#bg-video-light, #bg-video-dark').forEach(function(v) {
    var src = v.getAttribute('data-src');
    if (src) { v.src = src; v.load(); }
  });
}

var tracks = [
  '05 Coffee Cats.m4a',
  '1-28 希望的明\u2F47.m4a',
  '2-06 玉磬漻漻.m4a',
  '2-16 风清月白.m4a',
  '26 Welcome School.m4a',
  'ornave-lofi-moon-light-553399.mp3',
  'monume-lofi-chill-chill-509496.mp3',
  'mao690276--527415.mp3',
  'lofidreams-cozy-lofi-background-music-for-study-457198.mp3',
  'apalonbeats-lofi-lofi-music-lofi-chill-2-560425.mp3'
];
var cur = 0;
var audio = new Audio();
audio.preload = 'metadata'; audio.loop = false; audio.playbackRate = 1.0;

function loadTrack(i) { cur = i % tracks.length; audio.src = getBp() + '/static/' + tracks[cur]; audio.load(); }

var _toastTimer = null;
function createToast(text, link, dur, cls) {
  dur = dur || 2000; cls = cls || 'music-toast';
  var old = document.querySelector('.' + cls); if (old) old.remove();
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  var t = document.createElement('div'); t.className = cls;
  var base = 'position:fixed;bottom:calc(6rem + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);z-index:10050;background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.3);border-radius:14px;padding:0.85rem 1.5rem;font-size:0.92rem;color:var(--dark);opacity:0;transition:opacity 0.4s ease;pointer-events:none;box-shadow:0 8px 32px rgba(0,0,0,0.12)';
  t.style.cssText = base;
  if (link) { t.innerHTML = '<a href="'+link+'" style="color:var(--secondary);font-weight:600;text-decoration:none">'+text+'</a>'; }
  else { t.textContent = text; }
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.style.opacity = '1'; });
  _toastTimer = setTimeout(function() { t.style.opacity = '0'; _toastTimer = setTimeout(function() { if (t.parentNode) t.remove(); }, 400); }, dur);
}

function _showToast(msg) { createToast(msg); }

audio.addEventListener('ended', function() { loadTrack(cur + 1); audio.play().catch(function(){}); _notify(); });
audio.addEventListener('error', function() { loadTrack(cur + 1); _showToast('音频加载失败，跳过'); audio.play().catch(function(){}); _notify(); });

var _cbs = [];
function _notify() {
  var st = { playing: !audio.paused, track: tracks[cur].split('/').pop().replace(/\.[^.]+$/, '') };
  _cbs.forEach(function(fn) { fn(st); });
}

window.__music = {
  toggle: function() {
    if (!audio.src || audio.src === location.href) loadTrack(0);
    if (audio.paused) audio.play().catch(function(){ _showToast('播放失败'); });
    else audio.pause();
    _notify();
  },
  next: function() {
    loadTrack(cur + 1);
    audio.play().catch(function(){ _showToast('播放失败'); });
    _notify();
  },
  prev: function() {
    loadTrack(cur - 1 + tracks.length);
    audio.play().catch(function(){ _showToast('播放失败'); });
    _notify();
  },
  onChange: function(fn) { _cbs.push(fn); },
  getState: function() { return { playing: !audio.paused, track: tracks[cur].split('/').pop().replace(/\.[^.]+$/, '') }; },
  setVolume: function(v) { audio.volume = v; localStorage.setItem('musicVolume', v); },
  getVolume: function() { return audio.volume; },
  toggleLoop: function() { audio.loop = !audio.loop; localStorage.setItem('musicLoop', audio.loop ? '1' : '0'); return audio.loop; },
  getLoop: function() { return audio.loop; }
};

var _quotesCache = null
var _quoteFetching = false
function loadDailyQuote() {
  var el = document.getElementById('random-quote');
  if (!el) return;
  if (_quotesCache) {
    var cq = _quotesCache[Math.floor(Math.random() * _quotesCache.length)];
    el.textContent = '「 ' + (cq.text || '') + ' 」';
    el.title = cq.source || '';
    return;
  }
  if (_quoteFetching) return;
  _quoteFetching = true;
  try {
    var ctrl = new AbortController();
    var tm = setTimeout(function() { ctrl.abort(); }, 5000);
    fetch(getBp() + '/quotes.json', { signal: ctrl.signal })
      .then(function(r) { if (!r.ok) throw Error(); return r.json(); })
      .then(function(qs) {
        clearTimeout(tm);
        _quotesCache = qs;
        var q = qs[Math.floor(Math.random() * qs.length)];
        el.textContent = '「 ' + (q.text || '') + ' 」';
        el.title = q.source || '';
      })
      .catch(function() { el.textContent = '「 欢迎你的到来 」'; })
      .finally(function() { _quoteFetching = false; });
  } catch(e) { el.textContent = '「 欢迎你的到来 」'; _quoteFetching = false; }
}

function syncMusicUI() {
  if (!window.__music) return;
  var vs = document.querySelector('.hb-vol-slider');
  if (vs) vs.value = audio.volume.toString();
  var vl = document.querySelector('.hb-vol-label');
  if (vl) vl.textContent = audio.volume.toFixed(2);
  var lb = document.querySelector('.hb-loop-btn');
  if (lb) { lb.textContent = audio.loop ? '🔂' : '🔁'; lb.classList.toggle('active', audio.loop); }
}

// ====================================================================
//  Reading progress save / restore
// ====================================================================
function getSlug() {
  return window.location.pathname.replace(/^\/|\/$/g, "") || "index"
}

document.addEventListener("nav", function () {
  injectHomeLink()
  hideNavItem('个人博客')
  // explorer 树可能晚于 nav 渲染，延迟重试
  setTimeout(function () { hideNavItem('个人博客') }, 150)
  // 移动端：导航后强制收起目录面板
  if (isMobileUI()) {
    var exp = document.querySelector('.explorer')
    if (exp && !exp.classList.contains('collapsed')) toggleMobileExplorer(false)
  }  if (!document.getElementById("hamburger-menu")) {
    rebuildUI()
    syncMusicUI()
  } else { closeHamburger() }
  closeSidebar()
  var tbT = document.querySelector("#top-bar .top-bar-title")
  if (tbT) tbT.textContent = document.title || "归鸟的馆藏日志"
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
  loadDailyQuote()
})

// ====================================================================
//  Toast
// ====================================================================
function showToast(text, link, dur) {
  dur = dur || 5000
  createToast(text, link, dur, 'toast-notification')
  var t = document.querySelector('.toast-notification:last-child')
  if (t) {
    t.style.maxWidth = '90vw'
    t.style.transform = 'translateX(-50%) translateY(16px)'
    t.style.cursor = 'default'
    t.style.display = 'flex'
    t.style.alignItems = 'center'
    t.style.gap = '0.8rem'
    var btn = document.createElement('button')
    btn.textContent = '\u00D7'
    btn.style.cssText = 'background:none;border:none;font-size:1.2rem;cursor:pointer;opacity:0.5;padding:0;line-height:1;flex-shrink:0'
    btn.onclick = function() { t.remove() }
    if (!link) { var sp = t.querySelector('span') || t; sp.after(btn) }
    requestAnimationFrame(function() { t.style.transform = 'translateX(-50%) translateY(0)' })
  }
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
    ? [{ id:"default", label:"视频" }, { id:"dark", label:"深灰" }, { id:"black", label:"纯黑" }]
    : [{ id:"default", label:"视频" }, { id:"white", label:"纯白" }, { id:"cream", label:"米白" }, { id:"gray", label:"浅灰" }, { id:"blue", label:"雾蓝" }]
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
    document.querySelectorAll("#bg-video-light, #bg-video-dark, #bg-image-light, #bg-image-dark, #bg-image-light-pc, #bg-image-dark-pc").forEach(function (v) { v.style.opacity = "0" })
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
    var liP = document.getElementById("bg-image-light-pc"), diP = document.getElementById("bg-image-dark-pc")
    if (lv) lv.style.opacity = dark ? "0" : "1"; if (dv) dv.style.opacity = dark ? "1" : "0"
    if (li) li.style.opacity = dark ? "0" : "1"; if (di) di.style.opacity = dark ? "1" : "0"
    if (liP) liP.style.opacity = dark ? "0" : "1"; if (diP) diP.style.opacity = dark ? "1" : "0"
    ov.style.background = ""; ov.style.backdropFilter = ""; ov.style.webkitBackdropFilter = ""
  }
  document.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.bg === id) })
}
function restoreBg() { var s = localStorage.getItem(BG_KEY); if (s) setBg(s) }

// ====================================================================
//  Font Colour mode (data-font-* / data-bg-*)
// ====================================================================
var fontColorOpts = [
  { id:"auto",   label:"自动" },
  { id:"dark",   label:"深色" },
  { id:"light",  label:"浅色" },
  { id:"gray",   label:"灰色" },
  { id:"sepia",  label:"复古" },
  { id:"blue",   label:"蓝调" },
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
  // 顶栏由 CustomElements.tsx 服务端渲染保证存在，无需 JS 兜底创建
  var bar = document.getElementById("top-bar")
  if (!bar) return
  var tbt = bar.querySelector(".top-bar-title")
  if (tbt) tbt.textContent = document.title || "归鸟的馆藏日志"

  if (!document.getElementById("hamburger-menu")) {
    var menu = document.createElement("div"); menu.id = "hamburger-menu"
    menu.innerHTML = buildMenuHTML()
    menu.addEventListener("click", function (e) { e.stopPropagation() })
    document.body.appendChild(menu)
  }
  attachHandlers()
  if (window.__music) {
    var st = window.__music.getState()
    var pb = document.querySelector('.hb-music-play')
    if (pb) pb.textContent = st.playing ? '\u23F8' : '\u25B6'
    var tn = document.querySelector('.hb-music-track')
      if (tn) tn.textContent = st.track || '未播放'
  }
}

function buildMenuHTML() {
  var fHtml = [{sz:"small",l:"A\u207B"},{sz:"medium",l:"A"},{sz:"large",l:"A\u207A"}]
    .map(function (b) { return '<button class="hb-font-btn" data-sz="'+b.sz+'">'+b.l+'</button>' }).join("")

  // Background (theme-aware)
  var bHtml = currentBgOpts().map(function (o) { return '<button class="hb-bg-btn" data-bg="'+o.id+'">'+o.label+'</button>' }).join("")

  // Font colour
  var fcHtml = fontColorOpts.map(function (o) { return '<button class="hb-fc-btn" data-fc="'+o.id+'">'+o.label+'</button>' }).join("")

  return [
    '<div class="hb-section"><div class="hb-title">🔅 外观</div>',
    '<div class="hb-sub">字体大小</div><div class="hb-row">', fHtml, '</div>',
    '<div class="hb-sub">背景颜色</div><div class="hb-row hb-bg-row">', bHtml, '</div>',
    '<div class="hb-sub">文字颜色</div><div class="hb-row">', fcHtml, '</div>',
    '<div class="hb-inline-row">',
      '<button class="hb-lock-btn" title="锁定背景不变">🔒 锁定</button>',
    '</div></div>',
    '<div class="hb-section"><div class="hb-title">🎵 音乐</div>',
    '<div class="hb-music-row">',
      '<button class="hb-music-btn hb-music-prev" title="上一首">⏮</button>',
      '<button class="hb-music-btn hb-music-play" title="播放/暂停">▶</button>',
      '<button class="hb-music-btn hb-music-next" title="下一首">⏭</button>',
    '</div>',
    '<div class="hb-music-track">未播放</div>',
    '<div class="hb-volume-row">',
      '<span class="hb-vol-icon">🔊</span>',
      '<input type="range" class="hb-vol-slider" min="0" max="1" step="0.05" value="1">',
      '<span class="hb-vol-label">1.0</span>',
    '</div>',
    '<div class="hb-loop-row">',
      '<button class="hb-loop-btn" title="循环模式">🔁</button>',
    '</div>',
    '</div>',
  ].join("")
}

function attachHandlers() {
  document.querySelectorAll(".hb-font-btn").forEach(function (b) { b.addEventListener("click", function () { setFontSize(this.dataset.sz) }) })
  document.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.addEventListener("click", function () { setBg(this.dataset.bg) }) })
  document.querySelectorAll(".hb-fc-btn").forEach(function (b) { b.addEventListener("click", function () { setFontColor(this.dataset.fc) }) })
  document.querySelectorAll(".hb-lock-btn").forEach(function (b) { b.addEventListener("click", toggleLock) })
  ;[['.hb-music-play','click',function(){if(window.__music)window.__music.toggle()}],
    ['.hb-music-next','click',function(){if(window.__music)window.__music.next()}],
    ['.hb-music-prev','click',function(){if(window.__music)window.__music.prev()}],
    ['.hb-vol-slider','input',function(){var v=parseFloat(this.value);if(window.__music)window.__music.setVolume(v);var l=document.querySelector('.hb-vol-label');if(l)l.textContent=v.toFixed(2)}],
    ['.hb-loop-btn','click',function(){if(!window.__music)return;var loop=window.__music.toggleLoop();this.textContent=loop?'🔂':'🔁';this.classList.toggle('active',loop)}],
    ['#nav-toggle-btn','click',function(e){e.stopPropagation();toggleSidebar()}],
    ['#tb-theme-btn','click',function(){var b=document.querySelector('button.darkmode');if(b)b.click()}]
  ].forEach(function(a){var el=document.querySelector(a[0]);if(el&&!_handlerSet.has(el)){_handlerSet.add(el);el.addEventListener(a[1],a[2])}})
}

// ====================================================================
//  Hamburger 事件委托（一次性绑定在 document 上，SPA 导航后依然有效）
// ====================================================================
var _hbDelegateBound = false
function bindHamburgerDelegate() {
  if (_hbDelegateBound) return
  _hbDelegateBound = true
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest("#hamburger-btn") : null
    if (btn) { e.stopPropagation(); toggleHamburger(); return }
    var menu = document.getElementById("hamburger-menu")
    var bar = document.getElementById("top-bar")
    if (menu && menu.classList.contains("open")) {
      var inMenu = e.target && menu.contains(e.target)
      var inBar = e.target && bar && bar.contains(e.target)
      if (!inMenu && !inBar) closeHamburger()
    }
  })
}

// ====================================================================
//  Hamburger helpers
// ====================================================================
function isMobileUI() {
  return window.matchMedia && window.matchMedia('(max-width: 800px)').matches
}

// ====================================================================
//  焦点管理（面板开关时保存/恢复焦点，支持键盘导航）
// ====================================================================
var _hbLastFocus = null
function saveFocus() {
  var a = document.activeElement
  _hbLastFocus = (a && a !== document.body) ? a : null
}
function restoreFocus() {
  if (_hbLastFocus && document.contains(_hbLastFocus)) {
    try { _hbLastFocus.focus() } catch (e) {}
  }
  _hbLastFocus = null
}
function focusPanel(panel) {
  if (!panel) return
  var first = panel.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])')
  if (first) { try { first.focus() } catch (e) {} }
}

// 移动端：展开 / 收起 explorer 目录（全屏面板）
function toggleMobileExplorer(forceOpen) {
  var exp = document.querySelector('.explorer')
  var sidebar = document.querySelector('.left.sidebar')
  if (!exp) return false
  var collapsed = exp.classList.contains('collapsed')
  var open = typeof forceOpen === 'boolean' ? forceOpen : collapsed
  var content = exp.querySelector('.explorer-content')
  if (open) {
    exp.classList.remove('collapsed')
    exp.setAttribute('aria-expanded', 'true')
    if (content) {
      content.setAttribute('role', 'dialog')
      content.setAttribute('aria-modal', 'true')
    }
    if (sidebar) sidebar.classList.add('open')
    document.documentElement.classList.add('mobile-no-scroll')
    saveFocus()
    focusPanel(content || exp)
  } else {
    exp.classList.add('collapsed')
    exp.setAttribute('aria-expanded', 'false')
    if (content) {
      content.removeAttribute('role')
      content.removeAttribute('aria-modal')
    }
    if (sidebar) sidebar.classList.remove('open')
    document.documentElement.classList.remove('mobile-no-scroll')
    restoreFocus()
  }
  updateScrollLock()
  return true
}

function toggleHamburger() {
  // 顶栏最右侧汉堡按钮 = 设置面板（外观/音乐）
  var m = document.getElementById("hamburger-menu"); if (!m) return
  var open = m.classList.toggle("open")
  var btn = document.querySelector('#hamburger-btn')
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false')
  if (open) {
    saveFocus()
    focusPanel(m)
    refreshBgButtons()
  } else {
    restoreFocus()
  }
  updateScrollLock()
}
var _bgButtonsKey = null
function refreshBgButtons() {
  var row = document.querySelector(".hb-bg-row")
  if (!row) return
  var opts = currentBgOpts()
  // 选项未变化时跳过 DOM 重建（避免每次开面板都重建 + 重绑）
  var key = opts.map(function (o) { return o.id }).join(',')
  if (_bgButtonsKey === key) {
    var saved = localStorage.getItem(BG_KEY)
    row.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.bg === saved) })
    return
  }
  _bgButtonsKey = key
  row.innerHTML = opts.map(function (o) { return '<button class="hb-bg-btn" data-bg="'+o.id+'">'+o.label+'</button>' }).join("")
  // Re-attach handlers
  row.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.addEventListener("click", function () { setBg(this.dataset.bg) }) })
  // Restore active state
  var saved = localStorage.getItem(BG_KEY)
  if (saved) row.querySelectorAll(".hb-bg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.bg === saved) })
}
function closeHamburger() {
  var m = document.getElementById("hamburger-menu"); if (m) m.classList.remove("open")
  var btn = document.querySelector('#hamburger-btn')
  if (btn) btn.setAttribute('aria-expanded', 'false')
  restoreFocus()
  updateScrollLock();
}

function updateScrollLock() {
  var sidebarOpen = document.querySelector('.left.sidebar')?.classList.contains('open');
  var menuOpen = document.getElementById('hamburger-menu')?.classList.contains('open');
  var explorerOpen = isMobileUI() && document.querySelector('.explorer')?.classList.contains('collapsed') === false;
  document.body.style.overflow = (sidebarOpen || menuOpen || explorerOpen) ? 'hidden' : '';
}

// ====================================================================
//  Left sidebar extras: home link + nav cleanup
// ====================================================================
function injectHomeLink() {
  var s = document.querySelector('.left.sidebar')
  if (!s || s.querySelector('.home-link')) return
  var a = document.createElement('a')
  a.className = 'home-link'
  a.href = getBp() + '/'
  a.textContent = '安巢鸟的个人网站'
  s.insertBefore(a, s.firstChild)
}

function hideNavItem(name) {
  document.querySelectorAll('.left.sidebar .explorer .tree-item-self').forEach(function (el) {
    var t = el.matches('.nav-file-title, .folder-title')
      ? el
      : el.querySelector('.nav-file-title, .folder-title')
    if (t && t.textContent.trim() === name) {
      var li = el.closest('li')
      if (li) li.style.display = 'none'
    }
  })
}

// ====================================================================
//  Sidebar slide panel
// ====================================================================
function toggleSidebar() {
  var s = document.querySelector('.left.sidebar');
  if (!s) return;
  // 移动端：导航按钮 = 目录开关（与汉堡按钮一致，直达 explorer 目录）
  if (isMobileUI()) {
    var exp = document.querySelector('.explorer');
    if (exp && toggleMobileExplorer(exp.classList.contains('collapsed'))) return;
  }
  // PC 端：顶栏左侧按钮 = 折叠 / 展开左栏（复用 explorer 原生标题栏折叠）
  var tb = document.querySelector('.explorer .desktop-explorer');
  if (tb) tb.click();
}
function openSidebar() {
  var s = document.querySelector('.left.sidebar');
  if (s) s.classList.add('open');
}
function closeSidebar() {
  var s = document.querySelector('.left.sidebar');
  if (s) s.classList.remove('open');
  updateScrollLock();
}
// Esc 统一关闭：设置面板 / 侧边栏 / 移动端目录
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return
  var menu = document.getElementById('hamburger-menu')
  var menuOpen = menu && menu.classList.contains('open')
  var explorerOpen = isMobileUI() && document.querySelector('.explorer') &&
    !document.querySelector('.explorer').classList.contains('collapsed')
  if (menuOpen) { closeHamburger(); return }
  if (explorerOpen) {
    toggleMobileExplorer(false)
    return
  }
  closeSidebar()
});

// ====================================================================
//  Init
// ====================================================================
function init() {
  getBp()
  rebuildUI()
  injectHomeLink()
  hideNavItem('个人博客')
  bindHamburgerDelegate()
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

  // Restore music volume & loop
  var savedVol = localStorage.getItem('musicVolume');
  if (savedVol !== null) audio.volume = parseFloat(savedVol);
  var savedLoop = localStorage.getItem('musicLoop');
  if (savedLoop === '1') audio.loop = true;
  syncMusicUI()

  if (window.__music && window.__music.onChange) {
    window.__music.onChange(function(st) {
      var pb = document.querySelector('.hb-music-play')
      if (pb) pb.textContent = st.playing ? '⏸' : '▶'
      var tn = document.querySelector('.hb-music-track')
      if (tn) tn.textContent = st.track || '未播放'
    })
  }

  // Close sidebar when clicking outside
  // NOTE: 汉堡按钮/目录面板由事件委托统一处理，这里排除，避免与移动端目录开关冲突
  document.addEventListener('click', function(e) {
    var sidebar = document.querySelector('.left.sidebar');
    var navT = document.querySelector('#nav-toggle-btn');
    var hb = document.querySelector('#hamburger-btn');
    var inHb = hb && e.target && hb.contains(e.target);
    var inExplorer = e.target && e.target.closest && e.target.closest('.explorer');
    if (!inHb && !inExplorer && sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && navT && !navT.contains(e.target)) {
      closeSidebar();
    }
  });

  lazyLoadVideos()
  loadDailyQuote()
}

// ====================================================================
//  Prev / Next chapter
// ====================================================================
var _ci = null
function loadCI() {
  if (_ci) return Promise.resolve(_ci)
  // Reuse global fetchData promise if available
  if (typeof fetchData !== 'undefined' && typeof fetchData.then === 'function') {
    return fetchData.then(function (d) {
      _ci = d.content || d; return _ci
    }).catch(function () { return null })
  }
  return fetch(getBp() + '/static/contentIndex.json').then(function (r) { return r.json() }).then(function (d) {
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

// nav 事件触发时 DOM 已完成 morph，直接插入即可（无需 setTimeout 猜测时机）
document.addEventListener("nav", function () { insertPrevNext() })
document.addEventListener("DOMContentLoaded", function () { insertPrevNext() })

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
    var liP = document.getElementById("bg-image-light-pc"), diP = document.getElementById("bg-image-dark-pc")
    if (lv) lv.style.opacity = dark ? "0" : "1"; if (dv) dv.style.opacity = dark ? "1" : "0"
    if (li) li.style.opacity = dark ? "0" : "1"; if (di) di.style.opacity = dark ? "1" : "0"
    if (liP) liP.style.opacity = dark ? "0" : "1"; if (diP) diP.style.opacity = dark ? "1" : "0"
  }
  var fc = localStorage.getItem(FONT_COLOR_KEY)
  if (fc === "auto" || !fc) setFontColor("auto")
})
function startObserver() {
  var el = document.documentElement
  themeObserver.observe(el, { attributes: true, attributeFilter: ["data-theme", "saved-theme"] })
}

// Pause video when tab hidden
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    document.querySelectorAll('#bg-video-light, #bg-video-dark').forEach(function(v) { v.pause(); });
  }
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); startObserver() })
else { init(); startObserver() }
})();
