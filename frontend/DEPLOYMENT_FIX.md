# Frontend Deployment Fix

## Issue

Tailwind CSS v4 requires native bindings (`@tailwindcss/oxide`, `lightningcss`) that npm's optional dependencies handling sometimes fails to install correctly, especially in CI/CD environments.

## Solution

The GitHub Actions workflow now:
1. Installs dependencies normally
2. Explicitly reinstalls native bindings to work around npm's optional dependencies bug
3. Verifies bindings are present before building

## Local Development

For local development on Windows:

```bash
cd frontend
npm install
```

This will install:
- `lightningcss-win32-x64-msvc` (Windows native bindings)
- `@tailwindcss/oxide` with appropriate bindings

## Production Deployment

The GitHub Actions workflow automatically handles Linux native bindings installation on the CI server.

## If Build Still Fails

If you encounter native binding errors:

1. **Clean install:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Force reinstall native packages:**
   ```bash
   npm install @tailwindcss/oxide tailwindcss @tailwindcss/postcss --save-dev --force
   npm install lightningcss --save-dev --force
   ```

3. **For Windows, install Windows bindings:**
   ```bash
   npm install lightningcss-win32-x64-msvc --save-dev
   ```

The workflow handles all of this automatically for Linux builds.

