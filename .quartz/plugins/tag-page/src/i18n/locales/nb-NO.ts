export default {
  pages: {
    tagContent: {
      tag: "Tagg",
      tagIndex: "Tagg Indeks",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 gjenstand med denne taggen." : `${count} gjenstander med denne taggen.`,
      showingFirst: ({ count }: { count: number }) => `Viser første ${count} tagger.`,
      totalTags: ({ count }: { count: number }) => `Fant totalt ${count} tagger.`,
    },
  },
  components: {},
};
