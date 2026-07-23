export default {
  pages: {
    folderContent: {
      folder: "Қалта",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "Бұл қалтада 1 элемент бар." : `Бұл қалтада ${count} элемент бар.`,
    },
  },
  components: {},
};
