export default {
  pages: {
    folderContent: {
      folder: "Cartella",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 oggetto in questa cartella." : `${count} oggetti in questa cartella.`,
    },
  },
  components: {},
};
