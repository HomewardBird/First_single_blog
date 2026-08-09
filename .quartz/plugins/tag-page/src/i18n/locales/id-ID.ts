export default {
  pages: {
    tagContent: {
      tag: "Tag",
      tagIndex: "Indeks Tag",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 item dengan tag ini." : `${count} item dengan tag ini.`,
      showingFirst: ({ count }: { count: number }) => `Menampilkan ${count} tag pertama.`,
      totalTags: ({ count }: { count: number }) => `Ditemukan total ${count} tag.`,
    },
  },
  components: {},
};
