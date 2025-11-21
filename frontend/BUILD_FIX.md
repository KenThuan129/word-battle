# Build Fix for LightningCSS Native Module Issue

## Problem

The build fails with:
```
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
```

This is because Tailwind CSS v4 uses `lightningcss` which has native bindings, and Turbopack (Next.js 16's default bundler) has issues with native modules during static export.

## Solution

The configuration has been updated to:

1. **Force webpack instead of Turbopack** for production builds (via environment variables)
2. **Install lightningcss native bindings** explicitly in GitHub Actions
3. **Use webpack configuration** that handles native modules correctly

## What Changed

### `.github/workflows/deploy-frontend.yml`
- Added step to install/rebuild lightningcss native bindings
- Added environment variables to disable Turbopack: `NEXT_PRIVATE_TURBO: '0'` and `NEXT_PRIVATE_USE_TURBO: '0'`

### `frontend/next.config.ts`
- Added webpack configuration for better native module handling
- Configured for static export compatibility

### `frontend/package.json`
- Simplified `build:gh-pages` script
- Removed unnecessary postinstall script

## Testing Locally

To test the GitHub Pages build locally:

```bash
cd frontend
GITHUB_PAGES=true NEXT_PRIVATE_TURBO=0 NEXT_PRIVATE_USE_TURBO=0 npm run build:gh-pages
```

Or use the npm script:
```bash
npm run build:gh-pages
```

The build output will be in `frontend/out/`.

## If Build Still Fails

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Rebuild native dependencies:**
   ```bash
   npm rebuild lightningcss
   ```

3. **Check Node.js version:**
   - Ensure Node.js 20+ is installed
   - GitHub Actions uses Node.js 20

## References

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Turbopack Limitations](https://nextjs.org/docs/app/api-reference/next-config-js/turbo)
- [LightningCSS Native Bindings](https://github.com/parcel-bundler/lightningcss)

