export default {
  pages: {
    tagContent: {
      tag: "Etichetta",
      tagIndex: "Indice etichette",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 oggetto con questa etichetta." : `${count} oggetti con questa etichetta.`,
      showingFirst: ({ count }: { count: number }) =>
        count === 1 ? "Prima etichetta." : `Prime ${count} etichette.`,
      totalTags: ({ count }: { count: number }) =>
        count === 1 ? "Trovata 1 etichetta in totale." : `Trovate ${count} etichette totali.`,
    },
  },
  components: {},
};
