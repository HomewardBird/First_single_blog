# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial Quartz community plugin template.

### Fixed

- Frontmatter wikilinks containing spaces are now correctly slugified instead of rendering with `%20` in the href. `[[My Note]]` in a frontmatter property now renders as `./my-note` instead of `./My%20Note`.

### Changed

- **BREAKING (inherited from `@quartz-community/utils`)**: tag URLs and frontmatter-wikilink slugs are now lowercased to match Obsidian's case-insensitive matching. Tags `#MyTag`, `#mytag`, and `#MYTAG` collapse into a single tag page `tags/mytag`.
- Replaced the plugin's local slugification helpers with the shared `@quartz-community/utils` versions to eliminate drift across the Quartz ecosystem.
