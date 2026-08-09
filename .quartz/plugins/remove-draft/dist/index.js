// src/filter.ts
var RemoveDrafts = () => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, [_tree, vfile]) {
    const frontmatter = vfile.data?.frontmatter;
    const draftFlag = frontmatter?.draft === true || frontmatter?.draft === "true";
    return !draftFlag;
  }
});

export { RemoveDrafts };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map