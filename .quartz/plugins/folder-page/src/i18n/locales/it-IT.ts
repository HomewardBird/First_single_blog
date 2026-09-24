export default {
  pages: {
    folderContent: {
      folder: "Cartella",
      previousPage: "Precedente",
      nextPage: "Successivo",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 oggetto in questa cartella." : `${count} oggetti in questa cartella.`,
    },
  },
  components: {},
};
