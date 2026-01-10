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

## Dependencies

- `commander` - CLI argument parsing
- `chalk` - Terminal colors (supports `--no-color`)
- `ora` - Loading spinners
- `archiver` - ZIP creation

## Conventions

- JSDoc typedefs for complex objects (see `ParsedGitHubUrl`, `GitHubFile`)
- Functions are small and single-purpose
- Console output uses the 🦦 otter emoji as the tool mascot
- Requires Node.js ≥18 (uses native `fetch`)
