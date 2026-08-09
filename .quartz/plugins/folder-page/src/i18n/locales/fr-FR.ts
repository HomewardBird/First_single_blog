export default {
  pages: {
    folderContent: {
      folder: "Dossier",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 élément sous ce dossier." : `${count} éléments sous ce dossier.`,
    },
  },
  components: {},
};
