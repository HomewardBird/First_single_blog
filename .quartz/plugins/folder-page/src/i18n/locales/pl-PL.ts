export default {
  pages: {
    folderContent: {
      folder: "Folder",
      previousPage: "Poprzedni",
      nextPage: "Następny",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "W tym folderze jest 1 element." : `Elementów w folderze: ${count}.`,
    },
  },
  components: {},
};
