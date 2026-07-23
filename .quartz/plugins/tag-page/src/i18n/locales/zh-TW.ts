export default {
  pages: {
    tagContent: {
      tag: "標籤",
      tagIndex: "標籤索引",
      itemsUnderTag: ({ count }: { count: number }) => `此標籤下有 ${count} 條筆記。`,
      showingFirst: ({ count }: { count: number }) => `顯示前 ${count} 個標籤。`,
      totalTags: ({ count }: { count: number }) => `總共有 ${count} 個標籤。`,
    },
  },
  components: {},
};
