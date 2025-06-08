# Sheep.land Minification System

## Overview

This comprehensive minification system reduces file sizes while maintaining 100% functionality, with special care for Alpine.js attributes and bindings.

## Features

- **HTML Minification**: Removes comments, whitespace, and optimizes structure while preserving Alpine.js directives
- **JavaScript Minification**: Advanced compression with ES6+ support and Alpine.js preservation
- **CSS Minification**: Aggressive optimization with rule combination
- **Vendor Bundle**: Combines and optimizes third-party libraries
- **Image Optimization**: Compresses images in production builds
- **Build Statistics**: Shows detailed size reduction metrics

## Quick Start

```bash
# Install dependencies
npm install

# Run standard minification
npm run build

# Run production build (removes console.log, optimizes images)
npm run build:prod

# Or use the shell script
./build-all.sh

# Production build with clean
./build-all.sh --production --clean
```

## File Structure

### Input Files (Public Directory)
- `public/index.html` → Main HTML file
- `public/app.js` → Main JavaScript application
- `public/styles.css` → Main stylesheet
- `public/vendor/` → Third-party libraries
- `public/images/` → Image assets

### Output Files
- `public/*.min.*` → Minified versions for development
- `dist/` → Production-ready distribution folder

## Scripts

### Main Build Script
```bash
node build.js [--production]
```
Creates a complete distribution in the `dist` folder.

### Individual Minifiers

#### CSS Minification
```bash
node minify-css-advanced.js
```
- Combines similar rules
- Removes unnecessary prefixes
- Optimizes color values
- Shortens common patterns

#### JavaScript Minification
```bash
node minify-js-advanced.js [--production]
```
- Preserves Alpine.js magic properties
- Maintains PocketBase functionality
- Removes console.log in production
- Advanced compression with 3 passes

#### HTML Minification
```bash
node minify-html-advanced.js
```
- Preserves Alpine.js attributes (x-*, @, :)
- Minifies inline CSS and JS
- Removes comments and whitespace
- Creates production version with updated asset paths

#### Vendor Bundle
```bash
node combine-vendor.js
```
- Combines Alpine.js, Alpine Collapse, and PocketBase
- Creates optimized bundle
- Maintains load order

### Testing
```bash
node test-minified.js
```
Verifies minified files are valid and functional.

## Configuration

### Alpine.js Preservation

The minifiers preserve these Alpine.js features:
- Attributes: `x-data`, `x-show`, `x-if`, `x-for`, `x-on`, etc.
- Shorthands: `@click`, `:class`, etc.
- Magic properties: `$el`, `$refs`, `$root`, etc.

### Reserved Words

JavaScript minification preserves:
```javascript
[
  'Alpine', 'PocketBase', 'sheepLand', 'businessStats',
  '$el', '$refs', '$root', '$store', '$dispatch',
  '$nextTick', '$watch', '$magic'
]
```

## Production Deployment

1. Run production build:
   ```bash
   ./build-all.sh --production --clean
   ```

2. The `dist` folder contains:
   - Minified HTML with updated asset references
   - Compressed JavaScript without console statements
   - Optimized CSS with combined rules
   - Compressed images (JPEG 85%, PNG 60-80%)
   - All vendor files

3. Deploy the entire `dist` folder to your server

## File Size Reductions

Typical reductions achieved:
- HTML: 30-40% smaller
- JavaScript: 60-70% smaller
- CSS: 40-50% smaller
- Images: 20-40% smaller (production only)
- Overall: 50-60% total size reduction

## Troubleshooting

### Alpine.js Not Working
- Check test-minified.html to verify functionality
- Ensure x-attributes are preserved in HTML
- Verify Alpine is loaded before app.js

### JavaScript Errors
- Run `node test-minified.js` to check syntax
- Check browser console for specific errors
- Try development build first (without --production)

### CSS Issues
- Verify :root variables are preserved
- Check for proper closing braces
- Test with unminified CSS to isolate issues

## Best Practices

1. **Test Locally**: Always test minified files before deployment
2. **Version Control**: Commit source files, not minified versions
3. **Cache Busting**: Add version numbers to minified files
4. **Monitoring**: Check browser console for errors after deployment

## Advanced Usage

### Custom Minification Options

Edit the minifier scripts to adjust compression levels:

```javascript
// In minify-js-advanced.js
compress: {
  drop_console: true,    // Remove console statements
  passes: 3,             // Number of compression passes
  unsafe: true,          // Enable unsafe optimizations
}
```

### Excluding Files

Add files to ignore in `build.js`:
```javascript
if (srcPath.includes('exclude-this.js')) {
  await fs.copy(srcPath, destPath);
  return;
}
```

## Performance Tips

1. **Use the vendor bundle** instead of individual files:
   ```html
   <script src="vendor/vendor.bundle.min.js"></script>
   ```

2. **Enable gzip** on your server for additional compression

3. **Set proper cache headers** for minified assets

4. **Use a CDN** for static assets in production

## License

This minification system is part of the Sheep.land project.