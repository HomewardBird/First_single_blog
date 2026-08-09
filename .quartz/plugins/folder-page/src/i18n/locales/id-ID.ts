export default {
  pages: {
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1 ? "1 item di bawah folder ini." : `${count} item di bawah folder ini.`,
    },
  },
  components: {},
};
