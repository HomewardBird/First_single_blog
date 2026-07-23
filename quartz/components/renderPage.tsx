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
          <div class="loader-text">安巢鸟的网站</div>
        </div>
        <video id="bg-video-light" muted loop playsinline preload="none" data-src={`${basePath}/static/light_bg.mp4`}></video>
        <video id="bg-video-dark" muted loop playsinline preload="none" data-src={`${basePath}/static/dark_bg.mp4`}></video>
        <img id="bg-image-light" src={`${basePath}/static/light_bg.jpg`} alt="" />
        <img id="bg-image-dark" src={`${basePath}/static/dark_bg.jpg`} alt="" />
        <div id="bg-overlay"></div>
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
  /* ===== 加载界面：仅首次访问显示 ===== */
  var loader = document.getElementById('page-loader');
  var pageLoaded = false;
  try { pageLoaded = sessionStorage.getItem('qzt-loaded') === '1' || window.__qzt_loaded; } catch(e) { pageLoaded = !!window.__qzt_loaded; }

  function hideLoader() {
    if (!loader || !loader.parentNode) return;
    loader.classList.remove('show');
    loader.classList.add('fade-out');
    setTimeout(function() {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 600);
  }

  if (loader) {
    if (pageLoaded || document.readyState === 'complete') {
      hideLoader();
    } else {
      loader.classList.add('show');
      window.addEventListener('load', function() {
        setTimeout(hideLoader, 200);
      });
      setTimeout(function() { hideLoader(); }, 5000);
    }
    window.__qzt_loaded = true;
    try { sessionStorage.setItem('qzt-loaded', '1'); } catch(e) {}
  }

  /* ===== 视频懒加载 ===== */
  function getVideos() { return document.querySelectorAll('#bg-video-light, #bg-video-dark'); }
  var videosLoaded = false;
  function lazyLoadVideos() {
    if (videosLoaded) return;
    videosLoaded = true;
    getVideos().forEach(function(v) {
      var src = v.getAttribute('data-src');
      if (src) { v.src = src; v.load(); }
    });
  }

  function getIsDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
        || document.documentElement.getAttribute('saved-theme') === 'dark';
  }
  var isDark = getIsDark();

  /* ===== 阅读模式：浅色/深色各5个 ===== */
  var LIGHT_MODES = [
    { color: '',        icon: '\\uD83C\\uDFAC', label: '视频背景' },
    { color: '#FFDEAD', icon: '\\uD83D\\uDCD6', label: '暖黄' },
    { color: '#B0D6EC', icon: '\\uD83D\\uDCD8', label: '淡蓝' },
    { color: '#B3EBBA', icon: '\\uD83D\\uDCD7', label: '柔绿' },
    { color: '#F9F9F9', icon: '\\u2B1C',         label: '白色' }
  ];
  var DARK_MODES = [
    { color: '',        icon: '\\uD83C\\uDFAC', label: '视频背景' },
    { color: '#7C706C', icon: '\\uD83D\\uDCD6', label: '暖灰' },
    { color: '#6A6E80', icon: '\\uD83D\\uDCD8', label: '冷灰' },
    { color: '#676767', icon: '\\u2B1B',         label: '中灰' },
    { color: '#242424', icon: '\\u25CF',         label: '深灰' }
  ];

  function getModes() { return isDark ? DARK_MODES : LIGHT_MODES; }

  function getSaved() {
    try { var v = parseInt(localStorage.getItem('readingMode')); return (v >= 0 && v <= 4) ? v : 0; } catch(e) { return 0; }
  }
  var mode = getSaved();

  /* ===== 动态构建按钮面板 ===== */
  function buildPanel() {
    var panel = document.getElementById('reading-mode-colors');
    if (!panel) return;
    var modes = getModes();
    var html = '';
    for (var i = 0; i < modes.length; i++) {
      var m = modes[i];
      var bg = m.color ? 'background:' + m.color + ';' : '';
      var fg = '';
      if (m.color && !isDark) { fg = 'color:#2b2b2b;'; }
      else if (m.color && isDark) { fg = 'color:#ccc;'; }
      html += '<button data-mode="' + i + '" class="rm-color" style="' + bg + fg + '" title="' + m.label + '">' + m.icon + '</button>';
    }
    html += '<div class="rm-divider"></div>';
    html += '<button data-font="auto" class="rm-font active" title="自动">A</button>';
    html += '<button data-font="dark" class="rm-font" title="深黑" style="color:#2b2b2b;">A</button>';
    html += '<button data-font="gray" class="rm-font" title="深灰" style="color:#4e4e4e;">A</button>';
    html += '<button data-font="light" class="rm-font" title="浅白" style="color:#ebebec;">A</button>';
    html += '<button data-font="sepia" class="rm-font" title="暖褐" style="color:#c8a87c;">A</button>';
    html += '<button data-font="blue" class="rm-font" title="淡蓝" style="color:#88aacc;">A</button>';
    html += '<div class="rm-divider"></div>';
    html += '<button id="lock-mode-btn" class="rm-lock" title="锁定背景">\\uD83D\\uDD13</button>';
    panel.innerHTML = html;

    var cbs = panel.querySelectorAll('.rm-color');
    var fbs = panel.querySelectorAll('.rm-font');
    cbs.forEach(function(b) {
      b.addEventListener('click', function(e) {
        e.stopPropagation();
        applyMode(parseInt(b.getAttribute('data-mode')));
        var cp = document.getElementById('reading-mode-colors');
        if (cp) cp.classList.add('hidden');
      });
    });
    fbs.forEach(function(b) {
      b.addEventListener('click', function(e) {
        e.stopPropagation();
        applyFontMode(b.getAttribute('data-font'));
      });
    });
    lockBtn = document.getElementById('lock-mode-btn');
    if (lockBtn) {
      lockBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        setLocked(!readingLocked);
      });
    }
  }

  /* ===== 字体模式 ===== */
  function getFontMode() {
    try { return localStorage.getItem('fontMode') || 'auto'; } catch(e) { return 'auto'; }
  }
  var fontMode = getFontMode();

  function applyFontMode(fm) {
    fontMode = fm;
    try { localStorage.setItem('fontMode', fm); } catch(e) {}
    var panel = document.getElementById('reading-mode-colors');
    var fbs = panel ? panel.querySelectorAll('.rm-font') : [];
    fbs.forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-font') === fm); });
    ['dark','light','gray','sepia','blue'].forEach(function(k) {
      document.body.removeAttribute('data-font-' + k);
    });
    if (fm !== 'auto') document.body.setAttribute('data-font-' + fm, 'true');
  }

  /* ===== 视频控制 ===== */
  function playCurrentVideo() {
    if (window.innerWidth <= 768) return;
    lazyLoadVideos();
    getVideos().forEach(function(v) { v.style.display = ''; });
    var target = isDark ? document.getElementById('bg-video-dark') : document.getElementById('bg-video-light');
    if (target) { if (!target.src) { target.src = target.getAttribute('data-src'); target.load(); } target.play().catch(function(){}); }
  }

  function pauseAllVideos() {
    getVideos().forEach(function(v) { v.pause(); });
  }

  /* ===== 应用模式 ===== */
  function applyMode(m) {
    mode = m;
    try { localStorage.setItem('readingMode', String(m)); } catch(e) {}
    var modes = getModes();
    var mainBtn = document.getElementById('reading-mode-btn');
    if (mainBtn) mainBtn.textContent = modes[m].icon;
    var panel = document.getElementById('reading-mode-colors');
    var cbs = panel ? panel.querySelectorAll('.rm-color') : [];
    cbs.forEach(function(b) { b.classList.toggle('active', parseInt(b.getAttribute('data-mode')) === m); });

    document.body.removeAttribute('data-bg-light');
    document.body.removeAttribute('data-bg-dark');

    var overlay = document.getElementById('bg-overlay');
    if (m === 0) {
      if (overlay) {
        overlay.style.background = '';
        overlay.style.backdropFilter = '';
        overlay.style.webkitBackdropFilter = '';
      }
      document.body.removeAttribute('data-reading-mode');
      playCurrentVideo();
    } else {
      getVideos().forEach(function(v) { v.style.display = 'none'; });
      if (overlay) {
        overlay.style.background = modes[m].color;
        overlay.style.backdropFilter = 'none';
        overlay.style.webkitBackdropFilter = 'none';
      }
      document.body.setAttribute('data-reading-mode', 'true');
      pauseAllVideos();
      document.body.setAttribute(isDark ? 'data-bg-dark' : 'data-bg-light', 'true');
    }
    updateLockBtn();
  }

  /* ===== 锁定机制 ===== */
  var readingLocked = false;
  var lockBtn = null;
  try { readingLocked = localStorage.getItem('readingLocked') === '1'; } catch(e) {}
  function setLocked(v) {
    readingLocked = v;
    try { localStorage.setItem('readingLocked', v ? '1' : '0'); } catch(e) {}
    updateLockBtn();
  }
  function updateLockBtn() {
    if (!lockBtn) return;
    lockBtn.textContent = readingLocked ? '\\uD83D\\uDD12' : '\\uD83D\\uDD13';
    lockBtn.classList.toggle('locked', readingLocked);
  }

  /* ===== 页面切换背景逻辑（修复：锁定优先 + 保留用户选择） ===== */
  function handlePageSwitch() {
    // 如果锁定了，什么都不做，保持当前选择
    if (readingLocked) return;
    var isIndex = document.body.getAttribute('data-slug') === 'index';
    // 只在用户没主动操作过时（mode 来自 localStorage）才自动切换
    var saved = getSaved();
    if (isIndex && saved === 0) return; // 首页且已选视频，不动
    if (!isIndex && saved === 0) applyMode(1);  // 子页面且当前是视频，切纯色
    else if (isIndex && saved !== 0) applyMode(0); // 首页且不是视频，切视频
  }

  /* ===== 主题切换 ===== */
  function onThemeChange() {
    var wasDark = isDark;
    isDark = getIsDark();
    if (wasDark !== isDark) {
      buildPanel();
      applyMode(mode);
      applyFontMode(fontMode);
      updateLockBtn();
    }
  }

  if (!window.__qzt_observer_bound) {
    window.__qzt_observer_bound = true;
    var themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'saved-theme'] });
  }

  /* ===== 面板交互 ===== */
  function bindPanelToggle() {
    var btn = document.getElementById('reading-mode-btn');
    if (btn && !btn.__toggle_bound) {
      btn.__toggle_bound = true;
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var cp = document.getElementById('reading-mode-colors');
        if (cp) cp.classList.toggle('hidden');
      });
    }
  }

  /* ===== 音乐播放器 ===== */
  var tracks = [
    '/static/05 Coffee Cats.m4a',
    '/static/1-28 希望的明⽇.m4a',
    '/static/2-06 玉磬漻漻.m4a',
    '/static/2-16 风清月白.m4a',
    '/static/26 Welcome School.m4a',
    '/static/ornave-lofi-moon-light-553399.mp3',
    '/static/monume-lofi-chill-chill-509496.mp3',
    '/static/mao690276--527415.mp3',
    '/static/lofidreams-cozy-lofi-background-music-for-study-457198.mp3',
    '/static/apalonbeats-lofi-lofi-music-lofi-chill-2-560425.mp3'
  ];
  var current = 0;
  var audio = new Audio();
  audio.preload = 'metadata';
  audio.loop = false;

  function loadTrack(i) {
    current = i % tracks.length;
    audio.src = tracks[current];
    audio.load();
  }

  audio.addEventListener('ended', function() { loadTrack(current + 1); audio.play().catch(function(){}); });
  audio.addEventListener('error', function() { loadTrack(current + 1); if (window.showToast) window.showToast('音频加载失败，跳过'); audio.play().catch(function(){}); });

  var musicClickTimer = null;
  function bindMusic() {
    var btn = document.getElementById('music-btn');
    if (!btn || btn.__music_bound) return;
    btn.__music_bound = true;
    btn.addEventListener('click', function(e) {
      var mb = document.getElementById('music-btn');
      if (musicClickTimer) {
        clearTimeout(musicClickTimer); musicClickTimer = null;
        loadTrack(current + 1);
        if (mb) { mb.classList.add('loading'); mb.textContent = ''; }
        audio.play().then(function() {
          if (mb) { mb.classList.remove('loading'); mb.classList.add('playing'); mb.textContent = '\\uD83C\\uDFB6'; }
          showTrackName();
        }).catch(function() {
          if (mb) { mb.classList.remove('loading'); if (window.showToast) window.showToast('播放失败'); }
        });
        return;
      }
      musicClickTimer = setTimeout(function() {
        musicClickTimer = null;
        var mb2 = document.getElementById('music-btn');
        if (audio.paused) {
          if (!audio.src || audio.src === window.location.href) loadTrack(0);
          if (mb2) { mb2.classList.add('loading'); mb2.textContent = ''; }
          audio.play().then(function() {
            if (mb2) { mb2.classList.remove('loading'); mb2.classList.add('playing'); mb2.textContent = '\\uD83C\\uDFB6'; }
            showTrackName();
          }).catch(function() {
            if (mb2) { mb2.classList.remove('loading'); mb2.textContent = '\\u26A0'; setTimeout(function() { var mb3 = document.getElementById('music-btn'); if (mb3) mb3.textContent = '\\uD83C\\uDFB5'; }, 1500); }
          });
        } else {
          audio.pause(); if (mb2) { mb2.classList.remove('playing'); mb2.textContent = '\\uD83C\\uDFB5'; }
        }
      }, 250);
    });
  }

  function showTrackName() {
    var name = tracks[current].split('/').pop().replace(/\\.[^.]+$/, '');
    var label = document.getElementById('track-label');
    if (!label) {
      label = document.createElement('div'); label.id = 'track-label';
      var fc = document.getElementById('floating-controls');
      if (fc) fc.appendChild(label);
    }
    if (label) { label.textContent = name; label.classList.add('show'); }
    clearTimeout(label._timeout);
    label._timeout = setTimeout(function() { if (label) label.classList.remove('show'); }, 2000);
  }

  function showToast(msg) {
    var fc = document.getElementById('floating-controls');
    if (!fc) return;
    var existing = fc.querySelector('.music-toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.className = 'music-toast';
    t.textContent = msg;
    t.style.cssText = 'position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;background:rgba(0,0,0,0.7);color:#fff;padding:4px 10px;border-radius:8px;font-size:0.75rem;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.25s';
    fc.appendChild(t);
    requestAnimationFrame(function() { t.style.opacity = '1'; });
    setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 250); }, 1500);
  }

  // Expose music toggle for custom.js top-bar button
  window.__musicBtnClick = function() {
    var btn = document.getElementById('music-btn');
    if (btn) btn.click();
  };

  /* ===== 全局点击关闭面板 ===== */
  if (!window.__qzt_click_bound) {
    window.__qzt_click_bound = true;
    document.addEventListener('click', function() {
      var cp = document.getElementById('reading-mode-colors');
      if (cp && !cp.classList.contains('hidden')) cp.classList.add('hidden');
    });
  }

  /* ===== SPA 导航重建 ===== */
  function reinit() {
    var cp = document.getElementById('reading-mode-colors');
    if (cp) cp.classList.add('hidden');
    buildPanel();
    applyMode(mode);
    handlePageSwitch();
    updateLockBtn();
  }

  if (!window.__qzt_nav_bound) {
    window.__qzt_nav_bound = true;
    document.addEventListener('nav', function() {
      reinit();
    });
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) pauseAllVideos();
      else if (mode === 0) playCurrentVideo();
    });
  }

  bindPanelToggle();
  bindMusic();
  reinit();
  applyFontMode(fontMode);
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
