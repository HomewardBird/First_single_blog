;(function () {
  // ====================================================================
  //  Constants & Keys
  // ====================================================================
  var FONT_SIZE_KEY = "fontSize"
  var BG_KEY = "bgColor"
  var FONT_COLOR_KEY = "fontColor"
  var LOCK_KEY = "bgLocked"

  // Handler dedup set
  var _handlerSet = new WeakSet()

  // ====================================================================
  //  Base path
  // ====================================================================
  var _bp = ""
  function getBp() {
    if (!_bp) {
      var b = document.body
      _bp = (b && b.getAttribute("data-basepath")) || ""
    }
    return _bp
  }

  // ====================================================================
  //  Music Player
  // ====================================================================
  var tracks = [
    "05 Coffee Cats.m4a",
    "1-28 希望的明\u2F47.m4a",
    "2-06 玉磬漻漻.m4a",
    "2-16 风清月白.m4a",
    "26 Welcome School.m4a",
    "ornave-lofi-moon-light-553399.mp3",
    "monume-lofi-chill-chill-509496.mp3",
    "mao690276--527415.mp3",
    "lofidreams-cozy-lofi-background-music-for-study-457198.mp3",
    "apalonbeats-lofi-lofi-music-lofi-chill-2-560425.mp3",
  ]
  var cur = 0
  var audio = new Audio()
  audio.preload = "metadata"
  audio.loop = false
  audio.playbackRate = 1.0

  // ---- 浏览器缓存（Cache API）：只缓存实际播放的曲目 + 下一首，不做全量预载（会吃光带宽拖慢页面） ----
  var _cacheName = "blog-music-v1"
  var _objUrls = {} // 曲目索引 -> blob URL

  function cacheSupported() {
    return typeof window !== "undefined" && "caches" in window && !!window.isSecureContext
  }
  function trackUrl(i) {
    return getBp() + "/static/" + tracks[i]
  }

  // 从缓存取曲目（blob URL），未命中则回退网络地址
  function getTrackSrc(i, cb) {
    var u = trackUrl(i)
    if (!cacheSupported()) {
      cb(u)
      return
    }
    if (_objUrls[i]) {
      cb(_objUrls[i])
      return
    }
    caches
      .open(_cacheName)
      .then(function (cache) {
        return cache.match(u)
      })
      .then(function (res) {
        if (!res) {
          cb(u)
          return
        }
        return res.blob().then(function (blob) {
          try {
            var obj = URL.createObjectURL(blob)
            if (_objUrls[i]) URL.revokeObjectURL(_objUrls[i])
            _objUrls[i] = obj
            cb(obj)
          } catch (e) {
            cb(u)
          }
        })
      })
      .catch(function () {
        cb(u)
      })
  }

  // 后台缓存一首曲目（已缓存则跳过），并修剪旧曲目防止缓存无限膨胀。
  // 注意：cacheTrack(当前曲) 与 cacheTrack(下一首) 可能并发调用，
  // 共享 __recent 元数据 + 跨删除会互相覆盖，必须串行化。
  var _cacheQ = Promise.resolve()
  var _recentMax = 6
  function pruneMusicCache(keep, cache) {
    var META = "__recent"
    return cache
      .match(META)
      .then(function (r) {
        if (!r) return []
        return r.json()
      })
      .catch(function () {
        return []
      })
      .then(function (recent) {
        recent = recent.filter(function (x) {
          return x !== keep
        })
        recent.unshift(keep)
        if (recent.length > _recentMax) recent.length = _recentMax
        var stale = []
        for (var i = 0; i < tracks.length; i++) {
          if (i !== keep && recent.indexOf(i) === -1) {
            stale.push(i)
          }
        }
        return Promise.all(
          stale.map(function (i) {
            if (_objUrls[i]) {
              URL.revokeObjectURL(_objUrls[i])
              delete _objUrls[i]
            }
            return cache.delete(trackUrl(i)).catch(function () {})
          }),
        ).then(function () {
          return cache.put(
            META,
            new Response(JSON.stringify(recent), {
              headers: { "Content-Type": "application/json" },
            }),
          )
        })
      })
  }
  function cacheTrack(i) {
    _cacheQ = _cacheQ
      .catch(function () {})
      .then(function () {
        return doCacheTrack(i)
      })
    return _cacheQ
  }
  function doCacheTrack(i) {
    if (!cacheSupported()) return Promise.resolve(false)
    var u = trackUrl(i)
    return caches
      .open(_cacheName)
      .then(function (cache) {
        return cache.match(u).then(function (res) {
          var put = res
            ? Promise.resolve(true)
            : fetch(u).then(function (r) {
                if (!r.ok) throw Error("http " + r.status)
                return cache.put(u, r).then(function () {
                  return true
                })
              })
          return put
            .then(function () {
              return pruneMusicCache(i, cache)
            })
            .catch(function () {
              return false
            })
        })
      })
      .catch(function () {
        return false
      })
  }

  // 仅在浏览器空闲时预取下一首；慢速网络 / 省流模式下跳过，
  // 避免整首下载抢占带宽、拖慢页面图片与文章加载
  function prefetchNextTrack() {
    if (!cacheSupported()) return
    try {
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (
        conn &&
        (conn.saveData || conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")
      )
        return
    } catch (e) {}
    var rq =
      window.requestIdleCallback ||
      function (fn) {
        return setTimeout(fn, 4000)
      }
    rq(
      function () {
        cacheTrack((cur + 1) % tracks.length)
      },
      { timeout: 6000 },
    )
  }

  function loadTrack(i, cb) {
    var want = ((i % tracks.length) + tracks.length) % tracks.length
    cur = want
    getTrackSrc(want, function (src) {
      if (want !== cur) return // 期间用户已切歌，丢弃过期结果
      audio.src = src
      audio.load()
      if (cb) cb() // 确保 src 设置完成后才 play，避免播放失败
    })
    // 提前缓存下一首，切歌时可直接用 blob（空闲时进行，避免抢带宽）
    prefetchNextTrack()
  }

  // 播放看门狗：发出播放请求后长时间无进展（网络卡住）则自动跳过。
  // 大文件 + 弱网下 6 秒远远不够（可能还在缓冲），给足 20 秒并区分提示。
  var _watchdog = null
  function clearWatchdog() {
    if (_watchdog) {
      clearTimeout(_watchdog)
      _watchdog = null
    }
  }
  function armWatchdog() {
    clearWatchdog()
    _watchdog = setTimeout(function () {
      if (audio.paused || audio.ended) return
      if (audio.readyState >= 2) return
      var waited = 20000
      var buf = audio.buffered
      var hasProgress = buf && buf.length > 0 && buf.end(buf.length - 1) > 0.5
      if (hasProgress) {
        // 有实际下载进度，再给 20 秒（大文件弱网首载就是慢）
        _showToast("音乐加载中，网络较慢请稍候…")
        _watchdog = setTimeout(function () {
          if (audio.paused || audio.ended) return
          if (audio.readyState >= 2) return
          _showToast("音频加载超时，已跳过")
          loadTrack(cur + 1, safePlay)
          _notify()
        }, waited)
        return
      }
      _showToast("音频加载超时，已跳过")
      loadTrack(cur + 1, safePlay)
      _notify()
    }, 6000)
  }
  function safePlay() {
    armWatchdog()
    audio.play().catch(function () {
      // play() 在缓冲不足时会 reject（AbortError），不是真失败，
      // 交给看门狗继续等待缓冲，避免误报"播放失败"
      if (audio.readyState < 2) return
      clearWatchdog()
      _showToast("播放失败")
    })
  }
  audio.addEventListener("playing", clearWatchdog)
  audio.addEventListener("canplay", clearWatchdog)
  audio.addEventListener("ended", clearWatchdog)
  audio.addEventListener("pause", clearWatchdog)

  var _toastTimer = null
  function createToast(text, link, dur, cls) {
    dur = dur || 2000
    cls = cls || "music-toast"
    var old = document.querySelector("." + cls)
    if (old) old.remove()
    if (_toastTimer) {
      clearTimeout(_toastTimer)
      _toastTimer = null
    }
    var t = document.createElement("div")
    t.className = cls
    var base =
      "position:fixed;bottom:calc(6rem + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);z-index:10050;background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.3);border-radius:14px;padding:0.85rem 1.5rem;font-size:0.92rem;color:var(--dark);opacity:0;transition:opacity 0.4s ease;pointer-events:none;box-shadow:0 8px 32px rgba(0,0,0,0.12)"
    t.style.cssText = base
    if (link) {
      t.innerHTML =
        '<a href="' +
        link +
        '" style="color:var(--secondary);font-weight:600;text-decoration:none">' +
        text +
        "</a>"
    } else {
      t.textContent = text
    }
    document.body.appendChild(t)
    requestAnimationFrame(function () {
      t.style.opacity = "1"
    })
    _toastTimer = setTimeout(function () {
      t.style.opacity = "0"
      _toastTimer = setTimeout(function () {
        if (t.parentNode) t.remove()
      }, 400)
    }, dur)
  }

  function _showToast(msg) {
    createToast(msg)
  }

  audio.addEventListener("ended", function () {
    loadTrack(cur + 1, safePlay)
    _notify()
  })
  audio.addEventListener("error", function () {
    clearWatchdog()
    loadTrack(cur + 1, safePlay)
    _showToast("音频加载失败，跳过")
    _notify()
  })

  var _cbs = []
  function _notify() {
    var st = {
      playing: !audio.paused,
      track: tracks[cur]
        .split("/")
        .pop()
        .replace(/\.[^.]+$/, ""),
    }
    _cbs.forEach(function (fn) {
      fn(st)
    })
  }

  window.__music = {
    toggle: function () {
      if (!audio.src || audio.src === location.href) {
        loadTrack(0, safePlay)
      } else if (audio.paused) {
        safePlay()
      } else {
        audio.pause()
      }
      cacheTrack(cur)
      _notify()
    },
    next: function () {
      loadTrack(cur + 1, safePlay)
      _notify()
    },
    prev: function () {
      loadTrack(cur - 1 + tracks.length, safePlay)
      _notify()
    },
    onChange: function (fn) {
      _cbs.push(fn)
    },
    getState: function () {
      return {
        playing: !audio.paused,
        track: tracks[cur]
          .split("/")
          .pop()
          .replace(/\.[^.]+$/, ""),
      }
    },
    setVolume: function (v) {
      audio.volume = v
      localStorage.setItem("musicVolume", v)
    },
    getVolume: function () {
      return audio.volume
    },
    toggleLoop: function () {
      audio.loop = !audio.loop
      localStorage.setItem("musicLoop", audio.loop ? "1" : "0")
      return audio.loop
    },
    getLoop: function () {
      return audio.loop
    },
  }

  var _quotesCache = null
  var _quoteFetching = false
  function loadDailyQuote() {
    var el = document.getElementById("random-quote")
    if (!el) return
    if (_quotesCache) {
      var cq = _quotesCache[Math.floor(Math.random() * _quotesCache.length)]
      el.textContent = "「 " + (cq.text || "") + " 」"
      el.title = cq.source || ""
      return
    }
    if (_quoteFetching) return
    _quoteFetching = true
    try {
      var ctrl = new AbortController()
      var tm = setTimeout(function () {
        ctrl.abort()
      }, 5000)
      fetch(getBp() + "/quotes.json", { signal: ctrl.signal })
        .then(function (r) {
          if (!r.ok) throw Error()
          return r.json()
        })
        .then(function (qs) {
          clearTimeout(tm)
          _quotesCache = qs
          var q = qs[Math.floor(Math.random() * qs.length)]
          el.textContent = "「 " + (q.text || "") + " 」"
          el.title = q.source || ""
        })
        .catch(function () {
          el.textContent = "「 欢迎你的到来 」"
        })
        .finally(function () {
          _quoteFetching = false
        })
    } catch (e) {
      el.textContent = "「 欢迎你的到来 」"
      _quoteFetching = false
    }
  }

  function syncMusicUI() {
    if (!window.__music) return
    var vs = document.querySelector(".hb-vol-slider")
    if (vs) vs.value = audio.volume.toString()
    var vl = document.querySelector(".hb-vol-label")
    if (vl) vl.textContent = audio.volume.toFixed(2)
    var lb = document.querySelector(".hb-loop-btn")
    if (lb) {
      lb.textContent = audio.loop ? "🔂" : "🔁"
      lb.classList.toggle("active", audio.loop)
    }
  }

  // ====================================================================
  //  Reading progress save / restore
  // ====================================================================
  function getSlug() {
    return window.location.pathname.replace(/^\/|\/$/g, "") || "index"
  }

  // 正文图片懒加载：文章切换时只拉视口内的图，大幅加快跳转
  function lazyLoadImages() {
    document.querySelectorAll(".page article img:not([loading])").forEach(function (img) {
      img.setAttribute("loading", "lazy")
      img.setAttribute("decoding", "async")
    })
  }

  // 壁纸 Blur-up：高清背景图加载完成后淡入并隐藏模糊占位
  function setupBgBlurUp() {
    document.querySelectorAll(".bg-layer").forEach(function (layer) {
      var full = layer.querySelector(".bg-full")
      var thumb = layer.querySelector(".bg-thumb")
      if (!full || full.classList.contains("loaded")) return
      var onLoad = function () {
        full.classList.add("loaded")
        if (thumb) thumb.style.opacity = "0"
      }
      if (full.complete && full.naturalWidth > 0) onLoad()
      else full.addEventListener("load", onLoad)
    })
  }

  document.addEventListener("nav", function () {
    lazyLoadImages()
    setupBgBlurUp()
    injectHomeLink()
    hideNavItem("个人博客")
    // SPA 导航会 micromorph 整个 <body>，重建被清掉的回到顶部按钮
    initBackToTop()
    // explorer 树可能晚于 nav 渲染，延迟重试
    setTimeout(function () {
      hideNavItem("个人博客")
    }, 150)
    // 移动端：导航后强制收起目录面板
    if (isMobileUI()) {
      var exp = document.querySelector(".explorer")
      if (exp && !exp.classList.contains("collapsed")) toggleMobileExplorer(false)
    }
    if (!document.getElementById("hamburger-menu")) {
      rebuildUI()
      syncMusicUI()
    } else {
      closeHamburger()
    }
    closeSidebar()
    var tbT = document.querySelector("#top-bar .top-bar-title")
    if (tbT) tbT.textContent = document.title || "归鸟的馆藏日志"
    restoreLock()
    var cur = getSlug()
    if (localStorage.getItem(LOCK_KEY) !== "true") {
      // 首页恢复图片背景；子页面自动切纯色（无条件，任何导航来源均生效）
      if (cur === "index") setBg("default")
      else setBg(isDark() ? "dark" : "cream")
    }
    // SPA reconstructs <body>, 重写当前背景的内联样式
    setBg(localStorage.getItem(BG_KEY) || "default")
    loadDailyQuote()
  })

  // ====================================================================
  //  Toast
  // ====================================================================
  function showToast(text, link, dur) {
    dur = dur || 5000
    createToast(text, link, dur, "toast-notification")
    var t = document.querySelector(".toast-notification:last-child")
    if (t) {
      t.style.maxWidth = "90vw"
      t.style.transform = "translateX(-50%) translateY(16px)"
      t.style.cursor = "default"
      t.style.display = "flex"
      t.style.alignItems = "center"
      t.style.gap = "0.8rem"
      var btn = document.createElement("button")
      btn.textContent = "\u00D7"
      btn.style.cssText =
        "background:none;border:none;font-size:1.2rem;cursor:pointer;opacity:0.5;padding:0;line-height:1;flex-shrink:0"
      btn.onclick = function () {
        t.remove()
      }
      if (!link) {
        var sp = t.querySelector("span") || t
        sp.after(btn)
      }
      requestAnimationFrame(function () {
        t.style.transform = "translateX(-50%) translateY(0)"
      })
    }
  }

  // ====================================================================
  //  Font Size
  // ====================================================================
  function setFontSize(sz) {
    var sizes = { small: "14px", medium: "16px", large: "19px" }
    document.documentElement.style.fontSize = sizes[sz] || "16px"
    localStorage.setItem(FONT_SIZE_KEY, sz)
    document.querySelectorAll(".hb-font-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.sz === sz)
    })
  }
  function restoreFontSize() {
    var s = localStorage.getItem(FONT_SIZE_KEY)
    if (s) setFontSize(s)
  }

  // ====================================================================
  //  Background Colour (solid colour override)
  // ====================================================================
  // ====================================================================
  //  Theme detection
  // ====================================================================
  function isDark() {
    return (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.getAttribute("saved-theme") === "dark"
    )
  }
  function currentBgOpts() {
    return isDark()
      ? [
          { id: "default", label: "图片" },
          { id: "dark", label: "深灰" },
          { id: "black", label: "纯黑" },
        ]
      : [
          { id: "default", label: "图片" },
          { id: "white", label: "纯白" },
          { id: "cream", label: "米白" },
          { id: "gray", label: "浅灰" },
          { id: "blue", label: "雾蓝" },
        ]
  }
  function setBg(id) {
    localStorage.setItem(BG_KEY, id)
    document.body.dataset.bgColor = id
    var ov = document.getElementById("bg-overlay")
    if (!ov) return
    var colors = {
      default: null,
      white: "rgba(250,248,248,0.95)",
      cream: "rgba(252,244,230,0.95)",
      gray: "rgba(200,200,200,0.95)",
      dark: "rgba(30,30,32,0.95)",
      black: "rgba(10,10,10,0.98)",
      blue: "rgba(210,225,240,0.95)",
    }
    var c = colors[id]
    if (c) {
      document
        .querySelectorAll("#bg-image-light, #bg-image-dark, #bg-image-light-pc, #bg-image-dark-pc")
        .forEach(function (v) {
          v.style.opacity = "0"
        })
      ov.style.background = c
      ov.style.backdropFilter = "none"
      ov.style.webkitBackdropFilter = "none"
    } else {
      var dark = isDark()
      var li = document.getElementById("bg-image-light"),
        di = document.getElementById("bg-image-dark")
      var liP = document.getElementById("bg-image-light-pc"),
        diP = document.getElementById("bg-image-dark-pc")
      if (li) li.style.opacity = dark ? "0" : "1"
      if (di) di.style.opacity = dark ? "1" : "0"
      // PC：亮/暗各用一张图（light.webp / dark.webp）
      if (liP) liP.style.opacity = dark ? "0" : "1"
      if (diP) diP.style.opacity = dark ? "1" : "0"
      ov.style.background = ""
      ov.style.backdropFilter = ""
      ov.style.webkitBackdropFilter = ""
    }
    document.querySelectorAll(".hb-bg-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.bg === id)
    })
  }
  function restoreBg() {
    var s = localStorage.getItem(BG_KEY)
    if (s) setBg(s)
  }

  // ====================================================================
  //  Font Colour mode (data-font-* / data-bg-*)
  // ====================================================================
  var fontColorOpts = [
    { id: "auto", label: "自动" },
    { id: "dark", label: "深色" },
    { id: "light", label: "浅色" },
    { id: "gray", label: "灰色" },
    { id: "sepia", label: "复古" },
    { id: "blue", label: "蓝调" },
  ]

  // 亮色模式不展示「浅色」，暗色模式不展示「深色」「灰色」（深浅无意义且看不清）
  function getFontColorOpts() {
    var dark = isDark()
    return fontColorOpts.filter(function (o) {
      if (o.id === "dark" && dark) return false
      if (o.id === "light" && !dark) return false
      if (o.id === "gray" && dark) return false
      return true
    })
  }

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
    document.querySelectorAll(".hb-fc-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.fc === id)
    })
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
    document.querySelectorAll(".hb-lock-btn").forEach(function (b) {
      b.classList.toggle("locked", locked)
    })
  }

  function restoreLock() {
    var locked = localStorage.getItem(LOCK_KEY) === "true"
    document.querySelectorAll(".hb-lock-btn").forEach(function (b) {
      b.classList.toggle("locked", locked)
    })
  }

  // ====================================================================
  //  首帧提速：把当前主题激活图层的背景大图从 lazy 提升为 eager。
  //  HTML 里统一 lazy 是为了不让隐藏主题的图下载；这里只提升激活那张，
  //  让全图下载提前 ~1.2s（懒加载调度延迟），弱网下背景淡入显著提前。
  // ====================================================================
  function boostActiveBg() {
    var dark = isDark()
    var mobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches
    var id = mobile ? (dark ? "bg-image-dark" : "bg-image-light") : (dark ? "bg-image-dark-pc" : "bg-image-light-pc")
    var layer = document.getElementById(id)
    if (!layer) return
    var full = layer.querySelector(".bg-full")
    if (full && full.getAttribute("loading") === "lazy") {
      full.loading = "eager"
    }
  }

  // ====================================================================
  //  移动端浏览器主题色：跟随亮/暗主题，顶栏/状态栏不再闪白
  // ====================================================================
  var _themeColors = { light: "#faf8f8", dark: "#161618" }
  function syncThemeColor() {
    var m = document.querySelector('meta[name="theme-color"]')
    if (!m) {
      m = document.createElement("meta")
      m.setAttribute("name", "theme-color")
      document.head.appendChild(m)
    }
    m.setAttribute("content", isDark() ? _themeColors.dark : _themeColors.light)
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
      var menu = document.createElement("div")
      menu.id = "hamburger-menu"
      menu.innerHTML = buildMenuHTML()
      menu.addEventListener("click", function (e) {
        e.stopPropagation()
      })
      document.body.appendChild(menu)
      var backdrop = document.createElement("div")
      backdrop.id = "hamburger-backdrop"
      document.body.appendChild(backdrop)
    }
    attachHandlers()
    if (window.__music) {
      var st = window.__music.getState()
      var pb = document.querySelector(".hb-music-play")
      if (pb) pb.textContent = st.playing ? "\u23F8" : "\u25B6"
      var tn = document.querySelector(".hb-music-track")
      if (tn) tn.textContent = st.track || "未播放"
    }
  }

  function buildMenuHTML() {
    var fHtml = [
      { sz: "small", l: "A\u207B" },
      { sz: "medium", l: "A" },
      { sz: "large", l: "A\u207A" },
    ]
      .map(function (b) {
        return '<button class="hb-font-btn" data-sz="' + b.sz + '">' + b.l + "</button>"
      })
      .join("")

    // Background (theme-aware)
    var bHtml = currentBgOpts()
      .map(function (o) {
        return '<button class="hb-bg-btn" data-bg="' + o.id + '">' + o.label + "</button>"
      })
      .join("")

    // Font colour
    var fcHtml = getFontColorOpts()
      .map(function (o) {
        return '<button class="hb-fc-btn" data-fc="' + o.id + '">' + o.label + "</button>"
      })
      .join("")

    return [
      '<div class="hb-section"><div class="hb-title">🔅 外观</div>',
      '<div class="hb-sub">字体大小</div><div class="hb-row">',
      fHtml,
      "</div>",
      '<div class="hb-sub">背景颜色</div><div class="hb-row hb-bg-row">',
      bHtml,
      "</div>",
      '<div class="hb-sub">文字颜色</div><div class="hb-row hb-fc-row">',
      fcHtml,
      "</div>",
      '<div class="hb-inline-row">',
      '<button class="hb-lock-btn" title="锁定背景不变">🔒 锁定</button>',
      "</div></div>",
      '<div class="hb-section"><div class="hb-title">🎵 音乐</div>',
      '<div class="hb-music-row">',
      '<button class="hb-music-btn hb-music-prev" title="上一首">⏮</button>',
      '<button class="hb-music-btn hb-music-play" title="播放/暂停">▶</button>',
      '<button class="hb-music-btn hb-music-next" title="下一首">⏭</button>',
      "</div>",
      '<div class="hb-music-track">未播放</div>',
      '<div class="hb-volume-row">',
      '<span class="hb-vol-icon">🔊</span>',
      '<input type="range" class="hb-vol-slider" min="0" max="1" step="0.05" value="1">',
      '<span class="hb-vol-label">1.00</span>',
      "</div>",
      '<div class="hb-loop-row">',
      '<button class="hb-loop-btn" title="循环模式">🔁</button>',
      "</div>",
      "</div>",
    ].join("")
  }

  function attachHandlers() {
    document.querySelectorAll(".hb-font-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        setFontSize(this.dataset.sz)
      })
    })
    document.querySelectorAll(".hb-bg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        setBg(this.dataset.bg)
      })
    })
    document.querySelectorAll(".hb-fc-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        setFontColor(this.dataset.fc)
      })
    })
    document.querySelectorAll(".hb-lock-btn").forEach(function (b) {
      b.addEventListener("click", toggleLock)
    })
    ;[
      [
        ".hb-music-play",
        "click",
        function () {
          if (window.__music) window.__music.toggle()
        },
      ],
      [
        ".hb-music-next",
        "click",
        function () {
          if (window.__music) window.__music.next()
        },
      ],
      [
        ".hb-music-prev",
        "click",
        function () {
          if (window.__music) window.__music.prev()
        },
      ],
      [
        ".hb-vol-slider",
        "input",
        function () {
          var v = parseFloat(this.value)
          if (window.__music) window.__music.setVolume(v)
          var l = document.querySelector(".hb-vol-label")
          if (l) l.textContent = v.toFixed(2)
        },
      ],
      [
        ".hb-loop-btn",
        "click",
        function () {
          if (!window.__music) return
          var loop = window.__music.toggleLoop()
          this.textContent = loop ? "🔂" : "🔁"
          this.classList.toggle("active", loop)
        },
      ],
      [
        "#nav-toggle-btn",
        "click",
        function (e) {
          e.stopPropagation()
          toggleSidebar()
        },
      ],
      [
        "#tb-search-btn",
        "click",
        function () {
          var b = document.querySelector(".search-button")
          if (b) b.click()
        },
      ],
      [
        "#tb-theme-btn",
        "click",
        function () {
          var b = document.querySelector("button.darkmode")
          if (b) b.click()
        },
      ],
    ].forEach(function (a) {
      var el = document.querySelector(a[0])
      if (el && !_handlerSet.has(el)) {
        _handlerSet.add(el)
        el.addEventListener(a[1], a[2])
      }
    })
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
      if (btn) {
        e.stopPropagation()
        toggleHamburger()
        return
      }
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
    return window.matchMedia && window.matchMedia("(max-width: 800px)").matches
  }

  // ====================================================================
  //  焦点管理（面板开关时保存/恢复焦点，支持键盘导航）
  // ====================================================================
  var _hbLastFocus = null
  function saveFocus() {
    var a = document.activeElement
    _hbLastFocus = a && a !== document.body ? a : null
  }
  function restoreFocus() {
    if (_hbLastFocus && document.contains(_hbLastFocus)) {
      try {
        _hbLastFocus.focus()
      } catch (e) {}
    }
    _hbLastFocus = null
  }
  function focusPanel(panel) {
    if (!panel) return
    var first = panel.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])')
    if (first) {
      try {
        first.focus()
      } catch (e) {}
    }
  }

  // 移动端：顶栏导航按钮 ☰ / ✕ 切换（抽屉打开时变成关闭按钮）
  var _navToggleSVG = {
    menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="15" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="15" y2="18"></line></svg>',
    close:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  }
  function setNavToggleIcon(open) {
    var btn = document.getElementById("nav-toggle-btn")
    if (!btn) return
    btn.innerHTML = open ? _navToggleSVG.close : _navToggleSVG.menu
    btn.setAttribute("aria-label", open ? "关闭导航" : "导航")
  }
  function toggleMobileExplorer(forceOpen) {
    var exp = document.querySelector(".explorer")
    var sidebar = document.querySelector(".left.sidebar")
    if (!exp) return false
    var collapsed = exp.classList.contains("collapsed")
    var open = typeof forceOpen === "boolean" ? forceOpen : collapsed
    var content = exp.querySelector(".explorer-content")
    if (open) {
      exp.classList.remove("collapsed")
      exp.setAttribute("aria-expanded", "true")
      if (content) {
        content.setAttribute("role", "dialog")
        content.setAttribute("aria-modal", "true")
      }
      if (sidebar) sidebar.classList.add("open")
      document.documentElement.classList.add("mobile-no-scroll")
      saveFocus()
      focusPanel(content || exp)
    } else {
      exp.classList.add("collapsed")
      exp.setAttribute("aria-expanded", "false")
      if (content) {
        content.removeAttribute("role")
        content.removeAttribute("aria-modal")
      }
      if (sidebar) sidebar.classList.remove("open")
      document.documentElement.classList.remove("mobile-no-scroll")
      restoreFocus()
    }
    setNavToggleIcon(open)
    updateScrollLock()
    return true
  }

  function toggleHamburger() {
    // 顶栏最右侧汉堡按钮 = 设置面板（外观/音乐）
    var m = document.getElementById("hamburger-menu")
    if (!m) return
    var open = m.classList.toggle("open")
    var btn = document.querySelector("#hamburger-btn")
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false")
    var bd = document.getElementById("hamburger-backdrop")
    if (bd) bd.classList.toggle("open", open)
    if (open) {
      saveFocus()
      focusPanel(m)
      refreshBgButtons()
      refreshFcButtons()
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
    var key = opts
      .map(function (o) {
        return o.id
      })
      .join(",")
    if (_bgButtonsKey === key) {
      var saved = localStorage.getItem(BG_KEY)
      row.querySelectorAll(".hb-bg-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.bg === saved)
      })
      return
    }
    _bgButtonsKey = key
    row.innerHTML = opts
      .map(function (o) {
        return '<button class="hb-bg-btn" data-bg="' + o.id + '">' + o.label + "</button>"
      })
      .join("")
    // Re-attach handlers
    row.querySelectorAll(".hb-bg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        setBg(this.dataset.bg)
      })
    })
    // Restore active state
    var saved = localStorage.getItem(BG_KEY)
    if (saved)
      row.querySelectorAll(".hb-bg-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.bg === saved)
      })
  }

  // 文字颜色选项随主题增减（白天无「浅色」、夜间无「深色」）
  var _fcButtonsKey = null
  function refreshFcButtons() {
    var row = document.querySelector(".hb-fc-row")
    if (!row) return
    var opts = getFontColorOpts()
    var key = opts
      .map(function (o) {
        return o.id
      })
      .join(",")
    if (_fcButtonsKey === key) {
      var fc = localStorage.getItem(FONT_COLOR_KEY)
      row.querySelectorAll(".hb-fc-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.fc === fc)
      })
      return
    }
    _fcButtonsKey = key
    row.innerHTML = opts
      .map(function (o) {
        return '<button class="hb-fc-btn" data-fc="' + o.id + '">' + o.label + "</button>"
      })
      .join("")
    row.querySelectorAll(".hb-fc-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        setFontColor(this.dataset.fc)
      })
    })
    var fc = localStorage.getItem(FONT_COLOR_KEY)
    if (fc)
      row.querySelectorAll(".hb-fc-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.fc === fc)
      })
  }
  function closeHamburger() {
    var m = document.getElementById("hamburger-menu")
    if (m) m.classList.remove("open")
    var bd = document.getElementById("hamburger-backdrop")
    if (bd) bd.classList.remove("open")
    var btn = document.querySelector("#hamburger-btn")
    if (btn) btn.setAttribute("aria-expanded", "false")
    restoreFocus()
    updateScrollLock()
  }

  function updateScrollLock() {
    var sidebarOpen = document.querySelector(".left.sidebar")?.classList.contains("open")
    var menuOpen = document.getElementById("hamburger-menu")?.classList.contains("open")
    var explorerOpen =
      isMobileUI() && document.querySelector(".explorer")?.classList.contains("collapsed") === false
    document.body.style.overflow = sidebarOpen || menuOpen || explorerOpen ? "hidden" : ""
  }

  // ====================================================================
  //  Left sidebar extras: home link + nav cleanup
  // ====================================================================
  function injectHomeLink() {
    var s = document.querySelector(".left.sidebar")
    if (!s || s.querySelector(".home-link")) return
    var a = document.createElement("a")
    a.className = "home-link"
    a.href = getBp() + "/"
    a.textContent = "安巢鸟的个人网站"
    s.insertBefore(a, s.firstChild)
  }

  function hideNavItem(name) {
    document.querySelectorAll(".left.sidebar .explorer .tree-item-self").forEach(function (el) {
      var t = el.matches(".nav-file-title, .folder-title")
        ? el
        : el.querySelector(".nav-file-title, .folder-title")
      if (t && t.textContent.trim() === name) {
        var li = el.closest("li")
        if (li) li.style.display = "none"
      }
    })
  }

  // ====================================================================
  //  Sidebar slide panel
  // ====================================================================
  function toggleSidebar() {
    var s = document.querySelector(".left.sidebar")
    if (!s) return
    // 移动端：导航按钮 = 目录开关（与汉堡按钮一致，直达 explorer 目录）
    if (isMobileUI()) {
      var exp = document.querySelector(".explorer")
      if (exp && toggleMobileExplorer(exp.classList.contains("collapsed"))) return
    }
    // PC 端：顶栏左侧按钮 = 折叠 / 展开左栏（复用 explorer 原生标题栏折叠）
    var tb = document.querySelector(".explorer .desktop-explorer")
    if (tb) tb.click()
  }
  // 移动端初始化：目录面板默认收起（否则插件默认展开导致首屏被面板盖住）
  function initMobilePanel() {
    if (!isMobileUI()) return
    setNavToggleIcon(false)
    var exp = document.querySelector(".explorer")
    if (exp && !exp.classList.contains("collapsed")) toggleMobileExplorer(false)
  }
  function closeSidebar() {
    var s = document.querySelector(".left.sidebar")
    if (s) s.classList.remove("open")
    updateScrollLock()
  }
  // Esc 统一关闭：设置面板 / 侧边栏 / 移动端目录
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return
    var menu = document.getElementById("hamburger-menu")
    var menuOpen = menu && menu.classList.contains("open")
    var explorerOpen =
      isMobileUI() &&
      document.querySelector(".explorer") &&
      !document.querySelector(".explorer").classList.contains("collapsed")
    if (menuOpen) {
      closeHamburger()
      return
    }
    if (explorerOpen) {
      toggleMobileExplorer(false)
      return
    }
    closeSidebar()
  })

  // ====================================================================
  //  Image Lightbox (Pan & Zoom) —— 点击正文图片放大查看
  // ====================================================================
  var _lb = null // 灯箱根元素（懒创建、全站复用）
  var _lbOpen = false
  var _lbState = {
    list: [],
    idx: 0,
    scale: 1,
    fit: 1,
    min: 1,
    max: 10,
    rot: 0,
    tx: 0,
    ty: 0,
    natW: 0,
    natH: 0,
    stageW: 0,
    stageH: 0,
    lastTap: 0,
    lastTapX: 0,
    lastTapY: 0,
  }
  var _lbG = null // 当前手势状态

  function lbIcon(inner) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      inner +
      "</svg>"
    )
  }

  function lbStageSize() {
    var st = document.getElementById("lightbox-stage")
    if (!st) return
    _lbState.stageW = st.clientWidth
    _lbState.stageH = st.clientHeight
  }

  function lbComputeFit() {
    var s = _lbState
    var el = document.getElementById("lightbox-img")
    if (!el) return
    s.natW = el.naturalWidth
    s.natH = el.naturalHeight
    if (!s.natW || !s.natH) return
    lbStageSize()
    var m = window.innerWidth < 800 ? 16 : 48
    var maxW = Math.max(s.stageW - m * 2, 40)
    var maxH = Math.max(s.stageH - m * 2, 40)
    s.fit = Math.min(maxW / s.natW, maxH / s.natH, 1)
    s.min = s.fit
    s.max = Math.max(s.fit * 8, 1.5)
  }

  function lbClamp() {
    var s = _lbState
    var swap = s.rot % 180 !== 0
    var effW = (swap ? s.natH : s.natW) * s.scale
    var effH = (swap ? s.natW : s.natH) * s.scale
    var mx = Math.max((effW - s.stageW) / 2, 0)
    var my = Math.max((effH - s.stageH) / 2, 0)
    s.tx = Math.max(-mx, Math.min(mx, s.tx))
    s.ty = Math.max(-my, Math.min(my, s.ty))
  }

  function lbApply(animate) {
    var s = _lbState
    var el = document.getElementById("lightbox-img")
    if (!el) return
    if (animate) {
      el.classList.add("lb-anim")
      setTimeout(function () {
        el.classList.remove("lb-anim")
      }, 280)
    }
    el.classList.toggle("lb-zoomed", s.scale > s.fit * 1.02)
    // left:50%/top:50% 已使图片居中，tx/ty 是相对中心的偏移
    el.style.transform =
      "translate(" +
      s.tx +
      "px," +
      s.ty +
      "px) translate(-50%,-50%) rotate(" +
      s.rot +
      "deg) scale(" +
      s.scale +
      ")"
  }

  function lbReset(animate) {
    var s = _lbState
    s.scale = s.fit
    s.tx = 0
    s.ty = 0
    lbApply(animate)
  }

  function lbSetScale(next, cx, cy, animate) {
    var s = _lbState
    if (cx === undefined) {
      cx = 0
      cy = 0
    }
    next = Math.max(s.min, Math.min(s.max, next))
    var k = next / s.scale
    s.tx = cx - (cx - s.tx) * k
    s.ty = cy - (cy - s.ty) * k
    s.scale = next
    lbClamp()
    lbApply(animate)
  }

  function lbRotate(dir) {
    var s = _lbState
    s.rot = (((s.rot + dir * 90) % 360) + 360) % 360
    lbClamp()
    lbApply(true)
  }

  function lbPrev() {
    var s = _lbState
    if (s.list.length < 2) return
    s.idx = (s.idx - 1 + s.list.length) % s.list.length
    lbShow()
  }

  function lbNext() {
    var s = _lbState
    if (s.list.length < 2) return
    s.idx = (s.idx + 1) % s.list.length
    lbShow()
  }

  function lbUpdateUI() {
    var s = _lbState
    var n = s.list.length
    var c = document.getElementById("lightbox-count")
    if (c) c.textContent = n ? s.idx + 1 + " / " + n : ""
    var p = document.querySelector('#lightbox [data-act="prev"]')
    var nx = document.querySelector('#lightbox [data-act="next"]')
    if (p) p.disabled = n < 2
    if (nx) nx.disabled = n < 2
    // 图片未加载完成时禁用缩放 / 旋转 / 1:1，避免在空图上操作
    var el = document.getElementById("lightbox-img")
    var ready = !!el && !el.hasAttribute("data-lb-error") && el.naturalWidth > 0
    document
      .querySelectorAll(
        '#lightbox [data-act="zoomin"], #lightbox [data-act="zoomout"], #lightbox [data-act="fit"], #lightbox [data-act="rotl"], #lightbox [data-act="rotr"]',
      )
      .forEach(function (b) {
        b.disabled = !ready
      })
  }

  // 图片加载超时提示（弱网下避免用户对着空白界面干等）
  var _lbLoadTimer = null
  function clearLbTimer() {
    if (_lbLoadTimer) {
      clearTimeout(_lbLoadTimer)
      _lbLoadTimer = null
    }
  }
  function lbArmTimer() {
    clearLbTimer()
    _lbLoadTimer = setTimeout(function () {
      _lbLoadTimer = null
      if (!_lbOpen) return
      var el = document.getElementById("lightbox-img")
      if (el && !el.hasAttribute("data-lb-error") && el.naturalWidth === 0) {
        showToast("图片加载超时，请检查网络（点击空白处可关闭）")
      }
    }, 10000)
  }

  function lbShow() {
    var s = _lbState
    var img = s.list[s.idx]
    if (!img) return
    var el = document.getElementById("lightbox-img")
    var loader = document.getElementById("lightbox-loader")
    var src = (img.currentSrc || img.src || "").split("#")[0]
    if (el.src !== src || el.hasAttribute("data-lb-error")) {
      // 换图或上次加载失败：先清空 src 再赋值（相同 URL 需清空才能重新加载）
      if (el.hasAttribute("data-lb-error")) el.src = ""
      el.src = src
      el.removeAttribute("data-lb-error")
      if (loader) loader.classList.add("show")
      lbArmTimer()
    } else {
      clearLbTimer()
      if (loader) loader.classList.remove("show")
    }
    el.alt = img.alt || ""
    s.rot = 0
    lbStageSize()
    lbComputeFit()
    lbReset(false)
    lbUpdateUI()
  }

  function lbTap(x, y) {
    var s = _lbState
    var el = document.getElementById("lightbox-img")
    if (!el) return
    var rect = el.getBoundingClientRect()
    var inImg = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    var now = Date.now()
    if (inImg) {
      // 双击图片：放大 / 还原
      if (now - s.lastTap < 300 && Math.hypot(x - s.lastTapX, y - s.lastTapY) < 40) {
        if (s.scale > s.fit * 1.02) lbReset(true)
        else lbSetScale(s.fit * 2.5, x - s.stageW / 2, y - s.stageH / 2, true)
        s.lastTap = 0
      } else {
        s.lastTap = now
        s.lastTapX = x
        s.lastTapY = y
      }
    } else {
      // 点击遮罩空白处关闭
      lbClose()
    }
  }

  function lbPointerDown(e) {
    if (!_lbOpen) return
    var stage = document.getElementById("lightbox-stage")
    if (stage && stage.setPointerCapture) {
      try {
        stage.setPointerCapture(e.pointerId)
      } catch (err) {}
    }
    _lbG = _lbG || { pointers: {} }
    var n = Object.keys(_lbG.pointers).length
    _lbG.pointers[e.pointerId] = { x: e.clientX, y: e.clientY }
    if (n === 0) {
      _lbG.mode = "idle"
      _lbG.tapped = true
      _lbG.startX = e.clientX
      _lbG.startY = e.clientY
      _lbG.swipeX = 0
      _lbG.swipeY = 0
      _lbG.startTx = _lbState.tx
      _lbG.startTy = _lbState.ty
      _lbG.startS = _lbState.scale
    } else if (n === 1) {
      // 第二根手指：进入双指缩放
      _lbG.mode = "pinch"
      _lbG.tapped = false
      _lbG.startTx = _lbState.tx
      _lbG.startTy = _lbState.ty
      _lbG.startS = _lbState.scale
      var ids = Object.keys(_lbG.pointers)
      var p1 = _lbG.pointers[ids[0]],
        p2 = _lbG.pointers[ids[1]]
      _lbG.pinchD = Math.max(Math.hypot(p1.x - p2.x, p1.y - p2.y), 1)
      _lbG.ax = (p1.x + p2.x) / 2 - _lbState.stageW / 2
      _lbG.ay = (p1.y + p2.y) / 2 - _lbState.stageH / 2
    }
  }

  function lbPointerMove(e) {
    if (!_lbOpen || !_lbG || !_lbG.pointers || !_lbG.pointers[e.pointerId]) return
    var p = _lbG.pointers[e.pointerId]
    var dx = e.clientX - p.x
    var dy = e.clientY - p.y
    p.x = e.clientX
    p.y = e.clientY
    var n = Object.keys(_lbG.pointers).length
    if (n >= 2 && _lbG.mode === "pinch") {
      var ids = Object.keys(_lbG.pointers)
      var p1 = _lbG.pointers[ids[0]],
        p2 = _lbG.pointers[ids[1]]
      var d = Math.max(Math.hypot(p1.x - p2.x, p1.y - p2.y), 1)
      var next = Math.max(_lbState.min, Math.min(_lbState.max, _lbG.startS * (d / _lbG.pinchD)))
      var k = next / _lbG.startS
      _lbState.scale = next
      _lbState.tx = _lbG.ax - (_lbG.ax - _lbG.startTx) * k
      _lbState.ty = _lbG.ay - (_lbG.ay - _lbG.startTy) * k
      lbClamp()
      lbApply(false)
    } else if (n === 1) {
      _lbG.swipeX += dx
      _lbG.swipeY += dy
      if (Math.abs(_lbG.swipeX) + Math.abs(_lbG.swipeY) > 6) _lbG.tapped = false
      if (_lbG.mode !== "pinch" && _lbState.scale > _lbState.fit * 1.02) {
        // 放大后单指拖拽平移
        _lbG.mode = "pan"
        _lbState.tx = _lbG.startTx + _lbG.swipeX
        _lbState.ty = _lbG.startTy + _lbG.swipeY
        lbClamp()
        lbApply(false)
      }
    }
  }

  function lbPointerUp(e) {
    if (!_lbOpen || !_lbG || !_lbG.pointers || !_lbG.pointers[e.pointerId]) return
    delete _lbG.pointers[e.pointerId]
    var n = Object.keys(_lbG.pointers).length
    if (n === 0) {
      var g = _lbG
      _lbG = null
      if (g.tapped) {
        lbTap(e.clientX, e.clientY)
      } else if (g.mode !== "pan" && _lbState.scale <= _lbState.fit * 1.02) {
        // 未放大时横向滑动：切换上一张 / 下一张
        var sx = g.swipeX || 0
        var sy = g.swipeY || 0
        if (Math.abs(sx) > 60 && Math.abs(sx) > Math.abs(sy) * 1.5) {
          if (sx > 0) lbPrev()
          else lbNext()
        }
      }
    } else if (n === 1) {
      // 剩一根手指：重置手势基线，继续平移
      var ids = Object.keys(_lbG.pointers)
      var p = _lbG.pointers[ids[0]]
      _lbG.mode = _lbState.scale > _lbState.fit * 1.02 ? "pan" : "idle"
      _lbG.tapped = false
      _lbG.startX = p.x
      _lbG.startY = p.y
      _lbG.swipeX = 0
      _lbG.swipeY = 0
      _lbG.startTx = _lbState.tx
      _lbG.startTy = _lbState.ty
    }
  }

  function lbAct(act) {
    var s = _lbState
    if (act === "zoomin") lbSetScale(s.scale * 1.25, 0, 0, true)
    else if (act === "zoomout") lbSetScale(s.scale / 1.25, 0, 0, true)
    else if (act === "fit") lbReset(true)
    else if (act === "rotl") lbRotate(-1)
    else if (act === "rotr") lbRotate(1)
    else if (act === "prev") lbPrev()
    else if (act === "next") lbNext()
  }

  function lbOpen(img, list) {
    if (!_lb) lbCreate()
    if (!_lb) return
    _lbState.list = list
    _lbState.idx = list.indexOf(img)
    if (_lbState.idx < 0) _lbState.idx = 0
    _lb.classList.add("open")
    _lbOpen = true
    document.documentElement.classList.add("lb-lock")
    saveFocus()
    lbShow()
    var b = document.getElementById("lightbox-close")
    if (b) {
      try {
        b.focus()
      } catch (err) {}
    }
  }

  function lbClose() {
    if (!_lbOpen) return
    _lbOpen = false
    _lbG = null
    clearLbTimer()
    _lb.classList.remove("open")
    document.documentElement.classList.remove("lb-lock")
    restoreFocus()
  }

  function lbCreate() {
    var ov = document.createElement("div")
    ov.id = "lightbox"
    ov.setAttribute("role", "dialog")
    ov.setAttribute("aria-modal", "true")
    ov.setAttribute("aria-label", "图片预览")
    ov.innerHTML = [
      '<button id="lightbox-close" type="button" aria-label="关闭">' +
        lbIcon(
          '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
        ) +
        "</button>",
      '<div id="lightbox-stage"><img id="lightbox-img" alt="" loading="eager" decoding="async"><div id="lightbox-loader" aria-hidden="true"></div></div>',
      '<div id="lightbox-bar">',
      '<span id="lightbox-count"></span>',
      '<div id="lightbox-controls">',
      '<button type="button" data-act="zoomout" title="缩小" aria-label="缩小">' +
        lbIcon('<line x1="5" y1="12" x2="19" y2="12"></line>') +
        "</button>",
      '<button type="button" data-act="zoomin" title="放大" aria-label="放大">' +
        lbIcon(
          '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
        ) +
        "</button>",
      '<button type="button" data-act="fit" title="1:1 实际尺寸" aria-label="1:1 实际尺寸">1:1</button>',
      '<button type="button" data-act="rotl" title="左旋转" aria-label="左旋转">' +
        lbIcon(
          '<polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>',
        ) +
        "</button>",
      '<button type="button" data-act="rotr" title="右旋转" aria-label="右旋转">' +
        lbIcon(
          '<polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>',
        ) +
        "</button>",
      '<button type="button" data-act="prev" title="上一张" aria-label="上一张">' +
        lbIcon('<polyline points="15 18 9 12 15 6"></polyline>') +
        "</button>",
      '<button type="button" data-act="next" title="下一张" aria-label="下一张">' +
        lbIcon('<polyline points="9 18 15 12 9 6"></polyline>') +
        "</button>",
      "</div>",
      "</div>",
    ].join("")
    _lb = ov
    document.body.appendChild(ov)

    var stage = ov.querySelector("#lightbox-stage")
    var img = ov.querySelector("#lightbox-img")
    var close = ov.querySelector("#lightbox-close")
    var controls = ov.querySelector("#lightbox-controls")

    close.addEventListener("click", function (e) {
      e.stopPropagation()
      lbClose()
    })
    controls.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-act]") : null
      if (!b) return
      lbAct(b.getAttribute("data-act"))
    })

    img.addEventListener("load", function () {
      if (!_lbOpen) return
      clearLbTimer()
      img.removeAttribute("data-lb-error")
      var loader = document.getElementById("lightbox-loader")
      if (loader) loader.classList.remove("show")
      // 新图尺寸与当前不同（或首次加载成功）时重新计算适配比例
      if (img.naturalWidth !== _lbState.natW || img.naturalHeight !== _lbState.natH) {
        lbComputeFit()
        lbReset(true)
      }
      lbUpdateUI()
    })

    img.addEventListener("error", function () {
      if (!_lbOpen) return
      clearLbTimer()
      img.setAttribute("data-lb-error", "1")
      var loader = document.getElementById("lightbox-loader")
      if (loader) loader.classList.remove("show")
      lbUpdateUI()
      showToast("图片加载失败")
    })

    stage.addEventListener(
      "wheel",
      function (e) {
        if (!_lbOpen) return
        e.preventDefault()
        var dir = e.deltaY > 0 ? -1 : 1
        lbSetScale(
          _lbState.scale * Math.pow(1.15, dir),
          e.clientX - _lbState.stageW / 2,
          e.clientY - _lbState.stageH / 2,
        )
      },
      { passive: false },
    )

    stage.addEventListener("pointerdown", lbPointerDown)
    stage.addEventListener("pointermove", lbPointerMove)
    stage.addEventListener("pointerup", lbPointerUp)
    stage.addEventListener("pointercancel", lbPointerUp)

    // 老浏览器（无 PointerEvent）兜底：点击空白处关闭灯箱，避免界面无响应
    if (!window.PointerEvent) {
      stage.addEventListener("click", function () {
        if (_lbOpen) lbClose()
      })
    }
  }

  // 打开灯箱：事件委托，SPA 导航后依然有效
  document.addEventListener("click", function (e) {
    if (_lbOpen) return
    var t = e.target
    if (!t || !t.closest) return
    var img = t.closest("img")
    if (!img || img.closest("a[href]") || img.hasAttribute("data-lightbox-ignore")) return
    var article = img.closest(".markdown-rendered") || img.closest("article")
    if (!article) return
    var list = Array.prototype.slice.call(article.querySelectorAll("img")).filter(function (im) {
      return !im.closest("a[href]") && !im.hasAttribute("data-lightbox-ignore")
    })
    lbOpen(img, list)
  })

  // 键盘：Esc 关闭，方向键切图，+/- 缩放，0 还原，R 右旋
  document.addEventListener("keydown", function (e) {
    if (!_lbOpen) return
    var k = e.key
    if (k === "Escape") {
      e.stopPropagation()
      lbClose()
      return
    }
    if (k === "ArrowLeft") {
      e.preventDefault()
      lbPrev()
    } else if (k === "ArrowRight") {
      e.preventDefault()
      lbNext()
    } else if (k === "+" || k === "=") {
      e.preventDefault()
      lbSetScale(_lbState.scale * 1.25, 0, 0, true)
    } else if (k === "-" || k === "_") {
      e.preventDefault()
      lbSetScale(_lbState.scale / 1.25, 0, 0, true)
    } else if (k === "0") {
      e.preventDefault()
      lbReset(true)
    } else if (k === "r" || k === "R") {
      e.preventDefault()
      lbRotate(1)
    }
  })

  // SPA 页面切换时关闭灯箱（旧页面图片已失效）
  document.addEventListener("nav", function () {
    if (_lbOpen) lbClose()
  })

  // 窗口尺寸变化：重新适配
  window.addEventListener("resize", function () {
    if (!_lbOpen) return
    lbStageSize()
    if (_lbState.scale < _lbState.fit) lbReset(false)
    else {
      lbClamp()
      lbApply(false)
    }
  })

  // ====================================================================
  //  Card spotlight：鼠标跟随光晕（仅桌面 hover + 精确指针设备）
  // ====================================================================
  function initCardSpotlight() {
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (!fine) return
    // SPA 导航后 DOM 重建，需要重新注入光晕层
    function ensureSpots() {
      document.querySelectorAll(".glass-card, .shelf-card").forEach(function (card) {
        if (!card.querySelector(".card-spot")) {
          var s = document.createElement("span")
          s.className = "card-spot"
          card.appendChild(s)
        }
      })
    }
    ensureSpots()
    document.addEventListener("nav", ensureSpots)
    var ticking = false
    document.addEventListener("pointermove", function (e) {
      var card = e.target && e.target.closest ? e.target.closest(".glass-card, .shelf-card") : null
      if (!card || !card.querySelector(".card-spot")) return
      if (ticking) return
      ticking = true
      requestAnimationFrame(function () {
        var r = card.getBoundingClientRect()
        card.style.setProperty("--mx", (e.clientX - r.left).toFixed(1) + "px")
        card.style.setProperty("--my", (e.clientY - r.top).toFixed(1) + "px")
        ticking = false
      })
    })
  }

  // ====================================================================
  //  Service Worker：缓存页面 / 图片 / 静态资源，弱网下跳转和图片显著变快
  // ====================================================================
  var _swRegistered = false
  function registerSW() {
    if (_swRegistered) return
    _swRegistered = true
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return
    navigator.serviceWorker.register(getBp() + "/sw.js").catch(function () {})
  }

  // ====================================================================
  //  回到顶部按钮：滚动超过一屏才淡入，平时完全不可见，不干扰阅读
  //  注意：SPA 导航会 micromorph 整个 <body>，直接挂在 body 上的节点
  //  会被清掉，所以 nav 时也要重新创建（initBackToTop 幂等）。
  // ====================================================================
  var _bttShown = false
  function bttOnScroll() {
    var btn = document.getElementById("back-to-top")
    if (!btn) return
    var y = window.scrollY || document.documentElement.scrollTop || 0
    var show = y > 500
    if (show !== _bttShown) {
      _bttShown = show
      btn.classList.toggle("show", show)
    }
  }
  function initBackToTop() {
    if (document.getElementById("back-to-top")) return
    var btn = document.createElement("button")
    btn.id = "back-to-top"
    btn.type = "button"
    btn.setAttribute("aria-label", "回到顶部")
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>'
    document.body.appendChild(btn)
    btn.addEventListener("click", function () {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } catch (e) {
        window.scrollTo(0, 0)
      }
    })
  }
  window.addEventListener("scroll", bttOnScroll, { passive: true })
  document.addEventListener("nav", bttOnScroll)

  // ====================================================================
  //  阅读进度条：顶部细条显示文章阅读进度
  //  注意：SPA 导航会 micromorph 整个 <body>，进度条节点会被清掉，
  //  所以 nav 时也要幂等重建（ensureReadingProgress）。
  // ====================================================================
  var _rpTicking = false
  function rpOnScroll() {
    if (_rpTicking) return
    _rpTicking = true
    requestAnimationFrame(function () {
      var h = document.documentElement
      var max = h.scrollHeight - h.clientHeight
      var p = max > 0 ? window.scrollY / max : 0
      var bar = document.getElementById("reading-progress")
      if (bar) bar.style.width = Math.min(100, Math.max(0, p * 100)).toFixed(2) + "%"
      _rpTicking = false
    })
  }
  function ensureReadingProgress() {
    var slug = getSlug()
    try {
      slug = decodeURIComponent(slug)
    } catch (e) {}
    slug = slug.replace(/\.html$/, "")
    var noBar = ["index", "个人博客", "关于", "留言", "tags"]
    var isArticle =
      slug !== "404" && !slug.endsWith("/index") && noBar.indexOf(slug.split("/")[0]) === -1
    var el = document.getElementById("reading-progress")
    if (isArticle) {
      if (!el) {
        var d = document.createElement("div")
        d.id = "reading-progress"
        document.body.appendChild(d)
      }
    } else if (el && el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
  window.addEventListener("scroll", rpOnScroll, { passive: true })
  document.addEventListener("nav", ensureReadingProgress)

  // ====================================================================
  //  背景图空闲预载：首屏只下载当前主题的图（display:none 的图层不下载），
  //  尽早用低优先级预载另一主题的图，切主题时直接命中缓存、秒换不卡。
  // ====================================================================
  var _bgPreloaded = false
  function preloadOtherThemeBg() {
    if (_bgPreloaded) return
    _bgPreloaded = true
    var dark = isDark()
    var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches
    var otherId = isMobile
      ? dark
        ? "bg-image-light"
        : "bg-image-dark"
      : dark
        ? "bg-image-light-pc"
        : "bg-image-dark-pc"
    var other = document.getElementById(otherId)
    if (!other) return
    var full = other.querySelector(".bg-full")
    var thumb = other.querySelector(".bg-thumb")
    ;[full, thumb].forEach(function (img) {
      if (img && img.getAttribute("src")) {
        var pre = new Image()
        pre.fetchPriority = "low"
        pre.src = img.getAttribute("src")
      }
    })
    // 预载后切主题：display 由 CSS 切换，setBg 只改 opacity，
    // 另一主题的图已在浏览器缓存中，无网络等待。
  }

  // ====================================================================
  //  Init
  // ====================================================================
  function init() {
    getBp()
    registerSW()
    initBackToTop()
    ensureReadingProgress()
    boostActiveBg()
    syncThemeColor()
    document.addEventListener("themechange", syncThemeColor)
    rebuildUI()
    injectHomeLink()
    hideNavItem("个人博客")
    initMobilePanel()
    bindHamburgerDelegate()
    initCardSpotlight()
    restoreFontSize()
    restoreBg()
    restoreFontColor()
    restoreLock()

    // 不等 window.load：首帧渲染后立即用低优先级预载另一主题的图，
    // 首次切主题时基本已缓存，不会卡。
    var rq =
      window.requestIdleCallback ||
      function (fn) {
        setTimeout(fn, 2000)
      }
    rq(preloadOtherThemeBg, { timeout: 2500 })

    var slug = getSlug()
    if (localStorage.getItem(LOCK_KEY) !== "true" && slug !== "index") {
      setBg(isDark() ? "dark" : "cream")
    }

    // Restore music volume & loop
    var savedVol = localStorage.getItem("musicVolume")
    if (savedVol !== null) audio.volume = parseFloat(savedVol)
    var savedLoop = localStorage.getItem("musicLoop")
    if (savedLoop === "1") audio.loop = true
    syncMusicUI()

    if (window.__music && window.__music.onChange) {
      window.__music.onChange(function (st) {
        var pb = document.querySelector(".hb-music-play")
        if (pb) pb.textContent = st.playing ? "⏸" : "▶"
        var tn = document.querySelector(".hb-music-track")
        if (tn) tn.textContent = st.track || "未播放"
      })
    }

    // Close sidebar when clicking outside
    // NOTE: 汉堡按钮/目录面板由事件委托统一处理，这里排除，避免与移动端目录开关冲突
    document.addEventListener("click", function (e) {
      var sidebar = document.querySelector(".left.sidebar")
      var navT = document.querySelector("#nav-toggle-btn")
      var hb = document.querySelector("#hamburger-btn")
      var inHb = hb && e.target && hb.contains(e.target)
      var inExplorer = e.target && e.target.closest && e.target.closest(".explorer")
      if (
        !inHb &&
        !inExplorer &&
        sidebar &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        navT &&
        !navT.contains(e.target)
      ) {
        closeSidebar()
      }
    })

    // 桌面端侧栏折叠兜底：capture 阶段拦截「探索」标题栏点击，
    // 即使 explorer 插件脚本加载失败，折叠 / 展开依然可用。
    // stopPropagation 保证插件自身的按钮监听不会被重复触发（不会双重切换）。
    document.addEventListener(
      "click",
      function (e) {
        var btn = e.target && e.target.closest ? e.target.closest(".desktop-explorer") : null
        if (!btn) return
        e.stopPropagation()
        var explorer = btn.closest(".explorer")
        if (!explorer) return
        var collapsed = explorer.classList.toggle("collapsed")
        explorer.setAttribute("aria-expanded", collapsed ? "false" : "true")
        document.documentElement.classList.toggle("mobile-no-scroll", !collapsed)
        updateScrollLock()
      },
      true,
    )

    loadDailyQuote()
    lazyLoadImages()
    setupBgBlurUp()
  }

  // ====================================================================
  //  Prev / Next chapter
  // ====================================================================
  // ====================================================================
  //  上一章 / 下一章：读取 contentIndex（115KB），校园网卡死时必须有超时兜底
  // ====================================================================
  var _ci = null
  function loadCI() {
    if (_ci) return Promise.resolve(_ci)
    // Reuse global fetchData promise if available
    if (typeof fetchData !== "undefined" && typeof fetchData.then === "function") {
      return fetchData
        .then(function (d) {
          _ci = d.content || d
          return _ci
        })
        .catch(function () {
          return null
        })
    }
    var ctrl = new AbortController()
    var tm = setTimeout(function () {
      ctrl.abort()
    }, 10000)
    return fetch(getBp() + "/static/contentIndex.json", { signal: ctrl.signal })
      .then(function (r) {
        if (!r.ok) throw Error()
        return r.json()
      })
      .then(function (d) {
        clearTimeout(tm)
        _ci = d.content || d
        return _ci
      })
      .catch(function () {
        clearTimeout(tm)
        return null
      })
  }

  function insertPrevNext() {
    var slug = getSlug()
    if (!slug || slug === "index") return
    var parts = slug.split("/")
    if (parts.length < 2) return
    var parent = parts.slice(0, -1).join("/")

    loadCI().then(function (data) {
      if (!data) return
      var siblings = Object.keys(data).filter(function (k) {
        var p = k.split("/")
        p.pop()
        return p.join("/") === parent && k !== slug && k !== parent + "/index"
      })
      if (!siblings.length) return

      siblings.sort(function (a, b) {
        return a
          .split("/")
          .pop()
          .localeCompare(b.split("/").pop(), undefined, { numeric: true, sensitivity: "base" })
      })

      var idx = siblings.findIndex(function (s) {
        return s.localeCompare(slug, undefined, { numeric: true, sensitivity: "base" }) > 0
      })
      if (idx === -1) idx = siblings.length
      var prev = idx > 0 ? siblings[idx - 1] : null
      var next = idx < siblings.length ? siblings[idx] : null

      var el = document.getElementById("chapter-nav")
      if (!el) {
        el = document.createElement("div")
        el.id = "chapter-nav"
        var ins = document.querySelector(".center > hr") || document.querySelector(".center")
        if (ins) ins.parentNode.insertBefore(el, ins.nextSibling)
      }

      var p = prev
        ? '<a href="/' +
          prev +
          '" class="cn-prev">← ' +
          (data[prev]?.title || prev.split("/").pop()) +
          "</a>"
        : ""
      var n = next
        ? '<a href="/' +
          next +
          '" class="cn-next">' +
          (data[next]?.title || next.split("/").pop()) +
          " →</a>"
        : ""
      el.innerHTML = p + '<span class="cn-spacer"></span>' + n

      if (!document.getElementById("cn-styles")) {
        var st = document.createElement("style")
        st.id = "cn-styles"
        st.textContent =
          "#chapter-nav{display:flex;align-items:center;justify-content:space-between;margin:1.2rem 0 0.8rem;padding:0 0.5rem;gap:1rem}" +
          ".cn-prev,.cn-next{color:var(--secondary);text-decoration:none;font-weight:600;font-size:0.88rem;transition:opacity 0.2s;max-width:45%;word-break:break-word}" +
          ".cn-prev:hover,.cn-next:hover{opacity:0.65}.cn-next{text-align:right}.cn-spacer{flex:1}"
        document.head.appendChild(st)
      }
    })
  }

  // nav 事件触发时 DOM 已完成 morph，直接插入即可（无需 setTimeout 猜测时机）
  document.addEventListener("nav", function () {
    insertPrevNext()
  })
  document.addEventListener("DOMContentLoaded", function () {
    insertPrevNext()
  })

  // ====================================================================
  //  Watch theme changes → refresh bg buttons
  // ====================================================================
  var themeObserver = new MutationObserver(function () {
    refreshBgButtons()
    refreshFcButtons()
    var bg = localStorage.getItem(BG_KEY)
    if (bg && bg !== "default") {
      var opts = currentBgOpts().filter(function (o) {
        return o.id !== "default"
      })
      if (opts.length) setBg(opts[0].id)
    } else {
      var dark = isDark()
      var li = document.getElementById("bg-image-light"),
        di = document.getElementById("bg-image-dark")
      var liP = document.getElementById("bg-image-light-pc"),
        diP = document.getElementById("bg-image-dark-pc")
      if (li) li.style.opacity = dark ? "0" : "1"
      if (di) di.style.opacity = dark ? "1" : "0"
      if (liP) liP.style.opacity = dark ? "0" : "1"
      if (diP) diP.style.opacity = dark ? "1" : "0"
    }
    var fc = localStorage.getItem(FONT_COLOR_KEY)
    if (fc === "auto" || !fc) setFontColor("auto")
  })
  function startObserver() {
    var el = document.documentElement
    themeObserver.observe(el, { attributes: true, attributeFilter: ["data-theme", "saved-theme"] })
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", function () {
      init()
      startObserver()
    })
  else {
    init()
    startObserver()
  }
})()
