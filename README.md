# CinemaOS Stremio Addon

A Stremio addon that provides streaming sources from CinemaOS for movies and TV shows. This addon is ported from the original CloudStream CinemaOS plugin.

## Features

- Stream movies and TV shows from CinemaOS sources
- Supports multiple qualities (360p to 4K)
- HLS, DASH, and MP4 stream types
- Automatic decryption of CinemaOS encrypted responses
- Works with both IMDB and TMDB IDs

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Git

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cinemaos-stremio-addon.git
cd cinemaos-stremio-addon
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. The addon will be available at `http://localhost:7000/manifest.json`

## Testing the Addon

1. Open Stremio (desktop, web, or mobile)
2. Go to Settings > Addons
3. Click "Add Addon"
4. Enter: `http://localhost:7000/manifest.json`
5. Click Install

---

# Deployment Guide

## Option 1: Deploy to Railway (Recommended - Free Tier Available)

Railway offers a generous free tier with easy deployment from GitHub.

### Step 1: Prepare Your Repository

1. Create a new repository on GitHub
2. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cinemaos-stremio-addon.git
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `cinemaos-stremio-addon` repository
5. Railway will automatically detect the `railway.json` configuration
6. Click "Deploy"
7. Wait for deployment to complete

### Step 3: Get Your Addon URL

1. Once deployed, Railway will provide you with a public URL
2. Your manifest URL will be: `https://your-project-name.up.railway.app/manifest.json`
3. Add this URL to Stremio

---

## Option 2: Deploy to Render (Free Tier Available)

Render offers a free tier that stays active.

### Step 1: Push to GitHub

Follow the same GitHub setup as Railway (see above).

### Step 2: Deploy to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `cinemaos-stremio-addon`
   - **Runtime**: `Docker`
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Dockerfile Path**: `./Dockerfile`
5. Click "Create Web Service"
6. Render will build and deploy automatically

### Step 3: Get Your Addon URL

1. Once deployed, your URL will be: `https://cinemaos-stremio-addon.onrender.com/manifest.json`
2. Add this URL to Stremio

---

## Option 3: Deploy to Fly.io (Free Tier Available)

### Step 1: Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login and Launch

```bash
fly auth login
fly launch --name cinemaos-stremio-addon --region ord --dockerfile Dockerfile
```

### Step 3: Deploy

```bash
fly deploy
```

Your addon will be available at: `https://cinemaos-stremio-addon.fly.dev/manifest.json`

---

## Option 4: Deploy to Heroku (Paid Tier Required)

Heroku no longer offers a free tier, but it's still a reliable option.

### Step 1: Install Heroku CLI

```bash
npm install -g heroku
```

### Step 2: Login and Create App

```bash
heroku login
heroku create cinemaos-stremio-addon
```

### Step 3: Deploy

```bash
git push heroku main
```

---

## Option 5: Self-Host with Docker

### Using Docker

```bash
# Build the image
docker build -t cinemaos-stremio-addon .

# Run the container
docker run -d -p 7000:7000 --name cinemaos-addon cinemaos-stremio-addon
```

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  cinemaos-addon:
    build: .
    ports:
      - "7000:7000"
    environment:
      - NODE_ENV=production
      - PORT=7000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:7000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run:
```bash
docker-compose up -d
```

---

## Option 6: Deploy to VPS (DigitalOcean, Linode, AWS EC2, etc.)

### Step 1: Set Up Your VPS

1. Create a VPS with Ubuntu 22.04
2. SSH into your server:
```bash
ssh root@your-server-ip
```

### Step 2: Install Node.js and PM2

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### Step 3: Clone and Setup

```bash
git clone https://github.com/YOUR_USERNAME/cinemaos-stremio-addon.git
cd cinemaos-stremio-addon
npm install --production
```

### Step 4: Start with PM2

```bash
pm2 start addon.js --name "cinemaos-addon"
pm2 startup
pm2 save
```

### Step 5: Setup Nginx (Optional but Recommended)

```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/cinemaos-addon`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cinemaos-addon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## GitHub Actions Auto-Deployment

This repository includes GitHub Actions workflows for automatic Docker image building.

### Setup GitHub Container Registry

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. No secrets needed for GHCR - it uses `GITHUB_TOKEN` automatically

### Workflow Features

- Automatically builds Docker image on push to `main` or `master`
- Pushes to GitHub Container Registry (ghcr.io)
- Supports multi-architecture builds (AMD64, ARM64)
- Caches builds for faster subsequent builds

### Using the Docker Image

```bash
docker pull ghcr.io/YOUR_USERNAME/cinemaos-stremio-addon:latest
docker run -d -p 7000:7000 ghcr.io/YOUR_USERNAME/cinemaos-stremio-addon:latest
```

---

## Adding the Addon to Stremio

Once deployed, add your addon to Stremio:

1. Open Stremio
2. Go to Settings (gear icon)
3. Click on "Addons"
4. Click "Add Addon"
5. Enter your manifest URL:
   - Railway: `https://your-app.up.railway.app/manifest.json`
   - Render: `https://your-app.onrender.com/manifest.json`
   - Fly.io: `https://your-app.fly.dev/manifest.json`
   - Self-hosted: `http://your-server-ip:7000/manifest.json`
6. Click "Install"

---

## Troubleshooting

### Addon Not Working

1. Check the health endpoint: `/health`
2. Check logs on your deployment platform
3. Verify the CinemaOS API is accessible

### Common Issues

**Port already in use:**
```bash
# Change the PORT environment variable
export PORT=7001
npm start
```

**CinemaOS API errors:**
- The CinemaOS API might be down or rate-limited
- Check the API status by visiting: https://cinemaos.tech

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 7000 |
| `NODE_ENV` | Environment mode | production |

---

## License

MIT License - See LICENSE file for details

---

## Credits

- Original CloudStream plugin by megix
- Ported to Stremio by the community
