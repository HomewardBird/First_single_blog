# @quartz-community/fonts

Fine-grained font control for Quartz sites. Supports per-heading fonts, automatic theme font discovery via [QuartzTheme](https://github.com/saberzero1/quartz-themes), and Obsidian-compatible defaults.

## Installation

```bash
npx quartz plugin add github:quartz-community/fonts
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/fonts
    enabled: true
```

With custom fonts:

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/fonts
    enabled: true
    options:
      body: '"Inter", sans-serif'
      header: '"Playfair Display", serif'
      code: '"JetBrains Mono", monospace'
```

## Configuration

Font options accept either a CSS font-family string or an object with Google Fonts loading control:

```yaml
# String form
body: '"Inter", sans-serif'

# Object form (for Google Fonts weight/italic control)
body:
  name: Inter
  weights: [400, 600, 700]
  includeItalic: true
```

| Option          | Type                | Default          | Description                                                               |
| --------------- | ------------------- | ---------------- | ------------------------------------------------------------------------- |
| `title`         | `FontSpecification` | `header` value   | Font family for the site title.                                           |
| `body`          | `FontSpecification` | Obsidian default | Font family for body text.                                                |
| `header`        | `FontSpecification` | Obsidian default | Default font family for all headings (h1-h6).                             |
| `code`          | `FontSpecification` | Obsidian default | Font family for code and monospace elements.                              |
| `interface`     | `FontSpecification` | Obsidian default | Font family for UI elements.                                              |
| `h1`            | `FontSpecification` | `header` value   | Font family for h1 headings.                                              |
| `h2`            | `FontSpecification` | `header` value   | Font family for h2 headings.                                              |
| `h3`            | `FontSpecification` | `header` value   | Font family for h3 headings.                                              |
| `h4`            | `FontSpecification` | `header` value   | Font family for h4 headings.                                              |
| `h5`            | `FontSpecification` | `header` value   | Font family for h5 headings.                                              |
| `h6`            | `FontSpecification` | `header` value   | Font family for h6 headings.                                              |
| `useThemeFonts` | `boolean`           | `true`           | Use fonts from QuartzTheme as defaults when it is installed.              |
| `fontOrigin`    | `string`            | `"local"`        | `"googleFonts"` to auto-load from Google Fonts, `"local"` for no loading. |

### Default options

```yaml title="quartz.config.yaml"
- source: github:quartz-community/fonts
  enabled: true
  options:
    useThemeFonts: true
    fontOrigin: local
```

## How it works

Fonts resolves fonts using a priority chain:

```
User config (plugin options)
  -> Theme fonts (from QuartzTheme, if installed)
    -> Obsidian defaults (system font stacks)
```

For individual headings, the resolution is:

```
h1 option -> header option -> theme --h1-font -> theme font -> Obsidian default
```

For the site title:

```
title option -> header option -> theme font -> Obsidian default
```

### With QuartzTheme

When [QuartzTheme](https://github.com/saberzero1/quartz-themes) is installed and runs before Fonts, theme fonts are automatically discovered and used as defaults. Any options you set in Fonts will override the theme fonts.

Fonts must run after QuartzTheme. This is handled automatically by `defaultOrder` (QuartzTheme = 50, Fonts = 60).

### Without QuartzTheme

Fonts works standalone. Without a theme, it falls back to Obsidian's default system font stacks.

## Examples

```yaml title="quartz.config.yaml"
# Use theme fonts automatically (default behavior)
- source: github:quartz-community/fonts
  enabled: true

# Override just the heading font
- source: github:quartz-community/fonts
  enabled: true
  options:
    header: '"Playfair Display", serif'

# Full control with per-heading fonts
- source: github:quartz-community/fonts
  enabled: true
  options:
    body: '"Inter", sans-serif'
    header: '"Playfair Display", serif'
    code: '"JetBrains Mono", monospace'
    h1: '"Playfair Display", serif'
    h2: '"Lora", serif'

# Load from Google Fonts automatically
- source: github:quartz-community/fonts
  enabled: true
  options:
    fontOrigin: googleFonts
    body: Inter
    header: Playfair Display
    code: JetBrains Mono

# Google Fonts with weight/italic control
- source: github:quartz-community/fonts
  enabled: true
  options:
    fontOrigin: googleFonts
    body:
      name: Inter
      weights: [400, 600, 700]
      includeItalic: true
    header:
      name: Playfair Display
      weights: [400, 700]
    code:
      name: JetBrains Mono
      weights: [400]

# Custom title font (separate from header)
- source: github:quartz-community/fonts
  enabled: true
  options:
    fontOrigin: googleFonts
    title: Abril Fatface
    header: Playfair Display
    body: Inter
    code: JetBrains Mono

# Ignore theme fonts entirely
- source: github:quartz-community/fonts
  enabled: true
  options:
    useThemeFonts: false
    body: '"Inter", sans-serif'
```

## Google Fonts Validation

When `fontOrigin: googleFonts` is set and the optional [`google-font-metadata`](https://www.npmjs.com/package/google-font-metadata) package is installed, Fonts validates your font configuration at build time:

- Checks that font family names exist in Google Fonts.
- Warns if requested weights are not available for a font.
- Warns if italic is requested but the font doesn't support it.

Install it to enable validation:

```bash
npm install google-font-metadata
```

Validation warnings are logged to the console but do not block the build.

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/Fonts) for more information.

## License

MIT
