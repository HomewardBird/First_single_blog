export default {
  pages: {
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag-Übersicht",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "1 Datei mit diesem Tag." : `${count} Dateien mit diesem Tag.`,
      showingFirst: ({ count }: { count: number }) => `Die ersten ${count} Tags werden angezeigt.`,
      totalTags: ({ count }: { count: number }) => `${count} Tags insgesamt.`,
    },
  },
  components: {},
};
