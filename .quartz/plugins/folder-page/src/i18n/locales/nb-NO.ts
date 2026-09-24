export default {
  pages: {
    folderContent: {
      folder: "Mappe",
      previousPage: "Forrige",
      nextPage: "Neste",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 gjenstand i denne mappen." : `${count} gjenstander i denne mappen.`,
    },
  },
  components: {},
};
