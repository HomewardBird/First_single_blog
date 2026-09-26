/* Service Worker：弱网 / 学校机房环境下加速页面跳转与图片加载
 *
 * 策略：
 *  - 页面（HTML，含 SPA 跳转与链接预览）：网络优先
 *    —— 永远先取最新页面，仅断网/请求失败时回退缓存，
 *    避免发版后用户第一次打开仍停留在旧页面
 *  - 其余站内 GET（带内容哈希的 css/js、带 ?v= 哈希的图片、json）：
 *    stale-while-revalidate —— 先读缓存秒开，后台自动更新；
 *    这类 URL 内容变化时文件名/查询串会变，缓存天然不过期
 *  - 安装时解析首页 HTML，把其引用的 css/js 与 /static/ 图片（含 ?v= 哈希）
 *    一并预缓存，二次进入时 HTML + 全部静态资源都命中缓存 → 秒开
 *  - 音频（mp3/m4a 等）与字体（/fonts/）：不拦截
 *  - 背景图 ?v= 由构建时的内容哈希生成，换图后 URL 自动变化，无需手改版本
 */
var VERSION = "v7"
var CACHE_NAME = "homewardbird-site-" + VERSION

var PRECACHE_URLS = ["/quotes.json", "/static/contentIndex.json"]

function collectAssetUrls(html, base) {
  var urls = new Set()
  var m
  var assetRe = /(?:href|src)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"/g
  while ((m = assetRe.exec(html))) urls.add(m[1])
  var imgRe = /src="([^"]*\/static\/[^"]+\.(?:webp|png|jpe?g|gif|svg|avif)(?:\?[^"]*)?)"/gi
  while ((m = imgRe.exec(html))) urls.add(m[1])
  return Array.from(urls)
    .map(function (u) {
      try {
        return new URL(u, base).href
      } catch (e) {
        return null
      }
    })
    .filter(Boolean)
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        var staticPrecache = cache.addAll(PRECACHE_URLS).catch(function () {})

        // 首页用 no-store 取最新版本：既写入缓存，又解析出其中
        // 带哈希的 css/js 与背景图 URL 一并预缓存（文件名每次构建都会变，
        // 所以只能动态解析，不能写死）
        var indexPrecache = fetch("/", { cache: "no-store" })
          .then(function (res) {
            if (!res || !res.ok) return null
            cache.put("/", res.clone()).catch(function () {})
            return res.text()
          })
          .then(function (html) {
            if (!html) return
            var urls = collectAssetUrls(html, self.location.origin + "/")
            if (!urls.length) return
            return Promise.allSettled(
              urls.map(function (u) {
                return cache.add(u)
              }),
            )
          })
          .catch(function () {})

        return Promise.all([staticPrecache, indexPrecache])
      })
      .then(function () {
        self.skipWaiting()
      }),
  )
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

// 页面请求：顶层导航（navigate）、无扩展名的站内路径（SPA 跳转 / 链接预览），
// 以及 .html 结尾的请求。带扩展名的资源一律走静态资源分支。
function isPageRequest(request, url) {
  if (request.mode === "navigate") return true
  if (url.pathname.indexOf("/static/") === 0) return false
  if (/\.html?$/i.test(url.pathname)) return true
  return !/\.[a-z0-9]+$/i.test(url.pathname)
}

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

  // 页面：网络优先。发版后第一次打开就是最新页面，断网时回退缓存。
  if (isPageRequest(request, url)) {
    event.respondWith(
      fetch(request)
        .then(function (res) {
          if (res && res.ok) {
            var copy = res.clone()
            caches
              .open(CACHE_NAME)
              .then(function (cache) {
                cache.put(request, copy).catch(function () {})
              })
              .catch(function () {})
          }
          return res
        })
        .catch(function () {
          return caches.match(request)
        }),
    )
    return
  }

  // custom.js 无内容哈希、每次构建都可能变化：网络优先，
  // 保证改版后普通刷新即生效；离线/弱网时回退缓存。
  if (url.pathname.endsWith("/static/custom.js")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return fetch(request)
          .then(function (res) {
            if (res && res.ok) cache.put(request, res.clone()).catch(function () {})
            return res
          })
          .catch(function () {
            return cache.match(request)
          })
      }),
    )
    return
  }

  // 其余静态资源：stale-while-revalidate，缓存秒开 + 后台更新。
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
