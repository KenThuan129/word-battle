import type { NextConfig } from "next";

// Get repository name from environment or use default
// If your repo is "username/word-battle", this will be "word-battle"
// For "username/username.github.io", this would be empty
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]?.toLowerCase() || process.env.NEXT_PUBLIC_REPO_NAME || 'word-battle';
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.NODE_ENV === 'production';

// Only set basePath if repo name is not username.github.io format
// Normalize repo name to use hyphens
const normalizedRepoName = repoName.replace(/[_\s]/g, '-').toLowerCase();
const basePath = isGitHubPages && normalizedRepoName && normalizedRepoName !== 'username.github.io' ? `/${normalizedRepoName}` : '';

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: isGitHubPages ? 'export' : undefined,
  
  // Configure base path and asset prefix for GitHub Pages
  // This allows assets to load correctly when deployed to a subdirectory
  basePath: basePath,
  assetPrefix: basePath,
  
  // Disable image optimization for static export (required)
  images: {
    unoptimized: true,
  },
  
  // Ensure trailing slash for GitHub Pages compatibility
  trailingSlash: true,
  
  // Skip any static path checking during build (helps with export)
  skipTrailingSlashRedirect: true,
  
  // Explicitly use webpack (Turbopack has issues with native dependencies)
  // The --webpack flag in the build script ensures webpack is used
  
  // Use webpack for static export builds (better native module support)
  webpack: (config, { isServer }) => {
    // Ensure native modules are handled correctly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
