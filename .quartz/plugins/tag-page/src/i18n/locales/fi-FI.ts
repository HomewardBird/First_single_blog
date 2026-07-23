export default {
  pages: {
    tagContent: {
      tag: "Tunniste",
      tagIndex: "Tunnisteluettelo",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 kohde tällä tunnisteella." : `${count} kohdetta tällä tunnisteella.`,
      showingFirst: ({ count }: { count: number }) => `Näytetään ensimmäiset ${count} tunnistetta.`,
      totalTags: ({ count }: { count: number }) => `Löytyi yhteensä ${count} tunnistetta.`,
    },
  },
  components: {},
};
