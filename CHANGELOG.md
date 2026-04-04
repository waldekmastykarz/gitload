# Changelog

## [1.1.2](https://github.com/waldekmastykarz/gitload/compare/v1.0.3...v1.1.2) (2026-04-04)

### Bug Fixes

- Fix token passthrough to download functions for private repo support
- Suggest `--gh` flag in 404 error message for private repos

## [1.0.3](https://github.com/waldekmastykarz/gitload/compare/v1.0.2...v1.0.3) (2026-01-17)

### Maintenance

- Update minimum Node.js version requirement to ≥20
- Add Dependabot configuration for npm and GitHub Actions

## [1.0.2](https://github.com/waldekmastykarz/gitload/compare/v1.0.1...v1.0.2) (2026-01-10)

### Bug Fixes

- Fix `-o` flag to correctly distinguish between file and directory targets using trailing slash convention

## [1.0.1](https://github.com/waldekmastykarz/gitload/compare/e88a6b5...v1.0.1) (2026-01-10)

Initial release.

### Features

- Download entire repositories, folders, or single files from GitHub URLs
- Support for branch/tag/commit references
- Custom output directory with `-o` flag
- GitHub token authentication for private repositories (`--token`, `GITHUB_TOKEN`, `--gh`)
