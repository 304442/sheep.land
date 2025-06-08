const fs = require('fs-extra');
const path = require('path');
const { minify: htmlMinify } = require('html-minifier-terser');
const { minify: jsMinify } = require('terser');
const CleanCSS = require('clean-css');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
// Simple color functions to replace chalk
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`
};

// Configuration
const config = {
  srcDir: './public',
  distDir: './dist',
  isProduction: process.argv.includes('--production'),
  preserveConsole: !process.argv.includes('--production'),
  stats: {
    totalOriginal: 0,
    totalMinified: 0,
    files: []
  }
};

// HTML Minification options
const htmlMinifyOptions = {
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: false, // Keep quotes for Alpine.js compatibility
  minifyJS: true,
  minifyCSS: true,
  processScripts: ['text/javascript', 'application/javascript'],
  preserveLineBreaks: false,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: false,
  removeEmptyElements: false,
  // Preserve Alpine.js attributes and directives
  customAttrSurround: [
    [/@?x[-:]/, /(?:)/],
    [/:?@/, /(?:)/]
  ],
  customEventAttributes: [/^x-on:?/, /^@/],
  ignoreCustomFragments: [
    /x-[\w-:]+/,
    /@[\w-:]+/,
    /\{\{[\s\S]*?\}\}/,
    /\{[\s\S]*?\}/
  ],
  caseSensitive: true
};

// JavaScript Minification options
const jsMinifyOptions = {
  compress: {
    drop_console: !config.preserveConsole,
    drop_debugger: true,
    pure_funcs: config.preserveConsole ? [] : ['console.log', 'console.info', 'console.debug'],
    passes: 2,
    unsafe: false,
    unsafe_arrows: true,
    unsafe_methods: true,
    unsafe_proto: true,
    unsafe_regexp: true,
    unsafe_undefined: true,
    unused: true,
    dead_code: true,
    conditionals: true,
    comparisons: true,
    evaluate: true,
    booleans: true,
    loops: true,
    if_return: true,
    join_vars: true,
    reduce_vars: true,
    reduce_funcs: true,
    collapse_vars: true,
    inline: true,
    hoist_funs: true,
    hoist_vars: false,
    negate_iife: true,
    sequences: true,
    properties: true,
    arguments: true,
    keep_fargs: false
  },
  mangle: {
    safari10: true,
    properties: false,
    reserved: ['Alpine', 'PocketBase', '$el', '$refs', '$root', '$store', '$dispatch', '$nextTick', '$watch', '$magic']
  },
  format: {
    comments: false,
    safari10: true
  },
  ecma: 2020,
  module: false,
  toplevel: false,
  nameCache: null,
  keep_classnames: false,
  keep_fnames: false
};

// CSS Minification options
const cssMinifyOptions = {
  level: {
    1: {
      all: true,
      cleanupCharsets: true,
      normalizeUrls: true,
      optimizeBackground: true,
      optimizeBorderRadius: true,
      optimizeFilter: true,
      optimizeFont: true,
      optimizeFontWeight: true,
      optimizeOutline: true,
      removeEmpty: true,
      removeNegativePaddings: true,
      removeQuotes: true,
      removeWhitespace: true,
      replaceMultipleZeros: true,
      replaceTimeUnits: true,
      replaceZeroUnits: true,
      roundingPrecision: 2,
      selectorsSortingMethod: 'standard',
      specialComments: 'none',
      tidyAtRules: true,
      tidyBlockScopes: true,
      tidySelectors: true
    },
    2: {
      mergeAdjacentRules: true,
      mergeIntoShorthands: true,
      mergeMedia: true,
      mergeNonAdjacentRules: true,
      mergeSemantically: true,
      overrideProperties: true,
      removeEmpty: true,
      reduceNonAdjacentRules: true,
      removeDuplicateFontRules: true,
      removeDuplicateMediaBlocks: true,
      removeDuplicateRules: true,
      removeUnusedAtRules: true,
      restructureRules: true,
      skipProperties: []
    }
  }
};

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateReduction(original, minified) {
  const reduction = ((original - minified) / original * 100).toFixed(2);
  return reduction;
}

// Minify HTML
async function minifyHTML(content, filePath) {
  try {
    const minified = await htmlMinify(content, htmlMinifyOptions);
    return minified;
  } catch (error) {
    console.error(chalk.red(`Error minifying HTML ${filePath}:`), error.message);
    return content;
  }
}

// Minify JavaScript
async function minifyJS(content, filePath) {
  try {
    // Special handling for already minified files
    if (filePath.includes('.min.js')) {
      return content;
    }

    const result = await jsMinify(content, jsMinifyOptions);
    
    if (result.error) {
      console.error(chalk.red(`Error minifying JS ${filePath}:`), result.error);
      return content;
    }
    
    return result.code;
  } catch (error) {
    console.error(chalk.red(`Error minifying JS ${filePath}:`), error.message);
    return content;
  }
}

// Minify CSS
async function minifyCSS(content, filePath) {
  try {
    // Special handling for already minified files
    if (filePath.includes('.min.css')) {
      return content;
    }

    const output = new CleanCSS(cssMinifyOptions).minify(content);
    
    if (output.errors.length > 0) {
      console.error(chalk.red(`Error minifying CSS ${filePath}:`), output.errors);
      return content;
    }
    
    return output.styles;
  } catch (error) {
    console.error(chalk.red(`Error minifying CSS ${filePath}:`), error.message);
    return content;
  }
}

// Optimize images
async function optimizeImages(srcPath, destPath) {
  try {
    const files = await imagemin([srcPath], {
      destination: destPath,
      plugins: [
        imageminMozjpeg({
          quality: 85,
          progressive: true
        }),
        imageminPngquant({
          quality: [0.6, 0.8],
          strip: true
        }),
        imageminSvgo({
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                  cleanupNumericValues: {
                    floatPrecision: 2
                  }
                }
              }
            }
          ]
        })
      ]
    });
    
    return files;
  } catch (error) {
    console.error(chalk.red('Error optimizing images:'), error.message);
    return [];
  }
}

// Process a single file
async function processFile(srcPath, destPath) {
  const ext = path.extname(srcPath).toLowerCase();
  const originalSize = fs.statSync(srcPath).size;
  let minifiedSize = originalSize;
  let content = '';

  // Create destination directory
  await fs.ensureDir(path.dirname(destPath));

  switch (ext) {
    case '.html':
      content = await fs.readFile(srcPath, 'utf8');
      const minifiedHTML = await minifyHTML(content, srcPath);
      await fs.writeFile(destPath, minifiedHTML);
      minifiedSize = Buffer.byteLength(minifiedHTML);
      break;

    case '.js':
      // Skip vendor files from minification
      if (srcPath.includes('/vendor/')) {
        await fs.copy(srcPath, destPath);
      } else {
        content = await fs.readFile(srcPath, 'utf8');
        const minifiedJS = await minifyJS(content, srcPath);
        await fs.writeFile(destPath, minifiedJS);
        minifiedSize = Buffer.byteLength(minifiedJS);
      }
      break;

    case '.css':
      content = await fs.readFile(srcPath, 'utf8');
      const minifiedCSS = await minifyCSS(content, srcPath);
      await fs.writeFile(destPath, minifiedCSS);
      minifiedSize = Buffer.byteLength(minifiedCSS);
      break;

    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.svg':
      // For production, optimize images
      if (config.isProduction) {
        const optimized = await optimizeImages(srcPath, path.dirname(destPath));
        if (optimized.length > 0) {
          minifiedSize = fs.statSync(destPath).size;
        } else {
          await fs.copy(srcPath, destPath);
        }
      } else {
        await fs.copy(srcPath, destPath);
      }
      break;

    default:
      // Copy other files as-is
      await fs.copy(srcPath, destPath);
      break;
  }

  // Update stats
  config.stats.totalOriginal += originalSize;
  config.stats.totalMinified += minifiedSize;
  config.stats.files.push({
    path: path.relative(config.srcDir, srcPath),
    originalSize,
    minifiedSize,
    reduction: calculateReduction(originalSize, minifiedSize)
  });

  return { originalSize, minifiedSize };
}

// Process directory recursively
async function processDirectory(srcDir, destDir) {
  const items = await fs.readdir(srcDir);

  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = await fs.stat(srcPath);

    if (stat.isDirectory()) {
      await processDirectory(srcPath, destPath);
    } else {
      const { originalSize, minifiedSize } = await processFile(srcPath, destPath);
      
      // Log progress
      const reduction = calculateReduction(originalSize, minifiedSize);
      const color = reduction > 20 ? chalk.green : reduction > 10 ? chalk.yellow : chalk.gray;
      console.log(
        `${color('✓')} ${path.relative(config.srcDir, srcPath)} - ` +
        `${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} ` +
        `(${color(`-${reduction}%`)})`
      );
    }
  }
}

// Main build function
async function build() {
  const startTime = Date.now();
  
  console.log(chalk.blue('\n🚀 Starting build process...\n'));
  console.log(chalk.gray(`Mode: ${config.isProduction ? 'Production' : 'Development'}`));
  console.log(chalk.gray(`Console logs: ${config.preserveConsole ? 'Preserved' : 'Removed'}`));
  console.log(chalk.gray(`Target: ${config.distDir}\n`));

  // Clean dist directory
  await fs.remove(config.distDir);
  await fs.ensureDir(config.distDir);

  // Process all files
  await processDirectory(config.srcDir, config.distDir);
  
  const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // Display statistics
  console.log(chalk.blue('\n📊 Build Statistics:\n'));
  console.log(chalk.white(`Build Time: ${buildTime}s`));
  console.log(chalk.white(`Files Processed: ${config.stats.files.length}`));
  console.log(chalk.white(`Total Original Size: ${formatBytes(config.stats.totalOriginal)}`));
  console.log(chalk.white(`Total Minified Size: ${formatBytes(config.stats.totalMinified)}`));
  console.log(chalk.green(`Total Reduction: ${calculateReduction(config.stats.totalOriginal, config.stats.totalMinified)}% (${formatBytes(config.stats.totalOriginal - config.stats.totalMinified)} saved)\n`));

  // Show top 10 files by size reduction
  const topFiles = config.stats.files
    .filter(f => f.originalSize > 0)
    .sort((a, b) => (b.originalSize - b.minifiedSize) - (a.originalSize - a.minifiedSize))
    .slice(0, 10);

  console.log(chalk.blue('Top 10 files by size reduction:\n'));
  topFiles.forEach((file, index) => {
    console.log(
      `${index + 1}. ${file.path} - ` +
      `${formatBytes(file.originalSize - file.minifiedSize)} saved ` +
      `(${chalk.green(`-${file.reduction}%`)})`
    );
  });

  console.log(chalk.green('\n✨ Build completed successfully!\n'));
  
  // Create a production-ready index file in the root if in production mode
  if (config.isProduction) {
    const indexPath = path.join(config.distDir, 'index.html');
    const indexContent = await fs.readFile(indexPath, 'utf8');
    
    // Update paths to use minified versions
    const updatedIndex = indexContent
      .replace(/app\.js/g, 'app.min.js')
      .replace(/styles\.css/g, 'styles.min.css');
    
    await fs.writeFile(indexPath, updatedIndex);
    console.log(chalk.blue('📝 Updated index.html to use minified assets\n'));
  }
}

// Run the build
build().catch(error => {
  console.error(chalk.red('\n❌ Build failed:'), error);
  process.exit(1);
});