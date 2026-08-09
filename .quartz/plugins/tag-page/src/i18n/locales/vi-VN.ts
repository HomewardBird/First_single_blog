export default {
  pages: {
    tagContent: {
      tag: "Thẻ",
      tagIndex: "Danh sách thẻ",
      itemsUnderTag: ({ count }: { count: number }) => `Có ${count} trang gắn thẻ này.`,
      showingFirst: ({ count }: { count: number }) => `Đang hiển thị ${count} trang đầu tiên.`,
      totalTags: ({ count }: { count: number }) => `Có tổng cộng ${count} thẻ.`,
    },
  },
  components: {},
};
