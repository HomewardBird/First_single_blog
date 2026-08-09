export default {
  pages: {
    tagContent: {
      tag: "Etichetă",
      tagIndex: "Indexul etichetelor",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 articol cu această etichetă." : `${count} articole cu această etichetă.`,
      showingFirst: ({ count }: { count: number }) => `Se afișează primele ${count} etichete.`,
      totalTags: ({ count }: { count: number }) => `Au fost găsite ${count} etichete în total.`,
    },
  },
  components: {},
};
