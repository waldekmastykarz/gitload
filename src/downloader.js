import { mkdir, writeFile } from 'fs/promises';
import { createWriteStream } from 'fs';
import { dirname, join, basename, relative, extname } from 'path';
import chalk from 'chalk';
import archiver from 'archiver';
import { GitHubClient } from './github-client.js';

/**
 * Progress bar characters
 */
const PROGRESS_CHARS = {
  filled: '█',
  empty: '░',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
};

/**
 * Create a visual progress bar
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {number} width - Bar width in characters
 * @returns {string}
 */
function createProgressBar(current, total, width = 30) {
  const percent = Math.min(current / total, 1);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  
  const bar = chalk.cyan(PROGRESS_CHARS.filled.repeat(filled)) + 
              chalk.dim(PROGRESS_CHARS.empty.repeat(empty));
  
  const percentStr = chalk.bold(`${Math.round(percent * 100)}%`);
  const countStr = chalk.dim(`${current}/${total}`);
  
  return `${bar} ${percentStr} ${countStr}`;
}

/**
 * Format bytes into human-readable string
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get the relative path for a file (strips the base path if downloading a subfolder)
 * @param {string} filePath - Full file path
 * @param {import('./github-parser.js').ParsedGitHubUrl} parsed - Parsed URL
 * @returns {string}
 */
function getRelativePath(filePath, parsed) {
  if (parsed.path && parsed.type === 'tree') {
    // Strip the base folder path
    const basePath = parsed.path + '/';
    if (filePath.startsWith(basePath)) {
      return filePath.slice(basePath.length);
    }
  }
  
  if (parsed.type === 'blob' && parsed.path) {
    // For single files, just return the filename
    return basename(filePath);
  }
  
  return filePath;
}

/**
 * Download files to a directory
 * @param {import('./github-client.js').GitHubFile[]} files - Files to download
 * @param {string} outputDir - Output directory (or file path for single file downloads)
 * @param {import('./github-parser.js').ParsedGitHubUrl} parsed - Parsed URL
 * @param {Object} options - Download options
 * @param {boolean} [options.outputIsFilePath] - If true, outputDir is treated as an exact file path for single file downloads
 */
export async function downloadFiles(files, outputDir, parsed, options = {}) {
  const client = new GitHubClient(process.env.GITHUB_TOKEN);
  const total = files.length;
  let current = 0;
  let downloadedBytes = 0;
  let spinnerIndex = 0;

  // Check if this is a single file download with an explicit file path
  const isSingleFileWithPath = parsed.type === 'blob' && files.length === 1 && options.outputIsFilePath;

  console.log(chalk.bold('Downloading files...'));
  console.log();

  // Create a simple streaming output
  const updateProgress = (fileName, bytes) => {
    current++;
    downloadedBytes += bytes;
    
    const spinner = PROGRESS_CHARS.spinner[spinnerIndex % PROGRESS_CHARS.spinner.length];
    spinnerIndex++;
    
    // Clear line and print progress
    process.stdout.write('\r\x1b[K');
    process.stdout.write(
      `${chalk.cyan(spinner)} ${createProgressBar(current, total)} ` +
      chalk.dim(`(${formatBytes(downloadedBytes)})`)
    );
    
    // Print current file on next line, then move back up
    process.stdout.write(`\n\r\x1b[K  ${chalk.dim('└─')} ${chalk.dim(truncatePath(fileName, 50))}`);
    process.stdout.write('\x1b[1A'); // Move cursor up
  };

  const errors = [];

  for (const file of files) {
    const relativePath = getRelativePath(file.path, parsed);
    // If single file with explicit path, use outputDir as the file path directly
    const outputPath = isSingleFileWithPath ? outputDir : join(outputDir, relativePath);
    
    try {
      // Ensure directory exists
      await mkdir(dirname(outputPath), { recursive: true });
      
      // Download file
      const content = await client.downloadFile(file.downloadUrl);
      await writeFile(outputPath, content);
      
      updateProgress(relativePath, content.length);
    } catch (error) {
      errors.push({ file: relativePath, error: error.message });
      updateProgress(relativePath, 0);
    }
  }

  // Final newlines to clear progress display
  process.stdout.write('\n\n');

  // Show any errors
  if (errors.length > 0) {
    console.log(chalk.yellow(`⚠ ${errors.length} file(s) failed to download:`));
    for (const { file, error } of errors.slice(0, 5)) {
      console.log(chalk.dim(`  • ${file}: ${error}`));
    }
    if (errors.length > 5) {
      console.log(chalk.dim(`  ... and ${errors.length - 5} more`));
    }
    console.log();
  }

  const successCount = total - errors.length;
  console.log(
    chalk.green(`✓ Downloaded ${chalk.bold(successCount)} files`) +
    chalk.dim(` to ${outputDir}`)
  );
}

