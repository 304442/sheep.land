const fs = require('fs-extra');
const path = require('path');
const { minify: htmlMinify } = require('html-minifier-terser');
const { minify: jsMinify } = require('terser');
const CleanCSS = require('clean-css');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');

// Simple color functions for console output
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

// Global configuration
const config = {
  srcDir: './public',
  distDir: './dist',
  bundleFile: './sheep-land-bundle.html',
  isProduction: process.argv.includes('--production'),
  createBundle: process.argv.includes('--bundle'), // Bundle is opt-in only
  preserveConsole: !process.argv.includes('--production'),
  stats: {
    totalOriginal: 0,
    totalMinified: 0,
    files: [],
    originalHtml: 0,
    originalCss: 0,
    originalJs: 0,
    bundleSize: 0
  }
};

// Advanced HTML minification options
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

// Advanced JavaScript minification options
const jsMinifyOptions = {
  compress: {
    drop_console: !config.preserveConsole,
    drop_debugger: true,
    pure_funcs: config.preserveConsole ? [] : ['console.log', 'console.info', 'console.debug'],
    passes: 3,
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
    inline: 3,
    hoist_funs: true,
    hoist_vars: false,
    negate_iife: true,
    sequences: true,
    properties: true,
    arguments: true,
    keep_fargs: false,
    toplevel: false
  },
  mangle: {
    safari10: true,
    properties: {
      regex: /^_/
    },
    reserved: ['Alpine', 'PocketBase', '$el', '$refs', '$root', '$store', '$dispatch', '$nextTick', '$watch', '$magic']
  },
  format: {
    comments: false,
    safari10: true,
    ascii_only: true
  },
  ecma: 2020,
  module: false,
  toplevel: true,
  nameCache: null,
  keep_classnames: false,
  keep_fnames: false
};

// Advanced CSS minification options
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
  },
  inline: ['local']
};

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateReduction(original, minified) {
  return ((original - minified) / original * 100).toFixed(2);
}

function getProgressColor(reduction) {
  if (reduction > 30) return chalk.green;
  if (reduction > 15) return chalk.yellow;
  if (reduction > 5) return chalk.cyan;
  return chalk.gray;
}

// Minification functions
async function minifyHTML(content, filePath) {
  try {
    const minified = await htmlMinify(content, htmlMinifyOptions);
    return minified;
  } catch (error) {
    console.error(chalk.red(`❌ Error minifying HTML ${filePath}:`), error.message);
    return content;
  }
}

async function minifyJS(content, filePath) {
  try {
    if (filePath.includes('.min.js')) {
      return content;
    }

    const result = await jsMinify(content, jsMinifyOptions);
    
    if (result.error) {
      console.error(chalk.red(`❌ Error minifying JS ${filePath}:`), result.error);
      return content;
    }
    
    return result.code;
  } catch (error) {
    console.error(chalk.red(`❌ Error minifying JS ${filePath}:`), error.message);
    return content;
  }
}

async function minifyCSS(content, filePath) {
  try {
    if (filePath.includes('.min.css')) {
      return content;
    }

    const output = new CleanCSS(cssMinifyOptions).minify(content);
    
    if (output.errors.length > 0) {
      console.error(chalk.red(`❌ Error minifying CSS ${filePath}:`), output.errors);
      return content;
    }
    
    return output.styles;
  } catch (error) {
    console.error(chalk.red(`❌ Error minifying CSS ${filePath}:`), error.message);
    return content;
  }
}

// Image optimization
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
    console.error(chalk.red('❌ Error optimizing images:'), error.message);
    return [];
  }
}

// File processing
async function processFile(srcPath, destPath) {
  const ext = path.extname(srcPath).toLowerCase();
  const originalSize = fs.statSync(srcPath).size;
  let minifiedSize = originalSize;
  let content = '';

  await fs.ensureDir(path.dirname(destPath));

  switch (ext) {
    case '.html':
      content = await fs.readFile(srcPath, 'utf8');
      const minifiedHTML = await minifyHTML(content, srcPath);
      await fs.writeFile(destPath, minifiedHTML);
      minifiedSize = Buffer.byteLength(minifiedHTML);
      break;

    case '.js':
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

// Directory processing
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
      
      const reduction = calculateReduction(originalSize, minifiedSize);
      const color = getProgressColor(reduction);
      console.log(
        `${color('✓')} ${path.relative(config.srcDir, srcPath)} - ` +
        `${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} ` +
        `(${color(`-${reduction}%`)})`
      );
    }
  }
}

