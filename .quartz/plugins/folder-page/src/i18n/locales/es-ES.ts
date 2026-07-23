export default {
  pages: {
    folderContent: {
      folder: "Carpeta",
      previousPage: "Anterior",
      nextPage: "Siguiente",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 artículo en esta carpeta." : `${count} artículos en esta carpeta.`,
    },
  },
  components: {},
};
