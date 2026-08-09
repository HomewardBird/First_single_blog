export default {
  pages: {
    folderContent: {
      folder: "Arquivo",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 item neste arquivo." : `${count} items neste arquivo.`,
    },
  },
  components: {},
};
