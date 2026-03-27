# gitload 🦦

A beautiful CLI to download files, folders, or entire repositories from GitHub URLs.

## Use with AI agents

Give your AI coding agent the gitload skill so it can download files from GitHub on your behalf:

```sh
npx skills add waldekmastykarz/gitload
```

Once installed, ask your agent to _"download files from GitHub"_, _"fetch a folder from a repo"_, or _"grab code from GitHub"_ and it will handle the rest.

## Installation

```bash
npm install -g gitload-cli
```

Or run directly with npx:

```bash
npx gitload-cli <github-url>
```

## Usage

```
gitload <url> [options]

Arguments:
  url                    GitHub URL (repo root, folder, or file)

Options:
  -z, --zip <path>       Save as ZIP file at the specified path
  -o, --output <dir>     Output directory (default: folder named after URL path)
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
# Creates ./repo/ folder
```

### Download a specific folder

```bash
gitload https://github.com/user/repo/tree/main/src
# Creates ./src/ folder
```

### Download a single file

```bash
gitload https://github.com/user/repo/blob/main/README.md
# Creates ./README.md
```

### Download as a ZIP file

```bash
gitload https://github.com/user/repo -z ./repo.zip
```

### Download to a custom directory

```bash
gitload https://github.com/user/repo/tree/main/src -o ./my-source
# Creates ./my-source/ folder
```

### Download contents flat to current directory

```bash
gitload https://github.com/user/repo/tree/main/src -o .
# Downloads directly to current folder
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
