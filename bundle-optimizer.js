const fs = require('fs-extra');
const path = require('path');
const { minify: htmlMinify } = require('html-minifier-terser');
const { minify: jsMinify } = require('terser');
const CleanCSS = require('clean-css');

// Simple color functions for output
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
  outputFile: './sheep-land-bundle.html',
  preserveConsole: !process.argv.includes('--production'),
  stats: {
    originalHtml: 0,
    originalCss: 0,
    originalJs: 0,
    bundleSize: 0
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
  return ((original - minified) / original * 100).toFixed(2);
}

// Advanced CSS minification with critical path optimization
async function optimizeCSS(content) {
  const cleanCSS = new CleanCSS({
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
  });

  const result = cleanCSS.minify(content);
  
  if (result.errors.length > 0) {
    console.error(chalk.red('CSS optimization errors:'), result.errors);
    return content;
  }
  
  return result.styles;
}

// Advanced JavaScript optimization
async function optimizeJS(content) {
  try {
    const result = await jsMinify(content, {
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
    });
    
    if (result.error) {
      console.error(chalk.red('JS optimization error:'), result.error);
      return content;
    }
    
    return result.code;
  } catch (error) {
    console.error(chalk.red('JS optimization failed:'), error.message);
    return content;
  }
}

// Create bundled HTML with inlined assets
async function createBundle() {
  const startTime = Date.now();
  
  console.log(chalk.blue('\n🚀 Creating Single File Bundle...\n'));
  
  try {
    // Read source files
    const htmlPath = path.join(config.srcDir, 'index.html');
    const cssPath = path.join(config.srcDir, 'styles.css');
    const jsPath = path.join(config.srcDir, 'app.js');
    
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML file not found: ${htmlPath}`);
    }
    
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    let cssContent = '';
    let jsContent = '';
    
    // Read CSS if exists
    if (fs.existsSync(cssPath)) {
      cssContent = await fs.readFile(cssPath, 'utf8');
      config.stats.originalCss = Buffer.byteLength(cssContent);
      console.log(chalk.gray(`✓ CSS loaded: ${formatBytes(config.stats.originalCss)}`));
    }
    
    // Read JavaScript if exists
    if (fs.existsSync(jsPath)) {
      jsContent = await fs.readFile(jsPath, 'utf8');
      config.stats.originalJs = Buffer.byteLength(jsContent);
      console.log(chalk.gray(`✓ JavaScript loaded: ${formatBytes(config.stats.originalJs)}`));
    }
    
    config.stats.originalHtml = Buffer.byteLength(htmlContent);
    console.log(chalk.gray(`✓ HTML loaded: ${formatBytes(config.stats.originalHtml)}`));
    
    // Optimize assets
    console.log(chalk.yellow('\n🔧 Optimizing assets...\n'));
    
    if (cssContent) {
      cssContent = await optimizeCSS(cssContent);
      console.log(chalk.green(`✓ CSS optimized: ${formatBytes(Buffer.byteLength(cssContent))} (-${calculateReduction(config.stats.originalCss, Buffer.byteLength(cssContent))}%)`));
    }
    
    if (jsContent) {
      jsContent = await optimizeJS(jsContent);
      console.log(chalk.green(`✓ JavaScript optimized: ${formatBytes(Buffer.byteLength(jsContent))} (-${calculateReduction(config.stats.originalJs, Buffer.byteLength(jsContent))}%)`));
    }
    
    // Remove external references and inline assets
    console.log(chalk.yellow('\n📦 Bundling assets...\n'));
    
    // Remove external CSS links and add inline styles
    if (cssContent) {
      htmlContent = htmlContent.replace(/<link[^>]*href[^>]*\.css[^>]*>/gi, '');
      const styleTag = `<style>${cssContent}</style>`;
      htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
    }
    
    // Remove external JS scripts and add inline script
    if (jsContent) {
      htmlContent = htmlContent.replace(/<script[^>]*src[^>]*\.js[^>]*><\/script>/gi, '');
      const scriptTag = `<script>${jsContent}</script>`;
      htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
    }
    
    // Optimize the final HTML
    const optimizedHtml = await htmlMinify(htmlContent, {
      removeComments: true,
      collapseWhitespace: true,
      removeAttributeQuotes: false, // Keep for Alpine.js
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
      // Preserve Alpine.js attributes
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
    });
    
    // Write the bundle
    await fs.writeFile(config.outputFile, optimizedHtml);
    config.stats.bundleSize = Buffer.byteLength(optimizedHtml);
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Display final statistics
    console.log(chalk.blue('\n📊 Bundle Statistics:\n'));
    console.log(chalk.white(`Build Time: ${buildTime}s`));
    console.log(chalk.white(`Output File: ${config.outputFile}`));
    console.log(chalk.white(`Bundle Size: ${formatBytes(config.stats.bundleSize)}`));
    
    const totalOriginal = config.stats.originalHtml + config.stats.originalCss + config.stats.originalJs;
    const totalReduction = calculateReduction(totalOriginal, config.stats.bundleSize);
    const savedBytes = totalOriginal - config.stats.bundleSize;
    
    console.log(chalk.green(`Total Original: ${formatBytes(totalOriginal)}`));
    console.log(chalk.green(`Total Reduction: ${totalReduction}% (${formatBytes(savedBytes)} saved)\n`));
    
    // Performance metrics
    console.log(chalk.blue('🚀 Performance Benefits:\n'));
    console.log(chalk.green('✓ Zero HTTP requests for CSS/JS'));
    console.log(chalk.green('✓ Eliminated render-blocking resources'));
    console.log(chalk.green('✓ Reduced file transfer overhead'));
    console.log(chalk.green('✓ Faster initial page load'));
    console.log(chalk.green('✓ Better caching efficiency'));
    console.log(chalk.green('✓ Reduced CDN costs'));
    
    // File breakdown
    if (config.stats.originalCss > 0 || config.stats.originalJs > 0) {
      console.log(chalk.blue('\n📋 Asset Breakdown:\n'));
      if (config.stats.originalHtml > 0) {
        console.log(`HTML: ${formatBytes(config.stats.originalHtml)} → Inlined`);
      }
      if (config.stats.originalCss > 0) {
        console.log(`CSS: ${formatBytes(config.stats.originalCss)} → Inlined & Optimized`);
      }
      if (config.stats.originalJs > 0) {
        console.log(`JS: ${formatBytes(config.stats.originalJs)} → Inlined & Optimized`);
      }
    }
    
    console.log(chalk.green('\n✨ Single file bundle created successfully!\n'));
    console.log(chalk.gray(`You can now serve the single file: ${config.outputFile}`));
    console.log(chalk.gray('This bundle contains everything needed to run your application.\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Bundle creation failed:'), error.message);
    process.exit(1);
  }
}

// Run the bundler
createBundle();