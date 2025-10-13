# Writeup Preview Pages

This directory contains static HTML files for each writeup to enable rich link previews on social media platforms like Discord, Twitter, and Facebook.

## How It Works

Since this is a React SPA (Single Page Application) hosted on GitHub Pages, social media bots cannot execute JavaScript to read the dynamic meta tags. These static HTML files solve this problem by providing pre-rendered meta tags.

## Generated Files

Each writeup has a corresponding HTML file:
- `tombwatcher-walkthrough.html`
- `aria-walkthrough.html`
- `puppy-walkthrough.html`
- `fluffy-walkthrough.html`
- `wcorp-walkthrough.html`
- `dc02-walkthrough.html`

## Usage for Rich Previews

When sharing on Discord or other platforms, use these URLs:
```
https://endlssightmare.com/writeups/tombwatcher-walkthrough.html
https://endlssightmare.com/writeups/aria-walkthrough.html
https://endlssightmare.com/writeups/puppy-walkthrough.html
https://endlssightmare.com/writeups/fluffy-walkthrough.html
https://endlssightmare.com/writeups/wcorp-walkthrough.html
https://endlssightmare.com/writeups/dc02-walkthrough.html
```

## User Experience

- **Bots**: Will read the meta tags and show rich preview with image and description
- **Users**: Will see the content for 3 seconds, then be redirected to the homepage
- **Users can click**: The "Back to V01 Notes" link to navigate immediately

## Regenerating Files

To update all preview pages after making changes to writeups:

```bash
python3 generate_preview_pages.py
```

This will:
1. Read writeup data from the script
2. Generate HTML files with proper Open Graph and Twitter Card meta tags
3. Set image dimensions to 600x600 (square format for best preview)
4. Include auto-redirect after 3 seconds to avoid infinite loops

## Important Notes

- **Image Dimensions**: Set to 600x600 to match the square machine.png images
- **No Infinite Loops**: Uses meta refresh (3s delay) instead of JavaScript redirect
- **SEO Friendly**: Includes canonical URLs and proper meta tags
- **User Friendly**: Shows content while redirecting, with manual navigation option
