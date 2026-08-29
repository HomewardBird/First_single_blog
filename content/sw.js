/* Service Worker：弱网 / 学校机房环境下加速页面跳转与图片加载
 *
 * 策略：
 *  - 站内所有 GET 请求（页面 HTML、css/js、图片、json）：stale-while-revalidate
 *    —— 先读缓存秒开，后台再用网络更新，再次访问几乎无延迟
 *  - 音频（mp3/m4a 等）：不拦截，交给页面内的 Cache API 处理（Range 请求直接走网络）
 *  - 更新缓存版本时只需改 VERSION
 */
var VERSION = "v1"
var CACHE_NAME = "homewardbird-site-" + VERSION

var PRECACHE_URLS = ["/", "/quotes.json", "/static/contentIndex.json"]

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(PRECACHE_URLS)
      })
      .catch(function () {}),
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
