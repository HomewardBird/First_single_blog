export default {
  pages: {
    folderContent: {
      folder: "Carpeta",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 article en aquesta carpeta." : `${count} articles en esta carpeta.`,
    },
  },
  components: {},
};
