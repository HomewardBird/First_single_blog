export default {
  pages: {
    folderContent: {
      folder: "Carpeta",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 artículo en esta carpeta." : `${count} artículos en esta carpeta.`,
    },
  },
  components: {},
};
