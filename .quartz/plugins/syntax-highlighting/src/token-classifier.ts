import type { CodeToHastOptions, ShikiTransformer, ThemedToken } from "shiki";

const SCOPE_TO_TOKEN: [prefix: string, tokenType: string][] = [
  // Invalid / error scopes
  ["invalid.broken", "error"],
  ["invalid.deprecated", "error"],
  ["invalid.illegal", "error"],
  ["invalid.unimplemented", "error"],
  ["invalid", "error"],
  ["message.error", "error"],

  // Comments
  ["comment", "comment"],
  ["punctuation.definition.comment", "comment"],
  ["string.comment", "comment"],

  // Strings & regexp
  ["string.regexp", "regexp"],
  ["constant.other.reference.link", "regexp"],
  ["string.other.link", "string"],
  ["string", "string"],
  ["punctuation.definition.string", "string"],

  // Keywords & control flow
  ["keyword.control", "keyword"],
  ["keyword.operator.new", "keyword"],
  ["keyword.operator.expression", "keyword"],
  ["keyword.operator", "operator"],
  ["keyword", "keyword"],

  // Storage (function, class, const, let, var, async, static)
  ["storage.modifier.import", "normal"],
  ["storage.modifier.package", "normal"],
  ["storage.modifier", "keyword"],
  ["storage.type", "keyword"],
  ["storage", "keyword"],

  // Constants & literal values
  ["constant.numeric", "value"],
  ["constant.language", "value"],
  ["constant.character.escape", "string"],
  ["constant", "value"],

  // Variables
  ["variable.parameter", "important"],
  ["variable.language", "value"],
  ["variable.other.constant", "value"],
  ["variable.other.enummember", "value"],
  ["variable.other.readwrite", "normal"],
  ["variable.other.property", "property"],
  ["variable.other.object", "normal"],
  ["variable.function", "function"],
  ["variable", "normal"],

  // Entity names
  ["entity.name.function", "function"],
  ["entity.name.constant", "value"],
  ["entity.name.type.class", "property"],
  ["entity.name.type.module", "property"],
  ["entity.name.type", "property"],
  ["entity.name.tag", "tag"],
  ["entity.name.section", "tag"],
  ["entity.name", "function"],
  ["entity.other.inherited-class", "property"],
  ["entity.other.attribute-name", "important"],

  // Support (library/framework builtins)
  ["support.function", "function"],
  ["support.class", "property"],
  ["support.type", "property"],
  ["support.constant", "value"],
  ["support.variable", "normal"],
  ["support", "function"],

  // Markup (markdown, diffs, etc.)
  ["markup.inserted", "string"],
  ["markup.deleted", "error"],
  ["markup.changed", "important"],
  ["markup.heading", "tag"],
  ["markup.bold", "normal"],
  ["markup.italic", "normal"],
  ["markup.inline.raw", "value"],
  ["markup.quote", "comment"],
  ["markup.ignored", "comment"],
  ["markup.untracked", "comment"],
  ["markup", "normal"],

  // Punctuation
  ["punctuation.definition.template-expression", "keyword"],
  ["punctuation.definition.inserted", "string"],
  ["punctuation.definition.deleted", "error"],
  ["punctuation.definition.changed", "important"],
  ["punctuation.definition.list.begin.markdown", "important"],
  ["punctuation.section", "punctuation"],
  ["punctuation.separator", "punctuation"],
  ["punctuation.accessor", "punctuation"],
  ["punctuation.terminator", "punctuation"],
  ["punctuation", "punctuation"],

  // Bracket highlighter (used by some themes)
  ["brackethighlighter.unmatched", "error"],
  ["brackethighlighter", "punctuation"],

  // Meta
  ["meta.property-name", "property"],
  ["meta.module-reference", "value"],
  ["meta.diff.header", "tag"],
  ["meta.diff.range", "function"],
  ["meta.separator", "comment"],
  ["meta.output", "value"],
  ["meta.function-call", "function"],
  ["meta.import", "keyword"],
  ["meta.export", "keyword"],

  // Source-level fallback for embedded code
  ["source.regexp", "regexp"],
];

function classifyScopes(scopes: string[]): string | undefined {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i]!;
    for (const [prefix, tokenType] of SCOPE_TO_TOKEN) {
      if (scope.startsWith(prefix)) {
        return tokenType;
      }
    }
  }
  return undefined;
}

function classifyToken(token: ThemedToken): string | undefined {
  if (!token.explanation) return undefined;
  for (const explanation of token.explanation) {
    const scopeNames = explanation.scopes.map((s) => s.scopeName);
    const result = classifyScopes(scopeNames);
    if (result) return result;
  }
  return undefined;
}

/**
 * Shiki transformer that adds `data-token-type` attributes to token spans
 * based on TextMate scope classification.
 *
 * Automatically enables `includeExplanation: "scopeName"` via the `preprocess`
 * hook so that scope data is available regardless of how the host plugin
 * (e.g. rehype-pretty-code) invokes shiki.
 *
 * This is purely additive — inline styles are preserved as-is. Downstream
 * consumers (e.g. Quartz Themes) can target `span[data-token-type="keyword"]`
 * to override colors with theme-specific values.
 */
export function tokenClassifierTransformer(): ShikiTransformer {
  return {
    name: "token-classifier",
    preprocess(_code, options) {
      // Inject includeExplanation at runtime so scope data is populated on
      // tokens, even when the calling plugin doesn't expose this option.
      (options as CodeToHastOptions).includeExplanation = "scopeName";
    },
    span(_hast, _line, _col, _lineElement, token) {
      const tokenType = classifyToken(token);
      if (tokenType) {
        _hast.properties = _hast.properties || {};
        _hast.properties["data-token-type"] = tokenType;
      }
    },
  };
}
