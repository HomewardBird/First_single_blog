export default {
  pages: {
    folderContent: {
      folder: "پوشه",
      previousPage: "قبلی",
      nextPage: "بعدی",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? ".یک مطلب در این پوشه است" : `${count} مطلب در این پوشه است.`,
    },
  },
  components: {},
};
