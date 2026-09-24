export default {
  pages: {
    folderContent: {
      folder: "資料夾",
      previousPage: "上一篇",
      nextPage: "下一篇",
      itemsUnderFolder: ({ count }: { count: number }) => `此資料夾下有 ${count} 條筆記。`,
    },
  },
  components: {},
};
