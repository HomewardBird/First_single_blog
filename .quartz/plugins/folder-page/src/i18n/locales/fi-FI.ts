export default {
  pages: {
    folderContent: {
      folder: "Kansio",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 kohde tässä kansiossa." : `${count} kohdetta tässä kansiossa.`,
    },
  },
  components: {},
};
