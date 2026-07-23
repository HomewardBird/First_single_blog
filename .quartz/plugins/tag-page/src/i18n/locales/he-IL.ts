export default {
  pages: {
    tagContent: {
      tag: "תגית",
      tagIndex: "מפתח התגיות",
      itemsUnderTag: ({ count }: { count: number }) =>
        count === 1 ? "פריט אחד עם תגית זו." : `${count} פריטים עם תגית זו.`,
      showingFirst: ({ count }: { count: number }) => `מראה את ה-${count} תגיות הראשונות.`,
      totalTags: ({ count }: { count: number }) => `${count} תגיות נמצאו סך הכל.`,
    },
  },
  components: {},
};
