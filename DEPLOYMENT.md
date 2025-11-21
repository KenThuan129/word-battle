# Deployment Guide

## 🚀 Production Deployment

### Frontend (GitHub Pages)

#### Automatic Deployment (Recommended)

1. **Enable GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save changes

2. **Push to main branch:**
   - The GitHub Actions workflow will automatically build and deploy
   - Workflow file: `.github/workflows/deploy-frontend.yml`

3. **Access your site:**
   - Available at: `https://YOUR_USERNAME.github.io/WordBattle/`
   - Takes 2-5 minutes after first deployment

**Note**: The deployment workflow automatically handles native bindings installation for Tailwind CSS v4 and lightningcss.

#### Manual Deployment

1. **Build for GitHub Pages:**
   ```bash
   cd frontend
   npm run build:gh-pages
   ```

2. **Deploy to GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Select **Deploy from a branch**
   - Choose `main` branch and `/docs` folder
   - Copy `frontend/out` to `docs` directory
   ```bash
   cp -r frontend/out docs
   git add docs
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

### Backend API (VPS/Docker)

1. **Set up server:**
   ```bash
   # Install Docker & Docker Compose
   sudo apt update
   sudo apt install docker.io docker-compose
   ```

2. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/WordBattle.git
   cd WordBattle
   ```

3. **Configure environment:**
   ```bash
   cd backend/WordBattle.API
   cp .env.example appsettings.Production.json
   # Edit with production credentials
   ```

4. **Build and run:**
   ```bash
   docker-compose up -d
   ```

5. **Set up reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **SSL Certificate (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Mobile App

1. **Build for iOS:**
   ```bash
   cd mobile
   expo build:ios
   ```

2. **Build for Android:**
   ```bash
   cd mobile
   expo build:android
   ```

3. **Submit to app stores:**
   - Follow Expo's deployment guide
   - Configure app.json with production settings
   - Update API endpoint URLs

## 🔒 Environment Variables

### Backend Production

```bash
# Database
ConnectionStrings__DefaultConnection=Host=db.host;Database=wordbattle;Username=user;Password=secure_password

# Redis
ConnectionStrings__Redis=redis.host:6379

# Oxford Dictionary
OxfordDictionary__AppId=your_production_app_id
OxfordDictionary__AppKey=your_production_app_key

# ASP.NET Core
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
```

### Frontend Production

Update `next.config.ts` to point to production API:
```typescript
const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.API_URL || 'https://api.yourdomain.com',
  },
};
```

### Mobile Production

Update API endpoint in `mobile/src/lib/api.ts` (if created) or use environment variables.

## 📊 Database Setup

1. **Run migrations:**
   ```bash
   cd backend/WordBattle.API
   dotnet ef database update
   ```

2. **Create backups:**
   ```bash
   pg_dump -h localhost -U postgres wordbattle > backup.sql
   ```

## 🔍 Monitoring

- Set up logging (Serilog, Application Insights)
- Monitor API response times
- Track error rates
- Set up alerts for database/Redis failures

## 🔄 Updates

1. Pull latest changes
2. Run migrations (if any)
3. Restart services:
   ```bash
   docker-compose restart
   ```

