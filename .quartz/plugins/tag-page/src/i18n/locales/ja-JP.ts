export default {
  pages: {
    tagContent: {
      tag: "タグ",
      tagIndex: "タグ一覧",
      itemsUnderTag: ({ count }: { count: number }) => `${count}件のページ`,
      showingFirst: ({ count }: { count: number }) => `のうち最初の${count}件を表示しています`,
      totalTags: ({ count }: { count: number }) => `全${count}個のタグを表示中`,
    },
  },
  components: {},
};
