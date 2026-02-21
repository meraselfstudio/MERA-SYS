# 8. DEPLOYMENT & SETUP GUIDE - MÉRA OS

## 8.1 Pre-Deployment Checklist

```
Code Quality:
□ ESLint passing (npm run lint)
□ TypeScript compilation (npm run type-check)
□ No console errors/warnings
□ Prettier formatting applied
□ All tests passing (npm run test)

Security:
□ No hardcoded secrets
□ All PINs in environment variables
□ HTTPS enforced
□ CORS headers configured
□ Database RLS policies enabled

Environment:
□ .env.local created and populated
□ All required Supabase tables created
□ Database triggers and functions deployed
□ Storage buckets configured

Documentation:
□ README.md complete
□ API documentation up-to-date
□ Setup instructions clear
□ Deployment steps documented

Performance:
□ Bundle size < 250KB (gzipped)
□ Lighthouse score > 80
□ LCP < 2.5s
□ Database queries optimized

Backup & Recovery:
□ Database backup enabled
□ Document storage configured
□ Recovery procedure documented
```

## 8.2 Supabase Setup

### Step 1: Create Supabase Project

```bash
# Option A: Via Web Dashboard
# 1. Go to https://app.supabase.com
# 2. Create a new project
# 3. Choose region (Asia Southeast 1 recommended for Indonesia)
# 4. Note your project URL and anon key

# Option B: Via CLI
supabase init
# Then configure auth and database
```

### Step 2: Database Schema Deployment

```bash
# Copy SQL schema files
# Navigate to Supabase Dashboard → SQL Editor

# Execute these SQL files in order:
# 1. Create tables (from 2-database-schema.md)
# 2. Create triggers and functions
# 3. Enable RLS policies
# 4. Create indexes

# Or use Supabase CLI:
supabase db push

# Verify tables:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

### Step 3: Enable Realtime

```sql
-- Enable Realtime on important tables
BEGIN;
  -- For POS & Finance
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE daily_omset_cache;

  -- For Attendance
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance;

  -- For Bookings
  ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

  -- For Expenses
  ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
COMMIT;
```

### Step 4: Configure Storage Buckets

```bash
# Create buckets via Supabase Dashboard
# Storage → New Bucket

# Required buckets:
1. photos
   ├─ Policies: Public read, Authenticated write
   └─ Max upload: 10MB

2. documents
   ├─ Policies: Private
   └─ Max upload: 50MB

# Or via SDK:
const { data, error } = await supabase.storage
  .createBucket('photos', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  });
```

### Step 5: Setup Authentication (Optional)

```bash
# Supabase Auth is optional for this project (using PIN-based)
# If you want to add it later:

# 1. Enable Email auth in Supabase Dashboard
# 2. Configure email templates
# 3. Add authentication method to React app
```

## 8.3 Local Development Setup

### Step 1: Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd mera-os

# Install dependencies
npm install
# or
pnpm install
```

### Step 2: Environment Variables

```bash
# Copy example env
cp .env.example .env.local

# Fill in your values:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FINANCE_PIN=////
VITE_PHOTOBOOTH_PIN=8080
```

### Step 3: Load CSV Data

```bash
# Place CSV files in src/data/
# produk.csv
# crew.csv

# Or load directly to database:
# 1. Supabase Dashboard → SQL Editor
# 2. Use COPY command or manual INSERT

# Example SQL:
INSERT INTO products (id, nama, kategori, tipe_harga, harga) VALUES
(1, 'Self Photo Session', 'Basic Studio', 'normal', 50000),
(2, 'Party Photo Session', 'Basic Studio', 'normal', 135000);

INSERT INTO crew (id, nama, posisi, pin, status_gaji) VALUES
('uuid1', 'Satria', 'Crew', '5050', 'PRO'),
('uuid2', 'Ena', 'Intern', '1324', 'INTERN');
```

### Step 4: Run Development Server

```bash
# Start dev server
npm run dev

# Output:
#   VITE v5.0.0  ready in 256 ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  Press h to show help
```

## 8.4 Deployment to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add files
git add .

# Commit
git commit -m "Initial commit: Méra OS setup"

# Create GitHub repo and push
git remote add origin <github-repo-url>
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

```bash
# Option A: Via Vercel Dashboard
# 1. Go to https://vercel.com
# 2. Click "New Project"
# 3. Import from GitHub
# 4. Select repository
# 5. Configure environment variables
# 6. Click Deploy

# Option B: Via Vercel CLI
npm i -g vercel
vercel login
vercel

# Follow prompts
```

### Step 3: Configure Environment Variables in Vercel

```bash
# In Vercel Dashboard → Settings → Environment Variables

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FINANCE_PIN=////
VITE_PHOTOBOOTH_PIN=8080
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### Step 4: Custom Domain (Optional)

```bash
# In Vercel Dashboard → Settings → Domains
# Add your custom domain (e.g., mera-studio.com)
# Update DNS records as instructed
```

## 8.5 Deployment to Railway (Alternative)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Create Procfile or let it auto-detect
# (Rails/Vite projects are auto-detected)

# Deploy
railway up

# View logs
railway logs
```

## 8.6 Alternative: Self-Hosted Deployment

### Option A: AWS EC2

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. Connect via SSH

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone <repo-url>
cd mera-os

# Install dependencies
npm ci  # Use package-lock.json

