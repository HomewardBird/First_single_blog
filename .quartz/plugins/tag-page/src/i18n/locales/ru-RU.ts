export default {
  pages: {
    tagContent: {
      tag: "Тег",
      tagIndex: "Индекс тегов",
      itemsUnderTag: ({ count }: { count: number }) =>
        `с этим тегом ${count} элемент${getForm(count, "", "а", "ов")}`,
      showingFirst: ({ count }: { count: number }) =>
        `Показыва${getForm(count, "ется", "ются", "ются")} ${count} тег${getForm(count, "", "а", "ов")}`,
      totalTags: ({ count }: { count: number }) =>
        `Всего ${count} тег${getForm(count, "", "а", "ов")}`,
    },
  },
  components: {},
};

function getForm(number: number, form1: string, form2: string, form5: string): string {
  const remainder100 = number % 100;
  const remainder10 = remainder100 % 10;

  if (remainder100 >= 10 && remainder100 <= 20) return form5;
  if (remainder10 > 1 && remainder10 < 5) return form2;
  if (remainder10 == 1) return form1;
  return form5;
}
