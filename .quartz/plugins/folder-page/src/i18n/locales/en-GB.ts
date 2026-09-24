export default {
  pages: {
    folderContent: {
      folder: "Folder",
      previousPage: "Previous",
      nextPage: "Next",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 item under this folder." : `${count} items under this folder.`,
    },
  },
  components: {},
};
