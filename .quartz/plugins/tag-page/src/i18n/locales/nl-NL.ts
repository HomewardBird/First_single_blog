export default {
  pages: {
    tagContent: {
      tag: "Label",
      tagIndex: "Label-index",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 item met dit label." : `${count} items met dit label.`,
      showingFirst: ({ count }: { count: number }) =>
        count === 1 ? "Eerste label tonen." : `Eerste ${count} labels tonen.`,
      totalTags: ({ count }: { count: number }) => `${count} labels gevonden.`,
    },
  },
  components: {},
};
