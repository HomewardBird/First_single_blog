import { render } from "preact-render-to-string"
import { QuartzComponent, QuartzComponentProps } from "./types"
import BodyConstructor from "./Body"
import {
  CSSResource,
  JSResource,
  JSResourceToScriptElement,
  StaticResources,
} from "../util/resources"
import { FullSlug, RelativeURL, joinSegments, normalizeHastElement } from "../util/path"
import { clone } from "../util/clone"
import { Root, Element, ElementContent } from "hast"
import { GlobalConfiguration } from "../cfg"
import { i18n } from "../i18n"
import { styleText } from "util"
import { resolveFrame } from "./frames"
import type { TreeTransform } from "../plugins/types"
import type { BuildCtx } from "../util/ctx"

interface RenderComponents {
  head: QuartzComponent
  header: QuartzComponent[]
  beforeBody: QuartzComponent[]
  pageBody: QuartzComponent
  afterBody: QuartzComponent[]
  left: QuartzComponent[]
  right: QuartzComponent[]
  footer: QuartzComponent
  frame?: string
}

const headerRegex = new RegExp(/h[1-6]/)
export function pageResources(
  baseDir: FullSlug | RelativeURL,
  staticResources: StaticResources,
  ctx?: BuildCtx,
): StaticResources {
  const hashedNames = ctx?.hashedResourceNames
  const cssFile = hashedNames?.["index.css"] ?? "index.css"
  const prescriptFile = hashedNames?.["prescript.js"] ?? "prescript.js"
  const postscriptFile = hashedNames?.["postscript.js"] ?? "postscript.js"

  const componentCssResources: CSSResource[] = []
  if (ctx?.componentCssMap) {
    const seen = new Set<string>()
    for (const filename of ctx.componentCssMap.values()) {
      if (seen.has(filename)) continue
      seen.add(filename)
      componentCssResources.push({ content: joinSegments(baseDir, filename) })
    }
  }

  const extracted = ctx?.extractedInlineResources
  const resolvedCss: CSSResource[] = staticResources.css.map((resource) => {
    if (!(resource.inline ?? false) || !extracted) return resource
    const filename = extracted.get(resource.content)
    if (!filename) return resource
    return { content: joinSegments(baseDir, filename) }
  })

  const resolvedJs: JSResource[] = staticResources.js.map((resource) => {
    if (resource.contentType !== "inline" || !extracted) return resource
    const filename = extracted.get(resource.script)
    if (!filename) return resource
    return {
      src: joinSegments(baseDir, filename),
      loadTime: resource.loadTime,
      contentType: "external" as const,
      moduleType: resource.moduleType,
      spaPreserve: resource.spaPreserve,
    }
  })

  const contentIndexPath = joinSegments(baseDir, "static/contentIndex.json")
  const contentIndexScript = `const fetchData = fetch("${contentIndexPath}").then(data => data.json())`

  const resources: StaticResources = {
    css: [
      {
        content: joinSegments(baseDir, cssFile),
      },
      ...componentCssResources,
      ...resolvedCss,
    ],
    js: [
      {
        src: joinSegments(baseDir, prescriptFile),
        loadTime: "beforeDOMReady",
        contentType: "external",
      },
      {
        loadTime: "beforeDOMReady",
        contentType: "inline",
        spaPreserve: true,
        script: contentIndexScript,
      },
      ...resolvedJs,
    ],
    additionalHead: staticResources.additionalHead,
  }

  resources.js.push({
    src: joinSegments(baseDir, postscriptFile),
    loadTime: "afterDOMReady",
    moduleType: "module",
    contentType: "external",
  })

  return resources
}

