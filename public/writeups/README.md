# Writeup Preview Pages

These HTML files are generated to provide proper link previews for Discord and other social media platforms.

## How it works

Since this is a Single Page Application (SPA), Discord and other bots cannot execute JavaScript to see the dynamic content. These static HTML files contain the proper meta tags (Open Graph, Twitter Cards) that these platforms need to generate rich link previews.

## Files

- `tombwatcher-walkthrough.html` - TombWatcher writeup preview
- `aria-walkthrough.html` - Aria writeup preview  
- `puppy-walkthrough.html` - Puppy writeup preview
- `fluffy-walkthrough.html` - Fluffy writeup preview
- `wcorp-walkthrough.html` - Wcorp writeup preview
- `dc02-walkthrough.html` - DC02 writeup preview

## Usage

When sharing writeup links, use these URLs for proper previews:

- `https://endlssightmare.com/writeups/tombwatcher-walkthrough.html`
- `https://endlssightmare.com/writeups/aria-walkthrough.html`
- `https://endlssightmare.com/writeups/puppy-walkthrough.html`
- `https://endlssightmare.com/writeups/fluffy-walkthrough.html`
- `https://endlssightmare.com/writeups/wcorp-walkthrough.html`
- `https://endlssightmare.com/writeups/dc02-walkthrough.html`

These pages will automatically redirect to the main React app, but Discord will see the meta tags for the preview.

## Regeneration

To regenerate these files when writeup content changes, run:

```bash
python3 generate_preview_pages.py
```

This script reads the writeup data and generates fresh HTML files with updated meta tags.
