export default {
  pages: {
    tagContent: {
      tag: "แท็ก",
      tagIndex: "แท็กทั้งหมด",
      itemsUnderTag: ({ count }: { count: number }) => `มี ${count} รายการในแท็กนี้`,
      showingFirst: ({ count }: { count: number }) => `แสดง ${count} แท็กแรก`,
      totalTags: ({ count }: { count: number }) => `มีทั้งหมด ${count} แท็ก`,
    },
  },
  components: {},
};
