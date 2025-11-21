import type { NextConfig } from "next";

// Get repository name from environment or use default
// If your repo is "username/WordBattle", this will be "WordBattle"
// For "username/username.github.io", this would be empty
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'WordBattle';
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.NODE_ENV === 'production';

// Only set basePath if repo name is not username.github.io format
const basePath = isGitHubPages && repoName !== 'username.github.io' ? `/${repoName}` : '';

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
};

export default nextConfig;
