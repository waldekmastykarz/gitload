import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const TEST_DIR = join(PROJECT_ROOT, '.test-output');
const CLI = `node ${join(PROJECT_ROOT, 'src/index.js')}`;

// A small public file for testing
const TEST_FILE_URL = 'https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md';
const TEST_FOLDER_URL = 'https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier/agents';

describe('gitload CLI', () => {
  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    // Also clean up any files created in cwd
    const cwdFile = join(process.cwd(), 'code-simplifier.md');
    if (existsSync(cwdFile)) {
      rmSync(cwdFile);
    }
  });

  describe('single file download', () => {
    it('should save file to current directory when no -o specified', () => {
      const outputFile = join(TEST_DIR, 'code-simplifier.md');
      
      execSync(`${CLI} "${TEST_FILE_URL}"`, { 
        cwd: TEST_DIR,
        stdio: 'pipe'
      });

      expect(existsSync(outputFile)).toBe(true);
    });

    it('should save file to specified directory with -o and trailing slash', () => {
      const outputDir = join(TEST_DIR, 'custom-dir');
      const outputFile = join(outputDir, 'code-simplifier.md');
      
      // Trailing slash = directory, keep original filename
      execSync(`${CLI} "${TEST_FILE_URL}" -o "${outputDir}/"`, {
        stdio: 'pipe'
      });

      expect(existsSync(outputFile)).toBe(true);
    });

    it('should rename file when -o has no trailing slash', () => {
      const customPath = join(TEST_DIR, 'vscode-prompts', 'code-simplifier.agent.md');
      
      // No trailing slash = exact file path (rename)
      execSync(`${CLI} "${TEST_FILE_URL}" -o "${customPath}"`, {
        stdio: 'pipe'
      });

      expect(existsSync(customPath)).toBe(true);
      
      // The path should be a file, not a directory containing the original file
      const wrongPath = join(customPath, 'code-simplifier.md');
      expect(existsSync(wrongPath)).toBe(false);
      
      // Verify it's actually a file with content
      const content = readFileSync(customPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should rename to extensionless file when -o has no trailing slash', () => {
      const customPath = join(TEST_DIR, 'backup');
      
      // No trailing slash = treat as file, even without extension
      execSync(`${CLI} "${TEST_FILE_URL}" -o "${customPath}"`, {
        stdio: 'pipe'
      });

      expect(existsSync(customPath)).toBe(true);
      
      // Should NOT create backup/code-simplifier.md
      const wrongPath = join(customPath, 'code-simplifier.md');
      expect(existsSync(wrongPath)).toBe(false);
      
      // Verify it's a file with content
      const content = readFileSync(customPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('folder download', () => {
    it('should create folder named after last path segment', () => {
      const outputDir = join(TEST_DIR, 'agents');
      
      execSync(`${CLI} "${TEST_FOLDER_URL}"`, {
        cwd: TEST_DIR,
        stdio: 'pipe'
      });

      expect(existsSync(outputDir)).toBe(true);
      expect(existsSync(join(outputDir, 'code-simplifier.md'))).toBe(true);
    });

    it('should save to specified directory with -o', () => {
      const outputDir = join(TEST_DIR, 'my-agents');
      
      execSync(`${CLI} "${TEST_FOLDER_URL}" -o "${outputDir}"`, {
        stdio: 'pipe'
      });

      expect(existsSync(outputDir)).toBe(true);
      expect(existsSync(join(outputDir, 'code-simplifier.md'))).toBe(true);
    });
  });
});
