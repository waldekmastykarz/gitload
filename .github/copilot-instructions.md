# Copilot Instructions for gitload

A CLI tool to download files, folders, or entire repositories from GitHub URLs.

## Architecture

```
src/
├── index.js          # CLI entry point (commander setup, orchestration)
├── github-parser.js  # URL parsing & API URL construction (pure functions)
├── github-client.js  # GitHub API interactions (GitHubClient class)
└── downloader.js     # File/ZIP download with progress UI
```

**Data flow:** `index.js` parses URL → `GitHubClient` discovers files via Trees API → `downloader` fetches & writes files

## Key Patterns

### ES Modules
Project uses native ES modules (`"type": "module"` in package.json). Use `import/export` syntax exclusively:
```javascript
import { parseGitHubUrl } from './github-parser.js';
export function myFunction() { ... }
```

### URL Parsing (`github-parser.js`)
The `parseGitHubUrl()` function returns a `ParsedGitHubUrl` object with `owner`, `repo`, `ref`, `path`, and `type` ('tree'|'blob'|'root'). All other modules consume this structure.

### GitHub API Strategy
- Uses Git Trees API (`/git/trees/{ref}?recursive=1`) for efficient bulk file discovery
- Falls back to Contents API only for single blob paths
- Authentication: `--token` flag > `GITHUB_TOKEN` env > `--gh` flag (via `gh auth token`)

### Progress Display
Uses `ora` for spinners and custom ANSI progress bars in `downloader.js`. Progress updates use inline cursor manipulation (`\r\x1b[K`) for smooth terminal output.

### Error Handling
- Exit code `1` for runtime errors (network, filesystem)
- Exit code `2` for invalid usage (bad URL, missing arguments)
- Errors are collected and summarized after downloads complete (doesn't fail on first error)

## Development

```bash
# Run locally
node src/index.js <github-url>

# Test with various URL patterns
node src/index.js https://github.com/user/repo                    # Root
node src/index.js https://github.com/user/repo/tree/main/src      # Folder
node src/index.js https://github.com/user/repo/blob/main/file.js  # Single file
```

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
```

Tests are in `src/index.test.js` and cover:
- Single file downloads (to current dir, to custom dir, with custom filename)
- Folder downloads (default naming, custom output dir)

Always run tests after making changes to verify nothing broke.

### Bug fix workflow

When a bug is reported:
1. **First**, write a failing test that reproduces the bug
2. Run the test to confirm it fails
3. Fix the bug
4. Run the test to confirm it passes
5. Run all tests to ensure no regressions

## Dependencies

- `commander` - CLI argument parsing
- `chalk` - Terminal colors (supports `--no-color`)
- `ora` - Loading spinners
- `archiver` - ZIP creation
- `vitest` - Testing (dev dependency)

## Conventions

- JSDoc typedefs for complex objects (see `ParsedGitHubUrl`, `GitHubFile`)
- Functions are small and single-purpose
- Console output uses the 🦦 otter emoji as the tool mascot
- Requires Node.js ≥20 (uses native `fetch`)

## Releasing

Use `npm version` to bump version, commit, and create a git tag in one step:

```bash
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features, backward compatible)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
```

Then push the commit and tag to trigger the publish workflow:

```bash
git push && git push --tags
```

The GitHub Actions workflow (`.github/workflows/publish.yml`) automatically publishes to npm when a `v*` tag is pushed.
