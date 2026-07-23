export default {
  pages: {
    tagContent: {
      tag: "Tag",
      tagIndex: "Sumário de Tags",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 item com esta tag." : `${count} items com esta tag.`,
      showingFirst: ({ count }: { count: number }) => `Mostrando as ${count} primeiras tags.`,
      totalTags: ({ count }: { count: number }) => `Encontradas ${count} tags.`,
    },
  },
  components: {},
};
