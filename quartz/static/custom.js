;(function () {
  // ====================================================================
  //  Constants & Keys
  // ====================================================================
  var FONT_SIZE_KEY = "fontSize"
  var FONT_FAMILY_KEY = "fontFamily"
  var FONT_CACHE_NAME = "homewardbird-fonts-v1"
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
    if (isMobileUI()) closeSidebar()
    if (!document.getElementById("hamburger-menu")) {
      rebuildUI()
      syncMusicUI()
    } else {
      closeHamburger()
    }
    closeSidebar()
    var tbT = document.querySelector("#top-bar .top-bar-title")
    if (tbT) tbT.textContent = document.title || "安巢鸟的个人网站"
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
  //  Font Manager (opt-in download, cached locally, apply on second click)
  // ====================================================================
  var fontOptions = [
    // bytes：静态字体的实际文件字节数。content-length 会被 Service Worker
    // 转发时剥离，作为进度百分比的分母兜底；替换字体文件后需同步更新。
    { id: "lxgw", label: "落霞文楷", file: "/fonts/lxgw-wenkai.ttf", bytes: 25673994 },
    { id: "noto", label: "思源黑体", file: "/fonts/noto-sans-sc-variable.ttf", bytes: 17773248 },
  ]

  function fontFileUrl(option) {
    return getBp() + option.file
  }

  function fontButtonState(id, state, detail) {
    var button = document.querySelector('.hb-font-manager-btn[data-font="' + id + '"]')
    var progress = document.querySelector('.hb-font-progress[data-font="' + id + '"]')
    var status = document.querySelector('.hb-font-status[data-font="' + id + '"]')
    if (!button || !progress || !status) return
    button.disabled = state === "downloading"
    button.classList.toggle("ready", state === "ready")
    button.classList.toggle("active", state === "applied")
    button.textContent =
      state === "downloading" ? "下载中..." : state === "ready" ? "应用" : state === "applied" ? "已应用" : "下载"
    progress.value = detail || (state === "ready" || state === "applied" ? 100 : 0)
    progress.hidden = state !== "downloading"
    status.textContent =
      state === "downloading"
        ? Math.round(detail || 0) + "%"
        : state === "ready"
          ? "已下载，请再次点击应用"
          : state === "applied"
            ? "当前使用中"
            : "未下载"
  }

  async function fontIsCached(option) {
    if (!window.caches) return false
    var cache = await caches.open(FONT_CACHE_NAME)
    return !!(await cache.match(fontFileUrl(option)))
  }

  async function downloadFont(option) {
    var url = fontFileUrl(option)
    var response = await fetch(url, { cache: "no-cache" })
    if (!response.ok) throw new Error("font download failed")
    // 优先用响应头；SW 转发会剥离 content-length，此时退化为内置已知字节数，
    // 保证进度条能随数据块真实递增（上限 99%，100% 由完成态给出）
    var total =
      parseInt(response.headers.get("content-length") || "0", 10) || option.bytes || 0
    var received = 0
    var reader = response.body && response.body.getReader()
    var chunks = []
    var lastShownPct = -1
    var lastShownAt = 0
    if (reader) {
      while (true) {
        var part = await reader.read()
        if (part.done) break
        chunks.push(part.value)
        received += part.value.length
        // 节流：至少 +1% 或间隔 200ms 才写一次 DOM，慢网下小块高频到达时
        // 避免每秒上千次 querySelector/textContent 写入
        var pct = total ? Math.min(99, (received / total) * 100) : 0
        var now = Date.now()
        if (pct - lastShownPct >= 1 || now - lastShownAt >= 200) {
          lastShownPct = pct
          lastShownAt = now
          fontButtonState(option.id, "downloading", pct)
        }
      }
    } else {
      chunks.push(new Uint8Array(await response.arrayBuffer()))
      received = chunks[0].length
      fontButtonState(option.id, "downloading", 100)
    }
    // 直接以 Blob 组装（零拷贝）：避免先拼一份完整 Uint8Array 再把整段
    // 拷进 Response 造成 ~2 倍峰值内存（25MB 字体下载时瞬时省 ~25MB）
    var cache = await caches.open(FONT_CACHE_NAME)
    await cache.put(
      url,
      new Response(new Blob(chunks, { type: "font/ttf" }), {
        headers: { "Content-Type": "font/ttf" },
      }),
    )
  }

  async function applyFont(option) {
    var family = "HB-" + option.id
    var cache = await caches.open(FONT_CACHE_NAME)
    var cachedResponse = await cache.match(fontFileUrl(option))
    if (!cachedResponse) throw new Error("font is not cached")
    var face = new FontFace(family, await cachedResponse.arrayBuffer())
    await face.load()
    document.fonts.add(face)
    document.documentElement.setAttribute("data-font-family", option.id)
    document.documentElement.style.setProperty("--hb-selected-font", '"' + family + '"', "important")
    localStorage.setItem(FONT_FAMILY_KEY, option.id)
    Promise.all(
      fontOptions.map(function (item) {
        return fontIsCached(item).then(function (cached) {
          fontButtonState(item.id, item.id === option.id ? "applied" : cached ? "ready" : "idle")
        })
      }),
    )
  }

  function initFontManager() {
    fontOptions.forEach(function (option) {
      fontIsCached(option).then(function (cached) {
        fontButtonState(option.id, cached ? "ready" : "idle")
      })
    })
    var saved = localStorage.getItem(FONT_FAMILY_KEY)
    if (saved) {
      var option = fontOptions.find(function (item) {
        return item.id === saved
      })
      if (option) fontIsCached(option).then(function (cached) {
        if (cached) applyFont(option).catch(function () {})
      })
    }
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
    if (tbt) tbt.textContent = document.title || "安巢鸟的个人网站"

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
    if (!document.getElementById("sidebar-backdrop")) {
      var sidebarBackdrop = document.createElement("div")
      sidebarBackdrop.id = "sidebar-backdrop"
      sidebarBackdrop.setAttribute("aria-hidden", "true")
      document.body.appendChild(sidebarBackdrop)
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
      '<div class="hb-header">',
      '<div class="hb-title">设置</div>',
      '<button id="hamburger-close-btn" class="hb-close-btn" type="button" aria-label="关闭菜单">✕</button>',
      "</div>",
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
      '<div class="hb-section hb-font-manager"><button class="hb-title hb-font-manager-toggle" type="button" aria-expanded="false">字体管理<span aria-hidden="true">⌄</span></button>',
      '<div class="hb-font-manager-list" hidden>',
      fontOptions
        .map(function (o) {
          return '<div class="hb-font-item"><div><strong>' + o.label + '</strong><span class="hb-font-status" data-font="' + o.id + '">未下载</span></div><button class="hb-font-manager-btn" type="button" data-font="' + o.id + '">下载</button><progress class="hb-font-progress" data-font="' + o.id + '" max="100" value="0" hidden></progress></div>'
        })
        .join(""),
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
    var sidebar = document.querySelector(".left.sidebar")
    if (sidebar) {
      var sidebarCloseBtn = sidebar.querySelector("#sidebar-close-btn")
      if (!sidebarCloseBtn) {
        sidebarCloseBtn = document.createElement("button")
        sidebarCloseBtn.id = "sidebar-close-btn"
        sidebarCloseBtn.type = "button"
        sidebarCloseBtn.className = "sidebar-close-btn"
        sidebarCloseBtn.setAttribute("aria-label", "关闭导航")
        sidebarCloseBtn.textContent = "✕"
        sidebar.insertBefore(sidebarCloseBtn, sidebar.firstChild)
      }
      if (!_handlerSet.has(sidebarCloseBtn)) {
        _handlerSet.add(sidebarCloseBtn)
        sidebarCloseBtn.addEventListener("click", function (e) {
          e.stopPropagation()
          closeSidebar()
        })
      }
    }
    var sidebarBackdrop = document.getElementById("sidebar-backdrop")
    if (sidebarBackdrop && !_handlerSet.has(sidebarBackdrop)) {
      _handlerSet.add(sidebarBackdrop)
      sidebarBackdrop.addEventListener("click", function () {
        closeSidebar()
      })
    }
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
    var fontToggle = document.querySelector(".hb-font-manager-toggle")
    var fontList = document.querySelector(".hb-font-manager-list")
    if (fontToggle && fontList && !_handlerSet.has(fontToggle)) {
      _handlerSet.add(fontToggle)
      fontToggle.addEventListener("click", function () {
        var expanded = fontToggle.getAttribute("aria-expanded") === "true"
        fontToggle.setAttribute("aria-expanded", expanded ? "false" : "true")
        fontList.hidden = expanded
      })
    }
    document.querySelectorAll(".hb-font-manager-btn").forEach(function (button) {
      if (_handlerSet.has(button)) return
      _handlerSet.add(button)
      button.addEventListener("click", async function () {
        var option = fontOptions.find(function (item) {
          return item.id === button.dataset.font
        })
        if (!option) return
        var cached = await fontIsCached(option)
        if (!cached) {
          fontButtonState(option.id, "downloading", 0)
          try {
            await downloadFont(option)
            fontButtonState(option.id, "ready")
          } catch (e) {
            fontButtonState(option.id, "idle")
            showToast("字体下载失败，请稍后重试")
          }
          return
        }
        try {
          await applyFont(option)
        } catch (e) {
          showToast("字体应用失败，请刷新后重试")
        }
      })
    })
    var closeBtn = document.getElementById("hamburger-close-btn")
    if (closeBtn && !_handlerSet.has(closeBtn)) {
      _handlerSet.add(closeBtn)
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation()
        closeHamburger()
      })
    }
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
    btn.classList.toggle("is-open", !!open)
    btn.innerHTML = open ? _navToggleSVG.close : _navToggleSVG.menu
    btn.setAttribute("aria-label", open ? "关闭导航" : "导航")
  }
  // 图标状态跟随目录栏真实展开状态（任何关闭路径后都要调用，避免残留 ✕）
  function syncNavToggleIcon() {
    if (!isMobileUI()) return
    var sidebar = document.querySelector(".left.sidebar")
    var open = !!(sidebar && sidebar.classList.contains("open"))
    setNavToggleIcon(open)
  }
  function setSidebarBackdrop(open) {
    var bd = document.getElementById("sidebar-backdrop")
    if (!bd) return
    bd.classList.toggle("open", !!open)
    bd.setAttribute("aria-hidden", open ? "false" : "true")
  }

  function toggleMobileExplorer(forceOpen) {
    var exp = document.querySelector(".explorer")
    var sidebar = document.querySelector(".left.sidebar")
    if (!exp) return false
    var open = typeof forceOpen === "boolean" ? forceOpen : !sidebar.classList.contains("open")
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
    setSidebarBackdrop(open)
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
    var locked = sidebarOpen || menuOpen
    document.body.style.overflow = locked ? "hidden" : ""
    // 必须同时锁 html：body 的 overflow 不会传递给视口（Quartz 源码注释已说明），
    // 否则抽屉内滚动/触摸仍会带动主页滚动
    document.documentElement.style.overflow = locked ? "hidden" : ""
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
    if (exp) {
      exp.classList.add("collapsed")
      exp.setAttribute("aria-expanded", "false")
    }
    var sidebar = document.querySelector(".left.sidebar")
    if (sidebar) sidebar.classList.remove("open")
    setSidebarBackdrop(false)
    updateScrollLock()
  }
  function closeSidebar() {
    var s = document.querySelector(".left.sidebar")
    var exp = document.querySelector(".explorer")
    if (isMobileUI()) {
      if (exp) {
        exp.classList.add("collapsed")
        exp.setAttribute("aria-expanded", "false")
        var content = exp.querySelector(".explorer-content")
        if (content) {
          content.removeAttribute("role")
          content.removeAttribute("aria-modal")
        }
      }
      if (s) s.classList.remove("open")
      document.documentElement.classList.remove("mobile-no-scroll")
      setSidebarBackdrop(false)
      restoreFocus()
      setNavToggleIcon(false)
      updateScrollLock()
      return
    }
    if (s) s.classList.remove("open")
    setSidebarBackdrop(false)
    syncNavToggleIcon()
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
  //  Home entrance：首页入场动画（PC + 移动端统一）
  // ====================================================================
  // 只在"初次以首页为入口的整页加载"播放一次：init 时若入口不是首页
  // （子页面/SPA 直达），整个会话都不再播放——从子页面 SPA 返回首页、
  // 浏览器后退回到首页都保持静态，不重演入场。
  // 触发方式：给 <html> 加 data-home-cards（CSS 全部动画由它门控），
  // 遮罩（#page-loader）基本透明后加上、动画播完移除。属性重复设置幂等。
  function initCardEntrance() {
    if (getSlug() !== "index") return

    var ANIM_KEEP_MS = 1200
    var removeTimer = null

    function activate() {
      document.documentElement.setAttribute("data-home-cards", "on")
      if (removeTimer) clearTimeout(removeTimer)
      removeTimer = setTimeout(function () {
        document.documentElement.removeAttribute("data-home-cards")
      }, ANIM_KEEP_MS)
    }

    // 遮罩处于遮挡状态时轮询其实际透明度，降到 ~0.35 以下（基本揭开）再触发。
    // 不依赖遮罩的 DOM 移除/定时器，冷启动、慢网、后台标签都自适应。
    var loader = document.getElementById("page-loader")
    var occluding =
      loader &&
      loader.isConnected &&
      (loader.classList.contains("show") || loader.classList.contains("fade-out"))
    if (!occluding) {
      activate()
      return
    }
    var started = Date.now()
    var check = function () {
      var l = document.getElementById("page-loader")
      var still =
        l &&
        l.isConnected &&
        (l.classList.contains("show") || l.classList.contains("fade-out"))
      if (!still) {
        activate()
        return
      }
      var opacity = parseFloat(window.getComputedStyle(l).opacity)
      if (!isNaN(opacity) && opacity <= 0.35) {
        activate()
        return
      }
      if (Date.now() - started > 5000) {
        // 极端兜底：遮罩异常不透明也照常触发，避免动画永远不播
        activate()
        return
      }
      setTimeout(check, 50)
    }
    setTimeout(check, 50)
  }

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
    document.addEventListener(
      "pointermove",
      function (e) {
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
      },
      { passive: true },
    )
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
  //  Easter eggs：轻量彩蛋
  //   1) 首页标题连点 3 次（每次轻抖反馈）→ 立刻弹出隐藏入口小窗（群聊小秘密）
  //   2) 搜索框里敲出 …bird → 白羽漫天 + 鸟诗随机浮现
  //   3) 页脚签名：哪怕网络没有留下我的羽毛，但我已飞过。
  //  性能约束：事件全部委托在 document（SPA 换页不重绑）；DOM 节点懒创建
  //  （body 会被 micromorph 整体替换，不缓存跨页引用）；动画只用
  //  transform/opacity；带冷却与 reduced-motion 保护。
  // ====================================================================
  function initEasterEggs() {
    var _toastEl = null
    var _dlgEl = null
    var _poemEl = null
    var _poemTm = null
    var _logoTaps = []
    var _lastBirdAt = 0
    var _buffer = ""

    // 线性矢量小鸟（Lucide bird，与首页卡片图标同风格）：用于弹窗徽章/页脚
    var BIRD_SVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/>' +
      '<path d="m20 7 2 .5-2 .5"/></svg>'

    // 白羽：更真实的羽毛造型——两侧羽片带深浅过渡，中轴羽轴、细密羽枝，
    // 底部羽根收尖；不勾粗边，靠柔和灰影与背景分离
    var FEATHER_SVG =
      '<svg viewBox="0 0 36 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="eggFade" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset="0.75" stop-color="#f4f7fa"/><stop offset="1" stop-color="#dde6ee"/>' +
      "</linearGradient>" +
      '<linearGradient id="eggShade" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#93a7ba" stop-opacity="0"/><stop offset="1" stop-color="#93a7ba" stop-opacity="0.28"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<path d="M18 3 C25 12 27 30 25.5 47 C24 63 21.5 80 18 102 C14.5 80 12 63 10.5 47 C9 30 11 12 18 3 Z" fill="url(#eggFade)"/>' +
      '<path d="M18 3 C25 12 27 30 25.5 47 C24.5 60 23 74 18.6 88 C22 74 22.5 56 20.5 38 C19.5 24 18.4 12 18 3 Z" fill="url(#eggShade)"/>' +
      '<path d="M18 12 L18 100" stroke="#9db2c6" stroke-width="1.3" stroke-linecap="round" opacity="0.75"/>' +
      '<g stroke="#a9bccd" stroke-width="0.9" opacity="0.55" stroke-linecap="round">' +
      '<path d="M17.6 24 L10.2 14 M17.4 37 L8.8 27 M17.2 50 L8.4 40 M17.4 63 L9.4 53 M17.8 76 L12 67 M18.2 88 L14.6 81"/>' +
      '<path d="M18.4 24 L25.8 14 M18.6 37 L27.2 27 M18.8 50 L27.6 40 M18.6 63 L26.6 53 M18.2 76 L24 67 M17.8 88 L21.4 81"/>' +
      "</g>" +
      "</svg>"

    // 诗词池（只保留与鸟相关的诗句，中外古今，随机浮现）
    var BIRD_POEMS = [
      { t: "月出惊山鸟，时鸣春涧中。", a: "王维《鸟鸣涧》" },
      { t: "春眠不觉晓，处处闻啼鸟。", a: "孟浩然《春晓》" },
      { t: "千山鸟飞绝，万径人踪灭。", a: "柳宗元《江雪》" },
      { t: "众鸟高飞尽，孤云独去闲。", a: "李白《独坐敬亭山》" },
      { t: "江碧鸟逾白，山青花欲燃。", a: "杜甫《绝句二首》" },
      { t: "山气日夕佳，飞鸟相与还。", a: "陶渊明《饮酒·其五》" },
      { t: "鸟宿池边树，僧敲月下门。", a: "贾岛《题李凝幽居》" },
      { t: "感时花溅泪，恨别鸟惊心。", a: "杜甫《春望》" },
      { t: "两个黄鹂鸣翠柳，一行白鹭上青天。", a: "杜甫《绝句》" },
      { t: "无可奈何花落去，似曾相识燕归来。", a: "晏殊《浣溪沙》" },
      { t: "东走无复忆鲈鱼，南飞觉有安巢鸟。", a: "安巢鸟的出处" },
      { t: "希望是长着羽毛的东西，栖落在灵魂里。", a: "艾米莉·狄金森《希望》" },
      { t: "鸟翼系上了黄金，这鸟便永不能再在天上翱翔。", a: "泰戈尔《飞鸟集》" },
      { t: "你不为死亡而生，不朽的鸟儿！", a: "济慈《夜莺颂》" },
    ]
    var QQ_GROUP = "1075229021"
    var CLOSE_SVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'

    function reducedMotion() {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }

    function ensureToast() {
      if (_toastEl && _toastEl.isConnected) return _toastEl
      var t = document.createElement("div")
      t.id = "egg-toast"
      t.setAttribute("role", "status")
      document.body.appendChild(t)
      _toastEl = t
      return t
    }
    function toast(text, ms) {
      var t = ensureToast()
      t.textContent = text
      t.classList.add("show")
      clearTimeout(t._tm)
      t._tm = setTimeout(function () {
        t.classList.remove("show")
      }, ms || 1800)
    }
    function hideToast() {
      if (_toastEl && _toastEl.isConnected) _toastEl.classList.remove("show")
    }

    function ensureDialog() {
      if (_dlgEl && _dlgEl.isConnected) return _dlgEl
      var d = document.createElement("div")
      d.id = "egg-dialog"
      d.setAttribute("aria-hidden", "true")
      d.innerHTML =
        '<div class="egg-backdrop" data-egg-close></div>' +
        '<div class="egg-card" role="dialog" aria-modal="true" aria-labelledby="egg-dlg-title">' +
        '<button class="egg-close" type="button" data-egg-close aria-label="关闭">' +
        CLOSE_SVG +
        "</button>" +
        '<div class="egg-emblem" aria-hidden="true">' +
        BIRD_SVG +
        "</div>" +
        '<div class="egg-title" id="egg-dlg-title">你发现了隐藏入口</div>' +
        '<p class="egg-desc">欢迎来到安巢鸟的小茶馆，技术交流、生活闲聊都可以。</p>' +
        '<div class="egg-secret">' +
        '<div class="egg-sec-title">小秘密 · 我的群聊</div>' +
        '<div class="egg-sec-row">' +
        '<span class="egg-sec-num">' +
        QQ_GROUP +
        "</span>" +
        '<button class="egg-copy" type="button" data-egg-copy>复制群号</button>' +
        "</div>" +
        '<div class="egg-sec-hint">技术交流、闲聊都可以，搜到这个群号就找到我了。</div>' +
        "</div>" +
        '<div class="egg-links">' +
        '<a class="egg-btn" href="' + getBp() + '/杂谈/01%20%E7%BD%91%E5%90%8D%E7%9A%84%E6%95%85%E4%BA%8B">网名的故事</a>' +
        '<a class="egg-btn" href="' + getBp() + '/关于">关于本站</a>' +
        "</div>" +
        "</div>"
      document.body.appendChild(d)
      _dlgEl = d
      return d
    }
    function openEggDialog() {
      var d = ensureDialog()
      d.setAttribute("aria-hidden", "false")
      d.classList.add("open")
      var b = d.querySelector(".egg-close")
      if (b) {
        try {
          b.focus()
        } catch (e) {}
      }
    }
    function closeEggDialog() {
      if (_dlgEl && _dlgEl.isConnected) {
        _dlgEl.classList.remove("open")
        _dlgEl.setAttribute("aria-hidden", "true")
      }
    }

    // ---- bird 彩蛋：白羽漫天 + 鸟诗浮现 ----
    // 伪物理飘落（方案 A）：垂直速度平滑趋近"终端速度"后基本匀速；
    // 横向为正弦摆动 + 轻微整体漂移；旋转角跟随横向摆速、始终小角度。
    // 全程只写 transform/opacity（GPU），羽毛出屏或节点失联即清理。
    var _featherRaf = null
    function spawnFeathers() {
      var old = document.getElementById("egg-feathers")
      if (old && old.parentNode) old.parentNode.removeChild(old)
      if (_featherRaf) {
        cancelAnimationFrame(_featherRaf)
        _featherRaf = null
      }
      var W = window.innerWidth
      var H = window.innerHeight
      var layer = document.createElement("div")
      layer.id = "egg-feathers"
      layer.setAttribute("aria-hidden", "true")
      document.body.appendChild(layer)

      var rnd = function (min, max) {
        return min + Math.random() * (max - min)
      }
      var states = []
      for (var i = 0; i < 12; i++) {
        var el = document.createElement("span")
        el.className = "egg-feather"
        el.style.transformOrigin = "50% 15%"
        el.innerHTML = FEATHER_SVG
        layer.appendChild(el)
        states.push({
          el: el,
          x: rnd(0.04, 0.9) * W,
          y: rnd(-0.16, -0.02) * H,
          vy: 0,
          // 终端速度：约 16~26 vh/s（屏高不同时视觉一致）
          term: rnd(0.16, 0.26) * H,
          scale: rnd(0.42, 0.72),
          // 正弦横摆：振幅 1.2~3.2vw、角速度 2.2~4.4 rad/s（周期 1.4~2.8s）
          amp: rnd(0.012, 0.032) * W,
          ang: rnd(2.2, 4.4),
          ph: rnd(0, Math.PI * 2),
          // 整段飘落整体漂移 ±0~2.4vw
          drift: rnd(-0.024, 0.024) * W,
          estDur: 0,
          rot: rnd(-8, 8),
          prevSway: 0,
          // 入场窗口收紧到 0.35s 内：羽毛与诗句几乎同步出现
          delay: rnd(0, 0.35),
          t0: 0,
        })
        var st = states[i]
        st.estDur = (1.35 * H) / st.term // 秒，用于分配漂移速度
        st.t0 = performance.now() + st.delay * 1000
      }

      var last = performance.now()
      var step = function (now) {
        var dt = Math.min(0.05, (now - last) / 1000)
        last = now
        var alive = 0
        for (var i = 0; i < states.length; i++) {
          var s = states[i]
          if (!s.el.isConnected) continue
          var t = (now - s.t0) / 1000
          if (t < 0) {
            s.el.style.opacity = "0"
            alive++
            continue
          }
          // 垂直：平滑趋近终端速度（无骤变）
          s.vy += (s.term - s.vy) * Math.min(1, dt * 2.2)
          s.y += s.vy * dt
          // 横向：正弦摆 + 全程线性漂移
          var sway = s.amp * Math.sin(s.ang * t + s.ph)
          var x = s.x + sway + (s.drift / s.estDur) * t
          // 旋转：跟随横向摆速（大角速度→大角度），限幅 ±14°，平滑追赶
          var dSway = sway - s.prevSway
          s.prevSway = sway
          var target = Math.max(-14, Math.min(14, dSway * (180 / Math.PI) * 6))
          s.rot += (target - s.rot) * Math.min(1, dt * 4)
          // 透明度：入场渐显、接近底部渐隐
          var alpha = 0.92 * Math.min(1, t / 0.45)
          if (s.y > H - 160) alpha *= Math.max(0, Math.min(1, (H * 1.06 - s.y) / 200))
          s.el.style.opacity = alpha.toFixed(3)
          s.el.style.transform =
            "translate3d(" +
            x.toFixed(1) +
            "px," +
            s.y.toFixed(1) +
            "px,0) rotate(" +
            s.rot.toFixed(1) +
            "deg) scale(" +
            s.scale.toFixed(3) +
            ")"
          if (s.y < H * 1.12) alive++
        }
        if (alive > 0) {
          _featherRaf = requestAnimationFrame(step)
        } else {
          _featherRaf = null
          if (layer.isConnected) layer.parentNode.removeChild(layer)
        }
      }
      _featherRaf = requestAnimationFrame(step)
    }
    function ensurePoem() {
      if (_poemEl && _poemEl.isConnected) return _poemEl
      var p = document.createElement("div")
      p.id = "egg-poem"
      p.setAttribute("aria-hidden", "true")
      document.body.appendChild(p)
      _poemEl = p
      return p
    }
    function eggPoemEffect() {
      var now = Date.now()
      if (now - _lastBirdAt < 12000) return
      _lastBirdAt = now

      var poem = BIRD_POEMS[Math.floor(Math.random() * BIRD_POEMS.length)]
      var p = ensurePoem()
      // 按句读拆行：五言/七言每句单独一行（五言五行、七言七字），
      // 自动排版成"词牌卡"样式，而非按屏幕宽度随意折行
      var clauses = poem.t.match(/[^，。、；]+[，。]?/g) || [poem.t]
      var html = ""
      for (var i = 0; i < clauses.length; i++) {
        var line = clauses[i].replace(/^\s+|\s+$/g, "")
        if (line) html += '<div class="egg-poem-line">' + line + "</div>"
      }
      p.innerHTML =
        '<div class="egg-poem-box">' +
        html +
        '</div><div class="egg-poem-src">—— ' +
        poem.a +
        "</div>"
      p.classList.remove("show")
      void p.offsetWidth
      p.classList.add("show")

      // 减少动效偏好：只显示诗句，不飘羽毛
      if (!reducedMotion()) {
        spawnFeathers()
      }
      clearTimeout(_poemTm)
      _poemTm = setTimeout(function () {
        hidePoem()
      }, 7000)
    }

    // 主动清除诗句与羽毛（点空白处/SPA 切页/到点自动）
    function killFeathers() {
      if (_featherRaf) {
        cancelAnimationFrame(_featherRaf)
        _featherRaf = null
      }
      var fe = document.getElementById("egg-feathers")
      if (fe && fe.parentNode) fe.parentNode.removeChild(fe)
    }
    function hidePoem() {
      clearTimeout(_poemTm)
      if (_poemEl && _poemEl.isConnected) _poemEl.parentNode.removeChild(_poemEl)
      _poemEl = null
    }

    function ensureBirdFoot() {
      var old = document.querySelector(".egg-bird-foot")
      if (old && old.parentNode) old.parentNode.removeChild(old)
      var foot = document.createElement("div")
      foot.className = "egg-bird-foot"
      foot.innerHTML =
        '<span class="egg-foot-bird" aria-hidden="true">' +
        BIRD_SVG +
        "</span><span>哪怕网络没有留下我的羽毛，但我已飞过。</span>"
      if (getSlug() === "index") {
        var home = document.querySelector(".home-wrapper")
        if (!home) return
        var friend = home.querySelector(".friend-link")
        ;(friend ? friend.parentNode : home).appendChild(foot)
      } else {
        var f = document.querySelector("footer")
        if (!f) return
        f.appendChild(foot)
      }
    }

    // 捕获阶段 pointerdown：诗句/羽毛展示期间任何按下都清场。
    // 捕获在最前端执行，即使浮层/插件调用了 stopPropagation 也拦不住。
    document.addEventListener(
      "pointerdown",
      function () {
        if (_poemEl && _poemEl.isConnected) hidePoem()
        if (document.getElementById("egg-feathers")) killFeathers()
      },
      true,
    )

    document.addEventListener("click", function (e) {
      var t = e.target
      if (!t || !t.closest) return
      // 弹窗内外层点击关闭
      if (t.closest("[data-egg-close]")) {
        closeEggDialog()
        hideToast()
        return
      }
      // 复制群号
      var copyBtn = t.closest("[data-egg-copy]")
      if (copyBtn) {
        copyBtn.textContent = "已复制"
        setTimeout(function () {
          copyBtn.textContent = "复制群号"
        }, 2000)
        var done = function () {
          toast("已复制，去 QQ 搜索 " + QQ_GROUP + " 加入秘密基地")
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(QQ_GROUP).then(done, done)
        } else {
          try {
            var ta = document.createElement("textarea")
            ta.value = QQ_GROUP
            ta.style.cssText = "position:fixed;opacity:0;pointer-events:none"
            document.body.appendChild(ta)
            ta.select()
            document.execCommand("copy")
            document.body.removeChild(ta)
            done()
          } catch (err) {
            done()
          }
        }
        return
      }
      // 首页标题三连击：前两下轻抖反馈，第三下（开启隐藏入口）换成
      // 安静的"吸入回弹"，弹窗立即出现
      if (getSlug() === "index" && t.closest(".site-title")) {
        var title = t.closest(".site-title")
        var now = Date.now()
        _logoTaps.push(now)
        _logoTaps = _logoTaps.filter(function (x) {
          return now - x < 1500
        })
        var isOpen = _logoTaps.length >= 3
        var cls = isOpen ? "egg-logo-open" : "egg-logo-tap"
        title.classList.remove("egg-logo-tap", "egg-logo-open")
        void title.offsetWidth
        title.classList.add(cls)
        clearTimeout(title._eggTapT)
        title._eggTapT = setTimeout(function () {
          title.classList.remove(cls)
        }, 460)
        if (isOpen) {
          _logoTaps = []
          openEggDialog()
        }
      }
    })

    // 搜索框输入监听（capture：输入事件不会冒泡到 document）
    document.addEventListener(
      "input",
      function (e) {
        var t = e.target
        if (!t || !t.classList || !t.classList.contains("search-bar")) return
        var v = t.value || ""
        var prev = parseInt(t.getAttribute("data-egg-prev") || "0", 10) || 0
        t.setAttribute("data-egg-prev", String(v.length))
        if (v.length < prev) {
          _buffer = ""
          return
        }
        _buffer = (_buffer + v.slice(prev)).toLowerCase()
        if (_buffer.length > 10) _buffer = _buffer.slice(-10)
        if (_buffer.slice(-4) === "bird") {
          _buffer = ""
          eggPoemEffect()
        }
      },
      true,
    )
    // 重新聚焦搜索框时重置缓冲，避免上次残留拼出 bird
    document.addEventListener(
      "focusin",
      function (e) {
        if (e.target && e.target.classList && e.target.classList.contains("search-bar")) {
          _buffer = ""
        }
      },
      true,
    )

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeEggDialog()
        // Esc 也会被搜索插件用来退出搜索：同步收掉诗词/羽毛
        hidePoem()
        killFeathers()
      }
    })

    // 监控搜索浮层关闭（任何途径：Esc/按钮切换/失焦/换页）→ 立即收掉彩蛋
    var _searchObs = []
    function watchSearchClose() {
      for (var i = 0; i < _searchObs.length; i++) {
        try {
          _searchObs[i].disconnect()
        } catch (e) {}
      }
      _searchObs = []
      document.querySelectorAll(".search-container").forEach(function (c) {
        var ob = new MutationObserver(function () {
          if (!c.classList.contains("active")) {
            hidePoem()
            killFeathers()
          }
        })
        ob.observe(c, { attributes: true, attributeFilter: ["class"] })
        _searchObs.push(ob)
      })
    }
    watchSearchClose()

    // SPA 换页：清理现场（body 会整体替换，旧节点自动消失）
    document.addEventListener("nav", function () {
      _buffer = ""
      _logoTaps = []
      hideToast()
      closeEggDialog()
      hidePoem()
      killFeathers()
      ensureBirdFoot()
      // body 被整体替换，需重新挂搜索关闭监控
      watchSearchClose()
    })

    ensureBirdFoot()
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
    initCardEntrance()
    initCardSpotlight()
    restoreFontSize()
    restoreBg()
    restoreFontColor()
    restoreLock()
    initFontManager()

    /* 首页自动锁定滚动已停用，保持浏览器默认滚动行为。 */

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

    loadDailyQuote()
    lazyLoadImages()
    setupBgBlurUp()
    initEasterEggs()
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
