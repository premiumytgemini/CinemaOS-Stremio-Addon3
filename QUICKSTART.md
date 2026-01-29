# Quick Start Guide - CinemaOS Stremio Addon

## Step 1: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create main branch
git branch -M main

# Add remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/cinemaos-stremio-addon.git

# Push
git push -u origin main
```

## Step 2: Deploy (Choose One)

### Option A: Railway (Recommended - Free)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Click "Deploy" - Done!
6. Your URL: `https://your-app.up.railway.app/manifest.json`

### Option B: Render (Free)

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Select "Docker" runtime
6. Click "Create Web Service" - Done!
7. Your URL: `https://your-app.onrender.com/manifest.json`

### Option C: Fly.io (Free Tier)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch
fly launch --name cinemaos-addon --region ord --dockerfile Dockerfile

# Deploy
fly deploy
```

Your URL: `https://cinemaos-addon.fly.dev/manifest.json`

## Step 3: Add to Stremio

1. Open Stremio app or web
2. Go to Settings → Addons
3. Click "Add Addon"
4. Enter your manifest URL (from Step 2)
5. Click Install
6. Enjoy streaming!

## Testing Locally

```bash
# Install dependencies
npm install

# Start server
npm start

# Test in browser
open http://localhost:7000/manifest.json
open http://localhost:7000/health
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Dockerfile is present |
| App won't start | Check PORT environment variable |
| No streams | CinemaOS API might be down |
| 404 errors | Check URL path ends with `/manifest.json` |

## Support

- Check logs in your deployment platform dashboard
- Test health endpoint: `/health`
- Verify manifest: `/manifest.json`
