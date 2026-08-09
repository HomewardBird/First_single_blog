# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Listen for `content-index-updated` `CustomEvent` dispatches and incrementally add the new entries to the FlexSearch index. This enables runtime extension of the search index by other plugins — in particular `@quartz-community/encrypted-pages`, which patches the in-memory content index with newly-decrypted unlisted pages and dispatches this event so the user can find and open those pages via search within the same browser session.

- Initial Quartz community plugin template.
