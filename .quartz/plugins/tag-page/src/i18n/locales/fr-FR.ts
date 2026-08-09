export default {
  pages: {
    tagContent: {
      tag: "Étiquette",
      tagIndex: "Index des étiquettes",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 élément avec cette étiquette." : `${count} éléments avec cette étiquette.`,
      showingFirst: ({ count }: { count: number }) =>
        `Affichage des premières ${count} étiquettes.`,
      totalTags: ({ count }: { count: number }) => `Trouvé ${count} étiquettes au total.`,
    },
  },
  components: {},
};
