// node_modules/hast-util-to-string/lib/index.js
function toString(node) {
  if ("children" in node) {
    return all(node);
  }
  return "value" in node ? node.value : "";
}
function one(node) {
  if (node.type === "text") {
    return node.value;
  }
  return "children" in node ? all(node) : "";
}
function all(node) {
  let index = -1;
  const result = [];
  while (++index < node.children.length) {
    result[index] = one(node.children[index]);
  }
  return result.join("");
}
"function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Math.random().toString(8);

// node_modules/@quartz-community/utils/dist/index.js
function escapeHTML(unsafe) {
  return unsafe.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// src/transformer.ts
var defaultOptions = {
  descriptionLength: 150,
  maxDescriptionLength: 300,
  replaceExternalLinks: true
};
var urlRegex = new RegExp(
  /(https?:\/\/)?(?<domain>([\da-z.-]+)\.([a-z.]{2,6})(:\d+)?)(?<path>[/\w.-]*)(\?[/\w.=&;-]*)?/,
  "g"
);
var Description = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "Description",
    htmlPlugins() {
      return [
        () => {
          return async (tree, file) => {
            let frontMatterDescription = file.data.frontmatter?.description;
            let text = escapeHTML(toString(tree));
            if (opts.replaceExternalLinks) {
              frontMatterDescription = frontMatterDescription?.replace(
                urlRegex,
                "$<domain>$<path>"
              );
              text = text.replace(urlRegex, "$<domain>$<path>");
            }
            if (frontMatterDescription) {
              file.data.description = frontMatterDescription;
              file.data.text = text;
              return;
            }
            const desc = text;
            const sentences = desc.replace(/\s+/g, " ").split(/\.\s/);
            let finalDesc = "";
            let sentenceIdx = 0;
            while (sentenceIdx < sentences.length) {
              const sentence = sentences[sentenceIdx];
              if (!sentence) break;
              const currentSentence = sentence.endsWith(".") ? sentence : sentence + ".";
              const nextLength = finalDesc.length + currentSentence.length + (finalDesc ? 1 : 0);
              if (nextLength <= opts.descriptionLength || sentenceIdx === 0) {
                finalDesc += (finalDesc ? " " : "") + currentSentence;
                sentenceIdx++;
              } else {
                break;
              }
            }
            file.data.description = finalDesc.length > opts.maxDescriptionLength ? finalDesc.slice(0, opts.maxDescriptionLength) + "..." : finalDesc;
            file.data.text = text;
          };
        }
      ];
    }
  };
};

export { Description };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map