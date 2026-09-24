export default {
  pages: {
    folderContent: {
      folder: "Aplankas",
      previousPage: "Ankstesnis",
      nextPage: "Kitas",
      itemsUnderFolder: ({ count }: { count: number }) =>
        count === 1
          ? "1 elementas šiame aplanke."
          : count < 10
            ? `${count} elementai šiame aplanke.`
            : `${count} elementų šiame aplanke.`,
    },
  },
  components: {},
};
