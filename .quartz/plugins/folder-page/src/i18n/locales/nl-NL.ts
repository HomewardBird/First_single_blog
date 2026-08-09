export default {
  pages: {
    folderContent: {
      folder: "Map",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 item in deze map." : `${count} items in deze map.`,
    },
  },
  components: {},
};
