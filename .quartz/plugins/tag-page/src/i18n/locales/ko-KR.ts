export default {
  pages: {
    tagContent: {
      tag: "태그",
      tagIndex: "태그 목록",
      itemsUnderTag: ({ count }: { count: number }) => `${count}건의 항목`,
      showingFirst: ({ count }: { count: number }) => `처음 ${count}개의 태그`,
      totalTags: ({ count }: { count: number }) => `총 ${count}개의 태그를 찾았습니다.`,
    },
  },
  components: {},
};
