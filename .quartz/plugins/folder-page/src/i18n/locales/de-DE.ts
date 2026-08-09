export default {
  pages: {
    folderContent: {
      folder: "Ordner",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 Datei in diesem Ordner." : `${count} Dateien in diesem Ordner.`,
    },
  },
  components: {},
};
