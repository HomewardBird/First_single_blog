import { joinSegments } from "@quartz-community/utils";

interface FileTrieData {
  slug: string;
  title: string;
  filePath: string;
}

export class FileTrieNode<T extends FileTrieData = FileTrieData> {
  isFolder: boolean;
  children: Array<FileTrieNode<T>>;

  private slugSegments: string[];
  private fileSegmentHint?: string;
  private displayNameOverride?: string;
  data: T | null;

  constructor(segments: string[], data?: T) {
    this.children = [];
    this.slugSegments = segments;
    this.data = data ?? null;
    this.isFolder = false;
    this.displayNameOverride = undefined;
  }

  get displayName(): string {
    const nonIndexTitle = this.data?.title === "index" ? undefined : this.data?.title;
    return (
      this.displayNameOverride ?? nonIndexTitle ?? this.fileSegmentHint ?? this.slugSegment ?? ""
    );
  }

  set displayName(name: string) {
    this.displayNameOverride = name;
  }

  get slug(): string {
    const path = joinSegments(...this.slugSegments);
    if (this.isFolder) {
      return joinSegments(path, "index");
    }

    return path;
  }

  get slugSegment(): string {
    return this.slugSegments[this.slugSegments.length - 1] ?? "";
  }

  private makeChild(path: string[], file?: T): FileTrieNode<T> {
    const nextSegment = path[0];
    if (!nextSegment) {
      throw new Error("path is empty");
    }
    const fullPath = [...this.slugSegments, nextSegment];
    const child = new FileTrieNode<T>(fullPath, file);
    this.children.push(child);
    return child;
  }

  private insert(path: string[], file: T): void {
    if (path.length === 0) {
      throw new Error("path is empty");
    }

    this.isFolder = true;
    const segment = path[0];
    if (!segment) {
      throw new Error("path is empty");
    }
    if (path.length === 1) {
      if (segment === "index") {
        this.data ??= file;
      } else {
        this.makeChild(path, file);
      }
    } else if (path.length > 1) {
      const child =
        this.children.find((c) => c.slugSegment === segment) ?? this.makeChild(path, undefined);

      const fileParts = file.filePath.split("/");
      const hint = fileParts.at(-path.length);
      if (hint) {
        child.fileSegmentHint = hint;
      }
      child.insert(path.slice(1), file);
    }
  }

  add(file: T): void {
    this.insert(file.slug.split("/"), file);
  }

  findNode(path: string[]): FileTrieNode<T> | undefined {
    if (path.length === 0 || (path.length === 1 && path[0] === "index")) {
      return this;
    }

    return this.children.find((c) => c.slugSegment === path[0])?.findNode(path.slice(1));
  }

  ancestryChain(path: string[]): Array<FileTrieNode<T>> | undefined {
    if (path.length === 0 || (path.length === 1 && path[0] === "index")) {
      return [this];
    }

    const child = this.children.find((c) => c.slugSegment === path[0]);
    if (!child) {
      return undefined;
    }

    const childPath = child.ancestryChain(path.slice(1));
    if (!childPath) {
      return undefined;
    }

    return [this, ...childPath];
  }

  filter(filterFn: (node: FileTrieNode<T>) => boolean): void {
    this.children = this.children.filter(filterFn);
    this.children.forEach((child) => child.filter(filterFn));
  }

  map(mapFn: (node: FileTrieNode<T>) => void): void {
    mapFn(this);
    this.children.forEach((child) => child.map(mapFn));
  }

  sort(sortFn: (a: FileTrieNode<T>, b: FileTrieNode<T>) => number): void {
    this.children = this.children.sort(sortFn);
    this.children.forEach((e) => e.sort(sortFn));
  }
}

export function trieFromAllFiles(
  allFiles: Array<{
    slug?: string;
    filePath?: string;
    frontmatter?: { title?: string; [key: string]: unknown };
  }>,
): FileTrieNode {
  const trie = new FileTrieNode([]);
  allFiles.forEach((file) => {
    if (file.frontmatter) {
      trie.add({
        slug: file.slug!,
        title: file.frontmatter.title ?? "",
        filePath: file.filePath!,
      });
    }
  });

  return trie;
}
