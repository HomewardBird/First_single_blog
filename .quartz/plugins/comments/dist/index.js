// node_modules/@quartz-community/utils/dist/lang.js
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// src/components/scripts/comments.inline.ts
var comments_inline_default = 'var d=s=>{let e=s.detail.theme,t=document.querySelector("iframe.giscus-frame");t&&t.contentWindow&&t.contentWindow.postMessage({giscus:{setConfig:{theme:c(r(e))}}},"https://giscus.app")},r=s=>{if(s!=="dark"&&s!=="light")return s;let e=document.querySelector(".giscus");if(!e)return s;let t=e.dataset.darkTheme??"dark",a=e.dataset.lightTheme??"light";return s==="dark"?t:a},c=s=>{let e=document.querySelector(".giscus");return e?`${e.dataset.themeUrl??"https://giscus.app/themes"}/${s}.css`:`https://giscus.app/themes/${s}.css`},n=[],u=s=>{n.push(s)};if(typeof document<"u"){let s=()=>{n.forEach(o=>o()),n.length=0;let e=document.querySelector(".giscus");if(!e)return;let t=document.createElement("script");t.src="https://giscus.app/client.js",t.async=!0,t.crossOrigin="anonymous",t.setAttribute("data-loading","lazy"),t.setAttribute("data-emit-metadata","0"),t.setAttribute("data-repo",e.dataset.repo),t.setAttribute("data-repo-id",e.dataset.repoId),t.setAttribute("data-category",e.dataset.category),t.setAttribute("data-category-id",e.dataset.categoryId),t.setAttribute("data-mapping",e.dataset.mapping),t.setAttribute("data-strict",e.dataset.strict),t.setAttribute("data-reactions-enabled",e.dataset.reactionsEnabled),t.setAttribute("data-input-position",e.dataset.inputPosition),t.setAttribute("data-lang",e.dataset.lang);let a=document.documentElement.getAttribute("saved-theme");a&&t.setAttribute("data-theme",c(r(a))),e.appendChild(t);let i=d;document.addEventListener("themechange",i),u(()=>document.removeEventListener("themechange",i))};document.addEventListener("nav",s),document.addEventListener("render",s)}\n';
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