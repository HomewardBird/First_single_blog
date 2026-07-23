// node_modules/@quartz-community/utils/dist/lang.js
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// node_modules/@quartz-community/utils/dist/path.js
function simplifySlug(fp) {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return res.length === 0 ? "/" : res;
}
function joinSegments(...args) {
  if (args.length === 0) {
    return "";
  }
  let joined = args.filter((segment) => segment !== "" && segment !== "/").map((segment) => stripSlashes(segment)).join("/");
  const first = args[0];
  const last = args[args.length - 1];
  if (first?.startsWith("/")) {
    joined = "/" + joined;
  }
  if (last?.endsWith("/")) {
    joined = joined + "/";
  }
  return joined;
}
function endsWith(s2, suffix) {
  return s2 === suffix || s2.endsWith("/" + suffix);
}
function trimSuffix(s2, suffix) {
  if (endsWith(s2, suffix)) {
    s2 = s2.slice(0, -suffix.length);
  }
  return s2;
}
function stripSlashes(s2, onlyStripPrefix) {
  if (s2.startsWith("/")) {
    s2 = s2.substring(1);
  }
  if (!onlyStripPrefix && s2.endsWith("/")) {
    s2 = s2.slice(0, -1);
  }
  return s2;
}
function pathToRoot(slug2) {
  let rootPath = slug2.split("/").filter((x2) => x2 !== "").slice(0, -1).map((_2) => "..").join("/");
  if (rootPath.length === 0) {
    rootPath = ".";
  }
  return rootPath;
}
function resolveRelative(current, target) {
  const res = joinSegments(pathToRoot(current), simplifySlug(target));
  return res;
}
var l;
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

// node_modules/@quartz-community/utils/dist/index.js
function joinSegments2(...args) {
  if (args.length === 0) {
    return "";
  }
  let joined = args.filter((segment) => segment !== "" && segment !== "/").map((segment) => stripSlashes2(segment)).join("/");
  const first = args[0];
  const last = args[args.length - 1];
  if (first?.startsWith("/")) {
    joined = "/" + joined;
  }
  if (last?.endsWith("/")) {
    joined = joined + "/";
  }
  return joined;
}
function stripSlashes2(s2, onlyStripPrefix) {
  if (s2.startsWith("/")) {
    s2 = s2.substring(1);
  }
  if (s2.endsWith("/")) {
    s2 = s2.slice(0, -1);
  }
  return s2;
}

// src/util/fileTrie.ts
var FileTrieNode = class _FileTrieNode {
  isFolder;
  children;
  slugSegments;
  fileSegmentHint;
  displayNameOverride;
  data;
  constructor(segments, data) {
    this.children = [];
    this.slugSegments = segments;
    this.data = data ?? null;
    this.isFolder = false;
    this.displayNameOverride = void 0;
  }
  get displayName() {
    const nonIndexTitle = this.data?.title === "index" ? void 0 : this.data?.title;
    return this.displayNameOverride ?? nonIndexTitle ?? this.fileSegmentHint ?? this.slugSegment ?? "";
  }
  set displayName(name) {
    this.displayNameOverride = name;
  }
  get slug() {
    const path = joinSegments2(...this.slugSegments);
    if (this.isFolder) {
      return joinSegments2(path, "index");
    }
    return path;
  }
  get slugSegment() {
    return this.slugSegments[this.slugSegments.length - 1] ?? "";
  }
  makeChild(path, file) {
    const nextSegment = path[0];
    if (!nextSegment) {
      throw new Error("path is empty");
    }
    const fullPath = [...this.slugSegments, nextSegment];
    const child = new _FileTrieNode(fullPath, file);
    this.children.push(child);
    return child;
  }
  insert(path, file) {
    if (path.length === 0) {
      throw new Error("path is empty");
    }
    this.isFolder = true;
    const segment = path[0];
    if (!segment) {
      throw new Error("path is empty");
    }
    if (path.length === 1) {
      if (segment === "index") {
        this.data ??= file;
      } else {
        this.makeChild(path, file);
      }
    } else if (path.length > 1) {
      const child = this.children.find((c2) => c2.slugSegment === segment) ?? this.makeChild(path, void 0);
      const fileParts = file.filePath.split("/");
      const hint = fileParts.at(-path.length);
      if (hint) {
        child.fileSegmentHint = hint;
      }
      child.insert(path.slice(1), file);
    }
  }
  add(file) {
    this.insert(file.slug.split("/"), file);
  }
  findNode(path) {
    if (path.length === 0 || path.length === 1 && path[0] === "index") {
      return this;
    }
    return this.children.find((c2) => c2.slugSegment === path[0])?.findNode(path.slice(1));
  }
  ancestryChain(path) {
    if (path.length === 0 || path.length === 1 && path[0] === "index") {
      return [this];
    }
    const child = this.children.find((c2) => c2.slugSegment === path[0]);
    if (!child) {
      return void 0;
    }
    const childPath = child.ancestryChain(path.slice(1));
    if (!childPath) {
      return void 0;
    }
    return [this, ...childPath];
  }
  filter(filterFn) {
    this.children = this.children.filter(filterFn);
    this.children.forEach((child) => child.filter(filterFn));
  }
  map(mapFn) {
    mapFn(this);
    this.children.forEach((child) => child.map(mapFn));
  }
  sort(sortFn) {
    this.children = this.children.sort(sortFn);
    this.children.forEach((e2) => e2.sort(sortFn));
  }
};
function trieFromAllFiles(allFiles) {
  const trie = new FileTrieNode([]);
  allFiles.forEach((file) => {
    if (file.frontmatter) {
      trie.add({
        slug: file.slug,
        title: file.frontmatter.title ?? "",
        filePath: file.filePath
      });
    }
  });
  return trie;
}

