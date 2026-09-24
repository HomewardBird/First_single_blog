export default {
  pages: {
    folderContent: {
      folder: "Map",
      previousPage: "Vorige",
      nextPage: "Volgende",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 item in deze map." : `${count} items in deze map.`,
    },
  },
  components: {},
};
