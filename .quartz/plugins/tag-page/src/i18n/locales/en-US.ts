export default {
  pages: {
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag Index",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 item with this tag." : `${count} items with this tag.`,
      showingFirst: ({ count }: { count: number }) => `Showing first ${count} tags.`,
      totalTags: ({ count }: { count: number }) => `Found ${count} total tags.`,
    },
  },
  components: {},
};
