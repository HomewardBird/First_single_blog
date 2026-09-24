export default {
  pages: {
    folderContent: {
      folder: "תיקייה",
      previousPage: "הקודם",
      nextPage: "הבא",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "פריט אחד תחת תיקייה זו." : `${count} פריטים תחת תיקייה זו.`,
    },
  },
  components: {},
};
