export default {
  pages: {
    tagContent: {
      tag: "Тег",
      tagIndex: "Тегтер индексі",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "Бұл тегпен 1 элемент." : `Бұл тегпен ${count} элемент.`,
      showingFirst: ({ count }: { count: number }) => `Алғашқы ${count} тег көрсетілуде.`,
      totalTags: ({ count }: { count: number }) => `Барлығы ${count} тег табылды.`,
    },
  },
  components: {},
};
