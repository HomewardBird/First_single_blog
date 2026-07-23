export default {
  pages: {
    tagContent: {
      tag: "Etiqueta",
      tagIndex: "índex d'Etiquetes",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 article amb aquesta etiqueta." : `${count} article amb aquesta etiqueta.`,
      showingFirst: ({ count }: { count: number }) => `Mostrant les primeres ${count} etiquetes.`,
      totalTags: ({ count }: { count: number }) => `S'han trobat ${count} etiquetes en total.`,
    },
  },
  components: {},
};
