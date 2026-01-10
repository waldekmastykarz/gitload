import { buildContentsApiUrl, buildTreeApiUrl, getRawUrl } from './github-parser.js';

/**
 * @typedef {Object} GitHubFile
 * @property {string} path - Path to the file
 * @property {string} downloadUrl - URL to download the raw file
 * @property {number} size - File size in bytes
 * @property {string} sha - Git SHA
 */

export class GitHubClient {
  /**
   * @param {string} [token] - GitHub personal access token
   */
  constructor(token) {
    this.token = token;
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'gitload-cli'
    };
    
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Fetch JSON from the GitHub API
   * @param {string} url - API URL
   * @returns {Promise<any>}
   */
  async fetch(url) {
    const response = await fetch(url, { headers: this.headers });
    
    if (!response.ok) {
      const error = new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  }

  /**
   * Get the default branch of a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<string>}
   */
  async getDefaultBranch(owner, repo) {
    const data = await this.fetch(`https://api.github.com/repos/${owner}/${repo}`);
    return data.default_branch;
  }

  /**
   * Get all files at a path (handles both files and directories)
   * @param {import('./github-parser.js').ParsedGitHubUrl} parsed - Parsed GitHub URL
   * @param {function(number): void} [onProgress] - Callback for progress updates
   * @returns {Promise<GitHubFile[]>}
   */
  async getContents(parsed, onProgress) {
    // If no ref specified, get the default branch
    if (!parsed.ref) {
      parsed.ref = await this.getDefaultBranch(parsed.owner, parsed.repo);
    }

    // For a single file (blob), return just that file
    if (parsed.type === 'blob' && parsed.path) {
      const file = {
        path: parsed.path,
        downloadUrl: getRawUrl(parsed, parsed.path),
        size: 0, // We'll get this from the download
        sha: ''
      };
      
      // Try to get the file info
      try {
        const url = buildContentsApiUrl(parsed);
        const data = await this.fetch(url);
        file.size = data.size || 0;
        file.sha = data.sha || '';
      } catch {
        // Ignore - we'll still try to download it
      }
      
      onProgress?.(1);
      return [file];
    }

    // For directories or root, use the tree API for efficiency
    const files = await this.getTreeContents(parsed, onProgress);
    return files;
  }

  /**
   * Get all files using the Git Trees API (more efficient for large repos)
   * @param {import('./github-parser.js').ParsedGitHubUrl} parsed - Parsed GitHub URL
   * @param {function(number): void} [onProgress] - Callback for progress updates
   * @returns {Promise<GitHubFile[]>}
   */
  async getTreeContents(parsed, onProgress) {
    const treeUrl = buildTreeApiUrl(parsed);
    const data = await this.fetch(treeUrl);

    if (!data.tree) {
      throw new Error('Invalid response from GitHub API');
    }

    // Filter to only files (blobs), and optionally filter by path prefix
    const pathPrefix = parsed.path ? parsed.path + '/' : '';
    
    const files = [];
    let count = 0;

    for (const item of data.tree) {
      // Skip directories (trees)
      if (item.type !== 'blob') continue;

      // If we have a path filter, check if the file is under that path
      if (parsed.path) {
        // Exact match for single file
        if (item.path === parsed.path) {
          files.push({
            path: item.path,
            downloadUrl: getRawUrl(parsed, item.path),
            size: item.size || 0,
            sha: item.sha
          });
          count++;
          onProgress?.(count);
          break;
        }
        
        // Check if file is under the path prefix
        if (!item.path.startsWith(pathPrefix)) continue;
      }

      files.push({
        path: item.path,
        downloadUrl: getRawUrl(parsed, item.path),
        size: item.size || 0,
        sha: item.sha
      });
      
      count++;
      onProgress?.(count);
    }

    return files;
  }

  /**
   * Download a single file's content
   * @param {string} url - Raw download URL
   * @returns {Promise<Buffer>}
   */
  async downloadFile(url) {
    const response = await fetch(url, {
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
