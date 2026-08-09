export interface ColorScheme {
  light: string;
  lightgray: string;
  gray: string;
  darkgray: string;
  dark: string;
  secondary: string;
  tertiary: string;
  highlight: string;
  textHighlight: string;
}

interface Colors {
  lightMode: ColorScheme;
  darkMode: ColorScheme;
}

export type FontSpecification =
  | string
  | {
      name: string;
      weights?: number[];
      includeItalic?: boolean;
    };

export interface Theme {
  typography: {
    title?: FontSpecification;
    header: FontSpecification;
    body: FontSpecification;
    code: FontSpecification;
  };
  cdnCaching: boolean;
  colors: Colors;
  fontOrigin: "googleFonts" | "local";
}

export type ThemeKey = keyof Colors;

export function getFontSpecificationName(spec: FontSpecification): string {
  if (typeof spec === "string") {
    return spec;
  }
  return spec.name;
}
