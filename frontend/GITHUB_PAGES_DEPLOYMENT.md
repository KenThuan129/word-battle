# Deploying Frontend to GitHub Pages

This guide explains how to deploy the Next.js frontend to GitHub Pages.

## 🚀 Automatic Deployment (Recommended)

### Step 1: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the changes

### Step 2: Push to Main Branch

The GitHub Actions workflow (`.github/workflows/deploy-frontend.yml`) will automatically:
- Build the Next.js app for static export
- Deploy to GitHub Pages
- Update the site whenever you push to `main` branch

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### Step 3: Access Your Site

Your site will be available at:
- `https://YOUR_USERNAME.github.io/WordBattle/`
- Or `https://YOUR_USERNAME.github.io/WordBattle/` if using custom domain

**Note**: It may take a few minutes after the first deployment for the site to be available.

## 📝 Manual Deployment

If you prefer to deploy manually:

### Step 1: Build for GitHub Pages

```bash
cd frontend
npm run build:gh-pages
```

This creates a static export in the `frontend/out` directory.

### Step 2: Configure GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select `main` branch and `/docs` folder (or create a `gh-pages` branch)
4. Click **Save**

### Step 3: Copy Build Output

If using `/docs` folder:
```bash
# Copy out directory to docs
cp -r frontend/out docs
git add docs
git commit -m "Deploy to GitHub Pages"
git push origin main
```

If using `gh-pages` branch:
```bash
# Create and switch to gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
cp -r frontend/out/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
git checkout main
```

## ⚙️ Configuration Details

### Next.js Config

The `next.config.ts` is configured to:
- Use static export for GitHub Pages
- Set basePath to match repository name
- Disable image optimization (required for static export)
- Enable trailing slashes for compatibility

### Environment Variables

The build uses:
- `GITHUB_PAGES=true` - Enables static export
- `GITHUB_REPOSITORY` - Automatically set by GitHub Actions

### Custom Domain (Optional)

1. Create a `CNAME` file in `frontend/public/` with your domain:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Add a `CNAME` record pointing to `YOUR_USERNAME.github.io`

3. In GitHub repository settings → Pages:
   - Enter your custom domain

## 🔧 Troubleshooting

### Assets Not Loading

If assets (CSS, JS, images) are not loading:
1. Check `basePath` and `assetPrefix` in `next.config.ts`
2. Ensure repository name matches the basePath
3. Check browser console for 404 errors

### Routes Not Working

GitHub Pages only supports static sites. Ensure:
- All routes use client-side navigation (`Link` component)
- No server-side features (API routes, middleware)
- All dynamic routes are pre-rendered

### Build Fails

If build fails:
1. Check GitHub Actions logs
2. Ensure Node.js version matches (20+)
3. Run `npm ci` to clean install dependencies
4. Check for TypeScript errors: `npm run lint`

## 📚 Resources

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)

