import { createRequire } from 'module';

createRequire(import.meta.url);

// node_modules/@quartz-community/utils/dist/lang.js
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// node_modules/github-slugger/regex.js
var regex = /[\0-\x1F!-,\.\/:-@\[-\^`\{-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0378\u0379\u037E\u0380-\u0385\u0387\u038B\u038D\u03A2\u03F6\u0482\u0530\u0557\u0558\u055A-\u055F\u0589-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05CF\u05EB-\u05EE\u05F3-\u060F\u061B-\u061F\u066A-\u066D\u06D4\u06DD\u06DE\u06E9\u06FD\u06FE\u0700-\u070F\u074B\u074C\u07B2-\u07BF\u07F6-\u07F9\u07FB\u07FC\u07FE\u07FF\u082E-\u083F\u085C-\u085F\u086B-\u089F\u08B5\u08C8-\u08D2\u08E2\u0964\u0965\u0970\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09F2-\u09FB\u09FD\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF0-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B70\u0B72-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BF0-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C7F\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D4F-\u0D53\u0D58-\u0D5E\u0D64\u0D65\u0D70-\u0D79\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF4-\u0E00\u0E3B-\u0E3F\u0E4F\u0E5A-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F01-\u0F17\u0F1A-\u0F1F\u0F2A-\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F48\u0F6D-\u0F70\u0F85\u0F98\u0FBD-\u0FC5\u0FC7-\u0FFF\u104A-\u104F\u109E\u109F\u10C6\u10C8-\u10CC\u10CE\u10CF\u10FB\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u1360-\u137F\u1390-\u139F\u13F6\u13F7\u13FE-\u1400\u166D\u166E\u1680\u169B-\u169F\u16EB-\u16ED\u16F9-\u16FF\u170D\u1715-\u171F\u1735-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17D4-\u17D6\u17D8-\u17DB\u17DE\u17DF\u17EA-\u180A\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u1945\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DA-\u19FF\u1A1C-\u1A1F\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1AA6\u1AA8-\u1AAF\u1AC1-\u1AFF\u1B4C-\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BF4-\u1BFF\u1C38-\u1C3F\u1C4A-\u1C4C\u1C7E\u1C7F\u1C89-\u1C8F\u1CBB\u1CBC\u1CC0-\u1CCF\u1CD3\u1CFB-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FBD\u1FBF-\u1FC1\u1FC5\u1FCD-\u1FCF\u1FD4\u1FD5\u1FDC-\u1FDF\u1FED-\u1FF1\u1FF5\u1FFD-\u203E\u2041-\u2053\u2055-\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F-\u215F\u2189-\u24B5\u24EA-\u2BFF\u2C2F\u2C5F\u2CE5-\u2CEA\u2CF4-\u2CFF\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D70-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u3040\u3097\u3098\u309B\u309C\u30A0\u30FB\u3100-\u3104\u3130\u318F-\u319F\u31C0-\u31EF\u3200-\u33FF\u4DC0-\u4DFF\u9FFD-\u9FFF\uA48D-\uA4CF\uA4FE\uA4FF\uA60D-\uA60F\uA62C-\uA63F\uA673\uA67E\uA6F2-\uA716\uA720\uA721\uA789\uA78A\uA7C0\uA7C1\uA7CB-\uA7F4\uA828-\uA82B\uA82D-\uA83F\uA874-\uA87F\uA8C6-\uA8CF\uA8DA-\uA8DF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA954-\uA95F\uA97D-\uA97F\uA9C1-\uA9CE\uA9DA-\uA9DF\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A-\uAA5F\uAA77-\uAA79\uAAC3-\uAADA\uAADE\uAADF\uAAF0\uAAF1\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB5B\uAB6A-\uAB6F\uABEB\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uE000-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB29\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBB2-\uFBD2\uFD3E-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFC-\uFDFF\uFE10-\uFE1F\uFE30-\uFE32\uFE35-\uFE4C\uFE50-\uFE6F\uFE75\uFEFD-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF3E\uFF40\uFF5B-\uFF65\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDD3F\uDD75-\uDDFC\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEE1-\uDEFF\uDF20-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDF9F\uDFC4-\uDFC7\uDFD0\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56-\uDC5F\uDC77-\uDC7F\uDC9F-\uDCDF\uDCF3\uDCF6-\uDCFF\uDD16-\uDD1F\uDD3A-\uDD7F\uDDB8-\uDDBD\uDDC0-\uDDFF\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE40-\uDE5F\uDE7D-\uDE7F\uDE9D-\uDEBF\uDEC8\uDEE7-\uDEFF\uDF36-\uDF3F\uDF56-\uDF5F\uDF73-\uDF7F\uDF92-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCFF\uDD28-\uDD2F\uDD3A-\uDE7F\uDEAA\uDEAD-\uDEAF\uDEB2-\uDEFF\uDF1D-\uDF26\uDF28-\uDF2F\uDF51-\uDFAF\uDFC5-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC47-\uDC65\uDC70-\uDC7E\uDCBB-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD40-\uDD43\uDD48-\uDD4F\uDD74\uDD75\uDD77-\uDD7F\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDFF\uDE12\uDE38-\uDE3D\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEA9-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC4B-\uDC4F\uDC5A-\uDC5D\uDC62-\uDC7F\uDCC6\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDC1-\uDDD7\uDDDE-\uDDFF\uDE41-\uDE43\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB9-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF3A-\uDFFF]|\uD806[\uDC3B-\uDC9F\uDCEA-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD44-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE2\uDDE5-\uDDFF\uDE3F-\uDE46\uDE48-\uDE4F\uDE9A-\uDE9C\uDE9E-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC41-\uDC4F\uDC5A-\uDC71\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF7-\uDFAF\uDFB1-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD824-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83D\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDECF\uDEEE\uDEEF\uDEF5-\uDEFF\uDF37-\uDF3F\uDF44-\uDF4F\uDF5A-\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE80-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE2\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82C[\uDD1F-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A-\uDC9C\uDC9F-\uDFFF]|\uD834[\uDC00-\uDD64\uDD6A-\uDD6C\uDD73-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDE41\uDE45-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3\uDFCC\uDFCD]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD4F-\uDEBF\uDEFA-\uDFFF]|\uD83A[\uDCC5-\uDCCF\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDFFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDFFF]|\uD83C[\uDC00-\uDD2F\uDD4A-\uDD4F\uDD6A-\uDD6F\uDD8A-\uDFFF]|\uD83E[\uDC00-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEDE-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]/g;
function slug(value, maintainCase) {
  if (typeof value !== "string") return "";
  value = value.toLowerCase();
  return value.replace(regex, "").replace(/ /g, "-");
}
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

// node_modules/@quartz-community/utils/dist/index.js
function simplifySlug(fp) {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return res.length === 0 ? "/" : res;
}
function slugifyFilePath(fp, excludeExt) {
  fp = stripSlashes(fp);
  const ext = getFileExtension(fp);
  const withoutFileExt = fp.replace(new RegExp(ext + "$"), "");
  const finalExt = [".md", ".html", void 0].includes(ext) ? "" : ext;
  let slug2 = _sluggify(withoutFileExt);
  if (endsWith(slug2, "_index")) {
    slug2 = slug2.replace(/_index$/, "index");
  }
  const segments = slug2.split("/");
  if (segments.length >= 2 && segments[segments.length - 1] === segments[segments.length - 2]) {
    segments[segments.length - 1] = "index";
    slug2 = segments.join("/");
  }
  return slug2 + (finalExt ?? "");
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
function getFileExtension(s2) {
  return s2.match(/\.[A-Za-z0-9]+$/)?.[0];
}
function splitAnchor(link) {
  const [fp, anchor] = link.split("#", 2);
  if (fp.endsWith(".pdf")) {
    return [fp, anchor === void 0 ? "" : `#${anchor}`];
  }
  if (anchor === void 0) {
    return [fp, ""];
  }
  const bare = anchor.startsWith("^") ? anchor.slice(1) : anchor;
  const slugged = "#" + slug(bare);
  return [fp, slugged];
}
function slugifyPath(s2) {
  return s2.split("/").map(
    (segment) => segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/\?/g, "").replace(/#/g, "").replace(/[<>:"|*]/g, "").toLowerCase()
  ).join("/").replace(/\/$/, "");
}
function _sluggify(s2) {
  return slugifyPath(s2);
}

