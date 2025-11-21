# 🚀 Quick Start: Deploy Frontend to GitHub Pages

## Option 1: Automatic Deployment (Recommended) ⚡

This is the easiest method - just push your code and GitHub Actions will handle everything!

### Steps:

1. **Enable GitHub Pages:**
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Click **Save**

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

3. **Wait for deployment:**
   - Go to **Actions** tab in your repository
   - Watch the "Deploy Frontend to GitHub Pages" workflow run
   - It will take 2-5 minutes

4. **Access your site:**
   - `https://YOUR_USERNAME.github.io/WordBattle/`
   - Your site will auto-update on every push to `main` branch!

**That's it!** 🎉 Your site is now live and will automatically deploy whenever you push changes.

---

## Option 2: Manual Deployment 📝

If you prefer to deploy manually:

### Step 1: Build locally
```bash
cd frontend
npm run build:gh-pages
```

This creates a `frontend/out` directory with your static site.

### Step 2: Deploy to GitHub Pages

**Option A: Using `/docs` folder (Easiest)**
```bash
# From project root
cp -r frontend/out docs
git add docs
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Then in GitHub:
1. Go to **Settings** → **Pages**
2. Select **Deploy from a branch**
3. Choose `main` branch and `/docs` folder
4. Click **Save**

**Option B: Using `gh-pages` branch**
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

---

## 🔧 Troubleshooting

### Site shows 404 or blank page?
- Check that basePath is correct in `next.config.ts`
- Verify repository name matches the URL path
- Wait 5-10 minutes for GitHub Pages to propagate

### Assets (CSS/JS) not loading?
- Ensure `assetPrefix` is set correctly in `next.config.ts`
- Check browser console for 404 errors
- Verify the basePath matches your repository name

### Build fails?
- Check GitHub Actions logs for errors
- Ensure all dependencies are installed: `npm ci`
- Run locally: `npm run build:gh-pages` to test

---

## 📚 More Information

For detailed instructions, see:
- `frontend/GITHUB_PAGES_DEPLOYMENT.md` - Complete deployment guide
- `.github/workflows/deploy-frontend.yml` - GitHub Actions workflow

---

## ✅ What's Configured?

- ✅ Next.js configured for static export
- ✅ GitHub Actions workflow for auto-deployment
- ✅ BasePath and assetPrefix configured
- ✅ Image optimization disabled (required for static export)
- ✅ Trailing slashes enabled for GitHub Pages compatibility

Your frontend is ready to deploy! 🚀

