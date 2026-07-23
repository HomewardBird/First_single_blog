import { QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzTransformerPlugin } from '@quartz-community/types';
import { KatexOptions } from 'katex';

interface MathjaxTexOptions {
    macros?: Record<string, string | unknown[]>;
    [key: string]: unknown;
}
interface MathjaxOptions {
    tex?: MathjaxTexOptions;
    [key: string]: unknown;
}
interface TypstOptions {
    [key: string]: unknown;
}
type Args = boolean | number | string | null;
interface MacroType {
    [key: string]: string | Args[];
}
interface LatexOptions {
    renderEngine: "katex" | "mathjax" | "typst";
    customMacros: MacroType;
    katexOptions: Omit<KatexOptions, "macros" | "output">;
    mathJaxOptions: Omit<MathjaxOptions, "macros">;
    typstOptions: TypstOptions;
}
declare const Latex: QuartzTransformerPlugin<Partial<LatexOptions>>;

export { type Args, Latex, type LatexOptions };