// src/util/path.ts
function simplifySlug2(fp) {
  return simplifySlug(fp);
}
function resolveRelative(current, target) {
  const simplified = simplifySlug2(target);
  const rootPath = pathToRoot(current);
  return joinSegments(rootPath, simplified);
}
function slugifyWikilinkTarget(target) {
  const [rawPath, anchor] = splitAnchor(target);
  if (!rawPath) return anchor;
  const pathWithExt = rawPath.endsWith(".md") ? rawPath : `${rawPath}.md`;
  const slug2 = slugifyFilePath(pathWithExt);
  return slug2 + anchor;
}
function pathToRoot(slug2) {
  let rootPath = slug2.split("/").filter((x2) => x2 !== "").slice(0, -1).map((_2) => "..").join("/");
  if (rootPath.length === 0) {
    rootPath = ".";
  }
  return rootPath;
}

// src/i18n/locales/en-US.ts
var en_US_default = {
  components: {
    noteProperties: {
      title: "Properties"
    }
  }
};

// src/i18n/index.ts
var locales = {
  "en-US": en_US_default
};
function i18n(locale) {
  return locales[locale] || en_US_default;
}

// src/components/styles/noteProperties.scss
var noteProperties_default = '.note-properties {\n  margin: 0.5rem 0 1rem;\n  border: 1px solid var(--lightgray);\n  border-radius: 5px;\n  font-size: 0.9rem;\n}\n.note-properties[open] > .note-properties-header {\n  border-bottom: 1px solid var(--lightgray);\n}\n.note-properties .note-properties-header {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.4rem 0.8rem;\n  cursor: pointer;\n  user-select: none;\n  list-style: none;\n  color: var(--darkgray);\n  font-weight: 600;\n}\n.note-properties .note-properties-header::-webkit-details-marker {\n  display: none;\n}\n.note-properties .note-properties-header::before {\n  content: "";\n  display: inline-block;\n  width: 0.5em;\n  height: 0.5em;\n  border-right: 2px solid var(--darkgray);\n  border-bottom: 2px solid var(--darkgray);\n  transform: rotate(-45deg);\n  transition: transform 0.2s ease;\n}\n.note-properties[open] > .note-properties-header::before {\n  transform: rotate(45deg);\n}\n.note-properties .note-properties-count {\n  margin-left: auto;\n  font-size: 0.75rem;\n  color: var(--gray);\n  font-weight: 400;\n}\n.note-properties .note-properties-table {\n  width: 100%;\n  border-collapse: collapse;\n  table-layout: fixed;\n}\n.note-properties .note-properties-row {\n  border-bottom: 1px solid var(--lightgray);\n}\n.note-properties .note-properties-row:last-child {\n  border-bottom: none;\n}\n.note-properties .note-properties-key {\n  width: 35%;\n  padding: 0.35rem 0.8rem;\n  color: var(--gray);\n  font-size: 0.85rem;\n  vertical-align: top;\n  word-break: break-word;\n}\n.note-properties .note-properties-value {\n  padding: 0.35rem 0.8rem;\n  vertical-align: top;\n  word-break: break-word;\n}\n.note-properties .note-properties-empty {\n  color: var(--gray);\n  font-style: italic;\n}\n.note-properties .note-properties-boolean input[type=checkbox] {\n  pointer-events: none;\n  margin: 0;\n  vertical-align: middle;\n}\n.note-properties .note-properties-number {\n  font-family: var(--codeFont);\n  font-size: 0.85em;\n}\n.note-properties .note-properties-link {\n  text-decoration: none;\n  color: var(--secondary);\n}\n.note-properties .note-properties-link:hover {\n  text-decoration: underline;\n}\n.note-properties .note-properties-separator {\n  color: var(--gray);\n}\n.note-properties .note-properties-list {\n  display: inline;\n}\n.note-properties .note-properties-tags {\n  display: inline-flex;\n}\n.note-properties .note-properties-tags .tag-link {\n  display: inline-block;\n  padding: 0.1rem 0.4rem;\n  border-radius: 3px;\n  background: var(--highlight);\n  color: var(--secondary);\n  font-size: 0.85em;\n  text-decoration: none;\n}\n.note-properties .note-properties-tags .tag-link:hover {\n  background: var(--secondary);\n  color: var(--light);\n}\n.note-properties .note-properties-object code {\n  font-size: 0.85em;\n  padding: 0.1rem 0.3rem;\n  border-radius: 3px;\n  background: var(--highlight);\n  word-break: break-all;\n}';

