export default {
  pages: {
    tagContent: {
      tag: "Мітка",
      tagIndex: "Індекс мітки",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 елемент з цією міткою." : `Елементів з цією міткою: ${count}.`,
      showingFirst: ({ count }: { count: number }) => `Показ перших ${count} міток.`,
      totalTags: ({ count }: { count: number }) => `Всього знайдено міток: ${count}.`,
    },
  },
  components: {},
};
