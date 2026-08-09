export default {
  pages: {
    folderContent: {
      folder: "Dosar",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 articol în acest dosar." : `${count} elemente în acest dosar.`,
    },
  },
  components: {},
};
