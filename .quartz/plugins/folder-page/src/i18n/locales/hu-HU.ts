export default {
  pages: {
    folderContent: {
      folder: "Mappa",
      previousPage: "Előző",
      nextPage: "Következő",
      itemsUnderFolder: ({ count }: { count: number }) =>
        `Ebben a mappában ${count} elem található.`,
    },
  },
  components: {},
};