/** @internal Exported for testing only. */
export function renderTranscludes(
  root: Root,
  cfg: GlobalConfiguration,
  slug: FullSlug,
  componentData: QuartzComponentProps,
  visited: Set<FullSlug>,
) {
  // Walk the tree manually instead of using visit() so we can track the
  // ancestor chain for cycle detection. visit() runs the callback before
  // descending into replaced children, so a Set-based guard there falsely
  // rejects sibling transclusions of the same target.
  function walk(node: Element | Root) {
    const children = (node as Root).children ?? []
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child?.type !== "element") continue
      const el = child as Element

      if (el.tagName !== "blockquote") {
        walk(el)
        continue
      }

      const classNames = (el.properties?.className ?? []) as string[]
      if (!classNames.includes("transclude")) {
        walk(el)
        continue
      }

      const inner = el.children[0] as Element
      const transcludeTarget = (inner.properties["data-slug"] ?? slug) as FullSlug
      if (visited.has(transcludeTarget)) {
        console.warn(
          styleText(
            "yellow",
            `Warning: Skipping circular transclusion: ${slug} -> ${transcludeTarget}`,
          ),
        )
        el.children = [
          {
            type: "element",
            tagName: "p",
            properties: { style: "color: var(--secondary);" },
            children: [
              {
                type: "text",
                value: `Circular transclusion detected: ${transcludeTarget}`,
              },
            ],
          },
        ]
        continue
      }

      visited.add(transcludeTarget)

      let page = componentData.allFiles.find((f) => f.slug === transcludeTarget)
      if (!page) {
        const dotIdx = transcludeTarget.lastIndexOf(".")
        const slashIdx = transcludeTarget.lastIndexOf("/")
        if (dotIdx > slashIdx + 1) {
          const stripped = transcludeTarget.slice(0, dotIdx) as FullSlug
          page = componentData.allFiles.findLast((f) => f.slug === stripped)
        }
      }
      if (!page) {
        visited.delete(transcludeTarget)
        continue
      }

      let blockRef = el.properties.dataBlock as string | undefined
      if (blockRef?.startsWith("#^")) {
        // block transclude
        blockRef = blockRef.slice("#^".length)
        let blockNode = page.blocks?.[blockRef]
        if (blockNode) {
          if (blockNode.tagName === "li") {
            blockNode = {
              type: "element",
              tagName: "ul",
              properties: {},
              children: [blockNode],
            }
          }

          el.children = [
            normalizeHastElement(blockNode, slug, transcludeTarget),
            {
              type: "element",
              tagName: "a",
              properties: {
                href: inner.properties?.href,
                class: ["internal", "internal-link", "transclude-src"],
              },
              children: [
                { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
              ],
            },
          ]
        }
      } else if (blockRef?.startsWith("#") && page.htmlAst) {
        // header transclude
        blockRef = blockRef.slice(1)
        let startIdx = undefined
        let startDepth = undefined
        let endIdx = undefined
        for (const [i, htmlEl] of page.htmlAst.children.entries()) {
          if (!(htmlEl.type === "element" && htmlEl.tagName.match(headerRegex))) continue
          const depth = Number(htmlEl.tagName.substring(1))

          if (startIdx === undefined || startDepth === undefined) {
            if (htmlEl.properties?.id === blockRef) {
              startIdx = i
              startDepth = depth
            }
          } else if (depth <= startDepth) {
            endIdx = i
            break
          }
        }

        if (startIdx === undefined) {
          visited.delete(transcludeTarget)
          continue
        }

        el.children = [
          ...(page.htmlAst.children.slice(startIdx, endIdx) as ElementContent[]).map((c) =>
            normalizeHastElement(c as Element, slug, transcludeTarget),
          ),
          {
            type: "element",
            tagName: "a",
            properties: {
              href: inner.properties?.href,
              class: ["internal", "internal-link", "transclude-src"],
            },
            children: [
              { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
            ],
          },
        ]
      } else if (page.htmlAst) {
        // page transclude
        el.children = [
          {
            type: "element",
            tagName: "h1",
            properties: {},
            children: [
              {
                type: "text",
                value:
                  page.frontmatter?.title ??
                  i18n(cfg.locale).components.transcludes.transcludeOf({
                    targetSlug: page.slug!,
                  }),
              },
            ],
          },
          ...(page.htmlAst.children as ElementContent[]).map((c) =>
            normalizeHastElement(c as Element, slug, transcludeTarget),
          ),
          {
            type: "element",
            tagName: "a",
            properties: {
              href: inner.properties?.href,
              class: ["internal", "internal-link", "transclude-src"],
            },
            children: [
              { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
            ],
          },
        ]
      }

      // Recurse into the replaced children to resolve nested transclusions,
      // then remove from visited so sibling embeds of the same target work.
      walk(el)
      visited.delete(transcludeTarget)
    }
  }

  walk(root)
}

export function renderPage(
  cfg: GlobalConfiguration,
  slug: FullSlug,
  componentData: QuartzComponentProps,
  components: RenderComponents,
  pageResources: StaticResources,
  treeTransforms?: TreeTransform[],
): string {
  // make a deep copy of the tree so we don't remove the transclusion references
  // for the file cached in contentMap in build.ts
  const root = clone(componentData.tree) as Root
  const visited = new Set<FullSlug>([slug])
  renderTranscludes(root, cfg, slug, componentData, visited)

  // Run plugin-provided tree transforms (e.g. resolving inline bases codeblocks)
  if (treeTransforms) {
    for (const transform of treeTransforms) {
      transform(root, slug, componentData)
    }
  }

  // set componentData.tree to the edited html that has transclusions rendered
  componentData.tree = root

  const {
    head: Head,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer: Footer,
    frame: frameName,
  } = components
  const Body = BodyConstructor()
  const frame = resolveFrame(frameName)

  const lang = componentData.fileData.frontmatter?.lang ?? cfg.locale?.split("-")[0] ?? "en"
  const direction = i18n(cfg.locale).direction ?? "ltr"
  // During local dev (--serve), the dev server serves from root without the
  // baseUrl subpath, so basePath must be empty to avoid broken links.
  const basePath =
    componentData.ctx.argv.serve || !cfg.baseUrl
      ? ""
      : new URL(`https://${cfg.baseUrl}`).pathname.replace(/\/$/, "")
  const doc = (
    <html lang={lang} dir={direction}>
      <Head {...componentData} />
      <body data-slug={slug} data-basepath={basePath}>
        <div id="page-loader">
          <div class="loader-glass">
            <div class="loader-orb"></div>
            <div class="loader-ring"></div>
          </div>
          <div class="loader-text">归鸟的馆藏日志</div>
        </div>
        <video id="bg-video-light" muted loop playsinline preload="none" data-src={`${basePath}/static/light_bg.mp4`}></video>
        <video id="bg-video-dark" muted loop playsinline preload="none" data-src={`${basePath}/static/dark_bg.mp4`}></video>
        <img id="bg-image-light" src={`${basePath}/static/light_bg.jpg`} alt="" />
        <img id="bg-image-dark" src={`${basePath}/static/dark_bg.jpg`} alt="" />
        <div id="bg-overlay"></div>
        <div id="top-bar">
          <div class="top-bar-inner">
            <span class="top-bar-title">归鸟的馆藏日志</span>
            <div class="top-bar-right">
              <button id="hamburger-btn" class="hamburger-btn" aria-label="菜单">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
              </button>
            </div>
          </div>
        </div>
        {frame.css && <style dangerouslySetInnerHTML={{ __html: frame.css }} />}
        <div id="quartz-root" class="page" data-frame={frame.name}>
          <Body {...componentData}>
            {[
              frame.render({
                componentData,
                head: Head,
                header,
                beforeBody,
                pageBody: Content,
                afterBody,
                left,
                right,
                footer: Footer,
              }),
            ]}
          </Body>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var _loaded = false;
  try { _loaded = sessionStorage.getItem('qzt-loaded') === '1' || !!window.__qzt_loaded; } catch(e) { _loaded = !!window.__qzt_loaded; }
  var loader = document.getElementById('page-loader');
  function hideLoader() {
    if (!loader || !loader.parentNode) return;
    loader.classList.remove('show'); loader.classList.add('fade-out');
    setTimeout(function() { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 600);
  }
  if (loader) {
    if (!_loaded && document.readyState !== 'complete') {
      loader.classList.add('show');
      window.addEventListener('load', function() { setTimeout(hideLoader, 200); });
      setTimeout(hideLoader, 5000);
    }
    window.__qzt_loaded = true;
    try { sessionStorage.setItem('qzt-loaded', '1'); } catch(e) {}
  }

  var _vLoaded = false;
  function lazyLoadVideos() {
    if (_vLoaded) return; _vLoaded = true;
    document.querySelectorAll('#bg-video-light, #bg-video-dark').forEach(function(v) {
      var src = v.getAttribute('data-src');
      if (src) { v.src = src; v.load(); }
    });
  }

  var bp = (document.body && document.body.getAttribute('data-basepath')) || '';
  function tp(f) { return bp + '/static/' + f; }

  var tracks = [
    tp('05 Coffee Cats.m4a'), tp('1-28 希望的明\u2F47.m4a'),
    tp('2-06 玉磬漻漻.m4a'), tp('2-16 风清月白.m4a'),
    tp('26 Welcome School.m4a'), tp('ornave-lofi-moon-light-553399.mp3'),
    tp('monume-lofi-chill-chill-509496.mp3'), tp('mao690276--527415.mp3'),
    tp('lofidreams-cozy-lofi-background-music-for-study-457198.mp3'),
    tp('apalonbeats-lofi-lofi-music-lofi-chill-2-560425.mp3')
  ];
  var cur = 0;
  var audio = new Audio();
  audio.preload = 'metadata'; audio.loop = false;

  function loadTrack(i) { cur = i % tracks.length; audio.src = tracks[cur]; audio.load(); }

  function _showToast(msg) {
    var old = document.querySelector('.music-toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'music-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:6rem;left:50%;transform:translateX(-50%);z-index:10050;background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.3);border-radius:14px;padding:0.85rem 1.5rem;font-size:0.92rem;color:var(--dark);opacity:0;transition:opacity 0.4s ease;pointer-events:none';
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.style.opacity = '1'; });
    setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { if (t.parentNode) t.remove(); }, 400); }, 2000);
  }

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
    getState: function() { return { playing: !audio.paused, track: tracks[cur].split('/').pop().replace(/\.[^.]+$/, '') }; }
  };

  function loadDailyQuote() {
    var el = document.getElementById('random-quote');
    if (!el) return;
    try {
      var ctrl = new AbortController();
      var tm = setTimeout(function() { ctrl.abort(); }, 5000);
      fetch(bp + '/quotes.json', { signal: ctrl.signal })
        .then(function(r) { if (!r.ok) throw Error(); return r.json(); })
        .then(function(qs) {
          clearTimeout(tm);
          var q = qs[Math.floor(Math.random() * qs.length)];
          el.textContent = '\u300C ' + (q.text || '') + ' \u300D';
          el.title = q.source || '';
        })
        .catch(function() { el.textContent = '\u300C \u6B22\u8FCE\u6765\u5230\u5B89\u7684\u535A\u5BA2 \u300D'; });
    } catch(e) { el.textContent = '\u300C \u6B22\u8FCE\u6765\u5230\u5B89\u7684\u535A\u5BA2 \u300D'; }
  }

  lazyLoadVideos();
  loadDailyQuote();

  if (!window.__qzt_nb) {
    window.__qzt_nb = true;
    document.addEventListener('nav', function() { loadDailyQuote(); });
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) document.querySelectorAll('#bg-video-light, #bg-video-dark').forEach(function(v) { v.pause(); });
    });
  }
})();
          `.trim(),
          }}
        />
      </body>
      {pageResources.js
        .filter((resource) => resource.loadTime === "afterDOMReady")
        .map((res) => JSResourceToScriptElement(res, true))}
    </html>
  )

  return "<!DOCTYPE html>\n" + render(doc)
}
