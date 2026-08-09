export default {
  pages: {
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "W tym folderze jest 1 element." : `Elementów w folderze: ${count}.`,
    },
  },
  components: {},
};
