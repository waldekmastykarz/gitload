#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { parseGitHubUrl } from './github-parser.js';
import { GitHubClient } from './github-client.js';
import { downloadFiles, downloadToZip } from './downloader.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('gitload')
  .description('Download files, folders, or entire repos from GitHub URLs')
  .version(pkg.version)
  .argument('<url>', 'GitHub URL (repo root, folder, or file)')
  .option('-z, --zip <path>', 'Save as ZIP file at the specified path')
  .option('-o, --output <dir>', 'Output directory (default: current directory)', '.')
  .option('-t, --token <token>', 'GitHub personal access token (for private repos or higher rate limits)')
  .option('--gh', 'Use token from gh CLI (requires gh auth login)')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('# Download entire repo to current directory')}
  $ gitload https://github.com/user/repo

  ${chalk.dim('# Download a specific folder')}
  $ gitload https://github.com/user/repo/tree/main/src

  ${chalk.dim('# Download a single file')}
  $ gitload https://github.com/user/repo/blob/main/README.md

  ${chalk.dim('# Download as ZIP')}
  $ gitload https://github.com/user/repo -z ./repo.zip

  ${chalk.dim('# Download to specific directory')}
  $ gitload https://github.com/user/repo -o ./my-folder

${chalk.bold('Authentication:')}
  ${chalk.dim('# Use token from gh CLI')}
  $ gitload https://github.com/user/private-repo --gh

  ${chalk.dim('# Or explicitly pass a token')}
  $ gitload https://github.com/user/repo --token ghp_xxxx

${chalk.bold('Environment variables:')}
  GITHUB_TOKEN    GitHub personal access token (alternative to --token)

${chalk.bold('Token priority:')} --token > GITHUB_TOKEN > --gh
`);

/**
 * Try to get GitHub token from gh CLI
 * @returns {string|null}
 */
function getGhCliToken() {
  try {
    const token = execSync('gh auth token', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return token || null;
  } catch {
    return null;
  }
}

async function main() {
  program.parse();

  const url = program.args[0];
  const options = program.opts();
  
  // Token priority: --token flag > GITHUB_TOKEN env > --gh flag
  let token = options.token || process.env.GITHUB_TOKEN;
  
  if (!token && options.gh) {
    token = getGhCliToken();
    if (!token) {
      console.error(chalk.red('Could not get token from gh CLI. Run `gh auth login` first.'));
      process.exit(2);
    }
  }

  console.log();
  console.log(chalk.bold.cyan('🦦 gitload') + chalk.dim(` v${pkg.version}`));
  console.log();

  // Parse the GitHub URL
  const parseSpinner = ora({
    text: 'Parsing GitHub URL...',
    color: 'cyan'
  }).start();

  let parsed;
  try {
    parsed = parseGitHubUrl(url);
    parseSpinner.succeed(chalk.green('Parsed URL: ') + chalk.dim(`${parsed.owner}/${parsed.repo}`) + 
      (parsed.path ? chalk.dim(`/${parsed.path}`) : '') +
      (parsed.ref ? chalk.dim(` (${parsed.ref})`) : ''));
  } catch (error) {
    parseSpinner.fail(chalk.red('Invalid GitHub URL'));
    console.error(chalk.red(`  ${error.message}`));
    console.log();
    console.log(chalk.dim('Examples of valid URLs:'));
    console.log(chalk.dim('  https://github.com/user/repo'));
    console.log(chalk.dim('  https://github.com/user/repo/tree/main/folder'));
    console.log(chalk.dim('  https://github.com/user/repo/blob/main/file.txt'));
    process.exit(2);
  }

  // Initialize GitHub client
  const client = new GitHubClient(token);

  // Discover files
  const discoverSpinner = ora({
    text: 'Discovering files...',
    color: 'cyan'
  }).start();

  let files;
  try {
    files = await client.getContents(parsed, (count) => {
      discoverSpinner.text = `Discovering files... ${chalk.cyan(count)} found`;
    });
    
    if (files.length === 0) {
      discoverSpinner.fail(chalk.red('No files found at the specified path'));
      process.exit(1);
    }

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const sizeStr = formatBytes(totalSize);
    discoverSpinner.succeed(chalk.green(`Found ${chalk.bold(files.length)} files`) + chalk.dim(` (${sizeStr})`));
  } catch (error) {
    discoverSpinner.fail(chalk.red('Failed to fetch repository contents'));
    if (error.message.includes('404')) {
      console.error(chalk.red('  Repository or path not found. Check the URL and try again.'));
      if (!token) {
        console.error(chalk.yellow('  If this is a private repo, provide a token with --token or GITHUB_TOKEN'));
      }
    } else if (error.message.includes('403')) {
      console.error(chalk.red('  Rate limit exceeded or access denied.'));
      if (!token) {
        console.error(chalk.yellow('  Consider providing a GitHub token with --token or GITHUB_TOKEN'));
      }
    } else {
      console.error(chalk.red(`  ${error.message}`));
    }
    process.exit(1);
  }

  // Download files
  console.log();
  
  try {
    if (options.zip) {
      await downloadToZip(files, options.zip, parsed);
    } else {
      await downloadFiles(files, options.output, parsed);
    }
  } catch (error) {
    console.error(chalk.red(`\nDownload failed: ${error.message}`));
    process.exit(1);
  }

  console.log();
  console.log(chalk.green.bold('✓ Done!'));
  console.log();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error.message);
  process.exit(1);
});
