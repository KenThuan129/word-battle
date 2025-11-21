# Deployment Guide

## 🚀 Production Deployment

### Frontend (GitHub Pages)

1. **Build the Next.js app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Export static site:**
   ```bash
   npm run export
   ```
   Note: You may need to configure `next.config.ts` for static export.

3. **Deploy to GitHub Pages:**
   - Enable GitHub Pages in repository settings
   - Set source to `/docs` folder or `gh-pages` branch
   - Or use GitHub Actions for automatic deployment

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

