export default {
  pages: {
    tagContent: {
      tag: "برچسب",
      tagIndex: "فهرست برچسب‌ها",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "یک مطلب با این برچسب" : `${count} مطلب با این برچسب.`,
      showingFirst: ({ count }: { count: number }) => `در حال نمایش ${count} برچسب.`,
      totalTags: ({ count }: { count: number }) => `${count} برچسب یافت شد.`,
    },
  },
  components: {},
};