/**
 * Download files to a ZIP archive
 * @param {import('./github-client.js').GitHubFile[]} files - Files to download
 * @param {string} zipPath - Output ZIP file path
 * @param {import('./github-parser.js').ParsedGitHubUrl} parsed - Parsed URL
 */
export async function downloadToZip(files, zipPath, parsed) {
  const client = new GitHubClient(process.env.GITHUB_TOKEN);
  const total = files.length;
  let current = 0;
  let downloadedBytes = 0;
  let spinnerIndex = 0;

  // Ensure output directory exists
  await mkdir(dirname(zipPath) || '.', { recursive: true });

  console.log(chalk.bold('Downloading and creating ZIP...'));
  console.log();

  // Create archive
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Pipe archive to output file
  archive.pipe(output);

  const updateProgress = (fileName, bytes) => {
    current++;
    downloadedBytes += bytes;
    
    const spinner = PROGRESS_CHARS.spinner[spinnerIndex % PROGRESS_CHARS.spinner.length];
    spinnerIndex++;
    
    process.stdout.write('\r\x1b[K');
    process.stdout.write(
      `${chalk.cyan(spinner)} ${createProgressBar(current, total)} ` +
      chalk.dim(`(${formatBytes(downloadedBytes)})`)
    );
    
    process.stdout.write(`\n\r\x1b[K  ${chalk.dim('└─')} ${chalk.dim(truncatePath(fileName, 50))}`);
    process.stdout.write('\x1b[1A');
  };

  const errors = [];

  for (const file of files) {
    const relativePath = getRelativePath(file.path, parsed);
    
    try {
      const content = await client.downloadFile(file.downloadUrl);
      archive.append(content, { name: relativePath });
      updateProgress(relativePath, content.length);
    } catch (error) {
      errors.push({ file: relativePath, error: error.message });
      updateProgress(relativePath, 0);
    }
  }

  // Finalize the archive
  await archive.finalize();

  // Wait for the output stream to finish
  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
  });

  process.stdout.write('\n\n');

  if (errors.length > 0) {
    console.log(chalk.yellow(`⚠ ${errors.length} file(s) failed to download:`));
    for (const { file, error } of errors.slice(0, 5)) {
      console.log(chalk.dim(`  • ${file}: ${error}`));
    }
    if (errors.length > 5) {
      console.log(chalk.dim(`  ... and ${errors.length - 5} more`));
    }
    console.log();
  }

  const successCount = total - errors.length;
  console.log(
    chalk.green(`✓ Created ZIP with ${chalk.bold(successCount)} files`) +
    chalk.dim(` → ${zipPath}`)
  );
}

/**
 * Truncate a path for display
 * @param {string} path - Path to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
function truncatePath(path, maxLength) {
  if (path.length <= maxLength) return path;
  
  const start = path.slice(0, 15);
  const end = path.slice(-(maxLength - 18));
  return `${start}...${end}`;
}
