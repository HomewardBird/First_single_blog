export default {
  pages: {
    folderContent: {
      folder: "תיקייה",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "פריט אחד תחת תיקייה זו." : `${count} פריטים תחת תיקייה זו.`,
    },
  },
  components: {},
};