# Install PM2 (process manager)
sudo npm i -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mera-os',
    script: './node_modules/vite/bin/vite.js',
    args: 'preview --host 0.0.0.0',
    env: {
      NODE_ENV: 'production',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
    }
  }]
};
EOF

# Build
npm run build

# Preview build locally (test)
npm run preview

# Deploy with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx reverse proxy (optional)
# See 8.7 below
```

### Option B: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Use serve for preview
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start
CMD ["serve", "-s", "dist", "-l", "3000"]
```

```bash
# Build image
docker build -t mera-os .

# Run container
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL=https://... \
  -e VITE_SUPABASE_ANON_KEY=... \
  mera-os

# Or use docker-compose
```

## 8.7 Setup HTTPS with Nginx (Self-Hosted)

```nginx
# /etc/nginx/sites-available/mera-studio

server {
    listen 80;
    server_name mera-studio.com www.mera-studio.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name mera-studio.com www.mera-studio.com;

    # SSL certificates from Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/mera-studio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mera-studio.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" always;

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

```bash
# Install Certbot & Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d mera-studio.com -d www.mera-studio.com

# Enable nginx site
sudo ln -s /etc/nginx/sites-available/mera-studio /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Auto-renew certificate
sudo certbot renew --quiet  # Add to crontab
```

## 8.8 Monitoring & Logging

### Sentry Error Tracking

```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# In main.jsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Vercel Analytics (Built-in)

```bash
# Automatically enabled on Vercel
# View in Vercel Dashboard → Analytics
```

### Log Aggregation (LogDNA / Datadog)

```bash
# LogDNA agent installation
wget -q https://assets.logdna.com/scripts/logdna-agent/install.sh -O ./install.sh
sudo bash ./install.sh -k YOUR_INGESTION_KEY

# Verify logs
tail -f /var/log/mera-os.log
```

## 8.9 Database Backup Strategy

### Automated Backups (Supabase)

```bash
# Supabase automatically backups daily
# View in Dashboard → Settings → Backup

# Manual backup:
# 1. Dashboard → SQL Editor
# 2. Export entire database as SQL
# 3. Download and store safely
```

### Google Drive Backup (Auto)

```javascript
// In your backend/edge function
const backupToGoogleDrive = async () => {
  // Run daily at 2 AM
  const allData = await fetchAllDataForBackup();
  const fileName = `backup-${new Date().toISOString()}.json`;

  const result = await uploadToGoogleDrive(allData, fileName);
  console.log('Backup completed:', result.id);
};

// Schedule with Supabase cron (or external service)
```

## 8.10 Post-Deployment Verification

```bash
# Test endpoints
curl https://mera-studio.com/api/products

# Check Performance
# 1. Lighthouse: https://mera-studio.com
# 2. Vercel Analytics
# 3. Database query performance (Supabase dashboard)

# Verify Security
# 1. HTTPS working
# 2. CSP headers in place
# 3. CORS properly configured
# 4. Database RLS active

# Test Core Functionality
# 1. POS: Create transaction
# 2. Absensi: Check-in/out
# 3. Finance: Login with PIN
# 4. Photobooth: Full capture flow
# 5. Booking: Create booking
```

## 8.11 Update & Maintenance

### Dependency Updates

```bash
# Monthly security updates
npm audit
npm update
npm audit fix

# Check for deprecated packages
npm ls

# Update major versions (careful):
npm outdated
npm install <package>@latest
```

### Database Migrations

```bash
# When schema changes are needed:

# 1. Create migration
supabase migration new add_new_column

# 2. Edit migration file with SQL

# 3. Test locally
supabase db reset

# 4. Deploy
supabase db push
```

### Code Deployment

```bash
# Regular deployments via GitHub
git add .
git commit -m "Feature: [description]"
git push origin main

# Vercel auto-deploys on push
# Monitor in Vercel Dashboard

# For emergency rollback:
vercel rollback
```

## 8.12 Troubleshooting

### Common Issues

```
Issue: "Cannot connect to Supabase"
Solution:
□ Check environment variables
□ Verify API key permissions
□ Check IP whitelist (if applicable)

Issue: "Realtime not working"
Solution:
□ Ensure tables have realtime enabled
□ Check browser WebSocket support
□ Verify Supabase Realtime is enabled in project

Issue: "File uploads failing"
Solution:
□ Check storage bucket policies
□ Verify file size limits
□ Check file MIME type validation

Issue: "High database latency"
Solution:
□ Add indexes to frequently queried columns
□ Check for N+1 queries
□ Consider implementing caching

Issue: "Out of memory errors"
Solution:
□ Profile bundle size (npm run build)
□ Check for memory leaks (React DevTools Profiler)
□ Implement code splitting
```

---

**Dokumentasi Lengkap Selesai!**

Untuk memulai implementasi:

1. **Setup Supabase** (bagian 8.2)
2. **Setup Local Environment** (bagian 8.3)
3. **Develop** (gunakan `npm run dev`)
4. **Deploy** (pilih platform: Vercel, Railway, atau self-hosted)

Referensi File Dokumentasi:
- `1-architecture.md` - Arsitektur sistem
- `2-database-schema.md` - Database design
- `3-data-flows.md` - Alur data setiap modul
- `4-ui-ux-wireframes.md` - UI/UX specifications
- `5-technical-specs.md` - Tech stack & implementation
- `6-security.md` - Security & auth
- `7-api-endpoints.md` - API documentation
- `8-deployment.md` - Deployment guide (ini)
