export default {
  pages: {
    folderContent: {
      folder: "Arquivo",
      previousPage: "Anterior",
      nextPage: "Próximo",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 item neste arquivo." : `${count} items neste arquivo.`,
    },
  },
  components: {},
};
