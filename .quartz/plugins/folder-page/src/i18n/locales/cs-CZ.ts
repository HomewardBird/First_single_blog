export default {
  pages: {
    folderContent: {
      folder: "Složka",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 položka v této složce." : `${count} položek v této složce.`,
    },
  },
  components: {},
};
