export default {
  pages: {
    tagContent: {
      tag: "Znacznik",
      tagIndex: "Spis znaczników",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "Oznaczony 1 element." : `Elementów z tym znacznikiem: ${count}.`,
      showingFirst: ({ count }: { count: number }) => `Pokazuje ${count} pierwszych znaczników.`,
      totalTags: ({ count }: { count: number }) => `Znalezionych wszystkich znaczników: ${count}.`,
    },
  },
  components: {},
};
