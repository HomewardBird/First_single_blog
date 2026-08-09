export default {
  pages: {
    tagContent: {
      tag: "Žyma",
      tagIndex: "Žymų indeksas",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1
          ? "1 elementas su šia žyma."
          : count < 10
            ? `${count} elementai su šia žyma.`
            : `${count} elementų su šia žyma.`,
      showingFirst: ({ count }: { count: number }) =>
        count < 10 ? `Rodomos pirmosios ${count} žymos.` : `Rodomos pirmosios ${count} žymų.`,
      totalTags: ({ count }: { count: number }) =>
        count === 1
          ? "Rasta iš viso 1 žyma."
          : count < 10
            ? `Rasta iš viso ${count} žymos.`
            : `Rasta iš viso ${count} žymų.`,
    },
  },
  components: {},
};
