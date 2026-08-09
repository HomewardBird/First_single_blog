export default {
  pages: {
    folderContent: {
      folder: "Klasör",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "Bu klasör altında 1 öğe." : `Bu klasör altındaki ${count} öğe.`,
    },
  },
  components: {},
};
