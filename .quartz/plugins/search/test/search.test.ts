import { describe, it, expect } from "vitest";
import Search from "../src/components/Search";

describe("Search Component", () => {
  it("exports a component factory function", () => {
    expect(typeof Search).toBe("function");
  });

  it("creates a component with default options", () => {
    const SearchComponent = Search();
    expect(typeof SearchComponent).toBe("function");
  });

  it("creates a component with custom options", () => {
    const SearchComponent = Search({ enablePreview: false });
    expect(typeof SearchComponent).toBe("function");
  });

  it("attaches CSS and script to component", () => {
    const SearchComponent = Search();
    expect(SearchComponent.css).toBeDefined();
    expect(SearchComponent.afterDOMLoaded).toBeDefined();
  });
});
