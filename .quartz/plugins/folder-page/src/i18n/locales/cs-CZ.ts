export default {
  pages: {
    folderContent: {
      folder: "Složka",
      previousPage: "Předchozí",
      nextPage: "Další",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 položka v této složce." : `${count} položek v této složce.`,
    },
  },
  components: {},
};
