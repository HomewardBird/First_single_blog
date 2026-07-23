// node_modules/@quartz-community/utils/dist/lang.js
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// src/components/scripts/comments.inline.ts
var comments_inline_default = 'var m=e=>{let n=e.detail.theme,i=document.querySelector("iframe.giscus-frame");i&&i.contentWindow&&i.contentWindow.postMessage({giscus:{setConfig:{theme:d(u(n))}}},"https://giscus.app")},u=e=>{if(e!=="dark"&&e!=="light")return e;let n=document.querySelector(".giscus");if(!n)return e;let i=n.dataset.darkTheme??"dark",s=n.dataset.lightTheme??"light";return e==="dark"?i:s},d=e=>{let n=document.querySelector(".giscus");return n?`${n.dataset.themeUrl??"https://giscus.app/themes"}/${e}.css`:`https://giscus.app/themes/${e}.css`},c=[],o=e=>{c.push(e)};if(typeof document<"u"){let e=null,n=()=>{let s=document.querySelector(".giscus");if(!s||s.querySelector("iframe.giscus-frame")||s.querySelector(\'script[src*="giscus.app"]\'))return;let t=document.createElement("script");t.src="https://giscus.app/client.js",t.async=!0,t.crossOrigin="anonymous",t.setAttribute("data-loading","lazy"),t.setAttribute("data-emit-metadata","0"),t.setAttribute("data-repo",s.dataset.repo),t.setAttribute("data-repo-id",s.dataset.repoId),t.setAttribute("data-category",s.dataset.category),t.setAttribute("data-category-id",s.dataset.categoryId),t.setAttribute("data-mapping",s.dataset.mapping),t.setAttribute("data-strict",s.dataset.strict),t.setAttribute("data-reactions-enabled",s.dataset.reactionsEnabled),t.setAttribute("data-input-position",s.dataset.inputPosition),t.setAttribute("data-lang",s.dataset.lang);let r=document.documentElement.getAttribute("saved-theme");r&&t.setAttribute("data-theme",d(u(r))),s.appendChild(t);let a=m;document.addEventListener("themechange",a),o(()=>document.removeEventListener("themechange",a))},i=()=>{if(c.forEach(r=>r()),c.length=0,e&&(clearTimeout(e),e=null),document.body.getAttribute("data-slug")==="index")return;let t=document.querySelector(".giscus");if(t&&!t.querySelector("iframe.giscus-frame"))if("IntersectionObserver"in window){let r=new IntersectionObserver(a=>{a.some(g=>g.isIntersecting)&&(r.disconnect(),n())},{rootMargin:"600px 0px"});r.observe(t),o(()=>r.disconnect())}else n()};document.addEventListener("nav",i),document.addEventListener("render",i)}\n';
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