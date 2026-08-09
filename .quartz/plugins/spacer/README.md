# @quartz-community/spacer

A component plugin that renders a flexible spacer element that pushes adjacent components apart within a layout group. It uses CSS `flex: 2 1 auto` to fill available space, making it useful for spacing out items in toolbars or sidebars (for example, separating the search bar from the darkmode toggle in the left sidebar toolbar).

## Installation

```bash
npx quartz plugin add github:quartz-community/spacer
```

## Usage

```yaml title="quartz.config.yaml"
plugins:
  - source: github:quartz-community/spacer
    enabled: true
    layout:
      position: left
      priority: 15
      display: all
```

## Configuration

This plugin has no configuration options.

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/Spacer) for more information.

## License

MIT
