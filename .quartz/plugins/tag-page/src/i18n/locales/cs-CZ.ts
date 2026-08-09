export default {
  pages: {
    tagContent: {
      tag: "Tag",
      tagIndex: "Rejstřík tagů",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 položka s tímto tagem." : `${count} položek s tímto tagem.`,
      showingFirst: ({ count }: { count: number }) => `Zobrazují se první ${count} tagy.`,
      totalTags: ({ count }: { count: number }) => `Nalezeno celkem ${count} tagů.`,
    },
  },
  components: {},
};
