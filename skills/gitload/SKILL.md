---
name: gitload
description: This skill should be used when the user asks to "download files from GitHub", "fetch a folder from a repo", "grab code from GitHub", "download a GitHub repository", "get files from a GitHub URL", "clone just a folder", or needs to download specific files/folders from GitHub without cloning the entire repo.
---

# gitload

Download files, folders, or entire repos from GitHub URLs using the gitload CLI.

## When to Use

Use gitload when:
- Downloading a specific folder from a repo (not the whole repo)
- Fetching a single file from GitHub
- Downloading repo contents without git history
- Creating a ZIP archive of GitHub content
- Accessing private repos with authentication

Do NOT use gitload when:
- Full git history is needed (use `git clone` instead)
- The repo is already cloned locally
- Working with non-GitHub repositories

## Prerequisites

Run gitload via npx (no install needed):
```bash
npx gitload-cli https://github.com/user/repo --agent
```

Or install globally:
```bash
npm install -g gitload-cli
```

## Agent Output

**Always pass `--agent`** when running gitload. It replaces the banner, spinners, progress bar, and colors with minimal plain text to save tokens:

```
$ gitload https://github.com/user/repo/tree/main/src --agent
found 12 files (48.3 KB)
downloaded 12 of 12 files to src
```

- `found N files (size)` — files discovered; download in progress
- `downloaded X of N files to <dir>` / `zipped X of N files to <zip>` — done
- `failed: <file>: <reason>` — a file that failed to download (up to 5 listed)
- `error: <message>` (stderr) — fatal error; exit code `1` (runtime) or `2` (invalid usage)

## Basic Usage

### Download entire repo
```bash
gitload https://github.com/user/repo --agent
```
Creates a `repo/` folder in the current directory.

### Download a specific folder
```bash
gitload https://github.com/user/repo/tree/main/src/components --agent
```
Creates a `components/` folder with just that folder's contents.

### Download a single file
```bash
gitload https://github.com/user/repo/blob/main/README.md --agent
```

### Download to a custom location
```bash
gitload https://github.com/user/repo/tree/main/src -o ./my-source --agent
```

### Download contents flat to current directory
```bash
gitload https://github.com/user/repo/tree/main/templates -o . --agent
```

### Download as ZIP
```bash
gitload https://github.com/user/repo -z ./repo.zip --agent
```

## Authentication (for private repos or rate limits)

### Using gh CLI (recommended)
```bash
gitload https://github.com/user/private-repo --gh --agent
```
Requires prior `gh auth login`.

### Using explicit token
```bash
gitload https://github.com/user/repo --token ghp_xxxx --agent
```

### Using environment variable
```bash
export GITHUB_TOKEN=ghp_xxxx
gitload https://github.com/user/repo --agent
```

**Token priority:** `--token` > `GITHUB_TOKEN` > `--gh`

## URL Formats

gitload accepts standard GitHub URLs:
- **Repo root:** `https://github.com/user/repo`
- **Folder:** `https://github.com/user/repo/tree/branch/path/to/folder`
- **File:** `https://github.com/user/repo/blob/branch/path/to/file.ext`

## Common Patterns

### Scaffold from a template folder
```bash
gitload https://github.com/org/templates/tree/main/react-starter -o ./my-app --agent
cd my-app && npm install
```

### Grab example code
```bash
gitload https://github.com/org/examples/tree/main/authentication --agent
```

### Download docs for offline reading
```bash
gitload https://github.com/org/project/tree/main/docs -z ./docs.zip --agent
```

### Fetch a single config file
```bash
gitload https://github.com/org/configs/blob/main/.eslintrc.json -o . --agent
```

## Options Reference

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Output directory (default: folder named after URL path) |
| `-z, --zip <path>` | Save as ZIP file at the specified path |
| `-t, --token <token>` | GitHub personal access token |
| `--gh` | Use token from gh CLI |
| `--no-color` | Disable colored output |
| `--agent` | Agent-optimized output: minimal plain text, no progress bar or colors |
| `-h, --help` | Display help |
| `-V, --version` | Output version |

## Error Handling

If gitload fails:
1. **404 errors:** Verify the URL exists and is accessible
2. **Rate limit errors:** Add authentication with `--gh` or `--token`
3. **Permission errors:** For private repos, ensure token has `repo` scope
4. **Network errors:** Check internet connectivity

## Notes

- gitload downloads content via GitHub's API, not git protocol
- No git history is preserved (use `git clone` if history is needed)
- Large repos may take time; consider downloading specific folders
- Output directory is created if it doesn't exist
