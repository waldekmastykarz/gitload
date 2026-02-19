---
name: bump-version
description: This skill should be used when the user asks to "bump the version", "release a new version", "prepare a release", "update the version number", "version bump", or needs to determine and apply a semver version increment based on recent commits.
---

# Bump Version

Analyze commits since the last release tag and determine the appropriate semver version bump, then apply it using `npm version`.

## Workflow

Follow these steps in order. Do not skip the confirmation step.

### Step 1: Identify the Latest Tag

Run `git tag --sort=-v:refname | head -1` to find the most recent version tag. Tags follow the `v*` pattern (e.g., `v1.0.3`).

### Step 2: List Commits Since the Last Tag

Run `git log <latest-tag>..HEAD --oneline` to retrieve all unreleased commits. If there are no commits since the last tag, inform the user and stop.

### Step 3: Determine the Version Bump Type

Analyze each commit message to classify the version bump:

- **major** — Any commit indicates a breaking change. Look for:
  - `BREAKING CHANGE` or `BREAKING:` in the message
  - `!` after the type (e.g., `feat!:`, `fix!:`)
- **minor** — Any commit adds new functionality. Look for:
  - `feat:` or `feat(scope):` prefix
  - Commits describing new commands, options, or capabilities
- **patch** — All other changes. Common indicators:
  - `fix:`, `deps:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `ci:` prefixes
  - Dependency bumps, bug fixes, maintenance tasks

Apply the highest applicable level: if any commit is major, bump major. If any commit is minor (and none are major), bump minor. Otherwise, bump patch.

### Step 4: Confirm with the User

**STOP — Do not proceed without user confirmation.**

Present the analysis to the user:
1. List the commits since the last tag
2. State the recommended bump type and the reasoning
3. Show what the new version number will be (current → new)
4. Ask the user to confirm or choose a different bump type

### Step 5: Apply the Version Bump

After user confirmation, run:

```bash
npm version <patch|minor|major>
```

This command updates `package.json`, creates a git commit, and creates a git tag in one step.

### Step 6: Remind About Publishing

After bumping, remind the user to push the commit and tag to trigger the publish workflow:

```bash
git push && git push --tags
```

The GitHub Actions workflow automatically publishes to npm when a `v*` tag is pushed.
