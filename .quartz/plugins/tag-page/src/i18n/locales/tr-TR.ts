export default {
  pages: {
    tagContent: {
      tag: "Etiket",
      tagIndex: "Etiket Sırası",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "Bu etikete sahip 1 öğe." : `Bu etiket altındaki ${count} öğe.`,
      showingFirst: ({ count }: { count: number }) => `İlk ${count} etiket gösteriliyor.`,
      totalTags: ({ count }: { count: number }) => `Toplam ${count} adet etiket bulundu.`,
    },
  },
  components: {},
};
