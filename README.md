# gitload 🦦

A beautiful CLI to download files, folders, or entire repositories from GitHub URLs.

## Installation

```bash
npm install -g gitload
```

Or run directly with npx:

```bash
npx gitload <github-url>
```

## Usage

```
gitload <url> [options]

Arguments:
  url                    GitHub URL (repo root, folder, or file)

Options:
  -z, --zip <path>       Save as ZIP file at the specified path
  -o, --output <dir>     Output directory (default: current directory)
  -t, --token <token>    GitHub personal access token (for private repos)
  --gh                   Use token from gh CLI (requires gh auth login)
  --no-color             Disable colored output
  -V, --version          Output version number
  -h, --help             Display help
```

## Examples

### Download an entire repository

```bash
gitload https://github.com/user/repo
```

### Download a specific folder

```bash
gitload https://github.com/user/repo/tree/main/src
```

### Download a single file

```bash
gitload https://github.com/user/repo/blob/main/README.md
```

### Download as a ZIP file

```bash
gitload https://github.com/user/repo -z ./repo.zip
```

### Download to a specific directory

```bash
gitload https://github.com/user/repo -o ./my-project
```

### Download a private repository

```bash
# Using gh CLI (if you have gh installed and logged in)
gitload https://github.com/user/private-repo --gh

# Using the --token flag
gitload https://github.com/user/private-repo --token ghp_xxxx

# Or using the GITHUB_TOKEN environment variable
export GITHUB_TOKEN=ghp_xxxx
gitload https://github.com/user/private-repo
```

## Authentication

Token priority (highest to lowest):
1. `--token` flag
2. `GITHUB_TOKEN` environment variable  
3. `--gh` flag (uses `gh auth token`)

## Features

- 📁 Download entire repositories, folders, or single files
- 🗜️ Create ZIP archives with the `--zip` option
- 🎨 Beautiful progress display with colors and progress bars
- 🔐 Support for private repositories via GitHub tokens
- ⚡ Efficient file discovery using GitHub's Git Trees API

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token (alternative to `--token`) |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime error (network, file system, etc.) |
| 2 | Invalid usage (bad URL, missing arguments) |

## License

MIT
