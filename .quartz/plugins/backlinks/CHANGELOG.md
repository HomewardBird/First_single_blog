# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Respect the `file.data.unlisted` convention. Pages marked `unlisted` are never shown as backlink sources on other pages. The backlinks list on an unlisted page itself is still rendered normally so users who reached the page by direct URL can see its incoming references.
- Exported `selectBacklinkSources` helper and `BacklinkCandidate` type for testing and reuse.
- Unit tests for `selectBacklinkSources` covering the unlisted-filter behavior.

- Initial Quartz community plugin template.