// src/components/scripts/noteProperties.inline.ts
var noteProperties_inline_default = 'var o="note-properties-collapsed";function d(){let e=document.querySelector("details.note-properties");if(!e)return;let t=localStorage.getItem(o);if(t!==null){let i=t==="true";e.open=!i}let n=()=>{localStorage.setItem(o,String(!e.open))};e.addEventListener("toggle",n),typeof window<"u"&&window.addCleanup&&window.addCleanup(()=>{e.removeEventListener("toggle",n)})}document.addEventListener("nav",()=>{d()});document.addEventListener("render",()=>{d()});\n';

// src/components/NoteProperties.tsx
var WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
var MDLINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;
var URL_RE = /https?:\/\/[^\s<>]+/g;
function lookupHref(ctx, slugifiedTarget) {
  return ctx.resolvedLinks[slugifiedTarget] ?? resolveRelative(ctx.slug, slugifiedTarget);
}
function renderTextWithLinks(text, ctx) {
  const segments = [];
  for (const match of text.matchAll(WIKILINK_RE)) {
    const target = match[1];
    const display = match[2] ?? target;
    const href = lookupHref(ctx, slugifyWikilinkTarget(target));
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: /* @__PURE__ */ u2("a", { href, class: "internal internal-link note-properties-link", children: display })
    });
  }
  for (const match of text.matchAll(MDLINK_RE)) {
    const overlaps = segments.some(
      (s2) => match.index < s2.end && match.index + match[0].length > s2.start
    );
    if (overlaps) continue;
    const display = match[1];
    const href = match[2];
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const resolvedHref = isExternal ? href : lookupHref(ctx, href);
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: /* @__PURE__ */ u2(
        "a",
        {
          href: resolvedHref,
          class: classNames(
            isExternal ? "external external-link" : "internal internal-link",
            "note-properties-link"
          ),
          ...isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {},
          children: display || href
        }
      )
    });
  }
  for (const match of text.matchAll(URL_RE)) {
    const overlaps = segments.some(
      (s2) => match.index < s2.end && match.index + match[0].length > s2.start
    );
    if (overlaps) continue;
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: /* @__PURE__ */ u2(
        "a",
        {
          href: match[0],
          class: "external external-link note-properties-link",
          target: "_blank",
          rel: "noopener noreferrer",
          children: match[0]
        }
      )
    });
  }
  if (segments.length === 0) return [text];
  segments.sort((a2, b2) => a2.start - b2.start);
  const result = [];
  let cursor = 0;
  for (const seg of segments) {
    if (seg.start > cursor) {
      result.push(text.slice(cursor, seg.start));
    }
    result.push(seg.node);
    cursor = seg.end;
  }
  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }
  return result;
}
function renderValue(value, ctx) {
  if (value === null || value === void 0) {
    return /* @__PURE__ */ u2("span", { class: "note-properties-empty", children: "\u2014" });
  }
  if (typeof value === "boolean") {
    return /* @__PURE__ */ u2("span", { class: classNames("note-properties-boolean", value ? "is-true" : "is-false"), children: /* @__PURE__ */ u2("input", { type: "checkbox", checked: value, disabled: true }) });
  }
  if (typeof value === "number") {
    return /* @__PURE__ */ u2("span", { class: "note-properties-number", children: value });
  }
  if (typeof value === "string") {
    const parts = renderTextWithLinks(value, ctx);
    return /* @__PURE__ */ u2("span", { class: "note-properties-text", children: parts });
  }
  if (Array.isArray(value)) {
    const items = value.map((item, idx) => {
      const rendered = renderValue(item, ctx);
      return /* @__PURE__ */ u2(S, { children: [
        idx > 0 && /* @__PURE__ */ u2("span", { class: "note-properties-separator", children: ", " }),
        rendered
      ] });
    });
    return /* @__PURE__ */ u2("span", { class: "note-properties-list", children: items });
  }
  if (typeof value === "object") {
    return /* @__PURE__ */ u2("span", { class: "note-properties-object", children: /* @__PURE__ */ u2("code", { children: JSON.stringify(value) }) });
  }
  return String(value);
}
function renderTagList(tags, ctx) {
  const items = tags.map((tag, idx) => {
    const href = resolveRelative(ctx.slug, `tags/${tag}`);
    return /* @__PURE__ */ u2(S, { children: [
      idx > 0 && /* @__PURE__ */ u2("span", { class: "note-properties-separator", children: ", " }),
      /* @__PURE__ */ u2("a", { href, class: "internal internal-link tag-link", children: tag })
    ] });
  });
  return /* @__PURE__ */ u2("span", { class: "note-properties-tags", children: items });
}
var NoteProperties_default = ((opts) => {
  const { collapsed = false } = opts ?? {};
  const Component = (props) => {
    const noteProps = props.fileData?.noteProperties;
    if (!noteProps) return null;
    if (noteProps.showProperties === false) return null;
    if (noteProps.showProperties !== true && noteProps.hideView) return null;
    const properties = noteProps.properties;
    const entries = Object.entries(properties);
    if (entries.length === 0) return null;
    const locale = props.cfg?.locale || "en-US";
    const i18nData = i18n(locale);
    const ctx = {
      slug: props.fileData?.slug ?? "",
      resolvedLinks: noteProps.resolvedLinks ?? {}
    };
    const isCollapsed = noteProps.collapseProperties ?? collapsed;
    return /* @__PURE__ */ u2(
      "details",
      {
        class: classNames(props.displayClass, "note-properties", "metadata-container"),
        open: !isCollapsed,
        "data-collapsed": isCollapsed,
        children: [
          /* @__PURE__ */ u2("summary", { class: "note-properties-header", children: [
            /* @__PURE__ */ u2("span", { class: "note-properties-title", children: i18nData.components.noteProperties.title }),
            /* @__PURE__ */ u2("span", { class: "note-properties-count", children: entries.length })
          ] }),
          /* @__PURE__ */ u2("table", { class: "note-properties-table", children: /* @__PURE__ */ u2("tbody", { children: entries.map(([key, value]) => /* @__PURE__ */ u2("tr", { class: "note-properties-row metadata-property", children: [
            /* @__PURE__ */ u2("td", { class: "note-properties-key metadata-property-key", children: key }),
            /* @__PURE__ */ u2("td", { class: "note-properties-value metadata-property-value", children: key === "tags" && Array.isArray(value) ? renderTagList(value, ctx) : renderValue(value, ctx) })
          ] }, key)) }) })
        ]
      }
    );
  };
  Component.css = noteProperties_default;
  Component.afterDOMLoaded = noteProperties_inline_default;
  return Component;
});

export { NoteProperties_default as NotePropertiesComponent };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map