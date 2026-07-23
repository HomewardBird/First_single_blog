import { describe, it, expect } from "vitest";
import { concatenateResources } from "../src/util/resources";
import { classNames } from "../src/util/lang";

describe("TableOfContents Plugin", () => {
  describe("concatenateResources", () => {
    it("should concatenate string resources", () => {
      const result = concatenateResources("a", "b", "c");
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should handle undefined values", () => {
      const result = concatenateResources("a", undefined, "b");
      expect(result).toEqual(["a", "b"]);
    });

    it("should flatten arrays", () => {
      const result = concatenateResources(["a", "b"], "c");
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should return undefined for all undefined", () => {
      const result = concatenateResources(undefined, undefined);
      expect(result).toEqual([]);
    });
  });

  describe("classNames", () => {
    it("should join class names", () => {
      const result = classNames("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle display class", () => {
      const result = classNames("mobile-only", "class1");
      expect(result).toBe("mobile-only class1");
    });

    it("should filter falsy values", () => {
      const result = classNames("class1", undefined, "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle empty input", () => {
      const result = classNames();
      expect(result).toBe("");
    });
  });
});
