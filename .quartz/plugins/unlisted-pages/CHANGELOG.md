# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release.
- `UnlistedPages` transformer: zero-config rehype plugin that copies `file.data.frontmatter.unlisted` to `file.data.unlisted` when it is a boolean. Enables the `file.data.unlisted` convention respected by `content-index`, `search`, `backlinks`, `recent-notes`, `folder-page`, and `tag-page` to work for any page, not only encrypted ones.
