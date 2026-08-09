export default {
  pages: {
    tagContent: {
      tag: "Etiqueta",
      tagIndex: "Índice de Etiquetas",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 artículo con esta etiqueta." : `${count} artículos con esta etiqueta.`,
      showingFirst: ({ count }: { count: number }) => `Mostrando las primeras ${count} etiquetas.`,
      totalTags: ({ count }: { count: number }) => `Se han encontrado ${count} etiquetas en total.`,
    },
  },
  components: {},
};
