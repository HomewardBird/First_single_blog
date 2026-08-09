export default {
  pages: {
    tagContent: {
      tag: "Címke",
      tagIndex: "Címke index",
      itemsUnderTag: ({ count }: { count: number }) => `${count} elem található ezzel a címkével.`,
      showingFirst: ({ count }: { count: number }) => `Első ${count} címke megjelenítve.`,
      totalTags: ({ count }: { count: number }) => `Összesen ${count} címke található.`,
    },
  },
  components: {},
};
