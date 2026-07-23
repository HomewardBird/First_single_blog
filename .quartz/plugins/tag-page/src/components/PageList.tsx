import type { QuartzComponent, QuartzComponentProps, SortFn } from "@quartz-community/types";
import { getDate, byDateAndAlphabetical } from "@quartz-community/utils/sort";
import { resolveRelative, isFolderPath } from "../util/path";
import type { FullSlug } from "../util/path";

export type { SortFn } from "@quartz-community/types";
export { byDateAndAlphabetical };

export function byDateAndAlphabeticalFolderFirst(_cfg: unknown): SortFn {
  return (f1, f2) => {
    const f1IsFolder = isFolderPath(f1.slug ?? "");
    const f2IsFolder = isFolderPath(f2.slug ?? "");
    if (f1IsFolder && !f2IsFolder) return -1;
    if (!f1IsFolder && f2IsFolder) return 1;

    if (f1.dates && f2.dates) {
      return (getDate(f2)?.getTime() ?? 0) - (getDate(f1)?.getTime() ?? 0);
    } else if (f1.dates && !f2.dates) {
      return -1;
    } else if (!f1.dates && f2.dates) {
      return 1;
    }
    const f1Title = f1.frontmatter?.title?.toLowerCase() ?? "";
    const f2Title = f2.frontmatter?.title?.toLowerCase() ?? "";
    return f1Title.localeCompare(f2Title);
  };
}

type DateComponentProps = {
  date: Date;
  locale: string;
};

function DateDisplay({ date, locale }: DateComponentProps) {
  return (
    <time dateTime={date.toISOString()}>
      {date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })}
    </time>
  );
}

type PageListProps = {
  limit?: number;
  sort?: SortFn;
} & QuartzComponentProps;

export const PageList: QuartzComponent = ({
  cfg,
  fileData,
  allFiles,
  limit,
  sort,
}: PageListProps) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg);
  let list = [...allFiles].sort(sorter);
  if (limit) {
    list = list.slice(0, limit);
  }

  const fileSlug = (fileData as { slug?: string } | undefined)?.slug as FullSlug | undefined;

  return (
    <ul class="section-ul">
      {list.map((page) => {
        const title = page.frontmatter?.title;
        const tags = (page.frontmatter?.tags ?? []) as string[];

        return (
          <li class="section-li">
            <div class="section">
              <p class="meta">
                {page.dates && getDate(page) && (
                  <DateDisplay
                    date={getDate(page)!}
                    locale={(cfg as { locale?: string } | undefined)?.locale ?? "en-US"}
                  />
                )}
              </p>
              <div class="desc">
                <h3>
                  <a
                    href={resolveRelative(fileSlug ?? ("" as FullSlug), page.slug as FullSlug)}
                    class="internal"
                  >
                    {title}
                  </a>
                </h3>
              </div>
              <ul class="tags">
                {tags.map((tag) => (
                  <li>
                    <a
                      class="internal tag-link"
                      href={resolveRelative(
                        fileSlug ?? ("" as FullSlug),
                        `tags/${tag}` as unknown as FullSlug,
                      )}
                    >
                      {tag}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

PageList.css = `
.section h3 {
  margin: 0;
}

.section > .tags {
  margin: 0;
}
`;
