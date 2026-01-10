/**
 * Parse GitHub URLs to extract owner, repo, ref (branch/tag), and path
 * 
 * Supported URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/tree/branch/path/to/folder
 * - https://github.com/owner/repo/blob/branch/path/to/file.ext
 */

/**
 * @typedef {Object} ParsedGitHubUrl
 * @property {string} owner - Repository owner
 * @property {string} repo - Repository name
 * @property {string|null} ref - Branch, tag, or commit (null = default branch)
 * @property {string|null} path - Path within the repository (null = root)
 * @property {'tree'|'blob'|'root'} type - Whether it's a folder, file, or root
 */

/**
 * Parse a GitHub URL into its components
 * @param {string} url - GitHub URL to parse
 * @returns {ParsedGitHubUrl}
 */
export function parseGitHubUrl(url) {
  // Clean up the URL
  url = url.trim();
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Try to parse as URL
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Validate it's a GitHub URL
  if (!urlObj.hostname.includes('github.com')) {
    throw new Error('URL must be a GitHub URL (github.com)');
  }

  // Parse the pathname
  const pathParts = urlObj.pathname.split('/').filter(Boolean);

  if (pathParts.length < 2) {
    throw new Error('URL must include owner and repository (e.g., github.com/owner/repo)');
  }

  const owner = pathParts[0];
  const repo = pathParts[1].replace(/\.git$/, '');

  // If only owner/repo, return root
  if (pathParts.length === 2) {
    return {
      owner,
      repo,
      ref: null,
      path: null,
      type: 'root'
    };
  }

  // Check for tree (folder) or blob (file)
  const pathType = pathParts[2];
  
  if (pathType !== 'tree' && pathType !== 'blob') {
    // Could be a branch name directly after repo (old URL format)
    // or something else - assume it's a path
    throw new Error(`Unsupported URL format. Expected /tree/ or /blob/ in path. Got: ${pathType}`);
  }

  if (pathParts.length < 4) {
    throw new Error('URL must include a branch/ref after /tree/ or /blob/');
  }

  const ref = pathParts[3];
  const path = pathParts.slice(4).join('/') || null;

  return {
    owner,
    repo,
    ref,
    path,
    type: pathType
  };
}

/**
 * Construct a GitHub API URL for the contents endpoint
 * @param {ParsedGitHubUrl} parsed - Parsed GitHub URL
 * @returns {string} API URL
 */
export function buildContentsApiUrl(parsed) {
  let url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents`;
  
  if (parsed.path) {
    url += `/${parsed.path}`;
  }
  
  if (parsed.ref) {
    url += `?ref=${encodeURIComponent(parsed.ref)}`;
  }
  
  return url;
}

/**
 * Construct a GitHub API URL for the git trees endpoint (recursive)
 * @param {ParsedGitHubUrl} parsed - Parsed GitHub URL
 * @returns {string} API URL
 */
export function buildTreeApiUrl(parsed) {
  const ref = parsed.ref || 'HEAD';
  return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${ref}?recursive=1`;
}

/**
 * Get the raw download URL for a file
 * @param {ParsedGitHubUrl} parsed - Parsed GitHub URL
 * @param {string} filePath - Path to the file
 * @returns {string} Raw download URL
 */
export function getRawUrl(parsed, filePath) {
  const ref = parsed.ref || 'HEAD';
  return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${ref}/${filePath}`;
}
