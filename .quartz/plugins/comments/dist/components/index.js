// node_modules/@quartz-community/utils/dist/lang.js
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// src/components/scripts/comments.inline.ts
var comments_inline_default = 'var m=t=>{let i=t.detail.theme,r=document.querySelector("iframe.giscus-frame");r&&r.contentWindow&&r.contentWindow.postMessage({giscus:{setConfig:{theme:d(u(i))}}},"https://giscus.app")},u=t=>{if(t!=="dark"&&t!=="light")return t;let i=document.querySelector(".giscus");if(!i)return t;let r=i.dataset.darkTheme??"dark",s=i.dataset.lightTheme??"light";return t==="dark"?r:s},d=t=>{let i=document.querySelector(".giscus");return i?`${i.dataset.themeUrl??"https://giscus.app/themes"}/${t}.css`:`https://giscus.app/themes/${t}.css`},o=[],c=t=>{o.push(t)};if(typeof document<"u"){let t=null,i=()=>{let s=document.querySelector(".giscus");if(!s||s.querySelector("iframe.giscus-frame")||s.querySelector(\'script[src*="giscus.app"]\'))return;let e=document.createElement("script");e.src="https://giscus.app/client.js",e.async=!0,e.crossOrigin="anonymous",e.setAttribute("data-loading","lazy"),e.setAttribute("data-emit-metadata","0"),e.setAttribute("data-repo",s.dataset.repo),e.setAttribute("data-repo-id",s.dataset.repoId),e.setAttribute("data-category",s.dataset.category),e.setAttribute("data-category-id",s.dataset.categoryId),e.setAttribute("data-mapping",s.dataset.mapping),e.setAttribute("data-strict",s.dataset.strict),e.setAttribute("data-reactions-enabled",s.dataset.reactionsEnabled),e.setAttribute("data-input-position",s.dataset.inputPosition),e.setAttribute("data-lang",s.dataset.lang);let n=document.documentElement.getAttribute("saved-theme");n&&e.setAttribute("data-theme",d(u(n))),s.appendChild(e);let a=m;document.addEventListener("themechange",a),c(()=>document.removeEventListener("themechange",a))},r=()=>{if(o.forEach(n=>n()),o.length=0,t&&(clearTimeout(t),t=null),document.body.getAttribute("data-slug")==="index")return;let e=document.querySelector(".giscus");if(e)if(t=setTimeout(()=>{let n=document.querySelector(".giscus");n&&!n.querySelector("iframe.giscus-frame")&&(n.style.display="none")},8e3),c(()=>{t&&(clearTimeout(t),t=null)}),"IntersectionObserver"in window){let n=new IntersectionObserver(a=>{a.some(g=>g.isIntersecting)&&(n.disconnect(),i())},{rootMargin:"600px 0px"});n.observe(e),c(()=>n.disconnect())}else i()};document.addEventListener("nav",r),document.addEventListener("render",r)}\n';
var l;
function S(n2) {
  return n2.children;
}
l = { __e: function(n2, l2, u3, t2) {
  for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Math.random().toString(8);

// node_modules/preact/jsx-runtime/dist/jsxRuntime.mjs
var f2 = 0;
function u2(e2, t2, n2, o2, i2, u3) {
  t2 || (t2 = {});
  var a2, c2, p2 = t2;
  if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
  var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i2, __self: u3 };
  if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
  return l.vnode && l.vnode(l2), l2;
}

// src/components/Comments.tsx
function boolToStringBool(b2) {
  return b2 ? "1" : "0";
}
var Comments_default = ((opts) => {
  const Comments = ({ displayClass, fileData, cfg }) => {
    const commentsOverride = fileData.frontmatter?.comments;
    if (commentsOverride === false || commentsOverride === "false") {
      return /* @__PURE__ */ u2(S, {});
    }
    return /* @__PURE__ */ u2(
      "div",
      {
        class: classNames(displayClass, "giscus"),
        "data-repo": opts.options.repo,
        "data-repo-id": opts.options.repoId,
        "data-category": opts.options.category,
        "data-category-id": opts.options.categoryId,
        "data-mapping": opts.options.mapping ?? "url",
        "data-strict": boolToStringBool(opts.options.strict ?? true),
        "data-reactions-enabled": boolToStringBool(opts.options.reactionsEnabled ?? true),
        "data-input-position": opts.options.inputPosition ?? "bottom",
        "data-light-theme": opts.options.lightTheme ?? "light",
        "data-dark-theme": opts.options.darkTheme ?? "dark",
        "data-theme-url": opts.options.themeUrl ?? `https://${cfg.baseUrl ?? "example.com"}/static/giscus`,
        "data-lang": opts.options.lang ?? "en"
      }
    );
  };
  Comments.afterDOMLoaded = comments_inline_default;
  return Comments;
});

export { Comments_default as Comments };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map