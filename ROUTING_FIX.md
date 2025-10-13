# Routing Fix for React SPA on GitHub Pages

## Problem Solved ✅

The issue was that the `homepage` field in `package.json` was interfering with local development routing.

## How to Use

### For Development (Local)
```bash
node switch-homepage.js dev
npm start
```
Now `http://localhost:3000/writeups/tombwatcher-walkthrough` will work correctly!

### For Production (GitHub Pages)
```bash
node switch-homepage.js prod
npm run build
npm run deploy
```

## What Was Fixed

1. **Removed conflicting `homepage` field** during development
2. **Created `public/_redirects`** for Netlify compatibility
3. **Fixed `public/404.html`** for GitHub Pages SPA routing
4. **Removed interfering static HTML files** from `public/writeups/`

## Files Created/Modified

- ✅ `switch-homepage.js` - Script to toggle between dev/prod modes
- ✅ `public/_redirects` - Netlify redirect rules
- ✅ `public/404.html` - GitHub Pages SPA fallback
- ✅ `package.json` - Homepage field temporarily disabled for dev

## Testing

1. Run `node switch-homepage.js dev`
2. Run `npm start`
3. Go to `http://localhost:3000/writeups/tombwatcher-walkthrough`
4. Should now load the writeup correctly! 🎉

## For Social Media Previews

The SEO meta tags are now handled by the React components themselves using `react-helmet-async`, so social media previews will work correctly without needing static HTML files.
