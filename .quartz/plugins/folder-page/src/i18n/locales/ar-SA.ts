export default {
  pages: {
    folderContent: {
      folder: "مجلد",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "يوجد عنصر واحد فقط تحت هذا المجلد" : `يوجد ${count} عناصر تحت هذا المجلد.`,
    },
  },
  components: {},
};
