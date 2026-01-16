# Deployment Guide - GuideMeCoach

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (production)
- Domain name (optional)
- Git repository

---

## Option 1: Vercel (Recommended - Easiest)

Vercel is the recommended hosting platform for Next.js applications.

### Steps:

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Vercel account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

3. **Import project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

4. **Configure environment variables**
   Add these in Vercel dashboard:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

6. **Set up production database**
   - Create PostgreSQL database (use Neon, Supabase, or Railway)
   - Update DATABASE_URL in Vercel
   - Run migrations:
     ```bash
     # Install Vercel CLI
     npm i -g vercel
     
     # Link project
     vercel link
     
     # Run seed command
     vercel env pull
     npm run db:seed
     ```

### Custom Domain (Optional)
1. Go to project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Option 2: Railway

Railway provides easy database + hosting in one place.

### Steps:

1. **Create Railway account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Add PostgreSQL**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will create a database

4. **Configure environment variables**
   Railway auto-provides DATABASE_URL. Add:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
   ```

5. **Deploy**
   - Railway automatically deploys on push
   - Wait for build to complete

6. **Seed database**
   ```bash
   # Connect to Railway CLI
   npm i -g @railway/cli
   railway login
   railway link
   
   # Seed database
   railway run npm run db:seed
   ```

---

## Option 3: DigitalOcean App Platform

### Steps:

1. **Create App**
   - Go to DigitalOcean dashboard
   - Create new App
   - Connect GitHub repository

2. **Add database**
   - Add PostgreSQL database component
   - Note the connection string

3. **Configure environment**
   ```
   DATABASE_URL=${db.DATABASE_URL}
   NEXT_PUBLIC_APP_URL=https://your-app.ondigitalocean.app
   ```

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment

5. **Run seed**
   - Use console access to run:
     ```bash
     npm run db:seed
     ```

---

## Option 4: Self-Hosted (VPS)

For more control, deploy on your own VPS (Ubuntu).

### Requirements:
- Ubuntu 22.04+ server
- Domain pointing to server IP
- SSH access

### Steps:

1. **Set up server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Set up PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE guidemecoach;
   CREATE USER guidemecoach_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE guidemecoach TO guidemecoach_user;
   \q
   ```

3. **Clone and build**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/GuideMeCoach.git
   cd GuideMeCoach
   npm install
   
   # Create .env file
   nano .env
   # Add:
   # DATABASE_URL=postgresql://guidemecoach_user:your_secure_password@localhost:5432/guidemecoach
   # NEXT_PUBLIC_APP_URL=https://yourdomain.com
   
   # Seed database
   npm run db:seed
   
   # Add videos
   npm run db:add-videos
   
   # Build
   npm run build
   ```

4. **Configure PM2**
   ```bash
   pm2 start npm --name "guidemecoach" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/guidemecoach
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/guidemecoach /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## Post-Deployment Checklist

- [ ] Database seeded with 100 exercises
- [ ] Videos added to exercises
- [ ] All pages loading correctly
- [ ] Search functionality working
- [ ] Filters working
- [ ] Video embeds playing
- [ ] Mobile responsive
- [ ] SSL certificate active (HTTPS)
- [ ] Custom domain configured
- [ ] Environment variables set
- [ ] Error monitoring set up (optional: Sentry)
- [ ] Analytics set up (optional: Google Analytics)

---

## Database Backup

### Automated backup script:
```bash
#!/bin/bash
# Save as backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/guidemecoach"
DATABASE_URL="your_database_url"

mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Make executable and add to cron:
```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## Monitoring & Maintenance

### 1. Application Monitoring
- Use Vercel Analytics (if on Vercel)
- Or integrate Google Analytics
- Set up error tracking (Sentry)

### 2. Database Monitoring
- Monitor connection pool
- Check query performance
- Regular backups

### 3. Updates
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart (if using PM2)
pm2 restart guidemecoach

# Or redeploy (Vercel/Railway)
git push origin main
```

---

## Troubleshooting

### Build fails
- Check Node.js version (18+)
- Run `npm install` again
- Check environment variables
- Review build logs

### Database connection issues
- Verify DATABASE_URL is correct
- Check database is running
- Test connection with psql
- Check firewall rules

### Application crashes
- Check logs: `pm2 logs guidemecoach`
- Verify environment variables
- Check disk space
- Monitor memory usage

---

## Cost Estimates

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Vercel | Hobby (free for personal) | Pro $20/mo |
| Railway | $5 credit/month | Pay as you go |
| DigitalOcean | $0 | ~$12/mo (app + db) |
| VPS (self-hosted) | $0 | $5-10/mo (DigitalOcean/Vultr) |

**Recommendation for MVP:** Start with Vercel free tier + Neon free PostgreSQL

---

## Support

For issues:
1. Check logs first
2. Review environment variables
3. Test database connection
4. Check Next.js documentation
5. Review Vercel/Railway documentation

**Good luck with your launch! 🚀**
