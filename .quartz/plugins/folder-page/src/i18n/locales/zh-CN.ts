export default {
  pages: {
    folderContent: {
      folder: "文件夹",
      itemsUnderFolder: ({ count }: { count: number }) => `此文件夹下有${count}条笔记。`,
      previousPage: "上一篇",
      nextPage: "下一篇",
    },
  },
  components: {},
};
