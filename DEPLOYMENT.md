# Mississippi Community Cookbook Project - Deployment Guide

## Quick Deployment to Netlify (Recommended)

### Step 1: Build the Site
```bash
npm run build
```

### Step 2: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up with your email
3. Drag and drop the `dist` folder to Netlify
4. Your site is live!

### Step 3: Custom Domain (Optional)
- In Netlify dashboard: Site settings → Domain management
- Add your university domain or custom domain

## Alternative: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up and import project
3. Connect to GitHub for easy updates

## For Updates
- Make changes to files
- Run `npm run build`
- Upload new `dist` folder to Netlify

## Technical Support
- Built with Astro.js
- Static site - very fast and secure
- No database required
