export default {
  pages: {
    folderContent: {
      folder: "Mappe",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 gjenstand i denne mappen." : `${count} gjenstander i denne mappen.`,
    },
  },
  components: {},
};
