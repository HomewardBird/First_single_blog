# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Respect the `file.data.unlisted` convention in tag discovery (virtual tag page generation) and tag listings (`TagContent.tsx`). Unlisted pages are never used to discover tags and never appear in any tag listing. A tag that exists only on unlisted pages will not cause a tag page to be generated.
- Unit tests for tag discovery covering the unlisted-filter behavior.

- Initial Quartz community plugin template.
