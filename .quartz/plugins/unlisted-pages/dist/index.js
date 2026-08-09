// src/transformer.ts
var rehypeUnlisted = () => {
  return () => (_tree, file) => {
    const frontmatter = file.data?.frontmatter;
    const unlisted = frontmatter?.unlisted;
    if (typeof unlisted === "boolean") {
      file.data.unlisted = unlisted;
    }
  };
};
var UnlistedPages = () => {
  return {
    name: "UnlistedPages",
    htmlPlugins() {
      return [rehypeUnlisted()];
    }
  };
};

export { UnlistedPages };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map