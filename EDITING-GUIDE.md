# Content Editing Guide for Professor

## How to Edit Website Content

### Editing Page Content
All website content is in the `src/pages/` folder. Each page is a `.astro` file:

- `index.astro` - Homepage
- `cookbooks.astro` - Cookbooks page
- `culinary-landscapes.astro` - Maps page
- `experimental-kitchen.astro` - AI Insights page
- `cookery.astro` - The Book page
- `proof-pudding.astro` - Notes on Sources page
- `culinary-tales.astro` - The Blog page
- `tasted-tested.astro` - About page

### How to Edit Text
1. Open any `.astro` file in a text editor (Notepad, VS Code, etc.)
2. Look for text between `<p>` tags or `<h1>`, `<h2>` tags
3. Edit the text directly
4. Save the file
5. Rebuild and redeploy (see DEPLOYMENT.md)

### Example - Editing Homepage
In `src/pages/index.astro`, find:
```html
<p class="hero-subtitle">
  The Mississippi Community Cookbook Project explores cookbooks...
</p>
```
Change the text between the `<p>` tags.

### Adding Images
1. Add new images to `public/images/` folder
2. Reference them in pages like: `url('/images/your-image.jpg')`

### Editing Navigation
- Edit `src/layouts/Layout.astro`
- Look for the `<nav>` section
- Change link text and URLs as needed

### Safe Editing Tips
- Always make a backup copy before editing
- Only edit text content, not HTML tags
- Test locally with `npm run dev` before deploying
- Keep the file structure intact

### Getting Help
- For complex changes, contact your web developer
- For simple text changes, follow this guide
- Always test changes before going live
