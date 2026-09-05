/* Service Worker：弱网 / 学校机房环境下加速页面跳转与图片加载
 *
 * 策略：
 *  - 站内所有 GET 请求（页面 HTML、css/js、图片、json）：stale-while-revalidate
 *    —— 先读缓存秒开，后台再用网络更新，再次访问几乎无延迟
 *  - 安装时解析首页 HTML，把其引用的 css/js 一并预缓存，
 *    二次进入时 HTML + 全部静态资源都命中缓存 → 秒开
 *  - 音频（mp3/m4a 等）与字体（/fonts/）：不拦截。音频走 Range/页面 Cache，
 *    字体由页面 FONT_CACHE 按需缓存，避免 SW 与页面双份冗余存储
 *  - 更新缓存版本时只需改 VERSION
 */
var VERSION = "v5"
var CACHE_NAME = "homewardbird-site-" + VERSION

var PRECACHE_URLS = [
  "/",
  "/quotes.json",
  "/static/contentIndex.json",
  "/static/blur/light_bg.webp?v=3",
  "/static/blur/dark_bg.webp?v=3",
  "/static/blur/light.webp?v=3",
  "/static/blur/dark.webp?v=3",
  "/static/light_bg.webp?v=3",
  "/static/dark_bg.webp?v=3",
  "/static/light.webp?v=3",
  "/static/dark.webp?v=3",
]

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(PRECACHE_URLS).catch(function () {})
      })
      .then(function () {
        // 预缓存首页引用的 css/js（文件名带 hash，每次构建会变，
        // 所以安装时动态解析首页 HTML 提取，而不是写死）
        return fetch("/", { cache: "no-store" })
          .then(function (res) {
            if (!res.ok) return
            return res.text()
          })
          .then(function (html) {
            if (!html) return
            var urls = []
            var re = /(?:href|src)="([^"]+\.(?:css|js))"/g
            var m
            while ((m = re.exec(html))) urls.push(m[1])
            if (!urls.length) return
            return caches.open(CACHE_NAME).then(function (cache) {
              var abs = urls.map(function (u) {
                return u.charAt(0) === "/" ? u : new URL(u, self.location.origin).pathname
              })
              return Promise.allSettled(
                abs.map(function (u) {
                  return cache.add(u)
                }),
              )
            })
          })
          .catch(function () {})
      }),
  )
  self.skipWaiting()
})

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE_NAME
            })
            .map(function (k) {
              return caches.delete(k)
            }),
        )
      })
      .then(function () {
        return self.clients.claim()
      }),
  )
})

var AUDIO_RE = /\.(mp3|m4a|aac|ogg|oga|wav|flac|opus)(\?|#|$)/i

self.addEventListener("fetch", function (event) {
  var request = event.request
  if (request.method !== "GET") return

  var url
  try {
    url = new URL(request.url)
  } catch (e) {
    return
  }
  if (url.origin !== self.location.origin) return
  if (AUDIO_RE.test(url.pathname)) return
  if (url.pathname.indexOf("/cdn-cgi/") === 0) return
  // 字体由页面自身的 FONT_CACHE 管理（可选下载/按需缓存），SW 再存一份会
  // 造成 ~86MB 磁盘双份冗余；直接放行走网络，content-length 透传，
  // 下载进度也能按真实响应头计算
  if (url.pathname.indexOf("/fonts/") === 0) return

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(request).then(function (hit) {
        var update = fetch(request)
          .then(function (res) {
            if (res && res.ok) {
              var copy = res.clone()
              cache.put(request, copy).catch(function () {})
            }
            return res
          })
          .catch(function () {
            return hit
          })
        return hit || update
      })
    }),
  )
})
