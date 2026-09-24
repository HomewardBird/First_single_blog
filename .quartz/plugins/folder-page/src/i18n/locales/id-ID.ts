export default {
  pages: {
    folderContent: {
      folder: "Folder",
      previousPage: "Sebelumnya",
      nextPage: "Berikutnya",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 item di bawah folder ini." : `${count} item di bawah folder ini.`,
    },
  },
  components: {},
};