// Bundle creation
async function createBundle() {
  const startTime = Date.now();
  
  console.log(chalk.blue('\n🎯 Creating Single File Bundle...\n'));
  
  try {
    const htmlPath = path.join(config.srcDir, 'index.html');
    const cssPath = path.join(config.srcDir, 'styles.css');
    const jsPath = path.join(config.srcDir, 'app.js');
    
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML file not found: ${htmlPath}`);
    }
    
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    let cssContent = '';
    let jsContent = '';
    
    // Read and optimize CSS
    if (fs.existsSync(cssPath)) {
      cssContent = await fs.readFile(cssPath, 'utf8');
      config.stats.originalCss = Buffer.byteLength(cssContent);
      cssContent = await minifyCSS(cssContent, cssPath);
      console.log(chalk.green(`✓ CSS optimized: ${formatBytes(Buffer.byteLength(cssContent))} (-${calculateReduction(config.stats.originalCss, Buffer.byteLength(cssContent))}%)`));
    }
    
    // Read and optimize JavaScript
    if (fs.existsSync(jsPath)) {
      jsContent = await fs.readFile(jsPath, 'utf8');
      config.stats.originalJs = Buffer.byteLength(jsContent);
      jsContent = await minifyJS(jsContent, jsPath);
      console.log(chalk.green(`✓ JavaScript optimized: ${formatBytes(Buffer.byteLength(jsContent))} (-${calculateReduction(config.stats.originalJs, Buffer.byteLength(jsContent))}%)`));
    }
    
    config.stats.originalHtml = Buffer.byteLength(htmlContent);
    
    // Inline assets
    console.log(chalk.yellow('\n📦 Bundling assets...\n'));
    
    if (cssContent) {
      htmlContent = htmlContent.replace(/<link[^>]*href[^>]*\.css[^>]*>/gi, '');
      const styleTag = `<style>${cssContent}</style>`;
      htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
    }
    
    if (jsContent) {
      htmlContent = htmlContent.replace(/<script[^>]*src[^>]*\.js[^>]*><\/script>/gi, '');
      const scriptTag = `<script>${jsContent}</script>`;
      htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
    }
    
    // Final HTML optimization
    const optimizedHtml = await minifyHTML(htmlContent, htmlPath);
    
    // Write bundle
    await fs.writeFile(config.bundleFile, optimizedHtml);
    config.stats.bundleSize = Buffer.byteLength(optimizedHtml);
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalOriginal = config.stats.originalHtml + config.stats.originalCss + config.stats.originalJs;
    const totalReduction = calculateReduction(totalOriginal, config.stats.bundleSize);
    const savedBytes = totalOriginal - config.stats.bundleSize;
    
    // Display bundle statistics
    console.log(chalk.blue('\n📊 Bundle Statistics:\n'));
    console.log(chalk.white(`Build Time: ${buildTime}s`));
    console.log(chalk.white(`Output File: ${config.bundleFile}`));
    console.log(chalk.white(`Bundle Size: ${formatBytes(config.stats.bundleSize)}`));
    console.log(chalk.green(`Total Reduction: ${totalReduction}% (${formatBytes(savedBytes)} saved)\n`));
    
    console.log(chalk.blue('🚀 Performance Benefits:\n'));
    console.log(chalk.green('✓ Zero HTTP requests for CSS/JS'));
    console.log(chalk.green('✓ Eliminated render-blocking resources'));
    console.log(chalk.green('✓ Reduced file transfer overhead'));
    console.log(chalk.green('✓ Faster initial page load'));
    console.log(chalk.green('✓ Better caching efficiency\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Bundle creation failed:'), error.message);
    process.exit(1);
  }
}

// Main build function
async function build() {
  const startTime = Date.now();
  
  console.log(chalk.blue('\n🚀 Starting Optimization Process...\n'));
  console.log(chalk.gray(`Mode: ${config.isProduction ? 'Production' : 'Development'}`));
  console.log(chalk.gray(`Console logs: ${config.preserveConsole ? 'Preserved' : 'Removed'}`));
  console.log(chalk.gray(`Bundle creation: ${config.createBundle ? 'Enabled' : 'Disabled'}`));
  console.log(chalk.gray(`Target: ${config.distDir}\n`));

  // Clean dist directory for regular build
  if (!config.createBundle) {
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

    // Show top files by size reduction
    const topFiles = config.stats.files
      .filter(f => f.originalSize > 0)
      .sort((a, b) => (b.originalSize - b.minifiedSize) - (a.originalSize - a.minifiedSize))
      .slice(0, 10);

    if (topFiles.length > 0) {
      console.log(chalk.blue('🏆 Top files by size reduction:\n'));
      topFiles.forEach((file, index) => {
        const color = getProgressColor(file.reduction);
        console.log(
          `${index + 1}. ${file.path} - ` +
          `${formatBytes(file.originalSize - file.minifiedSize)} saved ` +
          `(${color(`-${file.reduction}%`)})`
        );
      });
    }

    console.log(chalk.green('\n✨ Build completed successfully!\n'));
    
    // Update index.html for production
    if (config.isProduction) {
      const indexPath = path.join(config.distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        const indexContent = await fs.readFile(indexPath, 'utf8');
        const updatedIndex = indexContent
          .replace(/app\.js/g, 'app.min.js')
          .replace(/styles\.css/g, 'styles.min.css');
        
        await fs.writeFile(indexPath, updatedIndex);
        console.log(chalk.blue('📝 Updated index.html to use minified assets\n'));
      }
    }
  }
  
  // Create bundle if requested
  if (config.createBundle) {
    await createBundle();
  }
}

// CLI interface
function showHelp() {
  console.log(chalk.cyan('\n🛠️  Sheep.land Optimization Tool\n'));
  console.log(chalk.white('Usage: node optimize.js [options]\n'));
  console.log(chalk.yellow('Options:'));
  console.log(chalk.white('  --production    Production mode (removes console logs, optimizes images)'));
  console.log(chalk.white('  --bundle        Create single file bundle'));
  console.log(chalk.white('  --help          Show this help message\n'));
  console.log(chalk.yellow('Examples:'));
  console.log(chalk.white('  node optimize.js                    # Development build'));
  console.log(chalk.white('  node optimize.js --production       # Production build'));
  console.log(chalk.white('  node optimize.js --bundle           # Create bundle only'));
  console.log(chalk.white('  node optimize.js --production --bundle  # Production build + bundle\n'));
}

// Main execution
if (process.argv.includes('--help')) {
  showHelp();
} else {
  build().catch(error => {
    console.error(chalk.red('\n❌ Optimization failed:'), error.message);
    process.exit(1);
  });
}