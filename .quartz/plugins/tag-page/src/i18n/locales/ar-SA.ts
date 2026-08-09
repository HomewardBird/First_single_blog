export default {
  pages: {
    tagContent: {
      tag: "الوسم",
      tagIndex: "مؤشر الوسم",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "يوجد عنصر واحد فقط تحت هذا الوسم" : `يوجد ${count} عناصر تحت هذا الوسم.`,
      showingFirst: ({ count }: { count: number }) => `إظهار أول ${count} أوسمة.`,
      totalTags: ({ count }: { count: number }) => `يوجد ${count} أوسمة.`,
    },
  },
  components: {},
};
