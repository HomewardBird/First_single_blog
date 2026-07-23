# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Respect the `file.data.unlisted` convention in both folder discovery (virtual page generation) and folder listings (the page-list inside a folder index). Unlisted pages are never shown in folder listings and never contribute folder/subfolder entries.
- Exported `pagesFromAllFiles` helper for reuse and testing.
- Unit tests for `pagesFromAllFiles` covering the unlisted-filter behavior.

- Initial Quartz community plugin template.
