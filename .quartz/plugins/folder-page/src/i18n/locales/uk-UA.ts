export default {
  pages: {
    folderContent: {
      folder: "Тека",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "У цій теці 1 елемент." : `Елементів у цій теці: ${count}.`,
    },
  },
  components: {},
};