// src/components/styles/breadcrumbs.scss
var breadcrumbs_default = ".breadcrumb-container {\n  margin: 0;\n  margin-top: 0.75rem;\n  padding: 0;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: wrap;\n  gap: 0.5rem;\n}\n\n.breadcrumb-element p {\n  margin: 0;\n  margin-left: 0.5rem;\n  padding: 0;\n  line-height: normal;\n}\n.breadcrumb-element {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: center;\n}";

// src/components/Breadcrumbs.tsx
var defaultOptions = {
  spacerSymbol: "\u276F",
  rootName: "Home",
  resolveFrontmatterTitle: true,
  showCurrentPage: true
};
function formatCrumb(displayName, baseSlug, currentSlug) {
  return {
    displayName,
    path: resolveRelative(baseSlug, currentSlug)
  };
}
var Breadcrumbs_default = ((opts) => {
  const options = { ...defaultOptions, ...opts };
  const Breadcrumbs = ({
    fileData,
    allFiles,
    displayClass,
    ctx
  }) => {
    const typedCtx = ctx ?? {};
    typedCtx.trie ??= trieFromAllFiles(
      allFiles
    );
    const trie = typedCtx.trie;
    const slug2 = fileData.slug;
    const slugParts = slug2.split("/");
    const pathNodes = trie.ancestryChain(slugParts);
    if (!pathNodes) {
      return null;
    }
    const crumbs = pathNodes.map((node, idx) => {
      const crumb = formatCrumb(node.displayName, slug2, simplifySlug(node.slug));
      if (idx === 0) {
        crumb.displayName = options.rootName;
      }
      if (idx === pathNodes.length - 1) {
        crumb.path = "";
      }
      return crumb;
    });
    if (!options.showCurrentPage) {
      crumbs.pop();
    }
    return /* @__PURE__ */ u2("nav", { class: classNames(displayClass, "breadcrumb-container"), "aria-label": "breadcrumbs", children: crumbs.map((crumb, index) => /* @__PURE__ */ u2("div", { class: "breadcrumb-element", children: [
      /* @__PURE__ */ u2("a", { href: crumb.path, children: crumb.displayName }),
      index !== crumbs.length - 1 && /* @__PURE__ */ u2("p", { children: ` ${options.spacerSymbol} ` })
    ] })) });
  };
  Breadcrumbs.css = breadcrumbs_default;
  return Breadcrumbs;
});

export { Breadcrumbs_default as Breadcrumbs };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map