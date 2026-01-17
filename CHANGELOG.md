# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-16

### Changed

- Updated codebase to ES6 syntax for improved readability and maintainability
- First arrival for each unique stop ID now displays with "bright bold" styling for better visual distinction

## [1.0.0] - 2026-01-09
### Added
- Initial release of MMM-MTA-NextSubway
- Real-time NYC subway arrivals using MTA GTFS-Realtime feeds
- Automatic feed detection based on route IDs (just specify "N", "Q", "R", etc.)
- Support for all NYC subway lines (A, C, E, B, D, F, M, G, J, Z, L, N, Q, R, W, 1-7, S, SIR)
- Human-readable station names (e.g., "Times Sq-42 St" instead of cryptic stop IDs)
- Stop ID validation against official MTA stops database (1,488+ stops)
- Flexible filtering by route IDs and stop IDs
- Support for single values or arrays for routes and stops
- Multiple feed URL support for cross-line tracking
- Configurable update intervals and maximum entries
- Integration with MagicMirror² time format settings
- Complete stops database with validation and warnings for invalid stop IDs
- Automatic retry logic with configurable delays
- CSS styling support for customization
